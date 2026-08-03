import { NextRequest, NextResponse } from 'next/server';
import { fetchPrimeAI } from '@/lib/primeAiServer';

export const maxDuration = 120;

type Body = {
  topic: string;
  subject?: string;
  grade?: string;
  missContext?: string;
};

function fallbackModule(body: Body) {
  const topic = body.topic;
  const subject = body.subject || 'Subject';
  const grade = body.grade || 'Secondary';
  const markdown = `# Teacher PD Module: ${topic}

**Focus:** ${subject} · ${grade}  
**Audience:** Classroom teachers who need a targeted refresh after high student miss rates  
**Duration:** ~90 minutes (can split across two PLC sessions)

## Learning outcomes
1. Explain the core idea behind **${topic}** in student-friendly language.
2. Anticipate the 2–3 most common student misconceptions.
3. Deliver a reteach sequence with checks for understanding.

## Session 1 — Diagnose (25 min)
- Review anonymized miss-rate evidence from the class assessment.
- Sort misconceptions: vocabulary vs procedure vs concept.
- Pair-share: “What did students think this question was asking?”

## Session 2 — Model the reteach (35 min)
1. Activator / hook tied to ${topic}
2. Worked example (I do)
3. Guided practice (We do)
4. Independent check (You do) — 3 exit items mirroring the missed question type

## Session 3 — Classroom transfer (30 min)
- Draft tomorrow’s 10-minute warm-up on ${topic}
- Peer feedback on clarity and scaffolding
- Commit to one formative check within 48 hours

## Facilitator notes
${body.missContext ? `Context from grade analytics:\n${body.missContext}` : 'Use the reported high-miss question prompts as anchors.'}

## Quick resources
- Board / slide with one clear definition of ${topic}
- 3 scaffolded practice items (easy → exam-like)
- Exit ticket template (3 items, peer marked)

---
_Generated for department professional development after class assessment miss analysis._
`;

  return {
    title: `PD Module: ${topic}`,
    topic,
    subject,
    grade,
    summary: `Focused teacher training on ${topic} for ${grade} ${subject}, built from class miss-rate evidence.`,
    markdown,
    source: 'fallback' as const,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Body;
    const topic = String(body.topic || '').trim();
    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    const subject = body.subject?.trim() || 'General';
    const grade = body.grade?.trim() || '';
    const missContext = body.missContext?.trim() || '';

    const query = [
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
            summary: `AI training module on ${topic} for ${grade || 'secondary'} ${subject}.`,
            markdown: text.trim(),
            source: 'ai',
          });
        }
      }
    } catch {
      /* fall through to template */
    }

    return NextResponse.json(fallbackModule({ topic, subject, grade, missContext }));
  } catch (error) {
    console.error('training-module API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate training module' },
      { status: 500 },
    );
  }
}
