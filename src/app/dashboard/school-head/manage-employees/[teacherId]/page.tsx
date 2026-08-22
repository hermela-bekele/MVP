'use client';

import React, { use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { Button } from '@/components/ui/button';
import { EmployeeDetailView } from '@/components/dashboard/school-head/EmployeeDetailView';
import { portalTabPath } from '@/lib/portalPaths';

export default function SchoolHeadEmployeeDetailPage({
  params,
}: {
  params: Promise<{ teacherId: string }>;
}) {
  const { teacherId } = use(params);
  const router = useRouter();
  const { teachers, schools, currentUser } = useApp();
  const teacher = teachers.find((t) => t.id === teacherId);
  const currentSchool = schools.find((s) => s.id === currentUser?.schoolId) ?? schools[0];
  const schoolName = currentSchool?.name ?? 'your school';

  const navigateToSchoolHeadTab = useCallback(
    (tab: string) => {
      router.push(portalTabPath('school-head', tab));
    },
    [router],
  );

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
      return;
    }
    navigateToSchoolHeadTab('manage-employees');
  };

  return (
    <DashboardShell
      activeTab="manage-employees"
      setActiveTab={navigateToSchoolHeadTab}
      title={teacher?.name ?? 'Instructor'}
      subtitle="Instructor record — read-only oversight view."
      eyebrow={schoolName}
      breadcrumbs={[
        { label: 'Faculty Directory', onClick: handleBack },
        { label: teacher?.name ?? 'Instructor' },
      ]}
      actions={
        <Button variant="outline" size="sm" onClick={handleBack} className="text-xs h-9 gap-1.5">
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          Back to directory
        </Button>
      }
    >
      <EmployeeDetailView teacherId={teacherId} />
    </DashboardShell>
  );
}
