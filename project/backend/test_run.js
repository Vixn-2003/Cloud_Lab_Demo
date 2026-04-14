const http = require('http');

const data = JSON.stringify({
  code: "print('hello from python')",
  profileId: "python_basic",
  stdin: ""
});

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/run',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  res.on('data', (d) => {
    process.stdout.write(d);
  });
});

req.on('error', (error) => {
  console.error(error);
});

req.write(data);
req.end();
