import { NextRequest, NextResponse } from 'next/server';
import { fetchPrimeAI } from '@/lib/primeAiServer';
import { runGapAnalysis, type GapAnalysisBody } from '@/app/api/ai/_lib/gapAnalysis';

export const maxDuration = 120;

type Body = {
  topic: string;
  subject?: string;
  grade?: string;
  missContext?: string;
  /** Coaching suggestion from gap analysis — expand into a PD module with light tweaks */
  suggestion?: string;
  mode?: string;
};

function fallbackModule(body: Body) {
  const topic = body.topic;
  const subject = body.subject || 'Subject';
  const grade = body.grade || 'Secondary';
  const suggestion = body.suggestion?.trim() || body.missContext?.trim() || '';

  const markdown = `# Teacher PD Module: ${topic}

**Focus:** ${subject} · ${grade}  
**Audience:** Classroom teachers who need a targeted refresh after high student miss rates  
**Duration:** ~90 minutes (can split across two PLC sessions)

## Coaching cue (from gap analysis)
${suggestion || `Re-teach **${topic}** with a short warm-up, worked example, then a 3-question exit ticket.`}

## Learning outcomes
1. Explain the core idea behind **${topic}** in student-friendly language.
2. Anticipate the 2–3 most common student misconceptions on this miss pattern.
3. Deliver a reteach sequence with checks for understanding.

## Session 1 — Diagnose (25 min)
- Review the miss evidence that produced this suggestion.
- Sort misconceptions: vocabulary vs procedure vs concept.
- Pair-share: “What did students think this question was asking?”

## Session 2 — Model the reteach (35 min)
1. Activator / hook tied to ${topic}
2. Worked example (I do) — mirror the missed question type
3. Guided practice (We do)
4. Independent check (You do) — 3 exit items on the same skill

## Session 3 — Classroom transfer (30 min)
- Draft tomorrow’s 10-minute warm-up on ${topic}
- Peer feedback on clarity and scaffolding
- Commit to one formative check within 48 hours

## Facilitator notes
${body.missContext ? `Evidence:\n${body.missContext}` : 'Use the gap-analysis suggestion as the coaching spine; expand steps, do not invent a new topic.'}

## Quick resources
- Board / slide with one clear definition of ${topic}
- 3 scaffolded practice items (easy → exam-like)
- Exit ticket template (3 items, peer marked)

---
_Expanded from classroom gap-analysis suggestion for department PD._
`;

  return {
    title: `PD Module: ${topic}`,
    topic,
    subject,
    grade,
    summary: `Module on ${topic} expanded from gap-analysis coaching for ${grade} ${subject}.`,
    markdown,
    source: 'fallback' as const,
  };
}

export async function POST(request: NextRequest) {
  try {
    const raw = (await request.json()) as Record<string, unknown>;

    // Gap analysis shares this registered route when /api/ai/gap-analysis is not yet picked up by the dev server.
    if (
      raw.mode === 'gap-analysis' ||
      (Array.isArray(raw.missedQuestions) && String(raw.assessmentTitle || '').trim())
    ) {
      return await runGapAnalysis(raw as unknown as GapAnalysisBody);
    }

    const body = raw as unknown as Body;
    const topic = String(body.topic || '').trim();
    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    const subject = body.subject?.trim() || 'General';
    const grade = body.grade?.trim() || '';
    const missContext = body.missContext?.trim() || '';
    const suggestion = body.suggestion?.trim() || '';
    const fromSuggestion =
      body.mode === 'from-suggestion' || Boolean(suggestion);

    const query = fromSuggestion
      ? [
          `Turn this classroom gap-analysis coaching SUGGESTION into a practical teacher PD module.`,
          `Do NOT invent a new topic. Keep the topic exactly: ${topic}`,
          `Subject: ${subject}`,
          grade ? `Grade: ${grade}` : '',
          '',
          'SUGGESTION (use as the spine — expand and tweak lightly into sessions):',
          suggestion || missContext,
          '',
          missContext && missContext !== suggestion
            ? `Extra miss evidence:\n${missContext}`
            : '',
          '',
          'Return markdown with:',
          '- Title focused on the missed topic',
          '- Short “Coaching cue” quoting/adapting the suggestion',
          '- Learning outcomes (3)',
          '- 3 timed sessions that operationalize the suggestion (warm-up → worked example → exit ticket)',
          '- Facilitator notes',
          '- Classroom transfer checklist',
          'Keep it Ethiopia secondary-school practical. Light tweak only — same topic, richer structure.',
        ]
          .filter(Boolean)
          .join('\n')
      : [
          `Create a practical teacher professional-development training module.`,
          `Topic teachers struggle to teach / students miss: ${topic}`,
          `Subject: ${subject}`,
          grade ? `Grade level: ${grade}` : '',
          missContext ? `Evidence from class assessments:\n${missContext}` : '',
          '',
          'Return markdown with: title, learning outcomes, 3 timed sessions, facilitator notes, and a short classroom transfer checklist.',
          'Keep it Ethiopia secondary-school classroom practical. No fluff.',
        ]
          .filter(Boolean)
          .join('\n');

    try {
      const response = await fetchPrimeAI('/chat', { query, history: [] });
      if (response.ok) {
        const result = (await response.json()) as Record<string, unknown>;
        const text =
          (typeof result.response === 'string' && result.response) ||
          (typeof result.answer === 'string' && result.answer) ||
          (typeof result.message === 'string' && result.message) ||
          (typeof result.content === 'string' && result.content) ||
          '';
        if (text.trim().length > 80) {
          return NextResponse.json({
            title: `PD Module: ${topic}`,
            topic,
            subject,
            grade,
            summary: fromSuggestion
              ? `Expanded from gap suggestion on ${topic} for ${grade || 'secondary'} ${subject}.`
              : `AI training module on ${topic} for ${grade || 'secondary'} ${subject}.`,
            markdown: text.trim(),
            source: 'ai',
          });
        }
      }
    } catch {
      /* fall through to template */
    }

    return NextResponse.json(
      fallbackModule({ topic, subject, grade, missContext, suggestion }),
    );
  } catch (error) {
    console.error('training-module API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate training module' },
      { status: 500 },
    );
  }
}
