# Cloud Lab UI Upgrade Spec — My Labs / Student Lab Experience

> **Purpose**: Give this document to Vercel AI / v0 / Cursor / Antigravity / any coding agent to upgrade the current Cloud Lab frontend UI.
>
> **Target screen from current implementation**: `Bài lab của tôi` / My Labs page.
>
> **Product direction**: Cloud Lab must feel like a commercial **multi-environment academic lab platform**, not a simple assignment list, admin dashboard, or HackerRank clone.

---

## 1. Product Context

Cloud Lab is a browser-based academic lab platform for students to complete different types of labs:

- Programming labs
- Algorithm labs
- CLI / Linux tool labs
- Cryptography labs
- Database labs
- Web labs
- Cybersecurity / network labs
- Future multi-node lab environments

The product model is:

```text
Faculty → Subject → Lab → Execution Profile → Adaptive Workspace → Run/Test/Submit → Attempt Result → Feedback
```

The current UI already has:

- Dark SaaS visual style
- Vietnamese-first UI direction
- Sidebar navigation
- Breadcrumb
- `Bài lab của tôi` page
- Status tabs
- Faculty / Subject filters
- Search
- Lab cards
- CTA button `Bắt đầu`

The current UI is acceptable as a basic list page, but it does **not yet fully communicate Cloud Lab as a multi-environment commercial lab platform**.

---

## 2. Main UX Problem

The current `Bài lab của tôi` screen looks clean, but still feels like a simple list of assigned labs.

It needs to better communicate:

1. Which lab should the student continue now?
2. What type of environment does each lab use?
3. Is the lab code-based, terminal-based, database-based, web-based, or security-based?
4. How many attempts has the student made?
5. What is the best/latest score?
6. What should the student do next?
7. Is a lab urgent, overdue, failed, completed, or needing revision?

The page should not just be:

```text
Lab title + Subject + Due date + Start button
```

It should become:

```text
Student learning state + Environment + Progress + Attempt state + Next action
```

---

## 3. UX Goal

Upgrade the `Bài lab của tôi` page from:

```text
A clean list of assigned labs
```

to:

```text
A commercial student lab workspace entry point for a multi-environment Cloud Lab platform
```

The page must answer:

```text
What lab should I work on next?
What environment will this lab open?
What is my current status?
What should I do next?
```

---

## 4. Navigation Changes

### 4.1 Remove standalone student access to Code Editor and Terminal

Current sidebar contains:

```text
LUYỆN TẬP
- Viết code
- Terminal
```

This is not ideal for the student-facing product.

The editor and terminal should not be first-class student navigation items because they are not standalone experiences. They should be opened **inside a Lab Workspace** based on the lab's `Execution Profile`.

For example:

```text
Algorithm lab      → Monaco Editor
CLI lab            → Web Terminal
Database lab       → SQL Workspace
Web lab            → Code + Preview
Security lab       → Terminal / Topology Workspace
```

### Required change

Remove or hide these from the main student sidebar:

```text
- Viết code
- Terminal
```

If they must remain for development/testing, move them into a secondary/dev-only group:

```text
Công cụ thử nghiệm
- Trình soạn code
- Terminal thử nghiệm
```

Do not show this group by default for normal students.

---

### 4.2 Add Curriculum / Courses navigation

Because the platform is curriculum-centric, add a navigation item:

```text
Môn học
```

Recommended student sidebar:

```text
Trang chủ
Môn học
Bài lab của tôi
Lịch sử làm bài
Phản hồi
Cài đặt
```

If keeping support:

```text
Hỗ trợ
- Trung tâm hỗ trợ
```

---

## 5. Page Header Improvements

Current title:

```text
Bài lab của tôi
9 bài lab được giao
```

This is good. Keep it.

Add a clearer subtitle:

```text
Theo dõi tiến độ, bắt đầu bài mới hoặc tiếp tục các lab đang làm.
```

Final header should be:

```text
Bài lab của tôi
Theo dõi tiến độ, bắt đầu bài mới hoặc tiếp tục các lab đang làm.
```

Optionally keep the assignment count:

```text
9 bài lab được giao
```

---

## 6. Add "Tiếp tục làm lab" Section

At the top of the page, before the tab list, add a primary section for the most relevant active lab.

### Display this section when:

- There is at least one lab with status `in_progress`
- Or one lab with status `needs_attention`
- Or one lab was recently edited / recently attempted

### Priority order

Choose the lab to show using this priority:

```text
needs_attention > in_progress > overdue > recently_submitted > latest_activity
```

### Section title

```text
Tiếp tục làm lab
```

### Example card

