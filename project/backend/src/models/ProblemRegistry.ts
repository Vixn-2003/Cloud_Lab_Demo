import path from "path";
import { LabConfig, ExecutionProfile, Faculty, Subject } from "./types";

export const profiles: Record<string, ExecutionProfile> = {
  // ... (keep profiles as they are)
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
    resourceLimits: { maxOutputBytes: 10000 },
    networkPolicy: "disabled",
    gradingStrategy: "stdin_stdout_exact",
  },
  nodejs_20: {
    id: "nodejs_20",
    displayName: "Node.js 20",
    osFamily: "local",
    language: "javascript",
    version: "20.x",
    extension: ".js",
    buildCommand: null,
    runCommand: (filePath) => ["node", filePath],
    testCommand: (filePath) => ["node", filePath],
    timeoutMs: 5000,
    resourceLimits: { maxOutputBytes: 10000 },
    networkPolicy: "disabled",
    gradingStrategy: "stdin_stdout_exact",
  },
  cpp_gcc: {
    id: "cpp_gcc",
    displayName: "C++ (GCC)",
    osFamily: "local",
    language: "cpp",
    version: "GCC",
    extension: ".cpp",
    buildCommand: (filePath) => ["g++", filePath, "-o", filePath + ".exe"],
    runCommand: (filePath) => [filePath + ".exe"],
    testCommand: (filePath) => [filePath + ".exe"],
    timeoutMs: 5000,
    resourceLimits: { maxOutputBytes: 10000 },
    networkPolicy: "disabled",
    gradingStrategy: "stdin_stdout_exact",
  },
  java_basic: {
    id: "java_basic",
    displayName: "Java Basic",
    osFamily: "local",
    language: "java",
    version: "JDK",
    extension: ".java",
    buildCommand: (filePath) => ["javac", filePath],
    runCommand: (filePath) => ["java", "-cp", path.dirname(filePath), "Main"],
    testCommand: (filePath) => ["java", "-cp", path.dirname(filePath), "Main"],
    timeoutMs: 8000,
    resourceLimits: { maxOutputBytes: 10000 },
    networkPolicy: "disabled",
    gradingStrategy: "stdin_stdout_exact",
  },
  security_shell: {
    id: "security_shell",
    displayName: "Security Shell (Bash)",
    osFamily: "linux_aligned",
    language: "shell",
    version: "Ubuntu 22.x",
    extension: ".sh",
    buildCommand: null,
    runCommand: (filePath) => ["bash", filePath],
    testCommand: (filePath) => ["bash", filePath],
    timeoutMs: 5000,
    resourceLimits: { maxOutputBytes: 20000 },
    networkPolicy: "isolated",
    gradingStrategy: "tool_output_match",
  },
};

export const faculties: Faculty[] = [
  { id: "soft_eng", title: "Faculty of Software Engineering" },
  { id: "info_sec", title: "Faculty of Information Security" },
];

export const subjects: Subject[] = [
  { id: "algos", title: "Algorithms & Data Structures", facultyId: "soft_eng" },
  { id: "net_sec", title: "Network Security", facultyId: "info_sec" },
  { id: "crypto", title: "Applied Cryptography", facultyId: "info_sec" },
  { id: "crypto_fundamentals", title: "Cryptographic Fundamentals", facultyId: "info_sec" },
];

