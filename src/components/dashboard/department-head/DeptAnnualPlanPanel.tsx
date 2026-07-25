'use client';

import React, { useMemo, useState } from 'react';
import { Download, Sparkles } from 'lucide-react';
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
  type AnnualLessonPlanResult,
} from '@/lib/annualLessonPlan';
import { AnnualLessonPlanTable } from '@/components/ui/AnnualLessonPlanTable';
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
      referenceMaterials: meta.referenceMaterials || 'TEXT BOOK',
      generalObjectives:
        meta.generalObjectives?.length
          ? meta.generalObjectives
          : plan.objectives ?? [],
    },
    weeks: plan.weeks ?? [],
  };
}

export const DeptAnnualPlanPanel: React.FC<{ subject: string }> = ({ subject }) => {
  const {
    createDeptAnnualLessonPlan,
    addNotification,
    academicCalendars,
    currentUser,
    schools,
    lessonPlans,
  } = useApp();

  const publishedCalendar = useMemo(
    () =>
      academicCalendars.find(
        (c) =>
          c.status === 'Published' &&
          (!currentUser?.schoolId || c.schoolId === currentUser.schoolId),
      ) ??
      academicCalendars.find((c) => c.status === 'Published') ??
      null,
    [academicCalendars, currentUser?.schoolId],
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
    const schoolId = publishedCalendar?.schoolId ?? 'sch-1';
    return schools.find((s) => s.id === schoolId)?.name ?? 'School';
  }, [publishedCalendar, schools]);

  const [grade, setGrade] = useState('Grade 11');
  const [planSubject, setPlanSubject] = useState(subject);
  const [periodsPerWeek, setPeriodsPerWeek] = useState(5);
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [annualPlan, setAnnualPlan] = useState<AnnualLessonPlanResult | null>(null);

  React.useEffect(() => {
    setPlanSubject(subject);
  }, [subject]);

  const calendarScaffold = useMemo(
    () =>
      buildTeachingWeeksFromCalendar({
        periodsPerWeek,
        calendar: publishedCalendar,
      }),
    [periodsPerWeek, publishedCalendar],
  );

  const handleGenerate = async () => {
    if (!publishedCalendar) {
      addNotification(
        'Calendar required',
        'Publish / disseminate the school academic calendar before generating an annual lesson plan.',
        'alert',
      );
      return;
    }

    setGenerating(true);
    try {
      const { weeks, schoolDaysPerYear, academicYear, months, daysPerWeek } = calendarScaffold;
      const nonTeaching = summarizeNonTeachingWindows(publishedCalendar.events);
      const teacher = currentUser?.displayName || 'Department Head';
      const monthDaysSummary = months
        .map((m) => `${m.label}: ${m.days} school days (${m.semester === 1 ? '1st' : '2nd'} semester)`)
        .join('; ');

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
              'MANDATORY: Begin with Unit-1 of the teaching textbook.',
              'The first week row unit MUST be titled "Unit-1 …" (first chapter/unit in the book).',
              'Do not start mid-book. Sequence units in textbook order only.',
              `Calendar working days by month: ${monthDaysSummary}`,
              `Total school days this year: ${schoolDaysPerYear}`,
            ].join(' ')
          : [
              `Continue textbook sequence after: ${continuationHint || 'previous batch'}`,
              'Do not restart from Unit-1 unless still covering Unit-1.',
              'Keep unit numbers increasing in textbook order.',
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
              periods_per_week: periodsPerWeek,
              session_duration: 45,
              learning_days_per_year: schoolDaysPerYear,
              days_per_week: daysPerWeek,
              calendar_weeks: batch,
              year_calendar_weeks: weeks,
              non_teaching_windows: [
                ...nonTeaching.slice(0, 6),
                `Working days by month: ${monthDaysSummary}`,
              ],
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
          const last = plan.weeks[plan.weeks.length - 1];
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

      const mergedWeeks = mergeAiWeeksOntoCalendar(weeks, allAiWeeks);
      const result = toAnnualResult(
        { ...combined, weeks: mergedWeeks },
        {
          academicYear,
          schoolName,
          teacherName: teacher,
          grade,
          subject: planSubject,
          schoolDaysPerYear,
          periodsPerWeek,
          periodsPerYear: periodsPerWeek * weeks.length,
        },
      );

      setAnnualPlan(result);
    } catch {
      addNotification('Generation failed', 'Could not generate annual plan. Try again.', 'alert');
    } finally {
      setGenerating(false);
    }
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
    addNotification(
      'Annual plan published',
      `${grade} ${planSubject} annual lesson plan is now available to teachers.`,
      'success',
    );
    // Keep preview; also listed under Published annual plans below
  };

  return (
    <div className="space-y-6">
      <ContentCard
        title="Annual Lesson Plan"
        description="Paced from the disseminated academic calendar (school days per month / year) and the teaching textbook. Only periods per week is entered — it varies by school and subject."
      >
        {!publishedCalendar && (
          <p className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            No published academic calendar found. Ask the school head to disseminate the calendar
            first — generation uses its teaching days.
          </p>
        )}

        {publishedCalendar && (
          <div className="mb-4 space-y-2 rounded-lg border border-border/60 bg-muted/30 p-3 text-xs">
            <p className="text-muted-foreground">
              Calendar:{' '}
              <span className="font-semibold text-foreground">{publishedCalendar.title}</span>
              {' · '}
              <span className="font-semibold text-foreground">
                {calendarScaffold.schoolDaysPerYear} school days
              </span>
              {' · '}
              {calendarScaffold.weeks.length} teaching weeks
              {' · '}
              {calendarScaffold.daysPerWeek} days/week (from calendar)
            </p>
            <div className="flex flex-wrap gap-1.5">
              {calendarScaffold.months.map((m) => (
                <span
                  key={m.key}
                  className="rounded-md border border-border bg-background px-2 py-0.5 font-medium text-foreground"
                >
                  {m.label}: {m.days}d
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            label="Grade"
            options={GRADE_OPTIONS.map((g) => ({ value: g, label: g }))}
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
          />
          <Select
            label="Subject"
            options={[
              { value: 'Mathematics', label: 'Mathematics' },
              { value: 'Biology', label: 'Biology' },
              { value: 'Physics', label: 'Physics' },
              { value: 'Chemistry', label: 'Chemistry' },
              { value: 'English', label: 'English' },
            ]}
            value={planSubject}
            onChange={(e) => setPlanSubject(e.target.value)}
          />
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">
              Periods per week <span className="font-normal text-muted-foreground">(school / subject)</span>
            </label>
            <input
              type="number"
              min={1}
              max={10}
              className="w-full h-10 px-3 rounded-lg border border-border text-sm"
              value={periodsPerWeek}
              onChange={(e) => setPeriodsPerWeek(Number(e.target.value))}
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-3 mt-4">
          <Button
            onClick={handleGenerate}
            loading={generating}
            disabled={!publishedCalendar}
            className="gap-2"
          >
            <Sparkles className="h-4 w-4" />
            {generating ? 'Generating…' : 'Generate annual plan with AI'}
          </Button>
          {annualPlan && (
            <>
              <Button variant="outline" onClick={handleDownload} loading={downloading} className="gap-2">
                <Download className="h-4 w-4" />
                Download Word
              </Button>
              <Button variant="organic" onClick={handlePublish}>
                Publish to teachers
              </Button>
            </>
          )}
        </div>
      </ContentCard>

      {annualPlan && (
        <ContentCard
          title="Annual plan preview"
          description="Table layout matches the school annual lesson plan template. Scroll horizontally on smaller screens."
        >
          <AnnualLessonPlanTable plan={annualPlan} />
        </ContentCard>
      )}

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
            <AnnualLessonPlanTable plan={viewingPublished} />
          </div>
        ) : null}
      </ContentCard>
    </div>
  );
};
