'use client';

import React, { useMemo, useState } from 'react';
import { List, Grid3x3 } from 'lucide-react';
import type { AcademicCalendarEvent } from '@/lib/mockData';
import { calendarEventBadgeVariant } from '@/lib/academicCalendar';
import {
  daysInMonth,
  EVENT_CELL_STYLES,
  EVENT_LEGEND,
  firstWeekdayOfMonth,
  getCalendarBounds,
  holidayForDay,
  isWeekdayIso,
  monthsInRange,
  parseMonthKey,
  primaryEventForDay,
  shortHolidayLabel,
} from '@/lib/calendarPresentation';
import { formatEthiopianDateShort, gregorianIsoToEthiopian, ETHIOPIAN_MONTHS } from '@/lib/ethiopianCalendar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type ViewMode = 'grid' | 'list';

interface AcademicCalendarViewProps {
  title: string;
  subtitle?: string;
  events: AcademicCalendarEvent[];
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function toIso(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export const AcademicCalendarView: React.FC<AcademicCalendarViewProps> = ({
  title,
  subtitle,
  events,
}) => {
  const bounds = useMemo(() => getCalendarBounds(events), [events]);
  const monthKeys = useMemo(() => monthsInRange(bounds.start, bounds.end), [bounds]);
  const holidayCount = useMemo(() => events.filter((e) => e.type === 'holiday').length, [events]);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [monthIndex, setMonthIndex] = useState(0);

  const activeMonthKey = monthKeys[monthIndex] ?? monthKeys[0];
  const { year, month } = parseMonthKey(activeMonthKey);
  const monthLabel = new Date(year, month - 1, 1).toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
  });

  const ethiopianMonthHint = useMemo(() => {
    const midIso = toIso(year, month, 15);
    const e = gregorianIsoToEthiopian(midIso);
    return `${ETHIOPIAN_MONTHS[e.month - 1]} ${e.year} E.C.`;
  }, [year, month]);

  const gridCells = useMemo(() => {
    const totalDays = daysInMonth(year, month);
    const leading = firstWeekdayOfMonth(year, month);
    const cells: Array<{ iso: string; day: number } | null> = [];
    for (let i = 0; i < leading; i++) cells.push(null);
    for (let day = 1; day <= totalDays; day++) {
      cells.push({ iso: toIso(year, month, day), day });
    }
    return cells;
  }, [year, month]);

  if (events.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        No calendar events to display yet.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-foreground">{title}</h3>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
          {holidayCount > 0 && (
            <p className="text-xs text-destructive font-medium mt-1">
              {holidayCount} national holiday{holidayCount === 1 ? '' : 's'} marked as school off days
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-border/60 p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Grid3x3 className="h-3.5 w-3.5" />
              Month view
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <List className="h-3.5 w-3.5" />
              List view
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {EVENT_LEGEND.map((item) => (
          <span
            key={item.type}
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${EVENT_CELL_STYLES[item.type]}`}
          >
            {item.label}
          </span>
        ))}
      </div>

      {viewMode === 'grid' ? (
        <Card className="border-border/60 overflow-hidden">
          <CardHeader className="pb-3 border-b border-border/40 bg-muted/20">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base font-bold">{monthLabel}</CardTitle>
                <CardDescription className="text-xs mt-1">
                  Ethiopian calendar: <span className="font-semibold text-foreground">{ethiopianMonthHint}</span>
                  <span className="mx-2 text-border">|</span>
                  Red fill = weekday holiday · Red outline = weekend holiday · Blue = exams · Amber = breaks
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={monthIndex <= 0}
                  onClick={() => setMonthIndex((i) => Math.max(0, i - 1))}
                >
                  Previous
                </Button>
                <span className="text-xs font-mono text-muted-foreground">
                  {monthIndex + 1} / {monthKeys.length}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={monthIndex >= monthKeys.length - 1}
                  onClick={() => setMonthIndex((i) => Math.min(monthKeys.length - 1, i + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-7 gap-1 mb-1">
              {WEEKDAYS.map((d) => (
                <div key={d} className="text-center text-[10px] font-bold uppercase text-muted-foreground py-1">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {gridCells.map((cell, idx) => {
                if (!cell) {
                  return <div key={`empty-${idx}`} className="min-h-[72px]" />;
                }
                const holiday = holidayForDay(events, cell.iso);
                const primary = primaryEventForDay(events, cell.iso);
                const holidayWeekday = Boolean(holiday && isWeekdayIso(cell.iso));
                const holidayWeekend = Boolean(holiday && !isWeekdayIso(cell.iso));

                let style = 'bg-card border-border/40 text-foreground';
                if (holidayWeekday) {
                  style = 'bg-red-600 border-red-700 text-white';
                } else if (holidayWeekend) {
                  style = 'bg-card border-2 border-red-500 text-red-800';
                } else if (primary) {
                  style = EVENT_CELL_STYLES[primary.type];
                }

                const ethShort = formatEthiopianDateShort(cell.iso);
                const caption = holiday
                  ? shortHolidayLabel(holiday.label)
                  : primary
                    ? primary.type === 'exam'
                      ? primary.label.includes('Final')
                        ? 'Final exam'
                        : 'Mid exam'
                      : primary.type === 'break'
                        ? primary.label.includes('Semester')
                          ? 'Semester break'
                          : 'Quarter break'
                        : primary.type === 'moe'
                          ? null
                          : primary.label.split(' ')[0]
                    : null;

                return (
                  <div
                    key={cell.iso}
                    title={holiday ? `${holiday.label} (${cell.iso})` : primary ? `${primary.label} (${cell.iso})` : cell.iso}
                    className={`min-h-[72px] rounded-lg border p-1.5 text-left transition-colors ${style}`}
                  >
                    <div className="text-sm font-bold leading-none">{cell.day}</div>
                    <div
                      className={`text-[9px] font-medium mt-0.5 leading-tight ${
                        holidayWeekday ? 'text-white/85' : 'opacity-80'
                      }`}
                    >
                      {ethShort}
                    </div>
                    {caption && (
                      <div
                        className={`text-[8px] font-semibold mt-1 line-clamp-2 leading-tight ${
                          holidayWeekday ? 'text-white/95' : holidayWeekend ? 'text-red-700' : 'opacity-90'
                        }`}
                      >
                        {caption}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-xl border border-border/60 overflow-hidden">
          <table className="eskooly-table w-full">
            <thead>
              <tr>
                <th>Period</th>
                <th>Start (G.C.)</th>
                <th>Start (E.C.)</th>
                <th>End (G.C.)</th>
                <th>End (E.C.)</th>
                <th>Type</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event, i) => (
                <tr key={`${event.label}-${event.startDate}-${i}`}>
                  <td className="font-semibold">{event.label}</td>
                  <td>{event.startDate}</td>
                  <td className="text-muted-foreground text-xs">{event.startDateEthiopian ?? '—'}</td>
                  <td>{event.endDate}</td>
                  <td className="text-muted-foreground text-xs">{event.endDateEthiopian ?? '—'}</td>
                  <td>
                    <Badge variant={calendarEventBadgeVariant(event.type)}>{event.type}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
