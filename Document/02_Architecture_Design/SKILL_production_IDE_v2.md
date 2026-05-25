# SKILL.md — Production IDE cho nền tảng Lab/Practice Auto-Grading

## 1) Mục tiêu của skill
Skill này dùng để điều phối AI khi phân tích, thiết kế, triển khai, vận hành và hỗ trợ một **production IDE cho sinh viên** có khả năng:
- soạn mã trực tiếp trên trình duyệt,
- chạy thử trong đúng môi trường môn học,
- nộp bài và tự chấm bằng testcase/rubric của giảng viên,
- theo dõi tiến độ, lịch sử làm bài, replay hành vi,
- hỗ trợ nhiều runtime/môi trường khác nhau theo từng môn, từng bài lab.

Skill này tối ưu cho:
- giảm token lãng phí,
- tránh miss dữ liệu quan trọng,
- tách rõ concern theo agent,
- buộc AI luôn đọc đủ context trước khi trả lời,
- ưu tiên quyết định ở mức kiến trúc production thay vì demo ngắn hạn.

---

## 2) North Star của hệ thống
Hệ thống không phải chỉ là "web editor + chạy code".
Nó là một **multi-tenant practical exercise platform** gồm 5 capability chính:

1. **Authoring** — giảng viên tạo course, assignment, testcase, rubric, runtime profile.
2. **Practice IDE** — sinh viên code, run thử, debug, xem output.
3. **Execution & Grading** — chạy code trong sandbox đúng môi trường, chấm tự động.
4. **Learning Analytics** — theo dõi tiến độ, attempt, pass rate, stuck detection.
5. **Governance & Security** — phân quyền, audit, chống gian lận, quản trị môi trường.

---

## 3) Nguyên tắc kiến trúc bắt buộc

### 3.1 Tách 3 loại workload
AI phải luôn phân biệt rõ 3 loại workload sau:
- **Authoring workload**: tạo bài, quản lý testcase, cấu hình runtime.
- **Practice workload**: sinh viên bấm Run để test nhanh.
- **Grading workload**: chấm chính thức khi Submit.

Không được dùng chung một pipeline cho cả 3 nếu chưa giải thích rõ:
- Run thử cần latency thấp.
- Submit cần tính đúng, auditability, reproducibility.
- Authoring cần versioning và preview.

### 3.2 Mỗi bài tập phải gắn với Execution Profile
Không gắn runtime bằng ngôn ngữ đơn thuần. Mỗi assignment phải map tới một **Execution Profile**.

Execution Profile gồm tối thiểu:
- `os_family`
- `base_image`
- `image_digest`
- `language`
- `language_version`
- `compiler_or_interpreter`
- `build_steps`
- `run_steps`
- `test_steps`
- `resource_limits`
- `network_policy`
- `mount_policy`
- `allowed_tools`
- `grading_strategy`
- `security_policy_id`

Ví dụ:
- **ATTT Linux lab** → Ubuntu 22.04 + bash + gcc + python3 + network disabled.
- **Software Engineering Java lab** → Temurin JDK 21 + Maven + JUnit 5.
- **Web frontend lab** → Node 20 + npm + Playwright.
- **Database lab** → Postgres 16 + seed data + SQL assertion scripts.

### 3.3 Reproducibility là bắt buộc
Mọi lần chấm phải replay được bằng:
- assignment version,
- testcase version,
- execution profile version,
- submitted artifact hash,
- grader image digest.

### 3.4 Policy-driven platform
Không hard-code logic theo từng môn. Dùng các policy/config:
- runtime profile,
- grader template,
- scoring policy,
- anti-cheat policy,
- retention policy,
- hint policy.

---

## 4) Kiến trúc tổng thể khuyến nghị

### 4.1 Logical architecture
- **Frontend Apps**
  - Student Portal + Browser IDE
  - Instructor Portal
  - Admin Portal
