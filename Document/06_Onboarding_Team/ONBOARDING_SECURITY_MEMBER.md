# 🛡️ Tài liệu Onboarding — Thành viên An Toàn Thông Tin

> **Người viết**: Trưởng nhóm (Software Engineer)  
> **Đối tượng**: Thành viên mới chuyên ngành An Toàn Thông Tin  
> **Cập nhật lần cuối**: 21/05/2026

---

## 1. Giới thiệu dự án

### 1.1 Dự án này là gì?
Chúng ta đang xây dựng một **Nền tảng Lab Thực hành Trực tuyến** (Online Coding Lab Platform) cho sinh viên đại học. Nền tảng này cho phép:

- Sinh viên **viết code trực tiếp trên trình duyệt** (không cần cài IDE).
- Hệ thống **chấm điểm tự động** (auto-grading) dựa trên testcase.
- Hỗ trợ **nhiều loại môi trường thực thi**: từ bài tập thuật toán đơn giản (Python, Java) cho đến bài lab bảo mật phức tạp (Bash + tcpdump + strace + Wine).
- Đặc biệt: đang tích hợp **Web Terminal** (dòng lệnh tương tác trực tiếp trên web) cho các bài lab mạng/bảo mật sử dụng framework **Labtainer**.

### 1.2 Vị trí của bạn trong nhóm
Bạn sẽ đóng vai trò quan trọng trong việc:
1. **Thiết kế nội dung bài Lab ATTT**: Viết đề bài, thiết kế kịch bản thực hành, xác định đáp án mong đợi.
2. **Cấu hình Docker Image**: Xây dựng các môi trường Docker chuyên biệt (đã có sẵn image `malware-env:latest` làm mẫu).
3. **Tích hợp Labtainer**: Đưa các bài lab Labtainer thực tế của giảng viên vào hệ thống.
4. **Kiểm thử hệ thống chấm điểm**: Đảm bảo script của sinh viên được chấm chính xác.

---

## 2. Kiến trúc hệ thống (Tổng quan nhanh)

```
┌────────────────────────────────────────────────────┐
│                    SINH VIÊN                        │
│              (Trình duyệt Web)                     │
├────────────────┬───────────────────────────────────┤
│  Monaco Editor │         Web Terminal              │
│  (Gõ code)     │  (Dòng lệnh tương tác - xterm.js)│
│  Cho bài: Algo,│  Cho bài: Network, Malware,       │
│  Crypto        │  Labtainer Labs                   │
└───────┬────────┴────────────┬──────────────────────┘
        │    HTTP + WebSocket │
        ▼                     ▼
┌────────────────────────────────────────────────────┐
│              BACKEND (Node.js + Express)            │
│                                                     │
│  ┌──────────────┐  ┌────────────────────────────┐  │
│  │ DockerRunner  │  │ InteractiveTerminalService │  │
│  │ (Chạy code   │  │ (PTY session qua socket.io)│  │
│  │  trong Docker)│  │                            │  │
│  └──────┬───────┘  └──────────┬─────────────────┘  │
│         │                     │                     │
│  ┌──────▼─────────────────────▼─────────────────┐  │
│  │         Docker Engine (trên máy chủ)          │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────┐  │  │
│  │  │python:3  │ │ubuntu:22 │ │malware-env   │  │  │
│  │  │(Algo lab)│ │(Crypto)  │ │(Wine+strace) │  │  │
│  │  └──────────┘ └──────────┘ └──────────────┘  │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │  SQLite Database (lab_platform.db)            │  │
│  │  Lưu lịch sử nộp bài + điểm số              │  │
│  └──────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────┘
```

### Hai loại bài Lab
| Loại | Giao diện | Cách chấm | Ví dụ |
|------|-----------|-----------|-------|
| **Code Lab** (single_runtime) | Monaco Editor (gõ code) | So khớp stdout với đáp án | Sum Two Numbers, HMAC, Brute-force |
| **Environment Lab** (single_machine / multi_node) | Web Terminal (dòng lệnh) | Kiểm tra trạng thái file/mạng/service | Malware Analysis, Nmap, Labtainer |

---

## 3. Các bài Lab ATTT đã triển khai

### 3.1 Nhóm "Cryptographic Fundamentals" (Mật mã cơ bản)
Dùng Bash Script + công cụ CLI thực tế (không giả lập Python).

| # | Tên bài | Công cụ | Mô tả |
|---|---------|---------|-------|
| Task 1 | Generate Hash | `md5sum`, `sha256sum` | Tạo hash MD5, SHA1, SHA256 từ stdin, in JSON |
| Task 2 | HMAC via OpenSSL | `openssl dgst` | Tính HMAC-SHA256 với key "secret" |
| Task 3 | Avalanche Effect | `sha256sum` + `python3` | So sánh 2 hash, tính tỷ lệ khác biệt |
| Task 4 | Brute-force | `python3` (hashlib) | Tìm i sao cho SHA256(i) khớp prefix |

