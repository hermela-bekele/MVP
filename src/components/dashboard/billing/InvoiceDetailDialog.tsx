'use client';

import React from 'react';
import type { Invoice } from '@/lib/api';
import { Dialog, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MetricProgressRow } from '@/components/ui/metric-progress-row';

function deadlineVariant(color: Invoice['deadlineColor']) {
  if (color === 'green') return 'success' as const;
  if (color === 'yellow') return 'warning' as const;
  return 'danger' as const;
}

function formatMoney(n: number, currency: string) {
  return `${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
}

function formatWhen(raw?: string | null) {
  if (!raw) return '—';
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return String(raw).slice(0, 16);
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function InvoiceDetailDialog({
  invoice,
  open,
  onClose,
  onPay,
  paying,
  onFinanceAction,
  financeBusy,
  showFinanceActions,
}: {
  invoice: Invoice | null;
  open: boolean;
  onClose: () => void;
  onPay?: (invoice: Invoice) => void;
  paying?: boolean;
  onFinanceAction?: (
    action: 'waive' | 'cancel' | 'extend',
    payload: { amount?: number; reason?: string; dueDate?: string }
  ) => Promise<void> | void;
  financeBusy?: boolean;
  showFinanceActions?: boolean;
}) {
  const [waiveAmount, setWaiveAmount] = React.useState('');
  const [reason, setReason] = React.useState('');
  const [newDue, setNewDue] = React.useState('');

  React.useEffect(() => {
    if (!invoice) return;
    setWaiveAmount(invoice.balanceDue > 0 ? String(invoice.balanceDue) : '');
    setNewDue(invoice.dueDate?.slice(0, 10) || '');
    setReason('');
  }, [invoice]);

  if (!invoice) return null;

  const lineItems = invoice.lineItems ?? [];
  const payments = invoice.payments ?? [];
  const total = invoice.amountPaid + invoice.balanceDue;
  const paidPct = total > 0 ? (invoice.amountPaid / total) * 100 : 100;
  const isPaid = invoice.balanceDue <= 0;
  const canFinance =
    showFinanceActions && onFinanceAction && invoice.balanceDue > 0 && invoice.status !== 'cancelled';

  const printReceipt = () => {
    const win = window.open('', '_blank', 'noopener,noreferrer,width=720,height=900');
    if (!win) return;
    const lines = lineItems
      .map(
        (li) =>
          `<tr><td style="padding:8px;border-bottom:1px solid #e5e7eb">${li.description}</td><td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right">${formatMoney(li.lineTotal, invoice.currency)}</td></tr>`
      )
      .join('');
    const pays = payments
      .map(
        (p) =>
          `<tr><td style="padding:8px;border-bottom:1px solid #e5e7eb">${formatWhen(p.paidAt)} · ${p.provider}</td><td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right">${formatMoney(p.amount, invoice.currency)}</td></tr>`
      )
      .join('');
    win.document.write(`<!doctype html><html><head><title>Receipt ${invoice.invoiceNumber}</title>
      <style>body{font-family:Segoe UI,system-ui,sans-serif;padding:32px;color:#0f172a} h1{font-size:20px;margin:0} .muted{color:#64748b;font-size:12px}</style>
      </head><body>
      <h1>Payment receipt</h1>
      <p class="muted">${invoice.invoiceNumber} · ${invoice.invoiceType} · Status: ${invoice.status}</p>
      <p class="muted">Issued ${invoice.issueDate} · Due ${invoice.dueDate}</p>
      <h2 style="font-size:14px;margin-top:24px">Line items</h2>
      <table style="width:100%;border-collapse:collapse">${lines || '<tr><td class="muted">No line items</td></tr>'}</table>
      <h2 style="font-size:14px;margin-top:24px">Payments</h2>
      <table style="width:100%;border-collapse:collapse">${pays || '<tr><td class="muted">No payments yet</td></tr>'}</table>
      <p style="margin-top:24px"><strong>Paid:</strong> ${formatMoney(invoice.amountPaid, invoice.currency)} · <strong>Balance:</strong> ${formatMoney(invoice.balanceDue, invoice.currency)}</p>
      <p class="muted">Generated ${new Date().toLocaleString()}</p>
      <script>window.print()</script>
      </body></html>`);
    win.document.close();
  };

  return (
    <Dialog
      isOpen={open}
      onClose={onClose}
      title={invoice.invoiceNumber}
      description={`${invoice.studentName || invoice.applicantName || 'Invoice'} · ${invoice.invoiceType} · ${invoice.status.replace(/_/g, ' ')}`}
      size="xl"
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="neutral">{invoice.invoiceType}</Badge>
          <Badge variant={deadlineVariant(invoice.deadlineColor)}>
            {invoice.status.replace(/_/g, ' ')}
          </Badge>
          {isPaid && <Badge variant="success">Receipt ready</Badge>}
          {lineItems.some((li) => li.lineType === 'discount' || li.lineType === 'credit') && (
            <Badge variant="primary">Includes discount/credit</Badge>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Issued</p>
            <p className="mt-1 text-sm font-semibold">{invoice.issueDate}</p>
          </div>
          <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Due</p>
            <p className="mt-1 text-sm font-semibold">
              {invoice.dueDate}{' '}
              <span className="text-xs font-normal text-muted-foreground">({invoice.daysRemaining}d)</span>
            </p>
          </div>
          <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Balance</p>
            <p className="mt-1 text-sm font-semibold">{formatMoney(invoice.balanceDue, invoice.currency)}</p>
          </div>
        </div>

        <MetricProgressRow
          label="Payment progress"
          value={paidPct}
          valueDisplay={`${Math.round(paidPct)}% · ${formatMoney(invoice.amountPaid, invoice.currency)} paid`}
        />

        <section>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Charge breakdown
          </h3>
          <div className="overflow-hidden rounded-xl border border-border/70">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-3 py-2.5">Description</th>
                  <th className="px-3 py-2.5">Type</th>
                  <th className="px-3 py-2.5 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {lineItems.length ? (
                  lineItems.map((li) => (
                    <tr key={li.id} className="border-t border-border/50">
                      <td className="px-3 py-2.5 font-medium">{li.description}</td>
                      <td className="px-3 py-2.5 capitalize text-muted-foreground">{li.lineType}</td>
                      <td className="px-3 py-2.5 text-right font-semibold">
                        {formatMoney(li.lineTotal, invoice.currency)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-3 py-4 text-center text-xs text-muted-foreground">
                      No line items on this invoice
                    </td>
                  </tr>
                )}
                <tr className="border-t border-border bg-muted/30">
                  <td className="px-3 py-2.5 font-semibold" colSpan={2}>
                    Subtotal
                  </td>
                  <td className="px-3 py-2.5 text-right font-bold">
                    {formatMoney(invoice.subtotal, invoice.currency)}
                  </td>
                </tr>
                {invoice.lateFeeTotal > 0 && (
                  <tr className="border-t border-border/50">
                    <td className="px-3 py-2.5 text-warning" colSpan={2}>
                      Late fees
                    </td>
                    <td className="px-3 py-2.5 text-right font-semibold text-warning">
                      {formatMoney(invoice.lateFeeTotal, invoice.currency)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Payment history & receipts
          </h3>
          <div className="space-y-2">
            {payments.length ? (
              payments.map((p) => (
                <div
                  key={p.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/70 bg-card px-3.5 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold">
                      {formatMoney(p.amount, invoice.currency)}{' '}
                      <span className="font-normal capitalize text-muted-foreground">via {p.provider}</span>
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {formatWhen(p.paidAt)} · Ref {p.id}
                    </p>
                  </div>
                  <Badge variant={p.status === 'succeeded' ? 'success' : 'warning'}>{p.status}</Badge>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-6 text-center text-xs text-muted-foreground">
                No payments recorded yet. Pay from this invoice to generate a receipt entry.
              </div>
            )}
          </div>
        </section>

        {canFinance && (
          <section className="space-y-3 rounded-xl border border-border/70 bg-muted/20 p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Finance overrides
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label="Waive amount"
                value={waiveAmount}
                onChange={(e) => setWaiveAmount(e.target.value)}
                inputSize="sm"
              />
              <Input
                label="New due date"
                type="date"
                value={newDue}
                onChange={(e) => setNewDue(e.target.value)}
                inputSize="sm"
              />
            </div>
            <Input
              label="Reason / notes"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Required for waive or cancel"
              inputSize="sm"
            />
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={financeBusy || !reason || !waiveAmount}
                onClick={() => onFinanceAction?.('waive', { amount: Number(waiveAmount), reason })}
              >
                Waive balance
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={financeBusy || !newDue}
                onClick={() => onFinanceAction?.('extend', { dueDate: newDue })}
              >
                Extend deadline
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={financeBusy || !reason}
                onClick={() => onFinanceAction?.('cancel', { reason })}
              >
                Cancel invoice
              </Button>
            </div>
          </section>
        )}

        {invoice.notes && (
          <p className="rounded-lg bg-muted/30 px-3 py-2 text-xs text-muted-foreground">{invoice.notes}</p>
        )}
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" size="sm" onClick={onClose}>
          Close
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={printReceipt}>
          {isPaid ? 'Print receipt' : 'Print statement'}
        </Button>
        {onPay && invoice.balanceDue > 0 && (
          <Button
            type="button"
            size="sm"
            variant="organic"
            className="border-none"
            disabled={paying}
            onClick={() => onPay(invoice)}
          >
            {paying ? 'Processing…' : 'Pay now'}
          </Button>
        )}
      </DialogFooter>
    </Dialog>
  );
}
