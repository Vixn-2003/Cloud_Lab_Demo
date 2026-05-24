// Sample data for development/demo mode when API is not available
import type { Faculty, Subject, Lab, Attempt, ExecutionProfile, LabStatus } from './types';

export const sampleFaculties: Faculty[] = [
  { id: 'soft_eng', title: 'Faculty of Software Engineering' },
  { id: 'info_sec', title: 'Faculty of Information Security' },
];

export const sampleSubjects: Subject[] = [
  { id: 'algos', title: 'Algorithms & Data Structures', facultyId: 'soft_eng' },
  { id: 'net_sec', title: 'Network Security', facultyId: 'info_sec' },
  { id: 'crypto', title: 'Applied Cryptography', facultyId: 'info_sec' },
  { id: 'crypto_fundamentals', title: 'Cryptographic Fundamentals', facultyId: 'info_sec' },
];

// Helper to get due dates relative to now
const getDueDate = (daysFromNow: number) => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString();
};

const getLastEdited = (hoursAgo: number) => {
  const date = new Date();
  date.setHours(date.getHours() - hoursAgo);
  return date.toISOString();
};

export const sampleLabs: Lab[] = [
  {
    id: 'sum_two_numbers',
    title: 'Sum Two Numbers',
    statement: `# Sum Two Numbers

Write a program that reads two integers from stdin and outputs their sum.

## Input Format
Two integers separated by a newline.

## Output Format
A single integer representing the sum.

## Example
**Input:**
\`\`\`
5
3
\`\`\`

**Output:**
\`\`\`
8
\`\`\`
`,
    profileId: 'python_basic',
    environmentType: 'single_runtime',
    toolset: ['Python 3'],
    subjectId: 'algos',
    subjectTitle: 'Algorithms & Data Structures',
    dueDate: getDueDate(7),
    status: 'completed',
    progress: 100,
    lastEditedAt: getLastEdited(96),
    attemptsCount: 2,
    bestScore: 100,
    maxScore: 100,
    canResubmit: true,
  },
  {
    id: 'lab_gen_hash',
    title: 'Task 1 — Generate Hash (Shell CLI)',
    statement: `# Task 1 — Generate Hash

Use CLI tools to generate hashes for a message from stdin.

## Requirements
Generate the following hashes:
- MD5
- SHA1
- SHA256

## Output Format
Output a JSON object with the following structure:
\`\`\`json
{
  "md5": "...",
  "sha1": "...",
  "sha256": "..."
}
\`\`\`

## Tools Available
- openssl
- md5sum, sha1sum, sha256sum
- bash scripting

## Hints
- Use \`echo -n\` to avoid trailing newlines
- Combine outputs with jq or manual JSON construction
`,
    profileId: 'security_shell',
    environmentType: 'single_machine',
    toolset: ['openssl', 'python3', 'bash'],
    subjectId: 'crypto_fundamentals',
    subjectTitle: 'Cryptographic Fundamentals',
    dueDate: getDueDate(2),
    status: 'in_progress',
    progress: 60,
    lastEditedAt: getLastEdited(2),
    attemptsCount: 3,
    bestScore: 85,
    maxScore: 100,
    canResubmit: true,
  },
  {
    id: 'lab_openssl_hmac',
    title: 'Task 2 — HMAC via OpenSSL CLI',
    statement: `# Task 2 — HMAC via OpenSSL CLI

Implement HMAC authentication using OpenSSL command line tools.

## Requirements
Generate HMAC-SHA256 for a given message and key.

## Learning Objectives
- Understand message authentication codes
- Learn OpenSSL HMAC syntax
- Practice key-based authentication

## Tools Available
- openssl
- bash
`,
    profileId: 'security_shell',
    environmentType: 'single_machine',
    toolset: ['openssl', 'bash'],
    subjectId: 'crypto_fundamentals',
    subjectTitle: 'Cryptographic Fundamentals',
    dueDate: getDueDate(5),
    status: 'not_started',
    progress: 0,
    attemptsCount: 0,
    maxScore: 100,
    canResubmit: true,
  },
  {
    id: 'lab_avalanche',
    title: 'Task 3 — Avalanche Effect',
    statement: `# Task 3 — Avalanche Effect

Demonstrate the avalanche effect in cryptographic hash functions.

## Objective
Show how a small change in input causes a significant change in the hash output.

## Requirements
1. Hash the original message
2. Change one bit of the message
3. Hash the modified message
4. Calculate the percentage of bits that changed

## Expected Result
The bit difference should be approximately 50% for a good hash function.
`,
    profileId: 'security_shell',
    environmentType: 'single_machine',
    toolset: ['openssl', 'python3', 'bash'],
    subjectId: 'crypto_fundamentals',
    subjectTitle: 'Cryptographic Fundamentals',
    dueDate: getDueDate(1),
    status: 'needs_revision',
    progress: 80,
    lastEditedAt: getLastEdited(24),
    attemptsCount: 2,
    bestScore: 70,
    maxScore: 100,
    canResubmit: true,
  },
  {
    id: 'lab_bruteforce_mock',
    title: 'Task 4 — Brute-force Simulation',
    statement: `# Task 4 — Brute-force Simulation

Implement a simple brute-force attack simulation against weak passwords.

## Learning Objectives
- Understand why strong passwords matter
- Learn about hash cracking techniques
- Practice Python scripting

## Warning
This is for educational purposes only!
`,
    profileId: 'security_shell',
    environmentType: 'single_runtime',
    toolset: ['python3', 'bash'],
    subjectId: 'crypto_fundamentals',
    subjectTitle: 'Cryptographic Fundamentals',
    dueDate: getDueDate(-1), // Overdue
    status: 'overdue',
    progress: 0,
    attemptsCount: 0,
    maxScore: 100,
    canResubmit: true,
  },
  {
    id: 'lab_winlocker_analysis',
    title: 'Dynamic Analysis of WinlockerVB6Blacksod',
    statement: `# Dynamic Analysis of Ransomware

Perform dynamic analysis on a ransomware sample in a controlled environment.

## Safety Notice
All analysis is performed in an isolated sandbox environment.

## Learning Objectives
- Understand malware behavior analysis
- Learn dynamic analysis techniques
- Practice safe malware handling

## Tools Available
- wine (Windows emulation)
- tcpdump (network capture)
- strace (system call tracing)
- bash scripting
`,
    profileId: 'malware_analysis_shell',
    environmentType: 'single_runtime',
    toolset: ['wine', 'tcpdump', 'strace', 'bash'],
    subjectId: 'net_sec',
    subjectTitle: 'Network Security',
    dueDate: getDueDate(14),
    status: 'submitted',
    progress: 100,
    lastEditedAt: getLastEdited(48),
    attemptsCount: 1,
    bestScore: undefined, // Pending grading
    maxScore: 100,
    canResubmit: false, // Waiting for grading
  },
];

