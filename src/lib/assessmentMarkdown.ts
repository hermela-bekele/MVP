import { normalizeMarkdownMath } from '@/lib/markdownMath';

/** True when the assessment is one AI-generated markdown document. */
export function isGeneratedAssessmentBlob(questions: {
  answer: string;
  question: string;
}[]): boolean {
  return (
    questions.length === 1 &&
    questions[0].answer === 'See assessment content' &&
    questions[0].question.trim().length > 0
  );
}

/**
 * AI often returns Q1…Qn jammed on one line. Force each marker onto its own block.
 */
export function separateJammedAssessmentBlocks(content: string): string {
  let s = (content || '').replace(/\r\n/g, '\n');

  // Drop noisy batch intros
  s = s.replace(
    /(?:^|\n)\s*Here are the \d+ questions[^\n.:]*[.:]?\s*/gi,
    '\n',
  );

  // New paragraph before Qn / Question n when stuck mid-line
  s = s.replace(
    /([^\n])\s+(Q(?:uestion)?\s*\d+)\s*([:.)\-])/gi,
    '$1\n\n$2$3',
  );

  // New line before A) B) C) D) options jammed after text
  s = s.replace(/([^\n])\s+([A-D]\))\s+/g, '$1\n$2 ');

  // New line before answer/explanation markers (keep ✓ on the same line)
  s = s.replace(
    /([^\n])\s+(✓\s*(?:Correct|Expected|Marking|Sample|Explanation)\b[^\n]*)/gi,
    '$1\n$2',
  );
  s = s.replace(
    /([^\n✓])\s+((?:Correct(?:\s+Answer|\s+Matches)?|Explanation|Marking Guide)\s*:)/gi,
    '$1\n$2',
  );
  // If two ✓ markers share a line, split them
  s = s.replace(/(✓[^\n]*?)\s+(✓\s*)/g, '$1\n$2');

  // Matching columns often jammed
  s = s.replace(/([^\n])\s+(Column\s+[AB]\s*:)/gi, '$1\n$2');

  // Force a blank line before every question marker
  s = s.replace(/\n?(Q(?:uestion)?\s*\d+\s*[:.)\-])/gi, '\n\n$1');

  // Collapse excessive blank lines
  return s.replace(/\n{3,}/g, '\n\n').trim();
}

/**
 * Lay out consecutive A)–D) choices as a 2-column markdown table (two per row).
 */
export function formatChoicesTwoPerRow(content: string): string {
  const lines = content.split('\n');
  const out: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i] ?? '';
    if (/^\s*[A-D]\)\s+\S/.test(line)) {
      const opts: string[] = [];
      while (i < lines.length && /^\s*[A-D]\)\s+/.test(lines[i] ?? '')) {
        opts.push((lines[i] ?? '').trim().replace(/\|/g, '\\|'));
        i += 1;
      }
      if (opts.length >= 2) {
        out.push('');
        for (let j = 0; j < opts.length; j += 2) {
          const left = opts[j];
          const right = opts[j + 1] ?? '';
          out.push(`| ${left} | ${right} |`);
          if (j === 0) out.push('| :--- | :--- |');
        }
        out.push('');
      } else {
        out.push(...opts);
      }
      continue;
    }
    out.push(line);
    i += 1;
  }

  return out.join('\n').replace(/\n{3,}/g, '\n\n');
}

/**
 * Turn a "Column A: 1) ... 2) ... / Column B: A) ... B) ..." matching block into a
 * genuine two-column markdown table, so it renders side by side instead of as two
 * separate lists that fall through to plain paragraphs.
 */
export function formatMatchingColumnsAsTable(content: string): string {
  const lines = content.split('\n');
  const out: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i] ?? '';
    if (/^\s*\*{0,2}Column\s+A\s*:?\*{0,2}\s*$/i.test(line)) {
      const startIndex = i;
      i += 1;
      const left: string[] = [];
      while (i < lines.length && /^\s*\d{1,2}\)\s+\S/.test(lines[i] ?? '')) {
        left.push(
          (lines[i] ?? '')
            .trim()
            .replace(/^\d{1,2}\)\s*/, '')
            .replace(/\|/g, '\\|'),
        );
        i += 1;
      }
      let lookahead = i;
      while (lookahead < lines.length && !(lines[lookahead] ?? '').trim()) lookahead += 1;

      if (left.length > 0 && /^\s*\*{0,2}Column\s+B\s*:?\*{0,2}\s*$/i.test(lines[lookahead] ?? '')) {
        i = lookahead + 1;
        const right: string[] = [];
        while (i < lines.length && /^\s*[A-D]\)\s+\S/.test(lines[i] ?? '')) {
          right.push((lines[i] ?? '').trim().replace(/\|/g, '\\|'));
          i += 1;
        }
        out.push('');
        out.push('| Column A | Column B |');
        out.push('| :--- | :--- |');
        const rows = Math.max(left.length, right.length);
        for (let r = 0; r < rows; r += 1) {
          out.push(`| ${r + 1}) ${left[r] ?? ''} | ${right[r] ?? ''} |`);
        }
        out.push('');
        continue;
      }

      // Not a well-formed Column A/B pair — leave the original lines untouched.
      i = startIndex;
      out.push(line);
      i += 1;
      continue;
    }
    out.push(line);
    i += 1;
  }

  return out.join('\n').replace(/\n{3,}/g, '\n\n');
}

