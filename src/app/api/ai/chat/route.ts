import { NextRequest, NextResponse } from 'next/server';
import { fetchPrimeAI } from '@/lib/primeAiServer';

export const maxDuration = 120;

// In-memory cache shared across all users (only cache single-turn questions)
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

function getCacheKey(payload: any): string {
  return JSON.stringify(payload);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, history = [] } = body;

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // Only cache single-turn questions (no history)
    const shouldCache = !history || history.length === 0;
    
    if (shouldCache) {
      // Create cache key
      const cacheKey = getCacheKey({ query });

      // Check cache first
      const cached = cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        console.log(`✅ [Cache HIT] Returning cached chat response for: ${query.substring(0, 50)}...`);
        return NextResponse.json({
          ...cached.data,
          cached: true,
          cacheAge: Math.floor((Date.now() - cached.timestamp) / 1000 / 60), // minutes
        });
      }
    }

    // Cache miss or multi-turn - call Prime AI backend
    console.log(`🚀 [Cache MISS] Calling Prime AI chat: ${query.substring(0, 50)}...`);
    const response = await fetchPrimeAI('/chat', { query, history });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Prime AI error: ${response.status}`, errorText);
      return NextResponse.json(
        { error: 'Failed to get chat response', details: errorText },
        { status: response.status }
      );
    }

    const result = await response.json();

    // Store in cache (only single-turn questions)
    if (shouldCache) {
      const cacheKey = getCacheKey({ query });
      cache.set(cacheKey, {
        data: result,
        timestamp: Date.now(),
      });

      console.log(`💾 [Cached] Chat response (Total cache size: ${cache.size})`);
    }

    return NextResponse.json({
      ...result,
      cached: false,
    });
  } catch (error) {
    console.error('❌ Chat API error:', error);
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
    cacheKeys: Array.from(cache.keys()).map(k => {
      const parsed = JSON.parse(k);
      return parsed.query?.substring(0, 50) || k;
    }).slice(0, 10), // First 10 keys
  });
}
