"use client";

import React, { Suspense, lazy, use, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import {
  aisBtnPrimary,
  aisBtnSecondary,
} from "@/components/dashboard/teacher/aisStyles";

function TabLoading() {
  return (
    <div className="flex min-h-[200px] items-center justify-center text-sm text-muted-foreground">
      Loading…
    </div>
  );
}

const TeacherAssessmentDetail = lazy(() =>
  import("@/components/dashboard/teacher/TeacherAssessmentDetail").then(
    (m) => ({
      default: m.TeacherAssessmentDetail,
    }),
  ),
);

export default function AssessmentDetailPage({
  params,
}: {
  params: Promise<{ assessmentId: string }>;
}) {
  const { assessmentId } = use(params);
  const router = useRouter();

  const navigateToTeacherTab = useCallback(
    (tab: string) => {
      router.push("/dashboard/teacher");
      window.setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent("teacher-quick-action", { detail: { tab } }),
        );
      }, 100);
    },
    [router],
  );

  const handleBack = () => navigateToTeacherTab("assessments");

  return (
    <DashboardShell
      activeTab="assessments"
      setActiveTab={navigateToTeacherTab}
      title="Assessment Questions"
      subtitle="View, edit, and add questions for this assessment."
      eyebrow="Bole Secondary · Teacher Portal"
      headerVariant="portal"
      breadcrumbs={[
        { label: "Assessments", onClick: handleBack },
        { label: "Questions" },
      ]}
      actions={
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={`${aisBtnSecondary} text-xs`}
            onClick={handleBack}
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
            Back to assessments
          </button>
        </div>
      }
    >
      <Suspense fallback={<TabLoading />}>
        <TeacherAssessmentDetail assessmentId={assessmentId} />
      </Suspense>
    </DashboardShell>
  );
}
