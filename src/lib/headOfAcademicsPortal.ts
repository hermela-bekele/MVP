import type { AuthUser } from './auth';
import { subjectMatches } from './departmentHead';
import type { Student, StudentGradeEntry } from './mockData';
import { percentToGpa, weightedTermAverage } from './teacherPortal';

export interface HeadOfAcademicsScope {
  schoolId: string;
}

export function resolveHeadOfAcademicsScope(
  user: Pick<AuthUser, 'role' | 'schoolId'> | null | undefined,
): HeadOfAcademicsScope | null {
  if (!user || user.role !== 'head-of-academics') return null;
  return { schoolId: user.schoolId || 'sch-1' };
}

export interface SubjectReportRow {
  subject: string;
  entries: StudentGradeEntry[];
  averagePercent: number | null;
  /** Resolved against a template's grading scale at render time, not here. */
  letterGrade: string | null;
}

/**
 * Subject is free text (no FK), so two teachers labeling the same course differently
 * ("Math" vs "Mathematics") are merged via subjectMatches() — best-effort, not a real fix.
 */
function groupEntriesBySubject(entries: StudentGradeEntry[]): { subject: string; entries: StudentGradeEntry[] }[] {
  const groups: { subject: string; entries: StudentGradeEntry[] }[] = [];
  for (const entry of entries) {
    const group = groups.find((g) => subjectMatches(g.subject, entry.subject));
    if (group) {
      group.entries.push(entry);
    } else {
      groups.push({ subject: entry.subject, entries: [entry] });
    }
  }
  return groups.sort((a, b) => a.subject.localeCompare(b.subject));
}

function subjectRows(entries: StudentGradeEntry[]): SubjectReportRow[] {
  return groupEntriesBySubject(entries).map((g) => ({
    subject: g.subject,
    entries: g.entries,
    averagePercent: weightedTermAverage(g.entries),
    letterGrade: null,
  }));
}

/** One row per subject, for one student, one term — the report-card data shape. */
export function subjectRowsForReportCard(
  entries: StudentGradeEntry[],
  studentId: string,
  term: string,
): SubjectReportRow[] {
  return subjectRows(entries.filter((e) => e.studentId === studentId && e.term === term));
}

