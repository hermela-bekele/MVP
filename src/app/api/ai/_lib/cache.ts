import { NextResponse } from 'next/server';

const cacheStore = globalThis as typeof globalThis & {
  __primeAiRouteCache?: Map<string, { data: any; timestamp: number }>;
};

function getRouteCache() {
  if (!cacheStore.__primeAiRouteCache) {
    cacheStore.__primeAiRouteCache = new Map();
  }
  return cacheStore.__primeAiRouteCache;
}

export function createCacheKey(payload: any): string {
  return JSON.stringify(payload);
}

export function getCachedResponse(cacheKey: string) {
  return getRouteCache().get(cacheKey) ?? null;
}

export function setCachedResponse(cacheKey: string, data: any) {
  getRouteCache().set(cacheKey, { data, timestamp: Date.now() });
}

export function getCacheStats() {
  return {
    size: getRouteCache().size,
    keys: Array.from(getRouteCache().keys()).slice(0, 10),
  };
}

export function clearRouteCache() {
  getRouteCache().clear();
}

export function jsonWithCacheStatus<T>(data: T, cached: boolean, cacheAgeMinutes?: number) {
  return NextResponse.json({
    ...data,
    cached,
    cacheAge: cacheAgeMinutes ?? 0,
  });
}
