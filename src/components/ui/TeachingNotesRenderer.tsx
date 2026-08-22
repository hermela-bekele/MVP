'use client';

import React from 'react';
import type { AITeachingNotesResult } from '@/lib/ai';
import { isTruncatedMarkdownPrefix, stripDuplicatedMarkdownPrefix } from '@/lib/teachingNotesMarkdown';
import { MarkdownRenderer } from './MarkdownRenderer';

interface TeachingNotesRendererProps {
  content: AITeachingNotesResult | string;
  className?: string;
}

function looksLikeMarkdown(s: string | undefined | null): boolean {
  if (!s) return false;
  return /(?:^|\n)\s*#{1,6}\s|^\s*[-*+]\s|\*\*[^*]+\*\*|\$\$|\$[^$\n]+\$|\\\(|\\\[/.test(s);
}

function toMarkdownDocument(content: AITeachingNotesResult): string | null {
  const parts: string[] = [];

  if (content.title?.trim()) {
    parts.push(`# ${content.title.trim()}`);
  }

  const explanations = content.explanations || [];
  const exercises = content.exercises || [];
  const visualAids = content.visualAids || [];

  // Single markdown blob in explanations (common AI / editable-text path)
  if (
    explanations.length === 1 &&
    looksLikeMarkdown(explanations[0]?.content) &&
    exercises.length === 0 &&
    visualAids.length === 0
  ) {
    const body = stripDuplicatedMarkdownPrefix(explanations[0].content);
    const intro = (content.introduction || '').trim();
    // Skip truncated intros that duplicate the start of the body
    if (intro && !isTruncatedMarkdownPrefix(intro, body)) {
      parts.push(intro);
    }
    parts.push(body);
    return parts.join('\n\n');
  }

  if (looksLikeMarkdown(content.introduction) && explanations.length === 0) {
    parts.push(stripDuplicatedMarkdownPrefix(content.introduction!));
    return parts.join('\n\n');
  }

  return null;
}

export const TeachingNotesRenderer: React.FC<TeachingNotesRendererProps> = ({
  content,
  className = '',
}) => {
  if (typeof content === 'string') {
    return (
      <div className={`teaching-notes-markdown ${className}`}>
        <MarkdownRenderer
          content={content}
          className="prose-headings:mt-5 prose-headings:mb-2 prose-h2:text-base prose-h3:text-sm prose-p:my-2 prose-li:my-0.5 max-w-none"
        />
      </div>
    );
  }

  if (!content) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
        <p className="text-sm text-red-600 dark:text-red-400">No content to display</p>
      </div>
    );
  }

  const asMarkdown = toMarkdownDocument(content);
  if (asMarkdown) {
    return (
      <div className={`teaching-notes-markdown ${className}`}>
        <MarkdownRenderer
          content={asMarkdown}
          className="prose-headings:mt-5 prose-headings:mb-2 prose-h2:text-base prose-h3:text-sm prose-p:my-2 prose-li:my-0.5 max-w-none"
        />
      </div>
    );
  }

  const explanations = content.explanations || [];
  const visualAids = content.visualAids || [];
  const exercises = content.exercises || [];

  return (
    <div className={`teaching-notes-content space-y-6 ${className}`}>
      <div className="border-b border-border pb-3 dark:border-gray-700">
        <h2 className="text-xl font-bold text-foreground dark:text-gray-100">
          {content.title || 'Teaching Notes'}
        </h2>
        <p className="mt-1 text-xs text-muted-foreground dark:text-gray-400">
          Language: {content.language || 'English'}
        </p>
      </div>

      {content.introduction && (
        <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/10 to-accent/10 p-5 dark:border-primary/30 dark:from-primary/20 dark:to-accent/20">
          <h3 className="mb-3 text-sm font-semibold text-primary">Introduction</h3>
          <MarkdownRenderer
            content={content.introduction}
            className="prose-p:my-1 prose-sm max-w-none"
          />
        </div>
      )}

      {explanations.length > 0 && (
        <div className="space-y-4">
          {explanations.map((exp, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-border bg-white p-5 dark:border-gray-700 dark:bg-gray-800"
            >
              {exp.subtitle && !looksLikeMarkdown(exp.content) && (
                <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {idx + 1}
                  </span>
                  {exp.subtitle}
                </h4>
              )}
              <MarkdownRenderer
                content={exp.content || ''}
                className="prose-headings:mt-4 prose-headings:mb-2 prose-h2:text-base prose-h3:text-sm prose-p:my-2 prose-li:my-0.5 max-w-none"
              />
              {exp.examples && exp.examples.length > 0 && (
                <div className="mt-4 space-y-2 rounded-lg border-l-4 border-accent bg-gradient-to-br from-accent/5 to-transparent p-4">
                  <p className="text-xs font-semibold text-accent">Examples</p>
                  <ul className="space-y-2">
                    {exp.examples.map((example, i) => (
                      <li key={i}>
                        <MarkdownRenderer
                          content={example}
                          className="prose-p:my-0 prose-sm max-w-none"
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {visualAids.length > 0 && (
        <div className="rounded-xl border border-primary/10 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 p-5">
          <h3 className="mb-4 text-sm font-semibold text-primary">Visual Aids</h3>
          <ul className="space-y-3">
            {visualAids.map((aid, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-2 inline-block h-2 w-2 shrink-0 rounded-full bg-primary" />
                <div className="min-w-0 flex-1">
                  <MarkdownRenderer content={aid} className="prose-p:my-0 prose-sm max-w-none" />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {exercises.length > 0 && (
        <div className="rounded-xl border-l-4 border-l-primary bg-gradient-to-r from-primary/5 to-transparent p-5">
          <h3 className="mb-4 text-sm font-semibold text-foreground">Practice Exercises</h3>
          <ol className="space-y-3">
            {exercises.map((exercise, i) => (
              <li key={i} className="flex gap-3">
                <span className="shrink-0 font-bold text-primary">{i + 1}.</span>
                <div className="min-w-0 flex-1">
                  <MarkdownRenderer
                    content={exercise}
                    className="prose-p:my-0 prose-sm max-w-none"
                  />
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
};
