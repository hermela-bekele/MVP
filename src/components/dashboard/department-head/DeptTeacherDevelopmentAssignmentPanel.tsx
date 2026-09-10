'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ClipboardCheck, Sparkles } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { isSubjectTeacher, resolveDeptHeadScope } from '@/lib/departmentHead';
import { getTeacherExperienceLevel } from '@/lib/mockData';
import { getCompetencyLabel } from '@/lib/selfAssessmentRubric';
import { TIP_MODULES } from '@/lib/inductionModules';
import { CONTINUOUS_DEVELOPMENT_MODULES } from '@/lib/continuousDevelopmentModules';
import {
  buildTeacherSuggestion,
  computeQuestionMissStats,
  enrichMissStatsFromAssessment,
  highMissQuestions,
  type QuestionMissStat,
} from '@/lib/gradeMissAnalytics';
import { aisTextarea } from '@/components/dashboard/teacher/TeacherPortalUi';

/**
 * HoD picks one teacher, reviews the gap analysis (missed-question stats + STEP
 * self-assessment), then assigns one of the existing TIP/STEP modules — no ad-hoc
 * module generation here. Generating new custom modules from a gap only happens in
 * Teacher Development's gap-analysis flow; this panel is assignment-only.
 */
export function DeptTeacherDevelopmentAssignmentPanel() {
  const {
    currentUser,
    teachers,
    assessments,
    teacherSelfAssessments,
    teacherTrainingAssignments,
    studentGradeEntries,
    assignTrainingModule,
    addNotification,
  } = useApp();

  const scope = useMemo(() => resolveDeptHeadScope(currentUser), [currentUser]);
  const deptTeachers = useMemo(
    () =>
      (scope ? teachers.filter((t) => isSubjectTeacher(t, scope) && t.status === 'Active') : []),
    [teachers, scope],
  );

  const [teacherId, setTeacherId] = useState('');
  const [moduleId, setModuleId] = useState('');
  const [reason, setReason] = useState('');
  // TR-005: the HoD sets the completion timeframe at assignment time.
  const [dueDate, setDueDate] = useState('');

  useEffect(() => {
    if (!teacherId && deptTeachers[0]) setTeacherId(deptTeachers[0].id);
  }, [deptTeachers, teacherId]);

  const teacher = deptTeachers.find((t) => t.id === teacherId);

  const missStats = useMemo(() => {
    if (!teacherId) return [] as QuestionMissStat[];
    const entries = studentGradeEntries.filter((e) => e.teacherId === teacherId);
    const stats = computeQuestionMissStats(entries, { minAttempts: 1 });
    // Enrich topics/prompts from linked assessment banks when available
    const byTitle = new Map(assessments.map((a) => [a.title, a]));
    const enriched: QuestionMissStat[] = [];
    for (const s of stats) {
      const linked =
        assessments.find((a) => a.title === s.assessmentTitle) ||
        byTitle.get(s.assessmentTitle);
      const [one] = enrichMissStatsFromAssessment([s], linked);
      enriched.push(one || s);
    }
    return enriched;
  }, [studentGradeEntries, teacherId, assessments]);

  const missedQuestions = useMemo(() => {
    const high = highMissQuestions(missStats);
    const list = high.length ? high : missStats.filter((s) => s.missed > 0);
    // Unique by topic+assessment, prefer highest miss rate
    const best = new Map<string, QuestionMissStat>();
    for (const s of list) {
      const topic = (s.topicHint || '').trim() || `Question ${s.questionNumber}`;
      const key = `${topic.toLowerCase()}::${s.assessmentTitle}`;
      const prev = best.get(key);
      if (!prev || s.missRate > prev.missRate) best.set(key, s);
    }
    return [...best.values()]
      .sort((a, b) => b.missRate - a.missRate || b.missed - a.missed)
      .slice(0, 12);
  }, [missStats]);

  const latestAssessment = useMemo(() => {
    if (!teacherId) return undefined;
    return teacherSelfAssessments
      .filter((a) => a.teacherId === teacherId)
      .sort((a, b) => (a.submittedAt < b.submittedAt ? 1 : -1))[0];
  }, [teacherSelfAssessments, teacherId]);

  const modules = useMemo(() => {
    if (!teacher) return [];
    const level = getTeacherExperienceLevel(teacher);
    return level === 'new' ? TIP_MODULES : CONTINUOUS_DEVELOPMENT_MODULES;
  }, [teacher]);

  // Gap-analysis-driven default: pre-select a module and pre-fill the reason from the
  // highest-miss-rate topic (or the STEP self-assessment's weakest competency) — the HoD
  // can still change the module, but the starting point always traces back to evidence.
  useEffect(() => {
    setModuleId(modules[0]?.id ?? '');
    setReason(
      missedQuestions[0]
        ? buildTeacherSuggestion([missedQuestions[0]])
        : latestAssessment?.weakestCompetencyId
          ? `Self-assessment flagged: ${getCompetencyLabel(latestAssessment.weakestCompetencyId)}`
          : '',
    );
  }, [teacherId, modules, missedQuestions, latestAssessment]);

  const assignments = useMemo(
    () =>
      teacherId
        ? teacherTrainingAssignments.filter((a) => a.teacherId === teacherId)
        : [],
    [teacherTrainingAssignments, teacherId],
  );

  const handleAssign = () => {
    if (!teacher) return;
    const level = getTeacherExperienceLevel(teacher);
    const chosen = modules.find((m) => m.id === moduleId) ?? modules[0];
    if (!chosen) return;
    assignTrainingModule({
      teacherId: teacher.id,
      program: level === 'new' ? 'TIP' : 'STEP',
      moduleId: chosen.id,
      moduleTitle: chosen.title,
      assignedByName: currentUser?.displayName ?? 'Head of Department',
      reason: reason.trim() || undefined,
      dueDate: dueDate || undefined,
      sessionsTotal: chosen.sessions?.length,
    });
    addNotification(
      'Training assigned',
      `"${chosen.title}" was assigned to ${teacher.name}.`,
      'success',
    );
  };

  if (!scope) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <ClipboardCheck className="h-4 w-4 text-primary" />
          Assign teacher development modules
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-2">
        <Select
          label="Teacher"
          options={
            deptTeachers.length
              ? deptTeachers.map((t) => ({ value: t.id, label: t.name }))
              : [{ value: '', label: 'No department teachers' }]
          }
          value={teacherId}
          onChange={(e) => setTeacherId(e.target.value)}
          disabled={!deptTeachers.length}
        />

        {!teacher ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Select a teacher to assign development.
          </p>
        ) : (
          <>
            <div className="rounded-xl border border-border/50 p-3 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold">{teacher.name}</p>
                <Badge
                  variant={getTeacherExperienceLevel(teacher) === 'new' ? 'warning' : 'neutral'}
                  size="sm"
                >
                  {getTeacherExperienceLevel(teacher) === 'new'
                    ? 'New teacher · TIP'
                    : 'Experienced · STEP'}
                </Badge>
              </div>
              {latestAssessment ? (
                <p className="text-xs text-muted-foreground">
                  Self-assessment: {latestAssessment.overallScore}%
                  {latestAssessment.weakestCompetencyId
                    ? ` · Weakest: ${getCompetencyLabel(latestAssessment.weakestCompetencyId)}`
                    : ''}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">No STEP self-assessment yet</p>
              )}
              {missedQuestions.length > 0 && (
                <p className="text-xs text-amber-700 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  {missedQuestions.length} high-miss question
                  {missedQuestions.length === 1 ? '' : 's'} from student results — see full gap
                  analysis in the Teacher Development tab.
                </p>
              )}
              {assignments.length > 0 && (
                <div className="space-y-2 pt-1">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                    Training progress
                  </p>
                  {assignments.map((a) => (
                    <div key={a.id} className="rounded-lg border border-border/50 p-2.5 text-xs space-y-1.5">
                      <div className="flex flex-wrap items-center justify-between gap-1.5">
                        <span className="font-semibold text-foreground">{a.moduleTitle}</span>
                        <Badge
                          variant={a.status === 'completed' ? 'success' : a.overdue ? 'danger' : 'info'}
                          size="sm"
                        >
                          {a.overdue ? 'Late' : a.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground">
                        <span>Assigned {a.createdAt.slice(0, 10)}</span>
                        {a.dueDate && <span>Due {a.dueDate}</span>}
                        <span>
                          Sessions {a.sessionsCompleted}
                          {a.sessionsTotal != null ? `/${a.sessionsTotal}` : ''}
                        </span>
                        <span>
                          Assessment{' '}
                          {a.assessmentPassed === true
                            ? `passed (${a.assessmentScore}%)`
                            : a.assessmentPassed === false
                              ? `not passed (${a.assessmentScore}%)`
                              : 'not attempted'}
                        </span>
                        <span>Reflection {a.reflectionSubmitted ? 'submitted' : 'pending'}</span>
                        {a.completedAt && <span>Completed {a.completedAt.slice(0, 10)}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase">
                Completion timeframe (optional)
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full h-10 px-3 bg-muted/40 border border-border rounded-md text-xs text-foreground focus:outline-none"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-[1fr_auto] items-end">
              <Select
                label={
                  getTeacherExperienceLevel(teacher) === 'new'
                    ? 'Module (Induction · TIP)'
                    : 'Module (Continuous Development · STEP)'
                }
                value={moduleId}
                onChange={(e) => setModuleId(e.target.value)}
                options={modules.map((m) => ({ value: m.id, label: m.title }))}
              />
              <Button
                size="sm"
                variant="organic"
                className="border-none text-xs h-10"
                onClick={handleAssign}
                disabled={!moduleId}
              >
                Assign module
              </Button>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase">
                Reason / gap-analysis suggestion (editable)
              </label>
              <textarea
                className={aisTextarea}
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Why this module — auto-filled from the gap analysis, editable before assigning"
              />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
