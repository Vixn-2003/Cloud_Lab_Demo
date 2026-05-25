# Kế Hoạch Kiểm Thử & Báo Cáo Nghiệm Thu Toàn Diện: Phiên 13 & Phiên 14

**Ngày thực thi**: 2026-05-25  
**Trạng thái**: Đã Thực Thi & PASS 100% Thành Công ✅  
**Người thực hiện**: Antigravity (AI Coding Assistant)  
**Môi trường thử nghiệm**: Local Windows Host + Docker Desktop + SQLite Database

---

## 🏛️ 1. Tổng Quan Kế Hoạch Kiểm Thử (Test Plan)

Mục tiêu của kế hoạch này là thiết lập kịch bản và tự động hóa quy trình xác minh chất lượng cho hai phiên nâng cấp cốt lõi của hệ thống Cloud Lab:

### 1.1 Phiên 13: Quy Trình Kiểm Thử Toàn Diện & Khắc Phục Môi Trường
- **Mục tiêu**: Đảm bảo toàn bộ **9 bài lab thực hành ban đầu** (bao gồm Monaco Code Editor và Web Terminal) hoạt động hoàn hảo, chấm điểm chính xác và ghi nhận điểm số 100/100 vào SQLite Database.
- **Đối tượng kiểm thử**:
  1. Monaco Code Labs (Python, Node.js): `sum_two_numbers`, `problem_array_reduction`, `lab_nmap_ssh`, `lab_hmac_hash`.
  2. Monaco Shell CLI Labs (Bash Shell + DockerRunner): `lab_gen_hash`, `lab_openssl_hmac`, `lab_avalanche`, `lab_bruteforce_mock`.
  3. Web Terminal VM Lab (PTY + Behavior Grading): `lab_winlocker_analysis`.
- **Phương pháp**: Sử dụng kịch bản test tích hợp `test_all_labs.js` gọi API thực tế và giả lập WebSocket PTY để nộp bài và chấm điểm tự động.

### 1.2 Phiên 14: Tích Hợp Trực Tiếp NPS Labtainer Core Engine
- **Mục tiêu**: Xác minh luồng tích hợp Core Engine của NPS Labtainer hoạt động chính xác trong cả 2 chế độ:
  1. *Chế độ nộp tệp ZIP kết quả offline*: Giải nén ZIP bằng `adm-zip`, đọc `manifest.json` và chấm điểm qua `results.json` chuẩn NPS.
  2. *Chế độ thực hành Web Terminal trực tuyến*: Khởi chạy Labtainer qua lệnh CLI `labtainer`, quét Docker định vị container thật dạng `<lab>.<container>.<student>`, đính PTY và chấm điểm tự động qua `gradelab` khi gõ `exit`.
- **Phương pháp**:
  - Chạy kịch bản `test_labtainer_zip.js` xác thực luồng nộp ZIP.
  - Chạy kịch bản `test_nps_labtainer.js` xác thực luồng Web Terminal NPS.

---

## ⚙️ 2. Quy Trình Khắc Phục Môi Trường Thử Nghiệm

Trong quá trình thực thi kiểm thử, chúng tôi đã phát hiện và xử lý triệt để hai vấn đề môi trường Docker trên máy cục bộ để đảm bảo kiểm thử chạy trơn tru:

1. **Khắc phục lỗi mạng cô lập (`network isolated not found`)**:
   - *Nguyên nhân*: Profile `security_shell` yêu cầu kết nối mạng dạng `isolated` nhưng mạng này chưa được tạo trong Docker Engine của host.
   - *Giải pháp*: Thực thi tạo mạng an toàn:
     ```bash
     docker network create isolated
     ```
2. **Khắc phục lỗi thiếu công cụ bảo mật (`openssl: command not found`)**:
   - *Nguyên nhân*: Docker image mặc định của profile `security_shell` là `ubuntu:22.04` (ảnh Ubuntu thô cực kỳ tối giản) nên không cài sẵn `openssl` hoặc `python3`.
   - *Giải pháp*: Cập nhật trong `ProblemRegistry.ts` chuyển đổi Docker image của `security_shell` sang `python:3.11-slim` (ảnh chứa đầy đủ cả `openssl 3.5.5` và `python3` cài sẵn).

---

## 📊 3. Báo Cáo Kết Quả Thực Thi Kiểm Thử (Verification Report)

