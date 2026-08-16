"use client";

import React, { useEffect, useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  BookOpen,
  CheckCircle,
  Loader2,
  RotateCcw,
  XCircle,
} from "lucide-react";
import { ModuleAssessment } from "@/lib/trainingModules";

interface EvaluationResult {
  id: string;
  score: number;
  maxPoints: number;
  feedback: string;
  isCorrect: boolean;
}

interface ShortAnswerQuizProps {
  questions: ModuleAssessment[];
  sectionTitle?: string;
  moduleContent?: string;
  continueLabel?: string;
  onComplete?: (score: number) => void;
}

export const ShortAnswerQuiz: React.FC<ShortAnswerQuizProps> = ({
  questions,
  sectionTitle = "Part A: Short Answer Questions",
  moduleContent = "",
  continueLabel = "Continue",
  onComplete,
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [quizStarted, setQuizStarted] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [answerKeysRevealed, setAnswerKeysRevealed] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationError, setEvaluationError] = useState<string | null>(null);
  const [evaluationResults, setEvaluationResults] = useState<EvaluationResult[]>(
    [],
  );
  const [scorePercentage, setScorePercentage] = useState(0);

  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;
  const currentAnswer = answers[currentQuestionIndex] ?? "";
  const hasAnswer = currentAnswer.trim().length > 0;

  const allQuestionsAnswered = questions.every(
    (_, index) => (answers[index] ?? "").trim().length > 0,
  );

  const canProceed = isLastQuestion
    ? allQuestionsAnswered && hasAnswer
    : hasAnswer;

  const evaluateAnswers = async () => {
    setIsEvaluating(true);
    setEvaluationError(null);

    try {
      const payload = {
        moduleContent,
        questions: questions.map((q, index) => ({
          id: q.id,
          question: q.question,
          userAnswer: answers[index] ?? "",
          maxPoints: q.points,
          correctAnswer: q.correctAnswer,
        })),
      };

      const response = await fetch("/api/ai/evaluate-answers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to evaluate answers");
      }

      const data = await response.json();
      setEvaluationResults(data.results ?? []);
      setScorePercentage(data.scorePercentage ?? 0);
    } catch {
      setEvaluationError(
        "Could not evaluate answers automatically. You can still review the answer key.",
      );
      setEvaluationResults([]);
      setScorePercentage(0);
    } finally {
      setIsEvaluating(false);
    }
  };

  useEffect(() => {
    if (showResults && evaluationResults.length === 0 && !isEvaluating && !evaluationError) {
      void evaluateAnswers();
    }
    // Only run when results screen first appears
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showResults]);

  const getResultForQuestion = (questionId: string) =>
    evaluationResults.find((r) => r.id === questionId);

  const handleNext = () => {
    if (isLastQuestion) {
      setShowResults(true);
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleRetake = () => {
    setCurrentQuestionIndex(0);
    setAnswers({});
    setShowResults(false);
    setAnswerKeysRevealed(false);
    setQuizStarted(false);
    setEvaluationResults([]);
    setScorePercentage(0);
    setEvaluationError(null);
    setIsEvaluating(false);
  };

  if (!quizStarted) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-6">
        <div className="max-w-2xl w-full text-center">
          <div className="mb-6">
            <div className="w-20 h-20 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-10 h-10 text-primary dark:text-primary-light" />
            </div>
            <h2 className="text-2xl font-bold text-title dark:text-gray-100 mb-2">
              {sectionTitle}
            </h2>
            <p className="text-sm text-ais-on-surface-variant dark:text-gray-400">
              Answer all questions in your own words. Your responses will be
              evaluated against the module content.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-ais-card-border dark:border-gray-700 p-6 mb-6">
            <p className="text-xs text-ais-on-surface-variant dark:text-gray-400 mb-1">
              Total Questions
            </p>
            <p className="text-2xl font-bold text-primary dark:text-primary-light">
              {totalQuestions}
            </p>
          </div>

          <button
            onClick={() => setQuizStarted(true)}
            className="px-8 py-3 bg-btn-primary text-btn-primary-foreground rounded-lg hover:bg-btn-primary/90 transition-colors font-semibold text-sm flex items-center gap-2 mx-auto"
          >
            Start Short Answer Section
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  if (showResults) {
    const totalEarned = evaluationResults.reduce((sum, r) => sum + r.score, 0);
    const totalPoints = evaluationResults.reduce(
      (sum, r) => sum + r.maxPoints,
      0,
    );

    return (
      <div className="max-w-3xl mx-auto py-8 px-6">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
            {isEvaluating ? (
              <Loader2 className="w-10 h-10 text-primary dark:text-primary-light animate-spin" />
            ) : (
              <CheckCircle className="w-10 h-10 text-primary dark:text-primary-light" />
            )}
          </div>
          <h2 className="text-2xl font-bold text-title dark:text-gray-100 mb-2">
            {answerKeysRevealed ? "Answer Key" : "Your Results"}
          </h2>
          <p className="text-sm text-ais-on-surface-variant dark:text-gray-400">
            {isEvaluating
              ? "Evaluating your answers against the module content..."
              : answerKeysRevealed
                ? "Compare your answers with the expected responses below."
                : evaluationError
                  ? evaluationError
                  : `You scored ${scorePercentage}% (${totalEarned} of ${totalPoints} points). Review your responses, then check the answer key.`}
          </p>
        </div>

        {!isEvaluating && evaluationResults.length > 0 && !answerKeysRevealed && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-ais-card-border dark:border-gray-700 p-6 mb-6 text-center">
            <p className="text-sm text-ais-on-surface-variant dark:text-gray-400 mb-2">
              Your Score
            </p>
            <div className="text-5xl font-bold text-primary dark:text-primary-light mb-1">
              {scorePercentage}%
            </div>
            <p className="text-sm text-ais-on-surface dark:text-gray-200">
              {totalEarned} of {totalPoints} points earned
            </p>
          </div>
        )}

        <div className="space-y-4 mb-8">
          {questions.map((question, index) => {
            const result = getResultForQuestion(question.id);
            return (
              <div
                key={question.id}
                className={`bg-white dark:bg-gray-800 rounded-xl border p-5 text-left ${
                  answerKeysRevealed && result
                    ? result.isCorrect
                      ? "border-primary/30 dark:border-primary/30"
                      : "border-red-200 dark:border-red-800"
                    : "border-ais-card-border dark:border-gray-700"
                }`}
              >
                <div className="flex items-start gap-2 mb-2">
                  {answerKeysRevealed && result && (
                    result.isCorrect ? (
                      <CheckCircle className="w-5 h-5 text-primary dark:text-primary-light flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    )
                  )}
                  <p className="text-sm font-semibold text-ais-on-surface dark:text-gray-100">
                    Question {index + 1}
                    {result && !answerKeysRevealed && (
                      <span className="ml-2 text-xs font-normal text-ais-on-surface-variant dark:text-gray-400">
                        ({result.score}/{result.maxPoints} pts)
                      </span>
                    )}
                  </p>
                </div>
                <p className="text-sm text-ais-on-surface-variant dark:text-gray-300 mb-3">
                  {question.question}
                </p>
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="font-medium text-ais-on-surface dark:text-gray-200">
                      Your answer:
                    </span>{" "}
                    <span className="text-ais-on-surface-variant dark:text-gray-400">
                      {answers[index] || "—"}
                    </span>
                  </p>
                  {result?.feedback && !answerKeysRevealed && (
                    <p className="text-xs text-ais-on-surface-variant dark:text-gray-400 italic border-l-2 border-primary/30 pl-3">
                      {result.feedback}
                    </p>
                  )}
                  {answerKeysRevealed && (
                    <>
                      {result && (
                        <p>
                          <span className="font-medium text-ais-on-surface dark:text-gray-200">
                            Score:
                          </span>{" "}
                          <span className="text-ais-on-surface-variant dark:text-gray-300">
                            {result.score}/{result.maxPoints} points
                          </span>
                        </p>
                      )}
                      <p>
                        <span className="font-medium text-primary dark:text-primary-light">
                          Expected answer:
                        </span>{" "}
                        <span className="text-ais-on-surface-variant dark:text-gray-300">
                          {question.correctAnswer || "See module content for guidance."}
                        </span>
                      </p>
                      {(result?.feedback || question.explanation) && (
                        <p className="text-xs text-ais-on-surface-variant dark:text-gray-400 italic border-l-2 border-primary/30 pl-3 mt-2">
                          {result?.feedback || question.explanation}
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={handleRetake}
            disabled={isEvaluating}
            className="px-6 py-2 rounded-lg border border-ais-card-border dark:border-gray-700 text-ais-on-surface dark:text-gray-300 hover:bg-ais-surface-container-low dark:hover:bg-gray-700 transition-colors font-medium text-sm flex items-center gap-2 disabled:opacity-50"
          >
            <RotateCcw className="w-4 h-4" />
            Retake Part A
          </button>

          {!answerKeysRevealed ? (
            <button
              onClick={() => setAnswerKeysRevealed(true)}
              disabled={isEvaluating}
              className="px-8 py-2 rounded-lg bg-btn-primary text-btn-primary-foreground hover:bg-btn-primary/90 transition-colors font-semibold text-sm flex items-center gap-2 disabled:opacity-50"
            >
              Check Answer
              <CheckCircle className="w-4 h-4" />
            </button>
          ) : (
            onComplete && (
              <button
                onClick={() => onComplete(scorePercentage)}
                className="px-8 py-2 rounded-lg bg-btn-primary text-btn-primary-foreground hover:bg-btn-primary/90 transition-colors font-semibold text-sm flex items-center gap-2"
              >
                {continueLabel}
                <ArrowRight className="w-4 h-4" />
              </button>
            )
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-6">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-ais-on-surface dark:text-gray-300">
            Question {currentQuestionIndex + 1} of {totalQuestions}
          </span>
          <span className="text-sm text-ais-on-surface-variant dark:text-gray-400">
            {Math.round(((currentQuestionIndex + 1) / totalQuestions) * 100)}%
            Complete
          </span>
        </div>
        <div className="h-2 bg-ais-surface-container-low dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-primary-light transition-all duration-300"
            style={{
              width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%`,
            }}
          />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-ais-card-border dark:border-gray-700 p-8 mb-6">
        <h3 className="text-lg font-semibold text-ais-on-surface dark:text-gray-100 mb-6 leading-relaxed">
          {currentQuestion.question}
        </h3>

        <textarea
          value={currentAnswer}
          onChange={(e) =>
            setAnswers({ ...answers, [currentQuestionIndex]: e.target.value })
          }
          rows={5}
          placeholder="Write your answer here..."
          className="w-full p-4 rounded-lg border border-ais-card-border dark:border-gray-700 bg-ais-surface-container-low/30 dark:bg-gray-900/50 text-ais-on-surface dark:text-gray-100 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-ais-card-border dark:border-gray-700 text-ais-on-surface dark:text-gray-300 hover:bg-ais-surface-container-low dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowLeft className="w-4 h-4" />
          Previous
        </button>

        <div className="flex items-center gap-2">
          {Array.from({ length: totalQuestions }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentQuestionIndex(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentQuestionIndex
                  ? "w-6 bg-primary"
                  : (answers[index] ?? "").trim().length > 0
                    ? "bg-primary/50"
                    : "bg-ais-surface-container-low dark:bg-gray-700"
              }`}
            />
          ))}
        </div>

        <button
          onClick={handleNext}
          disabled={!canProceed}
          className="flex items-center gap-2 px-6 py-2 rounded-lg bg-btn-primary text-btn-primary-foreground hover:bg-btn-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
        >
          {isLastQuestion ? "View Results" : "Next"}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {!canProceed && (
        <p className="text-center text-sm text-ais-on-surface-variant dark:text-gray-400 mt-4">
          {isLastQuestion && !allQuestionsAnswered
            ? "Answer all questions before viewing results"
            : "Write an answer to continue"}
        </p>
      )}
    </div>
  );
};
