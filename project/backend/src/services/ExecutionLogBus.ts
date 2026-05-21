import { EventEmitter } from "events";

export interface LogEvent {
  executionId: string;
  stream: "stdout" | "stderr";
  data: string;
}

export class ExecutionLogBus extends EventEmitter {
  private static instance: ExecutionLogBus;

  private constructor() {
    super();
  }

  public static getInstance(): ExecutionLogBus {
    if (!ExecutionLogBus.instance) {
      ExecutionLogBus.instance = new ExecutionLogBus();
    }
    return ExecutionLogBus.instance;
  }

  public emitLog(executionId: string, stream: "stdout" | "stderr", data: string) {
    const event: LogEvent = { executionId, stream, data };
    this.emit(`log:${executionId}`, event);
    this.emit("log", event); // Broadcaster for generic listeners
  }

  public emitStatus(executionId: string, status: string, payload?: any) {
    const event = { executionId, status, payload };
    this.emit(`status:${executionId}`, event);
    this.emit("status", event); // Broadcaster for generic listeners
  }
}

export const logBus = ExecutionLogBus.getInstance();
