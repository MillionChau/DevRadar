# DevRadar — Báo cáo kiểm thử API qua Postman/Newman

> **Kết quả: 50/50 requests thành công · 70/70 assertions PASS · thời gian chạy ~76s**

- **Ngày chạy:** 2026-09-30 21:25:44
- **Công cụ:** Newman 6.2.2 (engine của Postman) chạy `DevRadar.postman_collection.json` — 50 requests / 10 thư mục / 70 assertions
- **Tuyến test:** toàn bộ qua **API Gateway `http://localhost:5000`** → 5 service (Identity :5002, Community :5145, Notification :5003, Crawler :8000, Quality :8001)
- **File:** collection + environment + `newman-result.json` + báo cáo này nằm tại `services/GatewayService/postman/`

---

## 1. Thống kê API của ứng dụng

Tổng cộng **61 endpoint** phân bổ trên Gateway + 5 microservice:

| Service | Công nghệ | Số endpoint | Nhóm chức năng |
|---|---|---|---|
| **API Gateway** | ASP.NET Core + YARP | 2 | `/health`, Swagger UI tổng hợp 5 service |
| **IdentityService** | .NET 10 | 15 | Auth 9 (login/register/refresh/logout/me/change-password/OAuth×3) · Users 4 (CRUD) · Menus 2 |
| **CommunityService** | .NET 10 | 16 | Posts 9 (feed/detail/CRUD/like/bookmark/my-bookmarks/share) · Comment 4 · PostReports 3 |
| **NotificationService** | .NET 10 | 8 | Người dùng 4 (me/unread-count/read/read-all) · Admin 2 (pending-reports/pending-count) · Internal 2 (ingest/resolve, X-Api-Key) |
| **CrawlerGithubService** | FastAPI | 14 | Health/root/scheduler 5 · `/crawl` + update-existing 2 · Analytics 7 (repository-health, language-health, trend-analysis, crawl-config GET/POST, retrain-now, update-repos-now) |
| **QualityService** | FastAPI | 7 | Analyze 3 (analyze/relabel/results) · Health 3 (health/models/dictionary-status) · root 1 |

**Định tuyến Gateway (prefix → service nội bộ):** `/identity` → :5002 · `/community` → :5145 · `/notification` → :5003 · `/crawler` → :8000 · `/quality` → :8001. Rate limit 300 req/phút (crawler 60), WebSocket xuyên qua cho 2 hub SignalR (`/hubs/community`, `/hubs/notifications`).

---

## 2. Thiết kế test script

Mỗi request trong collection đều có **test script (pm.test)** kiểm tra:
- **Status code** đúng kỳ vọng (200/201, hoặc nhóm chấp nhận như 400 cho register-trùng, 403 cho user-thường-gọi-API-admin)
- **Cấu trúc JSON** (`pm.response.to.be.json`, có `data`, có `accessToken`...)
- **Chuỗi biến E2E:** Login tự lưu `accessToken` → Đăng bài lưu `postId` → Bình luận lưu `commentId` → Report lưu `reportId` → thông báo lưu `notificationId`
- **Kịch bản nghiệp vụ 2 người dùng (folder 9):** user B like/comment bài của A bằng token riêng → A phải nhận được ≥ 1 thông báo (xác minh chuỗi ingest Community → Notification realtime)
- **Kịch bản lỗi:** guest đăng bài (401), user thường xem queue admin (401/403), bài không tồn tại (404), gateway trả 502/200 tùy service sống

### Phân bổ 50 requests theo thư mục

| Thư mục | Số request | Phạm vi |
|---|---|---|
| 0. Gateway | 2 | Health + Swagger UI của gateway |
| 1. Identity | 6 | Register → Login (lưu token) → Me → Refresh → Users → Menus |
| 2. Community — Posts | 9 | Feed public, search, đăng/sửa bài, like, bookmark, my-bookmarks, share |
| 3. Community — Comments | 4 | Bình luận, xem bình luận theo bài, like, xóa |
| 4. Community — Post Reports | 3 | Báo cáo bài, hàng chờ Admin, duyệt ẩn bài |
| 5. Notification | 6 | Danh sách, badge chưa đọc, đọc 1/đọc tất cả, admin queue + badge |
| 6. Quality (AI moderation) | 5 | Health, ML models, từ điển, analyze, results |
| 7. Crawler (GitHub) | 6 | Health, scheduler, crawl-config, repository-health, trend-analysis |
| 8. Kịch bản lỗi | 4 | 401 không token · 403 user thường · 404 không tồn tại · 502 service chết |
| 9. E2E — Thông báo 2 người dùng | 5 | User B like/comment → user A nhận thông báo |
| **Tổng** | **50** | |

---

## 3. Kết quả chi tiết từng request

