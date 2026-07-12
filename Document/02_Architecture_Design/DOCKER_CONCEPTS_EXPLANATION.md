# Giải Thích Khái Niệm Docker: Cloud Registry (Docker Hub) vs Trực Thi Cục Bộ (Local Cache)

**Ngày**: 2026-06-01  
**Trạng thái**: Hướng dẫn khái niệm / Đặc tả kiến trúc  
**Mục tiêu**: Giải đáp thắc mắc về cơ chế hoạt động của Docker: Các hình ảnh (Images) được tải về lưu trữ ở đâu, vai trò của Docker Hub Cloud và lý do phải tải/build về máy cục bộ.

---

## 🌎 1. Sự Khác Biệt Giữa Docker Hub (Cloud) và Docker Desktop (Local)

Để dễ hình dung, cơ chế quản lý tệp của Docker hoạt động tương tự như kho ứng dụng **App Store / Google Play** trên điện thoại:

```
┌────────────────────────────────────────┐
│           DOCKER HUB (CLOUD)           │  <--- Như "App Store" trên đám mây
│  (Chứa sẵn kho template khổng lồ:      │       Lưu trữ hàng triệu mẫu có sẵn.
│   python, nodejs, ubuntu, gcc...)     │
└──────────────────┬─────────────────────┘
                   │
                   │  docker pull  (Chỉ tải về khi cần hoặc chạy script)
                   ▼
┌────────────────────────────────────────┐
│         DOCKER DESKTOP (LOCAL)         │  <--- Như "Ứng dụng đã tải về điện thoại"
│  (Bộ nhớ Cache lưu trên ổ cứng máy dev)│       Lưu cục bộ để có thể mở lên lập tức
└──────────────────┬─────────────────────┘       chỉ trong 0.5 giây không cần mạng.
                   │
                   │  docker run  (Sinh viên nhấn "Chạy code")
                   ▼
┌────────────────────────────────────────┐
│          DOCKER CONTAINER              │  <--- Như "Ứng dụng đang mở và chạy thực tế"
│  (Phiên chạy thực thi tạm thời của     │       Hoạt động cô lập, sinh viên gõ lệnh thoải mái,
│   học viên làm bài lab)                │       tắt đi là tự động dọn dẹp biến mất.
└────────────────────────────────────────┘
```

---

## 🔄 2. Phân Tích Cơ Chế Hoạt Động Của Script Tự Động Hóa

Khi chạy script tự động hóa `build_images.sh` hoặc `build_images.ps1`, hai cơ chế sau sẽ diễn ra:

### Cơ Chế 1: `docker pull` (Tải từ Cloud về lưu ở máy Cục bộ)
*   **Hành động**: Tải các mẫu môi trường gốc như `python:3.11-slim`, `node:20-slim`, `ubuntu:22.04`...
*   **Tại sao Docker không chạy trực tiếp trên Cloud?**  
    Nếu mỗi lần sinh viên bấm **"Chạy thử" (Run)** hoặc **"Nộp bài" (Submit)**, máy chủ lại phải kết nối lên Cloud để tải hàng Gigabytes dữ liệu môi trường về thì quá trình chấm điểm sẽ mất **3 - 5 phút** và làm nghẽn băng thông mạng.
    *   *Giải pháp*: Hệ thống **tải sẵn (Pull)** các tệp này về lưu cứng trên ổ đĩa của máy chủ backend (Local Cache). Khi sinh viên chạy code, Docker chỉ mất **0.5 giây** để dựng container từ tệp có sẵn.

### Cơ Chế 2: `docker build` (Biên dịch Image tự tạo trực tiếp tại máy cục bộ)
*   **Hành động**: Đọc tệp cấu hình `Dockerfile.malware`, tự động lấy bản nền `ubuntu` từ bộ nhớ cục bộ, tự động cài thêm `wine32`, `strace`, `tcpdump` rồi đóng gói thành một mẫu mới có tên là `malware-env:latest`.
*   **Nơi lưu trữ**: Tệp này được lưu trữ **100% tại ổ cứng máy tính của bạn** (không tự động đẩy lên Cloud của Docker trừ khi bạn chạy lệnh `docker push` lên tài khoản của mình).

---

## 💡 3. Tóm Lại Cho Lập Trình Viên (Key Takeaway)

1.  **Docker Hub (Cloud)**: Là thư viện chứa các mẫu (Images) gốc trên mạng.
2.  **Docker Desktop (Local)**: Là phần mềm quản lý chạy dưới máy bạn. Khi bạn chạy script, Docker Desktop sẽ **tải các mẫu từ Cloud về lưu vào ổ đĩa của bạn (Local Image Cache)**.
3.  **Tác dụng**: Giúp hệ thống Cloud Lab khởi chạy môi trường làm bài cho học viên **tức thời (dưới 1 giây)** mà không bị phụ thuộc vào tốc độ internet hay tải trọng mạng.
