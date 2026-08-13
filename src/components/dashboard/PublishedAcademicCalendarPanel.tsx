'use client';

import React, { useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { MonthCalendarBlock } from '@/components/dashboard/MonthCalendarBlock';
import { CalendarColorLegend } from '@/components/dashboard/CalendarColorLegend';
import { WorkingDaysAnalysis } from '@/components/dashboard/WorkingDaysAnalysis';
import { getMoeCalendarBounds } from '@/lib/moeCalendarData';

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
    () => {
      // First try to find a calendar for this specific school
      const schoolCalendars = academicCalendars.filter(
        (c) => c.status === 'Published' && c.schoolId === schoolId
      );
      if (schoolCalendars.length > 0) {
        return schoolCalendars;
      }
      // Fallback: show any published calendar
      return academicCalendars.filter((c) => c.status === 'Published');
    },
    [academicCalendars, schoolId],
  );
  const cal = published[0] ?? null;

  if (!cal) {
    return (
      <div className="rounded-xl border border-border/60 bg-card p-10 text-center">
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          No academic calendar has been disseminated yet. Your school head will publish the calendar when ready.
        </p>
      </div>
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
