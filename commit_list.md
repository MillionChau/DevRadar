# DANH SÁCH COMMIT CHO CÁC THAY ĐỔI CHƯA COMMIT (UNCOMMITTED CHANGES) - DEVRADAR

> **Mục đích**: Tài liệu này phân loại toàn bộ các file thay đổi (`modified`, `deleted`) và các file mới chưa được theo dõi (`untracked files`) trên toàn bộ hệ thống DevRadar thành các **Atomic Commits** theo chuẩn **Conventional Commits** (`feat`, `fix`, `chore`, `test`, `docs`).
> 
> Các đường dẫn bên dưới đã được chuẩn hóa chính xác 100% theo cấu trúc thư mục thực tế của từng Repository/Submodule.

---

## 📋 TASKLIST THEO DÕI TIẾN ĐỘ COMMIT

Bạn có thể đánh dấu `[x]` vào các ô bên dưới sau khi thực hiện xong từng commit:

### I. IdentityService (`services/IdentityService`)
- [ ] **Commit 01** `feat(auth)`: Triển khai quy trình quên mật khẩu và đặt lại mật khẩu
- [ ] **Commit 02** `feat(user)`: Thêm chức năng quản trị khóa và mở khóa tài khoản
- [ ] **Commit 03** `chore(db)`: Thêm migration EF Core cho trạng thái khóa tài khoản
- [ ] **Commit 04** `feat(middleware)`: Thêm middleware ghi log request HTTP có cấu trúc
- [ ] **Commit 05** `chore(deploy)`: Cập nhật Dockerfile, .dockerignore và Program.cs
- [ ] **Commit 06** `docs(api)`: Bổ sung Postman collection và tài liệu kiểm thử API

### II. CommunityService (`services/CommunityService`)
- [ ] **Commit 07** `feat(comment)`: Thêm lệnh cập nhật bình luận và kiểm tra quyền sở hữu
- [ ] **Commit 08** `feat(post)`: Triển khai chức năng ghim và bỏ ghim bài viết cho kiểm duyệt viên
- [ ] **Commit 09** `feat(leaderboard)`: Thêm API và truy vấn tính điểm bảng xếp hạng cộng đồng
- [ ] **Commit 10** `feat(moderation)`: Tích hợp client kiểm duyệt nội dung HTTP và xử lý báo cáo vi phạm
- [ ] **Commit 11** `feat(notification)`: Tích hợp client HTTP bắn thông báo nội bộ
- [ ] **Commit 12** `feat(middleware)`: Đăng ký request logging middleware và cấu hình DI / appsettings
- [ ] **Commit 13** `test(community)`: Thêm bộ kiểm thử tự động Unit Tests và Integration Tests
- [ ] **Commit 14** `chore(project)`: Dọn dẹp tệp cấu hình solution, docker-compose và .gitignore

### III. CrawlerGithubService (`services/CrawlerGithubService`)
- [ ] **Commit 15** `feat(logging)`: Triển khai middleware ghi log HTTP chuẩn hóa và logging core
- [ ] **Commit 16** `feat(crawler)`: Thêm crawler đa cấp (multi-level) và endpoint crawl tức thì
- [ ] **Commit 17** `chore(tools)`: Thêm script chẩn đoán MongoDB và kiểm thử repo updater

### IV. QualityService (`services/QualityService`)
- [ ] **Commit 18** `feat(ai)`: Tích hợp module trợ lý AI đánh giá chuyên sâu chất lượng code
- [ ] **Commit 19** `feat(logging)`: Thêm middleware theo dõi request và định dạng log JSON
- [ ] **Commit 20** `chore(tools)`: Thêm tập dữ liệu đánh giá và script thanh tra phân tích

### V. Root Workspace (`DevRadar`)
- [ ] **Commit 21** `chore(repo)`: Cập nhật submodule pointers, tài liệu kiến trúc SRS/SDD và tooling

---

## 🛠️ CHI TIẾT CÁC COMMIT, FILE & LỆNH THỰC HIỆN

---

### PHẦN I: `services/IdentityService`
*Đường dẫn tương đối tính từ thư mục gốc của submodule:* `services/IdentityService/`

