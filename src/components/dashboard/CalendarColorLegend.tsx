'use client';

import React from 'react';

/** Single source of truth — one soft-color description per meaning. */
export const CALENDAR_COLOR_LEGEND: {
  key: string;
  label: string;
  swatch: string;
}[] = [
  { key: 'holiday-weekday', label: 'Holiday (weekday — school off)', swatch: 'bg-red-100 ring-1 ring-red-200' },
  {
    key: 'holiday-weekend',
    label: 'Holiday (weekend)',
    swatch: 'bg-white ring-1 ring-red-300',
  },
  { key: 'exam', label: 'Exam / mid exam start', swatch: 'bg-sky-100 ring-1 ring-sky-200' },
  { key: 'mid-exam-end', label: 'Mid exam end', swatch: 'bg-sky-50 ring-1 ring-sky-300' },
  { key: 'quarter-end', label: 'Quarter end', swatch: 'bg-violet-50 ring-1 ring-violet-200' },
  { key: 'quarter-break', label: 'Quarter break', swatch: 'bg-amber-50 ring-1 ring-amber-200' },
  { key: 'semester-break', label: 'Semester break', swatch: 'bg-orange-50 ring-1 ring-orange-200' },
  { key: 'semester-final-start', label: 'Semester final start', swatch: 'bg-teal-50 ring-1 ring-teal-200' },
  { key: 'semester-final-end', label: 'Semester final end', swatch: 'bg-teal-50 ring-1 ring-teal-300' },
  { key: 'class', label: 'Class / MOE activity', swatch: 'bg-blue-50 ring-1 ring-blue-200' },
  { key: 'moe', label: 'Other MOE activity', swatch: 'bg-slate-100 ring-1 ring-slate-200' },
  { key: 'other', label: 'Other / custom', swatch: 'bg-rose-50 ring-1 ring-rose-200' },
];

export const CalendarColorLegend: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <aside
      className={`rounded-2xl border border-border/60 bg-card p-4 sm:p-5 h-fit sticky top-4 ${className}`}
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
        Color key
      </p>
      <h3 className="text-sm font-bold text-foreground mt-1 mb-4">What each color means</h3>
      <ul className="space-y-2.5">
        {CALENDAR_COLOR_LEGEND.map((item) => (
          <li key={item.key} className="flex items-center gap-3">
            <span
              className={`h-5 w-5 shrink-0 rounded-full ${item.swatch}`}
              aria-hidden
            />
            <span className="text-xs font-medium text-foreground/90 leading-snug">{item.label}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
};
