"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import { getDemoTeacher } from "@/lib/teacherPortal";
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
    subtitle: "Student status, academics, grades, and class reports.",
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
      <div className="flex gap-2"></div>
    ) : activeTab === "manage-students" ? (
      <Button
        variant="organic"
        size="sm"
        className="text-xs h-9 border-none"
        onClick={() =>
          window.dispatchEvent(new Event("open-teacher-grade-entry"))
        }
      >
        + Record grade
      </Button>
    ) : activeTab === "resources" ? (
      <Button
        variant="organic"
        size="sm"
        className="text-xs h-9 border-none"
        onClick={() => window.dispatchEvent(new Event("open-teacher-resource"))}
      >
        + Upload resource
      </Button>
    ) : activeTab === "assessments" ? (
      <Button
        variant="organic"
        size="sm"
        className="text-xs h-9 border-none"
        onClick={() =>
          window.dispatchEvent(new Event("open-teacher-assessment"))
        }
      >
        + New assessment
      </Button>
    ) : (
      <span className="text-xs px-3 py-1.5 rounded-md bg-primary/10 text-primary font-medium border border-primary/20">
        {teacher.name} · {teacher.subjects[0] ?? "—"}
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
