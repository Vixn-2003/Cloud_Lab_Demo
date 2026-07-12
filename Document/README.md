# 📚 Cloud Lab Demo Platform — Trung Tâm Tài Liệu (Documentation Hub)

Chào mừng bạn đến với **Trung tâm Quản lý Tài liệu** của dự án Cloud Lab. 
Để giúp học viên, giảng viên và các AI Agent dễ dàng định vị, khai thác thông tin, toàn bộ tài liệu đã được tổ chức phân tầng thành **7 chuyên mục chuyên biệt** dưới đây:

---

## 🏛️ Bản Đồ Cấu Trúc Thư Mục (Directory Hierarchy Map)

```
Document/
├── README.md                              ← Bản đồ tổng thể này (Entry Point)
├── PROJECT_FLOW.md                         ← Nhật ký hoạt động & Backlog tối cao (Rules)
├── 01_Requirements_Research/              ← Phân tích Yêu cầu & Báo cáo Nghiên cứu
├── 02_Architecture_Design/                ← Đặc tả Kiến trúc & Thiết kế Sandbox
├── 03_Implementation_Plans/               ← Kế hoạch Triển khai chi tiết từng phiên
├── 04_Testing_Verification/               ← Kịch bản & Báo cáo kết quả kiểm thử (QA)
├── 05_Walkthroughs_Reports/               ← Báo cáo hoàn thành thực tế
├── 06_Onboarding_Team/                    ← Hướng dẫn nội bộ thành viên mới
└── 07_Scratchpads/                        ← Các nháp nháp & Task phụ tạm thời
```

---

## 🧭 Danh Mục Tài Liệu Chi Tiết (Document Catalog)

> [!TIP]
> Nhấp trực tiếp vào các liên kết màu xanh dưới đây để mở nhanh tài liệu tương ứng.

