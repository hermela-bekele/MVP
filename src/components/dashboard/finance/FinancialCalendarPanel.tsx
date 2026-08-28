'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { api, type Invoice, type FinancialPeriod } from '@/lib/api';
import { readStoredSession } from '@/lib/auth';
import { TablePanel } from '@/components/dashboard/TablePanel';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';

type CalendarEntry = {
  date: string;
  label: string;
  detail: string;
  kind: 'fee-due' | 'fee-overdue' | 'period-close';
};

function kindVariant(kind: CalendarEntry['kind']) {
  switch (kind) {
    case 'fee-overdue':
      return 'danger' as const;
    case 'period-close':
      return 'info' as const;
    default:
      return 'warning' as const;
  }
}

function kindLabel(kind: CalendarEntry['kind']) {
  switch (kind) {
    case 'fee-overdue':
      return 'Overdue fee';
    case 'period-close':
      return 'Period close';
    default:
      return 'Fee due';
  }
}

export function FinancialCalendarPanel() {
  const session = readStoredSession();
  const schoolId = session?.schoolId || 'sch-1';
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [periods, setPeriods] = useState<FinancialPeriod[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.listInvoices({ schoolId }),
      api.listFinancialPeriods({ schoolId }).catch(() => []),
    ])
      .then(([inv, per]) => {
        setInvoices(inv);
        setPeriods(per);
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schoolId]);

  const entries = useMemo<CalendarEntry[]>(() => {
    const feeEntries: CalendarEntry[] = invoices
      .filter((i) => i.balanceDue > 0)
      .map((i) => ({
        date: i.dueDate,
        label: i.invoiceNumber,
        detail: `${i.studentName || i.applicantName || 'Student'} · ${i.balanceDue.toLocaleString()} ${i.currency}`,
        kind: i.deadlineColor === 'red' ? 'fee-overdue' : 'fee-due',
      }));
    const periodEntries: CalendarEntry[] = periods
      .filter((p) => p.status === 'open')
      .map((p) => ({
        date: p.endDate,
        label: `${p.name} closes`,
        detail: 'Reconcile transactions before closing this period.',
        kind: 'period-close',
      }));
    return [...feeEntries, ...periodEntries].sort((a, b) => a.date.localeCompare(b.date));
  }, [invoices, periods]);

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} variant="card" height={64} />
        ))}
      </div>
    );
  }

  return (
    <TablePanel
      title="Financial Calendar"
      description="Upcoming fee deadlines and financial period closings, drawn from live billing and period data."
    >
      {entries.length === 0 ? (
        <EmptyState
          title="Nothing scheduled"
          description="No open invoice due dates or financial periods to show yet."
        />
      ) : (
        <div className="divide-y divide-border/60">
          {entries.map((entry, idx) => (
            <div key={`${entry.date}-${idx}`} className="flex items-center justify-between gap-4 py-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-semibold">{entry.label}</p>
                  <Badge variant={kindVariant(entry.kind)} size="sm">
                    {kindLabel(entry.kind)}
                  </Badge>
                </div>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{entry.detail}</p>
              </div>
              <p className="shrink-0 text-xs font-medium tabular-nums text-muted-foreground">{entry.date}</p>
            </div>
          ))}
        </div>
      )}
    </TablePanel>
  );
}