#### - [x] Commit 01: Quên & Đặt lại mật khẩu
- **Loại**: `feat`
- **Thông điệp**: `feat(auth): implement forgot password and reset password flows`
- **Danh sách file**:
  - `src/Identity.Application/Features/Auth/Commands/ForgotPassword/`
  - `src/Identity.Application/Features/Auth/Commands/ResetPassword/`
  - `src/Identity.API/Controllers/AuthController.cs`
- **Lệnh thực hiện**:
```bash
cd services/IdentityService
git add src/Identity.Application/Features/Auth/Commands/ForgotPassword/
git add src/Identity.Application/Features/Auth/Commands/ResetPassword/
git add src/Identity.API/Controllers/AuthController.cs
git commit -m "feat(auth): implement forgot password and reset password flows"
```

---

#### - [x] Commit 02: Quản trị Khóa / Mở khóa người dùng
- **Loại**: `feat`
- **Thông điệp**: `feat(user): add admin lock and unlock user account management`
- **Danh sách file**:
  - `src/Identity.Application/Features/Users/Commands/LockUser/`
  - `src/Identity.Application/Features/Users/Commands/UnlockUser/`
  - `src/Identity.API/Controllers/UsersController.cs`
- **Lệnh thực hiện**:
```bash
git add src/Identity.Application/Features/Users/Commands/LockUser/
git add src/Identity.Application/Features/Users/Commands/UnlockUser/
git add src/Identity.API/Controllers/UsersController.cs
git commit -m "feat(user): add admin lock and unlock user account management"
```

---

#### - [ ] Commit 03: EF Core Migrations cho tài khoản bị khóa
- **Loại**: `chore`
- **Thông điệp**: `chore(db): add entity framework migration for user lock state`
- **Danh sách file**:
  - `src/Identity.Infrastructure/Migrations/`
- **Lệnh thực hiện**:
```bash
git add src/Identity.Infrastructure/Migrations/
git commit -m "chore(db): add entity framework migration for user lock state"
```

---

#### - [ ] Commit 04: Request Logging Middleware
- **Loại**: `feat`
- **Thông điệp**: `feat(middleware): add request logging middleware for structured tracing`
- **Danh sách file**:
  - `src/Identity.API/Middleware/RequestLoggingMiddleware.cs`
- **Lệnh thực hiện**:
```bash
git add src/Identity.API/Middleware/RequestLoggingMiddleware.cs
git commit -m "feat(middleware): add request logging middleware for structured tracing"
```

---

#### - [ ] Commit 05: Dockerfile & Cấu hình Runtime Program.cs
- **Loại**: `chore`
- **Thông điệp**: `chore(deploy): update dockerfile, dockerignore and program entrypoint`
- **Danh sách file**:
  - `Dockerfile`
  - `.dockerignore`
  - `src/Identity.API/.dockerignore`
  - `src/Identity.API/Dockerfile` *(file xóa)*
  - `src/Identity.API/Program.cs`
- **Lệnh thực hiện**:
```bash
git add Dockerfile .dockerignore src/Identity.API/.dockerignore
git add src/Identity.API/Dockerfile
git add src/Identity.API/Program.cs
git commit -m "chore(deploy): update dockerfile, dockerignore and program entrypoint"
```

---

#### - [ ] Commit 06: Postman Collection & Hướng dẫn kiểm thử
- **Loại**: `docs`
- **Thông điệp**: `docs(api): add postman collection and api testing guide`
- **Danh sách file**:
  - `DevRadar_Identity.postman_collection.json`
  - `TestAPI.md`
- **Lệnh thực hiện**:
```bash
git add DevRadar_Identity.postman_collection.json TestAPI.md
git commit -m "docs(api): add postman collection and api testing guide"
```

---

### PHẦN II: `services/CommunityService`
*Đường dẫn tương đối tính từ thư mục gốc của submodule:* `services/CommunityService/`

