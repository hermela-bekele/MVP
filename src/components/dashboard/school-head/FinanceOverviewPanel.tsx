'use client';

import React, { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { api, type Invoice } from '@/lib/api';
import { KpiGrid, KpiWidget } from '@/components/dashboard/KpiWidget';
import { TablePanel } from '@/components/dashboard/TablePanel';
import { Badge } from '@/components/ui/badge';

function deadlineVariant(color: Invoice['deadlineColor']) {
  if (color === 'green') return 'success' as const;
  if (color === 'yellow') return 'warning' as const;
  return 'danger' as const;
}

/** Read-only finance snapshot surfaced to the school head from the Administrative Engine. */
export const FinanceOverviewPanel: React.FC = () => {
  const { currentUser } = useApp();
  const schoolId = currentUser?.schoolId || 'sch-1';
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [collectionRate, setCollectionRate] = useState<number | null>(null);
  const [billed, setBilled] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    void api.listInvoices({ schoolId }).then((rows) => {
      if (!cancelled) setInvoices(rows);
    }).catch(() => {
      if (!cancelled) setInvoices([]);
    });
    void api
      .financeAgingReport(schoolId)
      .then((report) => {
        if (cancelled) return;
        const r = report as { collectionRate?: number; billed?: number };
        setCollectionRate(r.collectionRate ?? null);
        setBilled(r.billed ?? null);
      })
      .catch(() => {
        if (!cancelled) {
          setCollectionRate(null);
          setBilled(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [schoolId]);

  const open = invoices.filter((i) => i.balanceDue > 0);
  const overdue = invoices.filter((i) => i.deadlineColor === 'red' && i.balanceDue > 0);
  const collected = invoices.reduce((sum, i) => sum + i.amountPaid, 0);

  return (
    <div className="space-y-6 animate-fade-in text-left">
      <KpiGrid>
        <KpiWidget label="Open Invoices" value={open.length} tone="emphasis" />
        <KpiWidget label="Overdue" value={overdue.length} hint="Past due date" />
        <KpiWidget label="Collected" value={`${collected.toLocaleString()} ETB`} />
        <KpiWidget
          label="Collection Rate"
          value={collectionRate !== null ? `${collectionRate}%` : '—'}
          hint={billed !== null ? `Billed ${billed.toLocaleString()} ETB` : 'Aging report'}
        />
      </KpiGrid>

      <TablePanel title="Invoices" description="School billing status, read-only view for oversight">
        {invoices.length ? (
          <table className="eskooly-table">
            <thead>
              <tr>
                <th className="p-3 text-left text-muted-foreground font-semibold">Invoice</th>
                <th className="p-3 text-left text-muted-foreground font-semibold">Type</th>
                <th className="p-3 text-left text-muted-foreground font-semibold">Due Date</th>
                <th className="p-3 text-left text-muted-foreground font-semibold">Balance</th>
                <th className="p-3 text-left text-muted-foreground font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 text-muted-foreground">
              {invoices.slice(0, 10).map((inv) => (
                <tr key={inv.id} className="hover:bg-muted/10">
                  <td className="p-3 text-foreground font-bold">{inv.invoiceNumber}</td>
                  <td className="p-3">{inv.invoiceType}</td>
                  <td className="p-3">{inv.dueDate}</td>
                  <td className="p-3 font-mono">{inv.balanceDue.toLocaleString()} {inv.currency}</td>
                  <td className="p-3">
                    <Badge variant={deadlineVariant(inv.deadlineColor)} size="sm" className="font-bold">
                      {inv.status.replace(/_/g, ' ')}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="p-6 text-center text-xxs text-muted-foreground">No invoices yet.</p>
        )}
      </TablePanel>
    </div>
  );
};
