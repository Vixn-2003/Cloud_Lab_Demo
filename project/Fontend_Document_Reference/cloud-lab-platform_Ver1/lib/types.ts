// === Domain Entities ===

export interface Faculty {
  id: string;
  title: string;
}

export interface Subject {
  id: string;
  title: string;
  facultyId: string;
}

export interface LabSummary {
  id: string;
  title: string;
  subjectId: string;
  profileId: string;
}

export interface Lab {
  id: string;
  title: string;
  statement: string;
  profileId: string;
  environmentType: 'single_runtime' | 'single_machine' | 'multi_node';
  toolset?: string[];
}

export interface ExecutionProfile {
  id: string;
  displayName: string;
  osFamily: string;
  language: string;
  version: string;
  timeoutMs: number;
  gradingStrategy: string;
  extension?: string;
}

export interface SubmissionRecord {
  id: string;
  lab_id: string;
  profile_id: string;
  mode: 'run' | 'submit';
  code: string;
  language: string;
  status: string;
  score?: number;
  result_json?: string;
  created_at: string;
  lab_title?: string;
}

export type ExecutionStatus = 'queued' | 'started' | 'streaming' | 'finished' | 'failed' | 'timeout';

// === UI State ===

export interface ExecutionLog {
  stream: 'stdout' | 'stderr';
  data: string;
  timestamp?: number;
}

export interface GradingResult {
  status: string;
  mode: string;
  score: number;
  passedTests: number;
  totalTests: number;
  testResults: TestCaseResult[];
}

export interface TestCaseResult {
  index: number;
  input: string;
  expectedOutput: string;
  actualOutput: string;
  stderr?: string;
  passed: boolean;
}

// === API Response Types ===

export interface RunResponse {
  executionId: string;
}

export interface SubmitResponse {
  executionId: string;
}

export interface TerminalInitResponse {
  sessionId: string;
}

// === Filter/Search State ===

export interface LabFilters {
  facultyId?: string;
  subjectId?: string;
  envType?: Lab['environmentType'];
  language?: string;
  q?: string;
  page?: number;
}

export interface SubmissionFilters {
  q?: string;
  status?: string;
  language?: string;
  sort?: 'date_desc' | 'date_asc' | 'score_desc' | 'score_asc';
  page?: number;
}

// === Dashboard Stats ===

export interface DashboardStats {
  totalLabs: number;
  completedLabs: number;
  averageScore: number;
  totalSubmissions: number;
}
