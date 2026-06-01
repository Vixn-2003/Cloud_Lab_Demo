# Giải Trình Lựa Chọn Cơ Sở Dữ Liệu: SQLite vs MySQL/PostgreSQL (Database Architecture Specification)

**Ngày**: 2026-06-01  
**Trạng thái**: Đặc tả kỹ thuật / Giải trình kiến trúc  
**Mục tiêu**: Làm rõ vai trò, mục đích sử dụng và lý do tồn tại song song của hai hệ cơ sở dữ liệu **SQLite** và **MySQL/PostgreSQL** trong hệ thống Cloud Lab.

---

## 🏛️ 1. Tổng Quan Về Kiến Trúc Cơ Sở Dữ Liệu (Overview)

Hệ thống Cloud Lab được thiết kế để phân tách rõ ràng giữa **Cơ sở dữ liệu lưu trữ của Nền tảng (Platform Database)** và **Cơ sở dữ liệu phục vụ học tập của Sinh viên (Student Lab Database)**. 

Mỗi hệ quản trị CSDL xuất hiện trong dự án đều đóng một vai trò riêng biệt để tối ưu hóa giữa tính tiện dụng khi phát triển cục bộ và khả năng mở rộng khi triển khai sản xuất (Production).

---

## 📊 2. Bảng Phân Tách Vai Trò Thực Tế (Database Role Mapping)

| Hệ CSDL | Vị trí sử dụng | Trạng thái hiện tại | Lý do và Mục đích sử dụng |
|---|---|---|---|
| **SQLite** <br>(`better-sqlite3`) | **Platform Database** <br>(CSDL lưu trữ chính của Backend hệ thống) | **Đang sử dụng thực tế** <br>(Tệp tin `project/backend/lab_platform.db`) | *   **Không cần cài đặt (Zero Config)**: Nhà phát triển mới hoặc giảng viên chỉ cần kéo code về chạy là CSDL tự động khởi tạo mà không cần cài đặt hay chạy dịch vụ bên thứ ba. <br>*   **Dạng tệp đơn (Single File)**: Toàn bộ dữ liệu (Người dùng, Cấu hình bài lab, Lịch sử nộp bài, Điểm số) được gói gọn trong 1 file, cực kỳ tiện lợi cho việc sao lưu, test nhanh và phát triển local. <br>*   **Hiệu năng cực cao**: Sử dụng thư viện `better-sqlite3` tương tác trực tiếp qua bộ nhớ trong của Node.js, cho tốc độ đọc/ghi siêu tốc. |
| **MySQL / PostgreSQL** | **Platform Database** <br>(Quy hoạch cho máy chủ Production thật) | **Quy hoạch định hướng** <br>(Đặc tả trong tài liệu nghiên cứu `deep-research-report.md`) | *   **Khả năng chịu tải & Đồng thời**: Khi hệ thống đưa vào chạy thực tế cho hàng ngàn sinh viên truy cập cùng lúc, SQLite (vốn bị khóa ghi toàn bảng) sẽ được thay thế bằng PostgreSQL hoặc MySQL để hỗ trợ kết nối đồng thời cao. <br>*   **Mức độ tích hợp**: Cấu trúc bảng của hệ thống hoàn toàn tương thích chuẩn quan hệ, dễ dàng di chuyển (migration) từ SQLite lên MySQL/Postgres bằng Prisma hoặc Sequelize. |
| **MySQL / PostgreSQL** <br>(Chạy trong Container) | **Student Lab Sandbox** <br>(Môi trường học tập của Sinh viên) | **Chỉ dành cho các bài Lab Database** <br>(Khi sinh viên làm lab về SQL query) | *   **Kiến trúc cô lập**: Khi sinh viên học môn "Cơ sở dữ liệu" cần thực hành truy vấn SQL, hệ thống sẽ khởi tạo một container Docker chứa MySQL hoặc Postgres biệt lập. <br>*   **An toàn tuyệt đối**: Sinh viên có thể tự do tạo, xóa bảng, hoặc chèn dữ liệu phá hoại trong container CSDL đó mà không làm ảnh hưởng đến dữ liệu người dùng hay điểm số chính trên máy chủ LMS. |

---

## 💡 3. Kết Luận Dành Cho Nhà Phát Triển (Developer Takeaway)

*   **Khi code cục bộ (Local Development)**: Bạn **chỉ cần quan tâm đến SQLite** (tự động chạy bằng npm). Bạn hoàn toàn **không cần cài đặt MySQL** trên máy cá nhân để chạy dự án.
*   **Khi tích hợp bài Lab**: Nếu bạn thiết kế một bài Lab dạy học môn SQL, bạn sẽ viết một Dockerfile chứa MySQL mẫu và cấu hình nó chạy cô lập trong container làm bài của sinh viên, độc lập hoàn toàn với CSDL của Express Backend.
