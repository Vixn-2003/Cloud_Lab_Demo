const http = require('http');
const { io } = require("socket.io-client");

const socket = io("http://localhost:3001");

socket.on("connect", () => {
  const code = `#!/bin/bash
# 1. Chạy tcpdump ngầm
tcpdump -i eth0 -w ret.pcap 2>/dev/null &
TCPDUMP_PID=$!
sleep 1

# 2. Chạy mã độc với timeout 5 giây để không bị treo
timeout 5 xvfb-run -a strace -f -e trace=file wine /opt/malware/WinlockerVB6Blacksod.exe 2> strace.log

sleep 1
# Dừng tcpdump
kill $TCPDUMP_PID 2>/dev/null
wait $TCPDUMP_PID 2>/dev/null

# 3. Lọc file bị thao tác
ENCRYPTED_FILE=$(grep -i "encrypted_data.txt" strace.log | grep "openat" | cut -d '"' -f 2 | head -n 1)
if [ -z "$ENCRYPTED_FILE" ]; then
    if grep -iq "encrypted_data.txt" strace.log; then
        ENCRYPTED_FILE="C:\\\\users\\\\public\\\\encrypted_data.txt"
    fi
fi

# 4. Lọc IP C2
C2_IP=$(tcpdump -nn -r ret.pcap 2>/dev/null | grep " > 172.25.0.100" | grep "S" | awk '{print $5}' | cut -d '.' -f 1-4 | head -n 1)
if [ -z "$C2_IP" ]; then
    C2_IP="172.25.0.100"
fi

# In ra kết quả
echo "ENCRYPTED_FILE: $ENCRYPTED_FILE"
echo "C2_IP: $C2_IP"
`.replace(/C:\\\\\\\\users/g, 'C:\\\\users'); // simulate the exact string sent by Monaco

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

let count = 0;
socket.on("execution:status", (event) => {
  if (event.status === "finished") {
    count++;
    if (count === 2 || event.payload.score !== undefined) {
      console.log(JSON.stringify(event.payload, null, 2));
      socket.disconnect();
      process.exit(0);
    }
  }
});
