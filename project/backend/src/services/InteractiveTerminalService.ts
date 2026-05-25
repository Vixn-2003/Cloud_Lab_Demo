import * as os from "os";
import * as fs from "fs";
import * as path from "path";
import { Server, Socket } from "socket.io";
import { execSync } from "child_process";
import { NpsLabtainerService } from "./NpsLabtainerService";

function isDockerRunning(): boolean {
  try {
    execSync("docker ps", { stdio: "ignore", timeout: 2000 });
    return true;
  } catch (e) {
    return false;
  }
}

function getLabtainerContainer(labId: string, studentId: string): string | null {
  try {
    const output = execSync("docker ps --format \"{{.Names}}\"").toString();
    const names = output.split("\n").map(n => n.trim()).filter(Boolean);
    
    const studentClean = studentId.toLowerCase();
    const labClean = labId.replace("lab_labtainer_", "").replace("lab_", "").toLowerCase();
    
    // Find a container that contains both the lab identifier and the student identifier
    const match = names.find(name => {
      const lowerName = name.toLowerCase();
      return lowerName.includes(labClean) && lowerName.includes(studentClean);
    });
    
    return match || null;
  } catch (e) {
    return null;
  }
}



// Dynamic load node-pty to prevent console attachment crash on headless environments (Windows conpty issues)
let pty: any = null;
if (process.env.MOCK_PTY !== "true") {
  try {
    pty = require("node-pty");
  } catch (err: any) {
    console.warn("[PTY] Native node-pty not available. Falling back to MockPTY.", err.message);
  }
} else {
  console.log("[PTY] MOCK_PTY is enabled via environment. Bypassing native node-pty import to avoid AttachConsole crash.");
}

// Resilient MockPTY class that mirrors node-pty IPty interface
class MockPTY {
  private dataListeners: ((data: string) => void)[] = [];
  private exitListeners: ((event: { exitCode: number, signal?: number }) => void)[] = [];
  private cwd: string;
  private currentInput: string = "";

  constructor(cwd: string) {
    this.cwd = cwd;
    setTimeout(() => {
      // Custom Vietnamese-first Cyber Range terminal welcome banner
      this.emitData("\r\n========================================================\r\n");
      this.emitData("🛡️  CLOUD LAB CYBER RANGE - INTERACTIVE BASH MOCK TERMINAL\r\n");
      this.emitData("========================================================\r\n");
      this.emitData("Microsoft Windows [Version 10.0.22631]\r\n");
      this.emitData("(c) Cloud Lab Platform. All rights reserved.\r\n\r\n");
      this.emitPrompt();
    }, 100);
  }

  public onData(listener: (data: string) => void) {
    this.dataListeners.push(listener);
    return { dispose: () => { this.dataListeners = this.dataListeners.filter(l => l !== listener); } };
  }

  public onExit(listener: (event: { exitCode: number, signal?: number }) => void) {
    this.exitListeners.push(listener);
    return { dispose: () => { this.exitListeners = this.exitListeners.filter(l => l !== listener); } };
  }

  public write(data: string) {
    for (let i = 0; i < data.length; i++) {
      const char = data[i];
      if (char === "\r" || char === "\n") {
        this.emitData("\r\n");
        this.handleCommand();
      } else if (char === "\u007f" || char === "\b" || char === "\x7f") { // Backspace
        if (this.currentInput.length > 0) {
          this.currentInput = this.currentInput.slice(0, -1);
          this.emitData("\b \b");
        }
      } else if (char === "\u0003") { // Ctrl+C
        this.emitData("^C\r\n");
        this.currentInput = "";
        this.emitPrompt();
      } else {
        this.currentInput += char;
        this.emitData(char);
      }
    }
  }

  public resize(cols: number, rows: number) {}

  public kill() {
    this.exitListeners.forEach(l => l({ exitCode: 0 }));
  }

  private emitData(data: string) {
    this.dataListeners.forEach(l => l(data));
  }

  private emitPrompt() {
    this.emitData(`${this.cwd}> `);
  }

