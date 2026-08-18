import type {
  Assessment,
  LessonPlan,
  Student,
  StudentGradeEntry,
  Teacher,
  TeachingNote,
} from '@/lib/mockData';
import { subjectMatches } from '@/lib/departmentHead';

export const DEMO_TEACHER_ID = 'tch-1';
export const DEMO_SCHOOL_ID = 'sch-1';

/** Used while teachers are still loading from the API */
const PLACEHOLDER_TEACHER: Teacher = {
  id: DEMO_TEACHER_ID,
  name: 'Loading…',
  email: '',
  phone: '',
  departmentId: 'dept-math',
  schoolId: DEMO_SCHOOL_ID,
  status: 'Active',
  subjects: ['Mathematics'],
  grades: ['Grade 9', 'Grade 10', 'Grade 11'],
  certification: '',
  trainingProgress: 0,
  yearsOfExperience: 0,
};

export const TEACHER_CLASS_ASSIGNMENTS = [
  { id: 'asg-1', grade: 'Grade 9', section: 'A', subject: 'Mathematics', room: 'Room 12', period: '09:15 – 10:00', days: 'Mon / Wed / Fri' },
  { id: 'asg-2', grade: 'Grade 10', section: 'A', subject: 'Mathematics', room: 'Room 12', period: '10:30 – 11:15', days: 'Tue / Thu' },
  { id: 'asg-3', grade: 'Grade 11', section: 'A', subject: 'Mathematics', room: 'Room 14', period: '11:30 – 12:15', days: 'Mon / Wed' },
] as const;

export type TeacherClassAssignment = (typeof TEACHER_CLASS_ASSIGNMENTS)[number];

export const TEACHER_WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] as const;

export type TeacherTimetableRow = {
  time: string;
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
};

type TimetableDayKey = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday';

const WEEKDAY_TO_TIMETABLE_KEY: Record<string, TimetableDayKey> = {
  Mon: 'monday',
  Tue: 'tuesday',
  Wed: 'wednesday',
  Thu: 'thursday',
  Fri: 'friday',
};

export function parseAssignmentWeekdays(days: string) {
  return days.split('/').map((d) => d.trim().slice(0, 3));
}

export function formatTimetableCell(assignment: TeacherClassAssignment) {
  return `${assignment.grade} · Sec ${assignment.section}\n${assignment.subject} · ${assignment.room}`;
}

export function buildTeacherWeeklyTimetable(
  assignments: readonly TeacherClassAssignment[] = TEACHER_CLASS_ASSIGNMENTS,
): TeacherTimetableRow[] {
  const timeSlots = [...new Set(assignments.map((a) => a.period))].sort();

  return timeSlots.map((time) => {
    const row: TeacherTimetableRow = {
      time,
      monday: '—',
      tuesday: '—',
      wednesday: '—',
      thursday: '—',
      friday: '—',
    };

    for (const assignment of assignments) {
      if (assignment.period !== time) continue;
      const cell = formatTimetableCell(assignment);
      for (const day of parseAssignmentWeekdays(assignment.days)) {
        const key = WEEKDAY_TO_TIMETABLE_KEY[day];
        if (key) row[key] = cell;
      }
    }

    return row;
  });
}

export const GRADE_OPTIONS = ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];
export const SECTION_OPTIONS = ['A', 'B', 'C', 'D'];
/** Gradebook / roster filters — include All sections for a grade level. */
export const SECTION_FILTER_OPTIONS = ['All', ...SECTION_OPTIONS];

/** Single source of truth for subject dropdowns (AI lesson plan / notes / assessment
 * generation). Keep every subject-select in the app pointed at this list so they can't
 * drift out of sync with each other again.
 * Limited to Mathematics and English — Prime AI only has ingested content (MLC,
 * syllabus, teacher guide, textbook) for these two subjects; any other subject would
 * silently fall through to English-shaped prompting with no matching source material. */
export const SUBJECT_OPTIONS = ['Mathematics', 'English'];

/** Normalize "Grade 11" / "11" / "G11" style labels for matching. */
export function normalizeGradeLabel(grade: string): string {
  const raw = (grade || '').trim().toLowerCase();
  const num = raw.match(/(\d{1,2})/);
  if (num) return `grade ${parseInt(num[1], 10)}`;
  return raw;
}

