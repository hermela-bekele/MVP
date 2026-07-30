/** MoE secondary time-allocation tables (Grades 9–12). */

export type GradeBand = '9-10' | '11-12';
export type SubjectStream = 'natural' | 'social';

export interface SubjectTimeAllocation {
  periodsPerWeek: number;
  minutesPerPeriod: number;
  hoursPerWeekLabel: string;
  hoursPerYearLabel: string;
  band: GradeBand;
  stream?: SubjectStream;
  matched: boolean;
}

const G9_10_MINUTES = 40;
const G11_12_MINUTES = 45;

/** Grade 9–10 compulsory (+ optional) subjects */
const GRADE_9_10: Record<string, { periods: number; hoursWeek: string; hoursYear: string }> = {
  english: { periods: 3, hoursWeek: '2:00', hoursYear: '78' },
  mathematics: { periods: 3, hoursWeek: '2:00', hoursYear: '78' },
  biology: { periods: 3, hoursWeek: '2:00', hoursYear: '78' },
  chemistry: { periods: 3, hoursWeek: '2:00', hoursYear: '78' },
  physics: { periods: 3, hoursWeek: '2:00', hoursYear: '78' },
  geography: { periods: 2, hoursWeek: '1:20', hoursYear: '52' },
  history: { periods: 2, hoursWeek: '1:20', hoursYear: '52' },
  'citizenship education': { periods: 2, hoursWeek: '1:20', hoursYear: '52' },
  citizenship: { periods: 2, hoursWeek: '1:20', hoursYear: '52' },
  economics: { periods: 2, hoursWeek: '1:20', hoursYear: '52' },
  'information technology': { periods: 2, hoursWeek: '1:20', hoursYear: '52' },
  it: { periods: 2, hoursWeek: '1:20', hoursYear: '52' },
  'first language': { periods: 2, hoursWeek: '1:20', hoursYear: '52' },
  'health & physical education': { periods: 1, hoursWeek: '0:40', hoursYear: '52' },
  'health and physical education': { periods: 1, hoursWeek: '0:40', hoursYear: '52' },
  pe: { periods: 1, hoursWeek: '0:40', hoursYear: '52' },
  'federal language': { periods: 2, hoursWeek: '1:20', hoursYear: '52' },
  'foreign language': { periods: 2, hoursWeek: '1:20', hoursYear: '52' },
  'performing & visual arts': { periods: 2, hoursWeek: '1:20', hoursYear: '52' },
  'performing and visual arts': { periods: 2, hoursWeek: '1:20', hoursYear: '52' },
};

/** Grade 11–12 Natural Science streams */
const GRADE_11_12_NATURAL: Record<
  string,
  { periods: number; hoursWeek: string; hoursYear: string }
> = {
  english: { periods: 4, hoursWeek: '3:00', hoursYear: '117' },
  mathematics: { periods: 4, hoursWeek: '3:00', hoursYear: '117' },
  biology: { periods: 3, hoursWeek: '2:15', hoursYear: '87:45' },
  chemistry: { periods: 3, hoursWeek: '2:15', hoursYear: '87:45' },
  physics: { periods: 3, hoursWeek: '2:15', hoursYear: '87:45' },
  'information technology': { periods: 3, hoursWeek: '2:15', hoursYear: '87:45' },
  it: { periods: 3, hoursWeek: '2:15', hoursYear: '87:45' },
  agriculture: { periods: 3, hoursWeek: '2:15', hoursYear: '87:45' },
};

/** Grade 11–12 Social Science streams */
const GRADE_11_12_SOCIAL: Record<
  string,
  { periods: number; hoursWeek: string; hoursYear: string }
> = {
  english: { periods: 4, hoursWeek: '3:00', hoursYear: '117' },
  mathematics: { periods: 4, hoursWeek: '3:00', hoursYear: '117' },
  geography: { periods: 3, hoursWeek: '2:15', hoursYear: '87:45' },
  history: { periods: 3, hoursWeek: '2:15', hoursYear: '87:45' },
  economics: { periods: 3, hoursWeek: '2:15', hoursYear: '87:45' },
  'information technology': { periods: 3, hoursWeek: '2:15', hoursYear: '87:45' },
  it: { periods: 3, hoursWeek: '2:15', hoursYear: '87:45' },
};

