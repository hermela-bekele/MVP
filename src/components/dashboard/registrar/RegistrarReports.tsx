'use client';

import React, { useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { KpiWidget, KpiGrid } from '@/components/dashboard/KpiWidget';
import { TablePanel } from '@/components/dashboard/TablePanel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { enrollmentByGrade, filterSchoolStudents } from '@/lib/registrarPortal';
import { toCsv, downloadCsv } from '@/lib/csvExport';
import { gpaToMark } from '@/lib/grading';

export const RegistrarReports: React.FC = () => {
  const { students, registrationApplications } = useApp();
  const schoolStudents = filterSchoolStudents(students);
  const byGrade = enrollmentByGrade(schoolStudents);

  const stats = useMemo(() => {
    const active = schoolStudents.filter((s) => s.status === 'Active');
    const avgMark =
      active.length > 0
        ? Math.round(active.reduce((a, s) => a + gpaToMark(s.gpa), 0) / active.length)
        : 0;
    const avgAttendance =
      active.length > 0
        ? active.reduce((a, s) => a + s.attendanceRate, 0) / active.length
        : 0;

    const appStats = {
      total: registrationApplications.length,
      enrolled: registrationApplications.filter((a) => a.status === 'Enrolled').length,
      rejected: registrationApplications.filter((a) => a.status === 'Rejected').length,
      pending: registrationApplications.filter((a) =>
        ['Submitted', 'Under Review', 'Approved'].includes(a.status)
      ).length,
    };

    return { active: active.length, avgMark, avgAttendance, appStats };
  }, [schoolStudents, registrationApplications]);

  const lowAttendance = schoolStudents
    .filter((s) => s.status === 'Active' && s.attendanceRate < 85)
    .sort((a, b) => a.attendanceRate - b.attendanceRate);

  const exportEnrollmentSummary = () => {
    const rows = Object.entries(byGrade).map(([grade, count]) => ({
      grade,
      activeStudents: count,
      sharePercent: stats.active > 0 ? Math.round((count / stats.active) * 100) : 0,
    }));
    const csv = toCsv(rows, [
      { key: 'grade', header: 'Grade' },
      { key: 'activeStudents', header: 'Active Students' },
      { key: 'sharePercent', header: 'Share %' },
    ]);
    downloadCsv('enrollment-summary.csv', csv);
  };

  const exportAttendanceAlerts = () => {
    const csv = toCsv(
      lowAttendance.map((s) => ({
        name: s.name,
        studentId: s.studentId,
        grade: s.grade,
        section: s.section,
        attendanceRate: s.attendanceRate,
      })),
      [
        { key: 'name', header: 'Student' },
        { key: 'studentId', header: 'Student ID' },
        { key: 'grade', header: 'Grade' },
        { key: 'section', header: 'Section' },
        { key: 'attendanceRate', header: 'Attendance %' },
      ]
    );
    downloadCsv('attendance-alerts.csv', csv);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <KpiGrid>
        <KpiWidget label="Total Active" value={stats.active} hint="Enrolled students" />
        <KpiWidget label="School Avg Mark" value={`${stats.avgMark}%`} hint="All active students" tone="emphasis" />
        <KpiWidget label="Avg Attendance" value={`${Math.round(stats.avgAttendance)}%`} hint="School-wide rate" />
        <KpiWidget
          label="Applications"
          value={stats.appStats.pending}
          hint={`${stats.appStats.enrolled} enrolled · ${stats.appStats.rejected} rejected`}
          tone="emphasis"
        />
      </KpiGrid>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TablePanel
          title="Enrollment by Grade Level"
          description="Active student distribution"
          actions={
            <Button size="sm" variant="outline" className="text-xs h-8" onClick={exportEnrollmentSummary}>
              Export CSV
            </Button>
          }
        >
          <table className="eskooly-table">
            <thead>
              <tr>
                <th className="p-3 text-left text-muted-foreground font-semibold text-xs">Grade</th>
                <th className="p-3 text-left text-muted-foreground font-semibold text-xs">Active Students</th>
                <th className="p-3 text-left text-muted-foreground font-semibold text-xs">Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {Object.entries(byGrade).map(([grade, count]) => (
                <tr key={grade} className="hover:bg-muted/10">
                  <td className="p-3 text-xs font-semibold text-foreground">{grade}</td>
                  <td className="p-3 text-xs">{count}</td>
                  <td className="p-3 text-xs text-muted-foreground">
                    {stats.active > 0 ? `${Math.round((count / stats.active) * 100)}%` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TablePanel>

        <TablePanel
          title="Attendance Alerts"
          description="Students below 85% attendance"
          actions={
            lowAttendance.length > 0 ? (
              <Button size="sm" variant="outline" className="text-xs h-8" onClick={exportAttendanceAlerts}>
                Export CSV
              </Button>
            ) : undefined
          }
        >
          {lowAttendance.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">No attendance alerts.</p>
          ) : (
            <table className="eskooly-table">
              <thead>
                <tr>
                  <th className="p-3 text-left text-muted-foreground font-semibold text-xs">Student</th>
                  <th className="p-3 text-left text-muted-foreground font-semibold text-xs">Grade</th>
                  <th className="p-3 text-left text-muted-foreground font-semibold text-xs">Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {lowAttendance.map((student) => (
                  <tr key={student.id} className="hover:bg-muted/10">
                    <td className="p-3 text-xs font-semibold text-foreground">{student.name}</td>
                    <td className="p-3 text-xs">{student.grade} · {student.section}</td>
                    <td className="p-3">
                      <Badge variant="warning" size="sm">{student.attendanceRate}%</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </TablePanel>
      </div>
    </div>
  );
};
