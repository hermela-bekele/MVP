'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { TablePanel } from '@/components/dashboard/TablePanel';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { computeTeacherDevelopmentRollup, computeScheduledTrainingRollup } from '@/lib/schoolHeadAnalytics';

const PROGRAM_LABELS: Record<string, string> = {
  TIP: 'Teacher Induction Program (TIP)',
  STEP: 'School-based Teacher Enrichment (STEP)',
  ELEP: 'Education Leadership Excellence Program (ELEP)',
};

/**
 * Real institutional training-participation view, replacing a per-teacher
 * table that showed a single fabricated course name ("National Pedagogy
 * Masterclass") for every teacher regardless of what they were actually
 * assigned. This reads real teacher_training_assignments rows instead.
 */
export const FacultyDevelopmentProgress: React.FC<{ schoolId?: string }> = ({ schoolId }) => {
  const { teachers, teacherTrainingAssignments, trainingPlans, trainingPlanAssignments } = useApp();

  const schoolTeachers = React.useMemo(
    () => teachers.filter((t) => !schoolId || t.schoolId === schoolId),
    [teachers, schoolId],
  );
  const schoolTeacherIds = React.useMemo(() => new Set(schoolTeachers.map((t) => t.id)), [schoolTeachers]);
  const rollup = React.useMemo(
    () => computeTeacherDevelopmentRollup(teacherTrainingAssignments, schoolTeacherIds),
    [teacherTrainingAssignments, schoolTeacherIds],
  );
  const scheduledRollup = React.useMemo(
    () => computeScheduledTrainingRollup(trainingPlans, trainingPlanAssignments, schoolTeacherIds),
    [trainingPlans, trainingPlanAssignments, schoolTeacherIds],
  );

  const schoolAssignments = React.useMemo(
    () => teacherTrainingAssignments.filter((a) => schoolTeacherIds.has(a.teacherId)),
    [teacherTrainingAssignments, schoolTeacherIds],
  );

  const teacherName = (teacherId: string) => schoolTeachers.find((t) => t.id === teacherId)?.name ?? 'Unknown';

  if (rollup.totalAssignments === 0 && scheduledRollup.totalAssignments === 0) {
    return (
      <Card className="border-border/60">
        <CardContent className="pt-6 text-center text-xs text-muted-foreground">
          No training assignments have been recorded for this school&apos;s faculty yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {scheduledRollup.totalAssignments > 0 && (
        <Card className="border-border/60">
          <CardContent className="pt-5 space-y-3">
            <p className="text-xs font-bold text-foreground">MOE / HR-Scheduled Training Sessions</p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div><p className="text-lg font-bold text-success">{scheduledRollup.attendedCount}</p><p className="text-[9px] text-muted-foreground">Attended</p></div>
              <div><p className="text-lg font-bold text-red-600">{scheduledRollup.notAttendedCount}</p><p className="text-[9px] text-muted-foreground">Did Not Attend</p></div>
              <div><p className="text-lg font-bold text-muted-foreground">{scheduledRollup.notRecordedCount}</p><p className="text-[9px] text-muted-foreground">Not Recorded</p></div>
            </div>
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>{scheduledRollup.totalAssignments} individual assignment{scheduledRollup.totalAssignments === 1 ? '' : 's'}</span>
              {scheduledRollup.averageImpactRating !== null ? (
                <Badge variant={scheduledRollup.averageImpactRating >= 4 ? 'success' : scheduledRollup.averageImpactRating >= 3 ? 'warning' : 'danger'} badgeStyle="subtle" size="sm">
                  Avg impact: {scheduledRollup.averageImpactRating}/5 ({scheduledRollup.ratedCount} rated)
                </Badge>
              ) : (
                <span className="italic">No impact ratings yet</span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {rollup.totalAssignments === 0 ? (
        <Card className="border-border/60">
          <CardContent className="pt-6 text-center text-xs text-muted-foreground">
            No TIP/STEP/ELEP module assignments have been recorded for this school&apos;s faculty yet.
          </CardContent>
        </Card>
      ) : (
      <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {rollup.byProgram.map((p) => (
          <Card key={p.program} className="border-border/60">
            <CardContent className="pt-5 space-y-3">
              <p className="text-xs font-bold text-foreground">{PROGRAM_LABELS[p.program] ?? p.program}</p>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div><p className="text-lg font-bold text-foreground">{p.assignedCount}</p><p className="text-[9px] text-muted-foreground">Assigned</p></div>
                <div><p className="text-lg font-bold text-success">{p.completedCount}</p><p className="text-[9px] text-muted-foreground">Completed</p></div>
                <div><p className="text-lg font-bold text-red-600">{p.overdueCount}</p><p className="text-[9px] text-muted-foreground">Overdue</p></div>
              </div>
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span>{p.participantCount} participant{p.participantCount === 1 ? '' : 's'}</span>
                <Badge variant={p.completionRate >= 70 ? 'success' : p.completionRate >= 40 ? 'warning' : 'danger'} badgeStyle="subtle" size="sm">
                  {p.completionRate}% complete
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <TablePanel
        title="Faculty Training Assignments"
        description="Every training assignment currently on record for this school's faculty."
      >
        <table className="eskooly-table">
          <thead>
            <tr>
              <th className="p-3 text-left text-muted-foreground font-semibold">Faculty Member</th>
              <th className="p-3 text-left text-muted-foreground font-semibold">Program</th>
              <th className="p-3 text-left text-muted-foreground font-semibold">Module</th>
              <th className="p-3 text-left text-muted-foreground font-semibold">Status</th>
              <th className="p-3 text-left text-muted-foreground font-semibold">Sessions</th>
              <th className="p-3 text-left text-muted-foreground font-semibold">Due</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40 text-muted-foreground">
            {schoolAssignments.map((a) => (
              <tr key={a.id} className="hover:bg-muted/10">
                <td className="p-3 text-foreground font-bold">{teacherName(a.teacherId)}</td>
                <td className="p-3 font-semibold text-primary">{a.program}</td>
                <td className="p-3 text-foreground">{a.moduleTitle}</td>
                <td className="p-3">
                  <Badge
                    variant={a.overdue ? 'danger' : a.status === 'completed' ? 'success' : a.status === 'in_progress' ? 'warning' : 'neutral'}
                    size="sm"
                  >
                    {a.overdue ? 'Overdue' : a.status === 'in_progress' ? 'In progress' : a.status === 'completed' ? 'Completed' : 'Assigned'}
                  </Badge>
                </td>
                <td className="p-3 font-mono text-foreground">
                  {a.sessionsCompleted}{typeof a.sessionsTotal === 'number' ? `/${a.sessionsTotal}` : ''}
                </td>
                <td className="p-3 text-foreground">{a.dueDate ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TablePanel>
      </>
      )}
    </div>
  );
};
