'use client';

import React from 'react';
import { Info } from 'lucide-react';
import { Tooltip } from '@/components/ui/tooltip';

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

/** The descriptive line under a page title used to always render as a permanently-visible
 * paragraph, which cluttered every page. It now shows only on hover, via a small info icon
 * next to the title, for a cleaner default look. */
function SubtitleInfo({ subtitle }: { subtitle: string }) {
  return (
    <Tooltip content={subtitle}>
      <Info
        className="h-4 w-4 shrink-0 text-muted-foreground/60 transition-colors hover:text-primary cursor-help"
        aria-label={subtitle}
      />
    </Tooltip>
  );
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
          <h1 className="flex items-center gap-2 text-xl sm:text-2xl font-bold leading-tight tracking-tight text-title">
            {title}
            {subtitle && <SubtitleInfo subtitle={subtitle} />}
          </h1>
          {hasActions && (
            <div className="flex shrink-0 flex-nowrap items-center gap-2">{headerActions}</div>
          )}
        </div>
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
        <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight text-title sm:text-2xl">
          {title}
          {subtitle && <SubtitleInfo subtitle={subtitle} />}
        </h1>
      </div>
      {hasActions && (
        <div className="flex shrink-0 flex-nowrap items-center gap-2">{headerActions}</div>
      )}
    </div>
  );
};
