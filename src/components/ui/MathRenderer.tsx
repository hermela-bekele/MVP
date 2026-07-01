'use client';

import React from 'react';

interface MathRendererProps {
  content: string;
  className?: string;
}

export const MathRenderer: React.FC<MathRendererProps> = ({ content, className = '' }) => {
  // Process the content to handle markdown-style formatting
  const processContent = (text: string) => {
    const lines = text.split('\n');
    const processedLines: React.ReactNode[] = [];
    
    lines.forEach((line, idx) => {
      // Headers (##, ###)
      if (line.startsWith('###')) {
        processedLines.push(
          <h3 key={idx} className="text-lg font-semibold mt-4 mb-2 text-ais-on-surface dark:text-gray-100">
            {line.replace(/^###\s*/, '')}
          </h3>
        );
      } else if (line.startsWith('##')) {
        processedLines.push(
          <h2 key={idx} className="text-xl font-bold mt-6 mb-3 text-ais-on-surface dark:text-gray-100">
            {line.replace(/^##\s*/, '')}
          </h2>
        );
      } else if (line.startsWith('#')) {
        processedLines.push(
          <h1 key={idx} className="text-2xl font-bold mt-6 mb-4 text-ais-on-surface dark:text-gray-100">
            {line.replace(/^#\s*/, '')}
          </h1>
        );
      }
      // Numbered questions (e.g., "1.", "2.", "5.")
      else if (/^\d+\.\s/.test(line)) {
        processedLines.push(
          <p key={idx} className="mt-3 mb-2 font-medium text-ais-on-surface dark:text-gray-200">
            {line}
          </p>
        );
      }
      // Answer options (e.g., "- A)", "- B)")
      else if (/^\s*-\s*[A-D]\)/.test(line)) {
        processedLines.push(
          <p key={idx} className="ml-6 text-sm text-ais-on-surface-variant dark:text-gray-400">
            {line.replace(/^\s*-\s*/, '')}
          </p>
        );
      }
      // Regular list items
      else if (line.startsWith('- ')) {
        processedLines.push(
          <li key={idx} className="ml-4 text-sm text-ais-on-surface dark:text-gray-300">
            {line.replace(/^-\s*/, '')}
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
            {line}
          </p>
        );
      }
    });
    
    return processedLines;
  };

  return (
    <div className={`math-content prose prose-sm max-w-none dark:prose-invert ${className}`}>
      {processContent(content)}
    </div>
  );
};