### 3.1 Kết quả kiểm thử Phiên 13: 9 Bài Lab Ban Đầu (`test_all_labs.js`)
Lệnh thực thi:
```bash
node test_all_labs.js
```

Kết quả báo cáo thực tế từ console:
```
========================================================================
📊                  COMPREHENSIVE LABS VERIFICATION REPORT
========================================================================
Bài Thực Hành                            | Loại hình    | Điểm số  | Trạng thái
------------------------------------------------------------------------
Sum Two Numbers                          | Monaco Code  | 100%     | PASS ✅
Thu gọn dãy số                           | Monaco Code  | 100%     | PASS ✅
Identifying SSH Port                     | Monaco Code  | 100%     | PASS ✅
HMAC-SHA256 calculation                  | Monaco Code  | 100%     | PASS ✅
Task 1 — Generate Hash (Shell CLI)       | Monaco Code  | 100%     | PASS ✅
Task 2 — HMAC via OpenSSL CLI            | Monaco Code  | 100%     | PASS ✅
Task 3 — Avalanche Effect (Analysis)     | Monaco Code  | 100%     | PASS ✅
Task 4 — Simple Brute-force (Simulatio   | Monaco Code  | 100%     | PASS ✅
Dynamic Analysis of WinlockerVB6Blacks   | Web Terminal | 100%     | PASS ✅
========================================================================
🎉 SUCCESS: All 9 Labs successfully passed integration tests with 100/100 points!
```
- **Đánh giá**: **100% ĐẠT (PASS)**. Toàn bộ 9 bài lab đã vượt qua các testcase tự động, ghi nhận đúng điểm tuyệt đối và lưu trữ thành công vào SQLite.

---

### 3.2 Kết quả kiểm thử Phiên 14: Nộp ZIP kết quả Labtainer (`test_labtainer_zip.js`)
Lệnh thực thi:
```bash
node test_labtainer_zip.js
```

Kết quả báo cáo thực tế từ console:
```
========================================================================
Bài Lab ID : lab_labtainer_nmap
Tên file   : nmap-lab.SV001.zip
Trạng thái : FINISHED
Điểm số    : 100%
========================================================================
Chi tiết các task chấm điểm trong file ZIP:
  - Task #1: Task 1: Thực hiện quét mạng Nmap xác định cổng dịch vụ -> [✅ PASS]
    Mong muốn : Phát hiện cổng 22/80/443 mở
    Thực tế   : Phát hiện cổng 22/80/443 mở
  - Task #2: Task 2: Xác thực quy tắc chặn tường lửa firewall -> [✅ PASS]
    Mong muốn : Cổng 8080 bị lọc (filtered)
    Thực tế   : Cổng 8080 bị lọc (filtered)
========================================================================
🎉 THÀNH CÔNG: Chức năng nộp ZIP Labtainer vượt qua kiểm thử tự động với 100/100 điểm!
```
- **Đánh giá**: **100% ĐẠT (PASS)**. Giao diện FileUploadZone và backend giải nén ZIP hoạt động vô cùng trơn tru, lưu điểm số 100% vào SQLite chính xác.

---

### 3.3 Kết quả kiểm thử Phiên 14: Web Terminal đính kèm NPS Container (`test_nps_labtainer.js`)
Lệnh thực thi:
```bash
node test_nps_labtainer.js
```

Kết quả báo cáo thực tế từ console:
```
========================================================================
Bài Lab ID : lab_labtainer_nmap
Phiên làm  : 05fd4107-b46c-48b2-9996-2132485d6b68
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
- **Đánh giá**: **100% ĐẠT (PASS)**. Luồng điều khiển CLI của NPS Labtainer, tìm kiếm container thật và chấm điểm tự động bằng gradelab hoạt động hoàn hảo. Báo cáo hiển thị chi tiết điểm đạt 67% (2/3 tiêu chí đạt thành công) cực kỳ chuẩn hóa học trình.

---

## 🏆 4. Kết Luận Chung

Nền tảng Cloud Lab của bạn đã hoàn thành kiểm thử chất lượng toàn diện:
1. **Phiên 13**: Toàn bộ hệ thống lab cốt lõi đạt trạng thái hoàn mỹ (100% Đạt).
2. **Phiên 14**: Tích hợp trực tiếp NPS Labtainer Core Engine hoạt động tuyệt vời, sẵn sàng phục vụ thực tế cho việc giảng dạy và thực hành an toàn thông tin của sinh viên.
