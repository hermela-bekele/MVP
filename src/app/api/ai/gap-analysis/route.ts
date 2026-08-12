import { NextRequest, NextResponse } from 'next/server';
import { runGapAnalysis, type GapAnalysisBody } from '@/app/api/ai/_lib/gapAnalysis';

export const maxDuration = 120;

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as GapAnalysisBody;
    return await runGapAnalysis(body);
  } catch (error) {
    console.error('gap-analysis API error:', error);
    return NextResponse.json({ error: 'Failed to run gap analysis' }, { status: 500 });
  }
}
