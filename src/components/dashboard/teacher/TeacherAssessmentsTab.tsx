'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FilePlus, Upload, Sparkles } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Select } from '@/components/ui/select';
import { Dialog, DialogFooter } from '@/components/ui/dialog';
import { filterTeacherAssessments, GRADE_OPTIONS } from '@/lib/teacherPortal';
import { generateAssessmentWithAI } from '@/lib/ai';
import { MathRenderer } from '@/components/ui/MathRenderer';
import type { Assessment } from '@/lib/mockData';
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
  const { assessments, createAssessment } = useApp();
  const myAssessments = filterTeacherAssessments(assessments);

  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<Assessment['type']>('Quiz');
  const [subject, setSubject] = useState('Mathematics');
  const [grade, setGrade] = useState('Grade 11');
  const [difficulty, setDifficulty] = useState<Assessment['difficulty']>('Medium');
  const [uploadMode, setUploadMode] = useState<'create' | 'upload'>('create');
  const [topic, setTopic] = useState('');
  const [numQuestions, setNumQuestions] = useState(10);
  const [questionFormat, setQuestionFormat] = useState<QuestionFormat>('Mixed');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    const open = () => {
      setUploadMode('create');
      setIsOpen(true);
    };
    window.addEventListener('open-teacher-assessment', open);
    return () => window.removeEventListener('open-teacher-assessment', open);
  }, []);

  // Auto-populate title based on type and topic
  useEffect(() => {
    if (topic && type) {
      setTitle(`${type} on ${topic}`);
    }
  }, [topic, type]);

  const handleGenerateWithAI = async () => {
    if (!topic) {
      alert('Please enter a topic first');
      return;
    }
    
    setIsGenerating(true);
    try {
      const content = await generateAssessmentWithAI(
        type,
        topic,
        grade,
        subject,
        difficulty,
        numQuestions,
        questionFormat
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
    setNumQuestions(10);
    setQuestionFormat('Mixed');
    setGeneratedContent('');
    setShowPreview(false);
    setIsOpen(false);
  };

  const resetModal = () => {
    setIsOpen(false);
    setGeneratedContent('');
    setShowPreview(false);
    setTopic('');
    setNumQuestions(10);
    setQuestionFormat('Mixed');
  };

  const canSubmit =
    uploadMode === 'upload' || (uploadMode === 'create' && showPreview && !!generatedContent);

  return (
    <AisPage>
      <AisPanel
        title="My assessments"
        description="Quizzes, tests, and exams — submitted to department head for approval"
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
          {/* Topic Input */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-ais-on-surface uppercase tracking-wide">Topic</label>
            <input
              className={aisInput}
              required
              placeholder="e.g., Quadratic Equations, Derivatives, Logarithms"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>

          {/* Assessment type & number of questions */}
          {uploadMode === 'create' && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Select
                variant="ais"
                label="Assessment type"
                options={['Quiz', 'Mid Exam', 'Final Exam', 'Assignment', 'Practical'].map((t) => ({ value: t, label: t }))}
                value={type}
                onChange={(e) => setType(e.target.value as Assessment['type'])}
              />
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
                options={['Quiz', 'Mid Exam', 'Final Exam', 'Assignment', 'Practical'].map((t) => ({ value: t, label: t }))}
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
                disabled={isGenerating || !topic}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#1d4ed8] px-8 py-3 text-base font-semibold text-white transition-all hover:bg-[#1e40af] shadow-md hover:shadow-lg"
              >
                <Sparkles className="h-4 w-4 animate-pulse" />
                {isGenerating ? 'Generating with AI...' : 'Generate with AI'}
              </button>
            </div>
          )}

          {/* Preview Generated Content */}
          {showPreview && generatedContent && (
            <div className="space-y-2 max-h-96 overflow-y-auto border border-ais-card-border rounded-xl p-4 bg-ais-surface-container-low/40">
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-ais-card-border">
                <label className="text-xs font-semibold text-ais-on-surface flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  AI Generated Assessment Preview
                </label>
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
              <MathRenderer content={generatedContent} />
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
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#1d4ed8] px-6 py-2 text-sm font-semibold text-white transition-all hover:bg-[#1e40af] shadow-md hover:shadow-lg"
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
