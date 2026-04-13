# 📚 Demo Platform: Multi-Environment Coding Lab

## 🎯 Mục tiêu tổng thể

Xây dựng một **demo nền tảng lab thực hành lập trình trực tuyến** có khả năng:
- Sinh viên viết code trực tiếp trên trình duyệt (Monaco Editor)
- **Chạy thử** (Run) để xem output ngay lập tức
- **Nộp bài** (Submit) để chấm tự động theo testcase
- Hệ thống dùng **Execution Profile** thay vì gắn cứng ngôn ngữ
- Kiến trúc rõ ràng, dễ nâng cấp lên production

---

## 🗂️ Cấu trúc thư mục

```
Demo_Platform/
├── Document/                        ← Tài liệu dự án
│   ├── PROJECT_FLOW.md              ← File này
│   ├── SKILL_production_IDE_v2.md   ← Skill/blueprint kiến trúc production
│   └── deep-research-report.md      ← Báo cáo nghiên cứu sâu
└── project/
    ├── backend/                     ← Node.js + Express + TypeScript
    │   └── src/
    │       ├── index.ts             ← Entry point, định nghĩa API routes
    │       ├── models/
    │       │   ├── types.ts         ← TypeScript interfaces
    │       │   └── ProblemRegistry.ts ← Problem & Profile configs
    │       └── services/
    │           ├── ExecutionService.ts  ← Interface (abstraction layer)
    │           └── LocalProcessRunner.ts ← Impl: child_process runner
    └── frontend/                    ← React + Vite + Tailwind v4 + Monaco
        └── src/
            ├── App.tsx              ← Toàn bộ UI logic
            ├── index.css            ← Tailwind v4 import
            └── main.tsx             ← React entry point
```

---

## ⚙️ Tech Stack

| Layer | Công nghệ |
|---|---|
| Frontend | React 19, Vite 8, Tailwind CSS v4, Monaco Editor |
| Backend | Node.js, Express 5, TypeScript 6, ts-node-dev |
| Runner | `child_process` (LocalProcessRunner) |
| Storage | **In-memory** (`Record<string, SubmissionRecord>`) |
| Language support | Python 3 (thêm profile mới để mở rộng) |

---

## 🌐 API Endpoints

| Method | Path | Mô tả |
|---|---|---|
| `GET` | `/problems/:id` | Lấy đề bài (không có testcase) |
| `GET` | `/profiles/:id` | Lấy thông tin Execution Profile |
| `POST` | `/run` | Chạy thử code (mode: `run`) |
| `POST` | `/submit` | Nộp bài + chấm testcase (mode: `submit`) |
| `GET` | `/submissions/:id` | Xem kết quả theo attemptId |

## ⚠️ Disclaimer (Demo Mode)

> **LocalProcessRunner** sử dụng Node.js `child_process` — **không có sandbox isolation**.
> - Chỉ dùng trong môi trường local/trusted.
> - Hệ thống đã được cấu trúc sau `ExecutionService` interface → dễ nâng cấp lên `DockerRunner` hoặc `Judge0Runner` mà không cần thay đổi API.

---

## 🚀 Cách khởi động

```bash
# Backend (Terminal 1)
cd project/backend
npm install
npm run dev       # → http://localhost:3001

# Frontend (Terminal 2)
cd project/frontend
npm install
npm run dev       # → http://localhost:5173
```

**Test solution mẫu** — paste vào Monaco Editor và bấm Grade (Submit):
```python
import sys
line = sys.stdin.read().strip()
if line:
    parts = line.split()
    if len(parts) >= 2:
        print(int(parts[0]) + int(parts[1]))
