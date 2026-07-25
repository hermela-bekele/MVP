/**
 * Annual lesson plan types (template-aligned) and calendar week scaffolding.
 * Calendar weeks come from the disseminated / MOE school calendar;
 * AI fills textbook-grounded teaching columns per week.
 */

import {
  ACADEMIC_YEAR_TOTAL_DAYS,
  MOE_ACADEMIC_YEAR_EC,
  WORKING_DAYS_SEMESTER_1,
  WORKING_DAYS_SEMESTER_2,
  type WorkingDaysMonth,
} from './moeCalendarData';
import type { AcademicCalendar, AcademicCalendarEvent } from './mockData';

export interface CalendarTeachingWeek {
  /** Stable id for merging AI output */
  id: string;
  semester: '1st semester' | '2nd semester';
  month: string;
  week: string;
  /** Day-of-month range within the Ethiopian month, e.g. "05-09" */
  date: string;
  periodsAvailable: number;
}

/** One row in the annual lesson plan table (matches school template). */
export interface AnnualLessonPlanWeekRow {
  semester: string;
  month: string;
  week: string;
  date: string;
  unit: string;
  contents: string[];
  periodsNeeded: number;
  page: string;
  generalObjectives: string[];
  teachingMethods: string[];
  teachingAids: string[];
  evaluationMethods: string[];
  /** Textbook homework: Exercise N.M + printed page */
  homework?: string[];
  comments?: string;
}

export interface AnnualLessonPlanMeta {
  academicYear: string;
  schoolName: string;
  teacherName: string;
  grade: string;
  subject: string;
  schoolDaysPerYear: number;
  periodsPerWeek: number;
  periodsPerYear: number;
  referenceMaterials: string;
  generalObjectives: string[];
}

export interface AnnualLessonPlanResult {
  type: 'yearly';
  subject: string;
  mainTopic: string;
  subTopic: string;
  prerequisiteKnowledge?: string;
  rationale?: string;
  objectives: string[];
  meta: AnnualLessonPlanMeta;
  weeks: AnnualLessonPlanWeekRow[];
  sources?: { page?: number | string; topic?: string }[];
}

