'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { api, type FinanceAccount } from '@/lib/api';
import { readStoredSession } from '@/lib/auth';
import { TablePanel } from '@/components/dashboard/TablePanel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { Dialog, DialogFooter } from '@/components/ui/dialog';
import type { DataTableColumn } from '@/components/ui/data-table';

const inputClass =
  'w-full h-10 px-3 bg-muted/40 border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring';

const TYPE_LABEL: Record<FinanceAccount['accountType'], string> = {
  asset: 'Asset',
  liability: 'Liability',
  equity: 'Equity',
  revenue: 'Revenue',
  expense: 'Expense',
};

function typeVariant(type: FinanceAccount['accountType']) {
  switch (type) {
    case 'asset':
      return 'info' as const;
    case 'liability':
      return 'warning' as const;
    case 'equity':
      return 'primary' as const;
    case 'revenue':
      return 'success' as const;
    default:
      return 'danger' as const;
  }
}

export function ChartOfAccountsPanel() {
  const session = readStoredSession();
  const schoolId = session?.schoolId || 'sch-1';

  const [accounts, setAccounts] = useState<FinanceAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [isNewOpen, setIsNewOpen] = useState(false);

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [accountType, setAccountType] = useState<FinanceAccount['accountType']>('expense');
  const [parentId, setParentId] = useState('');
  const [description, setDescription] = useState('');

  const refresh = () =>
    api
      .listAccounts(schoolId)
      .then(setAccounts)
      .finally(() => setLoading(false));

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schoolId]);

  const parentOptions = useMemo(
    () => accounts.filter((a) => !a.parentId || a.accountType === accountType),
    [accounts, accountType]
  );

  const codeToDepth = useMemo(() => {
    const byId = new Map(accounts.map((a) => [a.id, a]));
    const depth = (a: FinanceAccount): number => {
      let d = 0;
      let cur: FinanceAccount | undefined = a;
      while (cur?.parentId) {
        cur = byId.get(cur.parentId);
        d += 1;
        if (d > 5) break;
      }
      return d;
    };
    const map = new Map<string, number>();
    for (const a of accounts) map.set(a.id, depth(a));
    return map;
  }, [accounts]);

  const resetForm = () => {
    setCode('');
    setName('');
    setAccountType('expense');
    setParentId('');
    setDescription('');
  };

  const handleSeed = async () => {
    setBusy(true);
    try {
      const result = await api.seedChartOfAccounts(schoolId);
      setAccounts(result.accounts);
      setMsg({ type: 'ok', text: `${result.insertedCount} default accounts added.` });
    } catch (err) {
      setMsg({ type: 'err', text: err instanceof Error ? err.message : 'Seeding failed' });
    } finally {
      setBusy(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) return;
    setBusy(true);
    try {
      await api.createAccount({
        schoolId,
        code: code.trim(),
        name: name.trim(),
        accountType,
        parentId: parentId || null,
        description: description.trim() || undefined,
      });
      await refresh();
      setIsNewOpen(false);
      resetForm();
      setMsg({ type: 'ok', text: `Account ${code} created.` });
    } catch (err) {
      setMsg({ type: 'err', text: err instanceof Error ? err.message : 'Could not create account' });
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async (account: FinanceAccount) => {
    try {
      await api.updateAccount(account.id, { isActive: !account.isActive });
      await refresh();
    } catch (err) {
      setMsg({ type: 'err', text: err instanceof Error ? err.message : 'Update failed' });
    }
  };

  const columns: DataTableColumn<FinanceAccount>[] = [
    {
      key: 'code',
      header: 'Code',
      sortable: true,
      render: (row) => (
        <span
          className="text-xs font-mono font-semibold"
          style={{ paddingLeft: `${(codeToDepth.get(row.id) ?? 0) * 16}px` }}
        >
          {row.code}
        </span>
      ),
    },
    { key: 'name', header: 'Name', sortable: true, render: (row) => <span className="text-xs">{row.name}</span> },
    {
      key: 'accountType',
      header: 'Type',
      render: (row) => (
        <Badge variant={typeVariant(row.accountType)} size="sm">
          {TYPE_LABEL[row.accountType]}
        </Badge>
      ),
    },
    {
      key: 'normalBalance',
      header: 'Normal balance',
      render: (row) => <span className="text-xs text-muted-foreground capitalize">{row.normalBalance}</span>,
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (row) => (
        <Badge variant={row.isActive ? 'success' : 'neutral'} size="sm">
          {row.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <Button variant="ghost" size="sm" className="text-[10px] h-7" onClick={() => toggleActive(row)}>
          {row.isActive ? 'Deactivate' : 'Activate'}
        </Button>
      ),
    },
  ];

  return (
    <TablePanel
      title="Chart of Accounts"
      description="The account structure other finance modules (budget, ledger, payables) will post against."
      actions={
        <div className="flex gap-2">
          {accounts.length === 0 && (
            <Button size="sm" variant="outline" disabled={busy} onClick={handleSeed}>
              Seed default accounts
            </Button>
          )}
          <Button size="sm" variant="organic" className="border-none" onClick={() => setIsNewOpen(true)}>
            + Add Account
          </Button>
        </div>
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
        data={accounts}
        loading={loading}
        searchable
        searchKeys={['code', 'name']}
        emptyTitle="No accounts yet"
        emptyDescription="Seed the default chart of accounts or add your own to get started."
      />

      <Dialog isOpen={isNewOpen} onClose={() => setIsNewOpen(false)} title="Add Account">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Code</label>
              <input className={inputClass} value={code} onChange={(e) => setCode(e.target.value)} required />
            </div>
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Type</label>
              <select
                className={inputClass}
                value={accountType}
                onChange={(e) => setAccountType(e.target.value as FinanceAccount['accountType'])}
              >
                <option value="asset">Asset</option>
                <option value="liability">Liability</option>
                <option value="equity">Equity</option>
                <option value="revenue">Revenue</option>
                <option value="expense">Expense</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Name</label>
            <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Parent account (optional)</label>
            <select className={inputClass} value={parentId} onChange={(e) => setParentId(e.target.value)}>
              <option value="">No parent</option>
              {parentOptions.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.code} — {a.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Description (optional)</label>
            <textarea className={`${inputClass} h-16 py-2`} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => setIsNewOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="organic" size="sm" disabled={busy}>
              Create Account
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </TablePanel>
  );
}
