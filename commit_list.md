# DANH SÁCH COMMIT CHO CÁC THAY ĐỔI MỚI (UNCOMMITTED CHANGES) - DEVRADAR

> **Mục đích**: Tài liệu này phân loại toàn bộ các file thay đổi (`modified`, `deleted`) và các file mới chưa được theo dõi (`untracked files`) hiện tại trên toàn bộ hệ sinh thái DevRadar thành các **Atomic Commits** theo chuẩn **Conventional Commits** (`feat`, `fix`, `chore`, `test`, `docs`).
> 
> Các đường dẫn bên dưới đã được chuẩn hóa chính xác 100% theo cấu trúc thư mục thực tế của từng Repository/Submodule.

---

## 📋 BẢNG THEO DÕI TIẾN ĐỘ COMMIT (TASKLIST)

Đánh dấu `[x]` vào các ô bên dưới sau khi thực hiện xong từng commit:

### I. CommunityService (`services/CommunityService`)
- [x] **Commit 01** `feat(admin-content)`: Triển khai quản trị bài viết và bình luận Admin (UC-52 → UC-61) *(Đã commit `cff5386`)*
- [x] **Commit 02** `feat(moderation)`: Tích hợp kiểm duyệt nội dung tự động qua QualityService và khắc phục timeout (UC-15, UC-24, UC-29, UC-63) *(Đã commit `e959b44`)*
- [ ] **Commit 03** `feat(events-cache)`: Tích hợp Redis Distributed Caching, RabbitMQ Event Publisher và kiểm tra thu hồi JWT Blacklist

### II. QualityService (`services/QualityService`)
- [x] **Commit 04** `feat(ai)`: Tích hợp UnoRouter LLM Client, AI Assistant và tối ưu pipeline kiểm duyệt nhanh (UC-44, UC-45, UC-46) *(Đã commit `dfccaac`)*
- [x] **Commit 05** `feat(ai)`: Tích hợp mô hình LLM fallback engine và schemas *(Đã commit `0f771b9`)*
- [ ] **Commit 06** `feat(events-moderation)`: Tích hợp RabbitMQ Quality Event Consumer, tinh chỉnh tính điểm bình luận và mở rộng bộ từ điển thô tục

### III. CrawlerGithubService (`services/CrawlerGithubService`)
- [x] **Commit 07** `feat(crawl-control)`: Ngắt phiên cào an toàn, thống kê hệ thống Admin và Smart Token Pool Rotator (UC-79, UC-81) *(Đã commit `38cdaa0`)*
- [ ] **Commit 08** `feat(tech-reports)`: Bổ sung hoàn chỉnh AI Report Generator, bộ lập lịch tự động, scripts đồng bộ dữ liệu Cloud và test suite (UC-35 → UC-38, UC-64 → UC-68)

### IV. IdentityService (`services/IdentityService`)
- [ ] **Commit 09** `feat(identity)`: Bổ sung Data Seeder mặc định, cơ chế Redis Token Blacklist, User Profile Cache và kế hoạch bảo mật quyền riêng tư

### V. NotificationService (`services/NotificationService`)
- [ ] **Commit 10** `feat(notification)`: Tích hợp RabbitMQ Notification Consumer xử lý thông báo thời gian thực qua SignalR

### VI. GatewayService & Kiểm thử Postman (`services/GatewayService`)
- [ ] **Commit 11** `feat(gateway)`: Cập nhật YARP Reverse Proxy CORS, Routing và trọn bộ Postman Collection cho Admin/AI/Reports

### VII. Web Frontend (`frontend`)
- [ ] **Commit 12** `feat(frontend)`: Tích hợp mã nguồn React SPA, loại bỏ 100% Mockup Data, thiết lập RBAC Route Guard, trang Admin Logs và Tech Reports CMS

### VIII. Thiết kế UI/UX & Tài liệu đồ họa (`docs/ui`)
- [ ] **Commit 13** `docs(ui)`: Bổ sung Design System, Wireframes, User Flows và tài liệu quy trình thiết kế Lunacy

### IX. Báo cáo tiến độ & Kế hoạch phát triển (`docs` & `scripts`)
- [ ] **Commit 14** `docs(progress)`: Cập nhật Báo cáo tiến độ 81 Use Cases (95.1%), đồng bộ bảng tính Excel và bổ sung bộ công cụ bảo trì

### X. Root Workspace, Docker Compose & Submodule Pointers (`DevRadar`)
- [ ] **Commit 15** `chore(root)`: Bổ sung dịch vụ Redis & RabbitMQ vào Docker Compose, SQL Seeds, cập nhật Submodule Pointers và tài liệu Commit

---

## 🛠️ CHI TIẾT CÁC COMMIT, FILE & LỆNH THỰC HIỆN

---

### PHẦN I: `services/CommunityService`
*Đường dẫn tương đối tính từ thư mục gốc của submodule:* `services/CommunityService/`

