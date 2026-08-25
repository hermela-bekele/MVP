'use client';

import React from 'react';

/** Consistent label + input styling for plain modal forms (no floating-label behavior —
 * for that, use `Input` from `./input`). Keeps hand-rolled dialog forms (MOE, school-head)
 * from re-declaring the same long className string on every field. */
export const formFieldInputClass =
  'w-full h-10 px-3 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground/70 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring';

export const formFieldLabelClass = 'text-xs font-semibold text-foreground/80';

export function FormField({
  label,
  htmlFor,
  children,
  className = '',
}: {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label htmlFor={htmlFor} className={formFieldLabelClass}>
        {label}
      </label>
      {children}
    </div>
  );
}

export function FormSectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-bold uppercase tracking-wide text-primary/80 border-b border-border/60 pb-1.5 mb-1">
      {children}
    </p>
  );
}
