'use client';

import React, { useState } from 'react';
import { InstitutionProfilePanel } from '@/components/dashboard/school-head/InstitutionProfilePanel';
import { UsersRolesPanel } from '@/components/dashboard/school-head/UsersRolesPanel';
import { SecurityPanel } from '@/components/dashboard/school-head/SecurityPanel';
import { SchoolBillingSettings } from '@/components/dashboard/school-head/SchoolBillingSettings';
import { IntegrationsPanel } from '@/components/dashboard/school-head/IntegrationsPanel';
import { BrandingPanel } from '@/components/dashboard/school-head/BrandingPanel';
import { DataPrivacyPanel } from '@/components/dashboard/school-head/DataPrivacyPanel';

type AdminSubTab = 'profile' | 'users' | 'security' | 'billing' | 'integrations' | 'branding' | 'privacy';

const TABS: { id: AdminSubTab; label: string }[] = [
  { id: 'profile', label: 'Institution Profile' },
  { id: 'users', label: 'Users & Roles' },
  { id: 'security', label: 'Security' },
  { id: 'billing', label: 'Billing' },
  { id: 'integrations', label: 'Integrations' },
  { id: 'branding', label: 'Branding' },
  { id: 'privacy', label: 'Data & Privacy' },
];

/**
 * School Administration — the single settings destination reached from the header
 * profile menu. Institution Profile / Users & Roles / Security / Billing /
 * Integrations / Branding / Data & Privacy used to be scattered across separate
 * sidebar items (or didn't exist); they're now sub-tabs of one page so the sidebar
 * only carries day-to-day navigation and no engine repeats its own settings.
 */
export function SchoolHeadSettingsHub() {
  const [tab, setTab] = useState<AdminSubTab>('profile');

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="inline-flex flex-wrap gap-1 rounded-xl border border-border bg-white p-1 shadow-sm dark:bg-card">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              tab === t.id
                ? 'bg-primary text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'profile' && <InstitutionProfilePanel />}
      {tab === 'users' && <UsersRolesPanel />}
      {tab === 'security' && <SecurityPanel />}
      {tab === 'billing' && <SchoolBillingSettings />}
      {tab === 'integrations' && <IntegrationsPanel />}
      {tab === 'branding' && <BrandingPanel />}
      {tab === 'privacy' && <DataPrivacyPanel />}
    </div>
  );
}
