import { NextResponse } from 'next/server';
import { fetchPrimeAI } from '@/lib/primeAiServer';
import { createCacheKey, getCachedData, setCachedData } from '@/lib/persistentCache';

export type GapMissedQuestion = {
  questionNumber: number;
  topic: string;
  missRate: number;
  missed: number;
  attempted: number;
  questionText?: string;
  prompt?: string;
  answer?: string;
  options?: string[];
};

export type GapAnalysisBody = {
  assessmentTitle: string;
  subject?: string;
  grade?: string;
  section?: string;
  missedQuestions: GapMissedQuestion[];
  bookTitles?: string[];
  bookContext?: string;
  /** Full linked assessment bank — used when per-question text is thin */
  linkedQuestions?: {
    id: number;
    question: string;
    type?: string;
    answer?: string;
    options?: string[];
  }[];
};

function questionBody(q: GapMissedQuestion): string {
  const parts = [
    (q.questionText || q.prompt || '').trim(),
    q.options?.length
      ? `Options: ${q.options.map((o, i) => `${String.fromCharCode(65 + i)}) ${o}`).join('; ')}`
      : '',
    q.answer && q.answer !== 'See assessment content' ? `Expected answer: ${q.answer}` : '',
  ].filter(Boolean);
  return parts.join('\n').trim();
}

function resolveQuestionText(
  q: GapMissedQuestion,
  linked?: GapAnalysisBody['linkedQuestions'],
): string {
  const direct = questionBody(q);
  if (direct.length > 20 && !/^Question\s+\d+$/i.test(direct)) return direct;

  if (linked?.length) {
    const match =
      linked.find((lq) => lq.id === q.questionNumber) ||
      linked[q.questionNumber - 1];
    if (match?.question?.trim()) {
      const opts =
        match.options?.length
          ? `\nOptions: ${match.options
              .map((o, i) => `${String.fromCharCode(65 + i)}) ${o}`)
              .join('; ')}`
          : '';
      const ans =
        match.answer && match.answer !== 'See assessment content'
          ? `\nExpected answer: ${match.answer}`
          : '';
      // Blob: try to pull Qn from content
      if (match.question.length > 800 || match.answer === 'See assessment content') {
        const re = new RegExp(
          `(?:^|\\n)\\s*(?:\\*{0,2}(?:Question|Q)\\s*${q.questionNumber}\\*{0,2}\\s*[:.)]|${q.questionNumber}\\s*[.)])\\s*([\\s\\S]*?)(?=(?:\\n\\s*(?:\\*{0,2}(?:Question|Q)\\s*\\d+|\\d+\\s*[.)]))|$)`,
          'i',
        );
        const m = match.question.match(re);
        if (m?.[1]?.trim()) {
          return m[1]
            .replace(/\*\*Answer[\s\S]*$/i, '')
            .trim()
            .slice(0, 900);
        }
        // Fall back: topic-focused excerpt from the full assessment text
        return (
          `Assessment item Q${q.questionNumber} on “${q.topic}”. ` +
          `Use this excerpt from the linked assessment to identify the exact item:\n` +
          match.question.slice(0, 2500)
        );
      }
      return `${match.question.trim()}${opts}${ans}`.slice(0, 1200);
    }
  }

  return (
    `Assessment item Q${q.questionNumber} covering the topic “${q.topic || 'this skill'}”. ` +
    `Reconstruct a typical exam-style question for this topic at the stated grade, then explain and teach it. ` +
    `Do NOT say the question text is unavailable.`
  );
}

function gapCachePayload(body: GapAnalysisBody) {
  const misses = [...(body.missedQuestions || [])]
    .map((q) => ({
      n: q.questionNumber,
      missed: q.missed,
      attempted: q.attempted,
      topic: (q.topic || '').trim().toLowerCase(),
      hasText: Boolean((q.questionText || q.prompt || '').trim().length > 20),
    }))
    .sort((a, b) => a.n - b.n);
  return {
    v: 2,
    assessmentTitle: String(body.assessmentTitle || '').trim().toLowerCase(),
    subject: String(body.subject || '').trim().toLowerCase(),
    grade: String(body.grade || '').trim().toLowerCase(),
    section: String(body.section || '').trim().toLowerCase(),
    linkedCount: body.linkedQuestions?.length ?? 0,
    misses,
  };
}