#### - [x] Commit 07: Chỉnh sửa bình luận với kiểm tra quyền
- **Loại**: `feat`
- **Thông điệp**: `feat(comment): add update comment command with ownership validation`
- **Danh sách file**:
  - `src/Community.Application/Features/Comments/Commands/UpdateComment/`
  - `src/Community.Domain/Contracts/ICommentRepository.cs`
  - `src/Community.API/Controllers/CommentController.cs`
- **Lệnh thực hiện**:
```bash
cd ../CommunityService
git add src/Community.Application/Features/Comments/Commands/UpdateComment/
git add src/Community.Domain/Contracts/ICommentRepository.cs
git add src/Community.API/Controllers/CommentController.cs
git commit -m "feat(comment): add update comment command with ownership validation"
```

---

#### - [x] Commit 08: Ghim & Bỏ ghim bài viết
- **Loại**: `feat`
- **Thông điệp**: `feat(post): implement pin and unpin post commands for moderators`
- **Danh sách file**:
  - `src/Community.Application/Features/Posts/Commands/PinPost/`
  - `src/Community.API/Controllers/PostsController.cs`
- **Lệnh thực hiện**:
```bash
git add src/Community.Application/Features/Posts/Commands/PinPost/
git add src/Community.API/Controllers/PostsController.cs
git commit -m "feat(post): implement pin and unpin post commands for moderators"
```

---

#### - [ ] Commit 09: Bảng xếp hạng và tính điểm đóng góp
- **Loại**: `feat`
- **Thông điệp**: `feat(leaderboard): introduce leaderboard endpoints and point ranking queries`
- **Danh sách file**:
  - `src/Community.Application/DTOs/Leaderboard/`
  - `src/Community.Application/Features/Leaderboard/`
  - `src/Community.API/Controllers/LeaderboardController.cs`
- **Lệnh thực hiện**:
```bash
git add src/Community.Application/DTOs/Leaderboard/
git add src/Community.Application/Features/Leaderboard/
git add src/Community.API/Controllers/LeaderboardController.cs
git commit -m "feat(leaderboard): introduce leaderboard endpoints and point ranking queries"
```

---

#### - [ ] Commit 10: Kiểm duyệt nội dung tự động & Xử lý báo cáo
- **Loại**: `feat`
- **Thông điệp**: `feat(moderation): add http content moderation client and report handling`
- **Danh sách file**:
  - `src/Community.Infrastructure/Services/HttpContentModerationService.cs`
  - `src/Community.Domain/Contracts/IPostReportRepository.cs`
  - `src/Community.Application/Features/PostReport/Commands/CreatePostReport/CreatePostReport.cs`
  - `src/Community.Application/Features/PostReport/Commands/ReviewPostReport/ReviewPostReport.cs`
- **Lệnh thực hiện**:
```bash
git add src/Community.Infrastructure/Services/HttpContentModerationService.cs
git add src/Community.Domain/Contracts/IPostReportRepository.cs
git add src/Community.Application/Features/PostReport/Commands/
git commit -m "feat(moderation): add http content moderation client and report handling"
```

---

#### - [ ] Commit 11: Tích hợp thông báo qua HTTP nội bộ
- **Loại**: `feat`
- **Thông điệp**: `feat(notification): integrate internal http notification client`
- **Danh sách file**:
  - `src/Community.Infrastructure/Services/NotificationHttpClient.cs`
  - `src/Community.Application/Interfaces/INotificationClient.cs`
  - `src/Community.Application/Features/Posts/Commands/TogglePostLike/TogglePostLikeCommand.cs`
  - `src/Community.Application/Features/Posts/Commands/SharePost/SharePostCommand.cs`
  - `src/Community.Application/Features/Comments/Commands/CreateComment/CreateCommentCommand.cs`
  - `src/Community.Application/Features/Comments/Commands/ToggleCommentLike/ToggleCommentLikeCommand.cs`
- **Lệnh thực hiện**:
```bash
git add src/Community.Infrastructure/Services/NotificationHttpClient.cs
git add src/Community.Application/Interfaces/INotificationClient.cs
git add src/Community.Application/Features/Posts/Commands/TogglePostLike/
git add src/Community.Application/Features/Posts/Commands/SharePost/
git add src/Community.Application/Features/Comments/Commands/CreateComment/
git add src/Community.Application/Features/Comments/Commands/ToggleCommentLike/
git commit -m "feat(notification): integrate internal http notification client"
```

