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
