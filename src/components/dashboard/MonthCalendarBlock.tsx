'use client';

import React, { useMemo, useState } from 'react';
import { LargeMonthCalendar } from '@/components/dashboard/LargeMonthCalendar';
import { getCalendarBounds } from '@/lib/calendarPresentation';
import {
  daysInEthiopianMonth,
  ethiopianToGregorianIso,
  gregorianIsoToEthiopian,
} from '@/lib/ethiopianCalendar';
import type { AcademicCalendarEvent } from '@/lib/mockData';
import type { DayAssignment } from '@/lib/calendarDayMarks';

interface MonthCalendarBlockProps {
  events: AcademicCalendarEvent[];
  assignments?: DayAssignment[];
  interactive?: boolean;
  onAssignDay?: (assignment: DayAssignment) => void;
  onClearDay?: (iso: string) => void;
  minDate?: string;
  maxDate?: string;
  showLegend?: boolean;
  fill?: boolean;
  initialDate?: string;
}

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function clampIso(iso: string, start: string, end: string): string {
  if (iso < start) return start;
  if (iso > end) return end;
  return iso;
}

/** Prefer a date inside an Ethiopian month that stays within calendar bounds. */
function focusDateInEthiopianMonth(
  ethYear: number,
  ethMonth: number,
  bounds: { start: string; end: string },
  preferIso?: string,
): string {
  if (preferIso) {
    const e = gregorianIsoToEthiopian(preferIso);
    if (e.year === ethYear && e.month === ethMonth) {
      return clampIso(preferIso, bounds.start, bounds.end);
    }
  }

  const today = todayIso();
  const todayEth = gregorianIsoToEthiopian(today);
  if (todayEth.year === ethYear && todayEth.month === ethMonth) {
    return clampIso(today, bounds.start, bounds.end);
  }

  const lastDay = daysInEthiopianMonth(ethYear, ethMonth);
  for (let day = 1; day <= lastDay; day++) {
    const iso = ethiopianToGregorianIso(ethYear, ethMonth, day);
    if (iso >= bounds.start && iso <= bounds.end) return iso;
  }
  return clampIso(ethiopianToGregorianIso(ethYear, ethMonth, 1), bounds.start, bounds.end);
}

/** Shared MOE-style month calendar — pages are Ethiopian months (1–30). */
export const MonthCalendarBlock: React.FC<MonthCalendarBlockProps> = ({
  events,
  assignments = [],
  interactive = false,
  onAssignDay,
  onClearDay,
  minDate,
  maxDate,
  showLegend = false,
  fill = true,
  initialDate,
}) => {
  const bounds = useMemo(() => {
    if (minDate && maxDate) return { start: minDate, end: maxDate };
    return getCalendarBounds(events);
  }, [events, minDate, maxDate]);

  const focusIso = useMemo(() => {
    if (initialDate && initialDate >= bounds.start && initialDate <= bounds.end) {
      return initialDate;
    }
    return clampIso(todayIso(), bounds.start, bounds.end);
  }, [initialDate, bounds.start, bounds.end]);

  const focusEth = useMemo(() => gregorianIsoToEthiopian(focusIso), [focusIso]);
  const [year, setYear] = useState(focusEth.year);
  const [month, setMonth] = useState(focusEth.month);
  const [selectedDate, setSelectedDate] = useState(focusIso);

  return (
    <LargeMonthCalendar
      year={year}
      month={month}
      onMonthChange={(ny, nm) => {
        setYear(ny);
        setMonth(nm);
        setSelectedDate(focusDateInEthiopianMonth(ny, nm, bounds, todayIso()));
      }}
      events={events}
      assignments={assignments}
      interactive={interactive}
      onAssignDay={onAssignDay}
      onClearDay={onClearDay}
      selectedDate={selectedDate}
      onSelectDate={setSelectedDate}
      minDate={bounds.start}
      maxDate={bounds.end}
      showLegend={showLegend}
      fill={fill}
      size="lg"
    />
  );
};
