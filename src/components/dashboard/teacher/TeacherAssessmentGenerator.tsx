'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Sparkles, Printer, Download, Pencil, Check } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Select } from '@/components/ui/select';
import { GenerationStatusPanel } from '@/components/ui/GenerationStatusPanel';
import { useElapsedTime } from '@/hooks/useElapsedTime';
import { filterTeacherLessonPlans, GRADE_OPTIONS, STUDENT_LEVEL_OPTIONS, SUBJECT_OPTIONS } from '@/lib/teacherPortal';
import {
  generateAssessmentWithAI,
  generateBaselineAssessmentWithAI,
  getWeeklyPlanSessionTopicOptions,
  baselineScopeLabel,
  baselineTimingLabel,
  derivePreviousGrade,
  questionLimitsForAssessmentType,
  type BaselineSemesterTiming,
} from '@/lib/ai';
import { AssessmentContentRenderer } from '@/components/ui/AssessmentContentRenderer';
import { parseAssessmentQuestions, wrapAssessmentMarkdown } from '@/lib/assessmentMarkdown';
import type { Assessment } from '@/lib/mockData';
import { generatePDFFromMarkdown, printMarkdown, slugifyFilename } from '@/lib/pdfUtils';
import { AisBtnPrimary, AisBtnSecondary, aisInput, aisFormLabel } from '@/components/dashboard/teacher/TeacherPortalUi';
import { GeneratorActionBar } from '@/components/ui/GeneratorActionBar';

const QUESTION_FORMAT_OPTIONS = [
  'Multiple Choice',
  'Writing',
  'Fill the Blank',
  'Matching',
  'True/False',
  'Mixed',
] as const;

type QuestionFormat = (typeof QUESTION_FORMAT_OPTIONS)[number];

/**
 * Dedicated-page assessment generator — replaces the former "Create assessment" Dialog in
 * TeacherAssessmentsTab.tsx. Same form fields, same generateAssessmentWithAI/
 * generateBaselineAssessmentWithAI calls, same edit/save behavior; the differences are
 * structural: a full page instead of a modal (so a long generation isn't trapped behind a
 * dialog that feels like it could be dismissed/lost), a GenerationStatusPanel with a live
 * elapsed-time counter instead of a bare button spinner, and navigating back to the
 * assessments list on save instead of closing a dialog.
 */
