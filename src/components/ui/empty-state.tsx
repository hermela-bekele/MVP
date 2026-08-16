import React from 'react';

/* ───────────── Types ───────────── */

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  illustration?: React.ReactNode;
  className?: string;
}

/* ───────────── Component ───────────── */

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  illustration,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center px-6 py-16 text-center animate-fade-in ${className}`}
    >
      {/* Illustration area */}
      {illustration && (
        <div className="mb-6">
          {illustration}
        </div>
      )}

      {/* Icon */}
      {icon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <span className="h-7 w-7">{icon}</span>
        </div>
      )}

      {/* Title */}
      <h3 className="text-base font-semibold text-title">{title}</h3>

      {/* Description */}
      {description && (
        <p className="mt-1.5 max-w-sm text-sm text-muted-foreground leading-relaxed">{description}</p>
      )}

      {/* Action */}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
};
