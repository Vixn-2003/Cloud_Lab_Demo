# Labtainer Web Terminal & Orchestration Integration Plan

Tài liệu này mô tả chi tiết kế hoạch kiến trúc và các bước triển khai để biến hệ thống hiện tại thành một "Web-based Cyber Range", tích hợp trực tiếp engine của Labtainer vào Backend thông qua Web Terminal.

## 🎯 Mục tiêu (Goal)
- **Frontend**: Thay thế Monaco Editor (cho các bài code) bằng Xterm.js (cho các bài mạng/bảo mật).
- **Backend**: Xây dựng `LabtainerRunner` để gọi engine Labtainer, spawn Docker container và gắn PTY vào WebSocket.
- **Auto-grading**: Thu thập artifact JSON sau khi sinh viên kết thúc phiên SSH và cập nhật Score tự động.

## 🏛 Kiến trúc tổng thể

### Luồng Hoạt Động (Workflow)
1. Sinh viên bấm nút **Start Lab** trên web.
2. Web gửi lệnh qua WebSocket tới Backend.
3. Backend gọi lệnh shell `labtainer <lab_name>` để khởi tạo topology mạng và container trên Host.
4. Backend dùng `node-pty` để chui vào container mục tiêu (qua lệnh `docker exec -it <container> bash`).
5. Dòng I/O của terminal (kể cả màu bash, di chuyển con trỏ) được map trực tiếp với luồng `socket.io` và hiển thị trên `Xterm.js`.
6. Khi sinh viên bấm **Submit/Stop**, Backend gọi lệnh `stoplab <lab_name>`.
7. Labtainer trả về kết quả JSON, Backend đọc file JSON này, tính điểm và lưu vào SQLite `submissions.db`.

---

## 🛠 Các bước triển khai (Implementation Steps)

### ✅ Phase 1: Mở rộng cơ sở hạ tầng Backend (Đã hoàn thành)
*   **Thư viện cần thêm**: Cài đặt `node-pty` để giả lập Terminal và `socket.io` (đã có) để stream dữ liệu.
*   **LabtainerRunner.ts**: 
    - Đã tạo class `InteractiveTerminalService.ts` quản lý PTY và kết nối Socket.
    - Đã bổ sung API `/terminal/init` để cấp phát ID.
    - (Chưa tích hợp lệnh gọi Python của Labtainer, hiện đang dùng `powershell` nội bộ để test Mock).

### ✅ Phase 2: Nâng cấp Frontend với Xterm.js (Đã hoàn thành)
*   **Thư viện cần thêm**: Đã cài đặt `@xterm/xterm` và `@xterm/addon-fit` trên Next.js 16.
*   **Đồng bộ giao diện & Tích hợp Nâng cao (Phương án A - UX Correction)**: 
    - Đã tích hợp logic vào và đồng bộ trên cả localized/fallback workspace `lab-workspace-content.tsx`, tự động render `WebTerminal` khi `environmentType` là `single_machine` hoặc `multi_node`.
    - Triển khai **Cascading Selects** lọc danh sách lồng nhau tại **Lab Browser `/labs`** (Faculty -> Subject) và **Submissions `/submissions`** (Faculty -> Subject -> Lab) để tạo bộ lọc tìm kiếm thời gian thực tối ưu.
    - Quyết định loại bỏ Cascading Selects khỏi Workspace Header nhằm giữ an toàn tối đa cho phiên làm việc Terminal VM Docker và tập trung trải nghiệm code.
    - Bổ sung **Execution Environment Grid** (Category, Language/OS, Required Tools, Security Policy, Time Limit) ở cuối tab Instructions.
    - Bổ sung **Footer Terminal Debug** (TIME, EXIT CODE, STATUS) vào Console Output bằng cách truyền trực tiếp `executionMetadata` nhận được từ socket stream.

### 🚧 Phase 3: Quản lý Session, Tài nguyên & Tích hợp Labtainer Core (Đang thực hiện)
*   **Session Management**: Map mỗi Socket.ID với một PTY instance. Khi Socket ngắt kết nối (đóng tab), PTY phải được kill để tránh zombie process (Đã xử lý trong `InteractiveTerminalService.ts`).
*   **Auto-Destroy (Garbage Collection)**: Viết cronjob hoặc timeout (ví dụ: 30 phút không có I/O) để tự động gọi `stoplab` và huỷ container, tránh tình trạng hết RAM/CPU trên máy chủ (Sắp tới).
*   **Isolation**: Đảm bảo cấu hình Labtainer tạo network alias hoặc cấp subnet riêng biệt cho từng user.
*   **Tích hợp CLI Labtainer**: Chỉnh sửa mã nguồn `InteractiveTerminalService` chuyển từ `powershell.exe` sang `labtainer <lab_name>` sau khi Server có cài đặt Engine thật.

---

## 🛑 Thách thức & Cảnh báo (WARNINGS)

> **Resource Exhaustion (Tràn RAM/CPU)**
> Mỗi phiên Labtainer tạo ra ít nhất 1 container (có thể 3-5 container nếu là bài network). Do đó, Server của bạn phải đủ mạnh và cấu hình script dọn dẹp (cleanup) phải cực kỳ khắt khe.

> **node-pty Compatibility**
> Thư viện `node-pty` phụ thuộc vào native bindings (C++). Trên Windows, bạn phải cài đặt Visual Studio Build Tools, còn trên Linux thì cần `build-essential` và `python3` để npm install thành công.

> **TIP**
> Trước khi viết `LabtainerRunner`, hãy tạo một "Mock PTY" (Terminal ảo trả về chữ cố định) để kiểm tra luồng kết nối WebSocket ↔ Xterm.js xem nó có mượt mà và không có độ trễ (latency) không, sau đó mới nối nó vào Docker.