function weekOrdinal(n: number): string {
  const j = n % 10;
  const k = n % 100;
  if (j === 1 && k !== 11) return `${n}st`;
  if (j === 2 && k !== 12) return `${n}nd`;
  if (j === 3 && k !== 13) return `${n}rd`;
  return `${n}th`;
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** Split a month's working days into week chunks of `daysPerWeek`. */
function weeksForMonth(
  month: WorkingDaysMonth,
  periodsPerWeek: number,
  daysPerWeek: number,
  startDayHint = 1,
): CalendarTeachingWeek[] {
  if (month.semester === 'prep' || month.days <= 0) return [];

  const semester: CalendarTeachingWeek['semester'] =
    month.semester === 1 ? '1st semester' : '2nd semester';

  const weekCount = Math.max(1, Math.ceil(month.days / daysPerWeek));
  const weeks: CalendarTeachingWeek[] = [];
  let dayCursor = Math.max(1, startDayHint);

  for (let i = 0; i < weekCount; i++) {
    const daysThisWeek = Math.min(daysPerWeek, month.days - i * daysPerWeek);
    if (daysThisWeek <= 0) break;
    const startDay = dayCursor;
    const endDay = startDay + daysThisWeek - 1;
    dayCursor = endDay + 3; // leave a small gap mimicking weekend spacing in the template

    const weekLabel = weekOrdinal(i + 1);
    weeks.push({
      id: `${month.key}-w${i + 1}`,
      semester,
      month: month.label.replace(' & Pagume', '').replace('Nehase', 'Nehase').trim(),
      week: weekLabel,
      date: `${pad2(Math.min(startDay, 30))}-${pad2(Math.min(endDay, 30))}`,
      periodsAvailable: periodsPerWeek,
    });
  }

  return weeks;
}

export interface CalendarMonthDays {
  key: string;
  label: string;
  days: number;
  semester: 1 | 2;
}

export interface BuildTeachingWeeksOptions {
  periodsPerWeek: number;
  /** Prefer published calendar title/year when available */
  calendar?: AcademicCalendar | null;
}

/**
 * Build instructional week slots from academic-calendar working days by month.
 * School days/month and year total come from the disseminated calendar (MOE working-day table).
 * Days-per-week is fixed at 5 (Ethiopian school week); only periods/week is school/subject-specific.
 */
export function buildTeachingWeeksFromCalendar(
  options: BuildTeachingWeeksOptions,
): {
  weeks: CalendarTeachingWeek[];
  schoolDaysPerYear: number;
  academicYear: string;
  months: CalendarMonthDays[];
  daysPerWeek: number;
} {
  const periodsPerWeek = Math.max(1, options.periodsPerWeek || 5);
  const daysPerWeek = 5; // school calendar week — not a form input

  const months: CalendarMonthDays[] = [
    ...WORKING_DAYS_SEMESTER_1.filter((m) => m.semester === 1),
    ...WORKING_DAYS_SEMESTER_2.filter((m) => m.semester === 2),
  ].map((m) => ({
    key: m.key,
    label: m.label,
    days: m.days,
    semester: m.semester as 1 | 2,
  }));

  // Meskerem starts near day 5 (first day of class in MOE calendar)
  const weeks: CalendarTeachingWeek[] = [];
  for (const month of [
    ...WORKING_DAYS_SEMESTER_1.filter((m) => m.semester === 1),
    ...WORKING_DAYS_SEMESTER_2.filter((m) => m.semester === 2),
  ]) {
    const startHint = month.key === 'meskerem' ? 5 : 1;
    weeks.push(...weeksForMonth(month, periodsPerWeek, daysPerWeek, startHint));
  }

  const schoolDays = months.reduce((sum, m) => sum + m.days, 0);
  const academicYear =
    options.calendar?.academicYear ||
    options.calendar?.title ||
    MOE_ACADEMIC_YEAR_EC;

  return {
    weeks,
    schoolDaysPerYear: schoolDays || ACADEMIC_YEAR_TOTAL_DAYS,
    academicYear,
    months,
    daysPerWeek,
  };
}

/** Non-instructional windows from disseminated calendar (exams / breaks). */
export function summarizeNonTeachingWindows(
  events: AcademicCalendarEvent[] = [],
): string[] {
  return events
    .filter((e) => e.type === 'exam' || e.type === 'break' || e.type === 'holiday')
    .slice(0, 16)
    .map(
      (e) =>
        `${e.label} (${e.startDateEthiopian || e.startDate} → ${e.endDateEthiopian || e.endDate})`,
    );
}

export function mergeAiWeeksOntoCalendar(
  calendarWeeks: CalendarTeachingWeek[],
  aiWeeks: Partial<AnnualLessonPlanWeekRow>[] | undefined,
): AnnualLessonPlanWeekRow[] {
  const byKey = new Map<string, Partial<AnnualLessonPlanWeekRow>>();
  for (const row of aiWeeks ?? []) {
    const key = `${row.month}|${row.week}|${row.date}`;
    byKey.set(key, row);
    byKey.set(`${row.month}|${row.week}`, row);
  }

  return calendarWeeks.map((slot, index) => {
    const match =
      byKey.get(`${slot.month}|${slot.week}|${slot.date}`) ||
      byKey.get(`${slot.month}|${slot.week}`) ||
      aiWeeks?.[index];

    return {
      semester: slot.semester,
      month: slot.month,
      week: slot.week,
      date: slot.date,
      unit: match?.unit?.trim() || '',
      contents: Array.isArray(match?.contents) ? match!.contents! : [],
      periodsNeeded: match?.periodsNeeded ?? slot.periodsAvailable,
      page: match?.page?.toString() || '',
      generalObjectives: Array.isArray(match?.generalObjectives)
        ? match!.generalObjectives!
        : [],
      teachingMethods: Array.isArray(match?.teachingMethods) ? match!.teachingMethods! : [],
      teachingAids: Array.isArray(match?.teachingAids) ? match!.teachingAids! : [],
      evaluationMethods: Array.isArray(match?.evaluationMethods)
        ? match!.evaluationMethods!
        : [],
      homework: Array.isArray(match?.homework) ? match!.homework! : [],
      comments: match?.comments || '',
    };
  });
}

/** Rowspan helpers for semester / month / unit columns in HTML & docx. */
export function computeRowSpans(
  weeks: AnnualLessonPlanWeekRow[],
  field: 'semester' | 'month' | 'unit',
): number[] {
  const spans = new Array(weeks.length).fill(0);
  let i = 0;
  while (i < weeks.length) {
    let j = i + 1;
    while (j < weeks.length && weeks[j][field] === weeks[i][field] && weeks[i][field]) {
      j++;
    }
    spans[i] = j - i;
    for (let k = i + 1; k < j; k++) spans[k] = 0;
    i = j;
  }
  return spans;
}
