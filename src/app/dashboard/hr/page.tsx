'use client';

import React, { useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { HrDashboard } from '@/components/dashboard/hr/HrDashboard';
import { HrEmployeeDirectory } from '@/components/dashboard/hr/HrEmployeeDirectory';
import { HrLeaveManagement } from '@/components/dashboard/hr/HrLeaveManagement';
import { HrAttendance } from '@/components/dashboard/hr/HrAttendance';
import { HrPayroll } from '@/components/dashboard/hr/HrPayroll';
import { HrRecruitment } from '@/components/dashboard/hr/HrRecruitment';
import { HrPerformance } from '@/components/dashboard/hr/HrPerformance';
import { HrOnboarding } from '@/components/dashboard/hr/HrOnboarding';
import { HrReports } from '@/components/dashboard/hr/HrReports';
import { HrTrainingPanel } from '@/components/dashboard/hr/HrTrainingPanel';
import { usePortalTab } from '@/lib/usePortalTab';
import { PortalProfileCard } from '@/components/dashboard/shared/PortalProfileCard';

const TAB_META: Record<string, { title: string; subtitle?: string }> = {
  dashboard: {
    title: 'HR Dashboard',
    subtitle: 'Workforce KPIs, leave pipeline, payroll summary, and department headcount.',
  },
  employees: {
    title: 'Employee Directory',
    subtitle: 'Manage staff records for teaching and non-teaching personnel.',
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
  training: {
    title: 'Trainings',
    subtitle: 'Every training type available to staff — leadership, subject-matter, induction, and continuous development.',
  },
  profile: {
    title: 'My Profile',
    subtitle: 'Your HR account information.',
  },
};

export default function HrPortalPage() {
  const { activeTab, setActiveTab } = usePortalTab('hr');
  const { schools, currentUser } = useApp();
  const currentSchool = schools.find((s) => s.id === currentUser?.schoolId) ?? schools[0];
  const schoolName = currentSchool?.name ?? 'your school';
  const hrOfficerName = currentUser?.displayName ?? 'HR Officer';

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
      <Badge variant="primary" badgeStyle="subtle" size="md">
        {hrOfficerName} · HR Officer
      </Badge>
    );

  return (
    <DashboardShell
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      title={meta.title}
      subtitle={meta.subtitle}
      eyebrow={`${schoolName} · HR Portal`}
      actions={shellActions}
      showPageHeader
      breadcrumbs={
        activeTab === 'employees'
          ? [
              { label: 'HR Portal', onClick: () => setActiveTab('dashboard') },
              { label: 'Employees' },
              { label: 'Employee Directory' },
            ]
          : undefined
      }
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
      {activeTab === 'training' && <HrTrainingPanel />}
      {activeTab === 'profile' && (
        <div className="space-y-6 animate-fade-in text-left">
          <PortalProfileCard
            roleLabel="HR Officer"
            fields={[
              { label: 'Department', value: 'Human Resources' },
              { label: 'Scope', value: `${schoolName} — all staff` },
            ]}
          />
        </div>
      )}
    </DashboardShell>
  );
}
