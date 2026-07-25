import type { AcademicCalendarEvent } from './mockData';
import { formatEthiopianDate } from './ethiopianCalendar';

/** Day assignment options for the school-head calendar editor. */
export type SchoolDayMark =
  | 'mid-exam-start'
  | 'mid-exam-end'
  | 'quarter-end'
  | 'quarter-break'
  | 'semester-break'
  | 'semester-final-start'
  | 'semester-final-end'
  | 'other';

export interface DayAssignment {
  date: string;
  mark: SchoolDayMark;
  label: string;
}

export const DAY_MARK_OPTIONS: { value: SchoolDayMark; label: string }[] = [
  { value: 'mid-exam-start', label: 'Mid exam day — start' },
  { value: 'mid-exam-end', label: 'Mid exam day — end' },
  { value: 'quarter-end', label: 'Quarter end' },
  { value: 'quarter-break', label: 'Quarter break' },
  { value: 'semester-break', label: 'Semester break' },
  { value: 'semester-final-start', label: 'Semester final exam — start' },
  { value: 'semester-final-end', label: 'Semester final exam — end' },
  { value: 'other', label: 'Other (enter manually)' },
];

/** Soft circle / chip colors — readable without heavy saturation. */
export const DAY_MARK_COLORS: Record<
  SchoolDayMark,
  { bg: string; text: string; chip: string; legend: string; ring?: string; ec?: string }
> = {
  'mid-exam-start': {
    bg: 'bg-sky-100',
    text: 'text-sky-900',
    chip: 'bg-sky-100 text-sky-800 ring-1 ring-sky-200',
    legend: 'Mid exam start',
    ring: 'ring-sky-200',
    ec: 'text-sky-700/80',
  },
  'mid-exam-end': {
    bg: 'bg-sky-50',
    text: 'text-sky-800',
    chip: 'bg-sky-50 text-sky-800 ring-1 ring-sky-300',
    legend: 'Mid exam end',
    ring: 'ring-sky-300',
    ec: 'text-sky-700/70',
  },
  'quarter-end': {
    bg: 'bg-violet-50',
    text: 'text-violet-900',
    chip: 'bg-violet-50 text-violet-800 ring-1 ring-violet-200',
    legend: 'Quarter end',
    ring: 'ring-violet-200',
    ec: 'text-violet-700/80',
  },
  'quarter-break': {
    bg: 'bg-amber-50',
    text: 'text-amber-900',
    chip: 'bg-amber-50 text-amber-800 ring-1 ring-amber-200',
    legend: 'Quarter break',
    ring: 'ring-amber-200',
    ec: 'text-amber-700/80',
  },
  'semester-break': {
    bg: 'bg-orange-50',
    text: 'text-orange-900',
    chip: 'bg-orange-50 text-orange-800 ring-1 ring-orange-200',
    legend: 'Semester break',
    ring: 'ring-orange-200',
    ec: 'text-orange-700/80',
  },
  'semester-final-start': {
    bg: 'bg-teal-50',
    text: 'text-teal-900',
    chip: 'bg-teal-50 text-teal-800 ring-1 ring-teal-200',
    legend: 'Semester final start',
    ring: 'ring-teal-200',
    ec: 'text-teal-700/80',
  },
  'semester-final-end': {
    bg: 'bg-teal-50/80',
    text: 'text-teal-800',
    chip: 'bg-teal-50 text-teal-800 ring-1 ring-teal-300',
    legend: 'Semester final end',
    ring: 'ring-teal-300',
    ec: 'text-teal-700/70',
  },
  other: {
    bg: 'bg-rose-50',
    text: 'text-rose-900',
    chip: 'bg-rose-50 text-rose-800 ring-1 ring-rose-200',
    legend: 'Other / custom',
    ring: 'ring-rose-200',
    ec: 'text-rose-700/80',
  },
};