export const sampleProfiles: ExecutionProfile[] = [
  {
    id: 'python_basic',
    displayName: 'Python 3',
    osFamily: 'Linux',
    language: 'python',
    version: '3.11',
    timeoutMs: 5000,
    gradingStrategy: 'exact_match',
    extension: '.py',
  },
  {
    id: 'security_shell',
    displayName: 'Security Shell',
    osFamily: 'Linux',
    language: 'shell',
    version: 'bash 5.1',
    timeoutMs: 10000,
    gradingStrategy: 'json_match',
    extension: '.sh',
  },
  {
    id: 'malware_analysis_shell',
    displayName: 'Malware Analysis Shell',
    osFamily: 'Linux',
    language: 'shell',
    version: 'bash 5.1',
    timeoutMs: 30000,
    gradingStrategy: 'output_contains',
    extension: '.sh',
  },
];

export const sampleAttempts: Attempt[] = [
  {
    id: 'attempt_001',
    lab_id: 'lab_gen_hash',
    profile_id: 'security_shell',
    mode: 'submit',
    code: '#!/bin/bash\nread -r msg\necho "{\\"md5\\": \\"test\\"}"',
    language: 'shell',
    status: 'graded',
    score: 85,
    result_json: JSON.stringify({
      passedTests: 1,
      totalTests: 2,
    }),
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    lab_title: 'Task 1 — Generate Hash (Shell CLI)',
    attemptNumber: 3,
    feedback: 'Good progress! Your MD5 hash is correct, but the SHA256 output format needs adjustment. Make sure to output in lowercase hex.',
    canRetry: true,
  },
  {
    id: 'attempt_002',
    lab_id: 'lab_gen_hash',
    profile_id: 'security_shell',
    mode: 'submit',
    code: '#!/bin/bash\nread -r msg\necho "md5"',
    language: 'shell',
    status: 'graded',
    score: 50,
    result_json: JSON.stringify({
      passedTests: 1,
      totalTests: 2,
    }),
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    lab_title: 'Task 1 — Generate Hash (Shell CLI)',
    attemptNumber: 2,
    feedback: 'Partial credit. Output format is not valid JSON.',
    canRetry: true,
  },
  {
    id: 'attempt_003',
    lab_id: 'lab_openssl_hmac',
    profile_id: 'security_shell',
    mode: 'submit',
    code: '#!/bin/bash\necho "hmac result"',
    language: 'shell',
    status: 'graded',
    score: 100,
    result_json: JSON.stringify({
      passedTests: 2,
      totalTests: 2,
    }),
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    lab_title: 'Task 2 — HMAC via OpenSSL CLI',
    attemptNumber: 1,
    feedback: 'Excellent work! All test cases passed.',
    canRetry: true,
  },
  {
    id: 'attempt_004',
    lab_id: 'lab_avalanche',
    profile_id: 'security_shell',
    mode: 'submit',
    code: '#!/bin/bash\necho "avalanche"',
    language: 'shell',
    status: 'needs_revision',
    score: 70,
    result_json: JSON.stringify({
      passedTests: 1,
      totalTests: 2,
    }),
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    lab_title: 'Task 3 — Avalanche Effect',
    attemptNumber: 2,
    feedback: 'The bit counting logic is incorrect. Review how to compare binary representations of hash outputs.',
    canRetry: true,
  },
  {
    id: 'attempt_005',
    lab_id: 'sum_two_numbers',
    profile_id: 'python_basic',
    mode: 'submit',
    code: 'a = int(input())\nb = int(input())\nprint(a + b)',
    language: 'python',
    status: 'graded',
    score: 100,
    result_json: JSON.stringify({
      passedTests: 3,
      totalTests: 3,
    }),
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
    lab_title: 'Sum Two Numbers',
    attemptNumber: 2,
    feedback: 'Perfect! All test cases passed.',
    canRetry: true,
  },
  {
    id: 'attempt_006',
    lab_id: 'lab_winlocker_analysis',
    profile_id: 'malware_analysis_shell',
    mode: 'submit',
    code: '#!/bin/bash\necho "analysis"',
    language: 'shell',
    status: 'pending',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    lab_title: 'Dynamic Analysis of WinlockerVB6Blacksod',
    attemptNumber: 1,
    canRetry: false,
  },
];

