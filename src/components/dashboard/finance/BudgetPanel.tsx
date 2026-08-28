'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  api,
  type Budget,
  type BudgetUtilization,
  type BudgetTransfer,
  type FinancialYear,
  type FinanceAccount,
} from '@/lib/api';
import { readStoredSession } from '@/lib/auth';
import { TablePanel } from '@/components/dashboard/TablePanel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { Dialog, DialogFooter } from '@/components/ui/dialog';
import type { DataTableColumn } from '@/components/ui/data-table';

const inputClass =
  'w-full h-10 px-3 bg-muted/40 border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring';

function statusVariant(status: Budget['status']) {
  switch (status) {
    case 'approved':
      return 'success' as const;
    case 'rejected':
      return 'danger' as const;
    case 'returned':
      return 'warning' as const;
    case 'submitted':
    case 'under_review':
      return 'info' as const;
    case 'closed':
      return 'neutral' as const;
    default:
      return 'neutral' as const;
  }
}

function utilizationVariant(pct: number) {
  if (pct >= 100) return 'danger' as const;
  if (pct >= 90) return 'warning' as const;
  if (pct >= 80) return 'info' as const;
  return 'success' as const;
}

export function BudgetPanel() {
  const session = readStoredSession();
  const schoolId = session?.schoolId || 'sch-1';

  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [years, setYears] = useState<FinancialYear[]>([]);
  const [accounts, setAccounts] = useState<FinanceAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const [isNewOpen, setIsNewOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newYearId, setNewYearId] = useState('');

  const [detailId, setDetailId] = useState<string | null>(null);
  const [detail, setDetail] = useState<BudgetUtilization | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [lineDept, setLineDept] = useState('');
  const [lineAccountId, setLineAccountId] = useState('');
  const [lineAmount, setLineAmount] = useState('');

  const [xferFrom, setXferFrom] = useState('');
  const [xferTo, setXferTo] = useState('');
  const [xferAmount, setXferAmount] = useState('');
  const [xferReason, setXferReason] = useState('');

  const refresh = () =>
    api
      .listBudgets({ schoolId })
      .then(setBudgets)
      .finally(() => setLoading(false));

  useEffect(() => {
    refresh();
    api.listFinancialYears(schoolId).then((ys) => {
      setYears(ys);
      if (!newYearId && ys[0]) setNewYearId(ys.find((y) => y.status === 'active')?.id ?? ys[0].id);
    });
    api.listAccounts(schoolId).then((accts) => {
      const expenseAccounts = accts.filter((a) => a.accountType === 'expense' && a.parentId);
      setAccounts(expenseAccounts);
      if (expenseAccounts[0]) setLineAccountId(expenseAccounts[0].id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schoolId]);

  const yearById = useMemo(() => new Map(years.map((y) => [y.id, y])), [years]);

  const openDetail = (id: string) => {
    setDetailId(id);
    setDetailLoading(true);
    api
      .getBudgetUtilization(id)
      .then(setDetail)
      .finally(() => setDetailLoading(false));
  };

  const refreshDetail = () => {
    if (!detailId) return;
    setDetailLoading(true);
    api
      .getBudgetUtilization(detailId)
      .then(setDetail)
      .finally(() => setDetailLoading(false));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newYearId) return;
    setBusy(true);
    try {
      const created = await api.createBudget({ schoolId, financialYearId: newYearId, name: newName.trim() });
      await refresh();
      setIsNewOpen(false);
      setNewName('');
      openDetail(created.id);
      setMsg({ type: 'ok', text: `Budget "${created.name}" created as a draft.` });
    } catch (err) {
      setMsg({ type: 'err', text: err instanceof Error ? err.message : 'Could not create budget' });
    } finally {
      setBusy(false);
    }
  };

  const handleAddLine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detailId || !lineDept.trim() || !lineAccountId || !lineAmount) return;
    setBusy(true);
    try {
      await api.addBudgetLine(detailId, {
        department: lineDept.trim(),
        accountId: lineAccountId,
        allocatedAmount: Number(lineAmount),
      });
      setLineDept('');
      setLineAmount('');
      refreshDetail();
      setMsg({ type: 'ok', text: 'Budget line added.' });
    } catch (err) {
      setMsg({ type: 'err', text: err instanceof Error ? err.message : 'Could not add line' });
    } finally {
      setBusy(false);
    }
  };

  const removeLine = async (lineId: string) => {
    setBusy(true);
    try {
      await api.removeBudgetLine(lineId);
      refreshDetail();
    } catch (err) {
      setMsg({ type: 'err', text: err instanceof Error ? err.message : 'Could not remove line' });
    } finally {
      setBusy(false);
    }
  };

  const runAction = async (action: () => Promise<unknown>, okMsg: string) => {
    setBusy(true);
    try {
      await action();
      await refresh();
      refreshDetail();
      setMsg({ type: 'ok', text: okMsg });
    } catch (err) {
      setMsg({ type: 'err', text: err instanceof Error ? err.message : 'Action failed' });
    } finally {
      setBusy(false);
    }
  };

  const handleRequestTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detailId || !xferFrom || !xferTo || !xferAmount || !xferReason.trim()) return;
    await runAction(
      () =>
        api.createBudgetTransfer({
          schoolId,
          budgetId: detailId,
          fromLineId: xferFrom,
          toLineId: xferTo,
          amount: Number(xferAmount),
          reason: xferReason.trim(),
        }),
      'Transfer requested — awaiting approval.'
    );
    setXferAmount('');
    setXferReason('');
  };

  const columns: DataTableColumn<Budget>[] = [
    { key: 'name', header: 'Budget', sortable: true, render: (row) => <span className="text-xs font-semibold">{row.name}</span> },
    {
      key: 'financialYearId',
      header: 'Financial year',
      render: (row) => <span className="text-xs text-muted-foreground">{yearById.get(row.financialYearId)?.name ?? '—'}</span>,
    },
    { key: 'version', header: 'Version', render: (row) => <span className="text-xs text-muted-foreground">v{row.version}</span> },
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
    <TablePanel
      title="Budgets"
      description="Create, submit, and approve departmental budgets. Approved budgets are locked — changes only happen through tracked transfers."
      actions={
        <Button size="sm" variant="organic" className="border-none" onClick={() => setIsNewOpen(true)} disabled={!years.length}>
          + New Budget
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
      {!years.length && !loading && (
        <p className="mb-3 text-xs text-muted-foreground">
          Create a financial year in Settings before creating a budget.
        </p>
      )}
      <DataTable
        columns={columns}
        data={budgets}
        loading={loading}
        emptyTitle="No budgets yet"
        emptyDescription="Create a budget for the active financial year to start allocating department spending."
      />

      <Dialog isOpen={isNewOpen} onClose={() => setIsNewOpen(false)} title="New Budget">
        <form onSubmit={handleCreate} className="space-y-3">
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Financial year</label>
            <select className={inputClass} value={newYearId} onChange={(e) => setNewYearId(e.target.value)}>
              {years.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.name} {y.status === 'active' ? '(active)' : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Name</label>
            <input
              className={inputClass}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Operating Budget"
              required
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => setIsNewOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="organic" size="sm" disabled={busy}>
              Create
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {detailId && (
        <Dialog isOpen onClose={() => setDetailId(null)} title={detail?.budget.name ?? 'Budget'} size="xl">
          {detailLoading || !detail ? (
            <p className="text-xs text-muted-foreground">Loading…</p>
          ) : (
            <div className="space-y-5 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Badge variant={statusVariant(detail.budget.status)} size="sm">
                    {detail.budget.status.replace(/_/g, ' ')}
                  </Badge>
                  <span className="text-muted-foreground">
                    v{detail.budget.version} · {yearById.get(detail.budget.financialYearId)?.name ?? '—'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {['draft', 'returned'].includes(detail.budget.status) && (
                    <Button
                      size="sm"
                      variant="organic"
                      className="border-none text-[10px] h-7"
                      disabled={busy}
                      onClick={() => runAction(() => api.submitBudget(detail.budget.id), 'Budget submitted for approval.')}
                    >
                      Submit for approval
                    </Button>
                  )}
                  {['submitted', 'under_review'].includes(detail.budget.status) && (
                    <>
                      <Button
                        size="sm"
                        variant="organic"
                        className="border-none text-[10px] h-7"
                        disabled={busy}
                        onClick={() => runAction(() => api.approveBudget(detail.budget.id), 'Budget approved.')}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-[10px] h-7"
                        disabled={busy}
                        onClick={() =>
                          runAction(
                            () => api.returnBudget(detail.budget.id, 'Please revise line amounts'),
                            'Budget returned for correction.'
                          )
                        }
                      >
                        Return
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-[10px] h-7 text-destructive"
                        disabled={busy}
                        onClick={() => runAction(() => api.rejectBudget(detail.budget.id, 'Rejected'), 'Budget rejected.')}
                      >
                        Reject
                      </Button>
                    </>
                  )}
                  {['approved', 'rejected', 'closed'].includes(detail.budget.status) && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-[10px] h-7"
                      disabled={busy}
                      onClick={async () => {
                        setBusy(true);
                        try {
                          const revised = await api.reviseBudget(detail.budget.id);
                          await refresh();
                          openDetail(revised.id);
                          setMsg({ type: 'ok', text: `Revision v${revised.version} created as a new draft.` });
                        } catch (err) {
                          setMsg({ type: 'err', text: err instanceof Error ? err.message : 'Could not revise' });
                        } finally {
                          setBusy(false);
                        }
                      }}
                    >
                      Revise (new draft)
                    </Button>
                  )}
                </div>
              </div>

              {detail.budget.decisionReason && (
                <p className="rounded-lg border border-border/60 bg-muted/20 p-2 text-muted-foreground">
                  Last decision note: {detail.budget.decisionReason}
                </p>
              )}

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
                  <p className="text-[10px] font-semibold uppercase text-muted-foreground">Allocated</p>
                  <p className="mt-1 text-base font-bold tabular-nums">{detail.totals.allocated.toLocaleString()}</p>
                </div>
                <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
                  <p className="text-[10px] font-semibold uppercase text-muted-foreground">Actual</p>
                  <p className="mt-1 text-base font-bold tabular-nums">{detail.totals.actual.toLocaleString()}</p>
                </div>
                <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
                  <p className="text-[10px] font-semibold uppercase text-muted-foreground">Remaining</p>
                  <p className="mt-1 text-base font-bold tabular-nums">{detail.totals.remaining.toLocaleString()}</p>
                </div>
                <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
                  <p className="text-[10px] font-semibold uppercase text-muted-foreground">Utilization</p>
                  <Badge variant={utilizationVariant(detail.totals.utilizationPct)} size="sm" className="mt-1">
                    {detail.totals.utilizationPct}%
                  </Badge>
                </div>
              </div>

              <div>
                <p className="mb-2 font-semibold uppercase tracking-wide text-[10px] text-muted-foreground">
                  Budget lines
                </p>
                <div className="overflow-x-auto rounded-lg border border-border/60">
                  <table className="w-full text-left">
                    <thead className="bg-muted/30 text-[10px] uppercase text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2">Department</th>
                        <th className="px-3 py-2">Account</th>
                        <th className="px-3 py-2 text-right">Allocated</th>
                        <th className="px-3 py-2 text-right">Actual</th>
                        <th className="px-3 py-2 text-right">Remaining</th>
                        <th className="px-3 py-2 text-right">Util.</th>
                        {['draft', 'returned'].includes(detail.budget.status) && <th className="px-3 py-2" />}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {detail.lines.map((line) => (
                        <tr key={line.id}>
                          <td className="px-3 py-2">{line.department}</td>
                          <td className="px-3 py-2">
                            {line.accountCode} · {line.accountName}
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums">{line.allocatedAmount.toLocaleString()}</td>
                          <td className="px-3 py-2 text-right tabular-nums">{line.actual.toLocaleString()}</td>
                          <td className="px-3 py-2 text-right tabular-nums">{line.remaining.toLocaleString()}</td>
                          <td className="px-3 py-2 text-right">
                            <Badge variant={utilizationVariant(line.utilizationPct)} size="sm">
                              {line.utilizationPct}%
                            </Badge>
                          </td>
                          {['draft', 'returned'].includes(detail.budget.status) && (
                            <td className="px-3 py-2 text-right">
                              <button
                                type="button"
                                className="text-muted-foreground hover:text-destructive"
                                onClick={() => removeLine(line.id)}
                                aria-label={`Remove ${line.department} line`}
                              >
                                ×
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                      {!detail.lines.length && (
                        <tr>
                          <td colSpan={7} className="px-3 py-4 text-center text-muted-foreground">
                            No lines yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  Actual reflects paid expenses, paid supplier invoices, and (for the Salaries account) processed
                  payroll for this department — updated in real time as those transactions post.
                </p>
              </div>

              {['draft', 'returned'].includes(detail.budget.status) && (
                <form onSubmit={handleAddLine} className="rounded-xl border border-border/50 p-3">
                  <p className="mb-2 font-semibold uppercase tracking-wide text-[10px] text-muted-foreground">
                    Add budget line
                  </p>
                  <div className="grid gap-2 sm:grid-cols-[1fr_1.5fr_auto_auto]">
                    <input
                      className={inputClass}
                      placeholder="Department"
                      value={lineDept}
                      onChange={(e) => setLineDept(e.target.value)}
                      required
                    />
                    <select className={inputClass} value={lineAccountId} onChange={(e) => setLineAccountId(e.target.value)}>
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.code} — {a.name}
                        </option>
                      ))}
                    </select>
                    <input
                      className={`${inputClass} w-32`}
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Amount"
                      value={lineAmount}
                      onChange={(e) => setLineAmount(e.target.value)}
                      required
                    />
                    <Button type="submit" size="sm" variant="organic" className="border-none h-10" disabled={busy}>
                      Add
                    </Button>
                  </div>
                </form>
              )}

              <div>
                <p className="mb-2 font-semibold uppercase tracking-wide text-[10px] text-muted-foreground">
                  Transfers
                </p>
                <div className="divide-y divide-border/50 rounded-lg border border-border/60">
                  {detail.budget.status === 'approved' && (
                    <form onSubmit={handleRequestTransfer} className="p-3">
                      <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                        <select className={inputClass} value={xferFrom} onChange={(e) => setXferFrom(e.target.value)}>
                          <option value="">From line…</option>
                          {detail.lines.map((l) => (
                            <option key={l.id} value={l.id}>
                              {l.department} · {l.accountName} ({l.allocatedAmount.toLocaleString()})
                            </option>
                          ))}
                        </select>
                        <select className={inputClass} value={xferTo} onChange={(e) => setXferTo(e.target.value)}>
                          <option value="">To line…</option>
                          {detail.lines.map((l) => (
                            <option key={l.id} value={l.id}>
                              {l.department} · {l.accountName}
                            </option>
                          ))}
                        </select>
                        <input
                          className={`${inputClass} w-28`}
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="Amount"
                          value={xferAmount}
                          onChange={(e) => setXferAmount(e.target.value)}
                        />
                      </div>
                      <div className="mt-2 flex gap-2">
                        <input
                          className={inputClass}
                          placeholder="Reason"
                          value={xferReason}
                          onChange={(e) => setXferReason(e.target.value)}
                        />
                        <Button type="submit" size="sm" variant="outline" className="shrink-0" disabled={busy}>
                          Request transfer
                        </Button>
                      </div>
                    </form>
                  )}
                  {detail.budget.transfers.length === 0 ? (
                    <p className="p-3 text-muted-foreground">No transfers requested.</p>
                  ) : (
                    detail.budget.transfers.map((t: BudgetTransfer) => {
                      const from = detail.lines.find((l) => l.id === t.fromLineId);
                      const to = detail.lines.find((l) => l.id === t.toLineId);
                      return (
                        <div key={t.id} className="flex items-center justify-between gap-3 p-3">
                          <div className="min-w-0">
                            <p>
                              {t.amount.toLocaleString()} · {from?.department ?? '—'} → {to?.department ?? '—'}
                            </p>
                            <p className="text-[11px] text-muted-foreground">{t.reason}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={t.status === 'approved' ? 'success' : t.status === 'rejected' ? 'danger' : 'warning'}
                              size="sm"
                            >
                              {t.status}
                            </Badge>
                            {t.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-[10px] h-7"
                                  disabled={busy}
                                  onClick={() => runAction(() => api.approveBudgetTransfer(t.id), 'Transfer approved.')}
                                >
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-[10px] h-7"
                                  disabled={busy}
                                  onClick={() =>
                                    runAction(() => api.rejectBudgetTransfer(t.id, 'Rejected'), 'Transfer rejected.')
                                  }
                                >
                                  Reject
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}
        </Dialog>
      )}
    </TablePanel>
  );
}
