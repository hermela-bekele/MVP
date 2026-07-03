import { NextRequest, NextResponse } from 'next/server';
import { createCacheKey, getCachedData, setCachedData, getCacheStats } from '@/lib/persistentCache';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topic, subtopic = '' } = body;

    if (!topic) {
      return NextResponse.json(
        { error: 'Topic is required' },
        { status: 400 }
      );
    }

    // Create cache key
    const cacheKey = createCacheKey('lesson-notes', { topic, subtopic });

    // Check cache first
    const cached = await getCachedData(cacheKey);
    if (cached) {
      const cacheAgeMinutes = Math.floor((Date.now() - cached.timestamp) / 1000 / 60);
      console.log(`✅ [Cache HIT] Returning cached lesson notes for: ${topic} (cached ${cacheAgeMinutes}m ago)`);
      return NextResponse.json({
        ...cached.data,
        cached: true,
        cacheAge: cacheAgeMinutes,
      });
    }

    // Cache miss - call Prime AI backend
    console.log(`🚀 [Cache MISS] Calling Prime AI for: ${topic}`);
    const apiUrl = process.env.NEXT_PUBLIC_PRIME_AI_API_URL || 'https://prime-ai-bndr.onrender.com';
    
    const response = await fetch(`${apiUrl}/lesson-notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ topic, subtopic }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Prime AI error: ${response.status}`, errorText);
      return NextResponse.json(
        { error: 'Failed to generate lesson notes', details: errorText },
        { status: response.status }
      );
    }

    const result = await response.json();

    // Store in cache
    await setCachedData(cacheKey, result);

    console.log(`💾 [Cached] Lesson notes for: ${topic} (persisted to disk)`);

    return NextResponse.json({
      ...result,
      cached: false,
    });
  } catch (error) {
    console.error('❌ Lesson notes API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// GET endpoint to check cache stats
export async function GET() {
  const stats = await getCacheStats('lesson-notes');
  return NextResponse.json({
    ...stats,
    message: 'File-based cache persists across restarts',
  });
}
