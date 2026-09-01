"use client";

import React, { Suspense, lazy, useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Skeleton } from "@/components/ui/skeleton";
import { aisBtnPrimary } from "@/components/dashboard/teacher/aisStyles";
import { portalTabPath, tabFromPortalPath } from "@/lib/portalPaths";

function TabLoading() {
  return (
    <div className="space-y-4 py-2" role="status" aria-label="Loading">
      <Skeleton variant="rectangular" height={40} className="max-w-sm" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} variant="card" height={110} />
        ))}
      </div>
      <Skeleton variant="card" height={220} />
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
const TeacherPracticeBank = lazy(() =>
  import("@/components/dashboard/teacher/TeacherPracticeBank").then((m) => ({
    default: m.TeacherPracticeBank,
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
const TeacherFeedbackPanel = lazy(() =>
  import("@/components/dashboard/teacher/TeacherFeedbackPanel").then((m) => ({
    default: m.TeacherFeedbackPanel,
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
const StepSelfAssessment = lazy(() =>
  import("@/components/dashboard/teacher/StepSelfAssessment").then((m) => ({
    default: m.StepSelfAssessment,
  })),
);
const TeacherSettingsTab = lazy(() =>
  import("@/components/dashboard/teacher/TeacherSettingsTab").then((m) => ({
    default: m.TeacherSettingsTab,
  })),
);
const TeacherAcademicCalendarTab = lazy(() =>
  import("@/components/dashboard/teacher/TeacherAcademicCalendarTab").then(
    (m) => ({
      default: m.TeacherAcademicCalendarTab,
    }),
  ),
);
const TeacherTimetableTab = lazy(() =>
  import("@/components/dashboard/teacher/TeacherTimetableTab").then((m) => ({
    default: m.TeacherTimetableTab,
  })),
);
const TeacherHodMessagesTab = lazy(() =>
  import("@/components/dashboard/teacher/TeacherHodMessagesTab").then((m) => ({
    default: m.TeacherHodMessagesTab,
  })),
);
const CommunicationModule = lazy(() =>
  import("@/components/dashboard/communication/CommunicationModule").then((m) => ({
    default: m.CommunicationModule,
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
  "lesson-plans": {
    title: "Lesson Plans",
    subtitle: "Annual and weekly lesson plans, paced on the school calendar.",
  },
  "lesson-notes": {
    title: "Lesson Notes",
    subtitle: "AI lesson notes, drafts, and classroom delivery — organized by section.",
  },
  communication: {
    title: "Community",
    subtitle: "School-wide announcements and your community channels.",
  },
  "hod-messages": {
    title: "Direct Messages",
    subtitle: "Real-time conversation with your department head.",
  },
  "manage-students": {
    title: "Manage Students",
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
  feedback: {
    title: "Feedback",
    subtitle: "Give peer feedback and review feedback from your head of department, parents, and students.",
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
    title: "STEP · Professional Growth",
    subtitle: "School-Based Teaching Excellence Program: ongoing professional development.",
  },
  "training-induction": {
    title: "TIP · Induction",
    subtitle: "Teacher Induction Program: foundations for your first two years.",
  },
  "training-self-assessment": {
    title: "STEP Self-Assessment",
    subtitle: "Rate yourself against the STEP rubric — shared with your HoD.",
  },
  messages: {
    title: "Parent Messages",
    subtitle: "One-to-one conversations with parents about your students.",
  },
  settings: {
    title: "Settings",
    subtitle: "Personal profile and general portal preferences.",
  },
  // The navbar's "Profile Settings" dropdown item always links to a `profile` tab (matching
  // every other portal) — alias it to the same content as `settings` rather than renaming
  // the teacher portal's existing sidebar "Settings" entry.
  profile: {
    title: "Settings",
    subtitle: "Personal profile and general portal preferences.",
  },
};

export function TeacherPortalApp() {
  const pathname = usePathname();
  const router = useRouter();
  const activeTab = tabFromPortalPath(pathname, "teacher");
  const [trainingTypeFilter] = useState("All");

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
    activeTab === "lesson-plans" ? (
      <button
        type="button"
        className={`${aisBtnPrimary} text-xs`}
        onClick={() =>
          window.dispatchEvent(new Event("open-teacher-lesson-plan"))
        }
      >
        + Create lesson plan
      </button>
    ) : activeTab === "lesson-notes" ? (
      <button
        type="button"
        className={`${aisBtnPrimary} text-xs`}
        onClick={() =>
          window.dispatchEvent(new Event("open-teacher-create-note"))
        }
      >
        + New lesson note
      </button>
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
      hideSearch
    >
      <Suspense fallback={<TabLoading />}>
        {activeTab === "dashboard" && <TeacherDashboard />}
        {activeTab === "academic-calendar" && <TeacherAcademicCalendarTab />}
        {activeTab === "timetable" && <TeacherTimetableTab />}
        {activeTab === "lesson-plans" && <TeacherTeachingNotes mode="plans" />}
        {activeTab === "lesson-notes" && <TeacherTeachingNotes mode="notes" />}
        {activeTab === "communication" && <CommunicationModule mode="teacher" />}
        {activeTab === "hod-messages" && <TeacherHodMessagesTab />}
        {activeTab === "manage-students" && <TeacherStudentsTab />}
        {activeTab === "resources" && <TeacherResourcesTab />}
        {activeTab === "practice-bank" && <TeacherPracticeBank />}
        {activeTab === "assessments" && <TeacherAssessmentsTab />}
        {activeTab === "checkins" && <TeacherCheckinsTab />}
        {activeTab === "feedback" && <TeacherFeedbackPanel />}
        {activeTab === "manage-classes" && <TeacherClassesTab />}
        {activeTab === "attendance" && <TeacherAttendanceTab />}
        {(activeTab === "training" ||
          activeTab === "training-subject-matter" ||
          activeTab === "training-continuous" ||
          activeTab === "training-induction") && (
          <TeacherTrainingTab
            typeFilter={trainingTypeFilter}
            activeTabType={activeTab}
          />
        )}
        {activeTab === "training-self-assessment" && <StepSelfAssessment />}
        {activeTab === "messages" && (
          <MessageCenter mode="staff" staffRoleHint="teacher" />
        )}
        {(activeTab === "settings" || activeTab === "profile") && <TeacherSettingsTab />}
      </Suspense>
    </DashboardShell>
  );
}

export default TeacherPortalApp;