function fallbackAnalysis(body: GapAnalysisBody) {
  const top = [...body.missedQuestions].sort(
    (a, b) => b.missed - a.missed || b.missRate - a.missRate,
  )[0];
  const books =
    body.bookTitles && body.bookTitles.length > 0
      ? body.bookTitles.slice(0, 3).join('; ')
      : `the ${body.grade || ''} ${body.subject || 'subject'} textbook`.replace(/\s+/g, ' ').trim();
  const bookNote = body.bookContext?.trim()
    ? `\n\n### Textbook / resource notes\n${body.bookContext.trim()}`
    : '';

  const parts: string[] = [];
  for (const q of body.missedQuestions.slice(0, 3)) {
    const text = resolveQuestionText(q, body.linkedQuestions);
    const topic =
      q.topic && !/^Question\s+\d+$/i.test(q.topic)
        ? q.topic
        : text.slice(0, 80) || `Q${q.questionNumber}`;
    parts.push(
      [
        `## Q${q.questionNumber} — ${topic}`,
        `**Missed by** ${q.missed} of ${q.attempted} students (${q.missRate}%).`,
        '',
        '### The question',
        text.slice(0, 500),
        '',
        '### Topic explanation',
        `“${topic}” is a core idea in ${body.subject || 'this subject'} for ${body.grade || 'this grade'}. Students need the definition, when to apply it, and one clear worked pattern before they can answer exam-style items. Use **${books}** for the official wording, examples, and practice sets tied to this skill.`,
        '',
        '### How to answer this question',
        '1. Underline what is asked (find, simplify, compare, explain).',
        '2. Recall the rule or formula for this topic.',
        '3. Show one neat intermediate step, then the final answer with units/label if needed.',
        '',
        `### How to teach “${topic}”`,
        `1. Open with a short real-life hook tied to ${topic}.`,
        `2. Model one worked example from ${books} (I do).`,
        '3. Co-solve a parallel item (We do).',
        '4. Give a 2-question exit ticket on the same skill (You do).',
      ].join('\n'),
    );
  }

  if (!parts.length && top) {
    parts.push(`Focus re-teaching on Q${top.questionNumber} (${top.topic}).`);
  }

  return {
    analysis: `${parts.join('\n\n---\n\n')}${bookNote}`,
    topics: [...new Set(body.missedQuestions.map((q) => q.topic).filter(Boolean))],
    focusTopic: top?.topic,
    source: 'fallback' as const,
  };
}

