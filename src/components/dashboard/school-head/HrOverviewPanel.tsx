'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { readStoredSession } from '@/lib/auth';
import { api } from '@/lib/api';
import { KpiGrid, KpiWidget } from '@/components/dashboard/KpiWidget';
import { TablePanel } from '@/components/dashboard/TablePanel';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { pendingLeaveRequests } from '@/lib/hrPortal';
import { computeTeacherDevelopmentRollup } from '@/lib/schoolHeadAnalytics';

/**
 * Institutional workforce oversight for the school head — staffing levels,
 * vacancies, credentials, development, and workload, all as patterns and
 * exceptions rather than individual daily supervision (that's HR's own
 * portal). Replaces a prior version that just listed individual leave and
 * payroll rows.
 */
export const HrOverviewPanel: React.FC = () => {
  const { hrEmployees, leaveRequests, jobPostings, teachers, teacherTrainingAssignments } = useApp();
  const session = readStoredSession();
  const schoolId = session?.schoolId ?? undefined;

  const activeStaff = useMemo(() => hrEmployees.filter((e) => e.status !== 'Terminated'), [hrEmployees]);
  const pendingLeave = useMemo(() => pendingLeaveRequests(leaveRequests), [leaveRequests]);
  const openVacancies = useMemo(() => jobPostings.filter((j) => j.status === 'Open'), [jobPostings]);
  const missingCertification = useMemo(
    () => teachers.filter((t) => !t.certification || !t.certification.trim()),
    [teachers],
  );

  const staffingByDepartment = useMemo(() => {
    const byDept = new Map<string, number>();
    for (const e of activeStaff) {
      byDept.set(e.department, (byDept.get(e.department) ?? 0) + 1);
    }
    const vacancyByDept = new Map<string, number>();
    for (const j of openVacancies) {
      vacancyByDept.set(j.department, (vacancyByDept.get(j.department) ?? 0) + 1);
    }
    const depts = new Set([...byDept.keys(), ...vacancyByDept.keys()]);
    return Array.from(depts)
      .map((dept) => ({ department: dept, activeStaff: byDept.get(dept) ?? 0, openVacancies: vacancyByDept.get(dept) ?? 0 }))
      .sort((a, b) => b.activeStaff - a.activeStaff);
  }, [activeStaff, openVacancies]);

  const schoolTeacherIds = useMemo(() => new Set(teachers.map((t) => t.id)), [teachers]);
  const developmentRollup = useMemo(
    () => computeTeacherDevelopmentRollup(teacherTrainingAssignments, schoolTeacherIds),
    [teacherTrainingAssignments, schoolTeacherIds],
  );

  const [workload, setWorkload] = useState<{ teacherId: string; teacherName: string; periodsPerWeek: number }[]>([]);
  useEffect(() => {
    api.staffWorkload(schoolId).then(setWorkload).catch(() => setWorkload([]));
  }, [schoolId]);

  const workloadStats = useMemo(() => {
    if (workload.length === 0) return null;
    const avg = workload.reduce((sum, w) => sum + w.periodsPerWeek, 0) / workload.length;
    const overloaded = workload.filter((w) => w.periodsPerWeek > avg * 1.5);
    const underloaded = workload.filter((w) => w.periodsPerWeek < avg * 0.5);
    return { avg, overloaded, underloaded };
  }, [workload]);

  return (
    <div className="space-y-6 animate-fade-in text-left">
      <KpiGrid>
        <KpiWidget label="Active Staff" value={activeStaff.length} tone="emphasis" />
        <KpiWidget label="Open Vacancies" value={openVacancies.length} hint={openVacancies.length > 0 ? 'Recruitment in progress' : 'Fully staffed'} />
        <KpiWidget label="Pending Leave Decisions" value={pendingLeave.length} hint="Awaiting HR review" />
        <KpiWidget label="Missing Certification on File" value={missingCertification.length} hint={missingCertification.length > 0 ? 'Needs follow-up' : 'All on file'} />
      </KpiGrid>

      <TablePanel title="Staffing by Department" description="Active headcount and open vacancies per department.">
        <table className="eskooly-table">
          <thead>
            <tr>
              <th className="p-3 text-left text-muted-foreground font-semibold">Department</th>
              <th className="p-3 text-left text-muted-foreground font-semibold">Active Staff</th>
              <th className="p-3 text-left text-muted-foreground font-semibold">Open Vacancies</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40 text-muted-foreground">
            {staffingByDepartment.map((row) => (
              <tr key={row.department} className="hover:bg-muted/10">
                <td className="p-3 text-foreground font-bold">{row.department}</td>
                <td className="p-3 font-mono">{row.activeStaff}</td>
                <td className="p-3">
                  {row.openVacancies > 0 ? (
                    <Badge variant="warning" size="sm" className="font-bold">{row.openVacancies} open</Badge>
                  ) : (
                    <span className="text-xxs">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TablePanel>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border/60">
          <CardContent className="pt-5 space-y-3">
            <p className="text-xs font-bold text-foreground">Development Participation</p>
            {developmentRollup.totalAssignments === 0 ? (
              <p className="text-xs text-muted-foreground">No training assignments on record yet.</p>
            ) : (
              <div className="space-y-2">
                {developmentRollup.byProgram.map((p) => (
                  <div key={p.program} className="flex items-center justify-between text-xs">
                    <span className="text-foreground font-semibold">{p.program}</span>
                    <Badge variant={p.completionRate >= 70 ? 'success' : p.completionRate >= 40 ? 'warning' : 'danger'} badgeStyle="subtle" size="sm">
                      {p.completionRate}% complete · {p.overdueCount} overdue
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="pt-5 space-y-3">
            <p className="text-xs font-bold text-foreground">Workload Distribution</p>
            {!workloadStats ? (
              <p className="text-xs text-muted-foreground">No timetable data on record yet.</p>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Average: <span className="font-bold text-foreground">{workloadStats.avg.toFixed(1)} periods/week</span></p>
                {workloadStats.overloaded.length === 0 && workloadStats.underloaded.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No teacher&apos;s load is a significant outlier.</p>
                ) : (
                  <>
                    {workloadStats.overloaded.map((w) => (
                      <div key={w.teacherId} className="flex items-center justify-between text-xs">
                        <span className="text-foreground">{w.teacherName}</span>
                        <Badge variant="danger" badgeStyle="subtle" size="sm">{w.periodsPerWeek}/wk · overloaded</Badge>
                      </div>
                    ))}
                    {workloadStats.underloaded.map((w) => (
                      <div key={w.teacherId} className="flex items-center justify-between text-xs">
                        <span className="text-foreground">{w.teacherName}</span>
                        <Badge variant="neutral" badgeStyle="subtle" size="sm">{w.periodsPerWeek}/wk · underloaded</Badge>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {pendingLeave.length > 0 && (
        <TablePanel title="Leave Decisions Needed" description="Pending leave requests awaiting a decision.">
          <table className="eskooly-table">
            <thead>
              <tr>
                <th className="p-3 text-left text-muted-foreground font-semibold">Employee</th>
                <th className="p-3 text-left text-muted-foreground font-semibold">Type</th>
                <th className="p-3 text-left text-muted-foreground font-semibold">Dates</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 text-muted-foreground">
              {pendingLeave.map((req) => (
                <tr key={req.id} className="hover:bg-muted/10">
                  <td className="p-3 text-foreground font-bold">{req.employeeName}</td>
                  <td className="p-3">{req.type}</td>
                  <td className="p-3">{req.startDate} – {req.endDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TablePanel>
      )}
    </div>
  );
};
