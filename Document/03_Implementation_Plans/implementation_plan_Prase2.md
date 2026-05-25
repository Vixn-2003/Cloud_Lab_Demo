# Phase 2 Upgrade: Features & Persistence

This plan outlines the steps to upgrade the Online Coding Lab demo with new language support, dynamic problem management, and long-term data persistence using SQLite.

## User Review Required

> [!IMPORTANT]
> **External Dependencies**: This upgrade requires local installations of `g++` (MinGW-w64), `java` (JDK), and `node` to support the new Execution Profiles. If these tools are not in the system path, execution will fail for those languages.

> [!NOTE]
> **Database**: We will use `better-sqlite3` for local persistence. It's a synchronous, fast library that fits well for local demos.

## Proposed Changes

### Backend Enhancements

#### `[MODIFY] [ProblemRegistry.ts](file:///e:/Workspace/WorkJob/MR_Cong_AI/Demo_Platform/project/backend/src/models/ProblemRegistry.ts)`
- Add profiles: `java_basic`, `nodejs_20`, `cpp_gcc`.
- Define build commands for Java and C++.
- Add simplified demo problems for Nmap-SSH, HMAC, and "Thu gọn dãy số".

#### `[MODIFY] [LocalProcessRunner.ts](file:///e:/Workspace/WorkJob/MR_Cong_AI/Demo_Platform/project/backend/src/services/LocalProcessRunner.ts)`
- Update `executeRun` to support `stdin` input.
- Implement logic to handle `buildCommand` (compilation) before `runCommand`.
- Handle file naming for Java (ensure `Main.java` if needed).

#### `[NEW] [DatabaseService.ts](file:///e:/Workspace/WorkJob/MR_Cong_AI/Demo_Platform/project/backend/src/services/DatabaseService.ts)`
- Initialize SQLite database (`lab_platform.db`).
- Create `submissions` table.
- Provide methods to save and retrieve submission history.

#### `[MODIFY] [index.ts](file:///e:/Workspace/WorkJob/MR_Cong_AI/Demo_Platform/project/backend/src/index.ts)`
- Add `GET /problems` to return the list of available problems.
- Update `/run` to accept `stdin` from the request body.
- Integrate `DatabaseService` to persist all runs and submissions.

---

### Frontend Enhancements

#### `[MODIFY] [App.tsx](file:///e:/Workspace/WorkJob/MR_Cong_AI/Demo_Platform/project/frontend/src/App.tsx)`
- Add a dropdown component to select problems dynamically.
- Implement an **Input (stdin)** panel alongside the Output panel.
- Update the "Run" logic to send the content of the `stdin` field.
- Add support for changing the language/profile based on the selected problem.

## Open Questions

1. **Java Class Name**: For Java exercises, should we enforce a specific class name (e.g., `Main`) so the compiler can find the entry point, or should we try to parse the class name from the code? (Proposed: Enforce `public class Main`).
2. **C++ Compiler**: Do you have `g++` installed and accessible via command line?
3. **Persist Problems?**: Should the problems themselves be stored in the database, or is keeping them in `ProblemRegistry.ts` (code-driven) acceptable for this phase? (Proposed: Keep in code for simplicity, persist only submissions).

## Verification Plan

### Automated Tests
- Run `npm run dev` for both frontend and backend.
- Use the browser tool to:
    1. Select different problems from the dropdown.
    2. Run Python, Node.js, and C++ snippets.
    3. Verify `stdin` input is correctly processed by a "Sum" program.
    4. Submit programs and check if scores are calculated correctly.

### Manual Verification
- Check if `lab_platform.db` is created and contains data after running some code.
- Verify that refreshing the page (or restarting the backend) doesn't lose submission history (if history UI is added).
