import { ExecutionProfile, ExecutionResult } from "../models/types";

export interface ExecutionService {
  executeRun(code: string, profile: ExecutionProfile, executionId: string, stdin?: string): Promise<ExecutionResult>;
  executeSubmit(code: string, input: string, profile: ExecutionProfile, executionId: string): Promise<ExecutionResult>;
}
