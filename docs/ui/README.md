# Bộ công cụ xây dựng tài liệu UI/UX — DevRadar

> Nhiệm vụ nguồn: "Dựa vào src code và 2 tài liệu đính kèm (SRS, SDD). Xây dựng prompt và quy trình
> xây dựng các tài liệu UI/UX requirement, User Flow, Information Architecture. Output md/txt."

## Nội dung

| File | Vai trò |
|---|---|
| [PROMPT_UIUX.md](PROMPT_UIUX.md) | Bộ prompt tái sử dụng: **P0** (chạy một lần cả 3 tài liệu), **P1/P2/P3** (từng tài liệu), **P4** (kiểm định) |
| [QUY_TRINH_UIUX.md](QUY_TRINH_UIUX.md) | Quy trình 6 giai đoạn **B0→B6** với input/output/DoD cho từng giai đoạn + bẫy thường gặp |
| [templates/UIUX_Requirements_template.md](templates/UIUX_Requirements_template.md) | Khung tài liệu Yêu cầu UI/UX (SCR-xx, UX-xx, RBAC, traceability) |
| [templates/InformationArchitecture_template.md](templates/InformationArchitecture_template.md) | Khung tài liệu Kiến trúc thông tin (IA-xx, sitemap, điều hướng theo role) |
| [templates/UserFlow_template.md](templates/UserFlow_template.md) | Khung tài liệu Luồng người dùng (FLW-xx, Mermaid + bảng bước, luồng ngang) |
| [extracted/](extracted/) | Text đã trích từ SRS/SDD .docx (SRS_full.txt, SDD_full.txt) — nguồn đọc thay thế khi agent không mở được .docx |
| `working/`, `validation/` | Thư mục làm việc B1 (feature_map.md) và B5 (báo cáo kiểm định) |

## Chạy nhanh (5 lệnh)

1. **B0–B1:** bảo đảm `ai/uiux/extracted/*.txt` có sẵn (đã trích xong).
2. **P1:** sinh `UIUX_Requirements.md` → người duyệt rà theo DoD B2.
3. **P2:** sinh `Information_Architecture.md` → DoD B3.
4. **P3:** sinh `User_Flow.md` → DoD B4.
5. **P4:** sinh `validation/uiux_review_report.md` → sửa lỗi Blocker/Major → B6 đóng băng.

(Chạy nhanh hơn: chỉ dán **P0**, thay `{{OUT_*}}` nếu cần.)

## Chuẩn ID

| Tiền tố | Nghĩa | Nguồn mapping |
|---|---|---|
| SCR-xx | Màn hình | SRS Chương 4 (5 cụm màn hình) |
| UX-xx / UXI-xx | Yêu cầu UI / yêu cầu tương tác | SRS 2.4.1 (UC-01…UC-81) + api_analysis.md |
| IA-xx | Node kiến trúc thông tin | Sitemap, RBAC SRS 4.2, Menus API |
| FLW-xx / FLW-Xx | Luồng người dùng / luồng ngang | SRS Chương 3 (14 tiến trình) + run-tests.ps1 |

## Nguồn chân lý (thứ tự ưu tiên khi mâu thuẫn)

1. Code chạy thật: `docker-compose.yml`, `services/GatewayService/API_Documentation.md`, `ai/source_analysis/api_analysis.md`, Postman collection, `scripts/run-tests.ps1`.
2. Đặc tả nghiệp vụ: `ai/srs/DevRadar_SRS.docx`, `ai/sdd/DevRadar_SDD.docx` (bản trích trong `extracted/`).
3. Catalog: `ai/requirements/*.xlsx`, `ai/traceability/requirement_traceability.xlsx`.

Mâu thuẫn không được "sửa im lặng": gắn `[CONFLICT]` và đưa vào mục **Vấn đề mở**.
