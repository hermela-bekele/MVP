import fs from 'fs/promises';
import path from 'path';

const CACHE_DIR = path.join(process.cwd(), '.cache', 'ai-responses');
const CACHE_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days

// Ensure cache directory exists
async function ensureCacheDir() {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
  } catch (error) {
    console.error('Failed to create cache directory:', error);
  }
}

// Create a hash from string for filename
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

export function createCacheKey(prefix: string, payload: any): string {
  const str = JSON.stringify(payload);
  const hash = hashString(str);
  return `${prefix}-${hash}.json`;
}

export async function getCachedData(cacheKey: string) {
  try {
    const filePath = path.join(CACHE_DIR, cacheKey);
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const cached = JSON.parse(fileContent);
    
    // Check if cache is still valid
    if (Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached;
    }
    
    // Cache expired, delete file
    await fs.unlink(filePath).catch(() => {});
    return null;
  } catch (_error) {
    return null;
  }
}

export async function setCachedData(cacheKey: string, data: any) {
  try {
    await ensureCacheDir();
    const filePath = path.join(CACHE_DIR, cacheKey);
    await fs.writeFile(
      filePath,
      JSON.stringify({
        data,
        timestamp: Date.now(),
      }),
      'utf-8'
    );
  } catch (error) {
    console.error('Failed to write cache:', error);
  }
}

export async function getCacheStats(prefix?: string) {
  try {
    await ensureCacheDir();
    const files = await fs.readdir(CACHE_DIR);
    const filtered = prefix ? files.filter(f => f.startsWith(prefix)) : files;
    
    return {
      total: files.length,
      filtered: filtered.length,
      cacheLocation: CACHE_DIR,
    };
  } catch (_error) {
    return {
      total: 0,
      filtered: 0,
      error: 'Failed to read cache directory',
    };
  }
}
