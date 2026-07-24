import type { AcademicCalendarEvent } from './mockData';
import { ethiopianToGregorianIso, formatEthiopianDate } from './ethiopianCalendar';
import { getEthiopiaPublicHolidaysInRange } from './ethiopiaPublicHolidays';

/** MOE academic year referenced in the circular (E.C. 2018/2019). */
export const MOE_ACADEMIC_YEAR_EC = '2018/2019 E.C.';
export const MOE_ACADEMIC_YEAR_TITLE = 'MOE Academic Calendar — 2018/2019 E.C.';
export const MOE_REFERENCE = 'MOE School Calendar Circular — Academic Year 2018/2019 E.C.';

export interface WorkingDaysMonth {
  key: string;
  label: string;
  days: number;
  semester: 1 | 2 | 'prep';
}

export interface MoeActivity {
  id: string;
  label: string;
  startEc: { year: number; month: number; day: number };
  endEc: { year: number; month: number; day: number };
  type: AcademicCalendarEvent['type'];
}

export const WORKING_DAYS_SEMESTER_1: WorkingDaysMonth[] = [
  { key: 'nehase-pagume', label: 'Nehase & Pagume', days: 9, semester: 'prep' },
  { key: 'meskerem', label: 'Meskerem', days: 20, semester: 1 },
  { key: 'tikmit', label: 'Tikmit', days: 21, semester: 1 },
  { key: 'hidar', label: 'Hidar', days: 22, semester: 1 },
  { key: 'tahisas', label: 'Tahisas', days: 21, semester: 1 },
  { key: 'tir', label: 'Tir', days: 14, semester: 1 },
];

export const WORKING_DAYS_SEMESTER_2: WorkingDaysMonth[] = [
  { key: 'yekatit', label: 'Yekatit', days: 20, semester: 2 },
  { key: 'megabit', label: 'Megabit', days: 22, semester: 2 },
  { key: 'miyaziya', label: 'Miyaziya', days: 19, semester: 2 },
  { key: 'ginbot', label: 'Ginbot', days: 21, semester: 2 },
  { key: 'sene', label: 'Sene', days: 21, semester: 2 },
];

export const SEMESTER_1_TOTAL = 107;
export const SEMESTER_2_TOTAL = 103;
export const ACADEMIC_YEAR_TOTAL_DAYS = 210;

