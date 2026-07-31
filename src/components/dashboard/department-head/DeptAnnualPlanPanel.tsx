'use client';

import React, { useMemo, useState } from 'react';
import {
  Briefcase,
  CalendarDays,
  ClipboardList,
  Download,
  Info,
  Sparkles,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ContentCard } from '@/components/dashboard/ContentCard';
import { GRADE_OPTIONS } from '@/lib/teacherPortal';
import type { AIDetailedLessonPlanResult } from '@/lib/ai';
import {
  buildTeachingWeeksFromCalendar,
  mergeAiWeeksOntoCalendar,
  summarizeNonTeachingWindows,
  TEACHING_AID_OPTIONS,
  type AnnualLessonPlanResult,
} from '@/lib/annualLessonPlan';
import { AnnualLessonPlanTable } from '@/components/ui/AnnualLessonPlanTable';
import {
  ANNUAL_PLAN_SUBJECT_OPTIONS,
  inferSubjectStream,
  lookupDefaultTimeAllocation,
  parseGradeBand,
  type SubjectStream,
} from '@/lib/subjectTimeAllocation';
import { downloadAnnualLessonPlanDocx } from '@/lib/annualLessonPlanDocx';

function toAnnualResult(
  plan: AIDetailedLessonPlanResult,
  defaults: {
    academicYear: string;
    schoolName: string;
    teacherName: string;
    grade: string;
    subject: string;
    schoolDaysPerYear: number;
    periodsPerWeek: number;
    periodsPerYear: number;
    minutesPerPeriod: number;
    teachingAidsAvailable: string[];
  },
): AnnualLessonPlanResult {
  const meta = plan.meta ?? {};
  return {
    type: 'yearly',
    subject: plan.subject || defaults.subject,
    mainTopic: plan.mainTopic || `Annual lesson plan — ${defaults.subject}`,
    subTopic: plan.subTopic || '',
    prerequisiteKnowledge: plan.prerequisiteKnowledge,
    rationale: plan.rationale,
    objectives: plan.objectives ?? meta.generalObjectives ?? [],
    sources: plan.sources,
    meta: {
      academicYear: meta.academicYear || defaults.academicYear,
      schoolName: meta.schoolName || defaults.schoolName,
      teacherName: meta.teacherName || defaults.teacherName,
      grade: meta.grade || defaults.grade,
      subject: meta.subject || defaults.subject,
      schoolDaysPerYear: meta.schoolDaysPerYear ?? defaults.schoolDaysPerYear,
      periodsPerWeek: meta.periodsPerWeek ?? defaults.periodsPerWeek,
      periodsPerYear: meta.periodsPerYear ?? defaults.periodsPerYear,
      minutesPerPeriod: defaults.minutesPerPeriod,
      teachingAidsAvailable: defaults.teachingAidsAvailable,
      referenceMaterials: meta.referenceMaterials || 'TEXT BOOK',
      generalObjectives:
        meta.generalObjectives?.length
          ? meta.generalObjectives
          : plan.objectives ?? [],
    },
    weeks: plan.weeks ?? [],
  };
}

