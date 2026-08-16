import type { AcademicCalendarEvent } from './mockData';

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function calendarDateRange(startIso: string, endIso: string): string[] {
  const days: string[] = [];
  let cursor = startIso;
  while (cursor <= endIso) {
    days.push(cursor);
    cursor = addDays(cursor, 1);
  }
  return days;
}

export function getCalendarBounds(events: AcademicCalendarEvent[]) {
  if (events.length === 0) {
    const today = new Date().toISOString().slice(0, 10);
    return { start: today, end: today };
  }
  const starts = events.map((e) => e.startDate).sort();
  const ends = events.map((e) => e.endDate).sort();
  return { start: starts[0], end: ends[ends.length - 1] };
}

export function eventCoversDay(event: AcademicCalendarEvent, iso: string): boolean {
  return event.startDate <= iso && iso <= event.endDate;
}

export function eventsForDay(events: AcademicCalendarEvent[], iso: string): AcademicCalendarEvent[] {
  return events.filter((e) => eventCoversDay(e, iso));
}

/** Highest-priority event type for a day cell background */
const TYPE_PRIORITY: Record<AcademicCalendarEvent['type'], number> = {
  holiday: 6,
  break: 5,
  exam: 4,
  other: 3,
  term: 2,
  moe: 1,
};

export function primaryEventForDay(
  events: AcademicCalendarEvent[],
  iso: string,
): AcademicCalendarEvent | null {
  const dayEvents = eventsForDay(events, iso);
  if (dayEvents.length === 0) return null;
  return dayEvents.sort((a, b) => TYPE_PRIORITY[b.type] - TYPE_PRIORITY[a.type])[0];
}

/** Mon–Fri = weekday (school day); Sat/Sun = weekend. */
export function isWeekdayIso(iso: string): boolean {
  const day = new Date(`${iso}T12:00:00`).getDay();
  return day >= 1 && day <= 5;
}

export function holidayForDay(
  events: AcademicCalendarEvent[],
  iso: string,
): AcademicCalendarEvent | null {
  return eventsForDay(events, iso).find((e) => e.type === 'holiday') ?? null;
}

/** Short caption for display under a calendar day number. */
export function shortHolidayLabel(label: string): string {
  const cleaned = label
    .replace(/\s*\([^)]*\)\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (cleaned.length <= 14) return cleaned;
  return `${cleaned.slice(0, 12)}…`;
}

export function monthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

export function parseMonthKey(key: string): { year: number; month: number } {
  const [year, month] = key.split('-').map(Number);
  return { year, month };
}

export function monthsInRange(startIso: string, endIso: string): string[] {
  const start = new Date(`${startIso}T12:00:00`);
  const end = new Date(`${endIso}T12:00:00`);
  const months: string[] = [];
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  const last = new Date(end.getFullYear(), end.getMonth(), 1);
  while (cursor <= last) {
    months.push(monthKey(cursor.getFullYear(), cursor.getMonth() + 1));
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return months;
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function firstWeekdayOfMonth(year: number, month: number): number {
  return new Date(year, month - 1, 1).getDay();
}

export const EVENT_CELL_STYLES: Record<AcademicCalendarEvent['type'], string> = {
  term: 'bg-primary/15 border-primary/30 text-primary',
  break: 'bg-amber-500/15 border-amber-500/30 text-amber-800 dark:text-amber-200',
  holiday: 'bg-destructive/15 border-destructive/30 text-destructive',
  exam: 'bg-violet-500/15 border-violet-500/30 text-violet-700 dark:text-violet-200',
  moe: 'bg-muted/50 border-border text-muted-foreground',
  other: 'bg-rose-500/15 border-rose-500/30 text-rose-800 dark:text-rose-200',
};

export const EVENT_LEGEND: { type: AcademicCalendarEvent['type']; label: string }[] = [
  { type: 'holiday', label: 'National holiday' },
  { type: 'term', label: 'Instruction (quarter)' },
  { type: 'break', label: 'Quarter & semester breaks' },
  { type: 'exam', label: 'Mid & final exam days' },
  { type: 'moe', label: 'MOE academic window' },
  { type: 'other', label: 'Custom school day' },
];
