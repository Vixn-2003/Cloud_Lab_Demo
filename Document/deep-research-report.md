# Báo cáo nghiên cứu: Nền tảng thực hành lập trình trực tuyến với giám sát thời gian thực và chấm tự động

**Tóm tắt điều hành:** Báo cáo này khảo sát và đề xuất thiết kế một nền tảng học tập lập trình web tích hợp **trình soạn thảo mã nhúng trong trình duyệt**, cho phép **giảng viên theo dõi tiến độ học sinh theo thời gian thực** và **chấm điểm tự động**. Hệ thống lấy cảm hứng từ trình soạn thảo “Try It Yourself” của W3Schools và phần mềm chấm bài Themis. Báo cáo phân tích yêu cầu người dùng (giảng viên, sinh viên, quản trị), các tính năng cần có (theo dõi tiến độ, timeline hoạt động, sandbox chạy mã, chấm bài tự động, phản hồi, quản lý phiên bản, phát lại (replay), phân tích), ngôn ngữ hỗ trợ (HTML/CSS/JS, Python, Java, C/C++, SQL, v.v.), kiến trúc (front-end, back-end, kỹ thuật realtime, serverless/container), chiến lược cách ly mã (container, VM, WASM, serverless), cách thức chấm tự động (unit tests, static analysis, phát hiện đạo văn), mô hình dữ liệu và API mẫu, các vấn đề an ninh/bảo mật, khả năng mở rộng và ước tính chi phí, tính năng giao diện người dùng (hoàn thiện mã, linting, nút chạy nộp, gợi ý), giám sát/telemetry và bảng điều khiển giảng viên (kèm sơ đồ kiến trúc và luồng dữ liệu), lộ trình triển khai, công cụ mã nguồn mở ưu tiên, và rủi ro cũng như biện pháp giảm thiểu. 

## Các bên liên quan và yêu cầu (User Stories)

- **Giảng viên (Instructor):** có thể tạo bài tập/luồng học, gán cho học sinh, theo dõi trực tuyến tiến trình sửa mã (số bước hoàn thành, lỗi gặp phải), xem timeline hoạt động của từng học sinh, xem kết quả các lần chạy mã (pass/fail), chấm điểm tự động và điều chỉnh điểm cuối, cung cấp gợi ý/hướng dẫn khi cần, thu thập và phân tích số liệu (thành tích lớp, tỉ lệ làm đúng), can thiệp tức thì (hỏi/đáp, livechat), hoặc xem lại toàn bộ quá trình làm bài sau buổi học (replay mã nguồn). Giảng viên cũng quản lý nhóm lớp, lịch học, phân quyền giảng viên/phụ giảng.
- **Sinh viên (Student):** có thể truy cập bài tập được giao, viết mã trực tiếp trên trình duyệt bằng editor nhúng (ví dụ kiểu W3Schools *“Try it”*), chạy thử và nộp mã, nhận phản hồi tự động (kết quả test, lỗi cú pháp), xem lại lịch sử phiên bản mã của mình, xem lại hành vi làm bài (session replay nếu có), và tự theo dõi tiến độ học (lưu lại tiến độ qua ranking, achievement). Sinh viên cũng có thể yêu cầu gợi ý/hướng dẫn nếu bị mắc kẹt.
- **Quản trị hệ thống (Admin):** quản lý người dùng (tạo tài khoản giảng viên/sinh viên, phân quyền), cấu hình hệ thống (cấu hình ngôn ngữ được hỗ trợ, giới hạn tài nguyên), giám sát tình trạng hoạt động (server, tần suất sử dụng), đảm bảo tuân thủ chính sách (quyền riêng tư, bảo mật), sao lưu và cập nhật định kỳ. Admin cũng theo dõi chi phí triển khai và khuyến nghị cấu hình tài nguyên phù hợp với quy mô người dùng.

## Tính năng chính (Required Features)

