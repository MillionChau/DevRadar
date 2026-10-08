# PROMPT XÂY DỰNG BỘ TÀI LIỆU UI/UX — DEVRADAR

> Mục đích: bộ prompt tái sử dụng để sinh 3 tài liệu **UI/UX Requirements**, **User Flow**, **Information Architecture**
> cho hệ thống DevRadar, dựa trên source code + 2 tài liệu đính kèm (SRS, SDD).
> Cách dùng: xem [QUY_TRINH_UIUX.md](QUY_TRINH_UIUX.md) để biết thứ tự chạy các prompt.

---

## 0. Cách sử dụng

1. Mở phiên làm việc của AI agent **tại thư mục gốc workspace DevRadar** (các đường dẫn dưới đây là đường dẫn tương đối so với gốc repo).
2. Chọn cách chạy:
   - **Cách nhanh:** dán **Prompt chính (P0)** — một prompt duy nhất sinh cả 3 tài liệu theo trình tự.
   - **Cách kiểm soát tốt hơn:** chạy lần lượt **P1 → P2 → P3**, mỗi prompt một tài liệu, xem lại kết quả trước khi chạy prompt kế tiếp.
3. Sau khi sinh xong, chạy **P4 — Prompt kiểm định** để tự đối soát chất lượng (bắt lỗi bịa API, sai quyền, thiếu luồng lỗi).
4. Các biến `{{...}}` trong prompt cần thay trước khi dùng. Nếu không thay, giữ giá trị mặc định đã ghi trong ngoặc.

---

## 1. Prompt chính (P0) — sinh cả 3 tài liệu

