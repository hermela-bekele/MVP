"use client";

import React, { Suspense, lazy, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { aisBtnSecondary } from "@/components/dashboard/teacher/aisStyles";
import { portalTabPath } from "@/lib/portalPaths";

function GeneratorLoading() {
  return (
    <div className="flex min-h-[200px] items-center justify-center text-sm text-muted-foreground">
      Loading…
    </div>
  );
}

const TeacherAssessmentGenerator = lazy(() =>
  import("@/components/dashboard/teacher/TeacherAssessmentGenerator").then((m) => ({
    default: m.TeacherAssessmentGenerator,
  })),
);

export default function GenerateAssessmentPage() {
  const router = useRouter();

  const navigateToTeacherTab = useCallback(
    (tab: string) => {
      router.push(portalTabPath("teacher", tab));
    },
    [router],
  );

  const handleBack = () => {
    router.push(portalTabPath("teacher", "assessments"));
  };

  return (
    <DashboardShell
      activeTab="assessments"
      setActiveTab={navigateToTeacherTab}
      title="Create Assessment"
      subtitle="Generate a quiz, assignment, or baseline with AI, then review and save."
      eyebrow="Bole Secondary · Teacher Portal"
      headerVariant="portal"
      hideSearch
      breadcrumbs={[
        { label: "Assessments", onClick: handleBack },
        { label: "Create" },
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
      <Suspense fallback={<GeneratorLoading />}>
        <TeacherAssessmentGenerator />
      </Suspense>
    </DashboardShell>
  );
}
