"use client";

import React, { Suspense, lazy, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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

const TeacherLessonNoteGenerator = lazy(() =>
  import("@/components/dashboard/teacher/TeacherLessonNoteGenerator").then((m) => ({
    default: m.TeacherLessonNoteGenerator,
  })),
);

export default function GenerateLessonNotePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEditing = Boolean(searchParams.get("noteId"));

  const navigateToTeacherTab = useCallback(
    (tab: string) => {
      router.push(portalTabPath("teacher", tab));
    },
    [router],
  );

  const handleBack = () => navigateToTeacherTab("lesson-notes");

  return (
    <DashboardShell
      activeTab="lesson-notes"
      setActiveTab={navigateToTeacherTab}
      title={isEditing ? "Edit Teaching Note" : "Create Teaching Note"}
      subtitle="Generate lesson notes with AI, then review and save or submit for delivery."
      eyebrow="Bole Secondary · Teacher Portal"
      headerVariant="portal"
      hideSearch
      breadcrumbs={[
        { label: "Lesson Notes", onClick: handleBack },
        { label: isEditing ? "Edit" : "Create" },
      ]}
      actions={
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={`${aisBtnSecondary} text-xs`}
            onClick={handleBack}
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
            Back to lesson notes
          </button>
        </div>
      }
    >
      <Suspense fallback={<GeneratorLoading />}>
        <TeacherLessonNoteGenerator />
      </Suspense>
    </DashboardShell>
  );
}
