import { NextRequest, NextResponse } from 'next/server';
import { fetchPrimeAI } from '@/lib/primeAiServer';

export const maxDuration = 300;

const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_DURATION = 30 * 24 * 60 * 60 * 1000;

function getCacheKey(payload: unknown): string {
  return JSON.stringify(payload);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      grade = 'Grade 11',
      subject = 'Mathematics',
      semester_timing = 'semester_1_start',
      focus_topic = '',
      difficulty = 'medium',
      num_questions = 10,
      question_type = 'mixed',
      student_level = 'differentiated',
    } = body;

    const payload: Record<string, unknown> = {
      grade,
      subject,
      semester_timing,
      focus_topic: focus_topic?.trim() ?? '',
      difficulty,
      num_questions,
      question_type,
      student_level,
    };

    const cacheKey = getCacheKey(payload);
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return NextResponse.json({
        ...(cached.data as Record<string, unknown>),
        cached: true,
        cacheAge: Math.floor((Date.now() - cached.timestamp) / 1000 / 60),
      });
    }

    const response = await fetchPrimeAI('/baseline-assessment', payload);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Prime AI baseline error: ${response.status}`, errorText);
      return NextResponse.json(
        { error: 'Failed to generate baseline assessment', details: errorText },
        { status: response.status },
      );
    }

    const result = (await response.json()) as Record<string, unknown>;
    cache.set(cacheKey, { data: result, timestamp: Date.now() });

    return NextResponse.json({ ...result, cached: false });
  } catch (error) {
    console.error('❌ Baseline assessment API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
