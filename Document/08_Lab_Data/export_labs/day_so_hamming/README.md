# DÃY SỐ HAMMING

### Mô tả bài toán
Dãy số nguyên dương tăng dần trong đó ước số nguyên tố lớn nhất của các số trong dãy đều không vượt quá 5 được gọi là dãy số Hamming. Ví dụ 10 = 2x5 thuộc dãy Hamming còn 26 = 2x13 không thuộc dãy Hamming. Số 1 được coi là số đầu tiên của dãy Hamming. 

Cho số nguyên dương N. Hãy xác định xem N có thuộc dãy Hamming hay không và nếu có thì thứ tự của N trong dãy Hamming là bao nhiêu.

### Input
- Dòng đầu tiên ghi số bộ test T (không quá 10^5).
- Mỗi test ghi một số N trên một dòng.

### Output
- Nếu giá trị N thuộc dãy Hamming thì ghi ra thứ tự của N, tính từ 1.
- Nếu không thì ghi ra "Not in sequence".

### Ràng buộc
- 1 <= T <= 10^5
- 1 <= N <= 10^18