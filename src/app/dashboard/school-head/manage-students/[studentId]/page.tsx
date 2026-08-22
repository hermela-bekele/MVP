'use client';

import React, { use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { Button } from '@/components/ui/button';
import { StudentDetailView } from '@/components/dashboard/school-head/StudentDetailView';
import { portalTabPath } from '@/lib/portalPaths';

export default function SchoolHeadStudentDetailPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = use(params);
  const router = useRouter();
  const { students, schools, currentUser } = useApp();
  const student = students.find((s) => s.id === studentId);
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
    navigateToSchoolHeadTab('manage-students');
  };

  return (
    <DashboardShell
      activeTab="manage-students"
      setActiveTab={navigateToSchoolHeadTab}
      title={student?.name ?? 'Student'}
      subtitle="Student record — read-only oversight view."
      eyebrow={schoolName}
      breadcrumbs={[
        { label: 'Student Directory', onClick: handleBack },
        { label: student?.name ?? 'Student' },
      ]}
      actions={
        <Button variant="outline" size="sm" onClick={handleBack} className="text-xs h-9 gap-1.5">
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          Back to directory
        </Button>
      }
    >
      <StudentDetailView studentId={studentId} />
    </DashboardShell>
  );
}
