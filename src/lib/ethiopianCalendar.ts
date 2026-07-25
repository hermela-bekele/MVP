export const ETHIOPIAN_MONTHS = [
  'Meskerem',
  'Tikimt',
  'Hidar',
  'Tahsas',
  'Tir',
  'Yekatit',
  'Megabit',
  'Miyazya',
  'Ginbot',
  'Sene',
  'Hamle',
  'Nehase',
  'Pagume',
] as const;

export interface EthiopianDate {
  year: number;
  month: number;
  day: number;
}

export interface GregorianDate {
  year: number;
  month: number;
  day: number;
}

const ETHIOPIAN_EPOCH = 1723856;

export function gregorianToJdn(year: number, month: number, day: number): number {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return (
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045
  );
}

export function jdnToGregorian(jdn: number): GregorianDate {
  const j = jdn + 68569;
  const k = Math.floor((4 * j) / 146097);
  const l = j - Math.floor((146097 * k + 3) / 4);
  const n = Math.floor((4000 * (l + 1)) / 1461001);
  const l2 = l - Math.floor((1461 * n) / 4) + 31;
  const m = Math.floor((80 * l2) / 2447);
  const d = l2 - Math.floor((2447 * m) / 80);
  const l3 = Math.floor(m / 11);
  return {
    year: 100 * (k - 49) + n + l3,
    month: m + 2 - 12 * l3,
    day: d,
  };
}

export function jdnToEthiopian(jdn: number): EthiopianDate {
  const offset = jdn - ETHIOPIAN_EPOCH;
  const r = offset % 1461;
  const n = (r % 365) + 365 * Math.floor(r / 1460);
  const year =
    4 * Math.floor(offset / 1461) + Math.floor(r / 365) - Math.floor(r / 1460);
  const month = Math.floor(n / 30) + 1;
  const day = (n % 30) + 1;
  return { year, month, day };
}

export function ethiopianToJdn(year: number, month: number, day: number): number {
  // Inverse of jdnToEthiopian — must match Meskerem 1 2018 E.C. = 11 Sep 2025 G.C.
  return (
    ETHIOPIAN_EPOCH +
    365 * year +
    Math.floor((year - 1) / 4) +
    30 * (month - 1) +
    day -
    1
  );
}

export function parseIsoDate(iso: string): GregorianDate {
  const [year, month, day] = iso.split('-').map(Number);
  return { year, month, day };
}

export function toIsoDate({ year, month, day }: GregorianDate): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function gregorianIsoToEthiopian(iso: string): EthiopianDate {
  const g = parseIsoDate(iso);
  return jdnToEthiopian(gregorianToJdn(g.year, g.month, g.day));
}

export function ethiopianToGregorianIso(year: number, month: number, day: number): string {
  const g = jdnToGregorian(ethiopianToJdn(year, month, day));
  return toIsoDate(g);
}

export function formatEthiopianDate(iso: string): string {
  const e = gregorianIsoToEthiopian(iso);
  const monthName = ETHIOPIAN_MONTHS[e.month - 1] ?? `Month ${e.month}`;
  return `${monthName} ${e.day}, ${e.year} E.C.`;
}

export function formatEthiopianDateShort(iso: string): string {
  const e = gregorianIsoToEthiopian(iso);
  const monthName = ETHIOPIAN_MONTHS[e.month - 1] ?? `M${e.month}`;
  return `${monthName.slice(0, 3)} ${e.day}`;
}

export function formatEthiopianDayNumber(iso: string): string {
  const e = gregorianIsoToEthiopian(iso);
  return String(e.day);
}

