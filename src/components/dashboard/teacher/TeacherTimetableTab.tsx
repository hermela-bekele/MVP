'use client';

import React, { useMemo, useState } from 'react';
import {
  AisPage,
  AisPanel,
  AisTable,
  AisTableHead,
  AisTh,
  AisTr,
  AisTd,
} from '@/components/dashboard/teacher/TeacherPortalUi';
import { Select } from '@/components/ui/select';
import {
  buildTeacherWeeklyTimetable,
  CURRENT_TERM,
  GRADE_OPTIONS,
  SECTION_FILTER_OPTIONS,
  TEACHER_CLASS_ASSIGNMENTS,
  normalizeGradeLabel,
} from '@/lib/teacherPortal';
import { aisBodySm, aisDataMd } from '@/components/dashboard/teacher/aisStyles';

function TimetableCell({ value }: { value: string }) {
  if (value === '—') {
    return <span className="text-ais-on-surface-variant">—</span>;
  }

  const [title, detail] = value.split('\n');

  return (
    <div className="min-w-[8rem]">
      <p className={aisDataMd}>{title}</p>
      {detail && <p className={`${aisBodySm} mt-0.5`}>{detail}</p>}
    </div>
  );
}

export const TeacherTimetableTab: React.FC = () => {
  const [grade, setGrade] = useState('All');
  const [section, setSection] = useState('All');

  const filteredAssignments = useMemo(() => {
    return TEACHER_CLASS_ASSIGNMENTS.filter((a) => {
      if (grade !== 'All' && normalizeGradeLabel(a.grade) !== normalizeGradeLabel(grade)) return false;
      if (section !== 'All' && a.section !== section) return false;
      return true;
    });
  }, [grade, section]);

  const schedule = useMemo(() => buildTeacherWeeklyTimetable(filteredAssignments), [filteredAssignments]);

  return (
    <AisPage>
      <div className="grid max-w-md grid-cols-1 gap-4 sm:grid-cols-2">
        <Select
          variant="ais"
          label="Grade"
          options={[{ value: 'All', label: 'All grades' }, ...GRADE_OPTIONS.map((g) => ({ value: g, label: g }))]}
          value={grade}
          onChange={(e) => setGrade(e.target.value)}
        />
        <Select
          variant="ais"
          label="Section"
          options={SECTION_FILTER_OPTIONS.map((s) => ({ value: s, label: s === 'All' ? 'All sections' : `Section ${s}` }))}
          value={section}
          onChange={(e) => setSection(e.target.value)}
        />
      </div>

      <AisPanel
        title="Full-semester teaching timetable"
        description={`This weekly pattern repeats every week for the full ${CURRENT_TERM}. ${grade !== 'All' || section !== 'All' ? 'Filtered to the selected grade/section.' : 'Showing all your assigned classes.'}`}
        flush
      >
        <AisTable>
          <AisTableHead>
            <AisTh>Time block</AisTh>
            <AisTh>Monday</AisTh>
            <AisTh>Tuesday</AisTh>
            <AisTh>Wednesday</AisTh>
            <AisTh>Thursday</AisTh>
            <AisTh>Friday</AisTh>
          </AisTableHead>
          <tbody>
            {schedule.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-ais-on-surface-variant">
                  No periods for this grade/section.
                </td>
              </tr>
            )}
            {schedule.map((row) => (
              <AisTr key={row.time}>
                <AisTd className="whitespace-nowrap bg-ais-surface-container-low/40 font-mono text-xs font-bold text-ais-primary">
                  {row.time}
                </AisTd>
                <AisTd>
                  <TimetableCell value={row.monday} />
                </AisTd>
                <AisTd>
                  <TimetableCell value={row.tuesday} />
                </AisTd>
                <AisTd>
                  <TimetableCell value={row.wednesday} />
                </AisTd>
                <AisTd>
                  <TimetableCell value={row.thursday} />
                </AisTd>
                <AisTd>
                  <TimetableCell value={row.friday} />
                </AisTd>
              </AisTr>
            ))}
          </tbody>
        </AisTable>
      </AisPanel>
    </AisPage>
  );
};
