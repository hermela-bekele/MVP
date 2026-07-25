import type { AcademicCalendarEvent } from './mockData';
import { formatEthiopianDate } from './ethiopianCalendar';
import { getEthiopiaPublicHolidaysInRange } from './ethiopiaPublicHolidays';

export interface GenerateCalendarInput {
  academicYear: string;
  title: string;
  moeReference: string;
  moeStartDate: string;
  moeEndDate: string;
  quarters: number;
  quarterBreakWeeks: number;
  semesterBreakWeeks: number;
  midExamCount: number;
  midExamDays?: number;
  finalExamWeeks?: number;
}

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function daysBetween(start: string, end: string): number {
  const a = new Date(`${start}T12:00:00`);
  const b = new Date(`${end}T12:00:00`);
  return Math.max(1, Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24)) + 1);
}

function withEthiopianDates(
  event: Omit<AcademicCalendarEvent, 'startDateEthiopian' | 'endDateEthiopian'>,
): AcademicCalendarEvent {
  return {
    ...event,
    startDateEthiopian: formatEthiopianDate(event.startDate),
    endDateEthiopian: formatEthiopianDate(event.endDate),
  };
}

/** Which quarter numbers (1-based) end with a mid exam before the break. */
export function midExamQuarterNumbers(quarters: number, midExamCount: number): number[] {
  if (midExamCount <= 0 || quarters <= 1) return [];
  const slots = Math.min(midExamCount, quarters - 1);
  const result = new Set<number>();
  for (let i = 1; i <= slots; i++) {
    const q = Math.round((i * (quarters - 1)) / slots);
    result.add(Math.max(1, Math.min(quarters - 1, q)));
  }
  return [...result].sort((a, b) => a - b);
}

/** Quarter after which the long semester break is placed. */
export function semesterBreakAfterQuarter(quarters: number): number {
  if (quarters <= 1) return 0;
  if (quarters === 2) return 1;
  return Math.floor(quarters / 2);
}

export function generateSchoolCalendar(input: GenerateCalendarInput): AcademicCalendarEvent[] {
  const quarters = Math.min(4, Math.max(2, input.quarters));
  const quarterBreakWeeks = Math.max(0, input.quarterBreakWeeks);
  const semesterBreakWeeks = Math.max(1, input.semesterBreakWeeks);
  const midExamCount = Math.max(0, Math.min(quarters - 1, input.midExamCount));
  const midExamDays = Math.max(1, input.midExamDays ?? 5);
  const finalExamWeeks = Math.max(1, input.finalExamWeeks ?? 3);

  const holidays = getEthiopiaPublicHolidaysInRange(input.moeStartDate, input.moeEndDate);
  const holidayDays = holidays.length;
  const midExamQuarters = midExamQuarterNumbers(quarters, midExamCount);
  const semesterAfter = semesterBreakAfterQuarter(quarters);

  const quarterBreakDays = quarterBreakWeeks * 7;
  const semesterBreakDays = semesterBreakWeeks * 7;
  const quarterGapCount = Math.max(0, quarters - 1 - (quarters > 1 ? 1 : 0));
  const midExamTotalDays = midExamQuarters.length * midExamDays;
  const finalExamDays = finalExamWeeks * 7;

  const totalDays = daysBetween(input.moeStartDate, input.moeEndDate);
  const reservedDays =
    holidayDays +
    quarterGapCount * quarterBreakDays +
    semesterBreakDays +
    midExamTotalDays +
    finalExamDays;

  const instructionDays = Math.max(quarters * 14, totalDays - reservedDays);
  const quarterLength = Math.floor(instructionDays / quarters);

  const events: AcademicCalendarEvent[] = [
    withEthiopianDates({
      label: 'MOE Academic Year Window',
      startDate: input.moeStartDate,
      endDate: input.moeEndDate,
      type: 'moe',
    }),
  ];

  let cursor = input.moeStartDate;
  let midExamIndex = 0;

  for (let q = 1; q <= quarters; q++) {
    const termStart = cursor;
    const termEnd = addDays(termStart, quarterLength - 1);
    events.push(
      withEthiopianDates({
        label: `Quarter ${q}`,
        startDate: termStart,
        endDate: termEnd,
        type: 'term',
      }),
    );
    cursor = addDays(termEnd, 1);

    if (midExamQuarters.includes(q)) {
      midExamIndex += 1;
      const examEnd = addDays(cursor, midExamDays - 1);
      events.push(
        withEthiopianDates({
          label: `Mid Exam ${midExamIndex} (after Quarter ${q})`,
          startDate: cursor,
          endDate: examEnd,
          type: 'exam',
        }),
      );
      cursor = addDays(examEnd, 1);
    }

    if (q < quarters) {
      const isSemesterBreak = q === semesterAfter;
      const breakDays = isSemesterBreak ? semesterBreakDays : quarterBreakDays;
      if (breakDays > 0) {
        const breakEnd = addDays(cursor, breakDays - 1);
        events.push(
          withEthiopianDates({
            label: isSemesterBreak
              ? `Semester Break (after Quarter ${q})`
              : `Quarter Break (after Quarter ${q})`,
            startDate: cursor,
            endDate: breakEnd,
            type: 'break',
          }),
        );
        cursor = addDays(breakEnd, 1);
      }
    }
  }

  const finalStart = cursor;
  const finalEnd = addDays(finalStart, finalExamDays - 1);
  if (finalEnd <= input.moeEndDate) {
    events.push(
      withEthiopianDates({
        label: 'Final Exam Period',
        startDate: finalStart,
        endDate: finalEnd,
        type: 'exam',
      }),
    );
  } else {
    events.push(
      withEthiopianDates({
        label: 'Final Exam Period',
        startDate: addDays(input.moeEndDate, -(finalExamDays - 1)),
        endDate: input.moeEndDate,
        type: 'exam',
      }),
    );
  }

  for (const holiday of holidays) {
    events.push(
      withEthiopianDates({
        label: holiday.label,
        startDate: holiday.startDate,
        endDate: holiday.endDate,
        type: 'holiday',
      }),
    );
  }

  return events.sort((a, b) => a.startDate.localeCompare(b.startDate));
}

export function calendarEventBadgeVariant(
  type: AcademicCalendarEvent['type'],
): 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral' {
  switch (type) {
    case 'moe':
      return 'primary';
    case 'term':
      return 'success';
    case 'break':
      return 'warning';
    case 'holiday':
      return 'danger';
    case 'exam':
      return 'info';
    case 'other':
      return 'neutral';
    default:
      return 'neutral';
  }
}
