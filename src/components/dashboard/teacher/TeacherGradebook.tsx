'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Check, Plus, X } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Select } from '@/components/ui/select';
import { Dialog, DialogFooter } from '@/components/ui/dialog';
import {
  CURRENT_TERM,
  GRADE_ENTRY_TYPES,
  GRADE_OPTIONS,
  SECTION_OPTIONS,
  entryPercent,
  filterTeacherGradeEntries,
  filterTeacherStudents,
  gradesForStudent,
  primarySubjectForTeacher,
  resolveTeacherProfile,
  weightedTermAverage,
} from '@/lib/teacherPortal';
import type {
  GradeQuestionResult,
  StudentGradeEntry,
  StudentGradeEntryType,
} from '@/lib/mockData';
import {
  AisBtnPrimary,
  AisBtnSecondary,
  AisEmptyRow,
  AisPanel,
  AisStatusBadge,
  AisTable,
  AisTd,
  AisTh,
  AisTr,
  aisFormLabel,
  aisInput,
} from '@/components/dashboard/teacher/TeacherPortalUi';
import {
  aisBodyMd,
  aisBodySm,
  aisCard,
  aisDataMd,
  aisHeadlineSm,
  aisLabelCaps,
} from '@/components/dashboard/teacher/aisStyles';

type ColumnDef = {
  key: string;
  entryType: StudentGradeEntryType;
  title: string;
  maxScore: number;
  weight: number;
};

const TYPE_ORDER: StudentGradeEntryType[] = [
  'Quiz',
  'Test',
  'Assignment',
  'Project',
  'Mid Exam',
  'Final Exam',
  'Practical',
];

function columnKey(entryType: string, title: string) {
  return `${entryType}::${title}`;
}

function buildQuestionMarks(
  count: number,
  linkedPrompts: string[] = [],
  existing?: GradeQuestionResult[],
): GradeQuestionResult[] {
  return Array.from({ length: count }, (_, i) => {
    const n = i + 1;
    const prev = existing?.find((q) => q.questionNumber === n);
    return {
      questionNumber: n,
      correct: prev?.correct ?? true,
      prompt: linkedPrompts[i] || prev?.prompt,
    };
  });
}

