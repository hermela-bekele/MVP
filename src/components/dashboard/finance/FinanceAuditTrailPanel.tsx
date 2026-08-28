'use client';

import React, { useEffect, useState } from 'react';
import { api, type AuditLogEntry } from '@/lib/api';
import { readStoredSession } from '@/lib/auth';
import { TablePanel } from '@/components/dashboard/TablePanel';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import type { DataTableColumn } from '@/components/ui/data-table';

const FINANCE_ENTITY_TYPES = [
  'invoice',
  'payment',
  'financial_year',
  'financial_period',
  'chart_of_account',
  'employee',
].join(',');

function actionVariant(action: string) {
  if (action.includes('cancel') || action.includes('reject')) return 'danger' as const;
  if (action.includes('waive') || action.includes('close')) return 'warning' as const;
  if (action.includes('create') || action.includes('activate') || action.includes('seed')) return 'success' as const;
  return 'info' as const;
}

export function FinanceAuditTrailPanel() {
  const session = readStoredSession();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = () =>
    api
      .listAuditLogs({ entityTypes: FINANCE_ENTITY_TYPES, limit: 100 })
      .then(setLogs)
      .finally(() => setLoading(false));

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.schoolId]);

  const columns: DataTableColumn<AuditLogEntry>[] = [
    {
      key: 'createdAt',
      header: 'When',
      sortable: true,
      render: (row) => (
        <span className="text-xs text-muted-foreground">{new Date(row.createdAt).toLocaleString()}</span>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      sortable: true,
      render: (row) => (
        <Badge variant={actionVariant(row.action)} size="sm">
          {row.action}
        </Badge>
      ),
    },
    {
      key: 'entityType',
      header: 'Entity',
      render: (row) => (
        <span className="text-xs text-muted-foreground">
          {row.entityType}
          {row.entityId ? ` · ${row.entityId.slice(0, 12)}` : ''}
        </span>
      ),
    },
    {
      key: 'actor',
      header: 'By',
      render: (row) => <span className="text-xs">{row.actorName || row.actorEmail || 'System'}</span>,
    },
    {
      key: 'details',
      header: 'Details',
      render: (row) => (
        <span className="text-[11px] text-muted-foreground line-clamp-1 max-w-xs">
          {row.details && Object.keys(row.details).length ? JSON.stringify(row.details) : '—'}
        </span>
      ),
    },
  ];

  return (
    <TablePanel
      title="Finance Audit Trail"
      description="Every recorded finance action — invoices, payments, accounts, and financial years/periods — with who did it and when."
    >
      <DataTable
        columns={columns}
        data={logs}
        loading={loading}
        searchable
        searchKeys={['action', 'entityType']}
        emptyTitle="No finance activity yet"
        emptyDescription="Actions like recording a payment or creating a financial year will show up here."
      />
    </TablePanel>
  );
}
