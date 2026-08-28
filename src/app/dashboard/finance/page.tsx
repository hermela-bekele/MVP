'use client';

import React from 'react';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { usePortalTab } from '@/lib/usePortalTab';
import { FinanceDashboardPanel } from '@/components/dashboard/finance/FinanceDashboardPanel';
import { BudgetPanel } from '@/components/dashboard/finance/BudgetPanel';
import { AccountsReceivablePanel } from '@/components/dashboard/finance/AccountsReceivablePanel';
import { ExpensesPanel } from '@/components/dashboard/finance/ExpensesPanel';
import { AccountsPayablePanel } from '@/components/dashboard/finance/AccountsPayablePanel';
import { ChartOfAccountsPanel } from '@/components/dashboard/finance/ChartOfAccountsPanel';
import { FinancialCalendarPanel } from '@/components/dashboard/finance/FinancialCalendarPanel';
import { FinanceAuditTrailPanel } from '@/components/dashboard/finance/FinanceAuditTrailPanel';
import { FinanceSettingsPanel } from '@/components/dashboard/finance/FinanceSettingsPanel';

const TAB_META: Record<string, { title: string; subtitle?: string }> = {
  dashboard: {
    title: 'Finance Dashboard',
    subtitle: 'Revenue, receivables, and payroll — the school’s real-time financial position.',
  },
  budget: {
    title: 'Budget',
    subtitle: 'Create, submit, and approve department budgets. Approved budgets are locked and only change through tracked transfers.',
  },
  'accounts-receivable': {
    title: 'Accounts Receivable',
    subtitle: 'Invoices, partial payments, late fees, and collection health.',
  },
  expenses: {
    title: 'Expenses',
    subtitle: 'Department expense requests, validated against the approved budget, then approved and paid.',
  },
  'accounts-payable': {
    title: 'Accounts Payable',
    subtitle: 'Suppliers and their invoices — approval, partial or full payment, and payment history.',
  },
  accounting: {
    title: 'Chart of Accounts',
    subtitle: 'The account structure budgets, ledgers, and payables will post against.',
  },
  'financial-calendar': {
    title: 'Financial Calendar',
    subtitle: 'Upcoming fee deadlines and financial period closings.',
  },
  'audit-trail': {
    title: 'Audit Trail',
    subtitle: 'Every recorded finance action, with who did it and when.',
  },
  settings: {
    title: 'Finance Settings',
    subtitle: 'Financial years and periods that govern the finance calendar.',
  },
};

export default function FinancePortalPage() {
  const { activeTab, setActiveTab } = usePortalTab('finance', 'dashboard');
  const meta = TAB_META[activeTab] ?? TAB_META.dashboard;

  return (
    <DashboardShell
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      title={meta.title}
      subtitle={meta.subtitle}
      eyebrow="Finance Portal"
      showPageHeader
    >
      {activeTab === 'dashboard' && <FinanceDashboardPanel />}
      {activeTab === 'budget' && <BudgetPanel />}
      {activeTab === 'accounts-receivable' && <AccountsReceivablePanel />}
      {activeTab === 'expenses' && <ExpensesPanel />}
      {activeTab === 'accounts-payable' && <AccountsPayablePanel />}
      {activeTab === 'accounting' && <ChartOfAccountsPanel />}
      {activeTab === 'financial-calendar' && <FinancialCalendarPanel />}
      {activeTab === 'audit-trail' && <FinanceAuditTrailPanel />}
      {activeTab === 'settings' && <FinanceSettingsPanel />}
    </DashboardShell>
  );
}
