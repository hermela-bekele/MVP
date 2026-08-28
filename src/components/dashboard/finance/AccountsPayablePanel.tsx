'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { api, type Supplier, type SupplierInvoice, type FinanceAccount, type PaymentMethod } from '@/lib/api';
import { readStoredSession } from '@/lib/auth';
import { TablePanel } from '@/components/dashboard/TablePanel';
import { ContentCard } from '@/components/dashboard/ContentCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { Dialog, DialogFooter } from '@/components/ui/dialog';
import type { DataTableColumn } from '@/components/ui/data-table';

const inputClass =
  'w-full h-10 px-3 bg-muted/40 border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring';

function statusVariant(status: SupplierInvoice['status']) {
  switch (status) {
    case 'paid':
      return 'success' as const;
    case 'partially_paid':
      return 'info' as const;
    case 'approved':
      return 'info' as const;
    case 'rejected':
    case 'cancelled':
      return 'danger' as const;
    default:
      return 'neutral' as const;
  }
}

export function AccountsPayablePanel() {
  const session = readStoredSession();
  const schoolId = session?.schoolId || 'sch-1';

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [invoices, setInvoices] = useState<SupplierInvoice[]>([]);
  const [accounts, setAccounts] = useState<FinanceAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const [isSuppliersOpen, setIsSuppliersOpen] = useState(false);
  const [supName, setSupName] = useState('');
  const [supEmail, setSupEmail] = useState('');
  const [supPhone, setSupPhone] = useState('');

  const [isNewInvoiceOpen, setIsNewInvoiceOpen] = useState(false);
  const [supplierId, setSupplierId] = useState('');
  const [department, setDepartment] = useState('');
  const [accountId, setAccountId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [poReference, setPoReference] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [subtotal, setSubtotal] = useState('');
  const [taxAmount, setTaxAmount] = useState('');

  const [detail, setDetail] = useState<SupplierInvoice | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState<PaymentMethod>('bank_transfer');
  const [payRef, setPayRef] = useState('');

  const refresh = () =>
    api
      .listSupplierInvoices({ schoolId })
      .then(setInvoices)
      .finally(() => setLoading(false));

  useEffect(() => {
    refresh();
    api.listSuppliers(schoolId).then((s) => {
      setSuppliers(s);
      if (s[0]) setSupplierId(s[0].id);
    });
    api.listAccounts(schoolId).then((accts) => {
      const expenseAccounts = accts.filter((a) => a.accountType === 'expense' && a.parentId);
      setAccounts(expenseAccounts);
      if (expenseAccounts[0]) setAccountId(expenseAccounts[0].id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schoolId]);

  const supplierById = useMemo(() => new Map(suppliers.map((s) => [s.id, s])), [suppliers]);

  const openDetail = (id: string) => api.getSupplierInvoice(id).then(setDetail);

  const handleAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supName.trim()) return;
    setBusy(true);
    try {
      const created = await api.createSupplier({ schoolId, name: supName.trim(), email: supEmail || undefined, phone: supPhone || undefined });
      setSuppliers((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setSupplierId(created.id);
      setSupName('');
      setSupEmail('');
      setSupPhone('');
      setMsg({ type: 'ok', text: `Supplier "${created.name}" added.` });
    } catch (err) {
      setMsg({ type: 'err', text: err instanceof Error ? err.message : 'Could not add supplier' });
    } finally {
      setBusy(false);
    }
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId || !department.trim() || !accountId || !invoiceNumber.trim() || !invoiceDate || !dueDate || !subtotal) return;
    setBusy(true);
    try {
      await api.createSupplierInvoice({
        schoolId,
        supplierId,
        department: department.trim(),
        accountId,
        invoiceNumber: invoiceNumber.trim(),
        poReference: poReference.trim() || undefined,
        invoiceDate,
        dueDate,
        subtotal: Number(subtotal),
        taxAmount: taxAmount ? Number(taxAmount) : undefined,
      });
      await refresh();
      setIsNewInvoiceOpen(false);
      setInvoiceNumber('');
      setPoReference('');
      setSubtotal('');
      setTaxAmount('');
      setMsg({ type: 'ok', text: 'Supplier invoice recorded as draft.' });
    } catch (err) {
      setMsg({ type: 'err', text: err instanceof Error ? err.message : 'Could not create invoice' });
    } finally {
      setBusy(false);
    }
  };

  const runAction = async (action: () => Promise<SupplierInvoice>, okMsg: string) => {
    setBusy(true);
    try {
      const updated = await action();
      setDetail(updated);
      await refresh();
      setMsg({ type: 'ok', text: okMsg });
    } catch (err) {
      setMsg({ type: 'err', text: err instanceof Error ? err.message : 'Action failed' });
    } finally {
      setBusy(false);
    }
  };

  const handlePay = async () => {
    if (!detail || !payAmount) return;
    await runAction(
      () => api.recordSupplierPayment(detail.id, { amount: Number(payAmount), method: payMethod, reference: payRef || undefined }),
      'Payment recorded.'
    );
    setPayAmount('');
    setPayRef('');
  };

  const columns: DataTableColumn<SupplierInvoice>[] = [
    {
      key: 'invoiceNumber',
      header: 'Invoice',
      sortable: true,
      render: (row) => (
        <div>
          <p className="text-xs font-semibold">{row.invoiceNumber}</p>
          <p className="text-[11px] text-muted-foreground">{row.supplierName}</p>
        </div>
      ),
    },
    {
      key: 'department',
      header: 'Department / account',
      render: (row) => (
        <span className="text-xs text-muted-foreground">
          {row.department} · {row.accountCode} {row.accountName}
        </span>
      ),
    },
    {
      key: 'balanceDue',
      header: 'Balance',
      sortable: true,
      render: (row) => (
        <span className="text-xs tabular-nums">
          {row.balanceDue.toLocaleString()} / {(row.subtotal + row.taxAmount).toLocaleString()}
        </span>
      ),
    },
    { key: 'dueDate', header: 'Due', sortable: true, render: (row) => <span className="text-xs text-muted-foreground">{row.dueDate}</span> },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (row) => (
        <Badge variant={statusVariant(row.status)} size="sm">
          {row.status.replace(/_/g, ' ')}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <Button variant="ghost" size="sm" className="text-[10px] h-7" onClick={() => openDetail(row.id)}>
          View
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <ContentCard
        title="Suppliers"
        description={`${suppliers.length} on file`}
        actions={
          <Button size="sm" variant="outline" onClick={() => setIsSuppliersOpen(true)}>
            Manage suppliers
          </Button>
        }
      >
        {suppliers.length === 0 ? (
          <p className="text-xs text-muted-foreground">No suppliers yet — add one to start recording invoices.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {suppliers.slice(0, 12).map((s) => (
              <Badge key={s.id} variant={s.isActive ? 'neutral' : 'danger'} size="sm">
                {s.name}
              </Badge>
            ))}
            {suppliers.length > 12 && <span className="text-xs text-muted-foreground">+{suppliers.length - 12} more</span>}
          </div>
        )}
      </ContentCard>

      {msg && (
        <div
          className={`rounded-xl border px-4 py-3 text-xs ${
            msg.type === 'ok'
              ? 'border-success/30 bg-success/10 text-success'
              : 'border-destructive/30 bg-destructive/10 text-destructive'
          }`}
        >
          {msg.text}
        </div>
      )}

      <TablePanel
        title="Supplier Invoices"
        description="Recorded, submitted, approved, and paid supplier invoices. Duplicate invoice numbers per supplier are rejected automatically."
        actions={
          <Button
            size="sm"
            variant="organic"
            className="border-none"
            onClick={() => setIsNewInvoiceOpen(true)}
            disabled={!suppliers.length || !accounts.length}
          >
            + New Invoice
          </Button>
        }
      >
        <DataTable
          columns={columns}
          data={invoices}
          loading={loading}
          searchable
          searchKeys={['invoiceNumber']}
          emptyTitle="No supplier invoices yet"
          emptyDescription="Add a supplier, then record their invoice here."
        />
      </TablePanel>

      <Dialog isOpen={isSuppliersOpen} onClose={() => setIsSuppliersOpen(false)} title="Suppliers" size="lg">
        <div className="space-y-4 text-xs">
          <form onSubmit={handleAddSupplier} className="grid gap-2 sm:grid-cols-[1.5fr_1.5fr_1fr_auto]">
            <input className={inputClass} placeholder="Name" value={supName} onChange={(e) => setSupName(e.target.value)} required />
            <input className={inputClass} placeholder="Email (optional)" value={supEmail} onChange={(e) => setSupEmail(e.target.value)} />
            <input className={inputClass} placeholder="Phone (optional)" value={supPhone} onChange={(e) => setSupPhone(e.target.value)} />
            <Button type="submit" size="sm" variant="organic" className="border-none h-10" disabled={busy}>
              Add
            </Button>
          </form>
          <div className="divide-y divide-border/60 rounded-lg border border-border/60">
            {suppliers.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-3 p-2.5">
                <div>
                  <p className="font-semibold">{s.name}</p>
                  <p className="text-[11px] text-muted-foreground">{[s.email, s.phone].filter(Boolean).join(' · ') || '—'}</p>
                </div>
                <Badge variant={s.isActive ? 'success' : 'neutral'} size="sm">
                  {s.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            ))}
            {!suppliers.length && <p className="p-3 text-muted-foreground">No suppliers yet.</p>}
          </div>
        </div>
      </Dialog>

      <Dialog isOpen={isNewInvoiceOpen} onClose={() => setIsNewInvoiceOpen(false)} title="New Supplier Invoice">
        <form onSubmit={handleCreateInvoice} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Supplier</label>
              <select className={inputClass} value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Invoice number</label>
              <input className={inputClass} value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Department</label>
              <input className={inputClass} value={department} onChange={(e) => setDepartment(e.target.value)} required />
            </div>
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Category (account)</label>
              <select className={inputClass} value={accountId} onChange={(e) => setAccountId(e.target.value)}>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.code} — {a.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase">PO reference (optional)</label>
            <input className={inputClass} value={poReference} onChange={(e) => setPoReference(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Invoice date</label>
              <input type="date" className={inputClass} value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} required />
            </div>
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Due date</label>
              <input type="date" className={inputClass} value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Subtotal</label>
              <input className={inputClass} type="number" min="0" step="0.01" value={subtotal} onChange={(e) => setSubtotal(e.target.value)} required />
            </div>
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Tax (optional)</label>
              <input className={inputClass} type="number" min="0" step="0.01" value={taxAmount} onChange={(e) => setTaxAmount(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => setIsNewInvoiceOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="organic" size="sm" disabled={busy}>
              Save as draft
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {detail && (
        <Dialog isOpen onClose={() => setDetail(null)} title={`${detail.invoiceNumber} — ${supplierById.get(detail.supplierId)?.name ?? detail.supplierName}`} size="lg">
          <div className="space-y-4 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={statusVariant(detail.status)} size="sm">
                {detail.status.replace(/_/g, ' ')}
              </Badge>
              <span className="text-muted-foreground">
                {detail.department} · {detail.accountCode} {detail.accountName}
              </span>
              {detail.poReference && <span className="text-muted-foreground">· PO {detail.poReference}</span>}
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-border/60 bg-muted/20 p-2">
                <p className="text-[10px] uppercase text-muted-foreground">Total</p>
                <p className="text-base font-bold tabular-nums">{(detail.subtotal + detail.taxAmount).toLocaleString()}</p>
              </div>
              <div className="rounded-lg border border-border/60 bg-muted/20 p-2">
                <p className="text-[10px] uppercase text-muted-foreground">Paid</p>
                <p className="text-base font-bold tabular-nums">{detail.amountPaid.toLocaleString()}</p>
              </div>
              <div className="rounded-lg border border-border/60 bg-muted/20 p-2">
                <p className="text-[10px] uppercase text-muted-foreground">Balance</p>
                <p className="text-base font-bold tabular-nums">{detail.balanceDue.toLocaleString()}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {detail.status === 'draft' && (
                <Button
                  size="sm"
                  variant="organic"
                  className="border-none text-[10px] h-7"
                  disabled={busy}
                  onClick={() => runAction(() => api.submitSupplierInvoice(detail.id), 'Submitted for approval.')}
                >
                  Submit
                </Button>
              )}
              {detail.status === 'submitted' && (
                <>
                  <Button
                    size="sm"
                    variant="organic"
                    className="border-none text-[10px] h-7"
                    disabled={busy}
                    onClick={() => runAction(() => api.approveSupplierInvoice(detail.id), 'Invoice approved.')}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-[10px] h-7 text-destructive"
                    disabled={busy}
                    onClick={() => runAction(() => api.rejectSupplierInvoice(detail.id, 'Rejected'), 'Invoice rejected.')}
                  >
                    Reject
                  </Button>
                </>
              )}
              {detail.amountPaid === 0 && !['cancelled', 'rejected'].includes(detail.status) && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-[10px] h-7 text-destructive"
                  disabled={busy}
                  onClick={() => runAction(() => api.cancelSupplierInvoice(detail.id, 'Cancelled'), 'Invoice cancelled.')}
                >
                  Cancel
                </Button>
              )}
            </div>

            {['approved', 'partially_paid'].includes(detail.status) && (
              <div className="rounded-xl border border-border/50 p-3">
                <p className="mb-2 font-semibold uppercase tracking-wide text-[10px] text-muted-foreground">Record payment</p>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    className={inputClass}
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder={`Up to ${detail.balanceDue.toLocaleString()}`}
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                  />
                  <select className={inputClass} value={payMethod} onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}>
                    <option value="bank_transfer">Bank transfer</option>
                    <option value="cash">Cash</option>
                    <option value="mobile_money">Mobile money</option>
                    <option value="cheque">Cheque</option>
                  </select>
                  <input className={inputClass} placeholder="Reference" value={payRef} onChange={(e) => setPayRef(e.target.value)} />
                </div>
                <Button size="sm" variant="organic" className="mt-2 border-none" disabled={busy} onClick={handlePay}>
                  Record payment
                </Button>
              </div>
            )}

            <div>
              <p className="mb-2 font-semibold uppercase tracking-wide text-[10px] text-muted-foreground">Payment history</p>
              {detail.payments?.length ? (
                <div className="divide-y divide-border/50 rounded-lg border border-border/60">
                  {detail.payments.map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-2.5">
                      <span>
                        {p.amount.toLocaleString()} · {p.method} {p.reference ? `(${p.reference})` : ''}
                      </span>
                      <span className="text-muted-foreground">{new Date(p.paidAt).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No payments recorded yet.</p>
              )}
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}