const SUBJECT_ALIASES: Record<string, string> = {
  math: 'mathematics',
  maths: 'mathematics',
  bio: 'biology',
  chem: 'chemistry',
  phy: 'physics',
  ict: 'information technology',
  'comp science': 'information technology',
  'computer science': 'information technology',
  civics: 'citizenship education',
  'physical education': 'health & physical education',
};

function normalizeSubjectKey(subject: string): string {
  const raw = subject.trim().toLowerCase().replace(/\s+/g, ' ');
  return SUBJECT_ALIASES[raw] ?? raw;
}

export function parseGradeBand(grade: string): GradeBand | null {
  const n = Number.parseInt(grade.replace(/\D/g, ''), 10);
  if (n === 9 || n === 10) return '9-10';
  if (n === 11 || n === 12) return '11-12';
  return null;
}

/** Infer stream from subject when grade is 11–12. */
export function inferSubjectStream(subject: string): SubjectStream | null {
  const key = normalizeSubjectKey(subject);
  const inNatural = key in GRADE_11_12_NATURAL;
  const inSocial = key in GRADE_11_12_SOCIAL;
  if (inNatural && !inSocial) return 'natural';
  if (inSocial && !inNatural) return 'social';
  return null;
}

export function lookupDefaultTimeAllocation(
  grade: string,
  subject: string,
  stream?: SubjectStream | null,
): SubjectTimeAllocation {
  const band = parseGradeBand(grade);
  const key = normalizeSubjectKey(subject);

  if (band === '9-10') {
    const row = GRADE_9_10[key];
    if (row) {
      return {
        periodsPerWeek: row.periods,
        minutesPerPeriod: G9_10_MINUTES,
        hoursPerWeekLabel: row.hoursWeek,
        hoursPerYearLabel: row.hoursYear,
        band,
        matched: true,
      };
    }
    return {
      periodsPerWeek: 3,
      minutesPerPeriod: G9_10_MINUTES,
      hoursPerWeekLabel: '2:00',
      hoursPerYearLabel: '78',
      band,
      matched: false,
    };
  }

  if (band === '11-12') {
    const resolvedStream = stream ?? inferSubjectStream(subject) ?? 'natural';
    const table = resolvedStream === 'social' ? GRADE_11_12_SOCIAL : GRADE_11_12_NATURAL;
    const row = table[key] ?? (resolvedStream === 'social' ? GRADE_11_12_NATURAL[key] : GRADE_11_12_SOCIAL[key]);
    if (row) {
      return {
        periodsPerWeek: row.periods,
        minutesPerPeriod: G11_12_MINUTES,
        hoursPerWeekLabel: row.hoursWeek,
        hoursPerYearLabel: row.hoursYear,
        band,
        stream: resolvedStream,
        matched: true,
      };
    }
    return {
      periodsPerWeek: 3,
      minutesPerPeriod: G11_12_MINUTES,
      hoursPerWeekLabel: '2:15',
      hoursPerYearLabel: '87:45',
      band,
      stream: resolvedStream,
      matched: false,
    };
  }

  // Grades outside 9–12: sensible fallback until custom is set
  return {
    periodsPerWeek: 3,
    minutesPerPeriod: 40,
    hoursPerWeekLabel: '2:00',
    hoursPerYearLabel: '—',
    band: '9-10',
    matched: false,
  };
}

export const ANNUAL_PLAN_SUBJECT_OPTIONS = [
  'English',
  'Mathematics',
  'Biology',
  'Chemistry',
  'Physics',
  'Geography',
  'History',
  'Citizenship Education',
  'Economics',
  'Information Technology',
  'First Language',
  'Health & Physical Education',
  'Federal Language',
  'Foreign Language',
  'Performing & Visual Arts',
  'Agriculture',
];