```text
# VAI TRÒ
Bạn là Chuyên viên Phân tích Nghiệp vụ & Thiết kế Trải nghiệm (BA + UX Analyst) cho dự án DevRadar.
Bạn viết tài liệu bằng TIẾNG VIỆT, chuẩn mực, dùng cho luận văn tốt nghiệp và tài liệu dự án.
Bạn KHÔNG bịa dữ liệu: mọi endpoint, quyền hạn, trạng thái phải truy nguyên được về nguồn đã cho.

# BỐI CẢNH DỰ ÁN (đã xác thực, dùng làm mốc chuẩn)
- DevRadar: mạng xã hội dành cho developer + phân tích năng lực từ dữ liệu GitHub.
- Kiến trúc: Microservices, mọi request đi qua YARP Gateway (:5000).
  - IdentityService  (.NET 10, :5002, qua gateway /identity) — Auth (JWT + refresh 1-lần-dùng, OAuth GitHub/Google mock), Users, Menus theo role.
  - CommunityService (.NET 10, :5145, /community) — Posts, Comments, Like, Bookmark, Share, PostReports; SignalR hub /hubs/community.
  - NotificationService (.NET 10, :5003, /notification) — thông báo user + hàng chờ duyệt cho admin; SignalR hub /hubs/notifications.
  - CrawlerGithubService (FastAPI, :8000, /crawler) — crawl repo GitHub, scheduler, analytics (repo/language health, trend).
  - QualityService (FastAPI, :8001, /quality) — kiểm duyệt AI: phân tích độ độc hại (toxicity), kết quả lưu Mongo + Elasticsearch.
- Response envelope chuẩn: { isSuccess, message, data, code }. Lỗi JWT 401, hết hạn lượng gọi 429 (gateway rate limit 300 req/phút, crawler 60 req/phút).
- Real-time qua SignalR: sự kiện post-created, post-like-changed, comment-created; notification-received, pending-report-received.
  WebSocket xác thực bằng access token (query ?access_token=).
- Frontend: SPA mới (thư mục frontend/ đang trống; CORS mở cho localhost:3000 và 5173 → React/Vite là lựa chọn mặc định).
- Tác nhân (5): Guest, Member (User), GitHub Developer, Content Moderator, System Administrator.
- RBAC tóm tắt (từ SRS Chương 4): Guest chỉ xem (newsfeed, TechZone, dashboard công khai, bảng xếp hạng, đăng ký/đăng nhập);
  Member + được soạn bài, bình luận, thích, bookmark; Moderator + được duyệt nội dung vi phạm; Admin + được quản trị người dùng, nội dung, TechZone, crawler.

# NHIỆM VỤ
Sinh ĐỦ 3 tài liệu markdown, theo đúng cấu trúc template trong {{THƯ_MỤC_TEMPLATE:ai/uiux/templates/}}:
1. {{OUT_1:ai/uiux/UIUX_Requirements.md}} — Yêu cầu UI/UX (screen inventory + UX-xx).
2. {{OUT_2:ai/uiux/Information_Architecture.md}} — Kiến trúc thông tin (IA-xx, sitemap, điều hướng theo vai trò).
3. {{OUT_3:ai/uiux/User_Flow.md}} — Luồng người dùng (FLW-xx, Mermaid + bảng bước).

# NGUỒN ĐỘC (đọc theo thứ tự ưu tiên; nguồn sau KHÔNG được mâu thuẫn nguồn trước)
1. Ưu tiên cao nhất — Thực tế chạy được:
   - services/GatewayService/API_Documentation.md (danh mục API chuẩn)
   - ai/source_analysis/api_analysis.md (API catalog reverse-engineer từ code)
   - services/GatewayService/postman/DevRadar.postman_collection.json (shape request/response)
   - scripts/run-tests.ps1 (hành trình E2E thật: đăng ký → đăng nhập → đăng bài → thích → bình luận → báo cáo → phân tích → thông báo)
   - docker-compose.yml (topology, port, service nào tồn tại thật)
2. Đặc tả nghiệp vụ:
   - ai/srs/DevRadar_SRS.docx và ai/sdd/DevRadar_SDD.docx (bản trích sẵn: ai/uiux/extracted/SRS_full.txt, SDD_full.txt)
     → lấy: 81 Use Case (UC-01…UC-81) chia 14 nhóm, 5 tác nhân, Ma trận RBAC Chương 4, MoSCoW, mô tả Phần 5 (Thiết kế giao diện).
3. Catalog hỗ trợ: ai/requirements/*.xlsx, ai/traceability/requirement_traceability.xlsx (map FR ↔ UC ↔ API).

# QUY TẮC BẮT BUỘC
1. Chỉ dùng endpoint có trong API_Documentation.md / api_analysis.md. KHÔNG sáng tạo endpoint mới.
   Nếu một chức năng trong SRS chưa có API → ghi trạng thái [PLANNED] và ghi chú "chưa có backend".
2. Gắn thẳng trạng thái nguồn cho từng mục: [IMPLEMENTED] (code có thật) / [PLANNED] (chỉ trong SRS/SDD) / [CONFLICT] (nguồn mâu thuẫn — nêu cả 2 phía, ví dụ SRS ghi AnalyticsService riêng :8001 trong khi thực tế analytics nằm trong CrawlerGithubService :8000).
3. Mọi yêu cầu/hành trình phải truy vết được: UX-xx / FLW-xx / IA-xx ↔ UC-xx (và FR-xx nếu có) ↔ endpoint. Cuối mỗi tài liệu có bảng traceability.
4. Phân quyền: với từng màn hình/hành động phải ghi rõ tác nhân được phép (theo RBAC ở trên). Guest không có hành động ghi.
5. Mỗi màn hình phải có đủ 4 trạng thái: Loading, Empty, Error (map mã lỗi thật: 400/401/403/404/409/429/500), Success.
   Luồng lỗi bắt buộc có: 401 → thử refresh-token → thất bại → về Đăng nhập; 429 → thông báo chờ; nội dung bị AI chấm độc hại cao → trạng thái "chờ duyệt/bị ẩn" kèm thông báo cho tác giả.
6. Real-time: nơi dùng SignalR phải ghi rõ hub, sự kiện lắng nghe và hành vi UI khi nhận sự kiện + khi mất kết nối.
7. Sơ đồ: chỉ dùng Mermaid (flowchart TD/LR, graph) — render được trực tiếp trong markdown, không dùng ảnh nhúng.
8. Đặt tên màn hình gọn, có ID: SCR-01, SCR-02…; nhóm thành 5–7 cụm theo SRS Chương 4 (Xác thực, Bảng tin, Soạn thảo, Tech Dashboard/Analytics, Quản trị, Hồ sơ & Thông báo…).
9. Giọng văn: mô tả, không marketing; mỗi UX-xx là một User Story có tiêu chí nghiệm thu (Given/When/Then) kiểm thử được.
10. Không đổi port, route, tên sự kiện so với "BỐI CẢNH DỰ ÁN". Nếu phát hiện mâu thuẫn mới giữa các nguồn → ghi vào mục "Vấn đề mở" cuối tài liệu, không tự quyết.

# TIÊU CHÍ NGHIỆM THU (tự kiểm trước khi trả kết quả)
- [ ] 3 file tồn tại đúng đường dẫn OUT_1/2/3, markdown hợp lệ, Mermaid render được.
- [ ] Screen inventory bao phủ cả 14 nhóm UC (Guest + Member + Moderator + Admin); không có UC nhóm nào không ánh xạ được màn hình.
- [ ] ≥ 12 luồng FLW bao gồm ít nhất: đăng ký, đăng nhập + OAuth, đăng bài (có nhánh kiểm duyệt AI), bình luận + realtime, bookmark, báo cáo vi phạm → admin xử lý, nhận thông báo realtime, xem Tech Dashboard, quản trị người dùng, quản trị nội dung, quản trị crawler, refresh token/logout.
- [ ] 100% dòng trong bảng traceability có cột UC-xx và endpoint (hoặc ghi rõ [PLANNED]).
- [ ] Không tồn tại endpoint nào ngoài API_Documentation.md / api_analysis.md.
Trả về tóm tắt: số màn hình, số UX-xx, số FLW-xx, số IA-xx, danh sách mục [CONFLICT]/[PLANNED] và "Vấn đề mở".
```

