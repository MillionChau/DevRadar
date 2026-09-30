using System.Diagnostics;

namespace GatewayService.Middleware;

/// <summary>
/// Ghi log console mỗi request đi qua gateway: method, đường dẫn, mã trạng thái
/// phản hồi, thời gian xử lý (ms), định danh người gọi và trace id.
///
/// Đặt ĐẦU pipeline (trước CORS/rate-limiter/proxy) để bắt cả các request bị
/// chặn sớm — ví dụ 429 do rate limit — chứ không chỉ request proxied thành công.
///
/// Mức log theo kết quả:
///   - >= 500 : Error
///   - >= 400 : Warning
///   - còn lại: Information
/// Bỏ qua /health và /swagger* để không làm nhiễu console.
/// </summary>
public sealed class RequestLoggingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<RequestLoggingMiddleware> _logger;

    public RequestLoggingMiddleware(RequestDelegate next, ILogger<RequestLoggingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Đường dẫn nội bộ của gateway — không log để tránh nhiễu
        if (IsSkipped(context.Request.Path))
        {
            await _next(context);
            return;
        }

        var start = Stopwatch.GetTimestamp();
        var caller = DescribeCaller(context);

        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            // Exception chưa được xử lý: log như 500 rồi ném tiếp cho handler mặc định
            var elapsedMs = Stopwatch.GetElapsedTime(start).TotalMilliseconds;
            _logger.LogError(ex,
                "[gateway] {Method} {Path} -> 500 ({Elapsed:F1} ms) {Caller} trace={TraceId} UNHANDLED_EXCEPTION",
                context.Request.Method,
                context.Request.Path,
                elapsedMs,
                caller,
                GetTraceId(context));
            throw;
        }

        var elapsed = Stopwatch.GetElapsedTime(start).TotalMilliseconds;
        var statusCode = context.Response.StatusCode;

        var message =
            $"[gateway] {context.Request.Method} {context.Request.Path}{context.Request.QueryString} -> " +
            $"{statusCode} ({elapsed:F1} ms) {caller} trace={GetTraceId(context)}";

        if (statusCode >= 500)
        {
            _logger.LogError("{Message}", message);
        }
        else if (statusCode >= 400)
        {
            _logger.LogWarning("{Message}", message);
        }
        else
        {
            _logger.LogInformation("{Message}", message);
        }
    }

    private static bool IsSkipped(PathString path)
    {
        var value = path.Value ?? string.Empty;
        return value.Equals("/health", StringComparison.OrdinalIgnoreCase)
            || value.StartsWith("/swagger", StringComparison.OrdinalIgnoreCase);
    }

    /// <summary>Ai đang gọi: ưu tiên Bearer token (cắt gọn), fallback về IP cho guest.</summary>
    private static string DescribeCaller(HttpContext context)
    {
        var auth = context.Request.Headers.Authorization.ToString();
        if (!string.IsNullOrEmpty(auth))
        {
            // "Bearer eyJhbGciOi..." -> lấy 12 ký tự cuối payload làm dấu vết ngắn
            var fingerprint = auth.Length <= 12 ? auth : auth[^12..];
            return $"bearer=…{fingerprint}";
        }

        var ip = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        return $"ip={ip}";
    }

    private static string GetTraceId(HttpContext context)
        => Activity.Current?.Id ?? context.TraceIdentifier;
}
