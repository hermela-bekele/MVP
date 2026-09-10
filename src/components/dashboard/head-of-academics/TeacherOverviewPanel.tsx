'use client';

import React, { useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { KpiWidget, KpiGrid } from '@/components/dashboard/KpiWidget';
import { TablePanel } from '@/components/dashboard/TablePanel';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Dialog } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { DetailField } from '@/components/dashboard/shared/DetailField';
import { hrStatusBadgeVariant } from '@/lib/hrPortal';
import type { Teacher, LessonPlan } from '@/lib/mockData';
import { resolveHeadOfAcademicsScope } from '@/lib/headOfAcademicsPortal';
import { CalendarCheck, ClipboardList, Inbox, Users } from 'lucide-react';
import { Pagination } from '@/components/ui/pagination';
import { Tooltip } from '@/components/ui/tooltip';

const ROWS_PAGE_SIZE = 10;

/** Workflow-stage completion for a plan (Draft → Pending Dept Head → Pending School Head/Approved). */
function planStageProgress(status: LessonPlan['status'] | undefined): number {
  switch (status) {
    case 'Approved':
    case 'Pending School Head':
      return 100;
    case 'Pending Dept Head':
      return 55;
    case 'Rejected':
      return 15;
    case 'Draft':
      return 25;
    default:
      return 0;
  }
}

// Never "At Risk" — a teacher is not algorithmically labelled at risk from an opaque
// score. Every status traces to one of three explicit, disclosed conditions (see
// statusReason below), and the label names the needed action, not a judgment.
type PaceStatus = 'On Track' | 'Ahead of Plan' | 'Needs Follow-Up';

function paceStatusBadgeVariant(status: PaceStatus): 'success' | 'info' | 'danger' {
  if (status === 'Ahead of Plan') return 'info';
  if (status === 'Needs Follow-Up') return 'danger';
  return 'success';
}

/** The specific, disclosed reason a teacher's pace status is what it is — never left as
 * an opaque score. Shown on hover wherever the status badge appears. */
function statusReason(
  row: { hasRejected: boolean; attendanceRate: number | null; weeklyTotal: number },
  schoolAvgWeekly: number,
  status: PaceStatus,
): string {
  if (status === 'Needs Follow-Up') {
    const reasons: string[] = [];
    if (row.hasRejected) reasons.push('a submitted lesson plan was returned/rejected and not yet resubmitted');
    if (row.attendanceRate != null && row.attendanceRate < 75) {
      reasons.push(`attendance rate is ${row.attendanceRate}% (below the 75% floor)`);
    }
    if (
      !row.hasRejected &&
      !(row.attendanceRate != null && row.attendanceRate < 75) &&
      schoolAvgWeekly > 0 &&
      row.weeklyTotal / schoolAvgWeekly < 0.7
    ) {
      reasons.push(
        `weekly-plan submission count (${row.weeklyTotal}) is below 70% of the school average (${schoolAvgWeekly.toFixed(1)})`,
      );
    }
    return reasons.length
      ? `Flagged for follow-up because: ${reasons.join('; ')}.`
      : 'Flagged for follow-up.';
  }
  if (status === 'Ahead of Plan') {
    return `Weekly-plan submission count (${row.weeklyTotal}) is at least 15% above the school average (${schoolAvgWeekly.toFixed(1)}).`;
  }
  return `Rejections: none. Attendance: ${row.attendanceRate != null ? `${row.attendanceRate}% (≥75%)` : 'no records'}. Weekly-plan pace is within the normal range of the school average (${schoolAvgWeekly.toFixed(1)}).`;
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-primary" style={{ width: `${value}%` }} />
      </div>
      <span className="text-xxs font-bold text-foreground font-mono">{value}%</span>
    </div>
  );
}

