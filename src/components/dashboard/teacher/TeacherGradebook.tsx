'use client';

import React, { useMemo, useState } from 'react';
import { Check, Plus, X } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Select } from '@/components/ui/select';
import { Dialog, DialogFooter } from '@/components/ui/dialog';
import {
  CURRENT_TERM,
  GRADE_ENTRY_TYPES,
  GRADE_OPTIONS,
  SECTION_FILTER_OPTIONS,
  assessmentMatchesGrade,
  entryPercent,
  filterGradebookAssessments,
  filterTeacherGradeEntries,
  filterTeacherStudents,
  gradesForStudent,
  normalizeGradeLabel,
  primarySubjectForTeacher,
  resolveTeacherProfile,
  weightedTermAverage,
} from '@/lib/teacherPortal';
import {
  countQuestionsInAssessmentMarkdown,
  extractAssessmentQuestionPrompts,
  isGeneratedAssessmentBlob,
} from '@/lib/assessmentMarkdown';
import type {
  Assessment,
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
import { GradeGapAnalysisPanel } from '@/components/dashboard/teacher/GradeGapAnalysisPanel';
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

/** Assessment types that must be linked when recording results. */
const LINKED_ENTRY_TYPES: StudentGradeEntryType[] = [
  'Quiz',
  'Test',
  'Mid Exam',
  'Final Exam',
  'Assignment',
  'Practical',
];

function columnKey(entryType: string, title: string) {
  return `${entryType}::${title}`;
}

function assessmentToEntryType(type: Assessment['type']): StudentGradeEntryType {
  if (type === 'Baseline') return 'Quiz';
  return type;
}

function countAssessmentQuestions(asm: Assessment): number {
  if (!asm.questions?.length) return 10;
  if (isGeneratedAssessmentBlob(asm.questions)) {
    return countQuestionsInAssessmentMarkdown(asm.questions[0].question);
  }
  return asm.questions.length;
}

function assessmentQuestionPrompts(asm: Assessment, count: number): string[] {
  if (!asm.questions?.length) return [];
  if (isGeneratedAssessmentBlob(asm.questions)) {
    return extractAssessmentQuestionPrompts(asm.questions[0].question, count);
  }
  return asm.questions.slice(0, count).map((q, i) => `Q${i + 1}: ${q.question.slice(0, 120)}`);
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
    addNotification,
    refreshFromApi,
  } = useApp();
  const teacherId = resolveTeacherId();
  const teacherProfile = resolveTeacherProfile(teachers, teacherId);
  const defaultSubject = primarySubjectForTeacher(teacherProfile);
  const classGradeOptions = useMemo(() => {
    const fromTeacher = teacherProfile.grades?.length
      ? teacherProfile.grades
      : GRADE_OPTIONS;
    return fromTeacher.length ? fromTeacher : GRADE_OPTIONS;
  }, [teacherProfile.grades]);

  const [classGrade, setClassGrade] = useState(() => classGradeOptions[0] ?? 'Grade 9');
  const [classSection, setClassSection] = useState('All');
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
      filterTeacherGradeEntries(studentGradeEntries, teacherId).filter((e) => {
        if (normalizeGradeLabel(e.gradeLevel) !== normalizeGradeLabel(classGrade)) {
          return false;
        }
        if (classSection !== 'All' && e.section !== classSection) return false;
        return true;
      }),
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

  const myAssessments = useMemo(() => {
    const filtered = filterGradebookAssessments(assessments, {
      teacherId,
      subjects: teacherProfile.subjects,
      classGrade,
    });
    // Safety net: never drop this teacher's own ready quizzes/exams even if subject metadata is odd.
    const byId = new Map(filtered.map((a) => [a.id, a]));
    for (const a of assessments) {
      if (String(a.teacherId) !== String(teacherId)) continue;
      if (a.status === 'Rejected') continue;
      if (
        a.status === 'Approved' ||
        a.type === 'Quiz' ||
        a.type === 'Baseline' ||
        a.createdByRole === 'department-head'
      ) {
        byId.set(a.id, a);
      }
    }
    return [...byId.values()].sort((a, b) => {
      const aMatch = assessmentMatchesGrade(a.grade, classGrade) ? 0 : 1;
      const bMatch = assessmentMatchesGrade(b.grade, classGrade) ? 0 : 1;
      if (aMatch !== bMatch) return aMatch - bMatch;
      return String(b.createdAt).localeCompare(String(a.createdAt));
    });
  }, [assessments, classGrade, teacherId, teacherProfile.subjects]);

  const requiresLinkedAssessment = LINKED_ENTRY_TYPES.includes(entryType);

  /** Approved assessments available to link when recording results. */
  const selectableAssessments = myAssessments;

  const linkedAsm = myAssessments.find((a) => a.id === linkedAssessment);

  const applyAssessmentLink = (assessmentId: string) => {
    setLinkedAssessment(assessmentId);
    const asm = myAssessments.find((a) => a.id === assessmentId);
    if (!asm) return;

    if (!assessmentMatchesGrade(asm.grade, classGrade)) {
      setClassGrade(asm.grade);
    }
    setEntryType(assessmentToEntryType(asm.type));
    setTitle(asm.title);
    const count = countAssessmentQuestions(asm);
    const prompts = assessmentQuestionPrompts(asm, count);
    setQuestionCount(count);
    const marks = buildQuestionMarks(count, prompts);
    setQuestionMarks(marks);
    setUseQuestionMarks(true);
    setScore(String(marks.filter((q) => q.correct).length));
    setMaxScore(String(marks.length));
  };

  const handleLinkedAssessmentChange = (assessmentId: string) => {
    if (!assessmentId) {
      setLinkedAssessment('');
      return;
    }
    applyAssessmentLink(assessmentId);
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
    void refreshFromApi();
    setEditingId(undefined);
    setSelectedStudentId(studentId || roster[0]?.id || '');
    const nextType = col?.entryType ?? 'Quiz';
    setEntryType(nextType);
    setTitle(col?.title ?? '');
    setScore('');
    setMaxScore(String(col?.maxScore ?? 10));
    setWeight(String(col?.weight ?? 10));
    setRemarks('');
    setLinkedAssessment('');
    setQuestionCount(col?.maxScore && col.maxScore <= 50 ? col.maxScore : 10);
    setQuestionMarks(buildQuestionMarks(col?.maxScore && col.maxScore <= 50 ? col.maxScore : 10));
    setUseQuestionMarks(LINKED_ENTRY_TYPES.includes(nextType));
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
    setUseQuestionMarks(hasQ || LINKED_ENTRY_TYPES.includes(entry.entryType));
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
    if (requiresLinkedAssessment && !linkedAssessment) {
      alert('Please select the assessment this result belongs to.');
      return;
    }
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
      subject: linkedAsm?.subject || defaultSubject,
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
          options={classGradeOptions.map((g) => ({
            value: g,
            label: g,
          }))}
          value={classGrade}
          onChange={(e) => setClassGrade(e.target.value)}
        />
        <Select
          variant="ais"
          label="Section"
          options={SECTION_FILTER_OPTIONS.map((s) => ({
            value: s,
            label: s === 'All' ? 'All sections' : `Section ${s}`,
          }))}
          value={classSection}
          onChange={(e) => setClassSection(e.target.value)}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <AisBtnPrimary type="button" className="!text-xs" onClick={() => openAdd()} disabled={roster.length === 0}>
          <Plus className="h-3.5 w-3.5" aria-hidden />
          Add result
        </AisBtnPrimary>
      </div>

      <GradeGapAnalysisPanel
        classEntries={classEntries}
        assessments={assessments}
        teacherId={teacherId}
        classGrade={classGrade}
        classSection={classSection}
        defaultSubject={defaultSubject}
      />

      <AisPanel title="Class results" flush>
        <div className="overflow-x-auto">
          <AisTable>
            <thead>
              <tr className="bg-muted">
                <AisTh className="sticky left-0 z-10 bg-muted min-w-[160px]">
                  Student
                </AisTh>
                {columns.map((col) => (
                  <AisTh key={col.key} className="min-w-[100px] text-center whitespace-nowrap">
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                        {col.entryType}
                      </span>
                      <span>{col.title}</span>
                      <span className="text-[10px] font-normal text-muted-foreground">
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
                  message="No students for this grade."
                />
              ) : (
                roster.map((std) => {
                  const entries = gradesForStudent(classEntries, std.id);
                  const termAvg = weightedTermAverage(entries);
                  return (
                    <AisTr key={std.id}>
                      <AisTd className="sticky left-0 z-10 bg-white dark:bg-card font-semibold">
                        <p>
                          {std.name}
                          {classSection === 'All' ? (
                            <span className={`${aisBodySm} font-normal`}> · {std.section}</span>
                          ) : null}
                        </p>
                        <p className={`${aisBodySm} font-normal`}>{std.studentId}</p>
                      </AisTd>
                      {columns.map((col) => {
                        const cell = findCell(std.id, col);
                        if (!cell) {
                          return (
                            <AisTd key={col.key} className="text-center">
                              <button
                                type="button"
                                className="rounded-lg px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-primary"
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
                              className={`inline-flex min-w-[3.25rem] flex-col items-center rounded-xl px-2 py-1.5 text-xs font-bold tabular-nums transition-colors hover:ring-2 hover:ring-primary/30 ${
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
          <p className={`${aisBodyMd} p-4`}>No results recorded yet.</p>
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
          <aside className="relative z-50 flex h-full w-full max-w-md flex-col border-l border-border bg-white shadow-2xl dark:bg-card animate-fade-in">
            <div className="flex items-start justify-between gap-3 border-b border-border p-4">
              <div>
                <p className={aisLabelCaps}>Result detail</p>
                <h3 className={aisHeadlineSm}>{detailStudent?.name ?? 'Student'}</h3>
                <p className={aisBodySm}>
                  {detailEntry.entryType} · {detailEntry.title}
                </p>
              </div>
              <button
                type="button"
                className="rounded-full p-2 hover:bg-muted"
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
                  <p className={`${aisBodySm} mt-3 border-t border-border pt-3`}>
                    {detailEntry.remarks}
                  </p>
                )}
              </div>

              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Question results
                </p>
                {(detailEntry.questionResults?.length ?? 0) === 0 ? (
                  <p className={aisBodySm}>No question marks recorded.</p>
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
                            <span className="font-normal text-muted-foreground">
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

            <div className="flex gap-2 border-t border-border p-4">
              <AisBtnSecondary className="flex-1 !justify-center" onClick={() => openEdit(detailEntry)}>
                Edit result
              </AisBtnSecondary>
              <button
                type="button"
                className="rounded-2xl border border-destructive/30 px-4 py-2 text-xs font-bold text-destructive hover:bg-destructive/10"
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
              options={roster.map((s) => ({
                value: s.id,
                label: classSection === 'All' ? `${s.name} · ${s.section}` : s.name,
              }))}
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
            />
            {requiresLinkedAssessment ? (
              <Select
                variant="ais"
                label="Assessment"
                maxVisibleItems={16}
                options={
                  selectableAssessments.length === 0
                    ? [{ value: '', label: 'No assessments available' }]
                    : [
                        { value: '', label: 'Select assessment…' },
                        ...selectableAssessments.map((a) => ({
                          value: a.id,
                          label: `${a.grade} · ${a.type}: ${a.title}`,
                        })),
                      ]
                }
                value={linkedAssessment}
                onChange={(e) => handleLinkedAssessmentChange(e.target.value)}
              />
            ) : (
              <Select
                variant="ais"
                label="Assessment type"
                options={GRADE_ENTRY_TYPES.map((t) => ({ value: t, label: t }))}
                value={entryType}
                onChange={(e) => {
                  const next = e.target.value as StudentGradeEntryType;
                  setEntryType(next);
                  setLinkedAssessment('');
                  setUseQuestionMarks(LINKED_ENTRY_TYPES.includes(next));
                }}
              />
            )}
          </div>

          {requiresLinkedAssessment ? (
            <Select
              variant="ais"
              label="Result type"
              options={GRADE_ENTRY_TYPES.map((t) => ({ value: t, label: t }))}
              value={entryType}
              onChange={(e) => {
                const next = e.target.value as StudentGradeEntryType;
                setEntryType(next);
                if (!LINKED_ENTRY_TYPES.includes(next)) {
                  setLinkedAssessment('');
                }
                setUseQuestionMarks(LINKED_ENTRY_TYPES.includes(next));
              }}
            />
          ) : (
            <Select
              variant="ais"
              label="Link to assessment (optional)"
              options={[
                { value: '', label: 'None' },
                ...myAssessments.map((a) => ({
                  value: a.id,
                  label: `${a.type}: ${a.title}`,
                })),
              ]}
              value={linkedAssessment}
              onChange={(e) => handleLinkedAssessmentChange(e.target.value)}
            />
          )}

          <div className="space-y-1">
            <label className={aisFormLabel}>Title</label>
            <input
              className={aisInput}
              required
              placeholder="e.g. Quiz 1"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              readOnly={requiresLinkedAssessment && !!linkedAssessment}
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
              className="rounded border-border"
            />
            Mark each question correct / incorrect
          </label>

          {useQuestionMarks ? (
            <div className="space-y-3 rounded-xl border border-border bg-muted/40 p-4">
              {!linkedAsm && (
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
                      const prompts = linkedAsm
                        ? assessmentQuestionPrompts(linkedAsm, n)
                        : [];
                      const marks = buildQuestionMarks(n, prompts, questionMarks);
                      setQuestionMarks(marks);
                      setScore(String(marks.filter((q) => q.correct).length));
                      setMaxScore(String(marks.length));
                    }}
                  />
                </div>
              )}
              <div className="grid max-h-[240px] grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3 md:grid-cols-4">
                {questionMarks.map((q) => (
                  <button
                    key={q.questionNumber}
                    type="button"
                    title={q.prompt}
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
            <AisBtnPrimary
              type="submit"
              disabled={requiresLinkedAssessment && !linkedAssessment}
            >
              Save result
            </AisBtnPrimary>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
};
