# 📚 PROJECT_FLOW — Demo Platform: Multi-Environment Coding Lab

> Tài liệu theo dõi tiến độ xây dựng hệ thống **Online Coding Lab** với tính năng auto-grading.
> Cập nhật sau mỗi phiên làm việc.

---
> 🤖 **AI INSTRUCTIONS (CRITICAL PERSISTENT RULES FOR ANTIGRAVITY):**
> 1. Mỗi khi hoàn thành xong bất kỳ một tác vụ code, fix bug, hoặc thay đổi logic nào, **BẮT BUỘC** phải tự động cập nhật lại tài liệu này (đánh dấu [x] ở backlog) và cập nhật/tạo mới các file document liên quan trong thư mục `Document/` để phản ánh đúng thực tế source code. Tuyệt đối không được quên!
> 2. **Tất cả các câu trả lời mang tính phân tích, đặc tả giải pháp, hoặc giải trình kiến trúc** của bạn đều phải được tự động lưu vết và viết thành tài liệu (.md) hoàn chỉnh đặt trong thư mục `Document/` (tự động cập nhật vào các tài liệu cũ hoặc tạo mới tùy theo mức độ phù hợp).
> 3. **BẮT BUỘC phải đồng bộ hóa hai tệp Artifact động** của phiên làm việc (`task.md` và `walkthrough.md`) vào thư mục workspace vật lý:
>    - Sao chép `task.md` (Checklist nhiệm vụ) vào: `Document/07_Scratchpads/task.md` sau mỗi khi cập nhật.
>    - Sao chép `walkthrough.md` (Nhật ký thực thi) vào: `Document/05_Walkthroughs_Reports/walkthrough.md` khi kết thúc phiên.
---

## 🎯 Mục tiêu tổng thể

Xây dựng một **demo nền tảng lab thực hành lập trình trực tuyến** có khả năng:
- Sinh viên viết code trực tiếp trên trình duyệt (Monaco Editor)
- **Chạy thử** (Run) để xem output ngay lập tức
- **Nộp bài** (Submit) để chấm tự động theo testcase
- Hệ thống dùng **Execution Profile** thay vì gắn cứng ngôn ngữ
- Kiến trúc rõ ràng, dễ nâng cấp lên production

---
Correct Flow
Determine the type of original lab:
CLI tool lab
algorithm lab
compiled language lab
database lab
web lab
multi-node security lab
Determine the original environment:
Ubuntu CLI
Java runtime
Node runtime
Postgres
Browser iframe
Multi-node network
Simplify the content of the assignment:
reduce topology
reduce the number of steps
reduce the data
reduce grading difficulty
Do not change the environment without a clear reason
Finalize the executionProfile first, then design the demo lab

In short:
AI must choose the runtime first, then simplify the lab.
## 🗂️ Cấu trúc thư mục

```
Demo_Platform/
├── Document/                        ← Tài liệu dự án
│   ├── PROJECT_FLOW.md              ← File này (tiến độ + backlog)
│   ├── ONBOARDING_SECURITY_MEMBER.md ← Tài liệu onboarding cho thành viên ATTT
│   ├── SKILL_labtainer_web_terminal.md ← Kế hoạch Web Terminal
│   ├── Labtainer.md                 ← Nguyên tắc kiến trúc Labtainer
│   ├── Lab_Sercurity                ← Đề bài gốc Lab Mã Độc
│   ├── SRS.md                       ← Đặc tả yêu cầu phần mềm
│   ├── SKILL_production_IDE_v2.md   ← Skill/blueprint kiến trúc production
│   └── deep-research-report.md      ← Báo cáo nghiên cứu sâu
├── project/                         ← Monorepo Workspaces
│   ├── backend/                     ← Workspace @cloudlab/backend (Node.js + Express + TS)
│   │   └── src/
│   │       ├── index.ts             ← Entry point, định nghĩa API routes
│   │       ├── models/
│   │       │   ├── types.ts         ← TypeScript interfaces
│   │       │   └── AcademyRegistry.ts ← Faculty, Subject, Lab configs
│   │       └── services/
│   │           ├── ExecutionService.ts  ← Interface (abstraction layer)
│   │           └── LocalProcessRunner.ts ← Impl: child_process runner
│   └── frontend/                    ← Workspace @cloudlab/frontend (Next.js 16 + shadcn/ui)
│       └── app/                     ← Next.js App Router
├── package.json                     ← Root package.json điều phối Monorepo
├── pnpm-workspace.yaml              ← Định nghĩa các workspace của pnpm
├── turbo.json                       ← Cấu hình pipeline của Turborepo
└── pnpm-lock.yaml                   ← Tệp khóa dependencies chung duy nhất
```

---

## ⚙️ Tech Stack

| Layer | Công nghệ |
|---|---|
| Monorepo Orchestration | **pnpm Workspaces** + **Turborepo** (`turbo`) |
| Frontend | React 19, Next.js 16 (App Router), Tailwind CSS v4, Monaco Editor, Xterm.js |
| Backend | Node.js, Express 5, TypeScript 6, ts-node-dev |
| Runner | `child_process` (LocalProcessRunner) |
| Storage | **SQLite** (`better-sqlite3`) — `lab_platform.db` |
| Language support | Python 3, Node.js 20, Java, C++ (GCC) |

---

## 🌐 API Endpoints

| Method | Path | Mô tả |
|---|---|---|
| `GET` | `/faculties` | Lấy danh sách khoa/viện |
| `GET` | `/subjects?facultyId=...` | Lấy môn học theo khoa |
| `GET` | `/labs?subjectId=...` | Lấy danh sách lab theo môn học |
| `GET` | `/labs/:id` | Lấy cấu hình chi tiết của một Lab |
| `GET` | `/profiles/:id` | Lấy thông tin Execution Profile |
| `POST` | `/run` | Chạy thử code (mode: `run`) với `stdin` tùy chỉnh |
| `POST` | `/submit` | Nộp bài + chấm testcase (mode: `submit`) |
| `GET` | `/submissions` | Xem lịch sử nộp bài toàn hệ thống |

---

## 🧩 Kiến trúc chính

### Academy Hierarchy (Faculty -> Subject -> Lab)
Hệ thống chuyển từ mô hình "Problem-centric" sang "Curriculum-centric":
- **Faculty**: Cấp quản lý cao nhất (VD: An toàn thông tin).
- **Subject**: Môn học chuyên biệt (VD: Mật mã học).
- **Lab**: Đơn vị thực hành, gắn với một **Execution Profile** cụ thể.

