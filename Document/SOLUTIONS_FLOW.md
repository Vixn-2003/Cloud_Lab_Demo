# Đặc Tả Kiến Trúc Luồng Xử Lý (Solutions Flow Document)

Tài liệu này đặc tả chi tiết kiến trúc luồng dữ liệu (Data Flow) và luồng xử lý (Execution Flow) của **4 giải pháp thực thi** cốt lõi trên nền tảng Cloud Lab. 
Đảm bảo tính trực quan bằng biểu đồ tuần tự (Sequence Diagram) và mô tả chi tiết bằng tiếng Việt chuẩn hóa.

---

## 🏛️ 1. Bản Đồ Phân Loại Giải Pháp (Solution Mapping)

Hệ thống phân loại các bài lab thực hành và định tuyến luồng xử lý dựa trên cấu hình môi trường:

| # | Giải pháp thực thi | Môi trường thực tế | Giao diện học viên | Cơ chế chấm điểm (Grading) |
|---|---------------------|----------------------|----------------------|-----------------------------|
| **1** | **Monaco Code Runner** | Docker Stateless Sandbox | Monaco Editor | So khớp Stdin/Stdout (Testcases) |
| **2** | **Standard Web Terminal** | Docker VM (`malware-env`) | Xterm.js Terminal | Quét tệp tin & Chạy script hành vi (`solution.sh`) |
| **3** | **NPS Labtainer Online** | Docker Topology (Multi-node) | Xterm.js (SSH Exec) | Chạy Core `stoplab` & `gradelab` và parse `.report` |
| **4** | **NPS Labtainer ZIP Offline** | Host Local (Offline) | Drag & Drop Zone | Giải nén ZIP (`adm-zip`), parse manifest + results |

---

## 🔄 2. Đặc Tả Chi Tiết 4 Giải Pháp & Biểu Đồ Tuần Tự (Sequence Diagrams)

---

### Luồng 1: Monaco Code Runner (`single_runtime`)
Áp dụng cho các bài lab lập trình (Python, Node.js, C++, Java), nơi học viên viết mã nguồn và chạy các testcase tự động.

```mermaid
sequenceDiagram
    autonumber
    actor SV as Sinh Viên (Trình duyệt)
    participant API as Express API Backend
    participant DR as DockerRunner (Service)
    participant DK as Docker Engine (Sandbox)
    participant DB as SQLite (submissions.db)
    
    SV->>API: POST /upload-submit (FormData) hoặc /submit (JSON)
    API->>API: Xác thực profileId & labId
    API->>DB: Lưu bản ghi nộp bài ban đầu ("queued")
    API->>SV: Trả về executionId
    SV->>API: Subscribe phòng WebSocket (executionId)
    
    rect rgb(240, 248, 255)
        note right of DR: Luồng Chấm Điểm Chạy Ngầm (Async Pipeline)
        API->>DR: Kích hoạt DockerRunner.executeSubmit()
        DR->>DR: Tạo thư mục làm việc tạm thời cô lập
        DR->>DR: Biên dịch code (nếu là Java/C++)
        loop Cho mỗi Testcase
            DR->>DK: docker run --network none -v <workspace> <image> <exec_cmd>
            DK-->>DR: Trả về Stdout/Stderr & Exit Code
            DR->>DR: So khớp Stdout với Expected Output của Testcase
            DR-->>SV: Phát trạng thái qua WS ("execution:status" -> streaming)
        end
        DR->>DR: Tính tổng điểm (%) và dọn dẹp thư mục tạm
    end
    
    DR->>DB: Cập nhật bản ghi trạng thái ("finished") & score
    DR-->>SV: Phát kết quả cuối cùng qua WS ("execution:status" -> finished)
```

---

### Luồng 2: Standard Web Terminal (`single_machine` / VM-based)
Áp dụng cho các bài thực hành hệ thống độc lập (ví dụ phân tích động mã độc `lab_winlocker_analysis`).

