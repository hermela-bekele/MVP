'use client';

import React, { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { Button } from '@/components/ui/button';
import { DeptAssessmentGenerator } from '@/components/dashboard/department-head/DeptAssessmentGenerator';
import { portalTabPath } from '@/lib/portalPaths';

export default function GenerateDeptAssessmentPage() {
  const router = useRouter();

  const navigateToDeptTab = useCallback(
    (tab: string) => {
      router.push(portalTabPath('department-head', tab));
    },
    [router],
  );

  const handleBack = () => navigateToDeptTab('assessments');

  return (
    <DashboardShell
      activeTab="assessments"
      setActiveTab={navigateToDeptTab}
      title="Generate Department Assessment"
      subtitle="Build a mid/final exam or assignment from delivered topics, then publish to teachers."
      breadcrumbs={[
        { label: 'Assessment Desk', onClick: handleBack },
        { label: 'Generate' },
      ]}
      actions={
        <Button variant="outline" size="sm" onClick={handleBack} className="text-xs h-9 gap-1.5">
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          Back to assessment desk
        </Button>
      }
    >
      <DeptAssessmentGenerator />
    </DashboardShell>
  );
}
