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
} from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001';

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
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
  labId: string
): Promise<SubmitResponse> {
  return fetchApi<SubmitResponse>('/submit', {
    method: 'POST',
    body: JSON.stringify({ code, profileId, labId }),
  });
}

export async function submitFile(
  file: File,
  profileId: string,
  labId: string
): Promise<SubmitResponse & { fileName?: string }> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('profileId', profileId);
  formData.append('labId', labId);

  const res = await fetch(`${API_BASE}/upload-submit`, {
    method: 'POST',
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
export async function getSubmissions(): Promise<SubmissionRecord[]> {
  return fetchApi<SubmissionRecord[]>('/submissions');
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

export { API_BASE };
