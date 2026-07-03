'use client';

import React, { useMemo, useState } from 'react';
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
  weightedTermAverage,
} from '@/lib/teacherPortal';
import type { StudentGradeEntry, StudentGradeEntryType } from '@/lib/mockData';
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
import { aisBodyMd, aisBodySm, aisCard, aisDataMd, aisHeadlineSm } from '@/components/dashboard/teacher/aisStyles';

export const TeacherGradebook: React.FC = () => {
  const { students, studentGradeEntries, assessments, upsertStudentGradeEntry, deleteStudentGradeEntry, resolveTeacherId } = useApp();
  const teacherId = resolveTeacherId();

  const [classGrade, setClassGrade] = useState('Grade 9');
  const [classSection, setClassSection] = useState('A');
  const [filterType, setFilterType] = useState<string>('All');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | undefined>();

  const [entryType, setEntryType] = useState<StudentGradeEntryType>('Quiz');
  const [title, setTitle] = useState('');
  const [score, setScore] = useState('');
  const [maxScore, setMaxScore] = useState('100');
  const [weight, setWeight] = useState('10');
  const [remarks, setRemarks] = useState('');
  const [linkedAssessment, setLinkedAssessment] = useState('');

  const roster = useMemo(() => filterTeacherStudents(students, classGrade, classSection), [students, classGrade, classSection]);

  const myEntries = useMemo(() => {
    let list = filterTeacherGradeEntries(studentGradeEntries, teacherId).filter(
      (e) => e.gradeLevel === classGrade && e.section === classSection
    );
    if (filterType !== 'All') list = list.filter((e) => e.entryType === filterType);
    return list;
  }, [studentGradeEntries, classGrade, classSection, filterType, teacherId]);

  const myAssessments = useMemo(
    () => assessments.filter((a) => a.teacherId === teacherId && a.grade === classGrade),
    [assessments, classGrade, teacherId]
  );

  const openAdd = (studentId: string, presetType?: StudentGradeEntryType) => {
    setSelectedStudentId(studentId);
    setEditingId(undefined);
    setEntryType(presetType ?? 'Quiz');
    setTitle('');
    setScore('');
    setMaxScore('100');
    setWeight(presetType === 'Final Exam' ? '30' : presetType === 'Mid Exam' ? '25' : '10');
    setRemarks('');
    setLinkedAssessment('');
    setIsFormOpen(true);
  };

  const openEdit = (entry: StudentGradeEntry) => {
    setSelectedStudentId(entry.studentId);
    setEditingId(entry.id);
    setEntryType(entry.entryType);
    setTitle(entry.title);
    setScore(String(entry.score));
    setMaxScore(String(entry.maxScore));
    setWeight(String(entry.weight));
    setRemarks(entry.remarks ?? '');
    setLinkedAssessment(entry.assessmentId ?? '');
    setIsFormOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !title) return;
    const student = students.find((s) => s.id === selectedStudentId);
    if (!student) return;

    upsertStudentGradeEntry({
      id: editingId,
      studentId: selectedStudentId,
      subject: 'Biology',
      gradeLevel: student.grade,
      section: student.section,
      entryType,
      title,
      assessmentId: linkedAssessment || undefined,
      score: parseFloat(score) || 0,
      maxScore: parseFloat(maxScore) || 100,
      weight: parseFloat(weight) || 0,
      term: CURRENT_TERM,
      remarks: remarks || undefined,
    });
    setIsFormOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-3">
        <Select variant="ais" label="Class grade" options={GRADE_OPTIONS.filter((g) => g.includes('9') || g.includes('10')).map((g) => ({ value: g, label: g }))} value={classGrade} onChange={(e) => setClassGrade(e.target.value)} />
        <Select variant="ais" label="Section" options={SECTION_OPTIONS.map((s) => ({ value: s, label: `Section ${s}` }))} value={classSection} onChange={(e) => setClassSection(e.target.value)} />
        <Select variant="ais" label="Filter by type" options={['All', ...GRADE_ENTRY_TYPES].map((t) => ({ value: t, label: t }))} value={filterType} onChange={(e) => setFilterType(e.target.value)} />
      </div>

      <div className="flex flex-wrap gap-2">
        {GRADE_ENTRY_TYPES.map((t) => (
          <AisBtnSecondary key={t} type="button" className="!px-2.5 !py-1 text-[10px]" onClick={() => roster[0] && openAdd(roster[0].id, t)} disabled={roster.length === 0}>
            + {t}
          </AisBtnSecondary>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {roster.map((std) => {
          const entries = gradesForStudent(filterTeacherGradeEntries(studentGradeEntries), std.id);
          const termAvg = weightedTermAverage(entries);
          return (
            <div key={std.id} className={`${aisCard} p-4`}>
              <div className="mb-3 border-b border-ais-card-border pb-2">
                <p className={aisDataMd}>{std.name}</p>
                <p className={aisBodySm}>{std.studentId} · GPA {std.gpa.toFixed(2)}</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className={aisBodySm}>Term average</span>
                  <AisStatusBadge variant={termAvg != null && termAvg >= 70 ? 'success' : 'warning'}>
                    {termAvg != null ? `${termAvg}%` : '—'}
                  </AisStatusBadge>
                </div>
                {entries.length === 0 ? (
                  <p className={aisBodySm}>No scores recorded yet.</p>
                ) : (
                  entries.slice(0, 4).map((e) => (
                    <div key={e.id} className="flex justify-between border-b border-ais-row-border pb-1 text-xs">
                      <span>
                        <span className="font-semibold text-ais-on-surface">{e.entryType}</span> · {e.title}
                      </span>
                      <span className="font-mono tabular-nums">
                        {e.score}/{e.maxScore} ({entryPercent(e)}%)
                      </span>
                    </div>
                  ))
                )}
                {entries.length > 4 && <p className={aisBodySm}>+{entries.length - 4} more entries</p>}
                <AisBtnSecondary className="mt-2 w-full !justify-center text-xs" onClick={() => openAdd(std.id)}>
                  Add / edit grades
                </AisBtnSecondary>
              </div>
            </div>
          );
        })}
      </div>

      <AisPanel title="All grade entries" description="Quiz, test, project, midterm, final, and practical results" flush>
        <AisTable>
          <thead>
            <tr className="bg-ais-surface-container-low">
              <AisTh>Student</AisTh>
              <AisTh>Type</AisTh>
              <AisTh>Title</AisTh>
              <AisTh>Score</AisTh>
              <AisTh>%</AisTh>
              <AisTh>Weight</AisTh>
              <AisTh>Term</AisTh>
              <AisTh>Actions</AisTh>
            </tr>
          </thead>
          <tbody>
            {myEntries.length === 0 ? (
              <AisEmptyRow colSpan={8} message="No grade entries for this class. Use the quick-add buttons above." />
            ) : (
              myEntries.map((e) => {
                const std = students.find((s) => s.id === e.studentId);
                return (
                  <AisTr key={e.id}>
                    <AisTd className="font-semibold">{std?.name ?? e.studentId}</AisTd>
                    <AisTd>
                      <AisStatusBadge variant="neutral">{e.entryType}</AisStatusBadge>
                    </AisTd>
                    <AisTd className="text-xs">{e.title}</AisTd>
                    <AisTd className="font-mono tabular-nums">{e.score}/{e.maxScore}</AisTd>
                    <AisTd className="font-bold tabular-nums">{entryPercent(e)}%</AisTd>
                    <AisTd className="tabular-nums">{e.weight}%</AisTd>
                    <AisTd className={aisBodySm}>{e.term}</AisTd>
                    <AisTd>
                      <div className="flex gap-1">
                        <AisBtnSecondary className="!px-2 !py-1 text-[10px]" onClick={() => openEdit(e)}>Edit</AisBtnSecondary>
                        <button type="button" className="rounded-lg border border-ais-error/30 px-2 py-1 text-[10px] font-bold text-ais-error hover:bg-ais-error/10" onClick={() => deleteStudentGradeEntry(e.id)}>
                          Del
                        </button>
                      </div>
                    </AisTd>
                  </AisTr>
                );
              })
            )}
          </tbody>
        </AisTable>
      </AisPanel>

      <Dialog isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={editingId ? 'Edit grade entry' : 'Record grade'} size="lg">
        <form onSubmit={handleSave} className="space-y-4 pt-2">
          <p className={aisBodySm}>Student: {students.find((s) => s.id === selectedStudentId)?.name}</p>
          <div className="grid grid-cols-2 gap-3">
            <Select variant="ais" label="Assessment type" options={GRADE_ENTRY_TYPES.map((t) => ({ value: t, label: t }))} value={entryType} onChange={(e) => setEntryType(e.target.value as StudentGradeEntryType)} />
            <Select variant="ais" label="Link to assessment (optional)" options={[{ value: '', label: 'None' }, ...myAssessments.map((a) => ({ value: a.id, label: `${a.type}: ${a.title}` }))]} value={linkedAssessment} onChange={(e) => setLinkedAssessment(e.target.value)} />
          </div>
          <input className={aisInput} required placeholder="Title (e.g. Unit 3 Quiz)" value={title} onChange={(e) => setTitle(e.target.value)} />
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className={aisFormLabel}>Score</label>
              <input type="number" className={aisInput} value={score} onChange={(e) => setScore(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className={aisFormLabel}>Max</label>
              <input type="number" className={aisInput} value={maxScore} onChange={(e) => setMaxScore(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className={aisFormLabel}>Weight %</label>
              <input type="number" className={aisInput} value={weight} onChange={(e) => setWeight(e.target.value)} />
            </div>
          </div>
          <input className={aisInput} placeholder="Remarks (optional)" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
          <p className={aisBodySm}>Saving recalculates cumulative GPA from weighted term scores and syncs to student & parent portals.</p>
          <DialogFooter className="flex-wrap gap-3 border-t border-ais-card-border dark:border-gray-700 pt-4 -mb-1">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="inline-flex items-center justify-center gap-2 px-5 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#1d4ed8] px-6 py-2 text-sm font-semibold text-white transition-all hover:bg-[#1e40af] shadow-md hover:shadow-lg"
            >
              Save grade
            </button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
};
