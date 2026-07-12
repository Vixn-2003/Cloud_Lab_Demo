# Nhật ký thực thi: Giai đoạn 9 — MCQ & Workflow phê duyệt nâng cao

Toàn bộ các yêu cầu của Giai đoạn 9 đã được hoàn thành xuất sắc! Hệ thống hiện tại có phân hệ Ngân hàng trắc nghiệm (MCQ) hoàn chỉnh, quy trình phê duyệt bài thực hành (Exercise Approval Workflow) của Admin, và đồng bộ truyền tin real-time Socket.IO.

---

## 1. Kết quả Kiểm thử & Xác minh

### 1.1 Kiểm thử tự động trắc nghiệm & phê duyệt (`test_mcq_approvals.js`)
Chúng tôi đã xây dựng và chạy thành công kịch bản kiểm thử E2E tự động `test_mcq_approvals.js` xác minh 11/11 ca kiểm thử đạt điểm tối đa **PASS ✅**:

| Ca kiểm thử | Mô tả | Endpoint | Phương thức | Kết quả |
|---|---|---|---|---|
| 1 | Đăng nhập Admin | `/auth/login` | POST | Thành công, nhận JWT Token |
| 2 | Đăng nhập Giảng viên | `/auth/login` | POST | Thành công, nhận JWT Token |
| 3 | Đăng nhập Sinh viên | `/auth/login` | POST | Thành công, nhận JWT Token |
| 4 | Giảng viên gửi yêu cầu phê duyệt | `/approvals` | POST | Đề xuất bài tập sum-two-numbers chờ duyệt |
| 5 | Admin xem danh sách chờ duyệt | `/approvals` | GET | Lấy thành công danh sách pending |
| 6 | Admin phê duyệt bài tập | `/approvals/:id` | PUT | Duyệt thành công, ghi feedback phản hồi |
| 7 | Tạo ca thực hành mới | `/sessions` | POST | Tạo ca thành công kèm thời gian mở/đóng |
| 8 | Giảng viên gán 3 câu trắc nghiệm | `/sessions/:id/mcqs/assign` | POST | Gán q1, q2, q3 thành công vào ca |
| 9 | Sinh viên lấy đề trắc nghiệm | `/sessions/:id/mcqs` | GET | Lấy đề thành công (gồm 3 câu hỏi) |
| 10 | Sinh viên nộp trắc nghiệm | `/sessions/:id/mcqs/submit` | POST | Đúng 2/3 câu (67 điểm) - Chấm điểm tự động ở Server |
| 11 | Sinh viên tải lại đáp án đã lưu | `/sessions/:id/mcqs/answers` | GET | Khôi phục chính xác các câu đã tích khi reload |

---

## 2. Các tệp đã thay đổi và tạo mới (Giai đoạn 9)

