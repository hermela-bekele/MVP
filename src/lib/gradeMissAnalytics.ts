import type { StudentGradeEntry } from './mockData';

/** Miss rate at or above this % is flagged for teacher action / HoD report. */
export const GRADE_MISS_THRESHOLD = 40;

export const GRADE_MISS_REPORT_MARKER = '[GRADE_MISS_REPORT]';

export type QuestionMissStat = {
  key: string;
  assessmentTitle: string;
  entryType: string;
  subject: string;
  gradeLevel: string;
  section: string;
  questionNumber: number;
  prompt?: string;
  attempted: number;
  missed: number;
  missRate: number;
  /** Short topic label derived from the question prompt */
  topicHint: string;
};

export type GradeMissReportPayload = {
  teacherName: string;
  subject: string;
  gradeLevel: string;
  section: string;
  assessmentTitle: string;
  questions: Array<{
    questionNumber: number;
    prompt?: string;
    missRate: number;
    missed: number;
    attempted: number;
    topicHint: string;
  }>;
  suggestion: string;
};

function topicFromPrompt(prompt?: string, questionNumber?: number): string {
  const raw = (prompt || '').trim();
  if (!raw) return `Question ${questionNumber ?? '?'}`;
  const cleaned = raw.replace(/\s+/g, ' ');
  if (cleaned.length <= 72) return cleaned;
  return `${cleaned.slice(0, 69).trim()}…`;
}

/**
 * Aggregate per-question miss rates across students for the same
 * assessment title + type + class (grade/section/subject).
 */
export function computeQuestionMissStats(
  entries: StudentGradeEntry[],
  opts?: { minAttempts?: number },
): QuestionMissStat[] {
  const minAttempts = opts?.minAttempts ?? 2;
  type Acc = {
    assessmentTitle: string;
    entryType: string;
    subject: string;
    gradeLevel: string;
    section: string;
    questionNumber: number;
    prompt?: string;
    attempted: number;
    missed: number;
  };
  const map = new Map<string, Acc>();

  for (const entry of entries) {
    const results = entry.questionResults;
    if (!results?.length) continue;
    for (const q of results) {
      const key = [
        entry.subject,
        entry.gradeLevel,
        entry.section,
        entry.entryType,
        entry.title,
        String(q.questionNumber),
      ].join('::');
      const cur = map.get(key);
      if (!cur) {
        map.set(key, {
          assessmentTitle: entry.title,
          entryType: entry.entryType,
          subject: entry.subject,
          gradeLevel: entry.gradeLevel,
          section: entry.section,
          questionNumber: q.questionNumber,
          prompt: q.prompt,
          attempted: 1,
          missed: q.correct ? 0 : 1,
        });
      } else {
        cur.attempted += 1;
        if (!q.correct) cur.missed += 1;
        if (!cur.prompt && q.prompt) cur.prompt = q.prompt;
      }
    }
  }

  return [...map.values()]
    .filter((a) => a.attempted >= minAttempts)
    .map((a) => {
      const missRate = a.attempted > 0 ? (a.missed / a.attempted) * 100 : 0;
      return {
        key: [
          a.subject,
          a.gradeLevel,
          a.section,
          a.entryType,
          a.assessmentTitle,
          String(a.questionNumber),
        ].join('::'),
        assessmentTitle: a.assessmentTitle,
        entryType: a.entryType,
        subject: a.subject,
        gradeLevel: a.gradeLevel,
        section: a.section,
        questionNumber: a.questionNumber,
        prompt: a.prompt,
        attempted: a.attempted,
        missed: a.missed,
        missRate: parseFloat(missRate.toFixed(1)),
        topicHint: topicFromPrompt(a.prompt, a.questionNumber),
      };
    })
    .sort((a, b) => b.missRate - a.missRate || b.missed - a.missed);
}

export function highMissQuestions(
  stats: QuestionMissStat[],
  threshold = GRADE_MISS_THRESHOLD,
): QuestionMissStat[] {
  return stats.filter((s) => s.missRate >= threshold);
}

export function buildTeacherSuggestion(stats: QuestionMissStat[]): string {
  const flagged = highMissQuestions(stats);
  if (flagged.length === 0) {
    return 'No high-miss questions yet. Keep marking quizzes question-by-question to unlock class insights.';
  }
  const top = flagged[0];
  const more =
    flagged.length > 1
      ? ` Also watch Q${flagged
          .slice(1, 3)
          .map((q) => q.questionNumber)
          .join(', Q')} on related items.`
      : '';
  return (
    `Most students missed Q${top.questionNumber} on “${top.assessmentTitle}” ` +
    `(${top.missRate}% miss rate — ${top.missed}/${top.attempted}). ` +
    `Re-teach “${top.topicHint}” with a short warm-up, worked example, then a 3-question exit ticket before moving on.` +
    more
  );
}

export function formatGradeMissReport(payload: GradeMissReportPayload): string {
  const lines = [
    GRADE_MISS_REPORT_MARKER,
    `Teacher: ${payload.teacherName}`,
    `Class: ${payload.gradeLevel} ${payload.section} · ${payload.subject}`,
    `Assessment: ${payload.assessmentTitle}`,
    `Suggestion: ${payload.suggestion}`,
    'High-miss questions:',
    ...payload.questions.map(
      (q) =>
        `- Q${q.questionNumber} (${q.missRate}% miss, ${q.missed}/${q.attempted}): ${q.topicHint}`,
    ),
    '',
    'Please generate a focused teacher training module on the weakest topic above.',
  ];
  return lines.join('\n');
}

export function isGradeMissReport(body: string): boolean {
  return body.trimStart().startsWith(GRADE_MISS_REPORT_MARKER);
}

export function extractTopicFromMissReport(body: string): string | null {
  if (!isGradeMissReport(body)) return null;
  const qLine = body
    .split('\n')
    .find((l) => l.trim().startsWith('- Q'));
  if (!qLine) return null;
  const afterColon = qLine.includes(':') ? qLine.split(':').slice(1).join(':').trim() : '';
  return afterColon || null;
}

export function extractClassFromMissReport(body: string): {
  grade?: string;
  subject?: string;
  assessmentTitle?: string;
} {
  if (!isGradeMissReport(body)) return {};
  const classLine = body.split('\n').find((l) => l.startsWith('Class:'));
  const assessLine = body.split('\n').find((l) => l.startsWith('Assessment:'));
  let grade: string | undefined;
  let subject: string | undefined;
  if (classLine) {
    const rest = classLine.replace(/^Class:\s*/, '');
    const parts = rest.split('·').map((p) => p.trim());
    if (parts[0]) grade = parts[0];
    if (parts[1]) subject = parts[1];
  }
  return {
    grade,
    subject,
    assessmentTitle: assessLine?.replace(/^Assessment:\s*/, '').trim(),
  };
}