- **Core Backend Services**
  - Identity & Access Service
  - Course/Assignment Service
  - Submission Service
  - Execution Orchestrator
  - Grading Service
  - Realtime Progress Service
  - Analytics/Event Service
  - Artifact/File Service
  - Notification Service
  - Plagiarism/Integrity Service
- **Execution Plane**
  - Sandbox Runner Pool
  - Container Image Registry
  - Runtime Profile Registry
  - Queue/Job Scheduler
- **Data Plane**
  - PostgreSQL
  - Redis
  - Object Storage (MinIO/S3)
  - Kafka/Redpanda
  - OLAP/Warehouse nếu scale lớn

### 4.2 Deployment architecture
Khuyến nghị production:
- Frontend: React + TypeScript
- API/BFF: NestJS hoặc Spring Boot
- Realtime: WebSocket Gateway
- DB: PostgreSQL
- Cache: Redis
- Event streaming: Kafka/Redpanda
- Sandbox: Kubernetes jobs / isolated runner pods / microVM tier cho workload nhạy cảm
- Storage: S3-compatible
- Observability: OpenTelemetry + Prometheus + Grafana + Loki

---

## 5) Chọn công nghệ theo capability

### 5.1 Browser IDE
- **Monaco Editor** cho trải nghiệm desktop-heavy.
- **CodeMirror 6** nếu cần nhẹ và mobile-friendly.

### 5.2 Execution layer
Không để browser gọi Judge0 trực tiếp trong production. Phải có backend orchestration layer ở giữa.

Khuyến nghị theo mức độ:
- **Level 1**: Judge0 self-hosted cho MVP đa ngôn ngữ.
- **Level 2**: Custom Runner Service trên Kubernetes cho lab đặc thù.
- **Level 3**: microVM / Firecracker-style isolation cho exam hoặc lab rủi ro cao.

### 5.3 Realtime progress
- WebSocket hoặc Socket.IO.
- Event source từ editor events + run events + submit events + grader events.

### 5.4 Grading
- Unit tests: JUnit, pytest, Jest, NUnit.
- Static analysis: ESLint, Pylint, Checkstyle, SpotBugs.
- Integration/UI tests: Playwright/Cypress khi cần.
- Plagiarism: JPlag/MOSS-like integration.

---

## 6) Thiết kế domain model cốt lõi

### 6.1 Aggregate quan trọng
- Tenant
- User
- Role
- Course
- CourseOffering
- Assignment
- AssignmentVersion
- Task
- TestCase
- RuntimeProfile
- Submission
- SubmissionArtifact
- ExecutionJob
- GradeResult
- AttemptTimelineEvent
- Hint
- IntegrityFlag

### 6.2 Entity bắt buộc để không miss dữ liệu
#### AssignmentVersion
- id
- assignment_id
- version_no
- statement_markdown
- starter_code_bundle_uri
- runtime_profile_id
- grading_recipe_id
- published_at
- status

#### RuntimeProfile
- id
- key
- display_name
- base_image
- image_digest
- language
- language_version
- cpu_limit
- memory_limit_mb
- timeout_seconds
- network_mode
- filesystem_mode
- environment_variables
- install_steps
- build_steps
- run_steps
- test_steps
- security_policy_id

#### Submission
- id
- student_id
- assignment_version_id
- mode (`run` | `submit`)
- source_snapshot_uri
- content_hash
- submitted_at
- final_score
- grade_status
- attempt_no

#### ExecutionJob
- id
- submission_id
- runner_type
- runtime_profile_snapshot_json
- queued_at
- started_at
- finished_at
- exit_code
- stdout_uri
- stderr_uri
- metrics_json

#### GradeResult
- id
- submission_id
- passed_tests
- total_tests
- score_breakdown_json
- static_findings_json
- plagiarism_score
- rubric_feedback_json
- grader_version

---

## 7) Luồng chuẩn của hệ thống

