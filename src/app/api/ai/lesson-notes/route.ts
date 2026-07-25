import { NextRequest, NextResponse } from "next/server";
import { fetchPrimeAI } from "@/lib/primeAiServer";
import {
  createCacheKey,
  getCachedData,
  setCachedData,
  getCacheStats,
} from "@/lib/persistentCache";

export const maxDuration = 120;

// In-memory cache shared across all users
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

function getCacheKey(payload: any): string {
  return JSON.stringify(payload);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topic, subtopic = '', session_context = '', student_level = 'differentiated' } = body;

    if (!topic) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }

    const payload: Record<string, unknown> = { topic, subtopic, student_level };
    if (session_context?.trim()) {
      payload.session_context = session_context.trim();
    }

    // Create cache key
    const cacheKey = createCacheKey("lesson-notes", payload);

    // Check cache first
    const cached = await getCachedData(cacheKey);
    if (cached) {
      const cacheAgeMinutes = Math.floor(
        (Date.now() - cached.timestamp) / 1000 / 60,
      );
      console.log(
        `✅ [Cache HIT] Returning cached lesson notes for: ${topic} (cached ${cacheAgeMinutes}m ago)`,
      );
      return NextResponse.json({
        ...cached.data,
        cached: true,
        cacheAge: cacheAgeMinutes,
      });
    }

    // Cache miss - call Prime AI backend
    console.log(`🚀 [Cache MISS] Calling Prime AI for: ${topic}`);
    const response = await fetchPrimeAI("/lesson-notes", payload);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Prime AI error: ${response.status}`, errorText);
      return NextResponse.json(
        { error: "Failed to generate lesson notes", details: errorText },
        { status: response.status },
      );
    }

    const result = (await response.json()) as Record<string, unknown>;

    // Store in cache
    await setCachedData(cacheKey, result);

    console.log(`💾 [Cached] Lesson notes for: ${topic} (persisted to disk)`);

    return NextResponse.json({
      ...result,
      cached: false,
    });
  } catch (error) {
    console.error("❌ Lesson notes API error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// GET endpoint to check cache stats
export async function GET() {
  const stats = await getCacheStats("lesson-notes");
  return NextResponse.json({
    ...stats,
    message: "File-based cache persists across restarts",
  });
}
