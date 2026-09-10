import type { Attendance, LessonPlan, Teacher, Department, TeacherTrainingAssignment, TrainingPlan, TrainingPlanAssignment } from './mockData';
import type { StaffAttendanceRecord } from './hrPortal';

/**
 * Real lesson-plan rollup for a school head's instructional oversight view.
 * "Plans expected" is deliberately omitted — there is no curriculum-pacing/target
 * count anywhere in the data model, and fabricating one would misrepresent real
 * pacing data as if it existed.
 */
export function computeLessonPlanRollup(
  lessonPlans: LessonPlan[],
  teachers: Teacher[],
  departments: Department[],
  schoolTeacherIds: Set<string>,
) {
  const schoolLessonPlans = lessonPlans.filter((p) => schoolTeacherIds.has(p.teacherId));
  const submitted = schoolLessonPlans.length;
  const approved = schoolLessonPlans.filter((p) => p.status === 'Approved').length;
  const pendingReview = schoolLessonPlans.filter((p) => p.status === 'Pending Dept Head' || p.status === 'Pending School Head').length;
  const returned = schoolLessonPlans.filter((p) => p.status === 'Rejected').length;
  const draft = schoolLessonPlans.filter((p) => p.status === 'Draft').length;

  const issueCounts = new Map<string, number>();
  for (const plan of schoolLessonPlans) {
    if (plan.status === 'Approved') continue;
    const teacher = teachers.find((t) => t.id === plan.teacherId);
    const dept = departments.find((d) => d.id === teacher?.departmentId);
    const name = dept?.name ?? 'Unassigned';
    issueCounts.set(name, (issueCounts.get(name) ?? 0) + 1);
  }
  const departmentsWithRecurringIssues = Array.from(issueCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, unresolvedCount: count }));

  return { submitted, approved, pendingReview, returned, draft, departmentsWithRecurringIssues, plans: schoolLessonPlans };
}

/** Real institutional teacher-development rollup — participation and gaps, not
 * a flat per-teacher list. */
export function computeTeacherDevelopmentRollup(
  assignments: TeacherTrainingAssignment[],
  schoolTeacherIds: Set<string>,
) {
  const schoolAssignments = assignments.filter((a) => schoolTeacherIds.has(a.teacherId));
  const programs = Array.from(new Set(schoolAssignments.map((a) => a.program)));
  const byProgram = programs.map((program) => {
    const rows = schoolAssignments.filter((a) => a.program === program);
    const completed = rows.filter((a) => a.status === 'completed').length;
    const overdue = rows.filter((a) => a.overdue).length;
    return {
      program,
      assignedCount: rows.length,
      completedCount: completed,
      overdueCount: overdue,
      completionRate: rows.length > 0 ? Math.round((completed / rows.length) * 100) : 0,
      participantCount: new Set(rows.map((a) => a.teacherId)).size,
    };
  });
  const overallCompletionRate = schoolAssignments.length > 0
    ? Math.round((schoolAssignments.filter((a) => a.status === 'completed').length / schoolAssignments.length) * 100)
    : null;
  const teachersWithAssignments = new Set(schoolAssignments.map((a) => a.teacherId)).size;

  return { byProgram, overallCompletionRate, teachersWithAssignments, totalAssignments: schoolAssignments.length };
}

/** Monday-anchored week-start date (YYYY-MM-DD) — a stable, sortable bucket key
 * for grouping daily records into weeks without pulling in a date library. */
function weekStartKey(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDay(); // 0=Sun..6=Sat
  const diffToMonday = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diffToMonday);
  return d.toISOString().split('T')[0];
}

export interface ClassAttendanceException {
  grade: string;
  section: string;
  currentWeekRate: number;
  currentWeekStart: string;
  weeksTracked: number;
  weeksBelowThreshold: number;
}

/**
 * Trend → Exception for student attendance: a real per-class weekly attendance
 * rate computed from whatever attendance history actually exists, not a
 * fabricated multi-week streak. A class only gets a "weeks below threshold"
 * count for the weeks it actually has records for (weeksTracked) — if there's
 * only one week of data, that's exactly what's reported, not an assumed history.
 */
