# 🎯 KẾ HOẠCH NÂNG CẤP: Từ "Coding Lab cho Sinh viên" → "Nền tảng Thực hành & Thi ATTT cho cả Sinh viên và Giảng viên"

> Tài liệu định hướng triển khai (Implementation Roadmap) dành cho AI Agent **Antigravity**.
> Nguồn tham chiếu: `Bao_cao_phan_tich_tinh_nang_workflow_SECLAB.docx` (phân tích nghiệp vụ SECLAB — PTIT) + trạng thái thực tế hệ thống trong `PROJECT_FLOW.md` (18 phiên đã hoàn thành).
> Ngày lập: 11/07/2026.

---

## 0. Ghi chú bắt buộc cho Antigravity

Theo đúng **AI INSTRUCTIONS** đã ghi ở đầu `PROJECT_FLOW.md`, khi thực thi bất kỳ mục nào trong kế hoạch này:
1. Đánh dấu `[x]` vào backlog tương ứng trong `PROJECT_FLOW.md` ngay sau khi hoàn thành.
2. Viết/ cập nhật tài liệu `.md` mô tả kiến trúc/giải pháp vào đúng thư mục con trong `Document/` (theo cấu trúc 7 chuyên mục ở `README.md`).
3. Đồng bộ `task.md` → `Document/07_Scratchpads/task.md` và `walkthrough.md` → `Document/05_Walkthroughs_Reports/walkthrough.md`.
4. **Không đổi môi trường thực thi (Execution Profile) nếu không có lý do rõ ràng** — nguyên tắc "chọn runtime trước, đơn giản hóa lab sau" trong `PROJECT_FLOW.md` vẫn áp dụng cho các lab hiện có; các thay đổi trong kế hoạch này là ở tầng **nghiệp vụ/vai trò/quản lý**, không phải tầng chấm bài.

---

## 1. Tại sao cần nâng cấp — Gap Analysis

Hệ thống hiện tại (18 phiên đã build) là mô hình **"Problem-centric / Student-only"**:
- Sinh viên chọn Faculty → Subject → Lab → viết code → Run/Submit → xem kết quả.
- **Chưa có Auth Layer** (Giai đoạn 4 backlog còn treo `[ ] Auth Layer: Login bằng tài khoản sinh viên`).
- Chưa có khái niệm **"Ca thực hành" (Session/Exam Session)** — mỗi lượt nộp bài độc lập, không gắn với lớp học, phòng thi, thời gian giới hạn hay giảng viên phụ trách.
- Chưa có vai trò **Giảng viên** — không ai tạo lịch, gán bài, giám sát, chấm thủ công hay xuất báo cáo.
- Chưa có cơ chế **giám sát/chống gian lận** (IP, tên máy, phát hiện sao chép).

Tài liệu phân tích SECLAB (14 màn hình giao diện thực tế) cho thấy mô hình đích cần đạt là **LMS + Online Judge + Quản lý phòng thi + Chống gian lận** kết hợp, với chuỗi nghiệp vụ:

> Giảng viên tạo ca thực hành → cấu hình lớp/sinh viên/giảng viên/phòng thi/bộ bài → sinh viên làm & nộp bài → hệ thống hoặc giảng viên chấm → theo dõi kết quả/lịch sử/gian lận/bảng xếp hạng → chốt & xuất dữ liệu.

Bảng ánh xạ nhanh — cái gì đã có, cái gì thiếu:

| Nhóm năng lực (theo SECLAB) | Hiện trạng hệ thống Cloud Lab | Việc cần làm |
|---|---|---|
| Xác thực & vai trò | ❌ Chưa có Auth, chưa phân role | Xây Auth Layer + RBAC (Student/Instructor/Admin) |
| Học vụ (Học kỳ, Môn, Lớp, Tổ) | ⚠️ Có Faculty→Subject→Lab, **chưa có** Học kỳ/Lớp/Tổ | Mở rộng Academy Hierarchy |
| Ngân hàng bài tập | ✅ Có (Lab + Execution Profile), **chưa có** MCQ, độ khó, bình luận, phê duyệt | Bổ sung MCQ + workflow phê duyệt |
| Quản lý ca thực hành (Session) | ❌ Chưa có khái niệm Session/Ca | Xây mới toàn bộ module |
| Nộp & chấm bài | ✅ Auto-grade (Run/Submit), **chưa có** chấm thủ công | Bổ sung Manual Grading + trạng thái WF/WFN/CPY |
| Giám sát & chống gian lận | ❌ Chưa có | Xây mới: log IP/máy, phát hiện trùng lặp |
| Báo cáo & Bảng xếp hạng | ⚠️ Có `/submissions` cơ bản | Nâng cấp: leaderboard, freeze time, export |

**Kết luận chiến lược:** Đây không phải một tính năng nhỏ mà là **thêm một "trục vai trò" (role axis) và một "trục thời gian/tổ chức" (session axis)** vào toàn bộ hệ thống hiện có. Cách làm an toàn nhất là triển khai theo phase tăng dần, không phá vỡ luồng sinh viên đang chạy ổn định.

---

## 2. Nguyên tắc thiết kế

1. **Không phá vỡ luồng Run/Submit/ExecutionProfile hiện tại** — đây là phần lõi đã test 100/100, chỉ *bọc thêm* lớp ngữ cảnh (session, class, role) xung quanh, không viết lại `ExecutionService`/`DockerRunner`/`NpsLabtainerService`.
2. **Auth Layer là nền móng bắt buộc trước tiên** — mọi tính năng giảng viên đều cần biết "ai đang đăng nhập, vai trò gì". Không thể làm Session Management trước Auth.
3. **Tái sử dụng Academy Hierarchy hiện có** (Faculty → Subject → Lab), chỉ mở rộng thêm **Semester (Học kỳ)**, **Class (Lớp học)**, **Group (Tổ thực hành)** làm lớp cha của Session.
4. **SQLite trước, MySQL/Postgres sau** — đúng định hướng đã ghi trong `DATABASE_CHOICE_EXPLANATION.md`: giữ SQLite cho giai đoạn demo/dev, chỉ migrate khi cần multi-user thật (nhiều giảng viên/phòng thi đồng thời ghi dữ liệu).
5. **Giám sát ở mức "ghi nhận", không làm proctoring phần cứng** — bám sát đúng những gì SECLAB thể hiện (IP, tên máy, số lần thử, trạng thái nộp), không tự suy diễn thêm webcam/lockdown browser vì tài liệu gốc ghi "cần xác nhận thêm".
6. **KHÔNG tự code UI/Design System từ đầu — bắt buộc tìm template có sẵn trước.** Toàn bộ giao diện Giảng viên (dashboard, bảng quản lý ca, bảng giám sát, form tạo ca...) phải dựa trên một **admin dashboard template/UI kit có sẵn**, tương thích với stack đang dùng (Next.js 16 + Tailwind v4 + shadcn/ui). Antigravity **không được tự vẽ font, tự đặt bảng màu, tự dựng layout sidebar/topbar/table từ số 0** như đã xảy ra với UI sinh viên hiện tại (UI đó cũng do tự code, không dựa template, và sẽ được làm lại sau). Chi tiết ở Mục 3.5 bên dưới.

---

### 3.5. Chiến lược Template/UI Kit (bắt buộc đọc trước khi code bất kỳ trang giảng viên nào)

> **Bối cảnh quan trọng:** UI sinh viên hiện tại (Frontend V2, 57 component shadcn/ui) là do Antigravity **tự code từ đầu ở các phiên trước, không dựa trên một template có sẵn nào**. Vinx dự kiến sẽ **làm lại (redesign) UI sinh viên này trong tương lai**. Vì vậy, nguyên tắc ở đây **không phải "khớp 100% với giao diện cũ"**, mà là: từ Giai đoạn 7 trở đi, **đặt nền móng đúng ngay từ đầu bằng một template có sẵn**, để khi làm lại UI sinh viên sau này, cả hai phần (sinh viên + giảng viên) có thể **hợp nhất về chung một template/design system**, tránh việc lặp lại sai lầm "tự code từ số 0" một lần nữa.