export function formatGregorianDate(iso: string): string {
  const g = parseIsoDate(iso);
  const date = new Date(g.year, g.month - 1, g.day);
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export interface EthiopianHolidayTemplate {
  label: string;
  month: number;
  day: number;
}

/** Fixed national holidays on the Ethiopian calendar (schools typically closed). */
export const ETHIOPIAN_SCHOOL_HOLIDAYS: EthiopianHolidayTemplate[] = [
  { label: 'Ethiopian New Year (Enkutatash)', month: 1, day: 1 },
  { label: 'Finding of the True Cross (Meskel)', month: 1, day: 17 },
  { label: 'Ethiopian Christmas (Genna)', month: 4, day: 29 },
  { label: 'Timket (Epiphany)', month: 5, day: 11 },
  { label: 'Adwa Victory Day', month: 6, day: 23 },
  { label: 'International Labour Day', month: 8, day: 23 },
  { label: 'Patriots Victory Day', month: 8, day: 27 },
  { label: 'Derg Downfall Day', month: 9, day: 20 },
];

export function ethiopianYearsInRange(startIso: string, endIso: string): number[] {
  const startEth = gregorianIsoToEthiopian(startIso);
  const endEth = gregorianIsoToEthiopian(endIso);
  const years: number[] = [];
  for (let y = startEth.year; y <= endEth.year; y++) {
    years.push(y);
  }
  return years;
}

export function getEthiopianHolidaysInRange(startIso: string, endIso: string) {
  const startG = parseIsoDate(startIso);
  const endG = parseIsoDate(endIso);
  const startJdn = gregorianToJdn(startG.year, startG.month, startG.day);
  const endJdn = gregorianToJdn(endG.year, endG.month, endG.day);
  const years = ethiopianYearsInRange(startIso, endIso);
  const holidays: { label: string; startDate: string; endDate: string }[] = [];

  for (const ethYear of years) {
    for (const holiday of ETHIOPIAN_SCHOOL_HOLIDAYS) {
      const iso = ethiopianToGregorianIso(ethYear, holiday.month, holiday.day);
      const g = parseIsoDate(iso);
      const jdn = gregorianToJdn(g.year, g.month, g.day);
      if (jdn >= startJdn && jdn <= endJdn) {
        holidays.push({
          label: holiday.label,
          startDate: iso,
          endDate: iso,
        });
      }
    }
  }

  return holidays.sort((a, b) => a.startDate.localeCompare(b.startDate));
}

export function countHolidaysInRange(startIso: string, endIso: string): number {
  return getEthiopianHolidaysInRange(startIso, endIso).length;
}

/** Ethiopian leap years: year mod 4 === 3 (Pagume has 6 days). */
export function isEthiopianLeapYear(year: number): boolean {
  return ((year % 4) + 4) % 4 === 3;
}

export function daysInEthiopianMonth(year: number, month: number): number {
  if (month === 13) return isEthiopianLeapYear(year) ? 6 : 5;
  return 30;
}

export function addEthiopianMonths(
  year: number,
  month: number,
  delta: number,
): { year: number; month: number } {
  const zeroBased = year * 13 + (month - 1) + delta;
  const y = Math.floor(zeroBased / 13);
  const m = (zeroBased % 13) + 1;
  return { year: y, month: m };
}

/** Sunday = 0 … Saturday = 6, matching JS Date.getDay(). */
export function firstWeekdayOfEthiopianMonth(year: number, month: number): number {
  const iso = ethiopianToGregorianIso(year, month, 1);
  const g = parseIsoDate(iso);
  return new Date(g.year, g.month - 1, g.day).getDay();
}

/** Sortable key for Ethiopian year-month (e.g. 2018-12). */
export function ethiopianMonthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

export function formatEthiopianMonthLabel(year: number, month: number): string {
  const name = ETHIOPIAN_MONTHS[month - 1] ?? `Month ${month}`;
  return `${name} ${year} E.C.`;
}

/** Gregorian month span covered by an Ethiopian month (for secondary header label). */
export function formatGregorianSpanForEthiopianMonth(year: number, month: number): string {
  const lastDay = daysInEthiopianMonth(year, month);
  const startIso = ethiopianToGregorianIso(year, month, 1);
  const endIso = ethiopianToGregorianIso(year, month, lastDay);
  const start = parseIsoDate(startIso);
  const end = parseIsoDate(endIso);
  const startLabel = new Date(start.year, start.month - 1, 1).toLocaleDateString('en-US', {
    month: 'short',
  });
  const endLabel = new Date(end.year, end.month - 1, 1).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });
  if (start.year === end.year && start.month === end.month) {
    return new Date(start.year, start.month - 1, 1).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  }
  if (start.year === end.year) {
    return `${startLabel} – ${endLabel}`;
  }
  const startFull = new Date(start.year, start.month - 1, 1).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });
  return `${startFull} – ${endLabel}`;
}
