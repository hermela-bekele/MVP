"use client";

import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  BookOpen,
  PlayCircle,
  CheckCircle,
  Lock,
  Download,
  ChevronRight,
  ChevronLeft,
  ClipboardCheck,
} from "lucide-react";
import {
  CONTINUOUS_DEVELOPMENT_MODULES,
  type TrainingModule,
  type SessionContent,
  isAssessmentUnlocked,
  calculateModuleProgress,
} from "@/lib/continuousDevelopmentModules";
import { TRAINING_MODULES } from "@/lib/trainingModules";
import { TIP_MODULES } from "@/lib/inductionModules";
import { ELEP_MODULES } from "@/lib/leadershipModules";
import { useApp } from "@/context/AppContext";
import { getDemoTeacher } from "@/lib/teacherPortal";
import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer";
import { ModuleAssessmentPanel } from "@/components/dashboard/teacher/ModuleAssessmentPanel";
import { AisPage } from "@/components/dashboard/teacher/TeacherPortalUi";
import {
  aisBadgePrimary,
  aisBadgeSuccess,
  aisBodyMd,
  aisBtnPrimary,
  aisBtnSecondary,
  aisCard,
  aisHeadlineSm,
  aisSubTabBtn,
  aisSubTabBtnActive,
  aisSubTabBtnInactive,
  aisSubTabTrack,
} from "@/components/dashboard/teacher/aisStyles";
import { generatePDFFromMarkdown } from "@/lib/pdfUtils";
import { VideoPlayer } from "@/components/ui/VideoPlayer";
import { Pagination } from "@/components/ui/pagination";

const CARDS_PER_PAGE = 6; // Show 6 cards: 3 per row × 2 rows

const trainingSessionActive =
  "bg-primary/10 text-primary shadow-[0_1px_3px_rgba(15,23,42,0.05)]";
const trainingSessionInactive =
  "text-foreground hover:bg-muted hover:text-primary";
const trainingMarkdownWrap = "overflow-x-auto";