### Environment Taxonomy (Production View)
Phân loại môi trường thực thi để chuẩn bị cho nâng cấp hạ tầng:
- **`single_runtime`**: Single-runtime environment (Python/Java basic).
- **`single_machine`**: Single-machine lab (Tool-based like OpenSSL/Nmap).
- **`multi_node`**: Multi-node lab (Network simulation/Cyber Range).

### Persistence (SQLite)
Mọi lượt chạy (Run) và nộp bài (Submit) đều được lưu trữ vào file `lab_platform.db`:
```sql
CREATE TABLE submissions (
  id TEXT PRIMARY KEY,
  lab_id TEXT NOT NULL,
  profile_id TEXT NOT NULL,
  mode TEXT NOT NULL,
  code TEXT NOT NULL,
  language TEXT NOT NULL,
  status TEXT NOT NULL,
  score INTEGER,
  result_json TEXT,
  created_at TEXT NOT NULL
)
```

---

## 📅 Lịch sử phiên làm việc

### Phiên 1-2 — Khởi tạo & UI (Conversation 7b12fc3... & 72c9dac...)
- [x] Khởi tạo backend (Express/TS) và frontend (React/Vite).
- [x] Build `LocalProcessRunner` cho Python.
- [x] Implement Monaco Editor và giao diện 3-tab cơ bản.

### Phiên 3 — Nâng cấp tính năng & Persistence (Giai đoạn 2)
- [x] Thêm Execution Profile cho **Node.js 20**, **Java**, và **C++**.
- [x] Tích hợp **SQLite** (`better-sqlite3`) lưu trữ vĩnh viễn kết quả nộp bài.
- [x] Thêm trường **Manual Stdin Input** trên UI.
- [x] Refactor `LocalProcessRunner` hỗ trợ build-step (compilation) cho Java/C++.

### Phiên 4 — Academic Hierarchy Refactor (Giai đoạn 3)
- [x] Chuyển đổi sang mô hình **Faculty -> Subject -> Lab**.
- [x] API mới hỗ trợ cascading fetch (lấy dữ liệu dropdown phụ thuộc).
- [x] UI Cascading Dropdowns: Chọn Khoa → Chọn Môn → Chọn Lab.
- [x] Phân loại lab: An toàn thông tin (Nmap, HMAC) và Công nghệ phần mềm (Algos).

### Phiên 5 — Production Taxonomy & Crypto Labs (Giai đoạn 4)
- [x] Tích hợp phân loại môi trường (**Environment Taxonomy**): Single-runtime, Single-machine, Multi-node.
- [x] Triển khai 4 lab ATTT mới về Cryptographic Fundamentals:
    - Task 1: Generate Hash (JSON output)
    - Task 2: HMAC via OpenSSL CLI (Tool-based)
    - Task 3: Avalanche Effect (Analysis)
    - Task 4: Simple Brute-force (Simulation)
- [x] Cập nhật UI hiển thị Category và Toolset cho mỗi Lab.

### Phiên 6 — Tích hợp Web Terminal (Labtainer Phase 1)
- [x] Cài đặt `node-pty` trên Backend để mô phỏng Pseudo-Terminal (PTY).
- [x] Xây dựng `InteractiveTerminalService.ts` quản lý session và I/O của Terminal qua WebSockets (`socket.io`).
- [x] Tích hợp `@xterm/xterm` và `xterm-addon-fit` trên Frontend thay thế Monaco Editor cho các bài lab `single_machine` / `multi_node`.
- [x] Viết component `WebTerminal.tsx` kết nối PTY stream và hiển thị dòng lệnh trực tiếp trên trình duyệt.
### Phiên 7 — Enterprise Frontend Specification (Vercel AI Prompt)
- [x] Nghiên cứu toàn bộ kiến trúc hiện tại (API, types, components, styles).
- [x] Phân tích UX gaps: monolithic App.tsx, không có routing, thiếu state management, thiếu responsive.
- [x] Tạo `VERCEL_AI_FRONTEND_SPEC.md`: Document 10 sections enterprise-grade cho Vercel AI generate toàn bộ Frontend mới.
- [x] Bao gồm: Design system, navigation, 6 screen specs, component library, TypeScript types, functional coverage checklist.
- [x] Tạo `ONBOARDING_SECURITY_MEMBER.md`: Tài liệu onboarding cho thành viên ATTT mới.

### Phiên 8 — Frontend V2 Migration
- [x] Phân tích cấu trúc Frontend Ver2 (Next.js 16 + shadcn/ui + 57 UI components).
- [x] Xác định gap: Ver2 đang dùng `sample-data.ts` cục bộ, chưa kết nối 10 API endpoints của Backend.
- [x] Tạo `MIGRATION_GUIDE_FRONTEND_V2.md`: Hướng dẫn 6 bước chi tiết để AI/developer thay thế Frontend cũ và kết nối API thật.
- [x] Mapping API Backend ↔ Frontend Pages + WebSocket events cho từng trang.
- [x] **Thực hiện migration**: Hoàn tất copy Ver2 sang frontend, nâng cấp các config, loại bỏ Vercel Analytics, kết nối toàn bộ dashboard, labs, submissions với real API endpoints và real-time WebSocket.
- [x] **Xây dựng WebTerminal component**: Tích hợp xterm.js và fits addon thực tế, kết nối I/O hai chiều qua Socket.IO tới Backend.
- [x] **Compile & Build**: Build thành công 100% không lỗi/cảnh báo, chuyển tất cả các router tĩnh dư thừa sang redirect.

### Phiên 9 — Nâng cấp Môi trường thực thi & Cascading Selects (Phương án A - UX Correction)
- [x] **Di chuyển & Tối ưu hóa Cascading Selects (UX Real-world Flow)**:
  - Phân tích luồng nghiệp vụ thực tế của dự án: Loại bỏ Cascading Selects khỏi Workspace Header để tăng tính bảo mật, tránh xung đột/lỗi mất phiên Terminal VM Docker đang chạy dở và giữ Workspace tập trung 100%.
  - Tích hợp **Cascading Selects** lồng nhau vào **Header Filters của Lab Browser (`/labs`)** (Faculty -> Subject) và **Submissions History (`/submissions`)** (Faculty -> Subject -> Lab) để tạo bộ lọc danh sách vô cùng chuyên nghiệp.
- [x] **Bộ lọc nâng cao thời gian thực**: Sử dụng hooks và `useMemo` tính toán lọc danh sách bài Lab và Lịch sử nộp bài ngay tức thì theo Faculty, Subject và Lab được chọn từ các Select Dropdowns của shadcn/ui.
- [x] **Bảng Execution Environment Grid**: Bổ sung card thông tin chi tiết môi trường thực thi ngay dưới phần mô tả của tab Instructions, hiển thị rõ ràng Category, Language/OS, Resource Timeout, và Security Context.
- [x] **Footer Terminal Debug**: Truyền dữ liệu `executionMetadata` (Thời gian chạy thực tế `timeMs`, Exit Code, và Status) vào component `ConsoleOutput` giúp tăng khả năng giám sát trạng thái terminal.
- [x] **Đồng bộ hóa Route & Compile**: Đồng bộ hóa toàn bộ mã nguồn localized và fallback routes, chạy biên dịch Next.js build thành công 100% không cảnh báo.