- **Theo dõi tiến độ thời gian thực:** Ghi nhận các thao tác của sinh viên (gõ phím, chạy mã) gần như tức thời. Cho phép giảng viên quan sát dashboard tổng quan về tiến độ từng học sinh, ví dụ biểu đồ cột hoàn thành các mục con trong bài tập.
- **Timeline hoạt động:** Lưu lại và hiển thị lịch sử (timestamped) các sự kiện: sửa đổi mã, chạy mã, pass/fail test, gửi yêu cầu trợ giúp. Giảng viên có thể “replay” lại toàn bộ tiến trình làm bài của một sinh viên sau giờ học【49†L526-L533】.
- **Sandbox chạy mã:** Mã của sinh viên được biên dịch/chạy trong môi trường cô lập (sandbox) an toàn – không cho phép truy cập hệ thống/IO ngoại trừ những gì cho phép, giới hạn CPU/memory/time để ngăn quá tải hệ thống.
- **Chấm bài tự động:** Hệ thống chạy các bộ test (unit tests) để đánh giá tính đúng/sai của bài tập. Có thể dùng nhiều cách: so sánh đầu ra với mẫu, chạy kiểm thử đơn vị, phân tích mã tĩnh đối chiếu với giải pháp mẫu【43†L13-L22】, hoặc thậm chí dùng học máy để phát hiện lỗi phổ biến. Phản hồi trả về sinh viên thường giới hạn ở test pass/fail và sự khác biệt so với đáp án mẫu【43†L13-L22】.
- **Phản hồi (feedback):** Cung cấp thông báo ngay lập tức cho sinh viên sau mỗi lần nộp bài (thông báo đã qua/bỏ sót test nào, gợi ý sửa lỗi). Giảng viên có thể đặt câu hỏi hoặc nhận xét gợi ý cho từng bài làm. Hệ thống lưu các phản hồi của giảng viên cho sinh viên.
- **Quản lý phiên bản (versioning):** Tự động lưu các phiên bản khác nhau của mã sinh viên (ví dụ mỗi khi nhấn “Run” hoặc “Submit”), để sinh viên có thể quay lại phiên bản trước hoặc so sánh (diff) giữa các lần thực hiện.
- **Session replay:** Ghi lại thao tác gõ phím của sinh viên để phát lại (replay) sau đó. Ví dụ như hệ thống Spark đã triển khai, ghi nhận phím gõ và có thể replay theo thứ tự thời gian【49†L526-L533】, giúp giảng viên xem lại từng bước giải quyết của sinh viên.
- **Phân tích (Analytics):** Thu thập số liệu (số lần chạy mã, thời gian làm bài, số lỗi phổ biến) và báo cáo (biểu đồ, thống kê) cho giảng viên/ban lãnh đạo. Theo dõi mức độ hoàn thành nhiệm vụ, điểm trung bình, số lần cần trợ giúp, v.v.
- **Bảo trì & Hỗ trợ kĩ thuật:** Hệ thống cần có tính ổn định cao, khả năng khởi động lại nhanh, sao lưu cơ sở dữ liệu và phục hồi sự cố. Các bản cập nhật và nâng cấp được kiểm thử an toàn.

## Ngôn ngữ và môi trường hỗ trợ (Supported Languages/Runtimes)

Ưu tiên hỗ trợ các ngôn ngữ phổ biến trong dạy học lập trình và phát triển web: **HTML/CSS/JavaScript** (frontend), **Python** (giáo dục, data science), **Java**, **C/C++** (CS cơ bản), **SQL** (cơ sở dữ liệu), cùng các ngôn ngữ khác (PHP, Node.js, v.v.) tùy nhu cầu. Ví dụ, trang W3Schools tích hợp *frontend editor* cho HTML/CSS/JS chạy ngay trên trình duyệt và *backend compilers* cho Python, SQL, Java, C/C++…【29†L112-L113】【25†L780-L788】. Cụ thể:
- **HTML/CSS/JS:** Mã được render trực tiếp trên trình duyệt (như W3Schools: “You can edit HTML, CSS and JavaScript code, and view the result in your browser”【29†L112-L113】). Không cần sandbox đặc biệt.
- **Python:** Chạy trong sandbox (container hoặc WASM như Pyodide), hoặc qua trình biên dịch/bảo trì qua subprocess như Code Clash dùng Flask【52†L71-L77】.
- **Java/C/C++:** Cần biên dịch (javac, gcc) rồi chạy trong sandbox (ví dụ Docker container). Nhiều hệ thống yêu cầu xây dựng “test harness” tự động như Code Clash【52†L97-L105】【52†L113-L121】 để gắn các hàm hoặc đầu vào-đầu ra với code sinh viên.
- **SQL:** Chạy trên CSDL mẫu (PostgreSQL/MySQL) trong container hoặc VM an toàn, trả kết quả truy vấn để đối chiếu với kết quả mong đợi.
- **Ngôn ngữ khác (PHP, Node.js, Ruby…):** Tương tự Python, biên dịch/chạy trong sandbox. Cung cấp tùy chọn mở rộng nếu giảng viên yêu cầu.

## Thiết kế kiến trúc hệ thống (Architecture Options)

Kiến trúc có thể phân tầng: **Frontend** (trình duyệt người dùng), **Backend** (API + services), **Data Storage**, và **Sandbox Execution**. Một minh họa tổng quan như sau:

```mermaid
flowchart LR
  subgraph Trình duyệt
    StudentUI([Trình duyệt sinh viên])
    InstructorUI([Bảng điều khiển giảng viên])
    AdminUI([Giao diện quản trị])
  end
  subgraph Dịch vụ
    WebApp[Web App (API Server)]
    Auth[Auth Service]
    RealTime[Dịch vụ Realtime]
    Grader[Dịch vụ chấm bài]
    Plagiarism[Đơn vị phát hiện đạo văn]
    DB[(Cơ sở dữ liệu)]
    Storage[(Lưu trữ file)]
  end
  subgraph Sandbox
    Container[Container (Docker/K8s)]
    WASM[Sandboxes WebAssembly]
    VM[Máy ảo ảo (VM)]
  end

  StudentUI -->|gửi sự kiện/giao diện| WebApp
  WebApp --> Auth
  WebApp --> DB
  WebApp --> RealTime
  WebApp --> Storage
  WebApp --> InstructorUI
  RealTime --> InstructorUI
  WebApp --> Grader
  Grader --> Container
  Grader --> WASM
  Grader --> VM
  Grader --> Plagiarism
  Grader --> DB
  Container --> DB
  WASM --> DB
  VM --> DB
  Plagiarism --> DB
  InstructorUI -->|quản lý khóa học| WebApp
  AdminUI -->|cấu hình hệ thống| WebApp
```

