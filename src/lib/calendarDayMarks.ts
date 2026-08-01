import type { AcademicCalendarEvent } from './mockData';
import { formatEthiopianDate } from './ethiopianCalendar';

/** Day assignment options for the school-head calendar editor. */
export type SchoolDayMark =
  | 'parent-conference'
  | 'teachers-development'
  | 'student-registration'
  | 'national-regional-exam'
  | 'model-exam-checkpoint'
  | 'student-orientation'
  | 'break'
  | 'first-day-of-school'
  | 'end-of-school'
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
  { value: 'parent-conference', label: 'Parent conference' },
  { value: 'teachers-development', label: 'Teachers development' },
  { value: 'student-registration', label: 'Student registration' },
  { value: 'national-regional-exam', label: 'National and regional exam' },
  { value: 'model-exam-checkpoint', label: 'Model exams / checkpoints' },
  { value: 'student-orientation', label: 'Student orientation' },
  { value: 'break', label: 'Break' },
  { value: 'first-day-of-school', label: 'First day of school' },
  { value: 'end-of-school', label: 'End of school' },
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
const MID_EXAM_COLOR = {
  bg: 'bg-sky-100',
  text: 'text-sky-900',
  chip: 'bg-sky-100 text-sky-800 ring-1 ring-sky-200',
  legend: 'Mid exam',
  ring: 'ring-sky-200',
  ec: 'text-sky-700/80',
};

const FINAL_EXAM_COLOR = {
  bg: 'bg-teal-50',
  text: 'text-teal-900',
  chip: 'bg-teal-50 text-teal-800 ring-1 ring-teal-200',
  legend: 'Final exam',
  ring: 'ring-teal-200',
  ec: 'text-teal-700/80',
};

const BREAK_COLOR = {
  bg: 'bg-amber-50',
  text: 'text-amber-900',
  chip: 'bg-amber-50 text-amber-800 ring-1 ring-amber-200',
  legend: 'Break',
  ring: 'ring-amber-200',
  ec: 'text-amber-700/80',
};

export const DAY_MARK_COLORS: Record<
  SchoolDayMark,
  { bg: string; text: string; chip: string; legend: string; ring?: string; ec?: string }
> = {
  'parent-conference': {
    bg: 'bg-indigo-50',
    text: 'text-indigo-900',
    chip: 'bg-indigo-50 text-indigo-800 ring-1 ring-indigo-200',
    legend: 'Parent conference',
    ring: 'ring-indigo-200',
    ec: 'text-indigo-700/80',
  },
  'teachers-development': {
    bg: 'bg-fuchsia-50',
    text: 'text-fuchsia-900',
    chip: 'bg-fuchsia-50 text-fuchsia-800 ring-1 ring-fuchsia-200',
    legend: 'Teachers development',
    ring: 'ring-fuchsia-200',
    ec: 'text-fuchsia-700/80',
  },
  'student-registration': {
    bg: 'bg-cyan-50',
    text: 'text-cyan-900',
    chip: 'bg-cyan-50 text-cyan-800 ring-1 ring-cyan-200',
    legend: 'Student registration',
    ring: 'ring-cyan-200',
    ec: 'text-cyan-700/80',
  },
  'national-regional-exam': {
    bg: 'bg-violet-50',
    text: 'text-violet-900',
    chip: 'bg-violet-50 text-violet-800 ring-1 ring-violet-200',
    legend: 'National / regional exam',
    ring: 'ring-violet-200',
    ec: 'text-violet-700/80',
  },
  'model-exam-checkpoint': {
    bg: 'bg-blue-50',
    text: 'text-blue-900',
    chip: 'bg-blue-50 text-blue-800 ring-1 ring-blue-200',
    legend: 'Model exam / checkpoint',
    ring: 'ring-blue-200',
    ec: 'text-blue-700/80',
  },
  'student-orientation': {
    bg: 'bg-lime-50',
    text: 'text-lime-900',
    chip: 'bg-lime-50 text-lime-800 ring-1 ring-lime-200',
    legend: 'Student orientation',
    ring: 'ring-lime-200',
    ec: 'text-lime-700/80',
  },
  break: BREAK_COLOR,
  'first-day-of-school': {
    bg: 'bg-emerald-50',
    text: 'text-emerald-900',
    chip: 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200',
    legend: 'First day of school',
    ring: 'ring-emerald-200',
    ec: 'text-emerald-700/80',
  },
  'end-of-school': {
    bg: 'bg-stone-100',
    text: 'text-stone-900',
    chip: 'bg-stone-100 text-stone-800 ring-1 ring-stone-300',
    legend: 'End of school',
    ring: 'ring-stone-300',
    ec: 'text-stone-700/80',
  },
  'mid-exam-start': MID_EXAM_COLOR,
  'mid-exam-end': MID_EXAM_COLOR,
  'quarter-end': {
    bg: 'bg-violet-50',
    text: 'text-violet-900',
    chip: 'bg-violet-50 text-violet-800 ring-1 ring-violet-200',
    legend: 'Quarter end',
    ring: 'ring-violet-200',
    ec: 'text-violet-700/80',
  },
  'quarter-break': BREAK_COLOR,
  'semester-break': BREAK_COLOR,
  'semester-final-start': FINAL_EXAM_COLOR,
  'semester-final-end': FINAL_EXAM_COLOR,
  other: {
    bg: 'bg-rose-50',
    text: 'text-rose-900',
    chip: 'bg-rose-50 text-rose-800 ring-1 ring-rose-200',
    legend: 'Other / custom',
    ring: 'ring-rose-200',
    ec: 'text-rose-700/80',
  },
};

