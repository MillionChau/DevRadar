# DevRadar — API Gateway & Tài liệu API toàn hệ thống

> Cổng API duy nhất cho toàn bộ 5 microservice của DevRadar. Client (web/mobile) chỉ cần biết **một địa chỉ**: `http://localhost:5000`.

---

## 1. Kiến trúc tổng quan

```
                                ┌─────────────────────────────┐
                                │   Client (Web / Mobile)     │
                                └──────────────┬──────────────┘
                                               │
                                ┌──────────────▼──────────────┐
                                │   API Gateway :5000 (YARP)  │
                                │  • Rate limit 300 req/phút  │
                                │  • CORS                     │
                                │  • WebSocket (SignalR)      │
                                │  • Swagger UI tổng hợp      │
                                └──┬────┬────────┬────────┬───┘
                 ┌─────────────────┘    │        │        └─────────────────┐
                 ▼                      ▼        ▼                          ▼
   ┌──────────────────┐  ┌──────────────────┐ ┌────────────────┐ ┌───────────────────┐ ┌──────────────────┐
   │ Identity :5002   │  │ Community :5145  │ │ Notification   │ │ CrawlerGithub     │ │ Quality          │
   │ .NET 10          │  │ .NET 10          │ │ :5003 .NET 10  │ │ :8000 FastAPI     │ │ :8001 FastAPI    │
   │ Đăng nhập, JWT,  │  │ Bài viết, bình   │ │ Thông báo      │ │ Thu thập dữ liệu  │ │ Kiểm duyệt AI,   │
   │ user, menu,      │  │ luận, like,      │ │ realtime,      │ │ GitHub, phân tích │ │ chấm điểm,       │
   │ phân quyền       │  │ bookmark, report │ │ hàng chờ Admin │ │ repo, analytics   │ │ toxicity         │
   └──────────────────┘  └────────┬─────────┘ └────────────────┘ └───────────────────┘ └──────────────────┘
                                  │
                        ┌─────────▼─────────┐
                        │ SignalR Hubs      │
                        │ /hubs/community   │  ← /community/hubs/community
                        │ /hubs/notifications│ ← /notification/hubs/notifications
                        └───────────────────┘
```

**Nguyên tắc định tuyến**: mọi request vào gateway có dạng `http://localhost:5000/{service-prefix}/api/...`. Gateway bóc prefix và chuyển tiếp nguyên phần còn lại tới service tương ứng.

| Prefix | Service đích | Địa chỉ nội bộ | Công nghệ |
|---|---|---|---|
| `/identity` | IdentityService | `http://localhost:5002` | ASP.NET Core 10 |
| `/community` | CommunityService | `http://localhost:5145` | ASP.NET Core 10 + SignalR |
| `/notification` | NotificationService | `http://localhost:5003` | ASP.NET Core 10 + SignalR |
| `/crawler` | CrawlerGithubService | `http://localhost:8000` | FastAPI (Python) |
| `/quality` | QualityService | `http://localhost:8001` | FastAPI (Python) |

---

## 2. Chạy hệ thống

```bash
# 1. Hạ tầng dữ liệu
#    Postgres 5433 (community) + 5434 (notification) + SQL Server/Mongo tùy service

# 2. Các service phía sau
dotnet run --project services/IdentityService/src/Identity.API      # :5002
dotnet run --project services/CommunityService/src/Community.API    # :5145
dotnet run --project services/NotificationService/src/Notification.API  # :5003
cd services/CrawlerGithubService && python -m uvicorn app.main:app --port 8000
cd services/QualityService       && python -m uvicorn app.main:app --port 8001

# 3. Gateway (cổng duy nhất cho client)
dotnet run --project services/GatewayService                        # :5000
```

Swagger UI tổng hợp: **http://localhost:5000/swagger** (chọn tài liệu từng service ở dropdown trên phải).

Health check gateway: `GET http://localhost:5000/health`.