Trước khi viết bất kỳ trang giao diện nào cho Giai đoạn 7/8, Antigravity phải làm theo đúng thứ tự sau:

1. **Chọn 1 admin dashboard template mã nguồn mở dựa trên shadcn/ui + Next.js** làm nền cho toàn bộ phần giảng viên (ví dụ hệ sinh thái shadcn/ui chính thức có mục "Blocks/Examples", hoặc các template cộng đồng phổ biến dạng `shadcn-admin`, `next-shadcn-dashboard-starter`). Đây là điểm khởi đầu, **không cần cố ép khớp màu sắc/spacing với UI sinh viên cũ** vì UI đó cũng sẽ bị thay thế sau.
2. **Cài đặt template đó như một layout/module riêng** cho khu vực giảng viên (ví dụ route group `/instructor` hoặc app riêng trong monorepo), dùng chung các component shadcn/ui gốc (Button, Table, Dialog...) đã cài trong `frontend/` để không tăng gấp đôi dependency — nhưng **không bắt buộc tái sử dụng các component đã bị tùy biến thủ công riêng cho UI sinh viên cũ**.
3. **Không tự chọn font tùy hứng.** Dùng font mà template đã chọn sẵn (thường là Inter/Geist — chuẩn hệ sinh thái shadcn), trừ khi Vinx có yêu cầu cụ thể khác.
4. **Với các màn hình đặc thù của SECLAB** (bảng giám sát ca thi real-time, bảng xếp hạng đóng băng, giao diện chấm thủ công) — ưu tiên tìm layout gần nhất trong template đã chọn (ví dụ block "Data table + filters" hoặc "Analytics dashboard") rồi tùy biến nội dung, thay vì thiết kế UI mới hoàn toàn.
5. Ghi rõ trong walkthrough của từng phiên: **tên/nguồn template đã dùng làm nền** và những gì đã tùy biến, để Vinx review được nguồn gốc UI.
6. **Ghi chú cho tương lai:** khi Vinx quyết định làm lại UI sinh viên, nên cân nhắc dùng lại cùng template đã chọn ở Giai đoạn 7 để toàn hệ thống có 1 design system thống nhất, thay vì có 2 phong cách UI khác nhau giữa sinh viên và giảng viên.

> Lý do: giao diện giảng viên sẽ phức tạp hơn nhiều trang sinh viên hiện tại (nhiều bảng dữ liệu, filter, form dài). Nếu để AI tự thiết kế từ đầu — như đã xảy ra với UI sinh viên — rủi ro cao là ra một bộ UI rời rạc, không nhất quán, tốn nhiều phiên chỉ để chỉnh thẩm mỹ thay vì tập trung logic nghiệp vụ.

---

## 3. Kiến trúc dữ liệu đề xuất (Data Model Delta)

Mở rộng trên schema SQLite hiện có (`lab_platform.db`):

