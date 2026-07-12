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
import { AuthService } from "./services/AuthService";
import { authenticateToken, requireRole, AuthenticatedRequest } from "./middleware/auth";
import { PlagiarismService } from "./services/PlagiarismService";


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

  // Session rooms for real-time announcements & alerts
  socket.on("session:join", ({ sessionId, userId }) => {
    socket.join(`session:${sessionId}`);
    console.log(`[Socket] User ${userId} joined room: session:${sessionId}`);
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

// === AUTH ENDPOINTS ===
app.post("/auth/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Vui lòng điền đầy đủ tên đăng nhập và mật khẩu." });
  }

  const user = dbService.getUserByUsername(username);
  if (!user) {
    return res.status(401).json({ error: "Tên đăng nhập hoặc mật khẩu không chính xác." });
  }

  const hash = AuthService.hashPassword(password);
  if (user.password_hash !== hash) {
    return res.status(401).json({ error: "Tên đăng nhập hoặc mật khẩu không chính xác." });
  }

  // Generate Token
  const payload = {
    id: user.id,
    username: user.username,
    fullName: user.full_name,
    role: user.role,
    studentCode: user.student_code,
    email: user.email
  };
  const token = AuthService.generateToken(payload);

  res.json({
    token,
    user: payload
  });
});

app.post("/auth/logout", (req, res) => {
  res.json({ success: true, message: "Đăng xuất thành công." });
});

app.get("/auth/me", authenticateToken, (req: AuthenticatedRequest, res) => {
  res.json({ user: req.user });
});

// === SEMESTERS API ===
app.get("/semesters", authenticateToken, (req, res) => {
  res.json(dbService.getAllSemesters());
});