#### 🔹 Commit 01: Quản trị bài viết & Bình luận Admin (UC-52 → UC-61) — *(ĐÃ THỰC HIỆN: `cff5386`)*
- **Loại**: `feat`
- **Thông điệp**: `feat(admin-content): implement admin posts and comments management (UC-52 to UC-61)`
- **Chi tiết**:
  - Triển khai `AdminPostsController` (`/api/admin/posts`) quản trị toàn bộ bài viết, bộ lọc `IsApproved`, lọc theo trạng thái, ẩn/khôi phục/xóa bài viết.
  - Triển khai `AdminCommentsController` (`/api/admin/comments`) quản trị bình luận vi phạm.

---

#### 🔹 Commit 02: Tích hợp kiểm duyệt AI & Khắc phục timeout (UC-15, UC-24, UC-29, UC-63) — *(ĐÃ THỰC HIỆN: `e959b44`)*
- **Loại**: `feat`
- **Thông điệp**: `feat(moderation): integrate live AI content moderation for posts and comments with resilient HTTP client and seed data`
- **Chi tiết**:
  - Tăng timeout `HttpContentModerationService`, tích hợp cơ chế fallback heuristic.
  - Tạo `CommunityDataSeeder.cs` tự động sinh 5 TechZones, 5 bài viết thực tế và bình luận mẫu.

---

#### 🔹 Commit 03: Tích hợp Redis Caching & RabbitMQ Event Publisher
- **Loại**: `feat`
- **Thông điệp**: `feat(events-cache): integrate Redis distributed caching and RabbitMQ event publisher for post and comment events`
- **Chi tiết**:
  - Xây dựng `ICacheService` và `RedisCacheService` tối ưu hóa đọc dữ liệu bộ nhớ đệm phân tán.
  - Xây dựng `IEventPublisher` và `RabbitMqEventPublisher` bắn sự kiện bất đồng bộ qua exchange `devradar.events` (ví dụ: gửi sự kiện bài viết mới cho QualityService và NotificationService).
  - Cập nhật `OnTokenValidated` trong JwtBearer Middleware kiểm tra token đã bị thu hồi trong Redis blacklist (`blacklist:{token}`).
  - Bổ sung trường `IsApproved` vào `PostDto` phục vụ hiển thị trạng thái duyệt bài.
  - Chuẩn hóa namespace `CreateComment` trong `CommentController` và sửa chữa unit test liên quan.
- **Danh sách file**:
  - `src/Community.API/Controllers/CommentController.cs`
  - `src/Community.Application/DTOs/Post/PostDto.cs`
  - `src/Community.Application/Features/Comments/Commands/CreateComment/CreateCommentCommand.cs`
  - `src/Community.Application/Features/Posts/Commands/CreatePost/CreatePostCommand.cs`
  - `src/Community.Application/Interfaces/ICacheService.cs`
  - `src/Community.Application/Interfaces/IEventPublisher.cs`
  - `src/Community.Infrastructure/Community.Infrastructure.csproj`
  - `src/Community.Infrastructure/DependencyInjection.cs`
  - `src/Community.Infrastructure/Messaging/RabbitMqEventPublisher.cs`
  - `src/Community.Infrastructure/Services/RedisCacheService.cs`
  - `tests/Community.UnitTests/Features/Comments/CreateCommentCommandHandlerTests.cs`
- **Lệnh thực hiện**:
```bash
cd services/CommunityService
git add src/Community.API/Controllers/CommentController.cs
git add src/Community.Application/DTOs/Post/PostDto.cs
git add src/Community.Application/Features/Comments/Commands/CreateComment/CreateCommentCommand.cs
git add src/Community.Application/Features/Posts/Commands/CreatePost/CreatePostCommand.cs
git add src/Community.Application/Interfaces/ICacheService.cs
git add src/Community.Application/Interfaces/IEventPublisher.cs
git add src/Community.Infrastructure/Community.Infrastructure.csproj
git add src/Community.Infrastructure/DependencyInjection.cs
git add src/Community.Infrastructure/Messaging/
git add src/Community.Infrastructure/Services/RedisCacheService.cs
git add tests/Community.UnitTests/Features/Comments/CreateCommentCommandHandlerTests.cs
git commit -m "feat(events-cache): integrate Redis distributed caching and RabbitMQ event publisher for post and comment events"
```

---

### PHẦN II: `services/QualityService`
*Đường dẫn tương đối tính từ thư mục gốc của submodule:* `services/QualityService/`

#### 🔹 Commit 04: Tích hợp UnoRouter LLM Client (UC-44, UC-45, UC-46) — *(ĐÃ THỰC HIỆN: `dfccaac`)*
- **Loại**: `feat`
- **Thông điệp**: `feat(ai): integrate UnoRouter LLM client with heuristic fallback and fast-path content moderation (UC-44, UC-45, UC-46)`

---

#### 🔹 Commit 05: Tích hợp mô hình LLM fallback & Schemas — *(ĐÃ THỰC HIỆN: `0f771b9`)*
- **Loại**: `feat`
- **Thông điệp**: `feat(ai): intergrate llm model`

---

