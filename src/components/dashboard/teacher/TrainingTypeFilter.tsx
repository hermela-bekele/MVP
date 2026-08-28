'use client';

import React from 'react';
import { Check, Filter } from 'lucide-react';
import { DropdownMenu } from '@/components/ui/dropdown-menu';
import { TRAINING_TYPE_FILTERS } from '@/lib/teacherPortal';

export function TrainingTypeFilter({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <DropdownMenu
      align="right"
      trigger={
        <span
          className={`relative flex h-10 w-10 items-center justify-center rounded-lg border bg-white transition-colors ${
            value !== 'All'
              ? 'border-primary/40 text-primary bg-primary/5'
              : 'border-border text-muted-foreground hover:border-primary/30 hover:text-primary'
          }`}
        >
          <Filter className="h-5 w-5" aria-hidden />
          {value !== 'All' && (
            <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
          )}
          <span className="sr-only">
            Filter training materials{value !== 'All' ? ` (${value})` : ''}
          </span>
        </span>
      }
      sections={[
        {
          header: 'Training type',
          items: TRAINING_TYPE_FILTERS.map((t) => ({
            id: t,
            label: t,
            icon:
              value === t ? (
                <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
              ) : (
                <span className="inline-block h-3.5 w-3.5" aria-hidden />
              ),
            onClick: () => onChange(t),
          })),
        },
      ]}
    />
  );
}
