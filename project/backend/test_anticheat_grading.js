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
  console.log('=== KHỞI CHẠY KIỂM THỬ CHỐNG GIAN LẬN & CHẤM ĐIỂM (PHASE 8) ===\n');

  let instructorToken = '';
  let studentAToken = '';
  let studentBToken = '';
  let createdSessionId = '';
  let submissionAId = '';
  let submissionBId = '';

  // 1. Đăng nhập giảng viên
  console.log('Ca 1: Đăng nhập giảng viên...');
  const resLoginInst = await request(`${BACKEND_URL}/auth/login`, { method: 'POST' }, {
    username: 'instructor',
    password: 'instructor123',
  });
  if (resLoginInst.status === 200 && resLoginInst.body.token) {
    instructorToken = resLoginInst.body.token;
    console.log('✅ Đăng nhập giảng viên thành công.');
  } else {
    console.error('❌ Đăng nhập giảng viên thất bại:', resLoginInst.body);
    process.exit(1);
  }

  // 2. Tạo ca thực hành gán bài lab và 2 sinh viên test trùng lặp
  console.log('\nCa 2: Tạo ca thi mới gán bài lab và sinh viên...');
  const now = new Date();
  const startTime = new Date(now.getTime() - 30 * 60 * 1000).toISOString(); // Bắt đầu 30 phút trước
  const endTime = new Date(now.getTime() + 60 * 60 * 1000).toISOString();   // Kết thúc sau 60 phút

  const sessionPayload = {
    name: 'Thi lập trình chống sao chép kỳ 1',
    location: 'PM-401',
    classId: 'class-1',
    startTime,
    endTime,
    allowBrowser: false,
    freezeBeforeEndMinutes: 10,
    penaltyMinutesPerWrongSubmit: 20,
    submissionMode: 'auto',
    labIds: ['sum_two_numbers'],
    participants: [
      {
        username: 'student_test_a',
        fullName: 'Nguyễn Văn Sao',
        studentCode: 'B21DCCN888',
        email: 'sao@ptit.edu.vn',
        examRoom: 'PM-401',
        seatIp: '192.168.1.101',
        hostname: 'DESKTOP-SAO'
      },
      {
        username: 'student_test_b',
        fullName: 'Trần Văn Chép',
        studentCode: 'B21DCCN999',
        email: 'chep@ptit.edu.vn',
        examRoom: 'PM-401',
        seatIp: '192.168.1.102',
        hostname: 'DESKTOP-CHEP'
      }
    ],
    instructors: []
  };

  const resCreate = await request(`${BACKEND_URL}/sessions`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${instructorToken}` }
  }, sessionPayload);

  if (resCreate.status === 201 && resCreate.body.id) {
    createdSessionId = resCreate.body.id;
    console.log(`✅ Tạo ca thi thành công. ID: ${createdSessionId}`);
  } else {
    console.error('❌ Tạo ca thi thất bại:', resCreate.body);
    process.exit(1);
  }

  // 3. Đăng nhập và nộp bài Sinh viên A
  console.log('\nCa 3: Đăng nhập Sinh viên A và nộp bài...');
  const resLoginA = await request(`${BACKEND_URL}/auth/login`, { method: 'POST' }, {
    username: 'student_test_a',
    password: 'student123',
  });
  if (resLoginA.status === 200 && resLoginA.body.token) {
    studentAToken = resLoginA.body.token;
    console.log('✅ Sinh viên A đăng nhập thành công.');
  } else {
    console.error('❌ Sinh viên A đăng nhập thất bại:', resLoginA.body);
    process.exit(1);
  }

  const codeA = `
# Giải bài toán cộng 2 số
a = int(input())
b = int(input())
print(a + b)
`;
  const resSubA = await request(`${BACKEND_URL}/submit`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${studentAToken}` }
  }, {
    code: codeA,
    profileId: 'python_basic',
    labId: 'sum_two_numbers',
    sessionId: createdSessionId
  });

  if (resSubA.status === 200 && resSubA.body.executionId) {
    submissionAId = resSubA.body.executionId;
    console.log(`✅ Sinh viên A nộp bài thành công. ExecutionID: ${submissionAId}`);
  } else {
    console.error('❌ Sinh viên A nộp bài thất bại:', resSubA.body);
    process.exit(1);
  }

  // 4. Đăng nhập và nộp bài Sinh viên B (mã nguồn giống 100%)
  console.log('\nCa 4: Đăng nhập Sinh viên B và nộp bài trùng lặp 100%...');
  const resLoginB = await request(`${BACKEND_URL}/auth/login`, { method: 'POST' }, {
    username: 'student_test_b',
    password: 'student123',
  });
  if (resLoginB.status === 200 && resLoginB.body.token) {
    studentBToken = resLoginB.body.token;
    console.log('✅ Sinh viên B đăng nhập thành công.');
  } else {
    console.error('❌ Sinh viên B đăng nhập thất bại:', resLoginB.body);
    process.exit(1);
  }

  // Code B y hệt code A, chỉ đổi một dòng comment nhưng thuật toán tokenized cosine similarity vẫn sẽ phát hiện trùng
  const codeB = `
# Bai toan cong hai so nguyen duong
a = int(input())
b = int(input())
print(a + b)
`;
  const resSubB = await request(`${BACKEND_URL}/submit`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${studentBToken}` }
  }, {
    code: codeB,
    profileId: 'python_basic',
    labId: 'sum_two_numbers',
    sessionId: createdSessionId
  });

  if (resSubB.status === 200 && resSubB.body.executionId) {
    submissionBId = resSubB.body.executionId;
    console.log(`✅ Sinh viên B nộp bài thành công. ExecutionID: ${submissionBId}`);
  } else {
    console.error('❌ Sinh viên B nộp bài thất bại:', resSubB.body);
    process.exit(1);
  }

  // Đợi cho việc chấm bài chạy ngầm hoàn tất ghi vào DB
  console.log('\nĐợi 3 giây cho tiến trình chấm bài tự động nạp kết quả vào DB...');
  await new Promise(resolve => setTimeout(resolve, 3000));

  // 5. Giảng viên chạy quét trùng lặp
  console.log('\nCa 5: Giảng viên thực hiện quét sao chép (Plagiarism Scan)...');
  const resScan = await request(`${BACKEND_URL}/sessions/${createdSessionId}/plagiarism/scan`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${instructorToken}` }
  }, { threshold: 0.7 });

  if (resScan.status === 200) {
    console.log(`✅ Quét sao chép thành công. Tìm thấy ${resScan.body.count} ca trùng lặp.`);
    if (resScan.body.count !== 1) {
      console.error('❌ Lỗi: Phải phát hiện đúng 1 ca trùng mã nguồn!');
      process.exit(1);
    }
  } else {
    console.error('❌ Quét sao chép lỗi:', resScan.body);
    process.exit(1);
  }

  // 6. Lấy danh sách ca sao chép
  console.log('\nCa 6: Lấy chi tiết các ca sao chép...');
  const resCases = await request(`${BACKEND_URL}/sessions/${createdSessionId}/plagiarism/cases`, {
    headers: { 'Authorization': `Bearer ${instructorToken}` }
  });

  let caseId = '';
  if (resCases.status === 200 && resCases.body.length > 0) {
    caseId = resCases.body[0].id;
    console.log(`✅ Lấy chi tiết thành công. Mã vụ: ${caseId}`);
    console.log(`- Độ tương đồng: ${Math.round(resCases.body[0].similarity_score * 100)}%`);
    console.log(`- Sinh viên A: ${resCases.body[0].student_a_username}`);
    console.log(`- Sinh viên B: ${resCases.body[0].student_b_username}`);
  } else {
    console.error('❌ Lấy danh sách ca sao chép lỗi:', resCases.body);
    process.exit(1);
  }

  // 7. Duyệt "Xác nhận gian lận" (Confirmed)
  console.log('\nCa 7: Xác nhận gian lận sao chép...');
  const resConfirm = await request(`${BACKEND_URL}/plagiarism/cases/${caseId}`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${instructorToken}` }
  }, { status: 'confirmed' });

  if (resConfirm.status === 200 && resConfirm.body.success) {
    console.log('✅ Xác nhận thành công. Kiểm tra trạng thái nộp bài của sinh viên...');
    
    // Kiểm tra xem điểm số của sinh viên A và B có bị đặt về 0 và CPY không
    const resAInfo = await request(`${BACKEND_URL}/submissions`, {
      headers: { 'Authorization': `Bearer ${studentAToken}` }
    });
    const subA = resAInfo.body.find(s => s.id === submissionAId);
    console.log(`- Trạng thái Sinh viên A: điểm = ${subA.score}, mã kết quả = ${subA.result_code}, trạng thái = ${subA.status}`);
    
    if (subA.score !== 0 || subA.result_code !== 'CPY' || subA.status !== 'failed') {
      console.error('❌ Lỗi: Điểm của sinh viên A không bị đặt về 0 / CPY!');
      process.exit(1);
    }
    console.log('✅ Xác minh dữ liệu toàn vẹn sau xử phạt thành công.');
  } else {
    console.error('❌ Xác nhận gian lận lỗi:', resConfirm.body);
    process.exit(1);
  }

  // 8. Chấm điểm thủ công
  console.log('\nCa 8: Giảng viên chấm điểm thủ công bài làm...');
  const resGrade = await request(`${BACKEND_URL}/submissions/${submissionAId}/grade`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${instructorToken}` }
  }, {
    score: 85,
    comment: 'Bài nộp khá tốt, được chấm lại thủ công'
  });

  if (resGrade.status === 200 && resGrade.body.success) {
    console.log('✅ Chấm điểm thủ công thành công.');
    const resAInfo2 = await request(`${BACKEND_URL}/submissions`, {
      headers: { 'Authorization': `Bearer ${studentAToken}` }
    });
    const subA2 = resAInfo2.body.find(s => s.id === submissionAId);
    console.log(`- Điểm sau chấm thủ công: ${subA2.score}, Trạng thái: ${subA2.status}, Lời phê: ${subA2.result.feedback}`);
    
    if (subA2.score !== 85 || subA2.status !== 'graded') {
      console.error('❌ Lỗi chấm điểm thủ công không lưu chính xác!');
      process.exit(1);
    }
  } else {
    console.error('❌ Chấm điểm thủ công lỗi:', resGrade.body);
    process.exit(1);
  }

  // 9. Lấy bảng xếp hạng ca thi
  console.log('\nCa 9: Lấy bảng xếp hạng ca thi...');
  const resBoard = await request(`${BACKEND_URL}/sessions/${createdSessionId}/leaderboard`, {
    headers: { 'Authorization': `Bearer ${instructorToken}` }
  });
  console.log(`- Số lượng thí sinh trên bảng: ${resBoard.body.length}`);
  console.log(`- Thí sinh dẫn đầu: ${resBoard.body[0].fullName} (Số bài đúng: ${resBoard.body[0].solvedCount})`);

  // 10. Dọn dẹp ca thi
  console.log('\nCa 10: Dọn dẹp ca thi test...');
  const resDelete = await request(`${BACKEND_URL}/sessions/${createdSessionId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${instructorToken}` }
  });
  if (resDelete.status === 200) {
    console.log('✅ Đã xóa ca thi dọn dẹp thành công.');
  } else {
    console.error('❌ Xóa ca thi lỗi:', resDelete.body);
  }

  console.log('\n=== KẾT THÚC KIỂM THỬ CHỐNG GIAN LẬN: TẤT CẢ ĐỀU ĐẠT (PASS) ===');
}

runTests();
