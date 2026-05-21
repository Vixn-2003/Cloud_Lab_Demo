import * as os from "os";
import * as pty from "node-pty";
import { Server, Socket } from "socket.io";

export class InteractiveTerminalService {
  private static instance: InteractiveTerminalService;
  private ptySessions: Map<string, pty.IPty> = new Map();

  private constructor() {}

  public static getInstance(): InteractiveTerminalService {
    if (!InteractiveTerminalService.instance) {
      InteractiveTerminalService.instance = new InteractiveTerminalService();
    }
    return InteractiveTerminalService.instance;
  }

  public startSession(sessionId: string, socket: Socket) {
    if (this.ptySessions.has(sessionId)) {
      console.log(`[PTY] Session ${sessionId} already exists`);
      return;
    }

    console.log(`[PTY] Starting session ${sessionId}`);

    // In a real environment, this would be:
    // docker exec -it <container_id> /bin/bash
    // or
    // labtainer <lab_name>
    // For now, we mock it using the host shell (PowerShell on Windows, Bash on Linux)
    const shell = os.platform() === "win32" ? "powershell.exe" : "bash";

    const ptyProcess = pty.spawn(shell, [], {
      name: "xterm-color",
      cols: 80,
      rows: 30,
      cwd: process.env.HOME || process.cwd(),
      env: process.env as any
    });

    this.ptySessions.set(sessionId, ptyProcess);

    // Stream output from PTY to WebSocket
    ptyProcess.onData((data) => {
      socket.emit("terminal:output", { sessionId, data });
    });

    ptyProcess.onExit(({ exitCode, signal }) => {
      console.log(`[PTY] Session ${sessionId} exited with code ${exitCode}`);
      this.cleanupSession(sessionId);
      socket.emit("terminal:exit", { sessionId, exitCode });
    });
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

  public cleanupSession(sessionId: string) {
    const ptyProcess = this.ptySessions.get(sessionId);
    if (ptyProcess) {
      ptyProcess.kill();
      this.ptySessions.delete(sessionId);
    }
  }
}
