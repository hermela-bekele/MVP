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
} from "lucide-react";
import {
  TRAINING_MODULES,
  type TrainingModule,
  type SessionContent,
  isAssessmentUnlocked,
  calculateModuleProgress,
} from "@/lib/trainingModules";
import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer";
import { AssessmentQuiz } from "@/components/dashboard/teacher/AssessmentQuiz";
import { AisPage } from "@/components/dashboard/teacher/TeacherPortalUi";
import { aisCard } from "@/components/dashboard/teacher/aisStyles";
import { generatePDFFromMarkdown } from "@/lib/pdfUtils";

const trainingCard = `${aisCard} !bg-white rounded-2xl p-6 text-left text-ais-on-surface transition-all duration-300 hover:shadow-lg hover:border-ais-primary/30`;
const trainingPanel = `${aisCard} !bg-white rounded-xl text-ais-on-surface`;
const trainingText = "text-ais-on-surface";
const trainingMuted = "text-ais-on-surface-variant";
const trainingGreen = "text-emerald-600";
const trainingGreenBg = "bg-emerald-50 text-emerald-700";
const trainingTagDone =
  "bg-emerald-50 text-emerald-700 border border-emerald-200";
const trainingTagPending =
  "bg-ais-surface-container-low text-ais-on-surface-variant border border-ais-card-border";
const trainingProgressTrack = "bg-ais-surface-container-low";
const trainingProgressFill = "bg-emerald-500";
const trainingBtnGreen = "bg-emerald-600 text-white hover:bg-emerald-700";
const trainingSessionActive =
  "bg-emerald-50 text-emerald-700 border border-emerald-200";
const trainingMarkdownWrap =
  "[&_.markdown-content]:prose-slate [&_h1]:!text-ais-on-surface [&_h2]:!text-ais-on-surface [&_h3]:!text-ais-primary [&_h4]:!text-ais-on-surface [&_p]:!text-ais-on-surface-variant [&_ul]:!text-ais-on-surface-variant [&_ol]:!text-ais-on-surface-variant [&_strong]:!text-ais-on-surface [&_td]:!text-ais-on-surface-variant [&_tbody]:!bg-white";

