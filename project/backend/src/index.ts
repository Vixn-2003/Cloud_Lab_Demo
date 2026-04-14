import express from "express";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";
import { profiles, faculties, subjects, labs } from "./models/ProblemRegistry";
import { LocalProcessRunner } from "./services/LocalProcessRunner";
import { SubmissionRecord } from "./models/types";
import { dbService } from "./services/DatabaseService";

const app = express();
app.use(cors());
app.use(express.json());

const runner = new LocalProcessRunner();
const PORT = process.env.PORT || 3001;

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
  console.log(`[POST /run] profileId=${profileId}`);
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

  try {
    const result = await runner.executeRun(code, profile, stdin);
    submissionRecord.status = "graded";
    submissionRecord.result = result;
    
    dbService.saveSubmission(submissionRecord);
    
    res.json({
      attemptId,
      status: submissionRecord.status,
      result
    });
  } catch (error: any) {
    console.error(`[POST /run] Error: ${error.message}`, error);
    submissionRecord.status = "error";
    res.status(500).json({ error: error.message });
  }
});

app.post("/submit", async (req, res) => {
  const { code, profileId, labId } = req.body;
  console.log(`[POST /submit] profileId=${profileId}, labId=${labId}`);
  const profile = profiles[profileId];
  const lab = labs[labId];

  if (!profile || !lab) {
    return res.status(400).json({ error: "Invalid profile or lab" });
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
  (submissionRecord as any).labId = labId; // Updated from problemId

  try {
    const testResults = [];
    let passedTests = 0;

    for (let i = 0; i < lab.testcases.length; i++) {
      const tc = lab.testcases[i];
      const execResult = await runner.executeSubmit(code, tc.input, profile);
      
      const actualOutput = execResult.stdout.trim();
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

    submissionRecord.status = "graded";
    submissionRecord.result = finalResult;

    dbService.saveSubmission(submissionRecord);

    res.json(finalResult);

  } catch (error: any) {
    console.error(`[POST /submit] Error: ${error.message}`, error);
    submissionRecord.status = "error";
    res.status(500).json({ error: error.message });
  }
});

app.get("/submissions", (req, res) => {
  res.json(dbService.getAllSubmissions());
});

app.get("/submissions/:id", (req, res) => {
  const sub = dbService.getSubmission(req.params.id);
  if (!sub) return res.status(404).json({ error: "Not found "});
  res.json(sub);
});

app.listen(PORT, () => {
  console.log(`Backend is running on http://localhost:${PORT}`);
});
