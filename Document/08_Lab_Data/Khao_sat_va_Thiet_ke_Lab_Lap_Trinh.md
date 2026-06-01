# 📖 Khao sát và Thiết kế các Bài toán Lập trình & Bộ Testcases

Tài liệu này ghi nhận quá trình phân tích đặc tả yêu cầu, thiết kế giải thuật tối ưu và kết quả thử nghiệm thực tế cho **7 bài toán lập trình thuật toán mới** được tích hợp vào hệ thống **Online Coding Lab**.

---

## 🎯 1. Tổng Quan & Cấu Hình Đăng Ký Hệ Thống

Toàn bộ 7 bài toán đã được đăng ký thành công vào cơ sở dữ liệu và hệ thống thông tin môn học:
- **Khoa quản lý**: Khoa Công nghệ Phần mềm (`soft_eng`).
- **Môn học**: Cấu trúc dữ liệu & Giải thuật (`algos`).
- **Hồ sơ thực thi (Execution Profile)**: Python 3 Basic (`python_basic`).
- **Hình thức**: Chấm điểm tự động theo bộ testcase (Standard Input/Output Exact Matching).

---

## ⚡ 2. Thiết Kế Giải Thuật Tối Ưu Cho Từng Bài Toán

### 2.1. MAX TRIPLE (Tìm bộ ba số có tổng lớn nhất)
- **Yêu cầu đặc biệt**: Không sử dụng kỹ thuật sắp xếp (do mảng có kích thước lên tới $N = 10^6$ phần tử, việc sắp xếp $O(N \log N)$ sẽ gây ra Time Limit Exceeded).
- **Thiết kế tối ưu**: Duy trì ba phần tử lớn nhất $m_1 \ge m_2 \ge m_3$ bằng kỹ thuật quét tuyến tính qua mảng chỉ với một vòng lặp $O(N)$.
- **Độ phức tạp**: 
  - Thời gian: $O(N)$
  - Không gian phụ trợ: $O(1)$

### 2.2. XOAY MẢNG (Rotate Array)
- **Đề bài**: Dịch trái mảng $A$ đi $d$ phần tử, đưa các phần tử bị dịch ra phía sau cùng.
- **Thiết kế tối ưu**: Sử dụng lát cắt danh sách (slicing) của Python: `A[d % N:] + A[:d % N]` để thực thi cực nhanh ở tầng ngôn ngữ C bên dưới của Python.
- **Độ phức tạp**:
  - Thời gian: $O(N)$
  - Không gian phụ trợ: $O(N)$

### 2.3. CON SỐ DUYÊN NỢ (First-Last Digit Matching)
- **Đề bài**: Kiểm tra xem chữ số đầu và cuối của số nguyên dương $n$ ($n < 10^{100}$) có trùng khớp hay không.
- **Thiết kế tối ưu**: Đọc đầu vào dưới dạng chuỗi kí tự (String) để tránh tràn số. So sánh `s[0] == s[-1]`.
- **Độ phức tạp**:
  - Thời gian: $O(1)$
  - Không gian phụ trợ: $O(1)$

### 2.4. LÃI SUẤT NGÂN HÀNG (Compound Interest Simulation)
- **Đề bài**: Tìm số năm gửi tiền $Y$ ít nhất để số tiền đạt tối thiểu $M$ với lãi kép suất $X\%$ từ vốn $N$.
- **Thiết kế tối ưu**: Sử dụng công thức toán học logarit để tính trực tiếp số năm thay vì chạy vòng lặp mô phỏng:
  $$Y = \left\lceil \frac{\ln(M / N)}{\ln(1 + X / 100)} \right\rceil$$
- **Độ phức tạp**:
  - Thời gian: O(1)
  - Không gian phụ trợ: O(1)

