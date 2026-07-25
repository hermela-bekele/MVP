'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FilePlus, Upload, Sparkles, Printer, Download } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Select } from '@/components/ui/select';
import { Dialog, DialogFooter } from '@/components/ui/dialog';
import { filterTeacherAssessments, filterTeacherLessonPlans, GRADE_OPTIONS, STUDENT_LEVEL_OPTIONS } from '@/lib/teacherPortal';
import { generateAssessmentWithAI, generateBaselineAssessmentWithAI, buildLessonPlanContext, baselineScopeLabel, baselineTimingLabel, derivePreviousGrade, type BaselineSemesterTiming } from '@/lib/ai';
import { AssessmentContentRenderer } from '@/components/ui/AssessmentContentRenderer';
import type { Assessment } from '@/lib/mockData';
import {
  generatePDFFromMarkdown,
  printMarkdown,
  slugifyFilename,
} from '@/lib/pdfUtils';
import {
  AisBtnPrimary,
  AisBtnSecondary,
  AisEmptyRow,
  AisPage,
  AisPanel,
  AisStatusBadge,
  AisTable,
  AisTd,
  AisTh,
  AisTr,
  approvalBadgeVariant,
  aisInput,
} from '@/components/dashboard/teacher/TeacherPortalUi';

const QUESTION_FORMAT_OPTIONS = [
  'Multiple Choice',
  'Writing',
  'Fill the Blank',
  'Matching',
  'True/False',
  'Mixed',
] as const;

type QuestionFormat = (typeof QUESTION_FORMAT_OPTIONS)[number];

