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

/** Distinct assessments the teacher already recorded results for (prefers question-level). */
export function listAssessmentsWithQuestionResults(entries: StudentGradeEntry[]): Array<{
  key: string;
  assessmentId?: string;
  title: string;
  entryType: string;
  subject: string;
  studentCount: number;
  hasQuestionResults: boolean;
}> {
  const map = new Map<
    string,
    {
      assessmentId?: string;
      title: string;
      entryType: string;
      subject: string;
      students: Set<string>;
      hasQuestionResults: boolean;
    }
  >();
  for (const e of entries) {
    const hasQr = !!e.questionResults?.length;
    // Include any recorded result that is linked to an assessment, or has per-question marks
    if (!hasQr && !e.assessmentId) continue;
    const key = e.assessmentId
      ? `id:${e.assessmentId}`
      : `title:${e.entryType}::${e.title}`;
    const cur = map.get(key);
    if (!cur) {
      map.set(key, {
        assessmentId: e.assessmentId,
        title: e.title,
        entryType: e.entryType,
        subject: e.subject,
        students: new Set([e.studentId]),
        hasQuestionResults: hasQr,
      });
    } else {
      cur.students.add(e.studentId);
      if (!cur.assessmentId && e.assessmentId) cur.assessmentId = e.assessmentId;
      if (hasQr) cur.hasQuestionResults = true;
    }
  }
  return [...map.entries()]
    .map(([key, v]) => ({
      key,
      assessmentId: v.assessmentId,
      title: v.title,
      entryType: v.entryType,
      subject: v.subject,
      studentCount: v.students.size,
      hasQuestionResults: v.hasQuestionResults,
    }))
    .sort((a, b) => {
      if (a.hasQuestionResults !== b.hasQuestionResults) {
        return a.hasQuestionResults ? -1 : 1;
      }
      return a.title.localeCompare(b.title);
    });
}

export function filterEntriesForAssessment(
  entries: StudentGradeEntry[],
  selection: { assessmentId?: string; title: string; entryType: string },
): StudentGradeEntry[] {
  return entries.filter((e) => {
    if (selection.assessmentId) {
      return e.assessmentId === selection.assessmentId || e.title === selection.title;
    }
    return e.entryType === selection.entryType && e.title === selection.title;
  });
}

/** Overall correct vs missed answers for pie chart. */
export function buildAnswerPieData(entries: StudentGradeEntry[]): Array<{
  name: string;
  value: number;
  fill: string;
}> {
  let correct = 0;
  let missed = 0;
  for (const e of entries) {
    for (const q of e.questionResults ?? []) {
      if (q.correct) correct += 1;
      else missed += 1;
    }
  }
  return [
    { name: 'Correct', value: correct, fill: 'hsl(152 45% 36%)' },
    { name: 'Missed', value: missed, fill: 'hsl(25 85% 48%)' },
  ].filter((d) => d.value > 0);
}

const PIE_COLORS = [
  'hsl(25 85% 48%)',
  'hsl(12 70% 42%)',
  'hsl(38 80% 45%)',
  'hsl(152 40% 32%)',
  'hsl(200 45% 38%)',
  'hsl(220 25% 42%)',
  'hsl(340 45% 42%)',
  'hsl(80 35% 38%)',
];

/** Pie slices: one per question, value = students who missed it. */
export function buildMissByQuestionPieData(
  stats: QuestionMissStat[],
): Array<{ name: string; value: number; fill: string; questionNumber: number; topic: string }> {
  return stats
    .filter((s) => s.missed > 0)
    .sort((a, b) => b.missed - a.missed || b.missRate - a.missRate)
    .map((s, i) => ({
      name: `Q${s.questionNumber}`,
      value: s.missed,
      fill: PIE_COLORS[i % PIE_COLORS.length],
      questionNumber: s.questionNumber,
      topic: s.topicHint,
    }));
}

export type AssessmentQuestionDetail = {
  questionNumber: number;
  /** Full (or truncated) question text from the assessment */
  questionText: string;
  /** Curriculum / skill topic for teaching */
  topic: string;
  answer?: string;
  options?: string[];
};

/**
 * Pull question text + topic from a linked assessment (structured bank or generated markdown blob).
 */
