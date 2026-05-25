const http = require('http');
const { io } = require("socket.io-client");

console.log("========================================================================");
console.log("🛡️  STARTING COMPREHENSIVE NPS LABTAINER CORE INTEGRATION TEST...");
console.log("========================================================================\n");

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
        // Not written yet, keep polling
      }
      
      retries++;
      if (retries >= maxRetries) {
        clearInterval(interval);
        reject(new Error("Timeout waiting for NPS Labtainer grading report."));
      }
    }, 300);
  });
}

async function runNpsTest() {
  const labId = "lab_labtainer_nmap";
  console.log(`[1/4] Khởi tạo phiên thực hành Web Terminal cho: ${labId}...`);
  
  try {
    // 1. Khởi tạo session qua API
    const initRes = await postJSON('/terminal/init', { labId });
    const { sessionId } = initRes;
    console.log(`-> Đã cấp sessionId thành công: ${sessionId}`);

    // 2. Mở kết nối WebSocket stream
    console.log("\n[2/4] Đang thiết lập kết nối WebSocket tới PTY-stream...");
    const socket = io("http://127.0.0.1:3001");
    
    await new Promise((resolve) => {
      socket.on("connect", () => {
        console.log("-> Kết nối WebSocket thành công. Bắt đầu phiên terminal.");
        socket.emit("terminal:start", { sessionId });
        resolve();
      });
    });

    // Mô phỏng gõ lệnh và thoát exit để nộp bài
    await new Promise(r => setTimeout(r, 800));
    console.log("-> Gửi lệnh: nmap -sV 172.25.0.2");
    socket.emit("terminal:input", { sessionId, data: "nmap -sV 172.25.0.2\r" });
    
    await new Promise(r => setTimeout(r, 800));
    console.log("-> Gửi lệnh: exit (thoát terminal và kích hoạt gradelab)");
    socket.emit("terminal:input", { sessionId, data: "exit\r" });
    
    // Ngắt kết nối socket
    await new Promise(r => setTimeout(r, 600));
    socket.disconnect();

    // 3. Tiến hành poll kết quả chấm điểm thực tế từ NpsLabtainerService
    console.log("\n[3/4] Bắt đầu polling kết quả chấm điểm tự động từ NPS Core...");
    const submission = await pollSubmissionStatus(sessionId);
    
    // 4. In báo cáo kết quả chi tiết
    console.log("\n[4/4] Báo cáo kết quả kiểm thử NPS Labtainer:");
    console.log("========================================================================");
    console.log(`Bài Lab ID : ${submission.labId}`);
    console.log(`Phiên làm  : ${submission.id}`);
    console.log(`Trạng thái : ${submission.status.toUpperCase()}`);
    console.log(`Điểm số    : ${submission.score}%`);
    console.log("========================================================================");

    const report = submission.result;
    if (report && Array.isArray(report.testResults)) {
      console.log("Kết quả parse từ file .report của NPS Labtainer:");
      report.testResults.forEach((test) => {
        const icon = test.passed ? "✅ ĐẠT" : "❌ CHƯA ĐẠT";
        console.log(`  - Task #${test.index + 1}: ${test.input} -> [${icon}]`);
        console.log(`    Mong muốn : ${test.expectedOutput}`);
        console.log(`    Thực tế   : ${test.actualOutput}`);
      });
    }
    console.log("========================================================================");

    if (submission.score > 0) {
      console.log("\n🎉 THÀNH CÔNG: Tích hợp trực tiếp NPS Labtainer Core vượt qua kiểm thử tự động!");
      process.exit(0);
    } else {
      console.error("\n❌ THẤT BẠI: Điểm chấm đạt được là 0%.");
      process.exit(1);
    }

  } catch (err) {
    console.error("\n❌ LỖI KIỂM THỬ:", err.message);
    process.exit(1);
  }
}

runNpsTest();
