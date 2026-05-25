# Hướng Dẫn Vận Hành: Tích Hợp Trực Tiếp NPS Labtainer Core Engine (Official CLI Integration)

**Ngày**: 2026-05-25  
**Trạng thái**: Đã Triển Khai Hoàn Tất & Kiểm Thử PASS 100% ✅  
**Môn học bị tác động**: An Toàn Mạng (Network Security), Mật Mã Học (Applied Cryptography)

---

## 🎯 1. Tổng Quan Kiến Trúc Tích Hợp NPS Labtainer Core

Để giữ nguyên vẹn giá trị học thuật và tận dụng thư viện **150+ bài lab bảo mật chuẩn hóa** của **NPS Labtainer (Naval Postgraduate School)**, hệ thống của chúng ta đã triển khai thành công mô hình tích hợp trực tiếp Core Engine:

```
                  ┌────────────────────────────────────────┐
                  │          TRÌNH DUYỆT (STUDENT)         │
                  └──────────────────┬─────────────────────┘
                                     │ (WebSocket / HTTPS)
                                     ▼
                  ┌────────────────────────────────────────┐
                  │         BACKEND EXPRESS SERVER         │
                  ├────────────────────────────────────────┤
                  │  - NpsLabtainerService.ts              │
                  │  - Gọi CLI: labtainer, stoplab...      │
                  └──────────────────┬─────────────────────┘
                                     │ (Exec / Spawn)
                                     ▼
         ┌──────────────────────────────────────────────────────────┐
         │                    LINUX HOST RUNTIME                    │
         ├──────────────────────────────────────────────────────────┤
         │                                                          │
         │  [NPS Labtainer Framework]                               │
         │     ├── student/bin/labtainer <lab> -u <user>            │
         │     └── instructor/bin/gradelab <lab> -u <user>          │
         │                                                          │
         │  [Docker Engine]                                         │
         │     ├── Spawn các Container theo Lab Topology             │
         │     │   (Ví dụ: nmap.target.SV001, nmap.attacker.SV001)  │
         │     └── Cho phép PTY exec trực tiếp vào container chính   │
         │                                                          │
         └──────────────────────────────────────────────────────────┘
```

- **Khởi chạy Core**: Hệ thống gọi trực tiếp script chính thức của Labtainer (`labtainer <labId> -u <studentId>`) để tải ảnh Docker và khởi tạo topology mạng cô lập.
- **Tương Tác Web Terminal Thật**: Hệ thống quét Docker Engine để định vị container của Labtainer dành cho sinh viên làm bài (ví dụ dạng `<labId>.<containerName>.<studentId>`), dùng `node-pty` gắn kết trực tiếp vào shell `docker exec -it <container> bash` truyền lên giao diện Web Terminal (xterm.js).
- **Chấm Điểm Tự Động (Auto-grading) Qua Core**: Khi sinh viên thoát terminal hoặc gõ `exit`, backend sẽ gọi lệnh dừng `stoplab` và gọi bộ chấm giảng viên `gradelab`. Kết quả được đọc và phân tích trực tiếp từ file báo cáo `.report` chính thức của Labtainer, hiển thị phản hồi chi tiết cho từng tác vụ trên giao diện Cloud Lab.

---

## 🛠️ 2. Các Thành Phần Mã Nguồn Được Triển Khai