---

## 2. Prompt con P1 — UI/UX Requirements

```text
# VAI TRÒ
Bạn là BA/UX Analyst viết TIẾNG VIỆT cho dự án DevRadar. Bạn không bịa endpoint hay quyền hạn.

# NHIỆM VỤ
Sinh tài liệu {{OUT:ai/uiux/UIUX_Requirements.md}} theo template {{TPL:ai/uiux/templates/UIUX_Requirements_template.md}}.

# NGUỒN ĐỌC
- ai/uiux/working/feature_map.md (nếu có — bản đối soát UC ↔ API ↔ role đã làm ở Giai đoạn B1 của QUY_TRINH_UIUX.md)
- services/GatewayService/API_Documentation.md; ai/source_analysis/api_analysis.md; scripts/run-tests.ps1
- Bản trích SRS/SDD: ai/uiux/extracted/SRS_full.txt, ai/uiux/extracted/SDD_full.txt
  (chú ý: Bảng 81 UC ở SRS 2.4.1; Ma trận tính năng theo nhóm người dùng ở SRS 2.2; RBAC màn hình ở SRS 4.2)

# CẤU TRÚC BẮT BUỘC
1. Thông tin tài liệu + nguồn tham chiếu.
2. Mục tiêu UX & nguyên tắc thiết kế (5–7 nguyên tắc, dẫn chiếu đặc thù DevRadar: độ tin cậy kiểm duyệt AI, cập nhật realtime, minh bạch điểm uy tín).
3. Persona theo 5 tác nhân SRS (mục tiêu, nỗi đau, hành vi chính).
4. Screen inventory: bảng SCR-xx | Tên | Cụm màn hình | Tác nhân | UC liên quan | API chính | Trạng thái [IMPLEMENTED/PLANNED/CONFLICT].
   Phủ đủ 14 nhóm UC; gộp màn hình quản trị thành cụm "Admin Console".
5. Yêu cầu UI chi tiết: mỗi màn hình quan trọng ≥ 1 UX-xx dạng User Story + tiêu chí nghiệm thu Given/When/Then,
   gồm: thành phần UI chính, dữ liệu hiển thị (tên trường thật từ API), hành động, phân quyền, 4 trạng thái màn hình.
6. Yêu cầu tương tác UX: realtime (SignalR), loading/empty/error chuẩn theo envelope { isSuccess, message, data, code },
   xử lý 401→refresh, 429 rate limit, i18n vi-VN, responsive, accessibility cơ bản.
7. Ma trận RBAC màn hình (mở rộng SRS 4.2 xuống mức SCR-xx).
8. Bảng traceability UX-xx ↔ SCR-xx ↔ UC-xx ↔ API.
9. Vấn đề mở (mọi mâu thuẫn nguồn).

# QUY TẮC
- ID: SCR-xx, UX-xx; trạng thái nguồn [IMPLEMENTED]/[PLANNED]/[CONFLICT]; không bịa API; tiếng Việt.
- Dữ liệu hiển thị phải lấy tên trường thật (ví dụ bài viết: title, content (Markdown), upvoteCount, downvoteCount, commentCount, isModerated; người dùng: username, email, githubUsername, reputationScore, isActive).

# NGHIỆM THU
- [ ] ≥ 18 màn hình SCR, phủ 14 nhóm UC; ≥ 25 UX-xx có Given/When/Then.
- [ ] Mọi UX-xx có cột phân quyền + endpoint (hoặc [PLANNED]).
```

---

## 3. Prompt con P2 — Information Architecture

