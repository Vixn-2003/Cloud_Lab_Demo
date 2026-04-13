import { ExecutionProfile } from "../models/types";

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  executionTimeMs: number;
  exitCode: number | null;
}

export interface ExecutionService {
  executeRun(code: string, profile: ExecutionProfile, stdin?: string): Promise<ExecutionResult>;
  executeSubmit(code: string, input: string, profile: ExecutionProfile): Promise<ExecutionResult>;
}
