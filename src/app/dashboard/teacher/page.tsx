"use client";

import React, { useState } from "react";
import { FilePlus, PenLine, Upload } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import { getDemoTeacher } from "@/lib/teacherPortal";
import {
  aisUserBadge,
  aisUserBadgeAvatar,
  aisBtnPrimary,
  aisBtnSecondary,
} from "@/components/dashboard/teacher/aisStyles";
import { TeacherDashboard } from "@/components/dashboard/teacher/TeacherDashboard";
import { TeacherTeachingNotes } from "@/components/dashboard/teacher/TeacherTeachingNotes";
import { TeacherStudentsTab } from "@/components/dashboard/teacher/TeacherStudentsTab";
import { TeacherResourcesTab } from "@/components/dashboard/teacher/TeacherResourcesTab";
import { TeacherAssessmentsTab } from "@/components/dashboard/teacher/TeacherAssessmentsTab";
import { TeacherCheckinsTab } from "@/components/dashboard/teacher/TeacherCheckinsTab";
import { TeacherClassesTab } from "@/components/dashboard/teacher/TeacherClassesTab";
import { TeacherAttendanceTab } from "@/components/dashboard/teacher/TeacherAttendanceTab";
import { TeacherTrainingTab } from "@/components/dashboard/teacher/TeacherTrainingTab";
import { TeacherFeedbackTab } from "@/components/dashboard/teacher/TeacherFeedbackTab";
import { TeacherSettingsTab } from "@/components/dashboard/teacher/TeacherSettingsTab";

const TAB_META: Record<string, { title: string; subtitle?: string }> = {
  dashboard: {
    title: "Class Dashboard",
    subtitle:
      "Welcome back. Here is the latest activity from your teaching sections.",
  },
  "teaching-notes": {
    title: "Teaching Notes",
    subtitle:
      "View all notes per lesson plan, create new notes with AI, and submit for department head approval.",
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
  feedback: {
    title: "Feedback",
    subtitle: "View feedback received and provide comments to students.",
  },
  settings: {
    title: "Settings",
    subtitle: "Personal profile and general portal preferences.",
  },
};

export default function TeacherPortalPage() {
  const { teachers } = useApp();
  const teacher = getDemoTeacher(teachers);
  const [activeTab, setActiveTab] = useState("dashboard");

  const meta = TAB_META[activeTab] ?? TAB_META.dashboard;

  const shellActions =
    activeTab === "teaching-notes" ? (
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={`${aisBtnSecondary} text-xs`}
          onClick={() => window.dispatchEvent(new Event("open-teacher-lesson-plan"))}
        >
          + Create lesson plan
        </button>
        <button
          type="button"
          className={`${aisBtnPrimary} text-xs`}
          onClick={() => window.dispatchEvent(new Event("open-teacher-create-note"))}
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
    ) : activeTab === "resources" ? (
      <Button
        variant="organic"
        size="sm"
        className="text-xs h-9 gap-1.5 border-none"
        onClick={() => window.dispatchEvent(new Event("open-teacher-resource"))}
      >
        <Upload className="h-3.5 w-3.5" aria-hidden />
        Upload resource
      </Button>
    ) : activeTab === "assessments" ? (
      <Button
        variant="organic"
        size="sm"
        className="text-xs h-9 gap-1.5 border-none"
        onClick={() =>
          window.dispatchEvent(new Event("open-teacher-assessment"))
        }
      >
        <FilePlus className="h-3.5 w-3.5" aria-hidden />
        New assessment
      </Button>
    ) : (
      <span className={aisUserBadge}>
        <span className={aisUserBadgeAvatar} aria-hidden>
          {teacher.name
            .split(/\s+/)
            .map((part) => part[0])
            .join("")
            .slice(0, 2)
            .toUpperCase()}
        </span>
        <span>
          {teacher.name}
          <span className="text-ais-on-surface-variant"> · </span>
          {teacher.subjects[0]}
        </span>
      </span>
    );

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
      {activeTab === "dashboard" && <TeacherDashboard />}
      {activeTab === "teaching-notes" && <TeacherTeachingNotes />}
      {activeTab === "manage-students" && <TeacherStudentsTab />}
      {activeTab === "resources" && <TeacherResourcesTab />}
      {activeTab === "assessments" && <TeacherAssessmentsTab />}
      {activeTab === "checkins" && <TeacherCheckinsTab />}
      {activeTab === "manage-classes" && <TeacherClassesTab />}
      {activeTab === "attendance" && <TeacherAttendanceTab />}
      {activeTab === "training" && <TeacherTrainingTab />}
      {activeTab === "feedback" && <TeacherFeedbackTab />}
      {activeTab === "settings" && <TeacherSettingsTab />}
    </DashboardShell>
  );
}