#### 🔹 Commit 06: RabbitMQ Event Consumer, Tinh chỉnh đánh giá & Từ điển vi phạm
- **Loại**: `feat`
- **Thông điệp**: `feat(events-moderation): add RabbitMQ quality event consumer, comment evaluation tuning and toxic slang dictionary`
- **Chi tiết**:
  - Xây dựng `quality_event_consumer.py` lắng nghe queue `quality.post.created` từ RabbitMQ để tự động thẩm định bài viết ngầm ngay khi đăng.
  - Đăng ký vòng đời `lifespan` trong `app/main.py` tự động khởi động và giải phóng kết nối consumer.
  - Phân tách rõ ràng cơ chế chấm điểm giữa Bài viết (`post`) và Bình luận (`comment`):
    - Bình luận an toàn giao tiếp thông thường không bị ép điểm kém (gán 50 điểm giao tiếp cơ bản, bình luận kỹ thuật IT được cộng điểm thưởng).
  - Tinh chỉnh `llm_client.py` giảm timeout xuống 3.5s và tối ưu `quality_service.py`: bỏ qua gọi LLM đối với bài viết đã bị mô hình cục bộ xác định Non-IT hoặc điểm quá thấp, tiết kiệm quota API và triệt tiêu nguy cơ timeout.
  - Bổ sung các từ lóng thô tục mới vào `toxic_keywords.json`.
  - Cập nhật `requirements.txt` bổ sung `pika` và `redis`.
- **Danh sách file**:
  - `app/clients/llm_client.py`
  - `app/core/config.py`
  - `app/dictionaries/toxic_keywords.json`
  - `app/main.py`
  - `app/pipeline/pipeline.py`
  - `app/pipeline/scorer.py`
  - `app/services/event_consumer.py`
  - `app/services/quality_service.py`
  - `requirements.txt`
- **Lệnh thực hiện**:
```bash
cd services/QualityService
git add app/clients/llm_client.py app/core/config.py app/dictionaries/toxic_keywords.json app/main.py
git add app/pipeline/pipeline.py app/pipeline/scorer.py app/services/event_consumer.py app/services/quality_service.py requirements.txt
git commit -m "feat(events-moderation): add RabbitMQ quality event consumer, comment evaluation tuning and toxic slang dictionary"
```

---

### PHẦN III: `services/CrawlerGithubService`
*Đường dẫn tương đối tính từ thư mục gốc của submodule:* `services/CrawlerGithubService/`

#### 🔹 Commit 07: Graceful Cancellation & Smart Token Pool (UC-79, UC-81) — *(ĐÃ THỰC HIỆN: `38cdaa0`)*
- **Loại**: `feat`
- **Thông điệp**: `feat(crawl-control): implement crawl graceful cancellation, system overview analytics and smart token pool rotator (UC-79, UC-81)`

---

#### 🔹 Commit 08: Hoàn chỉnh AI Report Generator, Scheduler, Data Sync & Test Suite (UC-35..38, UC-64..68)
- **Loại**: `feat`
- **Thông điệp**: `feat(tech-reports): integrate AI report generator with key swap, heuristic fallback, auto scheduler and CMS (UC-35 to UC-38, UC-64 to UC-68)`
- **Chi tiết**:
  - Tạo `AIClient` (`app/clients/ai_client.py`) kết nối UnoRouter LLM kèm cơ chế tự động tráo key (Key Swap) và phục hồi khi gặp rate-limit HTTP 429.
  - Xây dựng `TechReportGenerator` (`app/services/report_generator.py`) tổng hợp báo cáo chuyên sâu từ dữ liệu GitHub Atlas kèm Fallback Heuristic Engine.
  - Thiết lập lịch trình tự động `scheduled_auto_generate_reports_job` trong `app/jobs/scheduler.py`.
  - Tích hợp trọn bộ 10 endpoint Client và Admin CMS trong `app/api/tech_reports.py`.
  - Bổ sung bộ kiểm thử 10 unit tests trong `tests/test_ai_report_generator.py`.
  - Bổ sung các scripts đồng bộ dữ liệu: `seed_and_sync_evaluations.py`, `sync_local_to_cloud.py`, `check_data.py`.
  - Cập nhật logging có cấu trúc, pipeline cập nhật repo và cấu hình crawl JSON.
- **Danh sách file**:
  - `app/api/analytics.py`
  - `app/api/crawl_history.py`
  - `app/api/tech_reports.py`
  - `app/clients/__init__.py`
  - `app/clients/ai_client.py`
  - `app/core/config.py`
  - `app/core/crawl_config.json`
  - `app/core/crawl_config.py`
  - `app/core/github_client.py`
  - `app/core/logging.py`
  - `app/core/request_logging.py`
  - `app/core_models/data/db_loader.py`
  - `app/db/models.py`
  - `app/db/mongo.py`
  - `app/jobs/scheduler.py`
  - `app/main.py`
  - `app/services/data_cleaner.py`
  - `app/services/pipelines/repo_updater_pipeline.py`
  - `app/services/report_generator.py`
  - `check_data.py`
  - `seed_and_sync_evaluations.py`
  - `sync_local_to_cloud.py`
  - `tests/test_ai_report_generator.py`