export function extractAssessmentQuestionDetails(
  assessment?: {
    questions?: {
      id: number;
      question: string;
      type?: string;
      answer?: string;
      options?: string[];
    }[];
  } | null,
): Map<number, AssessmentQuestionDetail> {
  const map = new Map<number, AssessmentQuestionDetail>();
  if (!assessment?.questions?.length) return map;

  const qs = assessment.questions;
  const isBlob =
    qs.length === 1 &&
    (qs[0].answer === 'See assessment content' || (qs[0].question?.length ?? 0) > 800);

  if (isBlob) {
    const content = qs[0].question || '';
    // Q1: / Question 1: / **Question 1** / 1. patterns
    const blocks = content.split(
      /(?=(?:^|\n)\s*(?:\*{0,2}(?:Question|Q)\s*\d+\*{0,2}\s*[:.)]|^\s*\d+\s*[.)]\s))/gim,
    );
    for (const block of blocks) {
      const qMatch = block.match(
        /^\s*(?:\*{0,2}(?:Question|Q)\s*(\d+)\*{0,2}\s*[:.)]|\s*(\d+)\s*[.)])\s*([\s\S]*)$/i,
      );
      if (!qMatch) continue;
      const n = parseInt(qMatch[1] || qMatch[2], 10);
      if (!Number.isFinite(n)) continue;
      let body = (qMatch[3] || '').trim();
      const beforeIdx = content.search(
        new RegExp(`(?:^|\\n)\\s*(?:\\*{0,2}(?:Question|Q)\\s*${n}\\*{0,2}\\s*[:.)]|\\s*${n}\\s*[.)])`, 'i'),
      );
      const before = beforeIdx > 0 ? content.slice(Math.max(0, beforeIdx - 280), beforeIdx) : '';
      const skill =
        before.match(/\*\*Skill Area:\*\*\s*([^\n*]+)/i)?.[1]?.trim() ||
        before.match(/Skill Area:\s*([^\n*]+)/i)?.[1]?.trim() ||
        before.match(/\*\*Topic:\*\*\s*([^\n*]+)/i)?.[1]?.trim() ||
        body.match(/\*\*Skill Area:\*\*\s*([^\n*]+)/i)?.[1]?.trim();

      const answerMatch = body.match(/\*\*Answer[:\s]*\*\*\s*([^\n]+)/i) || body.match(/Answer:\s*([^\n]+)/i);
      const answer = answerMatch?.[1]?.trim();

      body = body
        .replace(/\*\*Answer[\s\S]*$/i, '')
        .replace(/(?:^|\n)\s*(?:\*{0,2}(?:Question|Q)\s*\d+)/i, (m, offset) =>
          offset > 40 ? '' : m,
        )
        .trim()
        .slice(0, 900);

      // Strip trailing next-question headers if still present
      body = body
        .split(/(?=(?:^|\n)\s*(?:\*{0,2}(?:Question|Q)\s*\d+|\d+\s*[.)]))/i)[0]
        .trim()
        .slice(0, 900);

      const topic = skill || inferTopicLabel(body, n);

      map.set(n, {
        questionNumber: n,
        questionText: body || `Question ${n} from ${assessment ? 'linked assessment' : 'assessment'}`,
        topic,
        answer,
      });
    }

    // If no markers found but we have miss numbers later, keep full blob keyed as 0 for fallback
    if (map.size === 0 && content.trim()) {
      map.set(0, {
        questionNumber: 0,
        questionText: content.slice(0, 4000),
        topic: 'Assessment content',
      });
    }
    return map;
  }

  qs.forEach((q, i) => {
    const n = q.id || i + 1;
    const text = (q.question || '').trim().slice(0, 900);
    const optionLine =
      q.options && q.options.length
        ? `\nOptions: ${q.options.map((o, idx) => `${String.fromCharCode(65 + idx)}) ${o}`).join('; ')}`
        : '';
    map.set(n, {
      questionNumber: n,
      questionText: (text + optionLine).trim() || `Question ${n}`,
      topic: inferTopicLabel(text, n),
      answer: q.answer,
      options: q.options,
    });
  });
  return map;
}

function inferTopicLabel(text: string, questionNumber: number): string {
  const raw = (text || '').trim();
  if (!raw) return `Question ${questionNumber}`;
  // Prefer a short noun-phrase style topic: first clause / sentence
  const cleaned = raw
    .replace(/^Q\d+\s*:\s*/i, '')
    .replace(/\s+/g, ' ')
    .replace(/[*_`#]/g, '')
    .trim();
  // If it looks like a full question, take a compact topic cue from keywords
  const topicCue = cleaned.match(
    /(?:about|on|of|regarding|involving)\s+([A-Za-z0-9\u1200-\u137F][\w\s\u1200-\u137F-]{2,48})/i,
  );
  if (topicCue?.[1]) return topicCue[1].trim();
  if (cleaned.length <= 72) return cleaned;
  // First ~10 words as topic label
  const words = cleaned.split(/\s+/).slice(0, 10).join(' ');
  return words.length < cleaned.length ? `${words}…` : words;
}

/** Enrich topic hints from the linked assessment question bank when prompts are thin. */
export function enrichMissStatsFromAssessment<
  T extends { questionNumber: number; prompt?: string; topicHint: string },
>(
  stats: T[],
  assessment?: {
    questions?: { id: number; question: string; type?: string; answer?: string }[];
  } | null,
): T[] {
  const details = extractAssessmentQuestionDetails(assessment);
  if (details.size === 0) return stats;
  return stats.map((s) => {
    const d = details.get(s.questionNumber);
    if (!d) return s;
    return {
      ...s,
      prompt: d.questionText || s.prompt,
      topicHint: d.topic || s.topicHint,
    };
  });
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
