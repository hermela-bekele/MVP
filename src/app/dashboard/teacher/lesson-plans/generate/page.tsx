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

const TeacherWeeklyPlanGenerator = lazy(() =>
  import("@/components/dashboard/teacher/TeacherWeeklyPlanGenerator").then((m) => ({
    default: m.TeacherWeeklyPlanGenerator,
  })),
);

export default function GenerateWeeklyPlanPage() {
  const router = useRouter();

  const navigateToTeacherTab = useCallback(
    (tab: string) => {
      router.push(portalTabPath("teacher", tab));
    },
    [router],
  );

  const handleBack = () => navigateToTeacherTab("lesson-plans");

  return (
    <DashboardShell
      activeTab="lesson-plans"
      setActiveTab={navigateToTeacherTab}
      title="Create Weekly Lesson Plan"
      subtitle="Generate a weekly plan from the published annual plan, then review and submit."
      eyebrow="Bole Secondary · Teacher Portal"
      headerVariant="portal"
      hideSearch
      breadcrumbs={[
        { label: "Lesson Plans", onClick: handleBack },
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
            Back to lesson plans
          </button>
        </div>
      }
    >
      <Suspense fallback={<GeneratorLoading />}>
        <TeacherWeeklyPlanGenerator />
      </Suspense>
    </DashboardShell>
  );
}
