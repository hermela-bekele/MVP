'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Select } from '@/components/ui/select';
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
  AisEmptyRow,
  AisPage,
  AisPanel,
  AisStatusBadge,
  AisSubTabs,
  AisTable,
  AisTd,
  AisTh,
  AisTr,
} from '@/components/dashboard/teacher/TeacherPortalUi';
import { aisBodySm } from '@/components/dashboard/teacher/aisStyles';

type SubTab = 'roster' | 'gradebook';

export const TeacherStudentsTab: React.FC = () => {
  const { students, studentGradeEntries, resolveTeacherId } = useApp();
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

  const roster = useMemo(() => {
    const base = filterTeacherStudents(students, grade, section);
    const query = nameQuery.trim().toLowerCase();
    if (!query) return base;
    return base.filter((std) => std.name.toLowerCase().includes(query));
  }, [students, grade, section, nameQuery]);
  const allGradeEntries = filterTeacherGradeEntries(studentGradeEntries, teacherId);

  return (
    <AisPage>
      <AisSubTabs
        active={subTab}
        onChange={setSubTab}
        tabs={[
          { id: 'roster', label: 'Class roster' },
          { id: 'gradebook', label: 'Gradebook' },
        ]}
      />

      {subTab === 'gradebook' ? (
        <TeacherGradebook />
      ) : (
        <>
          {subTab === 'roster' && (
            <div className="grid grid-cols-1 gap-4 max-w-3xl sm:grid-cols-3 sm:items-end">
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
                  </tr>
                </thead>
                <tbody>
                  {roster.length === 0 ? (
                    <AisEmptyRow colSpan={7} message="No students for this grade." />
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
                        </AisTr>
                      );
                    })
                  )}
                </tbody>
              </AisTable>
            </AisPanel>
          )}

        </>
      )}
    </AisPage>
  );
};
