'use client';

import React from 'react';
import { DAY_MARK_LEGEND } from '@/lib/calendarDayMarks';

/** Fixed MOE / holiday colors plus school day-mark colors. */
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
  { key: 'class', label: 'Class / MOE activity', swatch: 'bg-primary/10 ring-1 ring-primary/25' },
  { key: 'moe', label: 'Other MOE activity', swatch: 'bg-slate-100 ring-1 ring-slate-200' },
  ...DAY_MARK_LEGEND.map((item) => ({
    key: item.mark,
    label: item.label,
    swatch: item.className.replace(/\btext-\S+/g, '').trim(),
  })),
];

export const CalendarColorLegend: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <aside
      className={`rounded-2xl border border-border/60 bg-card p-4 sm:p-5 h-fit sticky top-4 ${className}`}
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
        Color key
      </p>
      <h3 className="text-sm font-bold text-title mt-1 mb-4">What each color means</h3>
      <ul className="space-y-2.5 max-h-[70vh] overflow-y-auto pr-1">
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
