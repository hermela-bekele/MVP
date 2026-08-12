'use client';

import React, { useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { KpiGrid, KpiWidget } from '@/components/dashboard/KpiWidget';
import { TablePanel } from '@/components/dashboard/TablePanel';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, hrStatusBadgeVariant, pendingLeaveRequests } from '@/lib/hrPortal';

/** Read-only HR snapshot surfaced to the school head from the Administrative Engine. */
export const HrOverviewPanel: React.FC = () => {
  const { hrEmployees, leaveRequests, payrollRecords } = useApp();

  const activeStaff = useMemo(() => hrEmployees.filter((e) => e.status !== 'Terminated'), [hrEmployees]);
  const pendingLeave = useMemo(() => pendingLeaveRequests(leaveRequests), [leaveRequests]);
  const latestPayrollMonth = useMemo(
    () => payrollRecords.reduce((latest, r) => (r.month > latest ? r.month : latest), ''),
    [payrollRecords],
  );
  const latestPayrollNet = useMemo(
    () =>
      payrollRecords
        .filter((r) => r.month === latestPayrollMonth)
        .reduce((sum, r) => sum + r.netPay, 0),
    [payrollRecords, latestPayrollMonth],
  );

  return (
    <div className="space-y-6 animate-fade-in text-left">
      <KpiGrid>
        <KpiWidget label="Active Staff" value={activeStaff.length} tone="emphasis" />
        <KpiWidget label="Pending Leave Requests" value={pendingLeave.length} hint="Awaiting HR review" />
        <KpiWidget
          label="Latest Payroll Run"
          value={latestPayrollMonth || '—'}
          hint={latestPayrollMonth ? `${formatCurrency(latestPayrollNet)} net pay` : 'No records yet'}
        />
        <KpiWidget label="On Leave" value={hrEmployees.filter((e) => e.status === 'On Leave').length} />
      </KpiGrid>

      <TablePanel title="Leave Requests" description="Recent leave submissions across the school">
        <table className="eskooly-table">
          <thead>
            <tr>
              <th className="p-3 text-left text-muted-foreground font-semibold">Employee</th>
              <th className="p-3 text-left text-muted-foreground font-semibold">Type</th>
              <th className="p-3 text-left text-muted-foreground font-semibold">Dates</th>
              <th className="p-3 text-left text-muted-foreground font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40 text-muted-foreground">
            {leaveRequests.slice(0, 8).map((req) => (
              <tr key={req.id} className="hover:bg-muted/10">
                <td className="p-3 text-foreground font-bold">{req.employeeName}</td>
                <td className="p-3">{req.type}</td>
                <td className="p-3">{req.startDate} – {req.endDate}</td>
                <td className="p-3">
                  <Badge variant={hrStatusBadgeVariant(req.status)} size="sm" className="font-bold">
                    {req.status}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TablePanel>

      <TablePanel title="Payroll Status" description="Most recent payroll processing records">
        <table className="eskooly-table">
          <thead>
            <tr>
              <th className="p-3 text-left text-muted-foreground font-semibold">Employee</th>
              <th className="p-3 text-left text-muted-foreground font-semibold">Month</th>
              <th className="p-3 text-left text-muted-foreground font-semibold">Net Pay</th>
              <th className="p-3 text-left text-muted-foreground font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40 text-muted-foreground">
            {payrollRecords.slice(0, 8).map((rec) => (
              <tr key={rec.id} className="hover:bg-muted/10">
                <td className="p-3 text-foreground font-bold">{rec.employeeName}</td>
                <td className="p-3">{rec.month}</td>
                <td className="p-3 font-mono">{formatCurrency(rec.netPay)}</td>
                <td className="p-3">
                  <Badge variant={hrStatusBadgeVariant(rec.status)} size="sm" className="font-bold">
                    {rec.status}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TablePanel>
    </div>
  );
};
