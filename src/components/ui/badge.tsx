import React from 'react';

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
    solid: 'bg-primary text-primary-foreground',
    outline: 'border-primary/40 text-primary bg-transparent',
    subtle: 'bg-primary/10 text-primary',
    dot: 'bg-primary',
  },
  warning: {
    solid: 'bg-amber-500 text-white',
    outline: 'border-amber-500/40 text-amber-700 bg-transparent',
    subtle: 'bg-amber-500/10 text-amber-700',
    dot: 'bg-amber-500',
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
