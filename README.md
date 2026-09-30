# 🚀 Hướng Dẫn Vận Hành Hệ Thống DevRadar (DevRadar Services Run Guide)

Tài liệu này hướng dẫn chi tiết cách thiết lập, cấu hình và khởi chạy các dịch vụ (Microservices) thuộc hệ thống **DevRadar** trên môi trường Local Development cũng như bằng Docker Compose.

---

## 📐 1. Tổng Quan Kiến Trúc Hệ Thống (System Overview)

Dự án **DevRadar** được xây dựng theo kiến trúc **Microservices** với các thành phần chính:

| Service | Công nghệ (Stack) | Port Mặc Định (Local) | Port (Docker) | Chức năng chính |
| :--- | :--- | :--- | :--- | :--- |
| **CommunityService** | .NET 10 Web API, PostgreSQL | `5145` / `7002` | `5001` | Quản lý bài viết, bình luận, tương tác cộng đồng lập trình viên |
| **QualityService** | Python 3.11, FastAPI, Elasticsearch, Scikit-learn, FastText | `8001` | `8001` | Tự động tiền xử lý, kiểm tra teencode/typo, đánh giá độc hại & tính điểm chất lượng bài viết |
| **CrawlerGithubService** | Python 3.11, FastAPI, MongoDB, APScheduler | `8000` | `8000` | Thu thập dữ liệu repositories, xu hướng công nghệ từ GitHub API / Web |
| **Elasticsearch** | Elasticsearch 8.11.0 | `9200` | `9200` | Tìm kiếm tri thức, làm sạch & xử lý văn bản cho QualityService |
| **IdentityService** *(Đang phát triển)* | .NET 10 Web API | - | `5002` | Xác thực & Phân quyền người dùng (JWT/OAuth2) |
| **NotificationService** *(Đang phát triển)* | .NET 10 Web API | - | `5003` | Gửi thông báo hệ thống, Email, Push Notifications |

---

## 🛠️ 2. Yêu Cầu Tiền Đề (Prerequisites)

Trước khi bắt đầu, hãy đảm bảo máy tính của bạn đã cài đặt các công cụ sau:

