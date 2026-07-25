/** Bole Community School — subject-scoped department head */

import type { AuthUser } from '@/lib/auth';

export const DEPT_SCHOOL_ID = 'sch-1';

export const SUBJECT_DEPARTMENT_IDS: Record<string, string> = {
  Mathematics: 'dept-math',
  Biology: 'dept-bio',
  Chemistry: 'dept-chem',
  Physics: 'dept-phy',
  'General Science': 'dept-stem',
};

const EMAIL_SUBJECT_ALIASES: Record<string, string> = {
  math: 'Mathematics',
  maths: 'Mathematics',
  mathematics: 'Mathematics',
  bio: 'Biology',
  biology: 'Biology',
  chem: 'Chemistry',
  chemistry: 'Chemistry',
  phy: 'Physics',
  physics: 'Physics',
};

export interface DeptHeadScope {
  subject: string;
  departmentId: string;
  schoolId: string;
}

export function subjectMatches(a: string, b: string): boolean {
  const left = a.trim().toLowerCase();
  const right = b.trim().toLowerCase();
  return left === right || left.includes(right) || right.includes(left);
}

export function departmentIdForSubject(subject: string): string {
  return SUBJECT_DEPARTMENT_IDS[subject] ?? 'dept-stem';
}

export function resolveDeptHeadScope(
  user: Pick<AuthUser, 'email' | 'role' | 'subject' | 'departmentId'> | null | undefined,
): DeptHeadScope | null {
  if (!user || user.role !== 'department-head') return null;

  if (user.subject) {
    return {
      subject: user.subject,
      departmentId: user.departmentId ?? departmentIdForSubject(user.subject),
      schoolId: DEPT_SCHOOL_ID,
    };
  }

  const emailMatch = user.email.match(/dept\.head\.(\w+)@/i);
  if (emailMatch) {
    const subject = EMAIL_SUBJECT_ALIASES[emailMatch[1].toLowerCase()];
    if (subject) {
      return {
        subject,
        departmentId: departmentIdForSubject(subject),
        schoolId: DEPT_SCHOOL_ID,
      };
    }
  }

  return {
    subject: 'Mathematics',
    departmentId: 'dept-math',
    schoolId: DEPT_SCHOOL_ID,
  };
}

export function isSubjectTeacher<T extends { schoolId: string; subjects: string[] }>(
  teacher: T,
  scope: DeptHeadScope,
): boolean {
  return (
    teacher.schoolId === scope.schoolId &&
    teacher.subjects.some((sub) => subjectMatches(sub, scope.subject))
  );
}

export function filterBySubjectScope<T extends { subject: string }>(
  items: T[],
  scope: DeptHeadScope,
): T[] {
  return items.filter((item) => subjectMatches(item.subject, scope.subject));
}

export function classSectionKey(grade: string, section: string): string {
  return `${grade}:${section}`;
}

export type SubjectPerformanceStatus = 'Critical' | 'Warning' | 'Stable';

/** Green-theme progress fill by performance tier (target 70%) */
export function subjectPerformanceBarClass(
  average: number,
  status: SubjectPerformanceStatus,
): string {
  if (status === 'Critical' || average < 60) return 'bg-primary/35';
  if (status === 'Warning' || average < 70) return 'bg-primary/60';
  return 'bg-primary';
}

export function subjectStatusLabel(status: SubjectPerformanceStatus): string {
  switch (status) {
    case 'Critical':
      return 'Below target';
    case 'Warning':
      return 'Watch';
    default:
      return 'On track';
  }
}