- **Lệnh thực hiện**:
```bash
cd services/CrawlerGithubService
git add app/api/analytics.py app/api/crawl_history.py app/api/tech_reports.py
git add app/clients/ app/core/config.py app/core/crawl_config.json app/core/crawl_config.py
git add app/core/github_client.py app/core/logging.py app/core/request_logging.py
git add app/core_models/data/db_loader.py app/db/models.py app/db/mongo.py
git add app/jobs/scheduler.py app/main.py app/services/data_cleaner.py
git add app/services/pipelines/repo_updater_pipeline.py app/services/report_generator.py
git add check_data.py seed_and_sync_evaluations.py sync_local_to_cloud.py tests/test_ai_report_generator.py
git commit -m "feat(tech-reports): integrate AI report generator with key swap, heuristic fallback, auto scheduler and CMS (UC-35 to UC-38, UC-64 to UC-68)"
```

---

### PHẦN IV: `services/IdentityService`
*Đường dẫn tương đối tính từ thư mục gốc của submodule:* `services/IdentityService/`

#### 🔹 Commit 09: Data Seeder, Redis Token Blacklist, User Cache & Tài liệu Kiểm thử
- **Loại**: `feat`
- **Thông điệp**: `feat(identity): add default data seeder, Redis token blacklist, user caching and privacy plan`
- **Chi tiết**: 
  - Tạo `IdentityDataSeeder.cs` tự động sinh các tài khoản kiểm thử mặc định (`admin`, `chautantan`, `postman_user`), vai trò (`Admin`, `Moderator`, `Member`) và cấu hình quyền riêng tư cá nhân `UserPrivacySetting`.
  - Tích hợp `IRedisCacheService` và `RedisCacheService` lưu cache refresh token và thông tin người dùng (`user:profile:{userId}`).
  - Hỗ trợ cơ chế thu hồi token tức thì qua Redis blacklist trong `RevokeTokenCommandHandler`.
  - Cập nhật `Program.cs` kích hoạt seeder ngay sau migration cơ sở dữ liệu.
  - Lưu trữ tài liệu kế hoạch bổ sung quyền riêng tư và file hướng dẫn kiểm thử các endpoint IdentityService.
- **Danh sách file**:
  - `src/Identity.API/Program.cs`
  - `src/Identity.Application/Common/Interfaces/IRedisCacheService.cs`
  - `src/Identity.Application/Features/Auth/Commands/RefreshToken/RefreshTokenCommand.cs`
  - `src/Identity.Application/Features/Auth/Commands/RevokeToken/RevokeTokenCommand.cs`
  - `src/Identity.Application/Features/Auth/Queries/GetCurrentUser/GetCurrentUserQuery.cs`
  - `src/Identity.Infrastructure/DependencyInjection.cs`
  - `src/Identity.Infrastructure/Identity.Infrastructure.csproj`
  - `src/Identity.Infrastructure/Persistence/IdentityDataSeeder.cs`
  - `src/Identity.Infrastructure/Services/JwtTokenService.cs`
  - `src/Identity.Infrastructure/Services/RedisCacheService.cs`
  - `KE_HOACH_BO_SUNG_QUYEN_RIENG_TU.md`
  - `TestAPI.md`
- **Lệnh thực hiện**:
```bash
cd services/IdentityService
git add src/Identity.API/Program.cs src/Identity.Application/Common/Interfaces/IRedisCacheService.cs
git add src/Identity.Application/Features/Auth/Commands/RefreshToken/RefreshTokenCommand.cs
git add src/Identity.Application/Features/Auth/Commands/RevokeToken/RevokeTokenCommand.cs
git add src/Identity.Application/Features/Auth/Queries/GetCurrentUser/GetCurrentUserQuery.cs
git add src/Identity.Infrastructure/DependencyInjection.cs src/Identity.Infrastructure/Identity.Infrastructure.csproj
git add src/Identity.Infrastructure/Persistence/IdentityDataSeeder.cs
git add src/Identity.Infrastructure/Services/JwtTokenService.cs src/Identity.Infrastructure/Services/RedisCacheService.cs
git add KE_HOACH_BO_SUNG_QUYEN_RIENG_TU.md TestAPI.md
git commit -m "feat(identity): add default data seeder, Redis token blacklist, user caching and privacy plan"
```

---

### PHẦN V: `services/NotificationService`
*Đường dẫn tương đối tính từ thư mục gốc của submodule:* `services/NotificationService/`

#### 🔹 Commit 10: Tích hợp RabbitMQ Notification Consumer qua SignalR
- **Loại**: `feat`
- **Thông điệp**: `feat(notification): integrate RabbitMQ consumer for realtime push notifications via SignalR`
- **Chi tiết**: 
  - Xây dựng `RabbitMqNotificationConsumer.cs` chạy dưới dạng Background Hosted Service lắng nghe queue `notification.user.notify`.
  - Tự động tiếp nhận các sự kiện thông báo tương tác (bình luận, thích bài viết, cảnh báo kiểm duyệt, phê duyệt báo cáo) từ các microservice khác qua RabbitMQ và đẩy thông báo thời gian thực đến client qua SignalR Hub.
  - Cập nhật file cấu hình dự án `Notification.Infrastructure.csproj` bổ sung gói `RabbitMQ.Client`.
  - Đăng ký DI trong `DependencyInjection.cs`.
