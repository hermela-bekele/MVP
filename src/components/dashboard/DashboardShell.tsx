'use client';

import React, { useEffect } from 'react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Navbar } from '@/components/dashboard/Navbar';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { PageTransition } from '@/components/ui/page-transition';
import type { BreadcrumbItem } from '@/components/ui/breadcrumb';

export interface DashboardShellProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  title: string;
  subtitle?: string;
  eyebrow?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  subtitleActions?: React.ReactNode;
  children: React.ReactNode;
  /** Animate content when tab changes */
  animateTabs?: boolean;
  /** Hide the built-in page title block (e.g. when a tab has its own hero) */
  showPageHeader?: boolean;
  /** Page header visual style */
  headerVariant?: 'default' | 'portal';
}

export const DashboardShell: React.FC<DashboardShellProps> = ({
  activeTab,
  setActiveTab,
  title,
  subtitle,
  eyebrow,
  breadcrumbs,
  actions,
  subtitleActions,
  children,
  animateTabs = true,
  showPageHeader = true,
  headerVariant = 'default',
}) => {
  useEffect(() => {
    const handleNavigate = (e: Event) => {
      const tab = (e as CustomEvent<{ tab?: string }>).detail?.tab;
      if (tab) setActiveTab(tab);
    };
    window.addEventListener('dashboard-navigate', handleNavigate as EventListener);
    return () => window.removeEventListener('dashboard-navigate', handleNavigate as EventListener);
  }, [setActiveTab]);

  const content = (
    <>
      {showPageHeader && (
        <PageHeader
          title={title}
          subtitle={subtitle}
          eyebrow={eyebrow}
          actions={actions}
          subtitleActions={subtitleActions}
          variant={headerVariant}
        />
      )}
      {children}
    </>
  );

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[hsl(var(--dashboard-bg))] relative">
      {/* Gradient decorative background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-accent/5 pointer-events-none" />
      
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden relative z-10">
        <Navbar breadcrumbs={breadcrumbs} />

        <main
          className={`flex-1 overflow-y-auto px-4 sm:px-5 lg:px-4${
            headerVariant === 'portal' ? ' bg-[#f9f9ff] teacher-portal' : ''
          }`}
        >
          <div className="mx-auto w-full max-w-[1400px] py-5 sm:py-6">
            {animateTabs ? (
              <PageTransition transitionKey={activeTab}>{content}</PageTransition>
            ) : (
              content
            )}
          </div>
        </main>
      </div>
    </div>
  );
};
