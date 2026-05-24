const http = require('http');
const { io } = require("socket.io-client");

console.log("========================================================================");
console.log("🛡️  STARTING COMPREHENSIVE INTEGRATION TEST FOR ALL 9 CLOUD LABS...");
console.log("========================================================================\n");

// Definition of reference solutions that guarantee 100/100 score
const labsToTest = [
  {
    id: "sum_two_numbers",
    title: "Sum Two Numbers",
    profileId: "python_basic",
    type: "code",
    code: `import sys
num = sys.stdin.read().split()
if num:
    print(int(num[0]) + int(num[1]))
`
  },
  {
    id: "problem_array_reduction",
    title: "Thu gọn dãy số",
    profileId: "python_basic",
    type: "code",
    code: `import sys
lines = sys.stdin.read().split()
if not lines:
    sys.exit(0)
n = int(lines[0])
arr = [int(x) for x in lines[1:n+1]]
stack = []
for x in arr:
    if stack and (stack[-1] + x) % 2 == 0:
        stack.pop()
    else:
        stack.append(x)
print(len(stack))
`
  },
  {
    id: "lab_nmap_ssh",
    title: "Identifying SSH Port",
    profileId: "python_basic",
    type: "code",
    code: `import sys
ip = sys.stdin.read().strip()
if ip == "172.25.0.2":
    print("Port 2005 is OPEN")
`
  },
  {
    id: "lab_hmac_hash",
    title: "HMAC-SHA256 calculation",
    profileId: "nodejs_20",
    type: "code",
    code: `const crypto = require('crypto');
const fs = require('fs');
// Support Windows CRLF naturally by trimming each line in mapped array
const input = fs.readFileSync(0, 'utf8').split('\\n').map(line => line.trim());
if (input.length >= 2) {
  const message = input[0];
  const secret = input[1];
  const hmac = crypto.createHmac('sha256', secret).update(message).digest('hex');
  console.log(hmac);
}
`
  },
  {
    id: "lab_gen_hash",
    title: "Task 1 — Generate Hash (Shell CLI)",
    profileId: "security_shell",
    type: "code",
    code: `#!/bin/bash
read -r msg
# Clean Carriage Returns for Windows
msg=$(printf "%s" "$msg" | tr -d '\\r')
md5=$(printf "%s" "$msg" | md5sum | awk '{print $1}')
sha1=$(printf "%s" "$msg" | sha1sum | awk '{print $1}')
sha256=$(printf "%s" "$msg" | sha256sum | awk '{print $1}')
echo "{\\"md5\\": \\"$md5\\", \\"sha1\\": \\"$sha1\\", \\"sha256\\": \\"$sha256\\"}"
`
  },
  {
    id: "lab_openssl_hmac",
    title: "Task 2 — HMAC via OpenSSL CLI",
    profileId: "security_shell",
    type: "code",
    code: `#!/bin/bash
read -r msg
# Clean Carriage Returns for Windows
msg=$(printf "%s" "$msg" | tr -d '\\r')
printf "%s" "$msg" | openssl dgst -sha256 -hmac "secret" | sed 's/SHA2-256(stdin)= /SHA256(stdin)= /'
`
  },
  {
    id: "lab_avalanche",
    title: "Task 3 — Avalanche Effect (Analysis)",
    profileId: "security_shell",
    type: "code",
    code: `#!/bin/bash
read -r l1
read -r l2
# Clean Carriage Returns for Windows compatibility
l1=$(printf "%s" "$l1" | tr -d '\\r')
l2=$(printf "%s" "$l2" | tr -d '\\r')
h1=$(printf "%s" "$l1" | sha256sum | awk "{print \\$1}")
h2=$(printf "%s" "$l2" | sha256sum | awk "{print \\$1}")
# Check if python3 or python is available
PY_CMD="python3"
if ! command -v python3 &> /dev/null; then
    PY_CMD="python"
fi
# Use temporary python script to avoid Windows shell quoting issues
cat << 'EOF' > avalanche.py
import sys
s1 = sys.argv[1]
s2 = sys.argv[2]
diff = sum(1 for a, b in zip(s1, s2) if a != b)
print('PASS' if diff > 32 else 'FAIL')
EOF
$PY_CMD avalanche.py "$h1" "$h2"
`
  },
  {
    id: "lab_bruteforce_mock",
    title: "Task 4 — Simple Brute-force (Simulation)",
    profileId: "security_shell",
    type: "code",
    code: `#!/bin/bash
read -r target
# Clean Carriage Returns for Windows compatibility
target=$(printf "%s" "$target" | tr -d '\\r')
export TARGET="$target"
PY_CMD="python3"
if ! command -v python3 &> /dev/null; then
    PY_CMD="python"
fi
# Use temporary python script to avoid Windows shell quoting issues
cat << 'EOF' > brute.py
import hashlib, os, sys
t = os.environ.get('TARGET', '')
for i in range(100001):
    if hashlib.sha256(str(i).encode()).hexdigest().startswith(t):
        print(i)
        sys.exit(0)
EOF
$PY_CMD brute.py
`
  },
  {
    id: "lab_winlocker_analysis",
    title: "Dynamic Analysis of WinlockerVB6Blacksod",
    type: "terminal",
    script: `cat << 'EOF' > solution.sh
#!/bin/bash
echo "ENCRYPTED_FILE: C:\\\\users\\\\public\\\\encrypted_data.txt"
echo "C2_IP: 172.25.0.100"
EOF
exit
`
  }
];

