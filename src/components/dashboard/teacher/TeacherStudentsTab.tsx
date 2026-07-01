'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Select } from '@/components/ui/select';
import { Dialog, DialogFooter } from '@/components/ui/dialog';
import { TeacherGradebook } from '@/components/dashboard/teacher/TeacherGradebook';
import {
  DEMO_TEACHER_ID,
  GRADE_OPTIONS,
  SECTION_OPTIONS,
  filterTeacherStudents,
  gradesForStudent,
  filterTeacherGradeEntries,
  weightedTermAverage,
} from '@/lib/teacherPortal';
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
  const { students, sendParentMessage, parentMessages, studentGradeEntries } = useApp();

  const [subTab, setSubTab] = useState<SubTab>('roster');

  useEffect(() => {
    const goGradebook = () => setSubTab('gradebook');
    window.addEventListener('open-teacher-grade-entry', goGradebook);
    return () => window.removeEventListener('open-teacher-grade-entry', goGradebook);
  }, []);

  const [grade, setGrade] = useState('Grade 9');
  const [section, setSection] = useState('A');
  const [messageStudentId, setMessageStudentId] = useState<string | null>(null);
  const [parentMsg, setParentMsg] = useState('');

  const roster = useMemo(() => filterTeacherStudents(students, grade, section), [students, grade, section]);
  const myMessages = parentMessages.filter((m) => m.teacherId === DEMO_TEACHER_ID);
  const allGradeEntries = filterTeacherGradeEntries(studentGradeEntries);
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
          {(subTab === 'roster' || subTab === 'parents') && (
            <div className="grid max-w-md grid-cols-1 gap-4 sm:grid-cols-2">
              <Select variant="ais" label="Class grade" options={GRADE_OPTIONS.filter((g) => g.includes('9') || g.includes('10')).map((g) => ({ value: g, label: g }))} value={grade} onChange={(e) => setGrade(e.target.value)} />
              <Select variant="ais" label="Section" options={SECTION_OPTIONS.map((s) => ({ value: s, label: `Section ${s}` }))} value={section} onChange={(e) => setSection(e.target.value)} />
            </div>
          )}

          {subTab === 'roster' && (
            <AisPanel title="My students" description="Roster with term averages from quiz, test, project, mid & final exam entries" flush>
              <AisTable>
                <thead>
                  <tr className="bg-ais-surface-container-low">
                    <AisTh>Student</AisTh>
                    <AisTh>ID</AisTh>
                    <AisTh>Term avg</AisTh>
                    <AisTh>GPA (synced)</AisTh>
                    <AisTh>Attendance</AisTh>
                    <AisTh>Grade entries</AisTh>
                    <AisTh>Actions</AisTh>
                  </tr>
                </thead>
                <tbody>
                  {roster.length === 0 ? (
                    <AisEmptyRow colSpan={7} message="No students in this section." />
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
                          <AisTd className={`font-mono ${aisBodySm}`}>{std.studentId}</AisTd>
                          <AisTd>
                            <AisStatusBadge variant={termAvg != null && termAvg >= 70 ? 'success' : 'warning'}>
                              {termAvg != null ? `${termAvg}%` : '—'}
                            </AisStatusBadge>
                          </AisTd>
                          <AisTd className="font-mono font-bold tabular-nums">{std.gpa.toFixed(2)}</AisTd>
                          <AisTd className="tabular-nums">{std.attendanceRate}%</AisTd>
                          <AisTd className="text-xs">{entries.length} recorded</AisTd>
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
            <AisPanel title="Parent communication log" description="Messages sent to guardians" flush>
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
          <DialogFooter className="flex-wrap gap-3 border-t border-ais-card-border dark:border-gray-700 pt-4 -mb-1">
            <button
              type="button"
              onClick={() => setMessageStudentId(null)}
              className="inline-flex items-center justify-center gap-2 px-5 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#1d4ed8] px-6 py-2 text-sm font-semibold text-white transition-all hover:bg-[#1e40af] shadow-md hover:shadow-lg"
            >
              Send to parent portal
            </button>
          </DialogFooter>
        </form>
      </Dialog>
    </AisPage>
  );
};
