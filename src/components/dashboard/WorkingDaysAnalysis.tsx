'use client';

import React from 'react';
import {
  ACADEMIC_YEAR_TOTAL_DAYS,
  SEMESTER_1_TOTAL,
  SEMESTER_2_TOTAL,
  WORKING_DAYS_SEMESTER_1,
  WORKING_DAYS_SEMESTER_2,
} from '@/lib/moeCalendarData';

export const WorkingDaysAnalysis: React.FC = () => {
  const maxDays = Math.max(
    ...WORKING_DAYS_SEMESTER_1.map((m) => m.days),
    ...WORKING_DAYS_SEMESTER_2.map((m) => m.days),
  );

  return (
    <section className="rounded-2xl border border-border/60 bg-gradient-to-br from-slate-50 via-white to-teal-50/40 overflow-hidden">
      <div className="px-6 py-5 border-b border-border/40 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-teal-700/80">
            Working days analysis
          </p>
          <h3 className="text-lg font-bold text-foreground mt-1">Instructional calendar load</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-xl">
            Official MOE working-day distribution across Ethiopian months for the academic year.
          </p>
        </div>
        <div className="flex items-baseline gap-2 rounded-xl bg-teal-700 text-white px-4 py-3 shadow-sm">
          <span className="text-3xl font-bold tabular-nums leading-none">{ACADEMIC_YEAR_TOTAL_DAYS}</span>
          <span className="text-xs font-medium opacity-90">total days</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 lg:divide-x divide-border/40">
        <SemesterColumn
          title="Semester I"
          total={SEMESTER_1_TOTAL}
          months={WORKING_DAYS_SEMESTER_1}
          maxDays={maxDays}
          accent="from-sky-500 to-teal-600"
        />
        <SemesterColumn
          title="Semester II"
          total={SEMESTER_2_TOTAL}
          months={WORKING_DAYS_SEMESTER_2}
          maxDays={maxDays}
          accent="from-teal-600 to-emerald-600"
        />
      </div>
    </section>
  );
};

function SemesterColumn({
  title,
  total,
  months,
  maxDays,
  accent,
}: {
  title: string;
  total: number;
  months: { key: string; label: string; days: number }[];
  maxDays: number;
  accent: string;
}) {
  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-foreground">{title}</h4>
        <span className="text-xs font-semibold tabular-nums text-muted-foreground">
          <span className="text-foreground text-base font-bold">{total}</span> days
        </span>
      </div>
      <ul className="space-y-3">
        {months.map((m) => {
          const pct = Math.round((m.days / maxDays) * 100);
          return (
            <li key={m.key} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground/90">{m.label}</span>
                <span className="tabular-nums font-bold text-foreground">{m.days}</span>
              </div>
              <div className="h-2 rounded-full bg-slate-200/70 overflow-hidden">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${accent} transition-all duration-500`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
