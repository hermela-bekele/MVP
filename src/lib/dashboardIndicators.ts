import type { Student } from '@/lib/mockData';

/**
 * Teacher Dashboard Indicator Dictionary (TE-001).
 *
 * Single source of truth for what each dashboard KPI measures, where its data comes
 * from, and what a teacher should do about it. The 90% / 2.5 GPA thresholds are the
 * pre-existing business rule this dashboard already enforced (see the old inline
 * `isAtRisk` check) — this file documents and centralizes them, it does not invent
 * new ones.
 */

export const ATTENDANCE_RISK_THRESHOLD = 90;
export const ACADEMIC_RISK_THRESHOLD = 2.5;

export function isAttendanceRisk(student: Pick<Student, 'attendanceRate'>): boolean {
  return student.attendanceRate < ATTENDANCE_RISK_THRESHOLD;
}

export function isAcademicRisk(student: Pick<Student, 'gpa'>): boolean {
  return student.gpa < ACADEMIC_RISK_THRESHOLD;
}

export function isAtRisk(student: Pick<Student, 'attendanceRate' | 'gpa'>): boolean {
  return isAttendanceRisk(student) || isAcademicRisk(student);
}

/** Which risk a specific at-risk student is flagged for (a student can be both). */
export function atRiskReason(student: Pick<Student, 'attendanceRate' | 'gpa'>): 'attendance' | 'academic' {
  return isAttendanceRisk(student) ? 'attendance' : 'academic';
}

export type DashboardIndicatorId =
  | 'totalStudents'
  | 'averageMark'
  | 'attendance'
  | 'studentsAtRisk';

export interface DashboardIndicatorDefinition {
  id: DashboardIndicatorId;
  label: string;
  /** What the indicator measures, in plain language. */
  measures: string;
  /** How the number shown is calculated. */
  calculation: string;
  /** Where the underlying data comes from. */
  dataSource: string;
  /** The threshold that changes this indicator's status, if any. */
  threshold: string;
  /** What it means when the indicator is in an "attention" state. */
  statusMeaning: string;
  /** What the teacher should do next. */
  teacherAction: string;
  /** Which tab clicking the card should open. */
  drillDownTab: string;
  drillDownLabel: string;
}

export const DASHBOARD_INDICATOR_DICTIONARY: Record<DashboardIndicatorId, DashboardIndicatorDefinition> = {
  totalStudents: {
    id: 'totalStudents',
    label: 'Total Students',
    measures: 'How many students are enrolled across your assigned sections.',
    calculation: 'Count of students in your roster (Grades 9-10).',
    dataSource: 'Student roster.',
    threshold: 'None — informational.',
    statusMeaning: 'N/A',
    teacherAction: 'Open your class roster to see the full list.',
    drillDownTab: 'manage-students',
    drillDownLabel: 'Class Roster',
  },
  averageMark: {
    id: 'averageMark',
    label: 'Average Mark',
    measures: 'The average academic mark across your roster.',
    calculation: 'Roster GPA average, converted to a percentage mark.',
    dataSource: 'Student grade records (GPA).',
    threshold: 'None — informational.',
    statusMeaning: 'N/A',
    teacherAction: 'Review the Academic Performance breakdown by grade band below.',
    drillDownTab: 'manage-students',
    drillDownLabel: 'Gradebook',
  },
  attendance: {
    id: 'attendance',
    label: 'Attendance',
    measures: 'The average attendance rate across your roster.',
    calculation: 'Average of each student\'s attendance rate.',
    dataSource: 'Attendance records.',
    threshold: `Target ${ATTENDANCE_RISK_THRESHOLD}%`,
    statusMeaning: 'Below target means the section as a whole is missing class time.',
    teacherAction: 'Check the Attendance tab for which sessions are driving the average down.',
    drillDownTab: 'attendance',
    drillDownLabel: 'Session Attendance',
  },
  studentsAtRisk: {
    id: 'studentsAtRisk',
    label: 'Students At Risk',
    measures:
      'Students flagged for either low attendance or a low academic mark (or both).',
    calculation: `attendanceRate < ${ATTENDANCE_RISK_THRESHOLD}% OR GPA < ${ACADEMIC_RISK_THRESHOLD}`,
    dataSource: 'Student attendance rate and GPA.',
    threshold: `Attendance below ${ATTENDANCE_RISK_THRESHOLD}%, or GPA below ${ACADEMIC_RISK_THRESHOLD}`,
    statusMeaning:
      'The student is missing enough class time, or falling far enough behind academically, to need follow-up.',
    teacherAction:
      'Call home, log a note, or escalate to your Department Head — the reason (attendance or mark) is shown on each alert.',
    drillDownTab: 'manage-students',
    drillDownLabel: 'Class Roster / Gradebook',
  },
};
