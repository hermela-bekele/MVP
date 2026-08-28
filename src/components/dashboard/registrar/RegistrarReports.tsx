'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { KpiWidget, KpiGrid } from '@/components/dashboard/KpiWidget';
import { TablePanel } from '@/components/dashboard/TablePanel';
import { ChartCard } from '@/components/ui/chart-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  enrollmentByGrade,
  filterSchoolStudents,
  REGISTRAR_GRADE_OPTIONS,
  REGISTRAR_SECTION_OPTIONS,
} from '@/lib/registrarPortal';
import { toCsv, downloadCsv } from '@/lib/csvExport';
import { gpaToMark } from '@/lib/grading';
import { api, type GradeSectionCapacity, type AuditLogEntry } from '@/lib/api';
import { readStoredSession } from '@/lib/auth';
import { currentAcademicYear } from '@/lib/academicYear';

const DEFAULT_SECTION_CAPACITY = 40; // matches grade_section_capacity's DB column default

export const RegistrarReports: React.FC = () => {
  const { students, registrationApplications } = useApp();
  const session = readStoredSession();
  const schoolId = session?.schoolId || 'sch-1';
  const schoolStudents = filterSchoolStudents(students);
  const byGrade = enrollmentByGrade(schoolStudents);

  const [capacityRows, setCapacityRows] = useState<GradeSectionCapacity[]>([]);
  const [statusChanges, setStatusChanges] = useState<AuditLogEntry[]>([]);

  useEffect(() => {
    api.listCapacity(schoolId).then(setCapacityRows).catch(() => setCapacityRows([]));
    api
      .listAuditLogs({ entityType: 'student', limit: 100 })
      .then(setStatusChanges)
      .catch(() => setStatusChanges([]));
  }, [schoolId]);

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

  const activeStudents = useMemo(
    () => schoolStudents.filter((s) => s.status === 'Active'),
    [schoolStudents]
  );

  const capacityFor = (grade: string, section: string): number =>
    capacityRows.find((r) => r.grade === grade && r.section === section)?.capacity ??
    DEFAULT_SECTION_CAPACITY;

  const classGaps = useMemo(() => {
    const rows: { grade: string; section: string; active: number; capacity: number; vacant: number }[] = [];
    for (const grade of REGISTRAR_GRADE_OPTIONS) {
      for (const section of REGISTRAR_SECTION_OPTIONS) {
        const hasCapacityRow = capacityRows.some((r) => r.grade === grade && r.section === section);
        const active = activeStudents.filter((s) => s.grade === grade && s.section === section).length;
        if (!hasCapacityRow && active === 0) continue;
        const capacity = capacityFor(grade, section);
        rows.push({ grade, section, active, capacity, vacant: Math.max(0, capacity - active) });
      }
    }
    return rows.sort((a, b) => b.vacant - a.vacant);
  }, [activeStudents, capacityRows]);

  const totalVacantSeats = classGaps.reduce((sum, r) => sum + r.vacant, 0);

  const enrollmentRateByGrade = useMemo(() => {
    return REGISTRAR_GRADE_OPTIONS.map((grade) => {
      const gradeRows = classGaps.filter((r) => r.grade === grade);
      const capacity = gradeRows.reduce((sum, r) => sum + r.capacity, 0);
      const active = gradeRows.reduce((sum, r) => sum + r.active, 0);
      return {
        name: grade.replace('Grade ', 'G'),
        rate: capacity > 0 ? Math.round((active / capacity) * 100) : 0,
      };
    });
  }, [classGaps]);

  const enrollmentTrendByYear = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of schoolStudents) {
      if (s.status !== 'Active') continue;
      const year = s.academicYear || currentAcademicYear();
      counts[year] = (counts[year] || 0) + 1;
    }
    return Object.entries(counts)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([year, count]) => ({ name: year, students: count }));
  }, [schoolStudents]);

  const studentLookup = useMemo(() => new Map(students.map((s) => [s.id, s])), [students]);

  const departures = useMemo(() => {
    return statusChanges
      .filter((log) => {
        const status = (log.details as { status?: string } | undefined)?.status;
        return status && status !== 'Active';
      })
      .map((log) => {
        const student = log.entityId ? studentLookup.get(log.entityId) : undefined;
        const details = log.details as { status?: string; notes?: string } | undefined;
        return {
          id: log.id,
          name: student?.name ?? 'Unknown student',
          grade: student?.grade ?? '—',
          section: student?.section ?? '—',
          status: details?.status ?? '—',
          notes: details?.notes ?? '',
          date: log.createdAt,
        };
      });
  }, [statusChanges, studentLookup]);

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

  const exportClassGaps = () => {
    const csv = toCsv(
      classGaps.map((r) => ({
        grade: r.grade,
        section: r.section,
        active: r.active,
        capacity: r.capacity,
        vacant: r.vacant,
      })),
      [
        { key: 'grade', header: 'Grade' },
        { key: 'section', header: 'Section' },
        { key: 'active', header: 'Active Students' },
        { key: 'capacity', header: 'Capacity' },
        { key: 'vacant', header: 'Vacant Seats' },
      ]
    );
    downloadCsv('class-capacity-gaps.csv', csv);
  };

  const exportDepartures = () => {
    const csv = toCsv(
      departures.map((d) => ({
        name: d.name,
        grade: d.grade,
        section: d.section,
        status: d.status,
        date: new Date(d.date).toLocaleDateString(),
        notes: d.notes,
      })),
      [
        { key: 'name', header: 'Student' },
        { key: 'grade', header: 'Grade' },
        { key: 'section', header: 'Section' },
        { key: 'status', header: 'New Status' },
        { key: 'date', header: 'Date' },
        { key: 'notes', header: 'Notes' },
      ]
    );
    downloadCsv('student-departures.csv', csv);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <KpiGrid className="xl:grid-cols-5">
        <KpiWidget label="Total Active" value={stats.active} hint="Enrolled students" />
        <KpiWidget label="School Avg Mark" value={`${stats.avgMark}%`} hint="All active students" tone="emphasis" />
        <KpiWidget label="Avg Attendance" value={`${Math.round(stats.avgAttendance)}%`} hint="School-wide rate" />
        <KpiWidget
          label="Applications"
          value={stats.appStats.pending}
          hint={`${stats.appStats.enrolled} enrolled · ${stats.appStats.rejected} rejected`}
          tone="emphasis"
        />
        <KpiWidget
          label="Vacant Seats"
          value={totalVacantSeats}
          hint="Open capacity across all sections"
          tone={totalVacantSeats > 0 ? 'default' : 'muted'}
        />
      </KpiGrid>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Enrollment Rate by Grade"
          description="Active students as % of section capacity"
          data={enrollmentRateByGrade}
          type="bar"
          dataKey="rate"
          xKey="name"
          colors={enrollmentRateByGrade.map((r) =>
            r.rate >= 90 ? 'hsl(var(--destructive))' : r.rate >= 70 ? 'hsl(38 92% 50%)' : 'hsl(var(--primary))'
          )}
        />
        <ChartCard
          title="Enrollment Trend by Year"
          description="Active students by academic year"
          data={enrollmentTrendByYear}
          type="area"
          dataKey="students"
          xKey="name"
          color="hsl(var(--primary))"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TablePanel
          title="Class Capacity & Gaps"
          description="Vacant seats to fill per section"
          actions={
            <Button size="sm" variant="outline" className="text-xs h-8" onClick={exportClassGaps}>
              Export CSV
            </Button>
          }
        >
          {classGaps.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">No class capacity data yet.</p>
          ) : (
            <table className="eskooly-table">
              <thead>
                <tr>
                  <th className="p-3 text-left text-muted-foreground font-semibold text-xs">Class</th>
                  <th className="p-3 text-left text-muted-foreground font-semibold text-xs">Active</th>
                  <th className="p-3 text-left text-muted-foreground font-semibold text-xs">Capacity</th>
                  <th className="p-3 text-left text-muted-foreground font-semibold text-xs">Vacant</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {classGaps.map((r) => (
                  <tr key={`${r.grade}-${r.section}`} className="hover:bg-muted/10">
                    <td className="p-3 text-xs font-semibold text-foreground">{r.grade} · {r.section}</td>
                    <td className="p-3 text-xs">{r.active}</td>
                    <td className="p-3 text-xs">{r.capacity}</td>
                    <td className="p-3">
                      {r.vacant > 0 ? (
                        <Badge variant="warning" size="sm">{r.vacant} open</Badge>
                      ) : (
                        <Badge variant="neutral" size="sm">Full</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </TablePanel>

        <TablePanel
          title="Recent Departures"
          description="Students who transferred, graduated, or were suspended"
          actions={
            departures.length > 0 ? (
              <Button size="sm" variant="outline" className="text-xs h-8" onClick={exportDepartures}>
                Export CSV
              </Button>
            ) : undefined
          }
        >
          {departures.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">No recent status changes.</p>
          ) : (
            <table className="eskooly-table">
              <thead>
                <tr>
                  <th className="p-3 text-left text-muted-foreground font-semibold text-xs">Student</th>
                  <th className="p-3 text-left text-muted-foreground font-semibold text-xs">Grade</th>
                  <th className="p-3 text-left text-muted-foreground font-semibold text-xs">Status</th>
                  <th className="p-3 text-left text-muted-foreground font-semibold text-xs">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {departures.map((d) => (
                  <tr key={d.id} className="hover:bg-muted/10">
                    <td className="p-3 text-xs font-semibold text-foreground">{d.name}</td>
                    <td className="p-3 text-xs">{d.grade} · {d.section}</td>
                    <td className="p-3">
                      <Badge variant="info" size="sm">{d.status}</Badge>
                    </td>
                    <td className="p-3 text-xs text-muted-foreground">
                      {new Date(d.date).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </TablePanel>
      </div>

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
