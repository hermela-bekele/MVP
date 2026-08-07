'use client';

import React, { useEffect } from 'react';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { Button } from '@/components/ui/button';
import { RegistrarDashboard } from '@/components/dashboard/registrar/RegistrarDashboard';
import { RegistrarApplications } from '@/components/dashboard/registrar/RegistrarApplications';
import { RegistrarEnrollment } from '@/components/dashboard/registrar/RegistrarEnrollment';
import { RegistrarStudentRegistry } from '@/components/dashboard/registrar/RegistrarStudentRegistry';
import { RegistrarGradeManagement } from '@/components/dashboard/registrar/RegistrarGradeManagement';
import { RegistrarClassPlacement } from '@/components/dashboard/registrar/RegistrarClassPlacement';
import { RegistrarTransfers } from '@/components/dashboard/registrar/RegistrarTransfers';
import { RegistrarReports } from '@/components/dashboard/registrar/RegistrarReports';
import { RegistrarBilling } from '@/components/dashboard/registrar/RegistrarBilling';
import { RegistrarWaitlist } from '@/components/dashboard/registrar/RegistrarWaitlist';
import { usePortalTab } from '@/lib/usePortalTab';
import { PortalProfileCard } from '@/components/dashboard/shared/PortalProfileCard';

const TAB_META: Record<string, { title: string; subtitle?: string }> = {
  dashboard: {
    title: 'Registration Dashboard',
    subtitle: 'Enrollment KPIs, pending applications, and grade-level distribution.',
  },
  applications: {
    title: 'Applications Queue',
    subtitle: 'Score, waitlist, accept (seat + invoice), or reject applications.',
  },
  'enroll-student': {
    title: 'New Enrollment',
    subtitle: 'Direct student registration and onboarding — assign grade, section, and parent contacts.',
  },
  'student-registry': {
    title: 'Student Registry',
    subtitle: 'Official roster of all enrolled students with searchable records.',
  },
  'grade-management': {
    title: 'Grade Management',
    subtitle: 'View and manage assessment grades, recalculate GPAs across all classes.',
  },
  'class-placement': {
    title: 'Class Placement',
    subtitle: 'Assign students to sections and monitor classroom capacity utilization.',
  },
  transfers: {
    title: 'Transfers & Status',
    subtitle: 'Process student transfers, suspensions, graduations, and reinstatements.',
  },
  billing: {
    title: 'Invoices & Fees',
    subtitle: 'Admission and tuition invoices with deadline colors and partial payments.',
  },
  waitlist: {
    title: 'Waitlist & Capacity',
    subtitle: 'Priority waitlist board and grade/section seat capacity.',
  },
  reports: {
    title: 'Enrollment Reports',
    subtitle: 'Enrollment statistics, grade distribution, and attendance alerts.',
  },
  profile: {
    title: 'My Profile',
    subtitle: 'Your registrar account information.',
  },
};

export default function RegistrarPortalPage() {
  const { activeTab, setActiveTab } = usePortalTab('registrar');

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
    activeTab === 'applications' ? (
      <Button
        variant="organic"
        size="sm"
        className="text-xs h-9 border-none"
        onClick={() => window.dispatchEvent(new Event('open-registrar-application'))}
      >
        + New Application
      </Button>
    ) : activeTab === 'enroll-student' ? (
      <span className="text-xs px-3 py-1.5 rounded-md bg-primary/10 text-primary font-medium border border-primary/20">
        Registrar Office · Bole Secondary
      </span>
    ) : activeTab === 'grade-management' ? (
      <Button
        variant="organic"
        size="sm"
        className="text-xs h-9 border-none"
        onClick={() => window.dispatchEvent(new Event('open-registrar-grade-entry'))}
      >
        + Record Grade
      </Button>
    ) : (
      <span className="text-xs px-3 py-1.5 rounded-md bg-primary/10 text-primary font-medium border border-primary/20">
        Tigist Haile · Registrar Officer
      </span>
    );

  return (
    <DashboardShell
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      title={meta.title}
      subtitle={meta.subtitle}
      eyebrow="Bole Secondary · Registrar Portal"
      actions={shellActions}
      showPageHeader={activeTab !== 'dashboard'}
    >
      {activeTab === 'dashboard' && <RegistrarDashboard />}
      {activeTab === 'applications' && <RegistrarApplications />}
      {activeTab === 'enroll-student' && <RegistrarEnrollment />}
      {activeTab === 'student-registry' && <RegistrarStudentRegistry />}
      {activeTab === 'grade-management' && <RegistrarGradeManagement />}
      {activeTab === 'class-placement' && <RegistrarClassPlacement />}
      {activeTab === 'transfers' && <RegistrarTransfers />}
      {activeTab === 'billing' && <RegistrarBilling />}
      {activeTab === 'waitlist' && <RegistrarWaitlist />}
      {activeTab === 'reports' && <RegistrarReports />}
      {activeTab === 'profile' && (
        <div className="space-y-6 animate-fade-in text-left">
          <PortalProfileCard
            roleLabel="Registrar Officer"
            fields={[
              { label: 'Department', value: 'Registrar Office' },
              { label: 'Scope', value: 'Enrollment, records & class placement' },
            ]}
          />
        </div>
      )}
    </DashboardShell>
  );
}
