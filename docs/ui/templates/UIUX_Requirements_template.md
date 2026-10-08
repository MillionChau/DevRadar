# TÀI LIỆU YÊU CẦU UI/UX — DEVRADAR (UI/UX REQUIREMENTS)

> Template đi kèm [QUY_TRINH_UIUX.md](../QUY_TRINH_UIUX.md) — sinh tự động bằng Prompt P1.
> Quy ước: giữ nguyên tiêu đề mục; thay nội dung `<...>`; ID theo dạng SCR-xx, UX-xx; gắn thẻ [IMPLEMENTED] / [PLANNED] / [CONFLICT].

---

## 1. Thông tin tài liệu

| Mục | Giá trị |
|---|---|
| Tài liệu | Yêu cầu Giao diện & Trải nghiệm người dùng (UI/UX Requirements) |
| Hệ thống | DevRadar — Mạng xã hội developer & Phân tích năng lực từ GitHub |
| Phiên bản | 1.0 |
| Ngày | <YYYY-MM-DD> |
| Tác giả / Người duyệt | <tên> / <tên> |
| Phiên bản nguồn | Repo @<commit>; SRS v2.0 (05/10/2026); SDD v2.0 (05/10/2026) |
| Tài liệu liên quan | SRS 2.4.1 (81 UC), SRS 4.2 (RBAC), API_Documentation.md |

## 2. Mục tiêu UX và nguyên tắc thiết kế

- **Mục tiêu tổng thể:** <VD: giúp developer chia sẻ kiến thức được kiểm duyệt lành mạnh và chứng minh năng lực bằng dữ liệu GitHub thật>
- Nguyên tắc 1 — <VD: Minh bạch kiểm duyệt: mọi nội dung bị ẩn/duyệt phải cho tác giả thấy trạng thái và lý do>
- Nguyên tắc 2 — <VD: Cập nhật tức thời: tương tác và thông báo qua SignalR, không cần F5>
- Nguyên tắc 3 — <VD: Điểm uy tín giải thích được (reputationScore hiển thị cùng nguồn gốc)>
- <bổ sung theo dự án>

## 3. Persona (theo 5 tác nhân SRS 2.3)

| ID | Persona | Mục tiêu chính | Nỗi đau | Hành vi chính | UC tiêu biểu |
|---|---|---|---|---|---|
| P1 | Khách (Guest) | Tìm tài liệu kỹ thuật, đánh giá nền tảng | Không đăng nhập, không tương tác | Duyệt bảng tin, tìm kiếm, xem dashboard | UC-10…14, UC-31…36, UC-40 |
| P2 | Thành viên (Member) | Chia sẻ kiến thức, xây uy tín | Bài bị ẩn không rõ lý do | Đăng bài, bình luận, thích, bookmark | UC-08, UC-15…27 |
| P3 | GitHub Developer | Chứng minh năng lực qua repo | <...> | Liên kết GitHub, xem Radar | UC-31…34 |
| P4 | Kiểm duyệt viên (Moderator) | Xử lý vi phạm nhanh | <...> | Duyệt báo cáo, nội dung toxicity cao | UC-62, UC-63 |
| P5 | Quản trị viên (Admin) | Vận hành hệ thống | <...> | Quản lý người dùng, nội dung, TechZone, crawler | UC-47…81 |

## 4. Screen inventory (danh mục màn hình)

> Cụm màn hình theo SRS Chương 4: A — Xác thực; B — Bảng tin & Khám phá; C — Soạn thảo; D — Tech Dashboard/Analytics; E — Hồ sơ & Thông báo; F — Quản trị (Admin Console).

| ID | Tên màn hình | Cụm | Tác nhân | UC liên quan | API chính | Trạng thái |
|---|---|---|---|---|---|---|
| SCR-01 | Đăng nhập | A | Guest | UC-02 | POST /identity/api/v1/Auth/login | [IMPLEMENTED] |
| SCR-02 | Đăng ký | A | Guest | UC-01 | POST /identity/api/v1/Auth/register | [IMPLEMENTED] |
| SCR-03 | Bảng tin (Newsfeed) | B | Guest, Member… | UC-10…13 | GET /community/api/Posts | [IMPLEMENTED] |
| <...> | | | | | | |

## 5. Yêu cầu UI chi tiết (UX-xx)

