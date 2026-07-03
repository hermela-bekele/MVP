'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import 'katex/dist/katex.min.css';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  // Pre-process content to fix common issues
  const processedContent = content
    // Fix LaTeX delimiters - convert single $ to inline math
    .replace(/\$([^\$\n]+?)\$/g, (match, p1) => {
      // Don't process if it's already escaped or part of $$
      if (match.startsWith('$$') || match.endsWith('$$')) return match;
      return `$${p1}$`;
    })
    // Fix caret notation for powers (x^2 -> x²)
    .replace(/\^(\d+)/g, (match, p1) => {
      const superscripts: Record<string, string> = {
        '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
        '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹'
      };
      return superscripts[p1] || match;
    });

  return (
    <div className={`markdown-content prose prose-sm md:prose-base dark:prose-invert max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex, rehypeRaw]}
        components={{
          h1: ({ node, ...props }) => (
            <h1 className="text-2xl font-bold text-ais-on-surface dark:text-gray-100 mb-4 mt-6 pb-2 border-b border-ais-card-border dark:border-gray-700" {...props} />
          ),
          h2: ({ node, ...props }) => (
            <h2 className="text-xl font-semibold text-ais-on-surface dark:text-gray-100 mb-3 mt-5 flex items-center gap-2" {...props} />
          ),
          h3: ({ node, ...props }) => (
            <h3 className="text-lg font-semibold text-ais-primary dark:text-primary mb-2 mt-4" {...props} />
          ),
          h4: ({ node, ...props }) => (
            <h4 className="text-base font-semibold text-ais-on-surface dark:text-gray-200 mb-2 mt-3" {...props} />
          ),
          p: ({ node, ...props }) => (
            <p className="text-sm text-ais-on-surface-variant dark:text-gray-300 leading-relaxed mb-3" {...props} />
          ),
          ul: ({ node, ...props }) => (
            <ul className="list-disc list-inside space-y-2 mb-4 text-sm text-ais-on-surface-variant dark:text-gray-300" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="list-decimal list-inside space-y-2 mb-4 text-sm text-ais-on-surface-variant dark:text-gray-300" {...props} />
          ),
          li: ({ node, children, ...props }) => (
            <li className="ml-2" {...props}>
              <span className="ml-2">{children}</span>
            </li>
          ),
          strong: ({ node, ...props }) => (
            <strong className="font-bold text-ais-on-surface dark:text-gray-100" {...props} />
          ),
          em: ({ node, ...props }) => (
            <em className="italic text-ais-on-surface dark:text-gray-200" {...props} />
          ),
          code: ({ node, inline, className, children, ...props }: any) => {
            if (inline) {
              return (
                <code className="px-1.5 py-0.5 rounded bg-ais-surface-container-low dark:bg-gray-700 text-primary dark:text-primary-light text-xs font-mono" {...props}>
                  {children}
                </code>
              );
            }
            return (
              <code className="block p-4 rounded-lg bg-ais-surface-container-low dark:bg-gray-800 text-ais-on-surface dark:text-gray-300 text-xs font-mono overflow-x-auto border border-ais-card-border dark:border-gray-700 my-3" {...props}>
                {children}
              </code>
            );
          },
          pre: ({ node, ...props }) => (
            <pre className="my-3" {...props} />
          ),
          blockquote: ({ node, ...props }) => (
            <blockquote className="border-l-4 border-primary pl-4 py-2 my-4 bg-primary/5 dark:bg-primary/10 rounded-r-lg" {...props} />
          ),
          a: ({ node, ...props }) => (
            <a className="text-primary hover:text-primary/80 dark:text-primary-light dark:hover:text-primary underline" {...props} />
          ),
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-6">
              <table className="min-w-full border-collapse rounded-lg overflow-hidden shadow-sm" {...props} />
            </div>
          ),
          thead: ({ node, ...props }) => (
            <thead className="bg-primary/10 dark:bg-primary/20" {...props} />
          ),
          th: ({ node, ...props }) => (
            <th className="px-6 py-4 text-left text-sm font-bold text-primary dark:text-primary-light border-b-2 border-primary/20 dark:border-primary/30" {...props} />
          ),
          tbody: ({ node, ...props }) => (
            <tbody className="bg-white dark:bg-gray-800" {...props} />
          ),
          tr: ({ node, ...props }) => (
            <tr className="border-b border-ais-card-border dark:border-gray-700 hover:bg-ais-surface-container-low/50 dark:hover:bg-gray-700/30 transition-colors" {...props} />
          ),
          td: ({ node, ...props }) => (
            <td className="px-6 py-4 text-sm text-ais-on-surface-variant dark:text-gray-300" {...props} />
          ),
          hr: ({ node, ...props }) => (
            <hr className="my-6 border-t border-ais-card-border dark:border-gray-700" {...props} />
          ),
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
};

// Styled wrapper with cards for better visual hierarchy
export const MarkdownCard: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  return (
    <div className={`rounded-xl border border-ais-card-border dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm hover:shadow-md transition-shadow ${className}`}>
      <MarkdownRenderer content={content} />
    </div>
  );
};
