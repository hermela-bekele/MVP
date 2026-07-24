'use client';

import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { preprocessAssessmentMarkdown } from '@/lib/assessmentMarkdown';

interface AssessmentContentRendererProps {
  content: string;
  className?: string;
}

function isFillBlankLine(text: string): boolean {
  return /^_{3,}\s*$/.test(text.trim());
}

function isSkillAreaLine(text: string): boolean {
  return /skill area:/i.test(text);
}

function isSectionHeading(text: string): boolean {
  return /^section [abc]:/i.test(text.trim());
}

function extractText(node: React.ReactNode): string {
  if (typeof node === 'string') return node;
  if (typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractText).join('');
  if (React.isValidElement(node) && node.props?.children) {
    return extractText(node.props.children);
  }
  return '';
}

export const AssessmentContentRenderer: React.FC<AssessmentContentRendererProps> = ({
  content,
  className = '',
}) => {
  const processedContent = useMemo(
    () => preprocessAssessmentMarkdown(content),
    [content],
  );

  return (
    <div
      className={`assessment-markdown prose prose-sm md:prose-base max-w-none dark:prose-invert ${className}`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          h1: ({ ...props }) => (
            <h1
              className="mb-4 mt-2 border-b border-ais-card-border pb-3 text-2xl font-bold text-ais-on-surface"
              {...props}
            />
          ),
          h2: ({ ...props }) => (
            <h2
              className="mb-3 mt-8 flex items-center gap-2 border-b border-ais-card-border/60 pb-2 text-xl font-bold text-ais-on-surface first:mt-0"
              {...props}
            />
          ),
          h3: ({ children, ...props }) => {
            const text = extractText(children);
            const isSection = isSectionHeading(text);
            return (
              <h3
                className={`mb-3 mt-6 text-base font-bold ${
                  isSection
                    ? 'rounded-lg bg-ais-primary/10 px-3 py-2 text-ais-primary'
                    : 'text-ais-on-surface'
                }`}
                {...props}
              >
                {children}
              </h3>
            );
          },
          p: ({ children, ...props }) => {
            const text = extractText(children);
            if (isFillBlankLine(text)) {
              return (
                <div
                  className="my-3 min-h-[2rem] border-b-2 border-dashed border-ais-on-surface-variant/40"
                  aria-label="Answer blank"
                />
              );
            }
            if (isSkillAreaLine(text)) {
              return (
                <p className="mb-1 mt-2" {...props}>
                  <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-900 dark:bg-amber-900/40 dark:text-amber-200">
                    {children}
                  </span>
                </p>
              );
            }
            return (
              <p className="mb-2 text-sm leading-relaxed text-ais-on-surface-variant" {...props}>
                {children}
              </p>
            );
          },
          ol: ({ ...props }) => (
            <ol className="mb-4 list-decimal space-y-4 pl-6 text-sm text-ais-on-surface" {...props} />
          ),
          ul: ({ ...props }) => (
            <ul className="mb-4 list-disc space-y-1.5 pl-5 text-sm text-ais-on-surface-variant" {...props} />
          ),
          li: ({ children, ...props }) => (
            <li className="mb-4 leading-relaxed [&>.katex-display]:my-3 [&_p]:mb-2" {...props}>
              {children}
            </li>
          ),
          strong: ({ children, ...props }) => {
            const text = extractText(children);
            if (isSkillAreaLine(text)) {
              return (
                <span className="mr-2 inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-900 dark:bg-amber-900/40 dark:text-amber-200">
                  {children}
                </span>
              );
            }
            return (
              <strong className="font-semibold text-ais-on-surface" {...props}>
                {children}
              </strong>
            );
          },
          hr: ({ ...props }) => (
            <hr className="my-6 border-t border-ais-card-border" {...props} />
          ),
          blockquote: ({ ...props }) => (
            <blockquote
              className="my-4 rounded-r-lg border-l-4 border-ais-primary bg-ais-primary/5 py-2 pl-4 text-sm"
              {...props}
            />
          ),
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
};
