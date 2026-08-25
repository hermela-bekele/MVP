'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { api, type Invoice } from '@/lib/api';
import { readStoredSession } from '@/lib/auth';
import { TablePanel } from '@/components/dashboard/TablePanel';
import { ContentCard } from '@/components/dashboard/ContentCard';
import { KpiWidget, KpiGrid } from '@/components/dashboard/KpiWidget';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/ui/data-table';
import type { DataTableColumn } from '@/components/ui/data-table';
import { EmptyState } from '@/components/ui/empty-state';
import { InvoiceDetailDialog } from '@/components/dashboard/billing/InvoiceDetailDialog';

export const RegistrarBilling: React.FC = () => {
  const session = readStoredSession();
  const schoolId = session?.schoolId || 'sch-1';
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [feePlans, setFeePlans] = useState<{ id: string; grade: string; registrationFee: number; monthlyTuition: number }[]>([]);

  const refresh = useCallback(async () => {
    try {
      setInvoices(await api.listInvoices({ schoolId }));
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load invoices');
    }
  }, [schoolId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    api
      .listFeePlans(schoolId)
      .then(setFeePlans)
      .catch(() => setFeePlans([]));
  }, [schoolId]);

  const open = invoices.filter((i) => i.balanceDue > 0).length;
  const red = invoices.filter((i) => i.deadlineColor === 'red' && i.balanceDue > 0).length;

  const columns: DataTableColumn<Invoice>[] = [
    {
      key: 'invoiceNumber',
      header: 'Invoice',
      sortable: true,
      render: (row) => (
        <button
          type="button"
          className="text-left"
          onClick={() => setSelectedInvoice(row)}
        >
          <p className="text-xs font-semibold text-primary hover:underline">{row.invoiceNumber}</p>
          <p className="text-[10px] capitalize text-muted-foreground">{row.invoiceType} · view receipt</p>
        </button>
      ),
    },
    {
      key: 'status',
      header: 'Deadline',
      render: (row) => (
        <Badge
          variant={
            row.deadlineColor === 'green'
              ? 'success'
              : row.deadlineColor === 'yellow'
                ? 'warning'
                : 'danger'
          }
        >
          {row.status.replace(/_/g, ' ')}
        </Badge>
      ),
    },
    {
      key: 'dueDate',
      header: 'Due',
      sortable: true,
      render: (row) => (
        <span className="text-xs">
          {row.dueDate}
          <span className="text-muted-foreground"> · {row.daysRemaining}d</span>
        </span>
      ),
    },
    {
      key: 'balanceDue',
      header: 'Balance',
      render: (row) => (
        <span className="text-xs font-semibold">
          {row.amountPaid.toLocaleString()} / {(row.amountPaid + row.balanceDue).toLocaleString()}{' '}
          {row.currency}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (row) =>
        row.balanceDue > 0 ? (
          <Button
            size="sm"
            variant="organic"
            className="h-8 border-none text-xs"
            onClick={async () => {
              try {
                await api.recordPayment(row.id, {
                  amount: Number(amount) || row.balanceDue,
                  provider: 'manual',
                  notes: 'Recorded by registrar',
                });
                setAmount('');
                setOk(`Payment recorded on ${row.invoiceNumber}`);
                await refresh();
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Payment failed');
              }
            }}
          >
            Record pay
          </Button>
        ) : (
          <Badge variant="success">Paid</Badge>
        ),
    },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      <KpiGrid>
        <KpiWidget label="Open balances" value={String(open)} tone="emphasis" />
        <KpiWidget label="Overdue (red)" value={String(red)} />
        <KpiWidget label="All invoices" value={String(invoices.length)} />
      </KpiGrid>

      {(error || ok) && (
        <div
          className={`rounded-xl border px-4 py-3 text-xs ${
            error
              ? 'border-destructive/30 bg-destructive/10 text-destructive'
              : 'border-success/30 bg-success/10 text-success'
          }`}
        >
          {error || ok}
        </div>
      )}

      <ContentCard title="Payment tools" description="Green &gt;7 days · Yellow 1–7 · Red overdue">
        <div className="flex flex-wrap items-end gap-3">
          <Input
            label="Partial amount (optional)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Full balance if empty"
            inputSize="sm"
            wrapperClassName="w-52"
          />
          <Button size="sm" variant="outline" onClick={() => refresh()}>
            Refresh
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={async () => {
              try {
                const result = (await api.runBillingJobs()) as {
                  reminders: number;
                  expiredAdmissions: number;
                  lateFees: number;
                  monthlyInvoices: number;
                  overdueNotices: number;
                };
                setOk(
                  `Billing jobs completed — ${result.monthlyInvoices} invoice(s) generated, ${result.reminders} reminder(s), ${result.lateFees} late fee(s), ${result.overdueNotices} overdue notice(s), ${result.expiredAdmissions} expired admission(s).`
                );
                await refresh();
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Jobs failed');
              }
            }}
          >
            Run billing jobs
          </Button>
        </div>
      </ContentCard>

      {feePlans.length > 0 && (
        <ContentCard title="Grade Fee Schedule" description="Read-only — edited by school administration under School Settings">
          <div className="overflow-x-auto">
            <table className="eskooly-table w-full">
              <thead>
                <tr>
                  <th className="p-2 text-left text-[10px] font-semibold text-muted-foreground">Grade</th>
                  <th className="p-2 text-left text-[10px] font-semibold text-muted-foreground">Registration Fee</th>
                  <th className="p-2 text-left text-[10px] font-semibold text-muted-foreground">Monthly Tuition</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {feePlans.map((plan) => (
                  <tr key={plan.id}>
                    <td className="p-2 text-xs font-medium">{plan.grade}</td>
                    <td className="p-2 text-xs">{plan.registrationFee.toLocaleString()} ETB</td>
                    <td className="p-2 text-xs">{plan.monthlyTuition.toLocaleString()} ETB</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ContentCard>
      )}

      <TablePanel
        title="Invoices & deadlines"
      >
        {invoices.length ? (
          <DataTable columns={columns} data={invoices} />
        ) : (
          <EmptyState
            title="No invoices yet"
            description="Accept an application to generate an admission invoice."
          />
        )}
      </TablePanel>

      <InvoiceDetailDialog
        invoice={selectedInvoice}
        open={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
      />
    </div>
  );
};