```sql
-- === TRỤC VAI TRÒ ===
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('student','instructor','admin')),
  student_code TEXT,           -- mã sinh viên, null nếu là giảng viên
  email TEXT,
  created_at TEXT NOT NULL
);

-- === TRỤC HỌC VỤ MỞ RỘNG ===
CREATE TABLE semesters (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, start_date TEXT, end_date TEXT
);
CREATE TABLE classes (
  id TEXT PRIMARY KEY, name TEXT NOT NULL,
  subject_id TEXT NOT NULL REFERENCES subjects(id),
  semester_id TEXT NOT NULL REFERENCES semesters(id)
);
CREATE TABLE class_members (
  class_id TEXT REFERENCES classes(id),
  user_id TEXT REFERENCES users(id),
  role_in_class TEXT CHECK(role_in_class IN ('student','instructor')),
  PRIMARY KEY (class_id, user_id)
);

-- === TRỤC CA THỰC HÀNH (Session) — lõi mới, tương đương "ca" trong SECLAB ===
CREATE TABLE practice_sessions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  banner_url TEXT,
  location TEXT,
  class_id TEXT NOT NULL REFERENCES classes(id),
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('draft','scheduled','active','frozen','ended')),
  allow_browser BOOLEAN DEFAULT 0,
  freeze_before_end_minutes INTEGER DEFAULT 0,
  penalty_minutes_per_wrong_submit INTEGER DEFAULT 0,
  submission_mode TEXT CHECK(submission_mode IN ('auto','manual')),
  created_by TEXT REFERENCES users(id)
);
CREATE TABLE session_labs (       -- gán bài tập vào ca
  session_id TEXT REFERENCES practice_sessions(id),
  lab_id TEXT REFERENCES labs(id),
  PRIMARY KEY (session_id, lab_id)
);
CREATE TABLE session_participants ( -- sinh viên + phòng thi + đề số
  session_id TEXT REFERENCES practice_sessions(id),
  user_id TEXT REFERENCES users(id),
  exam_room TEXT,
  seat_ip TEXT,
  hostname TEXT,
  variant_code TEXT,             -- "đề số"
  status TEXT DEFAULT 'not_submitted',
  PRIMARY KEY (session_id, user_id)
);
CREATE TABLE session_instructors (  -- phân công coi thi/phụ trách
  session_id TEXT REFERENCES practice_sessions(id),
  user_id TEXT REFERENCES users(id),
  duty TEXT CHECK(duty IN ('owner','proctor')),
  PRIMARY KEY (session_id, user_id)
);

-- === MỞ RỘNG BẢNG submissions HIỆN CÓ ===
ALTER TABLE submissions ADD COLUMN session_id TEXT REFERENCES practice_sessions(id);
ALTER TABLE submissions ADD COLUMN user_id TEXT REFERENCES users(id);
ALTER TABLE submissions ADD COLUMN result_code TEXT
  CHECK(result_code IN ('AC','WA','WF','WFN','CPY'));
ALTER TABLE submissions ADD COLUMN graded_by TEXT REFERENCES users(id); -- null nếu auto-grade
ALTER TABLE submissions ADD COLUMN client_ip TEXT;
ALTER TABLE submissions ADD COLUMN hostname TEXT;

-- === CHỐNG GIAN LẬN ===
CREATE TABLE plagiarism_flags (
  id TEXT PRIMARY KEY,
  submission_id TEXT REFERENCES submissions(id),
  compared_with_submission_id TEXT REFERENCES submissions(id),
  similarity_score REAL,
  status TEXT CHECK(status IN ('pending','confirmed','rejected')),
  reviewed_by TEXT REFERENCES users(id)
);
```

> **Lưu ý:** Đây là bản đề xuất mức schema logic. Antigravity cần review kỹ tương thích với `AcademyRegistry.ts` hiện tại trước khi migrate, và viết migration script chạy được nhiều lần an toàn (idempotent).

---

## 4. Roadmap theo Phase (bổ sung Giai đoạn 6, 7, 8 vào backlog `PROJECT_FLOW.md`)

### 🔐 Giai đoạn 6 — Auth Layer & Phân quyền (NỀN MÓNG — làm trước tiên)
- [x] Thiết kế bảng `users` + JWT/session-based auth (Express middleware).
- [x] API: `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`.
- [x] Middleware `requireRole(['instructor','admin'])` bảo vệ các route quản trị.
- [x] Frontend: trang Login, lưu token, route guard theo role (redirect sinh viên khỏi trang giảng viên và ngược lại).
- [x] (Tùy chọn, theo SECLAB có nêu) Nghiên cứu khả năng đăng nhập SSO Office 365 — đánh dấu "cần xác nhận thêm" cho đến khi có yêu cầu cụ thể.
- [x] Migration: gắn `user_id` vào `submissions` hiện có (dữ liệu cũ có thể gán `user_id = null` hoặc user demo).
- [x] Viết tài liệu `Document/02_Architecture_Design/AUTH_RBAC_SPEC.md`.