export const TeacherTrainingTab: React.FC<{ typeFilter: string }> = () => {
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

  // Initialize selected session when module changes
  useEffect(() => {
    if (selectedModule && selectedModule.sessions.length > 0) {
      setSelectedSession(selectedModule.sessions[0]);
      setContentTab("content");
    }
  }, [selectedModule]);

  // Handler for marking session complete
  const handleMarkComplete = (sessionId: string) => {
    if (!selectedModule) return;

    // Find the session and toggle completion
    const updatedSessions = selectedModule.sessions.map((s) =>
      s.id === sessionId ? { ...s, completed: !s.completed } : s,
    );

    // Update the module
    const updatedModule = { ...selectedModule, sessions: updatedSessions };
    setSelectedModule(updatedModule);

    // Update selected session if it's the one being marked
    if (selectedSession?.id === sessionId) {
      setSelectedSession({
        ...selectedSession,
        completed: !selectedSession.completed,
      });
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
        {/* Module Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {TRAINING_MODULES.map((module) => {
            const progress = calculateModuleProgress(module);
            const completedCount = module.sessions.filter(
              (s) => s.completed,
            ).length;

            return (
              <button
                key={module.id}
                onClick={() => setSelectedModule(module)}
                className={`group relative overflow-hidden ${trainingCard}`}
              >
                {/* Category Badge */}
                <div
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold mb-4"
                  style={{
                    backgroundColor: module.category.includes("SECONDARY")
                      ? "#E0F2FE"
                      : "#DCFCE7",
                    color: module.category.includes("SECONDARY")
                      ? "#0369A1"
                      : "#166534",
                  }}
                >
                  {module.category}
                </div>

                {/* Title */}
                <h3
                  className={`text-xl font-bold ${trainingText} mb-2 group-hover:text-emerald-600 transition-colors`}
                >
                  {module.title}
                </h3>

                {/* Description */}
                <p className={`text-sm ${trainingMuted} mb-4`}>
                  {module.description}
                </p>

                {/* Sessions with completion status */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {module.sessions.map((session) => (
                    <span
                      key={session.id}
                      className={`px-2 py-1 text-xs rounded-lg flex items-center gap-1 ${
                        session.completed ? trainingTagDone : trainingTagPending
                      }`}
                    >
                      {session.number} {session.title}
                      {session.completed && <CheckCircle className="w-3 h-3" />}
                    </span>
                  ))}
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm font-medium ${trainingText}`}>
                      {completedCount}/{module.sessions.length} sessions ·{" "}
                      {progress}%
                    </span>
                    <span
                      className={`text-xs ${trainingMuted} flex items-center gap-1`}
                    >
                      <PlayCircle className="w-3 h-3" />
                      {module.videoCount} videos
                    </span>
                  </div>
                  <div
                    className={`h-2 ${trainingProgressTrack} rounded-full overflow-hidden`}
                  >
                    <div
                      className={`h-full ${trainingProgressFill} transition-all duration-500`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* CTA */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-sm font-semibold ${trainingGreen} group-hover:underline`}
                  >
                    {progress === 0
                      ? "Start"
                      : progress === 100
                        ? "Review"
                        : "Continue"}
                  </span>
                  {progress === 100 && (
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
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
      <div className={`${trainingCard} mb-6`}>
        <button
          onClick={() => {
            setSelectedModule(null);
            setSelectedSession(null);
          }}
          className={`flex items-center gap-2 ${trainingMuted} hover:text-ais-on-surface mb-4 transition-colors`}
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Modules
        </button>

        <div className="flex items-start justify-between">
          <div>
            <div
              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold mb-2"
              style={{
                backgroundColor: selectedModule.category.includes("SECONDARY")
                  ? "#E0F2FE"
                  : "#DCFCE7",
                color: selectedModule.category.includes("SECONDARY")
                  ? "#0369A1"
                  : "#166534",
              }}
            >
              {selectedModule.category}
            </div>
            <h1 className={`text-2xl font-bold ${trainingText} mb-2`}>
              {selectedModule.title}
            </h1>
            <p className={`text-sm ${trainingMuted}`}>
              {selectedModule.description}
            </p>
          </div>

          {/* Progress Badge */}
          <div className="text-right">
            <div className={`text-3xl font-bold ${trainingGreen} mb-1`}>
              {progress}%
            </div>
            <div className={`text-xs ${trainingMuted}`}>
              {completedCount}/{selectedModule.sessions.length} sessions
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mt-6">
          <button
            onClick={() => setActiveTab("modules")}
            className={`pb-2 px-1 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === "modules"
                ? "border-emerald-600 text-emerald-600"
                : `border-transparent ${trainingMuted} hover:text-ais-on-surface`
            }`}
          >
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Module Content
            </div>
          </button>
          <button
            onClick={() => setActiveTab("videos")}
            className={`pb-2 px-1 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === "videos"
                ? "border-emerald-600 text-emerald-600"
                : `border-transparent ${trainingMuted} hover:text-ais-on-surface`
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
            <div className={`${trainingPanel} p-4`}>
              <h3 className={`font-semibold ${trainingText} mb-4`}>Sessions</h3>
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
                        : `${trainingText} hover:bg-ais-surface-container-low`
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
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    )}
                  </button>
                ))}

                {/* Separator */}
                <div className="border-t border-ais-card-border my-2" />

                {/* Assessment Button */}
                <button
                  onClick={() => setContentTab("assessment")}
                  disabled={!isAssessmentUnlocked(selectedModule)}
                  className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    contentTab === "assessment"
                      ? trainingSessionActive
                      : isAssessmentUnlocked(selectedModule)
                        ? `${trainingText} hover:bg-ais-surface-container-low`
                        : "text-ais-on-surface-variant cursor-not-allowed opacity-50"
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
            <div className={`${trainingPanel} p-6`}>
              {contentTab === "content" && selectedSession ? (
                <>
                  {/* Session Header */}
                  <div className="mb-6 pb-6 border-b border-ais-card-border">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span
                            className={`px-3 py-1 ${trainingGreenBg} ${trainingGreen} text-sm font-bold rounded-full`}
                          >
                            Session {selectedSession.number}
                          </span>
                          {selectedSession.completed && (
                            <span
                              className={`px-3 py-1 ${trainingTagDone} text-xs font-semibold rounded-full flex items-center gap-1`}
                            >
                              <CheckCircle className="w-3 h-3" />
                              Completed
                            </span>
                          )}
                        </div>
                        <h2
                          className={`text-2xl font-bold ${trainingText} mb-2`}
                        >
                          {selectedSession.title}
                        </h2>
                        <p className={`text-sm ${trainingMuted}`}>
                          Duration: {selectedSession.duration}
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => handleMarkComplete(selectedSession.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${
                          selectedSession.completed
                            ? "bg-ais-surface-container-low text-ais-on-surface hover:bg-ais-surface-container"
                            : trainingBtnGreen
                        }`}
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
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold ${trainingBtnGreen}`}
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
                          className="flex items-center gap-1 px-3 py-2 bg-ais-surface-container-low text-ais-on-surface-variant rounded-lg hover:bg-ais-surface-container transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                          className="flex items-center gap-1 px-3 py-2 bg-ais-surface-container-low text-ais-on-surface rounded-lg hover:bg-ais-surface-container transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                    <AssessmentQuiz
                      questions={selectedModule.assessmentQuestions}
                      passingScore={selectedModule.passingScore}
                      moduleTitle={selectedModule.title}
                      onComplete={(score, passed) => {
                        console.log(
                          `Assessment completed: ${score}% - ${passed ? "Passed" : "Failed"}`,
                        );
                        // TODO: Save score to backend
                      }}
                    />
                  ) : (
                    <div className="text-center py-12">
                      <Lock
                        className={`w-16 h-16 ${trainingMuted} mx-auto mb-4`}
                      />
                      <p
                        className={`${trainingMuted} text-lg font-medium mb-2`}
                      >
                        Assessment Locked
                      </p>
                      <p className="text-sm text-ais-on-surface-variant">
                        Complete all {selectedModule.sessions.length} sessions
                        to unlock this assessment
                      </p>
                      <div className="mt-6">
                        <div className="inline-flex items-center gap-2 text-sm">
                          <span className={`${trainingGreen} font-semibold`}>
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
          {selectedModule.videos?.map((video) => (
            <div
              key={video.id}
              className={`${trainingPanel} overflow-hidden hover:shadow-lg transition-shadow`}
            >
              <div className="relative aspect-video bg-ais-surface-container-low">
                <div className="absolute inset-0 flex items-center justify-center">
                  <PlayCircle className="w-16 h-16 text-white opacity-80 hover:opacity-100 transition-opacity cursor-pointer" />
                </div>
              </div>
              <div className="p-4">
                <h3 className={`font-semibold ${trainingText} mb-2`}>
                  {video.title}
                </h3>
                <p className={`text-sm ${trainingMuted}`}>
                  Duration: {video.duration}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
