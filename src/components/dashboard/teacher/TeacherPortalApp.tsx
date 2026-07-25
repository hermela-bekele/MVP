"use client";

import React, { Suspense, lazy, useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { PenLine } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import { aisBtnPrimary } from "@/components/dashboard/teacher/aisStyles";
import { portalTabPath, tabFromPortalPath } from "@/lib/portalPaths";

function TabLoading() {
  return (
    <div className="flex min-h-[200px] items-center justify-center text-sm text-muted-foreground">
      Loading…
    </div>
  );
}

const TeacherDashboard = lazy(() =>
  import("@/components/dashboard/teacher/TeacherDashboard").then((m) => ({
    default: m.TeacherDashboard,
  })),
);
const TeacherTeachingNotes = lazy(() =>
  import("@/components/dashboard/teacher/TeacherTeachingNotes").then((m) => ({
    default: m.TeacherTeachingNotes,
  })),
);
const TeacherStudentsTab = lazy(() =>
  import("@/components/dashboard/teacher/TeacherStudentsTab").then((m) => ({
    default: m.TeacherStudentsTab,
  })),
);
const TeacherResourcesTab = lazy(() =>
  import("@/components/dashboard/teacher/TeacherResourcesTab").then((m) => ({
    default: m.TeacherResourcesTab,
  })),
);
const TeacherAssessmentsTab = lazy(() =>
  import("@/components/dashboard/teacher/TeacherAssessmentsTab").then((m) => ({
    default: m.TeacherAssessmentsTab,
  })),
);
const TeacherCheckinsTab = lazy(() =>
  import("@/components/dashboard/teacher/TeacherCheckinsTab").then((m) => ({
    default: m.TeacherCheckinsTab,
  })),
);
const TeacherClassesTab = lazy(() =>
  import("@/components/dashboard/teacher/TeacherClassesTab").then((m) => ({
    default: m.TeacherClassesTab,
  })),
);
const TeacherAttendanceTab = lazy(() =>
  import("@/components/dashboard/teacher/TeacherAttendanceTab").then((m) => ({
    default: m.TeacherAttendanceTab,
  })),
);
const TeacherTrainingTab = lazy(() =>
  import("@/components/dashboard/teacher/TeacherTrainingTab").then((m) => ({
    default: m.TeacherTrainingTab,
  })),
);
const TeacherFeedbackTab = lazy(() =>
  import("@/components/dashboard/teacher/TeacherFeedbackTab").then((m) => ({
    default: m.TeacherFeedbackTab,
  })),
);
const TeacherSettingsTab = lazy(() =>
  import("@/components/dashboard/teacher/TeacherSettingsTab").then((m) => ({
    default: m.TeacherSettingsTab,
  })),
);
const TeacherAcademicCalendarTab = lazy(() =>
  import("@/components/dashboard/teacher/TeacherAcademicCalendarTab").then((m) => ({
    default: m.TeacherAcademicCalendarTab,
  })),
);
const TeacherTimetableTab = lazy(() =>
  import("@/components/dashboard/teacher/TeacherTimetableTab").then((m) => ({
    default: m.TeacherTimetableTab,
  })),
);
const TeacherPracticeBank = lazy(() =>
  import("@/components/dashboard/teacher/TeacherPracticeBank").then((m) => ({
    default: m.TeacherPracticeBank,
  })),
);
const MessageCenter = lazy(() =>
  import("@/components/dashboard/messaging/MessageCenter").then((m) => ({
    default: m.MessageCenter,
  })),
);

const TAB_META: Record<string, { title: string; subtitle?: string }> = {
  dashboard: {
    title: "Class Dashboard",
    subtitle:
      "Welcome back. Here is the latest activity from your teaching sections.",
  },
  timetable: {
    title: "Teaching Timetable",
    subtitle: "Your full weekly class schedule across all sections.",
  },
  "academic-calendar": {
    title: "Academic Calendar",
    subtitle: "Official school calendar disseminated by the school head.",
  },
  "teaching-notes": {
    title: "Teaching Notes",
    subtitle: "View all notes per lesson plan and create new notes with AI.",
  },
  "manage-students": {
    title: "Manage Students",
    subtitle:
      "Roster, gradebook (quiz, test, project, mid & final exam), and parent messaging.",
  },
  resources: {
    title: "Resources",
    subtitle: "Upload and disseminate worksheets, slides, and lab guides.",
  },
  "practice-bank": {
    title: "Practice Bank",
    subtitle: "Author questions and publish practice sets for students.",
  },
  assessments: {
    title: "Manage Assessments",
    subtitle: "Create or upload quizzes, tests, and exams for any grade level.",
  },
  checkins: {
    title: "Check-ins",
    subtitle: "Respond to wellness and instructional surveys.",
  },
  "manage-classes": {
    title: "Manage Classes",
    subtitle: "All homeroom and subject sections you teach.",
  },
  attendance: {
    title: "Session Attendance",
    subtitle: "Roll call during active teaching sessions.",
  },
  training: {
    title: "Teacher Training",
    subtitle: "MOE materials by type and your certification progress.",
  },
  "training-subject-matter": {
    title: "Subject Matter Training",
    subtitle: "Professional development in your teaching subject area.",
  },
  "training-continuous": {
    title: "Continuous Development",
    subtitle: "Ongoing professional development and pedagogical skills.",
  },
  feedback: {
    title: "Feedback",
    subtitle: "View feedback received and provide comments to students.",
  },
  messages: {
    title: "Parent Messages",
    subtitle: "One-to-one conversations with parents about your students.",
  },
  settings: {
    title: "Settings",
    subtitle: "Personal profile and general portal preferences.",
  },
};

export function TeacherPortalApp() {
  const pathname = usePathname();
  const router = useRouter();
  const activeTab = tabFromPortalPath(pathname, "teacher");
  const [trainingTypeFilter, setTrainingTypeFilter] = useState("All");

  const setActiveTab = useCallback(
    (tab: string) => {
      router.push(portalTabPath("teacher", tab));
    },
    [router],
  );

  const runQuickAction = useCallback(
    (tab: string, eventName?: string) => {
      setActiveTab(tab);
      if (eventName) {
        window.setTimeout(() => {
          window.dispatchEvent(new Event(eventName));
        }, 100);
      }
    },
    [setActiveTab],
  );

  useEffect(() => {
    const handleQuickAction = (event: Event) => {
      const detail = (event as CustomEvent<{ tab: string; event?: string }>)
        .detail;
      if (detail?.tab) {
        runQuickAction(detail.tab, detail.event);
      }
    };

    window.addEventListener("teacher-quick-action", handleQuickAction);
    return () =>
      window.removeEventListener("teacher-quick-action", handleQuickAction);
  }, [runQuickAction]);

  const meta = TAB_META[activeTab] ?? TAB_META.dashboard;

  const shellActions =
    activeTab === "teaching-notes" ? (
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={`${aisBtnPrimary} text-xs`}
          onClick={() =>
            window.dispatchEvent(new Event("open-teacher-lesson-plan"))
          }
        >
          + Create lesson plan
        </button>
        <button
          type="button"
          className={`${aisBtnPrimary} text-xs`}
          onClick={() =>
            window.dispatchEvent(new Event("open-teacher-create-note"))
          }
        >
          + New teaching note
        </button>
      </div>
    ) : activeTab === "manage-students" ? (
      <Button
        variant="organic"
        size="sm"
        className="text-xs h-9 gap-1.5 border-none"
        onClick={() =>
          window.dispatchEvent(new Event("open-teacher-grade-entry"))
        }
      >
        <PenLine className="h-3.5 w-3.5" aria-hidden />
        Record grade
      </Button>
    ) : null;

  return (
    <DashboardShell
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      title={meta.title}
      subtitle={meta.subtitle}
      eyebrow="Bole Secondary · Teacher Portal"
      actions={shellActions}
      headerVariant="portal"
    >
      <Suspense fallback={<TabLoading />}>
        {activeTab === "dashboard" && <TeacherDashboard />}
        {activeTab === "academic-calendar" && <TeacherAcademicCalendarTab />}
        {activeTab === "timetable" && <TeacherTimetableTab />}
        {activeTab === "teaching-notes" && <TeacherTeachingNotes />}
        {activeTab === "manage-students" && <TeacherStudentsTab />}
        {activeTab === "resources" && <TeacherResourcesTab />}
        {activeTab === "practice-bank" && <TeacherPracticeBank />}
        {activeTab === "assessments" && <TeacherAssessmentsTab />}
        {activeTab === "checkins" && <TeacherCheckinsTab />}
        {activeTab === "manage-classes" && <TeacherClassesTab />}
        {activeTab === "attendance" && <TeacherAttendanceTab />}
        {(activeTab === "training" ||
          activeTab === "training-subject-matter" ||
          activeTab === "training-continuous") && (
          <TeacherTrainingTab
            typeFilter={trainingTypeFilter}
            activeTabType={activeTab}
          />
        )}
        {activeTab === "feedback" && <TeacherFeedbackTab />}
        {activeTab === "messages" && (
          <MessageCenter mode="staff" staffRoleHint="teacher" />
        )}
        {activeTab === "settings" && <TeacherSettingsTab />}
      </Suspense>
    </DashboardShell>
  );
}

export default TeacherPortalApp;
