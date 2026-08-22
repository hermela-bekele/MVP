'use client';

import React, { useMemo } from 'react';

interface MathRendererProps {
  content: string;
  className?: string;
}

export const MathRenderer: React.FC<MathRendererProps> = ({ content, className = '' }) => {
  
  const renderLineWithMath = (line: string, key: number): React.ReactNode => {
    // Check if line contains LaTeX
    if (!line.includes('$')) {
      return line;
    }

    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    
    // Find all math expressions (both $$ and $)
    const mathRegex = /\$\$([^\$]+)\$\$|\$([^\$\n]+)\$/g;
    let match;
    let matchIndex = 0;
    
    while ((match = mathRegex.exec(line)) !== null) {
      // Add text before math
      if (match.index > lastIndex) {
        parts.push(line.substring(lastIndex, match.index));
      }
      
      // Add math (display or inline)
      const mathContent = match[1] || match[2];
      const isDisplay = match[0].startsWith('$$');
      const mathKey = `math-${key}-${matchIndex++}`;
      
      // Use dangerouslySetInnerHTML with KaTeX rendering
      // This will be processed by a useEffect hook
      parts.push(
        <span
          key={mathKey}
          className={isDisplay ? 'katex-display-wrapper' : 'katex-inline-wrapper'}
          data-math={mathContent}
          data-display={isDisplay ? 'true' : 'false'}
        >
          {match[0]}
        </span>
      );
      
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
      const lineContent = renderLineWithMath(line, idx);
      
      // Headers
      if (line.startsWith('###')) {
        processedLines.push(
          <h3 key={idx} className="text-lg font-semibold mt-4 mb-2 text-foreground dark:text-gray-100">
            {lineContent}
          </h3>
        );
      } else if (line.startsWith('##')) {
        processedLines.push(
          <h2 key={idx} className="text-xl font-bold mt-6 mb-3 text-foreground dark:text-gray-100">
            {lineContent}
          </h2>
        );
      } else if (line.startsWith('#')) {
        processedLines.push(
          <h1 key={idx} className="text-2xl font-bold mt-6 mb-4 text-foreground dark:text-gray-100">
            {lineContent}
          </h1>
        );
      }
      // Question patterns (Q1:, Q[1]:, etc.)
      else if (/^Q\[?\d+\]?:/i.test(line)) {
        processedLines.push(
          <p key={idx} className="mt-4 mb-2 font-semibold text-base text-foreground dark:text-gray-100">
            {lineContent}
          </p>
        );
      }
      // Answer options (A), B), C), D))
      else if (/^[A-D]\)/.test(line.trim())) {
        processedLines.push(
          <p key={idx} className="ml-6 mb-1 text-sm text-muted-foreground dark:text-gray-300">
            {lineContent}
          </p>
        );
      }
      // Correct answer marker (✓ Correct:)
      else if (line.includes('✓ Correct')) {
        processedLines.push(
          <p key={idx} className="ml-6 mt-2 mb-3 text-sm font-medium text-green-600 dark:text-green-400">
            {lineContent}
          </p>
        );
      }
      // Numbered questions
      else if (/^\d+\.\s/.test(line)) {
        processedLines.push(
          <p key={idx} className="mt-3 mb-2 font-medium text-foreground dark:text-gray-200">
            {lineContent}
          </p>
        );
      }
      // Answer options with dash
      else if (/^\s*-\s*[A-D]\)/.test(line)) {
        processedLines.push(
          <p key={idx} className="ml-6 text-sm text-muted-foreground dark:text-gray-400">
            {lineContent}
          </p>
        );
      }
      // Regular list items
      else if (line.startsWith('- ')) {
        processedLines.push(
          <li key={idx} className="ml-4 text-sm text-foreground dark:text-gray-300">
            {lineContent}
          </li>
        );
      }
      // Horizontal rules
      else if (line.trim() === '---') {
        processedLines.push(
          <hr key={idx} className="my-4 border-border dark:border-gray-700" />
        );
      }
      // Bold text (**text**)
      else if (line.includes('**') && !line.includes('$')) {
        const parts = line.split('**');
        const formatted = parts.map((part, i) =>
          i % 2 === 1 ? <strong key={i} className="dark:text-gray-100">{part}</strong> : part
        );
        processedLines.push(
          <p key={idx} className="mb-2 text-sm text-foreground dark:text-gray-300">
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
          <p key={idx} className="mb-2 text-sm text-foreground dark:text-gray-300">
            {lineContent}
          </p>
        );
      }
    });
    
    return processedLines;
  }, [content]);

  // Process LaTeX after render
  React.useEffect(() => {
    const renderMath = async () => {
      // Dynamically import katex only on client side
      const katex = (await import('katex')).default;
      
      // Find all math wrappers
      const mathElements = document.querySelectorAll('[data-math]');
      
      mathElements.forEach((element) => {
        const math = element.getAttribute('data-math');
        const isDisplay = element.getAttribute('data-display') === 'true';
        
        if (math) {
          try {
            katex.render(math, element as HTMLElement, {
              displayMode: isDisplay,
              throwOnError: false,
              trust: false,
            });
          } catch (e) {
            console.error('KaTeX render error:', e);
            // Keep original text on error
          }
        }
      });
    };
    
    renderMath();
  }, [content]);

  return (
    <div className={`math-content prose prose-sm max-w-none dark:prose-invert ${className}`}>
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css"
        integrity="sha384-n8MVd4RsNIU0tAv4ct0nTaAbDJwPJzDEaqSD1odI+WdtXRGWt2kTvGFasHpSy3SV"
        crossOrigin="anonymous"
      />
      {processedContent}
    </div>
  );
};