export const TeacherOverviewPanel: React.FC = () => {
  const { currentUser, teachers, departments, lessonPlans, hrEmployees, staffAttendance } = useApp();
  const scope = useMemo(() => resolveHeadOfAcademicsScope(currentUser), [currentUser]);
  const [detailTeacher, setDetailTeacher] = useState<Teacher | null>(null);
  const [rowsPage, setRowsPage] = useState(1);

  const schoolTeachers = useMemo(
    () => (scope ? teachers.filter((t) => t.schoolId === scope.schoolId) : []),
    [teachers, scope],
  );

  const departmentNameById = useMemo(
    () => new Map(departments.map((d) => [d.id, d.name])),
    [departments],
  );

  const hrByTeacherId = useMemo(() => {
    const map = new Map<string, (typeof hrEmployees)[number]>();
    for (const emp of hrEmployees) {
      if (emp.teacherId) map.set(emp.teacherId, emp);
    }
    return map;
  }, [hrEmployees]);

  const attendanceByEmployeeId = useMemo(() => {
    const map = new Map<string, typeof staffAttendance>();
    for (const rec of staffAttendance) {
      const list = map.get(rec.employeeId);
      if (list) list.push(rec);
      else map.set(rec.employeeId, [rec]);
    }
    return map;
  }, [staffAttendance]);

  const rows = useMemo(() => {
    const base = schoolTeachers.map((t) => {
      const weeklyPlans = lessonPlans.filter((lp) => lp.teacherName === t.name && lp.planType !== 'yearly');
      const annualPlans = lessonPlans.filter((lp) => lp.teacherName === t.name && lp.planType === 'yearly');
      const latestAnnual = [...annualPlans].sort(
        (a, b) => b.version - a.version || b.createdAt.localeCompare(a.createdAt),
      )[0];
      const weeklyApproved = weeklyPlans.filter(
        (p) => p.status === 'Approved' || p.status === 'Pending School Head',
      ).length;
      const weeklyTotal = weeklyPlans.length;
      const weeklyProgress = weeklyTotal > 0 ? Math.round((weeklyApproved / weeklyTotal) * 100) : 0;
      const annualProgress = latestAnnual ? planStageProgress(latestAnnual.status) : 0;
      const hasRejected = weeklyPlans.some((p) => p.status === 'Rejected') || latestAnnual?.status === 'Rejected';

      const hrEmployee = hrByTeacherId.get(t.id);
      const attendanceRecords = hrEmployee ? attendanceByEmployeeId.get(hrEmployee.id) ?? [] : [];
      const presentCount = attendanceRecords.filter((r) => r.status === 'Present' || r.status === 'Late').length;
      const attendanceRate =
        attendanceRecords.length > 0 ? Math.round((presentCount / attendanceRecords.length) * 100) : null;

      return { teacher: t, weeklyTotal, weeklyProgress, annualProgress, hasRejected, attendanceRecords, attendanceRate };
    });

    return base;
  }, [schoolTeachers, lessonPlans, hrByTeacherId, attendanceByEmployeeId]);

  const schoolAvgWeekly = useMemo(
    () => (rows.length > 0 ? rows.reduce((sum, r) => sum + r.weeklyTotal, 0) / rows.length : 0),
    [rows],
  );

  const rowsWithStatus = useMemo(() => {
    return rows.map((row) => {
      let status: PaceStatus;
      if (row.hasRejected || (row.attendanceRate != null && row.attendanceRate < 75)) {
        status = 'Needs Follow-Up';
      } else if (schoolAvgWeekly <= 0) {
        status = row.weeklyTotal > 0 ? 'Ahead of Plan' : 'On Track';
      } else {
        const ratio = row.weeklyTotal / schoolAvgWeekly;
        status = ratio >= 1.15 ? 'Ahead of Plan' : ratio < 0.7 ? 'Needs Follow-Up' : 'On Track';
      }
      return { ...row, status };
    });
  }, [rows, schoolAvgWeekly]);

  const avgWeeklyProgress = useMemo(
    () => (rows.length > 0 ? Math.round(rows.reduce((sum, r) => sum + r.weeklyProgress, 0) / rows.length) : 0),
    [rows],
  );

  const schoolAttendanceRate = useMemo(() => {
    const rated = rows.filter((r) => r.attendanceRate != null);
    if (rated.length === 0) return null;
    return Math.round(rated.reduce((sum, r) => sum + (r.attendanceRate ?? 0), 0) / rated.length);
  }, [rows]);

  const needsFollowUpCount = useMemo(
    () => rowsWithStatus.filter((r) => r.status === 'Needs Follow-Up').length,
    [rowsWithStatus],
  );

  const detailRow = useMemo(
    () => (detailTeacher ? rowsWithStatus.find((r) => r.teacher.id === detailTeacher.id) : undefined),
    [detailTeacher, rowsWithStatus],
  );

  const rowsTotalPages = Math.max(1, Math.ceil(rowsWithStatus.length / ROWS_PAGE_SIZE));
  const rowsCurrentPage = Math.min(rowsPage, rowsTotalPages);
  const pagedRows = rowsWithStatus.slice((rowsCurrentPage - 1) * ROWS_PAGE_SIZE, rowsCurrentPage * ROWS_PAGE_SIZE);

  return (
    <div className="space-y-6 animate-fade-in text-left">
      <KpiGrid className="sm:grid-cols-2 xl:grid-cols-4">
        <KpiWidget
          label="Teachers"
          value={schoolTeachers.length}
          hint="School-wide roster"
          icon={<Users className="h-5 w-5" strokeWidth={1.75} />}
          tooltip={{ description: 'Every teacher account assigned to this school, regardless of department or subject.' }}
        />
        <KpiWidget
          label="Curriculum Implementation Rate"
          value={`${avgWeeklyProgress}%`}
          hint="Approved weekly plans, school-wide"
          icon={<ClipboardList className="h-5 w-5" strokeWidth={1.75} />}
          tooltip={{
            description: 'Percentage of submitted weekly lesson plans, school-wide, that have passed department-head (or school-head) approval — i.e. recorded as delivered through approved planning evidence.',
            detail: 'Source: weekly lesson plan approval status only. This does NOT measure sessions actually delivered in class, or syllabus topics marked complete — those are tracked separately.',
          }}
        />
        <KpiWidget
          label="Attendance Rate"
          value={schoolAttendanceRate != null ? `${schoolAttendanceRate}%` : '—'}
          hint="Present/late across recorded days"
          tone="emphasis"
          icon={<CalendarCheck className="h-5 w-5" strokeWidth={1.75} />}
          tooltip={{ description: 'Average of every teacher\'s (Present + Late) days ÷ total recorded days, across the whole school.' }}
        />
        <KpiWidget
          label="Teachers Requiring Follow-Up"
          value={needsFollowUpCount}
          hint="Flagged by an explicit rule, not a score"
          tone={needsFollowUpCount > 0 ? 'emphasis' : 'default'}
          tooltip={{
            description: 'Flagged when any one of three explicit, disclosed conditions is true: a submitted lesson plan was rejected and not resubmitted, OR attendance rate is below 75%, OR weekly-plan submission pace is below 70% of the school average.',
            detail: 'Never an opaque algorithmic score — hover the Status badge on any teacher\'s row to see exactly which condition applies to them.',
          }}
        />
      </KpiGrid>

      <TablePanel
        title="Teacher Progress & Attendance"
        description="Lesson plan pace and attendance rate for every teacher in the school"
      >
        <table className="eskooly-table">
          <thead>
            <tr>
              <th className="p-3 uppercase text-xxs text-muted-foreground font-semibold">Teacher</th>
              <th className="p-3 uppercase text-xxs text-muted-foreground font-semibold">Department</th>
              <th className="p-3 uppercase text-xxs text-muted-foreground font-semibold">Weekly Plan Progress</th>
              <th className="p-3 uppercase text-xxs text-muted-foreground font-semibold">Annual Plan Progress</th>
              <th className="p-3 uppercase text-xxs text-muted-foreground font-semibold">Attendance Rate</th>
              <th className="p-3 uppercase text-xxs text-muted-foreground font-semibold">Status</th>
              <th className="p-3 uppercase text-xxs text-muted-foreground font-semibold">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40 text-muted-foreground">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-0">
                  <EmptyState icon={<Inbox />} title="No teachers on the school roster yet." className="py-8" />
                </td>
              </tr>
            ) : (
              pagedRows.map((row) => (
                <tr key={row.teacher.id} className="hover:bg-muted/20">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <Avatar name={row.teacher.name} size="sm" />
                      <span className="font-semibold text-foreground">{row.teacher.name}</span>
                    </div>
                  </td>
                  <td className="p-3">{departmentNameById.get(row.teacher.departmentId) ?? '—'}</td>
                  <td className="p-3">
                    <ProgressBar value={row.weeklyProgress} />
                  </td>
                  <td className="p-3">
                    <ProgressBar value={row.annualProgress} />
                  </td>
                  <td className="p-3">
                    {row.attendanceRate != null ? (
                      <span className="font-semibold text-foreground font-mono">{row.attendanceRate}%</span>
                    ) : (
                      <span className="text-xxs">No records</span>
                    )}
                  </td>
                  <td className="p-3">
                    <Tooltip
                      content={statusReason(row, schoolAvgWeekly, row.status)}
                      tooltipClassName="whitespace-normal max-w-[18rem] text-left"
                    >
                      <Badge variant={paceStatusBadgeVariant(row.status)} size="sm">
                        {row.status}
                      </Badge>
                    </Tooltip>
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => setDetailTeacher(row.teacher)}
                      className="text-primary hover:underline font-semibold cursor-pointer"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {rows.length > 0 && (
          <Pagination
            className="mt-3"
            currentPage={rowsCurrentPage}
            totalPages={rowsTotalPages}
            onPageChange={setRowsPage}
            totalItems={rows.length}
            pageSize={ROWS_PAGE_SIZE}
            entityLabel="teachers"
          />
        )}
      </TablePanel>

      <Dialog
        isOpen={detailTeacher !== null}
        onClose={() => setDetailTeacher(null)}
        title="Teacher Progress Record"
        description={detailTeacher ? `${detailTeacher.email} · ${detailTeacher.phone}` : undefined}
        size="xl"
      >
        {detailTeacher && detailRow && (
          <div className="space-y-5 pt-2 text-left">
            <div className="flex items-center gap-3 pb-3 border-b border-border/40">
              <Avatar name={detailTeacher.name} size="md" />
              <div>
                <p className="text-sm font-bold text-foreground">{detailTeacher.name}</p>
                <p className="text-xs text-muted-foreground">
                  {departmentNameById.get(detailTeacher.departmentId) ?? '—'} · {detailTeacher.subjects.join(', ')}
                </p>
              </div>
              <Tooltip
                content={statusReason(detailRow, schoolAvgWeekly, detailRow.status)}
                tooltipClassName="whitespace-normal max-w-[18rem] text-left"
                className="ml-auto"
              >
                <Badge variant={paceStatusBadgeVariant(detailRow.status)} size="sm">
                  {detailRow.status}
                </Badge>
              </Tooltip>
            </div>

            <div className="space-y-2.5">
              <h4 className="text-[10px] font-bold text-primary uppercase tracking-wider">Lesson plan progress</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <DetailField label="Weekly plans submitted" value={detailRow.weeklyTotal || '—'} />
                <DetailField label="Weekly plan progress" value={`${detailRow.weeklyProgress}%`} />
                <DetailField label="Annual plan progress" value={`${detailRow.annualProgress}%`} />
                <DetailField label="Training course sync" value={`${detailTeacher.trainingProgress}%`} />
              </div>
            </div>

            <div className="space-y-2.5">
              <h4 className="text-[10px] font-bold text-accent uppercase tracking-wider">Attendance</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                <DetailField
                  label="Attendance rate"
                  value={detailRow.attendanceRate != null ? `${detailRow.attendanceRate}%` : '—'}
                />
                <DetailField label="Days recorded" value={detailRow.attendanceRecords.length || '—'} />
                <DetailField
                  label="Absences"
                  value={detailRow.attendanceRecords.filter((r) => r.status === 'Absent').length}
                />
                <DetailField
                  label="On leave"
                  value={detailRow.attendanceRecords.filter((r) => r.status === 'On Leave').length}
                />
              </div>
              {detailRow.attendanceRecords.length === 0 ? (
                <p className="text-xs text-muted-foreground">No attendance records linked to this teacher yet.</p>
              ) : (
                <div className="max-h-56 overflow-y-auto rounded-md border border-border/40">
                  <table className="eskooly-table">
                    <thead>
                      <tr>
                        <th className="p-2 uppercase text-xxs text-muted-foreground font-semibold">Date</th>
                        <th className="p-2 uppercase text-xxs text-muted-foreground font-semibold">Status</th>
                        <th className="p-2 uppercase text-xxs text-muted-foreground font-semibold">Check In / Out</th>
                        <th className="p-2 uppercase text-xxs text-muted-foreground font-semibold">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40 text-muted-foreground">
                      {[...detailRow.attendanceRecords]
                        .sort((a, b) => b.date.localeCompare(a.date))
                        .map((rec) => (
                          <tr key={rec.id}>
                            <td className="p-2 font-mono text-xxs">{rec.date}</td>
                            <td className="p-2">
                              <Badge variant={hrStatusBadgeVariant(rec.status)} size="sm">{rec.status}</Badge>
                            </td>
                            <td className="p-2 text-xxs">
                              {rec.checkIn ? `${rec.checkIn} – ${rec.checkOut ?? '—'}` : '—'}
                            </td>
                            <td className="p-2 text-xxs">{rec.notes ?? '—'}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
};