/** All students in a grade+section, alphabetized — who to bulk-generate report cards for. */
export function studentsForClassReport(students: Student[], gradeLevel: string, section: string): Student[] {
  return students
    .filter((s) => s.grade === gradeLevel && s.section === section)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export interface TranscriptTermGroup {
  term: string;
  subjects: SubjectReportRow[];
  termAveragePercent: number | null;
  termGpa: number | null;
}

/**
 * Every term this student has entries for, each broken into subject rows — the transcript
 * data shape. `term` is free text (not {year, termNumber}), so groups are chronologically
 * sorted by each group's earliest entry.recordedAt rather than the term label itself.
 */
export function transcriptRowsForStudent(entries: StudentGradeEntry[], studentId: string): TranscriptTermGroup[] {
  const scoped = entries.filter((e) => e.studentId === studentId);
  const byTerm = new Map<string, StudentGradeEntry[]>();
  for (const entry of scoped) {
    const list = byTerm.get(entry.term);
    if (list) list.push(entry);
    else byTerm.set(entry.term, [entry]);
  }

  const groups = Array.from(byTerm.entries()).map(([term, termEntries]) => {
    const termAveragePercent = weightedTermAverage(termEntries);
    return {
      term,
      subjects: subjectRows(termEntries),
      termAveragePercent,
      termGpa: termAveragePercent != null ? percentToGpa(termAveragePercent) : null,
      earliestRecordedAt: Math.min(...termEntries.map((e) => new Date(e.recordedAt).getTime())),
    };
  });

  return groups
    .sort((a, b) => a.earliestRecordedAt - b.earliestRecordedAt)
    .map(({ earliestRecordedAt: _earliestRecordedAt, ...group }) => group);
}

/** Average-of-subject-averages for a set of subject rows — a student's overall term average. */
export function overallAverageFromRows(rows: SubjectReportRow[]): number | null {
  const percents = rows.map((r) => r.averagePercent).filter((p): p is number => p != null);
  return percents.length ? Math.round(percents.reduce((a, b) => a + b, 0) / percents.length) : null;
}

export interface ClassRanking {
  studentId: string;
  averagePercent: number | null;
  rank: number | null;
}

/** Average-of-subject-averages ranking within a class+term, for the template's optional rank column. */
export function classRankingsForReport(
  students: Student[],
  entries: StudentGradeEntry[],
  gradeLevel: string,
  section: string,
  term: string,
): ClassRanking[] {
  const withAverages = studentsForClassReport(students, gradeLevel, section).map((s) => {
    const rows = subjectRowsForReportCard(entries, s.id, term);
    return { studentId: s.id, averagePercent: overallAverageFromRows(rows) };
  });

  const ranked = [...withAverages].sort((a, b) => (b.averagePercent ?? -1) - (a.averagePercent ?? -1));
  const rankByStudentId = new Map<string, number>();
  ranked.forEach((r, idx) => {
    if (r.averagePercent != null) rankByStudentId.set(r.studentId, idx + 1);
  });

  return withAverages.map((r) => ({ ...r, rank: rankByStudentId.get(r.studentId) ?? null }));
}

// ---------------------------------------------------------------------------
// Report/transcript template configuration (stored as school_settings.report_card_template)
// ---------------------------------------------------------------------------

export interface GradingScaleBand {
  minPercent: number;
  maxPercent: number;
  letter: string;
  gpaPoints?: number;
}

export interface SubjectColumnConfig {
  showScore: boolean;
  showMaxScore: boolean;
  showPercentage: boolean;
  showLetterGrade: boolean;
  showRemarks: boolean;
}

export interface SignatureLine {
  id: string;
  label: string;
}

export interface StudentInfoFieldConfig {
  key: 'name' | 'studentId' | 'grade' | 'section' | 'term' | 'parentName';
  label: string;
  enabled: boolean;
}

export interface ReportCardTemplate {
  header: {
    showLogo: boolean;
    schoolNameOverride?: string;
    title: string;
    subtitle?: string;
  };
  studentInfoFields: StudentInfoFieldConfig[];
  gradingScale: GradingScaleBand[];
  subjectColumns: SubjectColumnConfig;
  summaryBlock: {
    showTermAverage: boolean;
    showGpa: boolean;
    showRank: boolean;
    showAttendanceRate: boolean;
  };
  signatureLines: SignatureLine[];
  footerText?: string;
}

/** Same shape drives both documents; kept separate so a school can style them differently. */
export interface ReportCardTemplateSettings {
  reportCard: ReportCardTemplate;
  transcript: ReportCardTemplate;
}

function defaultTemplate(kind: 'report-card' | 'transcript'): ReportCardTemplate {
  return {
    header: {
      showLogo: true,
      title: kind === 'report-card' ? 'Term Report Card' : 'Academic Transcript',
    },
    studentInfoFields: [
      { key: 'name', label: 'Student Name', enabled: true },
      { key: 'studentId', label: 'Student ID', enabled: true },
      { key: 'grade', label: 'Grade', enabled: true },
      { key: 'section', label: 'Section', enabled: true },
      { key: 'term', label: 'Term', enabled: kind === 'report-card' },
      { key: 'parentName', label: 'Parent/Guardian', enabled: false },
    ],
    gradingScale: [
      { minPercent: 90, maxPercent: 100, letter: 'A', gpaPoints: 4.0 },
      { minPercent: 80, maxPercent: 89, letter: 'B', gpaPoints: 3.0 },
      { minPercent: 70, maxPercent: 79, letter: 'C', gpaPoints: 2.0 },
      { minPercent: 60, maxPercent: 69, letter: 'D', gpaPoints: 1.0 },
      { minPercent: 0, maxPercent: 59, letter: 'F', gpaPoints: 0.0 },
    ],
    subjectColumns: {
      showScore: true,
      showMaxScore: true,
      showPercentage: true,
      showLetterGrade: true,
      showRemarks: false,
    },
    summaryBlock: {
      showTermAverage: true,
      showGpa: true,
      showRank: false,
      showAttendanceRate: false,
    },
    signatureLines: [
      { id: 'sig-1', label: 'Class Teacher' },
      { id: 'sig-2', label: 'Head of Academics' },
      { id: 'sig-3', label: 'Principal' },
    ],
    footerText: '',
  };
}

export const DEFAULT_TEMPLATE: ReportCardTemplateSettings = {
  reportCard: defaultTemplate('report-card'),
  transcript: defaultTemplate('transcript'),
};

function mergeTemplate(base: ReportCardTemplate, partial?: Partial<ReportCardTemplate>): ReportCardTemplate {
  if (!partial) return base;
  return {
    header: { ...base.header, ...(partial.header ?? {}) },
    studentInfoFields: partial.studentInfoFields ?? base.studentInfoFields,
    gradingScale: partial.gradingScale ?? base.gradingScale,
    subjectColumns: { ...base.subjectColumns, ...(partial.subjectColumns ?? {}) },
    summaryBlock: { ...base.summaryBlock, ...(partial.summaryBlock ?? {}) },
    signatureLines: partial.signatureLines ?? base.signatureLines,
    footerText: partial.footerText ?? base.footerText,
  };
}

/** Deep-merges a (possibly empty, e.g. `{}` for a school that never saved one) partial settings
 *  object fetched from the API against DEFAULT_TEMPLATE so the builder/renderer always has a
 *  complete template to work with. */
export function mergeTemplateSettings(
  partial: Partial<ReportCardTemplateSettings> | null | undefined,
): ReportCardTemplateSettings {
  return {
    reportCard: mergeTemplate(DEFAULT_TEMPLATE.reportCard, partial?.reportCard),
    transcript: mergeTemplate(DEFAULT_TEMPLATE.transcript, partial?.transcript),
  };
}

export function resolveLetterGrade(percent: number | null, scale: GradingScaleBand[]): string | null {
  if (percent == null) return null;
  const band = scale.find((b) => percent >= b.minPercent && percent <= b.maxPercent);
  return band?.letter ?? null;
}
