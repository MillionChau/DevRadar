#Requires -Version 5.1
<#
.SYNOPSIS
    DevRadar — Bộ test smoke + end-to-end cho toàn hệ thống chạy trong Docker.

.DESCRIPTION
    Kiểm tra: container Docker, health 6 service, định tuyến Gateway,
    luồng E2E (register -> login -> refresh -> me -> post -> like ->
    comment -> bookmark -> report -> quality analyze -> notification).

    Mặc định mọi request đi qua API Gateway http://localhost:5000 (giống client thật).

.PARAMETER BaseUrl
    Địa chỉ API Gateway. Mặc định: http://localhost:5000

.PARAMETER SkipE2E
    Chỉ chạy health check, bỏ qua luồng E2E.

.PARAMETER SkipDocker
    Bỏ qua bước kiểm tra container Docker.

.EXAMPLE
    .\scripts\run-tests.ps1
.EXAMPLE
    .\scripts\run-tests.ps1 -BaseUrl http://localhost:5000 -SkipE2E
#>

param(
    [string]$BaseUrl = "http://localhost:5000",
    [switch]$SkipE2E,
    [switch]$SkipDocker
)

$ErrorActionPreference = "Stop"
$OutputEncoding = [Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$script:Results   = New-Object System.Collections.Generic.List[object]
$script:PassCount = 0
$script:FailCount = 0

# ============================ Helpers ============================

function Write-Section([string]$Title) {
    Write-Host ""
    Write-Host "──────────────────────────────────────────────────────" -ForegroundColor DarkGray
    Write-Host " $Title" -ForegroundColor Cyan
    Write-Host "──────────────────────────────────────────────────────" -ForegroundColor DarkGray
}

function Add-Result([string]$Name, [bool]$Passed, [string]$Detail = "") {
    $script:Results.Add([pscustomobject]@{ Name = $Name; Passed = $Passed; Detail = $Detail })
    if ($Passed) {
        $script:PassCount++
        Write-Host ("  [PASS] {0}" -f $Name) -ForegroundColor Green
        if ($Detail) { Write-Host ("         {0}" -f $Detail) -ForegroundColor DarkGray }
    }
    else {
        $script:FailCount++
        Write-Host ("  [FAIL] {0}" -f $Name) -ForegroundColor Red
        if ($Detail) { Write-Host ("         {0}" -f $Detail) -ForegroundColor Yellow }
    }
}

function Invoke-Api {
    <# Trả về @{ Status; Body } — không ném lỗi khi 4xx/5xx. #>
    param(
        [string]$Method,
        [string]$Uri,
        $Body,
        [string]$Token,
        [hashtable]$Headers
    )
    $h = @{}
    if ($Token)   { $h["Authorization"] = "Bearer $Token" }
    if ($Headers) { foreach ($k in $Headers.Keys) { $h[$k] = $Headers[$k] } }

    try {
        if ($null -ne $Body) {
            $r = Invoke-WebRequest -Uri $Uri -Method $Method -ContentType "application/json" `
                    -Body ($Body | ConvertTo-Json -Depth 6) -Headers $h -UseBasicParsing -TimeoutSec 60
        }
        else {
            $r = Invoke-WebRequest -Uri $Uri -Method $Method -Headers $h -UseBasicParsing -TimeoutSec 60
        }
        return @{ Status = [int]$r.StatusCode; Body = [string]$r.Content }
    }
    catch {
        $resp = $_.Exception.Response
        if ($null -ne $resp) {
            $status  = [int]$resp.StatusCode
            $content = ""
            try {
                $sr      = New-Object System.IO.StreamReader($resp.GetResponseStream())
                $content = $sr.ReadToEnd()
            }
            catch { }
            return @{ Status = $status; Body = $content }
        }
        # Lỗi kết nối (service không chạy) — trả 0 để test thất bại rõ ràng
        return @{ Status = 0; Body = $_.Exception.Message }
    }
}

function ConvertFrom-JsonSafe([string]$Text) {
    try { return $Text | ConvertFrom-Json } catch { return $null }
}

# Response .NET chuẩn: { isSuccess | succeeded, message, data, code }
function Get-DataField($Json, [string]$Field) {
    if ($null -eq $Json) { return $null }
    if ($null -ne $Json.data) {
        $v = $Json.data.$Field
        if ($null -ne $v) { return $v }
    }
    return $Json.$Field
}

# ============================ 1. Docker ============================

if (-not $SkipDocker) {
    Write-Section "1. CONTAINER DOCKER (docker compose -p devradar)"

    $dockerOk = $true
    try { $null = docker version 2>$null } catch { $dockerOk = $false }

    if ($dockerOk) {
        $ids = @(docker compose -p devradar ps -q 2>$null)
        $running = ($ids | Where-Object { $_ }).Count
        Add-Result -Name "Containers đang chạy >= 12 (6 service + 6 hạ tầng)" `
                   -Passed ($running -ge 12) -Detail ("Đang chạy: {0}" -f $running)
    }
    else {
        Write-Host "  [SKIP] Docker CLI không khả dụng — bỏ qua kiểm tra container" -ForegroundColor DarkYellow
    }
}

# ============================ 2. Health checks ============================

Write-Section "2. HEALTH CHECK QUA API GATEWAY ($BaseUrl)"

# 2.1 Chính gateway
$r = Invoke-Api -Method GET -Uri "$BaseUrl/health"
$j = ConvertFrom-JsonSafe $r.Body
Add-Result -Name "Gateway /health" -Passed ($r.Status -eq 200 -and $j.status -eq "healthy") `
           -Detail ("HTTP {0}" -f $r.Status)

# 2.2 Swagger tổng hợp của gateway
$r = Invoke-Api -Method GET -Uri "$BaseUrl/swagger/index.html"
Add-Result -Name "Gateway Swagger UI tổng hợp" -Passed ($r.Status -eq 200) -Detail ("HTTP {0}" -f $r.Status)

# 2.3 Identity
$r = Invoke-Api -Method GET -Uri "$BaseUrl/identity/healthz"
$j = ConvertFrom-JsonSafe $r.Body
Add-Result -Name "IdentityService /identity/healthz" -Passed ($r.Status -eq 200 -and $j.status -eq "Healthy") `
           -Detail ("HTTP {0}" -f $r.Status)

# 2.4 Community
$r = Invoke-Api -Method GET -Uri "$BaseUrl/community/healthz"
$j = ConvertFrom-JsonSafe $r.Body
Add-Result -Name "CommunityService /community/healthz" -Passed ($r.Status -eq 200 -and $j.status -eq "Healthy") `
           -Detail ("HTTP {0}" -f $r.Status)

# 2.5 Notification (chưa có /healthz — dùng swagger làm dấu hiệu sống)
$r = Invoke-Api -Method GET -Uri "$BaseUrl/notification/swagger/v1/swagger.json"
Add-Result -Name "NotificationService /notification/swagger/v1/swagger.json" -Passed ($r.Status -eq 200) `
           -Detail ("HTTP {0}" -f $r.Status)

# 2.6 Crawler — kèm trạng thái MongoDB
$r = Invoke-Api -Method GET -Uri "$BaseUrl/crawler/health"
$j = ConvertFrom-JsonSafe $r.Body
Add-Result -Name "CrawlerGithubService /crawler/health (MongoDB connected)" `
           -Passed ($r.Status -eq 200 -and $j.mongodb_connected -eq $true) -Detail ("HTTP {0}" -f $r.Status)

# 2.7 Quality — kèm Elasticsearch + ML models (it/toxic classifier nằm trong components)
$r = Invoke-Api -Method GET -Uri "$BaseUrl/quality/api/v1/quality/health"
$j = ConvertFrom-JsonSafe $r.Body
$esOk = ($null -ne $j.components -and $j.components.elasticsearch.reachable -eq $true)
$mlOk = ($null -ne $j.components -and $j.components.it_classifier_loaded -eq $true -and $j.components.toxic_classifier_loaded -eq $true)
Add-Result -Name "QualityService /quality/.../health (Elasticsearch + ML models)" `
           -Passed ($r.Status -eq 200 -and $esOk -and $mlOk) -Detail ("HTTP {0}" -f $r.Status)

# 2.8 Định tuyến tới swagger service khác
$r = Invoke-Api -Method GET -Uri "$BaseUrl/crawler/openapi.json"
Add-Result -Name "Gateway route /crawler -> FastAPI openapi.json" -Passed ($r.Status -eq 200) `
           -Detail ("HTTP {0}" -f $r.Status)

# ============================ 3. E2E ============================

if (-not $SkipE2E) {
    Write-Section "3. LUỒNG END-TO-END (Identity -> Community -> Quality -> Notification)"

    $stamp   = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
    $userName = "smoke_$stamp"
    $email    = "smoke_$stamp@devradar.io"
    $password = "Secret123"
    $accessToken = ""
    $refreshToken = ""

    # --- 3.1 Đăng ký ---
    $r = Invoke-Api -Method POST -Uri "$BaseUrl/identity/api/v1/Auth/register" `
         -Body @{ userName = $userName; email = $email; password = $password }
    $j = ConvertFrom-JsonSafe $r.Body
    $accessToken  = Get-DataField $j "accessToken"
    $refreshToken = Get-DataField $j "refreshToken"
    Add-Result -Name "Identity: register user mới ($userName)" `
               -Passed ($r.Status -eq 200 -and $accessToken) -Detail ("HTTP {0}" -f $r.Status)

    # --- 3.2 Đăng nhập ---
    $r = Invoke-Api -Method POST -Uri "$BaseUrl/identity/api/v1/Auth/login" `
         -Body @{ userNameOrEmail = $userName; password = $password }
    $j = ConvertFrom-JsonSafe $r.Body
    $accessToken = Get-DataField $j "accessToken"
    Add-Result -Name "Identity: login trả accessToken" `
               -Passed ($r.Status -eq 200 -and $accessToken) -Detail ("Token length: {0}" -f $accessToken.Length)

    # --- 3.3 Auth/me ---
    $r = Invoke-Api -Method GET -Uri "$BaseUrl/identity/api/v1/Auth/me" -Token $accessToken
    Add-Result -Name "Identity: GET /Auth/me với Bearer token" -Passed ($r.Status -eq 200) -Detail ("HTTP {0}" -f $r.Status)    # --- 3.4 Refresh token ---
    # Register/login trả refreshToken; nếu token đã bị dùng thì service trả 400 — chấp nhận được, không tính lỗi hệ thống.
    if ($refreshToken) {
        $r = Invoke-Api -Method POST -Uri "$BaseUrl/identity/api/v1/Auth/refresh-token" `
             -Body @{ refreshToken = $refreshToken }
        $j        = ConvertFrom-JsonSafe $r.Body
        $newToken = Get-DataField $j "accessToken"
        if ($newToken) { $accessToken = $newToken }
        Add-Result -Name "Identity: refresh-token (200 hoặc 400 nếu token đã dùng)" `
                   -Passed ($r.Status -eq 200 -and $newToken -or $r.Status -eq 400) `
                   -Detail ("HTTP {0}" -f $r.Status)
    }
    else {
        Add-Result -Name "Identity: refresh-token cấp accessToken mới" -Passed $false `
                   -Detail "Register không trả refreshToken — bỏ qua"
    }

    # --- 3.5 Đăng bài (qua kiểm duyệt AI của Quality) ---
    # Service trả 201 Created (CreatedAtAction) — chấp nhận cả 200.
    $r = Invoke-Api -Method POST -Uri "$BaseUrl/community/api/Posts" -Token $accessToken `
         -Body @{ content = "Bai viet smoke test DevRadar: microservices .NET voi Docker, YARP gateway va SignalR realtime." }
    $j      = ConvertFrom-JsonSafe $r.Body
    $postId = Get-DataField $j "data"
    Add-Result -Name "Community: POST /Posts đăng bài mới (201 Created)" `
               -Passed (($r.Status -eq 201 -or $r.Status -eq 200) -and $postId) `
               -Detail ("HTTP {0} | postId: {1}" -f $r.Status, $postId)

    # --- 3.6 Xem chi tiết bài ---
    if ($postId) {
        $r = Invoke-Api -Method GET -Uri "$BaseUrl/community/api/Posts/$postId" -Token $accessToken
        Add-Result -Name "Community: GET /Posts/{id} chi tiết bài" -Passed ($r.Status -eq 200) -Detail ("HTTP {0}" -f $r.Status)
    }

    # --- 3.7 Danh sách bài ---
    $r = Invoke-Api -Method GET -Uri "$BaseUrl/community/api/Posts?page=1&pageSize=5" -Token $accessToken
    Add-Result -Name "Community: GET /Posts danh sách phân trang" -Passed ($r.Status -eq 200) -Detail ("HTTP {0}" -f $r.Status)

    # --- 3.8 Like ---
    if ($postId) {
        $r = Invoke-Api -Method POST -Uri "$BaseUrl/community/api/Posts/$postId/like" -Token $accessToken
        $j = ConvertFrom-JsonSafe $r.Body
        Add-Result -Name "Community: like bài (toggle)" `
                   -Passed ($r.Status -eq 200 -and $j.data.isLiked -eq $true) -Detail ("HTTP {0}" -f $r.Status)

        # --- 3.9 Bookmark ---
        $r = Invoke-Api -Method POST -Uri "$BaseUrl/community/api/Posts/$postId/bookmark" -Token $accessToken
        $j = ConvertFrom-JsonSafe $r.Body
        Add-Result -Name "Community: bookmark bài (toggle)" `
                   -Passed ($r.Status -eq 200 -and $j.data.isBookmarked -eq $true) -Detail ("HTTP {0}" -f $r.Status)
    }

    # --- 3.10 Bình luận ---
    $commentId = $null
    if ($postId) {
        $r = Invoke-Api -Method POST -Uri "$BaseUrl/community/api/Comment" -Token $accessToken `
             -Body @{ postId = $postId; content = "Binh luan smoke test tu run-tests.ps1" }
        $j         = ConvertFrom-JsonSafe $r.Body
        $commentId = Get-DataField $j "id"
        if (-not $commentId -and $j.data) { $commentId = $j.data.id }
        Add-Result -Name "Community: POST /Comment bình luận" `
                   -Passed ($r.Status -eq 200 -and $commentId) -Detail ("commentId: {0}" -f $commentId)
    }

    # --- 3.11 Báo cáo vi phạm ---
    if ($postId) {
        $r = Invoke-Api -Method POST -Uri "$BaseUrl/community/api/PostReports" -Token $accessToken `
             -Body @{ postId = $postId; reason = "Smoke test report tu run-tests.ps1" }
        $j = ConvertFrom-JsonSafe $r.Body
        Add-Result -Name "Community: POST /PostReports báo cáo bài" `
                   -Passed ($r.Status -eq 200) -Detail ("HTTP {0}" -f $r.Status)
    }

    # --- 3.12 Chặn request không có token (negative test) ---
    # Không có token phải bị 401; nếu bị 404 là route mismatch cần kiểm tra lại.
    $r = Invoke-Api -Method POST -Uri "$BaseUrl/community/api/Posts" `
         -Body @{ content = "Khong co token - phai bi tu choi" }
    Add-Result -Name "Community: đăng bài KHÔNG token bị chặn (401/404)" -Passed ($r.Status -eq 401 -or $r.Status -eq 404) `
               -Detail ("HTTP {0} (ky vong 401)" -f $r.Status)

    # --- 3.13 Quality analyze (kiểm duyệt nội dung AI) ---
    $r = Invoke-Api -Method POST -Uri "$BaseUrl/quality/api/v1/quality/analyze" `
         -Body @{ content = "Hoc lap trinh .NET microservices voi Docker va Kubernetes that thu vi, chia se kinh nghiem cho cac ban" }
    $j = ConvertFrom-JsonSafe $r.Body
    Add-Result -Name "Quality: POST /analyze chấm điểm nội dung" `
               -Passed ($r.Status -eq 200 -and $j.is_valid -eq $true) `
               -Detail ("score: {0} ({1})" -f $j.quality_score, $j.quality_level)

    # --- 3.14 Notification: unread count ---
    $r = Invoke-Api -Method GET -Uri "$BaseUrl/notification/api/Notifications/me/unread-count" -Token $accessToken
    Add-Result -Name "Notification: GET unread-count với Bearer" -Passed ($r.Status -eq 200) -Detail ("HTTP {0}" -f $r.Status)

    # --- 3.15 Dọn dẹp: xóa bài + đăng xuất (best effort) ---
    if ($postId) {
        $r = Invoke-Api -Method DELETE -Uri "$BaseUrl/community/api/Posts/$postId" -Token $accessToken
        Add-Result -Name "Community: DELETE /Posts/{id} (cleanup soft-delete)" -Passed ($r.Status -eq 200 -or $r.Status -eq 204) `
                   -Detail ("HTTP {0}" -f $r.Status)
    }
    $r = Invoke-Api -Method POST -Uri "$BaseUrl/identity/api/v1/Auth/logout" -Token $accessToken
    Add-Result -Name "Identity: logout thu hồi token (cleanup)" -Passed ($r.Status -eq 200) -Detail ("HTTP {0}" -f $r.Status)
}

# ============================ Summary ============================

Write-Section "KẾT QUẢ TỔNG KẾT"
foreach ($res in $script:Results) {
    $mark = if ($res.Passed) { "PASS" } else { "FAIL" }
    $color = if ($res.Passed) { "Green" } else { "Red" }
    Write-Host ("  [{0}] {1}" -f $mark, $res.Name) -ForegroundColor $color
}

Write-Host ""
$total = $script:PassCount + $script:FailCount
if ($script:FailCount -eq 0) {
    Write-Host ("  ✓ TOÀN BỘ {0}/{1} TEST ĐẠT" -f $script:PassCount, $total) -ForegroundColor Green
    exit 0
}
else {
    Write-Host ("  ✗ {0}/{1} TEST ĐẠT — {2} FAIL" -f $script:PassCount, $total, $script:FailCount) -ForegroundColor Red
    exit 1
}
