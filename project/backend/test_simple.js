const http = require('http');
const { io } = require("socket.io-client");

const socket = io("http://localhost:3001");

socket.on("connect", () => {
  const code = `#!/bin/bash
echo "ENCRYPTED_FILE: C:\\\\users\\\\public\\\\encrypted_data.txt"
echo "C2_IP: 172.25.0.100"
`;

  const body = JSON.stringify({
    code,
    profileId: "malware_analysis_shell",
    labId: "lab_winlocker_analysis"
  });

  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/submit',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body)
    }
  };

  const req = http.request(options, (res) => {
    let d = '';
    res.on('data', chunk => d += chunk);
    res.on('end', () => {
      const parsed = JSON.parse(d);
      socket.emit("subscribe", parsed.executionId);
    });
  });
  req.write(body);
  req.end();
});

socket.on("execution:status", (event) => {
  if (event.status === "finished" || event.status === "failed" || event.status === "timeout") {
    console.log(JSON.stringify(event.payload, null, 2));
    socket.disconnect();
    process.exit(0);
  }
});