/** Collapsed legend — one entry per shared color group. */
export const DAY_MARK_LEGEND: { mark: SchoolDayMark; label: string; className: string }[] = [
  { mark: 'parent-conference', label: 'Parent conference', className: DAY_MARK_COLORS['parent-conference'].chip },
  { mark: 'teachers-development', label: 'Teachers development', className: DAY_MARK_COLORS['teachers-development'].chip },
  { mark: 'student-registration', label: 'Student registration', className: DAY_MARK_COLORS['student-registration'].chip },
  { mark: 'national-regional-exam', label: 'National / regional exam', className: DAY_MARK_COLORS['national-regional-exam'].chip },
  { mark: 'model-exam-checkpoint', label: 'Model exam / checkpoint', className: DAY_MARK_COLORS['model-exam-checkpoint'].chip },
  { mark: 'student-orientation', label: 'Student orientation', className: DAY_MARK_COLORS['student-orientation'].chip },
  { mark: 'break', label: 'Break', className: BREAK_COLOR.chip },
  { mark: 'first-day-of-school', label: 'First day of school', className: DAY_MARK_COLORS['first-day-of-school'].chip },
  { mark: 'end-of-school', label: 'End of school', className: DAY_MARK_COLORS['end-of-school'].chip },
  { mark: 'mid-exam-start', label: 'Mid exam', className: MID_EXAM_COLOR.chip },
  { mark: 'quarter-end', label: 'Quarter end', className: DAY_MARK_COLORS['quarter-end'].chip },
  { mark: 'semester-final-start', label: 'Final exam', className: FINAL_EXAM_COLOR.chip },
  { mark: 'other', label: 'Other / custom', className: DAY_MARK_COLORS.other.chip },
];

function markToEventType(mark: SchoolDayMark): AcademicCalendarEvent['type'] {
  switch (mark) {
    case 'mid-exam-start':
    case 'mid-exam-end':
    case 'semester-final-start':
    case 'semester-final-end':
    case 'national-regional-exam':
    case 'model-exam-checkpoint':
      return 'exam';
    case 'break':
    case 'quarter-break':
    case 'semester-break':
      return 'break';
    case 'quarter-end':
    case 'first-day-of-school':
    case 'end-of-school':
      return 'term';
    case 'parent-conference':
    case 'teachers-development':
    case 'student-registration':
    case 'student-orientation':
      return 'moe';
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
      if (used.has(start.date)) continue;
      const end = sorted.find(
        (a) => a.mark === endMark && !used.has(a.date) && a.date >= start.date,
      );
      if (end) {
        used.add(start.date);
        used.add(end.date);
        for (const a of sorted) {
          if (
            !used.has(a.date) &&
            (a.mark === startMark || a.mark === endMark) &&
            a.date > start.date &&
            a.date < end.date
          ) {
            used.add(a.date);
          }
        }
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
      // Fill between days with the same mark family so colors stay consistent when editing
      const cursor = new Date(`${event.startDate}T12:00:00`);
      cursor.setDate(cursor.getDate() + 1);
      const end = new Date(`${event.endDate}T12:00:00`);
      while (cursor < end) {
        const iso = cursor.toISOString().slice(0, 10);
        assignments.push({ date: iso, mark: event.mark, label: event.label });
        cursor.setDate(cursor.getDate() + 1);
      }
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