- **Frontend:** Sử dụng framework JS (React, Vue hoặc Angular) cùng **code editor** tích hợp (Monaco Editor hoặc CodeMirror) có hỗ trợ tô sáng, tự động hoàn thành, gợi ý. Ví dụ, Monaco (dùng cho VS Code) hỗ trợ đa ngôn ngữ và IntelliSense.
- **Backend/API:** Có thể dùng Node.js (Express/Nest), hoặc Python (Django/Flask/FastAPI), hoặc Java (Spring)… Một kiến trúc đa dịch vụ (microservices) qua container (Docker) hoặc serverless (AWS Lambda) tùy scale. Dịch vụ chính gồm:
  - **Auth service:** đăng nhập, xác thực (JWT hoặc OAuth2).
  - **Realtime service:** quản lý kết nối WebSocket (vd. Socket.IO, Django Channels) để push cập nhật thời gian thực cho giảng viên.
  - **Grading service:** nhận yêu cầu nộp mã, đưa vào hàng đợi, phân phối sang sandbox, thu kết quả.
  - **Plagiarism service:** kiểm tra đạo văn (so sánh code).
  - **API chính (WebApp):** xử lý CRUD (khóa học, bài tập, người dùng, v.v), gọi đến các service trên.
- **Cơ sở dữ liệu (DB):** Quan hệ (PostgreSQL/MySQL) hoặc NoSQL (MongoDB) chứa dữ liệu người dùng, cấu hình bài tập, kết quả chấm, log sự kiện. Lưu thêm (Storage) cho mã nguồn, file đính kèm (exam test, submission).
- **Hàng đợi thông điệp (Message Bus):** Có thể dùng RabbitMQ, Kafka hoặc Redis Streams để chuyển công việc chấm và xử lý sự kiện giữa các service, đảm bảo tách rời và mở rộng.
- **Tech realtime:** Dùng WebSocket (Socket.IO, ws hoặc SSE) kết nối hai chiều giữa server và client để cập nhật ngay tiến trình và kết quả. 
- **Container vs Serverless:** Container (k8s, ECS) cho các dịch vụ dài hạn và sandbox (ổn định, tự quản); serverless (AWS Lambda/Azure Functions) có thể dùng cho tác vụ tạm thời (nhưng giới hạn timeout).
- **Ví dụ:** Nền tảng CodeDive (hướng nghiên cứu) sử dụng Kubernetes cho mỗi sinh viên một container Linux riêng và eBPF để theo dõi sự kiện lập trình thời gian thực【31†L651-L659】. Ví dụ “Code Clash” demo dùng Python Flask làm backend và lưu trữ mọi submission để auto-chấm【52†L71-L77】.

## Chiến lược cách ly (Sandboxing/Isolation)

Để chạy mã sinh viên an toàn, cần cô lập triệt để. Các phương án phổ biến:

| **Tùy chọn sandbox** | **Ngôn ngữ hỗ trợ** | **Cách ly** | **Overhead/Khởi động** | **Độ an toàn** | **Mô tả** |
| -------------------- | -------------------- | ----------- | ---------------------- | ------------- | --------- |
| **Container (Docker/Kubernetes)** | Hầu hết (chạy trong container Linux) | Mức vừa (namespace cgroups) | Overhead thấp (~1–2%), khởi động <1s【59†L498-L502】【59†L522-L530】 | Cao (tách biệt tại mức OS, nhưng cùng kernel) | Phổ biến, dễ tích hợp; cần cấu hình bảo mật (seccomp, AppArmor). |
| **Máy ảo (VM)** | Tất cả (hệ điều hành độc lập) | Rất cao (cách ly phần cứng) | Overhead lớn (5–20%), khởi động chậm (15–60s)【59†L498-L502】【59†L522-L530】 | Rất cao (tách hẳn phần cứng) | Độ cô lập mạnh nhất; nhưng tốn tài nguyên và chậm khởi động. Thích hợp cho bài tập siêu quan trọng. |
| **WebAssembly (WASM/WASI)** | C/C++, Rust, Python qua Pyodide, JS, v.v. | Rất cao (cát hóa bộ nhớ) | Overhead rất thấp, khởi động nhanh (<100ms)【34†L79-L88】【36†L155-L164】 | Rất cao (sandbox nghiêm ngặt, không truy cập hệ thống trừ khi cho phép) | Nhẹ, chạy gần tốc độ gốc. Theo Docker blog: WASM “sandboxed execution environment” với “tốc độ gần gốc”【36†L155-L164】. Khởi tạo sandbox WASM rất nhanh so với container/VM【34†L79-L88】. Phù hợp cho các bài cần an toàn và phản hồi nhanh (ví dụ Pyodide chạy Python trên serverless). |
| **Ngăn xếp ngôn ngữ (Language-specific sandbox, vd. trình thông dịch nhúng)** | Tùy ngôn ngữ | Thấp đến vừa (tùy nền) | Rất thấp (chạy ngay trong process) | Trung bình (phụ thuộc phần mềm) | Ví dụ: sandbox Python thuần hay C interpreter nhúng. Ít linh hoạt nhưng nhanh. |

