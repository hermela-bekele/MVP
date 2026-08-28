'use client';

import React, { useEffect, useState } from 'react';
import { api, type FinanceDashboardSummary } from '@/lib/api';
import { readStoredSession } from '@/lib/auth';
import { ContentCard } from '@/components/dashboard/ContentCard';
import { KpiWidget, KpiGrid } from '@/components/dashboard/KpiWidget';
import { ChartCard } from '@/components/ui/chart-card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export function FinanceDashboardPanel() {
  const session = readStoredSession();
  const [summary, setSummary] = useState<FinanceDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .getFinanceDashboardSummary(session?.schoolId || 'sch-1')
      .then((data) => {
        if (!cancelled) setSummary(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.schoolId]);

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} variant="card" height={110} />
        ))}
      </div>
    );
  }

  if (error || !summary) {
    return (
      <ContentCard title="Finance dashboard">
        <p className="text-xs text-destructive">{error || 'Could not load finance summary.'}</p>
      </ContentCard>
    );
  }

  const { activeFinancialYear, revenue, receivables, payroll } = summary;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Real-time totals from recorded payments, outstanding invoices, and processed payroll.
        </p>
        {activeFinancialYear ? (
          <Badge variant="primary" badgeStyle="subtle" size="sm">
            Active year: {activeFinancialYear.name}
          </Badge>
        ) : (
          <Badge variant="warning" badgeStyle="subtle" size="sm">
            No active financial year — set one up in Settings
          </Badge>
        )}
      </div>

      <KpiGrid>
        <KpiWidget label="Total revenue" value={`${revenue.total.toLocaleString()} ETB`} tone="emphasis" />
        <KpiWidget
          label="Outstanding fees"
          value={`${receivables.outstandingAmount.toLocaleString()} ETB`}
          hint={`${receivables.overdueCount} overdue`}
        />
        <KpiWidget
          label="Overdue fees"
          value={`${receivables.overdueAmount.toLocaleString()} ETB`}
          hint={`Collection rate ${receivables.collectionRate}%`}
        />
        <KpiWidget
          label="Payroll this month"
          value={`${payroll.totalNetPay.toLocaleString()} ETB`}
          hint={payroll.currentMonth}
        />
      </KpiGrid>

      <ChartCard
        title="Revenue trend"
        description="Payments collected per month (last 12 months)"
        data={revenue.monthlyTrend}
        type="area"
        dataKey="total"
        xKey="name"
      />

      <ContentCard title="Receivables aging" description="Overdue balance by days past due">
        <div className="grid gap-3 sm:grid-cols-4">
          {(
            [
              ['0–30 days', receivables.buckets.d0_30],
              ['31–60 days', receivables.buckets.d31_60],
              ['61–90 days', receivables.buckets.d61_90],
              ['90+ days', receivables.buckets.d90_plus],
            ] as const
          ).map(([label, bucket]) => (
            <div key={label} className="rounded-xl border border-border/60 bg-muted/20 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {label}
              </p>
              <p className="mt-1 text-lg font-bold tabular-nums">{bucket.amount.toLocaleString()} ETB</p>
              <p className="text-xs text-muted-foreground">{bucket.count} invoices</p>
            </div>
          ))}
        </div>
      </ContentCard>
    </div>
  );
}
