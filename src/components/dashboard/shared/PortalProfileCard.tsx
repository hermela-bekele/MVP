'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { User2 } from 'lucide-react';

export interface ProfileField {
  label: string;
  value: React.ReactNode;
}

/**
 * Shared "who am I" profile card used across every portal role. Each page supplies
 * its own role-specific fields (subject taught, department, grade/section, etc.);
 * this component only owns the identity header (name, email, role badge) and the
 * consistent field-grid layout so every role's settings page looks the same shape.
 */
export function PortalProfileCard({
  roleLabel,
  fields,
  actions,
  className = '',
}: {
  roleLabel: string;
  fields: ProfileField[];
  actions?: React.ReactNode;
  className?: string;
}) {
  const { currentUser } = useApp();

  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 ${className}`}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4 dark:border-slate-800">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
            <User2 className="h-7 w-7" />
          </div>
          <div>
            <p className="text-base font-bold text-slate-900 dark:text-slate-100">
              {currentUser?.displayName ?? 'User'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{currentUser?.email ?? '—'}</p>
            <span className="mt-1 inline-block rounded-full bg-indigo-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
              {roleLabel}
            </span>
          </div>
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {fields.map((f, i) => (
          <div key={i} className="rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800/60">
            <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {f.label}
            </dt>
            <dd className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-slate-100">{f.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
