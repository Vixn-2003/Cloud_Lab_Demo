# Multi-environment Online Coding Lab - Demo Plan

This plan details the architecture and implementation steps for building the "Multi-environment online coding lab platform with auto-grading" MVP demo.

## Overview

The demo will consist of a React frontend with a Monaco Editor, a Node.js Express backend, and an `ExecutionService` interface currently implemented via a local `child_process` runner. It will implement a clear separation between `Run` (execution only) and `Submit` (auto-grading against testcases) and utilize a rich `Execution Profile` for language configuration.

## Proposed Folder Structure

```text
/project
  /frontend (React + Vite + Tailwind + Monaco Editor)
  /backend (Express API Server)
    /src
      /controllers
      /services
        /ExecutionService.ts (interface)
        /LocalProcessRunner.ts
      /models
```

We will set this up within `e:\Workspace\WorkJob\MR_Cong_AI\Demo_Platform\project`.

## Backend Architecture & API (Node.js/Express)

The backend exposes a clean REST API separating `Run` and `Submit` workloads, not just endpoints, but in the data model as well (in-memory `submissions` array).

**Data Models (In-Memory)**
```typescript
interface SubmissionRecord {
  id: string;
  mode: "run" | "submit";
  code: string;
  language: string;
  profileId: string;
  createdAt: string;
  status: "pending" | "running" | "graded" | "error";
  result?: any;
}
```

**APIs:**
- `POST /run`: Accepts `{ code, language, profileId }`. Creates a `run` attempt. Uses `ExecutionService` to execute code. Returns `{ stdout, stderr, executionTime }`.
- `POST /submit`: Accepts `{ code, language, problemId }`. Creates a `submit` attempt. Fetches the Problem Config, iterates through testcases. Returns a detailed array of `testResults`:
  ```json
  {
    "status": "graded",
    "mode": "submit",
    "score": 50,
    "passedTests": 1,
    "totalTests": 2,
    "testResults": [
      {
        "index": 1,
        "input": "1 2",
        "expectedOutput": "3",
        "actualOutput": "3",
        "passed": true,
        "executionTimeMs": 12
      }
    ]
  }
  ```

## Problem Registry & Execution Profiles

Instead of hard-coding problem IDs to JSON files, we will use a **Problem Registry**:
```javascript
const problems = {
  sum_two_numbers: {
    id: "sum_two_numbers",
    title: "Sum Two Numbers",
    profileId: "python_basic",
    testcases: [
      { input: "1 2", expectedOutput: "3" },
      { input: "5 7", expectedOutput: "12" }
    ],
    statement: "Read 2 integers separated by space and print their sum."
  }
};
```

**Execution Profile:**
A richer profile enabling multi-environment scaling later:
```javascript
const profiles = {
  python_basic: {
    id: "python_basic",
    displayName: "Python 3 Basic",
    osFamily: "local",
    language: "python",
    version: "3.x",
    extension: ".py",
    buildCommand: null,
    runCommand: (filePath) => ["python", [filePath]],
    testCommand: (filePath) => ["python", [filePath]],
    timeoutMs: 5000,
    resourceLimits: {
      maxOutputBytes: 10000
    },
    networkPolicy: "disabled",
    gradingStrategy: "stdin_stdout_exact"
  }
}
```

## Security & Local Runner Disclaimer

> [!CAUTION]
> **Demo Runner Disclaimer**: This demo currently utilizes a `LocalProcessRunner` using Node's `child_process`. 
> - It is **only for local trusted environments**.
> - Do **not** use it to run internet-facing unverified code.
> - There is **no sandbox isolation** and no protection against infinite loops or malicious payloads affecting the host machine.
> - The code is structured behind an `ExecutionService interface`, providing a clear path to upgrade to `DockerRunner` or `Judge0Runner` for production.

## Frontend Architecture (React + Monaco)

- **UI Layout:**
  - Left Panel: Problem description, **Execution Profile Summary**, and Test Results/Terminal Output indicating execution mode (`run` vs `submit`).
  - Right Panel: Monaco Editor with "Run" and "Submit" buttons.

## Implementation Steps
1. **Init Backend**: Setup Express, routes, data models, Problem Registry, and Execution Profiles.
2. **Implement Runner**: Write `ExecutionService` interface and `LocalProcessRunner`.
3. **Init Frontend**: Setup Vite, Tailwind, Monaco Editor, and the UI layout showing profile summary.
4. **Integration**: Connect frontend to backend, test both execution modes.
