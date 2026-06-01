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
    dockerImage: "python:3.11-slim",
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
    dockerImage: "node:20-slim",
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
    dockerImage: "gcc:13",
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
    dockerImage: "openjdk:17-slim",
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
    dockerImage: "python:3.11-slim",
  },
  malware_analysis_shell: {
    id: "malware_analysis_shell",
    displayName: "Malware Analysis (Bash)",
    osFamily: "linux_aligned",
    language: "shell",
    version: "Ubuntu 22.x + Wine",
    extension: ".sh",
    buildCommand: null,
    runCommand: (filePath) => ["bash", filePath],
    testCommand: (filePath) => ["bash", filePath],
    timeoutMs: 15000, // Slightly longer timeout for xvfb and wine initialization
    resourceLimits: { maxOutputBytes: 50000 },
    networkPolicy: "bridge", // Must have network for tcpdump to capture something
    gradingStrategy: "tool_output_match",
    dockerImage: "malware-env:latest",
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
    examples: [
      { input: "1 2", output: "3" },
      { input: "5 7", output: "12" }
    ],
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
    examples: [
      { input: "5\n2 3 4 5 6", output: "5" },
      { input: "10\n1 5 5 8 6 4 3 5 9 3", output: "2" }
    ],
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
      { input: "hello\nsecret", expectedOutput: "88aab3ede8d3adf94d26ab90d3bafd4a2083070c3bcce9c014ee04a443847c0b" },
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
        expectedOutput: `SHA256(stdin)= 88aab3ede8d3adf94d26ab90d3bafd4a2083070c3bcce9c014ee04a443847c0b` 
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
      { input: "5feceb", expectedOutput: "0" },
    ],
  },
  lab_winlocker_analysis: {
    id: "lab_winlocker_analysis",
    title: "Dynamic Analysis of WinlockerVB6Blacksod",
    subjectId: "net_sec", // Assigning to network security, or crypto. Let's use net_sec.
    profileId: "malware_analysis_shell",
    environmentType: "single_machine",
    toolset: ["wine", "tcpdump", "strace", "bash"],
    statement: `
### Description
Tiến hành phân tích động mẫu ransomware WinlockerVB6Blacksod.exe.

**Mục tiêu**:
1. Sử dụng \`strace\` để theo dõi các thao tác tệp tin. (Mã độc tạo/ghi vào một file có định dạng \`.txt\` ở đâu?)
2. Sử dụng \`tcpdump\` để bắt gói tin, tìm địa chỉ IP của máy chủ C2 mà mã độc cố gắng kết nối đến.

**Hướng dẫn thực hiện**:
Mã độc được đặt tại \`/opt/malware/WinlockerVB6Blacksod.exe\`.
Hãy viết một script Bash thực hiện tự động các công việc sau:
1. Chạy \`tcpdump -i eth0 -w ret.pcap &\` dưới nền trước khi chạy mã độc để bắt gói tin.
2. Chạy mã độc ngầm với \`timeout\` để tránh bị treo vô hạn:
   \`timeout 5 xvfb-run -a strace -f -e trace=file wine /opt/malware/WinlockerVB6Blacksod.exe 2> strace.log\`
3. Sau khi mã độc chạy xong (đợi vài giây hoặc bị timeout), dùng \`grep\` trên file \`strace.log\` để tìm file \`.txt\` bị thao tác và in ra màn hình đường dẫn file đó.
4. Dùng lệnh \`tcpdump -r ret.pcap -nn\` kết hợp \`grep\` và awk để in ra IP đích (ví dụ: \`172.x.x.x\`).


**Định dạng đầu ra yêu cầu**:
\`\`\`
ENCRYPTED_FILE: <đường_dẫn_tới_file>
C2_IP: <địa_chỉ_IP>
\`\`\`
    `,
    testcases: [
      { 
        input: "", 
        expectedOutput: "ENCRYPTED_FILE: C:\\users\\public\\encrypted_data.txt\nC2_IP: 172.25.0.100" 
      },
    ],
  },
  lab_labtainer_nmap: {
    id: "lab_labtainer_nmap",
    title: "Network Scanning with Labtainer",
    subjectId: "net_sec",
    profileId: "security_shell",
    environmentType: "multi_node",
    toolset: ["Nmap", "Labtainer", "Bash"],
    statement: `
### Hướng Dẫn Thực Hành Labtainer Offline (Giai đoạn 1)
Bài tập này được thiết kế để học viên làm quen với việc thu thập và phân tích lưu lượng mạng sử dụng công cụ Nmap trên môi trường Labtainer.

**Cách nộp bài**:
1. Thực hiện chạy lab offline trên môi trường Labtainer cá nhân:
   \`\`\`bash
   labtainer nmap-lab
   \`\`\`
2. Hoàn thành việc quét cổng máy chủ và xác định các lỗ hổng.
3. Chạy lệnh xuất kết quả:
   \`\`\`bash
   stoplab nmap-lab
   \`\`\`
4. Lấy tệp tin nén kết quả nộp bài dạng \`nmap-lab.<email>.zip\` được sinh ra trong thư mục chuyển giao của Labtainer.
5. Chuyển sang Tab **Nộp file Solution ZIP** ở bên cạnh, kéo thả tệp tin ZIP này vào và bấm **Submit File** để hệ thống tự động chấm điểm!
    `,
    testcases: []
  },
  max_triple: {
    id: "max_triple",
    title: "MAX TRIPLE",
    subjectId: "algos",
    profileId: "python_basic",
    environmentType: "single_runtime",
    toolset: ["Python 3"],
    statement: `
### Mô tả bài toán
Cho mảng A[] gồm N số nguyên. Nhiệm vụ của bạn là tìm tổng lớn nhất của bộ ba số trong mảng.
Chú ý: Nếu sử dụng kỹ thuật sắp xếp, submit lời giải của bạn sẽ bị fail (TLE). Hãy tối ưu với độ phức tạp O(N).

Ví dụ A[] = {1, 2, 3, 4, 5}, ta nhận được tổng lớn nhất của bộ ba số là 3 + 4 + 5 = 12.

### Input
- Dòng đầu tiên đưa vào T là số lượng bộ test.
- Những dòng tiếp theo, mỗi dòng đưa vào một test. Mỗi test gồm hai dòng:
  - Dòng đầu tiên đưa vào N là số lượng phần tử của mảng A[];
  - Dòng tiếp theo đưa vào các phần tử A[i] của mảng A[].

### Output
Đưa ra kết quả mỗi test theo từng dòng.

### Ràng buộc
- 1 <= T <= 100
- 3 <= N <= 10^6
- -10^8 <= A[i] <= 10^8
    `,
    examples: [
      {
        input: "2\n7\n1 2 3 0 -1 8 10\n7\n9 8 20 3 4 -1 0",
        output: "21\n37"
      }
    ],
    testcases: [
      { input: "2\n7\n1 2 3 0 -1 8 10\n7\n9 8 20 3 4 -1 0", expectedOutput: "21\n37" },
      { input: "1\n5\n-10 -20 -30 -5 -12", expectedOutput: "-27" },
      { input: "1\n3\n10 10 10", expectedOutput: "30" }
    ]
  },
  xoay_mang: {
    id: "xoay_mang",
    title: "XOAY MẢNG",
    subjectId: "algos",
    profileId: "python_basic",
    environmentType: "single_runtime",
    toolset: ["Python 3"],
    statement: `
### Mô tả bài toán
Cho mảng A[] gồm N số nguyên và số tự nhiên d. Hãy thực hiện quay mảng A[] với d phần tử từ trái qua phải (dịch trái d phần tử, đưa các phần tử bị dịch ra sau cùng).

Ví dụ A[] = {1, 2, 3, 4, 5}, d = 2 ta nhận được mảng A[] = {3, 4, 5, 1, 2}.

### Input
- Dòng đầu tiên đưa vào T là số lượng bộ test.
- Những dòng tiếp theo, mỗi dòng đưa vào một test. Mỗi test gồm hai dòng:
  - Dòng đầu tiên đưa vào N là số lượng phần tử của mảng A[] và số d;
  - Dòng tiếp theo đưa vào các phần tử A[i] của mảng A[].

### Output
Đưa ra kết quả mảng sau khi quay của mỗi test theo từng dòng.

### Ràng buộc
- 1 <= T <= 100
- 1 <= d <= N <= 10^7
- 0 <= A[i] <= 10^9
    `,
    examples: [
      {
        input: "2\n5 2\n1 2 3 4 5\n10 3\n2 4 6 8 10 12 14 16 18 20",
        output: "3 4 5 1 2\n8 10 12 14 16 18 20 2 4 6"
      }
    ],
    testcases: [
      { input: "2\n5 2\n1 2 3 4 5\n10 3\n2 4 6 8 10 12 14 16 18 20", expectedOutput: "3 4 5 1 2\n8 10 12 14 16 18 20 2 4 6" },
      { input: "1\n5 5\n1 2 3 4 5", expectedOutput: "1 2 3 4 5" },
      { input: "1\n4 1\n10 20 30 40", expectedOutput: "20 30 40 10" }
    ]
  },
  con_so_duyen_no: {
    id: "con_so_duyen_no",
    title: "CON SỐ DUYÊN NỢ",
    subjectId: "algos",
    profileId: "python_basic",
    environmentType: "single_runtime",
    toolset: ["Python 3"],
    statement: `
### Mô tả bài toán
Con số duyên nợ là con số có chữ số đầu và chữ số cuối giống nhau. Viết chương trình kiểm tra xem một số nguyên dương n ghi trong hệ thập phân có chữ số đầu và chữ số cuối giống nhau không?

### Input
- Dòng đầu tiên ghi số lượng test T.
- T dòng tiếp theo, mỗi dòng chứa một số nguyên dương n ghi ở hệ thập phân.

### Output
Ứng với mỗi số nguyên dương n, ghi ra trên một dòng là YES nếu số tương ứng có chữ số đầu và chữ số cuối giống nhau, NO nếu ngược lại.

### Ràng buộc
- 1 <= T <= 100
- 1 <= n < 10^100
    `,
    examples: [
      {
        input: "2\n12345\n123451",
        output: "NO\nYES"
      }
    ],
    testcases: [
      { input: "2\n12345\n123451", expectedOutput: "NO\nYES" },
      { input: "3\n7\n88\n909", expectedOutput: "YES\nYES\nYES" },
      { input: "2\n1234567890123456789012345678901\n1234567890123456789012345678902", expectedOutput: "YES\nNO" }
    ]
  },
  lai_suat_ngan_hang: {
    id: "lai_suat_ngan_hang",
    title: "LÃI SUẤT NGÂN HÀNG",
    subjectId: "algos",
    profileId: "python_basic",
    environmentType: "single_runtime",
    toolset: ["Python 3"],
    statement: `
### Mô tả bài toán
Ngân hàng thông báo lãi suất là X % mỗi năm. Với số tiền gửi vào ban đầu là N. Sau mỗi năm, tiền lãi sẽ được cộng dồn (lãi kép). Hỏi sau ít nhất bao nhiêu năm thì số tiền đạt được tối thiểu là M.

### Input
- Dòng đầu ghi số bộ test T.
- Mỗi test viết trên một dòng gồm 3 số thực N, X và M.

### Output
Ghi ra số năm tính được cho mỗi bộ test theo từng dòng.

### Ràng buộc
- 0 < N < M < 100000
- 0 < X < 100
    `,
    examples: [
      {
        input: "2\n200.00 6.5 300\n500 4 1000.00",
        output: "7\n18"
      }
    ],
    testcases: [
      { input: "2\n200.00 6.5 300\n500 4 1000.00", expectedOutput: "7\n18" },
      { input: "1\n100 10 110", expectedOutput: "1" },
      { input: "1\n1000 5 1500", expectedOutput: "9" }
    ]
  },
  day_so_hamming: {
    id: "day_so_hamming",
    title: "DÃY SỐ HAMMING",
    subjectId: "algos",
    profileId: "python_basic",
    environmentType: "single_runtime",
    toolset: ["Python 3"],
    statement: `
### Mô tả bài toán
Dãy số nguyên dương tăng dần trong đó ước số nguyên tố lớn nhất của các số trong dãy đều không vượt quá 5 được gọi là dãy số Hamming. Ví dụ 10 = 2x5 thuộc dãy Hamming còn 26 = 2x13 không thuộc dãy Hamming. Số 1 được coi là số đầu tiên của dãy Hamming. 

Cho số nguyên dương N. Hãy xác định xem N có thuộc dãy Hamming hay không và nếu có thì thứ tự của N trong dãy Hamming là bao nhiêu.

### Input
- Dòng đầu tiên ghi số bộ test T (không quá 10^5).
- Mỗi test ghi một số N trên một dòng.

### Output
- Nếu giá trị N thuộc dãy Hamming thì ghi ra thứ tự của N, tính từ 1.
- Nếu không thì ghi ra "Not in sequence".

### Ràng buộc
- 1 <= T <= 10^5
- 1 <= N <= 10^18
    `,
    examples: [
      {
        input: "11\n1\n2\n6\n7\n8\n9\n10\n11\n12\n13\n14",
        output: "1\n2\n6\nNot in sequence\n7\n8\n9\nNot in sequence\n10\nNot in sequence\nNot in sequence"
      }
    ],
    testcases: [
      { input: "11\n1\n2\n6\n7\n8\n9\n10\n11\n12\n13\n14", expectedOutput: "1\n2\n6\nNot in sequence\n7\n8\n9\nNot in sequence\n10\nNot in sequence\nNot in sequence" },
      { input: "3\n80\n81\n82", expectedOutput: "30\n31\nNot in sequence" }
    ]
  },
  liet_ke_cap_so_nguyen_to_cung_nhau: {
    id: "liet_ke_cap_so_nguyen_to_cung_nhau",
    title: "LIỆT KÊ CẶP SỐ NGUYÊN TỐ CÙNG NHAU",
    subjectId: "algos",
    profileId: "python_basic",
    environmentType: "single_runtime",
    toolset: ["Python 3"],
    statement: `
### Mô tả bài toán
Cho dãy số A[] có n phần tử là các số nguyên dương khác nhau, giá trị không quá 100. Hãy liệt kê các cặp số nguyên tố cùng nhau xuất hiện trong dãy theo thứ tự tăng dần (sắp xếp tăng dần theo phần tử thứ nhất, sau đó theo phần tử thứ hai), mỗi cặp số in trên một dòng. 
Một cặp số (a, b) được gọi là nguyên tố cùng nhau nếu ước chung lớn nhất của chúng bằng 1.

### Input
- Dòng đầu ghi số n (không quá 100).
- Dòng thứ 2 ghi n số của dãy A[].

### Output
Ghi lần lượt các cặp số nguyên tố cùng nhau theo thứ tự tăng dần.

### Ràng buộc
- n <= 100
- Các phần tử của A[] là số nguyên dương khác nhau <= 100
    `,
    examples: [
      {
        input: "5\n3 7 9 6 13",
        output: "3 7\n3 13\n6 7\n6 13\n7 9\n7 13\n9 13"
      }
    ],
    testcases: [
      { input: "5\n3 7 9 6 13", expectedOutput: "3 7\n3 13\n6 7\n6 13\n7 9\n7 13\n9 13" },
      { input: "3\n2 4 8", expectedOutput: "" },
      { input: "4\n5 10 15 7", expectedOutput: "5 7\n7 10\n7 15" }
    ]
  },
  tinh_toan_luong_mua: {
    id: "tinh_toan_luong_mua",
    title: "TÍNH TOÁN LƯỢNG MƯA",
    subjectId: "algos",
    profileId: "python_basic",
    environmentType: "single_runtime",
    toolset: ["Python 3"],
    statement: `
### Mô tả bài toán
Trong một ngày mưa nhiều, các trạm đo mưa hoạt động hết công suất. Tại mỗi trạm đo, các cơn mưa được ghi nhận thời điểm bắt đầu, thời điểm kết thúc và lượng mưa đo được. Một trạm mưa có thể có nhiều lần đo trong ngày. Hãy tính lượng mưa trung bình trong 1 giờ (60 phút) của từng trạm theo đúng thứ tự xuất hiện lần đầu của trạm đó trong danh sách.

### Input
- Dòng đầu ghi số lượt đo lượng mưa N.
- Thông tin về một lần đo lượng mưa gồm 4 dòng:
  1. Tên trạm
  2. Thời điểm bắt đầu mưa (hh:mm)
  3. Thời điểm kết thúc mưa (hh:mm)
  4. Lượng mưa đo được (mm)

### Output
Ghi ra danh sách các trạm khác nhau trong danh sách đo mưa và lượng mưa trung bình của từng trạm.
Thông tin trên mỗi dòng lần lượt gồm:
- Mã trạm đo tính từ T01, T02, ... theo thứ tự xuất hiện trạm đầu tiên.
- Tên trạm đo mưa.
- Lượng mưa trung bình trong 1 giờ tại mỗi trạm, tính chính xác đến 2 số phần thập phân.

Các thông tin ghi cách nhau một khoảng trống.

### Ràng buộc
- N <= 100
- Thời gian có định dạng hh:mm
- Lượng mưa là số nguyên dương đo được.
    `,
    examples: [
      {
        input: "3\nDong Anh\n07:30\n08:00\n60\nCau Giay\n07:45\n08:12\n50\nSoc Son\n08:00\n09:15\n78",
        output: "T01 Dong Anh 120.00\nT02 Cau Giay 111.11\nT03 Soc Son 62.40"
      }
    ],
    testcases: [
      {
        input: "3\nDong Anh\n07:30\n08:00\n60\nCau Giay\n07:45\n08:12\n50\nSoc Son\n08:00\n09:15\n78",
        expectedOutput: "T01 Dong Anh 120.00\nT02 Cau Giay 111.11\nT03 Soc Son 62.40"
      },
      {
        input: "4\nDong Anh\n06:00\n07:00\n45\nCau Giay\n07:00\n08:30\n120\nDong Anh\n08:00\n09:30\n90\nCau Giay\n09:00\n10:00\n60",
        expectedOutput: "T01 Dong Anh 54.00\nT02 Cau Giay 72.00"
      }
    ]
  }
};

