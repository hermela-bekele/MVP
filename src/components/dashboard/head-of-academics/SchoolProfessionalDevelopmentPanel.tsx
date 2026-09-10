'use client';

import React, { useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { KpiWidget, KpiGrid } from '@/components/dashboard/KpiWidget';
import { TablePanel } from '@/components/dashboard/TablePanel';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Inbox } from 'lucide-react';
import { resolveHeadOfAcademicsScope } from '@/lib/headOfAcademicsPortal';
import { TRAINING_MODULES } from '@/lib/trainingModules';
import { TIP_MODULES } from '@/lib/inductionModules';
import { ELEP_MODULES } from '@/lib/leadershipModules';
import { CONTINUOUS_DEVELOPMENT_MODULES } from '@/lib/continuousDevelopmentModules';

/** Which of the four learning tracks a module belongs to — resolved from the module
 * catalog it actually lives in, not the assignment's TIP/STEP/ELEP `program` field alone
 * (subject-matter modules are assigned under TIP/STEP depending on teacher experience,
 * so `program` alone can't distinguish "subject-matter" from "induction/continuous"). */
function programmeForModule(moduleId: string): string {
  if (TRAINING_MODULES.some((m) => m.id === moduleId)) return 'Subject-Matter Training';
  if (TIP_MODULES.some((m) => m.id === moduleId)) return 'TIP Induction';
  if (ELEP_MODULES.some((m) => m.id === moduleId)) return 'ELEP Leadership';
  if (CONTINUOUS_DEVELOPMENT_MODULES.some((m) => m.id === moduleId)) return 'Continuous Development (STEP)';
  return 'Other';
}

interface DevelopmentAggregate {
  key: string;
  label: string;
  total: number;
  completed: number;
  overdue: number;
  assessed: number;
  passed: number;
}

function accumulate(rows: DevelopmentAggregate[], key: string, label: string): DevelopmentAggregate {
  let row = rows.find((r) => r.key === key);
  if (!row) {
    row = { key, label, total: 0, completed: 0, overdue: 0, assessed: 0, passed: 0 };
    rows.push(row);
  }
  return row;
}

function completionRate(row: { total: number; completed: number }): number {
  return row.total > 0 ? Math.round((row.completed / row.total) * 100) : 0;
}

function impactRate(row: { assessed: number; passed: number }): number | null {
  return row.assessed > 0 ? Math.round((row.passed / row.assessed) * 100) : null;
}

/**
 * School-wide teacher development oversight for the Head of Academics — distinct from a
 * teacher's own "browse my courses" view. Aggregates every training assignment across
 * every department by: department, programme, completion, development need (the
 * gap-analysis reason an assignment was made), and impact (assessment pass rate among
 * completed assignments — the only outcome evidence this data actually supports).
 */
