'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { api, uploadFile, type Expense, type FinanceAccount, type PaymentMethod } from '@/lib/api';
import { readStoredSession } from '@/lib/auth';
import { TablePanel } from '@/components/dashboard/TablePanel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { Dialog, DialogFooter } from '@/components/ui/dialog';
import type { DataTableColumn } from '@/components/ui/data-table';

const inputClass =
  'w-full h-10 px-3 bg-muted/40 border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring';

function statusVariant(status: Expense['status']) {
  switch (status) {
    case 'paid':
      return 'success' as const;
    case 'approved':
      return 'info' as const;
    case 'rejected':
    case 'cancelled':
      return 'danger' as const;
    case 'returned':
      return 'warning' as const;
    default:
      return 'neutral' as const;
  }
}

export function ExpensesPanel() {
  const session = readStoredSession();
  const schoolId = session?.schoolId || 'sch-1';

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [accounts, setAccounts] = useState<FinanceAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const [isNewOpen, setIsNewOpen] = useState(false);
  const [department, setDepartment] = useState('');
  const [accountId, setAccountId] = useState('');
  const [vendor, setVendor] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');

  const [detail, setDetail] = useState<Expense | null>(null);
  const [payMethod, setPayMethod] = useState<PaymentMethod>('bank_transfer');
  const [payRef, setPayRef] = useState('');

  const refresh = () =>
    api
      .listExpenses({ schoolId })
      .then(setExpenses)
      .finally(() => setLoading(false));

  useEffect(() => {
    refresh();
    api.listAccounts(schoolId).then((accts) => {
      const expenseAccounts = accts.filter((a) => a.accountType === 'expense' && a.parentId);
      setAccounts(expenseAccounts);
      if (expenseAccounts[0]) setAccountId(expenseAccounts[0].id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schoolId]);

  const accountById = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts]);

  const resetForm = () => {
    setDepartment('');
    setVendor('');
    setDescription('');
    setAmount('');
    setExpenseDate('');
    setAttachmentUrl('');
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadFile(file);
      setAttachmentUrl(url);
    } catch (err) {
      setMsg({ type: 'err', text: err instanceof Error ? err.message : 'Upload failed' });
    } finally {
      setUploading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!department.trim() || !accountId || !description.trim() || !amount || !expenseDate) return;
    setBusy(true);
    try {
      await api.createExpense({
        schoolId,
        department: department.trim(),
        accountId,
        vendor: vendor.trim() || undefined,
        description: description.trim(),
        amount: Number(amount),
        expenseDate,
        attachmentUrl: attachmentUrl || undefined,
      });
      await refresh();
      setIsNewOpen(false);
      resetForm();
      setMsg({ type: 'ok', text: 'Expense saved as draft.' });
    } catch (err) {
      setMsg({ type: 'err', text: err instanceof Error ? err.message : 'Could not create expense' });
    } finally {
      setBusy(false);
    }
  };

  const runAction = async (action: () => Promise<Expense>, okMsg: string) => {
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

  const columns: DataTableColumn<Expense>[] = [
    {
      key: 'description',
      header: 'Expense',
      sortable: true,
      render: (row) => (
        <div>
          <p className="text-xs font-semibold">{row.description}</p>
          <p className="text-[11px] text-muted-foreground">
            {row.department} · {row.accountCode} {row.accountName}
          </p>
        </div>
      ),
    },
    { key: 'amount', header: 'Amount', sortable: true, render: (row) => <span className="text-xs tabular-nums">{row.amount.toLocaleString()}</span> },
    { key: 'expenseDate', header: 'Date', sortable: true, render: (row) => <span className="text-xs text-muted-foreground">{row.expenseDate}</span> },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (row) => (
        <Badge variant={statusVariant(row.status)} size="sm">
          {row.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <Button variant="ghost" size="sm" className="text-[10px] h-7" onClick={() => setDetail(row)}>
          View
        </Button>
      ),
    },
  ];

  return (
    <TablePanel
      title="Expenses"
      description="Department expense requests — validated against the approved budget before they're submitted, then approved and paid."
      actions={
        <Button size="sm" variant="organic" className="border-none" onClick={() => setIsNewOpen(true)} disabled={!accounts.length}>
          + New Expense
        </Button>
      }
    >
      {msg && (
        <div
          className={`mb-3 rounded-xl border px-4 py-3 text-xs ${
            msg.type === 'ok'
              ? 'border-success/30 bg-success/10 text-success'
              : 'border-destructive/30 bg-destructive/10 text-destructive'
          }`}
        >
          {msg.text}
        </div>
      )}
      <DataTable
        columns={columns}
        data={expenses}
        loading={loading}
        searchable
        searchKeys={['description', 'department', 'vendor']}
        emptyTitle="No expenses recorded"
        emptyDescription="Log a department expense request to start tracking spend against the budget."
      />

      <Dialog isOpen={isNewOpen} onClose={() => setIsNewOpen(false)} title="New Expense Request">
        <form onSubmit={handleCreate} className="space-y-3">
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
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Description</label>
            <input className={inputClass} value={description} onChange={(e) => setDescription(e.target.value)} required />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Vendor (optional)</label>
              <input className={inputClass} value={vendor} onChange={(e) => setVendor(e.target.value)} />
            </div>
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Amount</label>
              <input className={inputClass} type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
            </div>
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Date</label>
              <input type="date" className={inputClass} value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} required />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Receipt / attachment (optional)</label>
            <input
              type="file"
              className="block w-full text-xs text-muted-foreground"
              onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
            />
            {uploading && <p className="mt-1 text-[11px] text-muted-foreground">Uploading…</p>}
            {attachmentUrl && !uploading && <p className="mt-1 text-[11px] text-success">Attached.</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => setIsNewOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="organic" size="sm" disabled={busy}>
              Save as draft
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {detail && (
        <Dialog isOpen onClose={() => setDetail(null)} title={detail.description}>
          <div className="space-y-4 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={statusVariant(detail.status)} size="sm">
                {detail.status}
              </Badge>
              <span className="text-muted-foreground">
                {detail.department} · {accountById.get(detail.accountId)?.code ?? detail.accountCode} {detail.accountName}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-border/60 bg-muted/20 p-2">
                <p className="text-[10px] uppercase text-muted-foreground">Amount</p>
                <p className="text-base font-bold tabular-nums">{detail.amount.toLocaleString()}</p>
              </div>
              <div className="rounded-lg border border-border/60 bg-muted/20 p-2">
                <p className="text-[10px] uppercase text-muted-foreground">Date</p>
                <p className="text-sm">{detail.expenseDate}</p>
              </div>
            </div>
            {detail.vendor && <p className="text-muted-foreground">Vendor: {detail.vendor}</p>}
            {detail.attachmentUrl && (
              <a href={detail.attachmentUrl} target="_blank" rel="noreferrer" className="text-primary underline">
                View attachment
              </a>
            )}
            {detail.decisionReason && (
              <p className="rounded-lg border border-border/60 bg-muted/20 p-2 text-muted-foreground">
                Decision note: {detail.decisionReason}
              </p>
            )}
            {detail.status === 'paid' && (
              <p className="text-muted-foreground">
                Paid via {detail.paymentMethod} {detail.paymentReference ? `(ref ${detail.paymentReference})` : ''}
              </p>
            )}

            <div className="flex flex-wrap gap-1.5 pt-1">
              {['draft', 'returned'].includes(detail.status) && (
                <Button
                  size="sm"
                  variant="organic"
                  className="border-none text-[10px] h-7"
                  disabled={busy}
                  onClick={() => runAction(() => api.submitExpense(detail.id), 'Submitted for approval.')}
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
                    onClick={() => runAction(() => api.approveExpense(detail.id), 'Expense approved.')}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-[10px] h-7"
                    disabled={busy}
                    onClick={() => runAction(() => api.returnExpense(detail.id, 'Please provide more detail'), 'Returned for correction.')}
                  >
                    Return
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-[10px] h-7 text-destructive"
                    disabled={busy}
                    onClick={() => runAction(() => api.rejectExpense(detail.id, 'Rejected'), 'Expense rejected.')}
                  >
                    Reject
                  </Button>
                </>
              )}
              {['draft', 'submitted', 'returned'].includes(detail.status) && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-[10px] h-7 text-destructive"
                  disabled={busy}
                  onClick={() => runAction(() => api.cancelExpense(detail.id, 'Cancelled'), 'Expense cancelled.')}
                >
                  Cancel
                </Button>
              )}
            </div>

            {detail.status === 'approved' && (
              <div className="rounded-xl border border-border/50 p-3">
                <p className="mb-2 font-semibold uppercase tracking-wide text-[10px] text-muted-foreground">Record payment</p>
                <div className="grid grid-cols-2 gap-2">
                  <select className={inputClass} value={payMethod} onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}>
                    <option value="bank_transfer">Bank transfer</option>
                    <option value="cash">Cash</option>
                    <option value="mobile_money">Mobile money</option>
                    <option value="cheque">Cheque</option>
                  </select>
                  <input className={inputClass} placeholder="Reference (optional)" value={payRef} onChange={(e) => setPayRef(e.target.value)} />
                </div>
                <Button
                  size="sm"
                  variant="organic"
                  className="mt-2 border-none"
                  disabled={busy}
                  onClick={() =>
                    runAction(
                      () => api.payExpense(detail.id, { paymentMethod: payMethod, paymentReference: payRef || undefined }),
                      'Expense marked as paid.'
                    )
                  }
                >
                  Mark as paid
                </Button>
              </div>
            )}
          </div>
        </Dialog>
      )}
    </TablePanel>
  );
}
