'use client';

import React, { useEffect, useRef, useState } from 'react';

/** Green & white KPI variants */
const toneStyles = {
  default: {
    card: 'bg-card text-card-foreground border-border',
    icon: 'bg-primary/10 text-primary',
    label: 'text-muted-foreground',
    value: 'text-foreground',
    hint: 'text-muted-foreground',
  },
  muted: {
    card: 'bg-card text-card-foreground border-border',
    icon: 'bg-muted text-muted-foreground',
    label: 'text-muted-foreground',
    value: 'text-foreground',
    hint: 'text-muted-foreground',
  },
  emphasis: {
    card: 'bg-primary/5 text-card-foreground border-primary/20',
    icon: 'bg-white text-primary border border-primary/20 shadow-sm',
    label: 'text-muted-foreground',
    value: 'text-foreground',
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

function useAnimatedNumber(target: number, enabled: boolean, duration = 800) {
  const [display, setDisplay] = useState(enabled ? 0 : target);
  const rafId = useRef<number>(0);

  useEffect(() => {
    if (!enabled) {
      setDisplay(target);
      return;
    }
    const start = performance.now();
    const step = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setDisplay(Math.round(target * eased));
      if (progress < 1) {
        rafId.current = requestAnimationFrame(step);
      }
    };
    rafId.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId.current);
  }, [target, duration, enabled]);

  return display;
}

const TrendIndicator: React.FC<{ direction: 'up' | 'down' | 'neutral'; value: string }> = ({
  direction,
  value,
}) => {
  const colors = {
    up: 'text-primary',
    down: 'text-muted-foreground',
    neutral: 'text-muted-foreground',
  };

  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${colors[direction]}`}>
      {direction === 'up' && (
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 15l7-7 7 7" />
        </svg>
      )}
      {direction === 'down' && (
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
        </svg>
      )}
      {direction === 'neutral' && (
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 12h14" />
        </svg>
      )}
      {value}
    </span>
  );
};

export interface KpiWidgetProps {
  label: string;
  value: string | number;
  hint?: string;
  icon?: React.ReactNode;
  tone?: KpiTone;
  /** Up/down/neutral delta shown next to the value, e.g. { direction: 'up', value: '+12.5%' } */
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    value: string;
  };
  /** Animate numeric values counting up from 0 on mount */
  animated?: boolean;
  className?: string;
}

/**
 * The single metric-tile component for the app — use for every KPI/stat card
 * across every portal instead of a one-off card. Pair with KpiGrid for the layout.
 */
export const KpiWidget: React.FC<KpiWidgetProps> = ({
  label,
  value,
  hint,
  icon,
  tone = 'default',
  trend,
  animated = false,
  className = '',
}) => {
  const styles = toneStyles[tone];
  const numericValue = typeof value === 'number' ? value : null;
  const animatedValue = useAnimatedNumber(numericValue ?? 0, animated && numericValue !== null);

  return (
    <div
      className={`group relative overflow-hidden rounded-lg border p-4 transition-all duration-300 hover:shadow-md hover:scale-[1.02] ${styles.card} ${className}`}
    >
      {/* Gradient accent line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-primary opacity-60" />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1.5">
          <p className={`text-xs font-semibold leading-snug sm:text-sm ${styles.label}`}>{label}</p>
          <div className="flex items-baseline gap-2">
            <p className={`text-2xl font-bold tabular-nums transition-colors ${styles.value}`}>
              {numericValue !== null ? animatedValue.toLocaleString() : value}
            </p>
            {trend && <TrendIndicator direction={trend.direction} value={trend.value} />}
          </div>
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
