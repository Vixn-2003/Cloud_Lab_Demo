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
  dockerImage?: string; // New: Image for DockerRunner
}

export type ExecutionStatus = "queued" | "started" | "streaming" | "finished" | "failed" | "timeout";

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  executionTimeMs: number;
  exitCode: number | null;
  status: ExecutionStatus;
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
  examples?: {
    input: string;
    output: string;
  }[];
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
  status: ExecutionStatus | "pending" | "running" | "graded" | "error"; // Integrated new states
  result?: any;
}