export const TeacherAssessmentsTab: React.FC = () => {
  const router = useRouter();
  const { assessments, createAssessment, lessonPlans } = useApp();
  const myAssessments = filterTeacherAssessments(assessments);
  const teacherPlans = filterTeacherLessonPlans(lessonPlans);

  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<Assessment['type']>('Quiz');
  const [subject, setSubject] = useState('Mathematics');
  const [grade, setGrade] = useState('Grade 11');
  const [difficulty, setDifficulty] = useState<Assessment['difficulty']>('Medium');
  const [uploadMode, setUploadMode] = useState<'create' | 'upload'>('create');
  const [sourceType, setSourceType] = useState<'topic' | 'lesson_plan'>('topic');
  const [selectedLessonPlanId, setSelectedLessonPlanId] = useState('');
  const [topic, setTopic] = useState('');
  const [numQuestions, setNumQuestions] = useState(10);
  const [questionFormat, setQuestionFormat] = useState<QuestionFormat>('Mixed');
  const [assessmentStudentLevel, setAssessmentStudentLevel] = useState('differentiated');
  const [baselineTiming, setBaselineTiming] = useState<BaselineSemesterTiming>('semester_1_start');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  useEffect(() => {
    const open = () => {
      setUploadMode('create');
      setIsOpen(true);
    };
    window.addEventListener('open-teacher-assessment', open);
    return () => window.removeEventListener('open-teacher-assessment', open);
  }, []);

  const selectedPlan = teacherPlans.find((p) => p.id === selectedLessonPlanId);

  useEffect(() => {
    if (sourceType === 'lesson_plan' && selectedPlan) {
      setGrade(selectedPlan.grade);
      setSubject(selectedPlan.subject);
      setTopic(selectedPlan.title);
    }
  }, [sourceType, selectedPlan]);

  const isBaseline = type === 'Baseline';

  // Auto-populate title based on type and topic or lesson plan
  useEffect(() => {
    if (isBaseline) {
      setTitle(`Baseline — ${grade} ${subject} (${baselineTimingLabel(baselineTiming, grade)})`);
      return;
    }
    if (sourceType === 'lesson_plan' && selectedPlan && type) {
      setTitle(`${type} — ${selectedPlan.title}`);
    } else if (topic && type) {
      setTitle(`${type} on ${topic}`);
    }
  }, [topic, type, sourceType, selectedPlan, isBaseline, grade, subject, baselineTiming]);

  const handleGenerateWithAI = async () => {
    if (isBaseline) {
      setIsGenerating(true);
      try {
        const content = await generateBaselineAssessmentWithAI(
          grade,
          subject,
          baselineTiming,
          topic.trim(),
          difficulty,
          numQuestions,
          questionFormat,
          assessmentStudentLevel,
        );
        setGeneratedContent(content);
        setShowPreview(true);
      } catch (error) {
        console.error('Failed to generate baseline assessment:', error);
        alert('Failed to generate baseline assessment. Please try again.');
      } finally {
        setIsGenerating(false);
      }
      return;
    }

    if (sourceType === 'topic' && !topic.trim()) {
      alert('Please enter a topic first');
      return;
    }
    if (sourceType === 'lesson_plan' && !selectedPlan) {
      alert('Please select a lesson plan first');
      return;
    }

    const effectiveTopic = sourceType === 'lesson_plan' && selectedPlan
      ? selectedPlan.title
      : topic.trim();
    const lessonPlanContext = sourceType === 'lesson_plan' && selectedPlan
      ? buildLessonPlanContext(selectedPlan)
      : undefined;
    
    setIsGenerating(true);
    try {
      const content = await generateAssessmentWithAI(
        type,
        effectiveTopic,
        grade,
        subject,
        difficulty,
        numQuestions,
        questionFormat,
        lessonPlanContext,
        assessmentStudentLevel,
      );
      setGeneratedContent(content);
      setShowPreview(true);
    } catch (error) {
      console.error('Failed to generate assessment:', error);
      alert('Failed to generate assessment. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    if (uploadMode === 'create' && !generatedContent) return;

    createAssessment({
      title,
      type,
      subject,
      grade,
      difficulty,
      questions:
        uploadMode === 'upload'
          ? [{ id: 1, question: 'Uploaded assessment file — see attachment in school records.', type: 'File', answer: 'N/A' }]
          : generatedContent
          ? [{ id: 1, question: generatedContent, type: questionFormat, answer: 'See assessment content' }]
          : [
              { id: 1, question: 'Sample question 1', type: 'MCQ', options: ['A', 'B', 'C', 'D'], answer: 'A' },
              { id: 2, question: 'Sample question 2', type: 'Short Answer', answer: 'Open response' },
            ],
    });
    
    // Reset form
    setTitle('');
    setTopic('');
    setSourceType('topic');
    setSelectedLessonPlanId('');
    setNumQuestions(10);
    setQuestionFormat('Mixed');
    setAssessmentStudentLevel('differentiated');
    setBaselineTiming('semester_1_start');
    setGeneratedContent('');
    setShowPreview(false);
    setIsOpen(false);
  };

  const resetModal = () => {
    setIsOpen(false);
    setGeneratedContent('');
    setShowPreview(false);
    setTopic('');
    setSourceType('topic');
    setSelectedLessonPlanId('');
    setNumQuestions(10);
    setQuestionFormat('Mixed');
    setAssessmentStudentLevel('differentiated');
    setBaselineTiming('semester_1_start');
  };

  const canGenerate = isBaseline
    ? true
    : sourceType === 'topic'
      ? !!topic.trim()
      : !!selectedLessonPlanId;

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
      await generatePDFFromMarkdown(
        generatedContent,
        `${slugifyFilename(previewTitle)}.pdf`,
        previewTitle,
      );
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <AisPage>
      <AisPanel
        title="My assessments"
        description="Quizzes, baseline diagnostics, tests, and exams — submitted to department head for approval"
        flush
        actions={
          <>
            <AisBtnPrimary onClick={() => { setUploadMode('create'); setIsOpen(true); }}>
              <FilePlus className="h-3.5 w-3.5" aria-hidden />
              Create assessment
            </AisBtnPrimary>
            <AisBtnSecondary onClick={() => { setUploadMode('upload'); setIsOpen(true); }}>
              <Upload className="h-3.5 w-3.5" aria-hidden />
              Upload test file
            </AisBtnSecondary>
          </>
        }
      >
        <AisTable>
          <thead>
            <tr className="bg-ais-surface-container-low">
              <AisTh>Title</AisTh>
              <AisTh>Type</AisTh>
              <AisTh>Grade / Subject</AisTh>
              <AisTh>Difficulty</AisTh>
              <AisTh>Questions</AisTh>
              <AisTh>Status</AisTh>
            </tr>
          </thead>
          <tbody>
            {myAssessments.length === 0 ? (
              <AisEmptyRow colSpan={6} message="No assessments created yet." />
            ) : (
              myAssessments.map((a) => (
                <AisTr
                  key={a.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/dashboard/teacher/assessments/${a.id}`)}
                >
                  <AisTd className="font-semibold text-primary hover:underline">{a.title}</AisTd>
                  <AisTd>{a.type}</AisTd>
                  <AisTd>{a.grade} · {a.subject}</AisTd>
                  <AisTd>{a.difficulty}</AisTd>
                  <AisTd className="tabular-nums">{a.questions.length}</AisTd>
                  <AisTd>
                    <AisStatusBadge variant={approvalBadgeVariant(a.status)}>{a.status}</AisStatusBadge>
                  </AisTd>
                </AisTr>
              ))
            )}
          </tbody>
        </AisTable>
      </AisPanel>

      <Dialog
        isOpen={isOpen}
        onClose={resetModal}
        title={uploadMode === 'upload' ? 'Upload assessment' : 'Create assessment'}
        size="xl"
        largeTitle
      >
        <form onSubmit={handleSubmit} className="space-y-5 pt-1">
          {/* Source: topic or lesson plan (not for baseline) */}
          {uploadMode === 'create' && !isBaseline && (
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
                } else {
                  setTopic('');
                }
              }}
            />
          )}

          {uploadMode === 'create' && isBaseline && (
            <div className="space-y-4 rounded-xl border border-blue-200 bg-blue-50/60 p-4 dark:border-blue-800 dark:bg-blue-900/20">
              <div>
                <p className="text-sm font-bold text-blue-900 dark:text-blue-200">Baseline diagnostic assessment</p>
                <p className="mt-1 text-xs text-blue-800 dark:text-blue-300">
                  AI uses your indexed textbook to generate readiness checks — no separate previous-grade textbook needed.
                </p>
              </div>
              <Select
                variant="ais"
                label="When to administer *"
                options={[
                  {
                    value: 'semester_1_start',
                    label: `Beginning of Semester 1 — ${derivePreviousGrade(grade)} prerequisites`,
                  },
                  {
                    value: 'semester_2_start',
                    label: `Beginning of Semester 2 — ${grade} Semester 1 review`,
                  },
                ]}
                value={baselineTiming}
                onChange={(e) => setBaselineTiming(e.target.value as BaselineSemesterTiming)}
              />
              <div className="space-y-2">
                <label className="text-xs font-semibold text-ais-on-surface uppercase tracking-wide">
                  Focus area (optional)
                </label>
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
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  Scope: {baselineScopeLabel(grade, subject, baselineTiming, topic)}
                </p>
              </div>
            </div>
          )}

          {uploadMode === 'create' && !isBaseline && sourceType === 'lesson_plan' ? (
            <div className="space-y-3">
              <Select
                variant="ais"
                label="Lesson plan"
                options={
                  teacherPlans.length === 0
                    ? [{ value: '', label: 'No lesson plans available' }]
                    : teacherPlans.map((p) => ({
                        value: p.id,
                        label: `${p.title} (${p.grade} · ${p.subject})`,
                      }))
                }
                value={selectedLessonPlanId}
                onChange={(e) => setSelectedLessonPlanId(e.target.value)}
              />
              {selectedPlan && (
                <div className="rounded-xl border border-ais-card-border bg-ais-surface-container-low/40 p-3 text-xs text-ais-on-surface-variant space-y-2">
                  <p className="font-semibold text-ais-on-surface">{selectedPlan.title}</p>
                  <p>{selectedPlan.grade} · {selectedPlan.subject} · {selectedPlan.sessions} sessions</p>
                  <ul className="list-disc pl-4 space-y-0.5">
                    {selectedPlan.objectives.slice(0, 3).map((obj) => (
                      <li key={obj}>{obj}</li>
                    ))}
                    {selectedPlan.objectives.length > 3 && (
                      <li>+{selectedPlan.objectives.length - 3} more objectives</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          ) : !isBaseline ? (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-ais-on-surface uppercase tracking-wide">Topic</label>
              <input
                className={aisInput}
                required={uploadMode === 'create' && sourceType === 'topic'}
                placeholder="e.g., Quadratic Equations, Derivatives, Logarithms"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>
          ) : null}

          {/* Assessment type & number of questions */}
          {uploadMode === 'create' && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Select
                variant="ais"
                label="Assessment type"
                options={['Baseline', 'Quiz', 'Mid Exam', 'Final Exam', 'Assignment', 'Practical'].map((t) => ({ value: t, label: t }))}
                value={type}
                onChange={(e) => {
                  const next = e.target.value as Assessment['type'];
                  setType(next);
                  if (next === 'Baseline') {
                    setSourceType('topic');
                    setSelectedLessonPlanId('');
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
            </div>
          )}

          {uploadMode === 'create' && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-ais-on-surface uppercase tracking-wide">
                  Number of questions
                </label>
                <input
                  type="number"
                  className={aisInput}
                  required
                  min={1}
                  max={50}
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(Math.max(1, Math.min(50, Number(e.target.value) || 1)))}
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
          )}

          {/* Title Input (auto-populated) */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-ais-on-surface uppercase tracking-wide">Assessment Title</label>
            <input
              className={aisInput}
              required
              placeholder="Assessment title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Parameters Grid */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {uploadMode === 'upload' && (
              <Select
                variant="ais"
                label="Assessment type"
                options={['Baseline', 'Quiz', 'Mid Exam', 'Final Exam', 'Assignment', 'Practical'].map((t) => ({ value: t, label: t }))}
                value={type}
                onChange={(e) => setType(e.target.value as Assessment['type'])}
              />
            )}
            <Select
              variant="ais"
              label="Grade"
              options={GRADE_OPTIONS.map((g) => ({ value: g, label: g }))}
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
            />
            <Select
              variant="ais"
              label="Subject"
              options={[
                { value: 'Mathematics', label: 'Mathematics' },
                { value: 'Biology', label: 'Biology' },
                { value: 'Chemistry', label: 'Chemistry' },
                { value: 'Physics', label: 'Physics' },
              ]}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
            <Select
              variant="ais"
              label="Difficulty"
              options={['Easy', 'Medium', 'Hard'].map((d) => ({ value: d, label: d }))}
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as Assessment['difficulty'])}
            />
          </div>

          {/* AI Generation Button */}
          {uploadMode === 'create' && !showPreview && (
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={handleGenerateWithAI}
                disabled={isGenerating || !canGenerate}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-ais-primary px-8 py-3 text-base font-semibold text-white transition-all hover:bg-ais-primary-container shadow-md hover:shadow-lg"
              >
                <Sparkles className="h-4 w-4 animate-pulse" />
                {isGenerating ? 'Generating with AI...' : isBaseline ? 'Generate baseline with AI' : 'Generate with AI'}
              </button>
            </div>
          )}

          {/* Preview Generated Content */}
          {showPreview && generatedContent && (
            <div className="space-y-2 max-h-96 overflow-y-auto border border-ais-card-border rounded-xl p-4 bg-ais-surface-container-low/40">
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-ais-card-border">
                <label className="text-xs font-semibold text-ais-on-surface flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  AI Generated {isBaseline ? 'Baseline Assessment' : 'Assessment'} Preview
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrintPreview}
                    className="inline-flex items-center gap-1 text-xs font-medium text-ais-primary hover:underline"
                  >
                    <Printer className="h-3.5 w-3.5" aria-hidden />
                    Print
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadPreviewPDF}
                    disabled={isGeneratingPDF}
                    className="inline-flex items-center gap-1 text-xs font-medium text-ais-primary hover:underline disabled:opacity-50"
                  >
                    <Download className="h-3.5 w-3.5" aria-hidden />
                    {isGeneratingPDF ? 'Generating…' : 'Download PDF'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPreview(false);
                      setGeneratedContent('');
                    }}
                    className="text-xs text-ais-error hover:underline flex items-center gap-1"
                  >
                    Clear & Regenerate
                  </button>
                </div>
              </div>
              <AssessmentContentRenderer content={generatedContent} />
            </div>
          )}

          {uploadMode === 'upload' && <input type="file" className="text-xs text-ais-on-surface-variant" onChange={() => {}} />}

          <DialogFooter className="flex-wrap gap-3 pt-4 -mb-1">
            <AisBtnSecondary type="button" onClick={resetModal}>
              Cancel
            </AisBtnSecondary>
            {canSubmit && (
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-ais-primary px-6 py-2 text-sm font-semibold text-white transition-all hover:bg-ais-primary-container shadow-md hover:shadow-lg"
              >
                Submit for dept head approval
              </button>
            )}
          </DialogFooter>
        </form>
      </Dialog>
    </AisPage>
  );
};
