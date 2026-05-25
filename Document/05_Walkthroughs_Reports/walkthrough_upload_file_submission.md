# Walkthrough: Tính Năng Upload File Solution

**Ngày**: 2026-05-25  
**Phiên**: Upload File Submission (bổ sung song song với Monaco Editor)

---

## Mục Tiêu

Cho phép sinh viên **upload file bài giải** (`.py`, `.sh`, `.js`...) từ máy tính cá nhân lên hệ thống để chấm điểm — thay vì bắt buộc phải gõ code trong Monaco Editor.

---

## Thay Đổi Đã Thực Hiện

### Backend

| File | Thay Đổi |
|------|----------|
| `project/backend/src/index.ts` | Cài `multer`, thêm route `POST /upload-submit` |

**Logic của `/upload-submit`**:
1. Nhận `multipart/form-data` (`file`, `profileId`, `labId`)
2. Validate: extension phải trong whitelist, ≤ 2MB
3. Đọc buffer → `code` string UTF-8
4. Chạy qua `DockerRunner` giống hệt `/submit`
5. Trả về `{ executionId, status: "queued", fileName }`
6. Emit `execution:status` qua WebSocket khi xong

### Frontend

| File | Thay Đổi |
|------|----------|
| `project/frontend/lib/api.ts` | Thêm hàm `submitFile(file, profileId, labId)` |
| `project/frontend/components/file-upload-zone.tsx` | **[NEW]** Component Drag & Drop upload |
| `project/frontend/app/[locale]/labs/[labId]/lab-workspace-content.tsx` | Thêm tab "Soạn code / Upload file" |

---

## Luồng Kỹ Thuật

```
FileUploadZone (chọn file) 
  → submitFile() [api.ts] 
  → POST /upload-submit (FormData)
  → multer parse → code string
  → DockerRunner.executeSubmit() × testcases  
  → SQLite.saveSubmission()
  → WebSocket execution:status
  → subscribeToExecution()
  → GradingResultView (Tab Result)
```

---

## Kiểm Tra

- ✅ `POST /upload-submit` trả `{ executionId, fileName }` đúng định dạng  
- ✅ Submission lưu vào SQLite với `uploadedFileName`  
- ✅ Backend TypeScript: 0 lỗi mới  
- ❌ Docker execution: Docker Desktop chưa chạy trên máy dev (cùng trạng thái với `/submit`)

---

## Cách Test Khi Docker Chạy

```bash
# Tạo file solution
echo "import sys; n=sys.stdin.read().split(); print(int(n[0])+int(n[1]))" > solution.py

# Upload lên hệ thống (hoặc qua UI tại /en/labs/sum_two_numbers → tab Upload file)
curl -F "file=@solution.py" -F "profileId=python_basic" -F "labId=sum_two_numbers" \
  http://localhost:3001/upload-submit
```

Kết quả mong đợi: `score: 100` sau khi grading xong.
