import type {
  Faculty,
  Subject,
  Lab,
  LabSummary,
  ExecutionProfile,
  SubmissionRecord,
  RunResponse,
  SubmitResponse,
  TerminalInitResponse,
  Semester,
  Class,
  PracticeSession,
} from './types';
import { useAuthStore } from './auth-store';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001';

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = useAuthStore.getState().token;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      ...headers,
      ...options?.headers,
    } as any,
  });

  if (!res.ok) {
    throw new Error(`API Error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

// === Faculties ===
export async function getFaculties(): Promise<Faculty[]> {
  return fetchApi<Faculty[]>('/faculties');
}

// === Subjects ===
export async function getSubjects(facultyId?: string): Promise<Subject[]> {
  const params = facultyId ? `?facultyId=${facultyId}` : '';
  return fetchApi<Subject[]>(`/subjects${params}`);
}

// === Labs ===
export async function getLabs(subjectId?: string): Promise<LabSummary[]> {
  const params = subjectId ? `?subjectId=${subjectId}` : '';
  return fetchApi<LabSummary[]>(`/labs${params}`);
}

export async function getLab(id: string): Promise<Lab> {
  return fetchApi<Lab>(`/labs/${id}`);
}

// === Profiles ===
export async function getProfile(id: string): Promise<ExecutionProfile> {
  return fetchApi<ExecutionProfile>(`/profiles/${id}`);
}

// === Execution ===
export async function runCode(
  code: string,
  profileId: string,
  stdin?: string
): Promise<RunResponse> {
  return fetchApi<RunResponse>('/run', {
    method: 'POST',
    body: JSON.stringify({ code, profileId, stdin }),
  });
}

export async function submitCode(
  code: string,
  profileId: string,
  labId: string,
  sessionId?: string
): Promise<SubmitResponse> {
  return fetchApi<SubmitResponse>('/submit', {
    method: 'POST',
    body: JSON.stringify({ code, profileId, labId, sessionId }),
  });
}

export async function submitFile(
  file: File,
  profileId: string,
  labId: string,
  sessionId?: string
): Promise<SubmitResponse & { fileName?: string }> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('profileId', profileId);
  formData.append('labId', labId);
  if (sessionId) {
    formData.append('sessionId', sessionId);
  }

  const token = useAuthStore.getState().token;
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}/upload-submit`, {
    method: 'POST',
    headers,
    // Do NOT set Content-Type header — browser sets it automatically with correct multipart boundary
    body: formData,
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(errBody.error || `API Error: ${res.status}`);
  }

  return res.json();
}

// === Submissions ===
export async function getSubmissions(sessionId?: string): Promise<SubmissionRecord[]> {
  const params = sessionId ? `?sessionId=${sessionId}` : '';
  return fetchApi<SubmissionRecord[]>(`/submissions${params}`);
}

export async function getSubmission(id: string): Promise<SubmissionRecord> {
  return fetchApi<SubmissionRecord>(`/submissions/${id}`);
}

// === Terminal ===
export async function initTerminal(labId?: string): Promise<TerminalInitResponse> {
  return fetchApi<TerminalInitResponse>('/terminal/init', {
    method: 'POST',
    body: JSON.stringify({ labId }),
  });
}

// === Semesters ===
export async function getSemesters(): Promise<Semester[]> {
  return fetchApi<Semester[]>('/semesters');
}

export async function createSemester(name: string, startDate?: string, endDate?: string): Promise<Semester> {
  return fetchApi<Semester>('/semesters', {
    method: 'POST',
    body: JSON.stringify({ name, startDate, endDate }),
  });
}

// === Classes ===
export async function getClasses(): Promise<Class[]> {
  return fetchApi<Class[]>('/classes');
}

export async function createClass(name: string, subjectId: string, semesterId: string): Promise<Class> {
  return fetchApi<Class>('/classes', {
    method: 'POST',
    body: JSON.stringify({ name, subjectId, semesterId }),
  });
}

export async function getClassMembers(classId: string): Promise<any[]> {
  return fetchApi<any[]>(`/classes/${classId}/members`);
}

// === Sessions ===
export async function getSessions(): Promise<PracticeSession[]> {
  return fetchApi<PracticeSession[]>('/sessions');
}

export async function getActiveSession(): Promise<PracticeSession | null> {
  return fetchApi<PracticeSession | null>('/sessions/active');
}

export async function getSession(id: string): Promise<PracticeSession> {
  return fetchApi<PracticeSession>(`/sessions/${id}`);
}

export async function createSession(session: Omit<PracticeSession, 'id' | 'status'>): Promise<PracticeSession> {
  return fetchApi<PracticeSession>('/sessions', {
    method: 'POST',
    body: JSON.stringify(session),
  });
}

export async function updateSession(id: string, session: Partial<PracticeSession>): Promise<{ success: boolean }> {
  return fetchApi<{ success: boolean }>(`/sessions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(session),
  });
}

export async function deleteSession(id: string): Promise<{ success: boolean }> {
  return fetchApi<{ success: boolean }>(`/sessions/${id}`, {
    method: 'DELETE',
  });
}

export async function importSessionParticipants(id: string, participants: any[]): Promise<{ success: boolean }> {
  return fetchApi<{ success: boolean }>(`/sessions/${id}/import`, {
    method: 'POST',
    body: JSON.stringify({ participants }),
  });
}

// === Sessions Grading, Monitoring & Anticheat ===
export async function getSessionMonitoringData(sessionId: string): Promise<any[]> {
  return fetchApi<any[]>(`/sessions/${sessionId}/monitoring-data`);
}

export async function scanPlagiarism(sessionId: string, threshold = 0.7): Promise<{ success: boolean; count: number }> {
  return fetchApi<{ success: boolean; count: number }>(`/sessions/${sessionId}/plagiarism/scan`, {
    method: 'POST',
    body: JSON.stringify({ threshold }),
  });
}

export async function getPlagiarismCases(sessionId: string): Promise<any[]> {
  return fetchApi<any[]>(`/sessions/${sessionId}/plagiarism/cases`);
}

export async function updatePlagiarismCase(caseId: string, status: 'confirmed' | 'dismissed'): Promise<{ success: boolean }> {
  return fetchApi<{ success: boolean }>(`/plagiarism/cases/${caseId}`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
}

export async function gradeSubmission(submissionId: string, score: number, comment: string): Promise<{ success: boolean; message: string }> {
  return fetchApi<{ success: boolean; message: string }>(`/submissions/${submissionId}/grade`, {
    method: 'POST',
    body: JSON.stringify({ score, comment }),
  });
}

export async function getSessionLeaderboard(sessionId: string): Promise<any[]> {
  return fetchApi<any[]>(`/sessions/${sessionId}/leaderboard`);
}

// === MCQ & APPROVAL OPERATIONS ===
export async function getMcqs(): Promise<any[]> {
  return fetchApi<any[]>('/mcqs');
}

export async function createMcq(mcq: any): Promise<{ success: boolean; id: string }> {
  return fetchApi<{ success: boolean; id: string }>('/mcqs', {
    method: 'POST',
    body: JSON.stringify(mcq),
  });
}

export async function getSessionMcqs(sessionId: string): Promise<any[]> {
  return fetchApi<any[]>(`/sessions/${sessionId}/mcqs`);
}

export async function assignMcqsToSession(sessionId: string, questionIds: string[]): Promise<{ success: boolean }> {
  return fetchApi<{ success: boolean }>(`/sessions/${sessionId}/mcqs/assign`, {
    method: 'POST',
    body: JSON.stringify({ questionIds }),
  });
}

export async function submitSessionMcqs(sessionId: string, answers: { questionId: string; selectedOption: number }[]): Promise<{ success: boolean; total: number; correct: number; score: number }> {
  return fetchApi<{ success: boolean; total: number; correct: number; score: number }>(`/sessions/${sessionId}/mcqs/submit`, {
    method: 'POST',
    body: JSON.stringify({ answers }),
  });
}

export async function getSessionMcqAnswers(sessionId: string): Promise<any[]> {
  return fetchApi<any[]>(`/sessions/${sessionId}/mcqs/answers`);
}

export async function getApprovals(): Promise<any[]> {
  return fetchApi<any[]>('/approvals');
}

export async function submitApproval(labId: string): Promise<{ success: boolean }> {
  return fetchApi<{ success: boolean }>('/approvals', {
    method: 'POST',
    body: JSON.stringify({ labId }),
  });
}

export async function updateApproval(requestId: string, status: 'approved' | 'rejected', comments: string): Promise<{ success: boolean }> {
  return fetchApi<{ success: boolean }>(`/approvals/${requestId}`, {
    method: 'PUT',
    body: JSON.stringify({ status, comments }),
  });
}

export { API_BASE };