- **Git** (để quản lý mã nguồn và submodules)
- **Docker & Docker Compose** (khuyên dùng bản Desktop mới nhất)
- **.NET 10 SDK** (cho các dịch vụ C#/.NET)
- **Python 3.11+** (cho các dịch vụ Python)
- **PostgreSQL 15+** (nếu chạy local `CommunityService` không qua Docker)
- **MongoDB** (nếu chạy local `CrawlerGithubService` không qua Docker)

---

## 📥 3. Clone Mã Nguồn & Cập Nhật Submodules

Hệ thống DevRadar quản lý các dịch vụ theo mô hình Git Submodules. Hãy clone và cập nhật đầy đủ mã nguồn các submodules:

```bash
# Clone dự án kèm theo toàn bộ submodules
git clone --recursive https://github.com/MillionChau/DevRadar.git
cd DevRadar

# Nếu đã clone từ trước nhưng chưa pull các submodules, chạy lệnh:
git submodule update --init --recursive
```

---

## 🐳 4. Phương Pháp 1: Chạy Toàn Bộ Hệ Thống Với Docker Compose (Khuyên Dùng)

Toàn bộ hệ thống (6 service + hạ tầng: PostgreSQL ×3, MongoDB ×2, Elasticsearch) được đóng gói trong **một file `docker-compose.yml` duy nhất** tại thư mục gốc dự án.

| Container | Service | Port host | Ghi chú |
| :--- | :--- | :--- | :--- |
| `devradar-gateway-api` | API Gateway (YARP) | `5000` | Cổng vào duy nhất của hệ thống |
| `devradar-identity-api` | IdentityService | `5002` | PostgreSQL `identity-db` |
| `devradar-community-api` | CommunityService | `5145` | PostgreSQL `community-db` |
| `devradar-notification-api` | NotificationService | `5003` | PostgreSQL `notification-db` |
| `devradar-crawler-api` | CrawlerGithubService | `8000` | MongoDB `crawler-mongo` |
| `devradar-quality-api` | QualityService | `8001` | MongoDB `quality-mongo` + `elasticsearch` |
| `devradar-elasticsearch` | Elasticsearch 8.11 | `9200` | Không mở port ra host (nội bộ) |

### Bước 1: Khởi động các Containers
Tại thư mục gốc dự án (`DevRadar/`), chạy lệnh:

```bash
docker compose up -d --build
```
*(Nếu sử dụng Docker Compose v1, dùng lệnh `docker-compose up -d --build`. Có thể đặt biến `POSTGRES_PASSWORD` và `GITHUB_ACCESS_TOKEN` bằng file `.env` tại thư mục gốc — mặc định mật khẩu Postgres là `123456`.)*

### Bước 2: Kiểm tra trạng thái các Containers
```bash
docker compose ps
```

### Bước 3: Xem Log hệ thống
```bash
# Xem log toàn bộ hệ thống
docker compose logs -f

# Xem log của từng service cụ thể
docker compose logs -f gateway-api
docker compose logs -f identity-api
docker compose logs -f community-api
docker compose logs -f notification-api
docker compose logs -f crawler-api
docker compose logs -f quality-api
```

### Bước 4: Truy cập các Dịch vụ
- **API Gateway (cổng vào chính)**: `http://localhost:5000` — Swagger tổng hợp tại `http://localhost:5000/swagger`
- **IdentityService API**: `http://localhost:5002/swagger` (qua gateway: `http://localhost:5000/identity/swagger`)
- **CommunityService API**: `http://localhost:5145/swagger` (qua gateway: `http://localhost:5000/community/swagger`)
- **NotificationService API**: `http://localhost:5003/swagger` (qua gateway: `http://localhost:5000/notification/swagger`)
- **CrawlerGithubService API (FastAPI Docs)**: `http://localhost:8000/docs` (qua gateway: `http://localhost:5000/crawler/docs`)
- **QualityService API (FastAPI Docs)**: `http://localhost:8001/docs` (qua gateway: `http://localhost:5000/quality/docs`)

### Dừng hệ thống
```bash
# Dừng và xóa containers (giữ dữ liệu trong volumes)
docker compose down

# Dừng và xóa cả dữ liệu (volumes)
docker compose down -v
```

---

## 💻 5. Phương Pháp 2: Chạy Từng Service Riêng Lẻ (Local Development)

Phương pháp này thích hợp khi bạn đang phát triển, debug hoặc viết code cho một service cụ thể.

### 5.1. Chạy CommunityService (.NET 10)

1. **Chuẩn bị Database PostgreSQL**:
   Đảm bảo PostgreSQL đang chạy (mặc định trên port `5433` hoặc chỉnh cấu hình kết nối phù hợp).
   Cơ sở dữ liệu mặc định: `community-postgres`.

2. **Cấu hình chuỗi kết nối (`appsettings.json`)**:
   Mở file [`services/CommunityService/src/Community.API/appsettings.json`](file:///d:/Project/DevRadar/services/CommunityService/src/Community.API/appsettings.json):
   ```json
   "ConnectionStrings": {
     "DefaultConnection": "Server=localhost:5433;Database=community-postgres;User Id=postgres;Password=your_password"
   }
   ```

3. **Chạy Service**:
   ```bash
   cd services/CommunityService/src/Community.API
   dotnet restore
   dotnet run
   ```
   
   - **Swagger UI**: `http://localhost:5145/swagger`

---

### 5.2. Chạy QualityService (Python / FastAPI)

1. **Di chuyển vào thư mục service**:
   ```bash
   cd services/QualityService
   ```

2. **Tạo và kích hoạt môi trường ảo (Virtual Environment)**:
   - Trên **Windows**:
     ```powershell
     python -m venv venv
     .\venv\Scripts\activate
     ```
   - Trên **Linux / macOS**:
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```

3. **Cài đặt thư viện**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Tạo file cấu hình môi trường `.env`**:
   Sao chép file `.env.example` thành `.env` (nếu có) hoặc tạo file `.env` chứa các biến cần thiết:
   ```env
   APP_NAME=QualityService
   APP_ENV=development
   HOST=0.0.0.0
   PORT=8001
   ELASTICSEARCH_ENABLED=true
   ELASTICSEARCH_HOSTS=http://localhost:9200
   ```

5. **Khởi chạy ứng dụng**:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
   ```

6. **Chạy kiểm thử (Unit Tests)**:
   ```bash
   pytest -v
   ```

   - **Swagger Docs**: `http://localhost:8001/docs`
   - **Health Check**: `http://localhost:8001/api/v1/quality/health`

---

### 5.3. Chạy CrawlerGithubService (Python / FastAPI)

1. **Di chuyển vào thư mục service**:
   ```bash
   cd services/CrawlerGithubService
   ```

2. **Tạo và kích hoạt môi trường ảo (Virtual Environment)**:
   - Trên **Windows**:
     ```powershell
     python -m venv venv
     .\venv\Scripts\activate
     ```
   - Trên **Linux / macOS**:
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```

3. **Cài đặt thư viện**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Cấu hình `.env`**:
   Đảm bảo cấu hình biến môi trường MongoDB trong `.env`:
   ```env
   MONGODB_URL=mongodb://localhost:27017/github-crawler
   MONGODB_DB_NAME=github-crawler
   ```

5. **Khởi chạy Web API & Scheduler**:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

6. **Chạy Script Crawler thủ công (tùy chọn)**:
   ```bash
   python run_multi_level_crawler.py
   # Hoặc
   python run_demo_crawler.py
   ```

   - **Swagger Docs**: `http://localhost:8000/docs`

---

## 🛠️ 6. Xử Lý Sự Cố Thường Gặp (Troubleshooting)

### ❓ Thư mục `services/CommunityService` hoặc các service khác bị trống
- **Nguyên nhân**: Chưa tải dữ liệu từ Git Submodules.
- **Khắc phục**: Chạy lệnh `git submodule update --init --recursive` tại thư mục gốc dự án.

### ❓ Gateway trả về 502 khi mới `up`
- **Nguyên nhân**: Các service backend chưa khởi động xong (đặc biệt .NET cần vài chục giây lần đầu).
- **Khắc phục**: Đợi 30–60 giây rồi thử lại; kiểm tra `docker compose ps` và `docker compose logs -f gateway-api`.

### ❓ Lỗi xung đột Port (Port Conflicts)
- **Khắc phục**: Kiểm tra các tiến trình đang chiếm dụng port (`8000`, `8001`, `5001`, `9200`, `5433`). Tắt các ứng dụng đang chạy chiếm port hoặc thay đổi mapping port trong `docker-compose.yml` / `appsettings.json` / `.env`.

### ❓ QualityService không kết nối được Elasticsearch
- **Khắc phục**: Đảm bảo container `devradar-elasticsearch` đang hoạt động ổn định (`docker compose ps`). Có thể chuyển `ELASTICSEARCH_ENABLED=false` trong `.env` của QualityService nếu muốn chạy thử nghiệm không cần Elasticsearch.

---

## 📝 7. Đóng Góp & Phát Triển (Contributing)
Vui lòng đọc hướng dẫn đóng góp mã nguồn và tạo Pull Request theo chuẩn của dự án DevRadar trước khi nộp code lên nhánh `main`.
