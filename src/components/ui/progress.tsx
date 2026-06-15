import React from 'react';

/* ─── LinearProgress ───────────────────────────────────────────── */

type ProgressColor = 'primary' | 'accent' | 'success' | 'warning' | 'destructive';

interface LinearProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  color?: ProgressColor;
  label?: string;
  showValue?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const linearColors: Record<ProgressColor, string> = {
  primary: 'bg-primary',
  accent: 'bg-accent',
  success: 'bg-primary',
  warning: 'bg-amber-500',
  destructive: 'bg-destructive',
};

const linearTrackSizes: Record<string, string> = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
};

export const LinearProgress: React.FC<LinearProgressProps> = ({
  value = 0,
  max = 100,
  color = 'primary',
  label,
  showValue = false,
  size = 'md',
  className = '',
  ...props
}) => {
  const clamped = Math.min(Math.max(value, 0), max);
  const percent = Math.round((clamped / max) * 100);

  return (
    <div className={`w-full ${className}`} {...props}>
      {(label || showValue) && (
        <div className="flex items-center justify-between mb-1.5">
          {label && <span className="text-xs font-medium text-foreground">{label}</span>}
          {showValue && <span className="text-xs font-medium text-muted-foreground">{percent}%</span>}
        </div>
      )}
      <div
        className={`w-full ${linearTrackSizes[size]} bg-muted rounded-full overflow-hidden`}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label || 'Progress'}
      >
        <div
          className={`${linearTrackSizes[size]} ${linearColors[color]} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
};

/* ─── CircularProgress ─────────────────────────────────────────── */

interface CircularProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  color?: ProgressColor;
  showValue?: boolean;
  label?: string;
  strokeClassName?: string;
  trackClassName?: string;
  valueClassName?: string;
  className?: string;
}

const circularStrokeColors: Record<ProgressColor, string> = {
  primary: 'stroke-primary',
  accent: 'stroke-accent',
  success: 'stroke-emerald-500',
  warning: 'stroke-amber-500',
  destructive: 'stroke-destructive',
};

export const CircularProgress: React.FC<CircularProgressProps> = ({
  value = 0,
  max = 100,
  size = 48,
  strokeWidth = 4,
  color = 'primary',
  showValue = true,
  label,
  strokeClassName,
  trackClassName,
  valueClassName,
  className = '',
  ...props
}) => {
  const clamped = Math.min(Math.max(value, 0), max);
  const percent = Math.round((clamped / max) * 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <div
      className={`inline-flex items-center justify-center relative ${className}`}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label || 'Progress'}
      {...props}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
      >
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          className={trackClassName ?? 'stroke-muted'}
          strokeWidth={strokeWidth}
        />
        {/* Fill */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          className={strokeClassName ?? circularStrokeColors[color]}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
        />
      </svg>

      {showValue && (
        <span
          className={`absolute font-semibold select-none ${valueClassName ?? 'text-foreground'}`}
          style={{ fontSize: size * 0.24 }}
        >
          {percent}%
        </span>
      )}
    </div>
  );
};

/* ─── StepProgress ─────────────────────────────────────────────── */

interface Step {
  label: string;
  description?: string;
}

interface StepProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  steps: Step[];
  currentStep: number;
  color?: ProgressColor;
  className?: string;
}

const stepActiveColors: Record<ProgressColor, string> = {
  primary: 'bg-primary text-primary-foreground border-primary',
  accent: 'bg-accent text-accent-foreground border-accent',
  success: 'bg-emerald-500 text-white border-emerald-500',
  warning: 'bg-amber-500 text-white border-amber-500',
  destructive: 'bg-destructive text-destructive-foreground border-destructive',
};

const stepCompletedColors: Record<ProgressColor, string> = {
  primary: 'bg-primary/15 text-primary border-primary/40',
  accent: 'bg-accent/15 text-accent border-accent/40',
  success: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/40',
  warning: 'bg-amber-500/15 text-amber-600 border-amber-500/40',
  destructive: 'bg-destructive/15 text-destructive border-destructive/40',
};

const stepLineColors: Record<ProgressColor, string> = {
  primary: 'bg-primary/30',
  accent: 'bg-accent/30',
  success: 'bg-emerald-500/30',
  warning: 'bg-amber-500/30',
  destructive: 'bg-destructive/30',
};

const stepLineActiveColors: Record<ProgressColor, string> = {
  primary: 'bg-primary',
  accent: 'bg-accent',
  success: 'bg-primary',
  warning: 'bg-amber-500',
  destructive: 'bg-destructive',
};

export const StepProgress: React.FC<StepProgressProps> = ({
  steps,
  currentStep,
  color = 'primary',
  className = '',
  ...props
}) => {
  return (
    <div
      className={`w-full ${className}`}
      role="navigation"
      aria-label="Progress steps"
      {...props}
    >
      <ol className="flex items-center w-full">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isLast = index === steps.length - 1;

          return (
            <li
              key={index}
              className={`flex items-center ${isLast ? '' : 'flex-1'}`}
            >
              <div className="flex flex-col items-center gap-1.5 min-w-0">
                {/* Step circle */}
                <div
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center
                    text-xs font-semibold border-2
                    transition-all duration-300 flex-shrink-0
                    ${isCurrent
                      ? stepActiveColors[color]
                      : isCompleted
                      ? stepCompletedColors[color]
                      : 'bg-muted text-muted-foreground border-border'
                    }
                  `}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  {isCompleted ? (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </div>

                {/* Label */}
                <span
                  className={`text-xs font-medium text-center leading-tight max-w-[80px] truncate ${
                    isCurrent
                      ? 'text-foreground'
                      : isCompleted
                      ? 'text-muted-foreground'
                      : 'text-muted-foreground/60'
                  }`}
                  title={step.label}
                >
                  {step.label}
                </span>

                {step.description && (
                  <span className="text-[10px] text-muted-foreground/50 text-center max-w-[80px] truncate hidden sm:block">
                    {step.description}
                  </span>
                )}
              </div>

              {/* Connector line */}
              {!isLast && (
                <div
                  className={`flex-1 h-0.5 mx-3 rounded-full transition-colors duration-300 ${
                    isCompleted ? stepLineActiveColors[color] : stepLineColors[color]
                  }`}
                  style={{ marginTop: '-1.25rem' }}
                />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
};
