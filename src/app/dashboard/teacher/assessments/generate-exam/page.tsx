'use client';

import React, { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { Button } from '@/components/ui/button';
import { TeacherReviewerExamGenerator } from '@/components/dashboard/teacher/TeacherReviewerExamGenerator';
import { portalTabPath } from '@/lib/portalPaths';

export default function GenerateReviewerExamPage() {
  const router = useRouter();

  const navigateToTeacherTab = useCallback(
    (tab: string) => {
      router.push(portalTabPath('teacher', tab));
    },
    [router],
  );

  const handleBack = () => navigateToTeacherTab('assessments');

  return (
    <DashboardShell
      activeTab="assessments"
      setActiveTab={navigateToTeacherTab}
      title="Generate Mid/Final Exam"
      subtitle="As a designated reviewer, generate a department exam the same way the department head would."
      breadcrumbs={[
        { label: 'Assessments', onClick: handleBack },
        { label: 'Generate exam' },
      ]}
      actions={
        <Button variant="outline" size="sm" onClick={handleBack} className="text-xs h-9 gap-1.5">
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          Back to assessments
        </Button>
      }
    >
      <TeacherReviewerExamGenerator />
    </DashboardShell>
  );
}