export async function runGapAnalysis(body: GapAnalysisBody) {
  const title = String(body.assessmentTitle || '').trim();
  const missed = Array.isArray(body.missedQuestions) ? body.missedQuestions : [];
  if (!title) {
    return NextResponse.json({ error: 'assessmentTitle is required' }, { status: 400 });
  }
  if (missed.length === 0) {
    return NextResponse.json(
      { error: 'No missed questions to analyze for this assessment' },
      { status: 400 },
    );
  }

  const cacheKey = createCacheKey('gap-analysis-v2', gapCachePayload(body));
  const cached = await getCachedData(cacheKey);
  if (cached?.data) {
    return NextResponse.json({
      ...cached.data,
      cached: true,
      cacheAge: Math.floor((Date.now() - cached.timestamp) / 1000 / 60),
    });
  }

  const subject = body.subject?.trim() || 'Subject';
  const grade = body.grade?.trim() || '';
  const section = body.section?.trim() || '';
  const books = (body.bookTitles || []).filter(Boolean);
  const bookContext = body.bookContext?.trim() || '';

  const sorted = [...missed].sort(
    (a, b) => b.missed - a.missed || b.missRate - a.missRate,
  );

  const missLines = sorted
    .slice(0, 5)
    .map((q) => {
      const text = resolveQuestionText(q, body.linkedQuestions);
      return [
        `### Q${q.questionNumber} — TOPIC: ${q.topic}`,
        `Miss count: ${q.missed} students (${q.missRate}% of ${q.attempted})`,
        `FULL QUESTION FROM LINKED ASSESSMENT:`,
        text,
      ].join('\n');
    })
    .join('\n\n---\n\n');

  const query = [
    `You are an expert ${subject} teacher and instructional coach for Ethiopian secondary schools.`,
    `A class took this assessment. Students missed specific questions. A linked assessment question bank is provided — use it.`,
    `Assessment: ${title}`,
    grade ? `Grade: ${grade}${section ? ` · Section ${section}` : ''}` : '',
    `Subject: ${subject}`,
    '',
    'CRITICAL RULES:',
    '- NEVER say "question text is unavailable", "not provided", or similar.',
    '- For each missed item, QUOTE or clearly restate the actual question (from the bank below).',
    '- Explain what the question is asking, then teach the underlying topic so the teacher can reteach it.',
    '- Use the real topic name — not generic labels like "Question 2".',
    '',
    'MISSED ITEMS (with question text traced from the linked assessment):',
    missLines,
    '',
    books.length
      ? `Textbooks / curriculum resources you MUST cite by name when explaining the topic:\n${books.map((b) => `- ${b}`).join('\n')}`
      : 'Cite the MOE textbook for this grade/subject by name if you know it; otherwise say “the grade textbook”.',
    bookContext
      ? `Extra resource context (titles, links, categories) — weave into the topic explanation:\n${bookContext}`
      : '',
    '',
    'OUTPUT FORMAT — Markdown. For each of the top 2–3 most-missed questions:',
    '',
    '## Qn — <topic name>',
    '**Missed by** X of Y students (Z%).',
    '',
    '### The question',
    'Quote/restate the full question (and options if MCQ). One short line on what it tests.',
    '',
    '### Topic explanation',
    '5–8 sentences: what the concept is, why it matters at this grade, key definition/rule, textbook citation, common misconceptions that cause this miss.',
    '',
    '### How to answer this question',
    '3–5 numbered steps walking through the solution approach for THIS specific item.',
    '',
    '### How to teach this topic',
    '3–5 practical classroom steps (hook → model → guided practice → check), citing the book when useful.',
    '',
    'MATH / FORMULAS:',
    '- Use clean KaTeX: inline $a^2+b^2$, display $$\\frac{a}{b}$$.',
    '- Never write double-escaped commands (\\\\frac). Never leave raw \\frac outside $...$.',
    '- Prefer plain readable math when a formula is not needed (e.g. “f(x) = 2x + 1”).',
    '',
    'The topic explanation must be richer than the teaching tips. Do not skip “The question”.',
  ]
    .filter(Boolean)
    .join('\n');

  let result: Record<string, unknown> | null = null;

  try {
    const response = await fetchPrimeAI('/chat', { query, history: [] });
    if (response.ok) {
      const aiResult = (await response.json()) as Record<string, unknown>;
      const text =
        (typeof aiResult.response === 'string' && aiResult.response) ||
        (typeof aiResult.answer === 'string' && aiResult.answer) ||
        (typeof aiResult.message === 'string' && aiResult.message) ||
        (typeof aiResult.content === 'string' && aiResult.content) ||
        '';
      if (text.trim().length > 80) {
        const topics = [...new Set(sorted.map((q) => q.topic).filter(Boolean))];
        result = {
          analysis: text.trim(),
          topics,
          focusTopic: topics[0] || sorted[0]?.topic,
          source: 'ai',
        };
      }
    }
  } catch {
    /* fall through */
  }

  if (!result) {
    result = fallbackAnalysis(body);
  }

  await setCachedData(cacheKey, result);
  return NextResponse.json({ ...result, cached: false });
}
