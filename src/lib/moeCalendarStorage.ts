import type { MoeCalendarDraft } from './mockData';

const STORAGE_KEY = 'pts-moe-calendar';

export function readStoredMoeCalendar(): MoeCalendarDraft | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as MoeCalendarDraft;
  } catch {
    return null;
  }
}

export function writeStoredMoeCalendar(calendar: MoeCalendarDraft | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (calendar) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(calendar));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    /* ignore quota errors */
  }
}
