'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Download, Sparkles, X } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Select } from '@/components/ui/select';
import { GenerationStatusPanel } from '@/components/ui/GenerationStatusPanel';
import { useElapsedTime } from '@/hooks/useElapsedTime';
import {
  AisBtnPrimary,
  AisBtnSecondary,
  aisFormLabel,
  aisInput,
} from '@/components/dashboard/teacher/TeacherPortalUi';
import type { AnnualLessonPlanWeekRow } from '@/lib/annualLessonPlan';
import {
  getAnnualMonthOptions,
  getAnnualWeeksForMonth,
  parseAnnualPlanDetail,
  type AIDetailedLessonPlanResult,
} from '@/lib/ai';
import { WeeklyLessonPlanTable } from '@/components/ui/WeeklyLessonPlanTable';
import { GeneratorActionBar } from '@/components/ui/GeneratorActionBar';
import { downloadWeeklyLessonPlanDocx } from '@/lib/weeklyLessonPlanDocx';
import {
  STUDENT_LEVEL_OPTIONS,
  filterTeacherLessonPlans,
  keepLatestLessonPlansByGradeSubject,
  primarySubjectForTeacher,
  resolveTeacherProfile,
} from '@/lib/teacherPortal';
import { portalTabPath } from '@/lib/portalPaths';

function weekKey(w: AnnualLessonPlanWeekRow) {
  return `${w.month}|${w.week}|${w.date}`;
}

function weekLabel(w: AnnualLessonPlanWeekRow) {
  return `${w.week} · ${w.date}${w.unit ? ` · ${w.unit}` : ''}`;
}

/**
 * Dedicated-page weekly lesson plan generator — replaces the former "Create weekly lesson
 * plan" Dialog in TeacherWeeklyPlanDialog.tsx. Same week-picking/merge/generate logic; the
 * differences are structural: a full page with a GenerationStatusPanel/elapsed-time indicator
 * instead of a bare "Generating…" button, an Edit toggle on the generated preview (using the
 * same WeeklyLessonPlanTable editor already used for saved draft plans) so sessions can be
 * corrected before submitting, and navigating back to the lesson plans list on submit.
 */
