import Database from "better-sqlite3";
import * as path from "path";
import { SubmissionRecord } from "../models/types";
import { AuthService } from "./AuthService";
import { v4 as uuidv4 } from "uuid";

export class DatabaseService {
  private db: Database.Database;

  constructor() {
    const dbPath = path.resolve(process.cwd(), "lab_platform.db");
    this.db = new Database(dbPath);
    this.init();
  }

  private init() {
    // 1. Tạo bảng submissions
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS submissions (
        id TEXT PRIMARY KEY,
        lab_id TEXT NOT NULL,
        profile_id TEXT NOT NULL,
        mode TEXT NOT NULL,
        code TEXT NOT NULL,
        language TEXT NOT NULL,
        status TEXT NOT NULL,
        score INTEGER,
        result_json TEXT,
        created_at TEXT NOT NULL
      )
    `);

    // 2. Tạo bảng users
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        full_name TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('student','instructor','admin')),
        student_code TEXT,
        email TEXT,
        created_at TEXT NOT NULL
      )
    `);

    // 3. Tạo bảng semesters
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS semesters (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        start_date TEXT,
        end_date TEXT
      )
    `);

    // 4. Tạo bảng classes
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS classes (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        subject_id TEXT NOT NULL,
        semester_id TEXT NOT NULL REFERENCES semesters(id)
      )
    `);

    // 5. Tạo bảng class_members
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS class_members (
        class_id TEXT REFERENCES classes(id) ON DELETE CASCADE,
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        role_in_class TEXT CHECK(role_in_class IN ('student','instructor')),
        PRIMARY KEY (class_id, user_id)
      )
    `);

    // 6. Tạo bảng practice_sessions (ca thi/ca thực hành)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS practice_sessions (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        banner_url TEXT,
        location TEXT,
        class_id TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('draft','scheduled','active','frozen','ended')),
        allow_browser BOOLEAN DEFAULT 0,
        freeze_before_end_minutes INTEGER DEFAULT 0,
        penalty_minutes_per_wrong_submit INTEGER DEFAULT 0,
        submission_mode TEXT CHECK(submission_mode IN ('auto','manual')),
        created_by TEXT REFERENCES users(id)
      )
    `);

    // 7. Tạo bảng session_labs (liên kết ca thi và bài tập)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS session_labs (
        session_id TEXT REFERENCES practice_sessions(id) ON DELETE CASCADE,
        lab_id TEXT NOT NULL,
        PRIMARY KEY (session_id, lab_id)
      )
    `);

    // 8. Tạo bảng session_participants (danh sách sinh viên tham gia ca thi)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS session_participants (
        session_id TEXT REFERENCES practice_sessions(id) ON DELETE CASCADE,
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        exam_room TEXT,
        seat_ip TEXT,
        hostname TEXT,
        variant_code TEXT,
        status TEXT DEFAULT 'not_submitted',
        PRIMARY KEY (session_id, user_id)
      )
    `);

    // 9. Tạo bảng session_instructors (phân công giảng viên coi ca thi)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS session_instructors (
        session_id TEXT REFERENCES practice_sessions(id) ON DELETE CASCADE,
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        duty TEXT CHECK(duty IN ('owner','proctor')),
        PRIMARY KEY (session_id, user_id)
      )
    `);

    // 10. Thực hiện migrations nâng cấp bảng submissions
    const tableInfo = this.db.prepare("PRAGMA table_info(submissions)").all() as any[];
    const columns = tableInfo.map(col => col.name);
    
    if (!columns.includes("user_id")) {
      this.db.exec("ALTER TABLE submissions ADD COLUMN user_id TEXT REFERENCES users(id)");
    }
    if (!columns.includes("client_ip")) {
      this.db.exec("ALTER TABLE submissions ADD COLUMN client_ip TEXT");
    }
    if (!columns.includes("hostname")) {
      this.db.exec("ALTER TABLE submissions ADD COLUMN hostname TEXT");
    }
    if (!columns.includes("session_id")) {
      this.db.exec("ALTER TABLE submissions ADD COLUMN session_id TEXT REFERENCES practice_sessions(id)");
    }
    if (!columns.includes("result_code")) {
      this.db.exec("ALTER TABLE submissions ADD COLUMN result_code TEXT DEFAULT 'pending'");
    }
    if (!columns.includes("graded_by")) {
      this.db.exec("ALTER TABLE submissions ADD COLUMN graded_by TEXT REFERENCES users(id)");
    }

    // 10b. Tạo bảng plagiarism_cases
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS plagiarism_cases (
        id TEXT PRIMARY KEY,
        session_id TEXT REFERENCES practice_sessions(id) ON DELETE CASCADE,
        lab_id TEXT NOT NULL,
        student_a_id TEXT REFERENCES users(id),
        student_b_id TEXT REFERENCES users(id),
        similarity_score REAL,
        code_a TEXT,
        code_b TEXT,
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending','confirmed','dismissed')),
        created_at TEXT NOT NULL
      )
    `);

    // 10c. Tạo bảng câu hỏi trắc nghiệm mcq_questions
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS mcq_questions (
        id TEXT PRIMARY KEY,
        subject_id TEXT NOT NULL,
        question_text TEXT NOT NULL,
        options_json TEXT NOT NULL,
        correct_option INTEGER NOT NULL,
        explanation TEXT,
        created_at TEXT NOT NULL
      )
    `);

    // 10d. Tạo bảng session_mcqs
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS session_mcqs (
        session_id TEXT REFERENCES practice_sessions(id) ON DELETE CASCADE,
        question_id TEXT REFERENCES mcq_questions(id) ON DELETE CASCADE,
        PRIMARY KEY (session_id, question_id)
      )
    `);

    // 10e. Bảng student_mcq_answers
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS student_mcq_answers (
        session_id TEXT REFERENCES practice_sessions(id) ON DELETE CASCADE,
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        question_id TEXT REFERENCES mcq_questions(id) ON DELETE CASCADE,
        selected_option INTEGER,
        is_correct BOOLEAN,
        answered_at TEXT NOT NULL,
        PRIMARY KEY (session_id, user_id, question_id)
      )
    `);

    // 10f. Bảng approval_requests
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS approval_requests (
        id TEXT PRIMARY KEY,
        lab_id TEXT NOT NULL,
        submitted_by TEXT REFERENCES users(id),
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
        comments TEXT,
        reviewed_by TEXT REFERENCES users(id),
        created_at TEXT NOT NULL,
        updated_at TEXT
      )
    `);

    // 10g. Tạo các chỉ mục tối ưu hóa hiệu năng (Performance Indexing)
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_submissions_session_user ON submissions(session_id, user_id);
      CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON submissions(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_session_participants_user ON session_participants(user_id);
      CREATE INDEX IF NOT EXISTS idx_student_mcq_answers_session_user ON student_mcq_answers(session_id, user_id);
      CREATE INDEX IF NOT EXISTS idx_plagiarism_cases_session ON plagiarism_cases(session_id);
      CREATE INDEX IF NOT EXISTS idx_approval_requests_lab ON approval_requests(lab_id);
    `);

    // Seed trắc nghiệm nếu trống
    const mcqCount = this.db.prepare("SELECT COUNT(*) as count FROM mcq_questions").get() as { count: number };
    if (mcqCount.count === 0) {
      const insertMcq = this.db.prepare(`
        INSERT INTO mcq_questions (id, subject_id, question_text, options_json, correct_option, explanation, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      
      insertMcq.run("q1", "algos", "Thuật toán tìm kiếm nhị phân có độ phức tạp thời gian trong trường hợp xấu nhất là bao nhiêu?", JSON.stringify(["O(1)", "O(N)", "O(log N)", "O(N log N)"]), 2, "Tìm kiếm nhị phân chia đôi khoảng tìm kiếm sau mỗi bước, do đó độ phức tạp là O(log N).", new Date().toISOString());
      insertMcq.run("q2", "algos", "Cấu trúc dữ liệu nào hoạt động theo nguyên lý LIFO (Last In First Out)?", JSON.stringify(["Hàng đợi (Queue)", "Ngăn xếp (Stack)", "Danh sách liên kết (Linked List)", "Cây nhị phân (Binary Tree)"]), 1, "Ngăn xếp hoạt động theo nguyên lý vào sau ra trước (LIFO).", new Date().toISOString());
      insertMcq.run("q3", "algos", "Thuật toán sắp xếp nào sau đây có độ phức tạp thời gian trung bình tốt nhất O(N log N) và chạy ổn định (stable)?", JSON.stringify(["Bubble Sort", "Quick Sort", "Merge Sort", "Selection Sort"]), 2, "Merge Sort là thuật toán sắp xếp chạy ổn định với độ phức tạp trung bình và xấu nhất đều là O(N log N).", new Date().toISOString());
    }

    // 11. Seed dữ liệu tài khoản mặc định nếu trống
    const userCount = this.db.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number };
    if (userCount.count === 0) {
      const insertUser = this.db.prepare(`
        INSERT INTO users (id, username, password_hash, full_name, role, student_code, email, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      const seedUsers = [
        {
          id: "u1",
          username: "student",
          password: "student123",
          fullName: "Sinh viên Demo",
          role: "student",
          studentCode: "B21DCCN001",
          email: "student@student.ptit.edu.vn"
        },
        {
          id: "u2",
          username: "instructor",
          password: "instructor123",
          fullName: "Giảng viên Demo",
          role: "instructor",
          studentCode: null,
          email: "instructor@ptit.edu.vn"
        },
        {
          id: "u3",
          username: "admin",
          password: "admin123",
          fullName: "Quản trị viên",
          role: "admin",
          studentCode: null,
          email: "admin@ptit.edu.vn"
        }
      ];

      for (const u of seedUsers) {
        const hash = AuthService.hashPassword(u.password);
        insertUser.run(u.id, u.username, hash, u.fullName, u.role, u.studentCode, u.email, new Date().toISOString());
      }
      console.log("[DatabaseService] Seeded default users successfully.");
    }

    // 12. Seed Học kỳ & Lớp & Ca thi mẫu nếu trống
    const semesterCount = this.db.prepare("SELECT COUNT(*) as count FROM semesters").get() as { count: number };
    if (semesterCount.count === 0) {
      // Học kỳ
      this.db.prepare("INSERT INTO semesters (id, name, start_date, end_date) VALUES (?, ?, ?, ?)")
        .run("sem-1", "Học kỳ 1 - 2025-2026", "2025-09-01T00:00:00Z", "2026-01-31T23:59:59Z");

      // Lớp học
      this.db.prepare("INSERT INTO classes (id, name, subject_id, semester_id) VALUES (?, ?, ?, ?)")
        .run("class-1", "An toàn thông tin - Nhóm 01", "algos", "sem-1");

      // Thành viên lớp học
      this.db.prepare("INSERT OR IGNORE INTO class_members (class_id, user_id, role_in_class) VALUES (?, ?, ?)")
        .run("class-1", "u1", "student");
      this.db.prepare("INSERT OR IGNORE INTO class_members (class_id, user_id, role_in_class) VALUES (?, ?, ?)")
        .run("class-1", "u2", "instructor");

      // Ca thi hoạt động đang diễn ra (Start 2h trước, End 2h sau)
      const now = new Date();
      const startTime = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString();
      const endTime = new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString();

      this.db.prepare(`
        INSERT INTO practice_sessions 
        (id, name, banner_url, location, class_id, start_time, end_time, status, allow_browser, freeze_before_end_minutes, penalty_minutes_per_wrong_submit, submission_mode, created_by) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run("session-1", "Thi thực hành giữa kỳ ATTT", null, "Phòng Máy 402-A2", "class-1", startTime, endTime, "active", 0, 15, 20, "auto", "u2");

      // Gán bài tập cho ca thi mẫu
      this.db.prepare("INSERT INTO session_labs (session_id, lab_id) VALUES (?, ?)")
        .run("session-1", "sum_two_numbers");
      this.db.prepare("INSERT INTO session_labs (session_id, lab_id) VALUES (?, ?)")
        .run("session-1", "liet_ke_cap_so_nguyen_to_cung_nhau");

      // Thêm học viên thi vào ca thi mẫu
      this.db.prepare("INSERT INTO session_participants (session_id, user_id, exam_room, seat_ip, hostname, variant_code, status) VALUES (?, ?, ?, ?, ?, ?, ?)")
        .run("session-1", "u1", "PM-402", "172.25.10.12", "DESKTOP-PTIT-05", "Đề số 01", "not_submitted");

      // Phân giảng viên phụ trách
      this.db.prepare("INSERT INTO session_instructors (session_id, user_id, duty) VALUES (?, ?, ?)")
        .run("session-1", "u2", "owner");

      console.log("[DatabaseService] Seeded default semesters, classes, and active session-1 successfully.");
    }
  }

  getUserByUsername(username: string): any | null {
    const row = this.db.prepare("SELECT * FROM users WHERE username = ?").get(username);
    return row || null;
  }

  getUserById(id: string): any | null {
    const row = this.db.prepare("SELECT * FROM users WHERE id = ?").get(id);
    return row || null;
  }

  // === SEMESTERS CRUD ===
  getAllSemesters(): any[] {
    return this.db.prepare("SELECT * FROM semesters ORDER BY name ASC").all();
  }

  createSemester(name: string, startDate?: string, endDate?: string): any {
    const id = uuidv4();
    this.db.prepare("INSERT INTO semesters (id, name, start_date, end_date) VALUES (?, ?, ?, ?)")
      .run(id, name, startDate || null, endDate || null);
    return { id, name, startDate, endDate };
  }

  // === CLASSES CRUD ===
  getAllClasses(): any[] {
    return this.db.prepare(`
      SELECT c.*, s.name as semester_name 
      FROM classes c
      JOIN semesters s ON c.semester_id = s.id
      ORDER BY c.name ASC
    `).all();
  }

  createClass(name: string, subjectId: string, semesterId: string): any {
    const id = uuidv4();
    this.db.prepare("INSERT INTO classes (id, name, subject_id, semester_id) VALUES (?, ?, ?, ?)")
      .run(id, name, subjectId, semesterId);
    return { id, name, subjectId, semesterId };
  }

  getClassMembers(classId: string): any[] {
    return this.db.prepare(`
      SELECT u.id, u.username, u.full_name, u.role, u.student_code, u.email, cm.role_in_class
      FROM class_members cm
      JOIN users u ON cm.user_id = u.id
      WHERE cm.class_id = ?
    `).all(classId);
  }

  addClassMember(classId: string, userId: string, roleInClass: string): void {
    this.db.prepare("INSERT OR REPLACE INTO class_members (class_id, user_id, role_in_class) VALUES (?, ?, ?)")
      .run(classId, userId, roleInClass);
  }

  // === SESSIONS CRUD ===
  getAllSessions(userId?: string, userRole?: string): any[] {
    if (userId && (userRole === "instructor" || userRole === "admin")) {
      // Giảng viên chỉ xem các ca thi họ làm chủ hoặc coi thi
      return this.db.prepare(`
        SELECT DISTINCT ps.*, c.name as class_name 
        FROM practice_sessions ps
        JOIN classes c ON ps.class_id = c.id
        LEFT JOIN session_instructors si ON ps.id = si.session_id
        WHERE ps.created_by = ? OR si.user_id = ?
        ORDER BY ps.start_time DESC
      `).all(userId, userId);
    } else if (userId && userRole === "student") {
      // Sinh viên xem các ca thi họ tham gia
      return this.db.prepare(`
        SELECT ps.*, c.name as class_name 
        FROM practice_sessions ps
        JOIN classes c ON ps.class_id = c.id
        JOIN session_participants sp ON ps.id = sp.session_id
        WHERE sp.user_id = ?
        ORDER BY ps.start_time DESC
      `).all(userId);
    }
    
    // Tất cả ca thi (dành cho Admin)
    return this.db.prepare(`
      SELECT ps.*, c.name as class_name 
      FROM practice_sessions ps
      JOIN classes c ON ps.class_id = c.id
      ORDER BY ps.start_time DESC
    `).all();
  }

  getSessionById(id: string): any | null {
    const session = this.db.prepare(`
      SELECT ps.*, c.name as class_name, c.subject_id
      FROM practice_sessions ps
      JOIN classes c ON ps.class_id = c.id
      WHERE ps.id = ?
    `).get(id) as any;
    
    if (!session) return null;

    // Lấy danh sách bài tập gán vào ca
    const labs = this.db.prepare("SELECT lab_id FROM session_labs WHERE session_id = ?").all(id) as any[];
    session.labIds = labs.map(l => l.lab_id);

    // Lấy danh sách học viên tham gia
    session.participants = this.db.prepare(`
      SELECT sp.*, u.username, u.full_name, u.student_code, u.email 
      FROM session_participants sp
      JOIN users u ON sp.user_id = u.id
      WHERE sp.session_id = ?
    `).all(id);

    // Lấy danh sách giảng viên phụ trách
    session.instructors = this.db.prepare(`
      SELECT si.*, u.username, u.full_name, u.email 
      FROM session_instructors si
      JOIN users u ON si.user_id = u.id
      WHERE si.session_id = ?
    `).all(id);

    return session;
  }

  createSession(
    name: string,
    bannerUrl: string | null,
    location: string | null,
    classId: string,
    startTime: string,
    endTime: string,
    allowBrowser: boolean,
    freezeBeforeEndMinutes: number,
    penaltyMinutesPerWrongSubmit: number,
    submissionMode: string,
    createdBy: string,
    labIds: string[],
    participants: any[],
    instructors: any[]
  ): any {
    const id = uuidv4();
    const status = "draft"; // Mặc định là draft

    const tx = this.db.transaction(() => {
      // 1. Thêm ca thi
      this.db.prepare(`
        INSERT INTO practice_sessions 
        (id, name, banner_url, location, class_id, start_time, end_time, status, allow_browser, freeze_before_end_minutes, penalty_minutes_per_wrong_submit, submission_mode, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, name, bannerUrl, location, classId, startTime, endTime, status, allowBrowser ? 1 : 0, freezeBeforeEndMinutes, penaltyMinutesPerWrongSubmit, submissionMode, createdBy);

      // 2. Gán bài tập
      const insertLab = this.db.prepare("INSERT INTO session_labs (session_id, lab_id) VALUES (?, ?)");
      for (const labId of labIds) {
        insertLab.run(id, labId);
      }

      // 3. Gán sinh viên tham gia
      const insertParticipant = this.db.prepare(`
        INSERT INTO session_participants (session_id, user_id, exam_room, seat_ip, hostname, variant_code, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      const findUser = this.db.prepare("SELECT id FROM users WHERE username = ? OR student_code = ?");
      const insertUser = this.db.prepare(`
        INSERT INTO users (id, username, password_hash, full_name, role, student_code, email, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const p of participants) {
        // Tìm user_id theo username hoặc mã sinh viên
        const userRow = findUser.get(p.username, p.studentCode) as any;
        let userId = userRow?.id;

        // Nếu sinh viên chưa tồn tại, tự động tạo tài khoản sinh viên mới
        if (!userId) {
          userId = uuidv4();
          const defaultHash = AuthService.hashPassword("student123");
          insertUser.run(userId, p.username || `sv_${p.studentCode}`, defaultHash, p.fullName, "student", p.studentCode, p.email || null, new Date().toISOString());
        }

        insertParticipant.run(id, userId, p.examRoom || location, p.seatIp || null, p.hostname || null, p.variantCode || null, "not_submitted");
      }

      // 4. Gán giảng viên phụ trách
      const insertInstructor = this.db.prepare("INSERT INTO session_instructors (session_id, user_id, duty) VALUES (?, ?, ?)");
      // Luôn gán người tạo làm owner
      insertInstructor.run(id, createdBy, "owner");
      for (const inst of instructors) {
        if (inst.userId && inst.userId !== createdBy) {
          insertInstructor.run(id, inst.userId, inst.duty || "proctor");
        }
      }
    });

    tx();
    return { id, name, status };
  }

  updateSession(
    id: string,
    name: string,
    bannerUrl: string | null,
    location: string | null,
    classId: string,
    startTime: string,
    endTime: string,
    status: string,
    allowBrowser: boolean,
    freezeBeforeEndMinutes: number,
    penaltyMinutesPerWrongSubmit: number,
    submissionMode: string,
    labIds: string[],
    participants: any[],
    instructors: any[]
  ): void {
    const tx = this.db.transaction(() => {
      // 1. Cập nhật thông tin ca thi
      this.db.prepare(`
        UPDATE practice_sessions 
        SET name = ?, banner_url = ?, location = ?, class_id = ?, start_time = ?, end_time = ?, status = ?, allow_browser = ?, freeze_before_end_minutes = ?, penalty_minutes_per_wrong_submit = ?, submission_mode = ?
        WHERE id = ?
      `).run(name, bannerUrl, location, classId, startTime, endTime, status, allowBrowser ? 1 : 0, freezeBeforeEndMinutes, penaltyMinutesPerWrongSubmit, submissionMode, id);

      // 2. Cập nhật bài tập (Xóa đi ghi lại)
      this.db.prepare("DELETE FROM session_labs WHERE session_id = ?").run(id);
      const insertLab = this.db.prepare("INSERT INTO session_labs (session_id, lab_id) VALUES (?, ?)");
      for (const labId of labIds) {
        insertLab.run(id, labId);
      }

      // 3. Cập nhật sinh viên (Xóa đi ghi lại)
      this.db.prepare("DELETE FROM session_participants WHERE session_id = ?").run(id);
      const insertParticipant = this.db.prepare(`
        INSERT INTO session_participants (session_id, user_id, exam_room, seat_ip, hostname, variant_code, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      const findUser = this.db.prepare("SELECT id FROM users WHERE username = ? OR student_code = ?");
      const insertUser = this.db.prepare(`
        INSERT INTO users (id, username, password_hash, full_name, role, student_code, email, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const p of participants) {
        const userRow = findUser.get(p.username, p.studentCode) as any;
        let userId = userRow?.id;

        if (!userId) {
          userId = uuidv4();
          const defaultHash = AuthService.hashPassword("student123");
          insertUser.run(userId, p.username || `sv_${p.studentCode}`, defaultHash, p.fullName, "student", p.studentCode, p.email || null, new Date().toISOString());
        }

        insertParticipant.run(id, userId, p.examRoom || location, p.seatIp || null, p.hostname || null, p.variantCode || null, p.status || "not_submitted");
      }

      // 4. Cập nhật giảng viên (Xóa đi ghi lại)
      const oldOwnerRow = this.db.prepare("SELECT user_id FROM session_instructors WHERE session_id = ? AND duty = 'owner'").get(id) as any;
      const ownerId = oldOwnerRow?.user_id;

      this.db.prepare("DELETE FROM session_instructors WHERE session_id = ?").run(id);
      const insertInstructor = this.db.prepare("INSERT INTO session_instructors (session_id, user_id, duty) VALUES (?, ?, ?)");
      
      if (ownerId) {
        insertInstructor.run(id, ownerId, "owner");
      }
      for (const inst of instructors) {
        const instUserId = inst.userId || inst.user_id;
        if (instUserId && instUserId !== ownerId) {
          insertInstructor.run(id, instUserId, inst.duty || "proctor");
        }
      }
    });

    tx();
  }

  deleteSession(id: string): void {
    const tx = this.db.transaction(() => {
      this.db.prepare("UPDATE submissions SET session_id = NULL WHERE session_id = ?").run(id);
      this.db.prepare("DELETE FROM practice_sessions WHERE id = ?").run(id);
    });
    tx();
  }

  importSessionParticipants(id: string, participants: any[]): void {
    const insertParticipant = this.db.prepare(`
      INSERT OR REPLACE INTO session_participants (session_id, user_id, exam_room, seat_ip, hostname, variant_code, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const findUser = this.db.prepare("SELECT id FROM users WHERE username = ? OR student_code = ?");
    const insertUser = this.db.prepare(`
      INSERT INTO users (id, username, password_hash, full_name, role, student_code, email, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const tx = this.db.transaction(() => {
      for (const p of participants) {
        const userRow = findUser.get(p.username, p.studentCode) as any;
        let userId = userRow?.id;

        if (!userId) {
          userId = uuidv4();
          const defaultHash = AuthService.hashPassword("student123");
          insertUser.run(userId, p.username || `sv_${p.studentCode}`, defaultHash, p.fullName, "student", p.studentCode, p.email || null, new Date().toISOString());
        }

        insertParticipant.run(id, userId, p.examRoom || null, p.seatIp || null, p.hostname || null, p.variantCode || null, "not_submitted");
      }
    });
    tx();
  }

  getActiveSessionForStudent(userId: string): any | null {
    const now = new Date().toISOString();
    // Tìm ca thi có trạng thái 'active', thời gian nằm trong khoảng, và học viên có tham gia
    const session = this.db.prepare(`
      SELECT ps.*, sp.exam_room, sp.seat_ip, sp.variant_code, sp.status as participant_status, c.name as class_name
      FROM practice_sessions ps
      JOIN session_participants sp ON ps.id = sp.session_id
      JOIN classes c ON ps.class_id = c.id
      WHERE sp.user_id = ? AND ps.status = 'active' AND ps.start_time <= ? AND ps.end_time >= ?
    `).get(userId, now, now) as any;

    if (!session) return null;

    // Lấy bài tập gán trong ca thi này
    const labs = this.db.prepare("SELECT lab_id FROM session_labs WHERE session_id = ?").all(session.id) as any[];
    session.labIds = labs.map(l => l.lab_id);

    return session;
  }

  // === SUBMISSIONS ===
  saveSubmission(record: SubmissionRecord): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO submissions 
      (id, lab_id, profile_id, mode, code, language, status, score, result_json, created_at, user_id, client_ip, hostname, session_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      record.id,
      (record as any).labId || "",
      record.profileId,
      record.mode,
      record.code,
      record.language,
      record.status,
      record.result?.score || 0,
      JSON.stringify(record.result || {}),
      record.createdAt,
      (record as any).userId || null,
      (record as any).clientIp || null,
      (record as any).hostname || null,
      (record as any).sessionId || null
    );
  }

  getSubmission(id: string): SubmissionRecord | null {
    const row = this.db.prepare("SELECT * FROM submissions WHERE id = ?").get(id) as any;
    if (!row) return null;

    return {
      id: row.id,
      labId: row.lab_id, 
      lab_id: row.lab_id, // For frontend compatibility
      mode: row.mode,
      code: row.code,
      language: row.language,
      profileId: row.profile_id,
      profile_id: row.profile_id, // For frontend compatibility
      createdAt: row.created_at,
      created_at: row.created_at, // For frontend compatibility
      status: row.status,
      score: row.score, // Added mapping
      result: JSON.parse(row.result_json),
      userId: row.user_id,
      user_id: row.user_id,
      clientIp: row.client_ip,
      client_ip: row.client_ip,
      hostname: row.hostname,
      sessionId: row.session_id,
      session_id: row.session_id, // For frontend compatibility
      resultCode: row.result_code,
      result_code: row.result_code,
      gradedBy: row.graded_by,
      graded_by: row.graded_by
    } as any;
  }

  getAllSubmissions(): SubmissionRecord[] {
    const rows = this.db.prepare("SELECT * FROM submissions ORDER BY created_at DESC").all() as any[];
    return rows.map(row => ({
      id: row.id,
      labId: row.lab_id, 
      lab_id: row.lab_id, // For frontend compatibility
      mode: row.mode,
      code: row.code,
      language: row.language,
      profileId: row.profile_id,
      profile_id: row.profile_id, // For frontend compatibility
      createdAt: row.created_at,
      created_at: row.created_at, // For frontend compatibility
      status: row.status,
      score: row.score, // Added mapping
      result: JSON.parse(row.result_json),
      userId: row.user_id,
      user_id: row.user_id,
      clientIp: row.client_ip,
      client_ip: row.client_ip,
      hostname: row.hostname,
      sessionId: row.session_id,
      session_id: row.session_id, // For frontend compatibility
      resultCode: row.result_code,
      result_code: row.result_code,
      gradedBy: row.graded_by,
      graded_by: row.graded_by
    } as any));
  }

  getSubmissionsBySession(sessionId: string): SubmissionRecord[] {
    const rows = this.db.prepare("SELECT * FROM submissions WHERE session_id = ? ORDER BY created_at DESC").all(sessionId) as any[];
    return rows.map(row => ({
      id: row.id,
      labId: row.lab_id, 
      lab_id: row.lab_id, // For frontend compatibility
      mode: row.mode,
      code: row.code,
      language: row.language,
      profileId: row.profile_id,
      profile_id: row.profile_id, // For frontend compatibility
      createdAt: row.created_at,
      created_at: row.created_at, // For frontend compatibility
      status: row.status,
      score: row.score, // Added mapping
      result: JSON.parse(row.result_json),
      userId: row.user_id,
      user_id: row.user_id,
      clientIp: row.client_ip,
      client_ip: row.client_ip,
      hostname: row.hostname,
      sessionId: row.session_id,
      session_id: row.session_id, // For frontend compatibility
      resultCode: row.result_code,
      result_code: row.result_code,
      gradedBy: row.graded_by,
      graded_by: row.graded_by
    } as any));
  }

  // === GRADING & ANTI-CHEAT OPERATIONS ===

  getBestSubmissionsForSession(sessionId: string): any[] {
    return this.db.prepare(`
      SELECT s.*, u.username, u.full_name, u.student_code
      FROM submissions s
      JOIN users u ON s.user_id = u.id
      WHERE s.session_id = ?
        AND s.id = (
          SELECT sub.id 
          FROM submissions sub 
          WHERE sub.session_id = s.session_id 
            AND sub.user_id = s.user_id 
            AND sub.lab_id = s.lab_id 
          ORDER BY sub.score DESC, sub.created_at DESC 
          LIMIT 1
        )
    `).all(sessionId);
  }

  savePlagiarismCases(cases: any[]): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO plagiarism_cases
      (id, session_id, lab_id, student_a_id, student_b_id, similarity_score, code_a, code_b, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const tx = this.db.transaction(() => {
      for (const c of cases) {
        stmt.run(c.id, c.sessionId, c.labId, c.studentAId, c.studentBId, c.similarityScore, c.codeA, c.codeB, c.status || 'pending', c.createdAt);
      }
    });
    tx();
  }

  getPlagiarismCases(sessionId: string): any[] {
    return this.db.prepare(`
      SELECT pc.*, 
             ua.username as student_a_username, ua.full_name as student_a_name, ua.student_code as student_a_code,
             ub.username as student_b_username, ub.full_name as student_b_name, ub.student_code as student_b_code
      FROM plagiarism_cases pc
      JOIN users ua ON pc.student_a_id = ua.id
      JOIN users ub ON pc.student_b_id = ub.id
      WHERE pc.session_id = ?
      ORDER BY pc.similarity_score DESC
    `).all(sessionId);
  }

  updatePlagiarismCaseStatus(caseId: string, status: string): void {
    const tx = this.db.transaction(() => {
      // 1. Cập nhật trạng thái
      this.db.prepare("UPDATE plagiarism_cases SET status = ? WHERE id = ?").run(status, caseId);
      
      // 2. Nếu Confirmed, set điểm về 0 và result_code = 'CPY'
      if (status === 'confirmed') {
        const c = this.db.prepare("SELECT * FROM plagiarism_cases WHERE id = ?").get(caseId) as any;
        if (c) {
          this.db.prepare(`
            UPDATE submissions 
            SET score = 0, result_code = 'CPY', status = 'failed', result_json = '{"score":0,"feedback":"Phát hiện sao chép mã nguồn (Plagiarism Confirmed)"}'
            WHERE session_id = ? AND lab_id = ? AND user_id IN (?, ?)
          `).run(c.session_id, c.lab_id, c.student_a_id, c.student_b_id);
        }
      }
    });
    tx();
  }

  manualGradeSubmission(submissionId: string, score: number, comment: string, gradedBy: string): void {
    const resultCode = score >= 50 ? 'AC' : 'WA';
    const resultObj = {
      score,
      feedback: comment,
      gradedBy,
      passedTests: score >= 50 ? 1 : 0,
      totalTests: 1,
      testResults: [{ index: 0, input: "Manual evaluation", expectedOutput: "Reviewed", actualOutput: "Score: " + score, passed: score >= 50 }]
    };
    
    this.db.prepare(`
      UPDATE submissions 
      SET score = ?, status = 'graded', result_code = ?, result_json = ?, graded_by = ?
      WHERE id = ?
    `).run(score, resultCode, JSON.stringify(resultObj), gradedBy, submissionId);
  }

  getSessionMonitoringData(sessionId: string): any[] {
    const participants = this.db.prepare(`
      SELECT sp.*, u.username, u.full_name, u.student_code, u.email
      FROM session_participants sp
      JOIN users u ON sp.user_id = u.id
      WHERE sp.session_id = ?
    `).all(sessionId) as any[];

    // Fetch all submissions of the session in a single query, sorted by creation time DESC
    const allSubs = this.db.prepare(`
      SELECT user_id, score, status, result_code, lab_id, created_at
      FROM submissions
      WHERE session_id = ?
      ORDER BY created_at DESC
    `).all(sessionId) as any[];

    // Group submissions by user_id in memory
    const subsByUserId: Record<string, any[]> = {};
    for (const sub of allSubs) {
      if (!subsByUserId[sub.user_id]) {
        subsByUserId[sub.user_id] = [];
      }
      subsByUserId[sub.user_id].push(sub);
    }

    for (const p of participants) {
      const userSubs = subsByUserId[p.user_id] || [];
      p.totalAttempts = userSubs.length;
      
      const solvedLabs = new Set<string>();
      for (const s of userSubs) {
        if (s.score >= 50 || s.result_code === 'AC' || s.status === 'completed' || s.status === 'graded') {
          solvedLabs.add(s.lab_id);
        }
      }
      p.solvedCount = solvedLabs.size;
      
      const lastSub = userSubs[0]; // First element is the latest submission
      if (lastSub) {
        p.lastSubmitStatus = lastSub.status;
        p.lastSubmitScore = lastSub.score;
        p.lastSubmitTime = lastSub.created_at;
        p.lastResultCode = lastSub.result_code;
      } else {
        p.lastSubmitStatus = 'none';
        p.lastSubmitScore = null;
        p.lastSubmitTime = null;
        p.lastResultCode = null;
      }
    }

    return participants;
  }

  getSessionLeaderboard(sessionId: string): any[] {
    const session = this.db.prepare("SELECT * FROM practice_sessions WHERE id = ?").get(sessionId) as any;
    if (!session) return [];

    const participants = this.db.prepare(`
      SELECT sp.user_id, u.username, u.full_name, u.student_code, sp.variant_code
      FROM session_participants sp
      JOIN users u ON sp.user_id = u.id
      WHERE sp.session_id = ?
    `).all(sessionId) as any[];

    const labs = this.db.prepare("SELECT lab_id FROM session_labs WHERE session_id = ?").all(sessionId) as any[];
    const labIds = labs.map(l => l.lab_id);

    const sessionStart = new Date(session.start_time).getTime();
    const penaltyPerWrong = session.penalty_minutes_per_wrong_submit || 20;

    const leaderboard: any[] = [];

    for (const p of participants) {
      const pStats: any = {
        userId: p.user_id,
        username: p.username,
        fullName: p.full_name,
        studentCode: p.student_code,
        variantCode: p.variant_code,
        solvedCount: 0,
        totalPenalty: 0,
        labsDetail: {}
      };

      for (const labId of labIds) {
        const subs = this.db.prepare(`
          SELECT id, score, status, result_code, created_at
          FROM submissions
          WHERE session_id = ? AND user_id = ? AND lab_id = ?
          ORDER BY created_at ASC
        `).all(sessionId, p.user_id, labId) as any[];

        let solved = false;
        let wrongAttempts = 0;
        let solveTimeOffsetMinutes = 0;

        for (const s of subs) {
          const isAc = s.score >= 50 || s.result_code === 'AC' || s.status === 'completed' || s.status === 'graded';
          if (isAc) {
            solved = true;
            const submitTime = new Date(s.created_at).getTime();
            solveTimeOffsetMinutes = Math.max(0, Math.floor((submitTime - sessionStart) / (1000 * 60)));
            break;
          } else {
            wrongAttempts++;
          }
        }

        const labPenalty = solved 
          ? solveTimeOffsetMinutes + wrongAttempts * penaltyPerWrong
          : 0;

        if (solved) {
          pStats.solvedCount++;
          pStats.totalPenalty += labPenalty;
        }

        pStats.labsDetail[labId] = {
          solved,
          attempts: wrongAttempts + (solved ? 1 : 0),
          time: solved ? solveTimeOffsetMinutes : 0,
          penalty: labPenalty
        };
      }

      leaderboard.push(pStats);
    }

    // Sắp xếp theo ICPC: Số bài đúng DESC, tổng penalty ASC
    leaderboard.sort((a, b) => {
      if (b.solvedCount !== a.solvedCount) {
        return b.solvedCount - a.solvedCount;
      }
      return a.totalPenalty - b.totalPenalty;
    });

    leaderboard.forEach((item, index) => {
      item.rank = index + 1;
    });

    return leaderboard;
  }

  // === MCQ & APPROVAL OPERATIONS ===

  getAllMcqQuestions(): any[] {
    const rows = this.db.prepare("SELECT * FROM mcq_questions ORDER BY created_at DESC").all() as any[];
    return rows.map(r => ({
      ...r,
      options: JSON.parse(r.options_json)
    }));
  }

  createMcqQuestion(q: any): void {
    this.db.prepare(`
      INSERT INTO mcq_questions (id, subject_id, question_text, options_json, correct_option, explanation, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(q.id, q.subjectId, q.questionText, JSON.stringify(q.options), q.correctOption, q.explanation || null, new Date().toISOString());
  }

  getSessionMcqQuestions(sessionId: string): any[] {
    const rows = this.db.prepare(`
      SELECT q.*
      FROM session_mcqs sm
      JOIN mcq_questions q ON sm.question_id = q.id
      WHERE sm.session_id = ?
    `).all(sessionId) as any[];
    return rows.map(r => ({
      ...r,
      options: JSON.parse(r.options_json)
    }));
  }

  assignMcqQuestionsToSession(sessionId: string, questionIds: string[]): void {
    const insert = this.db.prepare("INSERT INTO session_mcqs (session_id, question_id) VALUES (?, ?)");
    const tx = this.db.transaction(() => {
      this.db.prepare("DELETE FROM session_mcqs WHERE session_id = ?").run(sessionId);
      for (const qId of questionIds) {
        insert.run(sessionId, qId);
      }
    });
    tx();
  }

  saveStudentMcqAnswer(sessionId: string, userId: string, questionId: string, selectedOption: number): boolean {
    const q = this.db.prepare("SELECT correct_option FROM mcq_questions WHERE id = ?").get(questionId) as any;
    const isCorrect = q ? q.correct_option === selectedOption : false;
    this.db.prepare(`
      INSERT OR REPLACE INTO student_mcq_answers (session_id, user_id, question_id, selected_option, is_correct, answered_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(sessionId, userId, questionId, selectedOption, isCorrect ? 1 : 0, new Date().toISOString());
    return isCorrect;
  }

  getStudentMcqAnswers(sessionId: string, userId: string): any[] {
    return this.db.prepare(`
      SELECT * FROM student_mcq_answers
      WHERE session_id = ? AND user_id = ?
    `).all(sessionId, userId);
  }

  getApprovalRequests(): any[] {
    return this.db.prepare(`
      SELECT ar.*, u.full_name as author_name
      FROM approval_requests ar
      LEFT JOIN users u ON ar.submitted_by = u.id
      ORDER BY ar.created_at DESC
    `).all();
  }

  submitApprovalRequest(labId: string, submittedBy: string): void {
    const uuidv4 = require("uuid").v4;
    this.db.prepare(`
      INSERT OR REPLACE INTO approval_requests (id, lab_id, submitted_by, status, comments, created_at)
      VALUES (?, ?, ?, 'pending', NULL, ?)
    `).run(uuidv4(), labId, submittedBy, new Date().toISOString());
  }

  updateApprovalRequest(requestId: string, status: 'approved' | 'rejected', comments: string, reviewedBy: string): void {
    this.db.prepare(`
      UPDATE approval_requests
      SET status = ?, comments = ?, reviewed_by = ?, updated_at = ?
      WHERE id = ?
    `).run(status, comments, reviewedBy, new Date().toISOString(), requestId);
  }
}

export const dbService = new DatabaseService();


