import type { Lab, LabSummary, Attempt, Subject, LabStatus } from './types';

// Helper to generate consistent due dates based on lab ID
export function getDueDateForLab(labId: string): string {
  // Hash the labId to a stable offset (e.g. between 2 and 15 days in the future)
  let hash = 0;
  for (let i = 0; i < labId.length; i++) {
    hash = labId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const daysOffset = Math.abs(hash % 10) + 3; // 3 to 12 days in the future
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date.toISOString();
}

export function enrichLabs(
  rawLabs: LabSummary[] | Lab[],
  submissions: Attempt[],
  subjects: Subject[]
): Lab[] {
  const subjectMap = new Map(subjects.map((s) => [s.id, s.title]));

  return rawLabs.map((rawLab) => {
    const attempts = submissions
      .filter((s) => s.lab_id === rawLab.id)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    const attemptsCount = attempts.length;
    const scores = attempts.filter((a) => a.score !== undefined).map((a) => a.score!);
    const bestScore = scores.length > 0 ? Math.max(...scores) : undefined;
    
    // Determine status
    let status: LabStatus = 'not_started';
    const lastAttempt = attempts[attempts.length - 1];
    
    if (attemptsCount > 0) {
      if (bestScore === 100) {
        status = 'completed';
      } else if (lastAttempt.status === 'pending') {
        status = 'submitted';
      } else if (lastAttempt.status === 'needs_revision' || (bestScore !== undefined && bestScore < 100)) {
        status = 'needs_revision';
      } else {
        status = 'in_progress';
      }
    }

    // Progress estimation
    let progress = 0;
    if (status === 'completed') progress = 100;
    else if (status === 'submitted') progress = 100;
    else if (status === 'needs_revision') progress = 80;
    else if (status === 'in_progress') progress = 40;

    const lastEditedAt = lastAttempt ? lastAttempt.created_at : undefined;
    const subjectTitle = subjectMap.get(rawLab.subjectId) || 'General';

    return {
      ...rawLab,
      environmentType: (rawLab as any).environmentType || 'single_runtime',
      statement: (rawLab as any).statement || '',
      subjectTitle,
      dueDate: getDueDateForLab(rawLab.id),
      status,
      progress,
      lastEditedAt,
      attemptsCount,
      bestScore,
      maxScore: 100,
      canResubmit: status !== 'completed' && status !== 'submitted',
    };
  });
}

export function getStudentStats(enrichedLabs: Lab[], submissions: Attempt[]) {
  const completedLabs = enrichedLabs.filter((l) => l.status === 'completed').length;
  const totalLabs = enrichedLabs.length;
  const scores = submissions.filter((a) => a.score !== undefined).map((a) => a.score!);
  const averageScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  
  // Calculate a mock streak based on submissions
  const streak = submissions.length > 0 ? Math.min(5, Math.ceil(submissions.length / 2)) : 0;

  return {
    completedLabs,
    totalLabs,
    averageScore,
    streak,
  };
}
