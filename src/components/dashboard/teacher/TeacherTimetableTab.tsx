'use client';

import React, { useMemo } from 'react';
import {
  AisPage,
  AisPanel,
  AisTable,
  AisTableHead,
  AisTh,
  AisTr,
  AisTd,
} from '@/components/dashboard/teacher/TeacherPortalUi';
import { buildTeacherWeeklyTimetable } from '@/lib/teacherPortal';
import { aisBodySm, aisDataMd } from '@/components/dashboard/teacher/aisStyles';

function TimetableCell({ value }: { value: string }) {
  if (value === '—') {
    return <span className="text-muted-foreground">—</span>;
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
  const schedule = useMemo(() => buildTeacherWeeklyTimetable(), []);

  return (
    <AisPage>
      <AisPanel
        title="Weekly teaching timetable"
        description="Your full class schedule across all sections for the current term."
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
            {schedule.map((row) => (
              <AisTr key={row.time}>
                <AisTd className="whitespace-nowrap bg-muted/40 font-mono text-xs font-bold text-primary">
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
