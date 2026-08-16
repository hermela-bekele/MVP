const ACTIVE_HOD_TEACHER_KEY = 'pts-active-hod-teacher';
const FAVORITE_COMMUNITIES_KEY = 'pts-favorite-communities';

export function readActiveHodTeacherId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(ACTIVE_HOD_TEACHER_KEY);
  } catch {
    return null;
  }
}

export function writeActiveHodTeacherId(id: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (id) localStorage.setItem(ACTIVE_HOD_TEACHER_KEY, id);
    else localStorage.removeItem(ACTIVE_HOD_TEACHER_KEY);
  } catch {
    /* ignore quota errors */
  }
}

export function readFavoriteCommunityIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(FAVORITE_COMMUNITIES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function toggleFavoriteCommunityId(id: string): string[] {
  const current = readFavoriteCommunityIds();
  const next = current.includes(id) ? current.filter((c) => c !== id) : [...current, id];
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(FAVORITE_COMMUNITIES_KEY, JSON.stringify(next));
    } catch {
      /* ignore quota errors */
    }
  }
  return next;
}

export const HOD_THREAD_SELECT_EVENT = 'hod-thread:select';

const ACTIVE_DEPT_THREAD_KEY = 'pts-active-dept-thread';

export function readActiveDeptThreadId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(ACTIVE_DEPT_THREAD_KEY);
  } catch {
    return null;
  }
}

export function writeActiveDeptThreadId(id: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (id) localStorage.setItem(ACTIVE_DEPT_THREAD_KEY, id);
    else localStorage.removeItem(ACTIVE_DEPT_THREAD_KEY);
  } catch {
    /* ignore quota errors */
  }
}

export const DEPT_THREAD_SELECT_EVENT = 'dept-thread:select';
