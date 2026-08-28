'use client';

import React, { use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { Button } from '@/components/ui/button';
import { RegistrarStudentDetail } from '@/components/dashboard/registrar/RegistrarStudentDetail';
import { filterSchoolStudents } from '@/lib/registrarPortal';
import { portalTabPath } from '@/lib/portalPaths';

export default function RegistrarStudentDetailPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = use(params);
  const router = useRouter();
  const { students, schools, currentUser } = useApp();
  const schoolStudents = filterSchoolStudents(students);
  const student = schoolStudents.find((s) => s.id === studentId);
  const currentSchool = schools.find((s) => s.id === currentUser?.schoolId) ?? schools[0];
  const schoolName = currentSchool?.name ?? 'School';

  const navigateToRegistrarTab = useCallback(
    (tab: string) => {
      router.push(portalTabPath('registrar', tab));
    },
    [router],
  );

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
      return;
    }
    navigateToRegistrarTab('student-registry');
  };

  return (
    <DashboardShell
      activeTab="student-registry"
      setActiveTab={navigateToRegistrarTab}
      title={student?.name ?? 'Student'}
      subtitle="Student record — view or edit details, generate documents."
      eyebrow={`${schoolName} · Registrar Portal`}
      breadcrumbs={[
        { label: 'Student Registry', onClick: handleBack },
        { label: student?.name ?? 'Student' },
      ]}
      actions={
        <Button variant="outline" size="sm" onClick={handleBack} className="text-xs h-9 gap-1.5">
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          Back to registry
        </Button>
      }
    >
      <RegistrarStudentDetail studentId={studentId} schoolStudents={schoolStudents} schoolName={schoolName} />
    </DashboardShell>
  );
}