app.post("/semesters", authenticateToken, requireRole(["instructor", "admin"]), (req, res) => {
  const { name, startDate, endDate } = req.body;
  if (!name) return res.status(400).json({ error: "Thiếu tên học kỳ" });
  try {
    const sem = dbService.createSemester(name, startDate, endDate);
    res.status(201).json(sem);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// === CLASSES API ===
app.get("/classes", authenticateToken, (req, res) => {
  res.json(dbService.getAllClasses());
});

app.post("/classes", authenticateToken, requireRole(["instructor", "admin"]), (req, res) => {
  const { name, subjectId, semesterId } = req.body;
  if (!name || !subjectId || !semesterId) {
    return res.status(400).json({ error: "Thiếu thông tin lớp học" });
  }
  try {
    const cls = dbService.createClass(name, subjectId, semesterId);
    res.status(201).json(cls);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/classes/:id/members", authenticateToken, (req, res) => {
  res.json(dbService.getClassMembers(req.params.id as string));
});

app.post("/classes/:id/members", authenticateToken, requireRole(["instructor", "admin"]), (req, res) => {
  const { userId, roleInClass } = req.body;
  if (!userId || !roleInClass) return res.status(400).json({ error: "Thiếu thông tin thành viên" });
  try {
    dbService.addClassMember(req.params.id as string, userId, roleInClass);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// === SESSIONS API ===
app.get("/sessions", authenticateToken, (req: AuthenticatedRequest, res) => {
  res.json(dbService.getAllSessions(req.user?.id, req.user?.role));
});

app.get("/sessions/active", authenticateToken, (req: AuthenticatedRequest, res) => {
  if (!req.user || req.user.role !== "student") {
    return res.json(null);
  }
  res.json(dbService.getActiveSessionForStudent(req.user.id));
});

app.get("/sessions/:id", authenticateToken, (req, res) => {
  const session = dbService.getSessionById(req.params.id as string);
  if (!session) return res.status(404).json({ error: "Không tìm thấy ca thực hành" });
  res.json(session);
});

app.post("/sessions", authenticateToken, requireRole(["instructor", "admin"]), (req: AuthenticatedRequest, res) => {
  const { name, bannerUrl, location, classId, startTime, endTime, allowBrowser, freezeBeforeEndMinutes, penaltyMinutesPerWrongSubmit, submissionMode, labIds, participants, instructors } = req.body;
  
  if (!name || !classId || !startTime || !endTime) {
    return res.status(400).json({ error: "Thiếu thông tin cấu hình ca thực hành" });
  }

  try {
    const session = dbService.createSession(
      name,
      bannerUrl || null,
      location || null,
      classId,
      startTime,
      endTime,
      !!allowBrowser,
      Number(freezeBeforeEndMinutes) || 0,
      Number(penaltyMinutesPerWrongSubmit) || 0,
      submissionMode || "auto",
      req.user?.id || "",
      labIds || [],
      participants || [],
      instructors || []
    );
    res.status(201).json(session);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/sessions/:id", authenticateToken, requireRole(["instructor", "admin"]), (req, res) => {
  const { id } = req.params;
  const { name, bannerUrl, location, classId, startTime, endTime, status, allowBrowser, freezeBeforeEndMinutes, penaltyMinutesPerWrongSubmit, submissionMode, labIds, participants, instructors } = req.body;

  if (!name || !classId || !startTime || !endTime || !status) {
    return res.status(400).json({ error: "Thiếu thông tin cập nhật ca thực hành" });
  }

  try {
    dbService.updateSession(
      id as string,
      name,
      bannerUrl || null,
      location || null,
      classId,
      startTime,
      endTime,
      status,
      !!allowBrowser,
      Number(freezeBeforeEndMinutes) || 0,
      Number(penaltyMinutesPerWrongSubmit) || 0,
      submissionMode || "auto",
      labIds || [],
      participants || [],
      instructors || []
    );
    res.json({ success: true, message: "Cập nhật ca thực hành thành công" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/sessions/:id", authenticateToken, requireRole(["instructor", "admin"]), (req, res) => {
  try {
    dbService.deleteSession(req.params.id as string);
    res.json({ success: true, message: "Xóa ca thực hành thành công" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/sessions/:id/import", authenticateToken, requireRole(["instructor", "admin"]), (req, res) => {
  const { participants } = req.body;
  if (!Array.isArray(participants)) {
    return res.status(400).json({ error: "Danh sách sinh viên không hợp lệ" });
  }
  try {
    dbService.importSessionParticipants(req.params.id as string, participants);
    res.json({ success: true, message: `Đã import thành công ${participants.length} sinh viên.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// === SESSIONS MONITORING, GRADING & PLAGIARISM API ===
app.get("/sessions/:id/monitoring-data", authenticateToken, requireRole(["instructor", "admin"]), (req, res) => {
  try {
    const data = dbService.getSessionMonitoringData(req.params.id as string);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/sessions/:id/plagiarism/scan", authenticateToken, requireRole(["instructor", "admin"]), (req, res) => {
  try {
    const sessionId = req.params.id as string;
    const threshold = Number(req.body.threshold) || 0.7;
    const bestSubs = dbService.getBestSubmissionsForSession(sessionId);
    const cases = PlagiarismService.scanSessionSubmissions(sessionId, bestSubs, threshold);
    dbService.savePlagiarismCases(cases);
    io.to(`session:${sessionId}`).emit("session:plagiarism", { count: cases.length });
    res.json({ success: true, count: cases.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/sessions/:id/plagiarism/cases", authenticateToken, requireRole(["instructor", "admin"]), (req, res) => {
  try {
    const cases = dbService.getPlagiarismCases(req.params.id as string);
    res.json(cases);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/plagiarism/cases/:caseId", authenticateToken, requireRole(["instructor", "admin"]), (req, res) => {
  const { status } = req.body;
  if (!status || !['confirmed', 'dismissed'].includes(status)) {
    return res.status(400).json({ error: "Trạng thái không hợp lệ" });
  }
  try {
    dbService.updatePlagiarismCaseStatus(req.params.caseId as string, status);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/submissions/:id/grade", authenticateToken, requireRole(["instructor", "admin"]), (req: AuthenticatedRequest, res) => {
  const { score, comment } = req.body;
  if (score === undefined || score === null) {
    return res.status(400).json({ error: "Thiếu điểm số chấm thi" });
  }
  try {
    dbService.manualGradeSubmission(
      req.params.id as string,
      Number(score),
      comment || "",
      req.user?.id || ""
    );
    res.json({ success: true, message: "Chấm điểm thành công" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/sessions/:id/leaderboard", authenticateToken, (req: AuthenticatedRequest, res) => {
  try {
    const sessionId = req.params.id as string;
    let board = dbService.getSessionLeaderboard(sessionId);

    // Apply ICPC Freeze if student and freeze window is active
    const session = dbService.getSessionById(sessionId);
    if (session && req.user?.role === "student" && session.status === "active") {
      const nowTime = new Date().getTime();
      const endTime = new Date(session.end_time).getTime();
      const freezeTime = endTime - (session.freeze_before_end_minutes || 0) * 60 * 1000;
      
      if (nowTime >= freezeTime && nowTime <= endTime) {
        board = board.map(item => {
          const newItem = { ...item, labsDetail: { ...item.labsDetail } };
          let solvedAdjusted = 0;
          let penaltyAdjusted = 0;

          for (const labId of Object.keys(newItem.labsDetail)) {
            const detail = newItem.labsDetail[labId];
            if (detail.solved) {
              const sessionStart = new Date(session.start_time).getTime();
              const actualSolveTime = sessionStart + detail.time * 60 * 1000;
              if (actualSolveTime >= freezeTime) {
                newItem.labsDetail[labId] = {
                  solved: false,
                  attempts: detail.attempts,
                  time: 0,
                  penalty: 0,
                  isFrozen: true
                };
              } else {
                solvedAdjusted++;
                penaltyAdjusted += detail.penalty;
              }
            }
          }
          newItem.solvedCount = solvedAdjusted;
          newItem.totalPenalty = penaltyAdjusted;
          newItem.isFrozen = true;
          return newItem;
        });

        board.sort((a, b) => {
          if (b.solvedCount !== a.solvedCount) return b.solvedCount - a.solvedCount;
          return a.totalPenalty - b.totalPenalty;
        });
        board.forEach((item, index) => {
          item.rank = index + 1;
        });
      }
    }

    res.json(board);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// === MCQ & APPROVAL OPERATIONS API ===
app.get("/mcqs", authenticateToken, (req, res) => {
  try {
    const list = dbService.getAllMcqQuestions();
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/mcqs", authenticateToken, requireRole(["instructor", "admin"]), (req, res) => {
  const { subjectId, questionText, options, correctOption, explanation } = req.body;
  if (!subjectId || !questionText || !Array.isArray(options) || correctOption === undefined) {
    return res.status(400).json({ error: "Thiếu trường thông tin bắt buộc" });
  }
  try {
    const qId = uuidv4();
    dbService.createMcqQuestion({
      id: qId,
      subjectId,
      questionText,
      options,
      correctOption: Number(correctOption),
      explanation
    });
    res.status(201).json({ success: true, id: qId });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/sessions/:id/mcqs", authenticateToken, (req, res) => {
  try {
    const list = dbService.getSessionMcqQuestions(req.params.id as string);
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/sessions/:id/mcqs/assign", authenticateToken, requireRole(["instructor", "admin"]), (req, res) => {
  const { questionIds } = req.body;
  if (!Array.isArray(questionIds)) {
    return res.status(400).json({ error: "Danh sách câu hỏi không hợp lệ" });
  }
  try {
    dbService.assignMcqQuestionsToSession(req.params.id as string, questionIds);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/sessions/:id/mcqs/submit", authenticateToken, (req: AuthenticatedRequest, res) => {
  const { answers } = req.body;
  if (!Array.isArray(answers)) {
    return res.status(400).json({ error: "Đáp án không hợp lệ" });
  }
  try {
    const userId = req.user?.id || "";
    const sessionId = req.params.id as string;
    
    let correctCount = 0;
    for (const ans of answers) {
      const isCorrect = dbService.saveStudentMcqAnswer(sessionId, userId, ans.questionId, Number(ans.selectedOption));
      if (isCorrect) correctCount++;
    }
    
    res.json({ 
      success: true, 
      total: answers.length, 
      correct: correctCount, 
      score: answers.length ? Math.round((correctCount / answers.length) * 100) : 0 
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/sessions/:id/mcqs/answers", authenticateToken, (req: AuthenticatedRequest, res) => {
  try {
    const list = dbService.getStudentMcqAnswers(req.params.id as string, req.user?.id || "");
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/approvals", authenticateToken, requireRole(["admin"]), (req, res) => {
  try {
    const list = dbService.getApprovalRequests();
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/approvals", authenticateToken, requireRole(["instructor", "admin"]), (req: AuthenticatedRequest, res) => {
  const { labId } = req.body;
  if (!labId) {
    return res.status(400).json({ error: "Mã bài thực hành không hợp lệ" });
  }
  try {
    dbService.submitApprovalRequest(labId, req.user?.id || "");
    res.status(201).json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/approvals/:id", authenticateToken, requireRole(["admin"]), (req: AuthenticatedRequest, res) => {
  const { status, comments } = req.body;
  if (!status || !['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: "Trạng thái không hợp lệ" });
  }
  try {
    dbService.updateApprovalRequest(
      req.params.id as string,
      status,
      comments || "",
      req.user?.id || ""
    );
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// API to generate a session ID for the terminal
app.post("/terminal/init", authenticateToken, (req: AuthenticatedRequest, res) => {
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
    extension: profile.extension,
    timeoutMs: profile.timeoutMs,
    gradingStrategy: profile.gradingStrategy
  });
});

app.post("/run", authenticateToken, async (req: AuthenticatedRequest, res) => {
  const { code, profileId, stdin } = req.body;
  const profile = profiles[profileId];

  if (!profile) {
    return res.status(400).json({ error: "Invalid profile" });
  }

  const executionId = uuidv4();
  
  const clientIp = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "";
  const hostname = (req.headers["host"] as string) || req.hostname || "";

  const submissionRecord: SubmissionRecord = {
    id: executionId,
    mode: "run",
    code,
    language: profile.language,
    profileId,
    createdAt: new Date().toISOString(),
    status: "queued"
  };
  (submissionRecord as any).userId = req.user?.id || null;
  (submissionRecord as any).clientIp = clientIp;
  (submissionRecord as any).hostname = hostname;

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

app.post("/submit", authenticateToken, async (req: AuthenticatedRequest, res) => {
  const { code, profileId, labId, sessionId } = req.body;
  const profile = profiles[profileId];
  const lab = labs[labId];

  if (!profile || !lab) {
    return res.status(400).json({ error: "Invalid profile or lab" });
  }

  const executionId = uuidv4();
  
  const clientIp = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "";
  const hostname = (req.headers["host"] as string) || req.hostname || "";

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
  (submissionRecord as any).userId = req.user?.id || null;
  (submissionRecord as any).clientIp = clientIp;
  (submissionRecord as any).hostname = hostname;
  (submissionRecord as any).sessionId = sessionId || null;

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

app.get("/submissions", authenticateToken, (req, res) => {
  res.json(dbService.getAllSubmissions());
});

app.get("/submissions/:id", authenticateToken, (req, res) => {
  const sub = dbService.getSubmission(req.params.id as string);
  if (!sub) return res.status(404).json({ error: "Not found "});
  res.json(sub);
});

// POST /upload-submit — Upload a source code file or Labtainer ZIP for grading
// Body: multipart/form-data { file, profileId, labId }
app.post("/upload-submit", authenticateToken, upload.single("file"), async (req: any, res: any) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded. Send a file via the 'file' field." });
  }

  const { profileId, labId, sessionId } = req.body;
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
  
  const clientIp = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "";
  const hostname = (req.headers["host"] as string) || req.hostname || "";

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
  (submissionRecord as any).userId = req.user?.id || null;
  (submissionRecord as any).clientIp = clientIp;
  (submissionRecord as any).hostname = hostname;
  (submissionRecord as any).sessionId = sessionId || null;

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
