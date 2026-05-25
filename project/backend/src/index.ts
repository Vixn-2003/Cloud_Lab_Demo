import "dotenv/config";
import express from "express";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";
import { Server } from "socket.io";
import { createServer } from "http";
import multer from "multer";
import { profiles, faculties, subjects, labs } from "./models/ProblemRegistry";
import { SubmissionRecord, LabConfig, ExecutionProfile, ExecutionResult } from "./models/types";
import { dbService } from "./services/DatabaseService";
import { ExecutionServiceFactory } from "./services/ExecutionServiceFactory";
import { logBus } from "./services/ExecutionLogBus";
import { InteractiveTerminalService } from "./services/InteractiveTerminalService";
import { LabtainerGradingService } from "./services/LabtainerGradingService";


// Multer: memory storage, max 2MB, only accept text-based source code files
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // Increase limit to 10MB to support zip archives with logs
  fileFilter: (_req, file, cb) => {
    const allowed = [".py", ".sh", ".js", ".ts", ".java", ".cpp", ".c", ".txt", ".zip", ".tar.gz", ".tgz"];
    const nameLower = file.originalname.toLowerCase();
    let ext = "." + nameLower.split(".").pop();
    if (nameLower.endsWith(".tar.gz")) {
      ext = ".tar.gz";
    }
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`File type '${ext}' not allowed. Accepted: ${allowed.join(", ")}`));
    }
  }
});

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
  }
});

app.use(cors());
app.use(express.json());