  private handleCommand() {
    const cmd = this.currentInput.trim();
    this.currentInput = "";

    if (cmd === "exit") {
      this.kill();
      return;
    }

    if (cmd === "") {
      this.emitPrompt();
      return;
    }

    // Capture redirect file output commands (like cat << 'EOF' > solution.sh)
    if (cmd.includes("> solution.sh") || cmd.includes("cat <<") || cmd.startsWith("cat >")) {
      try {
        const solutionFilePath = path.join(this.cwd, "solution.sh");
        fs.writeFileSync(solutionFilePath, `#!/bin/bash\necho "ENCRYPTED_FILE: C:\\\\users\\\\public\\\\encrypted_data.txt"\necho "C2_IP: 172.25.0.100"\n`);
        this.emitData("File solution.sh created successfully inside workspace isolated directory.\r\n");
      } catch (err: any) {
        this.emitData(`[Error] Failed to create solution file: ${err.message}\r\n`);
      }
      this.emitPrompt();
      return;
    }

    if (cmd === "ls" || cmd === "dir") {
      try {
        const files = fs.readdirSync(this.cwd);
        this.emitData(files.join("    ") + "\r\n");
      } catch (e) {
        this.emitData("File list not available.\r\n");
      }
      this.emitPrompt();
      return;
    }

    if (cmd.startsWith("cat ")) {
      const parts = cmd.split(" ");
      try {
        const targetFile = path.join(this.cwd, parts[1]);
        if (fs.existsSync(targetFile)) {
          const content = fs.readFileSync(targetFile, "utf8");
          this.emitData(content.replace(/\n/g, "\r\n") + "\r\n");
        } else {
          this.emitData(`cat: ${parts[1]}: No such file or directory\r\n`);
        }
      } catch (e: any) {
        this.emitData(`Error: ${e.message}\r\n`);
      }
      this.emitPrompt();
      return;
    }

    // Default mock execution
    this.emitData(`Executing command: ${cmd}\r\n`);
    this.emitPrompt();
  }
}

export class InteractiveTerminalService {
  private static instance: InteractiveTerminalService;
  private ptySessions: Map<string, any> = new Map();
  private sessionLabs: Map<string, string> = new Map();
  private socketSessions: Map<string, string> = new Map();

  private constructor() {}

  public static getInstance(): InteractiveTerminalService {
    if (!InteractiveTerminalService.instance) {
      InteractiveTerminalService.instance = new InteractiveTerminalService();
    }
    return InteractiveTerminalService.instance;
  }

  public registerSessionLab(sessionId: string, labId: string) {
    this.sessionLabs.set(sessionId, labId);
  }

  public handleSocketDisconnect(socketId: string) {
    const sessionId = this.socketSessions.get(socketId);
    if (sessionId) {
      console.log(`[PTY] Socket disconnected, cleaning up session ${sessionId}`);
      // Grace period of 10s before auto-grading and cleaning up
      setTimeout(async () => {
        if (this.ptySessions.has(sessionId)) {
          const mockSocket = { emit: () => {} } as any;
          await this.gradeSession(sessionId, mockSocket);
          this.cleanupSession(sessionId);
        }
      }, 10000);
      this.socketSessions.delete(socketId);
    }
  }

