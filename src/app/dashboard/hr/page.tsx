'use client';

import React, { useEffect } from 'react';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { Button } from '@/components/ui/button';
import { HrDashboard } from '@/components/dashboard/hr/HrDashboard';
import { HrEmployeeDirectory } from '@/components/dashboard/hr/HrEmployeeDirectory';
import { HrLeaveManagement } from '@/components/dashboard/hr/HrLeaveManagement';
import { HrAttendance } from '@/components/dashboard/hr/HrAttendance';
import { HrPayroll } from '@/components/dashboard/hr/HrPayroll';
import { HrRecruitment } from '@/components/dashboard/hr/HrRecruitment';
import { HrPerformance } from '@/components/dashboard/hr/HrPerformance';
import { HrOnboarding } from '@/components/dashboard/hr/HrOnboarding';
import { HrReports } from '@/components/dashboard/hr/HrReports';
import { usePortalTab } from '@/lib/usePortalTab';

const TAB_META: Record<string, { title: string; subtitle?: string }> = {
  dashboard: {
    title: 'HR Dashboard',
    subtitle: 'Workforce KPIs, leave pipeline, payroll summary, and department headcount.',
  },
  employees: {
    title: 'Employee Directory',
    subtitle: 'Complete staff records for teaching and non-teaching personnel.',
  },
  leave: {
    title: 'Leave Management',
    subtitle: 'Submit, approve, and track annual, sick, and emergency leave requests.',
  },
  attendance: {
    title: 'Staff Attendance',
    subtitle: 'Daily check-in/out tracking and absence monitoring.',
  },
  payroll: {
    title: 'Payroll Management',
    subtitle: 'Process monthly salaries, allowances, deductions, and payment status.',
  },
  recruitment: {
    title: 'Recruitment',
    subtitle: 'Job postings, applicant pipeline, and hiring workflow.',
  },
  performance: {
    title: 'Performance Reviews',
    subtitle: 'Employee evaluations, goal setting, and appraisal cycles.',
  },
  onboarding: {
    title: 'Employee Onboarding',
    subtitle: 'New hire checklists, probation tracking, and integration tasks.',
  },
  reports: {
    title: 'HR Reports',
    subtitle: 'Headcount, payroll, leave, recruitment, and workforce analytics.',
  },
};

export default function HrPortalPage() {
  const { activeTab, setActiveTab } = usePortalTab('hr');

  useEffect(() => {
    const handleTabChange = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail) setActiveTab(customEvent.detail);
    };
    window.addEventListener('change-tab', handleTabChange);
    return () => window.removeEventListener('change-tab', handleTabChange);
  }, [setActiveTab]);

  const meta = TAB_META[activeTab] ?? TAB_META.dashboard;

  const shellActions =
    activeTab === 'employees' ? (
      <Button
        variant="organic"
        size="sm"
        className="text-xs h-9 border-none"
        onClick={() => window.dispatchEvent(new Event('open-hr-employee'))}
      >
        + Add Employee
      </Button>
    ) : activeTab === 'leave' ? (
      <Button
        variant="organic"
        size="sm"
        className="text-xs h-9 border-none"
        onClick={() => window.dispatchEvent(new Event('open-hr-leave'))}
      >
        + Leave Request
      </Button>
    ) : activeTab === 'recruitment' ? (
      <Button
        variant="organic"
        size="sm"
        className="text-xs h-9 border-none"
        onClick={() => window.dispatchEvent(new Event('open-hr-job'))}
      >
        + Post Job
      </Button>
    ) : (
      <span className="text-xs px-3 py-1.5 rounded-md bg-primary/10 text-primary font-medium border border-primary/20">
        Sara Bekele · HR Officer
      </span>
    );

  return (
    <DashboardShell
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      title={meta.title}
      subtitle={meta.subtitle}
      eyebrow="Bole Secondary · HR Portal"
      actions={shellActions}
      showPageHeader={activeTab !== 'dashboard'}
    >
      {activeTab === 'dashboard' && <HrDashboard />}
      {activeTab === 'employees' && <HrEmployeeDirectory />}
      {activeTab === 'leave' && <HrLeaveManagement />}
      {activeTab === 'attendance' && <HrAttendance />}
      {activeTab === 'payroll' && <HrPayroll />}
      {activeTab === 'recruitment' && <HrRecruitment />}
      {activeTab === 'performance' && <HrPerformance />}
      {activeTab === 'onboarding' && <HrOnboarding />}
      {activeTab === 'reports' && <HrReports />}
    </DashboardShell>
  );
}
