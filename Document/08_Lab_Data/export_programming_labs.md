# 📚 BỘ EXPORT CODE & TESTCASES CHO 7 BÀI TOÁN LẬP TRÌNH MỚI

Tài liệu này tổng hợp toàn bộ **Đặc tả đề bài**, **Ví dụ mẫu**, **Bộ testcases ẩn** và **Mã nguồn giải thuật mẫu tối ưu (Reference Solutions - Python)** của 7 bài toán lập trình mới thuộc môn *Cấu trúc dữ liệu & Giải thuật*.

Bộ dữ liệu vật lý (bao gồm các file `solution.py`, `README.md`, `examples.json`, `testcases.json` cho từng bài toán) đã được xuất thành công ra thư mục:
👉 [Document/08_Lab_Data/export_labs/](file:///e:/Workspace/WorkJob/MR_Cong_AI/Demo_Platform/Document/08_Lab_Data/export_labs/)

---

## 🗂️ Danh sách các bài toán đã xuất

1. [MAX TRIPLE](#1-max-triple) (Mã: `max_triple`)
2. [XOAY MẢNG](#2-xoay-mảng) (Mã: `xoay_mang`)
3. [CON SỐ DUYÊN NỢ](#3-con-số-duyên-nợ) (Mã: `con_so_duyen_no`)
4. [LÃI SUẤT NGÂN HÀNG](#4-lãi-suất-ngân-hàng) (Mã: `lai_suat_ngan_hang`)
5. [DÃY SỐ HAMMING](#5-dãy-số-hamming) (Mã: `day_so_hamming`)
6. [LIỆT KÊ CẶP SỐ NGUYÊN TỐ CÙNG NHAU](#6-liệt-kê-cặp-số-nguyên-tố-cùng-nhau) (Mã: `liet_ke_cap_so_nguyen_to_cung_nhau`)
7. [TÍNH TOÁN LƯỢNG MƯA](#7-tính toán-lượng-mưa) (Mã: `tinh_toan_luong_mua`)

---

## 1. MAX TRIPLE

- **Đường dẫn thư mục**: [export_labs/max_triple/](file:///e:/Workspace/WorkJob/MR_Cong_AI/Demo_Platform/Document/08_Lab_Data/export_labs/max_triple/)
- **Độ phức tạp**: $O(N)$ (Quét tuyến tính tìm 3 số lớn nhất không cần Sort để tránh TLE).

### 📝 Đề bài
Cho mảng A[] gồm N số nguyên. Nhiệm vụ của bạn là tìm tổng lớn nhất của bộ ba số trong mảng.
*Chú ý: Nếu sử dụng kỹ thuật sắp xếp, submit lời giải của bạn sẽ bị fail (TLE). Hãy tối ưu với độ phức tạp O(N).*

### 📥 Input / Output Ví dụ
* **Input**:
  ```
  2
  7
  1 2 3 0 -1 8 10
  7
  9 8 20 3 4 -1 0
  ```
* **Output**:
  ```
  21
  37
  ```

### 💻 Mã nguồn mẫu (`solution.py`)
```python
import sys
def solve():
    input_data = sys.stdin.read().split()
    if not input_data:
        return
    num_tests = int(input_data[0])
    idx = 1
    for _ in range(num_tests):
        n = int(input_data[idx])
        idx += 1
        m1, m2, m3 = -99999999999999999, -99999999999999999, -99999999999999999
        for i in range(n):
            val = int(input_data[idx + i])
            if val > m1:
                m3 = m2
                m2 = m1
                m1 = val
            elif val > m2:
                m3 = m2
                m2 = val
            elif val > m3:
                m3 = val
        idx += n
        print(m1 + m2 + m3)
if __name__ == '__main__':
    solve()
```

---

## 2. XOAY MẢNG

- **Đường dẫn thư mục**: [export_labs/xoay_mang/](file:///e:/Workspace/WorkJob/MR_Cong_AI/Demo_Platform/Document/08_Lab_Data/export_labs/xoay_mang/)
- **Độ phức tạp**: $O(N)$ (Sử dụng kỹ thuật cắt lát mảng Slicing của Python).

### 📝 Đề bài
Cho mảng A[] gồm N số nguyên và số tự nhiên d. Hãy thực hiện quay mảng A[] với d phần tử từ trái qua phải (dịch trái d phần tử, đưa các phần tử bị dịch ra sau cùng).

### 📥 Input / Output Ví dụ
* **Input**:
  ```
  2
  5 2
  1 2 3 4 5
  10 3
  2 4 6 8 10 12 14 16 18 20
  ```
* **Output**:
  ```
  3 4 5 1 2
  8 10 12 14 16 18 20 2 4 6
  ```

### 💻 Mã nguồn mẫu (`solution.py`)
```python
import sys
def solve():
    input_data = sys.stdin.read().split()
    if not input_data:
        return
    num_tests = int(input_data[0])
    idx = 1
    for _ in range(num_tests):
        n = int(input_data[idx])
        d = int(input_data[idx + 1])
        idx += 2
        arr = input_data[idx:idx + n]
        idx += n
        d = d % n
        rotated = arr[d:] + arr[:d]
        print(" ".join(rotated))
if __name__ == '__main__':
    solve()
```

---

## 3. CON SỐ DUYÊN NỢ

- **Đường dẫn thư mục**: [export_labs/con_so_duyen_no/](file:///e:/Workspace/WorkJob/MR_Cong_AI/Demo_Platform/Document/08_Lab_Data/export_labs/con_so_duyen_no/)
- **Độ phức tạp**: $O(1)$ cho mỗi testcase (Xử lý chuỗi kiểm tra phần tử đầu và cuối).

### 📝 Đề bài
Con số duyên nợ là con số có chữ số đầu và chữ số cuối giống nhau. Viết chương trình kiểm tra xem một số nguyên dương n ghi trong hệ thập phân có chữ số đầu và chữ số cuối giống nhau không?

### 📥 Input / Output Ví dụ
* **Input**:
  ```
  2
  12345
  123451
  ```
* **Output**:
  ```
  NO
  YES
  ```

### 💻 Mã nguồn mẫu (`solution.py`)
```python
import sys
def solve():
    input_data = sys.stdin.read().split()
    if not input_data:
        return
    num_tests = int(input_data[0])
    for i in range(1, num_tests + 1):
        s = input_data[i].strip()
        if len(s) > 0 and s[0] == s[-1]:
            print("YES")
        else:
            print("NO")
if __name__ == '__main__':
    solve()
```

---

## 4. LÃI SUẤT NGÂN HÀNG

- **Đường dẫn thư mục**: [export_labs/lai_suat_ngan_hang/](file:///e:/Workspace/WorkJob/MR_Cong_AI/Demo_Platform/Document/08_Lab_Data/export_labs/lai_suat_ngan_hang/)
- **Độ phức tạp**: $O(1)$ sử dụng công thức toán học Logarit.

### 📝 Đề bài
Ngân hàng thông báo lãi suất là X % mỗi năm. Với số tiền gửi vào ban đầu là N. Sau mỗi năm, tiền lãi sẽ được cộng dồn (lãi kép). Hỏi sau ít nhất bao nhiêu năm thì số tiền đạt được tối thiểu là M.

### 📥 Input / Output Ví dụ
* **Input**:
  ```
  2
  200.00 6.5 300
  500 4 1000.00
  ```
* **Output**:
  ```
  7
  18
  ```

### 💻 Mã nguồn mẫu (`solution.py`)
```python
import sys
import math
def solve():
    input_data = sys.stdin.read().split()
    if not input_data:
        return
    num_tests = int(input_data[0])
    idx = 1
    for _ in range(num_tests):
        n = float(input_data[idx])
        x = float(input_data[idx+1])
        m = float(input_data[idx+2])
        idx += 3
        ratio = m / n
        rate = 1.0 + x / 100.0
        years = math.ceil(math.log(ratio) / math.log(rate))
        print(years)
if __name__ == '__main__':
    solve()
```

---

## 5. DÃY SỐ HAMMING

- **Đường dẫn thư mục**: [export_labs/day_so_hamming/](file:///e:/Workspace/WorkJob/MR_Cong_AI/Demo_Platform/Document/08_Lab_Data/export_labs/day_so_hamming/)
- **Độ phức tạp**: $O(T \log K)$ với $K \approx 8000$ (Sinh trước dãy số Hamming nhỏ hơn $10^{18}$ và tìm kiếm nhị phân `bisect`).

### 📝 Đề bài
Dãy số nguyên dương tăng dần trong đó ước số nguyên tố lớn nhất của các số trong dãy đều không vượt quá 5 được gọi là dãy số Hamming. Ví dụ 10 = 2x5 thuộc dãy Hamming còn 26 = 2x13 không thuộc dãy Hamming. Số 1 được coi là số đầu tiên của dãy Hamming. 
Cho số nguyên dương N. Xác định xem N có thuộc dãy Hamming hay không và nếu có thì thứ tự của N trong dãy Hamming là bao nhiêu.

### 📥 Input / Output Ví dụ
* **Input**:
  ```
  11
  1
  2
  6
  7
  8
  9
  10
  11
  12
  13
  14
  ```
* **Output**:
  ```
  1
  2
  6
  Not in sequence
  7
  8
  9
  Not in sequence
  10
  Not in sequence
  Not in sequence
  ```

### 💻 Mã nguồn mẫu (`solution.py`)
```python
import sys
import bisect
def solve():
    limit = 10**18
    p2 = [2**i for i in range(61)]
    p3 = [3**j for j in range(39)]
    p5 = [5**k for k in range(27)]
    hamming = []
    for x2 in p2:
        for x3 in p3:
            val23 = x2 * x3
            if val23 > limit:
                break
            for x5 in p5:
                val = val23 * x5
                if val > limit:
                    break
                hamming.append(val)
    hamming.sort()
    
    input_data = sys.stdin.read().split()
    if not input_data:
        return
    num_tests = int(input_data[0])
    for i in range(1, num_tests + 1):
        n = int(input_data[i])
        idx = bisect.bisect_left(hamming, n)
        if idx < len(hamming) and hamming[idx] == n:
            print(idx + 1)
        else:
            print("Not in sequence")
if __name__ == '__main__':
    solve()
```

---

## 6. LIỆT KÊ CẶP SỐ NGUYÊN TỐ CÙNG NHAU

- **Đường dẫn thư mục**: [export_labs/liet_ke_cap_so_nguyen_to_cung_nhau/](file:///e:/Workspace/WorkJob/MR_Cong_AI/Demo_Platform/Document/08_Lab_Data/export_labs/liet_ke_cap_so_nguyen_to_cung_nhau/)
- **Độ phức tạp**: $O(N^2 \log(\max A))$ (Duyệt cặp phần tử và tìm ước chung lớn nhất `math.gcd`).

### 📝 Đề bài
Cho dãy số A[] có n phần tử là các số nguyên dương khác nhau, giá trị không quá 100. Hãy liệt kê các cặp số nguyên tố cùng nhau xuất hiện trong dãy theo thứ tự tăng dần (sắp xếp tăng dần theo phần tử thứ nhất, sau đó theo phần tử thứ hai), mỗi cặp số in trên một dòng. Một cặp số (a, b) được gọi là nguyên tố cùng nhau nếu ước chung lớn nhất của chúng bằng 1.

### 📥 Input / Output Ví dụ
* **Input**:
  ```
  5
  3 7 9 6 13
  ```
* **Output**:
  ```
  3 7
  3 13
  6 7
  6 13
  7 9
  7 13
  9 13
  ```

### 💻 Mã nguồn mẫu (`solution.py`)
```python
import sys
import math
def solve():
    input_data = sys.stdin.read().split()
    if not input_data:
        return
    n = int(input_data[0])
    arr = [int(x) for x in input_data[1:n+1]]
    arr.sort()
    for i in range(n):
        for j in range(i + 1, n):
            if math.gcd(arr[i], arr[j]) == 1:
                print(f"{arr[i]} {arr[j]}")
if __name__ == '__main__':
    solve()
```

---

## 7. TÍNH TOÁN LƯỢNG MƯA

- **Đường dẫn thư mục**: [export_labs/tinh_toan_luong_mua/](file:///e:/Workspace/WorkJob/MR_Cong_AI/Demo_Platform/Document/08_Lab_Data/export_labs/tinh_toan_luong_mua/)
- **Độ phức tạp**: $O(N)$ (Sử dụng cấu trúc dữ liệu Dictionary để gom nhóm trạm đo).

### 📝 Đề bài
Tính lượng mưa trung bình trong 1 giờ (60 phút) của từng trạm theo đúng thứ tự xuất hiện lần đầu của trạm đó trong danh sách.
Thông tin in ra mỗi dòng gồm: Mã trạm đo (T01, T02,...), Tên trạm, Lượng mưa trung bình 1 giờ (lấy chính xác 2 chữ số thập phân).

### 📥 Input / Output Ví dụ
* **Input**:
  ```
  3
  Dong Anh
  07:30
  08:00
  60
  Cau Giay
  07:45
  08:12
  50
  Soc Son
  08:00
  09:15
  78
  ```
* **Output**:
  ```
  T01 Dong Anh 120.00
  T02 Cau Giay 111.11
  T03 Soc Son 62.40
  ```

### 💻 Mã nguồn mẫu (`solution.py`)
```python
import sys
def solve():
    lines = sys.stdin.read().splitlines()
    if not lines:
        return
    n_records = int(lines[0].strip())
    idx = 1
    
    stations = []
    station_indices = {}
    station_rain = {}
    station_time = {}
    
    for _ in range(n_records):
        if idx >= len(lines):
            break
        name = lines[idx].strip()
        start_t = lines[idx+1].strip()
        end_t = lines[idx+2].strip()
        rain_val = float(lines[idx+3].strip())
        idx += 4
        
        sh, sm = map(int, start_t.split(':'))
        eh, em = map(int, end_t.split(':'))
        duration = (eh * 60 + em) - (sh * 60 + sm)
        duration_hours = duration / 60.0
        
        if name not in station_indices:
            station_indices[name] = len(stations)
            stations.append(name)
            station_rain[name] = 0.0
            station_time[name] = 0.0
            
        station_rain[name] += rain_val
        station_time[name] += duration_hours
        
    for i, name in enumerate(stations):
        code = f"T{i+1:02d}"
        avg_rain = station_rain[name] / station_time[name]
        print(f"{code} {name} {avg_rain:.2f}")
        
if __name__ == '__main__':
    solve()
```

---

## 💡 Hướng dẫn Tích hợp nhanh
Các file JSON được cấu trúc chuẩn hóa, bạn có thể đọc trực tiếp bằng Node.js / Python để import vào DB:
- `examples.json`: Chứa ví dụ hiển thị cho sinh viên.
- `testcases.json`: Chứa dữ liệu đầu vào và kết quả mong đợi dùng để chấm điểm tự động.
- `solution.py`: Dùng làm đáp án mẫu và đối chứng kiểm thử.