---

#### - [ ] Commit 12: Request Logging Middleware & DI Container
- **Loại**: `feat`
- **Thông điệp**: `feat(middleware): register request logging middleware and dependency injection`
- **Danh sách file**:
  - `src/Community.API/Middleware/RequestLoggingMiddleware.cs`
  - `src/Community.Infrastructure/DependencyInjection.cs`
  - `src/Community.API/Program.cs`
  - `src/Community.API/appsettings.json`
- **Lệnh thực hiện**:
```bash
git add src/Community.API/Middleware/RequestLoggingMiddleware.cs
git add src/Community.Infrastructure/DependencyInjection.cs
git add src/Community.API/Program.cs
git add src/Community.API/appsettings.json
git commit -m "feat(middleware): register request logging middleware and dependency injection"
```

---

#### - [ ] Commit 13: Unit Tests và Integration Tests
- **Loại**: `test`
- **Thông điệp**: `test(community): add comprehensive unit and integration test suites`
- **Danh sách file**:
  - `tests/`
- **Lệnh thực hiện**:
```bash
git add tests/
git commit -m "test(community): add comprehensive unit and integration test suites"
```

---

#### - [ ] Commit 14: Cấu hình Solution và Dọn dẹp compose
- **Loại**: `chore`
- **Thông điệp**: `chore(project): clean up solution configuration and obsolete docker compose`
- **Danh sách file**:
  - `.gitignore`
  - `.dockerignore`
  - `Community.slnx`
  - `docker-compose.yml` *(file xóa)*
- **Lệnh thực hiện**:
```bash
git add .gitignore .dockerignore Community.slnx docker-compose.yml
git commit -m "chore(project): clean up solution configuration and obsolete docker compose"
```

---

### PHẦN III: `services/CrawlerGithubService`
*Đường dẫn tương đối tính từ thư mục gốc của submodule:* `services/CrawlerGithubService/`

#### - [x] Commit 15: Middleware Logging và Cấu hình Container
- **Loại**: `feat`
- **Thông điệp**: `feat(logging): implement standardized request logging middleware and dockerfile`
- **Danh sách file**:
  - `app/core/logging.py`
  - `app/core/request_logging.py`
  - `app/main.py`
  - `Dockerfile`
  - `.dockerignore`
- **Lệnh thực hiện**:
```bash
cd ../CrawlerGithubService
git add app/core/logging.py app/core/request_logging.py app/main.py Dockerfile .dockerignore
git commit -m "feat(logging): implement standardized request logging middleware and dockerfile"
```

---

#### - [ ] Commit 16: Multi-level Crawler & Endpoint Instant Crawl
- **Loại**: `feat`
- **Thông điệp**: `feat(crawler): add multi-level crawl and instant crawl entrypoints`
- **Danh sách file**:
  - `app/api/analytics.py`
  - `run_instant_crawl.py`
  - `run_multi_level_crawler.py`
  - `run_demo_crawler.py`
  - `run_demo_models.py`
- **Lệnh thực hiện**:
```bash
git add app/api/analytics.py
git add run_instant_crawl.py run_multi_level_crawler.py run_demo_crawler.py run_demo_models.py
git commit -m "feat(crawler): add multi-level crawl and instant crawl entrypoints"
```

---

#### - [ ] Commit 17: Diagnostic Script & Tests Repo Updater
- **Loại**: `chore`
- **Thông điệp**: `chore(tools): add repository updater tests and mongo count diagnostic script`
- **Danh sách file**:
  - `check_mongo_count.py`
  - `tests/test_repo_updater.py`
- **Lệnh thực hiện**:
```bash
git add check_mongo_count.py tests/test_repo_updater.py
git commit -m "chore(tools): add repository updater tests and mongo count diagnostic script"
```

---

### PHẦN IV: `services/QualityService`
*Đường dẫn tương đối tính từ thư mục gốc của submodule:* `services/QualityService/`

