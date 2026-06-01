# 🚀 Hướng Dẫn Thiết Lập Môi Trường Nhà Phát Triển Mới (Developer Setup Guide)

**Dành cho**: Thành viên mới gia nhập đội ngũ phát triển nền tảng Cloud Lab.  
**Mục tiêu**: Hướng dẫn chi tiết các bước thiết lập môi trường từ khi clone mã nguồn về cho đến khi chạy thành công và kiểm thử hệ thống tích hợp Docker + NPS Labtainer.

---

## 📋 1. Yêu Cầu Cài Đặt Ban Đầu (Prerequisites)

Trước khi bắt đầu, máy tính phát triển của bạn cần cài đặt các công cụ sau:

*   **Node.js**: Phiên bản `>= 20` (Khuyên dùng bản LTS).
*   **Docker Desktop**: Đã cài đặt, đang chạy ổn định.
*   **Git**: Dùng để quản lý mã nguồn.
*   **Hệ điều hành**:
    *   *Môi trường phát triển*: Windows hoặc macOS (Chạy qua Docker Desktop).
    *   *Môi trường Production (Labtainer thật)*: Bắt buộc là Linux (Ubuntu 22.04 LTS trở lên). Trên máy dev Windows, hệ thống sẽ tự động kích hoạt **Mock Mode** (giả lập NPS Labtainer) để quá trình code giao diện và API diễn ra bình thường mà không cần cài Linux thật.

---

## 🛠️ 2. Quy Trình Cài Đặt Từng Bước (Step-by-Step Setup)

### Bước 1: Clone Mã Nguồn & Cấu Trúc
Tải mã nguồn dự án về máy:
```bash
git clone <repo_url>
cd Demo_Platform
```

---

### Bước 2: Thiết Lập Môi Trường Mạng Docker (QUAN TRỌNG)
Hệ thống sử dụng cơ chế bảo mật cô lập và định tuyến mạng giữa các container chạy code. Bạn cần tạo thủ công mạng Docker ảo có tên là `isolated` theo các bước chi tiết sau:

#### 1. Kiểm tra Docker đã hoạt động chưa (Prerequisite Check)
Trước khi gõ lệnh, hãy đảm bảo dịch vụ Docker đang chạy trên máy tính:
*   Mở Terminal lên và gõ: `docker ps`
*   **Kết quả bình thường**: Nếu hiện ra bảng trống hoặc danh sách container (không báo lỗi `daemon is not running`), Docker đã sẵn sàng.
*   **Nếu có lỗi**: Hãy mở ứng dụng **Docker Desktop** trên Windows/macOS hoặc chạy lệnh `sudo systemctl start docker` trên Linux. Chờ biểu tượng Docker báo màu xanh lá (Running).

#### 2. Thao tác trên Dòng lệnh (Terminal Execution)
Mở cửa sổ dòng lệnh tương ứng với hệ điều hành của bạn:
*   **Windows**: Khuyên dùng **PowerShell** (nhấn nút `Win`, gõ `powershell` và nhấn `Enter`) hoặc **Git Bash** / **Command Prompt (cmd)**.
*   **Linux / macOS**: Mở ứng dụng **Terminal** mặc định.

Gõ chính xác lệnh sau và nhấn `Enter`:
```bash
docker network create isolated
```

#### 3. Xác minh kết quả tạo mạng thành công (Verification)
Sau khi chạy lệnh trên, hãy kiểm tra xem mạng đã được lưu vào hệ thống Docker chưa bằng lệnh:
```bash
docker network ls
```
**Kết quả mong đợi trên màn hình**: Bạn sẽ thấy mạng `isolated` xuất hiện trong danh sách với driver là `bridge`:
```text
NETWORK ID     NAME       DRIVER    SCOPE
a1b2c3d4e5f6   bridge     bridge    local
7f8e9d0c1b2a   host       host      local
88bb99ccaa11   isolated   bridge    local   <--- Thành công nếu có dòng này!
3c4d5e6f7a8b   none       null      local
```

#### 4. Xử lý các lỗi thường gặp (Troubleshooting)
*   **Lỗi `docker: command not found`**: Máy tính của bạn chưa được cài Docker Desktop hoặc biến môi trường PATH chưa được cấu hình. *Cách sửa: Tải lại và cài đặt Docker Desktop, sau đó khởi động lại Terminal.*
*   **Lỗi `network with name isolated already exists`**: Mạng `isolated` đã được tạo từ trước. *Cách sửa: Không cần làm gì thêm, mạng đã có sẵn và bạn có thể chuyển thẳng sang Bước 3.*

---

### Bước 3: Cấu Hình & Khởi Động Backend Server
1.  Di chuyển vào thư mục backend:
    ```bash
    cd project/backend
    ```
2.  Cài đặt các gói thư viện:
    ```bash
    npm install
    ```
    *(Thư viện `node-pty` sẽ tự động được biên dịch tương thích với hệ điều hành máy tính của bạn).*
