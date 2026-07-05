'use client';

import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import KaTeX to avoid SSR issues
const InlineMath = dynamic(
  () => import('react-katex').then(mod => mod.InlineMath),
  { ssr: false }
);
const BlockMath = dynamic(
  () => import('react-katex').then(mod => mod.BlockMath),
  { ssr: false }
);

interface MathRendererProps {
  content: string;
  className?: string;
}

export const MathRenderer: React.FC<MathRendererProps> = ({ content, className = '' }) => {
  
  const renderLineWithMath = (line: string, key: number): React.ReactNode => {
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    
    // Find all math expressions (both $$ and $)
    const mathRegex = /\$\$([^\$]+)\$\$|\$([^\$\n]+)\$/g;
    let match;
    
    while ((match = mathRegex.exec(line)) !== null) {
      // Add text before math
      if (match.index > lastIndex) {
        parts.push(line.substring(lastIndex, match.index));
      }
      
      // Add math (display or inline)
      const mathContent = match[1] || match[2];
      const isDisplay = match[0].startsWith('$$');
      
      try {
        parts.push(
          isDisplay ? (
            <BlockMath key={`math-${key}-${match.index}`} math={mathContent} />
          ) : (
            <InlineMath key={`math-${key}-${match.index}`} math={mathContent} />
          )
        );
      } catch (e) {
        // Fallback if LaTeX rendering fails
        console.error('LaTeX render error:', e);
        parts.push(match[0]);
      }
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (lastIndex < line.length) {
      parts.push(line.substring(lastIndex));
    }
    
    return parts.length > 0 ? parts : line;
  };

  const processedContent = useMemo(() => {
    const lines = content.split('\n');
    const processedLines: React.ReactNode[] = [];
    
    lines.forEach((line, idx) => {
      const content = renderLineWithMath(line, idx);
      
      // Headers
      if (line.startsWith('###')) {
        processedLines.push(
          <h3 key={idx} className="text-lg font-semibold mt-4 mb-2 text-ais-on-surface dark:text-gray-100">
            {content}
          </h3>
        );
      } else if (line.startsWith('##')) {
        processedLines.push(
          <h2 key={idx} className="text-xl font-bold mt-6 mb-3 text-ais-on-surface dark:text-gray-100">
            {content}
          </h2>
        );
      } else if (line.startsWith('#')) {
        processedLines.push(
          <h1 key={idx} className="text-2xl font-bold mt-6 mb-4 text-ais-on-surface dark:text-gray-100">
            {content}
          </h1>
        );
      }
      // Question patterns (Q1:, Q[1]:, etc.)
      else if (/^Q\[?\d+\]?:/i.test(line)) {
        processedLines.push(
          <p key={idx} className="mt-4 mb-2 font-semibold text-base text-ais-on-surface dark:text-gray-100">
            {content}
          </p>
        );
      }
      // Answer options (A), B), C), D))
      else if (/^[A-D]\)/.test(line.trim())) {
        processedLines.push(
          <p key={idx} className="ml-6 mb-1 text-sm text-ais-on-surface-variant dark:text-gray-300">
            {content}
          </p>
        );
      }
      // Correct answer marker (✓ Correct:)
      else if (line.includes('✓ Correct')) {
        processedLines.push(
          <p key={idx} className="ml-6 mt-2 mb-3 text-sm font-medium text-green-600 dark:text-green-400">
            {content}
          </p>
        );
      }
      // Numbered questions
      else if (/^\d+\.\s/.test(line)) {
        processedLines.push(
          <p key={idx} className="mt-3 mb-2 font-medium text-ais-on-surface dark:text-gray-200">
            {content}
          </p>
        );
      }
      // Answer options with dash
      else if (/^\s*-\s*[A-D]\)/.test(line)) {
        processedLines.push(
          <p key={idx} className="ml-6 text-sm text-ais-on-surface-variant dark:text-gray-400">
            {content}
          </p>
        );
      }
      // Regular list items
      else if (line.startsWith('- ')) {
        processedLines.push(
          <li key={idx} className="ml-4 text-sm text-ais-on-surface dark:text-gray-300">
            {content}
          </li>
        );
      }
      // Horizontal rules
      else if (line.trim() === '---') {
        processedLines.push(
          <hr key={idx} className="my-4 border-ais-card-border dark:border-gray-700" />
        );
      }
      // Bold text (**text**)
      else if (line.includes('**')) {
        const parts = line.split('**');
        const formatted = parts.map((part, i) =>
          i % 2 === 1 ? <strong key={i} className="dark:text-gray-100">{part}</strong> : part
        );
        processedLines.push(
          <p key={idx} className="mb-2 text-sm text-ais-on-surface dark:text-gray-300">
            {formatted}
          </p>
        );
      }
      // Empty lines
      else if (line.trim() === '') {
        processedLines.push(<br key={idx} />);
      }
      // Regular paragraphs
      else {
        processedLines.push(
          <p key={idx} className="mb-2 text-sm text-ais-on-surface dark:text-gray-300">
            {content}
          </p>
        );
      }
    });
    
    return processedLines;
  }, [content]);

  return (
    <div className={`math-content prose prose-sm max-w-none dark:prose-invert ${className}`}>
      {processedContent}
    </div>
  );
};
