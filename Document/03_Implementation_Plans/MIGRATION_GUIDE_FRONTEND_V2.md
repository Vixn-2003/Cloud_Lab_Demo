# 🚀 Hướng dẫn Triển khai Frontend Ver2 — Cloud Lab Platform

> **Mục đích**: Hướng dẫn AI (hoặc developer) thay thế hoàn toàn Frontend cũ (React + Vite) bằng Frontend mới (Next.js 16 + shadcn/ui) và kết nối đúng với Backend hiện có.

---

## 📋 TỔNG QUAN TÌNH HÌNH

### Frontend CŨ (`project/frontend/`)
- **Tech**: React 19 + Vite 8 + Tailwind CSS v4 + Monaco Editor
- **Vấn đề**: Monolithic `App.tsx` (553 dòng), không có routing, không state management, không responsive
- **Trạng thái**: Đang hoạt động tại `http://localhost:5173`

### Frontend MỚI (`project/Fontend_Document_Reference/cloud-lab-platform_Ver2/`)
- **Tech**: Next.js 16 + shadcn/ui (57 components) + Tailwind CSS v4 + zustand + framer-motion + Socket.IO
- **Vấn đề**: Đang dùng **sample data cục bộ** (`lib/sample-data.ts`), CHƯA kết nối API backend thật
- **Trạng thái**: Chỉ là reference code, chưa chạy được độc lập

### Backend (KHÔNG THAY ĐỔI)
- **Tech**: Node.js + Express 5 + TypeScript + Socket.IO + SQLite
- **API Base**: `http://localhost:3001`
- **Trạng thái**: Đang hoạt động, có đầy đủ 10 API endpoints + WebSocket events

---

## 🎯 MỤC TIÊU

1. Copy toàn bộ code từ `cloud-lab-platform_Ver2` vào thư mục `project/frontend/` (thay thế hoàn toàn)
2. Cài đặt dependencies (pnpm install)
3. Kết nối tất cả các trang với API backend thật (thay thế sample data)
4. Đảm bảo WebSocket hoạt động cho real-time execution logs
5. Đảm bảo WebTerminal (xterm.js) hoạt động cho interactive labs
6. Chạy được tại `http://localhost:3000` và giao tiếp đúng với backend tại `http://localhost:3001`

---

## 📁 CẤU TRÚC FILE CỦA FRONTEND MỚI

```
cloud-lab-platform_Ver2/
├── app/
│   ├── layout.tsx                    ← Root layout (fonts, metadata, Toaster)
│   ├── page.tsx                      ← Redirect → /dashboard
│   ├── globals.css                   ← Tailwind + custom CSS variables
│   ├── dashboard/
│   │   ├── page.tsx                  ← Dashboard page wrapper
│   │   ├── dashboard-content.tsx     ← 🔴 ĐANG DÙNG SAMPLE DATA
│   │   └── dashboard-skeleton.tsx    ← Loading skeleton
│   ├── labs/
│   │   ├── page.tsx                  ← Lab browser page wrapper
│   │   ├── lab-browser-content.tsx   ← 🔴 ĐANG DÙNG SAMPLE DATA
│   │   ├── lab-browser-skeleton.tsx  ← Loading skeleton
│   │   └── [labId]/
│   │       └── page.tsx              ← 🔴 Lab workspace - CẦN KẾT NỐI API + WEBSOCKET
│   ├── submissions/
│   │   ├── page.tsx                  ← 🔴 ĐANG DÙNG SAMPLE DATA
│   │   └── [submissionId]/
│   │       └── page.tsx              ← Submission detail
│   ├── workspace/                    ← Standalone code editor
│   ├── terminal/                     ← Standalone terminal
│   └── settings/                     ← User preferences
├── components/
│   ├── app-sidebar.tsx               ← Navigation sidebar
│   ├── code-editor.tsx               ← Monaco Editor wrapper
│   ├── console-output.tsx            ← Real-time log viewer
│   ├── score-display.tsx             ← Animated score component
│   ├── status-badge.tsx              ← Status indicator
│   └── ui/                           ← 57 shadcn/ui components (KHÔNG CẦN SỬA)
├── hooks/
│   ├── use-socket.ts                 ← Socket.IO hook (ĐÃ CÓ)
│   ├── use-mobile.ts                 ← Mobile detection
│   └── use-toast.ts                  ← Toast notifications
├── lib/
│   ├── api.ts                        ← ✅ API client (ĐÃ ĐÚNG, dùng fetch + env var)
│   ├── sample-data.ts                ← 🔴 DỮ LIỆU MẪU - CẦN THAY THẾ BẰNG API CALLS
│   ├── store.ts                      ← Zustand global store
│   ├── types.ts                      ← TypeScript interfaces
│   └── utils.ts                      ← Utilities (cn function)
├── package.json                      ← Dependencies
└── tsconfig.json                     ← TypeScript config
```

