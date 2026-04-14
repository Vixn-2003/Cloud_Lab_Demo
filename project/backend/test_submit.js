const http = require('http');

const data = JSON.stringify({
  code: "import sys\nnum = sys.stdin.read().split()\nprint(int(num[0]) + int(num[1]))",
  profileId: "python_basic",
  labId: "sum_two_numbers"
});

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/submit',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  let body = '';
  res.on('data', (d) => body += d);
  res.on('end', () => console.log(JSON.stringify(JSON.parse(body), null, 2)));
});

req.on('error', (error) => {
  console.error(error);
});

req.write(data);
req.end();
