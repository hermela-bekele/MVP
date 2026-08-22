'use client';

import React, { useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { MonthCalendarBlock } from '@/components/dashboard/MonthCalendarBlock';
import { CalendarColorLegend } from '@/components/dashboard/CalendarColorLegend';
import { WorkingDaysAnalysis } from '@/components/dashboard/WorkingDaysAnalysis';
import { getMoeCalendarBounds } from '@/lib/moeCalendarData';
import { EmptyState } from '@/components/ui/empty-state';
import { CalendarX } from 'lucide-react';

interface PublishedAcademicCalendarPanelProps {
  schoolId?: string;
  showWorkingDays?: boolean;
}

export const PublishedAcademicCalendarPanel: React.FC<PublishedAcademicCalendarPanelProps> = ({
  schoolId = 'sch-1',
  showWorkingDays = true,
}) => {
  const { academicCalendars } = useApp();
  const bounds = useMemo(() => getMoeCalendarBounds(), []);
  const published = useMemo(
    () => academicCalendars.filter((c) => c.status === 'Published' && c.schoolId === schoolId),
    [academicCalendars, schoolId],
  );
  const cal =
    published[0] ??
    academicCalendars.find((c) => c.status === 'Published') ??
    null;

  if (!cal) {
    return (
      <EmptyState
        icon={<CalendarX />}
        title="No calendar published yet"
        description="No academic calendar has been disseminated yet. Your school head will publish the calendar when ready."
      />
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_220px] gap-5 items-start">
        <MonthCalendarBlock
          events={cal.events}
          minDate={bounds.start}
          maxDate={bounds.end}
          showLegend={false}
          fill
        />
        <CalendarColorLegend />
      </div>

      {showWorkingDays && <WorkingDaysAnalysis />}
    </div>
  );
};
