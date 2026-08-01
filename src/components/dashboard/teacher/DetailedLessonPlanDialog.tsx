'use client';

import React, { useState, Suspense, lazy } from 'react';
import { Sparkles, X, Save } from 'lucide-react';
import { Dialog, DialogFooter } from '@/components/ui/dialog';
import { Select } from '@/components/ui/select';
import type { AIDetailedLessonPlanResult } from '@/lib/ai';
import {
  AisBtnSecondary,
  aisCallout,
  aisFormLabel,
  aisInput,
} from './TeacherPortalUi';
import { GRADE_OPTIONS, STUDENT_LEVEL_OPTIONS } from '@/lib/teacherPortal';

const DetailedLessonPlanRenderer = lazy(() =>
  import('@/components/ui/DetailedLessonPlanRenderer').then((m) => ({
    default: m.DetailedLessonPlanRenderer,
  })),
);

function RendererLoading() {
  return (
    <div className="flex min-h-[120px] items-center justify-center text-sm text-muted-foreground">
      Loading preview…
    </div>
  );
}

interface DetailedLessonPlanDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (plan: any) => void;
}

export const DetailedLessonPlanDialog: React.FC<DetailedLessonPlanDialogProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [planType, setPlanType] = useState<'yearly' | 'monthly' | 'weekly'>('weekly');
  const [planGrade, setPlanGrade] = useState('Grade 11');
  const [planSubject, setPlanSubject] = useState('Mathematics');
  const [mainTopic, setMainTopic] = useState('');
  const [subTopic, setSubTopic] = useState('');
  const [periodsPerWeek, setPeriodsPerWeek] = useState(3);
  const [sessionDuration, setSessionDuration] = useState(45);
  const [studentLevel, setStudentLevel] = useState<string>('differentiated');

  const [learningDaysPerYear, setLearningDaysPerYear] = useState(180);
  const [daysPerWeek, setDaysPerWeek] = useState(5);

  const [generating, setGenerating] = useState(false);
  const [aiResult, setAiResult] = useState<AIDetailedLessonPlanResult | null>(null);

  const topicRequired = planType !== 'yearly';

  const clampDaysPerWeek = (value: number) =>
    Math.min(5, Math.max(1, Number.isFinite(value) ? value : 5));

  const handleGenerate = async () => {
    if (topicRequired && !mainTopic.trim()) {
      alert('Please enter a topic first');
      return;
    }

    const validDaysPerWeek = clampDaysPerWeek(daysPerWeek);
    if (validDaysPerWeek !== daysPerWeek) {
      setDaysPerWeek(validDaysPerWeek);
      alert('Days per week must be between 1 and 5. Value adjusted — please try again.');
      return;
    }

    setGenerating(true);
    try {
      const { aiService } = await import('@/lib/ai');
      const { plan, sources } = await aiService.generateDetailedLessonPlan({
        plan_type: planType,
        grade: planGrade,
        subject: planSubject,
        topic: topicRequired ? mainTopic.trim() : '',
        subtopic: subTopic.trim(),
        student_level: studentLevel as
          | 'differentiated'
          | 'beginner'
          | 'intermediate'
          | 'advanced',
        periods_per_week: periodsPerWeek,
        session_duration: sessionDuration,
        learning_days_per_year: learningDaysPerYear,
        days_per_week: daysPerWeek,
      });

      setAiResult({ ...plan, sources });
    } catch (error) {
      console.error('❌ Failed to generate lesson plan:', error);
      alert('Failed to generate lesson plan from textbook. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = () => {
    if (!aiResult) return;

    onSave({
      type: planType,
      subject: planSubject,
      grade: planGrade,
      mainTopic: planType === 'yearly' ? 'Full Textbook' : mainTopic,
      subTopic,
      content: aiResult,
      periodsPerWeek: planType === 'weekly' ? periodsPerWeek : undefined,
      sessionDuration: planType === 'weekly' ? sessionDuration : undefined,
      studentLevel,
      learningDaysPerYear: planType === 'yearly' ? learningDaysPerYear : undefined,
    });

    handleClose();
  };

  const handleClose = () => {
    setPlanType('weekly');
    setMainTopic('');
    setSubTopic('');
    setAiResult(null);
    onClose();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={handleClose}
      title="Create Detailed Lesson Plan"
      size="2xl"
      largeTitle
    >
      <div className="space-y-5 overflow-y-auto pt-1">
        <div className="space-y-2">
          <label className={aisFormLabel}>Plan Type</label>
          <div className="grid grid-cols-3 gap-3">
            {(['yearly', 'monthly', 'weekly'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => {
                  setPlanType(type);
                  setAiResult(null);
                }}
                className={`px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
                  planType === type
                    ? 'bg-primary text-white shadow-lg'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            variant="ais"
            label="Grade"
            options={GRADE_OPTIONS.filter((g) =>
              g.includes('9') || g.includes('10') || g.includes('11') || g.includes('12')
            ).map((g) => ({ value: g, label: g }))}
            value={planGrade}
            onChange={(e) => setPlanGrade(e.target.value)}
          />
          <Select
            variant="ais"
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
        </div>

        <Select
          variant="ais"
          label="Target student level"
          options={STUDENT_LEVEL_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          value={studentLevel}
          onChange={(e) => setStudentLevel(e.target.value)}
        />

        {planType === 'yearly' ? (
          <div className={aisCallout}>
            Yearly plans cover the <strong>entire textbook</strong> — no topic needed.
            The AI sequences all units with page references, difficulty, and time allocation.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className={aisFormLabel}>Main Topic *</label>
              <input
                className={aisInput}
                placeholder="e.g., Trigonometry, Photosynthesis, Quadratic Equations"
                value={mainTopic}
                onChange={(e) => setMainTopic(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className={aisFormLabel}>Sub Topic</label>
              <input
                className={aisInput}
                placeholder="e.g., Sine Rule, Compound Interest"
                value={subTopic}
                onChange={(e) => setSubTopic(e.target.value)}
              />
            </div>
          </div>
        )}

        {planType === 'weekly' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className={aisFormLabel}>Periods Per Week</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  className={aisInput}
                  value={periodsPerWeek}
                  onChange={(e) => setPeriodsPerWeek(Number(e.target.value))}
                />
              </div>
              <div className="space-y-1">
                <label className={aisFormLabel}>Session Duration (mins)</label>
                <input
                  type="number"
                  min="30"
                  max="120"
                  step="5"
                  className={aisInput}
                  value={sessionDuration}
                  onChange={(e) => setSessionDuration(Number(e.target.value))}
                />
              </div>
            </div>
            <div className={aisCallout}>
              Weekly plans are grounded in textbook pages for the selected topic, paced by difficulty and content volume.
            </div>
          </>
        )}

        {planType === 'yearly' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className={aisFormLabel}>Learning Days Per Year</label>
                <input
                  type="number"
                  min="100"
                  max="250"
                  className={aisInput}
                  value={learningDaysPerYear}
                  onChange={(e) => setLearningDaysPerYear(Number(e.target.value))}
                />
              </div>
              <div className="space-y-1">
                <label className={aisFormLabel}>Days Per Week</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  className={aisInput}
                  value={daysPerWeek}
                  onChange={(e) => setDaysPerWeek(Number(e.target.value))}
                  onBlur={() => setDaysPerWeek((v) => clampDaysPerWeek(v))}
                />
              </div>
            </div>
          </>
        )}

        {planType === 'monthly' && (
          <div className={aisCallout}>
            Monthly plans break down the selected topic week-by-week with textbook page references.
          </div>
        )}

        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating || (topicRequired && !mainTopic.trim())}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-ais-primary px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-ais-primary-container shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles className={`h-4 w-4 ${generating ? 'animate-pulse' : ''}`} />
            {generating ? 'Generating from textbook…' : 'Generate with AI'}
          </button>
        </div>

        {aiResult && (
          <div className="space-y-3 max-h-[500px] overflow-y-auto rounded-xl border border-ais-card-border bg-ais-surface-container-low/40 p-4">
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-ais-card-border sticky top-0 bg-ais-surface-container-low/40 backdrop-blur-sm z-10">
              <label className="text-xs font-semibold text-ais-on-surface flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                AI Generated {planType.charAt(0).toUpperCase() + planType.slice(1)} Lesson Plan Preview
              </label>
              <button
                type="button"
                onClick={() => setAiResult(null)}
                className="text-xs text-ais-error hover:underline flex items-center gap-1"
              >
                <X className="h-3 w-3" />
                Clear & Regenerate
              </button>
            </div>
            <Suspense fallback={<RendererLoading />}>
              <DetailedLessonPlanRenderer content={aiResult} />
            </Suspense>
          </div>
        )}

        <DialogFooter className="flex-wrap gap-3 pt-4 -mb-1">
          <AisBtnSecondary type="button" onClick={handleClose}>
            <X className="h-3.5 w-3.5" aria-hidden />
            Cancel
          </AisBtnSecondary>
          <button
            type="button"
            onClick={handleSave}
            disabled={!aiResult}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-ais-primary px-6 py-2 text-sm font-semibold text-white transition-all hover:bg-ais-primary-container shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4" aria-hidden />
            Save Lesson Plan
          </button>
        </DialogFooter>
      </div>
    </Dialog>
  );
};
