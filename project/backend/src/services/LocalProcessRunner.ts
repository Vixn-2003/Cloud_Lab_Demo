import { spawn } from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { v4 as uuidv4 } from "uuid";
import { ExecutionProfile } from "../models/types";
import { ExecutionService, ExecutionResult } from "./ExecutionService";

export class LocalProcessRunner implements ExecutionService {
  private createTempFile(code: string, profile: ExecutionProfile): string {
    const tempDir = os.tmpdir();
    // Special handling for Java: filename must be Main.java if we expect public class Main
    const fileName = profile.id === "java_basic" 
      ? `Main_${uuidv4().substring(0, 8)}.java` // Keeping it somewhat unique
      : `runner_${uuidv4()}${profile.extension}`;
    
    // Actually, for Java, if we use javac, it's better to create a clean subdir
    const sessionDir = path.join(tempDir, `session_${uuidv4()}`);
    fs.mkdirSync(sessionDir, { recursive: true });
    
    const filePath = path.join(sessionDir, profile.id === "java_basic" ? "Main.java" : fileName);
    fs.writeFileSync(filePath, code, "utf8");
    return filePath;
  }

  private runProcess(
    commandArgs: string[],
    input: string | null,
    timeoutMs: number,
    cwd?: string
  ): Promise<ExecutionResult> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const command = commandArgs[0];
      const args = commandArgs.slice(1);

      const child = spawn(command, args, { 
        stdio: ["pipe", "pipe", "pipe"],
        cwd: cwd || os.tmpdir()
      });

      let stdout = "";
      let stderr = "";

      const timeoutTimer = setTimeout(() => {
        child.kill();
        resolve({
          stdout,
          stderr: stderr + "\nError: Execution Timed Out.",
          executionTimeMs: Date.now() - startTime,
          exitCode: 124,
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

  async executeRun(code: string, profile: ExecutionProfile, stdin?: string): Promise<ExecutionResult> {
    const filePath = this.createTempFile(code, profile);
    const sessionDir = path.dirname(filePath);
    try {
      // Build Step
      if (profile.buildCommand) {
        const buildCmd = profile.buildCommand(filePath);
        const buildRes = await this.runProcess(buildCmd, null, 10000, sessionDir);
        if (buildRes.exitCode !== 0) {
          return {
            stdout: "",
            stderr: "Build Error:\n" + buildRes.stderr,
            executionTimeMs: buildRes.executionTimeMs,
            exitCode: buildRes.exitCode
          };
        }
      }

      // Run Step
      const command = profile.runCommand(filePath);
      return await this.runProcess(command, stdin || null, profile.timeoutMs, sessionDir);
    } finally {
      // Cleanup session dir
      try {
        if (fs.existsSync(sessionDir)) {
          fs.rmSync(sessionDir, { recursive: true, force: true });
        }
      } catch (e) {}
    }
  }

  async executeSubmit(code: string, input: string, profile: ExecutionProfile): Promise<ExecutionResult> {
    const filePath = this.createTempFile(code, profile);
    const sessionDir = path.dirname(filePath);
    try {
      // Build Step
      if (profile.buildCommand) {
        const buildCmd = profile.buildCommand(filePath);
        const buildRes = await this.runProcess(buildCmd, null, 10000, sessionDir);
        if (buildRes.exitCode !== 0) {
          return {
            stdout: "",
            stderr: "Build Error:\n" + buildRes.stderr,
            executionTimeMs: buildRes.executionTimeMs,
            exitCode: buildRes.exitCode
          };
        }
      }

      const command = profile.testCommand(filePath);
      return await this.runProcess(command, input, profile.timeoutMs, sessionDir);
    } finally {
      try {
        if (fs.existsSync(sessionDir)) {
          fs.rmSync(sessionDir, { recursive: true, force: true });
        }
      } catch (e) {}
    }
  }
}
