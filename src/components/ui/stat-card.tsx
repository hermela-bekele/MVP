'use client';

import React, { useEffect, useRef, useState } from 'react';

/* ───────────── Types ───────────── */

export interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    value: string; // e.g. "+12.5%"
  };
  icon?: React.ReactNode;
  color?: 'primary' | 'muted' | 'emphasis';
  className?: string;
}

/* ───────────── Animated counter hook ───────────── */

function useAnimatedNumber(target: number, duration = 800) {
  const [display, setDisplay] = useState(0);
  const rafId = useRef<number>(0);

  useEffect(() => {
    const start = performance.now();
    const from = 0;

    const step = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + (target - from) * eased));

      if (progress < 1) {
        rafId.current = requestAnimationFrame(step);
      }
    };

    rafId.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId.current);
  }, [target, duration]);

  return display;
}

/* ───────────── Trend arrow ───────────── */

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

/* ───────────── Component ───────────── */

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  icon,
  color = 'primary',
  className = '',
}) => {
  const numericValue = typeof value === 'number' ? value : null;
  const animatedValue = useAnimatedNumber(numericValue ?? 0);

  const iconBgColors = {
    primary: 'bg-primary/10 text-primary',
    muted: 'bg-muted text-muted-foreground',
    emphasis: 'bg-primary/5 text-primary',
  };

  return (
    <div
      className={`
        group relative rounded-lg border border-border bg-card text-card-foreground shadow-sm
        transition-all duration-300 hover:shadow-md hover:-translate-y-0.5
        ${className}
      `}
    >
      <div className="flex items-start justify-between p-4">
        {/* Left side */}
        <div className="flex flex-col min-w-0">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {title}
          </span>

          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold tabular-nums text-foreground sm:text-3xl">
              {numericValue !== null ? animatedValue.toLocaleString() : value}
            </span>
            {trend && <TrendIndicator direction={trend.direction} value={trend.value} />}
          </div>

          {subtitle && (
            <span className="mt-1 text-xs text-muted-foreground">{subtitle}</span>
          )}
        </div>

        {/* Icon */}
        {icon && (
          <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${iconBgColors[color]} transition-transform duration-300 group-hover:scale-110`}>
            <span className="h-5 w-5">{icon}</span>
          </div>
        )}
      </div>
    </div>
  );
};
