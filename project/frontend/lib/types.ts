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

// Student workflow status for labs
export type LabStatus = 'not_started' | 'in_progress' | 'submitted' | 'needs_revision' | 'completed' | 'overdue';

export interface Lab {
  id: string;
  title: string;
  statement: string;
  profileId: string;
  environmentType: 'single_runtime' | 'single_machine' | 'multi_node';
  toolset?: string[];
  examples?: {
    input: string;
    output: string;
  }[];
  // Student workflow fields
  subjectId?: string;
  subjectTitle?: string;
  dueDate?: string;
  status?: LabStatus;
  progress?: number; // 0-100
  lastEditedAt?: string;
  attemptsCount?: number;
  bestScore?: number;
  maxScore?: number;
  canResubmit?: boolean;
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

// Renamed from SubmissionRecord to Attempt for student-friendly language
export interface Attempt {
  id: string;
  lab_id: string;
  profile_id: string;
  mode: 'run' | 'submit';
  code: string;
  language: string;
  status: 'pending' | 'graded' | 'failed' | 'needs_revision';
  score?: number;
  result_json?: string;
  created_at: string;
  lab_title?: string;
  attemptNumber?: number;
  feedback?: string;
  canRetry?: boolean;
}

// Keep alias for backward compatibility
export type SubmissionRecord = Attempt;

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