/** Unique question numbers found as Q1 / Question 1 markers. */
export function extractQuestionNumbers(content: string): number[] {
  const separated = separateJammedAssessmentBlocks(content);
  const ids: number[] = [];
  const seen = new Set<number>();
  const re = /(?:^|\n)\s*(?:#{1,3}\s*)?(?:Q(?:uestion)?\s*)(\d+)\s*[:.)\-]/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(separated)) !== null) {
    const n = parseInt(m[1], 10);
    if (!Number.isFinite(n) || seen.has(n)) continue;
    seen.add(n);
    ids.push(n);
  }
  return ids;
}

/** Count questions in an AI assessment markdown blob. */
export function countQuestionsInAssessmentMarkdown(content: string): number {
  const ids = extractQuestionNumbers(content);
  if (ids.length > 0) return ids.length;

  const meta = content.match(/Number of questions:\s*\*?\*?(\d+)/i);
  if (meta) return Math.max(1, parseInt(meta[1], 10));

  const numbered = separateJammedAssessmentBlocks(content).match(
    /(?:^|\n)\s*\d{1,2}[.)]\s+\S+/g,
  );
  if (numbered && numbered.length >= 3) return numbered.length;
  return 10;
}

/** Extract short prompts for gradebook marking. */
export function extractAssessmentQuestionPrompts(
  content: string,
  count: number,
): string[] {
  const separated = separateJammedAssessmentBlocks(content);
  const prompts: string[] = [];
  const re =
    /(?:^|\n)\s*(?:#{1,3}\s*)?(Q(?:uestion)?\s*\d+)\s*[:.)\-]\s*([^\n]*)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(separated)) !== null && prompts.length < count) {
    const label = m[1].replace(/\s+/g, '');
    const text = (m[2] || '').trim().slice(0, 140);
    prompts.push(text ? `${label}: ${text}` : label);
  }
  if (prompts.length >= Math.min(3, count)) return prompts.slice(0, count);

  const numRe = /(?:^|\n)\s*(\d{1,2})[.)]\s+([^\n]+)/g;
  const fromNumbers: string[] = [];
  while ((m = numRe.exec(separated)) !== null && fromNumbers.length < count) {
    fromNumbers.push(`Q${m[1]}: ${m[2].trim().slice(0, 140)}`);
  }
  return fromNumbers.length ? fromNumbers : prompts;
}

/**
 * Normalize AI assessment markdown for remark-math / KaTeX and clearer structure.
 */
