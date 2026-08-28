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
  /** Optional chip shown above the document (e.g. Mid Exam · Multiple Choice). */
  categoryLabel?: string;
}

function isFillBlankLine(text: string): boolean {
  return /^_{3,}\s*$/.test(text.trim()) || /_{5,}/.test(text);
}

function isSkillAreaLine(text: string): boolean {
  return /skill area:/i.test(text);
}

function isMetaBadgeLine(text: string): boolean {
  return /^(assessment type|question format|number of questions|scope):/i.test(
    text.trim(),
  );
}

function isSectionHeading(text: string): boolean {
  return (
    /^section [abc]:/i.test(text.trim()) ||
    /^for\s+(multiple choice|true\/false|fill in the blank|matching|writing)/i.test(
      text.trim(),
    )
  );
}

function isAnswerKeyHeading(text: string): boolean {
  return /^(answer key|marking guide|combined note)/i.test(text.trim());
}

function isQuestionLead(text: string): boolean {
  return /^q(?:uestion)?\s*\d+\s*:/i.test(text.trim());
}

function isOptionLine(text: string): boolean {
  return /^[A-D]\)\s+/.test(text.trim());
}

function isCorrectLine(text: string): boolean {
  return /^[✓✔]\s*(correct|expected|marking|sample)/i.test(text.trim()) ||
    /^correct\s*(answer|matches)?:/i.test(text.trim());
}

function extractText(node: React.ReactNode): string {
  if (typeof node === 'string') return node;
  if (typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractText).join('');
  if (React.isValidElement<{ children?: React.ReactNode }>(node) && node.props?.children) {
    return extractText(node.props.children);
  }
  return '';
}

export const AssessmentContentRenderer: React.FC<AssessmentContentRendererProps> = ({
  content,
  className = '',
  categoryLabel,
}) => {
  const processedContent = useMemo(
    () => preprocessAssessmentMarkdown(content),
    [content],
  );

  return (
    <div
      className={`assessment-markdown prose prose-sm md:prose-base max-w-none dark:prose-invert ${className}`}
    >
      {categoryLabel ? (
        <div className="mb-4 flex flex-wrap gap-2">
          {categoryLabel.split('·').map((part) => (
            <span
              key={part}
              className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary"
            >
              {part.trim()}
            </span>
          ))}
        </div>
      ) : null}
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          h1: ({ ...props }) => (
            <h1
              className="mb-4 mt-2 border-b border-border pb-3 text-2xl font-bold text-foreground"
              {...props}
            />
          ),
          h2: ({ children, ...props }) => {
            const text = extractText(children);
            const answerKey = isAnswerKeyHeading(text);
            return (
              <h2
                className={`mb-3 mt-8 flex items-center gap-2 border-b pb-2 text-xl font-bold first:mt-0 ${
                  answerKey
                    ? 'border-emerald-500/40 text-emerald-800 dark:text-emerald-300'
                    : 'border-border/60 text-foreground'
                }`}
                {...props}
              >
                {children}
              </h2>
            );
          },
          h3: ({ children, ...props }) => {
            const text = extractText(children);
            const isSection = isSectionHeading(text);
            return (
              <h3
                className={`mb-3 mt-6 text-base font-bold ${
                  isSection
                    ? 'rounded-lg bg-primary/10 px-3 py-2 text-primary'
                    : 'text-foreground'
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
                  className="my-3 min-h-[2rem] border-b-2 border-dashed border-muted-foreground/40"
                  aria-label="Answer blank"
                />
              );
            }
            if (isSkillAreaLine(text) || isMetaBadgeLine(text)) {
              return (
                <p className="mb-1 mt-2" {...props}>
                  <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-900 dark:bg-amber-900/40 dark:text-amber-200">
                    {children}
                  </span>
                </p>
              );
            }
            if (isQuestionLead(text)) {
              return (
                <p
                  className="mb-2 mt-5 rounded-lg border border-border/70 bg-muted/40 px-3 py-2.5 text-sm font-medium leading-relaxed text-foreground"
                  {...props}
                >
                  {children}
                </p>
              );
            }
            if (isOptionLine(text)) {
              return (
                <p
                  className="mb-1 ml-3 rounded-md border border-transparent px-2 py-1 text-sm text-muted-foreground hover:border-border/50"
                  {...props}
                >
                  {children}
                </p>
              );
            }
            if (isCorrectLine(text)) {
              return (
                <p
                  className="mb-3 ml-1 rounded-md border border-emerald-500/20 bg-emerald-50/80 px-2.5 py-1.5 text-sm text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200"
                  {...props}
                >
                  {children}
                </p>
              );
            }
            return (
              <p className="mb-2 text-sm leading-relaxed text-muted-foreground" {...props}>
                {children}
              </p>
            );
          },
          ol: ({ ...props }) => (
            <ol className="mb-4 list-decimal space-y-4 pl-6 text-sm text-foreground" {...props} />
          ),
          ul: ({ ...props }) => (
            <ul className="mb-4 list-disc space-y-1.5 pl-5 text-sm text-muted-foreground" {...props} />
          ),
          li: ({ children, ...props }) => (
            <li className="mb-4 leading-relaxed [&>.katex-display]:my-3 [&_p]:mb-2" {...props}>
              {children}
            </li>
          ),
          strong: ({ children, ...props }) => {
            const text = extractText(children);
            if (isSkillAreaLine(text) || isMetaBadgeLine(text)) {
              return (
                <span className="mr-2 inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-900 dark:bg-amber-900/40 dark:text-amber-200">
                  {children}
                </span>
              );
            }
            if (/^q(?:uestion)?\s*\d+$/i.test(text.trim())) {
              return (
                <strong className="mr-1 font-bold text-primary" {...props}>
                  {children}
                </strong>
              );
            }
            return (
              <strong className="font-semibold text-foreground" {...props}>
                {children}
              </strong>
            );
          },
          hr: ({ ...props }) => (
            <hr className="my-6 border-t border-border" {...props} />
          ),
          blockquote: ({ ...props }) => (
            <blockquote
              className="my-4 rounded-r-lg border-l-4 border-primary bg-primary/5 py-2 pl-4 text-sm"
              {...props}
            />
          ),
          table: ({ ...props }) => (
            <div className="my-2 overflow-x-auto">
              <table
                className="mcq-choice-grid mb-3 w-full border-collapse text-sm"
                {...props}
              />
            </div>
          ),
          thead: ({ ...props }) => <thead {...props} />,
          tbody: ({ ...props }) => <tbody {...props} />,
          tr: ({ ...props }) => <tr className="align-top" {...props} />,
          th: ({ children, ...props }) => {
            const text = extractText(children).trim();
            const isOpt = /^[A-D]\)/.test(text);
            return (
              <th
                className={`w-1/2 px-1 py-1.5 text-left font-normal ${
                  isOpt
                    ? 'rounded-md border border-border/60 bg-muted/50 px-2.5 py-2 text-sm text-muted-foreground'
                    : 'text-muted-foreground'
                }`}
                {...props}
              >
                {children}
              </th>
            );
          },
          td: ({ children, ...props }) => {
            const text = extractText(children).trim();
            const isOpt = /^[A-D]\)/.test(text);
            return (
              <td
                className={`w-1/2 px-1 py-1.5 ${
                  isOpt
                    ? 'rounded-md border border-border/60 bg-muted/50 px-2.5 py-2 text-muted-foreground'
                    : 'text-muted-foreground'
                }`}
                {...props}
              >
                {children}
              </td>
            );
          },
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
};