const results = [];

function postJSON(path, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    const options = {
      hostname: '127.0.0.1',
      port: 3001,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve(JSON.parse(body)));
    });

    req.on('error', (err) => reject(err));
    req.write(postData);
    req.end();
  });
}

function getJSON(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port: 3001,
      path: path,
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(new Error(`Failed to parse response: ${body}`));
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.end();
  });
}

// Highly reliable polling mechanism
function pollSubmissionStatus(executionId, maxRetries = 40) {
  return new Promise((resolve, reject) => {
    let retries = 0;
    const interval = setInterval(async () => {
      try {
        const sub = await getJSON(`/submissions/${executionId}`);
        if (sub && (sub.status === "finished" || sub.status === "failed")) {
          clearInterval(interval);
          resolve(sub);
        }
      } catch (e) {
        // Submission might not be written to DB yet, keep retrying
      }
      
      retries++;
      if (retries >= maxRetries) {
        clearInterval(interval);
        reject(new Error("Timeout waiting for grading to complete."));
      }
    }, 200); // Poll every 200ms
  });
}

async function testCodeLab(lab) {
  console.log(`[CODE LAB] Testing: ${lab.title} (${lab.id})...`);
  try {
    // 1. Submit Code
    const submitRes = await postJSON('/submit', {
      code: lab.code,
      profileId: lab.profileId,
      labId: lab.id
    });

    const { executionId } = submitRes;
    
    // 2. Poll result via HTTP API (Reliable & Deterministic)
    const result = await pollSubmissionStatus(executionId);
    const score = result.score !== undefined ? result.score : (result.result && result.result.score) || 0;
    
    results.push({
      id: lab.id,
      title: lab.title,
      type: "Monaco Code",
      score: score,
      status: score === 100 ? "PASS ✅" : "FAIL ❌",
      details: score === 100 ? "All testcases passed" : "Failed testcases or compilation error"
    });

  } catch (err) {
    results.push({
      id: lab.id,
      title: lab.title,
      type: "Monaco Code",
      score: 0,
      status: "ERROR 💥",
      details: err.message
    });
  }
}

async function testTerminalLab(lab) {
  console.log(`[TERMINAL LAB] Testing VM: ${lab.title} (${lab.id})...`);
  try {
    // 1. Initialize Terminal Session
    const initRes = await postJSON('/terminal/init', { labId: lab.id });
    const { sessionId } = initRes;

    // 2. Connect WebSocket to stream shell commands
    const socket = io("http://127.0.0.1:3001");
    
    await new Promise((resolve) => {
      socket.on("connect", () => {
        socket.emit("terminal:start", { sessionId });
        resolve();
      });
    });

    // Type commands
    await new Promise(r => setTimeout(r, 300));
    socket.emit("terminal:input", { sessionId, data: lab.script });
    
    // Disconnect socket cleanly
    await new Promise(r => setTimeout(r, 800));
    socket.disconnect();

    // 3. Poll grading result via HTTP API (Extremely reliable!)
    const result = await pollSubmissionStatus(sessionId, 50);
    const score = result.score !== undefined ? result.score : (result.result && result.result.score) || 0;

    results.push({
      id: lab.id,
      title: lab.title,
      type: "Web Terminal",
      score: score,
      status: score === 100 ? "PASS ✅" : "FAIL ❌",
      details: score === 100 ? "Behavior state correct" : "Missing script or files"
    });

  } catch (err) {
    results.push({
      id: lab.id,
      title: lab.title,
      type: "Web Terminal",
      score: 0,
      status: "ERROR 💥",
      details: err.message
    });
  }
}

// Execute tests sequentially
async function runAllTests() {
  for (const lab of labsToTest) {
    if (lab.type === "code") {
      await testCodeLab(lab);
    } else {
      await testTerminalLab(lab);
    }
    console.log("------------------------------------------------------------------------");
  }

  // Print Summary Table
  console.log("\n========================================================================");
  console.log("📊                  COMPREHENSIVE LABS VERIFICATION REPORT");
  console.log("========================================================================");
  console.log(String.prototype.padEnd.call("Bài Thực Hành", 40) + " | " + 
              String.prototype.padEnd.call("Loại hình", 12) + " | " + 
              String.prototype.padEnd.call("Điểm số", 8) + " | " + 
              "Trạng thái");
  console.log("------------------------------------------------------------------------");
  
  let allPassed = true;
  results.forEach(r => {
    console.log(String.prototype.padEnd.call(r.title.slice(0, 38), 40) + " | " + 
                String.prototype.padEnd.call(r.type, 12) + " | " + 
                String.prototype.padEnd.call(r.score + "%", 8) + " | " + 
                r.status);
    if (!r.status.includes("PASS")) allPassed = false;
  });
  console.log("========================================================================");

  if (allPassed) {
    console.log("\n🎉 SUCCESS: All 9 Labs successfully passed integration tests with 100/100 points!");
    process.exit(0);
  } else {
    console.error("\n❌ FAILURE: Some lab integration tests failed. Check console reports above.");
    process.exit(1);
  }
}

// Start
runAllTests();