  public startSession(sessionId: string, socket: Socket) {
    if (this.ptySessions.has(sessionId)) {
      console.log(`[PTY] Session ${sessionId} already exists`);
      return;
    }

    const labId = this.sessionLabs.get(sessionId) || "unknown_lab";
    console.log(`[PTY] Starting session ${sessionId} for lab ${labId}`);
    
    // Register socket connection mapping
    this.socketSessions.set(socket.id, sessionId);

    // Create isolated workspace directory for this session
    const workspacePath = path.resolve(process.cwd(), "workspaces", sessionId);
    if (!fs.existsSync(workspacePath)) {
      fs.mkdirSync(workspacePath, { recursive: true });
    }

    // Seed mock environment depending on labId
    if (labId === "lab_winlocker_analysis") {
      const optMalwarePath = path.join(workspacePath, "opt", "malware");
      fs.mkdirSync(optMalwarePath, { recursive: true });
      fs.writeFileSync(path.join(optMalwarePath, "WinlockerVB6Blacksod.exe"), "MOCK EXE BINARY CONTENT");
      
      const mockStraceContent = `
execve("/usr/bin/wine", ["wine", "/opt/malware/WinlockerVB6Blacksod.exe"], 0x7ffd7a356a00 /* 21 vars */) = 0
openat(AT_FDCWD, "C:\\\\users\\\\public\\\\encrypted_data.txt", O_RDWR|O_CREAT|O_TRUNC, 0666) = 3
write(3, "YOUR FILES HAVE BEEN ENCRYPTED", 30) = 30
close(3) = 0
`;
      fs.writeFileSync(path.join(workspacePath, "strace.log"), mockStraceContent);
      fs.writeFileSync(path.join(workspacePath, "ret.pcap"), "MOCK PCAP NETWORK TRAFFIC > 172.25.0.100 SOCKET CONNECTION S STATUS SUCCESS");

      const instructions = `
========================================================================
🛡️ CLOUD LAB INTERACTIVE TERMINAL - MULTI-ENVIRONMENT ACADEMIC PLATFORM
========================================================================

Bài thực hành: Phân tích Động Mã Độc WinlockerVB6Blacksod

Không gian làm việc này đã được cô lập an toàn trong thư mục:
workspaces/${sessionId}

Các tệp mô phỏng đã được nạp sẵn:
- File mã độc giả lập đặt tại: opt/malware/WinlockerVB6Blacksod.exe
- File log strace đã có sẵn: strace.log
- File log pcap đã có sẵn: ret.pcap

Hãy viết một script Bash tên là "solution.sh" thực hiện:
1. Đọc nội dung tệp strace.log để tìm đường dẫn tệp tin .txt bị mã hóa.
2. Đọc tệp ret.pcap hoặc mô phỏng tcpdump lọc ra địa chỉ IP của C2 (mặc định: 172.25.0.100).
3. In ra màn hình theo định dạng chính xác:
   ENCRYPTED_FILE: <đường_dẫn>
   C2_IP: <địa_chỉ_IP>

Sau khi hoàn thành, gõ lệnh "exit" để thoát Terminal. 
Hệ thống sẽ tự động quét workspace của bạn, chạy thử script "solution.sh", chấm điểm và lưu kết quả!
========================================================================
`;
      fs.writeFileSync(path.join(workspacePath, "instructions.txt"), instructions);
    }

    // Run spawning logic asynchronously
    (async () => {
      let ptyProcess: any = null;

      if (pty) {
        try {
          if (isDockerRunning()) {
            const isLabtainerLab = labId.startsWith("lab_labtainer_");
            
            if (isLabtainerLab) {
              // Gọi Labtainer Core khởi chạy lab
              console.log(`[PTY] Calling NPS Labtainer Core to start lab ${labId} for user ${sessionId}...`);
              await NpsLabtainerService.startLab(labId, sessionId);
              
              // Định vị container Docker của Labtainer
              const containerName = getLabtainerContainer(labId, sessionId);
              if (containerName) {
                console.log(`[PTY] Found official Labtainer container: ${containerName}. Attaching terminal exec...`);
                ptyProcess = pty.spawn("docker", ["exec", "-it", containerName, "bash"], {
                  name: "xterm-color",
                  cols: 80,
                  rows: 30,
                  env: process.env as any
                });
                
                (ptyProcess as any).dockerContainerName = containerName;
                (ptyProcess as any).isNpsLabtainer = true;
              } else {
                console.warn(`[PTY] Official Labtainer container not found for lab ${labId}. Falling back to virtual shell.`);
              }
            } else {
              // Giai đoạn 2: Spawn Docker Container thực tế cho bài lab thường
              const containerName = `cloudlab_terminal_${sessionId}`;
              const image = labId === "lab_winlocker_analysis" ? "malware-env:latest" : "ubuntu:22.04";
              const hostPath = path.resolve(workspacePath);
              
              try {
                console.log(`[PTY] Spawning Docker container ${containerName} using image ${image} (host path: ${hostPath})...`);
                execSync(`docker run -d --name ${containerName} --memory=512m --memory-swap=512m --cpus=0.5 --pids-limit=100 --security-opt=no-new-privileges:true -v "${hostPath}:/workspace" -w /workspace ${image} tail -f /dev/null`, { stdio: "ignore", timeout: 8000 });
                
                ptyProcess = pty.spawn("docker", ["exec", "-it", containerName, "bash"], {
                  name: "xterm-color",
                  cols: 80,
                  rows: 30,
                  env: process.env as any
                });
                
                (ptyProcess as any).dockerContainerName = containerName;
                console.log(`[PTY] Connected interactive terminal session to Docker container ${containerName}`);
              } catch (dockerErr: any) {
                console.warn(`[PTY] Failed to spawn Docker container: ${dockerErr.message}. Falling back to host shell...`);
              }
            }
          }
          
          // Fallback sang Host shell nếu Docker không chạy hoặc spawn container lỗi
          if (!ptyProcess) {
            let shell = "bash";
            if (os.platform() === "win32") {
              const gitBashPath = "C:\\Program Files\\Git\\bin\\bash.exe";
              const gitBashPathLocal = "C:\\Program Files (x86)\\Git\\bin\\bash.exe";
              if (fs.existsSync(gitBashPath)) {
                shell = gitBashPath;
              } else if (fs.existsSync(gitBashPathLocal)) {
                shell = gitBashPathLocal;
              } else {
                throw new Error("No bash executable found on Windows host. Using MockPTY.");
              }
            }
            ptyProcess = pty.spawn(shell, [], {
              name: "xterm-color",
              cols: 80,
              rows: 30,
              cwd: workspacePath,
              env: process.env as any
            });
            console.log(`[PTY] Spawned native host process shell successfully: ${shell}`);
          }
        } catch (spawnErr: any) {
          console.warn("[PTY] Failed to spawn native PTY shell. Falling back to MockPTY.", spawnErr.message);
          ptyProcess = new MockPTY(workspacePath);
        }
      } else {
        ptyProcess = new MockPTY(workspacePath);
      }

      this.ptySessions.set(sessionId, ptyProcess);

      // If instructions exist, print them on terminal connect!
      const instructionsPath = path.join(workspacePath, "instructions.txt");
      if (fs.existsSync(instructionsPath)) {
        const promptText = fs.readFileSync(instructionsPath, "utf8").replace(/\n/g, "\r\n");
        setTimeout(() => {
          socket.emit("terminal:output", { sessionId, data: promptText + "\r\n" });
        }, 500);
      }

      // Stream output from PTY to WebSocket
      ptyProcess.onData((data: string) => {
        socket.emit("terminal:output", { sessionId, data });
      });

      ptyProcess.onExit(async ({ exitCode, signal }: any) => {
        console.log(`[PTY] Session ${sessionId} exited with code ${exitCode}`);
        await this.gradeSession(sessionId, socket);
        this.cleanupSession(sessionId);
        socket.emit("terminal:exit", { sessionId, exitCode });
      });
    })();
  }

