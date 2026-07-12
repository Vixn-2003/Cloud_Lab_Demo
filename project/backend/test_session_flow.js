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

    req.on('error', (e) => reject(e));

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('=== KHỞI CHẠY KIỂM THỬ LUỒNG HỌC VỤ & CA THI (PHASE 7) ===\n');

  let instructorToken = '';
  let studentToken = '';
  let createdSessionId = '';

  // 1. Đăng nhập với vai trò giảng viên
  console.log('Ca 1: Đăng nhập giảng viên...');
  try {
    const res = await request(`${BACKEND_URL}/auth/login`, { method: 'POST' }, {
      username: 'instructor',
      password: 'instructor123',
    });
    if (res.status === 200 && res.body.token) {
      instructorToken = res.body.token;
      console.log('✅ Đăng nhập giảng viên thành công. Token nhận được.');
    } else {
      console.error('❌ Đăng nhập giảng viên thất bại:', res.body);
      process.exit(1);
    }
  } catch (e) {
    console.error('❌ Lỗi kết nối backend. Vui lòng chạy backend dev server trước.', e.message);
    process.exit(1);
  }

  // 2. Lấy danh sách học kỳ & lớp học
  console.log('\nCa 2: Lấy danh sách học kỳ & lớp học...');
  const resSem = await request(`${BACKEND_URL}/semesters`, {
    headers: { 'Authorization': `Bearer ${instructorToken}` }
  });
  console.log(`- Số lượng học kỳ: ${resSem.body.length}`);
  console.log(`- Chi tiết học kỳ đầu tiên:`, resSem.body[0]);

  const resClass = await request(`${BACKEND_URL}/classes`, {
    headers: { 'Authorization': `Bearer ${instructorToken}` }
  });
  console.log(`- Số lượng lớp học: ${resClass.body.length}`);
  console.log(`- Chi tiết lớp đầu tiên:`, resClass.body[0]);

  // 3. Giảng viên tạo ca thi mới
  console.log('\nCa 3: Giảng viên tạo ca thi mới...');
  const now = new Date();
  const startTime = new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(); // Bắt đầu 1h trước
  const endTime = new Date(now.getTime() + 1 * 60 * 60 * 1000).toISOString();   // Kết thúc sau 1h
  
  const newSessionPayload = {
    name: 'Thi học trình an toàn thông tin K21',
    location: 'Phòng Máy 401-A2',
    classId: 'class-1',
    startTime,
    endTime,
    allowBrowser: false,
    freezeBeforeEndMinutes: 10,
    penaltyMinutesPerWrongSubmit: 15,
    submissionMode: 'auto',
    labIds: ['sum_two_numbers'],
    participants: [
      {
        username: 'student',
        fullName: 'Sinh viên Demo',
        studentCode: 'B21DCCN001',
        email: 'student@student.ptit.edu.vn',
        examRoom: 'PM-401',
        seatIp: '192.168.1.10',
        hostname: 'DESKTOP-PTIT-01',
        variantCode: 'Đề số 02'
      }
    ],
    instructors: []
  };

  const resCreateSession = await request(`${BACKEND_URL}/sessions`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${instructorToken}` }
  }, newSessionPayload);

  if (resCreateSession.status === 201 && resCreateSession.body.id) {
    createdSessionId = resCreateSession.body.id;
    console.log(`✅ Tạo ca thi thành công. ID ca thi: ${createdSessionId}`);
  } else {
    console.error('❌ Tạo ca thi thất bại:', resCreateSession.body);
    process.exit(1);
  }

  // 4. Đăng nhập với vai trò sinh viên
  console.log('\nCa 4: Đăng nhập sinh viên...');
  const resStudentLogin = await request(`${BACKEND_URL}/auth/login`, { method: 'POST' }, {
    username: 'student',
    password: 'student123',
  });
  if (resStudentLogin.status === 200 && resStudentLogin.body.token) {
    studentToken = resStudentLogin.body.token;
    console.log('✅ Đăng nhập sinh viên thành công.');
  } else {
    console.error('❌ Đăng nhập sinh viên thất bại:', resStudentLogin.body);
    process.exit(1);
  }

  // 5. Sinh viên gọi API lấy ca thi active
  console.log('\nCa 5: Sinh viên lấy thông tin ca thi đang diễn ra...');
  const resActiveSession = await request(`${BACKEND_URL}/sessions/active`, {
    headers: { 'Authorization': `Bearer ${studentToken}` }
  });

  if (resActiveSession.status === 200 && resActiveSession.body) {
    console.log('✅ Lấy ca thi active thành công. Chi tiết:');
    console.log(`- Tên ca thi: ${resActiveSession.body.name}`);
    console.log(`- Phòng thi: ${resActiveSession.body.exam_room}`);
    console.log(`- Mã đề: ${resActiveSession.body.variant_code}`);
    console.log(`- Các bài lab được giao: ${resActiveSession.body.labIds.join(', ')}`);
  } else {
    console.error('❌ Lấy ca thi active thất bại hoặc trống:', resActiveSession.body);
    process.exit(1);
  }

  // 6. Sinh viên nộp bài kèm sessionId
  console.log('\nCa 6: Sinh viên nộp bài thi kèm sessionId...');
  const resSubmit = await request(`${BACKEND_URL}/submit`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${studentToken}` }
  }, {
    code: 'a = int(input())\nb = int(input())\nprint(a + b)\n',
    profileId: 'python_basic',
    labId: 'sum_two_numbers',
    sessionId: createdSessionId
  });

  if (resSubmit.status === 200 && resSubmit.body.executionId) {
    console.log(`✅ Nộp bài thi thành công. Mã lượt nộp (ExecutionID): ${resSubmit.body.executionId}`);
  } else {
    console.error('❌ Nộp bài thi thất bại:', resSubmit.body);
    process.exit(1);
  }

  // Đợi cho luồng chấm điểm lưu DB hoàn tất để tránh lỗi khóa ngoại khi xóa ca thi đang thi
  console.log('\nĐợi 2.5 giây cho luồng chấm điểm tự động hoàn tất và ghi kết quả vào DB...');
  await new Promise(resolve => setTimeout(resolve, 2500));

  // 7. Dọn dẹp ca thi thử nghiệm
  console.log('\nCa 7: Dọn dẹp ca thi thử nghiệm sau kiểm thử...');
  const resDelete = await request(`${BACKEND_URL}/sessions/${createdSessionId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${instructorToken}` }
  });
  if (resDelete.status === 200) {
    console.log('✅ Đã xóa ca thi thử nghiệm thành công.');
  } else {
    console.error('❌ Xóa ca thi thất bại:', resDelete.body);
  }

  console.log('\n=== KẾT THÚC KIỂM THỬ HỌC VỤ & CA THI: TẤT CẢ ĐỀU ĐẠT (PASS) ===');
}

runTests();