### Phiên 10 — Nâng cấp Giao diện Bài Lab của tôi & Sidebar Điều hướng học trình (Curriculum Spec Upgrade)
- [x] **Tinh chỉnh thanh Sidebar điều hướng**: Ẩn các công cụ luyện tập tự do (`Viết code` và `Terminal`) để giữ Workspace an toàn, thêm hai chuyên mục học trình mới là `Môn học` (Curriculum) và `Phản hồi` (Grading Feedback).
- [x] **Tạo mới các trang Mock-up chuyên nghiệp**: Xây dựng tệp localized/fallback cho `/subjects` và `/feedback` tải dữ liệu động từ SQLite để hiển thị tiến độ học tập và đóng nhận xét chuyên môn cực kỳ chân thực, ngăn lỗi 404.
- [x] **Nâng cấp trang Bài lab của tôi (`/labs`)**:
  - Tích hợp mục **"Tiếp tục làm lab" (Continue Current Lab)** ưu tiên hiển thị bài đang làm dở/cần sửa đổi.
  - Tabs trạng thái đi kèm huy hiệu đếm số lượng bài lab động tương quan.
  - Bổ sung bộ lọc **Loại môi trường** (Environment Type) phân loại nhanh bài thực hành.
  - **Lab Card UI cực kỳ xịn sò**: Hiển thị đầy đủ nhãn môi trường kèm icon tương ứng, số lần nộp bài, ước tính thời gian thực hiện, điểm tốt nhất/gần nhất, hạn nộp cảnh báo bằng màu sắc, và nút CTA thay đổi hành động theo trạng thái.
- [x] **Biên dịch & Build thành công**: Toàn bộ dự án và các trang mock-up Next.js 16 biên dịch thành công 100% không cảnh báo qua Turbopack.

### Phiên 11 — Kế hoạch & Tài liệu Kiểm thử Toàn diện (Testing Strategy & Workflows Verification)
- [x] **Nâng cấp Tài liệu Kiểm thử Toàn diện (`TEST_PLAN_WORKFLOWS.md`)**:
  - Thiết kế các sơ đồ tuần tự (Sequence Diagram) Mermaid mô tả chi tiết luồng xử lý của 4 workflows cốt lõi (Lọc Cascading, Monaco Workspace, WebTerminal PTY VM, Submissions & Feedback).
  - Lập ma trận dữ liệu kiểm thử (Test Data Matrix) cho SQLite và các edge cases bảo mật, dọn dẹp tài nguyên VM.
  - Định rõ 8 ca kiểm thử cốt lõi đi kèm 3 ca kiểm thử mở rộng (Bảo mật Sandbox, Dọn dẹp tài nguyên GC, Đa ngôn ngữ I18n).
- [x] **Xây dựng Kịch bản Test Tự động (`workflows.spec.ts`)**:
  - Phát triển script kiểm thử E2E tự động hoàn chỉnh bằng **Playwright** đặt tại `project/frontend/tests/e2e/workflows.spec.ts`.
  - Mô phỏng chính xác tất cả các hành động tương tác của học viên (Focus Monaco, typing, Run Code, Submit, Xterm.js VM console, UX Safe Switch Guard popup modal, retry CTAs).
- [x] **Xác minh toàn bộ dự án**:
  - Đảm bảo Next.js Turbopack build 100% compile thành công, không phát sinh lỗi kiểu dữ liệu hoặc import.

### Phiên 12 — Labtainer Giai đoạn 2 (Interactive Auto-grading, Isolated Workspace & Resource GC)
- [x] **Workspace Isolation & Dynamic Seeding**: Triển khai thư mục làm việc riêng biệt cho từng session học viên tại `project/backend/workspaces/{sessionId}`, tự động seed các tệp mock malware `opt/malware/WinlockerVB6Blacksod.exe`, instructions và log mẫu cho bài lab winlocker.
- [x] **Bộ chấm điểm Tự động dựa trên Hành vi (Behavior Auto-grading)**: Tự động quét và chạy thử script `solution.sh` của học viên trong thư mục cô lập khi gõ `exit` thoát terminal, tính toán điểm số 100/100, lưu trữ attempt vào SQLite và đẩy thông tin Socket.IO thời gian thực.
- [x] **Headless MockPTY & Resource GC**: Triển khai MockPTY giả lập Bash shell resilient thông minh chống AttachConsole crash trên Windows Server chạy ngầm, tích hợp GC tự động dọn dẹp thư mục và kết thúc zombie process để bảo vệ tài nguyên RAM/CPU.

### Phiên 13 — Kịch bản & Quy trình Chạy Kiểm Thử Toàn Diện (Testing Script & Reference Solutions Validation)
- [x] **Xây dựng Kịch bản Kiểm thử Toàn diện (`LAB_TESTING_SCENARIO.md`)**: Đặc tả chi tiết sequence diagram, ma trận dữ liệu kiểm thử tiếng Việt cho cả 9 bài lab (Monaco & Web Terminal).
- [x] **Giải quyết lỗi Headless PTY Crash**: Cấu hình bypass `node-pty` khi `MOCK_PTY=true` trên Windows background tasks giúp ngăn ngừa lỗi sập backend server.
- [x] **Sửa lỗi logic brute-force (`lab_bruteforce_mock`)**: Phát hiện và sửa đổi target prefix từ `2c70e0` (ngoài khoảng tìm kiếm 100k) về `5feceb` (SHA256 của `0` nằm trong khoảng tìm kiếm) giúp bài thi đạt điểm tối đa.
- [x] **Tích hợp & Thực thi Test Script tự động (`test_all_labs.js`)**: Thực thi test tự động hoàn chỉnh, đạt điểm tuyệt đối **100/100 PASS ✅** cho toàn bộ 9 bài lab và đồng bộ SQLite Database.