### 🏫 Giai đoạn 7 — Học vụ mở rộng & Quản lý Ca thực hành (Core nghiệp vụ giảng viên)
- [x] **[BẮT BUỘC LÀM TRƯỚC TIÊN]** Khảo sát và chọn 1 admin dashboard template/UI kit có sẵn tương thích Next.js 16 + shadcn/ui (xem Mục 3.5), báo lại cho Vinx tên template + demo/preview trước khi bắt đầu code trang giảng viên đầu tiên.
- [x] Bảng `semesters`, `classes`, `class_members` + API CRUD.
- [x] Bảng `practice_sessions`, `session_labs`, `session_participants`, `session_instructors`.
- [x] Trang **"Quản lý Ca thực hành"** (giảng viên): danh sách ca (tên, môn, lớp, thời gian, trạng thái), CRUD, export.
- [x] Trang **"Tạo/Sửa Ca thực hành"**: form đầy đủ theo SECLAB — tên, banner, địa điểm, thời gian, học kỳ/lớp/tổ, cho phép trình duyệt, thời gian đóng băng, phạt nộp sai, kiểu chấm (auto/manual).
- [x] Chức năng **Import danh sách sinh viên** (CSV/Excel) vào `session_participants`.
- [x] Chức năng **Gán bài tập cho ca** (nhập mã bài, gán nhanh từ ngân hàng bài).
- [x] Chức năng **Phân công giảng viên** (owner/proctor) vào ca.
- [x] Sinh viên: trang "Ca thực hành của tôi" thay vì duyệt tự do toàn bộ Lab Bank khi đang trong 1 ca active.
- [x] Viết `Document/02_Architecture_Design/SESSION_MANAGEMENT_SPEC.md`.

### 🛡️ Giai đoạn 8 — Giám sát, Chấm thủ công & Chống gian lận (Hoàn thành)
- [x] Mở rộng `submissions` với `result_code` (AC/WA/WF/WFN/CPY), `client_ip`, `hostname`, `graded_by`.
- [x] Trang giảng viên **"Trạng thái giải bài" (Online Judge view)**: theo dõi từng lượt nộp theo thời gian/tài khoản/bài, lọc theo trạng thái.
- [x] Trang giảng viên **"Giám sát Ca đang diễn ra"**: bảng sinh viên với IP, tên máy, phòng thi, đề số, số bài đúng, số lần thử; nút "Dừng thi toàn bộ".
- [x] Chức năng **Chấm thủ công**: hàng chờ bài nộp `submission_mode='manual'`, giao diện nhập điểm/nhận xét, lưu `graded_by`.
- [x] **Phát hiện sao chép cơ bản**: so khớp độ tương đồng văn bản/mã nguồn giữa các bài nộp cùng lab trong cùng ca (bắt đầu bằng thuật toán đơn giản như normalized diff/hash-based similarity, ghi vào `plagiarism_flags`), giảng viên xác nhận/bác bỏ → set `result_code='CPY'`.
- [x] Trang **Bảng xếp hạng nâng cao**: top 1/2/3 + bảng đầy đủ, lọc theo môn/lớp, cấu hình bật/tắt + đóng băng theo `freeze_before_end_minutes`.
- [x] **Xuất dữ liệu**: export CSV/Excel cho danh sách sinh viên, kết quả, lịch sử nộp, thống kê ca.
- [x] Viết `Document/02_Architecture_Design/GRADING_ANTICHEAT_SPEC.md`.

