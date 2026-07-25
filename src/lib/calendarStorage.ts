import type { AcademicCalendar } from './mockData';

const STORAGE_KEY = 'pts-academic-calendars';

export function readStoredCalendars(): AcademicCalendar[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as AcademicCalendar[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeStoredCalendars(calendars: AcademicCalendar[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(calendars));
  } catch {
    /* ignore quota errors */
  }
}
