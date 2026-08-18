'use client';

import React from 'react';

/** One-line-per-item textarea, matching the "Content (one per line)" convention
 * already used across the app's AI plan editing surfaces. */
export function EditableList({
  items,
  onChange,
  placeholder,
}: {
  items: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}) {
  return (
    <textarea
      className="w-full min-w-[140px] resize-y rounded-sm border border-dashed border-foreground/40 bg-background/60 px-1 py-0.5 text-[11px] leading-snug focus:border-solid focus:border-primary focus:outline-none"
      rows={Math.max(2, items.length)}
      value={items.join('\n')}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value.split('\n'))}
      onBlur={(e) => onChange(e.target.value.split('\n').map((s) => s.trim()).filter(Boolean))}
    />
  );
}

/** Multi-line textarea for a single free-text field (as opposed to EditableList's
 * one-item-per-line array). */
export function EditableTextarea({
  value,
  onChange,
  rows = 2,
}: {
  value: string;
  onChange: (next: string) => void;
  rows?: number;
}) {
  return (
    <textarea
      className="w-full min-w-[140px] resize-y rounded-sm border border-dashed border-foreground/40 bg-background/60 px-1 py-0.5 text-[11px] leading-snug focus:border-solid focus:border-primary focus:outline-none"
      rows={rows}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export function EditableText({
  value,
  onChange,
  className = '',
}: {
  value: string;
  onChange: (next: string) => void;
  className?: string;
}) {
  return (
    <input
      type="text"
      className={`w-full min-w-[60px] rounded-sm border border-dashed border-foreground/40 bg-background/60 px-1 py-0.5 text-center text-[11px] focus:border-solid focus:border-primary focus:outline-none ${className}`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export function EditableNumber({
  value,
  onChange,
}: {
  value: number;
  onChange: (next: number) => void;
}) {
  return (
    <input
      type="number"
      min={0}
      className="w-12 rounded-sm border border-dashed border-foreground/40 bg-background/60 px-1 py-0.5 text-center text-[11px] focus:border-solid focus:border-primary focus:outline-none"
      value={value}
      onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
    />
  );
}
