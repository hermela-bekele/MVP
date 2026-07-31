'use client';

import React from 'react';
import {
  aisBadgeError,
  aisBadgeNeutral,
  aisBadgePrimary,
  aisBadgeSuccess,
  aisBadgeWarning,
  aisBodyMd,
  aisBtnPrimary,
  aisBtnSecondary,
  aisCard,
  aisHeadlineSm,
  aisLabelCaps,
  aisPage,
  aisPanelHeader,
  aisSubTabBtn,
  aisSubTabBtnActive,
  aisSubTabBtnInactive,
  aisSubTabTrack,
} from '@/components/dashboard/teacher/aisStyles';

export {
  aisInput,
  aisTextarea,
  aisFormLabel,
  aisPage,
  aisCard,
  aisCallout,
  aisListRow,
  aisSegmentBtn,
  aisSegmentBtnActive,
  aisSegmentBtnInactive,
} from '@/components/dashboard/teacher/aisStyles';

export type AisBadgeVariant = 'success' | 'warning' | 'error' | 'primary' | 'neutral';

const badgeClass: Record<AisBadgeVariant, string> = {
  success: aisBadgeSuccess,
  warning: aisBadgeWarning,
  error: aisBadgeError,
  primary: aisBadgePrimary,
  neutral: aisBadgeNeutral,
};

export function AisPage({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`${aisPage} space-y-6 ${className}`}>{children}</div>;
}

export function AisPanel({
  title,
  description,
  actions,
  children,
  className = '',
  flush = false,
}: {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  flush?: boolean;
}) {
  return (
    <div className={`${aisCard} overflow-hidden ${className}`}>
      {(title || description || actions) && (
        <div className={aisPanelHeader}>
          <div className="min-w-0">
            {title && <h3 className={aisHeadlineSm}>{title}</h3>}
            {description && <p className={`${aisBodyMd} mt-0.5`}>{description}</p>}
          </div>
          {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={flush ? 'overflow-x-auto' : 'overflow-x-auto p-4'}>{children}</div>
    </div>
  );
}

export function AisTable({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="ais-table w-full border-collapse">{children}</table>
    </div>
  );
}

export function AisTableHead({ children }: { children: React.ReactNode }) {
  return (
    <thead>
      <tr className="bg-ais-surface-container-low">{children}</tr>
    </thead>
  );
}

export function AisTh({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <th className={`${aisLabelCaps} px-4 py-2 text-left ${className}`}>{children}</th>;
}

export function AisTd({
  children,
  className = '',
  colSpan,
}: {
  children: React.ReactNode;
  className?: string;
  colSpan?: number;
}) {
  return (
    <td colSpan={colSpan} className={`px-4 py-2 text-sm text-ais-on-surface ${className}`}>
      {children}
    </td>
  );
}

export function AisTr({
  children,
  className = '',
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <tr
      className={`border-b border-ais-row-border transition-colors hover:bg-ais-row-hover ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      {children}
    </tr>
  );
}

export function AisEmptyRow({ colSpan, message }: { colSpan: number; message: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className={`px-4 py-8 text-center ${aisBodyMd}`}>
        {message}
      </td>
    </tr>
  );
}

export function AisSubTabs<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: readonly { id: T; label: string }[];
  active: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className={aisSubTabTrack}>
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onChange(t.id)}
          className={`${aisSubTabBtn} ${active === t.id ? aisSubTabBtnActive : aisSubTabBtnInactive}`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function AisStatusBadge({
  variant,
  children,
  className = '',
}: {
  variant: AisBadgeVariant;
  children: React.ReactNode;
  className?: string;
}) {
  return <span className={`${badgeClass[variant]} ${className}`}>{children}</span>;
}

export function AisBtnPrimary({
  children,
  className = '',
  type = 'button',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type={type} className={`${aisBtnPrimary} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function AisBtnSecondary({
  children,
  className = '',
  type = 'button',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type={type} className={`${aisBtnSecondary} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function AisFormCard({
  title,
  description,
  children,
  onSubmit,
  className = '',
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  onSubmit?: (e: React.FormEvent) => void;
  className?: string;
}) {
  const Tag = onSubmit ? 'form' : 'div';
  return (
    <Tag onSubmit={onSubmit} className={`${aisCard} space-y-4 p-4 ${className}`}>
      <div>
        <h3 className={aisHeadlineSm}>{title}</h3>
        {description && <p className={`${aisBodyMd} mt-0.5`}>{description}</p>}
      </div>
      {children}
    </Tag>
  );
}

export function approvalBadgeVariant(status: string): AisBadgeVariant {
  if (status === 'Approved' || status === 'Active') return 'success';
  if (status === 'Rejected') return 'error';
  if (status === 'Draft') return 'neutral';
  return 'warning';
}