---

## 🔧 CÁC BƯỚC THỰC HIỆN CHI TIẾT

### BƯỚC 1: Thay thế thư mục Frontend

```bash
# 1. Backup frontend cũ
cd project
mv frontend frontend_old_backup

# 2. Copy frontend mới vào
cp -r "Fontend_Document_Reference/cloud-lab-platform_Ver2" frontend

# 3. Cài đặt dependencies
cd frontend
pnpm install
# (hoặc npm install nếu không có pnpm)
```

### BƯỚC 2: Tạo file `.env.local`

Tạo file `project/frontend/.env.local`:
```env
NEXT_PUBLIC_API_BASE=http://localhost:3001
```

### BƯỚC 3: Kết nối các trang với API Backend

> ⚠️ **ĐÂY LÀ BƯỚC QUAN TRỌNG NHẤT**
> Mỗi page đang import từ `@/lib/sample-data.ts` cần được chuyển sang gọi API thật từ `@/lib/api.ts`

#### 3.1 Dashboard (`app/dashboard/dashboard-content.tsx`)

**Hiện tại**: Import `sampleLabs`, `sampleAttempts`, `getStudentStats()` từ `sample-data.ts`

**Cần sửa**: Gọi API thật
```typescript
// THAY THẾ:
import { sampleLabs, sampleAttempts, getStudentStats } from '@/lib/sample-data';

// BẰNG:
import { getFaculties, getSubjects, getLabs, getSubmissions } from '@/lib/api';

// Trong component, dùng useEffect hoặc React Server Component để fetch:
const [faculties] = await Promise.all([getFaculties()]);
const [subjects] = await Promise.all([getSubjects()]);
// ... tính toán KPIs từ dữ liệu thật
```

#### 3.2 Lab Browser (`app/labs/lab-browser-content.tsx`)

**Hiện tại**: Import `sampleLabs`, `sampleSubjects`, `sampleFaculties` từ `sample-data.ts`

**Cần sửa**: Gọi `getFaculties()`, `getSubjects()`, `getLabs()` từ `api.ts`

#### 3.3 Lab Workspace (`app/labs/[labId]/page.tsx`)

**Hiện tại**: Có thể đang dùng sample data cho lab detail

**Cần sửa**:
1. Gọi `getLab(labId)` để lấy thông tin bài lab
2. Gọi `getProfile(lab.profileId)` để lấy execution profile
3. Kết nối WebSocket cho real-time execution:
   - Khi bấm "Run": Gọi `runCode()` → nhận `executionId` → subscribe WebSocket
   - Khi bấm "Submit": Gọi `submitCode()` → nhận `executionId` → subscribe WebSocket
4. Nếu `environmentType === 'single_machine' || 'multi_node'`:
   - Hiển thị WebTerminal thay vì Monaco Editor
   - Gọi `initTerminal()` để lấy `sessionId`
   - Kết nối WebSocket events: `terminal:start`, `terminal:input`, `terminal:output`

#### 3.4 Submissions (`app/submissions/page.tsx`)

**Hiện tại**: Import `sampleSubmissions` từ `sample-data.ts`

**Cần sửa**: Gọi `getSubmissions()` từ `api.ts`

#### 3.5 Submission Detail (`app/submissions/[submissionId]/page.tsx`)

**Hiện tại**: Import từ sample data

**Cần sửa**: Gọi `getSubmission(submissionId)` từ `api.ts`

### BƯỚC 4: Kiểm tra WebSocket Hook

