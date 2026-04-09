export interface ExecutionProfile {
  id: string;
  displayName: string;
  osFamily: string;
  language: string;
  version: string;
  extension: string;
  buildCommand: ((filePath: string) => string[]) | null;
  runCommand: (filePath: string) => string[];
  testCommand: (filePath: string) => string[];
  timeoutMs: number;
  resourceLimits: {
    maxOutputBytes: number;
  };
  networkPolicy: string;
  gradingStrategy: string;
}

export interface ProblemConfig {
  id: string;
  title: string;
  profileId: string;
  statement: string;
  testcases: {
    input: string;
    expectedOutput: string;
  }[];
}

export interface SubmissionRecord {
  id: string;
  mode: "run" | "submit";
  code: string;
  language: string;
  profileId: string;
  createdAt: string;
  status: "pending" | "running" | "graded" | "error";
  result?: any;
}
