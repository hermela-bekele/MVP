'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { Download, Pencil, Plus, Printer, Trash2 } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Select } from '@/components/ui/select';
import { Dialog, DialogFooter } from '@/components/ui/dialog';
import { useConfirmDialog } from '@/components/ui/confirm-dialog';
import { AssessmentContentRenderer } from '@/components/ui/AssessmentContentRenderer';
import { MathRenderer } from '@/components/ui/MathRenderer';
import { isGeneratedAssessmentBlob } from '@/lib/assessmentMarkdown';
import { filterTeacherAssessments, resolveTeacherProfile } from '@/lib/teacherPortal';
import type { Assessment } from '@/lib/mockData';
import {
  assessmentToMarkdown,
  generatePDFFromMarkdown,
  printMarkdown,
  slugifyFilename,
} from '@/lib/pdfUtils';
import {
  AisBtnPrimary,
  AisBtnSecondary,
  AisPage,
  AisPanel,
  AisStatusBadge,
  approvalBadgeVariant,
  aisInput,
  aisTextarea,
} from '@/components/dashboard/teacher/TeacherPortalUi';
import { aisBodySm, aisDataMd, aisLabelCaps } from '@/components/dashboard/teacher/aisStyles';

type AssessmentQuestion = Assessment['questions'][number];

const QUESTION_TYPES = [
  'MCQ',
  'True/False',
  'Short Answer',
  'Essay',
  'Fill the Blank',
  'Matching',
] as const;

type QuestionType = (typeof QUESTION_TYPES)[number];

const emptyForm = (): Omit<AssessmentQuestion, 'id'> => ({
  question: '',
  type: 'MCQ',
  options: ['', '', '', ''],
  answer: '',
});

const emptyMatchingPairs = () => [
  { left: '', right: '' },
  { left: '', right: '' },
  { left: '', right: '' },
  { left: '', right: '' },
];

interface TeacherAssessmentDetailProps {
  assessmentId: string;
}