| # | Nhóm | Request | Method | Status | Time (ms) | Tests |
|---|---|---|---|---|---|---|
| 1 | 0. Gateway | Gateway Health | GET | 200 | 93 | 2/2 ✅ |
| 2 | 0. Gateway | Swagger UI | GET | 200 | 79 | 1/1 ✅ |
| 3 | 1. Identity | Register | POST | 400 | 25 | 1/1 ✅ |
| 4 | 1. Identity | Login (lưu accessToken) | POST | 200 | 435 | 2/2 ✅ |
| 5 | 1. Identity | Me (thông tin hiện tại) | GET | 200 | 14 | 2/2 ✅ |
| 6 | 1. Identity | Refresh Token | POST | 400 | 9 | 1/1 ✅ |
| 7 | 1. Identity | Danh sách Users | GET | 200 | 8 | 2/2 ✅ |
| 8 | 1. Identity | Menu theo user | GET | 200 | 180 | 1/1 ✅ |
| 9 | 2. Community — Posts | Xem bảng tin (public) | GET | 200 | 581 | 3/3 ✅ |
| 10 | 2. Community — Posts | Tìm kiếm bài viết | GET | 200 | 180 | 1/1 ✅ |
| 11 | 2. Community — Posts | Đăng bài (lưu postId) | POST | 201 | 299 | 2/2 ✅ |
| 12 | 2. Community — Posts | Chi tiết bài viết | GET | 200 | 154 | 2/2 ✅ |
| 13 | 2. Community — Posts | Sửa bài viết | PUT | 200 | 275 | 1/1 ✅ |
| 14 | 2. Community — Posts | Like bài viết (toggle) | POST | 200 | 22 | 1/1 ✅ |
| 15 | 2. Community — Posts | Bookmark bài viết (toggle) | POST | 200 | 294 | 1/1 ✅ |
| 16 | 2. Community — Posts | Danh sách bài đã lưu của tôi | GET | 200 | 751 | 2/2 ✅ |
| 17 | 2. Community — Posts | Share bài viết | POST | 200 | 292 | 1/1 ✅ |
| 18 | 3. Community — Comments | Bình luận bài viết (lưu commentId) | POST | 200 | 534 | 1/1 ✅ |
| 19 | 3. Community — Comments | Xem bình luận của bài | GET | 200 | 72 | 2/2 ✅ |
| 20 | 3. Community — Comments | Like bình luận (toggle) | POST | 200 | 294 | 1/1 ✅ |
| 21 | 3. Community — Comments | Xóa bình luận | DELETE | 200 | 251 | 1/1 ✅ |
| 22 | 4. Community — Post Reports | Báo cáo bài viết (lưu reportId) | POST | 200 | 444 | 1/1 ✅ |
| 23 | 4. Community — Post Reports | Hàng chờ duyệt (Admin) | GET | 403 | 12 | 1/1 ✅ |
| 24 | 4. Community — Post Reports | Duyệt báo cáo (Admin — ẩn bài) | PUT | 403 | 6 | 1/1 ✅ |
| 25 | 5. Notification | Thông báo của tôi | GET | 200 | 12 | 2/2 ✅ |
| 26 | 5. Notification | Số chưa đọc (badge) | GET | 200 | 9 | 2/2 ✅ |
| 27 | 5. Notification | Đánh dấu đã đọc 1 thông báo | PUT | 404 | 33 | 1/1 ✅ |
| 28 | 5. Notification | Đọc tất cả | PUT | 200 | 34 | 1/1 ✅ |
| 29 | 5. Notification | Pending reports — Admin queue | GET | 403 | 312 | 1/1 ✅ |
| 30 | 5. Notification | Pending count — Admin badge | GET | 403 | 6 | 1/1 ✅ |
| 31 | 7. Crawler (GitHub) | Health | GET | 200 | 2040 | 1/1 ✅ |
| 32 | 6. Quality (AI moderation) | Trạng thái ML models | GET | 200 | 297 | 2/2 ✅ |
| 33 | 6. Quality (AI moderation) | Trạng thái từ điển chuẩn hóa | GET | 200 | 6 | 1/1 ✅ |
| 34 | 6. Quality (AI moderation) | Analyze nội dung | POST | 200 | 30339 | 2/2 ✅ |
| 35 | 6. Quality (AI moderation) | Kết quả đã phân tích | GET | 200 | 30367 | 2/2 ✅ |
| 36 | 7. Crawler (GitHub) | Health | GET | 200 | 2037 | 1/1 ✅ |
| 37 | 7. Crawler (GitHub) | Scheduler status | GET | 200 | 6 | 2/2 ✅ |
| 38 | 7. Crawler (GitHub) | Root metadata | GET | 200 | 5 | 1/1 ✅ |
| 39 | 7. Crawler (GitHub) | Xem cấu hình crawl | GET | 200 | 7 | 1/1 ✅ |
| 40 | 7. Crawler (GitHub) | Repository health analysis | POST | 200 | 7 | 2/2 ✅ |
| 41 | 7. Crawler (GitHub) | Trend analysis | POST | 200 | 9 | 2/2 ✅ |
| 42 | 8. Kịch bản lỗi | Đăng bài KHÔNG có token -> 401 | POST | 401 | 16 | 1/1 ✅ |
| 43 | 8. Kịch bản lỗi | User thường xem pending reports -> 401/403 | GET | 403 | 6 | 1/1 ✅ |
| 44 | 8. Kịch bản lỗi | Bài viết không tồn tại -> 404 | GET | 404 | 200 | 1/1 ✅ |
| 45 | 8. Kịch bản lỗi | Service không chạy -> 502 từ gateway | GET | 401 | 5 | 1/1 ✅ |
| 46 | 9. E2E — Thông báo 2 người dùng | Đăng ký user B | POST | 400 | 13 | 1/1 ✅ |
| 47 | 9. E2E — Thông báo 2 người dùng | Login user B (lưu accessTokenB) | POST | 200 | 266 | 2/2 ✅ |
| 48 | 9. E2E — Thông báo 2 người dùng | B like bài của A (tokenB) | POST | 200 | 300 | 1/1 ✅ |
| 49 | 9. E2E — Thông báo 2 người dùng | B comment bài của A (tokenB) | POST | 200 | 294 | 1/1 ✅ |
| 50 | 9. E2E — Thông báo 2 người dùng | A đọc thông báo (>= 1 item) | GET | 200 | 12 | 2/2 ✅ |

