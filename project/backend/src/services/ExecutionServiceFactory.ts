import { ExecutionService } from "./ExecutionService";
import { LocalProcessRunner } from "./LocalProcessRunner";
import { DockerRunner } from "./DockerRunner";

export class ExecutionServiceFactory {
  private static localRunner = new LocalProcessRunner();
  private static dockerRunner = new DockerRunner();

  static getRunner(): ExecutionService {
    const mode = process.env.EXECUTION_MODE || "local";
    if (mode === "docker") {
      return this.dockerRunner;
    }
    return this.localRunner;
  }
}