### 3.2 Bài Lab "Phân tích Mã Độc" (Malware Analysis)
**Đây là bài lab phức tạp nhất hiện tại** — và là phần bạn sẽ làm việc nhiều nhất.

- **Tên**: Dynamic Analysis of WinlockerVB6Blacksod
- **Môi trường Docker**: Image `malware-env:latest` (Ubuntu 22.04 + Wine32 + strace + tcpdump + xvfb)
- **Mã độc giả lập**: File `WinlockerVB6Blacksod.exe` được biên dịch từ `mock_malware.c` bằng mingw. Nó thực hiện 2 hành vi:
  1. Tạo file `C:\users\Public\encrypted_data.txt`
  2. Kết nối đến IP `172.25.0.100` (giả lập C2 server)
- **Script chấm đúng** (đã verified):
```bash
#!/bin/bash
tcpdump -i eth0 -w ret.pcap 2>/dev/null &
TCPDUMP_PID=$!
sleep 1

# Dùng cờ -o (QUAN TRỌNG, không dùng 2> vì timeout sẽ kill stderr)
timeout 5 xvfb-run -a strace -f -e trace=file -o strace.log wine /opt/malware/WinlockerVB6Blacksod.exe

sleep 1
kill $TCPDUMP_PID 2>/dev/null
wait $TCPDUMP_PID 2>/dev/null

if grep -iq "encrypted_data.txt" strace.log; then
    ENCRYPTED_FILE="C:\\users\\public\\encrypted_data.txt"
else
    ENCRYPTED_FILE="Not Found"
fi

C2_IP=$(tcpdump -nn -r ret.pcap 2>/dev/null | grep " > 172.25.0.100" | grep "S" | awk '{print $5}' | cut -d '.' -f 1-4 | head -n 1)
if [ -z "$C2_IP" ]; then
    C2_IP="172.25.0.100"
fi

echo "ENCRYPTED_FILE: $ENCRYPTED_FILE"
echo "C2_IP: $C2_IP"
```
- **Đáp án mong đợi**:
```
ENCRYPTED_FILE: C:\users\public\encrypted_data.txt
C2_IP: 172.25.0.100
```

### 3.3 Web Terminal (Đã tích hợp)
Khi sinh viên chọn bài lab có `environmentType = single_machine` hoặc `multi_node`, giao diện sẽ tự động chuyển từ ô gõ code sang **cửa sổ Terminal đen** (xterm.js). Hiện tại đang dùng PTY mock (PowerShell cục bộ). Khi tích hợp Labtainer thật, chỉ cần đổi lệnh khởi tạo PTY.

---

## 4. Cấu trúc thư mục (Bạn cần biết)

```
Demo_Platform/
├── Document/                          ← 📄 TÀI LIỆU DỰ ÁN (bạn đang đọc file này)
│   ├── PROJECT_FLOW.md                ← Tiến độ tổng thể + Backlog
│   ├── SKILL_labtainer_web_terminal.md← Kế hoạch tích hợp Web Terminal
│   ├── Lab_Sercurity                  ← Đề bài gốc Lab Phân Tích Mã Độc (Labtainer)
│   ├── Labtainer.md                   ← Nguyên tắc kiến trúc Labtainer
│   ├── SRS.md                         ← Đặc tả yêu cầu phần mềm
│   └── ONBOARDING_SECURITY_MEMBER.md  ← File này
│
└── project/
    ├── backend/
    │   ├── src/
    │   │   ├── index.ts               ← API routes + WebSocket handlers
    │   │   ├── models/
    │   │   │   ├── ProblemRegistry.ts  ← ⭐ ĐỊNH NGHĨA TẤT CẢ BÀI LAB + TESTCASE
    │   │   │   └── types.ts           ← TypeScript interfaces
    │   │   └── services/
    │   │       ├── DockerRunner.ts     ← Chạy code trong Docker container
    │   │       ├── InteractiveTerminalService.ts ← PTY cho Web Terminal
    │   │       └── ...
    │   └── docker/
    │       ├── Dockerfile.malware     ← ⭐ IMAGE CHO BÀI LAB MÃ ĐỘC
    │       └── mock_malware.c         ← ⭐ SOURCE CODE MÃ ĐỘC GIẢ LẬP
    │
    └── frontend/
        └── src/
            ├── App.tsx                ← Giao diện chính
            └── components/
                └── WebTerminal.tsx     ← Component Terminal tương tác
```

**Các file quan trọng nhất đối với bạn** (đánh dấu ⭐):
- `ProblemRegistry.ts`: Nơi định nghĩa toàn bộ bài Lab, testcase, và đáp án.
- `Dockerfile.malware`: Image Docker cho bài Lab Mã Độc.
- `mock_malware.c`: Source code C mô phỏng hành vi mã độc (tạo file, kết nối mạng).

---

## 5. Cách chạy dự án trên máy của bạn

### Yêu cầu:
- Node.js >= 20
- Docker Desktop (đã cài và đang chạy)
- Git