```text
Tiếp tục làm lab

Task 2 — HMAC via OpenSSL CLI
Cơ sở mật mã học · Ubuntu CLI
Tiến độ: 45%
Lưu lần cuối: 2 giờ trước
Hạn nộp: 24/05/2026, 23:59 · Còn 3 ngày

[Tiếp tục làm lab]
```

### Empty fallback

If no active lab exists:

```text
Bạn chưa có bài lab đang làm
Hãy chọn một bài lab bên dưới để bắt đầu.
```

---

## 7. Status Tabs

Current tabs are mostly correct but need consistency and counts.

### Required tab labels

Use these exact Vietnamese labels:

```text
Tất cả
Chưa bắt đầu
Đang làm
Đã nộp
Cần chú ý
Hoàn thành
Quá hạn
```

### Do not mix labels

Do not use both:

```text
Chưa làm
Chưa bắt đầu
```

Use only:

```text
Chưa bắt đầu
```

### Every tab must show count

Example:

```text
Tất cả 9
Chưa bắt đầu 5
Đang làm 2
Đã nộp 1
Cần chú ý 1
Hoàn thành 0
Quá hạn 0
```

If count is `0`, visually mute the tab but keep it visible.

---

## 8. Filters and Search

Current filters exist but need better Vietnamese labeling and better width.

### Required filters

```text
Khoa
Môn học
Loại môi trường
Tìm kiếm bài lab
```

### UI layout

Recommended desktop layout:

```text
[Tabs on the left]                        [Khoa] [Môn học] [Loại môi trường] [Tìm kiếm bài lab]
```

### Do not truncate important dropdown labels too aggressively

Current UI truncates values like:

```text
Faculty of Infor...
Cryptographic Fu...
```

This looks unfinished.

Use Vietnamese aliases where possible:

```text
Khoa An toàn thông tin
Cơ sở mật mã học
Cấu trúc dữ liệu & giải thuật
An toàn mạng
```

If the backend only returns English, create a temporary frontend display mapping.

---

## 9. Lab Card Upgrade

Current cards are too empty and do not communicate the multi-environment nature of Cloud Lab.

Each lab card must show:

1. Status badge
2. Subject/module
3. Lab title
4. Environment badge
5. Toolset badges
6. Due date / remaining time
7. Estimated time
8. Attempts count
9. Best score or latest score if available
10. Primary CTA based on status

---

### 9.1 Required card layout

```text
┌─────────────────────────────────────────────────────────────┐
│ [Chưa bắt đầu]  Cryptographic Fundamentals                  │
│                                                             │
│ Task 2 — HMAC via OpenSSL CLI                               │
│                                                             │
│ [Ubuntu CLI] [OpenSSL] [Bash] [Tự động chấm]                │
│                                                             │
│ Còn 3 ngày · Ước tính 30 phút · 0 lần nộp                  │
│                                                             │
│                                            [Bắt đầu lab]    │
└─────────────────────────────────────────────────────────────┘
```

### 9.2 In-progress card example

```text
┌─────────────────────────────────────────────────────────────┐
│ [Đang làm]  Cryptographic Fundamentals                      │
│                                                             │
│ Task 1 — Generate Hash                                      │
│                                                             │
│ Tiến độ: 45% · Lưu lần cuối: 2 giờ trước                    │
│ [Ubuntu CLI] [Bash] [OpenSSL]                               │
│                                                             │
│                                           [Tiếp tục làm lab] │
└─────────────────────────────────────────────────────────────┘
```

### 9.3 Needs-attention card example

```text
┌─────────────────────────────────────────────────────────────┐
│ [Cần chú ý]  Cryptographic Fundamentals                     │
│                                                             │
│ Task 3 — Avalanche Effect                                   │
│                                                             │
│ Điểm gần nhất: 60/100 · Sai 2 test case                     │
│ [Ubuntu CLI] [Bash] [Python 3]                              │
│                                                             │
│                                      [Sửa và nộp lại]       │
└─────────────────────────────────────────────────────────────┘
```

---

## 10. Environment Badges

Cloud Lab is a multi-environment platform. Every lab card must visibly show the lab environment.

### Required environment labels

Use friendly Vietnamese labels:

```text
Python Runtime
Node.js Runtime
Java Runtime
C++ Runtime
Ubuntu CLI
Postgres
Web Preview
Multi-node Network
Security Lab
```

For Vietnamese UI, display:

```text
Python Runtime
Node.js Runtime
Java Runtime
C++ Runtime
Ubuntu CLI
Postgres
Web Preview
Mạng nhiều node
Lab bảo mật
```

Do not over-translate common technical names like `Python`, `Node.js`, `Java`, `C++`, `Ubuntu CLI`, `Postgres`.

### Environment icon mapping

Use appropriate lucide icons or existing icon set:

```text
single_runtime     → Code / FileCode
single_machine     → Terminal
database           → Database
web                → Globe / Monitor
multi_node         → Network
security           → Shield
```