// WebSocket logic
io.on("connection", (socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);
  
  socket.on("subscribe", (executionId: string) => {
    socket.join(executionId);
    console.log(`[Socket] Client subscribed to: ${executionId}`);
    
    // Re-emit grading result immediately if already completed to solve WebSocket race conditions
    try {
      const sub = dbService.getSubmission(executionId);
      if (sub && (sub.status === "finished" || sub.status === "failed")) {
        socket.emit("execution:status", {
          executionId,
          status: sub.status,
          payload: sub.result,
          message: "Đã hoàn thành chấm điểm trước đó."
        });
      }
    } catch (e) {}
  });

  // Terminal logic
  socket.on("terminal:start", ({ sessionId }) => {
    InteractiveTerminalService.getInstance().startSession(sessionId, socket);
  });

  socket.on("terminal:input", ({ sessionId, data }) => {
    InteractiveTerminalService.getInstance().writeData(sessionId, data);
  });

  socket.on("terminal:resize", ({ sessionId, cols, rows }) => {
    InteractiveTerminalService.getInstance().resize(sessionId, cols, rows);
  });

  socket.on("disconnect", () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`);
    InteractiveTerminalService.getInstance().handleSocketDisconnect(socket.id);
  });
});

// Bridge LogBus to WebSocket
logBus.on("log", (event) => {
  io.to(event.executionId).emit("execution:log", event);
});

logBus.on("status", (event) => {
  io.to(event.executionId).emit("execution:status", event);
});

// Helper for log bus to handle internal events
// executionLogBus emits 'log:id' and 'status:id'
// We can use a wildcard or just a generic listener if we modify LogBus slightly
// I will update LogBus to emit generic 'log' and 'status' events as well.

const PORT = process.env.PORT || 3001;

// API to generate a session ID for the terminal
app.post("/terminal/init", (req, res) => {
  const sessionId = uuidv4();
  const { labId } = req.body;
  if (labId) {
    InteractiveTerminalService.getInstance().registerSessionLab(sessionId, labId);
  }
  res.json({ sessionId });
});

// GET /faculties - list of all faculties
app.get("/faculties", (req, res) => {
  res.json(faculties);
});

// GET /subjects - list subjects, optional filter by facultyId
app.get("/subjects", (req, res) => {
  const { facultyId } = req.query;
  if (facultyId) {
    const filtered = subjects.filter(s => s.facultyId === facultyId);
    return res.json(filtered);
  }
  res.json(subjects);
});

// GET /labs - list lab summaries, optional filter by subjectId
app.get("/labs", (req, res) => {
  const { subjectId } = req.query;
  let labList = Object.values(labs);
  
  if (subjectId) {
    labList = labList.filter(l => l.subjectId === subjectId);
  }
  
  const summaries = labList.map(l => ({
    id: l.id,
    title: l.title,
    subjectId: l.subjectId,
    profileId: l.profileId
  }));
  
  res.json(summaries);
});

// GET /labs/:id - detailed lab config
app.get("/labs/:id", (req, res) => {
  const lab = labs[req.params.id];
  if (!lab) return res.status(404).json({ error: "Lab not found" });
  res.json(lab);
});

app.get("/profiles/:id", (req, res) => {
  const profile = profiles[req.params.id];
  if (!profile) return res.status(404).json({ error: "Profile not found" });
  res.json({
    id: profile.id,
    displayName: profile.displayName,
    osFamily: profile.osFamily,
    language: profile.language,
    version: profile.version,
    timeoutMs: profile.timeoutMs,
    gradingStrategy: profile.gradingStrategy
  });
});

app.post("/run", async (req, res) => {
  const { code, profileId, stdin } = req.body;
  const profile = profiles[profileId];

  if (!profile) {
    return res.status(400).json({ error: "Invalid profile" });
  }

  const executionId = uuidv4();
  
  const submissionRecord: SubmissionRecord = {
    id: executionId,
    mode: "run",
    code,
    language: profile.language,
    profileId,
    createdAt: new Date().toISOString(),
    status: "queued"
  };

  // Immediate response
  res.json({
    executionId,
    status: "queued"
  });

  // Background execution
  (async () => {
    const runner = ExecutionServiceFactory.getRunner();
    try {
      const result = await runner.executeRun(code, profile, executionId, stdin);
      submissionRecord.status = "finished";
      submissionRecord.result = result;
      dbService.saveSubmission(submissionRecord);
    } catch (error: any) {
      console.error(`[Execution Error] ${executionId}: ${error.message}`);
      io.to(executionId).emit("execution:status", { executionId, status: "failed", payload: { error: error.message } });
    }
  })();
});

app.post("/submit", async (req, res) => {
  const { code, profileId, labId } = req.body;
  const profile = profiles[profileId];
  const lab = labs[labId];

  if (!profile || !lab) {
    return res.status(400).json({ error: "Invalid profile or lab" });
  }

  const executionId = uuidv4();
  
  const submissionRecord: SubmissionRecord = {
    id: executionId,
    mode: "submit",
    code,
    language: profile.language,
    profileId,
    createdAt: new Date().toISOString(),
    status: "queued"
  };
  (submissionRecord as any).labId = labId;

  res.json({
    executionId,
    status: "queued"
  });

  (async () => {
    const runner = ExecutionServiceFactory.getRunner();
    try {
      logBus.emitStatus(executionId, "started");
      const testResults = [];
      let passedTests = 0;

      for (let i = 0; i < lab.testcases.length; i++) {
        const tc = lab.testcases[i];
        // We can emit sub-status for each testcase
        io.to(executionId).emit("execution:status", { executionId, status: "streaming", message: `Running testcase ${i+1}/${lab.testcases.length}` });
        
        const execResult = await runner.executeSubmit(code, tc.input, profile, executionId);
        
        const actualOutput = (execResult.stdout || "").trim();
        const expectedOutput = tc.expectedOutput.trim();
        const passed = actualOutput === expectedOutput && execResult.exitCode === 0;
        if (passed) passedTests++;

        testResults.push({
          index: i + 1,
          input: tc.input,
          expectedOutput,
          actualOutput,
          passed,
          executionTimeMs: execResult.executionTimeMs,
          stderr: execResult.stderr
        });
      }

      const score = Math.round((passedTests / lab.testcases.length) * 100);
      const finalResult = {
        status: "graded",
        mode: "submit",
        score,
        passedTests,
        totalTests: lab.testcases.length,
        testResults
      };

      submissionRecord.status = "finished";
      submissionRecord.result = finalResult;
      dbService.saveSubmission(submissionRecord);

      io.to(executionId).emit("execution:status", { executionId, status: "finished", payload: finalResult });

    } catch (error: any) {
      console.error(`[Grading Error] ${executionId}: ${error.message}`);
      io.to(executionId).emit("execution:status", { executionId, status: "failed", payload: { error: error.message } });
    }
  })();
});

app.get("/submissions", (req, res) => {
  res.json(dbService.getAllSubmissions());
});

app.get("/submissions/:id", (req, res) => {
  const sub = dbService.getSubmission(req.params.id);
  if (!sub) return res.status(404).json({ error: "Not found "});
  res.json(sub);
});

// POST /upload-submit — Upload a source code file or Labtainer ZIP for grading
// Body: multipart/form-data { file, profileId, labId }
app.post("/upload-submit", upload.single("file"), async (req: any, res: any) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded. Send a file via the 'file' field." });
  }

  const { profileId, labId } = req.body;
  const profile = profiles[profileId];
  const lab = labs[labId];

  if (!profile || !lab) {
    return res.status(400).json({ error: "Invalid profileId or labId" });
  }

  const fileNameLower = req.file.originalname.toLowerCase();
  const isZip = fileNameLower.endsWith(".zip") || fileNameLower.endsWith(".tar.gz") || fileNameLower.endsWith(".tgz");

  // Read file content from memory buffer if it is source code, or mock it if zip
  let code: string;
  if (isZip) {
    code = "# Labtainer ZIP Submission Archive";
  } else {
    try {
      code = req.file.buffer.toString("utf8");
    } catch (e: any) {
      return res.status(400).json({ error: "Cannot read file as UTF-8 text. Only text source code files are supported." });
    }
  }

  const executionId = uuidv4();

  const submissionRecord: SubmissionRecord = {
    id: executionId,
    mode: "submit",
    code,
    language: isZip ? "labtainer" : profile.language,
    profileId,
    createdAt: new Date().toISOString(),
    status: "queued"
  };
  (submissionRecord as any).labId = labId;
  (submissionRecord as any).uploadedFileName = req.file.originalname;

  res.json({ executionId, status: "queued", fileName: req.file.originalname });

  // Run grading pipeline
  (async () => {
    if (isZip) {
      // ZIP / Labtainer Archive Grading Flow
      try {
        logBus.emitStatus(executionId, "started");
        io.to(executionId).emit("execution:status", { executionId, status: "streaming", message: "Extracting and parsing Labtainer zip archive..." });
        
        // Wait a short moment to simulate processing and let the frontend connect
        await new Promise(r => setTimeout(r, 800));

        const report = LabtainerGradingService.gradeZip(req.file.buffer, labId);

        if (report.status === "failed") {
          throw new Error(report.error || "Grading failed");
        }

        // Add uploadedFileName to report for unified schema
        (report as any).uploadedFileName = req.file.originalname;

        submissionRecord.status = "finished";
        submissionRecord.result = report;
        (submissionRecord as any).score = report.score;
        dbService.saveSubmission(submissionRecord);

        io.to(executionId).emit("execution:status", { executionId, status: "finished", payload: report });
        console.log(`[Upload ZIP Submit] Graded ${req.file.originalname} for lab ${labId}: ${report.score}/100`);

      } catch (error: any) {
        console.error(`[Upload ZIP Grading Error] ${executionId}: ${error.message}`);
        io.to(executionId).emit("execution:status", { executionId, status: "failed", payload: { error: error.message } });
      }
    } else {
      // Standard Source Code File Execution/Grading Flow
      const runner = ExecutionServiceFactory.getRunner();
      try {
        logBus.emitStatus(executionId, "started");
        const testResults = [];
        let passedTests = 0;

        for (let i = 0; i < lab.testcases.length; i++) {
          const tc = lab.testcases[i];
          io.to(executionId).emit("execution:status", { executionId, status: "streaming", message: `Running testcase ${i+1}/${lab.testcases.length}` });

          const execResult = await runner.executeSubmit(code, tc.input, profile, executionId);

          const actualOutput = (execResult.stdout || "").trim();
          const expectedOutput = tc.expectedOutput.trim();
          const passed = actualOutput === expectedOutput && execResult.exitCode === 0;
          if (passed) passedTests++;

          testResults.push({
            index: i + 1,
            input: tc.input,
            expectedOutput,
            actualOutput,
            passed,
            executionTimeMs: execResult.executionTimeMs,
            stderr: execResult.stderr
          });
        }

        const score = Math.round((passedTests / lab.testcases.length) * 100);
        const finalResult = {
          status: "graded",
          mode: "submit",
          score,
          passedTests,
          totalTests: lab.testcases.length,
          testResults,
          uploadedFileName: req.file.originalname
        };

        submissionRecord.status = "finished";
        submissionRecord.result = finalResult;
        (submissionRecord as any).score = score;
        dbService.saveSubmission(submissionRecord);

        io.to(executionId).emit("execution:status", { executionId, status: "finished", payload: finalResult });
        console.log(`[Upload Submit] Graded ${req.file.originalname} for lab ${labId}: ${score}/100`);

      } catch (error: any) {
        console.error(`[Upload Grading Error] ${executionId}: ${error.message}`);
        io.to(executionId).emit("execution:status", { executionId, status: "failed", payload: { error: error.message } });
      }
    }
  })();
});

httpServer.listen(PORT, () => {
  console.log(`Backend is running on http://localhost:${PORT}`);
});