3.  Cấu hình biến môi trường `.env`:  
    Tạo tệp `.env` tại thư mục gốc `project/backend/` với nội dung mẫu sau:
    ```ini
    PORT=3001
    
    # Đường dẫn thư mục cài đặt NPS Labtainer (Dùng cho máy chủ Linux thật)
    LABTAINER_DIR=mock_labtainer/labtainer-student
    LABTAINER_INSTRUCTOR_DIR=mock_labtainer/labtainer-instructor
    
    # Bắt buộc bật =true trên máy Windows Dev để tránh lỗi AttachConsole của node-pty
    MOCK_PTY=true
    ```
4.  Khởi động server phát triển:
    ```bash
    npm run dev
    ```
    *   **Kết quả**: Server chạy tại `http://localhost:3001`.
    *   Tệp cơ sở dữ liệu SQLite `lab_platform.db` sẽ **tự động được tạo mới** trong thư mục `project/backend/` khi server khởi chạy lần đầu.

---

### Bước 4: Xây Dựng & Tải Các Docker Image Cho Bài Lab
Các bài lab của sinh viên chạy cô lập trong sandbox. Nhà phát triển mới cần chuẩn bị sẵn các Docker Image tương ứng:

1.  **Build image cho bài Lab Phân tích Mã độc (`malware-env`)**:
    ```bash
    cd project/backend/docker
    docker build -t malware-env:latest -f Dockerfile.malware .
    ```
2.  **Pull các image nền tảng cho Monaco Code Runner (Tối ưu hóa)**:  
    Docker sẽ tự động pull các image này khi sinh viên bấm nộp bài lần đầu, nhưng bạn nên pull trước để kiểm thử nhanh chóng:
    ```bash
    docker pull python:3.11-slim
    docker pull node:20-slim
    docker pull gcc:13
    docker pull openjdk:17-slim
    docker pull ubuntu:22.04
    ```

---

### Bước 5: Cấu Hình & Khởi Động Frontend (Next.js 16)
1.  Mở một cửa sổ Terminal mới và di chuyển vào thư mục frontend:
    ```bash
    cd project/frontend
    ```
2.  Cài đặt các gói thư viện:
    ```bash
    npm install
    ```
3.  Khởi động server phát triển Next.js:
    ```bash
    npm run dev
    ```
    *   **Kết quả**: Truy cập giao diện Cloud Lab tại **`http://localhost:3000`** (hoặc cổng hiển thị trên Terminal).

---

## 🧪 3. Quy Trình Xác Minh & Kiểm Thử Môi Trường (Verification)

Để đảm bảo bạn đã cài đặt thành công 100% không phát sinh lỗi liên kết Docker hoặc SQLite, hãy chạy bộ kiểm thử tự động của dự án:

Mở Terminal tại thư mục `project/backend/` và chạy 3 bộ test cốt lõi:

### 1. Kiểm thử 9 bài Lab cốt lõi (Monaco & Terminal)
```bash
node test_all_labs.js
```
*   **Kỳ vọng**: Màn hình hiển thị `PASS ✅` cho tất cả 9 bài lab và điểm số đạt tuyệt đối 100/100.

### 2. Kiểm thử giới hạn tài nguyên Docker (OOM, CPU, Fork Bomb)
```bash
node test_resource_limits.js
```
*   **Kỳ vọng**: Màn hình hiển thị `PASS ✅` cho cả 3 ca bảo mật. Xác nhận Docker đã khống chế RAM/CPU và chặn Fork Bomb thành công.

### 3. Kiểm thử tích hợp NPS Labtainer Core Engine
```bash
node test_nps_labtainer.js
```
*   **Kỳ vọng**: Màn hình báo cáo `PASS ✅`, xác nhận luồng Web Terminal kết nối Docker container của Labtainer hoạt động hoàn hảo và parse báo cáo `.report` chính xác.

---

## 🚨 4. Các Lỗi Thường Gặp & Cách Khắc Phục (Troubleshooting)

#### 1. Lỗi `Error: connect ENOENT //./pipe/docker_engine`
*   **Nguyên nhân**: Docker Desktop chưa được khởi động trên máy tính của bạn.
*   **Khắc phục**: Hãy mở Docker Desktop lên và đảm bảo biểu tượng Docker báo màu xanh lá (running).

#### 2. Lỗi `docker network isolated not found` khi chạy bài lab mã độc
*   **Nguyên nhân**: Chưa tạo mạng ảo cô lập cho Docker.
*   **Khắc phục**: Chạy lệnh `docker network create isolated`.

#### 3. Tiến trình node-pty bị crash hoặc báo lỗi biên dịch
*   **Nguyên nhân**: Thiếu môi trường build-tools (như C++ compiler) của hệ điều hành khi `npm install`.
*   **Khắc phục**:
    *   *Trên Windows*: Bật biến môi trường `MOCK_PTY=true` trong file `.env` để backend bypass thư viện native và chạy Mock PTY an toàn.
    *   *Trên Linux/macOS*: Đảm bảo đã cài đặt `build-essential` hoặc Xcode Command Line Tools.
