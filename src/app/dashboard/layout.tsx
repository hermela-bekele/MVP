'use client';

import React from 'react';
import { SidebarProvider, useSidebar } from '@/context/SidebarContext';
import { OfflineBanner } from '@/components/offline/OfflineBanner';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { CommandPalette, CommandItem } from '@/components/ui/command-palette';
import { useApp } from '@/context/AppContext';
import { useRouter } from 'next/navigation';

function DashboardCommandPalette() {
  const { activeRole, toggleTheme, logout } = useApp();
  const { toggleCollapsed } = useSidebar();
  const router = useRouter();

  const commands = React.useMemo(() => {
    const list: CommandItem[] = [
      {
        id: 'toggle-sidebar',
        label: 'Toggle Sidebar Collapse',
        group: 'System Actions',
        action: () => toggleCollapsed(),
        shortcut: 'Ctrl+B'
      },
      {
        id: 'toggle-theme',
        label: 'Toggle Dark/Light Mode',
        group: 'System Preferences',
        action: () => toggleTheme(),
      },
      {
        id: 'logout',
        label: 'Sign Out Session',
        group: 'Account',
        action: () => {
          logout();
          router.push('/login');
        }
      }
    ];

    if (activeRole === 'registrar') {
      const registrarTabs = [
        { id: 'dashboard', label: 'Registration Dashboard' },
        { id: 'applications', label: 'Applications Queue' },
        { id: 'enroll-student', label: 'New Enrollment' },
        { id: 'student-registry', label: 'Student Registry' },
        { id: 'grade-management', label: 'Grade Management' },
        { id: 'class-placement', label: 'Class Placement' },
        { id: 'transfers', label: 'Transfers & Status' },
        { id: 'reports', label: 'Enrollment Reports' },
      ];

      registrarTabs.forEach((tab) => {
        list.push({
          id: `goto-${tab.id}`,
          label: `Go to ${tab.label}`,
          group: 'Registrar Portal',
          action: () => window.dispatchEvent(new CustomEvent('change-tab', { detail: tab.id })),
        });
      });
    }

    if (activeRole === 'hr') {
      const hrTabs = [
        { id: 'dashboard', label: 'HR Dashboard' },
        { id: 'employees', label: 'Employee Directory' },
        { id: 'onboarding', label: 'Onboarding' },
        { id: 'leave', label: 'Leave Management' },
        { id: 'attendance', label: 'Staff Attendance' },
        { id: 'payroll', label: 'Payroll' },
        { id: 'performance', label: 'Performance Reviews' },
        { id: 'recruitment', label: 'Recruitment' },
        { id: 'reports', label: 'HR Reports' },
      ];

      hrTabs.forEach((tab) => {
        list.push({
          id: `goto-${tab.id}`,
          label: `Go to ${tab.label}`,
          group: 'HR Portal',
          action: () => window.dispatchEvent(new CustomEvent('change-tab', { detail: tab.id })),
        });
      });
    }

    if (activeRole === 'school-head') {
      const schoolHeadTabs = [
        { id: 'dashboard', label: 'Overview Dashboard' },
        { id: 'reports', label: 'Performance Reports' },
        { id: 'academic-calendar', label: 'Academic Calendar' },
        { id: 'manage-students', label: 'View Students' },
        { id: 'manage-employees', label: 'View Employees' },
        { id: 'manage-classes', label: 'View Classes' },
        { id: 'manage-departments', label: 'View Departments' },
        { id: 'manage-attendance', label: 'View Attendance' },
        { id: 'teachers-development', label: 'Teacher Development' },
        { id: 'manage-checkins', label: 'Wellness Check-ins' },
        { id: 'account-settings', label: 'Portal Settings' },
      ];

      schoolHeadTabs.forEach(tab => {
        list.push({
          id: `goto-${tab.id}`,
          label: `Go to ${tab.label}`,
          group: 'School Head Portal',
          action: () => window.dispatchEvent(new CustomEvent('change-tab', { detail: tab.id }))
        });
      });
    }

    return list;
  }, [activeRole, toggleCollapsed, toggleTheme, logout, router]);

  return <CommandPalette items={commands} />;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <RoleGuard>
        <div className="flex flex-1 min-h-screen flex-col bg-[hsl(var(--dashboard-bg))]">
          <OfflineBanner />
          <div className="flex flex-1 w-full relative">
            {children}
            <DashboardCommandPalette />
          </div>
        </div>
      </RoleGuard>
    </SidebarProvider>
  );
}
