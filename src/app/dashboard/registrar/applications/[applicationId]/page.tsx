'use client';

import React, { use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { Button } from '@/components/ui/button';
import { RegistrarApplicationDetail } from '@/components/dashboard/registrar/RegistrarApplicationDetail';
import { portalTabPath } from '@/lib/portalPaths';

export default function RegistrarApplicationDetailPage({
  params,
}: {
  params: Promise<{ applicationId: string }>;
}) {
  const { applicationId } = use(params);
  const router = useRouter();
  const { schools, currentUser } = useApp();
  const currentSchool = schools.find((s) => s.id === currentUser?.schoolId) ?? schools[0];
  const schoolName = currentSchool?.name ?? 'your school';

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
    navigateToRegistrarTab('applications');
  };

  return (
    <DashboardShell
      activeTab="applications"
      setActiveTab={navigateToRegistrarTab}
      title="Application Review"
      subtitle="Verify documents, score, and decide on this application."
      eyebrow={`${schoolName} · Registrar Portal`}
      breadcrumbs={[
        { label: 'Applications Queue', onClick: handleBack },
        { label: 'Review' },
      ]}
      actions={
        <Button variant="outline" size="sm" onClick={handleBack} className="text-xs h-9 gap-1.5">
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          Back to queue
        </Button>
      }
    >
      <RegistrarApplicationDetail applicationId={applicationId} />
    </DashboardShell>
  );
}
