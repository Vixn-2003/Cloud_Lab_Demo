const http = require('http');

function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : '';
    const headers = {
      'Content-Type': 'application/json',
    };
    if (data) {
      headers['Content-Length'] = Buffer.byteLength(postData);
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const options = {
      hostname: '127.0.0.1',
      port: 3001,
      path: path,
      method: method,
      headers: headers
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (d) => body += d);
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            body: body ? JSON.parse(body) : null
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            body: body
          });
        }
      });
    });

    req.on('error', (e) => reject(e));
    if (data) {
      req.write(postData);
    }
    req.end();
  });
}

async function runTests() {
  console.log("=== STARTING AUTH & RBAC ENDPOINT TESTS ===\n");

  // Test 1: Đăng nhập thất bại (sai mật khẩu)
  console.log("Test 1: Login with invalid credentials...");
  const loginFail = await makeRequest('POST', '/auth/login', { username: 'student', password: 'wrongpassword' });
  console.log(`Status: ${loginFail.statusCode}, Response:`, loginFail.body);
  if (loginFail.statusCode === 401 && loginFail.body.error) {
    console.log("✅ Test 1 Passed.\n");
  } else {
    console.log("❌ Test 1 Failed.\n");
  }

  // Test 2: Đăng nhập thành công (Sinh viên)
  console.log("Test 2: Login successfully as student...");
  const loginStudent = await makeRequest('POST', '/auth/login', { username: 'student', password: 'student123' });
  console.log(`Status: ${loginStudent.statusCode}`);
  const studentToken = loginStudent.body?.token;
  console.log(`Token received: ${studentToken ? 'YES (Valid Length)' : 'NO'}`);
  console.log(`User Info:`, loginStudent.body?.user);
  if (loginStudent.statusCode === 200 && studentToken && loginStudent.body?.user?.role === 'student') {
    console.log("✅ Test 2 Passed.\n");
  } else {
    console.log("❌ Test 2 Failed.\n");
  }

  // Test 3: Đăng nhập thành công (Giảng viên)
  console.log("Test 3: Login successfully as instructor...");
  const loginInstructor = await makeRequest('POST', '/auth/login', { username: 'instructor', password: 'instructor123' });
  console.log(`Status: ${loginInstructor.statusCode}`);
  const instructorToken = loginInstructor.body?.token;
  console.log(`User Info:`, loginInstructor.body?.user);
  if (loginInstructor.statusCode === 200 && instructorToken && loginInstructor.body?.user?.role === 'instructor') {
    console.log("✅ Test 3 Passed.\n");
  } else {
    console.log("❌ Test 3 Failed.\n");
  }

  // Test 4: Gọi GET /auth/me với token hợp lệ
  console.log("Test 4: Get profile using valid token...");
  const profileRes = await makeRequest('GET', '/auth/me', null, studentToken);
  console.log(`Status: ${profileRes.statusCode}, Response User:`, profileRes.body?.user);
  if (profileRes.statusCode === 200 && profileRes.body?.user?.username === 'student') {
    console.log("✅ Test 4 Passed.\n");
  } else {
    console.log("❌ Test 4 Failed.\n");
  }

  // Test 5: Gọi GET /auth/me với token giả/hết hạn
  console.log("Test 5: Get profile using invalid token...");
  const profileInvalidRes = await makeRequest('GET', '/auth/me', null, 'invalid_token_here');
  console.log(`Status: ${profileInvalidRes.statusCode}, Response:`, profileInvalidRes.body);
  if (profileInvalidRes.statusCode === 401) {
    console.log("✅ Test 5 Passed.\n");
  } else {
    console.log("❌ Test 5 Failed.\n");
  }

  // Test 6: Gửi nộp bài với token hợp lệ (kiểm tra lưu user_id)
  console.log("Test 6: Submit code with valid student token...");
  const submitRes = await makeRequest('POST', '/submit', {
    code: "print('hello')",
    profileId: "python_basic",
    labId: "sum_two_numbers"
  }, studentToken);
  console.log(`Status: ${submitRes.statusCode}, Response:`, submitRes.body);
  if (submitRes.statusCode === 200 && submitRes.body?.executionId) {
    console.log("✅ Test 6 Passed.\n");
  } else {
    console.log("❌ Test 6 Failed.\n");
  }

  // Test 7: Đăng xuất
  console.log("Test 7: Logout...");
  const logoutRes = await makeRequest('POST', '/auth/logout');
  console.log(`Status: ${logoutRes.statusCode}, Response:`, logoutRes.body);
  if (logoutRes.statusCode === 200 && logoutRes.body.success) {
    console.log("✅ Test 7 Passed.\n");
  } else {
    console.log("❌ Test 7 Failed.\n");
  }

  console.log("=== AUTH & RBAC VERIFICATION COMPLETED ===");
}

runTests().catch(console.error);