File `hooks/use-socket.ts` đã có sẵn. Đảm bảo nó:
1. Kết nối đến `NEXT_PUBLIC_API_BASE` (http://localhost:3001)
2. Hỗ trợ events: `subscribe`, `execution:log`, `execution:status`
3. Hỗ trợ events: `terminal:start`, `terminal:input`, `terminal:output`, `terminal:exit`, `terminal:resize`

### BƯỚC 5: Xử lý khác biệt TypeScript Types

**Backend trả về** (field names dùng snake_case):
```json
{
  "lab_id": "...",
  "profile_id": "...",
  "result_json": "...",
  "created_at": "..."
}
```

**Frontend Ver2 types** (`lib/types.ts`): Kiểm tra xem có khớp với backend hay không. Nếu backend trả snake_case mà frontend expect camelCase, cần thêm mapper function.

### BƯỚC 6: Chạy thử

```bash
# Terminal 1: Backend
cd project/backend
npm run dev    # → http://localhost:3001

# Terminal 2: Frontend mới
cd project/frontend  
pnpm dev       # → http://localhost:3000
```

---

## 🗺️ MAPPING: API Backend ↔ Frontend Pages

| Frontend Page | API Calls Cần Thiết | WebSocket Events |
|---------------|---------------------|-------------------|
| `/dashboard` | `GET /faculties`, `GET /subjects`, `GET /labs`, `GET /submissions` | — |
| `/labs` | `GET /faculties`, `GET /subjects`, `GET /labs?subjectId=X` | — |
| `/labs/[labId]` | `GET /labs/:id`, `GET /profiles/:id`, `POST /run`, `POST /submit` | `subscribe`, `execution:log`, `execution:status` |
| `/labs/[labId]` (terminal) | `POST /terminal/init` | `terminal:start`, `terminal:input`, `terminal:output`, `terminal:resize`, `terminal:exit` |
| `/submissions` | `GET /submissions` | — |
| `/submissions/[id]` | `GET /submissions/:id` | — |

---

## ⚠️ LƯU Ý QUAN TRỌNG

### 1. CORS
Backend đã cấu hình `cors({ origin: "*" })` nên không cần lo về CORS.

### 2. Sample Data vs Real Data
Frontend Ver2 có nhiều fields MỞ RỘNG mà backend CHƯA CÓ:
- `dueDate`, `status` (completed/in_progress/overdue), `progress`, `bestScore`, `lastEditedAt`, `attemptsCount`, `canResubmit` — những field này chỉ tồn tại trong sample data.
- **Giải pháp**: Tạm thời hardcode hoặc tính toán từ dữ liệu submissions. Ví dụ: nếu lab có submission với score=100 → status = 'completed'.

### 3. Internationalization (next-intl)
Frontend Ver2 có cấu hình `next-intl` cho đa ngôn ngữ. Nếu không cần, có thể bỏ qua middleware.ts và thư mục `messages/`.

### 4. Vercel Analytics
File layout.tsx import `@vercel/analytics/next`. Nếu không deploy lên Vercel, comment dòng này ra để tránh lỗi.

### 5. pnpm-lock.yaml
Frontend Ver2 dùng `pnpm`. Nếu bạn dùng `npm`, xóa `pnpm-lock.yaml` rồi chạy `npm install`.

---

## ✅ CHECKLIST SAU KHI HOÀN THÀNH

- [ ] Frontend mới chạy được tại `http://localhost:3000`
- [ ] Dashboard hiển thị KPIs từ dữ liệu thật (số lab, số submissions, avg score)
- [ ] Lab Browser hiển thị danh sách labs từ API `/labs`
- [ ] Lab Workspace: Monaco Editor hoạt động cho `single_runtime` labs
- [ ] Lab Workspace: WebTerminal hoạt động cho `single_machine`/`multi_node` labs
- [ ] Bấm "Run" → thấy output real-time qua WebSocket
- [ ] Bấm "Submit" → thấy kết quả chấm điểm (score, test cases)
- [ ] Submissions page hiển thị lịch sử từ API `/submissions`
- [ ] Sidebar navigation hoạt động đúng
- [ ] Breadcrumb hiển thị đúng trên mỗi trang
- [ ] Toast notifications hiển thị khi có sự kiện
- [ ] Responsive layout hoạt động trên mobile