#### - [ ] Commit 18: Trợ lý phân tích chất lượng AI
- **Loại**: `feat`
- **Thông điệp**: `feat(ai): integrate ai assistant module for deep code quality insights`
- **Danh sách file**:
  - `app/api/routes/ai_assistant.py`
  - `app/main.py`
- **Lệnh thực hiện**:
```bash
cd ../QualityService
git add app/api/routes/ai_assistant.py app/main.py
git commit -m "feat(ai): integrate ai assistant module for deep code quality insights"
```

---

#### - [ ] Commit 19: Request Tracing & Structured Logging
- **Loại**: `feat`
- **Thông điệp**: `feat(logging): implement request tracing and structured log formatters`
- **Danh sách file**:
  - `app/core/logging.py`
  - `app/core/request_logging.py`
  - `.dockerignore`
- **Lệnh thực hiện**:
```bash
git add app/core/logging.py app/core/request_logging.py .dockerignore
git commit -m "feat(logging): implement request tracing and structured log formatters"
```

---

#### - [ ] Commit 20: Dataset đánh giá & Công cụ thanh tra
- **Loại**: `chore`
- **Thông điệp**: `chore(tools): add evaluation dataset and quality analysis inspector scripts`
- **Danh sách file**:
  - `eval_dataset.py`
  - `inspect_analysis.py`
- **Lệnh thực hiện**:
```bash
git add eval_dataset.py inspect_analysis.py
git commit -m "chore(tools): add evaluation dataset and quality analysis inspector scripts"
```

---

### PHẦN V: `DevRadar` (Root Workspace)
*Đường dẫn tính từ thư mục gốc dự án:* `D:/Project/DevRadar/`

#### - [ ] Commit 21: Cập nhật Submodules, SRS/SDD & Tài liệu dự án
- **Loại**: `chore`
- **Thông điệp**: `chore(repo): update service submodules, architecture documentation and tooling`
- **Danh sách file**:
  - `services/IdentityService` *(submodule pointer)*
  - `services/CommunityService` *(submodule pointer)*
  - `services/CrawlerGithubService` *(submodule pointer)*
  - `services/QualityService` *(submodule pointer)*
  - `README.md`
  - `ai/`
  - `scripts/`
  - `code_src.txt`
  - `commit_list.md`
- **Lệnh thực hiện**:
```bash
cd ../../
git add services/IdentityService services/CommunityService services/CrawlerGithubService services/QualityService
git add README.md ai/ scripts/ code_src.txt commit_list.md
git commit -m "chore(repo): update service submodules, architecture documentation and tooling"
```

---

## ⚡ SCRIPT POWERSHELL TỰ ĐỘNG THỰC HIỆN TẤT CẢ COMMIT

Bạn có thể chạy toàn bộ kịch bản tự động sau bằng PowerShell trong thư mục `D:\Project\DevRadar`:

```powershell
# ==============================================================================
# Script tự động thực hiện 21 commit cho DevRadar với đường dẫn chính xác
# ==============================================================================

Write-Host ">>> [1/5] Committing IdentityService..." -ForegroundColor Cyan
Set-Location -Path "services\IdentityService"

git add src/Identity.Application/Features/Auth/Commands/ForgotPassword/
git add src/Identity.Application/Features/Auth/Commands/ResetPassword/
git add src/Identity.API/Controllers/AuthController.cs
git commit -m "feat(auth): implement forgot password and reset password flows"

git add src/Identity.Application/Features/Users/Commands/LockUser/
git add src/Identity.Application/Features/Users/Commands/UnlockUser/
git add src/Identity.API/Controllers/UsersController.cs
git commit -m "feat(user): add admin lock and unlock user account management"

git add src/Identity.Infrastructure/Migrations/
git commit -m "chore(db): add entity framework migration for user lock state"

git add src/Identity.API/Middleware/RequestLoggingMiddleware.cs
git commit -m "feat(middleware): add request logging middleware for structured tracing"

git add Dockerfile .dockerignore src/Identity.API/.dockerignore src/Identity.API/Dockerfile src/Identity.API/Program.cs
git commit -m "chore(deploy): update dockerfile, dockerignore and program entrypoint"

git add DevRadar_Identity.postman_collection.json TestAPI.md
git commit -m "docs(api): add postman collection and api testing guide"

Write-Host ">>> [2/5] Committing CommunityService..." -ForegroundColor Cyan
Set-Location -Path "..\CommunityService"

git add src/Community.Application/Features/Comments/Commands/UpdateComment/
git add src/Community.Domain/Contracts/ICommentRepository.cs
git add src/Community.API/Controllers/CommentController.cs
git commit -m "feat(comment): add update comment command with ownership validation"

git add src/Community.Application/Features/Posts/Commands/PinPost/
git add src/Community.API/Controllers/PostsController.cs
git commit -m "feat(post): implement pin and unpin post commands for moderators"

git add src/Community.Application/DTOs/Leaderboard/
git add src/Community.Application/Features/Leaderboard/
git add src/Community.API/Controllers/LeaderboardController.cs
git commit -m "feat(leaderboard): introduce leaderboard endpoints and point ranking queries"

git add src/Community.Infrastructure/Services/HttpContentModerationService.cs
git add src/Community.Domain/Contracts/IPostReportRepository.cs
git add src/Community.Application/Features/PostReport/Commands/
git commit -m "feat(moderation): add http content moderation client and report handling"

git add src/Community.Infrastructure/Services/NotificationHttpClient.cs
git add src/Community.Application/Interfaces/INotificationClient.cs
git add src/Community.Application/Features/Posts/Commands/TogglePostLike/
git add src/Community.Application/Features/Posts/Commands/SharePost/
git add src/Community.Application/Features/Comments/Commands/CreateComment/
git add src/Community.Application/Features/Comments/Commands/ToggleCommentLike/
git commit -m "feat(notification): integrate internal http notification client"

git add src/Community.API/Middleware/RequestLoggingMiddleware.cs
git add src/Community.Infrastructure/DependencyInjection.cs
git add src/Community.API/Program.cs
git add src/Community.API/appsettings.json
git commit -m "feat(middleware): register request logging middleware and dependency injection"

git add tests/
git commit -m "test(community): add comprehensive unit and integration test suites"

git add .gitignore .dockerignore Community.slnx docker-compose.yml
git commit -m "chore(project): clean up solution configuration and obsolete docker compose"

Write-Host ">>> [3/5] Committing CrawlerGithubService..." -ForegroundColor Cyan
Set-Location -Path "..\CrawlerGithubService"

git add app/core/logging.py app/core/request_logging.py app/main.py Dockerfile .dockerignore
git commit -m "feat(logging): implement standardized request logging middleware and dockerfile"

git add app/api/analytics.py run_instant_crawl.py run_multi_level_crawler.py run_demo_crawler.py run_demo_models.py
git commit -m "feat(crawler): add multi-level crawl and instant crawl entrypoints"

git add check_mongo_count.py tests/test_repo_updater.py
git commit -m "chore(tools): add repository updater tests and mongo count diagnostic script"

Write-Host ">>> [4/5] Committing QualityService..." -ForegroundColor Cyan
Set-Location -Path "..\QualityService"

git add app/api/routes/ai_assistant.py app/main.py
git commit -m "feat(ai): integrate ai assistant module for deep code quality insights"

git add app/core/logging.py app/core/request_logging.py .dockerignore
git commit -m "feat(logging): implement request tracing and structured log formatters"

git add eval_dataset.py inspect_analysis.py
git commit -m "chore(tools): add evaluation dataset and quality analysis inspector scripts"

Write-Host ">>> [5/5] Committing Root Project..." -ForegroundColor Cyan
Set-Location -Path "..\..\"

git add services/IdentityService services/CommunityService services/CrawlerGithubService services/QualityService
git add README.md ai/ scripts/ code_src.txt commit_list.md
git commit -m "chore(repo): update service submodules, architecture documentation and tooling"

Write-Host " Hoàn tất 21 commit chuẩn chỉ cho DevRadar!" -ForegroundColor Green
```
