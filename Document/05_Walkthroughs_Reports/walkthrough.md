# Nhật Ký Thực Thi (Walkthrough) — Tích Hợp & Kiểm Thử 7 Bài Toán Lập Trình Mới

Tài liệu này tổng hợp toàn bộ các thay đổi mã nguồn, giải thuật tối ưu và kết quả thử nghiệm thực tế cho **7 bài toán lập trình mới** được đưa vào hệ thống Online Coding Lab.

---

## 🛠️ Thay Đổi Đã Thực Hiện

### 1. Đăng Ký Cấu HÌnh Bài Lab
- **Tệp chỉnh sửa**: [ProblemRegistry.ts](file:///e:/Workspace/WorkJob/MR_Cong_AI/Demo_Platform/project/backend/src/models/ProblemRegistry.ts).

### 2. Phát Triển Bộ Mã Nguồn Mẫu (Reference Solutions)
- **Hồ sơ sử dụng**: `python_basic` (Python 3).

### 3. Sửa Lỗi Console Rỗng khi Chạy Thử (Run Code)
- **Tệp chỉnh sửa**: [lab-workspace-content.tsx](file:///e:/Workspace/WorkJob/MR_Cong_AI/Demo_Platform/project/frontend/app/[locale]/labs/[labId]/lab-workspace-content.tsx).

### 4. Sửa Lỗi Hiển Thị Đuôi File Ở Workspace Editor
- **Tệp chỉnh sửa**: [index.ts](file:///e:/Workspace/WorkJob/MR_Cong_AI/Demo_Platform/project/backend/src/index.ts).
- **Nguyên nhân bug**: Khi lấy thông tin cấu hình qua API `GET /profiles/:id`, Backend bỏ sót không trả về trường `extension`. Do đó trên Frontend, biến `profile.extension` bị `undefined`, khiến tên tệp hiển thị ở tiêu đề tab Workspace Editor bị rơi vào fallback `.sh` (`Main.sh`), mặc dù môi trường thực thi của bài toán thực tế là Python 3 (`python_basic`).
- **Giải pháp**: Bổ sung trường `extension: profile.extension` vào trong đối tượng JSON trả về của endpoint `GET /profiles/:id` ở Backend. Khi trang tải lại, Frontend nhận diện chính xác đuôi `.py`, giúp tiêu đề tab hiển thị đúng là `Main.py` (hoặc `.cpp`, `.java` tương ứng với từng bài lab).

### 5. Triển Khai Tách Biệt Ví Dụ Mẫu (Examples) & Bộ Testcases (Testcases) Ẩn
- **Thay đổi kiểu dữ liệu**: Bổ sung trường `examples` dạng `{ input: string; output: string }[]` vào `LabConfig` ở Backend và `Lab` ở Frontend.
- **Nâng cấp UI Workspace**: Hiển thị khu vực **Ví dụ mẫu (Examples)** cực kỳ đẹp mắt kèm nút bấm **"Dùng làm Custom Input"** tiện lợi cho sinh viên.

### 6. Sửa Lỗi Cảnh Báo ENVIRONMENT_FALLBACK của next-intl
- **Tệp chỉnh sửa**:
  - [lab-browser-content.tsx](file:///e:/Workspace/WorkJob/MR_Cong_AI/Demo_Platform/project/frontend/app/[locale]/labs/lab-browser-content.tsx)
  - [page.tsx](file:///e:/Workspace/WorkJob/MR_Cong_AI/Demo_Platform/project/frontend/app/[locale]/submissions/page.tsx)
- **Nguyên nhân bug**: `next-intl` trong chế độ Server Components / Client Hydration yêu cầu một mốc thời gian tĩnh làm tham số `now` khi định dạng thời gian tương đối (`relativeTime`). Nếu không được cung cấp, nó sẽ đưa ra cảnh báo console về việc fallback về thời gian hiện tại của client, có thể dẫn đến lỗi lệch Hydration (Hydration Mismatch).
- **Giải pháp**:
  - Import hook `useNow` từ `'next-intl'`.
  - Khởi tạo giá trị tĩnh `const now = useNow();` bên trong Client Component.
  - Truyền tham số `now` này vào hàm định dạng: `format.relativeTime(date, { now })`.

---

## 🧪 Kết Quả Xác Minh (Validation Results)

### Chạy Kịch Bản Kiểm Thử Tự Động
Mã lệnh chạy thực tế:
```bash
node test_new_programming_labs.js
```

### Kết quả xuất ra từ hệ thống:
```
🎉 SUCCESS: All 7 new labs successfully passed integration tests with 100/100 points!
```

---

## 📂 6. Đồng Bộ Hóa Tài Liệu Workspace Vật Lý
Theo đúng quy tắc của dự án, hai tệp Artifact động đã được đồng bộ vào thư mục vật lý tương ứng:
- `task.md` -> [Document/07_Scratchpads/task.md](file:///e:/Workspace/WorkJob/MR_Cong_AI/Demo_Platform/Document/07_Scratchpads/task.md)
- `walkthrough.md` -> [Document/05_Walkthroughs_Reports/walkthrough.md](file:///e:/Workspace/WorkJob/MR_Cong_AI/Demo_Platform/Document/05_Walkthroughs_Reports/walkthrough.md)
- Phân tích thiết kế giải thuật -> [Khao_sat_va_Thiet_ke_Lab_Lap_Trinh.md](file:///e:/Workspace/WorkJob/MR_Cong_AI/Demo_Platform/Document/08_Lab_Data/Khao_sat_va_Thiet_ke_Lab_Lap_Trinh.md)
- Lịch sử tiến độ dự án -> [PROJECT_FLOW.md](file:///e:/Workspace/WorkJob/MR_Cong_AI/Demo_Platform/Document/PROJECT_FLOW.md)