export const DeptAnnualPlanPanel: React.FC<{
  subject: string;
  onViewCalendar?: () => void;
}> = ({ subject, onViewCalendar }) => {
  const {
    createDeptAnnualLessonPlan,
    addNotification,
    academicCalendars,
    currentUser,
    schools,
    lessonPlans,
  } = useApp();

  const schoolId = currentUser?.schoolId;
  const publishedCalendar = useMemo(
    () =>
      academicCalendars.find(
        (c) =>
          c.status === 'Published' &&
          (!schoolId || c.schoolId === schoolId),
      ) ??
      academicCalendars.find((c) => c.status === 'Published') ??
      null,
    [academicCalendars, schoolId],
  );

  const publishedAnnuals = useMemo(
    () =>
      lessonPlans.filter(
        (p) =>
          p.planType === 'yearly' &&
          p.createdByRole === 'department-head' &&
          (p.subject || '').toLowerCase() === (subject || '').toLowerCase(),
      ),
    [lessonPlans, subject],
  );

  const [viewingPublishedId, setViewingPublishedId] = useState<string | null>(null);

  const viewingPublished = useMemo(() => {
    const plan = publishedAnnuals.find((p) => p.id === viewingPublishedId);
    if (!plan?.planDetail) return null;
    try {
      return JSON.parse(plan.planDetail) as AnnualLessonPlanResult;
    } catch {
      return null;
    }
  }, [publishedAnnuals, viewingPublishedId]);

  const schoolName = useMemo(() => {
    const id = publishedCalendar?.schoolId ?? 'sch-1';
    return schools.find((s) => s.id === id)?.name ?? 'School';
  }, [publishedCalendar, schools]);

  const [grade, setGrade] = useState('Grade 11');
  const [planSubject, setPlanSubject] = useState(subject);
  const [subjectProp, setSubjectProp] = useState(subject);
  if (subject !== subjectProp) {
    setSubjectProp(subject);
    setPlanSubject(subject);
  }

  const [timeMode, setTimeMode] = useState<'default' | 'custom'>('default');
  const inferredStream = inferSubjectStream(planSubject);
  const [stream, setStream] = useState<SubjectStream>(inferredStream ?? 'natural');
  const [streamSubject, setStreamSubject] = useState(planSubject);
  if (planSubject !== streamSubject) {
    setStreamSubject(planSubject);
    if (inferredStream) setStream(inferredStream);
  }

  const [customPeriodsPerWeek, setCustomPeriodsPerWeek] = useState(5);
  const [customMinutesPerPeriod, setCustomMinutesPerPeriod] = useState(45);
  const [selectedAids, setSelectedAids] = useState<string[]>([
    'Textbook',
    'Chalkboard / whiteboard',
    'Charts',
  ]);
  const [otherAidEnabled, setOtherAidEnabled] = useState(false);
  const [otherAidDraft, setOtherAidDraft] = useState('');
  const [customAids, setCustomAids] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [annualPlan, setAnnualPlan] = useState<AnnualLessonPlanResult | null>(null);
  const publishedSectionRef = React.useRef<HTMLDivElement | null>(null);
  const generatedSectionRef = React.useRef<HTMLDivElement | null>(null);

  const defaultAllocation = useMemo(
    () => lookupDefaultTimeAllocation(grade, planSubject, stream),
    [grade, planSubject, stream],
  );

  const needsStream = parseGradeBand(grade) === '11-12' && !inferSubjectStream(planSubject);

  const effectivePeriods =
    timeMode === 'default' ? defaultAllocation.periodsPerWeek : customPeriodsPerWeek;
  const effectiveMinutes =
    timeMode === 'default' ? defaultAllocation.minutesPerPeriod : customMinutesPerPeriod;

  const planInputKey = `${publishedCalendar?.id ?? ''}|${grade}|${planSubject}|${effectivePeriods}|${effectiveMinutes}`;
  const [activePlanKey, setActivePlanKey] = useState(planInputKey);
  if (activePlanKey !== planInputKey) {
    setActivePlanKey(planInputKey);
    setAnnualPlan(null);
  }

  const calendarScaffold = useMemo(
    () =>
      buildTeachingWeeksFromCalendar({
        periodsPerWeek: effectivePeriods,
        minutesPerPeriod: effectiveMinutes,
        calendar: publishedCalendar,
      }),
    [effectivePeriods, effectiveMinutes, publishedCalendar],
  );

  const allSelectedAids = useMemo(
    () => [...selectedAids, ...customAids],
    [selectedAids, customAids],
  );

  const toggleAid = (aid: string) => {
    setSelectedAids((prev) =>
      prev.includes(aid) ? prev.filter((a) => a !== aid) : [...prev, aid],
    );
  };

  const addOtherAid = () => {
    const value = otherAidDraft.trim();
    if (!value) return;
    const exists =
      allSelectedAids.some((a) => a.toLowerCase() === value.toLowerCase()) ||
      TEACHING_AID_OPTIONS.some((a) => a.toLowerCase() === value.toLowerCase());
    if (exists) {
      setOtherAidDraft('');
      return;
    }
    setCustomAids((prev) => [...prev, value]);
    setOtherAidDraft('');
  };

  const removeCustomAid = (aid: string) => {
    setCustomAids((prev) => prev.filter((a) => a !== aid));
  };

  const handleGenerate = async () => {
    if (!publishedCalendar) {
      addNotification(
        'Calendar required',
        'Publish / disseminate the school academic calendar before generating an annual lesson plan.',
        'alert',
      );
      return;
    }

    const {
      weeks,
      schoolDaysPerYear,
      academicYear,
      months,
      daysPerWeek,
      teachingWeeksCount,
      nonTeachingWeeksCount,
      totalPeriods,
      totalMinutes,
    } = calendarScaffold;

    if (!weeks.length || teachingWeeksCount === 0) {
      addNotification(
        'No school days found',
        'The published calendar has no instructional days after the first day of class. Check first/end of school marks.',
        'alert',
      );
      return;
    }

    setGenerating(true);
    setAnnualPlan(null);
    try {
      const nonTeaching = summarizeNonTeachingWindows(publishedCalendar.events);
      const shortWeeks = weeks
        .filter((w) => w.note)
        .slice(0, 12)
        .map(
          (w) =>
            `${w.month} ${w.week} (${w.date}): ${w.note} — ${w.periodsAvailable} periods / ${w.minutesAvailable ?? 0} min`,
        );
      const teacher = currentUser?.displayName || 'Department Head';
      const monthDaysSummary = months
        .map((m) => `${m.label}: ${m.days} school days (${m.semester === 1 ? '1st' : '2nd'} semester)`)
        .join('; ');
      const aids = allSelectedAids.length
        ? allSelectedAids
        : ['Textbook', 'Chalkboard / whiteboard'];

      const toPayloadWeek = (w: (typeof weeks)[number]) => ({
        id: w.id,
        semester: w.semester,
        month: w.month,
        week: w.week,
        date: w.date,
        periodsAvailable: w.periodsAvailable,
        teachingDays: w.teachingDays,
        minutesAvailable: w.minutesAvailable,
        isTeachingWeek: w.isTeachingWeek,
        note: w.note,
      });

      const { aiService } = await import('@/lib/ai');
      const WEEK_BATCH_SIZE = 4;
      const allAiWeeks: NonNullable<AIDetailedLessonPlanResult['weeks']> = [];
      let combined: AIDetailedLessonPlanResult | null = null;
      let continuationHint = '';

      for (let i = 0; i < weeks.length; i += WEEK_BATCH_SIZE) {
        const batch = weeks.slice(i, i + WEEK_BATCH_SIZE);
        const batchNum = Math.floor(i / WEEK_BATCH_SIZE) + 1;
        const totalBatches = Math.ceil(weeks.length / WEEK_BATCH_SIZE);
        const isFirstBatch = i === 0;

        addNotification(
          'Generating…',
          `Annual plan batch ${batchNum} of ${totalBatches} (${batch.length} weeks)`,
          'info',
        );

        const topicHint = isFirstBatch
          ? [
              'MANDATORY: Begin with Unit-1 of the teaching textbook on the first TEACHING week.',
              'Skip content on weeks with periodsAvailable = 0 (no school / exams / breaks).',
              'Pace units using periodsAvailable and minutesAvailable on each week — short weeks get less content.',
              `First instructional week starts at ${weeks[0]?.month} ${weeks[0]?.week} (${weeks[0]?.date}).`,
              `Calendar working days by month: ${monthDaysSummary}`,
              `Total school days: ${schoolDaysPerYear}; teaching weeks: ${teachingWeeksCount}; non-teaching weeks: ${nonTeachingWeeksCount}`,
              `Hours: ${effectivePeriods} periods/week × ${effectiveMinutes} min = ~${((effectivePeriods * effectiveMinutes) / 60).toFixed(2)} hrs/week; year total ~${Math.round(totalMinutes / 60)} hrs (${totalPeriods} periods)`,
              `Teaching aids available ONLY: ${aids.join(', ')}`,
            ].join(' ')
          : [
              `Continue textbook sequence after: ${continuationHint || 'previous batch'}`,
              'Do not restart from Unit-1 unless still covering Unit-1.',
              'Keep unit numbers increasing in textbook order.',
              'Respect periodsAvailable=0 weeks as non-teaching.',
              `Teaching aids available ONLY: ${aids.join(', ')}`,
            ].join(' ');

        let plan: AIDetailedLessonPlanResult | null = null;
        let lastErr: unknown = null;
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            const res = await aiService.generateDetailedLessonPlan({
              plan_type: 'yearly',
              grade,
              subject: planSubject,
              topic: topicHint,
              subtopic: '',
              student_level: 'differentiated',
              periods_per_week: effectivePeriods,
              session_duration: effectiveMinutes,
              learning_days_per_year: schoolDaysPerYear,
              days_per_week: daysPerWeek,
              calendar_weeks: batch.map(toPayloadWeek),
              year_calendar_weeks: weeks.map(toPayloadWeek),
              non_teaching_windows: [
                ...nonTeaching.slice(0, 8),
                ...shortWeeks,
                `Working days by month: ${monthDaysSummary}`,
                `Time allocation: ${effectivePeriods} periods/week × ${effectiveMinutes} min/period (${timeMode === 'default' ? 'MoE default' : 'custom'})`,
                `Teaching aids on hand: ${aids.join(', ')}`,
              ],
              teaching_aids: aids,
              teacher_name: teacher,
              school_name: schoolName,
              academic_year: academicYear,
              reference_materials: 'TEXT BOOK',
            });
            plan = res.plan;
            lastErr = null;
            break;
          } catch (err) {
            lastErr = err;
            const msg = err instanceof Error ? err.message : String(err);
            const retryable =
              /timeout|timed out|handshake|ssl|500|network|fetch/i.test(msg);
            if (!retryable || attempt === 3) break;
            addNotification(
              'Retrying…',
              `Batch ${batchNum} network error — attempt ${attempt + 1}/3`,
              'alert',
            );
            await new Promise((r) => setTimeout(r, 3000 * attempt));
          }
        }
        if (!plan) {
          throw lastErr instanceof Error
            ? lastErr
            : new Error(`Batch ${batchNum} failed`);
        }

        combined = plan;
        if (plan.weeks?.length) {
          allAiWeeks.push(...plan.weeks);
          const lastTeaching = [...plan.weeks]
            .reverse()
            .find((w) => (w.periodsNeeded ?? 0) > 0 && w.unit && w.unit !== '—');
          const last = lastTeaching ?? plan.weeks[plan.weeks.length - 1];
          continuationHint = [
            last.unit ? `last unit: ${last.unit}` : '',
            last.page ? `last pages: ${last.page}` : '',
            (last.contents || []).slice(0, 2).join('; '),
          ]
            .filter(Boolean)
            .join(' | ');
        }

        if (i + WEEK_BATCH_SIZE < weeks.length) {
          await new Promise((r) => setTimeout(r, 1500));
        }
      }

      if (!combined) {
        throw new Error('No plan returned');
      }

      const mergedWeeks = mergeAiWeeksOntoCalendar(weeks, allAiWeeks, {
        teachingAidsAvailable: aids,
      });
      const result = toAnnualResult(
        { ...combined, weeks: mergedWeeks },
        {
          academicYear,
          schoolName,
          teacherName: teacher,
          grade,
          subject: planSubject,
          schoolDaysPerYear,
          periodsPerWeek: effectivePeriods,
          periodsPerYear: totalPeriods,
          minutesPerPeriod: effectiveMinutes,
          teachingAidsAvailable: aids,
        },
      );

      setAnnualPlan(result);
      addNotification(
        'Annual plan ready',
        `${grade} ${planSubject} — ${teachingWeeksCount} teaching weeks from the school calendar.`,
        'success',
      );
      window.setTimeout(() => {
        generatedSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not generate annual plan. Try again.';
      addNotification('Generation failed', msg.slice(0, 180), 'alert');
    } finally {
      setGenerating(false);
    }
  };

  const alreadyPublishedForSelection = useMemo(
    () =>
      publishedAnnuals.find(
        (p) =>
          (p.grade || '').toLowerCase() === grade.toLowerCase() &&
          (p.subject || '').toLowerCase() === planSubject.toLowerCase(),
      ) ?? null,
    [publishedAnnuals, grade, planSubject],
  );

  const scrollToPublished = (planId?: string) => {
    if (planId) setViewingPublishedId(planId);
    window.setTimeout(() => {
      publishedSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  };

  const handleDownload = async () => {
    if (!annualPlan) return;
    setDownloading(true);
    try {
      await downloadAnnualLessonPlanDocx(annualPlan);
    } catch {
      addNotification('Download failed', 'Could not create Word document.', 'alert');
    } finally {
      setDownloading(false);
    }
  };

  const handlePublish = () => {
    if (!annualPlan) return;

    if (alreadyPublishedForSelection) {
      addNotification(
        'Already published',
        `${grade} ${planSubject} annual lesson plan is already published. Opening it below.`,
        'info',
      );
      scrollToPublished(alreadyPublishedForSelection.id);
      return;
    }

    const weeks = annualPlan.weeks ?? [];
    const objectives =
      annualPlan.meta.generalObjectives?.length
        ? annualPlan.meta.generalObjectives
        : annualPlan.objectives;

    const activities = weeks.slice(0, 40).map((w, idx) => ({
      session: idx + 1,
      activity: `${w.month} ${w.week}: ${w.unit || 'Unit'} — ${(w.contents || []).join('; ')} (pp. ${w.page || '?'})`,
      duration: `${w.periodsNeeded} periods`,
    }));

    createDeptAnnualLessonPlan({
      title: `${grade} ${planSubject} — Annual Lesson Plan`,
      grade,
      subject: planSubject,
      sessions: weeks.length || activities.length,
      objectives,
      activities,
      assessments: Array.from(
        new Set(weeks.flatMap((w) => w.evaluationMethods).filter(Boolean)),
      ).slice(0, 8),
      homework:
        weeks
          .flatMap((w) => w.homework || [])
          .filter(Boolean)
          .slice(0, 6)
          .join('; ') ||
        'See weekly homework (Exercise + page) in the annual lesson plan table',
      planDetail: JSON.stringify(annualPlan),
    });
    window.setTimeout(() => scrollToPublished(), 200);
  };

  return (
    <div className="space-y-6">
      {!publishedCalendar && (
        <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          No published academic calendar found. Ask the school head to disseminate the calendar
          first — generation uses its teaching days.
        </p>
      )}

      {/* Plan Overview */}
      <section className="rounded-xl border border-border/70 bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ClipboardList className="h-4.5 w-4.5 h-[18px] w-[18px]" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">Plan Overview</h3>
              <p className="text-sm text-muted-foreground">
                Set the basic details for your annual lesson plan.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setTimeMode('default')}
              className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                timeMode === 'default'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'border border-border bg-background text-primary hover:bg-primary/5'
              }`}
            >
              Use MoE default hours
            </button>
            <button
              type="button"
              onClick={() => setTimeMode('custom')}
              className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                timeMode === 'custom'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'border border-border bg-background text-primary hover:bg-primary/5'
              }`}
            >
              Set custom hours
            </button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Select
            label="Grade"
            options={GRADE_OPTIONS.map((g) => ({ value: g, label: g }))}
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
          />
          <Select
            label="Subject"
            options={[
              ...(planSubject && !ANNUAL_PLAN_SUBJECT_OPTIONS.includes(planSubject)
                ? [{ value: planSubject, label: planSubject }]
                : []),
              ...ANNUAL_PLAN_SUBJECT_OPTIONS.map((s) => ({ value: s, label: s })),
            ]}
            value={planSubject}
            onChange={(e) => setPlanSubject(e.target.value)}
          />
          {(needsStream || parseGradeBand(grade) === '11-12') && (
            <Select
              label="Stream"
              options={[
                { value: 'natural', label: 'Natural Science' },
                { value: 'social', label: 'Social Science' },
              ]}
              value={stream}
              onChange={(e) => setStream(e.target.value as SubjectStream)}
              disabled={!needsStream && Boolean(inferSubjectStream(planSubject))}
            />
          )}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Periods per week</label>
            <input
              type="number"
              min={1}
              max={10}
              disabled={timeMode === 'default'}
              className="w-full h-10 px-3 rounded-lg border border-border text-sm disabled:bg-muted/40 disabled:text-muted-foreground"
              value={effectivePeriods}
              onChange={(e) => setCustomPeriodsPerWeek(Number(e.target.value))}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Minutes per period</label>
            <input
              type="number"
              min={30}
              max={90}
              step={5}
              disabled={timeMode === 'default'}
              className="w-full h-10 px-3 rounded-lg border border-border text-sm disabled:bg-muted/40 disabled:text-muted-foreground"
              value={effectiveMinutes}
              onChange={(e) => setCustomMinutesPerPeriod(Number(e.target.value))}
            />
          </div>
        </div>

        {timeMode === 'default' && (
          <p className="mt-3 text-xs text-muted-foreground">
            {defaultAllocation.matched
              ? `MoE table for ${grade} ${planSubject}${
                  defaultAllocation.stream
                    ? ` (${defaultAllocation.stream === 'natural' ? 'Natural' : 'Social'} Science)`
                    : ''
                } — ${defaultAllocation.hoursPerWeekLabel} hrs/week, ${defaultAllocation.hoursPerYearLabel} hrs/year.`
              : 'No exact MoE row for this grade/subject — using a safe default. Switch to custom hours if needed.'}
          </p>
        )}
      </section>

      {/* Teaching Aids + Academic Calendar side by side */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-start">
        <section className="rounded-xl border border-border/70 bg-card p-4 shadow-sm min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Briefcase className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Teaching Aids</h3>
                <p className="text-xs text-muted-foreground">
                  Select aids available for this plan.
                </p>
              </div>
            </div>
            <span className="shrink-0 text-[11px] font-medium text-muted-foreground pt-1">
              {allSelectedAids.length} selected
            </span>
          </div>

          <div className="mt-3 rounded-lg border border-border bg-background shadow-sm">
            <div
              className="max-h-44 overflow-y-auto py-1"
              role="listbox"
              aria-multiselectable="true"
              aria-label="Teaching aids"
            >
              {TEACHING_AID_OPTIONS.map((aid) => {
                const on = selectedAids.includes(aid);
                return (
                  <label
                    key={aid}
                    className="flex cursor-pointer items-center gap-2.5 px-3 py-1.5 text-sm hover:bg-muted/60"
                  >
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() => toggleAid(aid)}
                      className="h-3.5 w-3.5 rounded border-border"
                    />
                    <span className={on ? 'font-medium text-foreground' : 'text-muted-foreground'}>
                      {aid}
                    </span>
                  </label>
                );
              })}
              <label className="flex cursor-pointer items-center gap-2.5 border-t border-border/60 px-3 py-1.5 text-sm hover:bg-muted/60">
                <input
                  type="checkbox"
                  checked={otherAidEnabled}
                  onChange={() => {
                    setOtherAidEnabled((prev) => {
                      if (prev) setOtherAidDraft('');
                      return !prev;
                    });
                  }}
                  className="h-3.5 w-3.5 rounded border-border"
                />
                <span
                  className={
                    otherAidEnabled ? 'font-medium text-foreground' : 'text-muted-foreground'
                  }
                >
                  Other
                </span>
              </label>
            </div>

            {otherAidEnabled && (
              <div className="space-y-2 border-t border-border/60 px-3 py-2.5">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={otherAidDraft}
                    onChange={(e) => setOtherAidDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addOtherAid();
                      }
                    }}
                    placeholder="e.g. Abacus, Video clips…"
                    className="h-9 min-w-0 flex-1 rounded-lg border border-border bg-background px-3 text-sm"
                    aria-label="Custom teaching aid"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addOtherAid}
                    disabled={!otherAidDraft.trim()}
                  >
                    Add
                  </Button>
                </div>
              </div>
            )}
          </div>

          {customAids.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {customAids.map((aid) => (
                <span
                  key={aid}
                  className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 px-2.5 py-1 text-xs font-medium text-foreground"
                >
                  {aid}
                  <button
                    type="button"
                    onClick={() => removeCustomAid(aid)}
                    className="ml-0.5 text-muted-foreground hover:text-foreground"
                    aria-label={`Remove ${aid}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </section>

        <aside className="rounded-xl border border-border/70 bg-card p-4 shadow-sm lg:sticky lg:top-4">
          <div className="flex items-start gap-2.5">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <CalendarDays className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-foreground">Academic Calendar</h3>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {publishedCalendar?.title || `${schoolName} Academic Calendar`}
              </p>
            </div>
          </div>

          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-1.5">
              <dt className="text-xs text-muted-foreground">School days</dt>
              <dd className="text-xs font-semibold text-foreground">
                {publishedCalendar ? `${calendarScaffold.schoolDaysPerYear} days` : '—'}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-1.5">
              <dt className="text-xs text-muted-foreground">Teaching weeks</dt>
              <dd className="text-xs font-semibold text-foreground">
                {publishedCalendar ? `${calendarScaffold.teachingWeeksCount} weeks` : '—'}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-1.5">
              <dt className="text-xs text-muted-foreground">Periods / year</dt>
              <dd className="text-xs font-semibold text-foreground">
                {publishedCalendar ? `~${calendarScaffold.totalPeriods}` : '—'}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt className="text-xs text-muted-foreground">Teaching hours</dt>
              <dd className="text-xs font-semibold text-foreground">
                {publishedCalendar
                  ? `~${Math.round(calendarScaffold.totalMinutes / 60)} hrs`
                  : '—'}
              </dd>
            </div>
          </dl>

          {onViewCalendar && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-4 w-full whitespace-nowrap"
              onClick={onViewCalendar}
            >
              View Calendar
            </Button>
          )}
        </aside>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          onClick={handleGenerate}
          loading={generating}
          disabled={!publishedCalendar}
          leftIcon={<Sparkles className="h-4 w-4" />}
          className="whitespace-nowrap"
        >
          {generating ? 'Generating…' : 'Generate Annual Plan'}
        </Button>
        {annualPlan && (
          <>
            <Button
              variant="outline"
              onClick={handleDownload}
              loading={downloading}
              leftIcon={<Download className="h-4 w-4" />}
              className="whitespace-nowrap"
            >
              Download Word
            </Button>
            <Button variant="organic" onClick={handlePublish} className="whitespace-nowrap">
              {alreadyPublishedForSelection ? 'View published plan' : 'Publish to teachers'}
            </Button>
          </>
        )}
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Info className="h-3.5 w-3.5 shrink-0" />
          AI will generate a curriculum map based on your selections.
        </p>
      </div>

      {annualPlan && (
        <div ref={generatedSectionRef}>
          <ContentCard
            title={
              annualPlan.meta.academicYear
                ? `Annual Lesson Plan ${annualPlan.meta.academicYear}`
                : 'Annual Lesson Plan'
            }
            description="Table layout matches the school annual lesson plan template. Scroll horizontally on smaller screens."
          >
            <AnnualLessonPlanTable plan={annualPlan} showTitle={false} />
          </ContentCard>
        </div>
      )}

      <div ref={publishedSectionRef}>
        <ContentCard
          title="Published annual plans"
          description="Plans published to teachers stay here for the department to review anytime."
        >
          {publishedAnnuals.length === 0 ? (
            <p className="text-sm text-muted-foreground">No annual plans published yet.</p>
          ) : (
            <ul className="space-y-2">
              {publishedAnnuals.map((p) => (
                <li
                  key={p.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/60 px-3 py-2 text-sm"
                >
                  <div>
                    <p className="font-semibold text-foreground">{p.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.grade} · {p.subject} · {p.status} · {p.createdAt}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setViewingPublishedId(viewingPublishedId === p.id ? null : p.id)
                    }
                  >
                    {viewingPublishedId === p.id ? 'Hide' : 'View'}
                  </Button>
                </li>
              ))}
            </ul>
          )}
          {viewingPublished?.weeks?.length ? (
            <div className="mt-4 max-h-[60vh] overflow-auto rounded-lg border border-border/60 p-2">
              <AnnualLessonPlanTable plan={viewingPublished} showTitle={false} />
            </div>
          ) : null}
        </ContentCard>
      </div>
    </div>
  );
};