*Chú thích:* Theo đo đạc, container chỉ tăng <2% overhead CPU so với chạy trực tiếp, trong khi VM có thể tốn 5–20% CPU do ảo hóa【59†L498-L502】. Ngoài ra, container khởi động cực nhanh (dưới 1 giây) so với VM mất hàng chục giây【59†L522-L530】. WebAssembly không dùng kernel máy chủ nên startup và cô lập tốt; ví dụ Collabore Engineering nhận xét sandbox WASM “nhỏ gọn hơn” so với container/VM, khởi động nhanh và an toàn hơn, cho phép giới hạn tuyệt đối các quyền truy cập hệ thống【34†L79-L88】【36†L155-L164】.

## Phương pháp chấm tự động (Auto-Grading)

Các công cụ chấm tự động hiện nay thường kết hợp nhiều kỹ thuật【43†L13-L22】:

- **Kiểm thử động (Unit tests):** Thiết lập bộ test đầu vào/đầu ra cho bài tập. Ví dụ nhiều nền tảng thi lập trình (ICPC, Codeforces) đánh giá bằng cách chạy code qua các test. Một số giải pháp (như Themis) cho phép tự động so sánh kết quả code sinh viên với bộ test mẫu【44†L75-L83】.
- **So sánh tĩnh với giải pháp mẫu:** Phân tích cấu trúc mã so với đáp án mẫu (ví dụ so sánh AST hoặc diff text) hoặc so sánh với các bài làm đúng khác. Static analysis giúp phát hiện lỗi logic cơ bản hay đoạn mã “copy”.
- **Kiểm tra độ trùng lặp / đạo văn:** Hệ thống phát hiện copy code (MOSS hoặc giải thuật chuỗi con) để cảnh báo gian lận. Đây là đặc biệt quan trọng khi yêu cầu tự luận hoặc lập trình trực tuyến.
- **Quy tắc/phần cứng bổ sung:** Kiểm tra style, quy ước (linting), hoặc chấm một số yêu cầu về hiệu năng/bộ nhớ. Hiện một số công cụ mới sử dụng ML để nhận diện lỗi lập trình/phân tích tài nguyên (đang nghiên cứu).
- **Mô hình giống Themis:** Themis (bản desktop) tự động hóa quy trình chấm và so sánh kết quả, xuất báo cáo, tiết kiệm thời gian cho giám khảo【44†L75-L83】. Nền tảng web có thể vay mượn ý tưởng này (tập hợp test sẵn, gán điểm tự động, so sánh mã).
- **Tự động phản hồi nhiều vòng:** Hệ thống cho phép nhiều lần nộp lại, chấm liên tục, học sinh thấy kết quả ngay, cải thiện bài tập theo hướng dẫn.

Theo Messer et al. (2023), hầu hết các công cụ AAT (Automatic Assessment Tools) đánh giá đúng/sai dựa trên **unit test** và/hoặc **phân tích tĩnh** so sánh với đáp án chuẩn【43†L13-L22】. Tuy nhiên, phản hồi mặc định chỉ cho biết pass/fail và đầu ra thực tế; do đó chúng tôi cần bổ sung thông tin hữu ích hơn (vd. vòng lặp gợi ý, tài liệu học liệu).

## Mô hình dữ liệu và API (Data Model & APIs)

Mô hình dữ liệu cơ bản có thể gồm các bảng/entities: Người dùng (Users: Sinh viên, Giảng viên, Admin), Lớp/Khoá học (Course), Bài tập (Assignment/Exercise), Đề (Problem, bao gồm mô tả, testcases), Submission (mỗi lần nộp mã), TestResult (kết quả từng test), Event (sự kiện lập trình: edit, run, v.v.), Feedback. Ví dụ bảng API:

