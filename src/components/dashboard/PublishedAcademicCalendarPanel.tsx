'use client';

import React, { useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { MonthCalendarBlock } from '@/components/dashboard/MonthCalendarBlock';
import { CalendarColorLegend } from '@/components/dashboard/CalendarColorLegend';
import { WorkingDaysAnalysis } from '@/components/dashboard/WorkingDaysAnalysis';
import { getMoeCalendarBounds } from '@/lib/moeCalendarData';
import { formatEthiopianDate, formatGregorianDate } from '@/lib/ethiopianCalendar';

interface PublishedAcademicCalendarPanelProps {
  schoolId?: string;
  title?: string;
  description?: string;
  showWorkingDays?: boolean;
}

export const PublishedAcademicCalendarPanel: React.FC<PublishedAcademicCalendarPanelProps> = ({
  schoolId = 'sch-1',
  title = '',
  description = '',
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
      <div className="rounded-xl border border-border/60 bg-card p-10 text-center">
        <h3 className="text-sm font-bold text-foreground">{title}</h3>
        <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
          No academic calendar has been disseminated yet. Your school head will publish the calendar when ready.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h2 className="text-base font-bold text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {cal.title}
          {cal.publishedAt ? ` · Published ${cal.publishedAt}` : ''}
          <span className="mx-2 text-border">·</span>
          <span className="font-semibold text-foreground">G.C.</span>{' '}
          {formatGregorianDate(bounds.start)} → {formatGregorianDate(bounds.end)}
          <span className="mx-1.5 text-border">·</span>
          <span className="font-semibold text-foreground">E.C.</span>{' '}
          {formatEthiopianDate(bounds.start)} → {formatEthiopianDate(bounds.end)}
        </p>
      </div>

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