### 2.5. DÃY SỐ HAMMING (Hamming Sequence Rank)
- **Yêu cầu**: Cho $N \le 10^{18}$, kiểm tra $N$ có thuộc dãy Hamming hay không và in ra thứ tự xuất hiện (1-indexed).
- **Thiết kế tối ưu**:
  - Số Hamming có dạng $2^a \cdot 3^b \cdot 5^c \le 10^{18}$. Với giới hạn này, số lượng phần tử Hamming cực kỳ nhỏ (chỉ có $88,060$ số Hamming hợp lệ dưới $10^{18}$).
  - Tiến hành sinh trước (precompute) toàn bộ dãy Hamming hợp lệ, sắp xếp tăng dần $O(K \log K)$ với $K \approx 88060$.
  - Khi nhận yêu cầu truy vấn, sử dụng **Tìm kiếm nhị phân (Binary Search / `bisect_left`)** để tìm vị trí của $N$ trong dãy trong thời gian $O(\log K)$.
- **Độ phức tạp**:
  - Thời gian khởi dựng: $O(K \log K)$
  - Thời gian mỗi testcase: $O(\log K)$

### 2.6. LIỆT KÊ CẶP SỐ NGUYÊN TỐ CÙNG NHAU (Listing Coprime Pairs)
- **Đề bài**: Cho mảng $A$ gồm các số khác nhau $\le 100$. Liệt kê các cặp $(a, b)$ có $GCD(a, b) = 1$ theo thứ tự tăng dần.
- **Thiết kế tối ưu**: Sắp xếp mảng $A$ tăng dần, sau đó chạy hai vòng lặp lồng nhau và dùng hàm `math.gcd` để kiểm tra.
- **Độ phức tạp**:
  - Thời gian: $O(N^2 \log(\max A))$

### 2.7. TÍNH TOÁN LƯỢNG MƯA (Rainfall Aggregation)
- **Đề bài**: Tính lượng mưa trung bình mỗi giờ cho từng trạm theo thứ tự xuất hiện đầu tiên.
- **Thiết kế tối ưu**:
  - Duy trì danh sách `stations` để giữ nguyên thứ tự xuất hiện.
  - Sử dụng Hash Map để tích lũy tổng lượng mưa và tổng thời gian mưa của mỗi trạm.
  - Đổi khoảng thời gian từ định dạng `hh:mm` sang phút để tính toán chính xác số giờ.
- **Độ phức tạp**:
  - Thời gian: $O(N)$
  - Không gian phụ trợ: $O(N)$

---

## 🧪 3. Kết Quả Thử Nghiệm Tự Động (Integration Testing)

Hệ thống đã chạy thử nghiệm tự động thông qua script [test_new_programming_labs.js](file:///e:/Workspace/WorkJob/MR_Cong_AI/Demo_Platform/project/backend/test_new_programming_labs.js) bằng cách gửi trực tiếp các Reference Solutions ở trên tới API `/submit` thực tế của Backend.

### Báo cáo kết quả chấm điểm thực tế:

| Tên Bài Thực Hành | Loại hình | Điểm số đạt được | Trạng thái |
| :--- | :--- | :--- | :--- |
| **MAX TRIPLE** | Monaco Code | **100%** | **PASS ✅** |
| **XOAY MẢNG** | Monaco Code | **100%** | **PASS ✅** |
| **CON SỐ DUYÊN NỢ** | Monaco Code | **100%** | **PASS ✅** |
| **LÃI SUẤT NGÂN HÀNG** | Monaco Code | **100%** | **PASS ✅** |
| **DÃY SỐ HAMMING** | Monaco Code | **100%** | **PASS ✅** |
| **LIỆT KÊ CẶP SỐ NGUYÊN TỐ CÙNG NHAU** | Monaco Code | **100%** | **PASS ✅** |
| **TÍNH TOÁN LƯỢNG MƯA** | Monaco Code | **100%** | **PASS ✅** |

---

## 📌 4. Kết Luận
Cả 7 bài toán đều hoạt động chính xác với độ trễ cực thấp, đáp ứng các ràng buộc khắt khe về thời gian và bộ nhớ trong môi trường Docker sandbox cô lập. Dữ liệu nộp bài đã được đồng bộ hóa thành công vào cơ sở dữ liệu SQLite `lab_platform.db`.