| Phương thức | Đường dẫn API               | Chức năng                               | Request (mẫu JSON)                   | Response (mẫu JSON)           |
|-------------|-----------------------------|-----------------------------------------|--------------------------------------|-------------------------------|
| GET         | `/api/courses`              | Lấy danh sách khoá học                  | –                                    | `[ {id, name, ...}, ... ]`    |
| POST        | `/api/courses`              | Tạo khoá học mới (Admin/Instructor)     | `{ "name": "...", "instructor_id": ... }` | `{ "id": ..., "name": "...", ... }` |
| GET         | `/api/assignments?course=ID`| Lấy danh sách bài tập trong khoá học    | –                                    | `[ {id, title, ...}, ... ]`   |
| GET         | `/api/assignments/:id`      | Chi tiết bài tập                        | –                                    | `{ "id": ..., "title": "...", "tests": [...] }` |
| POST        | `/api/assignments`          | Tạo bài tập mới                         | `{ "title":"...","description":"...","tests":[{input,output},...] }` | `{ "id": ..., "title": "...", ... }` |
| POST        | `/api/submissions`          | Nộp mã của sinh viên để chấm            | `{ "assignment_id":X, "student_id":Y, "source_code": "...", "language":"python", "run":true }` | `{ "submission_id": 123, "status": "queued" }` |
| GET         | `/api/submissions/:id`      | Kiểm tra kết quả lần nộp                | –                                    | `{ "submission_id":123, "status":"done","score":...,"errors":[...],"diffs":[...]} ` |
| GET         | `/api/students/:id/events`  | Lấy timeline sự kiện lập trình (cho báo cáo) | –                                | `[ {"time": "...", "event":"keystroke",...}, ... ]` |
| WebSocket   | `/ws/progress` (nhóm)       | Nhận cập nhật tiến độ realtime          | (token xác thực)                     | (mỗi khi có event: `{student, status, timestamp,...}`) |

Các API trên chỉ minh họa: thực tế cần bảo mật (JWT, phân quyền) và validate đầu vào. Ví dụ, khi sinh viên nhấn “Run & Submit”, frontend gửi request đến `/api/submissions`. Hệ thống đưa yêu cầu vào hàng đợi, trả về `submission_id`. Sau khi sandbox xử lý xong, client (hoặc qua WebSocket) nhận kết quả. Một luồng chấm mẫu: StudentUI → POST `/submissions` (code, ID bài) → Back-end gán `submission_id` và đưa Queue → Worker chạy code trong sandbox → Lưu kết quả vào DB (điểm, lỗi) → Back-end cập nhật status và broadcast qua WebSocket → StudentUI nhận kết quả cũng như InstructorUI cập nhật tiến độ【52†L71-L77】【62†L409-L418】.

## An ninh, bảo mật và tuân thủ (Security/Privacy/Compliance)

- **Cách ly mã:** Chạy mã trong môi trường ít quyền nhất (ví dụ container với user không phải root, hạn chế syscall, chặn mạng/IO không cần thiết). Dùng ulimit để giới hạn CPU/RAM và thời gian chạy, tránh mã độc tấn công hệ thống. Theo Docker blog, WASM hay containers đều cô lập tốt nhưng cần kết hợp các cơ chế như seccomp, AppArmor để nâng cao an toàn【36†L169-L174】.
- **Quyền riêng tư:** Dữ liệu học sinh (thông tin cá nhân, điểm số) được mã hoá khi truyền (HTTPS) và lưu trữ an toàn (có thể mã hoá DB). Nếu có dữ liệu nhạy cảm (Dữ liệu y tế tâm lý học sinh, điểm phúc khảo…), cần tuân thủ luật như FERPA (Mỹ) hay GDPR (EU). Hệ thống chỉ lưu dữ liệu cần thiết, bảo vệ thông tin đăng nhập (băm mật khẩu, token).
- **Xác thực và phân quyền:** Bắt buộc đăng nhập, phân quyền chặt chẽ: chỉ giảng viên mới tạo/bỏ sửa điểm hoặc xem toàn bộ mã của sinh viên, sinh viên chỉ xem tài khoản của mình. Sử dụng tiêu chuẩn OAuth2/JWT, chống Cross-Site Request Forgery.
- **Giảm thiểu lỗ hổng:** Thường xuyên cập nhật thư viện, dùng Web Application Firewall, kiểm thử thâm nhập (pen-testing). Đặc biệt tránh XSS/CSRF trên giao diện soạn bài và chấm bài.
- **Tổng hợp:** CodeDive nhấn mạnh cần môi trường Linux container để tránh vấn đề khác biệt môi trường máy sinh viên【31†L624-L632】. Đồng thời cảnh báo LLM/ChatGPT tạo code khiến khó kiểm soát đạo văn【31†L613-L621】. Do đó, cần plugin so sánh đạo văn và cập nhật bộ test để giảm khả năng “copy code AI” như chatGPT làm.
- **Tuân thủ:** Xem xét các yêu cầu giáo dục (nếu tích hợp với LMS của trường) như IMS LTI, đảm bảo mã nguồn mở hoặc giấy phép phù hợp với chính sách trường học.

## Khả năng mở rộng và ước tính chi phí (Scalability/Cost)