export function assessmentMatchesGrade(assessmentGrade: string, classGrade: string): boolean {
  return normalizeGradeLabel(assessmentGrade) === normalizeGradeLabel(classGrade);
}

export function getTeacherForUser(teachers: Teacher[], email: string): Teacher | undefined {
  return teachers.find((t) => t.email.toLowerCase() === email.toLowerCase());
}

export function getDemoTeacher(
  teachers: Teacher[],
  userEmail?: string,
  displayName?: string
): Teacher {
  if (userEmail) {
    const match = getTeacherForUser(teachers, userEmail);
    if (match) return match;

    if (displayName) {
      return {
        ...PLACEHOLDER_TEACHER,
        id: `profile-${userEmail}`,
        name: displayName,
        email: userEmail,
        subjects: [],
      };
    }
  }

  return (
    teachers.find((t) => t.id === DEMO_TEACHER_ID) ??
    teachers[0] ??
    PLACEHOLDER_TEACHER
  );
}

export function filterTeacherStudents(
  students: Student[],
  grade?: string,
  section?: string,
  opts?: { schoolId?: string },
) {
  const wantGrade = grade ? normalizeGradeLabel(grade) : '';
  const wantSection =
    section && section !== 'All' ? section.trim().toUpperCase() : '';
  const schoolId = opts?.schoolId;

  return students
    .filter((s) => {
      if (schoolId && s.schoolId && s.schoolId !== schoolId) return false;
      if (wantGrade && normalizeGradeLabel(s.grade || '') !== wantGrade) return false;
      if (wantSection && (s.section || '').trim().toUpperCase() !== wantSection) {
        return false;
      }
      return true;
    })
    .sort((a, b) => a.name.localeCompare(b.name) || a.section.localeCompare(b.section));
}

export function resolveTeacherProfile(
  teachers: Teacher[],
  teacherId: string,
): Teacher {
  return (
    teachers.find((t) => t.id === teacherId) ??
    PLACEHOLDER_TEACHER
  );
}

export function primarySubjectForTeacher(teacher: Teacher): string {
  const first = teacher.subjects.find((s) => s && s !== '—');
  return first ?? 'Mathematics';
}

export function filterTeacherLessonPlans(
  plans: LessonPlan[],
  teacherId = DEMO_TEACHER_ID,
  opts?: { subjects?: string[]; grades?: string[] },
) {
  const subjects = (opts?.subjects ?? [])
    .map((s) => s.trim())
    .filter((s) => s && s !== '—');

  const matchesTeacherSubject = (subject: string) => {
    if (subjects.length === 0) return true;
    return subjects.some((s) => subjectMatches(s, subject || ''));
  };

  return plans.filter((p) => {
    const isYearly = p.planType === 'yearly';
    const isHodAnnual =
      isYearly &&
      p.createdByRole === 'department-head' &&
      p.status === 'Approved';

    // Department-published annual plans for this teacher's subject (any author id)
    if (isHodAnnual) {
      return matchesTeacherSubject(p.subject);
    }

    // Own weekly/monthly plans — only in the teacher's subject(s) (hides legacy Biology rows)
    if (String(p.teacherId) === String(teacherId) && !isYearly) {
      if (p.status === 'Rejected') return false;
      return matchesTeacherSubject(p.subject);
    }

    return false;
  });
}

/** Keep only the newest lesson plan per grade + subject (by createdAt, then id). */
export function keepLatestLessonPlansByGradeSubject(plans: LessonPlan[]): LessonPlan[] {
  const best = new Map<string, LessonPlan>();
  for (const p of plans) {
    const key = `${(p.grade || '').trim().toLowerCase()}|${(p.subject || '').trim().toLowerCase()}`;
    const cur = best.get(key);
    if (!cur) {
      best.set(key, p);
      continue;
    }
    const newer =
      String(p.createdAt).localeCompare(String(cur.createdAt)) > 0 ||
      (p.createdAt === cur.createdAt && p.id > cur.id);
    if (newer) best.set(key, p);
  }
  return Array.from(best.values()).sort((a, b) =>
    String(b.createdAt).localeCompare(String(a.createdAt)),
  );
}