// Backward compatibility alias
export const sampleSubmissions = sampleAttempts;

// Helper to get subject by ID
export function getSubjectById(id: string): Subject | undefined {
  return sampleSubjects.find((s) => s.id === id);
}

// Helper to get faculty by ID
export function getFacultyById(id: string): Faculty | undefined {
  return sampleFaculties.find((f) => f.id === id);
}

// Helper to get lab by ID
export function getLabById(id: string): Lab | undefined {
  return sampleLabs.find((l) => l.id === id);
}

// Helper to get profile by ID
export function getProfileById(id: string): ExecutionProfile | undefined {
  return sampleProfiles.find((p) => p.id === id);
}

// Helper to get attempts by lab ID
export function getAttemptsByLabId(labId: string): Attempt[] {
  return sampleAttempts.filter((a) => a.lab_id === labId);
}

// Backward compatibility alias
export function getSubmissionsByLabId(labId: string): Attempt[] {
  return getAttemptsByLabId(labId);
}

// Helper to get best score for a lab
export function getBestScoreForLab(labId: string): number | undefined {
  const attempts = getAttemptsByLabId(labId);
  const scores = attempts.filter((a) => a.score !== undefined).map((a) => a.score!);
  if (scores.length === 0) return undefined;
  return Math.max(...scores);
}

// Helper to get labs by status
export function getLabsByStatus(status: LabStatus | 'all'): Lab[] {
  if (status === 'all') return sampleLabs;
  return sampleLabs.filter((l) => l.status === status);
}

// Helper to get current in-progress lab (most recently edited)
export function getCurrentLab(): Lab | undefined {
  const inProgress = sampleLabs
    .filter((l) => l.status === 'in_progress' && l.lastEditedAt)
    .sort((a, b) => new Date(b.lastEditedAt!).getTime() - new Date(a.lastEditedAt!).getTime());
  return inProgress[0];
}

// Helper to get labs due soon (within 3 days)
export function getLabsDueSoon(): Lab[] {
  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
  
  return sampleLabs
    .filter((l) => {
      if (!l.dueDate || l.status === 'completed') return false;
      const due = new Date(l.dueDate);
      return due <= threeDaysFromNow && due >= new Date();
    })
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());
}

// Helper to get labs needing attention (failed, needs_revision, overdue)
export function getLabsNeedingAttention(): Lab[] {
  return sampleLabs.filter((l) => 
    l.status === 'needs_revision' || l.status === 'overdue'
  );
}

// Helper to get recent feedback (graded attempts from last 7 days)
export function getRecentFeedback(): Attempt[] {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  return sampleAttempts
    .filter((a) => {
      if (a.status !== 'graded' && a.status !== 'needs_revision') return false;
      return new Date(a.created_at) >= sevenDaysAgo;
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);
}

// Helper to get student stats
export function getStudentStats() {
  const completedLabs = sampleLabs.filter((l) => l.status === 'completed').length;
  const totalLabs = sampleLabs.length;
  const scores = sampleAttempts.filter((a) => a.score !== undefined).map((a) => a.score!);
  const averageScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  const streak = 3; // Mock streak
  
  return {
    completedLabs,
    totalLabs,
    averageScore,
    streak,
  };
}
