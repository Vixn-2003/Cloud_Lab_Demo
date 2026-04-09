# Multi-Environment Online Coding Lab Demo

This project demonstrates a production-grade initial MVP for a multi-environment, separate "Run vs Submit" coding lab.

## Architecture Highlights
1. **Execution Profiles**: No hardcoded "if python run this". Uses a Problem Registry tied to an `ExecutionProfile`.
2. **Separated Run & Submit Modes**: Run mode bypasses testcases and streams STDOUT. Submit pipes input via stdin and grades using exact matching.
3. **Execution Service Interface**: Supports swapping the current `LocalProcessRunner` with a `DockerRunner` or `Judge0Runner` in the future.

> **⚠️ DEMO MODE DISCLAIMER (Local Process Runner)**
> This MVP defaults to a local `child_process` runner. It is intended **only** for local trusted environments and prototypes. 
> There is **no sandbox isolation** from the host operating system. Do not use this configuration for running untrusted internet traffic.

## Quick Start Guide

### Requirements
- Node.js (v18+)
- Python 3.x (Must be accessible via `python` in your terminal PATH)

### 1. Start the Backend
The backend runs on `localhost:3001` and manages problem configs, the Execution Profile registry, and the runner.

```bash
cd backend
npm run dev
```

*(Note: We use `ts-node-dev` which needs to be configured in package.json, or you can run `npx ts-node-dev src/index.ts`)*

Let's add the script to `backend/package.json` if it's missing:
```json
"scripts": {
  "dev": "ts-node-dev src/index.ts"
}
```

### 2. Start the Frontend
The frontend runs on `localhost:5173` using Vite + React + Monaco.

```bash
cd frontend
npm run dev
```

### 3. Usage
- Open `http://localhost:5173`.
- By default, it loads the "Sum Two Numbers" problem and the `python_basic` execution profile.
- Write code:
  ```python
  import sys
  line = sys.stdin.read().strip()
  if line:
      parts = line.split()
      print(int(parts[0]) + int(parts[1]))
  ```
- **"Play (Run)"**: Executes the script without input, good for debugging printing statements.
- **"Grade (Submit)"**: Feeds the configured testcases into `stdin` and matches `stdout`.

## Roadmap to Production
To elevate this demo to production:
1. Replace `LocalProcessRunner.ts` with a container-based `DockerRunner.ts` or a microVM infrastructure.
2. Implement robust network policies and resource constraints (`cgroups`).
3. Add Authentication and transition the in-memory submission store to Postgres/Redis.