export const TeacherTrainingTab: React.FC<{
  typeFilter: string;
  activeTabType?: string;
}> = ({ activeTabType = "training-continuous" }) => {
  const [selectedModule, setSelectedModule] = useState<TrainingModule | null>(
    null,
  );
  const [selectedSession, setSelectedSession] = useState<SessionContent | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState<"modules" | "videos">("modules");
  const [contentTab, setContentTab] = useState<"content" | "assessment">(
    "content",
  );
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const { teachers, schools, currentUser, teacherTrainingAssignments, addNotification, updateTrainingAssignmentProgress } = useApp();
  const teacher = getDemoTeacher(teachers, currentUser?.email, currentUser?.displayName);

  // School-level training overview (§16: the training engine's landing card
  // represents the whole school's development picture, not just this one
  // teacher's — individual assignments still show underneath, unchanged).
  const school = schools.find((s) => s.id === teacher.schoolId);
  const schoolActiveTeachers = teachers.filter((t) => t.schoolId === teacher.schoolId && t.status === 'Active');
  const schoolAssignments = teacherTrainingAssignments.filter((a) =>
    schoolActiveTeachers.some((t) => t.id === a.teacherId)
  );
  const schoolCompletedCount = schoolAssignments.filter((a) => a.status === 'completed').length;
  const schoolOverdueCount = schoolAssignments.filter((a) => a.overdue).length;
  const schoolCompletionRate = schoolAssignments.length
    ? Math.round((schoolCompletedCount / schoolAssignments.length) * 100)
    : 0;
  const teachersWithAssignments = new Set(schoolAssignments.map((a) => a.teacherId)).size;

  // TR-002: "Assigned to Me" (the bare 'training' tab) is a cross-program landing view —
  // it doesn't belong to one module library, so it shows the union of all of them.
  const isAssignedToMeView = activeTabType === "training";

  // Select the appropriate modules based on active tab
  const ALL_MODULES =
    activeTabType === "all" || isAssignedToMeView
      ? [...TRAINING_MODULES, ...TIP_MODULES, ...ELEP_MODULES, ...CONTINUOUS_DEVELOPMENT_MODULES]
      : activeTabType === "training-subject-matter"
        ? TRAINING_MODULES
        : activeTabType === "training-induction"
          ? TIP_MODULES
          : activeTabType === "leadership-development"
            ? ELEP_MODULES
            : CONTINUOUS_DEVELOPMENT_MODULES;

  const program: "TIP" | "STEP" | null =
    activeTabType === "training-induction" ? "TIP" : activeTabType === "training-continuous" ? "STEP" : null;

  // "Assigned to Me" shows every assignment regardless of program; the TIP/STEP-specific
  // views stay scoped to their own program.
  const assignedModules = isAssignedToMeView
    ? teacherTrainingAssignments.filter((a) => a.teacherId === teacher.id)
    : program
      ? teacherTrainingAssignments.filter((a) => a.teacherId === teacher.id && a.program === program)
      : [];

  // TR-004/TR-007: if the module currently open was formally assigned by an HoD, its
  // progress (sessions/assessment/reflection) is persisted against that assignment so
  // the HoD can track it and completion can be enforced server-side. A module a teacher
  // is just browsing on their own has no assignment row to persist against.
  const matchingAssignment = selectedModule
    ? teacherTrainingAssignments.find(
        (a) => a.teacherId === teacher.id && a.moduleId === selectedModule.id,
      ) ?? null
    : null;

  // Calculate pagination
  const totalPages = Math.ceil(ALL_MODULES.length / CARDS_PER_PAGE);
  const startIndex = (currentPage - 1) * CARDS_PER_PAGE;
  const endIndex = startIndex + CARDS_PER_PAGE;
  const currentModules = ALL_MODULES.slice(startIndex, endIndex);

  // Keep the selected session in sync with module updates without
  // resetting progress back to the first session.
  useEffect(() => {
    if (selectedModule && selectedModule.sessions.length > 0) {
      setSelectedSession((currentSelectedSession) => {
        if (!currentSelectedSession) {
          return selectedModule.sessions[0];
        }

        return (
          selectedModule.sessions.find(
            (session) => session.id === currentSelectedSession.id,
          ) ?? selectedModule.sessions[0]
        );
      });
      setContentTab("content");
    }
  }, [selectedModule]);

  // Handler for marking session complete
  const handleMarkComplete = (sessionId: string) => {
    if (!selectedModule) return;

    const currentSessionIndex = selectedModule.sessions.findIndex(
      (session) => session.id === sessionId,
    );
    const sessionToToggle = selectedModule.sessions[currentSessionIndex];

    if (!sessionToToggle) return;

    const nextCompletedState = !sessionToToggle.completed;

    // Find the session and toggle completion
    const updatedSessions = selectedModule.sessions.map((s) =>
      s.id === sessionId ? { ...s, completed: nextCompletedState } : s,
    );

    // Update the module
    const updatedModule = { ...selectedModule, sessions: updatedSessions };
    setSelectedModule(updatedModule);

    if (matchingAssignment) {
      const completedCount = updatedSessions.filter((s) => s.completed).length;
      void updateTrainingAssignmentProgress(matchingAssignment.id, {
        sessionsCompleted: completedCount,
        sessionsTotal: updatedSessions.length,
      });
    }

    // Advance to the next session after completion, otherwise keep the
    // current session selected with its updated completion state.
    if (selectedSession?.id === sessionId) {
      const nextSession =
        nextCompletedState &&
        currentSessionIndex < updatedSessions.length - 1
          ? updatedSessions[currentSessionIndex + 1]
          : updatedSessions[currentSessionIndex];

      setSelectedSession(nextSession);
    }
  };

  // Handler for PDF download
  const handleDownloadPDF = async (
    content: string,
    filename: string,
    title: string,
  ) => {
    setIsGeneratingPDF(true);
    try {
      await generatePDFFromMarkdown(content, filename, title);
    } catch (error) {
      console.error("Failed to generate PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Module List View
  if (!selectedModule) {
    return (
      <AisPage>
        {isAssignedToMeView && (
          <div className={`${aisCard} p-5`}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-sm font-bold text-title">
                {school?.name ?? 'School'} Training Overview
              </h3>
              <span className="text-xs font-semibold text-muted-foreground">
                {teachersWithAssignments} of {schoolActiveTeachers.length} teachers with assigned training
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-2xl font-bold text-primary">{schoolCompletionRate}%</p>
                <p className="text-xs text-muted-foreground">School-wide completion rate</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{schoolCompletedCount}/{schoolAssignments.length}</p>
                <p className="text-xs text-muted-foreground">Assignments completed</p>
              </div>
              <div>
                <p className={`text-2xl font-bold ${schoolOverdueCount > 0 ? 'text-red-600' : 'text-foreground'}`}>{schoolOverdueCount}</p>
                <p className="text-xs text-muted-foreground">Overdue across the school</p>
              </div>
            </div>
          </div>
        )}

        {assignedModules.length > 0 && (
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary">
              <ClipboardCheck className="h-4 w-4" />
              Assigned to you by your HoD
            </div>
            <div className="space-y-2">
              {assignedModules.map((a) => {
                const mod = ALL_MODULES.find((m) => m.id === a.moduleId);
                return (
                  <button
                    key={a.id}
                    onClick={() => mod && setSelectedModule(mod)}
                    disabled={!mod}
                    className="flex w-full flex-col gap-0.5 rounded-lg border border-border bg-white px-3 py-2 text-left text-sm hover:border-primary/40 disabled:cursor-default disabled:opacity-70 dark:bg-card"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-foreground">{a.moduleTitle}</span>
                      {a.status === 'completed' ? (
                        <span className="shrink-0 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-bold uppercase text-success">Completed</span>
                      ) : a.overdue ? (
                        <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold uppercase text-red-700">Late</span>
                      ) : a.dueDate ? (
                        <span className="shrink-0 text-[10px] font-semibold uppercase text-muted-foreground">Due {a.dueDate}</span>
                      ) : null}
                    </div>
                    {a.reason && <span className="text-xs text-muted-foreground">{a.reason}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Module Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentModules.map((module) => {
            // A module formally assigned by the HoD is only really "complete" once its
            // TeacherTrainingAssignment record says so (sessions + assessment + reflection,
            // enforced server-side) — the session-toggle percentage alone can't be trusted
            // to reflect that, so it's overridden to 100% once the assignment confirms it.
            const assignment = teacherTrainingAssignments.find(
              (a) => a.teacherId === teacher.id && a.moduleId === module.id,
            );
            const isCompleted = assignment?.status === 'completed';
            const progress = isCompleted ? 100 : calculateModuleProgress(module);

            return (
              <button
                key={module.id}
                onClick={() => setSelectedModule(module)}
                className={`${aisCard} group relative overflow-hidden p-5 text-left transition-all duration-300 hover:shadow-md hover:border-primary/30`}
              >
                {/* Category Badge */}
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div className={aisBadgePrimary}>{module.category}</div>
                  {isCompleted && (
                    <span className={aisBadgeSuccess}>Completed</span>
                  )}
                </div>

                {/* Title */}
                <h3 className={`${aisHeadlineSm} mb-2 transition-colors line-clamp-2 !text-title`}>
                  {module.title}
                </h3>

                {/* Description */}
                <p className={`${aisBodyMd} mb-4 line-clamp-2`}>
                  {module.description}
                </p>

                {/* Session and Video Count */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-1.5 text-sm">
                    <BookOpen className="w-4 h-4 text-primary" />
                    <span className="font-semibold text-foreground">
                      {module.sessions.length} Sessions
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm">
                    <PlayCircle className="w-4 h-4 text-primary" />
                    <span className="font-semibold text-foreground">
                      {module.videoCount} Videos
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-foreground">
                      Progress: {progress}%
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* CTA */}
                <div className="flex items-center justify-between pt-2">
                  <span className="text-sm font-semibold text-primary group-hover:underline">
                    {progress === 0
                      ? "Start"
                      : progress === 100
                        ? "Review"
                        : "Continue"}
                  </span>
                  {progress === 100 && (
                    <CheckCircle className="w-5 h-5 text-success" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Pagination Controls */}
        <Pagination
          className="mt-8"
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </AisPage>
    );
  }

  // Module Content View
  const progress = calculateModuleProgress(selectedModule);
  const completedCount = selectedModule.sessions.filter(
    (s) => s.completed,
  ).length;
  const currentSessionIndex = selectedSession
    ? selectedModule.sessions.findIndex((s) => s.id === selectedSession.id)
    : 0;
  const hasPrevious = currentSessionIndex > 0;
  const hasNext = currentSessionIndex < selectedModule.sessions.length - 1;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className={`${aisCard} mb-6 p-6`}>
        <button
          onClick={() => {
            setSelectedModule(null);
            setSelectedSession(null);
          }}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Modules
        </button>

        <div className="flex items-start justify-between mb-6">
          <div>
            <div className={`${aisBadgePrimary} mb-2`}>
              {selectedModule.category}
            </div>
            <h1 className={`text-2xl font-bold text-title mb-2`}>
              {selectedModule.title}
            </h1>
            <p className={aisBodyMd}>
              {selectedModule.description}
            </p>
          </div>

          {/* Progress Badge */}
          <div className="text-right">
            <div className="text-3xl font-bold text-primary mb-1">
              {progress}%
            </div>
            <div className={`text-xs ${aisBodyMd}`}>
              {completedCount}/{selectedModule.sessions.length} sessions
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className={aisSubTabTrack}>
          <button
            onClick={() => setActiveTab("modules")}
            className={`${aisSubTabBtn} ${
              activeTab === "modules"
                ? aisSubTabBtnActive
                : aisSubTabBtnInactive
            }`}
          >
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Module Content
            </div>
          </button>
          <button
            onClick={() => setActiveTab("videos")}
            className={`${aisSubTabBtn} ${
              activeTab === "videos"
                ? aisSubTabBtnActive
                : aisSubTabBtnInactive
            }`}
          >
            <div className="flex items-center gap-2">
              <PlayCircle className="w-4 h-4" />
              Videos ({selectedModule.videoCount})
            </div>
          </button>
        </div>
      </div>

      {/* Content Area */}
      {activeTab === "modules" ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Session Navigation */}
          <div className="lg:col-span-1 space-y-4">
            <div className={`${aisCard} p-4`}>
              <h3 className="font-semibold text-title mb-4">Sessions</h3>
              <div className="space-y-2">
                {selectedModule.sessions.map((session) => (
                  <button
                    key={session.id}
                    onClick={() => {
                      setSelectedSession(session);
                      setContentTab("content");
                    }}
                    className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      selectedSession?.id === session.id
                        ? trainingSessionActive
                        : trainingSessionInactive
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-xs font-bold min-w-[2rem]">
                        {session.number}
                      </span>
                      <span className="font-medium text-sm">
                        {session.title}
                      </span>
                    </div>
                    {session.completed && (
                      <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                    )}
                  </button>
                ))}

                {/* Separator */}
                <div className="border-t border-border my-2" />

                {/* Assessment Button */}
                <button
                  onClick={() => setContentTab("assessment")}
                  disabled={!isAssessmentUnlocked(selectedModule)}
                  className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    contentTab === "assessment"
                      ? trainingSessionActive
                      : isAssessmentUnlocked(selectedModule)
                        ? trainingSessionInactive
                        : "text-muted-foreground cursor-not-allowed opacity-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {isAssessmentUnlocked(selectedModule) ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <Lock className="w-5 h-5" />
                    )}
                    <span className="font-medium">Assessment</span>
                  </div>
                </button>
              </div>

              {!isAssessmentUnlocked(selectedModule) && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-xs text-amber-800">
                    Complete all {selectedModule.sessions.length} sessions to
                    unlock the assessment
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className={`${aisCard} p-6`}>
              {contentTab === "content" && selectedSession ? (
                <>
                  {/* Session Header */}
                  <div className="mb-6 pb-6 border-b border-border">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={aisBadgePrimary}>
                            Session {selectedSession.number}
                          </span>
                          {selectedSession.completed && (
                            <span className={`${aisBadgeSuccess} flex items-center gap-1`}>
                              <CheckCircle className="w-3 h-3" />
                              Completed
                            </span>
                          )}
                        </div>
                        <h2 className="text-2xl font-bold text-title mb-2">
                          {selectedSession.title}
                        </h2>
                        <p className={aisBodyMd}>
                          Duration: {selectedSession.duration}
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => handleMarkComplete(selectedSession.id)}
                        className={
                          selectedSession.completed
                            ? aisBtnSecondary
                            : aisBtnPrimary
                        }
                      >
                        <CheckCircle className="w-4 h-4" />
                        {selectedSession.completed
                          ? "Mark Incomplete"
                          : "Mark Complete"}
                      </button>

                      <button
                        onClick={() =>
                          handleDownloadPDF(
                            selectedSession.content,
                            `Session-${selectedSession.number}-${selectedSession.title}.pdf`,
                            `Session ${selectedSession.number}: ${selectedSession.title}`,
                          )
                        }
                        disabled={isGeneratingPDF}
                        className={`${aisBtnPrimary} disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        <Download className="w-4 h-4" />
                        {isGeneratingPDF ? "Generating..." : "Download PDF"}
                      </button>

                      {/* Navigation Buttons */}
                      <div className="flex gap-2 ml-auto">
                        <button
                          onClick={() =>
                            hasPrevious &&
                            setSelectedSession(
                              selectedModule.sessions[currentSessionIndex - 1],
                            )
                          }
                          disabled={!hasPrevious}
                          className={`${aisBtnSecondary} disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          <ChevronLeft className="w-4 h-4" />
                          Previous
                        </button>
                        <button
                          onClick={() =>
                            hasNext &&
                            setSelectedSession(
                              selectedModule.sessions[currentSessionIndex + 1],
                            )
                          }
                          disabled={!hasNext}
                          className={`${aisBtnSecondary} disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          Next
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Session Content */}
                  <div className={trainingMarkdownWrap}>
                    <MarkdownRenderer content={selectedSession.content} />
                  </div>
                </>
              ) : contentTab === "assessment" ? (
                <>
                  {isAssessmentUnlocked(selectedModule) ? (
                    <ModuleAssessmentPanel
                      questions={selectedModule.assessmentQuestions}
                      passingScore={selectedModule.passingScore}
                      moduleTitle={selectedModule.title}
                      assessmentContent={selectedModule.assessmentContent}
                      moduleContent={selectedModule.sessions
                        .map((session) => session.content)
                        .join("\n\n")}
                      onComplete={(score, passed) => {
                        addNotification(
                          passed ? 'Module Assessment Passed' : 'Module Assessment Not Passed',
                          `${selectedModule.title}: scored ${score}%.`,
                          passed ? 'success' : 'alert',
                        );
                        // TR-007: onComplete only ever fires once reflection (when the
                        // module has one) is already submitted, so reflectionSubmitted
                        // is safe to set true here — the backend still independently
                        // enforces all three requirements before marking it complete.
                        if (matchingAssignment) {
                          void updateTrainingAssignmentProgress(matchingAssignment.id, {
                            assessmentScore: score,
                            assessmentPassed: passed,
                            reflectionSubmitted: true,
                          });
                        }
                      }}
                      onReflectionSubmit={(answers) => {
                        if (matchingAssignment) {
                          void updateTrainingAssignmentProgress(matchingAssignment.id, {
                            reflectionAnswers: answers,
                            reflectionSubmitted: true,
                          });
                        }
                      }}
                    />
                  ) : (
                    <div className="text-center py-12">
                      <Lock
                        className="w-16 h-16 text-muted-foreground mx-auto mb-4"
                      />
                      <p className="text-muted-foreground text-lg font-medium mb-2">
                        Assessment Locked
                      </p>
                      <p className={`text-sm ${aisBodyMd}`}>
                        Complete all {selectedModule.sessions.length} sessions
                        to unlock this assessment
                      </p>
                      <div className="mt-6">
                        <div className="inline-flex items-center gap-2 text-sm">
                          <span className="text-primary font-semibold">
                            {completedCount}/{selectedModule.sessions.length}{" "}
                            completed
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : null}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {selectedModule.videos && selectedModule.videos.length > 0 ? (
            selectedModule.videos.map((video) => (
              <div
                key={video.id}
                className={`${aisCard} overflow-hidden hover:shadow-md transition-shadow`}
              >
                {/* Video Player with auto-duration detection */}
                <VideoPlayer
                  url={video.url}
                  title={video.title}
                  thumbnail={video.thumbnail}
                />

                {/* Video Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-title mb-2">
                    {video.title}
                  </h3>
                  <p className={`text-xs ${aisBodyMd}`}>
                    Video duration will be shown when loaded
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-3 text-center py-12">
              <PlayCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className={`${aisBodyMd} text-lg font-medium`}>
                No videos available for this module yet
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
