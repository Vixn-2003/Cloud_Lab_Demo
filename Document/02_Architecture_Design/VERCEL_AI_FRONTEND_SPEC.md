# 🏢 Enterprise Frontend Specification — Cloud Lab Platform

> **Document Type**: Vercel AI / v0.dev Generation Prompt  
> **Product Name**: Cloud Lab — Multi-Environment Academic Lab Platform  
> **Version**: 2.0 (Enterprise Rebuild)  
> **Tech Stack**: Next.js 15 (App Router) + shadcn/ui + Tailwind CSS v4 + Socket.IO + Monaco Editor + Xterm.js

---

## SECTION 0 — PROJECT CONTEXT

### What is this product?
An **enterprise-grade online lab platform** for university students to:
- Write code directly in the browser (Monaco Editor)
- Run code and see output in real-time (WebSocket streaming)
- Submit code for auto-grading against test cases
- Use interactive Linux terminals (xterm.js) for cybersecurity/network labs
- Track submission history with scores

### Target Users
| Persona | Role | Primary Actions |
|---------|------|-----------------|
| Student | End user | Browse labs, write code, run, submit, view grades |
| Instructor | Content manager | (Future) Create labs, view student submissions |
| Admin | System admin | (Future) Manage users, faculties, system settings |

### Backend API (Already Built — DO NOT modify)
Base URL: `http://localhost:3001` (configurable via env `NEXT_PUBLIC_API_BASE`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/faculties` | List all faculties |
| `GET` | `/subjects?facultyId=X` | List subjects filtered by faculty |
| `GET` | `/labs?subjectId=X` | List lab summaries filtered by subject |
| `GET` | `/labs/:id` | Get full lab config (statement, testcases, profile) |
| `GET` | `/profiles/:id` | Get execution profile info |
| `POST` | `/run` | Run code — body: `{ code, profileId, stdin }` → returns `{ executionId }` |
| `POST` | `/submit` | Submit for grading — body: `{ code, profileId, labId }` → returns `{ executionId }` |
| `GET` | `/submissions` | List all submission records |
| `GET` | `/submissions/:id` | Get single submission detail |
| `POST` | `/terminal/init` | Initialize interactive terminal session → returns `{ sessionId }` |

### WebSocket Events (Socket.IO at same base URL)
| Direction | Event | Payload |
|-----------|-------|---------|
| Client → Server | `subscribe` | `executionId: string` |
| Server → Client | `execution:log` | `{ executionId, stream: 'stdout'/'stderr', data: string }` |
| Server → Client | `execution:status` | `{ executionId, status, payload? }` |
| Client → Server | `terminal:start` | `{ sessionId }` |
| Client → Server | `terminal:input` | `{ sessionId, data }` |
| Client → Server | `terminal:resize` | `{ sessionId, cols, rows }` |
| Server → Client | `terminal:output` | `{ sessionId, data }` |
| Server → Client | `terminal:exit` | `{ sessionId, exitCode }` |

---

## SECTION 1 — DESIGN SYSTEM

### Brand & Visual Identity
- **Product Name**: Cloud Lab
- **Tagline**: "Enterprise Lab Platform for Academic Excellence"
- **Logo**: Use a terminal/code icon with graduation cap accent
- **Design Language**: Premium dark-mode enterprise SaaS (inspired by Vercel Dashboard, Linear, GitHub)

### Color Palette
```
--color-bg-primary: #0a0a0f        /* Deep dark background */
--color-bg-secondary: #111118      /* Card/panel background */
--color-bg-tertiary: #1a1a24       /* Elevated surfaces */
--color-bg-hover: #22222e          /* Hover states */
--color-border: #2a2a3a            /* Subtle borders */
--color-border-active: #3b3b50     /* Active/focused borders */

--color-text-primary: #f0f0f5      /* Primary text */
--color-text-secondary: #8b8ba0    /* Secondary/muted text */
--color-text-tertiary: #5a5a70     /* Tertiary/disabled text */

--color-accent-blue: #3b82f6       /* Primary actions, links */
--color-accent-purple: #8b5cf6     /* Branding accent, scores */
--color-accent-green: #22c55e      /* Success, passed tests */
--color-accent-red: #ef4444        /* Error, failed tests */
--color-accent-amber: #f59e0b      /* Warning, pending */
--color-accent-cyan: #06b6d4       /* Info, terminal */

--color-gradient-primary: linear-gradient(135deg, #3b82f6, #8b5cf6)
--color-gradient-success: linear-gradient(135deg, #22c55e, #06b6d4)
```

### Typography
```
--font-sans: 'Inter', system-ui, -apple-system, sans-serif
--font-mono: 'JetBrains Mono', 'Fira Code', 'Monaco', monospace
--font-display: 'Cal Sans', 'Inter', sans-serif

/* Import from Google Fonts */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
```

### Spacing & Radius
```
--radius-sm: 6px
--radius-md: 8px
--radius-lg: 12px
--radius-xl: 16px

/* Consistent spacing scale: 4px base */
```

### Micro-animations
- Page transitions: `fade-in + slide-up` (200ms ease-out)
- Tab switching: `crossfade` (150ms)
- Button hover: `scale(1.02)` + `brightness(1.1)` (100ms)
- Card hover: `translateY(-2px)` + `shadow-lg` (200ms)
- Score reveal: `count-up animation` from 0 to final score (800ms)
- Terminal cursor: `blink` animation (600ms)
- Loading states: `pulse` skeleton animation
- Toast notifications: `slide-in from right` (300ms)

---

## SECTION 2 — INFORMATION ARCHITECTURE & NAVIGATION

### Sidebar Navigation (Persistent, Collapsible)

```
┌─────────────────────────────────┐
│  ☁️ Cloud Lab                    │  ← Logo + product name
│                                  │
│  ─────────────────────────────  │
│                                  │
│  📊  Dashboard                   │  ← /dashboard
│                                  │
│  ─── LEARNING ───────────────── │
│                                  │
│  🔬  Labs                        │  ← /labs (browse & filter)
│  📝  My Submissions             │  ← /submissions
│                                  │
│  ─── PRACTICE ───────────────── │
│                                  │
│  💻  Code Editor                 │  ← /workspace (standalone IDE)
│  🖥️  Terminal                    │  ← /terminal (standalone terminal)
│                                  │
│  ─── SYSTEM ─────────────────── │
│                                  │
│  ⚙️  Settings                    │  ← /settings
│                                  │
│  ─────────────────────────────  │
│                                  │
│  👤  Student Name                │  ← User info (future auth)
│  v2.0.0                         │  ← Version badge
└─────────────────────────────────┘
```

### Route Structure (Next.js App Router)
```
app/
├── layout.tsx                     ← Root layout with sidebar
├── page.tsx                       ← Redirect to /dashboard
├── dashboard/
│   └── page.tsx                   ← Dashboard with KPIs
├── labs/
│   ├── page.tsx                   ← Lab browser (search + filter + grid)
│   └── [labId]/
│       └── page.tsx               ← Lab workspace (IDE + terminal + grading)
├── submissions/
│   ├── page.tsx                   ← Submission history list
│   └── [submissionId]/
│       └── page.tsx               ← Submission detail + results
├── workspace/
│   └── page.tsx                   ← Standalone code editor (no lab context)
├── terminal/
│   └── page.tsx                   ← Standalone interactive terminal
└── settings/
    └── page.tsx                   ← User preferences
```

### Breadcrumb Pattern
Every page must show breadcrumbs:
```
Dashboard > Labs > Cryptographic Fundamentals > Task 1 — Generate Hash
```

---

## SECTION 3 — SCREEN SPECIFICATIONS

### 3.1 Dashboard (`/dashboard`)

**Purpose**: Bird's-eye view of student's learning progress and quick access to recent labs.

**Layout**: Full-width, grid-based.

**Components**:

```
┌──────────────────────────────────────────────────────────────────┐
│  Good evening, Student 👋                                        │
│  Your learning progress at a glance                              │
│                                                                   │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌────────────┐│
│  │ Total Labs  │ │  Completed  │ │ Avg Score   │ │ Submissions││
│  │     9       │ │     3       │ │   78/100    │ │     12     ││
│  │ ↗ Browse    │ │ ↗ View All  │ │ ↗ Details   │ │ ↗ History  ││
│  └─────────────┘ └─────────────┘ └─────────────┘ └────────────┘│
│                                                                   │
│  ┌──────────────────────────────┐ ┌─────────────────────────────┐│
│  │  📊 Recent Submissions       │ │  🔬 Continue Learning       ││
│  │                              │ │                             ││
│  │  #1 Generate Hash   85/100  │ │  Faculty: Info Security     ││
│  │  #2 HMAC OpenSSL    100/100 │ │  Subject: Crypto Fund.      ││
│  │  #3 Avalanche       70/100  │ │  → Task 4: Brute-force      ││
│  │                              │ │                             ││
│  │  [View All Submissions →]   │ │  [Continue →]               ││
│  └──────────────────────────────┘ └─────────────────────────────┘│
│                                                                   │
│  ┌──────────────────────────────────────────────────────────────┐│
│  │  📚 Labs by Faculty                                          ││
│  │                                                              ││
│  │  ┌──────────────────────┐  ┌──────────────────────┐         ││
│  │  │ 🛡️ Information Sec.  │  │ 💻 Software Eng.     │         ││
│  │  │ 7 labs • 4 subjects  │  │ 2 labs • 1 subject   │         ││
│  │  │ [Explore →]          │  │ [Explore →]          │         ││
│  │  └──────────────────────┘  └──────────────────────┘         ││
│  └──────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────┘
```

**KPI Cards**: Must be clickable. "Total Labs: 9" → navigates to `/labs`. "Completed: 3" → navigates to `/submissions?status=finished`. These are NOT decorative.

**Recent Submissions Table**:
- Columns: Lab Title, Score (with color-coded badge), Date, Status
- Row click → navigate to `/submissions/:id`
- "View All" → navigate to `/submissions`

**Continue Learning Card**: Show the last lab the student interacted with. Button navigates to `/labs/:lastLabId`.

**Faculty Cards**: Each card shows faculty name, lab count, subject count. Click → `/labs?facultyId=X`.

---

### 3.2 Lab Browser (`/labs`)

**Purpose**: Discover, search, and filter available labs.

**Layout**: Filter sidebar + main content grid.

```
┌────────────────────────────────────────────────────────────────────┐
│  🔬 Labs                                                [Search 🔍]│
│                                                                     │
│  ┌────────────┐  ┌────────────────────────────────────────────────┐│
│  │  FILTERS   │  │                                                ││
│  │            │  │  Showing 9 labs                    [Grid][List]││
│  │  Faculty   │  │                                                ││
│  │  ☑ Info Sec│  │  ┌──────────────┐ ┌──────────────┐ ┌────────┐ ││
│  │  ☑ Soft Eng│  │  │ 🔐 Task 1    │ │ 🔐 Task 2    │ │ 🔐 T3  │ ││
│  │            │  │  │ Generate Hash│ │ HMAC OpenSSL │ │ Avalan │ ││
│  │  Subject   │  │  │              │ │              │ │        │ ││
│  │  ☐ Algos   │  │  │ 🏷️ Crypto    │ │ 🏷️ Crypto    │ │ 🏷️ Cry │ ││
│  │  ☐ NetSec  │  │  │ 🛠️ openssl,  │ │ 🛠️ openssl   │ │ 🛠️ sha │ ││
│  │  ☑ Crypto  │  │  │    bash      │ │              │ │        │ ││
│  │            │  │  │ ⚡ Shell     │ │ ⚡ Shell     │ │ ⚡ She │ ││
│  │  Env Type  │  │  │              │ │              │ │        │ ││
│  │  ☑ Runtime │  │  │ Score: 85    │ │ Score: 100 ✓ │ │ —      │ ││
│  │  ☑ Machine │  │  │ [Start →]   │ │ [Review →]  │ │ [Go →] │ ││
│  │  ☐ MultiN. │  │  └──────────────┘ └──────────────┘ └────────┘ ││
│  │            │  │                                                ││
│  │  Language  │  │  ┌──────────────┐ ┌──────────────┐            ││
│  │  ☐ Python  │  │  │ 💻 Sum Two   │ │ 🛡️ Winlocker │            ││
│  │  ☐ Shell   │  │  │ Numbers      │ │ Analysis     │            ││
│  │  ☐ Node.js │  │  │ 🏷️ Algos     │ │ 🏷️ NetSec    │            ││
│  │  ☐ Java    │  │  │ ⚡ Python    │ │ ⚡ Shell+Wine│            ││
│  │  ☐ C++     │  │  └──────────────┘ └──────────────┘            ││
│  │            │  │                                                ││
│  │ [Reset All]│  │  ← 1 2 3 →                                    ││
│  └────────────┘  └────────────────────────────────────────────────┘│
└────────────────────────────────────────────────────────────────────┘
```

**URL State Preservation**:
```
/labs?facultyId=info_sec&subjectId=crypto_fundamentals&envType=single_machine&page=1&q=hash
```

**Lab Card Components**:
- Icon based on `environmentType` (💻 single_runtime, 🖥️ single_machine, 🌐 multi_node)
- Title
- Subject badge (colored tag)
- Toolset pills (openssl, bash, python3, etc.)
- Environment type badge
- Score indicator (if previously submitted) — green checkmark for 100, amber for partial, — for unsubmitted
- CTA button: "Start" (new) / "Continue" (in progress) / "Review" (completed)

**Empty State**: When no labs match filters, show illustration + "No labs found. Try adjusting your filters."

**Loading State**: Skeleton cards (3x3 grid) with pulse animation.

---

### 3.3 Lab Workspace (`/labs/[labId]`)

**Purpose**: The core experience — read problem, write code, run, submit, see results.

**Layout**: Resizable split panels (like VS Code).

```
┌────────────────────────────────────────────────────────────────────┐
│  Breadcrumb: Dashboard > Labs > Crypto Fundamentals > Generate Hash│
│                                                                     │
│  ┌─────────────────────────────┬───────────────────────────────────┐│
│  │                             │                                   ││
│  │  ┌─────────────────────┐   │  ┌───────────────────────────┐   ││
│  │  │ Description │ Result│   │  │ Main.sh      ▸ Play  ▸ Sub│   ││
│  │  └─────────────────────┘   │  └───────────────────────────┘   ││
│  │                             │                                   ││
│  │  ## Task 1 — Generate Hash │  ┌───────────────────────────┐   ││
│  │                             │  │                           │   ││
│  │  Sử dụng các công cụ CLI   │  │  #!/bin/bash              │   ││
│  │  để tạo hash cho message    │  │  read -r msg              │   ││
│  │  từ stdin:                  │  │  md5=$(printf "%s" "$msg" │   ││
│  │  - MD5                      │  │    | md5sum | awk '{...}')│   ││
│  │  - SHA1                     │  │  ...                      │   ││
│  │  - SHA256                   │  │                           │   ││
│  │                             │  │  Monaco Editor            │   ││
│  │  **Yêu cầu**: JSON output  │  │  (or WebTerminal for      │   ││
│  │                             │  │   single_machine labs)    │   ││
│  │  ───────────────────────    │  │                           │   ││
│  │                             │  └───────────────────────────┘   ││
│  │  🛠️ Toolset: openssl, bash  │                                   ││
│  │  ⚡ Profile: Security Shell │  ┌───────────────────────────┐   ││
│  │  ⏱️ Timeout: 5000ms         │  │ ▼ Console / Test Output   │   ││
│  │  📏 Max Output: 20KB       │  │                           │   ││
│  │                             │  │  $ Running...             │   ││
│  │  ┌──────────────────────┐  │  │  {"md5": "5eb63b...",     │   ││
│  │  │ Custom Stdin Input   │  │  │   "sha1": "2aae6c...",    │   ││
│  │  │ ┌──────────────────┐ │  │  │   "sha256": "b94d27..."}  │   ││
│  │  │ │ hello world      │ │  │  │                           │   ││
│  │  │ └──────────────────┘ │  │  │  ✓ Exit code: 0 (43ms)   │   ││
│  │  └──────────────────────┘  │  └───────────────────────────┘   ││
│  │                             │                                   ││
│  └─────────────────────────────┴───────────────────────────────────┘│
└────────────────────────────────────────────────────────────────────┘
```

**Left Panel Tabs**:
1. **Description** — Markdown-rendered problem statement with metadata badges (toolset, profile, timeout, max output)
2. **Result** — Grading result after submission

**Right Panel**:
1. **Header Bar**: Filename display (`Main.sh`, `Main.py`, etc. based on profile extension), Play button, Benchmark/Submit button, and for terminal labs: "Start Lab" button
2. **Editor Area**:
   - For `single_runtime` labs: Monaco Editor with syntax highlighting matching `profile.language`
   - For `single_machine` / `multi_node` labs: WebTerminal component (xterm.js)
3. **Bottom Console**: Collapsible panel showing real-time execution logs (stdout/stderr) streamed via WebSocket

**Result Tab Content** (after submission):

```
┌───────────────────────────────────────────────┐
│  SESSION PERFORMANCE                           │
│                                                │
│  ████████████████████░░░░  85/100              │
│  Progress bar with gradient                    │
│                                                │
│  Passed: 1 of 2 test cases                    │
│                                                │
│  ┌──────────────────────────────────────────┐ │
│  │ CASE #1                          PASSED ✓│ │
│  │                                          │ │
│  │ Input:    hello world                    │ │
│  │ Expected: {"md5": "5eb63b...", ...}      │ │
│  │ Output:   {"md5": "5eb63b...", ...}      │ │
│  └──────────────────────────────────────────┘ │
│                                                │
│  ┌──────────────────────────────────────────┐ │
│  │ CASE #2                          FAILED ✗│ │
│  │                                          │ │
│  │ Input:    test                            │ │
│  │ Expected: {"md5": "098f6b...", ...}      │ │
│  │ Output:   (empty)                        │ │
│  │ Stderr:   md5sum: command not found      │ │
│  └──────────────────────────────────────────┘ │
└───────────────────────────────────────────────┘
```

---

### 3.4 Submission History (`/submissions`)

**Purpose**: View all past submissions with filtering and sorting.

```
┌────────────────────────────────────────────────────────────────────┐
│  📝 My Submissions                                                  │
│                                                                     │
│  [Search by lab name... 🔍]   Status: [All ▾]   Sort: [Newest ▾]  │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────────┐│
│  │ # │ Lab Title              │ Language │ Score  │ Status  │ Date││
│  │───│────────────────────────│──────────│────────│─────────│─────││
│  │ 1 │ Generate Hash          │ Shell    │ 85/100 │ Graded  │ 5/21││
│  │ 2 │ HMAC via OpenSSL       │ Shell    │100/100 │ Graded  │ 5/20││
│  │ 3 │ Avalanche Effect       │ Shell    │ 70/100 │ Graded  │ 5/19││
│  │ 4 │ Sum Two Numbers        │ Python   │100/100 │ Graded  │ 5/18││
│  │ 5 │ Winlocker Analysis     │ Shell    │  0/100 │ Failed  │ 5/17││
│  └────────────────────────────────────────────────────────────────┘│
│                                                                     │
│  Showing 1-5 of 12 submissions          ← 1 2 3 →                 │
└────────────────────────────────────────────────────────────────────┘
```

**Features**:
- Search by lab title
- Filter by status (All, Graded, Failed, Pending)
- Filter by language
- Sort by date, score
- Pagination
- Row click → `/submissions/:id`
- Score badge: green (100), blue (>50), amber (>0), red (0)

**URL State**: `/submissions?q=hash&status=graded&sort=score_desc&page=2`

---

### 3.5 Submission Detail (`/submissions/[submissionId]`)

**Purpose**: Detailed view of a single submission.

**Content**:
- Header: Lab title, submission date, score badge
- Code panel: Read-only Monaco Editor showing submitted code
- Test results: Same layout as Lab Workspace Result tab
- Metadata: Execution time, exit code, profile used
- Action: "Re-submit" button → navigates to `/labs/:labId` with code pre-filled

---

### 3.6 Settings (`/settings`)

**Purpose**: User preferences.

**Sections**:
- **Editor**: Font size, tab size, theme (dark/light), key bindings (default/vim/emacs)
- **Terminal**: Font size, cursor style (block/line/underline), scrollback buffer
- **Notifications**: (Future) Email/push notification preferences
- **About**: System version, tech stack info, links to documentation

---

## SECTION 4 — SHARED COMPONENTS LIBRARY

### Must-build reusable components:

| Component | Description |
|-----------|-------------|
| `AppSidebar` | Collapsible sidebar with navigation items, active state, badges |
| `Breadcrumb` | Auto-generated from route path |
| `KpiCard` | Clickable metric card with icon, value, label, trend, link |
| `LabCard` | Card for lab browser grid with badges, score indicator |
| `CodeEditor` | Monaco Editor wrapper with language detection, theme |
| `WebTerminal` | Xterm.js wrapper with Socket.IO integration |
| `ConsoleOutput` | Real-time log viewer with WebSocket subscription |
| `TestCaseResult` | Individual test case display (pass/fail, diff view) |
| `ScoreDisplay` | Animated score with progress bar and color grading |
| `StatusBadge` | Colored badge for execution status (queued/running/finished/failed) |
| `FilterPanel` | Reusable filter sidebar with checkbox groups |
| `DataTable` | Sortable, filterable table with pagination |
| `EmptyState` | Illustrated empty state with message and CTA |
| `LoadingSkeleton` | Skeleton loader matching content layout |
| `ConfirmDialog` | Confirmation modal for destructive actions |
| `Toast` | Notification toast (success/error/info/warning) |
| `MarkdownRenderer` | Render lab statements with code highlighting |
| `ResizablePanels` | Draggable split panels (like VS Code) |
| `SearchInput` | Debounced search input with clear button |

---

## SECTION 5 — DATA TYPES (TypeScript)

```typescript
// === Domain Entities ===

interface Faculty {
  id: string;
  title: string;
}

interface Subject {
  id: string;
  title: string;
  facultyId: string;
}

interface LabSummary {
  id: string;
  title: string;
  subjectId: string;
  profileId: string;
}

interface Lab {
  id: string;
  title: string;
  statement: string;          // Markdown content
  profileId: string;
  environmentType: 'single_runtime' | 'single_machine' | 'multi_node';
  toolset?: string[];
}

interface ExecutionProfile {
  id: string;
  displayName: string;
  osFamily: string;
  language: string;
  version: string;
  timeoutMs: number;
  gradingStrategy: string;
  extension?: string;
}

interface SubmissionRecord {
  id: string;
  lab_id: string;
  profile_id: string;
  mode: 'run' | 'submit';
  code: string;
  language: string;
  status: string;
  score?: number;
  result_json?: string;
  created_at: string;
}

type ExecutionStatus = 'queued' | 'started' | 'streaming' | 'finished' | 'failed' | 'timeout';

// === UI State ===

interface ExecutionLog {
  stream: 'stdout' | 'stderr';
  data: string;
}

interface GradingResult {
  status: string;
  mode: string;
  score: number;
  passedTests: number;
  totalTests: number;
  testResults: TestCaseResult[];
}

interface TestCaseResult {
  index: number;
  input: string;
  expectedOutput: string;
  actualOutput: string;
  stderr?: string;
  passed: boolean;
}
```

---

## SECTION 6 — TECHNICAL REQUIREMENTS

### Framework & Libraries

| Requirement | Solution |
|-------------|----------|
| Framework | Next.js 15 (App Router, Server Components where appropriate) |
| UI Library | shadcn/ui (Radix primitives + Tailwind) |
| Styling | Tailwind CSS v4 |
| Code Editor | `@monaco-editor/react` |
| Terminal | `@xterm/xterm` + `@xterm/addon-fit` |
| HTTP Client | Native `fetch` or `axios` |
| WebSocket | `socket.io-client` |
| State | `zustand` for global state (theme, user prefs) |
| URL State | `nuqs` or `next/navigation` searchParams |
| Markdown | `react-markdown` + `remark-gfm` + `rehype-highlight` |
| Icons | `lucide-react` |
| Animations | `framer-motion` for page transitions, `tailwindcss-animate` for micro-interactions |
| Resizable Panels | `react-resizable-panels` |
| Toast | `sonner` |
| Tables | `@tanstack/react-table` |

### Performance Requirements
- First Contentful Paint < 1.5s
- Use React Suspense + skeleton loaders for async data
- Lazy-load Monaco Editor and Xterm.js (they are heavy)
- Debounce search input (300ms)
- Memoize filtered/sorted lab lists

### Accessibility (a11y)
- All interactive elements must be keyboard navigable
- ARIA labels on all icon-only buttons
- Focus management on modal/dialog open/close
- Color contrast ratio ≥ 4.5:1 for all text
- Screen reader friendly status announcements

### Responsive Behavior
| Breakpoint | Layout |
|------------|--------|
| ≥1280px | Sidebar + full split-panel workspace |
| 1024-1279px | Collapsed sidebar (icons only) + split panels |
| 768-1023px | Hidden sidebar (hamburger menu) + stacked panels |
| <768px | Mobile: bottom tab navigation + single panel |

---

## SECTION 7 — ENTERPRISE UX PATTERNS

### 7.1 Loading States
Every data-fetching component must show a skeleton loader that matches the layout of the actual content. Never show a blank screen or a single spinner.

### 7.2 Error States
- API errors: Show inline error banner with retry button
- Network offline: Show global banner at top "You are offline. Some features may not work."
- 404 pages: Custom illustrated page with "Go to Dashboard" CTA

### 7.3 Empty States
Each list/grid must handle zero-results gracefully:
- Labs: "No labs found. Try adjusting your filters." + illustration
- Submissions: "No submissions yet. Start by completing a lab!" + link to /labs
- Dashboard: "Welcome! Browse available labs to get started." + link to /labs

### 7.4 Confirmation Dialogs
Required for: Re-submitting code, clearing editor, navigating away from unsaved code.

### 7.5 Toast Notifications
- Code submitted successfully → green toast
- Execution failed → red toast with error summary
- Terminal session connected → info toast
- Terminal session disconnected → warning toast

### 7.6 Context Preservation
When user navigates from lab list to a lab workspace and back:
- Preserve scroll position
- Preserve filter/search state (via URL params)
- Preserve pagination state

### 7.7 Keyboard Shortcuts
| Shortcut | Action |
|----------|--------|
| `Ctrl+Enter` | Run code |
| `Ctrl+Shift+Enter` | Submit code |
| `Ctrl+S` | Save to localStorage (auto-save draft) |
| `Ctrl+K` | Command palette / search |
| `Escape` | Close modal/panel |

---

## SECTION 8 — FUNCTIONAL COVERAGE CHECKLIST

Before considering the frontend complete, verify ALL of the following:

- [ ] Dashboard with clickable KPI cards that drill-down to filtered views
- [ ] Lab browser with search, multi-filter, sort, pagination, grid/list toggle
- [ ] Lab workspace with resizable split panels
- [ ] Monaco Editor with correct language detection per profile
- [ ] WebTerminal for single_machine/multi_node labs
- [ ] Real-time execution log streaming via WebSocket
- [ ] Grading result display with individual test case details
- [ ] Custom stdin input for test runs
- [ ] Submission history with search, filter, sort, pagination
- [ ] Submission detail page with code review and results
- [ ] Breadcrumb navigation on every page
- [ ] Sidebar navigation with active state indicators
- [ ] URL-based state for all filterable/sortable pages
- [ ] Loading skeletons for all async data
- [ ] Error states with retry buttons
- [ ] Empty states with CTAs
- [ ] Confirmation dialogs for destructive actions
- [ ] Toast notifications for all user actions
- [ ] Keyboard shortcuts (Ctrl+Enter to run, etc.)
- [ ] Responsive layout (desktop/tablet/mobile)
- [ ] Dark mode (primary) with consistent color system
- [ ] Smooth page transitions and micro-animations
- [ ] Deep-linkable URLs for all views
- [ ] Back button preserves context (filters, scroll, tab)

---

## SECTION 9 — SAMPLE DATA FOR PROTOTYPING

Use this data to render realistic UI during development:

```json
{
  "faculties": [
    { "id": "soft_eng", "title": "Faculty of Software Engineering" },
    { "id": "info_sec", "title": "Faculty of Information Security" }
  ],
  "subjects": [
    { "id": "algos", "title": "Algorithms & Data Structures", "facultyId": "soft_eng" },
    { "id": "net_sec", "title": "Network Security", "facultyId": "info_sec" },
    { "id": "crypto", "title": "Applied Cryptography", "facultyId": "info_sec" },
    { "id": "crypto_fundamentals", "title": "Cryptographic Fundamentals", "facultyId": "info_sec" }
  ],
  "labs": [
    { "id": "sum_two_numbers", "title": "Sum Two Numbers", "subjectId": "algos", "profileId": "python_basic", "environmentType": "single_runtime", "toolset": ["Python 3"] },
    { "id": "lab_gen_hash", "title": "Task 1 — Generate Hash (Shell CLI)", "subjectId": "crypto_fundamentals", "profileId": "security_shell", "environmentType": "single_machine", "toolset": ["openssl", "python3", "bash"] },
    { "id": "lab_openssl_hmac", "title": "Task 2 — HMAC via OpenSSL CLI", "subjectId": "crypto_fundamentals", "profileId": "security_shell", "environmentType": "single_machine", "toolset": ["openssl", "bash"] },
    { "id": "lab_avalanche", "title": "Task 3 — Avalanche Effect", "subjectId": "crypto_fundamentals", "profileId": "security_shell", "environmentType": "single_machine", "toolset": ["openssl", "python3", "bash"] },
    { "id": "lab_bruteforce_mock", "title": "Task 4 — Brute-force Simulation", "subjectId": "crypto_fundamentals", "profileId": "security_shell", "environmentType": "single_runtime", "toolset": ["python3", "bash"] },
    { "id": "lab_winlocker_analysis", "title": "Dynamic Analysis of WinlockerVB6Blacksod", "subjectId": "net_sec", "profileId": "malware_analysis_shell", "environmentType": "single_runtime", "toolset": ["wine", "tcpdump", "strace", "bash"] }
  ]
}
```

---

## SECTION 10 — GENERATION INSTRUCTIONS FOR AI

### Priority Order
1. **Layout Shell** first: Sidebar + breadcrumb + page container
2. **Dashboard** second: KPI cards + recent submissions + faculty cards
3. **Lab Browser** third: Filter panel + lab cards grid
4. **Lab Workspace** fourth: Split panels + Monaco + WebTerminal + console
5. **Submission History** fifth: Data table with filters
6. **Submission Detail** sixth: Code review + test results
7. **Settings** last: Simple form

### Quality Expectations
- This must look like **Vercel Dashboard** or **Linear** or **GitHub** — premium, polished, enterprise-grade
- NOT a student project, NOT a simple CRUD app, NOT Bootstrap generic
- Every pixel matters: spacing, alignment, typography, color consistency
- Animations must be subtle and purposeful, never distracting
- The dark theme must feel sophisticated, not just "black background with white text"

### What NOT to do
- Do NOT use bright/saturated colors for backgrounds
- Do NOT use rounded Comic Sans-like fonts
- Do NOT create cluttered layouts with too many elements competing for attention
- Do NOT use placeholder images — use icons (lucide-react) and colored backgrounds instead
- Do NOT skip loading/error/empty states
- Do NOT hardcode data — always fetch from the API endpoints listed above