### 2.1 Backend (`project/backend`)
- **[MODIFY]** [DatabaseService.ts](file:///e:/Workspace/WorkJob/MR_Cong_AI/Demo_Platform/project/backend/src/services/DatabaseService.ts): 
  - Khởi tạo các bảng SQLite `mcq_questions`, `session_mcqs`, `student_mcq_answers`, và `approval_requests`.
  - Thực hiện seed 3 câu hỏi trắc nghiệm mẫu của môn Giải thuật.
  - Xây dựng các phương thức lưu đáp án, tự động chấm điểm trắc nghiệm, và phê duyệt bài lab.
- **[MODIFY]** [index.ts](file:///e:/Workspace/WorkJob/MR_Cong_AI/Demo_Platform/project/backend/src/index.ts): Đăng ký các endpoints:
  - `GET /mcqs` và `POST /mcqs`
  - `GET /sessions/:id/mcqs`
  - `POST /sessions/:id/mcqs/assign`
  - `POST /sessions/:id/mcqs/submit` (Tự động chấm điểm trắc nghiệm)
  - `GET /sessions/:id/mcqs/answers` (Tải câu trả lời đã lưu)
  - `GET /approvals` và `PUT /approvals/:id` (Duyệt/từ chối của Admin)
  - Phát tín hiệu `session:plagiarism` qua Socket.IO khi quét sao chép xong.
- **[NEW]** [test_mcq_approvals.js](file:///e:/Workspace/WorkJob/MR_Cong_AI/Demo_Platform/project/backend/test_mcq_approvals.js): Kịch bản tự động kiểm thử toàn bộ luồng của Giai đoạn 9.

### 2.2 Frontend (`project/frontend`)
- **[MODIFY]** [api.ts](file:///e:/Workspace/WorkJob/MR_Cong_AI/Demo_Platform/project/frontend/lib/api.ts): Khai báo các API helpers cho MCQ và approvals.
- **[NEW]** [approvals/page.tsx](file:///e:/Workspace/WorkJob/MR_Cong_AI/Demo_Platform/project/frontend/app/[locale]/approvals/page.tsx): Trang phê duyệt dành riêng cho Admin: hiển thị danh sách bài lab chờ duyệt, cho phép Admin xem thông tin, duyệt/từ chối và nhập lời phản hồi trực tiếp.
- **[MODIFY]** [app-sidebar.tsx](file:///e:/Workspace/WorkJob/MR_Cong_AI/Demo_Platform/project/frontend/components/app-sidebar.tsx): Tích hợp nhóm menu **"Quản trị hệ thống"** (chỉ hiển thị với tài khoản `admin`) chứa liên kết đến trang Phê duyệt bài thực hành.
- **[MODIFY]** [lab-browser-content.tsx](file:///e:/Workspace/WorkJob/MR_Cong_AI/Demo_Platform/project/frontend/app/[locale]/labs/lab-browser-content.tsx): Tích hợp Tab trắc nghiệm trên giao diện của sinh viên: Hiển thị danh sách câu hỏi trắc nghiệm, tích chọn phương án và tự động lưu đáp án, tính điểm tự động.
- **[MODIFY]** [vi.json](file:///e:/Workspace/WorkJob/MR_Cong_AI/Demo_Platform/project/frontend/messages/vi.json) & [en.json](file:///e:/Workspace/WorkJob/MR_Cong_AI/Demo_Platform/project/frontend/messages/en.json): Bổ sung các bản dịch ngôn ngữ tương ứng.

### 2.3 Khắc phục tương thích chạy cục bộ (Windows Local Environment Integration)
- **[MODIFY]** [index.ts](file:///e:/Workspace/WorkJob/MR_Cong_AI/Demo_Platform/project/backend/src/index.ts):
  - Chuẩn hóa ký tự xuống dòng (`\r\n` thành `\n`) trước khi so khớp `actualOutput` và `expectedOutput` trong quá trình chấm điểm tự động, khắc phục lỗi chấm điểm trượt khi chạy cục bộ trên môi trường Windows (sử dụng `LocalProcessRunner`).
- **[MODIFY]** [test_session_flow.js](file:///e:/Workspace/WorkJob/MR_Cong_AI/Demo_Platform/project/backend/test_session_flow.js):
  - Bổ sung bước gửi yêu cầu `PUT /sessions/:id` kích hoạt ca thi sang trạng thái `active` sau khi tạo mới, khắc phục lỗi trả về `null` của API `/sessions/active` trong ca kiểm thử sinh viên.
- **[MODIFY]** [.env](file:///e:/Workspace/WorkJob/MR_Cong_AI/Demo_Platform/project/backend/.env):
  - Chuyển đổi `EXECUTION_MODE` từ `docker` sang `local` để hỗ trợ chạy toàn bộ testcases lập trình mà không cần khởi động tiến trình Docker daemon.

### 2.4 Tối ưu hóa Hiệu năng & Khắc phục Cảnh báo Định tuyến (Performance & Routing Warnings Fix)
- **[MODIFY]** [index.ts](file:///e:/Workspace/WorkJob/MR_Cong_AI/Demo_Platform/project/backend/src/index.ts):
  - Tích hợp **API Performance Profiling Middleware** đo đạc chính xác thời gian phản hồi (duration ms) của từng API. Kết quả cho thấy cơ sở dữ liệu SQLite trong bộ nhớ có độ trễ cực thấp (chỉ từ 1ms - 5ms).
- **[MODIFY]** [vi.json](file:///e:/Workspace/WorkJob/MR_Cong_AI/Demo_Platform/project/frontend/messages/vi.json) & [en.json](file:///e:/Workspace/WorkJob/MR_Cong_AI/Demo_Platform/project/frontend/messages/en.json):
  - Bổ sung các bản dịch còn thiếu trong namespace `common` (`language`, `logout`, `continue`, `review`, `open`, `copyCode`, `copied`) để tránh việc ném lỗi cảnh báo `MISSING_MESSAGE` làm trì hoãn quá trình render giao diện của Next.js client.