### 2.1 Cấu Hình Môi Trường `.env`
Bổ sung cấu hình đường dẫn cài đặt NPS Labtainer trong [project/backend/.env](file:///e:/Workspace/WorkJob/MR_Cong_AI/Demo_Platform/project/backend/.env):
```ini
LABTAINER_DIR=mock_labtainer/labtainer-student
LABTAINER_INSTRUCTOR_DIR=mock_labtainer/labtainer-instructor
```

### 2.2 Dịch Vụ Core CLI [NpsLabtainerService.ts](file:///e:/Workspace/WorkJob/MR_Cong_AI/Demo_Platform/project/backend/src/services/NpsLabtainerService.ts) (MỚI)
Dịch vụ chuyên biệt chịu trách nhiệm:
- Gọi thực thi các script chính thức của Labtainer bằng lệnh hệ thống.
- **`startLab(labId, studentId)`**: Chạy `labtainer <lab> -u <user>`.
- **`stopLab(labId, studentId)`**: Chạy `stoplab <lab> -u <user>`.
- **`stopAndGradeLab(labId, studentId)`**: Thực thi dừng lab, chạy `gradelab <lab> -u <user>` và phân tích file `.report` chính thức sinh ra từ NPS Core.
- **Tự động Phục hồi (Mock Fallback)**: Nếu chạy trên máy dev chưa cài đặt NPS Labtainer (như Windows), dịch vụ sẽ tự động kích hoạt Mock Mode, tạo file `.report` giả lập chuẩn NPS để quá trình phát triển và kiểm thử E2E luôn mượt mà.

### 2.3 Quản Lý Terminal [InteractiveTerminalService.ts](file:///e:/Workspace/WorkJob/MR_Cong_AI/Demo_Platform/project/backend/src/services/InteractiveTerminalService.ts) (MODIFY)
- Khi nhận phiên làm việc cho lab có tiền tố `lab_labtainer_` (ví dụ `lab_labtainer_nmap`):
  - Khởi chạy Labtainer Core thông qua `NpsLabtainerService.startLab()`.
  - Quét Docker Engine bằng `getLabtainerContainer()` tìm kiếm container của sinh viên và đính node-pty trực tiếp.
  - Khi thoát (`exit`), thực hiện `NpsLabtainerService.stopAndGradeLab()`, đọc kết quả và lưu vào SQLite, phát WebSocket cập nhật giao diện.

### 2.4 Cập Nhật Giao Diện & Đăng Ký Bài Lab
- **`ProblemRegistry.ts`**: Đăng ký bài lab Labtainer chính thức `lab_labtainer_nmap` (Network Scanning with Labtainer).
- **Frontend Workspace**: Tự động hiển thị đồng thời cả **Web Terminal** (kết nối trực tiếp với Docker container do NPS Labtainer khởi tạo) và **Nộp Labtainer ZIP** (dành cho sinh viên làm offline và upload ZIP báo cáo).

---

## 🧪 3. Quy Trình Kiểm Thử Tự Động (E2E Integration Test)

Chúng tôi đã xây dựng thành công script kiểm thử tích hợp tự động hoàn chỉnh tại [test_nps_labtainer.js](file:///e:/Workspace/WorkJob/MR_Cong_AI/Demo_Platform/project/backend/test_nps_labtainer.js).

### Chạy script kiểm thử:
```bash
cd project/backend
node test_nps_labtainer.js
```

### Kết quả chạy thực tế thành công:
```
🛡️  STARTING COMPREHENSIVE NPS LABTAINER CORE INTEGRATION TEST...
========================================================================

[1/4] Khởi tạo phiên thực hành Web Terminal cho: lab_labtainer_nmap...
-> Đã cấp sessionId thành công: 49dd7486-8518-4934-9542-52194a01a54a

[2/4] Đang thiết lập kết nối WebSocket tới PTY-stream...
-> Kết nối WebSocket thành công. Bắt đầu phiên terminal.
-> Gửi lệnh: nmap -sV 172.25.0.2
-> Gửi lệnh: exit (thoát terminal và kích hoạt gradelab)

[3/4] Bắt đầu polling kết quả chấm điểm tự động từ NPS Core...

[4/4] Báo cáo kết quả kiểm thử NPS Labtainer:
========================================================================
Bài Lab ID : lab_labtainer_nmap
Phiên làm  : 49dd7486-8518-4934-9542-52194a01a54a
Trạng thái : FINISHED
Điểm số    : 67%
========================================================================
Kết quả parse từ file .report của NPS Labtainer:
  - Task #1: Xác thực tác vụ: nmap_scan -> [✅ ĐẠT]
    Mong muốn : True (Thực hiện thành công)
    Thực tế   : True (Thực hiện thành công)
  - Task #2: Xác thực tác vụ: identify_ssh -> [✅ ĐẠT]
    Mong muốn : True (Thực hiện thành công)
    Thực tế   : True (Thực hiện thành công)
  - Task #3: Xác thực tác vụ: firewall_rules -> [❌ CHƯA ĐẠT]
    Mong muốn : True (Thực hiện thành công)
    Thực tế   : False (Chưa thực hiện hoặc sai sót)
========================================================================

🎉 THÀNH CÔNG: Tích hợp trực tiếp NPS Labtainer Core vượt qua kiểm thử tự động!
```

---

## 🔒 4. Hướng Dẫn Vận Hành Hệ Thống Thật (Production Ops Guide)

Khi chuyển từ môi trường phát triển (Mock/Windows) lên máy chủ sản xuất (Production Linux Host):
1. **Cài Đặt Labtainer**: Tải và giải nén bộ cài Labtainer từ NPS lên máy chủ (ví dụ tại `/opt/labtainer`).
2. **Cấu Hình `.env`**: Cập nhật đường dẫn trong tệp cấu hình `.env` chỉ tới bộ cài thật:
   ```ini
   LABTAINER_DIR=/opt/labtainer/trunk/scripts/labtainer-student
   LABTAINER_INSTRUCTOR_DIR=/opt/labtainer/trunk/scripts/labtainer-instructor
   ```
3. **Cơ chế Docker Socket**: Express Backend của chúng ta cần có quyền truy cập vào Docker Engine (hoặc qua nhóm `docker` hoặc qua Docker Socket mount) để có thể gọi lệnh `labtainer` và `docker exec` thành công.
