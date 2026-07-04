import type {
  Assessment,
  LessonPlan,
  Student,
  StudentGradeEntry,
  Teacher,
  TeachingNote,
} from '@/lib/mockData';

export const DEMO_TEACHER_ID = 'tch-1';
export const DEMO_SCHOOL_ID = 'sch-1';

/** Used while teachers are still loading from the API */
const PLACEHOLDER_TEACHER: Teacher = {
  id: DEMO_TEACHER_ID,
  name: 'Loading…',
  email: '',
  phone: '',
  departmentId: 'dept-bio',
  schoolId: DEMO_SCHOOL_ID,
  status: 'Active',
  subjects: ['—'],
  grades: [],
  certification: '',
  trainingProgress: 0,
};

export const TEACHER_CLASS_ASSIGNMENTS = [
  { id: 'asg-1', grade: 'Grade 9', section: 'A', subject: 'Biology', room: 'Lab Room 4', period: '09:15 – 10:00', days: 'Mon / Wed / Fri' },
  { id: 'asg-2', grade: 'Grade 9', section: 'B', subject: 'Biology', room: 'Lab Room 4', period: '10:30 – 11:15', days: 'Tue / Thu' },
  { id: 'asg-3', grade: 'Grade 10', section: 'B', subject: 'Biology', room: 'Lecture Hall', period: '11:30 – 12:15', days: 'Mon / Wed' },
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

const TIMETABLE_DAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const;

const WEEKDAY_TO_TIMETABLE_KEY: Record<string, (typeof TIMETABLE_DAY_KEYS)[number]> = {
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

export function filterTeacherStudents(students: Student[], grade?: string, section?: string) {
  const taughtGrades = ['Grade 9', 'Grade 10'];
  return students.filter(
    (s) =>
      s.schoolId === DEMO_SCHOOL_ID &&
      taughtGrades.includes(s.grade) &&
      (!grade || s.grade === grade) &&
      (!section || s.section === section)
  );
}

export function filterTeacherLessonPlans(plans: LessonPlan[], teacherId = DEMO_TEACHER_ID) {
  return plans.filter((p) => p.teacherId === teacherId);
}

export function filterTeacherAssessments(assessments: Assessment[], teacherId = DEMO_TEACHER_ID) {
  return assessments.filter((a) => a.teacherId === teacherId);
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

export function notesForLessonPlan(notes: TeachingNote[], lessonPlanId: string) {
  return notes.filter((n) => n.lessonPlanId === lessonPlanId);
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
