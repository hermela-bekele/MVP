'use client';

import React from 'react';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  actions?: React.ReactNode;
  subtitleActions?: React.ReactNode;
  /**
   * 'default' — standard page header with a bottom rule (border-b), used by most
   * list/detail pages. 'portal' — large hero header, no bottom rule, for portal
   * landing/tab pages that want a softer, more spacious top-of-page treatment.
   */
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
  const headerActions = (
    <>
      {subtitleActions}
      {actions}
    </>
  );
  const hasActions = Boolean(actions || subtitleActions);

  if (variant === 'portal') {
    return (
      <div className="mb-4 flex w-full flex-col gap-3 animate-fade-in">
        {eyebrow && (
          <p className="text-[11px] font-bold uppercase tracking-widest text-primary flex items-center gap-2 animate-fade-in-down">
            <span className="inline-block h-px w-6 bg-gradient-to-r from-primary to-transparent" />
            {eyebrow}
          </p>
        )}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-xl sm:text-2xl font-bold leading-tight tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            {title}
          </h1>
          {hasActions && (
            <div className="flex shrink-0 flex-nowrap items-center gap-2">{headerActions}</div>
          )}
        </div>
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
    );
  }

  return (
    <div className="mb-4 flex flex-col gap-3 border-b border-border/60 pb-4 sm:flex-row sm:items-end sm:justify-between relative animate-fade-in-up">
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
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {hasActions && (
        <div className="flex shrink-0 flex-nowrap items-center gap-2">{headerActions}</div>
      )}
    </div>
  );
};
