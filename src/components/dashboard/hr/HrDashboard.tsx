'use client';

import React, { useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { KpiWidget } from '@/components/dashboard/KpiWidget';
import { ContentCard } from '@/components/dashboard/ContentCard';
import { Badge } from '@/components/ui/badge';
import {
  filterSchoolEmployees,
  pendingLeaveRequests,
  employeesByDepartment,
  hrStatusBadgeVariant,
  formatCurrency,
} from '@/lib/hrPortal';

export const HrDashboard: React.FC = () => {
  const {
    hrEmployees,
    leaveRequests,
    payrollRecords,
    jobPostings,
    jobApplications,
    staffAttendance,
  } = useApp();

  const employees = useMemo(() => filterSchoolEmployees(hrEmployees), [hrEmployees]);
  const activeEmployees = employees.filter((e) => e.status === 'Active');
  const onLeave = employees.filter((e) => e.status === 'On Leave');
  const pendingLeave = pendingLeaveRequests(leaveRequests);
  const openJobs = jobPostings.filter((j) => j.status === 'Open');
  const newApplicants = jobApplications.filter((a) => a.status === 'New' || a.status === 'Screening');
  const monthlyPayroll = payrollRecords
    .filter((p) => p.month === '2026-06')
    .reduce((sum, p) => sum + p.netPay, 0);
  const todayAttendance = staffAttendance.filter((a) => a.date === '2026-06-05');
  const presentToday = todayAttendance.filter((a) => a.status === 'Present' || a.status === 'Late').length;
  const byDept = employeesByDepartment(employees);

  const recentLeave = [...leaveRequests]
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
    .slice(0, 5);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiWidget
          label="Total Staff"
          value={employees.length}
          hint={`${activeEmployees.length} active · ${onLeave.length} on leave`}
          tone="inverse"
        />
        <KpiWidget
          label="Pending Leave"
          value={pendingLeave.length}
          hint="Awaiting HR approval"
          tone="emphasis"
        />
        <KpiWidget
          label="Open Positions"
          value={openJobs.length}
          hint={`${newApplicants.length} new applicants`}
        />
        <KpiWidget
          label="June Payroll"
          value={formatCurrency(monthlyPayroll)}
          hint={`${presentToday}/${todayAttendance.length} present today`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ContentCard title="Recent Leave Requests" description="Latest submissions across all departments">
          <div className="space-y-2">
            {recentLeave.map((req) => (
              <div
                key={req.id}
                className="flex items-center justify-between p-3 rounded-lg border border-border/60 bg-muted/20"
              >
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">{req.employeeName}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {req.type} · {req.startDate} → {req.endDate} ({req.days}d)
                  </p>
                </div>
                <Badge variant={hrStatusBadgeVariant(req.status)} size="sm">
                  {req.status}
                </Badge>
              </div>
            ))}
          </div>
        </ContentCard>

        <ContentCard title="Staff by Department" description="Headcount distribution">
          <div className="space-y-2">
            {Object.entries(byDept)
              .filter(([, count]) => count > 0)
              .map(([dept, count]) => (
                <div
                  key={dept}
                  className="flex items-center justify-between py-2 border-b border-border/30 last:border-0"
                >
                  <span className="text-xs font-medium text-foreground">{dept}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${Math.min(100, (count / employees.length) * 100)}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-muted-foreground w-8 text-right">{count}</span>
                  </div>
                </div>
              ))}
          </div>
        </ContentCard>
      </div>
    </div>
  );
};
