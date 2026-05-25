# Software Requirements Specification (SRS)
## Project: Multi-Environment Coding Lab Platform

**Version**: 1.0  
**Role**: Solution Architect + Staff Engineer  
**Date**: April 13, 2026

---

## 1. Introduction

### 1.1 Purpose
Tài liệu này đặc tả các yêu cầu nghiệp vụ và kỹ thuật cho nền tảng **Multi-Environment Coding Lab**, một hệ thống hỗ trợ thực hành lập trình và an toàn thông tin theo mô hình chuyên nghiệp, thực tế.

### 1.2 Scope
Dự án tập trung vào việc xây dựng một môi trường lab đa dạng, hỗ trợ từ các bài tập thuật toán cơ bản đến các bài lab hạ tầng phức tạp (OpenSSL, Nmap) bằng cách sử dụng các runtime thực thụ thay vì giả lập.

---

## 2. Problem Statement (Phát biểu vấn đề)

### 2.1 Thiếu hụt cấu trúc học thuật (Lacks Curriculum Structure)
Các hệ thống chấm bài cũ thường chỉ có một danh sách bài tập phẳng (flat list), gây khó khăn cho việc quản lý theo chương trình đào tạo của các Khoa và Môn học khác nhau.

### 2.2 Sự không nhất quán của môi trường thực thi (Environment Inconsistency)
- Sinh viên thường cài đặt công cụ trên máy cá nhân, dẫn đến cảnh "máy em chạy được nhưng máy thầy không".
- Thiếu hệ thống chấm điểm tự động tích hợp trực tiếp với môi trường thực thi gốc.

### 2.3 Vấn đề "Simulation vs. Reality"
Nhiều platform hiện nay giả lập mọi thứ bằng Python (VD: dùng module `hashlib` để giả lập lab OpenSSL). Điều này làm sinh viên mất đi kỹ năng sử dụng các công cụ dòng lệnh (CLI) thực tế và không hiểu được các sai biệt của môi trường hệ thống (system-level discrepancies).

---

## 3. Proposed Solution (Giải pháp đề xuất)

### 3.1 Mô hình Academy Curriculum (Faculty-Subject-Lab)
Hệ thống hóa cấu trúc dữ liệu theo 3 cấp:
- **Faculty (Khoa)**: Quản lý cấp cao nhất.
- **Subject (Môn học)**: Nhóm các bài thực tập theo chủ đề chuyên sâu.
- **Lab (Bài thực hành)**: Đơn vị nhỏ nhất, gắn liền với một cấu hình kỹ thuật cụ thể.

### 3.2 Authentic Runtime Engine
Thay vì giả lập, hệ thống triển khai **Execution Profile** dựa trên các công cụ thực tế:
- **Nguyên tắc**: Lab OpenSSL phải chạy binary `openssl`, Lab Nmap chạy binary `nmap`.
- **High-Fidelity**: Đảm bảo sinh viên đối mặt với cùng các output, lỗi, và hành vi của môi trường Ubuntu thực tế.

### 3.3 Production Taxonomy (Phân loại thực tế)
Hệ thống hóa môi trường lab theo 3 loại:
1. **Single-runtime**: Môi trường đơn lẻ (Python, Java, Node.js).
2. **Single-machine (Containerized)**: Một máy Linux ảo hóa với bộ công cụ CLI (OpenSSL, Nmap, SQLite CLI).
3. **Multi-node**: Mô phỏng mạng (Network simulation) cho các kịch bản Attacker/Victim.

---

## 4. Functional Requirements (Yêu cầu chức năng)

### 4.1 Quản trị học thuật
- **Cascading Selection**: Hiển thị dropdown môn học dựa trên khoa đã chọn, và lab dựa trên môn học.
- **Problem Statement**: Hiển thị yêu cầu bài lab bằng định dạng Markdown.

### 4.2 Môi trường thực thi IDE
- **Monaco Editor**: Hỗ trợ syntax highlighting đa ngôn ngữ (.py, .js, .cpp, .sh, .java).
- **Interactive Stdin**: Cho phép người dùng nhập dữ liệu trực tiếp vào luồng `stdin` của quá trình đang chạy.

### 4.3 Hệ thống chấm điểm tự động (Auto-grading)
- **Pipeline**: Capture `stdout` và `stderr` từ quá trình thực thi.
- **Grading Strategy**:
    - `exact_match`: So khớp chính xác string.
    - `regex_match`: Kiểm tra định dạng đầu ra (VD: Hash length).
    - `numeric_threshold`: Kiểm tra các ngưỡng giá trị (VD: % Avalanche effect).

---

## 5. Technical Architecture (Kiến trúc kỹ thuật)

### 5.1 Technology Stack
- **Frontend**: React 19, Vite, Tailwind CSS v4.
- **Backend**: Node.js, Express, TypeScript.
- **Database**: SQLite (better-sqlite3) để lưu trữ vĩnh viễn kết quả nộp bài.

### 5.2 Execution Layer (LocalProcessRunner)
- Sử dụng Node.js `child_process` để spawn các tiến thực thực thi.
- Cơ chế **Session Isolation**: Mỗi lần Run/Submit được thực hiện trong một thư mục tạm biệt lập, tự động dọn dẹp sau khi kết thúc.

### 5.3 Lộ trình mở rộng (Future Roadmap)
- Chuyển đổi từ `LocalProcessRunner` sang **DockerRunner** để đảm bảo khả năng cách ly an toàn (Sandbox).
- Tích hợp **WebSocket** để stream logs thời gian thực từ container về trình duyệt.

---

## 6. Conclusion
Tài liệu SRS này thiết lập nền tảng để xây dựng một platform học tập thực chiến, giải quyết triệt để khoảng cách giữa lý thuyết và thực hành hạ tầng.
