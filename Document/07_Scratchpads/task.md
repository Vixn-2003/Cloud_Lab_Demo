# Danh Sách Nhiệm Vụ: Thiết lập Giới hạn Tài nguyên Docker & Bảo mật Sandbox

- `[x]` **Bước 1: Cấu hình giới hạn tài nguyên trong DockerRunner.ts**
  - `[x]` Cập nhật `dockerArgs` trong hàm `runContainer` của `DockerRunner.ts`
  - `[x]` Bổ sung tham số `--memory-swap=256m`, `--pids-limit=100`, và `--security-opt=no-new-privileges:true`
- `[x]` **Bước 2: Cấu hình giới hạn tài nguyên trong InteractiveTerminalService.ts**
  - `[x]` Tìm kiếm dòng lệnh `docker run` khởi chạy container trong `InteractiveTerminalService.ts`
  - `[x]` Bổ sung `--memory=512m`, `--memory-swap=512m`, `--cpus=0.5`, `--pids-limit=100`, và `--security-opt=no-new-privileges:true`
- `[x]` **Bước 3: Viết script kiểm thử tự động xác minh tài nguyên**
  - `[x]` Tạo tệp `project/backend/test_resource_limits.js`
  - `[x]` Hiện thực hóa kịch bản OOM (Out of Memory), Infinite Loop (CPU limit), và Fork Bomb (PIDs limit)
  - `[x]` Chạy script kiểm thử để đảm bảo tất cả đều hoạt động an toàn
- `[x]` **Bước 4: Cập nhật tài liệu & PROJECT_FLOW.md**
  - `[x]` Tạo tài liệu hướng dẫn kỹ thuật chuyên sâu `Document/Docker_Resource_Limits.md`
  - `[x]` Cập nhật `Document/PROJECT_FLOW.md` và đánh dấu hoàn thành backlog
  - `[x]` Cập nhật Walkthrough kết quả thực hiện
