/**
 * Annual lesson plan types (template-aligned) and calendar week scaffolding.
 * Weeks are derived from the disseminated school calendar: holidays, breaks,
 * and exam windows reduce periods or mark whole weeks as non-teaching.
 */

import {
  ACADEMIC_YEAR_TOTAL_DAYS,
  MOE_ACADEMIC_YEAR_EC,
  WORKING_DAYS_SEMESTER_1,
  WORKING_DAYS_SEMESTER_2,
  buildMoeCalendarEvents,
  type WorkingDaysMonth,
} from './moeCalendarData';
import type { AcademicCalendar, AcademicCalendarEvent } from './mockData';
import {
  ETHIOPIAN_MONTHS,
  gregorianIsoToEthiopian,
} from './ethiopianCalendar';
import {
  calendarDateRange,
  eventsForDay,
  getCalendarBounds,
  isWeekdayIso,
} from './calendarPresentation';

export interface CalendarTeachingWeek {
  /** Stable id for merging AI output */
  id: string;
  semester: '1st semester' | '2nd semester';
  month: string;
  week: string;
  /** Day-of-month range within the Ethiopian month, e.g. "05-09" */
  date: string;
  /** Instructional periods available this week (0 = no school / non-teaching) */
  periodsAvailable: number;
  /** Mon–Fri teaching days remaining after calendar exclusions */
  teachingDays?: number;
  /** Total instructional minutes this week (periods × minutes/period) */
  minutesAvailable?: number;
  isTeachingWeek?: boolean;
  note?: string;
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
  minutesPerPeriod?: number;
  teachingAidsAvailable?: string[];
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

/** Aids teachers can select for annual plan generation. */
export const TEACHING_AID_OPTIONS = [
  'Textbook',
  'Chalkboard / whiteboard',
  'Charts',
  'Flash cards',
  'Poster / wall display',
  'Manipulatives / models',
  'Geometry instruments',
  'Scientific calculator',
  'Computer / laptop',
  'Projector / smart board',
  'Audio / speaker',
  'Laboratory equipment',
  'Worksheet / handout',
  'Globe / map',
  'Real-life objects',
] as const;

const NON_TEACHING_EVENT_TYPES = new Set(['holiday', 'break', 'exam']);
const NON_TEACHING_MARKS = new Set([
  'break',
  'quarter-break',
  'semester-break',
  'national-regional-exam',
  'model-exam-checkpoint',
  'mid-exam-start',
  'mid-exam-end',
  'semester-final-start',
  'semester-final-end',
  'student-registration',
  'teachers-development',
  'parent-conference',
  'student-orientation',
]);

/** MoE / school labels that are prep or non-instructional even if type is "moe". */
const NON_TEACHING_LABEL_RE =
  /start work for teachers|registering new students|class arrangement|parent.?student gathering|give out cards|ymuya|graduation/i;

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

function mondayOfWeek(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  const day = d.getDay(); // 0 Sun … 6 Sat
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

function isNonTeachingDay(events: AcademicCalendarEvent[], iso: string): boolean {
  return eventsForDay(events, iso).some(
    (e) =>
      NON_TEACHING_EVENT_TYPES.has(e.type) ||
      (e.mark != null && NON_TEACHING_MARKS.has(e.mark)) ||
      NON_TEACHING_LABEL_RE.test(e.label),
  );
}

function isTeachingDay(events: AcademicCalendarEvent[], iso: string): boolean {
  if (!isWeekdayIso(iso)) return false;
  return !isNonTeachingDay(events, iso);
}

/**
 * Instructional window = first day of class → end of school.
 * Ignores teacher work-start / registration prep before classes begin.
 */
function resolveInstructionalWindow(
  events: AcademicCalendarEvent[],
): { start: string; end: string } {
  const bounds = getCalendarBounds(events);

  const firstClass =
    events.find((e) => e.mark === 'first-day-of-school') ??
    events.find((e) => /first day of class/i.test(e.label));

  const endSchool =
    events.find((e) => e.mark === 'end-of-school') ??
    events.find((e) => /end of (school|class)|last day of class/i.test(e.label));

  let start = firstClass?.startDate ?? '';
  if (!start) {
    // Fallback: first weekday in Meskerem (Eth. month 1) within calendar bounds
    for (const iso of calendarDateRange(bounds.start, bounds.end)) {
      const ec = gregorianIsoToEthiopian(iso);
      if (ec.month === 1 && isWeekdayIso(iso) && !isNonTeachingDay(events, iso)) {
        start = iso;
        break;
      }
    }
  }
  if (!start) start = bounds.start;

  let end = endSchool?.endDate ?? '';
  if (!end) {
    // Prefer last teaching weekday before cards / end gatherings when possible
    const reverse = calendarDateRange(start, bounds.end).reverse();
    for (const iso of reverse) {
      if (isTeachingDay(events, iso)) {
        end = iso;
        break;
      }
    }
  }
  if (!end) end = bounds.end;
  if (end < start) end = bounds.end;

  return { start, end };
}

function semesterForEthMonth(month: number): CalendarTeachingWeek['semester'] {
  // Meskerem(1)–Tir(5) ≈ 1st; Yekatit(6)–Sene(10) ≈ 2nd
  return month <= 5 ? '1st semester' : '2nd semester';
}

/** Legacy month-table fallback when no calendar events are available. */
function weeksForMonth(
  month: WorkingDaysMonth,
  periodsPerWeek: number,
  daysPerWeek: number,
  minutesPerPeriod: number,
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
    dayCursor = endDay + 3;

    const periods =
      daysThisWeek >= daysPerWeek
        ? periodsPerWeek
        : Math.max(1, Math.round((periodsPerWeek * daysThisWeek) / daysPerWeek));

    weeks.push({
      id: `${month.key}-w${i + 1}`,
      semester,
      month: month.label.replace(' & Pagume', '').trim(),
      week: weekOrdinal(i + 1),
      date: `${pad2(Math.min(startDay, 30))}-${pad2(Math.min(endDay, 30))}`,
      periodsAvailable: periods,
      teachingDays: daysThisWeek,
      minutesAvailable: periods * minutesPerPeriod,
      isTeachingWeek: true,
      note:
        daysThisWeek < daysPerWeek
          ? `Short week — ${daysThisWeek} school days`
          : undefined,
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
  /** Minutes per period (40 for G9–10, 45 for G11–12, or custom) */
  minutesPerPeriod?: number;
  /** Prefer published calendar events when available */
  calendar?: AcademicCalendar | null;
}

/**
 * Build instructional week slots from the disseminated academic calendar.
 * Holidays / breaks / exams reduce teaching days and periods; full non-teaching
 * weeks are kept with periodsAvailable = 0 so pacing stays calendar-true.
 */
export function buildTeachingWeeksFromCalendar(
  options: BuildTeachingWeeksOptions,
): {
  weeks: CalendarTeachingWeek[];
  schoolDaysPerYear: number;
  academicYear: string;
  months: CalendarMonthDays[];
  daysPerWeek: number;
  minutesPerPeriod: number;
  teachingWeeksCount: number;
  nonTeachingWeeksCount: number;
  totalPeriods: number;
  totalMinutes: number;
} {
  const periodsPerWeek = Math.max(1, options.periodsPerWeek || 5);
  const minutesPerPeriod = Math.max(30, options.minutesPerPeriod || 45);
  const daysPerWeek = 5;

  const events =
    options.calendar?.events?.length
      ? options.calendar.events
      : buildMoeCalendarEvents();

  const bounds = options.calendar?.events?.length
    ? resolveInstructionalWindow(options.calendar.events)
    : (() => {
        const moe = buildMoeCalendarEvents();
        return resolveInstructionalWindow(moe);
      })();

  // Only school days inside the instructional window (first class → end of school)
  const allDays = calendarDateRange(bounds.start, bounds.end);
  const teachingIsos = allDays.filter((iso) => isTeachingDay(events, iso));

  // Group by Monday-start calendar week — only weekdays in the instructional window
  const byWeek = new Map<string, string[]>();
  for (const iso of allDays) {
    if (!isWeekdayIso(iso)) continue;
    const mon = mondayOfWeek(iso);
    const list = byWeek.get(mon) ?? [];
    list.push(iso);
    byWeek.set(mon, list);
  }

  const sortedWeekStarts = [...byWeek.keys()].sort();
  const weeks: CalendarTeachingWeek[] = [];
  const monthDayCounts = new Map<string, CalendarMonthDays>();
  const monthWeekOrdinal = new Map<string, number>();

  for (const mon of sortedWeekStarts) {
    const weekdays = (byWeek.get(mon) ?? []).sort();
    if (weekdays.length === 0) continue;

    const teachingDays = weekdays.filter((iso) => isTeachingDay(events, iso));
    const anchor = teachingDays[0] ?? weekdays[0];
    const ec = gregorianIsoToEthiopian(anchor);
    const monthName = ETHIOPIAN_MONTHS[ec.month - 1] ?? `Month ${ec.month}`;
    const monthKey = `${ec.year}-${ec.month}`;
    const ord = (monthWeekOrdinal.get(monthKey) ?? 0) + 1;
    monthWeekOrdinal.set(monthKey, ord);

    const lastEc = gregorianIsoToEthiopian(teachingDays[teachingDays.length - 1] ?? weekdays[weekdays.length - 1]);
    const startDay = ec.day;
    const endDay = lastEc.month === ec.month ? lastEc.day : ec.day + teachingDays.length - 1;

    let periodsAvailable = 0;
    let note: string | undefined;
    if (teachingDays.length === 0) {
      const reasons = weekdays
        .flatMap((iso) => eventsForDay(events, iso))
        .filter(
          (e) =>
            NON_TEACHING_EVENT_TYPES.has(e.type) ||
            (e.mark != null && NON_TEACHING_MARKS.has(e.mark)),
        )
        .map((e) => e.label);
      const unique = [...new Set(reasons)].slice(0, 2);
      note = unique.length
        ? `No school — ${unique.join('; ')}`
        : 'No school this week';
      periodsAvailable = 0;
    } else if (teachingDays.length < daysPerWeek) {
      periodsAvailable = Math.max(
        1,
        Math.round((periodsPerWeek * teachingDays.length) / daysPerWeek),
      );
      note = `Short week — ${teachingDays.length} teaching day${teachingDays.length === 1 ? '' : 's'}`;
    } else {
      periodsAvailable = periodsPerWeek;
    }

    // Skip trailing prep-only weeks before first teaching day of year
    if (weeks.length === 0 && teachingDays.length === 0) {
      continue;
    }

    weeks.push({
      id: `${monthKey}-w${ord}`,
      semester: semesterForEthMonth(ec.month),
      month: monthName,
      week: weekOrdinal(ord),
      date: `${pad2(Math.min(startDay, 30))}-${pad2(Math.min(endDay, 30))}`,
      periodsAvailable,
      teachingDays: teachingDays.length,
      minutesAvailable: periodsAvailable * minutesPerPeriod,
      isTeachingWeek: teachingDays.length > 0,
      note,
    });

    if (teachingDays.length > 0) {
      const existing = monthDayCounts.get(monthKey);
      const add = teachingDays.length;
      if (existing) {
        existing.days += add;
      } else {
        monthDayCounts.set(monthKey, {
          key: monthKey,
          label: monthName,
          days: add,
          semester: ec.month <= 5 ? 1 : 2,
        });
      }
    }
  }

  // Trim trailing non-teaching weeks after last teaching week
  while (weeks.length && !weeks[weeks.length - 1].isTeachingWeek) {
    weeks.pop();
  }

  let months = [...monthDayCounts.values()];
  let schoolDays = teachingIsos.length;

  // Fallback to static MOE month table if calendar produced nothing useful
  if (weeks.filter((w) => w.isTeachingWeek).length === 0) {
    const fallback: CalendarTeachingWeek[] = [];
    for (const month of [
      ...WORKING_DAYS_SEMESTER_1.filter((m) => m.semester === 1),
      ...WORKING_DAYS_SEMESTER_2.filter((m) => m.semester === 2),
    ]) {
      const startHint = month.key === 'meskerem' ? 5 : 1;
      fallback.push(
        ...weeksForMonth(month, periodsPerWeek, daysPerWeek, minutesPerPeriod, startHint),
      );
    }
    weeks.splice(0, weeks.length, ...fallback);
    months = [
      ...WORKING_DAYS_SEMESTER_1.filter((m) => m.semester === 1),
      ...WORKING_DAYS_SEMESTER_2.filter((m) => m.semester === 2),
    ].map((m) => ({
      key: m.key,
      label: m.label,
      days: m.days,
      semester: m.semester as 1 | 2,
    }));
    schoolDays = months.reduce((sum, m) => sum + m.days, 0);
  }

  const teachingWeeks = weeks.filter((w) => (w.periodsAvailable ?? 0) > 0);
  const totalPeriods = teachingWeeks.reduce((s, w) => s + w.periodsAvailable, 0);
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
    minutesPerPeriod,
    teachingWeeksCount: teachingWeeks.length,
    nonTeachingWeeksCount: weeks.length - teachingWeeks.length,
    totalPeriods,
    totalMinutes: totalPeriods * minutesPerPeriod,
  };
}

/** Non-instructional windows from disseminated calendar (exams / breaks). */
export function summarizeNonTeachingWindows(
  events: AcademicCalendarEvent[] = [],
): string[] {
  return events
    .filter(
      (e) =>
        e.type === 'exam' ||
        e.type === 'break' ||
        e.type === 'holiday' ||
        (e.mark != null && NON_TEACHING_MARKS.has(e.mark)),
    )
    .slice(0, 24)
    .map(
      (e) =>
        `${e.label} (${e.startDateEthiopian || e.startDate} → ${e.endDateEthiopian || e.endDate})`,
    );
}

export function mergeAiWeeksOntoCalendar(
  calendarWeeks: CalendarTeachingWeek[],
  aiWeeks: Partial<AnnualLessonPlanWeekRow>[] | undefined,
  options?: { teachingAidsAvailable?: string[] },
): AnnualLessonPlanWeekRow[] {
  const byKey = new Map<string, Partial<AnnualLessonPlanWeekRow>>();
  for (const row of aiWeeks ?? []) {
    const key = `${row.month}|${row.week}|${row.date}`;
    byKey.set(key, row);
    byKey.set(`${row.month}|${row.week}`, row);
  }

  const aidsFallback = options?.teachingAidsAvailable?.length
    ? options.teachingAidsAvailable.slice(0, 4)
    : undefined;

  return calendarWeeks.map((slot, index) => {
    const match =
      byKey.get(`${slot.month}|${slot.week}|${slot.date}`) ||
      byKey.get(`${slot.month}|${slot.week}`) ||
      aiWeeks?.[index];

    if (!slot.isTeachingWeek || slot.periodsAvailable <= 0) {
      return {
        semester: slot.semester,
        month: slot.month,
        week: slot.week,
        date: slot.date,
        unit: '—',
        contents: [slot.note || 'No school / non-teaching week'],
        periodsNeeded: 0,
        page: '—',
        generalObjectives: [],
        teachingMethods: [],
        teachingAids: [],
        evaluationMethods: [],
        homework: [],
        comments: slot.note || 'No instructional periods this week (calendar)',
      };
    }

    const aidsRaw = Array.isArray(match?.teachingAids) ? match!.teachingAids! : [];
    const aids =
      aidsFallback && aidsRaw.length
        ? aidsRaw.filter((a) =>
            aidsFallback.some((allowed) => a.toLowerCase().includes(allowed.toLowerCase().slice(0, 8))),
          )
        : aidsRaw;
    const teachingAids =
      aids.length > 0
        ? aids
        : aidsFallback ?? ['Textbook', 'Chalkboard / whiteboard'];

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
      teachingAids,
      evaluationMethods: Array.isArray(match?.evaluationMethods)
        ? match!.evaluationMethods!
        : [],
      homework: Array.isArray(match?.homework) ? match!.homework! : [],
      comments: match?.comments || slot.note || '',
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
