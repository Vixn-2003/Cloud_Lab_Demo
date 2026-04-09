import express from "express";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";
import { profiles, problems } from "./models/ProblemRegistry";
import { LocalProcessRunner } from "./services/LocalProcessRunner";
import { SubmissionRecord } from "./models/types";

const app = express();
app.use(cors());
app.use(express.json());

const runner = new LocalProcessRunner();
const PORT = process.env.PORT || 3001;

// In-memory submissions db
const submissions: Record<string, SubmissionRecord> = {};

// GET /problems/:id - for frontend to render problem description
app.get("/problems/:id", (req, res) => {
  const problem = problems[req.params.id];
  if (!problem) return res.status(404).json({ error: "Problem not found" });
  
  // Return without testcases data for security, though it's a demo
  res.json({
    id: problem.id,
    title: problem.title,
    statement: problem.statement,
    profileId: problem.profileId
  });
});

app.get("/profiles/:id", (req, res) => {
  const profile = profiles[req.params.id];
  if (!profile) return res.status(404).json({ error: "Profile not found" });
  // Skip returning the command functions, just configs
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
  const { code, profileId } = req.body;
  const profile = profiles[profileId];

  if (!profile) {
    return res.status(400).json({ error: "Invalid profile" });
  }

  const attemptId = uuidv4();
  const submissionRecord: SubmissionRecord = {
    id: attemptId,
    mode: "run",
    code,
    language: profile.language,
    profileId,
    createdAt: new Date().toISOString(),
    status: "running"
  };
  submissions[attemptId] = submissionRecord;

  try {
    const result = await runner.executeRun(code, profile);
    submissionRecord.status = "graded";
    submissionRecord.result = result;
    
    res.json({
      attemptId,
      status: submissionRecord.status,
      result
    });
  } catch (error: any) {
    submissionRecord.status = "error";
    res.status(500).json({ error: error.message });
  }
});

app.post("/submit", async (req, res) => {
  const { code, profileId, problemId } = req.body;
  const profile = profiles[profileId];
  const problem = problems[problemId];

  if (!profile || !problem) {
    return res.status(400).json({ error: "Invalid profile or problem" });
  }

  const attemptId = uuidv4();
  const submissionRecord: SubmissionRecord = {
    id: attemptId,
    mode: "submit",
    code,
    language: profile.language,
    profileId,
    createdAt: new Date().toISOString(),
    status: "running"
  };
  submissions[attemptId] = submissionRecord;

  try {
    const testResults = [];
    let passedTests = 0;

    for (let i = 0; i < problem.testcases.length; i++) {
      const tc = problem.testcases[i];
      const execResult = await runner.executeSubmit(code, tc.input, profile);
      
      const actualOutput = execResult.stdout.trim();
      const expectedOutput = tc.expectedOutput.trim();
      
      // Simple exact match grading strategy
      const passed = actualOutput === expectedOutput && execResult.exitCode === 0;
      if (passed) passedTests++;

      testResults.push({
        index: i + 1,
        input: tc.input,
        expectedOutput,
        actualOutput,
        passed,
        executionTimeMs: execResult.executionTimeMs,
        stderr: execResult.stderr // capturing stderr for debugging
      });
    }

    const score = Math.round((passedTests / problem.testcases.length) * 100);

    const finalResult = {
      status: "graded",
      mode: "submit",
      score,
      passedTests,
      totalTests: problem.testcases.length,
      testResults
    };

    submissionRecord.status = "graded";
    submissionRecord.result = finalResult;

    res.json(finalResult);

  } catch (error: any) {
    submissionRecord.status = "error";
    res.status(500).json({ error: error.message });
  }
});

app.get("/submissions/:id", (req, res) => {
  const sub = submissions[req.params.id];
  if (!sub) return res.status(404).json({ error: "Not found "});
  res.json(sub);
});

app.listen(PORT, () => {
  console.log(`Backend is running on http://localhost:${PORT}`);
});