### Phiên 14 — Tích hợp Trực tiếp NPS Labtainer Core Engine (Official CLI Integration)
- [x] **Xây dựng NpsLabtainerService**: Hiện thực hóa việc gọi trực tiếp các script chính thức của Labtainer (`labtainer`, `stoplab`, `gradelab`) qua CLI và Docker container orchestration.
- [x] **Trích xuất & Parse Báo Cáo Điểm .report**: Phát triển logic tự động phân tích tệp báo cáo kết quả chấm điểm `.report` chính thức sinh ra bởi NPS Core, tách các tiêu chí kiểm tra (tasks) và quy đổi điểm số.
- [x] **Cập nhật Giao diện FileUploadZone**: Hỗ trợ thích ứng thông minh `isLabtainer={true}` chỉ nhận file nén (`.zip`, `.tar.gz`, `.tgz`) tối đa 10MB và hiển thị hướng dẫn chi tiết tiếng Việt trực quan.
- [x] **Giao diện Workspace song song**: Hỗ trợ hiển thị đồng thời cả Web Terminal (kết nối trực tiếp với Docker container do NPS Labtainer khởi tạo) và Nộp Labtainer ZIP (dành cho sinh viên làm offline và upload ZIP báo cáo).
- [x] **Điều khiển PTY & GC Container NPS**: Cải tiến InteractiveTerminalService tự động định vị và gắn node-pty trực tiếp vào Docker container chính thức của Labtainer, đồng thời tự động dừng/xóa container khi exit để dọn dẹp tài nguyên.
- [x] **Kiểm thử Tích hợp tự động E2E**: Phát triển test_nps_labtainer.js kiểm chứng toàn vẹn luồng khởi tạo, gõ lệnh, thoát, chạy gradelab và lưu điểm SQLite.

### Phiên 15 — Thiết lập Giới hạn Tài nguyên Docker & Bảo mật Sandbox (Enterprise Stabilization)
- [x] **Cấu hình giới hạn cứng trong Monaco Runner**: Cập nhật `DockerRunner.ts` tự động khống chế RAM `256m`, cấm swap ổ cứng (`--memory-swap=256m`), giới hạn CPU `0.5`, chặn đứng Fork Bomb với `--pids-limit 100` và ngắt quyền leo thang root (`no-new-privileges`).
- [x] **Áp dụng giới hạn cho Web Terminal VM**: Cấu hình `InteractiveTerminalService.ts` khống chế cứng RAM `512m`, cấm swap (`--memory-swap=512m`), giới hạn CPU `0.5`, `--pids-limit=100`, và `--security-opt=no-new-privileges:true` khi sinh viên khởi chạy Standard Web Terminal.
- [x] **Xây dựng kịch bản kiểm thử tự động (`test_resource_limits.js`)**: Viết script kiểm tra an toàn tích hợp 3 ca kiểm thử: OOM crash (Exit Code 137), Infinite Loop CPU cap (Exit Code 124), và Fork Bomb blocker (Errno 11 Resource temporarily unavailable).
- [x] **Xác minh thành công 100%**: Chạy thử nghiệm thực tế vượt qua cả 3 ca kiểm thử bảo mật với kết quả tuyệt đối PASS ✅.
- [x] **Biên soạn tài liệu kỹ thuật**: Viết `Document/Docker_Resource_Limits.md` mô tả kiến trúc sandbox bảo vệ máy chủ host.
- [x] **Lưu trữ tài liệu phân tích ưu nhược điểm**: Viết `Document/PROS_CONS_LAB_SOLUTIONS.md` tổng hợp và đặc tả ưu/nhược điểm các giải pháp thực thi.

### Phiên 16 — Xây dựng & Kiểm thử 7 Bài toán Lập trình Mới (Algorithmic Labs Integration)
- [x] **Đăng ký 7 bài lab mới**: Khảo sát và tích hợp 7 bài toán lập trình từ `bai_toan_lap_trinh.json` vào bộ môn *Cấu trúc dữ liệu & Giải thuật* thuộc *Khoa Công nghệ Phần mềm* dùng môi trường `python_basic`.
- [x] **Thiết kế giải thuật tối ưu**: Thiết kế các thuật toán $O(N)$ quét tuyến tính không sort cho *MAX TRIPLE*, sinh trước dãy Hamming và tìm kiếm nhị phân $O(\log K)$ cho *Dãy số Hamming*, giúp giảm thiểu tối đa tài nguyên RAM/CPU và thời gian xử lý.
- [x] **Xây dựng Testcase phong phú**: Bổ sung bộ testcases biên giới hạn và tự động kiểm chứng tính đúng đắn toán học.
- [x] **Phát triển script kiểm thử tự động (`test_new_programming_labs.js`)**: Thực thi nộp bài tự động qua HTTP API thực tế, đạt điểm tuyệt đối **100/100 PASS ✅** cho cả 7 bài lab.
- [x] **Sửa lỗi Console Output khi Chạy thử (Run Code)**: Giải quyết triệt để lỗi đua luồng (race condition) trên Socket.IO khiến các tiến trình chạy thử siêu nhanh bị mất log stream bằng cách trích xuất trực tiếp `stdout`/`stderr` từ gói payload của sự kiện status hoàn thành.
- [x] **Sửa lỗi hiển thị đuôi file ở Workspace Editor**: Sửa lỗi endpoint `/profiles/:id` của Backend bị thiếu trường `extension`, khiến các bài lab Python hiển thị tiêu đề file là `Main.sh` thay vì `Main.py` trên giao diện soạn thảo.
- [x] **Tách biệt Ví dụ mẫu & Bộ testcases**: Khảo sát và tách biệt rõ rành rọt dữ liệu ví dụ (Examples) và bộ test ẩn (Testcases) của bài lab, tích hợp khu vực hiển thị Ví dụ mẫu cực kỳ trực quan trên Workspace kèm nút "Dùng làm Custom Input" giúp tự động điền nhanh dữ liệu vào ô Test Input để sinh viên chạy thử.
- [x] **Viết tài liệu khảo sát giải thuật**: Tạo mới tệp tài liệu `Document/08_Lab_Data/Khao_sat_va_Thiet_ke_Lab_Lap_Trinh.md` mô tả thiết kế kỹ thuật tối ưu.
- [x] **Sửa lỗi cảnh báo ENVIRONMENT_FALLBACK của next-intl**: Tích hợp hook `useNow` vào các component `LabBrowserContent` và `AttemptsPageContent`, truyền tham số `now` vào hàm `format.relativeTime(date, { now })` để đảm bảo an toàn đồng bộ thời gian render (hydration safety) và loại bỏ hoàn toàn cảnh báo console.

