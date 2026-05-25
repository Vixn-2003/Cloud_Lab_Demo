const fs = require('fs');
const path = require('path');
const http = require('http');
const AdmZip = require('adm-zip');

console.log("========================================================================");
console.log("🛡️  STARTING LABTAINER ZIP SUBMISSION INTEGRATION TEST...");
console.log("========================================================================\n");

// 1. Khởi tạo file ZIP ảo trong bộ nhớ bằng adm-zip
console.log("[1/4] Khởi tạo tệp ZIP Labtainer giả lập...");
const zip = new AdmZip();

const mockManifest = {
  studentId: "SV001",
  labId: "lab_labtainer_nmap",
  assignmentVersion: "1.0.0",
  tool: "labtainer",
  startedAt: new Date(Date.now() - 3600000).toISOString(),
  finishedAt: new Date().toISOString(),
  artifactHash: "SHA256-MOCK-OK-123456"
};

const mockResults = {
  score: 100,
  testResults: [
    {
      index: 0,
      input: "Task 1: Thực hiện quét mạng Nmap xác định cổng dịch vụ",
      expectedOutput: "Phát hiện cổng 22/80/443 mở",
      actualOutput: "Phát hiện cổng 22/80/443 mở",
      passed: true,
      executionTimeMs: 150
    },
    {
      index: 1,
      input: "Task 2: Xác thực quy tắc chặn tường lửa firewall",
      expectedOutput: "Cổng 8080 bị lọc (filtered)",
      actualOutput: "Cổng 8080 bị lọc (filtered)",
      passed: true,
      executionTimeMs: 90
    }
  ]
};

zip.addFile("manifest.json", Buffer.from(JSON.stringify(mockManifest, null, 2)));
zip.addFile("results.json", Buffer.from(JSON.stringify(mockResults, null, 2)));

const zipBuffer = zip.toBuffer();
console.log(`-> Tạo ZIP thành công! Dung lượng: ${zipBuffer.length} bytes`);

// 2. Gửi tệp ZIP qua multipart/form-data bằng HTTP Client thuần
console.log("\n[2/4] Đang gửi yêu cầu POST multipart /upload-submit tới backend...");

const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);

function createMultipartBody(filename, fileBuffer, fields) {
  const parts = [];

  // Thêm các fields văn bản thông thường
  for (const [key, value] of Object.entries(fields)) {
    parts.push(Buffer.from(
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="${key}"\r\n\r\n` +
      `${value}\r\n`
    ));
  }

  // Thêm file buffer
  parts.push(Buffer.from(
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="file"; filename="${filename}"\r\n` +
    `Content-Type: application/zip\r\n\r\n`
  ));
  parts.push(fileBuffer);
  parts.push(Buffer.from(`\r\n--${boundary}--\r\n`));

  return Buffer.concat(parts);
}

const reqFields = {
  profileId: "security_shell",
  labId: "lab_labtainer_nmap"
};

const multipartBody = createMultipartBody("nmap-lab.SV001.zip", zipBuffer, reqFields);

const options = {
  hostname: '127.0.0.1',
  port: 3001,
  path: '/upload-submit',
  method: 'POST',
  headers: {
    'Content-Type': `multipart/form-data; boundary=${boundary}`,
    'Content-Length': multipartBody.length
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    try {
      const response = JSON.parse(body);
      console.log("-> Nhận phản hồi từ server: ", response);
      if (response.error) {
        console.error("❌ Lỗi từ server:", response.error);
        process.exit(1);
      }
      
      const { executionId } = response;
      if (!executionId) {
        console.error("❌ Không nhận được executionId từ backend.");
        process.exit(1);
      }

      // 3. Tiến hành poll trạng thái chấm điểm
      pollResult(executionId);

    } catch (e) {
      console.error("❌ Lỗi parse phản hồi JSON:", e.message, body);
      process.exit(1);
    }
  });
});

req.on('error', (err) => {
  console.error("❌ Kết nối thất bại (Backend có đang chạy tại port 3001?):", err.message);
  process.exit(1);
});

req.write(multipartBody);
req.end();

// 4. Định nghĩa hàm polling kiểm tra SQLite kết quả
function pollResult(executionId) {
  console.log(`\n[3/4] Bắt đầu polling kết quả chấm điểm cho ID: ${executionId}...`);
  let attempts = 0;
  const maxAttempts = 30;

  const interval = setInterval(() => {
    attempts++;
    
    const getOptions = {
      hostname: '127.0.0.1',
      port: 3001,
      path: `/submissions/${executionId}`,
      method: 'GET'
    };

    const getReq = http.request(getOptions, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          if (res.statusCode === 200) {
            const submission = JSON.parse(body);
            if (submission.status === "finished") {
              clearInterval(interval);
              printResultReport(submission);
            }
          }
        } catch (e) {
          // Chưa có trong DB, tiếp tục poll
        }
      });
    });

    getReq.on('error', () => {});
    getReq.end();

    if (attempts >= maxAttempts) {
      clearInterval(interval);
      console.error("❌ Thất bại: Quá thời gian chờ chấm điểm (Timeout).");
      process.exit(1);
    }
  }, 300);
}

// 5. In kết quả cuối cùng
function printResultReport(submission) {
  console.log("\n[4/4] Báo cáo kết quả kiểm thử:");
  console.log("========================================================================");
  console.log(`Bài Lab ID : ${submission.labId}`);
  console.log(`Tên file   : ${submission.result ? submission.result.uploadedFileName : "unknown"}`);
  console.log(`Trạng thái : ${submission.status.toUpperCase()}`);
  console.log(`Điểm số    : ${submission.score}%`);
  console.log("========================================================================");

  const report = submission.result;
  if (report && Array.isArray(report.testResults)) {
    console.log("Chi tiết các task chấm điểm trong file ZIP:");
    report.testResults.forEach((test, i) => {
      const icon = test.passed ? "✅ PASS" : "❌ FAIL";
      console.log(`  - Task #${test.index + 1}: ${test.input} -> [${icon}]`);
      console.log(`    Mong muốn : ${test.expectedOutput}`);
      console.log(`    Thực tế   : ${test.actualOutput}`);
    });
  }
  console.log("========================================================================");

  if (submission.score === 100) {
    console.log("\n🎉 THÀNH CÔNG: Chức năng nộp ZIP Labtainer vượt qua kiểm thử tự động với 100/100 điểm!");
    process.exit(0);
  } else {
    console.error("\n❌ THẤT BẠI: Điểm chấm đạt được không đạt 100%.");
    process.exit(1);
  }
}
