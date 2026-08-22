'use client';

import React, { useMemo, useState } from 'react';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { ModuleAssessment } from '@/lib/trainingModules';
import { AssessmentQuiz } from '@/components/dashboard/teacher/AssessmentQuiz';
import { ShortAnswerQuiz } from '@/components/dashboard/teacher/ShortAnswerQuiz';

type AssessmentPhase = 'short-answer' | 'multiple-choice' | 'reflection';

interface ModuleAssessmentPanelProps {
  questions: ModuleAssessment[];
  passingScore: number;
  moduleTitle: string;
  assessmentContent?: string;
  moduleContent?: string;
  onComplete?: (score: number, passed: boolean) => void;
}

function parseReflectionPrompts(content: string): string[] {
  const lines = content.split('\n');
  const prompts: string[] = [];
  let inSection = false;

  for (const line of lines) {
    if (line.startsWith('## Reflection After Assessment')) {
      inSection = true;
      continue;
    }
    if (inSection && line.startsWith('## ')) break;
    if (inSection) {
      const match = line.match(/^[-*]\s+(.+)/);
      if (match) prompts.push(match[1]);
    }
  }

  return prompts;
}

export const ModuleAssessmentPanel: React.FC<ModuleAssessmentPanelProps> = ({
  questions,
  passingScore,
  moduleTitle,
  assessmentContent,
  moduleContent = '',
  onComplete,
}) => {
  const shortAnswerQuestions = useMemo(
    () => questions.filter((q) => q.type === 'short-answer'),
    [questions],
  );
  const multipleChoiceQuestions = useMemo(
    () => questions.filter((q) => q.type === 'multiple-choice'),
    [questions],
  );

  const initialPhase: AssessmentPhase =
    shortAnswerQuestions.length > 0
      ? 'short-answer'
      : multipleChoiceQuestions.length > 0
        ? 'multiple-choice'
        : 'reflection';

  const [phase, setPhase] = useState<AssessmentPhase>(initialPhase);
  const [shortAnswerScore, setShortAnswerScore] = useState<number | null>(null);
  const [multipleChoiceScore, setMultipleChoiceScore] = useState<number | null>(null);
  const [reflectionAnswers, setReflectionAnswers] = useState<Record<number, string>>({});
  const [reflectionSubmitted, setReflectionSubmitted] = useState(false);

  const reflectionPrompts = useMemo(() => {
    if (!assessmentContent) return [];
    const marker = '## Reflection After Assessment';
    const index = assessmentContent.indexOf(marker);
    if (index === -1) return [];
    return parseReflectionPrompts(assessmentContent.slice(index));
  }, [assessmentContent]);

  const hasReflection = reflectionPrompts.length > 0;

  const computeCombinedScore = (mcScore: number) => {
    if (shortAnswerScore !== null && multipleChoiceQuestions.length > 0) {
      return Math.round((shortAnswerScore + mcScore) / 2);
    }
    if (shortAnswerScore !== null) return shortAnswerScore;
    return mcScore;
  };

  const handleReflectionSubmit = () => {
    setReflectionSubmitted(true);
    const finalScore =
      multipleChoiceScore !== null
        ? computeCombinedScore(multipleChoiceScore)
        : shortAnswerScore ?? 0;
    const passed = finalScore >= passingScore;
    onComplete?.(finalScore, passed);
  };

  const allReflectionAnswered = reflectionPrompts.every(
    (_, index) => (reflectionAnswers[index] ?? '').trim().length > 0,
  );

  if (phase === 'short-answer') {
    return (
      <ShortAnswerQuiz
        questions={shortAnswerQuestions}
        sectionTitle="Part A: Short Answer Questions"
        moduleContent={moduleContent}
        continueLabel={
          multipleChoiceQuestions.length > 0
            ? 'Continue to Part B'
            : hasReflection
              ? 'Continue to Reflection'
              : 'Finish Assessment'
        }
        onComplete={(score) => {
          setShortAnswerScore(score);
          if (multipleChoiceQuestions.length > 0) {
            setPhase('multiple-choice');
          } else if (hasReflection) {
            setPhase('reflection');
          } else {
            onComplete?.(score, score >= passingScore);
          }
        }}
      />
    );
  }

  if (phase === 'multiple-choice') {
    return (
      <div className="space-y-6">
        {shortAnswerQuestions.length > 0 && (
          <div className="max-w-3xl mx-auto px-6">
            <div className="p-4 rounded-lg bg-primary/5 dark:bg-primary/10 border border-primary/20 text-sm text-muted-foreground dark:text-gray-300">
              Part A complete
              {shortAnswerScore !== null && ` — Score: ${shortAnswerScore}%`}.
              Continue with Part B below.
            </div>
          </div>
        )}
        <AssessmentQuiz
          questions={multipleChoiceQuestions}
          passingScore={passingScore}
          moduleTitle={
            shortAnswerQuestions.length > 0
              ? `${moduleTitle} — Part B`
              : moduleTitle
          }
          continueLabel={hasReflection ? 'Continue to Reflection' : 'Finish Assessment'}
          onComplete={(score) => {
            setMultipleChoiceScore(score);
            if (hasReflection) {
              setPhase('reflection');
            } else {
              const finalScore = computeCombinedScore(score);
              onComplete?.(finalScore, finalScore >= passingScore);
            }
          }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-6 space-y-6">
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold text-foreground dark:text-gray-100 mb-2">
          Reflection After Assessment
        </h2>
        <p className="text-sm text-muted-foreground dark:text-gray-400">
          Take a moment to reflect on what you learned. Write your responses below.
        </p>
      </div>

      <div className="space-y-5">
        {reflectionPrompts.map((prompt, index) => (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 rounded-xl border border-border dark:border-gray-700 p-5"
          >
            <label className="block text-sm font-medium text-foreground dark:text-gray-100 mb-3">
              {index + 1}. {prompt}
            </label>
            <textarea
              value={reflectionAnswers[index] ?? ''}
              onChange={(e) =>
                setReflectionAnswers({ ...reflectionAnswers, [index]: e.target.value })
              }
              rows={3}
              disabled={reflectionSubmitted}
              placeholder="Write your reflection here..."
              className="w-full p-3 rounded-lg border border-border dark:border-gray-700 bg-muted/30 dark:bg-gray-900/50 text-foreground dark:text-gray-100 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-60"
            />
          </div>
        ))}
      </div>

      {reflectionSubmitted ? (
        <div className="text-center p-6 rounded-xl bg-primary/5 dark:bg-primary/10 border border-primary/20">
          <CheckCircle className="w-10 h-10 text-primary dark:text-primary-light mx-auto mb-3" />
          <p className="text-lg font-semibold text-foreground dark:text-gray-100 mb-1">
            Assessment Complete
          </p>
          <p className="text-sm text-muted-foreground dark:text-gray-400">
            Your reflections have been submitted. Thank you for completing this assessment.
          </p>
        </div>
      ) : (
        <div className="flex justify-center">
          <button
            onClick={handleReflectionSubmit}
            disabled={!allReflectionAnswered}
            className="px-8 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-semibold text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Submit Reflection
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {!reflectionSubmitted && !allReflectionAnswered && (
        <p className="text-center text-sm text-muted-foreground dark:text-gray-400">
          Answer all reflection prompts before submitting
        </p>
      )}
    </div>
  );
};