### Badge examples

```text
[Ubuntu CLI]
[OpenSSL]
[Bash]
[Tự động chấm]
```

```text
[Python Runtime]
[Testcase]
[Monaco Editor]
```

```text
[Mạng nhiều node]
[Terminal]
[Artifact grading]
```

---

## 11. CTA Rules

The primary CTA must change based on lab status.

| Status | Vietnamese CTA |
|---|---|
| `not_started` | Bắt đầu lab |
| `in_progress` | Tiếp tục làm lab |
| `submitted` | Xem kết quả |
| `needs_attention` | Sửa và nộp lại |
| `completed` | Xem lại |
| `overdue` | Xem chi tiết |

Do not use generic labels like:

```text
Bắt đầu
Chi tiết
Mở
```

Use action-specific labels.

---

## 12. Due Date / Urgency Rules

Display due date with urgency color.

### Rules

```text
Overdue       → red badge / red text: Quá hạn
≤ 1 day left  → red or strong warning: Còn 1 ngày
≤ 3 days left → amber/yellow: Còn 3 ngày
> 3 days      → muted text: Còn 5 ngày
No due date   → muted text: Không có hạn nộp
```

### Examples

```text
Còn 3 ngày
Còn 1 ngày
Quá hạn
Không có hạn nộp
```

---

## 13. Attempts and Score Display

Each lab card should include attempt state.

### For not started

```text
0 lần nộp
Điểm: —
```

### For submitted

```text
1 lần nộp
Điểm gần nhất: 85/100
```

### For completed

```text
Điểm tốt nhất: 100/100
2 lần nộp
```

### For needs attention

```text
Điểm gần nhất: 60/100
Sai 2 test case
```

---

## 14. Empty States

Every tab must have a useful empty state.

### `Đang làm`

```text
Bạn chưa có bài lab đang làm
Hãy bắt đầu một bài lab mới từ danh sách bên dưới.
```

### `Cần chú ý`

```text
Không có bài lab nào cần chú ý
Bạn đang theo kịp tiến độ học tập.
```

### `Hoàn thành`

```text
Bạn chưa hoàn thành bài lab nào
Hoàn thành một bài lab để xem kết quả tại đây.
```

### `Quá hạn`

```text
Không có bài lab quá hạn
Bạn đang theo đúng kế hoạch.
```

### Search empty

```text
Không tìm thấy bài lab phù hợp
Hãy thử thay đổi từ khóa hoặc bộ lọc.
```

---

## 15. Loading and Error States

Do not show blank areas.

### Loading

Show skeleton cards matching the final lab card shape.

### Error

Show inline error state:

```text
Không thể tải danh sách bài lab.
[Vui lòng thử lại]
```

### Offline

If applicable:

```text
Bạn đang mất kết nối. Một số tính năng có thể không hoạt động.
```

---

## 16. Responsive UX

### Desktop

- Sidebar visible
- Tabs and filters in one row
- Lab cards as full-width cards or 2-column cards if enough screen width

### Tablet

- Sidebar collapsed
- Filters can wrap to a second row
- Cards full-width

### Mobile

- Sidebar hidden behind hamburger or bottom navigation
- Filters inside a drawer
- Cards full-width
- CTA button full-width inside card

---

## 17. Vietnamese-first UI

The interface must be Vietnamese-first.

### Required Vietnamese labels

```text
Trang chủ
Môn học
Bài lab của tôi
Lịch sử làm bài
Phản hồi
Cài đặt
Tiếp tục làm lab
Bắt đầu lab
Chạy thử
Chạy kiểm thử
Nộp bài lab
Xem phản hồi
Sửa và nộp lại
Chưa bắt đầu
Đang làm
Đã nộp
Cần chú ý
Hoàn thành
Quá hạn
Môi trường
Bộ công cụ
Hồ sơ thực thi
Kết quả kiểm thử
Kết quả chạy
```

### Do not translate these technical terms

```text
Python
Node.js
Java
C++
OpenSSL
Bash
stdin
stdout
stderr
JSON
Monaco Editor
Xterm.js
Socket.IO
Docker
Postgres
```

---

## 18. Data Model Additions

If the backend does not provide these fields yet, create a frontend adapter or mock state aligned with future backend needs.

### Add or derive this UI model

```ts
type LabStatus =
  | 'not_started'
  | 'in_progress'
  | 'submitted'
  | 'needs_attention'
  | 'completed'
  | 'overdue'

type EnvironmentKind =
  | 'single_runtime'
  | 'single_machine'
  | 'database'
  | 'web'
  | 'multi_node'
  | 'security'

interface StudentLabState {
  labId: string
  status: LabStatus
  progress?: number
  dueDate?: string
  lastActivityAt?: string
  attemptsCount: number
  bestScore?: number
  latestScore?: number
  failedTestCount?: number
  canResubmit: boolean
}

interface LabDisplayModel {
  id: string
  title: string
  subjectId: string
  subjectTitle: string
  facultyTitle?: string
  profileId: string
  environmentType: EnvironmentKind
  environmentLabel: string
  toolset?: string[]
  estimatedTimeMinutes?: number
  studentState: StudentLabState
}
```

