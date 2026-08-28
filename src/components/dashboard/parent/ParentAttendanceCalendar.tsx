'use client';

import React, { useMemo, useState } from 'react';
import { ContentCard } from '@/components/dashboard/ContentCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export type AttendanceLog = {
  id?: string;
  date: string;
  status: string;
  remarks?: string | null;
};

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function statusDot(status?: string) {
  if (status === 'Present') return 'bg-primary shadow-sm shadow-primary/30';
  if (status === 'Late') return 'bg-warning';
  if (status === 'Absent') return 'bg-destructive';
  return 'bg-transparent';
}

function normalizeDate(raw: string) {
  return String(raw).slice(0, 10);
}

export function ParentAttendanceCalendar({
  childName,
  logs,
}: {
  childName: string;
  logs: AttendanceLog[];
}) {
  const initial = useMemo(() => {
    const first = logs[0]?.date ? new Date(normalizeDate(logs[0].date)) : new Date(2026, 4, 1);
    if (Number.isNaN(first.getTime())) return { y: 2026, m: 4 };
    return { y: first.getFullYear(), m: first.getMonth() };
  }, [logs]);

  const [year, setYear] = useState(initial.y);
  const [month, setMonth] = useState(initial.m);

  const byDate = useMemo(() => {
    const map = new Map<string, AttendanceLog>();
    for (const log of logs) {
      map.set(normalizeDate(log.date), log);
    }
    return map;
  }, [logs]);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startWeekday = new Date(year, month, 1).getDay();
  const monthLabel = new Date(year, month, 1).toLocaleString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const cells: Array<{ day: number | null; log?: AttendanceLog }> = [];
  for (let i = 0; i < startWeekday; i++) cells.push({ day: null });
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    cells.push({ day, log: byDate.get(dateStr) });
  }

  const present = logs.filter((l) => l.status === 'Present').length;
  const late = logs.filter((l) => l.status === 'Late').length;
  const absent = logs.filter((l) => l.status === 'Absent').length;

  const shiftMonth = (delta: number) => {
    const d = new Date(year, month + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border/70 bg-card px-4 py-3 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Present</p>
          <p className="mt-1 text-2xl font-bold text-primary">{present}</p>
        </div>
        <div className="rounded-xl border border-border/70 bg-card px-4 py-3 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Late</p>
          <p className="mt-1 text-2xl font-bold text-warning">{late}</p>
        </div>
        <div className="rounded-xl border border-border/70 bg-card px-4 py-3 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Absent</p>
          <p className="mt-1 text-2xl font-bold text-destructive">{absent}</p>
        </div>
      </div>

      <ContentCard
        title="Attendance calendar"
        description={`Daily presence for ${childName}`}
        actions={
          <div className="flex items-center gap-1">
            <Button type="button" size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => shiftMonth(-1)}>
              ‹
            </Button>
            <span className="min-w-[9.5rem] text-center text-xs font-semibold text-foreground">{monthLabel}</span>
            <Button type="button" size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => shiftMonth(1)}>
              ›
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-primary" /> Present
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-warning" /> Late
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-destructive" /> Absent
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full border border-border bg-muted/40" /> No record
            </span>
          </div>

          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {WEEKDAYS.map((d) => (
              <div key={d} className="py-1 text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {d}
              </div>
            ))}
            {cells.map((cell, idx) => {
              if (cell.day == null) {
                return <div key={`e-${idx}`} className="aspect-square rounded-lg bg-transparent" />;
              }
              const log = cell.log;
              return (
                <div
                  key={cell.day}
                  title={log ? `${log.status}${log.remarks ? `: ${log.remarks}` : ''}` : 'No record'}
                  className={`aspect-square rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                    log
                      ? 'border-primary/15 bg-gradient-to-b from-primary/[0.06] to-card shadow-sm'
                      : 'border-border/50 bg-muted/20'
                  }`}
                >
                  <span className="text-[11px] font-semibold text-foreground sm:text-xs">{cell.day}</span>
                  <span className={`h-2 w-2 rounded-full ${statusDot(log?.status)}`} />
                </div>
              );
            })}
          </div>

          {logs.length > 0 && (
            <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Recent entries</p>
              <div className="max-h-40 space-y-1.5 overflow-y-auto">
                {[...logs]
                  .sort((a, b) => normalizeDate(b.date).localeCompare(normalizeDate(a.date)))
                  .slice(0, 8)
                  .map((log, i) => (
                    <div key={log.id || `${log.date}-${i}`} className="flex items-center justify-between gap-2 text-xs">
                      <span className="text-muted-foreground">{normalizeDate(log.date)}</span>
                      <Badge
                        variant={
                          log.status === 'Present' ? 'success' : log.status === 'Late' ? 'warning' : 'danger'
                        }
                      >
                        {log.status}
                      </Badge>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </ContentCard>
    </div>
  );
}
