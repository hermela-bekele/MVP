'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Download, Sparkles, X } from 'lucide-react';
import { Dialog, DialogFooter } from '@/components/ui/dialog';
import { Select } from '@/components/ui/select';
import {
  AisBtnPrimary,
  AisBtnSecondary,
  aisFormLabel,
  aisInput,
  aisTextarea,
} from '@/components/dashboard/teacher/TeacherPortalUi';
import type { LessonPlan } from '@/lib/mockData';
import type { AnnualLessonPlanWeekRow } from '@/lib/annualLessonPlan';
import {
  getAnnualMonthOptions,
  getAnnualWeeksForMonth,
  parseAnnualPlanDetail,
  type AIDetailedLessonPlanResult,
} from '@/lib/ai';
import { DetailedLessonPlanRenderer } from '@/components/ui/DetailedLessonPlanRenderer';
import { downloadWeeklyLessonPlanDocx } from '@/lib/weeklyLessonPlanDocx';
import { STUDENT_LEVEL_OPTIONS } from '@/lib/teacherPortal';

function weekKey(w: AnnualLessonPlanWeekRow) {
  return `${w.month}|${w.week}|${w.date}`;
}

function weekLabel(w: AnnualLessonPlanWeekRow) {
  return `${w.week} · ${w.date}${w.unit ? ` · ${w.unit}` : ''}`;
}

export interface WeeklyPlanSubmitPayload {
  title: string;
  grade: string;
  subject: string;
  sessions: number;
  objectives: string[];
  activities: { session: number; activity: string; duration: string }[];
  assessments: string[];
  homework: string;
  planType: 'weekly';
  createdByRole: 'teacher';
  planDetail: string;
}

interface TeacherWeeklyPlanDialogProps {
  isOpen: boolean;
  onClose: () => void;
  annualPlans: LessonPlan[];
  defaultGrade: string;
  defaultSubject: string;
  onSubmit: (payload: WeeklyPlanSubmitPayload) => void;
  onNotify: (title: string, message: string, type: 'alert' | 'success' | 'info') => void;
}

