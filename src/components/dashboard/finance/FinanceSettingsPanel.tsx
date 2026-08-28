'use client';

import React, { useEffect, useState } from 'react';
import { api, type FinancialYear, type FinancialPeriod } from '@/lib/api';
import { readStoredSession } from '@/lib/auth';
import { TablePanel } from '@/components/dashboard/TablePanel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { Dialog, DialogFooter } from '@/components/ui/dialog';
import type { DataTableColumn } from '@/components/ui/data-table';

const inputClass =
  'w-full h-10 px-3 bg-muted/40 border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring';

function statusVariant(status: FinancialYear['status']) {
  switch (status) {
    case 'active':
      return 'success' as const;
    case 'closed':
      return 'neutral' as const;
    default:
      return 'info' as const;
  }
}

export function FinanceSettingsPanel() {
  const session = readStoredSession();
  const schoolId = session?.schoolId || 'sch-1';

  const [years, setYears] = useState<FinancialYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [selected, setSelected] = useState<FinancialYear | null>(null);
  const [periods, setPeriods] = useState<FinancialPeriod[]>([]);
  const [periodsLoading, setPeriodsLoading] = useState(false);

  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const refresh = () =>
    api
      .listFinancialYears(schoolId)
      .then(setYears)
      .finally(() => setLoading(false));

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schoolId]);

  useEffect(() => {
    if (!selected) return;
    setPeriodsLoading(true);
    api
      .listFinancialPeriods({ schoolId, financialYearId: selected.id })
      .then(setPeriods)
      .finally(() => setPeriodsLoading(false));
  }, [selected, schoolId]);

  const resetForm = () => {
    setName('');
    setStartDate('');
    setEndDate('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !startDate || !endDate) return;
    setBusy(true);
    try {
      await api.createFinancialYear({ schoolId, name: name.trim(), startDate, endDate });
      await refresh();
      setIsNewOpen(false);
      resetForm();
      setMsg({ type: 'ok', text: `Financial year ${name} created with monthly periods.` });
    } catch (err) {
      setMsg({ type: 'err', text: err instanceof Error ? err.message : 'Could not create financial year' });
    } finally {
      setBusy(false);
    }
  };

  const handleActivate = async (fy: FinancialYear) => {
    setBusy(true);
    try {
      await api.activateFinancialYear(fy.id);
      await refresh();
      setMsg({ type: 'ok', text: `${fy.name} is now the active financial year.` });
    } catch (err) {
      setMsg({ type: 'err', text: err instanceof Error ? err.message : 'Activation failed' });
    } finally {
      setBusy(false);
    }
  };

  const handleClose = async (fy: FinancialYear) => {
    setBusy(true);
    try {
      await api.closeFinancialYear(fy.id);
      await refresh();
      setMsg({ type: 'ok', text: `${fy.name} closed.` });
    } catch (err) {
      setMsg({ type: 'err', text: err instanceof Error ? err.message : 'Close failed — close open periods first' });
    } finally {
      setBusy(false);
    }
  };

  const togglePeriod = async (period: FinancialPeriod) => {
    try {
      if (period.status === 'open') {
        await api.closeFinancialPeriod(period.id);
      } else {
        await api.reopenFinancialPeriod(period.id);
      }
      if (selected) {
        const next = await api.listFinancialPeriods({ schoolId, financialYearId: selected.id });
        setPeriods(next);
      }
    } catch (err) {
      setMsg({ type: 'err', text: err instanceof Error ? err.message : 'Update failed' });
    }
  };

  const columns: DataTableColumn<FinancialYear>[] = [
    { key: 'name', header: 'Financial year', sortable: true, render: (row) => <span className="text-xs font-semibold">{row.name}</span> },
    {
      key: 'range',
      header: 'Range',
      render: (row) => (
        <span className="text-xs text-muted-foreground">
          {row.startDate} → {row.endDate}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
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
        <div className="flex gap-1.5">
          <Button variant="ghost" size="sm" className="text-[10px] h-7" onClick={() => setSelected(row)}>
            Periods
          </Button>
          {row.status !== 'active' && row.status !== 'closed' && (
            <Button variant="ghost" size="sm" className="text-[10px] h-7" onClick={() => handleActivate(row)}>
              Activate
            </Button>
          )}
          {row.status === 'active' && (
            <Button variant="ghost" size="sm" className="text-[10px] h-7" onClick={() => handleClose(row)}>
              Close
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <TablePanel
      title="Financial Years"
      description="Define the school's financial calendar. Activating a year auto-generates its 12 monthly periods."
      actions={
        <Button size="sm" variant="organic" className="border-none" onClick={() => setIsNewOpen(true)}>
          + New Financial Year
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
        data={years}
        loading={loading}
        emptyTitle="No financial years yet"
        emptyDescription="Create one to start tracking periods, budgets, and closings."
      />

      <Dialog isOpen={isNewOpen} onClose={() => setIsNewOpen(false)} title="New Financial Year">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Name</label>
            <input
              className={inputClass}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. 2026/2027"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Start date</label>
              <input type="date" className={inputClass} value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
            </div>
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase">End date</label>
              <input type="date" className={inputClass} value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
            </div>
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

      {selected && (
        <Dialog isOpen onClose={() => setSelected(null)} title={`${selected.name} — Periods`} size="lg">
          {periodsLoading ? (
            <p className="text-xs text-muted-foreground">Loading periods…</p>
          ) : (
            <div className="divide-y divide-border/60">
              {periods.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div>
                    <p className="text-xs font-semibold">{p.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {p.startDate} → {p.endDate}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={p.status === 'open' ? 'success' : 'neutral'} size="sm">
                      {p.status}
                    </Badge>
                    <Button variant="ghost" size="sm" className="text-[10px] h-7" onClick={() => togglePeriod(p)}>
                      {p.status === 'open' ? 'Close' : 'Reopen'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Dialog>
      )}
    </TablePanel>
  );
}
