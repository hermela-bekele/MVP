import { NextResponse } from 'next/server';

const FALLBACK_TOPICS = [
  'functions',
  'trigonometry',
  'algebra',
  'sequences_series',
  'probability',
  'statistics',
  'analytical_geometry',
  'calculus',
  'euclidean_geometry',
  'finance',
];

export async function GET() {
  const baseUrl =
    process.env.NEXT_PUBLIC_PRIME_AI_API_URL ||
    process.env.PRIME_AI_API_URL ||
    'https://prime-ai-bndr.onrender.com';

  try {
    const response = await fetch(`${baseUrl}/topics`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      throw new Error(`Topics fetch failed: ${response.status}`);
    }

    const result = (await response.json()) as { topics?: string[] };
    return NextResponse.json({ topics: result.topics ?? FALLBACK_TOPICS });
  } catch (error) {
    console.error('❌ Topics API error:', error);
    return NextResponse.json({ topics: FALLBACK_TOPICS, fallback: true });
  }
}
