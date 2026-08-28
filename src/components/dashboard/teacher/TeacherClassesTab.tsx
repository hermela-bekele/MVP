'use client';

import React, { useMemo, useState } from 'react';
import { ArrowLeft, MapPin, Clock, CalendarDays, Users } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import {
  TEACHER_CLASS_ASSIGNMENTS,
  filterTeacherStudents,
  filterTeacherGradeEntries,
  weightedTermAverage,
} from '@/lib/teacherPortal';
import type { TeacherClassAssignment } from '@/lib/teacherPortal';
import { formatMark } from '@/lib/grading';
import {
  AisBtnSecondary,
  AisEmptyRow,
  AisPage,
  AisStatusBadge,
  AisTable,
  AisTd,
  AisTh,
  AisTr,
} from '@/components/dashboard/teacher/TeacherPortalUi';
import { aisBodyMd, aisBodySm, aisCard, aisDataLg, aisHeadlineSm } from '@/components/dashboard/teacher/aisStyles';

const ClassDetail: React.FC<{ assignment: TeacherClassAssignment; onBack: () => void }> = ({ assignment, onBack }) => {
  const { students, studentGradeEntries, resolveTeacherId } = useApp();
  const teacherId = resolveTeacherId();

  const roster = useMemo(
    () => filterTeacherStudents(students, assignment.grade, assignment.section),
    [students, assignment.grade, assignment.section],
  );

  const myEntries = useMemo(
    () => filterTeacherGradeEntries(studentGradeEntries, teacherId).filter((e) => e.subject === assignment.subject),
    [studentGradeEntries, teacherId, assignment.subject],
  );

  return (
    <AisPage>
      <AisBtnSecondary onClick={onBack} className="!px-3 !py-1.5">
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        Back to classes
      </AisBtnSecondary>

      <div className={`${aisCard} p-4`}>
        <h3 className={`${aisHeadlineSm} !text-title`}>
          {assignment.grade} — Section {assignment.section}
        </h3>
        <p className={`${aisBodyMd} mt-0.5`}>{assignment.subject}</p>
        <div className={`${aisBodySm} mt-3 flex flex-wrap gap-x-6 gap-y-2`}>
          <p className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-ais-primary" aria-hidden />
            <span className="font-semibold text-ais-on-surface">Room:</span> {assignment.room}
          </p>
          <p className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 shrink-0 text-ais-primary" aria-hidden />
            <span className="font-semibold text-ais-on-surface">Period:</span> {assignment.period}
          </p>
          <p className="flex items-center gap-2">
            <CalendarDays className="h-3.5 w-3.5 shrink-0 text-ais-primary" aria-hidden />
            <span className="font-semibold text-ais-on-surface">Schedule:</span> {assignment.days}
          </p>
        </div>
      </div>

      <div>
        <h4 className={`${aisHeadlineSm} mb-2 !text-title`}>Class roster</h4>
        <AisTable>
          <thead>
            <tr className="bg-ais-surface-container-low">
              <AisTh>Student</AisTh>
              <AisTh>ID</AisTh>
              <AisTh>Attendance</AisTh>
              <AisTh>{assignment.subject} grade</AisTh>
            </tr>
          </thead>
          <tbody>
            {roster.length === 0 ? (
              <AisEmptyRow colSpan={4} message="No students in this class." />
            ) : (
              roster.map((std) => {
                const entries = myEntries.filter((e) => e.studentId === std.id);
                const subjectAvg = weightedTermAverage(entries);
                return (
                  <AisTr key={std.id}>
                    <AisTd className="font-semibold">{std.name}</AisTd>
                    <AisTd className={`font-mono ${aisBodySm}`}>{std.studentId}</AisTd>
                    <AisTd className="tabular-nums">{std.attendanceRate}%</AisTd>
                    <AisTd>
                      <AisStatusBadge variant={subjectAvg != null && subjectAvg >= 50 ? 'success' : 'warning'}>
                        {subjectAvg != null ? `${subjectAvg}%` : formatMark(std.gpa)}
                      </AisStatusBadge>
                    </AisTd>
                  </AisTr>
                );
              })
            )}
          </tbody>
        </AisTable>
      </div>
    </AisPage>
  );
};

export const TeacherClassesTab: React.FC = () => {
  const { students } = useApp();
  const [selected, setSelected] = useState<TeacherClassAssignment | null>(null);

  if (selected) {
    return <ClassDetail assignment={selected} onBack={() => setSelected(null)} />;
  }

  return (
    <AisPage>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {TEACHER_CLASS_ASSIGNMENTS.map((a) => {
          const count = filterTeacherStudents(students, a.grade, a.section).length;
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => setSelected(a)}
              className={`${aisCard} flex flex-col p-4 text-left transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ais-primary`}
            >
              <div className="mb-3 border-b border-ais-card-border pb-3">
                <h3 className={`${aisHeadlineSm} !text-title`}>
                  {a.grade} — Section {a.section}
                </h3>
                <p className={`${aisBodyMd} mt-0.5`}>{a.subject}</p>
              </div>
              <div className={`${aisBodySm} space-y-2`}>
                <p className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
                  <span className="font-semibold text-foreground">Room:</span> {a.room}
                </p>
                <p className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
                  <span className="font-semibold text-foreground">Period:</span> {a.period}
                </p>
                <p className="flex items-center gap-2">
                  <CalendarDays className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
                  <span className="font-semibold text-foreground">Schedule:</span> {a.days}
                </p>
              </div>
              <div className="mt-4 flex items-end justify-between border-t border-border pt-3">
                <div>
                  <span className={`${aisDataLg} text-primary`}>{count}</span>
                  <p className={aisBodySm}>students enrolled</p>
                </div>
                <AisStatusBadge variant="primary">
                  <Users className="h-3 w-3" aria-hidden />
                  Active
                </AisStatusBadge>
              </div>
            </button>
          );
        })}
      </div>
    </AisPage>
  );
};
