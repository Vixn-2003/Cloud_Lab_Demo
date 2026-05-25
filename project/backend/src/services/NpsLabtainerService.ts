import { exec } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { dbService } from "./DatabaseService";

export interface NpsLabtainerTask {
  index: number;
  input: string;
  expectedOutput: string;
  actualOutput: string;
  passed: boolean;
}

export interface NpsLabtainerReport {
  status: "graded" | "failed";
  score: number;
  passedTests: number;
  totalTests: number;
  testResults: NpsLabtainerTask[];
  studentId: string;
  labId: string;
}

export class NpsLabtainerService {
  private static getStudentBin(): string {
    const dir = process.env.LABTAINER_DIR || "mock_labtainer/labtainer-student";
    return path.resolve(process.cwd(), dir, "bin");
  }

  private static getInstructorBin(): string {
    const dir = process.env.LABTAINER_INSTRUCTOR_DIR || "mock_labtainer/labtainer-instructor";
    return path.resolve(process.cwd(), dir, "bin");
  }

  /**
   * Khởi chạy một bài lab NPS Labtainer bằng lệnh chính thức
   */
  public static async startLab(labId: string, studentId: string): Promise<boolean> {
    const binDir = this.getStudentBin();
    const labtainerScript = path.join(binDir, process.platform === "win32" ? "labtainer.bat" : "labtainer");
    const cmd = `"${labtainerScript}" ${labId} -u ${studentId}`;
    
    console.log(`[Labtainer Core] Executing: ${cmd}`);

    // Kiểm tra xem script Labtainer có thực sự tồn tại trên máy chủ hay không
    if (!fs.existsSync(labtainerScript)) {
      console.log(`[Labtainer Core Mock] CLI script not found at ${labtainerScript}. Simulating start lab in Mock mode.`);
      return true; // Fallback Mock mode thành công để dev mượt mà
    }

    return new Promise((resolve) => {
      exec(cmd, { timeout: 30000 }, (error, stdout, stderr) => {
        if (error) {
          console.error(`[Labtainer Core Error] Failed to start lab ${labId}:`, error.message);
          resolve(false);
        } else {
          console.log(`[Labtainer Core] Lab ${labId} started successfully.`);
          resolve(true);
        }
      });
    });
  }

  /**
   * Dừng bài lab NPS Labtainer bằng lệnh chính thức
   */
  public static async stopLab(labId: string, studentId: string): Promise<boolean> {
    const binDir = this.getStudentBin();
    const stoplabScript = path.join(binDir, process.platform === "win32" ? "stoplab.bat" : "stoplab");
    const cmd = `"${stoplabScript}" ${labId} -u ${studentId}`;

    console.log(`[Labtainer Core] Executing: ${cmd}`);

    if (!fs.existsSync(stoplabScript)) {
      console.log(`[Labtainer Core Mock] stoplab script not found. Simulating stop lab.`);
      return true;
    }

    return new Promise((resolve) => {
      exec(cmd, { timeout: 15000 }, (error) => {
        if (error) {
          console.error(`[Labtainer Core Error] Failed to stop lab ${labId}:`, error.message);
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });
  }

  /**
   * Chấm điểm bài lab Labtainer bằng cách gọi gradelab và parse file .report kết quả
   */
  public static async stopAndGradeLab(labId: string, studentId: string): Promise<NpsLabtainerReport> {
    console.log(`[Labtainer Core] Running Stop & Grade for student ${studentId}, lab ${labId}...`);

    // 1. Dừng lab
    await this.stopLab(labId, studentId);

    // 2. Chạy gradelab để tạo báo cáo điểm
    const instructorBin = this.getInstructorBin();
    const gradelabScript = path.join(instructorBin, process.platform === "win32" ? "gradelab.bat" : "gradelab");
    const cmd = `"${gradelabScript}" ${labId} -u ${studentId}`;

    console.log(`[Labtainer Core] Executing: ${cmd}`);

    let reportFilePath = path.resolve(
      process.cwd(), 
      process.env.LABTAINER_DIR || "mock_labtainer/labtainer-student", 
      "../labs", 
      labId, 
      "transfer", 
      `${studentId}.report`
    );

    // Tự động tạo thư mục mock để lưu kết quả chấm điểm nếu chạy ở chế độ dev/mock
    if (!fs.existsSync(gradelabScript)) {
      console.log(`[Labtainer Core Mock] gradelab script not found. Generating mock NPS Labtainer .report file.`);
      
      const parentDir = path.dirname(reportFilePath);
      if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true });
      }

      // Viết file report mô phỏng của NPS Labtainer
      const mockReportContent = `
nmap_scan : Performance: True
identify_ssh : Performance: True
firewall_rules : Performance: False
`;
      fs.writeFileSync(reportFilePath, mockReportContent.trim());
    } else {
      // Gọi thực thi gradelab thật của NPS
      await new Promise((resolve) => {
        exec(cmd, { timeout: 20000 }, (error, stdout, stderr) => {
          if (error) {
            console.error(`[Labtainer Core Error] gradelab failed:`, error.message);
          }
          resolve(true);
        });
      });
    }

    // 3. Đọc và phân tích file báo cáo .report chính thức của Labtainer
    return this.parseLabtainerReportFile(reportFilePath, labId, studentId);
  }

  /**
   * Helper giải mã và phân tích file .report của Labtainer
   */
  private static parseLabtainerReportFile(reportPath: string, labId: string, studentId: string): NpsLabtainerReport {
    try {
      if (!fs.existsSync(reportPath)) {
        throw new Error(`Không tìm thấy file báo cáo kết quả chấm điểm tại: ${reportPath}`);
      }

      const content = fs.readFileSync(reportPath, "utf8");
      const lines = content.split("\n");
      
      const testResults: NpsLabtainerTask[] = [];
      let index = 0;
      let passedTests = 0;

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.includes(":")) continue;

        const parts = trimmed.split(":");
        const taskName = parts[0].trim();
        
        // NPS Labtainer format: task_name : Performance: True/False
        const statusPart = parts[parts.length - 1].trim().toLowerCase();
        const passed = statusPart === "true" || statusPart === "yes" || statusPart === "success" || statusPart === "1";

        if (passed) passedTests++;

        testResults.push({
          index: index++,
          input: `Xác thực tác vụ: ${taskName}`,
          expectedOutput: "True (Thực hiện thành công)",
          actualOutput: passed ? "True (Thực hiện thành công)" : "False (Chưa thực hiện hoặc sai sót)",
          passed
        });
      }

      const totalTests = testResults.length || 1;
      const score = Math.round((passedTests / totalTests) * 100);

      return {
        status: "graded",
        score,
        passedTests,
        totalTests,
        testResults,
        studentId,
        labId
      };

    } catch (err: any) {
      console.error("[Labtainer Parser Error]", err.message);
      return {
        status: "failed",
        score: 0,
        passedTests: 0,
        totalTests: 1,
        testResults: [
          {
            index: 0,
            input: "Quét phân tích tệp chấm điểm .report của NPS",
            expectedOutput: "Tệp báo cáo hợp lệ",
            actualOutput: `Lỗi: ${err.message}`,
            passed: false
          }
        ],
        studentId,
        labId
      };
    }
  }
}