### 7.1 Flow A — Sinh viên mở bài lab
1. Student mở assignment.
2. Frontend gọi Assignment Service lấy statement, starter code, execution profile summary, run policy, submit policy.
3. Editor khởi tạo workspace tạm.
4. Realtime service tạo session tracking.

### 7.2 Flow B — Run thử nhanh
1. Student bấm **Run**.
2. Frontend gửi source snapshot lên Submission Service với mode=`run`.
3. Submission Service tạo submission nháp.
4. Execution Orchestrator tạo ExecutionJob vào queue low-latency.
5. Runner kéo đúng Runtime Profile snapshot.
6. Runner build/run code trong sandbox.
7. Kết quả stdout/stderr/test-lite trả về realtime.
8. Timeline event được ghi nhận.

### 7.3 Flow C — Submit để chấm chính thức
1. Student bấm **Submit**.
2. Submission Service đóng băng source snapshot.
3. Assignment version + testcase + runtime profile được snapshot lại.
4. Execution Orchestrator đẩy vào grading queue.
5. Grading Service chạy compile/build, unit tests, static analysis, plagiarism, rubric/AI feedback nếu bật.
6. GradeResult được persist.
7. Dashboard giảng viên và sinh viên cập nhật realtime.

### 7.4 Flow D — Theo dõi tiến độ realtime
1. Editor gửi events như `opened_assignment`, `edited_code`, `run_clicked`, `run_succeeded`, `run_failed`, `submit_clicked`, `test_case_passed`, `hint_requested`.
2. Event stream vào Kafka/Redpanda.
3. Analytics processor aggregate thành current progress, stuck score, attempt trend, time-on-task.
4. Instructor dashboard subscribe qua WebSocket.

### 7.5 Flow E — Giảng viên tạo bài mới
1. Instructor chọn course.
2. Tạo assignment metadata.
3. Chọn hoặc tạo Runtime Profile.
4. Upload starter code.
5. Khai báo testcase/rubric.
6. Dry-run sample solution.
7. Publish AssignmentVersion.

---

## 8) Agent design cho AI
Skill này dùng mô hình **multi-agent theo vai trò**, nhưng luôn có 1 orchestrator để tránh trả lời rời rạc.

### 8.1 Orchestrator Agent
**Nhiệm vụ**
- đọc yêu cầu người dùng,
- xác định scope,
- chọn agent cần gọi,
- hợp nhất output cuối,
- kiểm tra thiếu sót trước khi trả lời.

**Bắt buộc kiểm tra**
- user đang hỏi ở mức business, solution, implementation hay operations?
- có yêu cầu multi-environment không?
- có đề cập security/compliance/exam/integrity không?
- có cần artifact như SKILL.md, architecture doc, ADR, API spec không?

### 8.2 Solution Architect Agent
**Nhiệm vụ**
- phân rã capability map,
- chọn architecture style,
- quyết định bounded contexts,
- xác định build vs buy,
- đánh giá long-term impact.

**Output chuẩn**
- context
- assumptions
- capability map
- target architecture
- trade-offs
- roadmap
- risk register

### 8.3 Staff Engineer Agent
**Nhiệm vụ**
- translate architecture thành implementation strategy,
- thiết kế service boundaries,
- data model,
- queue topology,
- API contracts,
- error handling,
- rollout strategy.

**Output chuẩn**
- service list
- sequence flow
- schema draft
- API draft
- deployment notes
- observability checklist

### 8.4 Sandbox & Runtime Agent
**Nhiệm vụ**
- xác định execution isolation strategy,
- chọn Judge0/custom runner/WASM/microVM,
- thiết kế runtime profiles,
- resource quotas,
- network policies,
- filesystem isolation.

**Output chuẩn**
- execution matrix theo môn
- security controls
- runner flow
- image strategy
- cold-start mitigation