export const labs: Record<string, LabConfig> = {
  sum_two_numbers: {
    id: "sum_two_numbers",
    title: "Sum Two Numbers",
    subjectId: "algos",
    profileId: "python_basic",
    environmentType: "single_runtime",
    toolset: ["Python 3"],
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
    ],
  },
  problem_array_reduction: {
    id: "problem_array_reduction",
    title: "Thu gọn dãy số",
    subjectId: "algos",
    profileId: "python_basic",
    environmentType: "single_runtime",
    toolset: ["Python 3"],
    statement: `
### Description
Cho dãy số A[] chỉ bao gồm các số nguyên dương. Người ta thu gọn dần dãy số bằng cách loại bỏ các cặp phần tử kề nhau mà có tổng là chẵn. Sau khi cặp phần tử đó bị loại ra thì dãy số được dồn lại. Cứ tiếp tục như vậy cho đến khi không còn cặp phần tử nào kề nhau có tổng chẵn nữa.

Hãy tính xem cuối cùng dãy A[] còn bao nhiêu phần tử.

**Input**
Dòng đầu ghi số N là số phần tử của dãy.
Dòng tiếp theo ghi N số của dãy A.

**Output**
Số phần tử còn lại.
    `,
    testcases: [
      { input: "5\n2 3 4 5 6", expectedOutput: "5" },
      { input: "10\n1 5 5 8 6 4 3 5 9 3", expectedOutput: "2" },
    ],
  },
  lab_nmap_ssh: {
    id: "lab_nmap_ssh",
    title: "Identifying SSH Port",
    subjectId: "net_sec",
    profileId: "python_basic",
    environmentType: "single_machine",
    toolset: ["Python 3", "Nmap"],
    statement: `
### Description (Simplified)
Imagine you are at "MyComputer". The target server is at 172.25.0.2.
Your task is to identify which port in the range 2000-2010 is "Open" (running SSH).
Write a script that takes the target IP from stdin and prints the open port.

**Hint**: For this simulation, the open port is **2005**.
    `,
    testcases: [
      { input: "172.25.0.2", expectedOutput: "Port 2005 is OPEN" },
    ],
  },
  lab_hmac_hash: {
    id: "lab_hmac_hash",
    title: "HMAC-SHA256 calculation",
    subjectId: "crypto",
    profileId: "nodejs_20",
    environmentType: "single_runtime",
    toolset: ["Node.js 20"],
    statement: `
### Description
Create a Node.js script that calculates the HMAC-SHA256 signature of a message using a secret key.
Use the built-in 'crypto' module.

**Input**
Two lines:
1. The message
2. The secret key

**Output**
The HMAC hex string.
    `,
    testcases: [
      { input: "hello\nsecret", expectedOutput: "791da329e41416801905391bad965e634bb04b901dd15c898c56fa6d48227b2d" },
    ],
  },
  lab_gen_hash: {
    id: "lab_gen_hash",
    title: "Task 1 — Generate Hash (Shell CLI)",
    subjectId: "crypto_fundamentals",
    profileId: "security_shell",
    environmentType: "single_machine",
    toolset: ["openssl", "python3", "bash"],
    statement: `
### Description
Sử dụng các công cụ dòng lệnh (CLI) có sẵn trong hệ thống để tạo hash cho message từ stdin:
- MD5
- SHA1
- SHA256

**Yêu cầu**:
Viết một script Bash nhận input từ stdin và in ra định dạng JSON sau:
\`\`\`json
{
  "md5": "<32 hex>",
  "sha1": "<40 hex>",
  "sha256": "<64 hex>"
}
\`\`\`

**Gợi ý**: Bạn có thể dùng \`openssl dgst\` hoặc các lệnh như \`md5sum\`, \`sha256sum\`.
    `,
    testcases: [
      { 
        input: "hello world", 
        expectedOutput: `{"md5": "5eb63bbbe01eeed093cb22bb8f5acdc3", "sha1": "2aae6c35c94fcfb415dbe95f408b9ce91ee846ed", "sha256": "b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9"}` 
      },
    ],
  },
  lab_openssl_hmac: {
    id: "lab_openssl_hmac",
    title: "Task 2 — HMAC via OpenSSL CLI",
    subjectId: "crypto_fundamentals",
    profileId: "security_shell",
    environmentType: "single_machine",
    toolset: ["openssl", "bash"],
    statement: `
### Description
Sử dụng công cụ \`openssl\` để tạo HMAC cho tin nhắn từ stdin với secret key là "secret".
Yêu cầu sử dụng thuật toán SHA256.

**Định dạng đầu ra**: 
Phải giữ nguyên định dạng mặc định của OpenSSL: \`SHA256(stdin)= <hash>\`
    `,
    testcases: [
      { 
        input: "hello", 
        expectedOutput: `SHA256(stdin)= 791da329e41416801905391bad965e634bb04b901dd15c898c56fa6d48227b2d` 
      },
    ],
  },
  lab_avalanche: {
    id: "lab_avalanche",
    title: "Task 3 — Avalanche Effect (Analysis)",
    subjectId: "crypto_fundamentals",
    profileId: "security_shell",
    environmentType: "single_machine",
    toolset: ["openssl", "python3", "bash"],
    statement: `
### Description
Viết một Bash script để so sánh sự khác biệt của hash SHA256 giữa 2 chuỗi đầu vào.
Tỷ lệ khác biệt phải được tính dựa trên số lượng ký tự hex không khớp.

**Yêu cầu**:
1. Đọc 2 dòng từ stdin.
2. Hash cả 2 dòng bằng OpenSSL.
3. Sử dụng Python3 (gọi từ trong script Bash) để tính toán tỷ lệ khác biệt.
4. In ra "PASS" nếu tỷ lệ > 50%, ngược lại in "FAIL".
    `,
    testcases: [
      { input: "hello world\nhello worle", expectedOutput: "PASS" },
    ],
  },
  lab_bruteforce_mock: {
    id: "lab_bruteforce_mock",
    title: "Task 4 — Simple Brute-force (Simulation)",
    subjectId: "crypto_fundamentals",
    profileId: "security_shell",
    environmentType: "single_runtime",
    toolset: ["python3", "bash"],
    statement: `
### Description
Thực hiện tìm kiếm \`i\` (0 -> 100000) sao cho 6 ký tự đầu của hash SHA256(str(i)) khớp với target nhận được từ stdin.

**Yêu cầu**:
Sử dụng script Python để thực hiện logic tìm kiếm này. Bạn có thể gọi Python từ trong file .sh này.
    `,
    testcases: [
      { input: "ef7759", expectedOutput: "0" },
    ],
  },
};
