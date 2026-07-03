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
  CONTINUOUS_DEVELOPMENT_MODULES,
  type TrainingModule,
  type SessionContent,
  isAssessmentUnlocked,
  calculateModuleProgress,
} from "@/lib/continuousDevelopmentModules";
import { TRAINING_MODULES } from "@/lib/trainingModules";
import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer";
import { AssessmentQuiz } from "@/components/dashboard/teacher/AssessmentQuiz";
import { AisPage } from "@/components/dashboard/teacher/TeacherPortalUi";
import { generatePDFFromMarkdown } from "@/lib/pdfUtils";
import { VideoPlayer } from "@/components/ui/VideoPlayer";

const CARDS_PER_PAGE = 6; // Show 6 cards: 3 per row × 2 rows

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

  // Select the appropriate modules based on active tab
  const ALL_MODULES =
    activeTabType === "training-subject-matter"
      ? TRAINING_MODULES
      : CONTINUOUS_DEVELOPMENT_MODULES;

  // Calculate pagination
  const totalPages = Math.ceil(ALL_MODULES.length / CARDS_PER_PAGE);
  const startIndex = (currentPage - 1) * CARDS_PER_PAGE;
  const endIndex = startIndex + CARDS_PER_PAGE;
  const currentModules = ALL_MODULES.slice(startIndex, endIndex);

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentModules.map((module) => {
            const progress = calculateModuleProgress(module);

            return (
              <button
                key={module.id}
                onClick={() => setSelectedModule(module)}
                className="group relative overflow-hidden rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 text-left transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:border-primary dark:hover:border-primary"
              >
                {/* Category Badge */}
                <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold mb-3 bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light">
                  {module.category}
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-primary dark:group-hover:text-primary-light transition-colors line-clamp-2">
                  {module.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                  {module.description}
                </p>

                {/* Session and Video Count */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-1.5 text-sm">
                    <BookOpen className="w-4 h-4 text-primary" />
                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                      {module.sessions.length} Sessions
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm">
                    <PlayCircle className="w-4 h-4 text-primary" />
                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                      {module.videoCount} Videos
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      Progress: {progress}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* CTA */}
                <div className="flex items-center justify-between pt-2">
                  <span className="text-sm font-semibold text-primary dark:text-primary-light group-hover:underline">
                    {progress === 0
                      ? "Start"
                      : progress === 100
                        ? "Review"
                        : "Continue"}
                  </span>
                  {progress === 100 && (
                    <CheckCircle className="w-5 h-5 text-primary dark:text-primary-light" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>

            <div className="flex items-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-10 h-10 rounded-lg font-semibold transition-colors ${
                      currentPage === page
                        ? "bg-primary text-white"
                        : "bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                  >
                    {page}
                  </button>
                ),
              )}
            </div>

            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage === totalPages}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
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
      {/* Header - Now with rounded corners and proper alignment */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-ais-card-border dark:border-gray-700 mb-6 p-6">
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

        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold mb-2 bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light">
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
        <div className="flex gap-4 border-t border-ais-card-border dark:border-gray-700 pt-4">
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
                      <CheckCircle className="w-4 h-4 text-primary dark:text-primary-light flex-shrink-0" />
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
                            <span className="px-3 py-1 bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-light text-xs font-semibold rounded-full flex items-center gap-1">
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
                          className="flex items-center gap-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                          className="flex items-center gap-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
          {selectedModule.videos && selectedModule.videos.length > 0 ? (
            selectedModule.videos.map((video) => (
              <div
                key={video.id}
                className="bg-white dark:bg-gray-800 rounded-xl border border-ais-card-border dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Video Player with auto-duration detection */}
                <VideoPlayer
                  url={video.url}
                  title={video.title}
                  thumbnail={video.thumbnail}
                />

                {/* Video Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-ais-on-surface dark:text-gray-100 mb-2">
                    {video.title}
                  </h3>
                  <p className="text-xs text-ais-on-surface-variant dark:text-gray-400">
                    Video duration will be shown when loaded
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-3 text-center py-12">
              <PlayCircle className="w-16 h-16 text-ais-on-surface-variant dark:text-gray-600 mx-auto mb-4" />
              <p className="text-ais-on-surface-variant dark:text-gray-400 text-lg font-medium">
                No videos available for this module yet
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
