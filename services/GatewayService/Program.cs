using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;
using Yarp.ReverseProxy.Transforms;

var builder = WebApplication.CreateBuilder(args);

// ===== YARP Reverse Proxy =====
builder.Configuration.AddJsonFile("yarp.json", optional: false, reloadOnChange: true);
// Cho phép ghi đè địa chỉ cluster bằng biến môi trường khi deploy Docker
// (ReverseProxy__Clusters__identity-cluster__Destinations__destination1__Address=...)
builder.Configuration.AddEnvironmentVariables();

builder.Services.AddReverseProxy()
    .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"));

// ===== Rate Limiting (300 req/phút mỗi user hoặc IP) =====
builder.Services.AddRateLimiter(options =>
{
    // Phân vùng theo Bearer token (định danh phiên), fallback về IP cho guest.
    // Gateway đứng sau proxy nên IP không tin cậy — token là khóa ổn định nhất.
    options.AddPolicy("global-rate-limit", context =>
    {
        var authHeader = context.Request.Headers.Authorization.ToString();
        var key = string.IsNullOrEmpty(authHeader)
            ? $"ip:{context.Connection.RemoteIpAddress?.ToString() ?? "unknown"}"
            : $"token:{authHeader}";

        return RateLimitPartition.GetFixedWindowLimiter(key, _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 300,
            Window = TimeSpan.FromMinutes(1),
            QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
            QueueLimit = 0
        });
    });

    // Crawler: job kéo dữ liệu nặng — giới hạn nhẹ hơn cho client ngoài
    options.AddPolicy("crawler-rate-limit", context =>
    {
        var authHeader = context.Request.Headers.Authorization.ToString();
        var key = string.IsNullOrEmpty(authHeader)
            ? $"ip:{context.Connection.RemoteIpAddress?.ToString() ?? "unknown"}"
            : $"token:{authHeader}";

        return RateLimitPartition.GetFixedWindowLimiter(key, _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 60,
            Window = TimeSpan.FromMinutes(1),
            QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
            QueueLimit = 0
        });
    });

    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
});

// ===== CORS cho frontend dev =====
builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy => policy
        .WithOrigins("http://localhost:3000", "http://localhost:5173")
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials());
});

// ===== Controllers (cho health endpoint của chính gateway) =====
builder.Services.AddControllers();

var app = builder.Build();

// ===== Request logging: đặt ĐẦU pipeline để bắt cả request bị chặn sớm (429...) =====
app.UseMiddleware<GatewayService.Middleware.RequestLoggingMiddleware>();

// Cân bằng cho frontend SPA
app.UseCors("Frontend");

// Rate limiter phải chạy trước proxy
app.UseRateLimiter();

// WebSocket cho SignalR hub xuyên qua gateway (phải trước MapReverseProxy)
app.UseWebSockets();

// ===== Health endpoint của chính gateway =====
app.MapGet("/health", () => Results.Ok(new
{
    status = "healthy",
    service = "DevRadar API Gateway",
    timestamp = DateTime.UtcNow
}));

// ===== Swagger UI tổng hợp tài liệu 5 service =====
// Mỗi mục trỏ tới swagger.json / openapi.json của service lấy NGAY QUA route YARP
// (gateway không tự sinh tài liệu — nó chỉ gộp và hiển thị).
app.UseSwaggerUI(options =>
{
    options.RoutePrefix = "swagger";
    options.DocumentTitle = "DevRadar API Gateway";
    options.ConfigObject.Urls = new[]
    {
        new Swashbuckle.AspNetCore.SwaggerUI.UrlDescriptor
        {
            Name = "Identity — người dùng, xác thực, phân quyền",
            Url = "/identity/swagger/v1/swagger.json"
        },
        new Swashbuckle.AspNetCore.SwaggerUI.UrlDescriptor
        {
            Name = "Community — bài viết, bình luận, báo cáo",
            Url = "/community/swagger/v1/swagger.json"
        },
        new Swashbuckle.AspNetCore.SwaggerUI.UrlDescriptor
        {
            Name = "Notification — thông báo realtime",
            Url = "/notification/swagger/v1/swagger.json"
        },
        new Swashbuckle.AspNetCore.SwaggerUI.UrlDescriptor
        {
            Name = "Crawler — thu thập dữ liệu GitHub",
            Url = "/crawler/openapi.json"
        },
        new Swashbuckle.AspNetCore.SwaggerUI.UrlDescriptor
        {
            Name = "Quality — kiểm duyệt nội dung AI",
            Url = "/quality/openapi.json"
        }
    };
});

app.MapControllers();

// ===== Map YARP — phải cuối cùng =====
app.MapReverseProxy();

app.Run();
