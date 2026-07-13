# Task list: Giai đoạn 9 — MCQ & Workflow phê duyệt nâng cao

- [x] **Phần 1: Cấu trúc Cơ sở dữ liệu MCQ & Approvals (Backend)**
  - [x] Khởi tạo các bảng SQLite `mcq_questions`, `session_mcqs`, `student_mcq_answers`, và `approval_requests` trong `DatabaseService.ts`.
  - [x] Seed các câu hỏi trắc nghiệm MCQ mẫu cho môn học Cấu trúc dữ liệu & Giải thuật.
  - [x] Triển khai các hàm truy vấn gán/nộp bài trắc nghiệm và phê duyệt bài lab trong `DatabaseService.ts`.
- [x] **Phần 2: Tích hợp API MCQ, Approvals & Socket.IO (Backend)**
  - [x] Đăng ký các endpoints MCQ (`/mcqs`, `/sessions/:id/mcqs`, `/sessions/:id/mcqs/submit`).
  - [x] Đăng ký các endpoints phê duyệt bài thực hành của Admin (`/approvals`, `/approvals/:id`).
  - [x] Tích hợp phát tín hiệu Socket.IO thời gian thực cảnh báo sao chép và đóng băng/hết giờ ca thi.
- [x] **Phần 3: Giao diện Phê duyệt của Admin & Tích hợp API Frontend**
  - [x] Thêm các khai báo gọi API cho MCQ và Approval Workflow trong `api.ts`.
  - [x] Xây dựng màn hình phê duyệt bài tập dành cho Admin `/approvals/page.tsx` hỗ trợ xem mô tả, duyệt và viết phản hồi.
- [x] **Phần 4: Giao diện Làm bài Trắc nghiệm MCQ của Sinh viên (Frontend)**
  - [x] Cập nhật màn hình phòng thi `lab-browser-content.tsx` tích hợp thêm tab Làm bài Trắc nghiệm (hiển thị câu hỏi, đáp án, và tự động nộp bài khi sinh viên chọn).
  - [x] Bổ sung các bản dịch ngôn ngữ tương ứng trong `vi.json` và `en.json`.
- [x] **Phần 5: Kiểm thử, Viết Tài liệu & Hoàn thiện**
  - [x] Kiểm tra build dự án (`pnpm build`).
  - [x] Viết và chạy script kiểm thử tích hợp tự động `test_mcq_approvals.js`.
  - [x] Viết tài liệu `Document/02_Architecture_Design/MCQ_APPROVAL_SPEC.md`.
  - [x] Cập nhật `Document/PROJECT_FLOW.md` và đồng bộ `task.md` / `walkthrough.md`.
  - [x] Fix lỗi so khớp dòng trên Windows (CRLF vs LF) cho phép kiểm thử tự động chấm điểm đạt điểm tối đa 100/100 cục bộ.
  - [x] Bổ sung bước kích hoạt ca thi (chuyển status từ draft sang active) trong `test_session_flow.js` để kiểm thử luồng học vụ chạy đúng đắn.
  - [x] Tích hợp Middleware đo đạc hiệu năng API và phân tích nguyên nhân gây trễ trang ở môi trường dev.
  - [x] Bổ sung các bản dịch thiếu trong namespace `common` (`language`, `logout`) để ngăn chặn lỗi `MISSING_MESSAGE` gây trễ client-side rendering.

- [x] **Tối ưu hóa Hiệu năng & Khắc phục Vấn đề Audit (Performance Optimization)**
  - [x] Thêm các chỉ mục (INDEX) trên các cột khóa ngoại SQLite trong [DatabaseService.ts](file:///e:/Workspace/WorkJob/MR_Cong_AI/Demo_Platform/project/backend/src/services/DatabaseService.ts).
  - [x] Loại bỏ N+1 query trong hàm `getSessionMonitoringData` bằng cách gộp thành 1 query duy nhất.
  - [x] Trích xuất `db.prepare(...)` ra khỏi vòng lặp `for` trong các tác vụ tạo/cập nhật ca thi và import học viên.
  - [x] Nâng cấp API `GET /submissions` hỗ trợ lọc theo `sessionId` ở backend.
  - [x] Cập nhật gọi API và loại bỏ client-side filtering ở frontend trong [api.ts](file:///e:/Workspace/WorkJob/MR_Cong_AI/Demo_Platform/project/frontend/lib/api.ts) và trang chấm điểm [page.tsx](file:///e:/Workspace/WorkJob/MR_Cong_AI/Demo_Platform/project/frontend/app/%5Blocale%5D/grading/page.tsx).
  - [x] Kiểm thử và chạy thành công 100% bộ kiểm thử tự động của hệ thống.

- [x] **Hỗ trợ Giao diện Sáng (Light Mode)**
  - [x] Cấu hình lại `globals.css` để hỗ trợ cả `:root` (Light Mode) và `.dark` (Dark Mode).
  - [x] Tích hợp `ThemeProvider` vào layout gốc `layout.tsx` và cấu hình thuộc tính `suppressHydrationWarning`.
  - [x] Xây dựng component `ThemeSwitcher` chuyển đổi linh hoạt bằng `next-themes`.
  - [x] Tích hợp bộ chuyển đổi giao diện vào Sidebar Footer ở chế độ đầy đủ và thu gọn.
  - [x] Bổ sung các bản dịch đa ngôn ngữ tương ứng (`theme`) trong `vi.json` và `en.json`.
  - [x] Khắc phục lỗi tương phản chữ trắng (`text-white`) và nền tối cứng trên giao diện chính và các trang tính năng khi bật Light Mode.
  - [x] Tích hợp tính năng Ẩn/Hiện mật khẩu (Show/Hide Password toggle) bằng các biểu tượng Eye/EyeOff của `lucide-react` trong trang Đăng nhập để tăng tính tiện dụng (UX).
  - [x] Tái thiết kế giao diện hộp thoại Tạo/Sửa ca thực hành rộng rãi hơn hẳn (max-w-6xl), sửa triệt để lỗi đè/chèn văn bản trên các Tab và áp dụng màu sắc thích ứng Light/Dark Mode đồng bộ.