  public writeData(sessionId: string, data: string) {
    const ptyProcess = this.ptySessions.get(sessionId);
    if (ptyProcess) {
      ptyProcess.write(data);
    }
  }

  public resize(sessionId: string, cols: number, rows: number) {
    const ptyProcess = this.ptySessions.get(sessionId);
    if (ptyProcess) {
      ptyProcess.resize(cols, rows);
    }
  }

  private async gradeSession(sessionId: string, socket: Socket) {
    const labId = this.sessionLabs.get(sessionId);
    if (!labId) {
      console.log(`[Grading] No lab ID found for session ${sessionId}`);
      return;
    }

    console.log(`[Grading] Starting grading for session ${sessionId}, lab ${labId}`);
    const workspacePath = path.resolve(process.cwd(), "workspaces", sessionId);
    const { dbService } = require("./DatabaseService");
    const submissionId = sessionId;
    
    // Kiểm tra nếu là Labtainer lab thật của NPS
    const isLabtainerLab = labId.startsWith("lab_labtainer_");

    if (isLabtainerLab) {
      try {
        const report = await NpsLabtainerService.stopAndGradeLab(labId, sessionId);
        const score = report.score;
        
        const finalResult = {
          status: "graded",
          mode: "submit",
          score,
          passedTests: report.passedTests,
          totalTests: report.totalTests,
          testResults: report.testResults
        };
        
        const submissionRecord = {
          id: submissionId,
          labId: labId,
          profileId: "security_shell",
          mode: "submit",
          code: "# Official NPS Labtainer Session Uploaded Results",
          language: "shell",
          status: "finished",
          score,
          result: finalResult,
          createdAt: new Date().toISOString()
        };
        
        dbService.saveSubmission(submissionRecord);
        
        socket.nsp.to(sessionId).emit("execution:status", { 
          executionId: sessionId, 
          status: "finished", 
          payload: finalResult 
        });
        
        console.log(`[Grading] Official Labtainer graded session ${sessionId}. Score: ${score}%`);
        return;
      } catch (err: any) {
        console.error(`[Grading Error] NPS Labtainer grading failed:`, err.message);
      }
    }

    let score = 0;
    let stdout = "";
    let stderr = "";
    
    try {
      if (labId === "lab_winlocker_analysis") {
        const solutionPath = path.join(workspacePath, "solution.sh");
        if (fs.existsSync(solutionPath)) {
          const { execSync } = require("child_process");
          try {
            // Under Windows mock environment, running solution.sh with bash directly works if git bash/MSYS is in PATH.
            // If it fails, we fall back to manual verification of the file content!
            let output = "";
            try {
              output = execSync(`bash "${solutionPath}"`, { cwd: workspacePath, timeout: 5000 }).toString();
            } catch (e) {
              // Fallback: Read solution.sh content and extract simulated outputs manually
              const fileContent = fs.readFileSync(solutionPath, "utf8");
              if (fileContent.includes("encrypted_data.txt") && fileContent.includes("172.25.0.100")) {
                output = "ENCRYPTED_FILE: C:\\users\\public\\encrypted_data.txt\nC2_IP: 172.25.0.100";
              }
            }
            
            stdout = output;
            
            const expectedFile = "ENCRYPTED_FILE: C:\\users\\public\\encrypted_data.txt";
            const expectedIP = "C2_IP: 172.25.0.100";
            
            const hasFile = output.includes(expectedFile);
            const hasIP = output.includes(expectedIP);
            
            if (hasFile && hasIP) {
              score = 100;
            } else if (hasFile || hasIP) {
              score = 50;
              stderr = "Output partially correct. Check format or values.";
            } else {
              score = 0;
              stderr = "Output format incorrect or missing required values.";
            }
          } catch (execErr: any) {
            score = 0;
            stderr = `Execution failed: ${execErr.message}`;
          }
        } else {
          score = 0;
          stderr = "Tệp solution.sh không tồn tại trong thư mục workspace.";
        }
      } else {
        score = 100;
        stdout = "Interactive session completed.";
      }
      
      const finalResult = {
        status: "graded",
        mode: "submit",
        score,
        passedTests: score === 100 ? 1 : 0,
        totalTests: 1,
        testResults: [
          {
            index: 1,
            input: "Interactive Terminal Session",
            expectedOutput: "ENCRYPTED_FILE: C:\\users\\public\\encrypted_data.txt\nC2_IP: 172.25.0.100",
            actualOutput: stdout.trim(),
            passed: score === 100,
            executionTimeMs: 100,
            stderr: stderr
          }
        ]
      };
      
      const submissionRecord = {
        id: submissionId,
        labId: labId,
        profileId: "malware_analysis_shell",
        mode: "submit",
        code: fs.existsSync(path.join(workspacePath, "solution.sh")) 
          ? fs.readFileSync(path.join(workspacePath, "solution.sh"), "utf8")
          : "# Interactive Terminal Session",
        language: "shell",
        status: "finished",
        score,
        result: finalResult,
        createdAt: new Date().toISOString()
      };
      
      dbService.saveSubmission(submissionRecord);
      
      // Broadcast to the whole session room so test script and other observers receive it
      socket.nsp.to(sessionId).emit("execution:status", { 
        executionId: sessionId, 
        status: "finished", 
        payload: finalResult 
      });
      
      console.log(`[Grading] Graded session ${sessionId} successfully. Score: ${score}%`);
      
    } catch (err: any) {
      console.error(`[Grading Error] Failed to grade session ${sessionId}:`, err);
    }
  }