export function filterTeacherAssessments(
  assessments: Assessment[],
  teacherId = DEMO_TEACHER_ID,
  opts?: { subjects?: string[] },
) {
  const subjects = (opts?.subjects || []).map((s) => s.toLowerCase()).filter(Boolean);
  const subjectMatch = (subject: string) => {
    if (!subjects.length) return true;
    const s = (subject || '').toLowerCase();
    return subjects.some((sub) => s.includes(sub) || sub.includes(s));
  };

  return assessments
    .filter((a) => {
      if (!a?.id || a.status === 'Rejected') return false;
      if (String(a.teacherId) === String(teacherId)) return true;

      // Published department exams shared with subject teachers
      const isDeptPublished =
        a.createdByRole === 'department-head' ||
        (a.status === 'Approved' &&
          (a.type === 'Mid Exam' ||
            a.type === 'Final Exam' ||
            a.type === 'Assignment' ||
            a.type === 'Practical'));

      return isDeptPublished && a.status === 'Approved' && subjectMatch(a.subject);
    })
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

/** True when an assessment is ready to link for grade entry (no pending approval). */
export function isAssessmentReadyForGrading(a: Assessment): boolean {
  if (a.status === 'Rejected') return false;
  if (a.status === 'Approved') return true;
  // Quizzes/baselines never needed approval — include legacy pending/draft rows.
  if (a.type === 'Quiz' || a.type === 'Baseline') return true;
  // HoD-authored exams publish immediately.
  if (a.createdByRole === 'department-head') return true;
  return false;
}

/** Assessments a teacher can link when recording grades. Never hides own ready work by grade/subject. */
export function filterGradebookAssessments(
  assessments: Assessment[],
  opts: {
    teacherId: string;
    subjects?: string[];
    classGrade?: string;
  },
) {
  const tid = String(opts.teacherId || '');
  const subjects = (opts.subjects || []).map((s) => s.toLowerCase()).filter(Boolean);
  const subjectMatch = (subject: string) => {
    if (!subjects.length) return true;
    const s = (subject || '').toLowerCase();
    return subjects.some((sub) => s.includes(sub) || sub.includes(s));
  };

  const byId = new Map<string, Assessment>();

  for (const a of assessments) {
    if (!a?.id || a.status === 'Rejected') continue;
    const isOwn = String(a.teacherId) === tid;

    // Always keep this teacher's ready assessments (any grade / any subject).
    if (isOwn && isAssessmentReadyForGrading(a)) {
      byId.set(a.id, a);
      continue;
    }

    // Department-shared: every Approved assessment in the teacher's subject(s).
    if (a.status === 'Approved' && subjectMatch(a.subject)) {
      byId.set(a.id, a);
      continue;
    }

    // HoD-published exams for the subject even if status drifted.
    if (
      a.createdByRole === 'department-head' &&
      subjectMatch(a.subject)
    ) {
      byId.set(a.id, a);
    }
  }

  return [...byId.values()].sort((a, b) => {
    if (opts.classGrade) {
      const aMatch = assessmentMatchesGrade(a.grade, opts.classGrade) ? 0 : 1;
      const bMatch = assessmentMatchesGrade(b.grade, opts.classGrade) ? 0 : 1;
      if (aMatch !== bMatch) return aMatch - bMatch;
    }
    // Own assessments before shared ones
    const aOwn = String(a.teacherId) === tid ? 0 : 1;
    const bOwn = String(b.teacherId) === tid ? 0 : 1;
    if (aOwn !== bOwn) return aOwn - bOwn;
    return String(b.createdAt).localeCompare(String(a.createdAt));
  });
}

/** Quizzes and baselines are usable immediately; other teacher drafts need HoD approval. */
export function assessmentNeedsApproval(type: Assessment['type'], createdByRole?: string) {
  if (createdByRole === 'department-head') return false;
  return type !== 'Quiz' && type !== 'Baseline';
}

export function avgGpaForStudents(students: Student[]) {
  if (students.length === 0) return 0;
  return parseFloat((students.reduce((a, s) => a + s.gpa, 0) / students.length).toFixed(2));
}

export function avgAttendanceForStudents(students: Student[]) {
  if (students.length === 0) return 0;
  return Math.round(students.reduce((a, s) => a + s.attendanceRate, 0) / students.length);
}

export const TRAINING_TYPE_FILTERS = [
  'All',
  'MOE Mandatory',
  'Pedagogy',
  'STEM',
  'Assessment',
  'Subject Specialty',
] as const;

export const GRADE_ENTRY_TYPES = [
  'Quiz',
  'Test',
  'Assignment',
  'Project',
  'Mid Exam',
  'Final Exam',
  'Practical',
] as const;

export const CURRENT_TERM = 'Term 2 · 2026';

export type StudentLevel = 'differentiated' | 'beginner' | 'intermediate' | 'advanced';
export type StudentLevelScope = StudentLevel;

export const STUDENT_LEVEL_OPTIONS = [
  { value: 'differentiated', label: 'All levels (differentiated)' },
  { value: 'beginner', label: 'Struggling / Beginner' },
  { value: 'intermediate', label: 'Average / Intermediate' },
  { value: 'advanced', label: 'Advanced' },
] as const;

export const STUDENT_LEVEL_LABELS: Record<string, string> = {
  differentiated: 'All Levels',
  beginner: 'Struggling',
  intermediate: 'Average',
  advanced: 'Advanced',
};

export function notesForLessonPlan(notes: TeachingNote[], lessonPlanId: string) {
  return notes.filter((n) => n.lessonPlanId === lessonPlanId);
}

/** Weekly plan is ready for teaching notes when HoD has approved (final approver). */
export function isWeeklyPlanHodApproved(plan: LessonPlan | undefined | null): boolean {
  if (!plan) return false;
  // Legacy rows may still say Pending School Head — HoD was already the final approver.
  return plan.status === 'Approved' || plan.status === 'Pending School Head';
}

/** Display label for weekly plan status (never surfaces school-head queue). */
export function weeklyPlanStatusLabel(status: LessonPlan['status'] | string): string {
  if (status === 'Pending School Head' || status === 'Approved') return 'Approved';
  if (status === 'Pending Dept Head') return 'Awaiting HoD';
  return status;
}

export function graspOutcomeLabel(outcome: string): string {
  switch (outcome) {
    case 'well_grasped':
      return 'Well grasped';
    case 'majority_grasped':
      return 'Majority grasped';
    case 'challenged':
      return 'Challenged / opportunity';
    default:
      return outcome;
  }
}

export function filterTeacherGradeEntries(entries: StudentGradeEntry[], teacherId = DEMO_TEACHER_ID) {
  return entries.filter((e) => e.teacherId === teacherId);
}

export function gradesForStudent(entries: StudentGradeEntry[], studentId: string) {
  return entries.filter((e) => e.studentId === studentId);
}

export function entryPercent(entry: StudentGradeEntry) {
  if (entry.maxScore <= 0) return 0;
  return Math.round((entry.score / entry.maxScore) * 100);
}

/** Weighted term average as percentage */
export function weightedTermAverage(entries: StudentGradeEntry[]) {
  if (entries.length === 0) return null;
  const totalWeight = entries.reduce((a, e) => a + e.weight, 0);
  if (totalWeight === 0) return null;
  const weighted = entries.reduce((a, e) => a + entryPercent(e) * e.weight, 0);
  return Math.round(weighted / totalWeight);
}

export function percentToGpa(avgPercent: number) {
  if (avgPercent >= 93) return 4.0;
  if (avgPercent >= 90) return 3.7;
  if (avgPercent >= 87) return 3.3;
  if (avgPercent >= 83) return 3.0;
  if (avgPercent >= 80) return 2.7;
  if (avgPercent >= 77) return 2.3;
  if (avgPercent >= 73) return 2.0;
  if (avgPercent >= 70) return 1.7;
  if (avgPercent >= 67) return 1.3;
  if (avgPercent >= 65) return 1.0;
  return 0.0;
}

export function dispatchTeacherQuickAction(tab: string, eventName?: string) {
  window.dispatchEvent(
    new CustomEvent('teacher-quick-action', {
      detail: { tab, event: eventName },
    }),
  );
}
