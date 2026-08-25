'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Select } from '@/components/ui/select';
import { Dialog, DialogFooter } from '@/components/ui/dialog';
import { TeacherGradebook } from '@/components/dashboard/teacher/TeacherGradebook';
import {
  GRADE_OPTIONS,
  SECTION_FILTER_OPTIONS,
  filterTeacherStudents,
  gradesForStudent,
  filterTeacherGradeEntries,
  weightedTermAverage,
} from '@/lib/teacherPortal';
import { formatMark } from '@/lib/grading';
import {
  AisBtnPrimary,
  AisBtnSecondary,
  AisEmptyRow,
  AisPage,
  AisPanel,
  AisStatusBadge,
  AisSubTabs,
  AisTable,
  AisTd,
  AisTh,
  AisTr,
  aisTextarea,
} from '@/components/dashboard/teacher/TeacherPortalUi';
import { aisBodyMd, aisBodySm } from '@/components/dashboard/teacher/aisStyles';

type SubTab = 'roster' | 'gradebook' | 'parents';

export const TeacherStudentsTab: React.FC = () => {
  const { students, sendParentMessage, parentMessages, studentGradeEntries, resolveTeacherId } = useApp();
  const teacherId = resolveTeacherId();

  const [subTab, setSubTab] = useState<SubTab>('roster');

  useEffect(() => {
    const goGradebook = () => setSubTab('gradebook');
    window.addEventListener('open-teacher-grade-entry', goGradebook);
    return () => window.removeEventListener('open-teacher-grade-entry', goGradebook);
  }, []);

  const [grade, setGrade] = useState('Grade 9');
  const [section, setSection] = useState('All');
  const [nameQuery, setNameQuery] = useState('');
  const [messageStudentId, setMessageStudentId] = useState<string | null>(null);
  const [parentMsg, setParentMsg] = useState('');

  const roster = useMemo(() => {
    const base = filterTeacherStudents(students, grade, section);
    const query = nameQuery.trim().toLowerCase();
    if (!query) return base;
    return base.filter((std) => std.name.toLowerCase().includes(query));
  }, [students, grade, section, nameQuery]);
  const myMessages = parentMessages.filter((m) => m.teacherId === teacherId);
  const allGradeEntries = filterTeacherGradeEntries(studentGradeEntries, teacherId);
  const selectedStudent = roster.find((s) => s.id === messageStudentId);

  const handleSendParent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !parentMsg.trim()) return;
    sendParentMessage({
      studentId: selectedStudent.id,
      studentName: selectedStudent.name,
      parentName: selectedStudent.parentName,
      message: parentMsg,
    });
    setParentMsg('');
    setMessageStudentId(null);
  };

  return (
    <AisPage>
      <AisSubTabs
        active={subTab}
        onChange={setSubTab}
        tabs={[
          { id: 'roster', label: 'Class roster' },
          { id: 'gradebook', label: 'Gradebook' },
          { id: 'parents', label: 'Parent messages' },
        ]}
      />

      {subTab === 'gradebook' ? (
        <TeacherGradebook />
      ) : (
        <>
          {subTab === 'roster' && (
            <div className="flex flex-col gap-4 max-w-4xl sm:flex-row sm:items-end sm:justify-between">
              <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-3">
                <Select
                  variant="ais"
                  label="Class grade"
                  options={GRADE_OPTIONS.map((g) => ({ value: g, label: g }))}
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                />
                <Select
                  variant="ais"
                  label="Section"
                  options={SECTION_FILTER_OPTIONS.map((s) => ({
                    value: s,
                    label: s === 'All' ? 'All sections' : `Section ${s}`,
                  }))}
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                />
                <div className="flex flex-col gap-1.5">
                  <label className={aisBodySm}>Search by name</label>
                  <input
                    type="search"
                    className="h-10 rounded-lg border border-ais-outline-variant bg-white px-3 text-sm outline-none focus:border-ais-primary"
                    placeholder="Student name..."
                    value={nameQuery}
                    onChange={(e) => setNameQuery(e.target.value)}
                  />
                </div>
              </div>
              <AisBtnPrimary type="button" className="!text-xs h-10 shrink-0" onClick={() => setSubTab('gradebook')}>
                <Plus className="h-3.5 w-3.5" aria-hidden />
                Add Result
              </AisBtnPrimary>
            </div>
          )}

          {subTab === 'roster' && (
            <AisPanel title="My students" flush>
              <AisTable>
                <thead>
                  <tr className="bg-ais-surface-container-low">
                    <AisTh>Student</AisTh>
                    <AisTh>Section</AisTh>
                    <AisTh>ID</AisTh>
                    <AisTh>Term avg</AisTh>
                    <AisTh>Cumulative mark</AisTh>
                    <AisTh>Attendance</AisTh>
                    <AisTh>Results</AisTh>
                    <AisTh>Actions</AisTh>
                  </tr>
                </thead>
                <tbody>
                  {roster.length === 0 ? (
                    <AisEmptyRow colSpan={8} message="No students for this grade." />
                  ) : (
                    roster.map((std) => {
                      const entries = gradesForStudent(allGradeEntries, std.id);
                      const termAvg = weightedTermAverage(entries);
                      return (
                        <AisTr key={std.id}>
                          <AisTd>
                            <p className="font-semibold">{std.name}</p>
                            <p className={aisBodySm}>{std.parentName}</p>
                          </AisTd>
                          <AisTd>{std.section}</AisTd>
                          <AisTd className={`font-mono ${aisBodySm}`}>{std.studentId}</AisTd>
                          <AisTd>
                            <AisStatusBadge variant={termAvg != null && termAvg >= 70 ? 'success' : 'warning'}>
                              {termAvg != null ? `${termAvg}%` : '—'}
                            </AisStatusBadge>
                          </AisTd>
                          <AisTd className="font-mono font-bold tabular-nums">{formatMark(std.gpa)}</AisTd>
                          <AisTd className="tabular-nums">{std.attendanceRate}%</AisTd>
                          <AisTd className="text-xs">{entries.length}</AisTd>
                          <AisTd>
                            <AisBtnSecondary className="!px-2.5 !py-1" onClick={() => setMessageStudentId(std.id)}>
                              Message parent
                            </AisBtnSecondary>
                          </AisTd>
                        </AisTr>
                      );
                    })
                  )}
                </tbody>
              </AisTable>
            </AisPanel>
          )}

          {subTab === 'parents' && (
            <AisPanel title="Parent messages" flush>
              <AisTable>
                <thead>
                  <tr className="bg-ais-surface-container-low">
                    <AisTh>Student</AisTh>
                    <AisTh>Parent</AisTh>
                    <AisTh>Message</AisTh>
                    <AisTh>Sent</AisTh>
                  </tr>
                </thead>
                <tbody>
                  {myMessages.length === 0 ? (
                    <AisEmptyRow colSpan={4} message="No messages sent yet." />
                  ) : (
                    myMessages.map((m) => (
                      <AisTr key={m.id}>
                        <AisTd className="font-semibold">{m.studentName}</AisTd>
                        <AisTd>{m.parentName}</AisTd>
                        <AisTd className="max-w-md text-xs">{m.message}</AisTd>
                        <AisTd className={aisBodyMd}>{m.sentAt}</AisTd>
                      </AisTr>
                    ))
                  )}
                </tbody>
              </AisTable>
            </AisPanel>
          )}
        </>
      )}

      <Dialog isOpen={!!messageStudentId} onClose={() => setMessageStudentId(null)} title={`Message parent — ${selectedStudent?.name ?? ''}`} size="md">
        <form onSubmit={handleSendParent} className="space-y-4 pt-2">
          <p className={aisBodySm}>
            To: {selectedStudent?.parentName} ({selectedStudent?.parentPhone})
          </p>
          <textarea className={aisTextarea} required value={parentMsg} onChange={(e) => setParentMsg(e.target.value)} placeholder="Write about grades, quizzes, projects, mid/final exams, or attendance..." />
          <DialogFooter className="flex-wrap gap-3 pt-4 -mb-1">
            <AisBtnSecondary type="button" onClick={() => setMessageStudentId(null)}>
              Cancel
            </AisBtnSecondary>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-btn-primary px-6 py-2 text-sm font-semibold text-btn-primary-foreground transition-all hover:bg-btn-primary/90 shadow-md hover:shadow-lg"
            >
              Send to parent portal
            </button>
          </DialogFooter>
        </form>
      </Dialog>
    </AisPage>
  );
};
