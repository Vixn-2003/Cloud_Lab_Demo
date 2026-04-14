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

export interface Faculty {
  id: string;
  title: string;
}

export interface Subject {
  id: string;
  title: string;
  facultyId: string;
}

export interface LabConfig {
  id: string;
  title: string;
  subjectId: string;
  profileId: string;
  environmentType: "single_runtime" | "single_machine" | "multi_node";
  toolset?: string[];
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
