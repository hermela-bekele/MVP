/**
 * Ethiopian public holidays aligned with Google Calendar "Holidays in Ethiopia"
 * (calendar ID: en.et.official#holiday@group.v.calendar.google.com).
 * Uses Gregorian dates — same source Google Calendar uses for regional holidays.
 */

export interface PublicHolidayOccurrence {
  label: string;
  startDate: string;
  endDate: string;
}

interface FixedGregorianHoliday {
  label: string;
  month: number;
  day: number;
}

/** Fixed national holidays on the Gregorian calendar (matches Google Calendar Ethiopia). */
const FIXED_GC_HOLIDAYS: FixedGregorianHoliday[] = [
  { label: 'Ethiopian Christmas Day', month: 1, day: 7 },
  { label: 'Epiphany / Timkat', month: 1, day: 19 },
  { label: 'Adwa Victory Day', month: 3, day: 2 },
  { label: 'International Labour Day', month: 5, day: 1 },
  { label: "Patriots' Victory Day", month: 5, day: 5 },
  { label: 'Downfall of the Derg', month: 5, day: 28 },
  { label: 'Ethiopian New Year (Enkutatash)', month: 9, day: 11 },
  { label: 'Finding of the True Cross (Meskel)', month: 9, day: 27 },
];

/** Islamic & movable holidays vary by Gregorian year (schools closed). */
const VARIABLE_GC_HOLIDAYS: Record<number, FixedGregorianHoliday[]> = {
  2025: [
    { label: 'Eid al-Fitr', month: 3, day: 30 },
    { label: 'Ethiopian Good Friday', month: 4, day: 18 },
    { label: 'Fasika (Easter)', month: 4, day: 20 },
    { label: 'Eid al-Adha', month: 6, day: 6 },
    { label: "Mawlid (Prophet's Birthday)", month: 9, day: 5 },
  ],
  2026: [
    { label: 'Eid al-Fitr', month: 3, day: 20 },
    { label: 'Ethiopian Good Friday', month: 4, day: 10 },
    { label: 'Fasika (Easter)', month: 4, day: 12 },
    { label: 'Eid al-Adha', month: 5, day: 27 },
    { label: "Mawlid (Prophet's Birthday)", month: 8, day: 26 },
  ],
  2027: [
    { label: 'Eid al-Fitr', month: 3, day: 10 },
    { label: 'Ethiopian Good Friday', month: 3, day: 26 },
    { label: 'Fasika (Easter)', month: 3, day: 28 },
    { label: 'Eid al-Adha', month: 5, day: 16 },
    { label: "Mawlid (Prophet's Birthday)", month: 8, day: 15 },
  ],
  2028: [
    { label: 'Eid al-Fitr', month: 2, day: 28 },
    { label: 'Ethiopian Good Friday', month: 4, day: 14 },
    { label: 'Fasika (Easter)', month: 4, day: 16 },
    { label: 'Eid al-Adha', month: 5, day: 5 },
    { label: "Mawlid (Prophet's Birthday)", month: 8, day: 4 },
  ],
};

function toIso(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function inRange(iso: string, startIso: string, endIso: string): boolean {
  return iso >= startIso && iso <= endIso;
}

export function getEthiopiaPublicHolidaysInRange(
  startIso: string,
  endIso: string,
): PublicHolidayOccurrence[] {
  const startYear = Number(startIso.slice(0, 4));
  const endYear = Number(endIso.slice(0, 4));
  const seen = new Set<string>();
  const holidays: PublicHolidayOccurrence[] = [];

  const add = (label: string, iso: string) => {
    if (!inRange(iso, startIso, endIso) || seen.has(`${label}:${iso}`)) return;
    seen.add(`${label}:${iso}`);
    holidays.push({ label, startDate: iso, endDate: iso });
  };

  for (let year = startYear; year <= endYear + 1; year++) {
    for (const h of FIXED_GC_HOLIDAYS) {
      add(h.label, toIso(year, h.month, h.day));
    }
    for (const h of VARIABLE_GC_HOLIDAYS[year] ?? []) {
      add(h.label, toIso(year, h.month, h.day));
    }
  }

  return holidays.sort((a, b) => a.startDate.localeCompare(b.startDate));
}

export function countPublicHolidaysInRange(startIso: string, endIso: string): number {
  return getEthiopiaPublicHolidaysInRange(startIso, endIso).length;
}