- **Danh sách file**:
  - `src/Notification.Infrastructure/DependencyInjection.cs`
  - `src/Notification.Infrastructure/Notification.Infrastructure.csproj`
  - `src/Notification.Infrastructure/Services/RabbitMqNotificationConsumer.cs`
- **Lệnh thực hiện**:
```bash
cd services/NotificationService
git add src/Notification.Infrastructure/DependencyInjection.cs
git add src/Notification.Infrastructure/Notification.Infrastructure.csproj
git add src/Notification.Infrastructure/Services/RabbitMqNotificationConsumer.cs
git commit -m "feat(notification): integrate RabbitMQ consumer for realtime push notifications via SignalR"
```

---

### PHẦN VI: `services/GatewayService` & Postman
*Đường dẫn tương đối tính từ thư mục gốc của dự án:* `services/GatewayService/`

#### 🔹 Commit 11: Cấu hình YARP Reverse Proxy & Postman Collection
- **Loại**: `feat`
- **Thông điệp**: `feat(gateway): update YARP reverse proxy CORS, routing and Postman collection for all microservices`
- **Chi tiết**: 
  - Cập nhật `yarp.json` gắn chính sách `CorsPolicy: Frontend` trên từng route reverse proxy cho 5 microservices downstream.
  - Cập nhật `Program.cs` cấu hình `AddDefaultPolicy` cho CORS hỗ trợ Vite `http://localhost:5173` và React `http://localhost:3000`.
  - Cập nhật Postman Collection & Environment hoàn chỉnh 14 Use Cases cho Admin, Tech Reports, AI moderation và System Overview.
- **Danh sách file**:
  - `services/GatewayService/yarp.json`
  - `services/GatewayService/Program.cs`
  - `services/GatewayService/postman/DevRadar.postman_collection.json`
  - `services/GatewayService/postman/DevRadar.postman_environment.json`
- **Lệnh thực hiện**:
```bash
git add services/GatewayService/yarp.json services/GatewayService/Program.cs services/GatewayService/postman/DevRadar.postman_collection.json services/GatewayService/postman/DevRadar.postman_environment.json
git commit -m "feat(gateway): update YARP reverse proxy CORS, routing and Postman collection for all microservices"
```

---

### PHẦN VII: Web Frontend (`frontend`)
*Đường dẫn tương đối tính từ thư mục gốc của dự án:* `frontend/`

#### 🔹 Commit 12: Ứng dụng React SPA, Xóa bỏ 100% Mockup Data, RBAC Route Guard & Quản trị CMS
- **Loại**: `feat`
- **Thông điệp**: `feat(frontend): eliminate all mock data, connect live APIs, add RBAC route guards, admin logs and tech reports CMS`
- **Chi tiết**: 
  - Xây dựng tầng API client tập trung tại `frontend/src/api/` (`client.ts`, `auth.api.ts`, `community.api.ts`, `analytics.api.ts`, `admin.api.ts`, `notification.api.ts`, `signalr.service.ts`).
  - Hỗ trợ tự động chèn JWT Bearer Token, cơ chế xoay vòng làm mới Token khi nhận 401 Unauthorized và unwrap chuẩn `ResponseModel<T>` từ backend.
  - **Phân quyền RBAC & Route Protection**:
    - Xây dựng component `RouteGuard.tsx` (`ProtectedRoute`) kiểm soát truy cập nghiêm ngặt theo danh sách vai trò (`allowedRoles`).
    - Bọc toàn bộ các route Quản trị Admin (`/admin/*`) yêu cầu quyền `Admin`.
    - Bọc các route Thành viên Member (`/editor/*`, `/profile/me`, `/bookmarks`, `/notifications`) yêu cầu trạng thái đăng nhập.
  - **Xóa bỏ 100% Mockup Data trên toàn bộ 22 màn hình**:
    - `AdminUsers.tsx`, `AdminPosts.tsx`, `AdminReports.tsx`, `AdminTechZones.tsx`, `AdminCrawler.tsx` kết nối 100% API backend thật.
    - Xây dựng mới trang `AdminLogs.tsx` theo dõi log hệ thống và `AdminTechReports.tsx` quản trị CMS báo cáo AI.
    - `TechDashboard.tsx`, `AnalyticsReports.tsx`, `ReportDetail.tsx`, `TechCompare.tsx`, `RepoHealth.tsx` kết nối số liệu thật từ MongoDB Atlas.
    - `Newsfeed.tsx`, `PostDetail.tsx`, `Leaderboard.tsx`, `Bookmarks.tsx`, `Notifications.tsx`, `MyProfile.tsx`, `PublicProfile.tsx` loại bỏ hoàn toàn mảng mock, xử lý trạng thái `<EmptyState />` chuẩn mực.
  - Đảm bảo bản build production `npm run build` hoàn thành 100% không cảnh báo lỗi.
