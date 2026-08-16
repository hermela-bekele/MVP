'use client';

import React, { useState, useMemo } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Select } from '@/components/ui/select';
import {
  filterTeacherStudents,
  GRADE_OPTIONS,
  SECTION_OPTIONS,
  SECTION_FILTER_OPTIONS,
  TEACHER_CLASS_ASSIGNMENTS,
} from '@/lib/teacherPortal';
import type { Attendance } from '@/lib/mockData';
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
  aisInput,
  aisSegmentBtn,
  aisSegmentBtnActive,
  aisSegmentBtnInactive,
} from '@/components/dashboard/teacher/TeacherPortalUi';
import { aisBodySm } from '@/components/dashboard/teacher/aisStyles';
import type { AisBadgeVariant } from '@/components/dashboard/teacher/TeacherPortalUi';

const statusVariant: Record<Attendance['status'], AisBadgeVariant> = {
  Present: 'success',
  Late: 'warning',
  Absent: 'error',
};

export const TeacherAttendanceTab: React.FC = () => {
  const { students, attendance, saveAttendance } = useApp();
  const [mode, setMode] = useState<'list' | 'record'>('list');

  const [listGrade, setListGrade] = useState('All');
  const [listSection, setListSection] = useState('All');
  const [nameQuery, setNameQuery] = useState('');

  const [grade, setGrade] = useState('Grade 9');
  const [section, setSection] = useState('A');
  const [sessionLabel, setSessionLabel] = useState<string>(TEACHER_CLASS_ASSIGNMENTS[0].period);
  const [attendanceStatuses, setAttendanceStatuses] = useState<Record<string, 'Present' | 'Absent' | 'Late'>>({});
  const [attendanceRemarks, setAttendanceRemarks] = useState<Record<string, string>>({});

  const listRoster = useMemo(() => {
    const base = filterTeacherStudents(students, listGrade === 'All' ? undefined : listGrade, listSection);
    const query = nameQuery.trim().toLowerCase();
    if (!query) return base;
    return base.filter((std) => std.name.toLowerCase().includes(query));
  }, [students, listGrade, listSection, nameQuery]);

  const latestByStudent = useMemo(() => {
    const map: Record<string, Attendance> = {};
    for (const rec of attendance) {
      const existing = map[rec.studentId];
      if (!existing || rec.date > existing.date) map[rec.studentId] = rec;
    }
    return map;
  }, [attendance]);

  const roster = useMemo(() => filterTeacherStudents(students, grade, section), [students, grade, section]);

  const handleSave = () => {
    saveAttendance(
      roster.map((std) => ({
        studentId: std.id,
        status: attendanceStatuses[std.id] || 'Present',
        remarks: attendanceRemarks[std.id] || `Session: ${sessionLabel}`,
      }))
    );
    setAttendanceStatuses({});
    setAttendanceRemarks({});
    setMode('list');
  };

  if (mode === 'record') {
    return (
      <AisPage>
        <AisBtnSecondary onClick={() => setMode('list')} className="!px-3 !py-1.5">
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          Back to attendance list
        </AisBtnSecondary>

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
  }

  return (
    <AisPage>
      <div className="grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-3">
        <Select variant="ais" label="Class grade" options={[{ value: 'All', label: 'All grades' }, ...GRADE_OPTIONS.map((g) => ({ value: g, label: g }))]} value={listGrade} onChange={(e) => setListGrade(e.target.value)} />
        <Select variant="ais" label="Section" options={SECTION_FILTER_OPTIONS.map((s) => ({ value: s, label: s === 'All' ? 'All sections' : `Section ${s}` }))} value={listSection} onChange={(e) => setListSection(e.target.value)} />
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

      <AisPanel
        title="Students & attendance"
        description="Overall attendance rate and most recent recorded session"
        flush
        actions={
          <AisBtnPrimary onClick={() => setMode('record')}>+ Record new attendance</AisBtnPrimary>
        }
      >
        <AisTable>
          <thead>
            <tr className="bg-ais-surface-container-low">
              <AisTh>Student</AisTh>
              <AisTh>Grade</AisTh>
              <AisTh>Section</AisTh>
              <AisTh>Attendance rate</AisTh>
              <AisTh>Last recorded</AisTh>
            </tr>
          </thead>
          <tbody>
            {listRoster.length === 0 ? (
              <AisEmptyRow colSpan={5} message="No students match this filter." />
            ) : (
              listRoster.map((std) => {
                const last = latestByStudent[std.id];
                return (
                  <AisTr key={std.id}>
                    <AisTd className="font-semibold">{std.name}</AisTd>
                    <AisTd>{std.grade}</AisTd>
                    <AisTd>{std.section}</AisTd>
                    <AisTd className="tabular-nums">{std.attendanceRate}%</AisTd>
                    <AisTd>
                      {last ? (
                        <span className="inline-flex items-center gap-2">
                          <AisStatusBadge variant={statusVariant[last.status]}>{last.status}</AisStatusBadge>
                          <span className={aisBodySm}>{last.date}</span>
                        </span>
                      ) : (
                        <span className={aisBodySm}>No records yet</span>
                      )}
                    </AisTd>
                  </AisTr>
                );
              })
            )}
          </tbody>
        </AisTable>
      </AisPanel>
    </AisPage>
  );
};