- **Pilot nhỏ (<100 sinh viên):** Có thể chạy trên một máy chủ đám mây tầm trung (2-4 CPU, 8-16GB RAM) sử dụng vài container Docker. Giá thuê có thể vài chục đến vài trăm USD mỗi tháng. Các yêu cầu đoạt tải thấp, có thể chạy tối đa vài chục sandbox song song.
- **Mở rộng cho 10k sinh viên:** Cần kiến trúc cluster – ví dụ Kubernetes, Auto-scaling Group, hoặc serverless (AWS Lambda, Azure). Mỗi code submission có thể spawn container/microVM độc lập, nên cần cân nhắc: nếu 10k sinh viên thi đồng thời, phải scale thành trăm-bea container. Cần cache kết quả tạm, cân bằng tải, và queue rõ ràng. Chi phí có thể lên tới hàng ngàn USD/tháng, tuỳ nhà cung cấp. Ước tính: giả sử mỗi container tiêu thụ ~500MB RAM và 1 vCPU, 1000 containers đồng thời => ~500GB RAM, 1000 CPU.
- **Giải pháp tối ưu chi phí:** Dùng container với auto-scaling (k8s/ECS), hoặc FaaS cho ngôn ngữ nhẹ. Tách máy chủ frontend/backend (nhẹ) với cluster sandbox (nặng). Dùng cache/CDN cho tài liệu, và queue để dàn đều gánh nặng. Theo oneuptime, container có thể gấp 5–8 lần số lượng so với VM trên cùng tài nguyên【59†L398-L407】, giúp tiết kiệm chi phí phần cứng.
- **Giám sát:** Dùng Prometheus/Grafana theo dõi CPU, RAM, queue dài; tự động mở thêm node khi cần. Lập budget dự kiến (ví dụ AWS: EC2 + EKS + lưu trữ S3 + RDS).

## Giao diện người dùng và tính năng editor (UX/Editor Features)

- **Trình soạn code:** Tích hợp editor như Monaco hoặc CodeMirror với tô màu cú pháp, đánh số dòng, gợi ý code (IntelliSense), tự động đóng ngoặc, tự động indent. Cho phép chọn ngôn ngữ và cấu hình môi trường (dummy code stub). Editor nên hỗ trợ **thực thi từng phần** (đối với HTML/CSS/JS hiển thị kết quả ngay; đối với code console, hiển thị stdout).
- **Linter & Highlight:** Kiểm tra cú pháp trực tiếp (ESLint cho JS, PyLint cho Python, v.v.), gạch chân lỗi. Đưa khuyến cáo phong cách (nếu cần).
- **Nút Run/Submit:** Riêng biệt – “Run” chỉ chạy thử & hiển thị kết quả test đơn giản, “Submit” chính thức gửi để chấm điểm. Sau khi submit, hiện bảng kết quả (đã qua/bỏ qua test) kèm thông báo chi tiết.
- **So sánh Diff:** Cho sinh viên tùy chọn so sánh mã hiện tại với phiên bản đã gửi gần nhất hoặc với mã tham khảo của giảng viên (nếu công khai). Mở rộng: hiển thị xem ai đang ở cùng đoạn code (như tool codecollab).
- **Gợi ý (Hints):** Giảng viên có thể viết trước gợi ý gắn với từng bước/điều kiện của bài tập. Khi sinh viên kẹt ở bước nào, có thể click để xem gợi ý tương ứng. Hệ thống cũng có thể tự động gợi ý dựa trên lỗi thường gặp (ví dụ lỗi biên dịch, sai vùng nhớ).
- **Quản lý phiên bản & Lịch sử:** Lưu các phiên bản tác vụ, cho chức năng Undo/Redo nâng cao. Sinh viên và giảng viên xem được timeline phiên bản trong quá trình làm bài.
- **Thiết kế giao diện:** Đơn giản, trực quan. Dashboard giảng viên gồm bảng theo dõi học sinh (tỉ lệ hoàn thành, hoạt động gần nhất), và bảng chi tiết khi bấm vào từng học sinh.  Hiển thị biểu đồ, heatmap hoặc cây dự án (như Spark).
- **Khả năng phản hồi:** Chat nhẹ hoặc bình luận trực tiếp vào mã để giảng viên hỗ trợ (kiểu codelense). 

## Giám sát và bảng điều khiển giảng viên (Monitoring/Telemetry)

Hệ thống ghi log mọi sự kiện: thời điểm chạy mã, kết quả, lỗi, hành động UI. Giảng viên xem được dashboard tổng quan **theo dõi thời gian thực**. Ví dụ có thể có các bảng như:

| Nội dung giám sát        | Mô tả                                                          |
|--------------------------|----------------------------------------------------------------|
| Tiến độ lớp học (Progress) | Tỉ lệ sinh viên hoàn thành bài tập, trung bình số test pass.   |
| Học sinh nổi bật         | Danh sách sinh viên làm nhanh nhất hoặc nhiều lỗi nhất.        |
| Debug chung (Challenges) | Các lỗi/phần mô tả thường gặp, được trích từ log tổng hợp.      |
| Tương tác giảng viên     | Thống kê số lần trợ giúp, số câu hỏi từ sinh viên.             |

Ngoài ra, hệ thống thu các số liệu như CPU/RAM dùng, thời gian chạy trung bình per submission, tỉ lệ chấp nhận (pass rate) để phân tích chất lượng câu hỏi.

