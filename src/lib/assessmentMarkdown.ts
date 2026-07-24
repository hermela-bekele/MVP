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
 * Normalize AI assessment markdown for remark-math / KaTeX rendering.
 */
export function preprocessAssessmentMarkdown(content: string): string {
  const lines = content.split('\n');
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

  return merged
    .join('\n')
    .replace(/^\* /gm, '- ')
    .replace(/\*\*Skill Area:\s*/gi, '**Skill Area:** ')
    .trim();
}
