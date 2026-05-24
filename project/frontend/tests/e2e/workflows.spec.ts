import { test, expect } from '@playwright/test';

test.describe('Cloud Lab Platform - Core Workflows E2E Verification', () => {

  test.beforeEach(async ({ page }) => {
    // Trước mỗi testcase, truy cập vào giao diện quản lý bài lab của sinh viên (ngôn ngữ mặc định: Tiếng Việt)
    await page.goto('http://localhost:3000/vi/labs');
  });

  /**
   * =========================================================================
   * WORKFLOW 1: DUYỆT TÌM & BỘ LỌC CASCADING FILTER (LAB BROWSER)
   * =========================================================================
   */
  test('TC-1.1: Verify Cascading Selects (Faculty -> Subject) and Lab Filtering', async ({ page }) => {
    // 1. Kiểm tra trạng thái mặc định của Select "Môn học" -> Phải bị disabled khi chưa chọn Khoa
    const subjectSelect = page.locator('#subject-select');
    await expect(subjectSelect).toBeDisabled();

    // 2. Nhấp vào Select "Khoa" và chọn khoa "Information Security" / "An toàn thông tin"
    const facultySelect = page.locator('#faculty-select');
    await facultySelect.click();
    await page.locator('[role="option"]:has-text("Information Security"), [role="option"]:has-text("An toàn thông tin")').first().click();

    // 3. Xác nhận Select "Môn học" đã được kích hoạt (enabled)
    await expect(subjectSelect).toBeEnabled();

    // 4. Nhấp vào Select "Môn học" và chọn môn "Cryptographic Fundamentals"
    await subjectSelect.click();
    await page.locator('[role="option"]:has-text("Cryptographic Fundamentals"), [role="option"]:has-text("Cơ sở mật mã học"), [role="option"]:has-text("crypto_fundamentals")').first().click();

    // 5. Kiểm tra danh sách bài lab hiển thị bên dưới. Phải chứa bài lab của môn Cơ sở mật mã học
    const labGrid = page.locator('.lab-grid-container');
    await expect(labGrid).toBeVisible({ timeout: 20000 });
    
    // Bài lab "Generate Hash" phải hiển thị
    const hashLabCard = labGrid.locator('text=Generate Hash');
    await expect(hashLabCard).toBeVisible({ timeout: 15000 });

    // Bài lab thuộc Công nghệ phần mềm (ví dụ: Sum Two Numbers) KHÔNG được hiển thị trong grid
    const otherLabCard = labGrid.locator('text=Sum Two Numbers');
    await expect(otherLabCard).toBeHidden({ timeout: 15000 });
  });

  test('TC-1.2: Verify Environment Type Filter and Search Keyword', async ({ page }) => {
    // 1. Chọn loại môi trường thực thi là "Ubuntu CLI (VM)"
    const envTypeSelect = page.locator('#env-type-select');
    await envTypeSelect.click();
    await page.locator('[role="option"]:has-text("Ubuntu CLI (VM)"), [role="option"]:has-text("Ubuntu CLI"), [role="option"][value="single_machine"]').first().click();

    // 2. Nhập từ khóa "Winlocker" vào ô tìm kiếm bài lab
    const searchInput = page.locator('input[placeholder*="Tìm kiếm bài lab"]');
    await searchInput.fill('Winlocker');

    // 3. Kết quả kỳ vọng: Chỉ hiển thị bài lab mã độc Winlocker
    const labGrid = page.locator('.lab-grid-container');
    await expect(labGrid).toBeVisible({ timeout: 20000 });

    const winlockerCard = labGrid.locator('text=Dynamic Analysis of WinlockerVB6Blacksod');
    await expect(winlockerCard).toBeVisible({ timeout: 15000 });

    const otherLabCard = labGrid.locator('text=Sum Two Numbers');
    await expect(otherLabCard).toBeHidden({ timeout: 15000 });
  });

  /**
   * =========================================================================
   * WORKFLOW 2: MONACO CODE WORKSPACE (PYTHON/JAVA/C++ RUNTIME)
   * =========================================================================
   */
  test('TC-2.1 & 2.2: Verify Monaco Workspace Auto-save, Run Code & Submit Grading', async ({ page }) => {
    // Đợi trang load xong và danh sách bài lab hiển thị
    await expect(page.locator('.lab-grid-container')).toBeVisible({ timeout: 25000 });

    // 1. Mở bài lab lập trình "Sum Two Numbers"
    const codeLabCard = page.locator('.lab-card:has-text("Sum Two Numbers")');
    const startLabBtn = codeLabCard.locator('a, button').filter({ hasText: /Bắt đầu lab|Tiếp tục làm lab|Xem lại/ }).first();
    await startLabBtn.click();

    // Đợi Workspace load hoàn chỉnh (Monaco Editor và thanh sidebar chỉ dẫn)
    await expect(page).toHaveURL(/\/labs\/[a-zA-Z0-9_-]+/);
    const monacoEditor = page.locator('.monaco-editor');
    await expect(monacoEditor).toBeVisible({ timeout: 25000 });

    // 2. Kiểm tra tính năng Auto-save khi sinh viên gõ code
    // Focus vào trình soạn thảo Monaco và gõ bình luận thử nghiệm
    await monacoEditor.click();
    await page.keyboard.type('\n# Playwright Automated Testing Verification Code\n');

    // Đợi 1.5 giây (debounce 1s) và kiểm tra trạng thái lưu
    await page.waitForTimeout(1500);
    const saveIndicator = page.locator('.save-status-indicator');
    await expect(saveIndicator).toContainText('Saved', { timeout: 15000 });

    // 3. Kiểm tra phím tắt Ctrl + S để lưu thủ công
    // Blur the Monaco editor input so keydown bubbles up to window level
    await page.evaluate(() => {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    });
    await page.keyboard.press('Control+s');
    const toastMessage = page.locator('text="Draft saved"').first();
    await expect(toastMessage).toBeVisible({ timeout: 20000 });

    // 4. Nhập Stdin tùy chỉnh và click chạy thử (Run Code)
    const stdinTextArea = page.locator('textarea[placeholder*="Enter test input"], textarea[placeholder*="Dữ liệu đầu vào"]');
    await stdinTextArea.fill('1 2');

    const runBtn = page.locator('button:has-text("Run Code"), button:has-text("Chạy thử")');
    await runBtn.click();

    // Xác nhận console output hiển thị log chạy thử
    const consoleOutput = page.locator('.console-output-pane, pre, .font-mono');
    await expect(consoleOutput.first()).toBeVisible({ timeout: 20000 });

    // 5. Thực hiện nộp bài (Submit Lab) và kiểm tra kết quả chấm điểm
    const submitBtn = page.locator('button:has-text("Submit Lab"), button:has-text("Nộp bài lab")');
    await submitBtn.click();

    // Đợi popup modal xác nhận nộp bài hiển thị và đồng ý (nếu có)
    const confirmBtn = page.locator('button:has-text("Xác nhận nộp"), button:has-text("Confirm"), button:has-text("Submit")');
    if (await confirmBtn.count() > 0) {
      await confirmBtn.click();
    }

    // Xác nhận kết quả nộp bài thành công và điểm số hiển thị
    const resultTab = page.locator('#result-tab-pane');
    await expect(resultTab).toBeVisible({ timeout: 20000 });
  });

  /**
   * =========================================================================
   * WORKFLOW 3: WEB TERMINAL VM WORKSPACE & SAFE UX TRANSITION GUARD
   * =========================================================================
   */
  test('TC-3.1 & 3.2: Verify WebTerminal VM Allocation and Safe Transition Guard', async ({ page }) => {
    // Đợi trang load xong và danh sách bài lab hiển thị
    await expect(page.locator('.lab-grid-container')).toBeVisible({ timeout: 25000 });

    // 1. Tìm và click "Bắt đầu lab" cho bài lab mã độc Ubuntu CLI
    const vmLabCard = page.locator('.lab-card:has-text("Dynamic Analysis of WinlockerVB6Blacksod")');
    const startVmBtn = vmLabCard.locator('a, button').filter({ hasText: /Bắt đầu lab|Tiếp tục làm lab|Xem lại/ }).first();
    await startVmBtn.click();

    // Đợi chuyển hướng sang Workspace
    await expect(page).toHaveURL(/\/labs\/[a-zA-Z0-9_-]+/);

    // Hệ thống nhận diện bài lab VM và mount WebTerminal màu tối
    const webTerminal = page.locator('.xterm-viewport, .xterm, canvas');
    await expect(webTerminal.first()).toBeVisible({ timeout: 25000 });

    // 2. Kiểm tra tính năng Safe Transition Guard: Ngăn chặn chuyển bài làm sập VM bất ngờ
    // Đăng ký dialog listener để mô phỏng click "Hủy" (dismiss)
    let dialogMessage = '';
    page.on('dialog', async dialog => {
      dialogMessage = dialog.message();
      await dialog.dismiss(); // Dismiss equivalent to "Hủy" (Cancel)
    });

    // Thử click vào link subjects trên sidebar (viewport-safe)
    const curriculumSidebarBtn = page.locator('a[href*="/subjects"]');
    await curriculumSidebarBtn.click();

    // Xác nhận cảnh báo xuất hiện
    expect(dialogMessage).toContain('Switching labs will terminate your interactive terminal session');
    await expect(webTerminal.first()).toBeVisible(); // Phiên terminal vẫn được giữ nguyên
  });

  /**
   * =========================================================================
   * WORKFLOW 4: LỊCH SỬ LÀM BÀI & PHẢN HỒI (SUBMISSIONS & FEEDBACK)
   * =========================================================================
   */
  test('TC-4.1 & 4.2: Verify Submission History (Read-only Monaco) and Graded Feedback', async ({ page }) => {
    // 1. Truy cập vào trang Lịch sử làm bài
    const submissionsSidebarBtn = page.locator('a[href*="/submissions"]');
    await submissionsSidebarBtn.click();
    await expect(page).toHaveURL(/\/submissions/);

    // Đợi danh sách lịch sử nộp bài hiển thị
    const firstSubmissionRow = page.locator('.submission-row, a[href*="submissions/"]').first();
    await expect(firstSubmissionRow).toBeVisible({ timeout: 25000 });
    await firstSubmissionRow.click();

    // Monaco Editor hiển thị code ở chế độ Read-only
    const readOnlyMonaco = page.locator('.monaco-editor');
    await expect(readOnlyMonaco).toBeVisible({ timeout: 20000 });
    
    // Đảm bảo không thể nhập liệu
    await readOnlyMonaco.click();
    await page.keyboard.type('Trying to edit code');
    await expect(readOnlyMonaco).not.toContainText('Trying to edit code');

    // 2. Truy cập vào trang Phản hồi
    const feedbackSidebarBtn = page.locator('a[href*="/feedback"]');
    await feedbackSidebarBtn.click();
    await expect(page).toHaveURL(/\/feedback/);

    // Kiểm tra danh sách đánh giá của giảng viên từ SQLite Mock
    const feedbackList = page.locator('.feedback-list-container');
    await expect(feedbackList).toBeVisible({ timeout: 20000 });

    // Click nút "Sửa & Nộp lại" trên bài nộp điểm thấp (nếu có)
    const retryBtn = page.locator('a:has-text("Sửa & Nộp lại"), button:has-text("Sửa & Nộp lại")').first();
    if (await retryBtn.count() > 0) {
      await retryBtn.click();
      // Hệ thống tự động điều hướng sinh viên về đúng Workspace của bài lab đó để làm lại bài
      await expect(page).toHaveURL(/\/labs\/[a-zA-Z0-9_-]+/);
    }
  });
});
