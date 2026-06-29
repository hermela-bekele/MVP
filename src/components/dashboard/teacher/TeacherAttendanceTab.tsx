'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { Select } from '@/components/ui/select';
import {
  filterTeacherStudents,
  GRADE_OPTIONS,
  SECTION_OPTIONS,
  TEACHER_CLASS_ASSIGNMENTS,
} from '@/lib/teacherPortal';
import {
  AisBtnPrimary,
  AisPage,
  AisPanel,
  AisTable,
  AisTd,
  AisTh,
  AisTr,
  aisInput,
  aisSegmentBtn,
  aisSegmentBtnActive,
  aisSegmentBtnInactive,
} from '@/components/dashboard/teacher/TeacherPortalUi';
import { aisBodySm } from '@/components/dashboard/teacher/aisStyles';

export const TeacherAttendanceTab: React.FC = () => {
  const { students, saveAttendance } = useApp();
  const [grade, setGrade] = useState('Grade 9');
  const [section, setSection] = useState('A');
  const [sessionLabel, setSessionLabel] = useState<string>(TEACHER_CLASS_ASSIGNMENTS[0].period);
  const [attendanceStatuses, setAttendanceStatuses] = useState<Record<string, 'Present' | 'Absent' | 'Late'>>({});
  const [attendanceRemarks, setAttendanceRemarks] = useState<Record<string, string>>({});

  const roster = useMemo(() => filterTeacherStudents(students, grade, section), [students, grade, section]);

  const handleSave = () => {
    saveAttendance(
      roster.map((std) => ({
        studentId: std.id,
        status: attendanceStatuses[std.id] || 'Present',
        remarks: attendanceRemarks[std.id] || `Session: ${sessionLabel}`,
      }))
    );
  };

  return (
    <AisPage>
      <div className="grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-3">
        <Select variant="ais" label="Class grade" options={GRADE_OPTIONS.filter((g) => g.includes('9') || g.includes('10')).map((g) => ({ value: g, label: g }))} value={grade} onChange={(e) => setGrade(e.target.value)} />
        <Select variant="ais" label="Section" options={SECTION_OPTIONS.map((s) => ({ value: s, label: `Section ${s}` }))} value={section} onChange={(e) => setSection(e.target.value)} />
        <Select variant="ais" label="Teaching session" options={TEACHER_CLASS_ASSIGNMENTS.map((a) => ({ value: a.period, label: `${a.period} (${a.grade} ${a.section})` }))} value={sessionLabel} onChange={(e) => setSessionLabel(e.target.value)} />
      </div>

      <AisPanel title="Session roll call" description="Record attendance during your active teaching period" flush>
        <AisTable>
          <thead>
            <tr className="bg-ais-surface-container-low">
              <AisTh>Student</AisTh>
              <AisTh>ID</AisTh>
              <AisTh>Status</AisTh>
              <AisTh>Remarks</AisTh>
            </tr>
          </thead>
          <tbody>
            {roster.map((std) => (
              <AisTr key={std.id}>
                <AisTd className="font-semibold">{std.name}</AisTd>
                <AisTd className={`font-mono ${aisBodySm}`}>{std.studentId}</AisTd>
                <AisTd>
                  <div className="flex gap-1">
                    {(['Present', 'Absent', 'Late'] as const).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setAttendanceStatuses({ ...attendanceStatuses, [std.id]: st })}
                        className={`${aisSegmentBtn} ${
                          (attendanceStatuses[std.id] || 'Present') === st
                            ? aisSegmentBtnActive
                            : aisSegmentBtnInactive
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </AisTd>
                <AisTd>
                  <input
                    className={`${aisInput} !h-9 text-xs`}
                    placeholder="Optional note"
                    value={attendanceRemarks[std.id] || ''}
                    onChange={(e) => setAttendanceRemarks({ ...attendanceRemarks, [std.id]: e.target.value })}
                  />
                </AisTd>
              </AisTr>
            ))}
          </tbody>
        </AisTable>
      </AisPanel>

      <div className="flex justify-end">
        <AisBtnPrimary onClick={handleSave}>Save session attendance</AisBtnPrimary>
      </div>
    </AisPage>
  );
};
