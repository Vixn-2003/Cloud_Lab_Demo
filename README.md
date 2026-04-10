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
