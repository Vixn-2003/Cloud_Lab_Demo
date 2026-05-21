import { spawn } from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { v4 as uuidv4 } from "uuid";
import { ExecutionProfile, ExecutionStatus, ExecutionResult } from "../models/types";
import { ExecutionService } from "./ExecutionService";
import { logBus } from "./ExecutionLogBus";

export class DockerRunner implements ExecutionService {
  private createTempWorkspace(code: string, profile: ExecutionProfile): string {
    const tempDir = os.tmpdir();
    const sessionDir = path.join(tempDir, `docker_session_${uuidv4()}`);
    fs.mkdirSync(sessionDir, { recursive: true });
    
    const fileName = profile.id === "java_basic" ? "Main.java" : `runner${profile.extension}`;
    const filePath = path.join(sessionDir, fileName);
    fs.writeFileSync(filePath, code, "utf8");
    return sessionDir;
  }

  private async cleanup(sessionDir: string, containerName?: string) {
    if (containerName) {
      try {
        spawn("docker", ["rm", "-f", containerName]);
      } catch (e) {}
    }

    try {
      if (fs.existsSync(sessionDir)) {
        fs.rmSync(sessionDir, { recursive: true, force: true });
      }
    } catch (err: any) {
      // Background retry for Windows
      setTimeout(() => {
        try {
          if (fs.existsSync(sessionDir)) fs.rmSync(sessionDir, { recursive: true, force: true });
        } catch (e) {}
      }, 5000);
    }
  }

  private runContainer(
    commandArgs: string[],
    input: string | null,
    profile: ExecutionProfile,
    executionId: string,
    workspaceDir: string
  ): Promise<ExecutionResult> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const containerName = `lab_exec_${uuidv4().substring(0, 8)}`;
      
      logBus.emitStatus(executionId, "started");

      // Cross-platform path handling for Docker volumes
      // On Windows, /c/users/... format is preferred by Docker CLI sometimes, 
      // but absolute paths usually work in modern Docker Desktop.
      const hostPath = path.resolve(workspaceDir);
      
      const dockerArgs = [
        "run",
        "--rm",
        "--name", containerName,
        "-i", // Interactive for stdin
        "--network", profile.networkPolicy === "disabled" ? "none" : profile.networkPolicy,
        "--memory", "256m",
        "--cpus", "0.5",
        "-v", `${hostPath}:/workspace`,
        "-w", "/workspace",
        profile.dockerImage || "ubuntu:22.04"
      ];

      // Append the actual command to run inside the container
      // commandArgs[0] is the binary, we need to make sure the paths inside match /workspace
      const containerCmd = commandArgs.map(arg => {
        // If the arg is the full path to the file on host, replace it with relative path in container
        if (arg.includes(hostPath)) {
          return arg.replace(hostPath, "/workspace").replace(/\\/g, "/");
        }
        return arg;
      });

      const finalArgs = [...dockerArgs, ...containerCmd];

      const child = spawn("docker", finalArgs);

      let stdout = "";
      let stderr = "";

      const timeoutTimer = setTimeout(() => {
        spawn("docker", ["kill", containerName]);
        resolve({
          stdout,
          stderr: stderr + "\nError: Execution Timed Out.",
          executionTimeMs: Date.now() - startTime,
          exitCode: 124,
          status: "timeout"
        });
      }, profile.timeoutMs);

      child.on("error", (err) => {
        clearTimeout(timeoutTimer);
        resolve({
          stdout,
          stderr: stderr + `\nDocker Error: ${err.message}`,
          executionTimeMs: Date.now() - startTime,
          exitCode: -1,
          status: "failed"
        });
      });

      child.stdout.on("data", (data: any) => {
        const chunk = data.toString();
        stdout += chunk;
        logBus.emitLog(executionId, "stdout", chunk);
        logBus.emitStatus(executionId, "streaming");
      });

      child.stderr.on("data", (data: any) => {
        const chunk = data.toString();
        stderr += chunk;
        logBus.emitLog(executionId, "stderr", chunk);
        logBus.emitStatus(executionId, "streaming");
      });

      child.on("close", (code) => {
        clearTimeout(timeoutTimer);
        const result: ExecutionResult = {
          stdout,
          stderr,
          executionTimeMs: Date.now() - startTime,
          exitCode: code,
          status: code === 0 ? "finished" : "failed"
        };
        logBus.emitStatus(executionId, result.status, result);
        resolve(result);
      });

      if (input) {
        child.stdin.write(input);
        child.stdin.end();
      } else {
        child.stdin.end();
      }
    });
  }

  async executeRun(code: string, profile: ExecutionProfile, executionId: string, stdin?: string): Promise<ExecutionResult> {
    const workspaceDir = this.createTempWorkspace(code, profile);
    try {
      if (profile.buildCommand) {
        // Build inside container
        // We use a temporary file path that matches the container structure
        const fileName = profile.id === "java_basic" ? "Main.java" : `runner${profile.extension}`;
        const containerPath = `/workspace/${fileName}`;
        const buildCmd = profile.buildCommand(containerPath);
        
        const buildRes = await this.runContainer(buildCmd, null, profile, executionId, workspaceDir);
        if (buildRes.exitCode !== 0) return buildRes;
      }

      const fileName = profile.id === "java_basic" ? "Main.java" : `runner${profile.extension}`;
      const containerPath = `/workspace/${fileName}`;
      const runCmd = profile.runCommand(containerPath);
      return await this.runContainer(runCmd, stdin || null, profile, executionId, workspaceDir);
    } finally {
      await this.cleanup(workspaceDir);
    }
  }

  async executeSubmit(code: string, input: string, profile: ExecutionProfile, executionId: string): Promise<ExecutionResult> {
    const workspaceDir = this.createTempWorkspace(code, profile);
    try {
      if (profile.buildCommand) {
        const fileName = profile.id === "java_basic" ? "Main.java" : `runner${profile.extension}`;
        const buildCmd = profile.buildCommand(`/workspace/${fileName}`);
        const buildRes = await this.runContainer(buildCmd, null, profile, executionId, workspaceDir);
        if (buildRes.exitCode !== 0) return buildRes;
      }

      const fileName = profile.id === "java_basic" ? "Main.java" : `runner${profile.extension}`;
      const testCmd = profile.testCommand(`/workspace/${fileName}`);
      return await this.runContainer(testCmd, input, profile, executionId, workspaceDir);
    } finally {
      await this.cleanup(workspaceDir);
    }
  }
}