export const DAY_MARK_LEGEND = DAY_MARK_OPTIONS.map((o) => ({
  mark: o.value,
  label: DAY_MARK_COLORS[o.value].legend,
  className: DAY_MARK_COLORS[o.value].chip,
}));

function markToEventType(mark: SchoolDayMark): AcademicCalendarEvent['type'] {
  switch (mark) {
    case 'mid-exam-start':
    case 'mid-exam-end':
    case 'semester-final-start':
    case 'semester-final-end':
      return 'exam';
    case 'quarter-break':
    case 'semester-break':
      return 'break';
    case 'quarter-end':
      return 'term';
    case 'other':
      return 'other';
    default:
      return 'other';
  }
}

function defaultLabel(mark: SchoolDayMark): string {
  return DAY_MARK_OPTIONS.find((o) => o.value === mark)?.label ?? 'Custom day';
}

/** Pair start/end marks into ranged events; leave unpaired as single-day markers. */
export function assignmentsToEvents(assignments: DayAssignment[]): AcademicCalendarEvent[] {
  const sorted = [...assignments].sort((a, b) => a.date.localeCompare(b.date));
  const used = new Set<string>();
  const events: AcademicCalendarEvent[] = [];

  const pair = (
    startMark: SchoolDayMark,
    endMark: SchoolDayMark,
    rangeLabel: string,
  ) => {
    const starts = sorted.filter((a) => a.mark === startMark && !used.has(a.date));
    for (const start of starts) {
      const end = sorted.find(
        (a) => a.mark === endMark && !used.has(a.date) && a.date >= start.date,
      );
      if (end) {
        used.add(start.date);
        used.add(end.date);
        events.push({
          label: start.label || end.label || rangeLabel,
          startDate: start.date,
          endDate: end.date,
          startDateEthiopian: formatEthiopianDate(start.date),
          endDateEthiopian: formatEthiopianDate(end.date),
          type: markToEventType(startMark),
          mark: startMark,
        });
      }
    }
  };

  pair('mid-exam-start', 'mid-exam-end', 'Mid exam period');
  pair('semester-final-start', 'semester-final-end', 'Semester final exam period');

  for (const a of sorted) {
    if (used.has(a.date)) continue;
    used.add(a.date);
    events.push({
      label: a.label || defaultLabel(a.mark),
      startDate: a.date,
      endDate: a.date,
      startDateEthiopian: formatEthiopianDate(a.date),
      endDateEthiopian: formatEthiopianDate(a.date),
      type: markToEventType(a.mark),
      mark: a.mark,
    });
  }

  return events.sort((a, b) => a.startDate.localeCompare(b.startDate));
}

export function eventsToAssignments(events: AcademicCalendarEvent[]): DayAssignment[] {
  const assignments: DayAssignment[] = [];
  for (const event of events) {
    if (!event.mark) continue;
    if (event.startDate === event.endDate) {
      assignments.push({ date: event.startDate, mark: event.mark, label: event.label });
      continue;
    }
    if (event.mark === 'mid-exam-start' || event.mark === 'semester-final-start') {
      const endMark: SchoolDayMark =
        event.mark === 'mid-exam-start' ? 'mid-exam-end' : 'semester-final-end';
      assignments.push({ date: event.startDate, mark: event.mark, label: event.label });
      assignments.push({ date: event.endDate, mark: endMark, label: event.label });
    } else {
      // Expand multi-day break / other marks day-by-day
      const cursor = new Date(`${event.startDate}T12:00:00`);
      const end = new Date(`${event.endDate}T12:00:00`);
      while (cursor <= end) {
        const iso = cursor.toISOString().slice(0, 10);
        assignments.push({ date: iso, mark: event.mark, label: event.label });
        cursor.setDate(cursor.getDate() + 1);
      }
    }
  }
  return assignments;
}

export function assignmentForDay(
  assignments: DayAssignment[],
  iso: string,
): DayAssignment | undefined {
  return assignments.find((a) => a.date === iso);
}
