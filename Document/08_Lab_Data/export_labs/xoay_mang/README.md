# XOAY MẢNG

### Mô tả bài toán
Cho mảng A[] gồm N số nguyên và số tự nhiên d. Hãy thực hiện quay mảng A[] với d phần tử từ trái qua phải (dịch trái d phần tử, đưa các phần tử bị dịch ra sau cùng).

Ví dụ A[] = {1, 2, 3, 4, 5}, d = 2 ta nhận được mảng A[] = {3, 4, 5, 1, 2}.

### Input
- Dòng đầu tiên đưa vào T là số lượng bộ test.
- Những dòng tiếp theo, mỗi dòng đưa vào một test. Mỗi test gồm hai dòng:
  - Dòng đầu tiên đưa vào N là số lượng phần tử của mảng A[] và số d;
  - Dòng tiếp theo đưa vào các phần tử A[i] của mảng A[].

### Output
Đưa ra kết quả mảng sau khi quay của mỗi test theo từng dòng.

### Ràng buộc
- 1 <= T <= 100
- 1 <= d <= N <= 10^7
- 0 <= A[i] <= 10^9