export function preprocessAssessmentMarkdown(content: string): string {
  let s = separateJammedAssessmentBlocks(content || '');

  // Promote section / format category headings
  s = s
    .replace(
      /^(#{0,3}\s*)?(Section\s+[ABC]\s*:[^\n]*)/gim,
      (_m, _h, title: string) => `### ${title.trim()}`,
    )
    .replace(
      /^(#{0,3}\s*)?(For\s+(?:MULTIPLE CHOICE|TRUE\/FALSE|FILL IN THE BLANK|MATCHING|WRITING)\s*:?[^\n]*)/gim,
      (_m, _h, title: string) => `### ${title.trim()}`,
    )
    .replace(
      /^(#{0,3}\s*)?(\*\*)?(ANSWER KEY|Marking Guide|Combined note)(\*\*)?\s*$/gim,
      '## $2',
    );

  // Promote Q1: / Question 1: lines to bold-led paragraphs for scanability
  s = s.replace(
    /^(#{0,3}\s*)?(Q(?:uestion)?\s*\d+)\s*[:.)\-]\s*(.*)$/gim,
    (_m, _h, q: string, rest: string) => `\n\n**${q.trim()}:** ${rest.trim()}\n`,
  );

  // Matching Column A / Column B blocks become a real two-column table first, so
  // their A)-D) match markers aren't swept up by the generic MCQ two-per-row pass.
  s = formatMatchingColumnsAsTable(s);

  // Two choices per row for MCQ / True-False options
  s = formatChoicesTwoPerRow(s);

  // Meta labels
  s = s
    .replace(/\*\*Skill Area:\s*/gi, '**Skill Area:** ')
    .replace(/\*\*Assessment type:\s*/gi, '**Assessment type:** ')
    .replace(/\*\*Question format:\s*/gi, '**Question format:** ')
    .replace(/^\* /gm, '- ');

  // Keep $$ blocks intact while normalizing other math
  const lines = s.split('\n');
  const merged: string[] = [];
  let inDisplayMath = false;
  let mathLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    if (!inDisplayMath && trimmed === '$$') {
      inDisplayMath = true;
      mathLines = ['$$'];
      continue;
    }

    if (inDisplayMath) {
      mathLines.push(line);
      if (trimmed === '$$' && mathLines.length > 1) {
        merged.push(mathLines.join('\n'));
        inDisplayMath = false;
        mathLines = [];
      }
      continue;
    }

    merged.push(line);
  }

  if (mathLines.length) {
    merged.push(mathLines.join('\n'));
  }

  return normalizeMarkdownMath(merged.join('\n').replace(/\n{3,}/g, '\n\n').trim());
}

/** Wrap generated body with type/format metadata for display + grading. */
export function wrapAssessmentMarkdown(opts: {
  body: string;
  assessmentType: string;
  questionFormat: string;
  numQuestions: number;
  topic: string;
  grade?: string;
  subject?: string;
}): string {
  const body = separateJammedAssessmentBlocks(opts.body.trim());
  const detected = countQuestionsInAssessmentMarkdown(body);
  const questionCount = Math.max(opts.numQuestions, detected);

  if (/Assessment type:/i.test(body) || /Question format:/i.test(body)) {
    return body.replace(
      /(\*\*)?Number of questions:(\*\*)?\s*\d+/i,
      `**Number of questions:** ${questionCount}`,
    );
  }

  const scope =
    opts.grade || opts.subject
      ? `**Scope:** ${[opts.grade, opts.subject].filter(Boolean).join(' · ')}`
      : '';

  return [
    `# ${opts.assessmentType}: ${opts.topic}`,
    '',
    `**Assessment type:** ${opts.assessmentType}`,
    `**Question format:** ${opts.questionFormat}`,
    `**Number of questions:** ${questionCount}`,
    scope,
    '',
    '---',
    '',
    body,
  ]
    .filter((line) => line !== undefined)
    .join('\n')
    .replace(/\n{3,}/g, '\n\n');
}

export interface ParsedAssessmentQuestion {
  id: number;
  question: string;
  type: string;
  options?: string[];
  answer: string;
  matchingPairs?: { left: string; right: string }[];
  competencyLevel?: 'MLC' | 'Advanced';
}

// Q1: / Question 1: — optionally tagged "[MLC] Q1: ..." / "[ADV] Q1: ..." per
// prime-ai's COMPETENCY-LEVEL MIX prompt instructions (rag.py).
const STRONG_LEAD_RE =
  /^(?:\[(MLC|ADV)\]\s*)?(?:#{1,3}\s*)?\*{0,2}Q(?:uestion)?\s*(\d+)\s*[:.)\-]\*{0,2}\s*(.*)$/i;
// Fallback for questions the model numbered plainly ("1. ...") instead of "Q1:".
const BARE_LEAD_RE = /^(\d{1,2})\.\s+(\S.*)$/;
const COLUMN_A_RE = /^\*{0,2}Column\s+A\s*:?\*{0,2}\s*$/i;
const COLUMN_B_RE = /^\*{0,2}Column\s+B\s*:?\*{0,2}\s*$/i;
const COLUMN_A_ITEM_RE = /^(\d{1,2})\)\s*(.*)$/;
const COLUMN_B_ITEM_RE = /^([A-D])\)\s*(.*)$/i;
const OPTION_RE = /^([A-D])\)\s*(.*)$/i;
const ANSWER_LEAD_RE =
  /^(?:[✓✔]\s*)?(Correct(?:\s+Answer|\s+Matches)?|Expected(?:\s+Answer)?|Marking(?:\s+Guide)?|Sample(?:\s+Answer)?|Explanation)\s*:?\s*(.*)$/i;
const META_LINE_RE =
  /^\*{0,2}(Skill Area|Assessment type|Question format|Number of questions|Scope)\s*:/i;
const SECTION_HEADING_RE =
  /^(?:#{1,3}\s*)?(Section\s+[ABC]\s*:|For\s+(?:MULTIPLE CHOICE|TRUE\/FALSE|FILL IN THE BLANK|MATCHING|WRITING)|ANSWER KEY|Marking Guide|Combined note)/i;

interface QuestionDraft {
  tag?: 'MLC' | 'Advanced';
  stemLines: string[];
  options: string[];
  leftItems: string[];
  rightItems: string[];
  answerLines: string[];
  mode: 'stem' | 'columnsA' | 'columnsB' | 'answer';
}

function finalizeQuestionDraft(d: QuestionDraft, id: number): ParsedAssessmentQuestion {
  const question = d.stemLines.join(' ').replace(/\s+/g, ' ').trim();
  const answer = d.answerLines.join(' ').replace(/\s+/g, ' ').trim();

  if (d.leftItems.length > 0) {
    const letterByIndex = new Map<number, string>();
    const pairRe = /(\d{1,2})\s*-\s*([A-D])/gi;
    let pm: RegExpExecArray | null;
    while ((pm = pairRe.exec(answer)) !== null) {
      letterByIndex.set(parseInt(pm[1], 10), pm[2].toUpperCase());
    }
    const matchingPairs = d.leftItems.map((left, i) => {
      const letter = letterByIndex.get(i + 1);
      const idx = letter ? letter.charCodeAt(0) - 65 : i;
      return { left, right: d.rightItems[idx] ?? d.rightItems[i] ?? '' };
    });
    return { id, question, type: 'Matching', answer, matchingPairs, competencyLevel: d.tag };
  }

  if (d.options.length >= 2) {
    return { id, question, type: 'MCQ', options: d.options, answer, competencyLevel: d.tag };
  }

  if (/^true$|^false$/i.test(answer)) {
    return { id, question, type: 'True/False', answer, competencyLevel: d.tag };
  }

  if (/_{3,}/.test(question)) {
    return { id, question, type: 'Fill the Blank', answer, competencyLevel: d.tag };
  }

  return { id, question, type: 'Short Answer', answer, competencyLevel: d.tag };
}

/**
 * Parse raw AI-generated assessment markdown into structured, individually editable
 * questions. Returns null when nothing resembling a question could be found, so
 * callers can fall back to storing/rendering the raw markdown blob as before.
 */
export function parseAssessmentQuestions(content: string): ParsedAssessmentQuestion[] | null {
  const normalized = separateJammedAssessmentBlocks(content || '');
  const lines = normalized.split('\n');

  const drafts: QuestionDraft[] = [];
  let current: QuestionDraft | null = null;

  const pushCurrent = () => {
    if (current && (current.stemLines.length > 0 || current.leftItems.length > 0)) {
      drafts.push(current);
    }
    current = null;
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    const strong = STRONG_LEAD_RE.exec(line);
    const bareEligible: boolean =
      !current || (current.mode !== 'columnsA' && current.mode !== 'columnsB');
    const bare: RegExpExecArray | null = !strong && bareEligible ? BARE_LEAD_RE.exec(line) : null;

    if (strong) {
      pushCurrent();
      current = {
        tag: strong[1] ? (strong[1].toUpperCase() === 'MLC' ? 'MLC' : 'Advanced') : undefined,
        stemLines: strong[3]?.trim() ? [strong[3].trim()] : [],
        options: [],
        leftItems: [],
        rightItems: [],
        answerLines: [],
        mode: 'stem',
      };
      continue;
    }

    if (bare) {
      pushCurrent();
      current = {
        stemLines: bare[2]?.trim() ? [bare[2].trim()] : [],
        options: [],
        leftItems: [],
        rightItems: [],
        answerLines: [],
        mode: 'stem',
      };
      continue;
    }

    if (!current) continue; // preamble/meta before the first question — discard

    if (SECTION_HEADING_RE.test(line)) {
      pushCurrent();
      continue;
    }
    if (META_LINE_RE.test(line)) continue;

    if (current.mode === 'columnsA') {
      const item = COLUMN_A_ITEM_RE.exec(line);
      if (item) {
        current.leftItems.push(item[2].trim());
        continue;
      }
      if (COLUMN_B_RE.test(line)) {
        current.mode = 'columnsB';
        continue;
      }
    }
    if (current.mode === 'columnsB') {
      const item = COLUMN_B_ITEM_RE.exec(line);
      if (item) {
        current.rightItems.push(item[2].trim());
        continue;
      }
    }

    if (COLUMN_A_RE.test(line)) {
      current.mode = 'columnsA';
      continue;
    }
    if (COLUMN_B_RE.test(line)) {
      current.mode = 'columnsB';
      continue;
    }

    const ans = ANSWER_LEAD_RE.exec(line);
    if (ans) {
      current.mode = 'answer';
      current.answerLines.push(ans[2]?.trim() ? ans[2].trim() : line);
      continue;
    }
    if (current.mode === 'answer') {
      current.answerLines.push(line);
      continue;
    }

    if (current.mode === 'stem') {
      const opt = OPTION_RE.exec(line);
      if (opt) {
        current.options.push(opt[2].trim());
        continue;
      }
      current.stemLines.push(line);
    }
  }
  pushCurrent();

  if (drafts.length === 0) return null;

  return drafts.map((d, i) => finalizeQuestionDraft(d, i + 1));
}
