'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ClipboardCheck, Loader2, Sparkles } from 'lucide-react';
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
import {
  AisBtnPrimary,
  aisTextarea,
} from '@/components/dashboard/teacher/TeacherPortalUi';

type AssignMode = 'preset' | 'ai';
type GapFocus = 'subject-matter' | 'pedagogy';

function shortLabel(text: string, max = 48) {
  const t = text.replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

/**
 * HoD picks one teacher, then assigns a preset TIP/STEP module or expands a
 * gap-analysis missed-question suggestion into a PD module.
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
    addTrainingMaterial,
  } = useApp();

  const scope = useMemo(() => resolveDeptHeadScope(currentUser), [currentUser]);
  const deptTeachers = useMemo(
    () =>
      (scope ? teachers.filter((t) => isSubjectTeacher(t, scope) && t.status === 'Active') : []),
    [teachers, scope],
  );

  const [teacherId, setTeacherId] = useState('');
  const [mode, setMode] = useState<AssignMode>('preset');
  const [moduleId, setModuleId] = useState('');
  const [reason, setReason] = useState('');
  const [gapFocus, setGapFocus] = useState<GapFocus>('subject-matter');
  const [missKey, setMissKey] = useState('');
  const [aiTopic, setAiTopic] = useState('');
  const [generating, setGenerating] = useState(false);

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

  const missOptions = useMemo(
    () =>
      missedQuestions.map((s) => ({
        value: s.key,
        label: `Q${s.questionNumber} · ${shortLabel(s.topicHint || 'Topic', 36)} · ${s.missRate}%`,
        title: `${s.topicHint} — ${s.assessmentTitle} (${s.missed}/${s.attempted} missed)`,
      })),
    [missedQuestions],
  );

  const selectedMiss = missedQuestions.find((s) => s.key === missKey) ?? missedQuestions[0];

  const gapSuggestion = useMemo(() => {
    if (!selectedMiss) return '';
    // Suggestion focused on the selected missed question (same style as gradebook)
    return buildTeacherSuggestion([selectedMiss, ...missStats.filter((s) => s.key !== selectedMiss.key)]);
  }, [selectedMiss, missStats]);

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

  useEffect(() => {
    setModuleId(modules[0]?.id ?? '');
    setMissKey(missedQuestions[0]?.key ?? '');
    const topic = missedQuestions[0]?.topicHint ?? '';
    setAiTopic(topic);
    setReason(
      missedQuestions[0]
        ? buildTeacherSuggestion([missedQuestions[0]])
        : latestAssessment?.weakestCompetencyId
          ? `Self-assessment flagged: ${getCompetencyLabel(latestAssessment.weakestCompetencyId)}`
          : '',
    );
  }, [teacherId, modules, missedQuestions, latestAssessment]);

  useEffect(() => {
    if (!selectedMiss) return;
    setAiTopic(selectedMiss.topicHint);
    setReason(buildTeacherSuggestion([selectedMiss]));
  }, [selectedMiss?.key]);

  const assignments = useMemo(
    () =>
      teacherId
        ? teacherTrainingAssignments.filter((a) => a.teacherId === teacherId)
        : [],
    [teacherTrainingAssignments, teacherId],
  );

  const handleAssignPreset = () => {
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
    });
    addNotification(
      'Training assigned',
      `"${chosen.title}" was assigned to ${teacher.name}.`,
      'success',
    );
  };

  const handleGenerateAndAssign = async () => {
    if (!teacher || !scope) return;

    const topic =
      (gapFocus === 'subject-matter'
        ? selectedMiss?.topicHint || aiTopic
        : aiTopic.trim()) ||
      (gapFocus === 'pedagogy'
        ? latestAssessment?.weakestCompetencyId
          ? getCompetencyLabel(latestAssessment.weakestCompetencyId)
          : 'Inclusive classroom pedagogy'
        : `${scope.subject} instructional gaps`);

    const suggestion =
      gapFocus === 'subject-matter'
        ? gapSuggestion || reason.trim()
        : reason.trim() ||
          `Strengthen pedagogy around “${topic}” for ${teacher.name}.`;

    setGenerating(true);
    try {
      const missContext =
        gapFocus === 'subject-matter' && selectedMiss
          ? [
              `Missed question: Q${selectedMiss.questionNumber} on “${selectedMiss.assessmentTitle}”`,
              `Topic: ${selectedMiss.topicHint}`,
              `Miss rate: ${selectedMiss.missRate}% (${selectedMiss.missed}/${selectedMiss.attempted})`,
              selectedMiss.prompt ? `Question: ${selectedMiss.prompt}` : '',
              `Class: ${selectedMiss.gradeLevel} ${selectedMiss.section} · ${selectedMiss.subject}`,
            ]
              .filter(Boolean)
              .join('\n')
          : [
              `Pedagogy gap for ${teacher.name}.`,
              latestAssessment
                ? `STEP self-assessment overall ${latestAssessment.overallScore}%` +
                  (latestAssessment.weakestCompetencyId
                    ? `; weakest: ${getCompetencyLabel(latestAssessment.weakestCompetencyId)}`
                    : '')
                : '',
            ]
              .filter(Boolean)
              .join('\n');

      const res = await fetch('/api/ai/training-module', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'from-suggestion',
          topic: topic.trim(),
          subject: gapFocus === 'subject-matter' ? scope.subject : 'Pedagogy',
          grade: selectedMiss?.gradeLevel || teacher.grades?.[0] || '',
          suggestion,
          missContext,
        }),
      });
      const data = (await res.json()) as {
        title?: string;
        markdown?: string;
        summary?: string;
        error?: string;
      };
      if (!res.ok || !data.markdown) {
        throw new Error(data.error || 'Generation failed');
      }

      const title = data.title || `PD Module: ${topic}`;
      const resourceUrl = `inline-md:${encodeURIComponent(data.markdown)}`;
      addTrainingMaterial({
        title,
        category: gapFocus === 'subject-matter' ? 'Subject Specialty' : 'Pedagogy',
        trainingType: gapFocus === 'subject-matter' ? 'Subject Specialty' : 'Pedagogy',
        departmentId: scope.departmentId,
        grade: selectedMiss?.gradeLevel || teacher.grades?.[0] || 'All',
        subject: gapFocus === 'subject-matter' ? scope.subject : 'All',
        resourceUrl,
      });

      const level = getTeacherExperienceLevel(teacher);
      assignTrainingModule({
        teacherId: teacher.id,
        program: level === 'new' ? 'TIP' : 'STEP',
        moduleId: `ai-${Date.now()}`,
        moduleTitle: title,
        assignedByName: currentUser?.displayName ?? 'Head of Department',
        reason: suggestion.slice(0, 240) || `Gap module: ${topic}`,
      });

      addNotification(
        'Module from gap suggestion',
        `"${title}" expanded from the missed-question coaching tip and assigned to ${teacher.name}.`,
        'success',
      );
    } catch {
      addNotification(
        'Generation failed',
        'Could not expand the gap suggestion into a module. Try again or assign a preset.',
        'alert',
      );
    } finally {
      setGenerating(false);
    }
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
                  {missedQuestions.length === 1 ? '' : 's'} from student results
                </p>
              )}
              {assignments.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {assignments.map((a) => (
                    <Badge
                      key={a.id}
                      variant={a.status === 'completed' ? 'success' : 'info'}
                      size="sm"
                    >
                      {a.moduleTitle} · {a.status.replace('_', ' ')}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <Select
              label="Assignment type"
              options={[
                { value: 'preset', label: 'Assign preset Induction module' },
                { value: 'Continuous', label: 'Assign Continuous Development module'},
                { value: 'ai', label: 'Module from missed-question suggestion' },
              ]}
              value={mode}
              onChange={(e) => setMode(e.target.value as AssignMode)}
            />

            {mode === 'preset' ? (
              <div className="grid gap-3 sm:grid-cols-[1fr_auto] items-end">
                <Select
                  label="Module"
                  value={moduleId}
                  onChange={(e) => setModuleId(e.target.value)}
                  options={modules.map((m) => ({ value: m.id, label: m.title }))}
                />
                <Button
                  size="sm"
                  variant="organic"
                  className="border-none text-xs h-10"
                  onClick={handleAssignPreset}
                  disabled={!moduleId}
                >
                  Assign module
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <Select
                  label="Gap focus"
                  options={[
                    { value: 'subject-matter', label: 'Subject matter (missed questions)' },
                    { value: 'pedagogy', label: 'Pedagogy / teaching skills' },
                  ]}
                  value={gapFocus}
                  onChange={(e) => setGapFocus(e.target.value as GapFocus)}
                />

                {gapFocus === 'subject-matter' ? (
                  missOptions.length > 0 ? (
                    <>
                      <Select
                        label="Missed question / topic"
                        options={missOptions}
                        value={selectedMiss?.key ?? ''}
                        onChange={(e) => setMissKey(e.target.value)}
                      />
                      {selectedMiss && (
                        <div className="rounded-lg border border-border/50 bg-muted/30 p-3 space-y-1.5">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                            Coaching suggestion
                          </p>
                          <p className="text-xs text-foreground leading-relaxed">
                            {gapSuggestion}
                          </p>
                          {selectedMiss.prompt && (
                            <p
                              className="text-[11px] text-muted-foreground line-clamp-2"
                              title={selectedMiss.prompt}
                            >
                              Q{selectedMiss.questionNumber}: {selectedMiss.prompt}
                            </p>
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      No missed-question results yet for this teacher. Run gap analysis after
                      question-level grades are recorded.
                    </p>
                  )
                ) : (
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase">
                      Pedagogy focus
                    </label>
                    <input
                      type="text"
                      value={aiTopic}
                      onChange={(e) => setAiTopic(e.target.value)}
                      placeholder="e.g. Differentiation, classroom management"
                      className="w-full h-10 px-3 bg-muted/40 border border-border rounded-md text-xs text-foreground focus:outline-none"
                    />
                  </div>
                )}

                <AisBtnPrimary
                  type="button"
                  disabled={
                    generating ||
                    (gapFocus === 'subject-matter'
                      ? !selectedMiss
                      : !aiTopic.trim())
                  }
                  onClick={() => void handleGenerateAndAssign()}
                >
                  {generating ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5" />
                  )}
                  {generating
                    ? 'Expanding suggestion…'
                    : gapFocus === 'subject-matter'
                      ? 'Make module from suggestion'
                      : 'Generate & assign'}
                </AisBtnPrimary>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase">
                Reason / suggestion (editable)
              </label>
              <textarea
                className={aisTextarea}
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Coaching suggestion used to build the module"
              />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
