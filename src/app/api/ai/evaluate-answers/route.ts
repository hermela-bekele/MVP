import { NextRequest, NextResponse } from 'next/server';
import { fetchPrimeAI } from '@/lib/primeAiServer';

export const maxDuration = 120;

interface EvaluateQuestion {
  id: string;
  question: string;
  userAnswer: string;
  maxPoints: number;
  correctAnswer?: string;
}

interface EvaluationResult {
  id: string;
  score: number;
  maxPoints: number;
  feedback: string;
  isCorrect: boolean;
}

function normalizeText(text: string): string {
  return text.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
}

function fallbackEvaluate(questions: EvaluateQuestion[]): EvaluationResult[] {
  return questions.map((q) => {
    const userNorm = normalizeText(q.userAnswer);
    const expectedNorm = q.correctAnswer ? normalizeText(q.correctAnswer) : '';

    let score = 0;
    let isCorrect = false;
    let feedback = 'Your answer was reviewed. Compare with the expected answer below.';

    if (expectedNorm && userNorm) {
      if (userNorm === expectedNorm) {
        score = q.maxPoints;
        isCorrect = true;
        feedback = 'Your answer matches the expected response.';
      } else if (userNorm.includes(expectedNorm) || expectedNorm.includes(userNorm)) {
        score = Math.max(1, Math.round(q.maxPoints * 0.7));
        feedback = 'Your answer captures key ideas but could be more complete.';
      } else {
        const userWords = new Set(userNorm.split(' ').filter((w) => w.length > 3));
        const expectedWords = expectedNorm.split(' ').filter((w) => w.length > 3);
        const overlap = expectedWords.filter((w) => userWords.has(w)).length;
        const ratio = expectedWords.length > 0 ? overlap / expectedWords.length : 0;
        if (ratio >= 0.5) {
          score = Math.max(1, Math.round(q.maxPoints * ratio));
          feedback = 'Your answer includes some correct concepts but is missing important details.';
        } else {
          score = 0;
          feedback = 'Your answer does not fully address the question based on the module content.';
        }
      }
    }

    return { id: q.id, score, maxPoints: q.maxPoints, feedback, isCorrect };
  });
}

function parseAiEvaluation(
  raw: string,
  questions: EvaluateQuestion[],
): EvaluationResult[] | null {
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    const parsed = JSON.parse(jsonMatch[0]) as {
      results?: Array<{
        id: string;
        score: number;
        feedback: string;
        isCorrect?: boolean;
      }>;
    };
    if (!parsed.results || !Array.isArray(parsed.results)) return null;

    return questions.map((q) => {
      const match = parsed.results!.find((r) => r.id === q.id);
      if (!match) {
        return fallbackEvaluate([q])[0];
      }
      const score = Math.max(0, Math.min(q.maxPoints, Math.round(match.score)));
      return {
        id: q.id,
        score,
        maxPoints: q.maxPoints,
        feedback: match.feedback || 'Evaluated based on module content.',
        isCorrect: match.isCorrect ?? score >= q.maxPoints * 0.7,
      };
    });
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { moduleContent, questions } = body as {
      moduleContent?: string;
      questions?: EvaluateQuestion[];
    };

    if (!questions || questions.length === 0) {
      return NextResponse.json({ error: 'Questions are required' }, { status: 400 });
    }

    const content = moduleContent?.trim() || '';
    const truncatedContent =
      content.length > 12000 ? `${content.slice(0, 12000)}\n...[truncated]` : content;

    const questionBlock = questions
      .map(
        (q, i) =>
          `Question ${i + 1} (id: ${q.id}, max ${q.maxPoints} points):\n${q.question}\nStudent answer: ${q.userAnswer}`,
      )
      .join('\n\n');

    const prompt = `You are evaluating short-answer responses for a teacher professional development module.

Use ONLY the module content below as the source of truth. Score each answer based on how well it reflects concepts taught in the module. Accept paraphrasing and equivalent wording.

MODULE CONTENT:
${truncatedContent || '(No module content provided — use general teaching knowledge sparingly.)'}

ANSWERS TO EVALUATE:
${questionBlock}

Return ONLY valid JSON in this exact shape:
{
  "results": [
    {
      "id": "<question id>",
      "score": <number 0 to maxPoints>,
      "feedback": "<brief constructive feedback>",
      "isCorrect": <true if score >= 70% of maxPoints>
    }
  ]
}`;

    try {
      const response = await fetchPrimeAI('/chat', { query: prompt, history: [] });
      if (response.ok) {
        const result = (await response.json()) as Record<string, unknown>;
        const reply =
          (result.response as string) ||
          (result.answer as string) ||
          (result.content as string) ||
          JSON.stringify(result);

        const aiResults = parseAiEvaluation(reply, questions);
        if (aiResults) {
          const totalScore = aiResults.reduce((sum, r) => sum + r.score, 0);
          const totalPoints = aiResults.reduce((sum, r) => sum + r.maxPoints, 0);
          return NextResponse.json({
            results: aiResults,
            totalScore,
            totalPoints,
            scorePercentage: totalPoints > 0 ? Math.round((totalScore / totalPoints) * 100) : 0,
            evaluatedBy: 'ai',
          });
        }
      }
    } catch (error) {
      console.warn('AI evaluation failed, using fallback:', error);
    }

    const results = fallbackEvaluate(questions);
    const totalScore = results.reduce((sum, r) => sum + r.score, 0);
    const totalPoints = results.reduce((sum, r) => sum + r.maxPoints, 0);

    return NextResponse.json({
      results,
      totalScore,
      totalPoints,
      scorePercentage: totalPoints > 0 ? Math.round((totalScore / totalPoints) * 100) : 0,
      evaluatedBy: 'fallback',
    });
  } catch (error) {
    console.error('Evaluate answers API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