---

## 3. Xác thực (JWT Bearer)

1. Client đăng nhập qua `POST /identity/api/v1/Auth/login` → nhận `accessToken` + `refreshToken`.
2. Mọi request cần đăng nhập gắn header:
   ```
   Authorization: Bearer <accessToken>
   ```
3. Gateway **không giải mã JWT** — chuyển tiếp nguyên header; từng service tự validate (cùng Issuer `DevRadarIdentityService`, Audience `DevRadarClients`).
4. Token hết hạn → service trả `401`; làm mới bằng `POST /identity/api/v1/Auth/refresh-token`.
5. SignalR WebSocket không gửi được header → truyền token qua query string: `/community/hubs/community?access_token=<JWT>`.

**Vai trò**: `User` (mặc định) và `Admin` (duyệt báo cáo, xem bài ẩn). Endpoint Admin trả `403` nếu role không đủ.

---

## 4. Rate limiting & lỗi cấp gateway

- Mỗi token (hoặc IP nếu chưa đăng nhập): **300 request/phút** (fixed window). Riêng `/crawler`: **60 request/phút**.
- Vượt hạn mức: HTTP **429 Too Many Requests**.
- Service đích chết/chưa chạy: HTTP **502 Bad Gateway** từ YARP.
- Gateway không có JWT → không chặn 401 thay service; việc xác thực do từng service quyết định (public endpoint vẫn gọi được không cần token).

---

## 5. Identity Service — `/identity`

Đăng ký, đăng nhập, làm mới token, thông tin user, menu & phân quyền.

| Method | Đường dẫn qua gateway | Auth | Mô tả |
|---|---|---|---|
| POST | `/identity/api/v1/Auth/register` | — | Đăng ký tài khoản mới |
| POST | `/identity/api/v1/Auth/login` | — | Đăng nhập → `accessToken`, `refreshToken` |
| POST | `/identity/api/v1/Auth/refresh-token` | — | Làm mới access token |
| POST | `/identity/api/v1/Auth/logout` | Bearer | Đăng xuất (thu hồi token) |
| GET | `/identity/api/v1/Auth/me` | Bearer | Thông tin user hiện tại từ JWT |
| POST | `/identity/api/v1/Auth/change-password` | Bearer | Đổi mật khẩu |
| GET | `/identity/api/v1/Users` | Bearer | Danh sách người dùng |
| GET | `/identity/api/v1/Users/{id}` | Bearer | Chi tiết một người dùng |
| PUT | `/identity/api/v1/Users/{id}` | Bearer | Cập nhật hồ sơ |
| DELETE | `/identity/api/v1/Users/{id}` | Bearer/Admin | Xóa người dùng |
| GET | `/identity/api/v1/Menus/for-user/{userId}` | Bearer | Menu theo quyền của user |
| GET | `/identity/api/v1/Menus/permissions/for-user/{userId}` | Bearer | Danh sách quyền |

**Body mẫu — login:**
```json
{ "userNameOrEmail": "devuser", "password": "Secret123" }
```

---

## 6. Community Service — `/community`

Bài viết, tương tác (like/bookmark/share), bình luận, báo cáo vi phạm.

### 6.1 Bài viết

| Method | Đường dẫn | Auth | Mô tả |
|---|---|---|---|
| GET | `/community/api/Posts?page=1&pageSize=10&search=react&status=1` | Tùy chọn | Bảng tin: phân trang + tìm kiếm + lọc. User chỉ thấy Published; Admin lọc được Hidden/Draft |
| GET | `/community/api/Posts/{id}` | Tùy chọn | Chi tiết bài viết (kèm `isLikedByViewer`/`isBookmarkedByViewer`) |
| POST | `/community/api/Posts` | Bearer | Đăng bài — nội dung qua kiểm duyệt AI, vi phạm → Hidden |
| PUT | `/community/api/Posts/{id}` | Bearer | Sửa bài (chỉ tác giả/Admin) |
| DELETE | `/community/api/Posts/{id}` | Bearer | Soft delete (tác giả/Admin) |
| POST | `/community/api/Posts/{id}/like` | Bearer | Toggle like → `{ isLiked, likesCount }` |
| POST | `/community/api/Posts/{id}/bookmark` | Bearer | Toggle lưu → `{ isBookmarked, bookmarksCount }` |
| GET | `/community/api/Posts/bookmarks/me` | Bearer | Danh sách bài đã lưu của tôi |
| POST | `/community/api/Posts/{id}/share` | Tùy chọn | Chia sẻ (Guest được phép) → tăng `sharesCount`, trả share link |

