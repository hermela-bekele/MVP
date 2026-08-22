import React from 'react';

/**
 * Variant → status semantics: success (approved/active/completed), warning
 * (pending/attention-needed), danger (rejected/inactive/overdue), info (in-progress/
 * informational), neutral (no strong status, default), primary (highlighted/featured,
 * not a status). Style: subtle (default — 10% fill, use for most status pills), solid
 * (high emphasis, use sparingly e.g. a single hero status), outline (low emphasis,
 * dense contexts like table cells). Never hand-roll a status pill with raw Tailwind
 * palette colors (e.g. bg-amber-100 text-amber-700) — use Badge so status colors stay
 * consistent with the success/warning/destructive tokens app-wide.
 */
type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary';
type BadgeStyle = 'solid' | 'outline' | 'subtle';
type BadgeSize = 'sm' | 'md';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  variant?: BadgeVariant;
  badgeStyle?: BadgeStyle;
  size?: BadgeSize;
  dot?: boolean;
  className?: string;
  /** Optional icon before the text */
  icon?: React.ReactNode;
}

const colorMap: Record<BadgeVariant, {
  solid: string;
  outline: string;
  subtle: string;
  dot: string;
}> = {
  primary: {
    solid: 'bg-primary text-primary-foreground',
    outline: 'border-primary/40 text-primary bg-transparent',
    subtle: 'bg-primary/10 text-primary',
    dot: 'bg-primary',
  },
  success: {
    solid: 'bg-success text-success-foreground',
    outline: 'border-success/40 text-success bg-transparent',
    subtle: 'bg-success/10 text-success',
    dot: 'bg-success',
  },
  warning: {
    solid: 'bg-warning text-warning-foreground',
    outline: 'border-warning/40 text-warning bg-transparent',
    subtle: 'bg-warning/10 text-warning',
    dot: 'bg-warning',
  },
  danger: {
    solid: 'bg-destructive text-destructive-foreground',
    outline: 'border-destructive/40 text-destructive bg-transparent',
    subtle: 'bg-destructive/10 text-destructive',
    dot: 'bg-destructive',
  },
  info: {
    solid: 'bg-primary/80 text-primary-foreground',
    outline: 'border-primary/30 text-primary bg-transparent',
    subtle: 'bg-sky-500/10 text-sky-600',
    dot: 'bg-sky-500',
  },
  neutral: {
    solid: 'bg-muted-foreground text-background',
    outline: 'border-border text-muted-foreground bg-transparent',
    subtle: 'bg-muted text-muted-foreground',
    dot: 'bg-muted-foreground',
  },
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  badgeStyle = 'subtle',
  size = 'sm',
  dot = false,
  icon,
  className = '',
  ...props
}) => {
  const baseStyle =
    'inline-flex items-center font-medium rounded-full transition-colors duration-200 whitespace-nowrap select-none';

  const borderStyle = badgeStyle === 'outline' ? 'border' : '';

  const sizeStyles: Record<BadgeSize, string> = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-2.5 py-1 text-xs gap-1.5',
  };

  const colors = colorMap[variant] ?? colorMap.neutral;

  return (
    <span
      className={`${baseStyle} ${borderStyle} ${sizeStyles[size]} ${colors[badgeStyle]} ${className}`}
      {...props}
    >
      {dot && (
        <span
          className={`inline-block w-1.5 h-1.5 rounded-full flex-shrink-0 ${colors.dot}`}
          aria-hidden="true"
        />
      )}
      {icon && (
        <span className="flex-shrink-0 [&>svg]:w-3 [&>svg]:h-3" aria-hidden="true">
          {icon}
        </span>
      )}
      {children}
    </span>
  );
};
