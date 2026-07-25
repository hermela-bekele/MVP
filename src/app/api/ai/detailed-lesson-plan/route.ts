import { NextRequest, NextResponse } from 'next/server';
import { fetchPrimeAI } from '@/lib/primeAiServer';
import {
  createCacheKey,
  getCachedData,
  setCachedData,
  getCacheStats,
} from '@/lib/persistentCache';

export const maxDuration = 120;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      plan_type = 'weekly',
      grade = 'Grade 11',
      subject = 'Mathematics',
      topic = '',
      subtopic = '',
      student_level = 'differentiated',
      periods_per_week = 3,
      session_duration = 45,
      learning_days_per_year = 180,
      days_per_week = 5,
      calendar_weeks = [],
      year_calendar_weeks = [],
      non_teaching_windows = [],
      teacher_name = '',
      school_name = '',
      academic_year = '',
      reference_materials = 'TEXT BOOK',
    } = body;

    if (plan_type !== 'yearly' && !topic?.trim()) {
      return NextResponse.json(
        { error: 'Topic is required for weekly plans' },
        { status: 400 },
      );
    }

    if (days_per_week < 1 || days_per_week > 5) {
      return NextResponse.json(
        { error: 'Days per week must be between 1 and 5' },
        { status: 400 },
      );
    }

    const payload = {
      plan_type,
      grade,
      subject,
      topic: topic?.trim() ?? '',
      subtopic: subtopic?.trim() ?? '',
      student_level,
      periods_per_week,
      session_duration,
      learning_days_per_year,
      days_per_week,
      calendar_weeks,
      year_calendar_weeks,
      non_teaching_windows,
      teacher_name,
      school_name,
      academic_year,
      reference_materials,
    };

    const cacheKey = createCacheKey('detailed-lesson-plan', payload);
    const cached = await getCachedData(cacheKey);
    if (cached) {
      const cacheAgeMinutes = Math.floor(
        (Date.now() - cached.timestamp) / 1000 / 60,
      );
      console.log(
        `✅ [Cache HIT] Detailed lesson plan (${plan_type}) cached ${cacheAgeMinutes}m ago`,
      );
      return NextResponse.json({
        ...cached.data,
        cached: true,
        cacheAge: cacheAgeMinutes,
      });
    }

    console.log(`🚀 [Cache MISS] Generating ${plan_type} lesson plan`);
    const response = await fetchPrimeAI('/detailed-lesson-plan', payload);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Prime AI error: ${response.status}`, errorText);
      return NextResponse.json(
        { error: 'Failed to generate detailed lesson plan', details: errorText },
        { status: response.status },
      );
    }

    const result = (await response.json()) as Record<string, unknown>;
    await setCachedData(cacheKey, result);

    return NextResponse.json({
      ...result,
      cached: false,
    });
  } catch (error) {
    console.error('❌ Detailed lesson plan API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  const stats = await getCacheStats('detailed-lesson-plan');
  return NextResponse.json({
    ...stats,
    message: 'File-based cache persists across restarts',
  });
}
