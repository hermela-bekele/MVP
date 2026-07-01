import type { RegistrationApplication, Student } from '@/lib/mockData';
import { DEMO_SCHOOL_ID } from '@/lib/teacherPortal';

export const REGISTRAR_GRADE_OPTIONS = [
  'Grade 7',
  'Grade 8',
  'Grade 9',
  'Grade 10',
  'Grade 11',
  'Grade 12',
];

export const REGISTRAR_SECTION_OPTIONS = ['A', 'B', 'C', 'D'];

export function filterSchoolStudents(students: Student[]) {
  return students.filter((s) => s.schoolId === DEMO_SCHOOL_ID);
}

export function pendingApplications(apps: RegistrationApplication[]) {
  return apps.filter((a) =>
    ['Submitted', 'Under Review', 'Approved'].includes(a.status)
  );
}

export function applicationsAwaitingReview(apps: RegistrationApplication[]) {
  return apps.filter((a) => a.status === 'Submitted' || a.status === 'Under Review');
}

export function enrollmentByGrade(students: Student[]) {
  const counts: Record<string, number> = {};
  for (const grade of REGISTRAR_GRADE_OPTIONS) {
    counts[grade] = students.filter((s) => s.grade === grade && s.status === 'Active').length;
  }
  return counts;
}

export function statusBadgeVariant(
  status: Student['status'] | RegistrationApplication['status']
): 'success' | 'warning' | 'danger' | 'neutral' | 'primary' | 'info' {
  switch (status) {
    case 'Active':
    case 'Approved':
    case 'Enrolled':
      return 'success';
    case 'Submitted':
    case 'Under Review':
    case 'Draft':
      return 'warning';
    case 'Suspended':
    case 'Rejected':
      return 'danger';
    case 'Transferred':
      return 'info';
    case 'Graduated':
      return 'primary';
    default:
      return 'neutral';
  }
}