export function computeStudentAttendanceExceptions(
  attendance: Attendance[],
  thresholdRate = 0.85,
): ClassAttendanceException[] {
  const byClass = new Map<string, Attendance[]>();
  for (const rec of attendance) {
    const key = `${rec.grade}__${rec.section}`;
    const list = byClass.get(key) ?? [];
    list.push(rec);
    byClass.set(key, list);
  }

  const exceptions: ClassAttendanceException[] = [];
  for (const [key, records] of byClass.entries()) {
    const [grade, section] = key.split('__');
    const byWeek = new Map<string, Attendance[]>();
    for (const rec of records) {
      const wk = weekStartKey(rec.date);
      const list = byWeek.get(wk) ?? [];
      list.push(rec);
      byWeek.set(wk, list);
    }
    const weekKeys = Array.from(byWeek.keys()).sort();
    if (weekKeys.length === 0) continue;
    const rateForWeek = (wk: string) => {
      const recs = byWeek.get(wk)!;
      const attended = recs.filter((r) => r.status === 'Present' || r.status === 'Late').length;
      return attended / recs.length;
    };
    const currentWeekStart = weekKeys[weekKeys.length - 1];
    const currentWeekRate = rateForWeek(currentWeekStart);
    const weeksBelowThreshold = weekKeys.filter((wk) => rateForWeek(wk) < thresholdRate).length;

    if (currentWeekRate < thresholdRate) {
      exceptions.push({
        grade,
        section,
        currentWeekRate,
        currentWeekStart,
        weeksTracked: weekKeys.length,
        weeksBelowThreshold,
      });
    }
  }

  return exceptions.sort((a, b) => a.currentWeekRate - b.currentWeekRate);
}

export interface StaffAttendanceException {
  employeeId: string;
  employeeName: string;
  attendanceRate: number;
  absences: number;
  lateCount: number;
  totalTracked: number;
}

/** Trend → Exception for staff attendance, from the real HR staff_attendance
 * records (not teacher.status, which is an employment field, not a daily
 * check-in). "On Leave" days are excluded from the rate since they're
 * pre-approved absences, not attendance failures. Late/Half Day still count
 * as attended (consistent with the student-side rate), since the employee
 * did show up — only Absent counts against the rate. */
export function computeStaffAttendanceExceptions(
  staffAttendance: StaffAttendanceRecord[],
  thresholdRate = 0.9,
  minAbsences = 3,
): StaffAttendanceException[] {
  const byEmployee = new Map<string, StaffAttendanceRecord[]>();
  for (const rec of staffAttendance) {
    const list = byEmployee.get(rec.employeeId) ?? [];
    list.push(rec);
    byEmployee.set(rec.employeeId, list);
  }

  const exceptions: StaffAttendanceException[] = [];
  for (const [employeeId, records] of byEmployee.entries()) {
    const tracked = records.filter((r) => r.status !== 'On Leave');
    if (tracked.length === 0) continue;
    const attended = tracked.filter((r) => r.status === 'Present' || r.status === 'Late' || r.status === 'Half Day').length;
    const absences = tracked.filter((r) => r.status === 'Absent').length;
    const lateCount = tracked.filter((r) => r.status === 'Late').length;
    const attendanceRate = attended / tracked.length;

    if (attendanceRate < thresholdRate || absences >= minAbsences) {
      exceptions.push({
        employeeId,
        employeeName: records[0].employeeName,
        attendanceRate,
        absences,
        lateCount,
        totalTracked: tracked.length,
      });
    }
  }

  return exceptions.sort((a, b) => a.attendanceRate - b.attendanceRate);
}

export interface ScheduledTrainingRollup {
  totalAssignments: number;
  attendedCount: number;
  notAttendedCount: number;
  notRecordedCount: number;
  averageImpactRating: number | null;
  ratedCount: number;
}

/**
 * Real completion/impact rollup for MOE/HR-scheduled training sessions
 * (training_plans / training_plan_assignments) — a genuinely separate
 * pipeline from the TIP/STEP/ELEP module system computeTeacherDevelopmentRollup
 * covers. Only individually-assigned (targetType='teacher') rows are counted:
 * a department-wide assignment has no per-person attendance to report.
 * notRecordedCount is surfaced explicitly rather than folded into "not
 * attended", since HR simply may not have logged it yet.
 */
export function computeScheduledTrainingRollup(
  trainingPlans: TrainingPlan[],
  trainingPlanAssignments: TrainingPlanAssignment[],
  schoolTeacherIds: Set<string>,
): ScheduledTrainingRollup {
  const planIds = new Set(trainingPlans.map((p) => p.id));
  const relevant = trainingPlanAssignments.filter(
    (a) => a.targetType === 'teacher' && a.teacherId && schoolTeacherIds.has(a.teacherId) && planIds.has(a.trainingPlanId),
  );
  const attendedCount = relevant.filter((a) => a.attended === true).length;
  const notAttendedCount = relevant.filter((a) => a.attended === false).length;
  const notRecordedCount = relevant.filter((a) => a.attended === undefined).length;
  const rated = relevant.filter((a) => typeof a.impactRating === 'number');
  const averageImpactRating = rated.length > 0
    ? Math.round((rated.reduce((sum, a) => sum + (a.impactRating ?? 0), 0) / rated.length) * 10) / 10
    : null;

  return {
    totalAssignments: relevant.length,
    attendedCount,
    notAttendedCount,
    notRecordedCount,
    averageImpactRating,
    ratedCount: rated.length,
  };
}
