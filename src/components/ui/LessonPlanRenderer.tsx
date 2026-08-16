'use client';

import React from 'react';
import type { AILessonPlanResult } from '@/lib/ai';
import { MarkdownRenderer } from './MarkdownRenderer';

interface LessonPlanRendererProps {
  content: AILessonPlanResult | string;
  className?: string;
}

export const LessonPlanRenderer: React.FC<LessonPlanRendererProps> = ({ content, className = '' }) => {
  // If content is a string (markdown), render it directly
  if (typeof content === 'string') {
    return (
      <div className={`lesson-plan-markdown ${className}`}>
        <MarkdownRenderer content={content} />
      </div>
    );
  }

  // Validate content structure for legacy format
  if (!content) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <p className="text-sm text-red-600 dark:text-red-400">No content to display</p>
      </div>
    );
  }
  
  return (
    <div className={`lesson-plan-content space-y-6 ${className}`}>
      {/* Title */}
      <div className="border-b border-ais-card-border dark:border-gray-700 pb-3">
        <h2 className="text-xl font-bold text-title dark:text-gray-100">{content.title}</h2>
      </div>

      {/* Objectives */}
      <div className="rounded-xl bg-gradient-to-br from-primary/5 via-accent/5 to-transparent dark:from-primary/10 dark:to-accent/10 p-5 border border-primary/10 dark:border-primary/20">
        <h3 className="text-sm font-semibold text-ais-primary dark:text-primary mb-4 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Learning Objectives
        </h3>
        <ul className="space-y-3 text-sm text-ais-on-surface dark:text-gray-300">
          {content.objectives.map((obj, i) => (
            <li key={i} className="flex items-start gap-3 group">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-primary to-accent text-white text-xs font-bold shrink-0 mt-0.5 group-hover:scale-110 transition-transform">
                {i + 1}
              </span>
              <span className="leading-relaxed">{obj}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Session Activities */}
      {content.activities && content.activities.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-base font-semibold text-title dark:text-gray-100 flex items-center gap-2">
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Session Activities
          </h3>
          {content.activities.map((activity, idx) => {
            // Check if activity is markdown
            const isMarkdown = activity.activity && (activity.activity.includes('#') || activity.activity.includes('##'));
            
            if (isMarkdown) {
              return (
                <div key={idx} className="rounded-xl border border-ais-card-border dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
                  <MarkdownRenderer content={activity.activity} />
                </div>
              );
            }
            
            return (
              <div key={idx} className="rounded-xl border border-ais-card-border dark:border-gray-700 bg-white dark:bg-gray-800 p-5 hover:shadow-lg dark:hover:shadow-gray-900/50 hover:border-primary/30 dark:hover:border-primary/40 transition-all duration-200 group">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-ais-primary dark:text-primary flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-primary/10 dark:bg-primary/20 text-primary text-xs font-bold group-hover:scale-110 transition-transform">
                      {activity.session}
                    </span>
                    Session {activity.session}
                  </h4>
                  <span className="text-xs font-medium text-ais-on-surface-variant dark:text-gray-400 bg-gradient-to-r from-accent/10 to-transparent dark:from-accent/20 px-3 py-1.5 rounded-full border border-accent/20 dark:border-accent/30">
                    {activity.duration}
                  </span>
                </div>
                <p className="text-sm text-ais-on-surface-variant dark:text-gray-400 leading-relaxed">
                  {activity.activity}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Assessments */}
      <div className="rounded-xl border-l-4 border-l-accent bg-gradient-to-r from-accent/5 to-transparent dark:from-accent/10 p-5">
        <h3 className="text-sm font-semibold text-title dark:text-gray-100 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          Assessment Methods
        </h3>
        <ul className="space-y-3 text-sm text-ais-on-surface dark:text-gray-300">
          {content.assessments.map((assessment, i) => (
            <li key={i} className="flex items-start gap-3 group">
              <svg className="w-5 h-5 text-accent shrink-0 mt-0.5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span className="leading-relaxed">{assessment}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Homework */}
      {content.homework && (
        <div className="rounded-xl bg-white dark:bg-gray-800 border border-ais-card-border dark:border-gray-700 p-5 hover:shadow-md dark:hover:shadow-gray-900/50 transition-shadow">
          <h3 className="text-sm font-semibold text-title dark:text-gray-100 mb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Homework Assignment
          </h3>
          <p className="text-sm text-ais-on-surface-variant dark:text-gray-400 leading-relaxed">
            {content.homework}
          </p>
        </div>
      )}
    </div>
  );
};
