'use client';

import React from 'react';

/** Green & white KPI variants */
const toneStyles = {
  default: {
    card: 'bg-card text-card-foreground border-border',
    icon: 'bg-primary/10 text-primary',
    label: 'text-foreground',
    value: 'text-muted-foreground',
    hint: 'text-muted-foreground',
  },
  emphasis: {
    card: 'bg-primary/5 text-card-foreground border-primary/20',
    icon: 'bg-white text-primary border border-primary/20 shadow-sm',
    label: 'text-foreground',
    value: 'text-muted-foreground',
    hint: 'text-primary/80',
  },
  inverse: {
    card: 'bg-primary text-primary-foreground border-primary',
    icon: 'bg-white/20 text-primary-foreground',
    label: 'text-primary-foreground',
    value: 'text-primary-foreground/85',
    hint: 'text-primary-foreground/70',
  },
} as const;

export type KpiTone = keyof typeof toneStyles;

export interface KpiWidgetProps {
  label: string;
  value: string | number;
  hint?: string;
  icon?: React.ReactNode;
  tone?: KpiTone;
  className?: string;
}

export const KpiWidget: React.FC<KpiWidgetProps> = ({
  label,
  value,
  hint,
  icon,
  tone = 'default',
  className = '',
}) => {
  const styles = toneStyles[tone];

  return (
    <div
      className={`group relative overflow-hidden rounded-lg border p-4 transition-all duration-300 hover:shadow-md hover:scale-[1.02] ${styles.card} ${className}`}
    >
      {/* Gradient accent line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-primary opacity-60" />
      
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1.5">
          <p className={`text-xs font-semibold leading-snug sm:text-sm ${styles.label}`}>{label}</p>
          <p className={`text-2xl font-bold tabular-nums transition-colors ${styles.value}`}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {hint && <p className={`text-xs ${styles.hint}`}>{hint}</p>}
        </div>
        {icon && (
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm transition-transform duration-300 group-hover:scale-110 ${styles.icon}`}
          >
            {icon}
          </div>
        )}
      </div>
      
      {/* Animated pulse indicator */}
      <div className="absolute bottom-2 right-2 h-1.5 w-1.5 rounded-full bg-primary/40 animate-pulse" />
    </div>
  );
};

export const KpiGrid: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => (
  <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 ${className}`}>
    {children}
  </div>
);