### 8.5 Grading Agent
**Nhiệm vụ**
- định nghĩa grading strategy theo loại bài,
- test organization,
- rubric logic,
- scoring model,
- partial grading,
- anti-flaky design.

**Output chuẩn**
- grading pipeline
- testcase taxonomy
- score policy
- retry policy
- evidence retention

### 8.6 Learning Analytics Agent
**Nhiệm vụ**
- xác định event taxonomy,
- stuck detection,
- instructor dashboard metrics,
- student self-tracking metrics.

**Output chuẩn**
- event model
- derived metrics
- dashboard views
- privacy constraints

### 8.7 Security & Governance Agent
**Nhiệm vụ**
- threat model,
- RBAC/ABAC,
- audit logging,
- exam mode controls,
- plagiarism/AI misuse mitigations,
- data retention.

**Output chuẩn**
- threat list
- control mapping
- access matrix
- audit checklist

### 8.8 Documentation Agent
**Nhiệm vụ**
- sinh ra file artifact như README, SKILL.md, ADR, API spec, implementation plan.
- đảm bảo format ngắn gọn, ít token, dễ tái sử dụng.

---

## 9) Routing rules cho agent
- Nếu người dùng hỏi **hỗ trợ nhiều môi trường lab** → gọi Solution Architect Agent + Sandbox & Runtime Agent.
- Nếu người dùng hỏi **DB / API / queue / flow** → gọi Staff Engineer Agent.
- Nếu người dùng hỏi **tự chấm như nào** → gọi Grading Agent + Sandbox Agent.
- Nếu người dùng hỏi **theo dõi tiến độ realtime** → gọi Learning Analytics Agent + Staff Engineer Agent.
- Nếu người dùng hỏi **bảo mật / chống gian lận / exam mode** → gọi Security & Governance Agent.
- Nếu người dùng yêu cầu **tài liệu file** → gọi Documentation Agent sau cùng để đóng gói output.

---

## 10) Flow làm việc chuẩn của AI

### 10.1 Discovery flow
1. Xác định loại người dùng: founder, giảng viên, kỹ sư, admin.
2. Xác định outcome mong muốn: demo, MVP, production, thesis, procurement.
3. Xác định constraint:
   - số lượng sinh viên,
   - số môn,
   - ngôn ngữ lập trình,
   - loại lab,
   - yêu cầu thời gian thực,
   - budget,
   - on-prem/cloud.
4. Xác định risk level:
   - low: practice thường
   - medium: graded coursework
   - high: exam / ATTT / malware-like labs

### 10.2 Solutioning flow
1. Tách requirement chức năng và phi chức năng.
2. Chọn architecture baseline.
3. Mapping capability → service.
4. Mapping assignment type → runtime strategy.
5. Mapping grading type → pipeline.
6. Mapping monitoring need → event model.
7. Xuất risk register.

### 10.3 Validation flow
Trước khi trả lời, AI phải checklist:
- Đã tách Run và Submit chưa?
- Đã có Runtime Profile chưa?
- Đã có isolation boundary chưa?
- Đã có replayability/versioning chưa?
- Đã có observability chưa?
- Đã có risk business + technical chưa?
- Đã có roadmap ưu tiên chưa?

---

## 11) Mẫu quyết định kiến trúc cho từng loại bài

### 11.1 HTML/CSS/JS basic practice
- editor: Monaco/CodeMirror
- execution: client-side iframe sandbox
- grading: DOM snapshot / Playwright assertions / lint
- cost: thấp
- latency: rất thấp

### 11.2 Python / Java / C++ programming lab
- execution: server-side container sandbox
- grading: compile + unit tests + static analysis
- persistence: artifact snapshot + logs
- khuyến nghị: Judge0 cho MVP, custom runner cho production nâng cao

### 11.3 Linux / Ubuntu / shell lab
- execution: dedicated Ubuntu image profile
- grading: shell scripts + expected state assertions
- security: network disabled by default, không privileged container
- lưu ý: bài ATTT có thể cần microVM hoặc isolated node pool