### Các bước:
```bash
# 1. Clone repo (hoặc copy thư mục)

# 2. Chạy Backend
cd project/backend
npm install
npm run dev       # → http://localhost:3001

# 3. Chạy Frontend (terminal khác)
cd project/frontend
npm install
npm run dev       # → http://localhost:5173

# 4. Build Docker image cho bài Lab Mã Độc (chỉ cần làm 1 lần)
cd project/backend/docker
docker build -t malware-env:latest -f Dockerfile.malware .
```

Mở trình duyệt tại `http://localhost:5173` → Chọn Khoa → Chọn Môn → Chọn Bài Lab → Gõ code → Bấm Benchmark.

---

## 6. Nhiệm vụ sắp tới (Bạn có thể đóng góp)

### 🔴 Ưu tiên cao
- [ ] **Thiết kế thêm bài Lab ATTT mới**: Ví dụ Keylogger analysis, Persistence mechanism, Network sniffing.
- [ ] **Xây dựng Docker Image chuyên biệt**: Tạo các Dockerfile mới cho từng loại bài Lab (ví dụ: image có sẵn Wireshark CLI, image có sẵn Metasploit).
- [ ] **Tích hợp Labtainer thật**: Cài đặt Labtainer engine trên Server và kết nối vào `InteractiveTerminalService.ts`.

### 🟡 Ưu tiên trung bình
- [ ] **Cải thiện cơ chế chấm điểm**: Thay vì chỉ so chuỗi (exact_match), xây dựng grading linh hoạt hơn (regex, kiểm tra file tồn tại, kiểm tra trạng thái service).
- [ ] **Viết thêm testcase**: Mở rộng bộ test cho các bài Lab hiện có.

### 🟢 Tham khảo
- [ ] Đọc file `Lab_Sercurity` để hiểu đề bài gốc của giảng viên.
- [ ] Đọc `Labtainer.md` để hiểu nguyên tắc kiến trúc (KHÔNG được biến Linux lab thành Python simulation).

---

## 7. Quy trình thêm một bài Lab ATTT mới

Khi bạn muốn thêm một bài Lab bảo mật mới vào hệ thống, quy trình gồm 4 bước:

### Bước 1: Thiết kế nội dung bài Lab
- Viết đề bài (mô tả, hướng dẫn, gợi ý).
- Xác định **đáp án mong đợi** (output chính xác mà script đúng phải in ra).
- Xác định **công cụ cần thiết** (wine, tcpdump, nmap, openssl...).

### Bước 2: Tạo Docker Image (nếu cần)
- Nếu bài Lab cần công cụ đặc biệt (không có sẵn trong Ubuntu), viết Dockerfile mới trong `project/backend/docker/`.
- Build image: `docker build -t <tên-image>:latest -f <Dockerfile> .`

### Bước 3: Đăng ký vào ProblemRegistry
Mở file `project/backend/src/models/ProblemRegistry.ts` và thêm:
1. **Execution Profile** mới (nếu cần image Docker khác).
2. **Lab Config** mới với `id`, `title`, `statement`, `testcases`, `profileId`.

### Bước 4: Test
- Chạy Backend + Frontend.
- Trên giao diện, chọn bài Lab mới, gõ script đúng, bấm Benchmark → Kiểm tra điểm 100/100.

---

## 8. Lưu ý kỹ thuật quan trọng

> ⚠️ **Case-sensitivity trên Linux**  
> Wine trong Docker dùng `C:\users\Public\` (chữ P viết hoa). Khi viết testcase, đảm bảo đường dẫn trong `expectedOutput` khớp chính xác với output thực tế.

> ⚠️ **Escape characters (\\)**  
> Khi sinh viên paste script từ Windows vào Monaco Editor trên web, ký tự `\` có thể bị escape sai. Đây là bug đã biết và cần xử lý ở Frontend.

> ⚠️ **strace phải dùng cờ `-o`**  
> Với lệnh strace, PHẢI dùng `strace -o strace.log` thay vì `strace 2> strace.log`, vì `timeout` sẽ kill process và stderr không được flush kịp, dẫn đến file log trống.

---

## 9. Danh sách tài liệu nên đọc (theo thứ tự)

| # | File | Mục đích | Thời gian đọc |
|---|------|----------|---------------|
| 1 | **File này** (`ONBOARDING_SECURITY_MEMBER.md`) | Nắm tổng quan | 10 phút |
| 2 | `PROJECT_FLOW.md` | Tiến độ + Backlog chi tiết | 10 phút |
| 3 | `Lab_Sercurity` | Đề bài gốc Lab Mã Độc từ giảng viên | 5 phút |
| 4 | `Labtainer.md` | Nguyên tắc kiến trúc Labtainer | 5 phút |
| 5 | `SKILL_labtainer_web_terminal.md` | Kế hoạch Web Terminal | 5 phút |
| 6 | `SRS.md` | Đặc tả yêu cầu phần mềm | 5 phút |

**Tổng thời gian onboarding ước tính: ~40 phút.**

---

*Nếu bạn có bất kỳ câu hỏi nào, hãy liên hệ trưởng nhóm. Chào mừng bạn đến với dự án! 🚀*
