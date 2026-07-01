'use client';

import React from 'react';
import type { AITeachingNotesResult } from '@/lib/ai';
import { MarkdownRenderer } from './MarkdownRenderer';

interface TeachingNotesRendererProps {
  content: AITeachingNotesResult | string;
  className?: string;
}

export const TeachingNotesRenderer: React.FC<TeachingNotesRendererProps> = ({ content, className = '' }) => {
  // If content is a string (markdown), render it directly
  if (typeof content === 'string') {
    return (
      <div className={`teaching-notes-markdown ${className}`}>
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

  // Ensure explanations array exists
  const explanations = content.explanations || [];
  const visualAids = content.visualAids || [];
  const exercises = content.exercises || [];
  
  return (
    <div className={`teaching-notes-content space-y-6 ${className}`}>
      {/* Title */}
      <div className="border-b border-ais-card-border dark:border-gray-700 pb-3">
        <h2 className="text-xl font-bold text-ais-on-surface dark:text-gray-100">{content.title || 'Teaching Notes'}</h2>
        <p className="text-xs text-ais-on-surface-variant dark:text-gray-400 mt-1">Language: {content.language || 'English'}</p>
      </div>

      {/* Introduction */}
      {content.introduction && (
        <div className="rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 dark:from-primary/20 dark:to-accent/20 p-5 border border-primary/20 dark:border-primary/30">
          <h3 className="text-sm font-semibold text-ais-primary dark:text-primary mb-3 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Introduction
          </h3>
          <p className="text-sm text-ais-on-surface dark:text-gray-300 leading-relaxed">{content.introduction}</p>
        </div>
      )}

      {/* Explanations */}
      {explanations.length > 0 && (
        <div className="space-y-4">
          {explanations.map((exp, idx) => {
            // Check if content is markdown
            const isMarkdown = exp.content && (exp.content.includes('#') || exp.content.includes('##') || exp.content.includes('**'));
            
            if (isMarkdown) {
              // Render as markdown
              return (
                <div key={idx} className="rounded-xl border border-ais-card-border dark:border-gray-700 bg-white dark:bg-gray-800 p-5 hover:shadow-md dark:hover:shadow-gray-900/50 transition-all duration-200">
                  <MarkdownRenderer content={exp.content} />
                </div>
              );
            }
            
            // Render as structured content
            return (
              <div key={idx} className="rounded-xl border border-ais-card-border dark:border-gray-700 bg-white dark:bg-gray-800 p-5 hover:shadow-md dark:hover:shadow-gray-900/50 transition-all duration-200">
                <h4 className="text-sm font-bold text-ais-on-surface dark:text-gray-100 mb-3 flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 dark:bg-primary/20 text-primary text-xs font-bold">
                    {idx + 1}
                  </span>
                  {exp.subtitle || `Concept ${idx + 1}`}
                </h4>
                <p className="text-sm text-ais-on-surface-variant dark:text-gray-400 leading-relaxed mb-3 whitespace-pre-wrap">
                  {exp.content || ''}
                </p>
                {exp.examples && exp.examples.length > 0 && (
                  <div className="mt-4 space-y-2 rounded-lg bg-gradient-to-br from-accent/5 to-transparent dark:from-accent/10 p-4 border-l-4 border-accent">
                    <p className="text-xs font-semibold text-accent dark:text-accent-light flex items-center gap-2">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Examples:
                    </p>
                    <ul className="list-disc list-inside space-y-1.5 text-sm text-ais-on-surface-variant dark:text-gray-400">
                      {exp.examples.map((example, i) => (
                        <li key={i} className="leading-relaxed">{example}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Visual Aids */}
      {visualAids.length > 0 && (
        <div className="rounded-xl bg-gradient-to-br from-primary/5 via-transparent to-accent/5 dark:from-primary/10 dark:to-accent/10 p-5 border border-primary/10 dark:border-primary/20">
          <h3 className="text-sm font-semibold text-ais-primary dark:text-primary mb-4 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Visual Aids
          </h3>
          <ul className="space-y-3 text-sm text-ais-on-surface dark:text-gray-300">
            {visualAids.map((aid, i) => (
              <li key={i} className="flex items-start gap-3 group">
                <span className="inline-block w-2 h-2 rounded-full bg-primary mt-2 shrink-0 group-hover:scale-125 transition-transform" />
                <span className="leading-relaxed">{aid}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Exercises */}
      {exercises.length > 0 && (
        <div className="rounded-xl border-l-4 border-l-primary bg-gradient-to-r from-primary/5 to-transparent dark:from-primary/10 p-5">
          <h3 className="text-sm font-semibold text-ais-on-surface dark:text-gray-100 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Practice Exercises
          </h3>
          <ol className="space-y-3 text-sm text-ais-on-surface dark:text-gray-300">
            {exercises.map((exercise, i) => (
              <li key={i} className="flex gap-3 group">
                <span className="font-bold text-primary shrink-0 group-hover:scale-110 transition-transform">{i + 1}.</span>
                <span className="leading-relaxed">{exercise}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
};
