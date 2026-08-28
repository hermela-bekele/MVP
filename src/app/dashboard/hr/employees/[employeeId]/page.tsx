'use client';

import React, { use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { Button } from '@/components/ui/button';
import { HrEmployeeDetail } from '@/components/dashboard/hr/HrEmployeeDetail';
import { portalTabPath } from '@/lib/portalPaths';

export default function HrEmployeeDetailPage({
  params,
}: {
  params: Promise<{ employeeId: string }>;
}) {
  const { employeeId } = use(params);
  const router = useRouter();
  const { hrEmployees, schools, currentUser } = useApp();
  const employee = hrEmployees.find((e) => e.id === employeeId);
  const currentSchool = schools.find((s) => s.id === currentUser?.schoolId) ?? schools[0];
  const schoolName = currentSchool?.name ?? 'your school';

  const navigateToHrTab = useCallback(
    (tab: string) => {
      router.push(portalTabPath('hr', tab));
    },
    [router],
  );

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
      return;
    }
    navigateToHrTab('employees');
  };

  return (
    <DashboardShell
      activeTab="employees"
      setActiveTab={navigateToHrTab}
      title="Employee Details"
      subtitle="View or edit employee information."
      eyebrow={`${schoolName} · HR Portal`}
      breadcrumbs={[
        { label: 'HR Portal', onClick: () => navigateToHrTab('dashboard') },
        { label: 'Employees', onClick: handleBack },
        { label: 'Employee Details' },
      ]}
      actions={
        <Button variant="outline" size="sm" onClick={handleBack} className="text-xs h-9 gap-1.5">
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          Back to directory
        </Button>
      }
    >
      <HrEmployeeDetail employeeId={employeeId} />
    </DashboardShell>
  );
}
