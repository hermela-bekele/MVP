'use client';

import React, { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  DAY_MARK_COLORS,
  DAY_MARK_OPTIONS,
  type DayAssignment,
  type SchoolDayMark,
  assignmentForDay,
} from '@/lib/calendarDayMarks';
import {
  eventsForDay,
  holidayForDay,
  isWeekdayIso,
  primaryEventForDay,
  shortHolidayLabel,
} from '@/lib/calendarPresentation';
import type { AcademicCalendarEvent } from '@/lib/mockData';
import {
  addEthiopianMonths,
  daysInEthiopianMonth,
  ethiopianMonthKey,
  ethiopianToGregorianIso,
  firstWeekdayOfEthiopianMonth,
  formatEthiopianDate,
  formatEthiopianMonthLabel,
  formatGregorianDate,
  formatGregorianSpanForEthiopianMonth,
  gregorianIsoToEthiopian,
} from '@/lib/ethiopianCalendar';

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

/** Soft activity tints — readable, not loud. */
const ACTIVITY_SOFT: Record<string, { circle: string; caption: string; ec: string }> = {
  exam: {
    circle: 'bg-violet-100 text-violet-900 ring-1 ring-violet-200/80',
    caption: 'text-violet-700',
    ec: 'text-violet-700/80',
  },
  break: {
    circle: 'bg-amber-50 text-amber-900 ring-1 ring-amber-200/80',
    caption: 'text-amber-700',
    ec: 'text-amber-700/80',
  },
  term: {
    circle: 'bg-primary/10 text-primary ring-1 ring-primary/25',
    caption: 'text-primary',
    ec: 'text-primary/80',
  },
  moe: {
    circle: 'bg-slate-100 text-slate-800 ring-1 ring-slate-200/80',
    caption: 'text-slate-600',
    ec: 'text-slate-500',
  },
  other: {
    circle: 'bg-rose-50 text-rose-900 ring-1 ring-rose-200/70',
    caption: 'text-rose-700',
    ec: 'text-rose-700/80',
  },
};