```text
# VAI TRÒ
Bạn là Information Architect viết TIẾNG VIỆT cho SPA DevRadar (React/Vite, thư mục frontend/ còn trống).

# NHIỆM VỤ
Sinh tài liệu {{OUT:ai/uiux/Information_Architecture.md}} theo template {{TPL:ai/uiux/templates/InformationArchitecture_template.md}},
dựa trên {{INPUT:ai/uiux/UIUX_Requirements.md}} (screen inventory từ P1). Nếu chưa có P1, tự dựng screen inventory tối thiểu từ SRS Chương 4.

# NGUỒN ĐỌC BỔ SUNG
- IdentityService có Menus API trả menu theo vai trò (xem ai/source_analysis/api_analysis.md §2.3)
  → IA phải tôn trọng mô hình "menu cấu hình theo role trong DB", không hard-code điều hướng ngược với Menus API.
- SRS 2.4.1 (81 UC) để đảm bảo mọi nhóm chức năng có node IA.

# CẤU TRÚC BẮT BUỘC
1. Nguyên tắc tổ chức thông tin (task-based + role-based; tách khu vực công khai / thành viên / admin console).
2. Sitemap tổng dạng cây (Mermaid flowchart TD) với node có ID IA-xx; ghi chú [PLANNED] cho node chưa có backend.
3. Mô hình điều hướng: top nav/sidebar cho từng vai trò; quy tắc ẩn/hiện theo role; điểm vào Admin Console.
4. Ma trận IA ↔ vai trò (Guest/Member/GitHub Dev/Moderator/Admin) đối chiếu RBAC SRS 4.2.
5. Content inventory mỗi node IA-xx: nội dung chính, nguồn dữ liệu (endpoint hoặc sự kiện SignalR), cập nhật realtime?, trạng thái nguồn.
6. Quy ước URL/route SPA gợi ý (ví dụ /login, /feed, /post/:id, /write, /dashboard, /admin/...) — nói rõ đây là ĐỀ XUẤT, chưa chốt.
7. Bảng traceability IA-xx ↔ SCR-xx ↔ UC-xx.
8. Vấn đề mở.

# QUY TẮC
- ID: IA-xx; sâu tối đa 3 cấp; không để node "misc/other"; mọi node public phải truy nổi được trong ≤ 3 click.
- Không ánh xạ Admin Console vào cùng sidebar người dùng (tách không gian làm việc).

# NGHIỆM THU
- [ ] Sitemap Mermaid render được; mọi node IA-xx có nguồn dữ liệu + vai trò.
- [ ] 14 nhóm UC đều có node tương ứng; không có node mồ côi (không tới được từ nav).
```

---

## 4. Prompt con P3 — User Flow

```text
# VAI TRÒ
Bạn là UX Flow Designer viết TIẾNG VIỆT cho DevRadar.

# NHIỆM VỤ
Sinh tài liệu {{OUT:ai/uiux/User_Flow.md}} theo template {{TPL:ai/uiux/templates/UserFlow_template.md}},
dựa trên {{INPUT_1:ai/uiux/UIUX_Requirements.md}} và {{INPUT_2:ai/uiux/Information_Architecture.md}} (từ P1, P2).

# NGUỒN ĐỌC BỔ SUNG
- scripts/run-tests.ps1: hành trình E2E đã kiểm chứng qua API — dùng làm xương sống luồng hạnh phúc (happy path).
- SRS Chương 3: đặc tả 14 tiến trình cốt lõi (tiền điều kiện/hậu điều kiện) → mỗi tiến trình ít nhất 1 FLW-xx.
- Postman collection: shape request/response thật của từng bước.

# CẤU TRÚC BẮT BUỘC
1. Quy ước ký hiệu: node bắt đầu/kết thúc, hành động người dùng (hình chữ nhật), quyết định (rhombus),
   gọi API (ghi rõ METHOD + path), nhận sự kiện SignalR (ghi rõ hub + sự kiện), trạng thái hệ thống, lưu ý lỗi.
2. Danh mục FLW-xx: mã | tên | tác nhân | UC | màn hình xuất phát (SCR) | độ phức tạp.
3. Chi tiết từng luồng:
   a. Tiền/hậu điều kiện (copy đúng SRS Chương 3).
   b. Sơ đồ Mermaid flowchart TD có nhánh lỗi và nhánh phân quyền.
   c. Bảng bước: # | Hành động UI (SCR-xx) | Hệ thống làm gì (API/Event thật) | Phản hồi UI | Nhánh lỗi.
4. Các luồng ngang (cross-cutting) riêng một mục: 401→refresh→logout; 429 rate limit;
   kiểm duyệt AI (đăng bài → QualityService chấm toxicity → cho phép/ẩn + thông báo tác giả → moderator xử lý);
   realtime notification (SignalR nhận notification-received → cập nhật badge);
   mất kết nối SignalR → reconnect + fallback polling.
5. Ma trận FLW ↔ SCR ↔ UC; Vấn đề mở.

# QUY TẮC
- Không vẽ luồng cho chức năng [PLANNED] như là đã có — ghi nhãn [PLANNED] trên chính node.
- Mỗi luồng phải có ít nhất 2 nhánh lỗi khác nhau; luồng ghi (đăng bài/ bình luận) phải đi qua nhánh kiểm duyệt AI.
- Refresh token chỉ dùng 1 lần — flow đăng xuất/refresh phải phản ánh điều này.

# NGHIỆM THU
- [ ] ≥ 12 FLW, phủ 14 tiến trình SRS Chương 3; 100% luồng có nhánh lỗi; Mermaid render được.
```