Để thiết kế bảng điều khiển, có thể tham khảo Spark (UI gồm danh sách học sinh với màu xanh đỏ tình trạng checkpoint)【49†L526-L533】. Giảng viên có thể click vào từng sinh viên để xem timeline (số lần code lỗi, kết quả test qua các bước). Tích hợp đồ thị (Mermaid) và bản đồ nhiệt (heatmap) để minh hoạ điểm yếu chung. Luồng dữ liệu: StudentUI → WebApp/RealTime → Database/Cache → Dashboard UI. Cấu trúc kiến trúc như sơ đồ Mermaid ở trên giúp hình dung: các event được ghi lại tại service và DB, sau đó push qua WebSocket đến trang giảng viên.

## Lộ trình triển khai (Roadmap)

1. **Pha 1 (MVP cơ bản):** Xây dựng editor web cơ bản (Monaco/CodeMirror) với chức năng viết và chạy code đơn giản (HTML/JS/Python). Backend API xử lý chạy code qua docker/Python subprocess. Hệ thống test tự động với bộ test đơn giản. Giao diện giảng viên và sinh viên ban đầu.
2. **Pha 2:** Thêm tính năng quản lý bài tập và lớp học, đơn giản. Triển khai chức năng submit chạy mã và lưu kết quả. Đưa vào cơ sở dữ liệu bảng điểm, cho phép giảng viên xem báo cáo cơ bản (ví dụ bảng pass rate).
3. **Pha 3:** Triển khai real-time WebSocket: phát hành tiến độ (pass/fail) lên Dashboard giảng viên ngay khi có kết quả. Hiển thị timeline sự kiện. Bổ sung các ngôn ngữ bổ sung (Java, C/C++, SQL). Thêm tính năng versioning và diff trong editor.
4. **Pha 4:** Tích hợp sandbox phức tạp (WASM hoặc isolate tốt hơn), tối ưu chi phí chạy. Tăng độ tin cậy (đều triển cao), phân tích thêm (BI, dashboards phong phú). Thêm chức năng session replay: ghi và phát lại code-edit events【49†L526-L533】.
5. **Pha 5:** Tối ưu UX (autocomplete nâng cao, tích hợp LSP), gợi ý thông minh, hỗ trợ học máy (nếu có). Mở rộng mô-đun phân tích đạo văn, API kết nối LMS (LTI).
6. **Pha 6:** Tinh chỉnh và mở rộng: triễn khai quy mô lớn (tích hợp Kubernetes), theo dõi hiệu suất mở rộng, giảm độ trễ, hoàn thiện báo cáo analytics tổng quan cho admin.

## Công cụ mã nguồn mở và công nghệ đề xuất (Tech Stack & Libraries)