> Mỗi màn hình quan trọng ít nhất 1 UX-xx. Dạng bắt buộc: User Story + tiêu chí nghiệm thu Given/When/Then.

### UX-01 <Tên yêu cầu> — SCR-03 [IMPLEMENTED]

| Mục | Nội dung |
|---|---|
| User Story | Là **thành viên**, tôi muốn **lọc bảng tin theo tag/thời gian** để **tìm bài đúng chủ đề tôi quan tâm**. |
| Thành phần UI | <search bar, bộ lọc chip tag, danh sách card bài viết, phân trang> |
| Dữ liệu hiển thị | <tên trường thật: title, authorName, upvoteCount, commentCount, createdAt…> |
| Phân quyền | Guest: chỉ xem; Member trở lên: + hành động ghi |
| Endpoint | GET /community/api/Posts (filter, sort, page) |
| Trạng thái màn hình | Loading: skeleton; Empty: "Chưa có bài viết phù hợp"; Error: 400/429/500 theo envelope; Success: danh sách |
| UC / FR | UC-12, UC-13 / FR-<xx> |

**Tiêu chí nghiệm thu**
- Given tôi ở bảng tin, When tôi nhập từ khoá rồi Enter, Then danh sách chỉ còn bài khớp tiêu đề/nội dung và URL cập nhật query `search=`.
- Given kết quả rỗng, When hệ thống trả 200 với danh sách trống, Then hiển thị empty state kèm nút "Xoá bộ lọc".
- Given tôi gọi quá 300 request/phút, When nhận 429, Then hiện thông báo "Vui lòng thử lại sau ít phút" và nút thử lại.

### UX-02 <...> — SCR-<xx> [<trạng thái>]
<copied structure>

## 6. Yêu cầu tương tác UX (bắt buộc toàn hệ thống)

| ID | Yêu cầu | Chi tiết | Nguồn ràng buộc |
|---|---|---|---|
| UXI-01 | Định dạng lỗi chuẩn | Toast/banner theo envelope {isSuccess, message, code}; ánh xạ 400/401/403/404/409/429/500 | API_Documentation.md |
| UXI-02 | Hết hạn phiên | 401 → thử POST refresh-token → fail → về SCR-01 | Refresh token 1 lần dùng |
| UXI-03 | Realtime | Đăng ký hub /hubs/community (post-created, post-like-changed, comment-created) và /hubs/notifications (notification-received); badge unread realtime | NotificationService |
| UXI-04 | Mất kết nối SignalR | Tự reconnect + fallback làm mới thủ công | Hạ tầng |
| UXI-05 | Rate limit | 429 hiển thị chờ, không spam retry | Gateway 300/phút |
| UXI-06 | Kiểm duyệt AI | Nội dung đăng xong hiện "Đang kiểm duyệt"; nếu toxicity cao → trạng thái ẩn + thông báo cho tác giả | QualityService |
| UXI-07 | i18n & responsive | Tiếng Việt mặc định, breakpoint mobile/tablet/desktop | CORS SPA 3000/5173 |
| UXI-08 | Accessibility cơ bản | contrast, focus visible, alt ảnh | <chuẩn chọn> |

## 7. Ma trận RBAC màn hình

| SCR | Guest | Member | GitHub Dev | Moderator | Admin |
|---|---|---|---|---|---|
| SCR-03 Bảng tin | Xem | Xem + tương tác | Xem + tương tác | Xem + tương tác | Toàn quyền |
| SCR-<xx> Admin Console | — | — | — | Duyệt nội dung | Toàn quyền |
| <...> | | | | | |

## 8. Traceability

| UX-xx | SCR-xx | UC-xx | FR-xx | API | Ghi chú |
|---|---|---|---|---|---|
| UX-01 | SCR-03 | UC-12, UC-13 | FR-<xx> | GET /community/api/Posts | |

## 9. Vấn đề mở (Open Issues)

| # | Vấn đề | Phát hiện từ | Ảnh hưởng | Trạng thái |
|---|---|---|---|---|
| 1 | <VD: SRS ghi AnalyticsService :8001 riêng nhưng thực tế analytics thuộc CrawlerGithubService :8000> | B1 | Đặt tên cụm D | [CONFLICT] — chờ chủ dự án |
