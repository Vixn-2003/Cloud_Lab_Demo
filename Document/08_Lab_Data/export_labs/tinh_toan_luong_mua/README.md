# TÍNH TOÁN LƯỢNG MƯA

### Mô tả bài toán
Trong một ngày mưa nhiều, các trạm đo mưa hoạt động hết công suất. Tại mỗi trạm đo, các cơn mưa được ghi nhận thời điểm bắt đầu, thời điểm kết thúc và lượng mưa đo được. Một trạm mưa có thể có nhiều lần đo trong ngày. Hãy tính lượng mưa trung bình trong 1 giờ (60 phút) của từng trạm theo đúng thứ tự xuất hiện lần đầu của trạm đó trong danh sách.

### Input
- Dòng đầu ghi số lượt đo lượng mưa N.
- Thông tin về một lần đo lượng mưa gồm 4 dòng:
  1. Tên trạm
  2. Thời điểm bắt đầu mưa (hh:mm)
  3. Thời điểm kết thúc mưa (hh:mm)
  4. Lượng mưa đo được (mm)

### Output
Ghi ra danh sách các trạm khác nhau trong danh sách đo mưa và lượng mưa trung bình của từng trạm.
Thông tin trên mỗi dòng lần lượt gồm:
- Mã trạm đo tính từ T01, T02, ... theo thứ tự xuất hiện trạm đầu tiên.
- Tên trạm đo mưa.
- Lượng mưa trung bình trong 1 giờ tại mỗi trạm, tính chính xác đến 2 số phần thập phân.

Các thông tin ghi cách nhau một khoảng trống.

### Ràng buộc
- N <= 100
- Thời gian có định dạng hh:mm
- Lượng mưa là số nguyên dương đo được.