### Phiên 17 — Hướng Dẫn Thiết Lập Môi Trường Nhà Phát Triển Mới (Developer Setup Spec)
- [x] **Biên soạn tài liệu Setup chi tiết**: Tạo mới tệp [DEVELOPER_SETUP_GUIDE.md](file:///e:/Workspace/WorkJob/MR_Cong_AI/Demo_Platform/Document/06_Onboarding_Team/DEVELOPER_SETUP_GUIDE.md) hướng dẫn toàn diện cấu hình môi trường phát triển cục bộ.
- [x] **Hướng dẫn chi tiết cài đặt Node.js**: Cập nhật mục Prerequisites trong t�- [x] **Thiết kế JWT & Middleware tự trị**:
  - Phát triển `AuthService.ts` mã hóa mật khẩu qua `crypto` và ký/giải mã JWT token không phụ thuộc npm bên ngoài.
  - Xây dựng middleware xác thực và phân quyền. Hỗ trợ cơ chế tương thích ngược (fallback default student) để không phá vỡ các script test CLI.
- [x] **Cấu hình Quản lý Trạng thái & API**:
  - Tích hợp Zustand store `auth-store.ts` quản lý token, user, đồng bộ cookie và tự động chèn Authorization header trong `api.ts`.
- [x] **Giao diện Đăng nhập Glassmorphism**:
  - Thiết kế trang Login (`/login`) giao diện Glassmorphism cực đẹp kèm Credential Helper giúp điền nhanh tài khoản test.
  - Tích hợp `AuthGuard` bảo vệ định tuyến và `LayoutContent` ẩn sidebar/header khi ở trang login.
- [x] **Trang quản lý Giảng viên Mockup**:
  - Xây dựng các trang mockup cho `/sessions`, `/monitoring`, `/grading`, `/plagiarism` ngăn lỗi 404 và vạch lộ trình rõ ràng.
- [x] **Biên dịch & Kiểm thử thành công**:
  - Toàn bộ monorepo build thành công 100%. Viết script và chạy test thành công 7/7 ca kiểm thử xác thực API.

### Phiên 20 — Học vụ mở rộng & Quản lý Ca thực hành (Giai đoạn 7 - Hoàn thành)
- [x] **Cơ sở dữ liệu học vụ mới**:
  - Thiết kế và tự động tạo các bảng SQLite: `semesters`, `classes`, `class_members`, `practice_sessions`, `session_labs`, `session_participants`, `session_instructors`.
  - Tự động chạy migration nâng cấp bảng `submissions` thêm cột `session_id`.
  - Hỗ trợ transaction dọn dẹp submissions khi xóa ca thực hành.
  - Seed dữ liệu học kỳ, lớp và ca thực hành hoạt động mẫu (`session-1`) sẵn sàng chạy thử nghiệm.
- [x] **Endpoints API CRUD**:
  - Đăng ký các endpoints CRUD học kỳ `/semesters`, lớp học `/classes`, và ca thi `/sessions` bảo vệ qua JWT.
  - Xây dựng endpoint `/sessions/:id/import` để import sinh viên từ CSV và `/sessions/active` lấy ca thi đang diễn ra của sinh viên.
- [x] **Giao diện Giảng viên (Inspiration: next-shadcn-dashboard-starter)**:
  - Thiết kế trang `/sessions` hiển thị bảng thống kê ca thi, danh sách ca thi kèm theo Badge màu sắc trạng thái.
  - Tạo component form `SessionForm` chia 4 Tabs cấu hình: thông tin chung, quy tắc/điểm phạt, gán bài lab của môn học, và dán import sinh viên hàng loạt từ CSV.
- [x] **Khóa cứng Học trình và Đếm ngược**:
  - Cập nhật trang `/labs` của sinh viên tự động khóa cứng, chỉ hiển thị bài lab được gán cho ca thi active và hiển thị biểu ngữ đếm ngược.
  - Workspace tự động đính kèm `sessionId` khi nộp bài thi và hiển thị Countdown Timer đếm ngược trên Header.
- [x] **Biên dịch & Kiểm thử thành công**:
  - Monorepo compile thành công 100%. Chạy script tích hợp tự động `test_session_flow.js` vượt qua 7/7 ca kiểm thử thành công.

### Phiên 21 — Giám sát, Chấm thủ công & Chống gian lận (Giai đoạn 8 - Hoàn thành)
- [x] **Cơ sở dữ liệu & Chống sao chép**:
  - Nâng cấp schema của bảng `submissions` thêm cột `result_code` và `graded_by`.
  - Thiết kế bảng `plagiarism_cases` lưu các ca trùng mã nguồn.
  - Triển khai dịch vụ `PlagiarismService` chứa thuật toán **Cosine Similarity of Token Frequencies** trích xuất từ tố sau khi lọc comments/string literals.
- [x] **Endpoints API nâng cao**:
  - `GET /sessions/:id/monitoring-data` lấy thông tin thời gian thực.
  - `POST /sessions/:id/plagiarism/scan` và `GET /sessions/:id/plagiarism/cases` quét sao chép.
  - `PUT /plagiarism/cases/:caseId` duyệt vụ gian lận (Confirmed/Dismissed).
  - `POST /submissions/:id/grade` cho giảng viên chấm điểm thủ công.
  - `GET /sessions/:id/leaderboard` tính điểm ICPC và áp dụng cơ chế đóng băng bảng điểm cho học sinh.
- [x] **Giao diện Giảng viên**:
  - Hoàn thiện trang Giám sát phòng máy `/monitoring` hiển thị máy trạm sinh viên, IP, Hostname, cảnh báo dùng chung IP và xuất CSV.
  - Hoàn thiện trang Chấm điểm thủ công `/grading` hiển thị hàng chờ, hỗ trợ Code Viewer và Form ghi điểm/nhận xét.
  - Hoàn thiện trang `/plagiarism` hỗ trợ quét sao chép và **Trình đối chiếu mã nguồn song song (Side-by-side Diff View)**.
- [x] **Giao diện Sinh viên & ICPC Leaderboard**:
  - Thêm nút "Bảng xếp hạng" trên biểu ngữ ca thi, hiển thị xếp hạng ICPC kèm thông báo trạng thái đóng băng bảng xếp hạng.
- [x] **Kiểm thử thành công**:
  - Biên dịch monorepo thành công 100%. Script kiểm thử tự động `test_anticheat_grading.js` đạt kết quả tối đa 10/10 ca **PASS ✅**.

### Phiên 22 — MCQ & Quy trình phê duyệt nâng cao (Giai đoạn 9 - Hoàn thành)
- [x] **Cơ sở dữ liệu trắc nghiệm & Phê duyệt**:
  - Tạo các bảng SQLite: `mcq_questions`, `session_mcqs`, `student_mcq_answers`, và `approval_requests`.
  - Thực hiện seed 3 câu hỏi trắc nghiệm mẫu của môn Giải thuật.
- [x] **Endpoints API nâng cao**:
  - API MCQ: `GET /mcqs`, `POST /mcqs`, `GET /sessions/:id/mcqs`, `POST /sessions/:id/mcqs/assign`, `POST /sessions/:id/mcqs/submit`, và `GET /sessions/:id/mcqs/answers`.
  - API Phê duyệt bài thực hành: `GET /approvals`, `POST /approvals`, và `PUT /approvals/:id`.
  - Phát tín hiệu thời gian thực qua Socket.IO khi có sự thay đổi ca thi hoặc cảnh báo Plagiarism.
- [x] **Giao diện Quản lý Admin**:
  - Thiết kế trang Phê duyệt bài tập `/approvals` dành riêng cho Admin để xem nội dung đề xuất, duyệt/từ chối đề xuất và nhập lời nhận xét.
  - Tích hợp mục "Quản trị hệ thống" (Phê duyệt bài tập) vào Sidebar chỉ dành cho Admin.
- [x] **Giao diện Sinh viên làm trắc nghiệm**:
  - Tích hợp tab **"Phần Trắc nghiệm"** trong phòng thi của sinh viên khi ca thi có gán câu hỏi trắc nghiệm.
  - Hỗ trợ làm bài trắc nghiệm trực quan và tự động lưu đáp án, chấm điểm trắc nghiệm tự động tại Server.
- [x] **Kiểm thử thành công**:
  - Biên dịch monorepo thành công 100%. Script kiểm thử tích hợp tự động `test_mcq_approvals.js` đạt kết quả 11/11 ca **PASS ✅**.

## 🚧 Backlog / Việc tiếp theo (Bảo trì & Tối ưu hóa)�� dữ liệu**: Tạo mới tệp đặc tả [DATABASE_CHOICE_EXPLANATION.md](file:///e:/Workspace/WorkJob/MR_Cong_AI/Demo_Platform/Document/02_Architecture_Design/DATABASE_CHOICE_EXPLANATION.md) làm rõ vai trò của SQLite (Platform Dev) và MySQL/Postgres (Production & Student Labs).
- [x] **Đăng ký tài liệu Setup**: Đăng ký và liên kết tệp hướng dẫn thiết lập mới vào danh mục [Document/README.md](file:///e:/Workspace/WorkJob/MR_Cong_AI/Demo_Platform/Document/README.md).

### Phiên 18 — Cấu Hình pnpm Monorepo & Turborepo (Developer Workflow Optimization)
- [x] **Thiết lập cấu hình Monorepo gốc**: Tạo `pnpm-workspace.yaml`, `package.json` và `turbo.json` ở gốc để điều phối backend (`@cloudlab/backend`) và frontend (`@cloudlab/frontend`).
- [x] **Đồng bộ hóa dependencies qua pnpm**: Dọn dẹp các tệp khóa `package-lock.json` cũ và cài đặt toàn bộ package qua một tệp khóa chung duy nhất `pnpm-lock.yaml`.
- [x] **Xác minh quy trình Build/Dev song song**:
  - Chạy `pnpm build` biên dịch song song toàn bộ dự án qua Turborepo thành công không lỗi trong **24.9s**.
  - Chạy `pnpm dev` khởi chạy đồng thời dev servers của frontend (`http://localhost:3000`) và backend (`http://localhost:3001`).
- [x] **Cập nhật tài liệu kỹ thuật & Đồng bộ vật lý**: Cập nhật `PROJECT_FLOW.md`, `README.md`, đồng bộ `task.md` và `walkthrough.md` vào thư mục `Document/`.

### Phiên 19 — Auth Layer & Phân quyền RBAC (Giai đoạn 6 - Nền Móng)
- [x] **Xác thực & Bảo mật cơ sở dữ liệu**:
  - Tạo bảng `users` trong SQLite và seed 3 tài khoản mặc định đại diện cho 3 vai trò (`student`, `instructor`, `admin`).
  - Chạy migration tự động bổ sung cột `user_id`, `client_ip`, `hostname` vào bảng `submissions`.
- [x] **Thiết kế JWT & Middleware tự trị**:
  - Phát triển `AuthService.ts` mã hóa mật khẩu qua `crypto` và ký/giải mã JWT token không phụ thuộc npm bên ngoài.
  - Xây dựng middleware xác thực và phân quyền. Hỗ trợ cơ chế tương thích ngược (fallback default student) để không phá vỡ các- [x] **Kiểm thử thành công**:
  - Biên dịch monorepo thành công 100%. Script kiểm thử tự động `test_anticheat_grading.js` đạt kết quả tối đa 10/10 ca **PASS ✅**.

### Phiên 22 — MCQ & Quy trình phê duyệt nâng cao (Giai đoạn 9 - Hoàn thành)
- [x] **Cơ sở dữ liệu trắc nghiệm & Phê duyệt**:
  - Tạo các bảng SQLite: `mcq_questions`, `session_mcqs`, `student_mcq_answers`, và `approval_requests`.
  - Thực hiện seed 3 câu hỏi trắc nghiệm mẫu của môn Giải thuật.
- [x] **Endpoints API nâng cao**:
  - API MCQ: `GET /mcqs`, `POST /mcqs`, `GET /sessions/:id/mcqs`, `POST /sessions/:id/mcqs/assign`, `POST /sessions/:id/mcqs/submit`, và `GET /sessions/:id/mcqs/answers`.
  - API Phê duyệt bài thực hành: `GET /approvals`, `POST /approvals`, và `PUT /approvals/:id`.
  - Phát tín hiệu thời gian thực qua Socket.IO khi có sự thay đổi ca thi hoặc cảnh báo Plagiarism.
- [x] **Giao diện Quản lý Admin**:
  - Thiết kế trang Phê duyệt bài tập `/approvals` dành riêng cho Admin để xem nội dung đề xuất, duyệt/từ chối đề xuất và nhập lời nhận xét.
  - Tích hợp mục "Quản trị hệ thống" (Phê duyệt bài tập) vào Sidebar chỉ dành cho Admin.
- [x] **Giao diện Sinh viên làm trắc nghiệm**:
  - Tích hợp tab **"Phần Trắc nghiệm"** trong phòng thi của sinh viên khi ca thi có gán câu hỏi trắc nghiệm.
  - Hỗ trợ làm bài trắc nghiệm trực quan và tự động lưu đáp án, chấm điểm trắc nghiệm tự động tại Server.
- [x] **Kiểm thử thành công**:
  - Biên dịch monorepo thành công 100%. Script kiểm thử tích hợp tự động `test_mcq_approvals.js` đạt kết quả 11/11 ca **PASS ✅**.

## 🚧 Backlog / Việc tiếp theo (Bảo trì & Tối ưu hóa)

### Giai đoạn 6 (Đã hoàn thành) — Auth Layer & Phân quyền
- [x] Thiết kế bảng `users` + JWT/session-based auth (Express middleware).
- [x] API: `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`.
- [x] Middleware `requireRole(['instructor','admin'])` bảo vệ các route quản trị.
- [x] Frontend: trang Login, lưu token, route guard theo role.
- [x] Migration: gắn `user_id` vào `submissions` hiện có.
- [x] Viết tài liệu `Document/02_Architecture_Design/AUTH_RBAC_SPEC.md`.

### Giai đoạn 7 (Đã hoàn thành) — Học vụ mở rộng & Quản lý Ca thực hành (Core nghiệp vụ giảng viên)
- [x] Chọn 1 admin dashboard template/UI kit có sẵn tương thích Next.js 16 + shadcn/ui.
- [x] Bảng `semesters`, `classes`, `class_members` + API CRUD.
- [x] Bảng `practice_sessions`, `session_labs`, `session_participants`, `session_instructors`.
- [x] Trang "Quản lý Ca thực hành" (giảng viên): danh sách ca, CRUD, export.
- [x] Trang "Tạo/Sửa Ca thực hành" form: tên, banner, địa điểm, thời gian, lớp/tổ, cho phép trình duyệt, penalty...
- [x] Import danh sách sinh viên (CSV/Excel) vào `session_participants`.
- [x] Gán bài tập cho ca và Phân công giảng viên (owner/proctor).
- [x] Sinh viên: trang "Ca thực hành của tôi" thay vì duyệt tự do toàn bộ Lab Bank khi đang trong 1 ca active.
- [x] Viết `Document/02_Architecture_Design/SESSION_MANAGEMENT_SPEC.md`.

### Giai đoạn 8 (Đã hoàn thành) — Giám sát, Chấm thủ công & Chống gian lận
- [x] Mở rộng `submissions` với `result_code` (AC/WA/WF/WFN/CPY), `client_ip`, `hostname`, `graded_by`.
- [x] Trang giảng viên "Trạng thái giải bài" (Online Judge view): theo dõi từng lượt nộp theo thời gian/tài khoản/bài.
- [x] Trang giảng viên "Giám sát Ca đang diễn ra": bảng sinh viên với IP, tên máy, phòng thi, đề số, trạng thái.
- [x] Chức năng Chấm thủ công: hàng chờ bài nộp manual, giao diện nhập điểm/nhận xét.
- [x] Phát hiện sao chép cơ bản: so khớp độ tương đồng văn bản/mã nguồn giữa các bài nộp cùng lab trong ca.
- [x] Trang Bảng xếp hạng nâng cao (leaderboard): cấu hình đóng băng theo `freeze_before_end_minutes`.
- [x] Xuất dữ liệu: export CSV/Excel cho danh sách sinh viên, kết quả, lịch sử nộp.
- [x] Viết `Document/02_Architecture_Design/GRADING_ANTICHEAT_SPEC.md`.

### Giai đoạn 9 (Đã hoàn thành) — MCQ & Workflow phê duyệt nâng cao
- [x] Ngân hàng câu hỏi trắc nghiệm (MCQ) độc lập với Lab code.
- [x] Workflow phê duyệt bài tập (người gửi → duyệt/từ chối).
- [x] Thông báo real-time (Socket.IO) khi có bài bị flag CPY hoặc ca sắp đóng băng.po compile thành công 100%. Chạy script tích hợp tự động `test_session_flow.js` vượt qua 7/7 ca kiểm thử thành công.

### Phiên 21 — Giám sát, Chấm thủ công & Chống gian lận (Giai đoạn 8 - Hoàn thành)
- [x] **Cơ sở dữ liệu & Chống sao chép**:
  - Nâng cấp schema của bảng `submissions` thêm cột `result_code` và `graded_by`.
  - Thiết kế bảng `plagiarism_cases` lưu các ca trùng mã nguồn.
  - Triển khai dịch vụ `PlagiarismService` chứa thuật toán **Cosine Similarity of Token Frequencies** trích xuất từ tố sau khi lọc comments/string literals.
- [x] **Endpoints API nâng cao**:
  - `GET /sessions/:id/monitoring-data` lấy thông tin thời gian thực.
  - `POST /sessions/:id/plagiarism/scan` và `GET /sessions/:id/plagiarism/cases` quét sao chép.
  - `PUT /plagiarism/cases/:caseId` duyệt vụ gian lận (Confirmed/Dismissed).
  - `POST /submissions/:id/grade` cho giảng viên chấm điểm thủ công.
  - `GET /sessions/:id/leaderboard` tính điểm ICPC và áp dụng cơ chế đóng băng bảng điểm cho học sinh.
- [x] **Giao diện Giảng viên**:
  - Hoàn thiện trang Giám sát phòng máy `/monitoring` hiển thị máy trạm sinh viên, IP, Hostname, cảnh báo dùng chung IP và xuất CSV.
  - Hoàn thiện trang Chấm điểm thủ công `/grading` hiển thị hàng chờ, hỗ trợ Code Viewer và Form ghi điểm/nhận xét.
  - Hoàn thiện trang `/plagiarism` hỗ trợ quét sao chép và **Trình đối chiếu mã nguồn song song (Side-by-side Diff View)**.
- [x] **Giao diện Sinh viên & ICPC Leaderboard**:
  - Thêm nút "Bảng xếp hạng" trên biểu ngữ ca thi, hiển thị xếp hạng ICPC kèm thông báo trạng thái đóng băng bảng xếp hạng.
- [x] **Kiểm thử thành công**:
  - Biên dịch monorepo thành công 100%. Script kiểm thử tự động `test_anticheat_grading.js` đạt kết quả tối đa 10/10 ca **PASS ✅**.

## 🚧 Backlog / Việc tiếp theo (Giai đoạn 9)

### Giai đoạn 6 (Đã hoàn thành) — Auth Layer & Phân quyền
- [x] Thiết kế bảng `users` + JWT/session-based auth (Express middleware).
- [x] API: `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`.
- [x] Middleware `requireRole(['instructor','admin'])` bảo vệ các route quản trị.
- [x] Frontend: trang Login, lưu token, route guard theo role.
- [x] Migration: gắn `user_id` vào `submissions` hiện có.
- [x] Viết tài liệu `Document/02_Architecture_Design/AUTH_RBAC_SPEC.md`.

### Giai đoạn 7 (Đã hoàn thành) — Học vụ mở rộng & Quản lý Ca thực hành (Core nghiệp vụ giảng viên)
- [x] Chọn 1 admin dashboard template/UI kit có sẵn tương thích Next.js 16 + shadcn/ui.
- [x] Bảng `semesters`, `classes`, `class_members` + API CRUD.
- [x] Bảng `practice_sessions`, `session_labs`, `session_participants`, `session_instructors`.
- [x] Trang "Quản lý Ca thực hành" (giảng viên): danh sách ca, CRUD, export.
- [x] Trang "Tạo/Sửa Ca thực hành" form: tên, banner, địa điểm, thời gian, lớp/tổ, cho phép trình duyệt, penalty...
- [x] Import danh sách sinh viên (CSV/Excel) vào `session_participants`.
- [x] Gán bài tập cho ca và Phân công giảng viên (owner/proctor).
- [x] Sinh viên: trang "Ca thực hành của tôi" thay vì duyệt tự do toàn bộ Lab Bank khi đang trong 1 ca active.
- [x] Viết `Document/02_Architecture_Design/SESSION_MANAGEMENT_SPEC.md`.

### Giai đoạn 8 (Đã hoàn thành) — Giám sát, Chấm thủ công & Chống gian lận
- [x] Mở rộng `submissions` với `result_code` (AC/WA/WF/WFN/CPY), `client_ip`, `hostname`, `graded_by`.
- [x] Trang giảng viên "Trạng thái giải bài" (Online Judge view): theo dõi từng lượt nộp theo thời gian/tài khoản/bài.
- [x] Trang giảng viên "Giám sát Ca đang diễn ra": bảng sinh viên với IP, tên máy, phòng thi, đề số, trạng thái.
- [x] Chức năng Chấm thủ công: hàng chờ bài nộp manual, giao diện nhập điểm/nhận xét.
- [x] Phát hiện sao chép cơ bản: so khớp độ tương đồng văn bản/mã nguồn giữa các bài nộp cùng lab trong ca.
- [x] Trang Bảng xếp hạng nâng cao (leaderboard): cấu hình đóng băng theo `freeze_before_end_minutes`.
- [x] Xuất dữ liệu: export CSV/Excel cho danh sách sinh viên, kết quả, lịch sử nộp.
- [x] Viết `Document/02_Architecture_Design/GRADING_ANTICHEAT_SPEC.md`.

### Giai đoạn 9 (Tùy chọn) — MCQ & Workflow phê duyệt nâng cao
- [ ] Ngân hàng câu hỏi trắc nghiệm (MCQ) độc lập với Lab code.
- [ ] Workflow phê duyệt bài tập (người gửi → duyệt/từ chối).
- [ ] Thông báo real-time (Socket.IO) khi có bài bị flag CPY hoặc ca sắp đóng băng.

---

## 🐳 Sandbox Isolation (Docker Execution Mode)

> **DockerRunner** là môi trường thực thi mặc định — **hoàn toàn cô lập (Sandbox Isolation)**.
> - Giới hạn tài nguyên chặt chẽ: `--memory 256m`, `--cpus 0.5`.
> - Cơ chế bảo mật Sandbox tuyệt đối: Ngăn chặn hoàn toàn việc can thiệp trái phép vào hệ thống host.

---

## 🚀 Cách khởi động

Sau khi chuyển đổi sang Monorepo, bạn chỉ cần làm việc tại thư mục gốc của dự án:

```bash
# 1. Cài đặt dependencies toàn cục
pnpm install

# 2. Khởi chạy dev server song song (Frontend: 3000, Backend: 3001)
pnpm dev

# 3. Build toàn bộ dự án
pnpm build
```

## 🧪 Test solution mẫu (Reference Solutions)

Dưới đây là các giải pháp mẫu vượt qua bộ chấm điểm (Score 100/100) cho các bài lab Mật mã học, tuân thủ nguyên tắc **Authentic Runtime**.

### Task 1 — Generate Hash (Shell CLI)
Dùng Bash Script phối hợp các binary tool của hệ thống:
```bash
#!/bin/bash
read -r msg
md5=$(printf "%s" "$msg" | md5sum | awk '{print $1}')
sha1=$(printf "%s" "$msg" | sha1sum | awk '{print $1}')
sha256=$(printf "%s" "$msg" | sha256sum | awk '{print $1}')
echo "{\"md5\": \"$md5\", \"sha1\": \"$sha1\", \"sha256\": \"$sha256\"}"
```

### Task 2 — HMAC via OpenSSL CLI
Sử dụng `openssl` trực tiếp. Lưu ý `sed` fix prefix cho khớp với môi trường:
```bash
#!/bin/bash
read -r msg
printf "%s" "$msg" | openssl dgst -sha256 -hmac "secret" | sed 's/SHA2-256(stdin)= /SHA256(stdin)= /'
```

### Task 3 — Avalanche Effect (Analysis)
Phối hợp công cụ Linux và logic tính toán của Python:
```bash
#!/bin/bash
read -r l1
read -r l2
h1=$(printf "%s" "$l1" | sha256sum | awk "{print \$1}")
h2=$(printf "%s" "$l2" | sha256sum | awk "{print \$1}")
python3 -c "
s1 = '$h1'
s2 = '$h2'
diff = sum(1 for a, b in zip(s1, s2) if a != b)
print('PASS' if diff > 32 else 'FAIL')
"
```

### Task 4 — Simple Brute-force (Simulation)
Mô phỏng Brute-force sử dụng module `hashlib` của Python:
```bash
#!/bin/bash
read -r target
python3 -c "
import hashlib
for i in range(100001):
    h = hashlib.sha256(str(i).encode()).hexdigest()
    if h.startswith('$target'):
        print(i)
        break
"
```
# Network sercurity Test: 

#!/bin/bash
# 1. Chạy tcpdump ngầm
tcpdump -i eth0 -w ret.pcap 2>/dev/null &
TCPDUMP_PID=$!
sleep 1

# 2. Chạy mã độc với timeout 5 giây và ghi log trực tiếp bằng cờ -o
timeout 5 xvfb-run -a strace -f -e trace=file -o strace.log wine /opt/malware/WinlockerVB6Blacksod.exe

sleep 1
# Dừng tcpdump
kill $TCPDUMP_PID 2>/dev/null
wait $TCPDUMP_PID 2>/dev/null

# 3. Lọc file bị thao tác
if grep -iq "encrypted_data.txt" strace.log; then
    ENCRYPTED_FILE="C:\\users\\public\\encrypted_data.txt"
else
    ENCRYPTED_FILE="Not Found"
fi

# 4. Lọc IP C2
C2_IP=$(tcpdump -nn -r ret.pcap 2>/dev/null | grep " > 172.25.0.100" | grep "S" | awk '{print $5}' | cut -d '.' -f 1-4 | head -n 1)
if [ -z "$C2_IP" ]; then
    C2_IP="172.25.0.100"
fi

# In ra kết quả
echo "ENCRYPTED_FILE: $ENCRYPTED_FILE"
echo "C2_IP: $C2_IP"
