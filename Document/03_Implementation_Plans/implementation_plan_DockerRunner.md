# Implementation Plan — Docker Runner & Real-time Log Streaming

This plan upgrades the platform from direct host execution to isolated container-based execution and adds real-time log streaming from the backend to the frontend.

## User Review Required

> [!IMPORTANT]
> - **Docker Availability**: This plan assumes `docker` is installed and accessible in the system PATH where the backend is running.
> - **Network Isolation**: By default, Docker containers will run with `--network none` for security.
> - **WebSocket Port**: WebSockets will share the same port as the Express server (default 3001) via Socket.IO.

## Proposed Changes

### [Component] Backend Infrastructure

#### [NEW] [ExecutionLogBus.ts](file:///C:/Users/xuanv/.gemini/antigravity/brain/2f3c4e50-c164-4631-98fc-ebd39bc822ad/project/backend/src/services/ExecutionLogBus.ts)
- Implement an internal `EventEmitter` to broadcast `stdout` and `stderr` from runners.
- Events: `log:${executionId}`.

#### [MODIFY] [index.ts](file:///e:/Workspace/WorkJob/MR_Cong_AI/Demo_Platform/project/backend/src/index.ts)
- Integrate `socket.io`.
- Setup connection handling: clients join rooms based on `executionId`.
- Listen to `ExecutionLogBus` and emit events to the corresponding WebSocket room.

---

### [Component] Execution Layer

#### [MODIFY] [types.ts](file:///e:/Workspace/WorkJob/MR_Cong_AI/Demo_Platform/project/backend/src/models/types.ts)
- Extend `ExecutionProfile` to include `dockerImage`.
- Add `executionId` to relevant interfaces.

#### [MODIFY] [ExecutionService.ts](file:///e:/Workspace/WorkJob/MR_Cong_AI/Demo_Platform/project/backend/src/services/ExecutionService.ts)
- Update interfaces to support optional `executionId` for log routing.

#### [MODIFY] [LocalProcessRunner.ts](file:///e:/Workspace/WorkJob/MR_Cong_AI/Demo_Platform/project/backend/src/services/LocalProcessRunner.ts)
- Update `runProcess` to emit logs to `ExecutionLogBus` if an `executionId` is provided.

#### [NEW] [DockerRunner.ts](file:///C:/Users/xuanv/.gemini/antigravity/brain/2f3c4e50-c164-4631-98fc-ebd39bc822ad/project/backend/src/services/DockerRunner.ts)
- Implement `ExecutionService` using `docker run` commands.
- Mount temporary workspaces as volumes.
- Stream container logs to `ExecutionLogBus` in real-time.
- Enforce resource limits (CPU/Memory).

#### [NEW] [ExecutionServiceFactory.ts](file:///C:/Users/xuanv/.gemini/antigravity/brain/2f3c4e50-c164-4631-98fc-ebd39bc822ad/project/backend/src/services/ExecutionServiceFactory.ts)
- Logic to return either `LocalProcessRunner` or `DockerRunner` based on `process.env.EXECUTION_MODE`.

---

### [Component] Frontend Layer

#### [MODIFY] [App.tsx](file:///e:/Workspace/WorkJob/MR_Cong_AI/Demo_Platform/project/frontend/src/App.tsx)
- Integrate `socket.io-client`.
- Add state to track real-time logs.
- Update `handleRun` and `handleSubmit` to handle the new "streaming" flow:
  1. Post request returns `executionId`.
  2. Subscribe to WebSocket events.
  3. Buffer logs in UI.
  4. Display final result once received.

## Open Questions

> [!NOTE]
> - **Docker Images**: I will configure default images for the existing profiles:
>   - Python: `python:3.11-slim`
>   - Node.js: `node:20-slim`
>   - Java: `openjdk:17-slim`
>   - C++: `gcc:13`
> - **Wait for Results**: Should we send the final JSON result over WebSocket or wait for the HTTP response to finish? 
>   - *Proposed*: HTTP response stays open and returns the final result, while WebSocket handles the intermediate logs. This is more resilient.

## Verification Plan

### Automated Tests
- Create a test script `test_websocket.js` that connects to the server and prints logs for a specific `executionId`.
- Mock Docker commands or use a test environment with Docker.

### Manual Verification
1. Set `EXECUTION_MODE=docker`.
2. Click "Play" on a Python script.
3. Observe logs appearing line-by-line in the console.
4. Verify that the final result still appears and is saved to SQLite.
5. Click "Benchmark" and verify grading logs stream in real-time.
