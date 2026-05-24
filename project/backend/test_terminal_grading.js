const http = require('http');
const { io } = require("socket.io-client");

console.log("🚀 STARTING INTEGRATION TEST FOR WEB TERMINAL PHASE 2 AUTO-GRADING...");

// 1. Initialize Terminal Session via POST /terminal/init with labId
const initData = JSON.stringify({ labId: "lab_winlocker_analysis" });

const options = {
  hostname: '127.0.0.1',
  port: 3001,
  path: '/terminal/init',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(initData)
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    const { sessionId } = JSON.parse(body);
    console.log(`[INIT] Terminal Session Created successfully! SessionID: ${sessionId}`);
    
    // 2. Connect via Socket.IO
    const socket = io("http://127.0.0.1:3001");
    
    socket.on("connect", () => {
      console.log("[SOCKET] Connected to WebSocket. Starting terminal process...");
      socket.emit("terminal:start", { sessionId });
      
      // We also join the execution room to receive execution status updates
      socket.emit("subscribe", sessionId);
    });

    socket.on("terminal:output", (event) => {
      // Log some output for debug
      if (event.data.includes("Bài thực hành: Phân tích Động")) {
        console.log("[TERMINAL PROMPT RECEIVED] Seeding instruction banner is working!");
      }
    });

    // Wait a brief moment for the PTY process to spawn, then write the solution.sh!
    setTimeout(() => {
      console.log("[SOCKET] Typing 'solution.sh' into the terminal...");
      
      // Write the solution.sh script that outputs the expected ENCRYPTED_FILE and C2_IP
      const scriptContent = `cat << 'EOF' > solution.sh
#!/bin/bash
echo "ENCRYPTED_FILE: C:\\\\users\\\\public\\\\encrypted_data.txt"
echo "C2_IP: 172.25.0.100"
EOF
chmod +x solution.sh
exit
`;
      socket.emit("terminal:input", { sessionId, data: scriptContent });
    }, 1500);

    // 3. Listen for the WebSocket execution status update (which carries the grading result)
    socket.on("execution:status", (event) => {
      console.log(`[STATUS RECEIVED] Status: ${event.status}`);
      if (event.status === "finished") {
        const payload = event.payload;
        console.log("\n💯 GRADING RESPONSE RECEIVED SUCCESSFULLY!");
        console.log("Score      :", payload.score + "%");
        console.log("Passed     :", payload.passedTests + "/" + payload.totalTests);
        
        // Assert that the score is 100/100
        if (payload.score === 100) {
          console.log("\n✅ INTEGRATION TEST PASSED: 100/100 points graded successfully!");
          socket.disconnect();
          process.exit(0);
        } else {
          console.error(`\n❌ INTEGRATION TEST FAILED: Expected score 100, got ${payload.score}`);
          socket.disconnect();
          process.exit(1);
        }
      } else if (event.status === "failed") {
        console.error("\n❌ INTEGRATION TEST FAILED: Grading failed with error:", event.payload);
        socket.disconnect();
        process.exit(1);
      }
    });
  });
});

req.on('error', (err) => {
  console.error("Failed to connect to backend api:", err.message);
  process.exit(1);
});

req.write(initData);
req.end();