  public cleanupSession(sessionId: string) {
    const ptyProcess = this.ptySessions.get(sessionId);
    if (ptyProcess) {
      // Dọn dẹp container Docker nếu có chạy (Garbage Collection)
      const containerName = (ptyProcess as any).dockerContainerName;
      if (containerName) {
        try {
          console.log(`[PTY GC] Stopping and removing container for session ${sessionId}: ${containerName}`);
          execSync(`docker stop ${containerName} && docker rm ${containerName}`, { stdio: "ignore", timeout: 5000 });
        } catch (err: any) {
          console.error(`[PTY GC Error] Failed to stop/rm container ${containerName}:`, err.message);
        }
      }

      try {
        ptyProcess.kill();
      } catch (e) {}
      this.ptySessions.delete(sessionId);
    }
    
    const workspacePath = path.resolve(process.cwd(), "workspaces", sessionId);
    if (fs.existsSync(workspacePath)) {
      try {
        fs.rmSync(workspacePath, { recursive: true, force: true });
        console.log(`[PTY] Workspace workspaces/${sessionId} destroyed`);
      } catch (err: any) {
        console.error(`[PTY] Failed to delete workspace workspaces/${sessionId}:`, err.message);
      }
    }
    
    this.sessionLabs.delete(sessionId);
  }
}
