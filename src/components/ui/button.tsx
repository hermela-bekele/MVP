import React from 'react';

/**
 * Variant → action tier: primary (the one main action on a page/panel/modal),
 * secondary (supporting action, less emphasis than primary), outline (equal-weight
 * alternative to a primary, e.g. "Cancel" next to "Save"), ghost (low-emphasis/
 * inline actions, e.g. table row actions), destructive (delete/remove/reject/
 * terminate), organic (decorative variant of primary — avoid for new work, prefer
 * primary). Size: sm (h-8) for dense contexts — table rows, modal footers, detail-
 * page action bars; md (h-10, default) for standalone/form-level actions; lg (h-12)
 * for hero/landing CTAs only. Buttons on the same row/action-bar should share one
 * size. Icons go through leftIcon/rightIcon (never manual margins) so icon+text
 * alignment is guaranteed by the shared inline-flex/items-center/gap-* baseStyle.
 */
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'organic';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  disabled,
  ...props
}) => {
  const baseStyle = 'inline-flex items-center justify-center font-medium rounded-md transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer relative overflow-hidden [&>svg]:shrink-0 [&>svg]:h-4 [&>svg]:w-4';

  const variants = {
    primary: 'bg-gradient-to-r from-btn-primary to-btn-primary/90 text-btn-primary-foreground hover:shadow-lg hover:shadow-btn-primary/20 active:scale-[0.97] before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/0 before:via-white/10 before:to-white/0 before:translate-x-[-200%] hover:before:translate-x-[200%] before:transition-transform before:duration-700',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 active:scale-[0.98]',
    outline: 'border border-border bg-transparent hover:bg-muted text-foreground active:scale-[0.98]',
    ghost: 'hover:bg-muted text-foreground hover:text-foreground',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 active:scale-[0.98]',
    organic: 'bg-gradient-to-r from-btn-primary to-btn-primary/90 hover:from-btn-primary/90 hover:to-btn-primary text-btn-primary-foreground shadow-sm shadow-btn-primary/20 hover:shadow-md hover:shadow-btn-primary/30 active:scale-[0.97]'
  };

  const sizes = {
    sm: 'h-8 px-3 text-xs gap-1.5',
    md: 'h-10 px-4 text-sm gap-2',
    lg: 'h-12 px-6 text-base gap-2.5',
    icon: 'h-10 w-10 p-0 shrink-0',
  };

  return (
    <button
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin shrink-0 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {!loading && leftIcon && (
        <span className="shrink-0 inline-flex items-center [&>svg]:h-4 [&>svg]:w-4 [&>svg]:shrink-0">{leftIcon}</span>
      )}
      {children != null && children !== '' && <span className="leading-none">{children}</span>}
      {!loading && rightIcon && (
        <span className="shrink-0 inline-flex items-center [&>svg]:h-4 [&>svg]:w-4 [&>svg]:shrink-0">{rightIcon}</span>
      )}
    </button>
  );
};