export function TeacherAssessmentGenerator() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialUploadMode = searchParams.get('mode') === 'upload' ? 'upload' : 'create';

  const { createAssessment, lessonPlans, resolveTeacherId } = useApp();
  const teacherId = resolveTeacherId();
  const teacherPlans = filterTeacherLessonPlans(lessonPlans, teacherId);

  const [title, setTitle] = useState('');
  const [type, setType] = useState<Assessment['type']>('Quiz');
  const [subject, setSubject] = useState('Mathematics');
  const [grade, setGrade] = useState('Grade 11');
  const [difficulty, setDifficulty] = useState<Assessment['difficulty']>('Medium');
  const [uploadMode] = useState<'create' | 'upload'>(initialUploadMode);
  const [sourceType, setSourceType] = useState<'topic' | 'lesson_plan'>('topic');
  const [selectedLessonPlanId, setSelectedLessonPlanId] = useState('');
  const [selectedSessionScopes, setSelectedSessionScopes] = useState<string[]>([]);
  const [topic, setTopic] = useState('');
  const [numQuestions, setNumQuestions] = useState(
    () => questionLimitsForAssessmentType('Quiz').default,
  );
  const [questionFormat, setQuestionFormat] = useState<QuestionFormat>('Mixed');
  const [assessmentStudentLevel, setAssessmentStudentLevel] = useState('differentiated');
  const [useMlcMix, setUseMlcMix] = useState(false);
  const [mlcPercent, setMlcPercent] = useState(70);
  const [baselineTiming, setBaselineTiming] = useState<BaselineSemesterTiming>('semester_1_start');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [generationError, setGenerationError] = useState('');

  const elapsedSeconds = useElapsedTime(isGenerating);

  const questionLimits = questionLimitsForAssessmentType(type);

  const selectedPlan = teacherPlans.find((p) => p.id === selectedLessonPlanId);
  const sessionOptions = useMemo(
    () =>
      (selectedPlan ? getWeeklyPlanSessionTopicOptions(selectedPlan) : []).filter(
        (o) => o.value !== 'all',
      ),
    [selectedPlan],
  );
  const selectedSessions = sessionOptions.filter((o) =>
    selectedSessionScopes.includes(o.value),
  );
  const combinedSession = useMemo(() => {
    if (selectedSessions.length === 0) return undefined;
    if (selectedSessions.length === 1) return selectedSessions[0];
    return {
      value: selectedSessions.map((s) => s.value).join(','),
      label: `${selectedSessions.length} sessions selected`,
      topic: selectedSessions.map((s) => s.topic).join('; '),
      subtopic: [...new Set(selectedSessions.map((s) => s.subtopic).filter(Boolean))].join('; '),
      context: [
        `Focus: ${selectedSessions.length} selected sessions from this weekly lesson plan`,
        ...selectedSessions.map((s) => s.context),
      ].join('\n\n'),
    };
  }, [selectedSessions]);

  useEffect(() => {
    setSelectedSessionScopes([]);
    if (sourceType === 'lesson_plan' && selectedPlan) {
      setGrade(selectedPlan.grade);
      setSubject(selectedPlan.subject);
      const options = getWeeklyPlanSessionTopicOptions(selectedPlan).filter(
        (o) => o.value !== 'all',
      );
      const firstSession = options[0];
      if (firstSession) {
        setSelectedSessionScopes([firstSession.value]);
        setTopic(firstSession.topic);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceType, selectedPlan]);

  useEffect(() => {
    if (sourceType !== 'lesson_plan' || !combinedSession) return;
    setTopic(combinedSession.topic);
  }, [sourceType, combinedSession]);

  const toggleSessionScope = (value: string) => {
    setSelectedSessionScopes((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
  };

  const isBaseline = type === 'Baseline';

  useEffect(() => {
    if (isBaseline) {
      setTitle(`Baseline — ${grade} ${subject} (${baselineTimingLabel(baselineTiming, grade)})`);
      return;
    }
    if (sourceType === 'lesson_plan' && selectedPlan && combinedSession && type) {
      const pages = combinedSession.subtopic?.trim();
      const pageSuffix = pages && /p\.|pp\.|\d/.test(pages) ? ` (${pages})` : '';
      setTitle(`${type} — ${combinedSession.topic}${pageSuffix}`);
    } else if (topic && type) {
      setTitle(`${type} on ${topic}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic, type, sourceType, selectedPlan, combinedSession, isBaseline, grade, subject, baselineTiming]);

  const goBackToList = () => router.push('/dashboard/teacher/assessments');

  const handleGenerateWithAI = async () => {
    setGenerationError('');
    if (isBaseline) {
      setIsGenerating(true);
      try {
        const content = await generateBaselineAssessmentWithAI(
          grade, subject, baselineTiming, topic.trim(), difficulty, numQuestions,
          questionFormat, assessmentStudentLevel, useMlcMix ? mlcPercent : undefined,
        );
        setGeneratedContent(content);
        setShowPreview(true);
      } catch (error) {
        console.error('Failed to generate baseline assessment:', error);
        setGenerationError(error instanceof Error ? error.message : 'Failed to generate baseline assessment. Please try again.');
      } finally {
        setIsGenerating(false);
      }
      return;
    }

    if (sourceType === 'topic' && !topic.trim()) {
      setGenerationError('Please enter a topic first.');
      return;
    }
    if (sourceType === 'lesson_plan' && !selectedPlan) {
      setGenerationError('Please select a lesson plan first.');
      return;
    }
    if (sourceType === 'lesson_plan' && selectedSessionScopes.length === 0) {
      setGenerationError('Please select at least one session from the lesson plan.');
      return;
    }

    const pages = combinedSession?.subtopic?.trim() || '';
    const pageHint = pages && /p\.|pp\.|\d/.test(pages) ? ` (textbook ${pages})` : '';
    const effectiveTopic =
      sourceType === 'lesson_plan' && combinedSession
        ? `${combinedSession.topic}${pageHint}`
        : topic.trim();
    const lessonPlanContext =
      sourceType === 'lesson_plan' && combinedSession ? combinedSession.context : undefined;

    setIsGenerating(true);
    try {
      const content = wrapAssessmentMarkdown({
        body: await generateAssessmentWithAI(
          type, effectiveTopic, grade, subject, difficulty, numQuestions, questionFormat,
          lessonPlanContext, assessmentStudentLevel, useMlcMix ? mlcPercent : undefined,
        ),
        assessmentType: type, questionFormat, numQuestions, topic: effectiveTopic, grade, subject,
      });
      setGeneratedContent(content);
      setShowPreview(true);
    } catch (error) {
      console.error('Failed to generate assessment:', error);
      setGenerationError(error instanceof Error ? error.message : 'Failed to generate assessment. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    if (uploadMode === 'create' && !generatedContent) return;

    const parsedQuestions = generatedContent ? parseAssessmentQuestions(generatedContent) : null;

    createAssessment({
      title, type, subject, grade, difficulty,
      questions:
        uploadMode === 'upload'
          ? [{ id: 1, question: 'Uploaded assessment file — see attachment in school records.', type: 'File', answer: 'N/A' }]
          : parsedQuestions && parsedQuestions.length > 0
          ? parsedQuestions
          : [{ id: 1, question: generatedContent, type: questionFormat, answer: 'See assessment content' }],
    });

    goBackToList();
  };

  const canGenerate = isBaseline
    ? true
    : sourceType === 'topic'
      ? !!topic.trim()
      : !!selectedLessonPlanId && selectedSessionScopes.length > 0;

  const canSubmit =
    uploadMode === 'upload' || (uploadMode === 'create' && showPreview && !!generatedContent);

  const previewTitle = title || `${type} on ${topic || 'Assessment'}`;

  const handlePrintPreview = async () => {
    if (!generatedContent.trim()) return;
    await printMarkdown(generatedContent, previewTitle);
  };

  const handleDownloadPreviewPDF = async () => {
    if (!generatedContent.trim()) return;
    setIsGeneratingPDF(true);
    try {
      await generatePDFFromMarkdown(generatedContent, `${slugifyFilename(previewTitle)}.pdf`, previewTitle);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto w-full max-w-[96rem] space-y-5">
      {uploadMode === 'create' && !isBaseline && (
        <section className="rounded-xl border border-ais-card-border bg-card p-5">
          <Select
            variant="ais"
            label="Generate from"
            options={[
              { value: 'topic', label: 'Topic (manual entry)' },
              { value: 'lesson_plan', label: 'Lesson plan' },
            ]}
            value={sourceType}
            onChange={(e) => {
              const next = e.target.value as 'topic' | 'lesson_plan';
              setSourceType(next);
              if (next === 'topic') {
                setSelectedLessonPlanId('');
                setSelectedSessionScopes([]);
              } else {
                setTopic('');
              }
            }}
          />
        </section>
      )}

      {uploadMode === 'create' && isBaseline && (
        <section className="space-y-4 rounded-xl border border-blue-200 bg-blue-50/60 p-5 dark:border-blue-800 dark:bg-blue-900/20">
          <div>
            <p className="text-sm font-bold text-blue-900 dark:text-blue-200">Baseline diagnostic assessment</p>
            <p className="mt-1 text-xs text-blue-800 dark:text-blue-300">
              AI uses your indexed textbook to generate readiness checks — no separate previous-grade textbook needed.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Select
              variant="ais"
              label="When to administer *"
              options={[
                { value: 'semester_1_start', label: `Beginning of Semester 1 — ${derivePreviousGrade(grade)} prerequisites` },
                { value: 'semester_2_start', label: `Beginning of Semester 2 — ${grade} Semester 1 review` },
              ]}
              value={baselineTiming}
              onChange={(e) => setBaselineTiming(e.target.value as BaselineSemesterTiming)}
            />
            <div className="space-y-2">
              <label className="text-xs font-semibold text-ais-on-surface uppercase tracking-wide">Focus area (optional)</label>
              <input
                className={aisInput}
                placeholder={
                  baselineTiming === 'semester_1_start'
                    ? 'e.g., Algebra, Functions — leave blank for full prerequisite scan'
                    : 'e.g., Trigonometry — leave blank for full Semester 1 review'
                }
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>
          </div>
          <p className="text-xs text-blue-700 dark:text-blue-300">
            Scope: {baselineScopeLabel(grade, subject, baselineTiming, topic)}
          </p>
        </section>
      )}

      {uploadMode === 'create' && !isBaseline && sourceType === 'lesson_plan' ? (
        <section className="space-y-4 rounded-xl border border-ais-card-border bg-card p-5">
          <Select
            variant="ais"
            label="Lesson plan"
            options={
              teacherPlans.length === 0
                ? [{ value: '', label: 'No lesson plans available' }]
                : teacherPlans.map((p) => ({ value: p.id, label: `${p.title} (${p.grade} · ${p.subject})` }))
            }
            value={selectedLessonPlanId}
            onChange={(e) => {
              setSelectedLessonPlanId(e.target.value);
              setSelectedSessionScopes([]);
            }}
          />
          {selectedPlan && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className={aisFormLabel}>Session(s)</label>
                  {sessionOptions.length > 0 && (
                    <button
                      type="button"
                      className="text-[11px] font-semibold text-ais-primary hover:underline"
                      onClick={() =>
                        setSelectedSessionScopes((prev) =>
                          prev.length === sessionOptions.length ? [] : sessionOptions.map((o) => o.value),
                        )
                      }
                    >
                      {selectedSessionScopes.length === sessionOptions.length ? 'Clear all' : 'Select all'}
                    </button>
                  )}
                </div>
                {sessionOptions.length === 0 ? (
                  <p className="text-xs text-ais-on-surface-variant">No sessions in this plan</p>
                ) : (
                  <div
                    className="max-h-44 overflow-y-auto rounded-xl border border-ais-card-border bg-white dark:bg-ais-surface"
                    role="listbox"
                    aria-multiselectable="true"
                    aria-label="Sessions"
                  >
                    {sessionOptions.map((o) => {
                      const on = selectedSessionScopes.includes(o.value);
                      return (
                        <label key={o.value} className="flex cursor-pointer items-center gap-2.5 px-3 py-1.5 text-sm hover:bg-ais-row-hover">
                          <input
                            type="checkbox"
                            checked={on}
                            onChange={() => toggleSessionScope(o.value)}
                            className="h-3.5 w-3.5 rounded border-ais-card-border accent-ais-primary"
                          />
                          <span className={on ? 'font-medium text-ais-on-surface' : 'text-ais-on-surface-variant'}>{o.label}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="rounded-xl border border-ais-card-border bg-ais-surface-container-low/40 p-3 text-xs text-ais-on-surface-variant space-y-2">
                <p className="font-semibold text-ais-on-surface">{selectedPlan.title}</p>
                <p>{selectedPlan.grade} · {selectedPlan.subject} · {selectedPlan.sessions} sessions</p>
                {combinedSession && (
                  <div className="space-y-1 rounded-lg bg-white/60 p-2 dark:bg-black/20">
                    <p className="font-semibold text-ais-on-surface">Quiz topic: {combinedSession.topic}</p>
                    {combinedSession.subtopic?.trim() && <p>Textbook: {combinedSession.subtopic}</p>}
                  </div>
                )}
                <ul className="list-disc pl-4 space-y-0.5">
                  {selectedPlan.objectives.slice(0, 3).map((obj) => (
                    <li key={obj}>{obj}</li>
                  ))}
                  {selectedPlan.objectives.length > 3 && <li>+{selectedPlan.objectives.length - 3} more objectives</li>}
                </ul>
              </div>
            </div>
          )}
        </section>
      ) : !isBaseline ? (
        <section className="rounded-xl border border-ais-card-border bg-card p-5">
          <label className="text-xs font-semibold text-ais-on-surface uppercase tracking-wide">Topic</label>
          <input
            className={`${aisInput} mt-2`}
            required={uploadMode === 'create' && sourceType === 'topic'}
            placeholder="e.g., Quadratic Equations, Derivatives, Logarithms"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
        </section>
      ) : null}

      {uploadMode === 'create' && (
        <section className="rounded-xl border border-ais-card-border bg-card p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Select
              variant="ais"
              label="Assessment type"
              options={['Baseline', 'Quiz', 'Assignment'].map((t) => ({ value: t, label: t }))}
              value={type}
              onChange={(e) => {
                const next = e.target.value as Assessment['type'];
                setType(next);
                setNumQuestions(questionLimitsForAssessmentType(next).default);
                if (next === 'Baseline') {
                  setSourceType('topic');
                  setSelectedLessonPlanId('');
                  setSelectedSessionScopes([]);
                }
              }}
            />
            <Select
              variant="ais"
              label="Student level"
              options={STUDENT_LEVEL_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
              value={assessmentStudentLevel}
              onChange={(e) => setAssessmentStudentLevel(e.target.value)}
            />
            <div className="space-y-2">
              <label className="text-xs font-semibold text-ais-on-surface uppercase tracking-wide">
                Number of questions ({questionLimits.min}–{questionLimits.max})
              </label>
              <input
                type="number"
                className={aisInput}
                required
                min={questionLimits.min}
                max={questionLimits.max}
                value={numQuestions}
                onChange={(e) =>
                  setNumQuestions(
                    Math.max(questionLimits.min, Math.min(questionLimits.max, Number(e.target.value) || questionLimits.default)),
                  )
                }
              />
            </div>
            <Select
              variant="ais"
              label="Question format"
              options={QUESTION_FORMAT_OPTIONS.map((f) => ({ value: f, label: f }))}
              value={questionFormat}
              onChange={(e) => setQuestionFormat(e.target.value as QuestionFormat)}
            />
          </div>
        </section>
      )}

      {uploadMode === 'create' && (
        <section className="space-y-2 rounded-xl border border-ais-card-border bg-card p-5">
          <label className="flex items-center gap-2 text-xs font-semibold text-ais-on-surface uppercase tracking-wide">
            <input type="checkbox" checked={useMlcMix} onChange={(e) => setUseMlcMix(e.target.checked)} />
            Set MLC vs. advanced mix
          </label>
          {useMlcMix && (
            <div className="flex items-center gap-3">
              <input
                type="range" min={0} max={100} step={5} value={mlcPercent}
                onChange={(e) => setMlcPercent(Number(e.target.value))}
                className="flex-1"
              />
              <span className="w-40 shrink-0 text-xs text-ais-on-surface-variant">
                {mlcPercent}% MLC (minimum competency) · {100 - mlcPercent}% advanced
              </span>
            </div>
          )}
          <p className="text-[11px] text-ais-on-surface-variant">
            Leave off to generate questions across the full range as before. Turn on to control
            exactly how many questions test only the official Minimum Learning Competencies vs.
            advanced/enrichment content.
          </p>
        </section>
      )}

      <section className="rounded-xl border border-ais-card-border bg-card p-5">
        <label className="text-xs font-semibold text-ais-on-surface uppercase tracking-wide">Assessment Title</label>
        <input className={`${aisInput} mt-2`} required placeholder="Assessment title" value={title} onChange={(e) => setTitle(e.target.value)} />
      </section>

      <section className="rounded-xl border border-ais-card-border bg-card p-5">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {uploadMode === 'upload' && (
            <Select
              variant="ais"
              label="Assessment type"
              options={['Baseline', 'Quiz', 'Assignment'].map((t) => ({ value: t, label: t }))}
              value={type}
              onChange={(e) => setType(e.target.value as Assessment['type'])}
            />
          )}
          <Select variant="ais" label="Grade" options={GRADE_OPTIONS.map((g) => ({ value: g, label: g }))} value={grade} onChange={(e) => setGrade(e.target.value)} />
          <Select variant="ais" label="Subject" options={SUBJECT_OPTIONS.map((s) => ({ value: s, label: s }))} value={subject} onChange={(e) => setSubject(e.target.value)} />
          <Select variant="ais" label="Difficulty" options={['Easy', 'Medium', 'Hard'].map((d) => ({ value: d, label: d }))} value={difficulty} onChange={(e) => setDifficulty(e.target.value as Assessment['difficulty'])} />
        </div>
      </section>

      {uploadMode === 'create' && (
        <GenerationStatusPanel
          phase={isGenerating ? 'generating' : generationError ? 'error' : 'idle'}
          statusText="Generating assessment…"
          elapsedSeconds={elapsedSeconds}
          errorMessage={generationError}
        />
      )}

      {showPreview && generatedContent && (
        <div className="space-y-2">
          <GenerationStatusPanel
            phase="success"
            statusText=""
            elapsedSeconds={elapsedSeconds}
            successMessage="Assessment generated — review, edit if needed, then save below."
          />
          <div className="space-y-2 border border-ais-card-border rounded-xl p-4 bg-ais-surface-container-low/40">
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-ais-card-border">
              <label className="text-xs font-semibold text-ais-on-surface flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                AI Generated {isBaseline ? 'Baseline Assessment' : 'Assessment'} Preview
              </label>
              <div className="flex items-center gap-2">
                <button type="button" onClick={handlePrintPreview} className="inline-flex items-center gap-1 text-xs font-medium text-ais-primary hover:underline">
                  <Printer className="h-3.5 w-3.5" aria-hidden />
                  Print
                </button>
                <button type="button" onClick={handleDownloadPreviewPDF} disabled={isGeneratingPDF} className="inline-flex items-center gap-1 text-xs font-medium text-ais-primary hover:underline disabled:opacity-50">
                  <Download className="h-3.5 w-3.5" aria-hidden />
                  {isGeneratingPDF ? 'Generating…' : 'Download PDF'}
                </button>
                <button type="button" onClick={() => setIsEditingContent((v) => !v)} className="inline-flex items-center gap-1 text-xs font-medium text-ais-primary hover:underline">
                  {isEditingContent ? (<><Check className="h-3.5 w-3.5" aria-hidden />Done editing</>) : (<><Pencil className="h-3.5 w-3.5" aria-hidden />Edit</>)}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowPreview(false); setGeneratedContent(''); setIsEditingContent(false); }}
                  className="text-xs text-ais-error hover:underline flex items-center gap-1"
                >
                  Clear & Regenerate
                </button>
              </div>
            </div>
            {isEditingContent ? (
              <textarea
                value={generatedContent}
                onChange={(e) => setGeneratedContent(e.target.value)}
                rows={16}
                className={`${aisInput} w-full resize-y font-mono text-xs leading-relaxed`}
                placeholder="Edit the generated assessment markdown…"
              />
            ) : (
              <AssessmentContentRenderer content={generatedContent} categoryLabel={`${type} · ${questionFormat}`} />
            )}
          </div>
        </div>
      )}

      {uploadMode === 'upload' && (
        <section className="rounded-xl border border-ais-card-border bg-card p-5">
          <input type="file" className="text-xs text-ais-on-surface-variant" onChange={() => {}} />
        </section>
      )}

      <GeneratorActionBar
        left={
          <>
            <AisBtnSecondary type="button" onClick={goBackToList}>
              Cancel
            </AisBtnSecondary>
            {uploadMode === 'create' && (
              <AisBtnPrimary type="button" onClick={handleGenerateWithAI} disabled={isGenerating || !canGenerate}>
                <Sparkles className={`h-4 w-4 ${isGenerating ? 'animate-pulse' : ''}`} />
                {isGenerating
                  ? 'Generating with AI…'
                  : showPreview
                    ? 'Regenerate with AI'
                    : isBaseline
                      ? 'Generate baseline with AI'
                      : 'Generate with AI'}
              </AisBtnPrimary>
            )}
          </>
        }
        right={
          canSubmit ? (
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-btn-primary px-6 py-2 text-sm font-semibold text-btn-primary-foreground transition-all hover:bg-btn-primary/90 shadow-md hover:shadow-lg"
            >
              {type === 'Quiz' || type === 'Baseline' ? 'Save & make available for grades' : 'Submit for dept head approval'}
            </button>
          ) : undefined
        }
      />
    </form>
  );
}