**Body mẫu — đăng bài:**
```json
{ "content": "Chia sẻ kinh nghiệm học NET microservices..." }
```

### 6.2 Bình luận

| Method | Đường dẫn | Auth | Mô tả |
|---|---|---|---|
| GET | `/community/api/Comment/post/{postId}` | — | Bình luận của một bài (ẩn Deleted/Hidden) |
| POST | `/community/api/Comment` | Bearer | Bình luận/reply — `authorId` lấy từ JWT |
| POST | `/community/api/Comment/{id}/like` | Bearer | Toggle like bình luận |
| DELETE | `/community/api/Comment/{id}` | Bearer | Soft delete (tác giả/Admin) |

**Body mẫu — trả lời bình luận:**
```json
{ "postId": "guid-bai-viet", "content": "Hay quá!", "parentCommentId": "guid-binh-luan-cha" }
```

### 6.3 Báo cáo vi phạm

| Method | Đường dẫn | Auth | Mô tả |
|---|---|---|---|
| POST | `/community/api/PostReports` | Bearer | Báo cáo bài viết — 1 user/1 report Pending/bài |
| GET | `/community/api/PostReports/pending` | Admin | Hàng chờ duyệt (cũ nhất trước) |
| PUT | `/community/api/PostReports/{id}/review` | Admin | Duyệt (`approve: true` → ẩn bài) / từ chối |

**Body mẫu — duyệt báo cáo:**
```json
{ "approve": true, "reviewNote": "Xác nhận spam" }
```

---

## 7. Notification Service — `/notification`

Thông báo realtime + hàng chờ duyệt cho Admin.

| Method | Đường dẫn | Auth | Mô tả |
|---|---|---|---|
| GET | `/notification/api/Notifications/me?page=1&pageSize=20&isRead=false` | Bearer | Thông báo của tôi, mới nhất trước |
| GET | `/notification/api/Notifications/me/unread-count` | Bearer | Badge số chưa đọc |
| PUT | `/notification/api/Notifications/{id}/read` | Bearer | Đánh dấu đã đọc 1 thông báo |
| PUT | `/notification/api/Notifications/read-all` | Bearer | Đọc tất cả |
| GET | `/notification/api/admin/notifications/pending-reports` | Admin | Queue báo cáo chờ duyệt |
| GET | `/notification/api/admin/notifications/pending-count` | Admin | `{ pendingCount, oldestPendingAt }` |

> Endpoint nội bộ `/api/internal/notifications` (X-Api-Key) chỉ dùng service-to-service (CommunityService → NotificationService), **không mở qua gateway**.

---

## 8. SignalR Hubs (realtime)

Kết nối: `new HubConnectionBuilder().withUrl("http://localhost:5000/community/hubs/community?access_token=<JWT>").build()`

| Hub qua gateway | Event client nhận | Ý nghĩa |
|---|---|---|
| `/community/hubs/community` | `post-created`, `post-updated`, `post-deleted`, `post-like-changed`, `post-shared`, `comment-created`, `comment-deleted`, `comment-like-changed`, `post-bookmark-changed` | Feed realtime (group `feed` + `post-{id}`) |
| `/notification/hubs/notifications` | `notification-received` | Thông báo cá nhân (group `user-{id}`) |
| `/notification/hubs/notifications` (role Admin) | `pending-report-received` | Báo cáo mới vào hàng chờ (group `admins`) |