### 📌 Tài Liệu Cốt Lõi (Core Entrance Docs)
*   **[PROJECT_FLOW.md](file:///e:/Workspace/WorkJob/MR_Cong_AI/Demo_Platform/Document/PROJECT_FLOW.md)**: Nhật ký tiến độ toàn bộ 18 phiên làm việc và backlog tính năng chính thức. Chứa **Chỉ thị Tối cao (AI Instructions)** bắt buộc các Agent tuân thủ.

---

### 📂 1. Yêu Cầu & Nghiên Cứu (`01_Requirements_Research`)
*   **[SRS.md](file:///e:/Workspace/WorkJob/MR_Cong_AI/Demo_Platform/Document/01_Requirements_Research/SRS.md)**: Đặc tả Yêu cầu Phần mềm (Software Requirement Specification) của nền tảng.
*   **[deep-research-report.md](file:///e:/Workspace/WorkJob/MR_Cong_AI/Demo_Platform/Document/01_Requirements_Research/deep-research-report.md)**: Báo cáo nghiên cứu sâu về các mô hình thực hành coding trực tuyến và cơ chế tự động chấm điểm.

---

### 📐 2. Kiến Trúc & Đặc Tả Thiết Kế (`02_Architecture_Design`)
*   **[SOLUTIONS_FLOW.md](file:///e:/Workspace/WorkJob/MR_Cong_AI/Demo_Platform/Document/02_Architecture_Design/SOLUTIONS_FLOW.md)**: Sơ đồ tuần tự (Sequence Diagrams) mô tả luồng dữ liệu của 4 Giải pháp cốt lõi (Monaco, Web Terminal, Labtainer Online, Labtainer ZIP).
*   **[PROS_CONS_LAB_SOLUTIONS.md](file:///e:/Workspace/WorkJob/MR_Cong_AI/Demo_Platform/Document/02_Architecture_Design/PROS_CONS_LAB_SOLUTIONS.md)**: Bảng phân tích chi tiết Ưu và Nhược điểm của các giải pháp thực thi, kèm theo định hướng vận hành thương mại.
*   **[DATABASE_CHOICE_EXPLANATION.md](file:///e:/Workspace/WorkJob/MR_Cong_AI/Demo_Platform/Document/02_Architecture_Design/DATABASE_CHOICE_EXPLANATION.md)**: Giải trình kiến trúc và lý do sử dụng song song SQLite cho local/demo và định hướng MySQL/Postgres cho production & lab sandbox.
*   **[DOCKER_CONCEPTS_EXPLANATION.md](file:///e:/Workspace/WorkJob/MR_Cong_AI/Demo_Platform/Document/02_Architecture_Design/DOCKER_CONCEPTS_EXPLANATION.md)**: Giải thích trực quan cơ chế hoạt động của Docker (Cloud Registry vs Local Cache) để dev mới dễ dàng nắm bắt bản chất.
*   **[Docker_Resource_Limits.md](file:///e:/Workspace/WorkJob/MR_Cong_AI/Demo_Platform/Document/02_Architecture_Design/Docker_Resource_Limits.md)**: Đặc tả cấu hình bảo mật Sandbox (RAM/CPU/PIDs limit) phòng chống mã độc và **Fork Bomb**.
*   **[CLOUD_LAB_MY_LABS_UI_UPGRADE_SPEC.md](file:///e:/Workspace/WorkJob/MR_Cong_AI/Demo_Platform/Document/02_Architecture_Design/CLOUD_LAB_MY_LABS_UI_UPGRADE_SPEC.md)**: Tài liệu đặc tả nâng cấp giao diện "Bài Lab của tôi" và Sidebar học trình.
*   **[VERCEL_AI_FRONTEND_SPEC.md](file:///e:/Workspace/WorkJob/MR_Cong_AI/Demo_Platform/Document/02_Architecture_Design/VERCEL_AI_FRONTEND_SPEC.md)**: Tiêu chuẩn thiết kế giao diện cao cấp (Enterprise Spec) cho Vercel AI sinh mã nguồn React V2.
*   **[Labtainer.md](file:///e:/Workspace/WorkJob/MR_Cong_AI/Demo_Platform/Document/02_Architecture_Design/Labtainer.md)**: Nguyên lý và cấu trúc mạng cô lập của công cụ NPS Labtainer.
*   **[SKILL_production_IDE_v2.md](file:///e:/Workspace/WorkJob/MR_Cong_AI/Demo_Platform/Document/02_Architecture_Design/SKILL_production_IDE_v2.md)**: Định hướng và Blueprint kiến trúc xây dựng IDE sản xuất cao cấp.

---

### 📋 3. Kế Hoạch Triển Khai Chi Tiết (`03_Implementation_Plans`)
*   **[implementation_plan.md](file:///e:/Workspace/WorkJob/MR_Cong_AI/Demo_Platform/Document/03_Implementation_Plans/implementation_plan.md)**: Kế hoạch tích hợp trực tiếp NPS Labtainer CLI làm Runtime Engine.
*   **[MIGRATION_GUIDE_FRONTEND_V2.md](file:///e:/Workspace/WorkJob/MR_Cong_AI/Demo_Platform/Document/03_Implementation_Plans/MIGRATION_GUIDE_FRONTEND_V2.md)**: Hướng dẫn chi tiết 6 bước di chuyển và tích hợp Real API cho Frontend React V2.
*   **[implementation_plan_DockerRunner.md](file:///e:/Workspace/WorkJob/MR_Cong_AI/Demo_Platform/Document/03_Implementation_Plans/implementation_plan_DockerRunner.md)**: Kế hoạch nâng cấp Docker Runner cô lập.
*   **[SKILL_labtainer_web_terminal.md](file:///e:/Workspace/WorkJob/MR_Cong_AI/Demo_Platform/Document/03_Implementation_Plans/SKILL_labtainer_web_terminal.md)**: Blueprint thiết kế luồng WebSocket truyền PTY-stream từ Backend lên Web Terminal.

---

### 🧪 4. Kiểm Thử & Xác Minh (`04_Testing_Verification`)
*   **[LAB_TESTCASES_CATALOG.md](file:///e:/Workspace/WorkJob/MR_Cong_AI/Demo_Platform/Document/04_Testing_Verification/LAB_TESTCASES_CATALOG.md)**: Danh mục đầy đủ chi tiết các cặp dữ liệu Input/Output và thuật toán chấm điểm tự động cho toàn bộ 17 bài Lab trên hệ thống.
*   **[LAB_TESTING_SCENARIO.md](file:///e:/Workspace/WorkJob/MR_Cong_AI/Demo_Platform/Document/04_Testing_Verification/LAB_TESTING_SCENARIO.md)**: Kịch bản kiểm thử toàn diện bằng tiếng Việt cho 9 bài Lab mẫu.
*   **[LAB_TEST_PLAN_REPORT.md](file:///e:/Workspace/WorkJob/MR_Cong_AI/Demo_Platform/Document/04_Testing_Verification/LAB_TEST_PLAN_REPORT.md)**: Báo cáo kết quả kiểm thử tự động, xác minh điểm số tuyệt đối 100/100 cho 9 bài Lab.
*   **[TEST_PLAN_WORKFLOWS.md](file:///e:/Workspace/WorkJob/MR_Cong_AI/Demo_Platform/Document/04_Testing_Verification/TEST_PLAN_WORKFLOWS.md)**: Ma trận test case và kế hoạch kiểm thử các Workflows chính.

---

### 📝 5. Nhật Ký Hoàn Thành & Báo Cáo Thực Tế (`05_Walkthroughs_Reports`)
*   **[walkthrough.md](file:///e:/Workspace/WorkJob/MR_Cong_AI/Demo_Platform/Document/05_Walkthroughs_Reports/walkthrough.md)**: Báo cáo kết quả thực thi chuyển đổi dự án sang pnpm Monorepo và Turborepo (Active Walkthrough).
*   **[walkthrough_labtainer_integration.md](file:///e:/Workspace/WorkJob/MR_Cong_AI/Demo_Platform/Document/05_Walkthroughs_Reports/walkthrough_labtainer_integration.md)**: Hướng dẫn vận hành hệ thống thật (Production Guide) sau khi tích hợp NPS Labtainer Core.
*   **[walkthrough_upload_file_submission.md](file:///e:/Workspace/WorkJob/MR_Cong_AI/Demo_Platform/Document/05_Walkthroughs_Reports/walkthrough_upload_file_submission.md)**: Hướng dẫn vận hành luồng nộp bài tập qua tệp ZIP.
*   **[walkthrough_Phare2.md](file:///e:/Workspace/WorkJob/MR_Cong_AI/Demo_Platform/Document/05_Walkthroughs_Reports/walkthrough_Phare2.md)**: Nhật ký hoàn thành tích hợp SQLite và manual Stdin.
*   **[walkthrough_Pharse3.md](file:///e:/Workspace/WorkJob/MR_Cong_AI/Demo_Platform/Document/05_Walkthroughs_Reports/walkthrough_Pharse3.md)**: Nhật ký hoàn thành thiết lập Academic Hierarchy và cascading selects.

---

### 👥 6. Hướng Dẫn Nội Bộ Thành Viên Mới (`06_Onboarding_Team`)
*   **[DEVELOPER_SETUP_GUIDE.md](file:///e:/Workspace/WorkJob/MR_Cong_AI/Demo_Platform/Document/06_Onboarding_Team/DEVELOPER_SETUP_GUIDE.md)**: Hướng dẫn chi tiết các bước thiết lập môi trường phát triển cục bộ dành cho nhà phát triển mới (Docker, Node.js, Next.js, SQLite, test runners).
*   **[ONBOARDING_SECURITY_MEMBER.md](file:///e:/Workspace/WorkJob/MR_Cong_AI/Demo_Platform/Document/06_Onboarding_Team/ONBOARDING_SECURITY_MEMBER.md)**: Hướng dẫn onboarding cho thành viên An toàn thông tin mới tham gia dự án, bao gồm cấu trúc thư mục, quy trình làm việc và reference solutions.

---

### 📓 7. Nháp & Task Tạm Thời (`07_Scratchpads`)
*   **[task.md](file:///e:/Workspace/WorkJob/MR_Cong_AI/Demo_Platform/Document/07_Scratchpads/task.md)**: Bảng checklist theo dõi tiến độ nhiệm vụ đang thực hiện (Active Task Checklist).
*   *Chứa các file nháp cũ, checklist task phụ của các phiên trước như `scratchpad_8i06fkhv.md` phục vụ việc truy vết lịch sử khi cần thiết.*

---

> 🤝 **Dành cho các AI Coding Agent**: Hãy luôn bắt đầu phiên làm việc bằng cách đọc tệp [README.md](file:///e:/Workspace/WorkJob/MR_Cong_AI/Demo_Platform/Document/README.md) này để có cái nhìn toàn cảnh về hệ thống tài liệu và tuân thủ các chỉ thị lưu vết tại [PROJECT_FLOW.md](file:///e:/Workspace/WorkJob/MR_Cong_AI/Demo_Platform/Document/PROJECT_FLOW.md).
