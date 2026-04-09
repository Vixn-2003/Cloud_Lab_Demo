import { spawn } from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { v4 as uuidv4 } from "uuid";
import { ExecutionProfile } from "../models/types";
import { ExecutionService, ExecutionResult } from "./ExecutionService";

export class LocalProcessRunner implements ExecutionService {
  private createTempFile(code: string, extension: string): string {
    const tempDir = os.tmpdir();
    const fileName = `runner_${uuidv4()}${extension}`;
    const filePath = path.join(tempDir, fileName);
    fs.writeFileSync(filePath, code, "utf8");
    return filePath;
  }

  private runProcess(
    commandArgs: string[],
    input: string | null,
    timeoutMs: number
  ): Promise<ExecutionResult> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const command = commandArgs[0];
      const args = commandArgs.slice(1);

      const child = spawn(command, args, { stdio: ["pipe", "pipe", "pipe"] });

      let stdout = "";
      let stderr = "";

      // Timeout handling
      const timeoutTimer = setTimeout(() => {
        child.kill();
        resolve({
          stdout,
          stderr: stderr + "\nError: Execution Timed Out.",
          executionTimeMs: Date.now() - startTime,
          exitCode: 124, // Timed out
        });
      }, timeoutMs);

      child.stdout.on("data", (data: any) => {
        stdout += data.toString();
      });

      child.stderr.on("data", (data: any) => {
        stderr += data.toString();
      });

      child.on("close", (code: number | null) => {
        clearTimeout(timeoutTimer);
        resolve({
          stdout,
          stderr,
          executionTimeMs: Date.now() - startTime,
          exitCode: code,
        });
      });

      if (input) {
        child.stdin.write(input);
        child.stdin.end();
      } else {
        child.stdin.end();
      }
    });
  }

  async executeRun(code: string, profile: ExecutionProfile): Promise<ExecutionResult> {
    const filePath = this.createTempFile(code, profile.extension);
    try {
      // Ignore build step for simplicity in python run
      const command = profile.runCommand(filePath);
      return await this.runProcess(command, null, profile.timeoutMs);
    } finally {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  }

  async executeSubmit(code: string, input: string, profile: ExecutionProfile): Promise<ExecutionResult> {
    const filePath = this.createTempFile(code, profile.extension);
    try {
      const command = profile.testCommand(filePath);
      return await this.runProcess(command, input, profile.timeoutMs);
    } finally {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  }
}