---

## 5. Prompt P4 — Kiểm định (reviewer)

```text
# VAI TRÒ
Bạn là Người kiểm định tài liệu (Documentation Reviewer) độc lập cho DevRadar. Bạn không sửa tài liệu, chỉ báo cáo.

# NHIỆM VỤ
Đối soát 3 tài liệu {{FILES:ai/uiux/UIUX_Requirements.md, ai/uiux/Information_Architecture.md, ai/uiux/User_Flow.md}}
với nguồn chuẩn, xuất báo cáo {{OUT:ai/uiux/validation/uiux_review_report.md}}.

# CHECKLIST KIỂM ĐỊNH (báo cáo từng mục PASS/FAIL/N.A. + bằng chứng trích dẫn)
1. Không có endpoint nào nằm ngoài services/GatewayService/API_Documentation.md và ai/source_analysis/api_analysis.md.
2. Port/service khớp docker-compose.yml thật (5000/5002/5145/5003/8000/8001) — cờ nếu tài liệu dùng port SRS lý thuyết (5001/5002/8001/8002).
3. Phân quyền từng SCR/FLW khớp RBAC SRS 4.2; không có hành động ghi cho Guest.
4. Mỗi màn hình có đủ 4 trạng thái; mỗi FLW có ≥ 2 nhánh lỗi; luồng ghi có nhánh kiểm duyệt AI.
5. Traceability đầy đủ, hai chiều (mỗi UC nhóm 14 có ít nhất 1 mục tài liệu trỏ tới; mỗi mục trỏ tới UC có thật trong SRS 2.4.1).
6. Mermaid render được (cú pháp hợp lệ); ID duy nhất (SCR/UX/IA/FLW không trùng, không thiếu số).
7. Mục [CONFLICT] được ghi ở "Vấn đề mở", không bị "sửa im lặng".
8. Nhất quán 3 tài liệu: mọi SCR xuất hiện trong FLW phải có trong inventory; mọi node lá IA phải có SCR tương ứng.

# ĐẦU RA
Bảng tổng hợp PASS/FAIL + danh sách lỗi theo mức nghiêm trọng (Blocker/Major/Minor) + gợi ý vị trí sửa (file + mục).
```

---

## 6. Ghi chú tùy biến

| Biến | Mặc định | Khi nào đổi |
|---|---|---|
| `{{OUT_*}}` | `ai/uiux/*.md` | Khi muốn xuất bản cho frontend team, ví dụ `frontend/docs/` |
| `{{THƯ_MỤC_TEMPLATE}}` | `ai/uiux/templates/` | Nếu đã hiệu chỉnh template theo chuẩn luận văn mới |
| `{{INPUT_*}}` | Kết quả prompt trước | Khi cập nhật 1 tài liệu giữa chừng, trỏ tới bản mới nhất |
| `{{FILES}}` (P4) | 3 file uiux | Thêm file khác cần kiểm định |

- Nếu chạy bằng agent không đọc được .docx, luôn trỏ tới bản trích `ai/uiux/extracted/*.txt`.
- Muốn đưa tài liệu vào file Word luận văn (giống pipeline SRS/SDD trong `ai/scripts/`), chạy tiếp prompt bổ sung: "Chuyển {tên file} sang .docx theo khung tiêu đề của ai/datn_ch2_srs.txt, giữ nguyên bảng và Mermaid→ảnh Kroki" — dùng script mẫu `ai/scripts/build_srs_doc.py` làm tham chiếu.
