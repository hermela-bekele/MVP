'use client';

import React, { useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { ContentCard } from '@/components/dashboard/ContentCard';
import { KpiWidget } from '@/components/dashboard/KpiWidget';
import {
  filterSchoolEmployees,
  employeesByDepartment,
  formatCurrency,
  pendingLeaveRequests,
} from '@/lib/hrPortal';

export const HrReports: React.FC = () => {
  const { hrEmployees, leaveRequests, payrollRecords, performanceReviews, jobPostings } = useApp();

  const employees = useMemo(() => filterSchoolEmployees(hrEmployees), [hrEmployees]);
  const byDept = employeesByDepartment(employees);
  const totalPayroll = payrollRecords
    .filter((p) => p.month === '2026-06')
    .reduce((sum, p) => sum + p.netPay, 0);
  const avgSalary =
    employees.length > 0
      ? Math.round(employees.reduce((s, e) => s + e.salary, 0) / employees.length)
      : 0;
  const avgRating =
    performanceReviews.filter((r) => r.status === 'Completed').length > 0
      ? (
          performanceReviews
            .filter((r) => r.status === 'Completed')
            .reduce((s, r) => s + r.rating, 0) /
          performanceReviews.filter((r) => r.status === 'Completed').length
        ).toFixed(1)
      : '—';
  const leaveByType = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const req of leaveRequests) {
      counts[req.type] = (counts[req.type] ?? 0) + 1;
    }
    return counts;
  }, [leaveRequests]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiWidget label="Headcount" value={employees.length} hint="All staff categories" tone="inverse" />
        <KpiWidget label="Avg. Salary" value={formatCurrency(avgSalary)} hint="Monthly base average" />
        <KpiWidget label="June Payroll" value={formatCurrency(totalPayroll)} hint="Total net disbursement" tone="emphasis" />
        <KpiWidget label="Avg. Performance" value={avgRating} hint="Completed reviews only" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ContentCard title="Headcount by Department" description="Staff distribution report">
          <div className="space-y-2">
            {Object.entries(byDept)
              .filter(([, c]) => c > 0)
              .sort(([, a], [, b]) => b - a)
              .map(([dept, count]) => (
                <div key={dept} className="flex justify-between py-2 border-b border-border/30 last:border-0">
                  <span className="text-xs font-medium">{dept}</span>
                  <span className="text-xs font-bold text-muted-foreground">{count}</span>
                </div>
              ))}
          </div>
        </ContentCard>

        <ContentCard title="Leave Summary" description={`${pendingLeaveRequests(leaveRequests).length} pending approvals`}>
          <div className="space-y-2">
            {Object.entries(leaveByType).map(([type, count]) => (
              <div key={type} className="flex justify-between py-2 border-b border-border/30 last:border-0">
                <span className="text-xs font-medium">{type} Leave</span>
                <span className="text-xs font-bold text-muted-foreground">{count} requests</span>
              </div>
            ))}
          </div>
        </ContentCard>

        <ContentCard title="Recruitment Status" description="Open positions and pipeline">
          <div className="space-y-2">
            {jobPostings.map((job) => (
              <div key={job.id} className="flex justify-between py-2 border-b border-border/30 last:border-0">
                <span className="text-xs font-medium truncate mr-2">{job.title}</span>
                <span className="text-xs text-muted-foreground shrink-0">{job.status} · {job.applicantCount} apps</span>
              </div>
            ))}
          </div>
        </ContentCard>

        <ContentCard title="Employment Mix" description="Contract types across organization">
          <div className="space-y-2">
            {(['Full-time', 'Part-time', 'Contract', 'Intern'] as const).map((type) => {
              const count = employees.filter((e) => e.employmentType === type).length;
              return (
                <div key={type} className="flex justify-between py-2 border-b border-border/30 last:border-0">
                  <span className="text-xs font-medium">{type}</span>
                  <span className="text-xs font-bold text-muted-foreground">{count}</span>
                </div>
              );
            })}
          </div>
        </ContentCard>
      </div>
    </div>
  );
};
