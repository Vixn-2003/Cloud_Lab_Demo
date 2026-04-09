import { ProblemConfig, ExecutionProfile } from "./types";

export const profiles: Record<string, ExecutionProfile> = {
  python_basic: {
    id: "python_basic",
    displayName: "Python 3 Basic",
    osFamily: "local",
    language: "python",
    version: "3.x",
    extension: ".py",
    buildCommand: null,
    runCommand: (filePath) => ["python", filePath],
    testCommand: (filePath) => ["python", filePath],
    timeoutMs: 5000,
    resourceLimits: {
      maxOutputBytes: 10000,
    },
    networkPolicy: "disabled",
    gradingStrategy: "stdin_stdout_exact",
  },
};

export const problems: Record<string, ProblemConfig> = {
  sum_two_numbers: {
    id: "sum_two_numbers",
    title: "Sum Two Numbers",
    profileId: "python_basic",
    statement: `
### Description
Read 2 integers and print their sum.

**Input**
Two integers separated by a space/newline.

**Output**
Their sum.
    `,
    testcases: [
      { input: "1 2", expectedOutput: "3" },
      { input: "5 7", expectedOutput: "12" },
      { input: "-10 10", expectedOutput: "0" },
    ],
  },
};
