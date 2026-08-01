'use client';

import React, { useEffect, useState } from 'react';
import { api, type Invoice } from '@/lib/api';
import { readStoredSession } from '@/lib/auth';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { ContentCard } from '@/components/dashboard/ContentCard';
import { KpiWidget, KpiGrid } from '@/components/dashboard/KpiWidget';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';
import { MetricProgressRow } from '@/components/ui/metric-progress-row';
import { InvoiceDetailDialog } from '@/components/dashboard/billing/InvoiceDetailDialog';
import { usePortalTab } from '@/lib/usePortalTab';

function deadlineVariant(color: Invoice['deadlineColor']) {
  if (color === 'green') return 'success' as const;
  if (color === 'yellow') return 'warning' as const;
  return 'danger' as const;
}

export default function FinancePortalPage() {
  const session = readStoredSession();
  const { activeTab: tab, setActiveTab: setTab } = usePortalTab('finance', 'invoices');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [amount, setAmount] = useState('');
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [aging, setAging] = useState<{
    upcomingCount: number;
    overdueCount: number;
    upcomingAmount: number;
    overdueAmount: number;
    collected: number;
    billed: number;
    collectionRate: number;
    buckets?: {
      d0_30: { count: number; amount: number };
      d31_60: { count: number; amount: number };
      d61_90: { count: number; amount: number };
      d90_plus: { count: number; amount: number };
    };
  } | null>(null);
  const [financeBusy, setFinanceBusy] = useState(false);

  const refresh = () =>
    Promise.all([
      api.listInvoices({ schoolId: session?.schoolId || 'sch-1' }),
      api.financeAgingReport(session?.schoolId || 'sch-1').catch(() => null),
    ]).then(([inv, ag]) => {
      setInvoices(inv);
      if (ag) setAging(ag as typeof aging);
    });

  useEffect(() => {
    refresh();
  }, [session?.schoolId]);

  const open = invoices.filter((i) => i.balanceDue > 0);
  const overdue = invoices.filter((i) => i.deadlineColor === 'red' && i.balanceDue > 0);
  const collected = aging?.collected ?? invoices.reduce((s, i) => s + i.amountPaid, 0);

  return (
    <DashboardShell
      title="Finance office"
      subtitle="Invoices, partial payments, late fees, and collection health"
      eyebrow="Billing"
      activeTab={tab}
      setActiveTab={setTab}
      headerVariant="portal"
      actions={
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => refresh()}>
            Refresh
          </Button>
          <Button
            size="sm"
            variant="organic"
            className="border-none"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                const r = await api.runBillingJobs();
                setMsg({ type: 'ok', text: `Jobs done: ${JSON.stringify(r)}` });
                await refresh();
              } catch (err) {
                setMsg({ type: 'err', text: err instanceof Error ? err.message : 'Job failed' });
              } finally {
                setBusy(false);
              }
            }}
          >
            Run billing jobs
          </Button>
        </div>
      }
    >
      {msg && (
        <div
          className={`mb-4 rounded-xl border px-4 py-3 text-xs ${
            msg.type === 'ok'
              ? 'border-success/30 bg-success/10 text-success'
              : 'border-destructive/30 bg-destructive/10 text-destructive'
          }`}
        >
          {msg.text}
        </div>
      )}

      <div className="mb-5">
        <KpiGrid>
          <KpiWidget label="Open invoices" value={String(open.length)} tone="emphasis" />
          <KpiWidget label="Overdue" value={String(overdue.length)} hint="Past due date" />
          <KpiWidget label="Collected" value={`${collected.toLocaleString()} ETB`} />
          <KpiWidget
            label="Collection rate"
            value={aging ? `${aging.collectionRate}%` : '—'}
            hint={aging ? `Billed ${aging.billed.toLocaleString()} ETB` : 'Aging report'}
          />
        </KpiGrid>
      </div>

      {aging && (
        <div className="mb-5 grid gap-3 sm:grid-cols-2">
          <ContentCard title="Upcoming receivables" description="Open invoices not yet due">
            <p className="text-2xl font-bold tabular-nums">
              {aging.upcomingAmount.toLocaleString()} ETB
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{aging.upcomingCount} invoices</p>
          </ContentCard>
          <ContentCard title="Overdue aging" description="Past due with balance remaining">
            <p className="text-2xl font-bold tabular-nums text-destructive">
              {aging.overdueAmount.toLocaleString()} ETB
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{aging.overdueCount} invoices</p>
          </ContentCard>
        </div>
      )}

      {aging?.buckets && (
        <div className="mb-5">
          <ContentCard title="Aging buckets" description="Overdue balance by days past due">
            <div className="grid gap-3 sm:grid-cols-4">
              {(
                [
                  ['0–30 days', aging.buckets.d0_30],
                  ['31–60 days', aging.buckets.d31_60],
                  ['61–90 days', aging.buckets.d61_90],
                  ['90+ days', aging.buckets.d90_plus],
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
      )}

      <ContentCard
        title="Record payment"
        description="Leave amount blank to clear the full remaining balance"
        actions={
          <Input
            label="Partial amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Full balance if empty"
            inputSize="sm"
            wrapperClassName="w-44"
          />
        }
      >
        {invoices.length ? (
          <div className="space-y-3 p-1">
            {invoices.map((inv) => (
              <div
                key={inv.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedInvoice(inv)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') setSelectedInvoice(inv);
                }}
                className="flex cursor-pointer flex-wrap items-center justify-between gap-4 rounded-xl border border-border/70 bg-gradient-to-r from-card to-primary/[0.02] p-4 shadow-sm transition hover:border-primary/30 hover:shadow-md"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold text-primary">{inv.invoiceNumber}</p>
                    <Badge variant="neutral">{inv.invoiceType}</Badge>
                    <Badge variant={deadlineVariant(inv.deadlineColor)}>
                      {inv.status.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Due {inv.dueDate} · Balance {inv.balanceDue.toLocaleString()} {inv.currency} · Click for
                    breakdown
                  </p>
                  <MetricProgressRow
                    className="mt-2 max-w-sm"
                    label="Paid progress"
                    value={
                      inv.amountPaid + inv.balanceDue > 0
                        ? (inv.amountPaid / (inv.amountPaid + inv.balanceDue)) * 100
                        : 100
                    }
                    valueDisplay={`${inv.amountPaid.toLocaleString()} paid`}
                  />
                </div>
                {inv.balanceDue > 0 ? (
                  <Button
                    size="sm"
                    variant="organic"
                    className="border-none"
                    onClick={async (e) => {
                      e.stopPropagation();
                      try {
                        await api.recordPayment(inv.id, {
                          amount: Number(amount) || inv.balanceDue,
                          provider: 'manual',
                          notes: 'Recorded by finance',
                        });
                        setAmount('');
                        setMsg({ type: 'ok', text: `Payment recorded on ${inv.invoiceNumber}` });
                        const next = await api.listInvoices({ schoolId: session?.schoolId || 'sch-1' });
                        setInvoices(next);
                        setSelectedInvoice(next.find((i) => i.id === inv.id) || null);
                      } catch (err) {
                        setMsg({
                          type: 'err',
                          text: err instanceof Error ? err.message : 'Payment failed',
                        });
                      }
                    }}
                  >
                    Record payment
                  </Button>
                ) : (
                  <Badge variant="success">Settled</Badge>
                )}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No invoices yet" description="Accept an application or run monthly billing to create invoices." />
        )}
      </ContentCard>

      <InvoiceDetailDialog
        invoice={selectedInvoice}
        open={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        showFinanceActions
        financeBusy={financeBusy}
        onFinanceAction={async (action, payload) => {
          if (!selectedInvoice) return;
          setFinanceBusy(true);
          try {
            if (action === 'waive') {
              await api.waiveInvoice(selectedInvoice.id, Number(payload.amount), payload.reason || '');
              setMsg({ type: 'ok', text: `Waived on ${selectedInvoice.invoiceNumber}` });
            } else if (action === 'cancel') {
              await api.cancelInvoice(selectedInvoice.id, payload.reason || '');
              setMsg({ type: 'ok', text: `Cancelled ${selectedInvoice.invoiceNumber}` });
            } else if (action === 'extend' && payload.dueDate) {
              await api.extendInvoiceDeadline(selectedInvoice.id, payload.dueDate);
              setMsg({ type: 'ok', text: `Deadline extended on ${selectedInvoice.invoiceNumber}` });
            }
            await refresh();
            const next = await api.listInvoices({ schoolId: session?.schoolId || 'sch-1' });
            setSelectedInvoice(next.find((i) => i.id === selectedInvoice.id) || null);
          } catch (err) {
            setMsg({ type: 'err', text: err instanceof Error ? err.message : 'Override failed' });
          } finally {
            setFinanceBusy(false);
          }
        }}
      />
    </DashboardShell>
  );
}
