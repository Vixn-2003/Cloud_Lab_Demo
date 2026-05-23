// Sample data for development/demo mode when API is not available
import type { Faculty, Subject, Lab, SubmissionRecord, ExecutionProfile } from './types';

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
`,
    profileId: 'security_shell',
    environmentType: 'single_machine',
    toolset: ['openssl', 'python3', 'bash'],
  },
  {
    id: 'lab_openssl_hmac',
    title: 'Task 2 — HMAC via OpenSSL CLI',
    statement: `# Task 2 — HMAC via OpenSSL CLI

Implement HMAC authentication using OpenSSL command line tools.

## Requirements
Generate HMAC-SHA256 for a given message and key.

## Tools Available
- openssl
- bash
`,
    profileId: 'security_shell',
    environmentType: 'single_machine',
    toolset: ['openssl', 'bash'],
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
`,
    profileId: 'security_shell',
    environmentType: 'single_machine',
    toolset: ['openssl', 'python3', 'bash'],
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
  },
  {
    id: 'lab_winlocker_analysis',
    title: 'Dynamic Analysis of WinlockerVB6Blacksod',
    statement: `# Dynamic Analysis of Ransomware

Perform dynamic analysis on a ransomware sample in a controlled environment.

## Safety Notice
All analysis is performed in an isolated sandbox environment.

## Tools Available
- wine (Windows emulation)
- tcpdump (network capture)
- strace (system call tracing)
- bash scripting
`,
    profileId: 'malware_analysis_shell',
    environmentType: 'single_runtime',
    toolset: ['wine', 'tcpdump', 'strace', 'bash'],
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

export const sampleSubmissions: SubmissionRecord[] = [
  {
    id: 'sub_001',
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
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    lab_title: 'Task 1 — Generate Hash (Shell CLI)',
  },
  {
    id: 'sub_002',
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
  },
  {
    id: 'sub_003',
    lab_id: 'lab_avalanche',
    profile_id: 'security_shell',
    mode: 'submit',
    code: '#!/bin/bash\necho "avalanche"',
    language: 'shell',
    status: 'graded',
    score: 70,
    result_json: JSON.stringify({
      passedTests: 1,
      totalTests: 2,
    }),
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    lab_title: 'Task 3 — Avalanche Effect',
  },
  {
    id: 'sub_004',
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
  },
  {
    id: 'sub_005',
    lab_id: 'lab_winlocker_analysis',
    profile_id: 'malware_analysis_shell',
    mode: 'submit',
    code: '#!/bin/bash\necho "analysis"',
    language: 'shell',
    status: 'failed',
    score: 0,
    result_json: JSON.stringify({
      passedTests: 0,
      totalTests: 2,
    }),
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    lab_title: 'Dynamic Analysis of WinlockerVB6Blacksod',
  },
];

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

// Helper to get submissions by lab ID
export function getSubmissionsByLabId(labId: string): SubmissionRecord[] {
  return sampleSubmissions.filter((s) => s.lab_id === labId);
}

// Helper to get best score for a lab
export function getBestScoreForLab(labId: string): number | undefined {
  const submissions = getSubmissionsByLabId(labId);
  if (submissions.length === 0) return undefined;
  return Math.max(...submissions.map((s) => s.score || 0));
}