export function SchoolProfessionalDevelopmentPanel() {
  const { currentUser, teachers, departments, teacherTrainingAssignments } = useApp();
  const scope = useMemo(() => resolveHeadOfAcademicsScope(currentUser), [currentUser]);

  const schoolTeachers = useMemo(
    () => (scope ? teachers.filter((t) => t.schoolId === scope.schoolId) : []),
    [teachers, scope],
  );
  const teacherIds = useMemo(() => new Set(schoolTeachers.map((t) => t.id)), [schoolTeachers]);
  const teacherById = useMemo(() => new Map(schoolTeachers.map((t) => [t.id, t])), [schoolTeachers]);
  const departmentNameById = useMemo(() => new Map(departments.map((d) => [d.id, d.name])), [departments]);

  const rows = useMemo(() => {
    return teacherTrainingAssignments
      .filter((a) => teacherIds.has(a.teacherId))
      .map((a) => {
        const teacher = teacherById.get(a.teacherId);
        const departmentId = teacher?.departmentId;
        return {
          ...a,
          teacherName: teacher?.name ?? 'Unknown teacher',
          departmentId,
          departmentName: departmentId ? departmentNameById.get(departmentId) ?? 'Unassigned' : 'Unassigned',
          programme: programmeForModule(a.moduleId),
        };
      });
  }, [teacherTrainingAssignments, teacherIds, teacherById, departmentNameById]);

  const total = rows.length;
  const completedCount = rows.filter((r) => r.status === 'completed').length;
  const overdueCount = rows.filter((r) => r.overdue && r.status !== 'completed').length;
  const assessedRows = rows.filter((r) => r.assessmentPassed != null);
  const passRate = impactRate({ assessed: assessedRows.length, passed: assessedRows.filter((r) => r.assessmentPassed).length });

  const byDepartment = useMemo(() => {
    const acc: DevelopmentAggregate[] = [];
    for (const r of rows) {
      const row = accumulate(acc, r.departmentId ?? 'unassigned', r.departmentName);
      row.total += 1;
      if (r.status === 'completed') row.completed += 1;
      if (r.overdue && r.status !== 'completed') row.overdue += 1;
      if (r.assessmentPassed != null) {
        row.assessed += 1;
        if (r.assessmentPassed) row.passed += 1;
      }
    }
    return acc.sort((a, b) => b.total - a.total);
  }, [rows]);

  const byProgramme = useMemo(() => {
    const acc: DevelopmentAggregate[] = [];
    for (const r of rows) {
      const row = accumulate(acc, r.programme, r.programme);
      row.total += 1;
      if (r.status === 'completed') row.completed += 1;
      if (r.overdue && r.status !== 'completed') row.overdue += 1;
      if (r.assessmentPassed != null) {
        row.assessed += 1;
        if (r.assessmentPassed) row.passed += 1;
      }
    }
    return acc.sort((a, b) => b.total - a.total);
  }, [rows]);

  const developmentNeeds = useMemo(
    () =>
      rows
        .filter((r) => r.reason?.trim())
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 25),
    [rows],
  );

  return (
    <div className="space-y-6 animate-fade-in text-left">
      <KpiGrid>
        <KpiWidget
          label="Total Assignments"
          value={total}
          hint="School-wide, all programmes"
          tooltip={{ description: 'Every training module assignment recorded for a teacher at this school, across all departments and programmes.' }}
        />
        <KpiWidget
          label="Completion Rate"
          value={`${completionRate({ total, completed: completedCount })}%`}
          hint={`${completedCount} of ${total} completed`}
          tooltip={{ description: 'Percentage of assignments marked completed — which requires all sessions done, the assessment passed, and the reflection submitted (enforced server-side, never self-declared).' }}
        />
        <KpiWidget
          label="Overdue"
          value={overdueCount}
          hint="Past due date, not completed"
          tone={overdueCount > 0 ? 'emphasis' : 'default'}
          tooltip={{ description: 'Assignments past their HoD-set due date that are not yet completed.' }}
        />
        <KpiWidget
          label="Impact (Assessment Pass Rate)"
          value={passRate != null ? `${passRate}%` : '—'}
          hint="Among assignments with an attempted assessment"
          tooltip={{
            description: 'Percentage of attempted module assessments that were passed — the only outcome evidence this data supports.',
            detail: 'Not a measure of classroom impact or student outcomes; those require separate longitudinal evidence.',
          }}
        />
      </KpiGrid>

      <TablePanel
        title="By Department"
        description="Development activity aggregated across every department at this school"
      >
        {byDepartment.length === 0 ? (
          <EmptyState icon={<Inbox />} title="No training assignments recorded yet." className="py-8" />
        ) : (
          <table className="eskooly-table">
            <thead>
              <tr>
                <th>Department</th>
                <th>Assignments</th>
                <th>Completed</th>
                <th>Overdue</th>
                <th>Impact (pass rate)</th>
              </tr>
            </thead>
            <tbody>
              {byDepartment.map((row) => {
                const impact = impactRate(row);
                return (
                  <tr key={row.key} className="hover:bg-muted/20">
                    <td className="p-3 font-semibold text-foreground">{row.label}</td>
                    <td className="p-3 font-mono">{row.total}</td>
                    <td className="p-3">
                      <Badge variant="success" size="sm" badgeStyle="subtle">{completionRate(row)}%</Badge>
                    </td>
                    <td className="p-3">
                      {row.overdue > 0 ? (
                        <Badge variant="danger" size="sm" badgeStyle="subtle">{row.overdue}</Badge>
                      ) : (
                        <span className="text-xxs text-muted-foreground">0</span>
                      )}
                    </td>
                    <td className="p-3 text-xs text-muted-foreground">{impact != null ? `${impact}%` : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </TablePanel>

      <TablePanel
        title="By Programme"
        description="Subject-Matter Training, TIP Induction, ELEP Leadership, and Continuous Development (STEP) — never blended into one number"
      >
        {byProgramme.length === 0 ? (
          <EmptyState icon={<Inbox />} title="No training assignments recorded yet." className="py-8" />
        ) : (
          <table className="eskooly-table">
            <thead>
              <tr>
                <th>Programme</th>
                <th>Assignments</th>
                <th>Completed</th>
                <th>Overdue</th>
                <th>Impact (pass rate)</th>
              </tr>
            </thead>
            <tbody>
              {byProgramme.map((row) => {
                const impact = impactRate(row);
                return (
                  <tr key={row.key} className="hover:bg-muted/20">
                    <td className="p-3 font-semibold text-foreground">{row.label}</td>
                    <td className="p-3 font-mono">{row.total}</td>
                    <td className="p-3">
                      <Badge variant="success" size="sm" badgeStyle="subtle">{completionRate(row)}%</Badge>
                    </td>
                    <td className="p-3">
                      {row.overdue > 0 ? (
                        <Badge variant="danger" size="sm" badgeStyle="subtle">{row.overdue}</Badge>
                      ) : (
                        <span className="text-xxs text-muted-foreground">0</span>
                      )}
                    </td>
                    <td className="p-3 text-xs text-muted-foreground">{impact != null ? `${impact}%` : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </TablePanel>

      <TablePanel
        title="Development Needs (most recent)"
        description="Why each assignment was made — the gap-analysis or coaching reason recorded at assignment time"
      >
        {developmentNeeds.length === 0 ? (
          <EmptyState icon={<Inbox />} title="No assignment reasons recorded yet." className="py-8" />
        ) : (
          <table className="eskooly-table">
            <thead>
              <tr>
                <th>Teacher</th>
                <th>Department</th>
                <th>Module</th>
                <th>Programme</th>
                <th>Reason</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {developmentNeeds.map((r) => (
                <tr key={r.id} className="hover:bg-muted/20">
                  <td className="p-3 font-semibold text-foreground">{r.teacherName}</td>
                  <td className="p-3">{r.departmentName}</td>
                  <td className="p-3">{r.moduleTitle}</td>
                  <td className="p-3 text-xs text-muted-foreground">{r.programme}</td>
                  <td className="p-3 text-xs text-muted-foreground max-w-xs truncate" title={r.reason}>{r.reason}</td>
                  <td className="p-3">
                    <Badge variant={r.status === 'completed' ? 'success' : r.overdue ? 'danger' : 'neutral'} size="sm">
                      {r.overdue ? 'Overdue' : r.status.replace('_', ' ')}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </TablePanel>
    </div>
  );
}