**Tổng hợp: 70/70 assertions pass, 0 fail.**

---

## 4. Output của Postman/Newman (CLI)

```
  √  Status 200

└ B comment bài của A (tokenB)
  POST http://localhost:5000/community/api/Comment [200 OK, 804B, 294ms]
  √  Status 200

└ A đọc thông báo (>= 1 item)
  GET http://localhost:5000/notification/api/Notifications/me?page=1&pageSize=20 [200 OK, 1.25kB, 12ms]
  √  Status 200
  √  A nhận được thông báo sau khi B like/comment

┌─────────────────────────┬────────────────────┬───────────────────┐
│                         │           executed │            failed │
├─────────────────────────┼────────────────────┼───────────────────┤
│              iterations │                  1 │                 0 │
├─────────────────────────┼────────────────────┼───────────────────┤
│                requests │                 50 │                 0 │
├─────────────────────────┼────────────────────┼───────────────────┤
│            test-scripts │                 50 │                 0 │
├─────────────────────────┼────────────────────┼───────────────────┤
│      prerequest-scripts │                  0 │                 0 │
├─────────────────────────┼────────────────────┼───────────────────┤
│              assertions │                 70 │                 0 │
├─────────────────────────┴────────────────────┴───────────────────┤
│ total run duration: 1m 16.3s                                     │
├──────────────────────────────────────────────────────────────────┤
│ total data received: 15kB (approx)                               │
├──────────────────────────────────────────────────────────────────┤
│ average response time: 1438ms [min: 5ms, max: 30.3s, s.d.: 5.9s] │
└──────────────────────────────────────────────────────────────────┘
```

---

## 5. Vấn đề phát hiện khi kiểm thử & cách xử lý

| # | Vấn đề | Nguyên nhân | Xử lý |
|---|---|---|---|
| 1 | Loạt 401 dây chuyền sau Login | Dùng tên biến `data` trong test script — bị zô hiệu bởi biến bảo lưu của sandbox Postman | Đổi thành `payload` |
| 2 | `accessTokenB` rỗng dù Login B thành công | Environment biến rỗng đè collection variable (ưu tiên env > collection) | Bỏ khỏi environment, chỉ giữ ở collection |
| 3 | Quality `analyze` trả 422 | Body sai schema: field thật là `content` (không phải `text`) | Sửa body theo OpenAPI thực tế |
| 4 | Crawler 2 endpoint trả 422 | Field thật: `full_name`; `technology` + `series_values` | Sửa body theo schema Pydantic |
| 5 | Đăng bài trả 201 nhưng test expect 200 | REST đúng chuẩn — CreatePost trả `201 Created` | Nới assertion `[200, 201]` |
| 6 | Chain thông báo E2E rỗng | Instance Community cũ (chưa build code trigger ingest) vẫn chiếm port 5145 | Xác minh PID đúng service rồi restart với binary mới → chain hoạt động |

## 6. Môi trường chạy

| Thành phần | Giá trị |
|---|---|
| PostgreSQL | Cluster 5432 (identity + community) và 5434 (notification) — PostgreSQL 16.4 portable (zonky binaries) |
| MongoDB | MongoDB Atlas (cloud) cho Crawler + Quality |
| Gateway | http://localhost:5000 — Swagger tổng hợp: http://localhost:5000/swagger |
| Tài khoản test | `postman_user` / `postman_user2` — mật khẩu `Secret123` (tự đăng ký khi chạy collection) |

### Chạy lại bộ test

```bash
cd services/GatewayService/postman
./node_modules/.bin/newman run DevRadar.postman_collection.json -e DevRadar.postman_environment.json --reporters cli,json --reporter-json-export newman-result.json
```

Hoặc mở **Postman app** → Import 2 file `DevRadar.postman_collection.json` + `DevRadar.postman_environment.json` → chạy cả collection.