export const TeacherAssessmentDetail: React.FC<TeacherAssessmentDetailProps> = ({
  assessmentId,
}) => {
  const { assessments, updateAssessmentQuestions, resolveTeacherId, teachers, addNotification } = useApp();
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const teacherId = resolveTeacherId();
  const teacherProfile = resolveTeacherProfile(
    teachers,
    teacherId,
  );

  const assessment = useMemo(
    () =>
      filterTeacherAssessments(assessments, teacherId, {
        subjects: teacherProfile.subjects,
      }).find((a) => a.id === assessmentId),
    [assessments, assessmentId, teacherId, teacherProfile.subjects],
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<Omit<AssessmentQuestion, 'id'>>(emptyForm());
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const handlePrintAssessment = async () => {
    if (!assessment) return;
    await printMarkdown(assessmentToMarkdown(assessment), assessment.title);
  };

  const handleDownloadPDF = async () => {
    if (!assessment) return;
    setIsGeneratingPDF(true);
    try {
      await generatePDFFromMarkdown(
        assessmentToMarkdown(assessment),
        `${slugifyFilename(assessment.title)}.pdf`,
        assessment.title,
      );
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      addNotification('PDF Generation Failed', 'Could not generate the PDF — please try again.', 'alert');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const nextQuestionId = (questions: AssessmentQuestion[]) =>
    questions.length === 0 ? 1 : Math.max(...questions.map((q) => q.id)) + 1;

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm());
    setDialogOpen(true);
  };

  useEffect(() => {
    const open = () => openAdd();
    window.addEventListener('open-assessment-add-question', open);
    return () => window.removeEventListener('open-assessment-add-question', open);
  }, []);

  const openEdit = (q: AssessmentQuestion) => {
    setEditingId(q.id);
    setForm({
      question: q.question,
      type: q.type,
      options: q.options ?? ['', '', '', ''],
      answer: q.answer,
      matchingPairs: q.matchingPairs ?? (q.type === 'Matching' ? emptyMatchingPairs() : undefined),
      competencyLevel: q.competencyLevel,
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingId(null);
    setForm(emptyForm());
  };

  const handleSaveQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    const isMatching = form.type === 'Matching';
    const cleanedPairs = isMatching
      ? (form.matchingPairs ?? [])
          .map((p) => ({ left: p.left.trim(), right: p.right.trim() }))
          .filter((p) => p.left && p.right)
      : undefined;

    if (!assessment || !form.question.trim()) return;
    if (isMatching ? !cleanedPairs || cleanedPairs.length < 2 : !form.answer.trim()) return;

    const isMcq = form.type === 'MCQ';
    const cleanedOptions = isMcq
      ? (form.options ?? []).map((o) => o.trim()).filter(Boolean)
      : undefined;

    const questionData: Omit<AssessmentQuestion, 'id'> = {
      question: form.question.trim(),
      type: form.type,
      answer: isMatching ? '' : form.answer.trim(),
      ...(isMcq && cleanedOptions && cleanedOptions.length > 0
        ? { options: cleanedOptions }
        : {}),
      ...(isMatching && cleanedPairs && cleanedPairs.length > 0
        ? { matchingPairs: cleanedPairs }
        : {}),
      ...(form.competencyLevel ? { competencyLevel: form.competencyLevel } : {}),
    };

    const updated =
      editingId === null
        ? [...assessment.questions, { id: nextQuestionId(assessment.questions), ...questionData }]
        : assessment.questions.map((q) =>
            q.id === editingId ? { ...q, ...questionData } : q,
          );

    updateAssessmentQuestions(assessment.id, updated);
    closeDialog();
  };

  const handleDelete = async (questionId: number) => {
    if (!assessment) return;
    const ok = await confirm('Delete this question?', {
      description: 'This cannot be undone.',
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!ok) return;
    const updated = assessment.questions.filter((q) => q.id !== questionId);
    updateAssessmentQuestions(assessment.id, updated);
  };

  if (!assessment) {
    return (
      <AisPage>
        <p className={`${aisBodySm} rounded-lg bg-ais-surface-container-low p-6 text-center`}>
          Assessment not found or you do not have access to view it.
        </p>
      </AisPage>
    );
  }

  const showOptions = form.type === 'MCQ';
  const isAiDocument = isGeneratedAssessmentBlob(assessment?.questions ?? []);

  return (
    <AisPage>
      <AisPanel
        title={assessment.title}
        description={`${assessment.type} · ${assessment.grade} · ${assessment.subject} · ${assessment.difficulty}`}
        actions={
          <>
            <AisStatusBadge variant={approvalBadgeVariant(assessment.status)}>
              {assessment.status}
            </AisStatusBadge>
            <AisBtnSecondary onClick={handlePrintAssessment} disabled={assessment.questions.length === 0}>
              <Printer className="h-3.5 w-3.5" aria-hidden />
              Print
            </AisBtnSecondary>
            <AisBtnSecondary onClick={handleDownloadPDF} disabled={isGeneratingPDF || assessment.questions.length === 0}>
              <Download className="h-3.5 w-3.5" aria-hidden />
              {isGeneratingPDF ? 'Generating…' : 'Download PDF'}
            </AisBtnSecondary>
            <AisBtnPrimary onClick={openAdd}>
              <Plus className="h-3.5 w-3.5" aria-hidden />
              Add question
            </AisBtnPrimary>
          </>
        }
      >
        {assessment.comments && assessment.status === 'Rejected' && (
          <div className="mb-4 rounded-xl border border-ais-error/30 bg-ais-error/5 px-4 py-3 text-sm text-ais-on-surface">
            <span className="font-semibold">Dept head feedback: </span>
            {assessment.comments}
          </div>
        )}

        {assessment.questions.length === 0 ? (
          <p className={`${aisBodySm} py-8 text-center`}>
            No questions yet. Click &quot;Add question&quot; to create one manually.
          </p>
        ) : isAiDocument ? (
          <div className="rounded-xl border border-ais-card-border bg-white p-6 dark:bg-gray-900/40">
            <AssessmentContentRenderer
              content={assessment.questions[0].question}
              categoryLabel={`${assessment.type} · ${assessment.questions[0].type || 'Mixed'}`}
            />
            {assessment.createdByRole === 'department-head' && (
              <p className="mt-4 text-xs text-muted-foreground">
                Published by department head — record student results in Manage students → Gradebook
                by linking this assessment.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {assessment.questions.map((q, index) => (
              <div
                key={q.id}
                className="rounded-xl border border-ais-card-border bg-ais-surface-container-low/30 p-4"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className={`${aisLabelCaps} flex flex-wrap items-center gap-2`}>
                      <span>
                        Question {index + 1} · {q.type}
                      </span>
                      {q.competencyLevel && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold normal-case tracking-normal ${
                            q.competencyLevel === 'MLC'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200'
                              : 'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200'
                          }`}
                        >
                          {q.competencyLevel === 'MLC' ? 'MLC' : 'Advanced'}
                        </span>
                      )}
                    </p>
                    <div className={`${aisDataMd} mt-2 font-medium`}>
                      <AssessmentContentRenderer content={q.question} />
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      onClick={() => openEdit(q)}
                      className="rounded-lg p-2 text-ais-on-surface-variant transition-colors hover:bg-ais-surface-container-low hover:text-primary"
                      aria-label={`Edit question ${index + 1}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(q.id)}
                      className="rounded-lg p-2 text-ais-on-surface-variant transition-colors hover:bg-ais-error/10 hover:text-ais-error"
                      aria-label={`Delete question ${index + 1}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {q.options && q.options.length > 0 && (
                  <ul className="mb-3 space-y-1 pl-1">
                    {q.options.map((opt, i) => (
                      <li key={i} className={`${aisBodySm} flex gap-2`}>
                        <span className="font-semibold text-ais-on-surface-variant">
                          {String.fromCharCode(65 + i)}.
                        </span>
                        <MathRenderer content={opt} />
                      </li>
                    ))}
                  </ul>
                )}

                {q.matchingPairs && q.matchingPairs.length > 0 ? (
                  <div className="mb-1 overflow-hidden rounded-lg border border-ais-card-border">
                    <div className="grid grid-cols-2 bg-ais-surface-container-low text-[11px] font-semibold uppercase tracking-wide text-ais-on-surface-variant">
                      <div className="border-r border-ais-card-border px-3 py-1.5">Column A</div>
                      <div className="px-3 py-1.5">Column B</div>
                    </div>
                    {q.matchingPairs.map((pair, i) => (
                      <div key={i} className="grid grid-cols-2 border-t border-ais-card-border">
                        <div className={`${aisBodySm} border-r border-ais-card-border px-3 py-1.5`}>
                          {i + 1}) <MathRenderer content={pair.left} />
                        </div>
                        <div className={`${aisBodySm} px-3 py-1.5`}>
                          {String.fromCharCode(65 + i)}) <MathRenderer content={pair.right} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={`${aisBodySm} text-ais-on-surface-variant`}>
                    <span className="font-semibold text-ais-on-surface">Answer: </span>
                    <MathRenderer content={q.answer} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </AisPanel>

      <Dialog
        isOpen={dialogOpen}
        onClose={closeDialog}
        title={editingId === null ? 'Add question' : 'Edit question'}
        size="lg"
        largeTitle
      >
        <form onSubmit={handleSaveQuestion} className="space-y-4 pt-1">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-ais-on-surface">
              Question text
            </label>
            <textarea
              className={aisTextarea}
              required
              rows={4}
              placeholder="Enter the question..."
              value={form.question}
              onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))}
            />
          </div>

          <Select
            variant="ais"
            label="Question type"
            options={QUESTION_TYPES.map((t) => ({ value: t, label: t }))}
            value={form.type}
            onChange={(e) => {
              const type = e.target.value as QuestionType;
              setForm((f) => ({
                ...f,
                type,
                options: type === 'MCQ' ? f.options ?? ['', '', '', ''] : undefined,
                matchingPairs: type === 'Matching' ? f.matchingPairs ?? emptyMatchingPairs() : undefined,
                answer:
                  type === 'True/False' && f.answer !== 'True' && f.answer !== 'False'
                    ? 'True'
                    : f.answer,
              }));
            }}
          />

          <Select
            variant="ais"
            label="Competency level (optional)"
            options={[
              { value: '', label: 'Not set' },
              { value: 'MLC', label: 'MLC (minimum competency)' },
              { value: 'Advanced', label: 'Advanced' },
            ]}
            value={form.competencyLevel ?? ''}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                competencyLevel: e.target.value ? (e.target.value as 'MLC' | 'Advanced') : undefined,
              }))
            }
          />

          {showOptions && (
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-ais-on-surface">
                Options
              </label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {(form.options ?? ['', '', '', '']).map((opt, i) => (
                  <input
                    key={i}
                    className={aisInput}
                    placeholder={`Option ${String.fromCharCode(65 + i)}`}
                    value={opt}
                    onChange={(e) => {
                      const next = [...(form.options ?? ['', '', '', ''])];
                      next[i] = e.target.value;
                      setForm((f) => ({ ...f, options: next }));
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {form.type === 'Matching' && (
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-ais-on-surface">
                Matching pairs
              </label>
              <div className="space-y-2">
                {(form.matchingPairs ?? emptyMatchingPairs()).map((pair, i) => (
                  <div key={i} className="grid grid-cols-2 gap-2">
                    <input
                      className={aisInput}
                      placeholder={`Column A · ${i + 1}`}
                      value={pair.left}
                      onChange={(e) => {
                        const next = [...(form.matchingPairs ?? emptyMatchingPairs())];
                        next[i] = { ...next[i], left: e.target.value };
                        setForm((f) => ({ ...f, matchingPairs: next }));
                      }}
                    />
                    <input
                      className={aisInput}
                      placeholder={`Column B · ${String.fromCharCode(65 + i)}`}
                      value={pair.right}
                      onChange={(e) => {
                        const next = [...(form.matchingPairs ?? emptyMatchingPairs())];
                        next[i] = { ...next[i], right: e.target.value };
                        setForm((f) => ({ ...f, matchingPairs: next }));
                      }}
                    />
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="text-xs font-semibold text-ais-primary hover:underline"
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    matchingPairs: [...(f.matchingPairs ?? emptyMatchingPairs()), { left: '', right: '' }],
                  }))
                }
              >
                + Add pair
              </button>
            </div>
          )}

          {form.type !== 'Matching' && (
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-ais-on-surface">
                Correct answer
              </label>
              {form.type === 'True/False' ? (
                <Select
                  variant="ais"
                  options={[
                    { value: 'True', label: 'True' },
                    { value: 'False', label: 'False' },
                  ]}
                  value={form.answer}
                  onChange={(e) => setForm((f) => ({ ...f, answer: e.target.value }))}
                />
              ) : form.type === 'MCQ' && (form.options ?? []).some((o) => o.trim()) ? (
                <Select
                  variant="ais"
                  options={(form.options ?? [])
                    .map((o) => o.trim())
                    .filter(Boolean)
                    .map((o) => ({ value: o, label: o }))}
                  value={form.answer}
                  onChange={(e) => setForm((f) => ({ ...f, answer: e.target.value }))}
                />
              ) : (
                <input
                  className={aisInput}
                  required
                  placeholder="Enter the correct answer"
                  value={form.answer}
                  onChange={(e) => setForm((f) => ({ ...f, answer: e.target.value }))}
                />
              )}
            </div>
          )}

          <DialogFooter className="pt-2">
            <AisBtnSecondary type="button" onClick={closeDialog}>
              Cancel
            </AisBtnSecondary>
            <AisBtnPrimary type="submit">
              {editingId === null ? 'Add question' : 'Save changes'}
            </AisBtnPrimary>
          </DialogFooter>
        </form>
      </Dialog>
      {ConfirmDialog}
    </AisPage>
  );
};