export function TeacherWeeklyPlanGenerator() {
  const router = useRouter();
  const { lessonPlans, teachers, createLessonPlan, addNotification, resolveTeacherId } = useApp();
  const teacherId = resolveTeacherId();
  const teacherProfile = resolveTeacherProfile(teachers, teacherId);
  const defaultSubject = primarySubjectForTeacher(teacherProfile);
  const defaultGrade = teacherProfile.grades[0] ?? 'Grade 9';
  const teacherPlans = filterTeacherLessonPlans(lessonPlans, teacherId, {
    subjects: teacherProfile.subjects,
  });
  const annualPlans = keepLatestLessonPlansByGradeSubject(
    teacherPlans.filter((p) => p.planType === 'yearly' && p.createdByRole === 'department-head'),
  );

  const [annualPlanId, setAnnualPlanId] = useState('');
  const [month, setMonth] = useState('');
  const [selectedWeekKeys, setSelectedWeekKeys] = useState<string[]>([]);
  const [unit, setUnit] = useState('');
  const [page, setPage] = useState('');
  const [selectedContents, setSelectedContents] = useState<string[]>([]);
  const [periodsPerWeek, setPeriodsPerWeek] = useState(3);
  const [sessionDuration, setSessionDuration] = useState(45);
  const [studentLevel, setStudentLevel] = useState<string>('differentiated');
  const [planTitle, setPlanTitle] = useState('');
  const [generating, setGenerating] = useState(false);
  const [aiResult, setAiResult] = useState<AIDetailedLessonPlanResult | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [generationError, setGenerationError] = useState('');

  const elapsedSeconds = useElapsedTime(generating);

  const selectedAnnual = annualPlans.find((p) => p.id === annualPlanId);
  const annualDetail = useMemo(
    () => (selectedAnnual ? parseAnnualPlanDetail(selectedAnnual) : null),
    [selectedAnnual],
  );

  const monthOptions = useMemo(
    () => (annualDetail ? getAnnualMonthOptions(annualDetail) : []),
    [annualDetail],
  );

  const weeksInMonth = useMemo(
    () => (annualDetail && month ? getAnnualWeeksForMonth(annualDetail, month) : []),
    [annualDetail, month],
  );

  const selectedWeeks = useMemo(
    () => weeksInMonth.filter((w) => selectedWeekKeys.includes(weekKey(w))),
    [weeksInMonth, selectedWeekKeys],
  );
  const selectedWeek = selectedWeeks[0];
  const isMerging = selectedWeeks.length > 1;

  const contentPool = useMemo(() => {
    const seen = new Set<string>();
    const pool: string[] = [];
    for (const w of selectedWeeks) {
      for (const c of w.contents || []) {
        const trimmed = c.trim();
        if (trimmed && !seen.has(trimmed)) {
          seen.add(trimmed);
          pool.push(trimmed);
        }
      }
    }
    return pool;
  }, [selectedWeeks]);

  const toggleWeek = (key: string) => {
    setSelectedWeekKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const toggleContent = (item: string) => {
    setSelectedContents((prev) =>
      prev.includes(item) ? prev.filter((c) => c !== item) : [...prev, item],
    );
  };

  // Subtopic ids already covered by an earlier week's weekly plan for the SAME annual plan +
  // unit — lets the backend continue sequentially through a content item that spans multiple
  // weeks (e.g. "1.3 Type of Functions" taking 2 weeks) instead of repeating a subtopic
  // already taught. Computed client-side since prime-ai has no access to whatever database
  // MVP-back persists weekly plans in.
  const alreadyCoveredSubtopicIds = useMemo(() => {
    if (!selectedAnnual || !unit) return [];
    const ids = new Set<string>();
    for (const p of teacherPlans) {
      if (p.planType !== 'weekly' || !p.planDetail) continue;
      try {
        const detail = JSON.parse(p.planDetail) as {
          sourceAnnualPlanId?: string;
          calendarWeek?: { unit?: string };
          sessions?: { subtopicId?: string }[];
        };
        if (detail.sourceAnnualPlanId !== selectedAnnual.id) continue;
        if ((detail.calendarWeek?.unit || '') !== unit) continue;
        for (const s of detail.sessions || []) {
          if (s.subtopicId) ids.add(s.subtopicId);
        }
      } catch {
        // Not JSON, or an older plan shape without these fields — skip it.
      }
    }
    return Array.from(ids);
  }, [teacherPlans, selectedAnnual, unit]);

  useEffect(() => {
    if (annualPlans.length === 0) {
      setAnnualPlanId('');
      return;
    }
    if (!annualPlanId || !annualPlans.some((p) => p.id === annualPlanId)) {
      setAnnualPlanId(annualPlans[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [annualPlans]);

  useEffect(() => {
    if (!annualDetail) {
      setMonth('');
      setSelectedWeekKeys([]);
      return;
    }
    const months = getAnnualMonthOptions(annualDetail);
    if (!month || !months.includes(month)) {
      setMonth(months[0] ?? '');
    }
  }, [annualDetail, month]);

  useEffect(() => {
    if (!weeksInMonth.length) {
      setSelectedWeekKeys([]);
      return;
    }
    const stillValid = selectedWeekKeys.filter((k) => weeksInMonth.some((w) => weekKey(w) === k));
    if (stillValid.length === 0) {
      setSelectedWeekKeys([weekKey(weeksInMonth[0])]);
    } else if (stillValid.length !== selectedWeekKeys.length) {
      setSelectedWeekKeys(stillValid);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weeksInMonth]);

  useEffect(() => {
    if (selectedWeeks.length === 0) return;
    const units = Array.from(new Set(selectedWeeks.map((w) => w.unit).filter(Boolean)));
    const pages = Array.from(new Set(selectedWeeks.map((w) => w.page).filter(Boolean)));
    const totalPeriods = selectedWeeks.reduce((sum, w) => sum + (w.periodsNeeded || 0), 0);
    setUnit(units.join(' + '));
    setPage(pages.join(', '));
    setPeriodsPerWeek(totalPeriods || annualDetail?.meta?.periodsPerWeek || 3);
    setPlanTitle('');
    setAiResult(null);
    setIsEditing(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWeekKeys]);

  useEffect(() => {
    setSelectedContents(contentPool);
  }, [contentPool]);

  const goBackToList = () => router.push(portalTabPath('teacher', 'lesson-plans'));

  const buildWeekContext = () => {
    if (!selectedWeek) return '';
    const weekLabels = selectedWeeks.map((w) => `${w.month} ${w.week} (${w.date})`).join('; ');
    return [
      isMerging ? `Merged annual weeks: ${weekLabels}` : `Annual week: ${weekLabels}`,
      unit ? `Unit: ${unit}` : '',
      page ? `Textbook pages: ${page}` : '',
      selectedContents.length ? `Contents:\n${selectedContents.join('\n')}` : '',
    ]
      .filter(Boolean)
      .join('\n\n');
  };

  const handleGenerate = async () => {
    setGenerationError('');
    if (!selectedAnnual || !selectedWeek) {
      setGenerationError('Select an annual plan month and at least one week first.');
      return;
    }
    const topic = selectedContents[0] || unit || selectedWeek.contents?.[0] || selectedAnnual.title;
    if (!topic.trim()) {
      setGenerationError('Add at least one content line for this week.');
      return;
    }

    setGenerating(true);
    try {
      const { aiService } = await import('@/lib/ai');
      const { plan, sources } = await aiService.generateDetailedLessonPlan({
        plan_type: 'weekly',
        grade: selectedAnnual.grade || defaultGrade,
        subject: selectedAnnual.subject || defaultSubject,
        // Kept short — no longer the primary grounding source now that annual_contents/
        // annual_general_objectives carry the real content structurally, but still useful
        // for the cache key and as a fallback label.
        topic: topic.trim(),
        subtopic: buildWeekContext().slice(0, 800),
        student_level: studentLevel as 'differentiated' | 'beginner' | 'intermediate' | 'advanced',
        periods_per_week: periodsPerWeek,
        session_duration: sessionDuration,
        days_per_week: Math.min(5, Math.max(1, periodsPerWeek)),
        annual_contents: selectedContents,
        annual_general_objectives: selectedWeek.generalObjectives || [],
        annual_unit_label: unit,
        already_covered_subtopic_ids: alreadyCoveredSubtopicIds,
      });

      const withContext: AIDetailedLessonPlanResult = {
        ...plan,
        sources,
        mainTopic: plan.mainTopic || topic.trim(),
        subTopic: plan.subTopic || unit,
        ...({
          sourceAnnualPlanId: selectedAnnual.id,
          calendarWeek: {
            month: selectedWeek.month,
            week: selectedWeek.week,
            date: selectedWeek.date,
            unit,
            page,
            contents: selectedContents,
            weekContext: buildWeekContext(),
            mergedWeeks: isMerging ? selectedWeeks.map((w) => weekKey(w)) : undefined,
          },
        } as object),
      };

      setAiResult(withContext);
      setIsEditing(false);
      if (!planTitle) {
        setPlanTitle(`${selectedAnnual.grade} ${selectedAnnual.subject} — ${selectedWeek.month} ${selectedWeek.week}`);
      }
    } catch (err) {
      console.error(err);
      setGenerationError('Could not generate weekly plan. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiResult || !selectedAnnual || !selectedWeek) return;

    const objectives = aiResult.objectives?.length ? aiResult.objectives : selectedContents.slice(0, 4);

    const activities =
      aiResult.sessions?.map((session, i) => ({
        session: i + 1,
        activity: `${session.subTopic || session.mainTopic}: ${(session.objectives || []).join('; ')}${
          session.textbookPages ? ` (${session.textbookPages})` : ''
        }`,
        duration: `${session.durationMinutes || sessionDuration} mins`,
      })) ??
      Array.from({ length: periodsPerWeek }).map((_, i) => ({
        session: i + 1,
        activity: `Session ${i + 1}`,
        duration: `${sessionDuration} mins`,
      }));

    const assessments = Array.from(
      new Set(
        (aiResult.sessions || []).flatMap((s) =>
          (s.procedures || [])
            .filter((p) => /assessment|evaluation/i.test(p.stage))
            .map((p) => p.lessonContents)
            .filter(Boolean),
        ),
      ),
    ).slice(0, 6);

    const homework =
      (aiResult.sessions || [])
        .flatMap((s) =>
          (s.procedures || [])
            .filter((p) => /assessment|evaluation/i.test(p.stage))
            .map((p) => p.reference),
        )
        .filter(Boolean)
        .slice(0, 4)
        .join('; ') || 'Complete the textbook exercise cited in the Assessment row of each session.';

    createLessonPlan({
      title: planTitle || `${selectedAnnual.grade} ${selectedAnnual.subject} — ${selectedWeek.month} ${selectedWeek.week}`,
      grade: selectedAnnual.grade || defaultGrade,
      subject: selectedAnnual.subject || defaultSubject,
      sessions: periodsPerWeek,
      objectives,
      activities,
      assessments: assessments.length
        ? assessments
        : ['Formative assessment through observation', 'Session quizzes', 'Textbook exercises'],
      homework,
      planType: 'weekly',
      createdByRole: 'teacher',
      planDetail: JSON.stringify(aiResult),
    });
    addNotification('Weekly Plan Submitted', `"${planTitle}" was submitted for department approval.`, 'success');
    goBackToList();
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto w-full max-w-[96rem] space-y-5">
      <p className="w-full rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900 dark:border-green-800 dark:bg-green-900/20 dark:text-green-200">
        Pick a week from the published annual plan, edit the content if needed, set sessions and
        minutes, then generate the weekly template and submit for department head approval (final).
      </p>

      {annualPlans.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No published annual plan yet. Ask your department head to publish one first.
        </p>
      ) : (
        <>
          <section className="rounded-xl border border-ais-card-border bg-card p-5">
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[2fr_1fr_1.4fr]">
              <Select
                variant="ais"
                label="Annual lesson plan"
                options={annualPlans.map((p) => ({ value: p.id, label: `${p.title} (${p.grade})` }))}
                value={annualPlanId}
                onChange={(e) => setAnnualPlanId(e.target.value)}
              />
              <Select
                variant="ais"
                label="Month"
                options={monthOptions.map((m) => ({ value: m, label: m }))}
                value={month}
                onChange={(e) => setMonth(e.target.value)}
              />
              <div className="space-y-1">
                <label className={aisFormLabel}>
                  Week(s) {isMerging ? `— ${selectedWeeks.length} selected, merging` : ''}
                </label>
                <div className="max-h-28 space-y-1 overflow-y-auto rounded-lg border border-ais-card-border p-2">
                  {weeksInMonth.length === 0 ? (
                    <p className="px-1 py-1 text-xs text-muted-foreground">No weeks in this month.</p>
                  ) : (
                    weeksInMonth.map((w) => (
                      <label key={weekKey(w)} className="flex items-center gap-2 text-xs">
                        <input
                          type="checkbox"
                          checked={selectedWeekKeys.includes(weekKey(w))}
                          onChange={() => toggleWeek(weekKey(w))}
                        />
                        {weekLabel(w)}
                      </label>
                    ))
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Select more than one week to merge them into a single special-case weekly plan.
                </p>
              </div>
            </div>
          </section>

          {selectedWeek && (
            <section className="space-y-4 rounded-xl border border-ais-card-border bg-ais-surface-container-low/40 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-ais-on-surface-variant">
                {isMerging ? 'Merged from selected weeks (editable)' : 'From annual plan (editable)'} — weekly generation uses only these
              </p>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className={aisFormLabel}>Unit</label>
                  <input className={aisInput} value={unit} onChange={(e) => setUnit(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className={aisFormLabel}>Pages</label>
                  <input className={aisInput} value={page} onChange={(e) => setPage(e.target.value)} />
                </div>
              </div>
              <div className="space-y-1">
                <label className={aisFormLabel}>
                  Content — pick which items to include ({selectedContents.length}/{contentPool.length})
                </label>
                {contentPool.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    The selected week(s) have no content items in the annual plan.
                  </p>
                ) : (
                  <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-ais-card-border bg-background p-2">
                    {contentPool.map((item) => (
                      <label key={item} className="flex items-start gap-2 text-xs">
                        <input
                          type="checkbox"
                          className="mt-0.5"
                          checked={selectedContents.includes(item)}
                          onChange={() => toggleContent(item)}
                        />
                        <span>{item}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}

          <section className="rounded-xl border border-ais-card-border bg-card p-5">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              <div className="space-y-1">
                <label className={aisFormLabel}>Sessions per week *</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  className={aisInput}
                  value={periodsPerWeek}
                  onChange={(e) => setPeriodsPerWeek(Number(e.target.value))}
                />
              </div>
              <div className="space-y-1">
                <label className={aisFormLabel}>Minutes per session *</label>
                <input
                  type="number"
                  min={20}
                  max={120}
                  step={5}
                  className={aisInput}
                  value={sessionDuration}
                  onChange={(e) => setSessionDuration(Number(e.target.value))}
                />
              </div>
              <Select
                variant="ais"
                label="Student level"
                options={STUDENT_LEVEL_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                value={studentLevel}
                onChange={(e) => setStudentLevel(e.target.value)}
              />
            </div>
          </section>

          <section className="rounded-xl border border-ais-card-border bg-card p-5">
            <div className="space-y-1">
              <label className={aisFormLabel}>Plan title</label>
              <input
                className={aisInput}
                placeholder="Auto-filled from month / week if empty"
                value={planTitle}
                onChange={(e) => setPlanTitle(e.target.value)}
              />
            </div>
          </section>

          <GenerationStatusPanel
            phase={generating ? 'generating' : generationError ? 'error' : 'idle'}
            statusText="Generating weekly plan…"
            elapsedSeconds={elapsedSeconds}
            errorMessage={generationError}
          />

          {aiResult && (
            <div className="space-y-3">
              <GenerationStatusPanel
                phase="success"
                statusText=""
                elapsedSeconds={elapsedSeconds}
                successMessage="Weekly plan generated — review, edit if needed, then submit below."
              />
              <div className="max-h-[420px] space-y-3 overflow-y-auto rounded-xl border border-ais-card-border bg-ais-surface-container-low/40 p-4">
                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-ais-card-border bg-ais-surface-container-low/90 pb-3 backdrop-blur-sm">
                  <span className="text-xs font-semibold text-ais-on-surface">Weekly plan preview</span>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setIsEditing((v) => !v)}
                      className="flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      {isEditing ? 'Done editing' : 'Edit'}
                    </button>
                    <button
                      type="button"
                      onClick={() => void downloadWeeklyLessonPlanDocx(aiResult)}
                      className="flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <Download className="h-3 w-3" />
                      Word
                    </button>
                    <button
                      type="button"
                      onClick={() => { setAiResult(null); setIsEditing(false); }}
                      className="flex items-center gap-1 text-xs text-ais-error hover:underline"
                    >
                      <X className="h-3 w-3" />
                      Clear
                    </button>
                  </div>
                </div>
                <WeeklyLessonPlanTable
                  sessions={aiResult.sessions || []}
                  meta={{
                    grade: selectedAnnual?.grade,
                    subject: aiResult.subject || selectedAnnual?.subject,
                    mainTopic: aiResult.mainTopic,
                    subTopic: aiResult.subTopic,
                  }}
                  editable={isEditing}
                  onChange={(nextSessions) => setAiResult((prev) => (prev ? { ...prev, sessions: nextSessions } : prev))}
                />
              </div>
            </div>
          )}
        </>
      )}

      <GeneratorActionBar
        left={
          <>
            <AisBtnSecondary type="button" onClick={goBackToList}>
              Cancel
            </AisBtnSecondary>
            <AisBtnPrimary type="button" onClick={() => void handleGenerate()} disabled={generating || !selectedWeek}>
              <Sparkles className={`h-4 w-4 ${generating ? 'animate-pulse' : ''}`} />
              {generating ? 'Generating…' : aiResult ? 'Regenerate weekly plan' : 'Generate weekly plan'}
            </AisBtnPrimary>
          </>
        }
        right={
          <AisBtnPrimary type="submit" disabled={!aiResult}>
            Submit for dept approval
          </AisBtnPrimary>
        }
      />
    </form>
  );
}