/** Major MOE activities for E.C. 2018/2019 (Ethiopian month index: Meskerem=1 … Pagume=13). */
export const MOE_MAJOR_ACTIVITIES: MoeActivity[] = [
  {
    id: 'teachers-start',
    label: 'Start work for teachers',
    startEc: { year: 2018, month: 12, day: 25 },
    endEc: { year: 2018, month: 12, day: 25 },
    type: 'moe',
  },
  {
    id: 'registration',
    label: 'Registering new students',
    startEc: { year: 2018, month: 12, day: 26 },
    endEc: { year: 2018, month: 13, day: 5 },
    type: 'moe',
  },
  {
    id: 'class-arrangement',
    label: 'Class arrangement announcement',
    startEc: { year: 2019, month: 1, day: 4 },
    endEc: { year: 2019, month: 1, day: 4 },
    type: 'moe',
  },
  {
    id: 'first-day',
    label: 'First day of class',
    startEc: { year: 2019, month: 1, day: 5 },
    endEc: { year: 2019, month: 1, day: 5 },
    type: 'term',
  },
  {
    id: 'radio-s1',
    label: 'Radio education broadcast',
    startEc: { year: 2019, month: 1, day: 11 },
    endEc: { year: 2019, month: 1, day: 11 },
    type: 'moe',
  },
  {
    id: 's1-model-exam',
    label: 'First semester regional model exam',
    startEc: { year: 2019, month: 5, day: 3 },
    endEc: { year: 2019, month: 5, day: 7 },
    type: 'exam',
  },
  {
    id: 's1-final',
    label: 'First semester final exam',
    startEc: { year: 2019, month: 5, day: 17 },
    endEc: { year: 2019, month: 5, day: 21 },
    type: 'exam',
  },
  {
    id: 's1-break',
    label: 'Break for students / grading period for teachers',
    startEc: { year: 2019, month: 5, day: 24 },
    endEc: { year: 2019, month: 5, day: 28 },
    type: 'break',
  },
  {
    id: 'cards-s1',
    label: 'Parent–student gathering — give out cards',
    startEc: { year: 2019, month: 6, day: 1 },
    endEc: { year: 2019, month: 6, day: 1 },
    type: 'moe',
  },
  {
    id: 'radio-s2',
    label: 'Second semester radio education broadcasting',
    startEc: { year: 2019, month: 6, day: 8 },
    endEc: { year: 2019, month: 6, day: 8 },
    type: 'moe',
  },
  {
    id: 'g6-g8-model',
    label: 'Grade 6 & 8 regional model exam',
    startEc: { year: 2019, month: 9, day: 23 },
    endEc: { year: 2019, month: 9, day: 27 },
    type: 'exam',
  },
  {
    id: 'ymuya',
    label: 'Ymuya tmrt graduation',
    startEc: { year: 2019, month: 10, day: 1 },
    endEc: { year: 2019, month: 10, day: 6 },
    type: 'moe',
  },
  {
    id: 'g6-final',
    label: 'Grade 6 final exam / 2nd semester regional model exam',
    startEc: { year: 2019, month: 10, day: 7 },
    endEc: { year: 2019, month: 10, day: 11 },
    type: 'exam',
  },
  {
    id: 'g8-final',
    label: 'Grade 8 final exam / 2nd semester final exam',
    startEc: { year: 2019, month: 10, day: 14 },
    endEc: { year: 2019, month: 10, day: 18 },
    type: 'exam',
  },
  {
    id: 'g12-exam',
    label: '12th grade exam',
    startEc: { year: 2019, month: 10, day: 21 },
    endEc: { year: 2019, month: 10, day: 25 },
    type: 'exam',
  },
  {
    id: 'cards-s2',
    label: 'Parent–student gathering — give out cards',
    startEc: { year: 2019, month: 10, day: 30 },
    endEc: { year: 2019, month: 10, day: 30 },
    type: 'moe',
  },
];

function ecToIso(ec: { year: number; month: number; day: number }): string {
  return ethiopianToGregorianIso(ec.year, ec.month, ec.day);
}

export function getMoeCalendarBounds(): { start: string; end: string } {
  return {
    start: ecToIso({ year: 2018, month: 12, day: 25 }),
    end: ecToIso({ year: 2019, month: 10, day: 30 }),
  };
}

export function buildMoeCalendarEvents(): AcademicCalendarEvent[] {
  const bounds = getMoeCalendarBounds();
  const events: AcademicCalendarEvent[] = [
    {
      label: 'MOE Academic Year Window',
      startDate: bounds.start,
      endDate: bounds.end,
      startDateEthiopian: formatEthiopianDate(bounds.start),
      endDateEthiopian: formatEthiopianDate(bounds.end),
      type: 'moe',
    },
  ];

  for (const activity of MOE_MAJOR_ACTIVITIES) {
    const startDate = ecToIso(activity.startEc);
    const endDate = ecToIso(activity.endEc);
    events.push({
      label: activity.label,
      startDate,
      endDate,
      startDateEthiopian: formatEthiopianDate(startDate),
      endDateEthiopian: formatEthiopianDate(endDate),
      type: activity.type,
    });
  }

  for (const holiday of getEthiopiaPublicHolidaysInRange(bounds.start, bounds.end)) {
    events.push({
      label: holiday.label,
      startDate: holiday.startDate,
      endDate: holiday.endDate,
      startDateEthiopian: formatEthiopianDate(holiday.startDate),
      endDateEthiopian: formatEthiopianDate(holiday.endDate),
      type: 'holiday',
    });
  }

  return events.sort((a, b) => a.startDate.localeCompare(b.startDate));
}
