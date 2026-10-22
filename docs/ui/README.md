# Bộ tài liệu & Quy trình thiết kế UI/UX — DevRadar

> Căn cứ nguồn: 81 Use Cases từ `ai/srs/DevRadar_SRS.docx`, 47 Sơ đồ UML từ `ai/sdd/DevRadar_SDD.docx`, và Mã nguồn 5 Microservices trong `services/`.  
> Thư mục: `docs/ui/`

---

## 1. Cấu trúc thư mục tài liệu

| Tài liệu | Vai trò | Trạng thái |
|---|---|:---:|
| [QUY_TRINH_UIUX.md](QUY_TRINH_UIUX.md) | Quy trình 7 giai đoạn **B0→B7** chi tiết từ đối soát nguồn đến nghiệm thu và handoff | ✅ Đã hoàn thiện |
| [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) | Hệ thống thiết kế hoàn chỉnh: Color Tokens, Type Scale, 8pt Grid, Components, Accessibility | ✅ Đã hoàn thiện |
| [WIREFRAMES.md](WIREFRAMES.md) | Đặc tả Wireframe không màu: Bố cục lưới, phân cấp thị giác, annotations toàn bộ 22 màn hình | ✅ Đã hoàn thiện |
| [working/feature_map.md](working/feature_map.md) | Bảng bản đồ đối soát 81 Use Cases với Endpoint 5 Microservices, vai trò RBAC & xung đột | ✅ Đã hoàn thiện |
| [UIUX_Requirements.md](UIUX_Requirements.md) | Đặc tả Yêu cầu UI/UX: 5 Personas, Danh mục màn hình SCR-01..22, UX-01..26 Given/When/Then, 4 trạng thái | ✅ Đã hoàn thiện |
| [Information_Architecture.md](Information_Architecture.md) | Kiến trúc thông tin: Sitemap Mermaid, danh mục Node IA-01..18, điều hướng đa vai trò khớp Menus API | ✅ Đã hoàn thiện |
| [User_Flow.md](User_Flow.md) | Luồng người dùng: 14 tiến trình cốt lõi FLW-01..14 (Mermaid) + 4 luồng ngang (Token, 429, AI toxicity, SignalR) | ✅ Đã hoàn thiện |
| [QUY_TRINH_THIET_KE_LUNACY.md](QUY_TRINH_THIET_KE_LUNACY.md) | Hướng dẫn thiết kế đồ họa UI trên **Lunacy** (.free / .sketch), Design System, Artboards và Handoff cho React/Vite | ✅ Đã hoàn thiện |
| [designs/wireframes/](designs/wireframes/) | Bộ file Vector Wireframe Grayscale không màu sẵn sàng mở và kéo thả trong Lunacy | ✅ Đủ 22 Artboards SVG (SCR-01..22) |
| [designs/SCR-04_Newsfeed_Mockup.svg](designs/SCR-04_Newsfeed_Mockup.svg) | File mẫu Hi-Fi Vector Artboard màu Dark Theme chuẩn mở trong Lunacy | ✅ Đã hoàn thiện |
| [PROMPT_UIUX.md](PROMPT_UIUX.md) | Bộ prompt tái sử dụng để sinh/cập nhật tài liệu UI/UX bằng AI Agent | ✅ Sẵn sàng |
| [templates/](templates/) | Thư mục mẫu khung chuẩn Markdown cho các tài liệu UI/UX | ✅ Sẵn sàng |
| [extracted/](extracted/) | Dữ liệu văn bản đã trích xuất từ `DevRadar_SRS.docx` và `DevRadar_SDD.docx` | ✅ Sẵn sàng |

---

## 2. Danh mục File Wireframe không màu cho Lunacy (Đủ 22 Grayscale Vector Files)

