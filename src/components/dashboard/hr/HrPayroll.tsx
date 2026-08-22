'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { TablePanel } from '@/components/dashboard/TablePanel';
import { KpiWidget, KpiGrid } from '@/components/dashboard/KpiWidget';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import type { DataTableColumn } from '@/components/ui/data-table';
import type { PayrollRecord } from '@/lib/hrPortal';
import { hrStatusBadgeVariant, formatCurrency } from '@/lib/hrPortal';

export const HrPayroll: React.FC = () => {
  const { payrollRecords, hrEmployees, processPayroll, updatePayrollStatus } = useApp();
  // Default to the most recent month actually on record, not a fixed literal that goes stale.
  const latestPayrollMonth = useMemo(
    () => payrollRecords.reduce((max, p) => (p.month > max ? p.month : max), ''),
    [payrollRecords]
  );
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [monthTouched, setMonthTouched] = useState(false);

  useEffect(() => {
    if (!monthTouched && latestPayrollMonth) setSelectedMonth(latestPayrollMonth);
  }, [monthTouched, latestPayrollMonth]);

  const monthRecords = useMemo(
    () => payrollRecords.filter((p) => p.month === selectedMonth),
    [payrollRecords, selectedMonth]
  );

  const totalNet = monthRecords.reduce((sum, p) => sum + p.netPay, 0);
  const paidCount = monthRecords.filter((p) => p.status === 'Paid').length;
  const unprocessedEmployees = hrEmployees.filter(
    (e) => e.status === 'Active' && !monthRecords.some((p) => p.employeeId === e.id)
  );

  const handleProcessAll = () => {
    unprocessedEmployees.forEach((e) => processPayroll(e.id, selectedMonth));
  };

  const columns: DataTableColumn<PayrollRecord>[] = [
    {
      key: 'employeeName',
      header: 'Employee',
      sortable: true,
      render: (row) => <p className="text-xs font-semibold">{row.employeeName}</p>,
    },
    {
      key: 'baseSalary',
      header: 'Base',
      render: (row) => <span className="text-xs">{formatCurrency(row.baseSalary)}</span>,
    },
    {
      key: 'allowances',
      header: 'Allowances',
      render: (row) => <span className="text-xs text-primary">+{formatCurrency(row.allowances)}</span>,
    },
    {
      key: 'deductions',
      header: 'Deductions',
      render: (row) => <span className="text-xs text-destructive">-{formatCurrency(row.deductions)}</span>,
    },
    {
      key: 'netPay',
      header: 'Net Pay',
      sortable: true,
      render: (row) => <span className="text-xs font-bold">{formatCurrency(row.netPay)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (row) => (
        <Badge variant={hrStatusBadgeVariant(row.status)} size="sm">{row.status}</Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) =>
        row.status === 'Processed' ? (
          <Button variant="ghost" size="sm" className="text-[10px] h-7" onClick={() => updatePayrollStatus(row.id, 'Paid')}>
            Mark Paid
          </Button>
        ) : row.status === 'Draft' ? (
          <Button variant="ghost" size="sm" className="text-[10px] h-7" onClick={() => updatePayrollStatus(row.id, 'Processed')}>
            Process
          </Button>
        ) : null,
    },
  ];

  return (
    <div className="space-y-6">
      <KpiGrid className="sm:grid-cols-3 xl:grid-cols-3">
        <KpiWidget label="Total Net Payroll" value={formatCurrency(totalNet)} />
        <KpiWidget label="Records" value={monthRecords.length} />
        <KpiWidget label="Paid" value={`${paidCount} / ${monthRecords.length}`} tone="emphasis" />
      </KpiGrid>

      <TablePanel
        title="Payroll Management"
        description="Process monthly salaries, allowances, and deductions"
        actions={
          <div className="flex gap-2 items-center">
            <input
              type="month"
              className="h-9 px-3 bg-muted/40 border border-border rounded-md text-xs"
              value={selectedMonth}
              onChange={(e) => {
                setMonthTouched(true);
                setSelectedMonth(e.target.value);
              }}
            />
            {unprocessedEmployees.length > 0 && (
              <Button variant="organic" size="sm" className="text-xs h-9" onClick={handleProcessAll}>
                Process All ({unprocessedEmployees.length})
              </Button>
            )}
          </div>
        }
      >
        <DataTable columns={columns} data={monthRecords} emptyTitle="No payroll records for this month." />
      </TablePanel>
    </div>
  );
};
