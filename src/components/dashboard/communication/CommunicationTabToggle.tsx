'use client';

import React from 'react';
import { MessageCircle, Users } from 'lucide-react';

export type CommunicationMainTab = 'channels' | 'students';

/**
 * Pill toggle for the Communication page, hosted in the page title row (next to the H1)
 * rather than inside the module body, so it reads as a view switch for the whole page.
 * The second tab is relabelled per-role: teachers/HoDs give feedback to students, while
 * students view feedback they've received from teachers.
 */
export function CommunicationTabToggle({
  value,
  onChange,
  secondaryLabel = 'Students',
}: {
  value: CommunicationMainTab;
  onChange: (tab: CommunicationMainTab) => void;
  secondaryLabel?: string;
}) {
  const SecondaryIcon = secondaryLabel === 'Feedback' ? MessageCircle : Users;
  return (
    <div className="inline-flex rounded-xl border border-border bg-white p-1 shadow-sm dark:bg-card">
      <button
        type="button"
        className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors ${
          value === 'channels'
            ? 'bg-primary text-white shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        }`}
        onClick={() => onChange('channels')}
      >
        Channels
      </button>
      <button
        type="button"
        className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors ${
          value === 'students'
            ? 'bg-primary text-white shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        }`}
        onClick={() => onChange('students')}
      >
        <SecondaryIcon className="h-3.5 w-3.5" />
        {secondaryLabel}
      </button>
    </div>
  );
}