```mermaid
sequenceDiagram
    autonumber
    actor SV as Sinh Viên (Trình duyệt)
    participant WS as WebSocket (Socket.IO)
    participant PTY as InteractiveTerminalService
    participant DK as Docker Engine
    participant DB as SQLite (submissions.db)

    SV->>PTY: POST /terminal/init { labId }
    PTY->>PTY: Tạo thư mục workspaces/{sessionId} và seed tệp tin mẫu (log, pcap)
    PTY-->>SV: Trả về sessionId
    SV->>WS: Emit "terminal:start" { sessionId }
    
    rect rgb(255, 240, 245)
        note right of PTY: Khởi tạo Terminal ảo cô lập
        PTY->>DK: docker run -d --name cloudlab_terminal_{sessionId} -v <workspace> malware-env:latest
        PTY->>PTY: Spawn node-pty đính kèm docker exec -it <container> bash
    end
    
    PTY-->>SV: Stream Banner chào mừng & instructions.txt lên Xterm.js
    
    loop Tương tác gõ lệnh
        SV->>WS: Emit "terminal:input" { data: "gõ lệnh làm bài" }
        WS->>PTY: Gửi dữ liệu I/O tới PTY
        PTY->>DK: Thực thi lệnh trong container thật
        DK-->>PTY: Phản hồi kết quả I/O
        PTY-->>SV: Stream kết quả hiển thị lên Xterm.js
    end
    
    SV->>WS: Emit "terminal:input" { data: "exit" }
    PTY->>PTY: Nhận tín hiệu exit, ngắt dòng PTY
    
    rect rgb(240, 248, 255)
        note right of PTY: Luồng Chấm Điểm Hành Vi (Behavior Auto-grading)
        PTY->>DK: Chạy bash solution.sh kiểm tra kết quả ghi file & kết nối mạng
        DK-->>PTY: Trả về Stdout kết quả
        PTY->>PTY: Đối chiếu và tính điểm (0 - 100)
        PTY->>DK: Stop & Rm Container (Garbage Collection dọn dẹp RAM)
        PTY->>PTY: Xóa thư mục workspaces/{sessionId}
    end
    
    PTY->>DB: Lưu kết quả nộp bài vào SQLite
    PTY-->>SV: Phát trạng thái chấm điểm thành công qua WS ("execution:status" -> finished)
```

---

### Luồng 3: NPS Labtainer Online Integration (Real Engine)
Áp dụng cho các bài lab an toàn thông tin chuyên sâu của Labtainer (ví dụ quét cổng mạng `lab_labtainer_nmap`).

haha

---

### Luồng 4: NPS Labtainer ZIP Offline Submission (LMS Mode)
Áp dụng cho chế độ nộp bài offline, sinh viên làm bài offline trên máy tính cá nhân và nộp tệp tin kết quả ZIP để nhận điểm.

```mermaid
sequenceDiagram
    autonumber
    actor SV as Sinh Viên (Trình duyệt)
    participant API as Express API Backend
    participant ZIP as LabtainerGradingService
    participant DB as SQLite (submissions.db)
    
    SV->>API: POST /upload-submit (Tải tệp ZIP nộp bài)
    API->>API: Phát hiện tệp nộp bài có đuôi là .zip / .tar.gz / .tgz
    API->>SV: Trả về executionId (trạng thái "queued")
    SV->>API: Subscribe phòng WebSocket (executionId)
    
    rect rgb(240, 248, 255)
        note right of ZIP: Phân tích Giải Nén Tệp ZIP
        API->>ZIP: gradeZip(zipBuffer, labId)
        ZIP->>ZIP: Sử dụng adm-zip giải nén tệp tin trong bộ nhớ
        ZIP->>ZIP: Đọc & kiểm chứng manifest.json (Xác thực SV001 & khớp labId)
        alt Có results.json (grading_results.json)
            ZIP->>ZIP: Đọc chi tiết điểm số & kết quả các tasks con
        else Chỉ có logs hoàn thành (.done)
            ZIP->>ZIP: Quét logs hành vi & checksum để tính điểm thích ứng
        end
    end
    
    ZIP->>DB: Lưu điểm số, tên tệp ZIP, manifest vào SQLite
    ZIP-->>SV: Phát kết quả cuối cùng qua WS ("execution:status" -> finished)
```

---

## 🔒 3. Cơ Chế Bảo Mật & Dọn Dẹp Tài Nguyên (Resource GC)

Hệ thống Cloud Lab được xây dựng theo tiêu chuẩn doanh nghiệp, áp dụng nghiêm ngặt các chính sách:
1. **Cô lập mạng (Network Isolation)**: Đối với các bài lab Monaco Code, Docker luôn chạy với tùy chọn `--network none` để chặn đứng hành vi tấn công ra mạng ngoài hoặc can thiệp vào host server.
2. **Giới hạn tài nguyên (Resource Limits)**: Mỗi container thực thi code luôn bị khống chế cứng ở mức `--memory 256m` và `--cpus 0.5` để ngăn ngừa tấn công từ chối dịch vụ (DoS).
3. **Thu hồi tài nguyên tự động (Garbage Collection)**:
   - *VM Terminals*: Toàn bộ container Docker và tiến trình PTY con luôn được kết thúc và xóa sạch (`docker kill` và `docker rm`) ngay khi sinh viên gõ `exit` hoặc ngắt kết nối socket quá 10 giây.
   - *Thư mục Workspace tạm*: Tự động xóa bỏ (`fs.rmSync`) toàn bộ thư mục workspaces cô lập sau khi đã chấm điểm xong để giải phóng 100% dung lượng ổ cứng.
