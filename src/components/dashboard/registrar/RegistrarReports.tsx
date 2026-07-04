'use client';

import React, { useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { ContentCard } from '@/components/dashboard/ContentCard';
import { TablePanel } from '@/components/dashboard/TablePanel';
import { Badge } from '@/components/ui/badge';
import { enrollmentByGrade, filterSchoolStudents } from '@/lib/registrarPortal';

export const RegistrarReports: React.FC = () => {
  const { students, registrationApplications } = useApp();
  const schoolStudents = filterSchoolStudents(students);
  const byGrade = enrollmentByGrade(schoolStudents);

  const stats = useMemo(() => {
    const active = schoolStudents.filter((s) => s.status === 'Active');
    const avgGpa =
      active.length > 0
        ? active.reduce((a, s) => a + s.gpa, 0) / active.length
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

    return { active: active.length, avgGpa, avgAttendance, appStats };
  }, [schoolStudents, registrationApplications]);

  const lowAttendance = schoolStudents
    .filter((s) => s.status === 'Active' && s.attendanceRate < 85)
    .sort((a, b) => a.attendanceRate - b.attendanceRate);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ContentCard title="Total Active" description="Enrolled students">
          <p className="text-3xl font-bold text-foreground">{stats.active}</p>
        </ContentCard>
        <ContentCard title="School Avg GPA" description="All active students">
          <p className="text-3xl font-bold text-foreground">{stats.avgGpa.toFixed(2)}</p>
        </ContentCard>
        <ContentCard title="Avg Attendance" description="School-wide rate">
          <p className="text-3xl font-bold text-foreground">{Math.round(stats.avgAttendance)}%</p>
        </ContentCard>
        <ContentCard title="Applications" description="Registration pipeline">
          <p className="text-3xl font-bold text-foreground">{stats.appStats.pending}</p>
          <p className="text-[10px] text-muted-foreground mt-1">
            {stats.appStats.enrolled} enrolled · {stats.appStats.rejected} rejected
          </p>
        </ContentCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TablePanel title="Enrollment by Grade Level" description="Active student distribution">
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

        <TablePanel title="Attendance Alerts" description="Students below 85% attendance">
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