export const TeacherWeeklyPlanDialog: React.FC<TeacherWeeklyPlanDialogProps> = ({
  isOpen,
  onClose,
  annualPlans,
  defaultGrade,
  defaultSubject,
  onSubmit,
  onNotify,
}) => {
  const [annualPlanId, setAnnualPlanId] = useState('');
  const [month, setMonth] = useState('');
  const [selectedWeekKey, setSelectedWeekKey] = useState('');
  const [unit, setUnit] = useState('');
  const [contentsText, setContentsText] = useState('');
  const [page, setPage] = useState('');
  const [periodsPerWeek, setPeriodsPerWeek] = useState(3);
  const [sessionDuration, setSessionDuration] = useState(45);
  const [studentLevel, setStudentLevel] = useState<string>('differentiated');
  const [planTitle, setPlanTitle] = useState('');
  const [generating, setGenerating] = useState(false);
  const [aiResult, setAiResult] = useState<AIDetailedLessonPlanResult | null>(null);

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

  const selectedWeek = weeksInMonth.find((w) => weekKey(w) === selectedWeekKey);

  useEffect(() => {
    if (!isOpen) return;
    if (annualPlans.length === 0) {
      setAnnualPlanId('');
      return;
    }
    if (!annualPlanId || !annualPlans.some((p) => p.id === annualPlanId)) {
      setAnnualPlanId(annualPlans[0].id);
    }
  }, [isOpen, annualPlans, annualPlanId]);

  useEffect(() => {
    if (!annualDetail) {
      setMonth('');
      setSelectedWeekKey('');
      return;
    }
    const months = getAnnualMonthOptions(annualDetail);
    if (!month || !months.includes(month)) {
      setMonth(months[0] ?? '');
    }
  }, [annualDetail, month]);

  useEffect(() => {
    if (!weeksInMonth.length) {
      setSelectedWeekKey('');
      return;
    }
    if (!weeksInMonth.some((w) => weekKey(w) === selectedWeekKey)) {
      setSelectedWeekKey(weekKey(weeksInMonth[0]));
    }
  }, [weeksInMonth, selectedWeekKey]);

  useEffect(() => {
    if (!selectedWeek) return;
    setUnit(selectedWeek.unit || '');
    setContentsText((selectedWeek.contents || []).join('\n'));
    setPage(selectedWeek.page || '');
    setPeriodsPerWeek(selectedWeek.periodsNeeded || annualDetail?.meta?.periodsPerWeek || 3);
    setPlanTitle('');
    setAiResult(null);
  }, [selectedWeekKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const resetAndClose = () => {
    setAiResult(null);
    onClose();
  };

  const buildWeekContext = () => {
    if (!selectedWeek) return '';
    return [
      `Annual week: ${selectedWeek.month} ${selectedWeek.week} (${selectedWeek.date})`,
      unit ? `Unit: ${unit}` : '',
      page ? `Textbook pages: ${page}` : '',
      contentsText.trim() ? `Contents:\n${contentsText.trim()}` : '',
    ]
      .filter(Boolean)
      .join('\n\n');
  };

  const handleGenerate = async () => {
    if (!selectedAnnual || !selectedWeek) {
      onNotify('Week required', 'Select an annual plan month and week first.', 'alert');
      return;
    }
    const topic =
      contentsText.split('\n').map((l) => l.trim()).filter(Boolean)[0] ||
      unit ||
      selectedWeek.contents?.[0] ||
      selectedAnnual.title;
    if (!topic.trim()) {
      onNotify('Content required', 'Add at least one content line for this week.', 'alert');
      return;
    }

    setGenerating(true);
    try {
      const { aiService } = await import('@/lib/ai');
      const { plan, sources } = await aiService.generateDetailedLessonPlan({
        plan_type: 'weekly',
        grade: selectedAnnual.grade || defaultGrade,
        subject: selectedAnnual.subject || defaultSubject,
        topic: topic.trim(),
        subtopic: [unit, page, buildWeekContext()].filter(Boolean).join('\n').slice(0, 1200),
        student_level: studentLevel as
          | 'differentiated'
          | 'beginner'
          | 'intermediate'
          | 'advanced',
        periods_per_week: periodsPerWeek,
        session_duration: sessionDuration,
        days_per_week: Math.min(5, Math.max(1, periodsPerWeek)),
      });

      const withContext: AIDetailedLessonPlanResult = {
        ...plan,
        sources,
        mainTopic: plan.mainTopic || topic.trim(),
        subTopic: plan.subTopic || unit,
        // Carry annual week metadata for teaching-notes week picker
        ...( {
          sourceAnnualPlanId: selectedAnnual.id,
          calendarWeek: {
            month: selectedWeek.month,
            week: selectedWeek.week,
            date: selectedWeek.date,
            unit,
            page,
            contents: contentsText.split('\n').map((l) => l.trim()).filter(Boolean),
            weekContext: buildWeekContext(),
          },
        } as object),
      };

      setAiResult(withContext);
      if (!planTitle) {
        setPlanTitle(
          `${selectedAnnual.grade} ${selectedAnnual.subject} — ${selectedWeek.month} ${selectedWeek.week}`,
        );
      }
    } catch (err) {
      console.error(err);
      onNotify('Generation failed', 'Could not generate weekly plan. Please try again.', 'alert');
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiResult || !selectedAnnual || !selectedWeek) return;

    const objectives =
      aiResult.objectives?.length
        ? aiResult.objectives
        : contentsText.split('\n').map((l) => l.trim()).filter(Boolean).slice(0, 4);

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
        .join('; ') ||
      'Complete the textbook exercise cited in the Assessment row of each session.';

    onSubmit({
      title:
        planTitle ||
        `${selectedAnnual.grade} ${selectedAnnual.subject} — ${selectedWeek.month} ${selectedWeek.week}`,
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
    resetAndClose();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={resetAndClose}
      title="Create weekly lesson plan"
      size="2xl"
      largeTitle
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        <p className="rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-900 dark:border-green-800 dark:bg-green-900/20 dark:text-green-200">
          Pick a week from the published annual plan, edit the content if needed, set sessions and
          minutes, then generate the weekly template and submit for department approval.
        </p>

        {annualPlans.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No published annual plan yet. Ask your department head to publish one first.
          </p>
        ) : (
          <>
            <Select
              variant="ais"
              label="Annual lesson plan"
              options={annualPlans.map((p) => ({
                value: p.id,
                label: `${p.title} (${p.grade})`,
              }))}
              value={annualPlanId}
              onChange={(e) => setAnnualPlanId(e.target.value)}
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Select
                variant="ais"
                label="Month"
                options={monthOptions.map((m) => ({ value: m, label: m }))}
                value={month}
                onChange={(e) => setMonth(e.target.value)}
              />
              <Select
                variant="ais"
                label="Week"
                options={weeksInMonth.map((w) => ({
                  value: weekKey(w),
                  label: weekLabel(w),
                }))}
                value={selectedWeekKey}
                onChange={(e) => setSelectedWeekKey(e.target.value)}
              />
            </div>

            {selectedWeek && (
              <div className="space-y-3 rounded-xl border border-ais-card-border bg-ais-surface-container-low/40 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-ais-on-surface-variant">
                  From annual plan (editable) — weekly generation uses only these
                </p>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
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
                  <label className={aisFormLabel}>Content (one per line)</label>
                  <textarea
                    className={`${aisTextarea} min-h-[88px]`}
                    value={contentsText}
                    onChange={(e) => setContentsText(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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

            <div className="space-y-1">
              <label className={aisFormLabel}>Plan title</label>
              <input
                className={aisInput}
                placeholder="Auto-filled from month / week if empty"
                value={planTitle}
                onChange={(e) => setPlanTitle(e.target.value)}
              />
            </div>

            <div className="flex justify-end">
              <AisBtnPrimary
                type="button"
                onClick={() => void handleGenerate()}
                disabled={generating || !selectedWeek}
              >
                <Sparkles className={`h-4 w-4 ${generating ? 'animate-pulse' : ''}`} />
                {generating ? 'Generating…' : 'Generate weekly plan'}
              </AisBtnPrimary>
            </div>

            {aiResult && (
              <div className="max-h-[420px] space-y-3 overflow-y-auto rounded-xl border border-ais-card-border bg-ais-surface-container-low/40 p-4">
                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-ais-card-border bg-ais-surface-container-low/90 pb-3 backdrop-blur-sm">
                  <span className="text-xs font-semibold text-ais-on-surface">Weekly plan preview</span>
                  <div className="flex gap-3">
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
                      onClick={() => setAiResult(null)}
                      className="flex items-center gap-1 text-xs text-ais-error hover:underline"
                    >
                      <X className="h-3 w-3" />
                      Clear
                    </button>
                  </div>
                </div>
                <DetailedLessonPlanRenderer content={aiResult} />
              </div>
            )}
          </>
        )}

        <DialogFooter className="pt-4 -mb-1">
          <AisBtnSecondary type="button" onClick={resetAndClose}>
            Cancel
          </AisBtnSecondary>
          <AisBtnPrimary type="submit" disabled={!aiResult}>
            Submit for dept approval
          </AisBtnPrimary>
        </DialogFooter>
      </form>
    </Dialog>
  );
};