### 📋 Giai đoạn 9 (Hoàn thành)
- [x] Ngân hàng câu hỏi trắc nghiệm (MCQ) độc lập với Lab code.
- [x] Workflow phê duyệt bài tập (người gửi → duyệt/từ chối, có thể tái dùng bảng `plagiarism_flags`-style làm mẫu cho một bảng `approval_requests`).
- [x] Thông báo real-time (Socket.IO) khi có bài bị flag CPY hoặc ca sắp đóng băng.
- [x] Quản trị viên: trang cấu hình toàn hệ thống (nếu có nhu cầu multi-tenant/multi-khoa thực).

---

## 5. Rủi ro & Điểm cần Vinx xác nhận trước khi Antigravity code

| # | Vấn đề | Vì sao quan trọng |
|---|---|---|
| 1 | SQLite có đáp ứng được nhiều giảng viên/sinh viên ghi đồng thời trong 1 ca thi không, hay cần chuyển MySQL ngay ở Giai đoạn 7? | `better-sqlite3` là single-writer; nếu số lượng sinh viên nộp bài đồng thời lớn (thi thật), có thể nghẽn ghi. Cần quyết định trước khi build Session module để tránh phải viết lại tầng data access. |
| 2 | Thuật toán phát hiện sao chép ở mức nào là đủ (giai đoạn 8)? | Tài liệu SECLAB không công khai thuật toán — cần Vinx chốt mức độ (đơn giản: so khớp hash/diff theo % dòng giống nhau, hay phức tạp hơn: AST-based). |
| 3 | Đăng nhập SSO Office 365 có bắt buộc cho bản demo không? | Ảnh hưởng đến việc có cần tích hợp OAuth2 ngay ở Giai đoạn 6 hay để sau. |
| 4 | Có cần "Phòng thi" là một entity vật lý (địa điểm + máy) hay chỉ là field text gán cho sinh viên? | Ảnh hưởng độ phức tạp schema (SECLAB ghi "cần xác nhận thêm" — nên bắt đầu đơn giản bằng field `exam_room TEXT`, không tạo bảng riêng cho đến khi có yêu cầu cụ thể). |
| 5 | Trạng thái WF/WFN có áp dụng được cho các Lab hiện tại (Python/Java/C++ auto-grade) hay chỉ dành cho lab dạng nộp file (Labtainer ZIP)? | Cần map rõ: `WF/WFN` chủ yếu liên quan luồng "Nộp Labtainer ZIP" (Phiên 14), còn luồng Run/Submit code hiện tại chỉ có AC/WA tự nhiên. |

---

## 6. Đề xuất thứ tự thực thi cho Antigravity

```
Giai đoạn 6 (Auth & RBAC)
      ↓  bắt buộc xong trước
Giai đoạn 7 (Học vụ mở rộng + Session Management)
      ↓
Giai đoạn 8 (Giám sát + Chấm thủ công + Chống gian lận)
      ↓ (tùy chọn, không bắt buộc cho bản demo đầu tiên)
Giai đoạn 9 (MCQ, phê duyệt, thông báo real-time)
```

Mỗi Giai đoạn nên kết thúc bằng: build thành công (Turbopack/Turborepo không lỗi) + viết walkthrough + cập nhật `PROJECT_FLOW.md`, đúng quy trình đã áp dụng suốt 18 phiên trước — **không gộp nhiều giai đoạn vào 1 phiên** để dễ rollback nếu có vấn đề với Auth Layer (thành phần rủi ro cao nhất vì đụng đến toàn bộ route hiện có).

---

## 7. Việc cần làm ngay (bước đầu tiên gợi ý cho phiên tiếp theo)

1. Antigravity đọc kỹ `AcademyRegistry.ts` và `types.ts` hiện tại để xác định cách mở rộng ít phá vỡ nhất.
2. Xác nhận với Vinx 4 câu hỏi ở Mục 5 (đặc biệt câu #1 về SQLite vs MySQL) trước khi tạo migration.
3. Bắt đầu **Giai đoạn 6** — chỉ Auth Layer, không đụng vào Session module cho đến khi Auth chạy ổn định và có ít nhất 1 tài khoản instructor + 1 tài khoản student test được phân quyền đúng.
