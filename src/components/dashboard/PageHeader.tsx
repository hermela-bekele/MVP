'use client';

import React from 'react';

export interface PageHeaderProps {
  title: string;
  /** @deprecated Ignored — page helper blurbs removed for a cleaner UI */
  subtitle?: string;
  eyebrow?: string;
  actions?: React.ReactNode;
  subtitleActions?: React.ReactNode;
  /** Educator portal — large hero header without bottom rule */
  variant?: 'default' | 'portal';
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
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
      <div className="mb-6 flex w-full flex-col gap-4 animate-fade-in">
        {eyebrow && (
          <p className="text-[11px] font-bold uppercase tracking-widest text-ais-primary flex items-center gap-2 animate-fade-in-down">
            <span className="inline-block h-px w-6 bg-gradient-to-r from-ais-primary to-transparent" />
            {eyebrow}
          </p>
        )}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-xl sm:text-2xl font-bold leading-tight tracking-tight text-title">
            {title}
          </h1>
          {hasActions && (
            <div className="flex shrink-0 flex-nowrap items-center gap-2">{headerActions}</div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 flex flex-col gap-4 border-b border-border/60 pb-5 sm:flex-row sm:items-end sm:justify-between relative animate-fade-in-up">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 blur-3xl -z-10" />

      <div className="min-w-0 space-y-1.5 relative">
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-wide text-primary flex items-center gap-2 animate-fade-in-down">
            <span className="inline-block h-0.5 w-8 bg-gradient-to-r from-primary to-accent rounded-full" />
            {eyebrow}
          </p>
        )}
        <h1 className="text-xl font-bold tracking-tight text-title sm:text-2xl">
          {title}
        </h1>
      </div>
      {hasActions && (
        <div className="flex shrink-0 flex-nowrap items-center gap-2">{headerActions}</div>
      )}
    </div>
  );
};