- **Danh sách file**:
  - `frontend/src/api/`
  - `frontend/src/components/common/RouteGuard.tsx`
  - `frontend/src/components/common/RadarChart.tsx`
  - `frontend/src/components/layout/AdminSidebar.tsx`
  - `frontend/src/components/layout/Header.tsx`
  - `frontend/src/components/layout/Sidebar.tsx`
  - `frontend/src/context/AuthContext.tsx`
  - `frontend/src/pages/admin/AdminCrawler.tsx`
  - `frontend/src/pages/admin/AdminLogs.tsx`
  - `frontend/src/pages/admin/AdminPosts.tsx`
  - `frontend/src/pages/admin/AdminReports.tsx`
  - `frontend/src/pages/admin/AdminTechReports.tsx`
  - `frontend/src/pages/admin/AdminTechZones.tsx`
  - `frontend/src/pages/admin/AdminUsers.tsx`
  - `frontend/src/pages/analytics/AnalyticsReports.tsx`
  - `frontend/src/pages/analytics/ReportDetail.tsx`
  - `frontend/src/pages/analytics/RepoHealth.tsx`
  - `frontend/src/pages/analytics/TechCompare.tsx`
  - `frontend/src/pages/analytics/TechDashboard.tsx`
  - `frontend/src/pages/auth/Login.tsx`
  - `frontend/src/pages/auth/Register.tsx`
  - `frontend/src/pages/community/Leaderboard.tsx`
  - `frontend/src/pages/community/Newsfeed.tsx`
  - `frontend/src/pages/community/PostDetail.tsx`
  - `frontend/src/pages/community/TechZones.tsx`
  - `frontend/src/pages/editor/CreatePost.tsx`
  - `frontend/src/pages/editor/EditPost.tsx`
  - `frontend/src/pages/profile/Bookmarks.tsx`
  - `frontend/src/pages/profile/MyProfile.tsx`
  - `frontend/src/pages/profile/Notifications.tsx`
  - `frontend/src/pages/profile/PublicProfile.tsx`
  - `frontend/src/types/index.ts`
  - `frontend/src/utils/`
  - `frontend/src/App.tsx`
- **Lệnh thực hiện**:
```bash
git add frontend/
git commit -m "feat(frontend): eliminate all mock data, connect live APIs, add RBAC route guards, admin logs and tech reports CMS"
```

---

### PHẦN VIII: Thiết kế UI/UX (`docs/ui`)
*Đường dẫn tương đối tính từ thư mục gốc của dự án:* `docs/ui/`

#### 🔹 Commit 13: Thiết kế hệ thống UI/UX, Wireframes & Tài liệu Lunacy
- **Loại**: `docs`
- **Thông điệp**: `docs(ui): add complete design system, wireframes, user flows and screen specifications`
- **Chi tiết**: Lưu trữ Design System, User Flow, Wireframes, kiến trúc thông tin, quy trình thiết kế Lunacy, tài liệu màn hình chi tiết và dọn dẹp các tệp mẫu tạm thời.
- **Danh sách file**:
  - `docs/ui/DESIGN_SYSTEM.md`
  - `docs/ui/INTERFACE_IMPLEMENTATION_PLAN.md`
  - `docs/ui/Information_Architecture.md`
  - `docs/ui/QUY_TRINH_THIET_KE_LUNACY.md`
  - `docs/ui/QUY_TRINH_UIUX.md`
  - `docs/ui/README.md`
  - `docs/ui/UIUX_Requirements.md`
  - `docs/ui/User_Flow.md`
  - `docs/ui/WIREFRAMES.md`
  - `docs/ui/designs/`
  - `docs/ui/screens/`
  - `docs/ui/scripts/`
  - `docs/ui/templates/InformationArchitecture_template.md` (deleted)
  - `docs/ui/templates/UIUX_Requirements_template.md` (deleted)
  - `docs/ui/templates/UserFlow_template.md` (deleted)
- **Lệnh thực hiện**:
```bash
git add docs/ui/
git rm -f docs/ui/templates/InformationArchitecture_template.md docs/ui/templates/UIUX_Requirements_template.md docs/ui/templates/UserFlow_template.md 2> /dev/null || true
git commit -m "docs(ui): add complete design system, wireframes, user flows and screen specifications"
```

---

### PHẦN IX: Báo cáo tiến độ & Kế hoạch phát triển (`docs` & `scripts`)
*Đường dẫn tương đối tính từ thư mục gốc của dự án:* `docs/` & `scripts/`

#### 🔹 Commit 14: Cập nhật Báo cáo tiến độ 81 Use Cases (95.1%), Đồng bộ Excel & Scripts
- **Loại**: `docs`
- **Thông điệp**: `docs(progress): update 81 use cases progress report, sync excel and add maintenance scripts`
- **Chi tiết**: Đối soát toàn bộ 81 Use Cases: nâng tỷ lệ hoàn thành lên 95.1% (77/81 UCs), đồng bộ bảng chi tiết 81 Use Cases trong file Excel `Bao_Cao_Tien_Do_Chuc_Nang_DevRadar.xlsx`, bổ sung tài liệu kế hoạch phát triển Quality và Crawler service, kèm các scripts tự động hóa đồng bộ Postman và Excel.
- **Danh sách file**:
  - `docs/BAO_CAO_TIEN_DO_CHUC_NANG_DEVRADAR.md`
  - `docs/Bao_Cao_Tien_Do_Chuc_Nang_DevRadar.xlsx`
  - `docs/KE_HOACH_KET_NOI_API_FRONTEND.md`
  - `docs/KE_HOACH_PHAT_TRIEN_QUALITY_VA_CRAWLER_SERVICE.md`
  - `scripts/sync_excel_progress.py`
  - `scripts/update_postman_admin.py`
  - `scripts/update_postman_ai.py`
  - `scripts/fix_postman.py`
