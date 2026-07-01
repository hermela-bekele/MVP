'use client';

import React from 'react';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  actions?: React.ReactNode;
  subtitleActions?: React.ReactNode;
  /** Educator portal — large hero header without bottom rule */
  variant?: 'default' | 'portal';
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  eyebrow,
  actions,
  subtitleActions,
  variant = 'default',
}) => {
  if (variant === 'portal') {
    return (
      <div className="mb-6 flex w-full flex-col gap-4 animate-fade-in">
        {eyebrow && (
          <p className="text-[11px] font-bold uppercase tracking-widest text-ais-primary flex items-center gap-2 animate-fade-in-down">
            <span className="inline-block h-px w-6 bg-gradient-to-r from-ais-primary to-transparent" />
            {eyebrow}
          </p>
        )}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-xl sm:text-2xl font-bold leading-tight tracking-tight bg-gradient-to-r from-ais-on-surface to-ais-on-surface-variant bg-clip-text text-transparent">
            {title}
          </h1>
          {actions && (
            <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
          )}
        </div>
        {subtitle && (
          <div className="flex w-full items-center justify-between gap-4">
            <p className="max-w-2xl text-xs sm:text-sm leading-6 text-ais-on-surface-variant">{subtitle}</p>
            {subtitleActions && (
              <div className="flex shrink-0 items-center">{subtitleActions}</div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mb-6 flex flex-col gap-4 border-b border-border/60 pb-5 sm:flex-row sm:items-end sm:justify-between relative animate-fade-in-up">
      {/* Gradient blur background */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 blur-3xl -z-10" />
      
      <div className="min-w-0 space-y-1.5 relative">
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-wide text-primary flex items-center gap-2 animate-fade-in-down">
            <span className="inline-block h-0.5 w-8 bg-gradient-to-r from-primary to-accent rounded-full" />
            {eyebrow}
          </p>
        )}
        <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
};