### 11.4 Database lab
- execution: ephemeral DB container per attempt
- grading: seed DB + run SQL + compare result sets + schema assertions
- cleanup: destroy instance after grading

### 11.5 Full project / software engineering lab
- execution: build pipeline image riêng
- grading: unit test + integration test + static analysis + packaging checks
- queue: medium/high latency async

---

## 12) Risk register chuẩn

### Technical risks
- Sandbox escape
- Noisy neighbor giữa submissions
- Flaky testcase
- Runtime image drift
- Queue backlog khi thi đồng loạt
- Log volume quá lớn từ editor telemetry
- Plagiarism detection false positive
- Cold start cao khi tạo container mới

### Business risks
- Giảng viên khó tự author testcase
- Chi phí hạ tầng tăng mạnh theo concurrency
- UX chậm làm sinh viên bỏ dùng
- Tranh cãi điểm số nếu grading không replay được
- Bài lab đặc thù từng khoa khiến platform bị custom quá nhiều

### Mitigation baseline
- image version pinning
- queue partitioning
- retry policy có kiểm soát
- dry-run solution trước publish
- instructor authoring templates
- observability + cost dashboard
- audit trail cho mọi submission chính thức

---

## 13) Khuyến nghị kiến trúc cuối cùng cho bài toán này
Với bài toán nhiều môn, nhiều môi trường, production-grade, hướng tối ưu là:

### Giai đoạn 1
- React + Monaco
- NestJS/Spring Boot backend
- PostgreSQL + Redis
- Judge0 self-hosted cho run/submit cơ bản
- Runtime Profile abstraction ngay từ đầu
- Assignment versioning + submission snapshot

### Giai đoạn 2
- Tách Custom Runner Service cho các lab đặc thù Ubuntu/Linux/DB/project build
- Kafka/Redpanda cho event pipeline
- WebSocket dashboards
- JPlag/integrity module

### Giai đoạn 3
- K8s runner pools theo profile
- isolated node pools cho môn nhạy cảm
- AI-assisted feedback có guardrails
- exam mode + stricter audit + replay

**Điểm mấu chốt:** không thiết kế theo kiểu 1 editor chạy mọi thứ bằng một container chung.

---

## 14) Prompt contract để AI không miss dữ liệu
### System behavior contract
- Luôn trả lời ở mức production, không ở mức demo nếu người dùng không yêu cầu demo.
- Luôn phân tích cả technical risk và business risk.
- Luôn đề xuất execution profile thay vì chỉ nói ngôn ngữ.
- Luôn tách luồng Run và Submit.
- Luôn xem xét scale, security, observability, auditability.
- Nếu người dùng hỏi kiến trúc, phải trả lời theo capability + service + flow + data.
- Nếu người dùng hỏi tài liệu, ưu tiên tạo artifact tái sử dụng ngắn gọn, ít token.

### Required output template
1. Problem framing
2. Assumptions
3. Recommended architecture
4. Execution model
5. Grading model
6. Risks
7. Roadmap
8. Optional artifact/files

---

## 15) Definition of done cho câu trả lời AI
Một câu trả lời chỉ đạt nếu có đủ:
- kiến trúc tổng thể,
- giải pháp cho multi-environment lab,
- cơ chế auto-grading,
- cơ chế realtime progress,
- risk assessment,
- roadmap,
- và nếu được yêu cầu, có file tài liệu đi kèm.

---

## 16) Demo Mode Policy
Khi người dùng yêu cầu demo/MVP:
- được phép thay sandbox thật bằng local runner
- được phép bỏ auth/db/queue
- nhưng vẫn phải giữ:
  - Run vs Submit separation
  - Execution Profile abstraction
  - result model rõ ràng
  - risk disclaimer
  - path nâng cấp lên production