export const TeacherGradebook: React.FC = () => {
  const {
    students,
    teachers,
    studentGradeEntries,
    assessments,
    upsertStudentGradeEntry,
    deleteStudentGradeEntry,
    resolveTeacherId,
  } = useApp();
  const teacherId = resolveTeacherId();
  const teacherProfile = resolveTeacherProfile(teachers, teacherId);
  const defaultSubject = primarySubjectForTeacher(teacherProfile);

  const [classGrade, setClassGrade] = useState('Grade 9');
  const [classSection, setClassSection] = useState('A');
  const [detailEntry, setDetailEntry] = useState<StudentGradeEntry | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | undefined>();

  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [entryType, setEntryType] = useState<StudentGradeEntryType>('Quiz');
  const [title, setTitle] = useState('');
  const [score, setScore] = useState('');
  const [maxScore, setMaxScore] = useState('10');
  const [weight, setWeight] = useState('10');
  const [remarks, setRemarks] = useState('');
  const [linkedAssessment, setLinkedAssessment] = useState('');
  const [questionCount, setQuestionCount] = useState(10);
  const [questionMarks, setQuestionMarks] = useState<GradeQuestionResult[]>([]);
  const [useQuestionMarks, setUseQuestionMarks] = useState(true);

  const roster = useMemo(
    () => filterTeacherStudents(students, classGrade, classSection),
    [students, classGrade, classSection],
  );

  const classEntries = useMemo(
    () =>
      filterTeacherGradeEntries(studentGradeEntries, teacherId).filter(
        (e) => e.gradeLevel === classGrade && e.section === classSection,
      ),
    [studentGradeEntries, classGrade, classSection, teacherId],
  );

  const columns = useMemo(() => {
    const map = new Map<string, ColumnDef & { sortDate: string }>();
    for (const e of classEntries) {
      const key = columnKey(e.entryType, e.title);
      const prev = map.get(key);
      if (!prev || e.recordedAt > prev.sortDate) {
        map.set(key, {
          key,
          entryType: e.entryType,
          title: e.title,
          maxScore: e.maxScore,
          weight: e.weight,
          sortDate: e.recordedAt,
        });
      }
    }
    return [...map.values()].sort((a, b) => {
      const ai = TYPE_ORDER.indexOf(a.entryType);
      const bi = TYPE_ORDER.indexOf(b.entryType);
      if (ai !== bi) return ai - bi;
      return a.sortDate.localeCompare(b.sortDate) || a.title.localeCompare(b.title);
    });
  }, [classEntries]);

  const myAssessments = useMemo(
    () => assessments.filter((a) => a.teacherId === teacherId && a.grade === classGrade),
    [assessments, classGrade, teacherId],
  );

  const linkedAsm = myAssessments.find((a) => a.id === linkedAssessment);

  const handleLinkedAssessmentChange = (assessmentId: string) => {
    setLinkedAssessment(assessmentId);
    if (!useQuestionMarks) return;
    const asm = myAssessments.find((a) => a.id === assessmentId);
    const prompts = asm?.questions?.map((q) => q.question) ?? [];
    const count = asm?.questions?.length ? asm.questions.length : Math.max(1, questionCount);
    if (asm?.questions?.length) setQuestionCount(asm.questions.length);
    setQuestionMarks((prev) => buildQuestionMarks(count, prompts, prev));
    if (asm?.questions?.length) {
      const marks = buildQuestionMarks(asm.questions.length, prompts);
      setScore(String(marks.filter((q) => q.correct).length));
      setMaxScore(String(marks.length));
    }
  };

  const toggleQuestion = (n: number) => {
    setQuestionMarks((prev) => {
      const next = prev.map((q) =>
        q.questionNumber === n ? { ...q, correct: !q.correct } : q,
      );
      if (useQuestionMarks && next.length > 0) {
        setScore(String(next.filter((q) => q.correct).length));
        setMaxScore(String(next.length));
      }
      return next;
    });
  };

  const findCell = (studentId: string, col: ColumnDef) =>
    classEntries.find(
      (e) =>
        e.studentId === studentId &&
        e.entryType === col.entryType &&
        e.title === col.title,
    );

  const openAdd = (studentId?: string, col?: ColumnDef) => {
    setEditingId(undefined);
    setSelectedStudentId(studentId || roster[0]?.id || '');
    setEntryType(col?.entryType ?? 'Quiz');
    setTitle(col?.title ?? '');
    setScore('');
    setMaxScore(String(col?.maxScore ?? 10));
    setWeight(String(col?.weight ?? 10));
    setRemarks('');
    setLinkedAssessment('');
    setQuestionCount(col?.maxScore && col.maxScore <= 50 ? col.maxScore : 10);
    setQuestionMarks(buildQuestionMarks(col?.maxScore && col.maxScore <= 50 ? col.maxScore : 10));
    setUseQuestionMarks(true);
    setIsFormOpen(true);
  };

  const openEdit = (entry: StudentGradeEntry) => {
    setEditingId(entry.id);
    setSelectedStudentId(entry.studentId);
    setEntryType(entry.entryType);
    setTitle(entry.title);
    setScore(String(entry.score));
    setMaxScore(String(entry.maxScore));
    setWeight(String(entry.weight));
    setRemarks(entry.remarks ?? '');
    setLinkedAssessment(entry.assessmentId ?? '');
    const hasQ = (entry.questionResults?.length ?? 0) > 0;
    setUseQuestionMarks(hasQ || entry.entryType === 'Quiz' || entry.entryType === 'Test');
    setQuestionCount(entry.questionResults?.length || Math.round(entry.maxScore) || 10);
    setQuestionMarks(
      entry.questionResults?.length
        ? entry.questionResults
        : buildQuestionMarks(Math.round(entry.maxScore) || 10),
    );
    setDetailEntry(null);
    setIsFormOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !title.trim()) return;
    const student = students.find((s) => s.id === selectedStudentId);
    if (!student) return;

    const results = useQuestionMarks ? questionMarks : undefined;
    const computedScore = useQuestionMarks
      ? questionMarks.filter((q) => q.correct).length
      : parseFloat(score) || 0;
    const computedMax = useQuestionMarks
      ? questionMarks.length
      : parseFloat(maxScore) || 100;

    upsertStudentGradeEntry({
      id: editingId,
      studentId: selectedStudentId,
      subject: defaultSubject,
      gradeLevel: student.grade,
      section: student.section,
      entryType,
      title: title.trim(),
      assessmentId: linkedAssessment || undefined,
      score: computedScore,
      maxScore: computedMax,
      weight: parseFloat(weight) || 0,
      term: CURRENT_TERM,
      remarks: remarks || undefined,
      questionResults: results,
    });
    setIsFormOpen(false);
  };

  const detailStudent = detailEntry
    ? students.find((s) => s.id === detailEntry.studentId)
    : null;

  return (
    <div className="relative space-y-6">
      <div className="grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
        <Select
          variant="ais"
          label="Class grade"
          options={GRADE_OPTIONS.filter((g) => g.includes('9') || g.includes('10')).map((g) => ({
            value: g,
            label: g,
          }))}
          value={classGrade}
          onChange={(e) => setClassGrade(e.target.value)}
        />
        <Select
          variant="ais"
          label="Section"
          options={SECTION_OPTIONS.map((s) => ({ value: s, label: `Section ${s}` }))}
          value={classSection}
          onChange={(e) => setClassSection(e.target.value)}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <AisBtnPrimary type="button" className="!text-xs" onClick={() => openAdd()} disabled={roster.length === 0}>
          <Plus className="h-3.5 w-3.5" aria-hidden />
          Add quiz / test result
        </AisBtnPrimary>
        <p className={aisBodySm}>
          Click a score cell to see which questions were correct or incorrect.
        </p>
      </div>

      <AisPanel
        title="Class results"
        description="All students × assessments taken this term. Click a result for question-level detail."
        flush
      >
        <div className="overflow-x-auto">
          <AisTable>
            <thead>
              <tr className="bg-ais-surface-container-low">
                <AisTh className="sticky left-0 z-10 bg-ais-surface-container-low min-w-[160px]">
                  Student
                </AisTh>
                {columns.map((col) => (
                  <AisTh key={col.key} className="min-w-[100px] text-center whitespace-nowrap">
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-wide text-ais-on-surface-variant">
                        {col.entryType}
                      </span>
                      <span>{col.title}</span>
                      <span className="text-[10px] font-normal text-ais-on-surface-variant">
                        /{col.maxScore}
                      </span>
                    </div>
                  </AisTh>
                ))}
                <AisTh className="text-center">Term avg</AisTh>
                <AisTh className="w-16">{''}</AisTh>
              </tr>
            </thead>
            <tbody>
              {roster.length === 0 ? (
                <AisEmptyRow
                  colSpan={Math.max(3, columns.length + 3)}
                  message="No students in this section."
                />
              ) : (
                roster.map((std) => {
                  const entries = gradesForStudent(classEntries, std.id);
                  const termAvg = weightedTermAverage(entries);
                  return (
                    <AisTr key={std.id}>
                      <AisTd className="sticky left-0 z-10 bg-white dark:bg-ais-surface font-semibold">
                        <p>{std.name}</p>
                        <p className={`${aisBodySm} font-normal`}>{std.studentId}</p>
                      </AisTd>
                      {columns.map((col) => {
                        const cell = findCell(std.id, col);
                        if (!cell) {
                          return (
                            <AisTd key={col.key} className="text-center">
                              <button
                                type="button"
                                className="rounded-lg px-2 py-1 text-xs text-ais-on-surface-variant hover:bg-ais-row-hover hover:text-ais-primary"
                                onClick={() => openAdd(std.id, col)}
                                title="Add result"
                              >
                                —
                              </button>
                            </AisTd>
                          );
                        }
                        const pct = entryPercent(cell);
                        return (
                          <AisTd key={col.key} className="text-center">
                            <button
                              type="button"
                              onClick={() => setDetailEntry(cell)}
                              className={`inline-flex min-w-[3.25rem] flex-col items-center rounded-xl px-2 py-1.5 text-xs font-bold tabular-nums transition-colors hover:ring-2 hover:ring-ais-primary/30 ${
                                pct >= 70
                                  ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200'
                                  : pct >= 50
                                    ? 'bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200'
                                    : 'bg-rose-50 text-rose-800 dark:bg-rose-900/30 dark:text-rose-200'
                              }`}
                            >
                              <span>
                                {cell.score}/{cell.maxScore}
                              </span>
                              <span className="text-[10px] font-semibold opacity-80">{pct}%</span>
                            </button>
                          </AisTd>
                        );
                      })}
                      <AisTd className="text-center">
                        <AisStatusBadge variant={termAvg != null && termAvg >= 70 ? 'success' : 'warning'}>
                          {termAvg != null ? `${termAvg}%` : '—'}
                        </AisStatusBadge>
                      </AisTd>
                      <AisTd>
                        <AisBtnSecondary
                          className="!px-2 !py-1 text-[10px]"
                          onClick={() => openAdd(std.id)}
                        >
                          + Score
                        </AisBtnSecondary>
                      </AisTd>
                    </AisTr>
                  );
                })
              )}
            </tbody>
          </AisTable>
        </div>
        {roster.length > 0 && columns.length === 0 && (
          <p className={`${aisBodyMd} p-4`}>
            No assessments recorded yet. Use <strong>Add quiz / test result</strong> to enter scores.
          </p>
        )}
      </AisPanel>

      {/* Side detail panel */}
      {detailEntry && (
        <div className="fixed inset-0 z-40 flex justify-end">
          <button
            type="button"
            className="absolute inset-0 bg-black/30"
            aria-label="Close detail"
            onClick={() => setDetailEntry(null)}
          />
          <aside className="relative z-50 flex h-full w-full max-w-md flex-col border-l border-ais-card-border bg-white shadow-2xl dark:bg-ais-surface animate-fade-in">
            <div className="flex items-start justify-between gap-3 border-b border-ais-card-border p-4">
              <div>
                <p className={aisLabelCaps}>Result detail</p>
                <h3 className={aisHeadlineSm}>{detailStudent?.name ?? 'Student'}</h3>
                <p className={aisBodySm}>
                  {detailEntry.entryType} · {detailEntry.title}
                </p>
              </div>
              <button
                type="button"
                className="rounded-full p-2 hover:bg-ais-row-hover"
                onClick={() => setDetailEntry(null)}
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              <div className={`${aisCard} p-4`}>
                <div className="flex items-center justify-between">
                  <span className={aisBodySm}>Score</span>
                  <span className={`${aisDataMd} font-mono tabular-nums`}>
                    {detailEntry.score}/{detailEntry.maxScore} ({entryPercent(detailEntry)}%)
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className={aisBodySm}>Weight</span>
                  <span className="text-sm tabular-nums">{detailEntry.weight}%</span>
                </div>
                {detailEntry.remarks && (
                  <p className={`${aisBodySm} mt-3 border-t border-ais-card-border pt-3`}>
                    {detailEntry.remarks}
                  </p>
                )}
              </div>

              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-ais-on-surface-variant">
                  Question results
                </p>
                {(detailEntry.questionResults?.length ?? 0) === 0 ? (
                  <p className={aisBodySm}>
                    No question-level marks yet. Edit this result to mark each question correct or
                    incorrect.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {detailEntry.questionResults!.map((q) => (
                      <li
                        key={q.questionNumber}
                        className={`flex items-start gap-3 rounded-xl border px-3 py-2.5 ${
                          q.correct
                            ? 'border-emerald-200 bg-emerald-50/80 dark:border-emerald-800 dark:bg-emerald-900/20'
                            : 'border-rose-200 bg-rose-50/80 dark:border-rose-800 dark:bg-rose-900/20'
                        }`}
                      >
                        <span
                          className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                            q.correct
                              ? 'bg-emerald-600 text-white'
                              : 'bg-rose-600 text-white'
                          }`}
                        >
                          {q.correct ? (
                            <Check className="h-3.5 w-3.5" aria-hidden />
                          ) : (
                            <X className="h-3.5 w-3.5" aria-hidden />
                          )}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold">
                            Question {q.questionNumber}{' '}
                            <span className="font-normal text-ais-on-surface-variant">
                              — {q.correct ? 'Correct' : 'Incorrect'}
                            </span>
                          </p>
                          {q.prompt && (
                            <p className={`${aisBodySm} mt-0.5 line-clamp-2`}>{q.prompt}</p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="flex gap-2 border-t border-ais-card-border p-4">
              <AisBtnSecondary className="flex-1 !justify-center" onClick={() => openEdit(detailEntry)}>
                Edit result
              </AisBtnSecondary>
              <button
                type="button"
                className="rounded-2xl border border-ais-error/30 px-4 py-2 text-xs font-bold text-ais-error hover:bg-ais-error/10"
                onClick={() => {
                  deleteStudentGradeEntry(detailEntry.id);
                  setDetailEntry(null);
                }}
              >
                Delete
              </button>
            </div>
          </aside>
        </div>
      )}

      <Dialog
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingId ? 'Edit quiz / test result' : 'Add quiz / test result'}
        size="2xl"
        largeTitle
      >
        <form onSubmit={handleSave} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Select
              variant="ais"
              label="Student"
              options={roster.map((s) => ({ value: s.id, label: s.name }))}
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
            />
            <Select
              variant="ais"
              label="Assessment type"
              options={GRADE_ENTRY_TYPES.map((t) => ({ value: t, label: t }))}
              value={entryType}
              onChange={(e) => setEntryType(e.target.value as StudentGradeEntryType)}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className={aisFormLabel}>Title (column name)</label>
              <input
                className={aisInput}
                required
                placeholder="e.g. Quiz 1, Mid Exam, Unit Test 2"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <Select
              variant="ais"
              label="Link to assessment (optional)"
              options={[
                { value: '', label: 'None' },
                ...myAssessments.map((a) => ({
                  value: a.id,
                  label: `${a.type}: ${a.title}${a.questions?.length ? ` (${a.questions.length} Q)` : ''}`,
                })),
              ]}
              value={linkedAssessment}
              onChange={(e) => handleLinkedAssessmentChange(e.target.value)}
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={useQuestionMarks}
              onChange={(e) => {
                const on = e.target.checked;
                setUseQuestionMarks(on);
                if (on && questionMarks.length > 0) {
                  setScore(String(questionMarks.filter((q) => q.correct).length));
                  setMaxScore(String(questionMarks.length));
                }
              }}
              className="rounded border-ais-card-border"
            />
            Mark each question correct / incorrect
          </label>

          {useQuestionMarks ? (
            <div className="space-y-3 rounded-xl border border-ais-card-border bg-ais-surface-container-low/40 p-4">
              {!linkedAsm?.questions?.length && (
                <div className="space-y-1 max-w-[140px]">
                  <label className={aisFormLabel}>Number of questions</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    className={aisInput}
                    value={questionCount}
                    onChange={(e) => {
                      const n = Math.max(1, Number(e.target.value) || 1);
                      setQuestionCount(n);
                      const prompts = linkedAsm?.questions?.map((q) => q.question) ?? [];
                      const marks = buildQuestionMarks(n, prompts, questionMarks);
                      setQuestionMarks(marks);
                      setScore(String(marks.filter((q) => q.correct).length));
                      setMaxScore(String(marks.length));
                    }}
                  />
                </div>
              )}
              <p className={aisBodySm}>
                Score auto-fills from correct marks ({questionMarks.filter((q) => q.correct).length}/
                {questionMarks.length}). Tap a question to toggle.
              </p>
              <div className="grid max-h-[240px] grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3 md:grid-cols-4">
                {questionMarks.map((q) => (
                  <button
                    key={q.questionNumber}
                    type="button"
                    onClick={() => toggleQuestion(q.questionNumber)}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs font-semibold transition-colors ${
                      q.correct
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-100'
                        : 'border-rose-300 bg-rose-50 text-rose-900 dark:border-rose-700 dark:bg-rose-900/30 dark:text-rose-100'
                    }`}
                  >
                    {q.correct ? (
                      <Check className="h-3.5 w-3.5 shrink-0" />
                    ) : (
                      <X className="h-3.5 w-3.5 shrink-0" />
                    )}
                    Q{q.questionNumber}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3 max-w-xs">
                <div className="space-y-1">
                  <label className={aisFormLabel}>Weight %</label>
                  <input
                    type="number"
                    className={aisInput}
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className={aisFormLabel}>Score</label>
                <input
                  type="number"
                  className={aisInput}
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className={aisFormLabel}>Max</label>
                <input
                  type="number"
                  className={aisInput}
                  value={maxScore}
                  onChange={(e) => setMaxScore(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className={aisFormLabel}>Weight %</label>
                <input
                  type="number"
                  className={aisInput}
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                />
              </div>
            </div>
          )}

          <input
            className={aisInput}
            placeholder="Remarks (optional)"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
          />

          <DialogFooter className="flex-wrap gap-3 pt-4 -mb-1">
            <AisBtnSecondary type="button" onClick={() => setIsFormOpen(false)}>
              Cancel
            </AisBtnSecondary>
            <AisBtnPrimary type="submit">Save result</AisBtnPrimary>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
};
