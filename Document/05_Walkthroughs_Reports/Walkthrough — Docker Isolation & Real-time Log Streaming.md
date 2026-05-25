# Walkthrough — Docker Isolation & Real-time Log Streaming

We have successfully upgraded the platform from direct host execution to isolated container-based execution and added real-time stdout/stderr streaming.

## 🚀 New Features

### 1. Isolated Docker Runner
The system now supports running code inside Docker containers. This provides:
- **Security**: Students cannot access the host filesystem or network.
- **Consistency**: Environment is identical for everyone (e.g., `python:3.11-slim`, `gcc:13`).
- **Control**: Resource limits (256MB RAM, 0.5 CPU) are enforced.

### 2. Real-time Log Streaming
We implemented a **WebSocket bridge** using Socket.IO.
- **Immediate Feedback**: You no longer wait for the code to finish. Logs appear line-by-line as they are produced.
- **Improved UX**: The output panel now shows "QUEUED", "STARTED", and "STREAMING" statuses.

### 3. Asynchronous Execution Lifecycle
The `/run` and `/submit` APIs now return an `executionId` immediately. The actual execution happens in the background, allowing the UI to remain responsive.

---

## 🛠️ Key Technical Changes

### Backend
- **[DockerRunner.ts](file:///e:/Workspace/WorkJob/MR_Cong_AI/Demo_Platform/project/backend/src/services/DockerRunner.ts)**: Uses `spawn('docker', ...)` to manage container lifecycle and capture streams.
- **[ExecutionLogBus.ts](file:///e:/Workspace/WorkJob/MR_Cong_AI/Demo_Platform/project/backend/src/services/ExecutionLogBus.ts)**: A centralized event bus for distributing logs.
- **[Socket Gateway](file:///e:/Workspace/WorkJob/MR_Cong_AI/Demo_Platform/project/backend/src/index.ts)**: Integrates Socket.IO to push bus events to subscribed frontend clients.

### Frontend
- **Socket Integration**: Added `socket.io-client` in `App.tsx`.
- **Live Output UI**: Refactored the console panel to support incremental log appending and status tracking.

---

## 🚦 How to Verify

### Step 1: Set Execution Mode
In `project/backend/.env`, set:
```env
EXECUTION_MODE=docker
```
*(Ensure Docker is running on your machine)*

### Step 2: Run a Lab
1. Select a Python or Node.js Lab.
2. Click **Play**.
3. Observe the "Console Output" panel — logs will appear in real-time.

### Step 3: Run Benchmark
1. Click **Benchmark**.
2. Notice the status indicator showing "Running testcase 1/2..." etc., while grading is in progress.

---

## ⚠️ Notes & Limitations
- **Host Dependencies**: When `EXECUTION_MODE=local`, you still need local compilers.
- **Docker Mounts**: On Windows, ensure Docker has permission to mount the OS temp directory (usually permitted by default).