function shortActivityLabel(label: string): string {
  const cleaned = label.replace(/\s+/g, ' ').trim();
  if (cleaned.length <= 16) return cleaned;
  return `${cleaned.slice(0, 14)}…`;
}

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function shortGcLabel(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function activityForDay(
  events: AcademicCalendarEvent[],
  iso: string,
): AcademicCalendarEvent | null {
  const dayEvents = eventsForDay(events, iso).filter(
    (e) => e.type !== 'moe' || !e.label.includes('Window'),
  );
  if (dayEvents.length === 0) return null;
  const nonHoliday = dayEvents.find((e) => e.type !== 'holiday');
  return nonHoliday ?? dayEvents[0];
}

function markFromEvents(events: AcademicCalendarEvent[], iso: string): DayAssignment | undefined {
  const withMark = eventsForDay(events, iso).find((e) => e.mark);
  if (!withMark?.mark) return undefined;
  return { date: iso, mark: withMark.mark, label: withMark.label };
}

export interface LargeMonthCalendarProps {
  /** Ethiopian year (E.C.) */
  year: number;
  /** Ethiopian month 1–13 */
  month: number;
  onMonthChange: (year: number, month: number) => void;
  events?: AcademicCalendarEvent[];
  assignments?: DayAssignment[];
  interactive?: boolean;
  onAssignDay?: (assignment: DayAssignment) => void;
  onClearDay?: (iso: string) => void;
  selectedDate?: string;
  onSelectDate?: (iso: string) => void;
  /** Work start — dates before this are inactive (Nehase 25). */
  minDate?: string;
  maxDate?: string;
  showLegend?: boolean;
  fill?: boolean;
  size?: 'md' | 'lg';
}

export const LargeMonthCalendar: React.FC<LargeMonthCalendarProps> = ({
  year,
  month,
  onMonthChange,
  events = [],
  assignments = [],
  interactive = false,
  onAssignDay,
  onClearDay,
  selectedDate,
  onSelectDate,
  minDate,
  maxDate,
  showLegend = false,
  fill = false,
  size = 'md',
}) => {
  const [popoverIso, setPopoverIso] = useState<string | null>(null);
  const [draftMark, setDraftMark] = useState<SchoolDayMark>('parent-conference');
  const [draftLabel, setDraftLabel] = useState('');
  const [reassignMode, setReassignMode] = useState(false);
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );

  useEffect(() => {
    if (!popoverIso) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPopoverIso(null);
        setReassignMode(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [popoverIso]);

  const monthDays = daysInEthiopianMonth(year, month);

  // Avoid SSR/client date mismatch — resolve "today" only on the client
  const headerIso = useSyncExternalStore(
    () => () => undefined,
    () => todayIso(),
    () => null,
  );

  const headerGc = useMemo(() => {
    if (!headerIso) return '';
    const d = new Date(`${headerIso}T12:00:00`);
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }, [headerIso]);

  const headerEc = useMemo(
    () => (headerIso ? formatEthiopianDate(headerIso) : ''),
    [headerIso],
  );

  const monthLabelEc = useMemo(() => formatEthiopianMonthLabel(year, month), [year, month]);
  const monthLabelGc = useMemo(
    () => formatGregorianSpanForEthiopianMonth(year, month),
    [year, month],
  );

  /** One Ethiopian month page: days 1–30 (or Pagume 1–5/6), always 6 weeks so Pagume matches other months. */
  const gridCells = useMemo(() => {
    const TOTAL_CELLS = 42; // 6 weeks — same card height every month
    const leading = firstWeekdayOfEthiopianMonth(year, month);
    const prev = addEthiopianMonths(year, month, -1);
    const prevDays = daysInEthiopianMonth(prev.year, prev.month);
    const cells: Array<{ iso: string; day: number; inMonth: boolean }> = [];

    for (let i = leading - 1; i >= 0; i--) {
      const day = prevDays - i;
      cells.push({
        iso: ethiopianToGregorianIso(prev.year, prev.month, day),
        day,
        inMonth: false,
      });
    }
    for (let day = 1; day <= monthDays; day++) {
      cells.push({
        iso: ethiopianToGregorianIso(year, month, day),
        day,
        inMonth: true,
      });
    }
    const next = addEthiopianMonths(year, month, 1);
    let nextDay = 1;
    while (cells.length < TOTAL_CELLS) {
      cells.push({
        iso: ethiopianToGregorianIso(next.year, next.month, nextDay),
        day: nextDay,
        inMonth: false,
      });
      nextDay += 1;
    }
    return cells;
  }, [year, month, monthDays]);

  const cellSize = fill
    ? 'min-h-[5rem] sm:min-h-[5.75rem] lg:min-h-[6.25rem]'
    : size === 'lg'
      ? 'min-h-[4.75rem] sm:min-h-[5.25rem]'
      : 'min-h-[4.25rem] sm:min-h-[4.75rem]';
  const dayText = fill || size === 'lg' ? 'text-base sm:text-lg' : 'text-sm sm:text-base';
  const circleSize = fill
    ? 'h-11 w-11 sm:h-12 sm:w-12 lg:h-14 lg:w-14'
    : size === 'lg'
      ? 'h-10 w-10 sm:h-12 sm:w-12'
      : 'h-9 w-9 sm:h-10 sm:w-10';

  const isActiveWorkDay = (iso: string) => {
    if (minDate && iso < minDate) return false;
    if (maxDate && iso > maxDate) return false;
    return true;
  };

  const openPopover = (iso: string) => {
    if (!isActiveWorkDay(iso)) return;
    if (!interactive) {
      onSelectDate?.(iso);
      return;
    }
    const existing = assignmentForDay(assignments, iso) ?? markFromEvents(events, iso);
    setPopoverIso(iso);
    setReassignMode(!existing);
    setDraftMark(existing?.mark ?? 'mid-exam-start');
    setDraftLabel(existing?.label ?? '');
    onSelectDate?.(iso);
  };

  const applyAssignment = () => {
    if (!popoverIso || !onAssignDay) return;
    const label =
      draftMark === 'other'
        ? draftLabel.trim() || 'Custom activity'
        : draftLabel.trim() || DAY_MARK_OPTIONS.find((o) => o.value === draftMark)?.label || '';
    onAssignDay({ date: popoverIso, mark: draftMark, label });
    setPopoverIso(null);
    setReassignMode(false);
  };

  const clearAssignment = () => {
    if (!popoverIso || !onClearDay) return;
    onClearDay(popoverIso);
    setPopoverIso(null);
    setReassignMode(false);
  };

  const prevMonth = addEthiopianMonths(year, month, -1);
  const nextMonth = addEthiopianMonths(year, month, 1);
  const prevKey = ethiopianMonthKey(prevMonth.year, prevMonth.month);
  const nextKey = ethiopianMonthKey(nextMonth.year, nextMonth.month);
  const minKey = minDate ? ethiopianMonthKey(
    gregorianIsoToEthiopian(minDate).year,
    gregorianIsoToEthiopian(minDate).month,
  ) : undefined;
  const maxKey = maxDate ? ethiopianMonthKey(
    gregorianIsoToEthiopian(maxDate).year,
    gregorianIsoToEthiopian(maxDate).month,
  ) : undefined;

  const popoverHoliday = popoverIso ? holidayForDay(events, popoverIso) : null;
  const popoverActivity = popoverIso ? activityForDay(events, popoverIso) : null;
  const popoverHolidayWeekday = Boolean(popoverHoliday && popoverIso && isWeekdayIso(popoverIso));
  const popoverExisting =
    popoverIso
      ? assignmentForDay(assignments, popoverIso) ?? markFromEvents(events, popoverIso)
      : undefined;
  const showUndoPanel = Boolean(popoverExisting && !reassignMode);

  const closePopover = () => {
    setPopoverIso(null);
    setReassignMode(false);
  };

  const assignModal =
    mounted &&
    popoverIso &&
    interactive &&
    createPortal(
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="assign-day-title"
      >
        <button
          type="button"
          className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
          aria-label="Close"
          onClick={closePopover}
        />
        <div className="relative z-10 w-full max-w-sm rounded-2xl border border-border bg-white p-4 shadow-2xl max-h-[min(90vh,640px)] flex flex-col overflow-hidden">
          <div className="flex items-start justify-between gap-3 mb-3 shrink-0">
            <div>
              <p id="assign-day-title" className="text-sm font-bold text-foreground">
                {showUndoPanel ? 'Assigned day' : 'Assign day'}
              </p>
              <p className="text-xs font-semibold text-teal-800 mt-1">
                E.C. · {formatEthiopianDate(popoverIso)}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                G.C. · {formatGregorianDate(popoverIso)}
              </p>
            </div>
            <button
              type="button"
              onClick={closePopover}
              className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-muted text-sm font-bold"
            >
              ✕
            </button>
          </div>

          {showUndoPanel && popoverExisting ? (
            <>
              <div className="rounded-lg border border-border/70 bg-muted/40 px-3 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Current event
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">{popoverExisting.label}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {DAY_MARK_OPTIONS.find((o) => o.value === popoverExisting.mark)?.label ??
                    popoverExisting.mark}
                </p>
              </div>
              <div className="mt-4 flex flex-col gap-2 shrink-0">
                <button
                  type="button"
                  onClick={clearAssignment}
                  className="w-full h-9 rounded-lg border border-red-200 bg-red-50 text-xs font-semibold text-red-800 hover:bg-red-100"
                >
                  Undo — remove event
                </button>
                <button
                  type="button"
                  onClick={() => setReassignMode(true)}
                  className="w-full h-9 rounded-lg border border-border text-xs font-semibold text-foreground hover:bg-muted"
                >
                  Change assignment
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="min-h-0 flex-1 overflow-y-auto pr-0.5">
                {popoverHoliday && (
                  <p className="mb-2 text-[11px] font-medium text-red-700 bg-red-50 rounded-md px-2.5 py-1.5">
                    National holiday: {popoverHoliday.label}
                    {popoverHolidayWeekday ? ' (weekday — school off)' : ' (weekend)'}
                  </p>
                )}
                {popoverActivity && popoverActivity.type !== 'holiday' && (
                  <p className="mb-2 text-[11px] font-medium text-foreground/80 bg-muted/60 rounded-md px-2.5 py-1.5">
                    MOE: {popoverActivity.label}
                  </p>
                )}

                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                  Day type
                </label>
                <div
                  role="listbox"
                  aria-label="Day type"
                  className="mt-1 max-h-56 overflow-y-auto rounded-lg border border-border bg-white divide-y divide-border/60"
                >
                  {DAY_MARK_OPTIONS.map((opt) => {
                    const selected = draftMark === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        role="option"
                        aria-selected={selected}
                        onClick={() => setDraftMark(opt.value)}
                        className={`w-full text-left px-3 py-2.5 text-sm transition-colors ${
                          selected
                            ? 'bg-teal-50 text-teal-900 font-semibold'
                            : 'text-foreground hover:bg-muted/60'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
                {draftMark === 'other' && (
                  <input
                    className="mt-2 w-full h-10 rounded-lg border border-border px-3 text-sm"
                    placeholder="Describe this day…"
                    value={draftLabel}
                    onChange={(e) => setDraftLabel(e.target.value)}
                    autoFocus
                  />
                )}
              </div>

              <div className="mt-4 flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={applyAssignment}
                  className="flex-1 h-9 rounded-lg bg-teal-700 text-white text-xs font-semibold hover:bg-teal-800"
                >
                  Apply
                </button>
                {popoverExisting ? (
                  <button
                    type="button"
                    onClick={() => setReassignMode(false)}
                    className="h-9 px-3 rounded-lg border border-border text-xs font-semibold text-muted-foreground hover:bg-muted"
                  >
                    Back
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={closePopover}
                    className="h-9 px-3 rounded-lg border border-border text-xs font-semibold text-muted-foreground hover:bg-muted"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>,
      document.body,
    );

  return (
    <div className={fill ? 'w-full' : 'w-full max-w-md mx-auto'}>
      <div className="rounded-2xl border border-border/60 bg-white shadow-sm overflow-visible">
        {/* Header — selected date left, Ethiopian month + nav right */}
        <div className="flex items-start justify-between gap-3 px-4 py-3 bg-white border-b border-border/50 rounded-t-2xl">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground/90 tracking-tight truncate">
              {headerEc ? `E.C. · ${headerEc}` : 'E.C. · …'}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
              {headerGc ? `G.C. · ${headerGc}` : 'G.C. · …'}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <div className="inline-flex flex-col rounded-lg border border-border/70 bg-white px-3 py-1.5 shadow-sm text-right">
              <span className="text-sm font-semibold text-foreground leading-tight">
                {monthLabelEc}
              </span>
              <span className="text-[10px] font-medium text-muted-foreground">{monthLabelGc}</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Previous Ethiopian month"
                disabled={Boolean(minKey && prevKey < minKey)}
                onClick={() => onMonthChange(prevMonth.year, prevMonth.month)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 bg-white text-muted-foreground hover:bg-muted/60 disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Next Ethiopian month"
                disabled={Boolean(maxKey && nextKey > maxKey)}
                onClick={() => onMonthChange(nextMonth.year, nextMonth.month)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 bg-white text-muted-foreground hover:bg-muted/60 disabled:opacity-30"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {minDate && (
          <p className="px-4 pt-2 pb-1 text-[10px] text-muted-foreground">
            Active from Nehase 25, 2018 E.C. (work start) · days before stay inactive
          </p>
        )}

        {/* Weekday headers */}
        <div className="grid grid-cols-7 px-3 pt-1">
          {WEEKDAYS.map((d) => (
            <div key={d} className="py-1.5 text-center text-xs font-bold text-foreground/80">
              {d}
            </div>
          ))}
        </div>

        {/* Day grid — after work start, all days are active (including adjacent-month cells) */}
        <div className="grid grid-cols-7 gap-y-1 px-2 sm:px-3 pb-4">
          {gridCells.map((cell) => {
            const assignment =
              assignmentForDay(assignments, cell.iso) ?? markFromEvents(events, cell.iso);
            const holiday = holidayForDay(events, cell.iso);
            const activity = activityForDay(events, cell.iso);
            const primary = events.length ? primaryEventForDay(events, cell.iso) : null;
            const isSelected = selectedDate === cell.iso || popoverIso === cell.iso;
            const markColors = assignment ? DAY_MARK_COLORS[assignment.mark] : null;
            const beforeWorkStart = Boolean(minDate && cell.iso < minDate);
            const afterWorkEnd = Boolean(maxDate && cell.iso > maxDate);
            const inactive = beforeWorkStart || afterWorkEnd;
            const holidayOnWeekday = Boolean(holiday && isWeekdayIso(cell.iso));
            const holidayOnWeekend = Boolean(holiday && !isWeekdayIso(cell.iso));

            let circleClass = 'text-foreground hover:bg-black/5';
            let subClass = 'text-muted-foreground';

            if (markColors && !inactive) {
              circleClass = `${markColors.bg} ${markColors.text} ring-1 ${markColors.ring ?? 'ring-black/5'}`;
              subClass = markColors.ec ?? 'opacity-70';
            } else if (holidayOnWeekday && !inactive) {
              circleClass = 'bg-red-100 text-red-800 ring-1 ring-red-200';
              subClass = 'text-red-700/80';
            } else if (holidayOnWeekend && !inactive) {
              circleClass = 'bg-white text-red-700 ring-1 ring-red-300';
              subClass = 'text-red-600';
            } else if (isSelected && !inactive) {
              circleClass = 'bg-teal-100 text-teal-900 ring-1 ring-teal-300';
              subClass = 'text-teal-800/80';
            } else if (activity && activity.type !== 'holiday' && !inactive) {
              const soft = ACTIVITY_SOFT[activity.type] ?? ACTIVITY_SOFT.moe;
              circleClass = soft.circle;
              subClass = soft.ec;
            } else if (
              primary &&
              primary.type !== 'moe' &&
              primary.type !== 'holiday' &&
              !inactive
            ) {
              circleClass = 'bg-muted/40 ring-1 ring-black/10 text-foreground';
            } else if (!cell.inMonth && !inactive) {
              circleClass = 'text-foreground/70 hover:bg-black/5';
              subClass = 'text-muted-foreground/80';
            }

            const caption =
              inactive
                ? null
                : holiday
                  ? shortHolidayLabel(holiday.label)
                  : assignment
                    ? shortActivityLabel(assignment.label)
                    : activity
                      ? shortActivityLabel(activity.label)
                      : null;

            const softCaption =
              activity && !holiday && !assignment
                ? (ACTIVITY_SOFT[activity.type] ?? ACTIVITY_SOFT.moe).caption
                : null;

            const captionClass = holiday
              ? 'text-red-600/90'
              : assignment
                ? 'text-foreground/70'
                : softCaption ?? 'text-muted-foreground';

            const canClick =
              !inactive && (interactive || Boolean(onSelectDate)) && isActiveWorkDay(cell.iso);

            return (
              <div
                key={`${cell.iso}-${cell.inMonth ? 'in' : 'out'}-${cell.day}`}
                className={`relative flex flex-col items-center justify-start pt-0.5 ${cellSize}`}
              >
                <button
                  type="button"
                  disabled={!canClick}
                  onClick={() => openPopover(cell.iso)}
                  title={[
                    `E.C. ${formatEthiopianDate(cell.iso)}`,
                    `G.C. ${formatGregorianDate(cell.iso)}`,
                    !cell.inMonth ? 'Adjacent month' : null,
                    beforeWorkStart ? 'Inactive — before work start (Nehase 25)' : null,
                    holiday?.label,
                    assignment?.label,
                    activity && activity.type !== 'holiday' ? activity.label : null,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                  className={[
                    'relative rounded-full flex flex-col items-center justify-center transition-transform',
                    circleSize,
                    canClick ? 'hover:scale-105 cursor-pointer' : 'cursor-default',
                    inactive ? 'opacity-30' : '',
                    beforeWorkStart ? 'grayscale' : '',
                    !cell.inMonth && !inactive ? 'opacity-80' : '',
                    circleClass,
                  ].join(' ')}
                >
                  {/* Primary: Ethiopian day number */}
                  <span className={`font-semibold leading-none ${dayText}`}>{cell.day}</span>
                  {/* Secondary: Gregorian date */}
                  <span className={`text-[7px] sm:text-[8px] mt-0.5 leading-none ${subClass}`}>
                    {shortGcLabel(cell.iso)}
                  </span>
                </button>

                {caption && (
                  <p
                    className={`mt-0.5 px-0.5 text-center text-[7px] sm:text-[8px] font-semibold leading-tight line-clamp-2 max-w-[3.75rem] sm:max-w-[4.5rem] ${captionClass}`}
                    title={holiday?.label || assignment?.label || activity?.label}
                  >
                    {caption}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {assignModal}

      {showLegend && (
        <div className="mt-3 flex flex-wrap gap-1.5 justify-center text-[10px] text-muted-foreground">
          See color key on the side.
        </div>
      )}
    </div>
  );
};
