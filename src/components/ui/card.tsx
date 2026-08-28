import React from 'react';

/**
 * Radius tiers (app-wide convention, not enforced by types): rounded-md for small
 * inline elements (inputs, small buttons, table-row pills), rounded-lg (this
 * component's default, matches --radius) for standard cards/panels/sections,
 * rounded-xl for elevated content blocks that need more visual weight (detail-page
 * info sections, modal surfaces), rounded-2xl reserved for modals/dialogs only
 * (see dialog.tsx). Prefer importing Card/CardHeader/CardTitle/CardContent over
 * hand-rolling `rounded-lg border bg-card` divs — that duplication is the largest
 * source of visual drift found in the audit.
 */
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  glass?: boolean;
  glow?: boolean;
  hoverGlow?: boolean;
  interactive?: boolean;
  accent?: 'primary' | 'accent' | 'ethiopia' | 'none';
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  glass = false,
  glow = false,
  hoverGlow = false,
  interactive = false,
  accent = 'none',
  ...props
}) => {
  const baseStyle = 'rounded-lg border border-border/80 p-5 text-card-foreground bg-card shadow-sm transition-all duration-200 eskooly-panel';
  
  const glassStyle = glass ? 'glass shadow-md' : '';
  const glowStyle = glow 
    ? accent === 'primary' 
      ? 'glow-primary border-primary/20' 
      : accent === 'accent'
      ? 'glow-accent border-accent/20'
      : accent === 'ethiopia'
      ? 'ethiopia-glow'
      : 'shadow-lg' 
    : '';

  const hoverStyle = hoverGlow || interactive
    ? 'hover:shadow-md hover:border-muted-foreground/30 hover:-translate-y-0.5 cursor-pointer active:scale-[0.99]' 
    : '';

  const accentBorder = 
    accent === 'primary'
      ? 'border-t-4 border-t-primary'
      : accent === 'accent'
      ? 'border-t-4 border-t-accent'
      : accent === 'ethiopia'
      ? 'relative overflow-hidden before:content-[""] before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-gradient-to-r before:from-[#078a3c] before:via-[#fcd116] before:to-[#da121a]'
      : '';

  return (
    <div
      className={`${baseStyle} ${glassStyle} ${glowStyle} ${hoverStyle} ${accentBorder} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <div className={`flex flex-col space-y-1.5 pb-4 ${className}`} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <h3 className={`text-lg font-semibold leading-tight tracking-tight !text-title ${className}`} {...props}>
    {children}
  </h3>
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <p className={`text-xs text-muted-foreground ${className}`} {...props}>
    {children}
  </p>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <div className={`pt-0 ${className}`} {...props}>
    {children}
  </div>
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <div className={`flex items-center pt-4 border-t border-border/40 mt-4 ${className}`} {...props}>
    {children}
  </div>
);
