'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { api } from '@/lib/api';
import { Select } from '@/components/ui/select';
import {
  filterTeacherStudents,
  GRADE_OPTIONS,
  SECTION_OPTIONS,
  SECTION_FILTER_OPTIONS,
  mapTimetableSlotRow,
  timetableSlotLabel,
  type TimetableSlot,
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
import { Pagination } from '@/components/ui/pagination';

const PAGE_SIZE = 10;

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

  // CM-006: real scheduled sessions for this teacher, fetched from the timetable —
  // attendance recorded in "record" mode is always tied to one of these by real ID.
  const [mySlots, setMySlots] = useState<TimetableSlot[]>([]);
  useEffect(() => {
    void api.myTimetable().then((rows) => setMySlots(rows.map(mapTimetableSlotRow))).catch(() => setMySlots([]));
  }, []);

  const [selectedSlotId, setSelectedSlotId] = useState<string>('');
  const selectedSlot = mySlots.find((s) => s.id === selectedSlotId) ?? null;

  // Fallback manual grade/section only used when the teacher has no scheduled slots
  // yet (ad-hoc attendance — recorded without a timetableSlotId).
  const [manualGrade, setManualGrade] = useState('Grade 9');
  const [manualSection, setManualSection] = useState('A');

  const grade = selectedSlot?.grade ?? manualGrade;
  const section = selectedSlot?.section ?? manualSection;

  useEffect(() => {
    if (!selectedSlotId && mySlots.length > 0) setSelectedSlotId(mySlots[0].id);
  }, [mySlots, selectedSlotId]);

  const [attendanceStatuses, setAttendanceStatuses] = useState<Record<string, 'Present' | 'Absent' | 'Late'>>({});
  const [attendanceRemarks, setAttendanceRemarks] = useState<Record<string, string>>({});

  const listRoster = useMemo(() => {
    const base = filterTeacherStudents(students, listGrade === 'All' ? undefined : listGrade, listSection);
    const query = nameQuery.trim().toLowerCase();
    if (!query) return base;
    return base.filter((std) => std.name.toLowerCase().includes(query));
  }, [students, listGrade, listSection, nameQuery]);

  const [rosterPage, setRosterPage] = useState(1);
  const rosterTotalPages = Math.max(1, Math.ceil(listRoster.length / PAGE_SIZE));
  const currentRosterPage = Math.min(rosterPage, rosterTotalPages);
  const pagedRoster = listRoster.slice((currentRosterPage - 1) * PAGE_SIZE, currentRosterPage * PAGE_SIZE);

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
        remarks: attendanceRemarks[std.id] || (selectedSlot ? `Session: ${timetableSlotLabel(selectedSlot)}` : undefined),
      })),
      selectedSlot?.id,
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

        {mySlots.length > 0 ? (
          <div className="max-w-xl">
            <Select
              variant="ais"
              label="Teaching session"
              options={mySlots.map((s) => ({ value: s.id, label: timetableSlotLabel(s) }))}
              value={selectedSlotId}
              onChange={(e) => setSelectedSlotId(e.target.value)}
            />
            <p className="mt-1.5 text-xs text-ais-on-surface-variant">
              Class and section come from the scheduled session — attendance is linked to it automatically.
            </p>
          </div>
        ) : (
          <div className="grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
            <Select variant="ais" label="Class grade" options={GRADE_OPTIONS.filter((g) => g.includes('9') || g.includes('10')).map((g) => ({ value: g, label: g }))} value={manualGrade} onChange={(e) => setManualGrade(e.target.value)} />
            <Select variant="ais" label="Section" options={SECTION_OPTIONS.map((s) => ({ value: s, label: `Section ${s}` }))} value={manualSection} onChange={(e) => setManualSection(e.target.value)} />
            <p className="col-span-full text-xs text-ais-on-surface-variant">
              No scheduled sessions found on your timetable — recording ad-hoc attendance for this grade/section instead.
            </p>
          </div>
        )}

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
            <tr className="bg-muted">
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
              pagedRoster.map((std) => {
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
        <Pagination
          className="mt-3 p-4 pt-0"
          currentPage={currentRosterPage}
          totalPages={rosterTotalPages}
          onPageChange={setRosterPage}
          totalItems={listRoster.length}
          pageSize={PAGE_SIZE}
          entityLabel="students"
        />
      </AisPanel>
    </AisPage>
  );
};
