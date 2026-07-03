"use client";

import React, { Suspense, use, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TeacherTeachingNotes } from "@/components/dashboard/teacher/TeacherTeachingNotes";
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

export default function LessonPlanNotesPage({
  params,
}: {
  params: Promise<{ lessonPlanId: string }>;
}) {
  const { lessonPlanId } = use(params);
  const router = useRouter();

  const navigateToTeacherTab = useCallback((tab: string) => {
    router.push("/dashboard/teacher");
    window.setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent("teacher-quick-action", { detail: { tab } }),
      );
    }, 100);
  }, [router]);

  const handleBack = () => navigateToTeacherTab("teaching-notes");

  return (
    <DashboardShell
      activeTab="teaching-notes"
      setActiveTab={navigateToTeacherTab}
      title="Teaching Notes"
      subtitle="All notes for this lesson plan."
      eyebrow="Bole Secondary · Teacher Portal"
      headerVariant="portal"
      breadcrumbs={[
        { label: "Teaching Notes", onClick: handleBack },
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
            Back to lesson plans
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
        <TeacherTeachingNotes lessonPlanId={lessonPlanId} />
      </Suspense>
    </DashboardShell>
  );
}