---

## 19. Important Classification Fix

The following type of lab should not be displayed as a normal `single_runtime` code lab:

```text
Dynamic Analysis of WinlockerVB6Blacksod
Tools: wine, tcpdump, strace, bash
```

It should be classified as:

```text
single_machine
```

or:

```text
multi_node
```

depending on whether there is a network topology / multiple nodes.

This matters because the UI must choose the correct workspace:

```text
single_runtime → Monaco Code Workspace
single_machine → Web Terminal Workspace
multi_node → Topology + Node Terminal Workspace
```

---

## 20. Visual Refinements

Keep the current dark SaaS style, but improve commercial polish:

1. Better spacing inside cards
2. More metadata without clutter
3. Clearer CTA hierarchy
4. Consistent badge sizing
5. Consistent Vietnamese status wording
6. Wider dropdowns or better truncation
7. Better hover state on cards
8. Subtle border highlight for urgent/needs-attention cards
9. Avoid overly empty card bodies
10. Keep colors professional and not too saturated

---

## 21. Accessibility Requirements

- All buttons must have accessible labels.
- Icon-only buttons must have `aria-label`.
- Status should not rely on color only.
- Keyboard navigation must work for tabs, filters, search, cards, and CTA buttons.
- Focus states must be visible.
- Contrast ratio must remain readable in dark mode.

---

## 22. Acceptance Criteria

The upgrade is complete only when all of the following are true:

### Navigation

- [ ] Student sidebar no longer exposes standalone `Viết code` and `Terminal` as primary navigation.
- [ ] `Môn học` or equivalent curriculum route exists in the sidebar.
- [ ] `Lịch sử nộp bài` is renamed or repositioned as a learning-oriented history, e.g. `Lịch sử làm bài`.

### Page Header

- [ ] Page title remains `Bài lab của tôi`.
- [ ] A helpful subtitle explains the page purpose.

### Continue Section

- [ ] `Tiếp tục làm lab` section appears when there is an active lab.
- [ ] It shows lab title, subject, environment, progress, last activity, due date, and CTA.

### Tabs

- [ ] Tabs use consistent labels.
- [ ] Every tab has a count.
- [ ] Empty states exist for every tab.

### Filters

- [ ] Filters are labeled in Vietnamese.
- [ ] Dropdown values are not awkwardly truncated.
- [ ] Faculty and subject values are displayed in Vietnamese when available.

### Lab Cards

- [ ] Each card shows status, subject, title, environment, toolset, due date, estimated time, attempts, score, and CTA.
- [ ] Environment badges are visible.
- [ ] CTA changes based on status.
- [ ] Due date urgency colors are correct.

### Localization

- [ ] No student-facing English UI remains unless it is technical terminology.
- [ ] Technical terms are not incorrectly translated.

### Responsive

- [ ] Desktop, tablet, and mobile layouts are usable.
- [ ] Filters collapse properly on mobile.

### Quality

- [ ] Loading skeletons exist.
- [ ] Error states exist.
- [ ] Empty states exist.
- [ ] No blank state appears.
- [ ] UI still feels premium, dark, SaaS, and developer-oriented.

---

## 23. Implementation Priority

Implement in this order:

1. Sidebar cleanup and navigation labels
2. Vietnamese label consistency
3. Status tabs and counts
4. Lab card upgrade
5. Environment badges
6. CTA rules
7. Continue current lab section
8. Empty/loading/error states
9. Responsive refinement
10. Data adapter/model cleanup

---

## 24. Final Output Expected From AI

After implementation, report:

1. Files modified
2. Components created/refactored
3. New data models/adapters added
4. Translation keys added or changed
5. Remaining hardcoded text, if any
6. Any backend data gaps
7. Any assumptions made
8. Screenshots or visual confirmation if available

---

## 25. Short Command Version

Use this if the AI needs a concise instruction:

```text
Upgrade the current "Bài lab của tôi" page into a commercial multi-environment Cloud Lab student experience. Add a Continue Lab section, consistent Vietnamese status tabs with counts, richer lab cards with environment/toolset/attempt/score/due-date metadata, adaptive CTAs by lab status, Vietnamese filters, empty/loading/error states, and remove standalone Code Editor/Terminal from primary student navigation. The UI must communicate that Cloud Lab is a curriculum-based, execution-profile-driven, multi-environment online lab platform.
```
