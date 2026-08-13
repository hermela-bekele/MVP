"use client";

import React, { Suspense, lazy, use, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import {
  aisBtnPrimary,
  aisBtnSecondary,
} from "@/components/dashboard/teacher/aisStyles";
import { portalTabPath } from "@/lib/portalPaths";

function TabLoading() {
  return (
    <div className="flex min-h-[200px] items-center justify-center text-sm text-muted-foreground">
      Loading…
    </div>
  );
}

const TeacherTeachingNotes = lazy(() =>
  import("@/components/dashboard/teacher/TeacherTeachingNotes").then((m) => ({
    default: m.TeacherTeachingNotes,
  })),
);

export default function LessonPlanNotesPage({
  params,
}: {
  params: Promise<{ lessonPlanId: string }>;
}) {
  const { lessonPlanId } = use(params);
  const router = useRouter();

  const navigateToTeacherTab = useCallback(
    (tab: string) => {
      router.push(portalTabPath("teacher", tab));
    },
    [router],
  );

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    navigateToTeacherTab("lesson-plans");
  };

  return (
    <DashboardShell
      activeTab="lesson-plans"
      setActiveTab={navigateToTeacherTab}
      title="Lesson Plans"
      subtitle="All notes for this lesson plan."
      eyebrow="Bole Secondary · Teacher Portal"
      headerVariant="portal"
      breadcrumbs={[
        { label: "Lesson Plans", onClick: () => navigateToTeacherTab("lesson-plans") },
        { label: "Lesson plan notes" },
      ]}
      actions={
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={`${aisBtnSecondary} text-xs`}
            onClick={handleBack}
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
            Back
          </button>
          <button
            type="button"
            className={`${aisBtnPrimary} text-xs`}
            onClick={() =>
              window.dispatchEvent(
                new CustomEvent("open-teacher-create-note", {
                  detail: { lessonPlanId },
                }),
              )
            }
          >
            <Plus className="h-3.5 w-3.5" aria-hidden />
            Add note
          </button>
        </div>
      }
    >
      <Suspense fallback={<TabLoading />}>
        <TeacherTeachingNotes lessonPlanId={lessonPlanId} mode="plans" />
      </Suspense>
    </DashboardShell>
  );
}