- **Editor:** [Monaco Editor](https://microsoft.github.io/monaco-editor/) (VSCode in-browser), hoặc [CodeMirror](https://codemirror.net) (MIT license) cho front-end. Hỗ trợ autocompletion, theme, multi-language.
- **Front-end framework:** React, Angular hoặc Vue.js kết hợp Bootstrap/Tailwind. Ví dụ React với Material UI cho giao diện.
- **Backend:** Node.js (Express, NestJS) hoặc Python (Django/Flask/FastAPI). Node thuận lợi cho realtime (Socket.IO), Python mạnh về xử lý và tích hợp dễ với Judge0 SDK.
- **Realtime:** [Socket.IO](https://socket.io/) hoặc WebSocket gốc. Ví dụ `socket.io` trong Node, hay `channels` trong Django.
- **Sandbox Execution:** [Judge0](https://github.com/judge0/judge0) – hệ thống mã nguồn mở, hỗ trợ >90 ngôn ngữ và có API JSON【62†L409-L418】, dễ triển khai với Docker. Ngoài ra, có thể xây tự động bằng Docker (như ejsRunner) hoặc dùng WASM (ví dụ Pyodide cho Python, hoặc [Wasmtime](https://wasmtime.dev) cho C/C++).
- **Database:** PostgreSQL hoặc MySQL cho dữ liệu quan hệ (user, bài tập, kết quả), Redis cho cache/session, Elasticsearch (tuỳ chọn) để phân tích log/các sự kiện.
- **Message Broker:** RabbitMQ hoặc Kafka để quản lý job submission và event logs.
- **Container Orchestration:** Kubernetes (K8s) hoặc Docker Swarm cho triển khai quy mô lớn, tự động scaling.
- **Telemetry:** Prometheus + Grafana để giám sát server, sử dụng metrics (CPU, memory, queue length). ELK Stack (Elasticsearch, Logstash, Kibana) để phân tích log hành vi sinh viên nếu cần.
- **Phân tích đạo văn:** Tích hợp [MOSS](https://theory.stanford.edu/~aiken/moss/) hoặc giải thuật mô tả (n-gram, AST diff).
- **Authentication:** OAuth2 / JWT. Cân nhắc OpenID Connect (Auth0, Keycloak) cho đa tổ chức.
- **Lập trình hướng đối tượng:** TypeScript (Node.js) giúp quản lý code lớn. Docker, Terraform/Ansible cho hạ tầng (IAAC).
- **CI/CD:** GitHub Actions hoặc Jenkins tự động build/test code, chạy Docker image.

## Rủi ro và biện pháp giảm thiểu (Risks & Mitigations)

- **Mã độc phá hủy sandbox:** Sinh viên có thể cố ý viết mã tấn công (ví dụ fork bomb, kết nối mạng). *Giải pháp:* Thiết lập giới hạn tài nguyên (ulimit), chặn mạng (container chạy offline), dùng seccomp/AppArmor, vô hiệu hoá syscalls nguy hiểm. Theo Docker blog, các công nghệ sandbox hiện nay (Docker hoặc WASM) hạn chế quyền truy cập hệ thống, cần kết hợp nhiều lớp bảo mật【36†L169-L174】.
- **Đạo văn và AI:** Sinh viên có thể copy code bạn hoặc dùng ChatGPT để ra bài. Theo báo cáo CodeDive, ChatGPT đang làm tăng rủi ro gian lận mã【31†L613-L621】. *Giải pháp:* Sử dụng công cụ kiểm tra đạo văn, làm bài tập đa dạng (mỗi học kỳ random test khác nhau), đưa các câu hỏi phải hiểu logic thay vì chỉ code mẫu. Cập nhật bộ test đủ nghiêm ngặt để khó đánh lừa (VD: chấm inspect input/output thay vì chỉ code).
- **Quá tải hệ thống:** Đột biến người dùng cao (thi online đồng loạt) có thể làm nghẽn queue. *Giải pháp:* Thiết kế dịch vụ độc lập, tăng thêm máy chủ và auto-scale, dùng dịch vụ đám mây có thể mở rộng liền (auto-scaling Kubernetes, AWS Lambda). 
- **Lỗi đánh giá sai:** Unit tests có thể thiếu sót, chấm nhầm kết quả. *Giải pháp:* Cho phép giảng viên chỉnh sửa lại điểm thủ công, đối chiếu bằng tay nếu cần. Hạn chế bài quá tự do (khó kiểm thử).
- **Môi trường không đồng nhất:** Nếu không sandbox, sinh viên dùng library khác có thể chạy lỗi. *Giải pháp:* Quy chuẩn môi trường (docker image cố định, chỉ cho phép thư viện nhất định).
- **Bảo mật dữ liệu:** Lộ lọt thông tin cá nhân hay mã nguồn. *Giải pháp:* Mã hoá liên lạc, bảo vệ API, phân quyền nghiêm ngặt, mã nguồn của sinh viên chỉ cho người có quyền truy cập.
- **Chi phí vượt dự toán:** Nhiều container tốn tiền. *Biện pháp:* Đo lường và tối ưu, có tùy chọn workload-sharing (kết hợp local run vs cloud), tính phí bổ sung (nếu triển khai dịch vụ thương mại).
- **Rủi ro thời gian dự án:** Việc tích hợp nhiều phần phức tạp (lập trình thời gian thực, sandbox, auto-grading) khó hơn dự kiến. *Mitigation:* Triển khai theo Agile – hoàn thành tính năng cốt lõi trước rồi mở rộng. Lựa chọn dùng thư viện/framework có hỗ trợ tốt (như Judge0).

**Kết luận:** Một hệ thống lập trình web tương tác cho giáo dục yêu cầu tổng hoà nhiều công nghệ tiên tiến. Nguồn tham khảo chính (W3Schools, Spark, CodeDive, CodeClash, Judge0, Themis) cho thấy cần container hóa môi trường, ghi nhận sự kiện chi tiết, và UI gọn nhẹ nhưng linh hoạt. Bằng cách áp dụng các công cụ mã nguồn mở đã kiểm chứng (Monaco, Socket.IO, Judge0, Kubernetes), theo dõi sát tiến độ học sinh và đảm bảo an ninh, nền tảng này có thể mang lại trải nghiệm học/giảng hiện đại, đồng thời giúp giảng viên hỗ trợ kịp thời và đánh giá chính xác hơn.

**Nguồn tham khảo:** Tất cả ý tưởng trên dựa trên nghiên cứu và tài liệu chính thức: trang W3Schools (Tryit Editor)【29†L112-L113】【25†L780-L788】, báo cáo Spark (thực thi monitor & replay)【49†L526-L533】, nghiên cứu CodeDive về web IDE và eBPF trace【31†L651-L659】【31†L613-L621】, dự án thử nghiệm Code Clash【52†L71-L77】【52†L81-L88】, phần mềm Themis【44†L75-L83】, hệ thống Judge0【62†L409-L418】, và tài liệu so sánh container/VM/WASM【59†L498-L502】【34†L79-L88】【36†L155-L164】. Các dẫn chiếu này đảm bảo sự đầy đủ và cập nhật của thông tin trong báo cáo.