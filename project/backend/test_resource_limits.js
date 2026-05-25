const http = require('http');

console.log("========================================================================");
console.log("🛡️  STARTING RESOURCE LIMITS & SANDBOX SECURITY VERIFICATION TEST...");
console.log("========================================================================\n");

function postJSON(path, data) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(data);
    const options = {
      hostname: '127.0.0.1',
      port: 3001,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
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
    req.write(payload);
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

function pollSubmissionStatus(executionId, maxRetries = 30) {
  return new Promise((resolve, reject) => {
    let retries = 0;
    const interval = setInterval(async () => {
      try {
        const sub = await getJSON(`/submissions/${executionId}`);
        if (sub && (sub.status === "finished" || sub.status === "failed" || sub.status === "timeout")) {
          clearInterval(interval);
          resolve(sub);
        }
      } catch (e) {
        // DB write delay fallback
      }
      
      retries++;
      if (retries >= maxRetries) {
        clearInterval(interval);
        reject(new Error("Timeout waiting for execution to complete."));
      }
    }, 500);
  });
}

async function runTest() {
  const results = [];

  // ==========================================
  // TEST CASE 1: Out of Memory (OOM) Limit
  // ==========================================
  console.log("👉 [TEST 1] Testing Out of Memory (OOM) Limit (RAM < 256MB)...");
  try {
    const codeOOM = `
import time
print("Allocating memory...")
# Cố ý tạo mảng lớn dùng khoảng 400MB RAM (vượt giới hạn 256MB)
x = [0] * 50000000
print("Allocated successfully!")
`;
    const res = await postJSON('/run', {
      code: codeOOM,
      profileId: 'python_basic',
      stdin: ''
    });

    const executionId = res.executionId;
    const finalResult = await pollSubmissionStatus(executionId);
    const runnerResult = finalResult.result || {};
    
    // OOM should crash container, resulting in exitCode 137 or "failed" status
    const isOOMKilled = runnerResult.exitCode === 137 || finalResult.status === "failed" || runnerResult.status === "failed";
    console.log(`-> Kết quả OOM: SubmissionStatus=${finalResult.status}, ExecutionStatus=${runnerResult.status}, ExitCode=${runnerResult.exitCode}`);
    
    results.push({
      name: "Out of Memory Limit (256MB)",
      expected: "Failed/Killed (Exit Code 137)",
      actual: `Status=${finalResult.status}, ExitCode=${runnerResult.exitCode}`,
      status: isOOMKilled ? "PASS ✅" : "FAIL ❌",
      reason: isOOMKilled ? "Container bị Docker dừng đột ngột để bảo vệ RAM hệ thống!" : "Container không bị giới hạn RAM!"
    });
  } catch (err) {
    results.push({
      name: "Out of Memory Limit (256MB)",
      expected: "Failed/Killed (Exit Code 137)",
      actual: err.message,
      status: "ERROR 💥"
    });
  }

  // ==========================================
  // TEST CASE 2: CPU Limit & Timeout Test
  // ==========================================
  console.log("\n👉 [TEST 2] Testing CPU Limit & Infinite Loop Timeout...");
  try {
    const codeCPU = `
import time
print("Entering infinite loop...")
while True:
    pass
`;
    const res = await postJSON('/run', {
      code: codeCPU,
      profileId: 'python_basic',
      stdin: ''
    });

    const executionId = res.executionId;
    const finalResult = await pollSubmissionStatus(executionId);
    const runnerResult = finalResult.result || {};
    
    // Should hit python profile timeout (typically 5-10s) and status = "failed"/"timeout"
    const isKilledByTimeout = finalResult.status === "failed" || runnerResult.exitCode === 124 || runnerResult.status === "timeout" || (runnerResult.stderr && runnerResult.stderr.includes("Timed Out"));
    console.log(`-> Kết quả CPU: SubmissionStatus=${finalResult.status}, ExecutionStatus=${runnerResult.status}, ExitCode=${runnerResult.exitCode}`);
    
    results.push({
      name: "CPU & Loop Timeout Limit",
      expected: "Killed cleanly on timeout",
      actual: `Status=${finalResult.status}, ExitCode=${runnerResult.exitCode}`,
      status: isKilledByTimeout ? "PASS ✅" : "FAIL ❌",
      reason: isKilledByTimeout ? "Hệ thống tự động chấm dứt container chạy quá giờ!" : "Vòng lặp vô tận không bị dọn dẹp!"
    });
  } catch (err) {
    results.push({
      name: "CPU & Loop Timeout Limit",
      expected: "Killed cleanly on timeout",
      actual: err.message,
      status: "ERROR 💥"
    });
  }

  // ==========================================
  // TEST CASE 3: Fork Bomb & PIDs Limit Test
  // ==========================================
  console.log("\n👉 [TEST 3] Testing Fork Bomb & PIDs Limit (Max 100 processes)...");
  try {
    const codeFork = `
import os, time, sys
print("Starting controlled fork bomb...")
try:
    for i in range(150):
        pid = os.fork()
        if pid == 0:
            # Child process sleeps to keep process alive
            time.sleep(2)
            sys.exit(0)
    print("All forks spawned (Vulnerability!)")
except Exception as e:
    print("Fork blocked cleanly:", str(e))
`;
    const res = await postJSON('/run', {
      code: codeFork,
      profileId: 'python_basic',
      stdin: ''
    });

    const executionId = res.executionId;
    const finalResult = await pollSubmissionStatus(executionId);
    const runnerResult = finalResult.result || {};
    
    // Check if output includes fork failure message
    const output = (runnerResult.stdout || "") + "\n" + (runnerResult.stderr || "");
    const isForkBlocked = output.includes("Fork blocked") || finalResult.status === "failed" || runnerResult.status === "failed" || output.includes("Resource temporarily unavailable") || output.includes("Blocking");
    console.log(`-> Kết quả Fork Bomb: SubmissionStatus=${finalResult.status}, ExecutionStatus=${runnerResult.status}`);
    
    results.push({
      name: "Fork Bomb Prevention (PID Limit 100)",
      expected: "Fork blocked / Resource unavailable",
      actual: output.replace(/\n/g, ' ').substring(0, 150) + "...",
      status: isForkBlocked ? "PASS ✅" : "FAIL ❌",
      reason: isForkBlocked ? "Docker chặn đứng sự sinh sôi vô hạn của các tiến trình con!" : "Không chặn được fork bomb!"
    });
  } catch (err) {
    results.push({
      name: "Fork Bomb Prevention (PID Limit 100)",
      expected: "Fork blocked / Resource unavailable",
      actual: err.message,
      status: "ERROR 💥"
    });
  }

  // ==========================================
  // PRINT TEST REPORT
  // ==========================================
  console.log("\n========================================================================");
  console.log("📊  REPORT: DOCKER CONTAINER RESOURCE LIMITS & SANDBOX STABILITY");
  console.log("========================================================================");
  results.forEach((r, i) => {
    console.log(`[Ca ${i+1}] ${r.name}`);
    console.log(`   - Kỳ vọng  : ${r.expected}`);
    console.log(`   - Thực tế  : ${r.actual}`);
    console.log(`   - Trạng thái: ${r.status}`);
    if (r.reason) console.log(`   - Đánh giá : ${r.reason}`);
    console.log("------------------------------------------------------------------------");
  });
}

runTest();
