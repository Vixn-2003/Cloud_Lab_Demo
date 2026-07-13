'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  getClasses,
  getSemesters,
  getLabs,
  createSession,
  updateSession,
} from '@/lib/api';
import { Class, Semester, LabSummary, PracticeSession } from '@/lib/types';
import { toast } from 'sonner';
import { Calendar, Users, BookOpen, Settings2 } from 'lucide-react';

interface SessionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionToEdit?: PracticeSession | null;
  onSuccess: () => void;
}

export function SessionForm({
  open,
  onOpenChange,
  sessionToEdit,
  onSuccess,
}: SessionFormProps) {
  const t = useTranslations('navigation');
  const tCommon = useTranslations('common');
  const tWorkspace = useTranslations('workspace');

  const [activeTab, setActiveTab] = useState('basic');
  const [classes, setClasses] = useState<Class[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [availableLabs, setAvailableLabs] = useState<LabSummary[]>([]);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [classId, setClassId] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [status, setStatus] = useState<'draft' | 'scheduled' | 'active' | 'frozen' | 'ended'>('draft');

  // Rules Fields
  const [allowBrowser, setAllowBrowser] = useState(false);
  const [freezeBeforeEnd, setFreezeBeforeEnd] = useState(15);
  const [penaltyMinutes, setPenaltyMinutes] = useState(20);
  const [submissionMode, setSubmissionMode] = useState<'auto' | 'manual'>('auto');

  // Labs & Participants
  const [selectedLabIds, setSelectedLabIds] = useState<string[]>([]);
  const [csvText, setCsvText] = useState('');
  const [parsedParticipants, setParsedParticipants] = useState<any[]>([]);

  // Load Classes and Semesters
  useEffect(() => {
    if (open) {
      getClasses().then(setClasses).catch(console.error);
      getSemesters().then(setSemesters).catch(console.error);
    }
  }, [open]);

  // Load Labs when Class changes
  useEffect(() => {
    if (classId) {
      const cls = classes.find((c) => c.id === classId);
      if (cls) {
        setSelectedClass(cls);
        getLabs(cls.subject_id)
          .then(setAvailableLabs)
          .catch((err) => {
            console.error(err);
            setAvailableLabs([]);
          });
      }
    } else {
      setSelectedClass(null);
      setAvailableLabs([]);
    }
  }, [classId, classes]);

  // Load editing data if editing
  useEffect(() => {
    if (open && sessionToEdit) {
      setName(sessionToEdit.name);
      setLocation(sessionToEdit.location || '');
      setClassId(sessionToEdit.class_id);
      setStartTime(
        sessionToEdit.start_time ? sessionToEdit.start_time.substring(0, 16) : ''
      );
      setEndTime(
        sessionToEdit.end_time ? sessionToEdit.end_time.substring(0, 16) : ''
      );
      setStatus(sessionToEdit.status);
      setAllowBrowser(sessionToEdit.allow_browser);
      setFreezeBeforeEnd(sessionToEdit.freeze_before_end_minutes);
      setPenaltyMinutes(sessionToEdit.penalty_minutes_per_wrong_submit);
      setSubmissionMode(sessionToEdit.submission_mode);
      setSelectedLabIds(sessionToEdit.labIds || []);

      if (sessionToEdit.participants) {
        setParsedParticipants(
          sessionToEdit.participants.map((p) => ({
            username: p.username,
            fullName: p.full_name,
            studentCode: p.student_code,
            email: p.email,
            examRoom: p.exam_room,
            seatIp: p.seat_ip,
            hostname: p.hostname,
            variantCode: p.variant_code,
            status: p.status,
          }))
        );
      } else {
        setParsedParticipants([]);
      }
      setCsvText('');
      setActiveTab('basic');
    } else if (open) {
      // Clear form for new session
      setName('');
      setLocation('');
      setClassId('');
      setStartTime('');
      setEndTime('');
      setStatus('draft');
      setAllowBrowser(false);
      setFreezeBeforeEnd(15);
      setPenaltyMinutes(20);
      setSubmissionMode('auto');
      setSelectedLabIds([]);
      setCsvText('');
      setParsedParticipants([]);
      setActiveTab('basic');
    }
  }, [open, sessionToEdit]);

  // Parse CSV text client-side
  const handleParseCsv = () => {
    if (!csvText.trim()) {
      toast.error('Vui lòng dán nội dung CSV');
      return;
    }

    try {
      const lines = csvText.split('\n');
      const list: any[] = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Skip header if matches
        if (i === 0 && line.toLowerCase().includes('username')) {
          continue;
        }

        const parts = line.split(',').map((p) => p.trim());
        if (parts.length < 3) continue; // Requires at least username, fullName, studentCode

        list.push({
          username: parts[0],
          fullName: parts[1],
          studentCode: parts[2],
          email: parts[3] || null,
          examRoom: parts[4] || location || null,
          seatIp: parts[5] || null,
          hostname: parts[6] || null,
          variantCode: parts[7] || null,
        });
      }

      if (list.length === 0) {
        toast.error('Không tìm thấy dữ liệu hợp lệ. Định dạng yêu cầu: username, fullName, studentCode, [email], ...');
        return;
      }

      setParsedParticipants([...parsedParticipants, ...list]);
      setCsvText('');
      toast.success(`Đã đọc thành công ${list.length} học viên.`);
    } catch (err) {
      console.error(err);
      toast.error('Lỗi cú pháp CSV.');
    }
  };

  const handleLabToggle = (labId: string) => {
    setSelectedLabIds((prev) =>
      prev.includes(labId) ? prev.filter((id) => id !== labId) : [...prev, labId]
    );
  };

  const handleSave = async () => {
    if (!name || !classId || !startTime || !endTime) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc.');
      return;
    }

    if (selectedLabIds.length === 0) {
      toast.error('Vui lòng gán ít nhất một bài thực hành (Lab).');
      return;
    }

    const payload = {
      name,
      bannerUrl: null,
      location: location || null,
      classId,
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
      allowBrowser,
      freezeBeforeEndMinutes: Number(freezeBeforeEnd),
      penaltyMinutesPerWrongSubmit: Number(penaltyMinutes),
      submissionMode,
      labIds: selectedLabIds,
      participants: parsedParticipants,
      instructors: [], // Seed handles owner/instructor assignment
    };

    try {
      if (sessionToEdit) {
        await updateSession(sessionToEdit.id, {
          ...payload,
          status,
        });
        toast.success('Cập nhật ca thực hành thành công.');
      } else {
        await createSession(payload);
        toast.success('Tạo ca thực hành mới thành công.');
      }
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      console.error(err);
      toast.error('Lỗi lưu ca thực hành: ' + err.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col bg-card border-border text-foreground shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-foreground text-xl">
            {sessionToEdit ? 'Chỉnh sửa Ca thực hành' : 'Tạo Ca thực hành/thi mới'}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Cấu hình thời gian, phòng máy, bộ bài tập và sinh viên tham gia ca thi.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="bg-muted/50 border border-border flex w-full p-1 h-auto rounded-lg mb-2">
            <TabsTrigger value="basic" className="flex-1 py-2 text-xs md:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-1.5 min-w-0 transition-all cursor-pointer">
              <Calendar className="h-4 w-4 shrink-0" />
              <span className="truncate">Thông tin chung</span>
            </TabsTrigger>
            <TabsTrigger value="rules" className="flex-1 py-2 text-xs md:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-1.5 min-w-0 transition-all cursor-pointer">
              <Settings2 className="h-4 w-4 shrink-0" />
              <span className="truncate">Quy tắc & Điểm</span>
            </TabsTrigger>
            <TabsTrigger value="labs" className="flex-1 py-2 text-xs md:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-1.5 min-w-0 transition-all cursor-pointer">
              <BookOpen className="h-4 w-4 shrink-0" />
              <span className="truncate">Bộ bài tập ({selectedLabIds.length})</span>
            </TabsTrigger>
            <TabsTrigger value="participants" className="flex-1 py-2 text-xs md:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-1.5 min-w-0 transition-all cursor-pointer">
              <Users className="h-4 w-4 shrink-0" />
              <span className="truncate">Sinh viên ({parsedParticipants.length})</span>
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto py-4 min-h-0 space-y-4 pr-1">
            {/* Tab: Thông tin chung */}
            <TabsContent value="basic" className="space-y-4 m-0">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="session-name" className="text-foreground">Tên ca thực hành/thi <span className="text-red-500">*</span></Label>
                  <Input
                    id="session-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ví dụ: Thi thực hành giữa kỳ 1 - Môn mật mã học"
                    className="bg-background/50 border-input text-foreground placeholder-muted-foreground focus-visible:ring-primary focus-visible:ring-offset-0 focus-visible:border-primary"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="session-location" className="text-foreground">Phòng thi / Địa điểm</Label>
                  <Input
                    id="session-location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Ví dụ: Phòng máy 402-A2 hoặc Online"
                    className="bg-background/50 border-input text-foreground placeholder-muted-foreground focus-visible:ring-primary focus-visible:ring-offset-0 focus-visible:border-primary"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="session-class" className="text-foreground">Lớp học liên kết <span className="text-red-500">*</span></Label>
                  <Select value={classId} onValueChange={setClassId}>
                    <SelectTrigger className="bg-background/50 border-input text-foreground">
                      <SelectValue placeholder="Chọn lớp học..." />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border text-popover-foreground">
                      {classes.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id} className="hover:bg-muted cursor-pointer">
                          {cls.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="session-start" className="text-foreground">Thời gian bắt đầu <span className="text-red-500">*</span></Label>
                  <Input
                    id="session-start"
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="bg-background/50 border-input text-foreground focus-visible:ring-primary focus-visible:ring-offset-0 focus-visible:border-primary"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="session-end" className="text-foreground">Thời gian kết thúc <span className="text-red-500">*</span></Label>
                  <Input
                    id="session-end"
                    type="datetime-local"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="bg-background/50 border-input text-foreground focus-visible:ring-primary focus-visible:ring-offset-0 focus-visible:border-primary"
                  />
                </div>

                {sessionToEdit && (
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="session-status" className="text-foreground">Trạng thái ca thi</Label>
                    <Select value={status} onValueChange={(val: any) => setStatus(val)}>
                      <SelectTrigger className="bg-background/50 border-input text-foreground">
                        <SelectValue placeholder="Chọn trạng thái..." />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border text-popover-foreground">
                        <SelectItem value="draft" className="hover:bg-muted cursor-pointer">Draft (Bản nháp)</SelectItem>
                        <SelectItem value="scheduled" className="hover:bg-muted cursor-pointer">Scheduled (Đã lên lịch)</SelectItem>
                        <SelectItem value="active" className="hover:bg-muted cursor-pointer">Active (Đang diễn ra)</SelectItem>
                        <SelectItem value="frozen" className="hover:bg-muted cursor-pointer">Frozen (Đóng băng bảng điểm)</SelectItem>
                        <SelectItem value="ended" className="hover:bg-muted cursor-pointer">Ended (Đã kết thúc)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Tab: Quy tắc & Điểm */}
            <TabsContent value="rules" className="space-y-4 m-0">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-background/50">
                  <div className="space-y-0.5">
                    <Label className="text-foreground">Cho phép trình duyệt tự do</Label>
                    <p className="text-xs text-muted-foreground">
                      Cho phép sinh viên xem bảng điểm hoặc đổi tab mà không ghi nhận hành vi cảnh báo.
                    </p>
                  </div>
                  <Switch checked={allowBrowser} onCheckedChange={setAllowBrowser} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="freeze-time" className="text-foreground">Thời gian đóng băng bảng xếp hạng (phút)</Label>
                    <Input
                      id="freeze-time"
                      type="number"
                      value={freezeBeforeEnd}
                      onChange={(e) => setFreezeBeforeEnd(Number(e.target.value))}
                      className="bg-background/50 border-input text-foreground focus-visible:ring-primary focus-visible:ring-offset-0 focus-visible:border-primary"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Đóng băng kết quả bảng điểm công khai trước khi ca thi kết thúc N phút.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="penalty-time" className="text-foreground">Phạt thời gian khi nộp sai (phút)</Label>
                    <Input
                      id="penalty-time"
                      type="number"
                      value={penaltyMinutes}
                      onChange={(e) => setPenaltyMinutes(Number(e.target.value))}
                      className="bg-background/50 border-input text-foreground focus-visible:ring-primary focus-visible:ring-offset-0 focus-visible:border-primary"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Số phút cộng thêm vào thời gian làm bài của sinh viên cho mỗi lượt nộp bài sai.
                    </p>
                  </div>

                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="submit-mode" className="text-foreground">Chế độ chấm bài</Label>
                    <Select
                      value={submissionMode}
                      onValueChange={(val: 'auto' | 'manual') => setSubmissionMode(val)}
                    >
                      <SelectTrigger className="bg-background/50 border-input text-foreground">
                        <SelectValue placeholder="Chọn chế độ..." />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border text-popover-foreground">
                        <SelectItem value="auto" className="hover:bg-muted cursor-pointer">
                          Chấm điểm tự động (Auto-grade qua Testcase)
                        </SelectItem>
                        <SelectItem value="manual" className="hover:bg-muted cursor-pointer">
                          Chấm điểm thủ công (Manual review / Upload file)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Tab: Gán bài tập */}
            <TabsContent value="labs" className="space-y-4 m-0 flex-1 flex flex-col min-h-0">
              {!classId ? (
                <div className="text-center py-8 text-muted-foreground border border-dashed border-border rounded-lg bg-muted/20">
                  Vui lòng chọn Lớp học ở tab Thông tin chung để xem danh sách bài thực hành tương ứng.
                </div>
              ) : availableLabs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Không tìm thấy bài thực hành nào cho môn học của lớp này.
                </div>
              ) : (
                <div className="border border-border rounded-lg overflow-hidden bg-muted/20">
                  <div className="max-h-60 overflow-y-auto divide-y divide-border">
                    {availableLabs.map((lab) => (
                      <div key={lab.id} className="flex items-center space-x-3 p-3 hover:bg-muted/40">
                        <Checkbox
                           id={`lab-${lab.id}`}
                           checked={selectedLabIds.includes(lab.id)}
                           onCheckedChange={() => handleLabToggle(lab.id)}
                           className="border-input data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                        />
                        <div className="flex-1 min-w-0">
                          <label
                            htmlFor={`lab-${lab.id}`}
                            className="text-sm font-medium text-foreground cursor-pointer block truncate"
                          >
                            {lab.title}
                          </label>
                          <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                            Mã: {lab.id} | Runner: {lab.profileId}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Tab: Sinh viên */}
            <TabsContent value="participants" className="space-y-4 m-0 flex-1 flex flex-col min-h-0">
              <div className="space-y-3">
                <Label htmlFor="csv-input" className="text-foreground">Dán danh sách sinh viên dạng CSV</Label>
                <div className="space-y-2">
                  <Textarea
                    id="csv-input"
                    value={csvText}
                    onChange={(e) => setCsvText(e.target.value)}
                    placeholder="username, full_name, student_code, [email], [exam_room], ...&#10;vi_student_01, Nguyen Van A, B22DCCN001, a@student.ptit.edu.vn&#10;vi_student_02, Tran Thi B, B22DCCN002, b@student.ptit.edu.vn"
                    className="bg-background/50 border-input text-foreground placeholder-muted-foreground/60 focus-visible:ring-primary focus-visible:ring-offset-0 focus-visible:border-primary h-28 font-mono text-xs"
                  />
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-muted-foreground">
                      Yêu cầu tối thiểu: <code className="bg-muted px-1 py-0.5 rounded text-primary">username,fullName,studentCode</code>. Mật khẩu mặc định: <code className="bg-muted px-1 py-0.5 rounded text-amber-500">student123</code>
                    </span>
                    <Button type="button" size="sm" onClick={handleParseCsv} className="bg-primary text-white cursor-pointer hover:opacity-90">
                      Đọc danh sách
                    </Button>
                  </div>
                </div>

                {parsedParticipants.length > 0 && (
                  <div className="space-y-2 flex-1 flex flex-col min-h-0">
                    <div className="flex justify-between items-center">
                      <Label className="text-muted-foreground">Đã nạp ({parsedParticipants.length} sinh viên)</Label>
                      <button
                        type="button"
                        onClick={() => setParsedParticipants([])}
                        className="text-xs text-red-500 hover:text-red-400 transition-colors cursor-pointer"
                      >
                        Xóa tất cả
                      </button>
                    </div>

                    <div className="border border-border rounded-lg overflow-hidden bg-muted/20 max-h-40 overflow-y-auto">
                      <table className="w-full text-xs text-left text-foreground">
                        <thead className="bg-muted text-muted-foreground uppercase tracking-wider text-[10px] border-b border-border sticky top-0">
                          <tr>
                            <th className="px-3 py-2">Mã SV</th>
                            <th className="px-3 py-2">Họ và tên</th>
                            <th className="px-3 py-2">Username</th>
                            <th className="px-3 py-2">Phòng/Đề</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {parsedParticipants.map((p, idx) => (
                            <tr key={idx} className="hover:bg-muted/30">
                              <td className="px-3 py-1.5 font-mono">{p.studentCode}</td>
                              <td className="px-3 py-1.5 font-medium">{p.fullName}</td>
                              <td className="px-3 py-1.5 text-muted-foreground">{p.username}</td>
                              <td className="px-3 py-1.5 text-[10px] text-muted-foreground">
                                {p.examRoom || 'Mặc định'}{p.variantCode ? ` / Đề ${p.variantCode}` : ''}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter className="border-t border-border pt-4 flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-input text-foreground hover:bg-muted cursor-pointer">
            Hủy
          </Button>
          <Button onClick={handleSave} className="bg-gradient-to-r from-primary to-[oklch(0.6_0.22_290)] text-white hover:opacity-90 cursor-pointer">
            {sessionToEdit ? 'Lưu thay đổi' : 'Tạo ca thực hành'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
