const http = require('http');

const BACKEND_URL = 'http://localhost:3001';

// Helper to make HTTP requests
function request(url, options = {}, body = null) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const requestOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 80,
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    };

    const req = http.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const json = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, body: json });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('=== KHỞI CHẠY KIỂM THỬ TRẮC NGHIỆM (MCQ) & DUYỆT BÀI TẬP (PHASE 9) ===\n');

  let adminToken = '';
  let instructorToken = '';
  let studentToken = '';

  // 1. Đăng nhập Admin
  try {
    const res = await request(`${BACKEND_URL}/auth/login`, {
      method: 'POST'
    }, {
      username: 'admin',
      password: 'admin123'
    });
    if (res.status !== 200) throw new Error(res.body.error || 'Login failed');
    adminToken = res.body.token;
    console.log('✅ Đăng nhập Admin thành công.');
  } catch (e) {
    console.error('❌ Đăng nhập Admin thất bại:', e.message);
    process.exit(1);
  }

  // 2. Đăng nhập Giảng viên
  try {
    const res = await request(`${BACKEND_URL}/auth/login`, {
      method: 'POST'
    }, {
      username: 'instructor',
      password: 'instructor123'
    });
    if (res.status !== 200) throw new Error(res.body.error || 'Login failed');
    instructorToken = res.body.token;
    console.log('✅ Đăng nhập Giảng viên thành công.');
  } catch (e) {
    console.error('❌ Đăng nhập Giảng viên thất bại:', e.message);
    process.exit(1);
  }

  // 3. Đăng nhập Sinh viên
  try {
    const res = await request(`${BACKEND_URL}/auth/login`, {
      method: 'POST'
    }, {
      username: 'student',
      password: 'student123'
    });
    if (res.status !== 200) throw new Error(res.body.error || 'Login failed');
    studentToken = res.body.token;
    console.log('✅ Đăng nhập Sinh viên thành công.');
  } catch (e) {
    console.error('❌ Đăng nhập Sinh viên thất bại:', e.message);
    process.exit(1);
  }

  // 4. Giảng viên gửi yêu cầu phê duyệt bài lab
  let testLabId = 'sum-two-numbers';
  try {
    const res = await request(`${BACKEND_URL}/approvals`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${instructorToken}` }
    }, {
      labId: testLabId
    });
    if (res.status !== 201) throw new Error(res.body.error || 'API failed');
    console.log('✅ Giảng viên gửi yêu cầu phê duyệt bài tập thành công.');
  } catch (e) {
    console.error('❌ Gửi yêu cầu phê duyệt thất bại:', e.message);
    process.exit(1);
  }

  // 5. Admin xem danh sách phê duyệt
  let reqId = '';
  try {
    const res = await request(`${BACKEND_URL}/approvals`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (res.status !== 200) throw new Error(res.body.error || 'API failed');
    console.log(`✅ Admin lấy danh sách phê duyệt thành công. Tổng số: ${res.body.length} yêu cầu.`);
    const found = res.body.find(r => r.lab_id === testLabId && r.status === 'pending');
    if (found) {
      reqId = found.id;
      console.log(`- Tìm thấy yêu cầu cho bài lab: ${testLabId}, ID: ${reqId}`);
    } else {
      console.error('❌ Không tìm thấy yêu cầu phê duyệt ở trạng thái pending.');
      process.exit(1);
    }
  } catch (e) {
    console.error('❌ Lấy danh sách phê duyệt thất bại:', e.message);
    process.exit(1);
  }

  // 6. Admin phê duyệt bài tập
  try {
    const res = await request(`${BACKEND_URL}/approvals/${reqId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` }
    }, {
      status: 'approved',
      comments: 'Bài tập cấu hình chuẩn, testcases hoạt động tốt. Đồng ý phê duyệt.'
    });
    if (res.status !== 200) throw new Error(res.body.error || 'API failed');
    console.log('✅ Admin phê duyệt bài tập thành công.');
  } catch (e) {
    console.error('❌ Phê duyệt bài tập thất bại:', e.message);
    process.exit(1);
  }

  // 7. Tạo ca thực hành mới và gán trắc nghiệm MCQ
  let sessionId = '';
  try {
    const res = await request(`${BACKEND_URL}/sessions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${instructorToken}` }
    }, {
      name: 'Ca thi trắc nghiệm & lập trình mẫu',
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      durationMinutes: 60,
      classId: 'class-1',
      subjectId: 'algos',
      labIds: [testLabId],
      studentCodes: ['SV001'],
      penaltyMinutesPerWrongSubmit: 20,
      freezeBeforeEndMinutes: 10
    });
    if (res.status !== 201) throw new Error(res.body.error || 'API failed');
    sessionId = res.body.id;
    console.log(`✅ Tạo ca thi mới thành công. ID ca thi: ${sessionId}`);
  } catch (e) {
    console.error('❌ Tạo ca thi thất bại:', e.message);
    process.exit(1);
  }

  // 8. Giảng viên gán câu hỏi trắc nghiệm vào ca thi
  try {
    const res = await request(`${BACKEND_URL}/sessions/${sessionId}/mcqs/assign`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${instructorToken}` }
    }, {
      questionIds: ['q1', 'q2', 'q3']
    });
    if (res.status !== 200) throw new Error(res.body.error || 'API failed');
    console.log('✅ Giảng viên gán 3 câu hỏi trắc nghiệm vào ca thi thành công.');
  } catch (e) {
    console.error('❌ Gán trắc nghiệm thất bại:', e.message);
    process.exit(1);
  }

  // 9. Sinh viên lấy danh sách trắc nghiệm của ca thi
  try {
    const res = await request(`${BACKEND_URL}/sessions/${sessionId}/mcqs`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    if (res.status !== 200) throw new Error(res.body.error || 'API failed');
    console.log(`✅ Sinh viên lấy danh sách trắc nghiệm thành công. Số câu hỏi: ${res.body.length}`);
    if (res.body.length !== 3) {
      console.error('❌ Số lượng câu hỏi không khớp với gán ban đầu.');
      process.exit(1);
    }
  } catch (e) {
    console.error('❌ Lấy danh sách trắc nghiệm thất bại:', e.message);
    process.exit(1);
  }

  // 10. Sinh viên nộp bài trắc nghiệm
  try {
    const res = await request(`${BACKEND_URL}/sessions/${sessionId}/mcqs/submit`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` }
    }, {
      answers: [
        { questionId: 'q1', selectedOption: 2 }, // Đúng
        { questionId: 'q2', selectedOption: 1 }, // Đúng
        { questionId: 'q3', selectedOption: 0 }  // Sai (đúng là 2)
      ]
    });
    if (res.status !== 200) throw new Error(res.body.error || 'API failed');
    console.log('✅ Sinh viên nộp bài trắc nghiệm thành công.');
    console.log(`- Kết quả: ${res.body.correct}/${res.body.total} câu đúng. Điểm số: ${res.body.score}`);
    if (res.body.correct !== 2 || res.body.score !== 67) {
      console.error('❌ Điểm chấm trắc nghiệm tự động không chính xác!');
      process.exit(1);
    }
  } catch (e) {
    console.error('❌ Sinh viên nộp trắc nghiệm thất bại:', e.message);
    process.exit(1);
  }

  // 11. Sinh viên tải lại câu trả lời đã lưu
  try {
    const res = await request(`${BACKEND_URL}/sessions/${sessionId}/mcqs/answers`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    if (res.status !== 200) throw new Error(res.body.error || 'API failed');
    console.log(`✅ Tải lại đáp án đã lưu thành công. Số câu trả lời tìm thấy: ${res.body.length}`);
    if (res.body.length !== 3) {
      console.error('❌ Số lượng câu trả lời đã lưu không đúng!');
      process.exit(1);
    }
  } catch (e) {
    console.error('❌ Tải đáp án thất bại:', e.message);
    process.exit(1);
  }

  // 12. Dọn dẹp ca thi kiểm thử
  try {
    await request(`${BACKEND_URL}/sessions/${sessionId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${instructorToken}` }
    });
    console.log('✅ Đã xóa dọn dẹp ca thi thành công.');
  } catch (e) {
    console.warn('⚠️ Lỗi dọn dẹp ca thi:', e.message);
  }

  console.log('\n=== KẾT THÚC KIỂM THỬ GIAI ĐOẠN 9: TẤT CẢ ĐỀU ĐẠT (PASS) ===');
}

runTests();