- **Lệnh thực hiện**:
```bash
git add docs/BAO_CAO_TIEN_DO_CHUC_NANG_DEVRADAR.md docs/Bao_Cao_Tien_Do_Chuc_Nang_DevRadar.xlsx docs/KE_HOACH_KET_NOI_API_FRONTEND.md docs/KE_HOACH_PHAT_TRIEN_QUALITY_VA_CRAWLER_SERVICE.md
git add scripts/sync_excel_progress.py scripts/update_postman_admin.py scripts/update_postman_ai.py scripts/fix_postman.py
git commit -m "docs(progress): update 81 use cases progress report, sync excel and add maintenance scripts"
```

---

### PHẦN X: Root Workspace, Docker Compose & Submodule Pointers (`DevRadar`)
*Đường dẫn tại thư mục gốc của dự án:* `d:/Project/DevRadar/`

#### 🔹 Commit 15: Cấu hình Docker Compose (Redis & RabbitMQ), SQL Seeds, Submodule Pointers & Commit List
- **Loại**: `chore`
- **Thông điệp**: `chore(root): add Redis and RabbitMQ to docker compose, SQL seed scripts, update submodule pointers and commit docs`
- **Chi tiết**:
  - Bổ sung cấu hình container `redis:7-alpine` và `rabbitmq:3-management-alpine` vào `docker-compose.yml`, thiết lập biến môi trường kết nối cho 5 microservices downstream.
  - Thêm trọn bộ các tệp kịch bản dữ liệu mẫu cơ sở dữ liệu PostgreSQL: `seed_identity.sql`, `seed_community.sql`, `clean_seed_community.sql`, `seed_notifications.sql`.
  - Cập nhật quy tắc loại trừ trong `.gitignore`.
  - Cập nhật con trỏ submodules trỏ tới các commit mới nhất của `CommunityService`, `CrawlerGithubService`, `QualityService`, `IdentityService`, `NotificationService`.
  - Lưu trữ tài liệu theo dõi tiến độ commit `commit_list.md`.
- **Danh sách file**:
  - `.gitignore`
  - `commit_list.md`
  - `docker-compose.yml`
  - `scripts/clean_seed_community.sql`
  - `scripts/seed_community.sql`
  - `scripts/seed_identity.sql`
  - `scripts/seed_notifications.sql`
  - `services/CommunityService` (submodule pointer)
  - `services/CrawlerGithubService` (submodule pointer)
  - `services/QualityService` (submodule pointer)
  - `services/IdentityService` (submodule pointer)
  - `services/NotificationService` (submodule pointer)
- **Lệnh thực hiện**:
```bash
git add .gitignore commit_list.md docker-compose.yml
git add scripts/clean_seed_community.sql scripts/seed_community.sql scripts/seed_identity.sql scripts/seed_notifications.sql
git add services/CommunityService services/CrawlerGithubService services/QualityService services/IdentityService services/NotificationService
git commit -m "chore(root): add Redis and RabbitMQ to docker compose, SQL seed scripts, update submodule pointers and commit docs"
```

---

## ⚡ SCRIPT POWERSHELL THỰC HIỆN TỰ ĐỘNG TOÀN BỘ COMMIT

Bạn có thể sao chép đoạn script PowerShell dưới đây và chạy tại thư mục gốc `d:/Project/DevRadar/` để tự động thực hiện tuần tự tất cả các commit chưa commit một cách an toàn và chuẩn xác:

