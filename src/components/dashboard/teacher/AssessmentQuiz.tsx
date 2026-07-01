'use client';

import React, { useState } from 'react';
import { CheckCircle, XCircle, ArrowRight, ArrowLeft, Trophy, RotateCcw } from 'lucide-react';
import { ModuleAssessment } from '@/lib/trainingModules';

interface AssessmentQuizProps {
  questions: ModuleAssessment[];
  passingScore: number;
  moduleTitle: string;
  onComplete?: (score: number, passed: boolean) => void;
}

export const AssessmentQuiz: React.FC<AssessmentQuizProps> = ({
  questions,
  passingScore,
  moduleTitle,
  onComplete,
}) => {
  // Filter out non-multiple-choice questions
  const multipleChoiceQuestions = questions.filter(q => q.type === 'multiple-choice');
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);

  const currentQuestion = multipleChoiceQuestions[currentQuestionIndex];
  const totalQuestions = multipleChoiceQuestions.length;
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;
  const hasAnswered = selectedAnswers[currentQuestionIndex] !== undefined;

  const handleSelectAnswer = (answer: string) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [currentQuestionIndex]: answer,
    });
  };

  const handleNext = () => {
    if (isLastQuestion) {
      // Calculate score and show results
      calculateResults();
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const calculateResults = () => {
    setShowResults(true);
    const correctCount = multipleChoiceQuestions.reduce((count, question, index) => {
      return count + (selectedAnswers[index] === question.correctAnswer ? 1 : 0);
    }, 0);
    
    const scorePercentage = Math.round((correctCount / totalQuestions) * 100);
    const passed = scorePercentage >= passingScore;
    
    if (onComplete) {
      onComplete(scorePercentage, passed);
    }
  };

  const handleRetake = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setShowResults(false);
    setQuizStarted(false);
  };

  // Start screen
  if (!quizStarted) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-6">
        <div className="max-w-2xl w-full text-center">
          <div className="mb-6">
            <div className="w-20 h-20 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-10 h-10 text-primary dark:text-primary-light" />
            </div>
            <h2 className="text-2xl font-bold text-ais-on-surface dark:text-gray-100 mb-2">
              {moduleTitle} Assessment
            </h2>
            <p className="text-sm text-ais-on-surface-variant dark:text-gray-400">
              Test your understanding of the module content
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-ais-card-border dark:border-gray-700 p-6 mb-6">
            <div className="grid grid-cols-2 gap-4 text-left">
              <div>
                <p className="text-xs text-ais-on-surface-variant dark:text-gray-400 mb-1">
                  Total Questions
                </p>
                <p className="text-2xl font-bold text-primary dark:text-primary-light">
                  {totalQuestions}
                </p>
              </div>
              <div>
                <p className="text-xs text-ais-on-surface-variant dark:text-gray-400 mb-1">
                  Passing Score
                </p>
                <p className="text-2xl font-bold text-primary dark:text-primary-light">
                  {passingScore}%
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3 mb-8 text-left bg-primary/5 dark:bg-primary/10 rounded-lg p-4">
            <h3 className="font-semibold text-ais-on-surface dark:text-gray-100 mb-2">
              📝 Instructions
            </h3>
            <ul className="space-y-2 text-sm text-ais-on-surface-variant dark:text-gray-300">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <span>Answer all {totalQuestions} multiple-choice questions</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <span>You can navigate back to review your answers</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <span>Your score will be shown at the end</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => setQuizStarted(true)}
            className="px-8 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-semibold text-sm flex items-center gap-2 mx-auto"
          >
            Start Assessment
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // Results screen
  if (showResults) {
    const correctCount = multipleChoiceQuestions.reduce((count, question, index) => {
      return count + (selectedAnswers[index] === question.correctAnswer ? 1 : 0);
    }, 0);
    
    const scorePercentage = Math.round((correctCount / totalQuestions) * 100);
    const passed = scorePercentage >= passingScore;

    return (
      <div className="flex flex-col items-center justify-center py-12 px-6">
        <div className="max-w-2xl w-full text-center">
          <div className="mb-6">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 ${
              passed 
                ? 'bg-primary/10 dark:bg-primary/20' 
                : 'bg-red-100 dark:bg-red-900/30'
            }`}>
              {passed ? (
                <Trophy className="w-12 h-12 text-primary dark:text-primary-light" />
              ) : (
                <XCircle className="w-12 h-12 text-red-600 dark:text-red-400" />
              )}
            </div>
            <h2 className="text-3xl font-bold text-ais-on-surface dark:text-gray-100 mb-2">
              {passed ? 'Congratulations! 🎉' : 'Keep Learning'}
            </h2>
            <p className="text-sm text-ais-on-surface-variant dark:text-gray-400">
              {passed 
                ? 'You have successfully passed the assessment!' 
                : 'You can retake the assessment after reviewing the module content.'}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-ais-card-border dark:border-gray-700 p-8 mb-6">
            <div className="text-center mb-6">
              <p className="text-sm text-ais-on-surface-variant dark:text-gray-400 mb-2">
                Your Score
              </p>
              <div className="text-6xl font-bold mb-2">
                <span className={passed ? 'text-primary dark:text-primary-light' : 'text-red-600 dark:text-red-400'}>
                  {scorePercentage}%
                </span>
              </div>
              <p className="text-lg text-ais-on-surface dark:text-gray-200">
                {correctCount} out of {totalQuestions} correct
              </p>
            </div>

            <div className="h-3 bg-ais-surface-container-low dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 ${
                  passed 
                    ? 'bg-gradient-to-r from-primary to-primary-light' 
                    : 'bg-gradient-to-r from-red-500 to-red-600'
                }`}
                style={{ width: `${scorePercentage}%` }}
              />
            </div>
            
            <p className="text-xs text-ais-on-surface-variant dark:text-gray-400 mt-2">
              Passing score: {passingScore}%
            </p>
          </div>

          {/* Answer Review */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-ais-card-border dark:border-gray-700 p-6 mb-6 text-left">
            <h3 className="font-semibold text-ais-on-surface dark:text-gray-100 mb-4">
              Review Your Answers
            </h3>
            <div className="space-y-3">
              {multipleChoiceQuestions.map((question, index) => {
                const isCorrect = selectedAnswers[index] === question.correctAnswer;
                return (
                  <div 
                    key={question.id}
                    className={`p-3 rounded-lg border ${
                      isCorrect 
                        ? 'border-primary/30 dark:border-primary/30 bg-primary/5 dark:bg-primary/10' 
                        : 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {isCorrect ? (
                        <CheckCircle className="w-5 h-5 text-primary dark:text-primary-light flex-shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p className="text-sm font-medium text-ais-on-surface dark:text-gray-200 mb-1">
                          Question {index + 1}
                        </p>
                        <p className="text-xs text-ais-on-surface-variant dark:text-gray-400">
                          Your answer: <span className="font-semibold">{selectedAnswers[index]}</span>
                          {!isCorrect && (
                            <span className="ml-2">
                              · Correct: <span className="font-semibold text-primary dark:text-primary-light">
                                {question.correctAnswer}
                              </span>
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={handleRetake}
            className="px-8 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-semibold text-sm flex items-center gap-2 mx-auto"
          >
            <RotateCcw className="w-4 h-4" />
            Retake Assessment
          </button>
        </div>
      </div>
    );
  }

  // Quiz question screen
  return (
    <div className="max-w-3xl mx-auto py-8 px-6">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-ais-on-surface dark:text-gray-300">
            Question {currentQuestionIndex + 1} of {totalQuestions}
          </span>
          <span className="text-sm text-ais-on-surface-variant dark:text-gray-400">
            {Math.round(((currentQuestionIndex + 1) / totalQuestions) * 100)}% Complete
          </span>
        </div>
        <div className="h-2 bg-ais-surface-container-low dark:bg-gray-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-primary to-primary-light transition-all duration-300"
            style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-ais-card-border dark:border-gray-700 p-8 mb-6">
        <h3 className="text-lg font-semibold text-ais-on-surface dark:text-gray-100 mb-6 leading-relaxed">
          {currentQuestion.question}
        </h3>

        {/* Options */}
        <div className="space-y-3">
          {currentQuestion.options?.map((option, index) => {
            const isSelected = selectedAnswers[currentQuestionIndex] === option;
            const optionLetter = String.fromCharCode(65 + index); // A, B, C, D

            return (
              <button
                key={index}
                onClick={() => handleSelectAnswer(option)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                  isSelected
                    ? 'border-primary bg-primary/10 dark:bg-primary/20'
                    : 'border-ais-card-border dark:border-gray-700 hover:border-primary/50 hover:bg-ais-surface-container-low/50 dark:hover:bg-gray-700/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0 ${
                    isSelected
                      ? 'bg-primary text-white'
                      : 'bg-ais-surface-container-low dark:bg-gray-700 text-ais-on-surface-variant dark:text-gray-400'
                  }`}>
                    {optionLetter}
                  </div>
                  <span className={`text-sm ${
                    isSelected
                      ? 'text-primary dark:text-primary-light font-medium'
                      : 'text-ais-on-surface-variant dark:text-gray-300'
                  }`}>
                    {option}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation */}
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
                  ? 'w-6 bg-primary'
                  : selectedAnswers[index] !== undefined
                  ? 'bg-primary/50'
                  : 'bg-ais-surface-container-low dark:bg-gray-700'
              }`}
            />
          ))}
        </div>

        <button
          onClick={handleNext}
          disabled={!hasAnswered}
          className="flex items-center gap-2 px-6 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
        >
          {isLastQuestion ? 'Finish' : 'Next'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Helper text */}
      {!hasAnswered && (
        <p className="text-center text-sm text-ais-on-surface-variant dark:text-gray-400 mt-4">
          Select an answer to continue
        </p>
      )}
    </div>
  );
};