---

## 9. CrawlerGithub Service — `/crawler`

Thu thập & phân tích dữ liệu repository GitHub.

| Method | Đường dẫn | Mô tả |
|---|---|---|
| GET | `/crawler/` | Trang chủ service |
| GET | `/crawler/health` | Trạng thái crawler + MongoDB |
| GET | `/crawler/scheduler/status` | Lịch crawl tự động |
| POST | `/crawler/scheduler/trigger-now` | Kích chạy crawl ngay |
| POST | `/crawler/scheduler/trigger-update-now` | Cập nhật repo hiện có ngay |
| POST | `/crawler/crawl` | Crawl thủ công theo cấu hình |
| POST | `/crawler/repos/update-existing` | Cập nhật dữ liệu repo cũ |
| POST | `/crawler/analytics/repository-health` | Điểm sức khỏe repo |
| POST | `/crawler/analytics/language-health` | Sức khỏe theo ngôn ngữ |
| POST | `/crawler/analytics/trend-analysis` | Phân tích xu hướng |
| GET | `/crawler/analytics/crawl-config` | Xem cấu hình crawl |
| POST | `/crawler/analytics/crawl-config` | Đặt cấu hình crawl |
| POST | `/crawler/analytics/retrain-now` | Huấn luyện lại mô hình |
| POST | `/crawler/analytics/update-repos-now` | Job cập nhật repo |

---

## 10. Quality Service — `/quality`

Kiểm duyệt & chấm điểm nội dung bằng AI (ML models).

| Method | Đường dẫn | Mô tả |
|---|---|---|
| GET | `/quality/api/v1/quality/health` | Trạng thái service |
| POST | `/quality/api/v1/quality/analyze` | Phân tích bài viết: toxicity, chất lượng 0–100 |
| PUT | `/quality/api/v1/quality/relabel` | Sửa nhãn dữ liệu trong MongoDB |
| GET | `/quality/api/v1/quality/results` | Danh sách bài đã phân tích |
| GET | `/quality/api/v1/quality/models` | Trạng thái các mô hình ML |
| GET | `/quality/api/v1/quality/dictionary/status` | Trạng thái từ điển chuẩn hóa |

**Body mẫu — analyze:**
```json
{ "text": "Nội dung bài viết cần kiểm duyệt..." }
```

---

## 11. Mã lỗi chuẩn

| HTTP | Nguồn | Ý nghĩa |
|---|---|---|
| 200 | Service | Thành công |
| 400 | Service | Body/sai tham số (`isSuccess: false`, `message`) |
| 401 | Service | Thiếu/sai JWT |
| 403 | Service | Đủ auth nhưng không đủ quyền (không phải Admin, không phải chủ bài) |
| 404 | Service | Không tìm thấy tài nguyên |
| 409 | Service | Vi phạm ràng buộc (vd: đã report bài này) |
| 429 | **Gateway** | Vượt rate limit 300/phút |
| 500 | Service | Lỗi không xác định |
| 502 | **Gateway (YARP)** | Service đích chết/chưa chạy |

**Response chuẩn của service .NET:**
```json
{ "isSuccess": true, "message": "Success", "data": { }, "code": 1 }
```

---

## 12. Postman

Bộ kiểm thử đầy đủ: `services/GatewayService/postman/DevRadar.postman_collection.json` + `DevRadar.postman_environment.json`.

Cách dùng:
1. Import cả 2 file vào Postman.
2. Chọn environment **DevRadar Local**.
3. Chạy request **Identity → Login** trước — script test tự lưu `accessToken`/`refreshToken` vào biến collection.
4. Chạy tuần tự các thư mục còn lại (Community → Notification → Quality → Crawler) hoặc **Run collection** toàn bộ.
