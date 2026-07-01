import { NextRequest, NextResponse } from 'next/server';

// In-memory cache shared across all users
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

function getCacheKey(payload: any): string {
  return JSON.stringify(payload);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topic, difficulty = 'medium', num_questions = 5 } = body;

    if (!topic) {
      return NextResponse.json(
        { error: 'Topic is required' },
        { status: 400 }
      );
    }

    // Create cache key
    const cacheKey = getCacheKey({ topic, difficulty, num_questions });

    // Check cache first
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log(`✅ [Cache HIT] Returning cached quiz for: ${topic} (${difficulty})`);
      return NextResponse.json({
        ...cached.data,
        cached: true,
        cacheAge: Math.floor((Date.now() - cached.timestamp) / 1000 / 60), // minutes
      });
    }

    // Cache miss - call Prime AI backend
    console.log(`🚀 [Cache MISS] Calling Prime AI for quiz: ${topic}`);
    const apiUrl = process.env.NEXT_PUBLIC_PRIME_AI_API_URL || 'https://prime-ai-bndr.onrender.com';
    
    const response = await fetch(`${apiUrl}/quiz`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ topic, difficulty, num_questions }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Prime AI error: ${response.status}`, errorText);
      return NextResponse.json(
        { error: 'Failed to generate quiz', details: errorText },
        { status: response.status }
      );
    }

    const result = await response.json();

    // Store in cache
    cache.set(cacheKey, {
      data: result,
      timestamp: Date.now(),
    });

    console.log(`💾 [Cached] Quiz for: ${topic} (Total cache size: ${cache.size})`);

    return NextResponse.json({
      ...result,
      cached: false,
    });
  } catch (error) {
    console.error('❌ Quiz API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Optional: GET endpoint to check cache stats
export async function GET() {
  return NextResponse.json({
    cacheSize: cache.size,
    cacheKeys: Array.from(cache.keys()).slice(0, 10), // First 10 keys
  });
}
