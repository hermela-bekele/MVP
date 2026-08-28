'use client';

import React, { use, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { Button } from '@/components/ui/button';
import { DeptAssessmentReview } from '@/components/dashboard/department-head/DeptAssessmentReview';
import { filterBySubjectScope, resolveDeptHeadScope } from '@/lib/departmentHead';
import { portalTabPath } from '@/lib/portalPaths';

export default function DeptAssessmentReviewPage({
  params,
}: {
  params: Promise<{ assessmentId: string }>;
}) {
  const { assessmentId } = use(params);
  const router = useRouter();
  const { assessments, currentUser, schools } = useApp();
  const scope = useMemo(() => resolveDeptHeadScope(currentUser), [currentUser]);
  const departmentAssessments = useMemo(
    () => (scope ? filterBySubjectScope(assessments, scope) : []),
    [assessments, scope],
  );
  const assessment = departmentAssessments.find((asm) => asm.id === assessmentId);
  const currentSchool = schools.find((s) => s.id === currentUser?.schoolId) ?? schools[0];
  const schoolName = currentSchool?.name ?? 'your school';

  const navigateToDeptTab = useCallback(
    (tab: string) => {
      router.push(portalTabPath('department-head', tab));
    },
    [router],
  );

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
      return;
    }
    navigateToDeptTab('assessments');
  };

  return (
    <DashboardShell
      activeTab="assessments"
      setActiveTab={navigateToDeptTab}
      title={assessment ? `Review: ${assessment.title}` : 'Review Assessment'}
      subtitle="Review submitted questions, then approve or send back for revision."
      eyebrow={`${scope?.subject ?? 'Subject'} Department · ${schoolName}`}
      breadcrumbs={[
        { label: 'Assessment Desk', onClick: handleBack },
        { label: assessment?.title ?? 'Review' },
      ]}
      actions={
        <Button variant="outline" size="sm" onClick={handleBack} className="text-xs h-9 gap-1.5">
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          Back to assessment desk
        </Button>
      }
    >
      <DeptAssessmentReview assessmentId={assessmentId} />
    </DashboardShell>
  );
}