Tất cả các file nằm trong thư mục [`docs/ui/designs/wireframes/`](designs/wireframes/):
1. **SCR-01**: [`SCR-01_Auth_Wireframe_Grayscale.svg`](designs/wireframes/SCR-01_Auth_Wireframe_Grayscale.svg) — Đăng nhập hệ thống (Centered 480px).
2. **SCR-02**: [`SCR-02_Register_Wireframe_Grayscale.svg`](designs/wireframes/SCR-02_Register_Wireframe_Grayscale.svg) — Đăng ký tài khoản (4 trường form + Social + Terms).
3. **SCR-03**: [`SCR-03_ForgotPassword_Wireframe_Grayscale.svg`](designs/wireframes/SCR-03_ForgotPassword_Wireframe_Grayscale.svg) — Khôi phục mật khẩu & nhận OTP xác thực.
4. **SCR-04**: [`SCR-04_Newsfeed_Wireframe_Grayscale.svg`](designs/wireframes/SCR-04_Newsfeed_Wireframe_Grayscale.svg) — Bảng tin chính 3 cột kèm tiện ích Biểu đồ Phân hóa Sức khỏe Ngôn ngữ & Framework.
5. **SCR-05**: [`SCR-05_PostDetail_Wireframe_Grayscale.svg`](designs/wireframes/SCR-05_PostDetail_Wireframe_Grayscale.svg) — Chi tiết bài viết Markdown & Bình luận lồng nhau.
6. **SCR-06**: [`SCR-06_TechZones_Wireframe_Grayscale.svg`](designs/wireframes/SCR-06_TechZones_Wireframe_Grayscale.svg) — Lưới thẻ chuyên mục TechZone & nút theo dõi.
7. **SCR-07**: [`SCR-07_Leaderboard_Wireframe_Grayscale.svg`](designs/wireframes/SCR-07_Leaderboard_Wireframe_Grayscale.svg) — Bảng xếp hạng Developers với bục Top 1-2-3 podium.
8. **SCR-08**: [`SCR-08_Editor_Wireframe_Grayscale.svg`](designs/wireframes/SCR-08_Editor_Wireframe_Grayscale.svg) — Soạn thảo Markdown chia 2 cột (Editor & Live Preview).
9. **SCR-09**: [`SCR-09_PostEdit_Wireframe_Grayscale.svg`](designs/wireframes/SCR-09_PostEdit_Wireframe_Grayscale.svg) — Chỉnh sửa bài viết đã xuất bản kèm tự động lưu nháp.
10. **SCR-10**: [`SCR-10_TechDashboard_Radar_Wireframe_Grayscale.svg`](designs/wireframes/SCR-10_TechDashboard_Radar_Wireframe_Grayscale.svg) — Tech Dashboard, Radar lớn 5 trục và bảng Repo Health.
11. **SCR-11**: [`SCR-11_RepoHealth_Wireframe_Grayscale.svg`](designs/wireframes/SCR-11_RepoHealth_Wireframe_Grayscale.svg) — Tra cứu chuyên sâu sức khỏe Repository GitHub (A+ 94/100).
12. **SCR-12**: [`SCR-12_TechCompare_Wireframe_Grayscale.svg`](designs/wireframes/SCR-12_TechCompare_Wireframe_Grayscale.svg) — So sánh đối đầu công nghệ với Dual Radar chart.
13. **SCR-13**: [`SCR-13_AnalyticsReports_Wireframe_Grayscale.svg`](designs/wireframes/SCR-13_AnalyticsReports_Wireframe_Grayscale.svg) — Danh mục báo cáo phân tích xu hướng công nghệ (Tải PDF).
14. **SCR-14**: [`SCR-14_UserProfile_Wireframe_Grayscale.svg`](designs/wireframes/SCR-14_UserProfile_Wireframe_Grayscale.svg) — Hồ sơ cá nhân lập trình viên kèm Radar năng lực.
15. **SCR-15**: [`SCR-15_PublicProfile_Wireframe_Grayscale.svg`](designs/wireframes/SCR-15_PublicProfile_Wireframe_Grayscale.svg) — Hồ sơ thành viên công khai (Nút Theo dõi, Ghim repo).
16. **SCR-16**: [`SCR-16_Bookmarks_Wireframe_Grayscale.svg`](designs/wireframes/SCR-16_Bookmarks_Wireframe_Grayscale.svg) — Bộ sưu tập lưu trữ bài viết & nút Bỏ lưu.
17. **SCR-17**: [`SCR-17_Notifications_Wireframe_Grayscale.svg`](designs/wireframes/SCR-17_Notifications_Wireframe_Grayscale.svg) — Trung tâm thông báo tương tác thời gian thực.
18. **SCR-18**: [`SCR-18_AdminUsers_Wireframe_Grayscale.svg`](designs/wireframes/SCR-18_AdminUsers_Wireframe_Grayscale.svg) — Quản lý tài khoản Admin, phân quyền Role RBAC.
19. **SCR-19**: [`SCR-19_AdminPosts_Wireframe_Grayscale.svg`](designs/wireframes/SCR-19_AdminPosts_Wireframe_Grayscale.svg) — Quản lý bài viết toàn hệ thống, duyệt bài vi phạm AI Toxicity.
20. **SCR-20**: [`SCR-20_AdminReports_Wireframe_Grayscale.svg`](designs/wireframes/SCR-20_AdminReports_Wireframe_Grayscale.svg) — Hàng chờ kiểm duyệt AI Toxicity HuggingFace & báo cáo vi phạm.
21. **SCR-21**: [`SCR-21_AdminTechZones_Wireframe_Grayscale.svg`](designs/wireframes/SCR-21_AdminTechZones_Wireframe_Grayscale.svg) — Quản trị danh mục TechZones, cấu hình Slug & ánh xạ Tags.
22. **SCR-22**: [`SCR-22_AdminCrawler_Wireframe_Grayscale.svg`](designs/wireframes/SCR-22_AdminCrawler_Wireframe_Grayscale.svg) — Giám sát tiến trình GitHub Crawler Engine & lịch sử jobs.

---

## 3. Chuẩn mã định danh (ID Conventions)

| Tiền tố | Ý nghĩa | Căn cứ ánh xạ |
|---|---|---|
| **SCR-xx** | Màn hình giao diện (Screens) | SRS Chương 4 (6 cụm màn hình: A đến F) |
| **UX-xx** | Yêu cầu trải nghiệm (User Stories & Acceptance Criteria) | SRS 2.4.1 (UC-01…UC-81) + `API_Documentation.md` |
| **IA-xx** | Node kiến trúc thông tin (Navigation & Sitemap Nodes) | Sitemap, RBAC SRS 4.2, Identity Menus API |
| **FLW-xx** | Luồng người dùng nghiệp vụ (Core User Flows) | SRS Chương 3 (14 tiến trình) + SDD 14 Activity/Sequence diagrams |
| **FLW-Xx** | Luồng ngang kỹ thuật (Cross-cutting Flows) | Cơ chế Refresh Token, Rate Limit 429, SignalR Reconnect, AI Toxicity |

---

## 4. Thứ tự nguồn chân lý khi có xung đột (Hierarchy of Truth)

1. **Code thực tế đang chạy**: `docker-compose.yml`, `services/GatewayService/API_Documentation.md`, code controller trong `services/`, Postman collection.
2. **Đặc tả nghiệp vụ chuẩn đồ án**: `ai/srs/DevRadar_SRS.docx`, `ai/sdd/DevRadar_SDD.docx` (bản trích trong `extracted/`).
3. **Traceability Catalog**: `ai/traceability/requirement_traceability.xlsx`.
