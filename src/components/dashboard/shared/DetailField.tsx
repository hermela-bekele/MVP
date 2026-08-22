'use client';

import React from 'react';

/**
 * Shared "record field" primitive for detail/view pages — label above value, with
 * an optional icon tile. Use this instead of a local InfoField/DetailRow helper so
 * every portal's employee/student/application detail page renders fields the same
 * way. Omit `icon` for a plain label/value row (matches the old icon-less DetailRow
 * usage); pass `icon` for the bordered icon-tile treatment (matches the old HR
 * InfoField usage).
 */
export function DetailField({
  icon,
  label,
  value,
  tone = 'default',
  className = '',
}: {
  icon?: React.ReactNode;
  label: string;
  value: React.ReactNode;
  tone?: 'default' | 'success' | 'danger';
  className?: string;
}) {
  if (!icon) {
    return (
      <div className={`space-y-0.5 ${className}`}>
        <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="text-xs font-medium text-foreground">{value ?? '—'}</p>
      </div>
    );
  }

  const iconTone =
    tone === 'success'
      ? 'bg-success/10 text-success'
      : tone === 'danger'
        ? 'bg-destructive/10 text-destructive'
        : 'bg-primary/10 text-primary';

  return (
    <div className={`flex items-start gap-3 rounded-lg border border-border/60 bg-muted/20 p-3.5 ${className}`}>
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconTone}`}>
        <span className="[&>svg]:h-4 [&>svg]:w-4">{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
        <div className="text-sm font-semibold text-foreground truncate">{value}</div>
      </div>
    </div>
  );
}

/**
 * Standard detail-page width, applied consistently across view and edit modes so a
 * record's page doesn't reflow width when toggling modes (previously HR went
 * 4xl→3xl, Registrar 3xl→2xl between view/edit — both bugs, fixed by sharing this).
 */
export function DetailPageContainer({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`max-w-4xl space-y-5 ${className}`}>{children}</div>;
}
