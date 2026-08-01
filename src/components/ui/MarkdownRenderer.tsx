'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import 'katex/dist/katex.min.css';
import { aisCard } from '@/components/dashboard/teacher/aisStyles';

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
    <div className={`markdown-content prose prose-sm md:prose-base max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex, rehypeRaw]}
        components={{
          h1: ({ node: _node, ...props }) => (
            <h1 className="text-2xl font-bold text-ais-on-surface mb-4 mt-6 pb-2 border-b border-ais-card-border" {...props} />
          ),
          h2: ({ node: _node, ...props }) => (
            <h2 className="text-xl font-semibold text-ais-on-surface mb-3 mt-5 flex items-center gap-2" {...props} />
          ),
          h3: ({ node: _node, ...props }) => (
            <h3 className="text-lg font-semibold text-ais-primary mb-2 mt-4" {...props} />
          ),
          h4: ({ node: _node, ...props }) => (
            <h4 className="text-base font-semibold text-ais-on-surface mb-2 mt-3" {...props} />
          ),
          p: ({ node: _node, ...props }) => (
            <p className="text-sm text-ais-on-surface-variant leading-relaxed mb-3" {...props} />
          ),
          ul: ({ node: _node, ...props }) => (
            <ul className="list-disc list-inside space-y-2 mb-4 text-sm text-ais-on-surface-variant" {...props} />
          ),
          ol: ({ node: _node, ...props }) => (
            <ol className="list-decimal list-inside space-y-2 mb-4 text-sm text-ais-on-surface-variant" {...props} />
          ),
          li: ({ node: _node, children, ...props }) => (
            <li className="ml-2" {...props}>
              <span className="ml-2">{children}</span>
            </li>
          ),
          strong: ({ node: _node, ...props }) => (
            <strong className="font-bold text-ais-on-surface" {...props} />
          ),
          em: ({ node: _node, ...props }) => (
            <em className="italic text-ais-on-surface" {...props} />
          ),
          code: ({ node: _node, inline, className: _className, children, ...props }: any) => {
            if (inline) {
              return (
                <code className="px-1.5 py-0.5 rounded bg-ais-surface-container-low text-ais-primary text-xs font-mono" {...props}>
                  {children}
                </code>
              );
            }
            return (
              <code className="block p-4 rounded-lg bg-ais-surface-container-low text-ais-on-surface text-xs font-mono overflow-x-auto border border-ais-card-border my-3" {...props}>
                {children}
              </code>
            );
          },
          pre: ({ node: _node, ...props }) => (
            <pre className="my-3" {...props} />
          ),
          blockquote: ({ node: _node, ...props }) => (
            <blockquote className="border-l-4 border-ais-primary pl-4 py-2 my-4 bg-ais-primary/5 rounded-r-lg" {...props} />
          ),
          a: ({ node: _node, ...props }) => (
            <a className="text-ais-primary hover:text-ais-primary/80 underline" {...props} />
          ),
          table: ({ node: _node, ...props }) => (
            <div className="overflow-x-auto my-6">
              <table className="min-w-full border-collapse rounded-lg overflow-hidden shadow-sm" {...props} />
            </div>
          ),
          thead: ({ node: _node, ...props }) => (
            <thead className="bg-ais-primary/10" {...props} />
          ),
          th: ({ node: _node, ...props }) => (
            <th className="px-6 py-4 text-left text-sm font-bold text-ais-primary border-b-2 border-ais-primary/20" {...props} />
          ),
          tbody: ({ node: _node, ...props }) => (
            <tbody className="bg-white" {...props} />
          ),
          tr: ({ node: _node, ...props }) => (
            <tr className="border-b border-ais-card-border hover:bg-ais-surface-container-low/50 transition-colors" {...props} />
          ),
          td: ({ node: _node, ...props }) => (
            <td className="px-6 py-4 text-sm text-ais-on-surface-variant" {...props} />
          ),
          hr: ({ node: _node, ...props }) => (
            <hr className="my-6 border-t border-ais-card-border" {...props} />
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
    <div className={`${aisCard} p-6 hover:shadow-md transition-shadow ${className}`}>
      <MarkdownRenderer content={content} />
    </div>
  );
};