```powershell
# ==========================================
# DevRadar - Automated Commit Executor Script
# ==========================================
$ErrorActionPreference = "Stop"

Write-Host ">>> [1/7] Committing services/CommunityService..." -ForegroundColor Cyan
Push-Location "services/CommunityService"
git add src/Community.API/Controllers/CommentController.cs
git add src/Community.Application/DTOs/Post/PostDto.cs
git add src/Community.Application/Features/Comments/Commands/CreateComment/CreateCommentCommand.cs
git add src/Community.Application/Features/Posts/Commands/CreatePost/CreatePostCommand.cs
git add src/Community.Application/Interfaces/ICacheService.cs
git add src/Community.Application/Interfaces/IEventPublisher.cs
git add src/Community.Infrastructure/Community.Infrastructure.csproj
git add src/Community.Infrastructure/DependencyInjection.cs
git add src/Community.Infrastructure/Messaging/
git add src/Community.Infrastructure/Services/RedisCacheService.cs
git add tests/Community.UnitTests/Features/Comments/CreateCommentCommandHandlerTests.cs
git commit -m "feat(events-cache): integrate Redis distributed caching and RabbitMQ event publisher for post and comment events"
Pop-Location

Write-Host ">>> [2/7] Committing services/QualityService..." -ForegroundColor Cyan
Push-Location "services/QualityService"
git add app/clients/llm_client.py app/core/config.py app/dictionaries/toxic_keywords.json app/main.py
git add app/pipeline/pipeline.py app/pipeline/scorer.py app/services/event_consumer.py app/services/quality_service.py requirements.txt
git commit -m "feat(events-moderation): add RabbitMQ quality event consumer, comment evaluation tuning and toxic slang dictionary"
Pop-Location

Write-Host ">>> [3/7] Committing services/CrawlerGithubService..." -ForegroundColor Cyan
Push-Location "services/CrawlerGithubService"
git add app/api/analytics.py app/api/crawl_history.py app/api/tech_reports.py
git add app/clients/ app/core/config.py app/core/crawl_config.json app/core/crawl_config.py
git add app/core/github_client.py app/core/logging.py app/core/request_logging.py
git add app/core_models/data/db_loader.py app/db/models.py app/db/mongo.py
git add app/jobs/scheduler.py app/main.py app/services/data_cleaner.py
git add app/services/pipelines/repo_updater_pipeline.py app/services/report_generator.py
git add check_data.py seed_and_sync_evaluations.py sync_local_to_cloud.py tests/test_ai_report_generator.py
git commit -m "feat(tech-reports): integrate AI report generator with key swap, heuristic fallback, auto scheduler and CMS (UC-35 to UC-38, UC-64 to UC-68)"
Pop-Location

Write-Host ">>> [4/7] Committing services/IdentityService..." -ForegroundColor Cyan
Push-Location "services/IdentityService"
git add src/Identity.API/Program.cs src/Identity.Application/Common/Interfaces/IRedisCacheService.cs
git add src/Identity.Application/Features/Auth/Commands/RefreshToken/RefreshTokenCommand.cs
git add src/Identity.Application/Features/Auth/Commands/RevokeToken/RevokeTokenCommand.cs
git add src/Identity.Application/Features/Auth/Queries/GetCurrentUser/GetCurrentUserQuery.cs
git add src/Identity.Infrastructure/DependencyInjection.cs src/Identity.Infrastructure/Identity.Infrastructure.csproj
git add src/Identity.Infrastructure/Persistence/IdentityDataSeeder.cs
git add src/Identity.Infrastructure/Services/JwtTokenService.cs src/Identity.Infrastructure/Services/RedisCacheService.cs
git add KE_HOACH_BO_SUNG_QUYEN_RIENG_TU.md TestAPI.md
git commit -m "feat(identity): add default data seeder, Redis token blacklist, user caching and privacy plan"
Pop-Location

Write-Host ">>> [5/7] Committing services/NotificationService..." -ForegroundColor Cyan
Push-Location "services/NotificationService"
git add src/Notification.Infrastructure/DependencyInjection.cs
git add src/Notification.Infrastructure/Notification.Infrastructure.csproj
git add src/Notification.Infrastructure/Services/RabbitMqNotificationConsumer.cs
git commit -m "feat(notification): integrate RabbitMQ consumer for realtime push notifications via SignalR"
Pop-Location

Write-Host ">>> [6/7] Committing Gateway, Frontend, UI Docs & Progress Docs..." -ForegroundColor Cyan
# Gateway
git add services/GatewayService/yarp.json services/GatewayService/Program.cs services/GatewayService/postman/DevRadar.postman_collection.json services/GatewayService/postman/DevRadar.postman_environment.json
git commit -m "feat(gateway): update YARP reverse proxy CORS, routing and Postman collection for all microservices"

# Frontend
git add frontend/
git commit -m "feat(frontend): eliminate all mock data, connect live APIs, add RBAC route guards, admin logs and tech reports CMS"

# UI Docs
git add docs/ui/
git rm -f docs/ui/templates/InformationArchitecture_template.md docs/ui/templates/UIUX_Requirements_template.md docs/ui/templates/UserFlow_template.md 2>$null
git commit -m "docs(ui): add complete design system, wireframes, user flows and screen specifications"

# Progress Docs & Scripts
git add docs/BAO_CAO_TIEN_DO_CHUC_NANG_DEVRADAR.md docs/Bao_Cao_Tien_Do_Chuc_Nang_DevRadar.xlsx docs/KE_HOACH_KET_NOI_API_FRONTEND.md docs/KE_HOACH_PHAT_TRIEN_QUALITY_VA_CRAWLER_SERVICE.md
git add scripts/sync_excel_progress.py scripts/update_postman_admin.py scripts/update_postman_ai.py scripts/fix_postman.py
git commit -m "docs(progress): update 81 use cases progress report, sync excel and add maintenance scripts"

Write-Host ">>> [7/7] Committing Root Workspace & Submodule Pointers..." -ForegroundColor Cyan
git add .gitignore commit_list.md docker-compose.yml
git add scripts/clean_seed_community.sql scripts/seed_community.sql scripts/seed_identity.sql scripts/seed_notifications.sql
git add services/CommunityService services/CrawlerGithubService services/QualityService services/IdentityService services/NotificationService
git commit -m "chore(root): add Redis and RabbitMQ to docker compose, SQL seed scripts, update submodule pointers and commit docs"

Write-Host "`n✅ Hoàn tất toàn bộ các commit chuẩn chỉ cho DevRadar!" -ForegroundColor Green
```
