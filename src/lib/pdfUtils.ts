import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { AITeachingNotesResult } from './ai';
import type { Assessment } from './mockData';
import { isGeneratedAssessmentBlob } from './assessmentMarkdown';

export function slugifyFilename(name: string): string {
  return name.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'document';
}

export function assessmentToMarkdown(assessment: Assessment): string {
  const parts: string[] = [
    `**Type:** ${assessment.type}`,
    `**Grade:** ${assessment.grade} · **Subject:** ${assessment.subject}`,
    `**Difficulty:** ${assessment.difficulty} · **Status:** ${assessment.status}`,
    '',
    '---',
    '',
  ];

  const isSingleGeneratedBlob = isGeneratedAssessmentBlob(assessment.questions);

  if (isSingleGeneratedBlob) {
    parts.push(assessment.questions[0].question);
    return parts.join('\n');
  }

  assessment.questions.forEach((q, index) => {
    parts.push(`## Question ${index + 1} (${q.type})`, '', q.question, '');
    if (q.options?.length) {
      q.options.forEach((opt, i) => {
        parts.push(`${String.fromCharCode(65 + i)}. ${opt}`);
      });
      parts.push('');
    }
    parts.push(`**Answer:** ${q.answer}`, '', '---', '');
  });

  return parts.join('\n');
}

export function teachingNotesToMarkdown(
  content: AITeachingNotesResult | string,
  meta?: { grade?: string; subject?: string; topic?: string; language?: string },
): string {
  if (typeof content === 'string') {
    const header = meta
      ? [
          meta.grade && `**Grade:** ${meta.grade}`,
          meta.subject && `**Subject:** ${meta.subject}`,
          meta.topic && `**Topic:** ${meta.topic}`,
          meta.language && `**Language:** ${meta.language}`,
          '',
          '---',
          '',
        ]
          .filter(Boolean)
          .join('\n')
      : '';
    return header + content;
  }

  const parts: string[] = [];
  const metaLine = [
    meta?.grade && `**Grade:** ${meta.grade}`,
    meta?.subject && `**Subject:** ${meta.subject}`,
    meta?.topic && `**Topic:** ${meta.topic}`,
    `**Language:** ${content.language || meta?.language || 'English'}`,
  ]
    .filter(Boolean)
    .join(' · ');

  if (metaLine) {
    parts.push(metaLine, '', '---', '');
  }

  if (content.introduction) {
    parts.push('## Introduction', '', content.introduction, '');
  }

  content.explanations?.forEach((exp, idx) => {
    parts.push(`## ${exp.subtitle || `Concept ${idx + 1}`}`, '', exp.content, '');
    if (exp.examples?.length) {
      parts.push('**Examples:**', ...exp.examples.map((e) => `- ${e}`), '');
    }
  });

  if (content.visualAids?.length) {
    parts.push('## Visual Aids', '', ...content.visualAids.map((a) => `- ${a}`), '');
  }

  if (content.exercises?.length) {
    parts.push('## Practice Exercises', '', ...content.exercises.map((e, i) => `${i + 1}. ${e}`), '');
  }

  return parts.join('\n');
}

const PDF_CONTENT_STYLES = `
  .pdf-content h1 { font-size: 24px; font-weight: bold; margin: 20px 0 10px; color: #1d4ed8; }
  .pdf-content h2 { font-size: 20px; font-weight: bold; margin: 16px 0 8px; color: #1d4ed8; }
  .pdf-content h3 { font-size: 16px; font-weight: bold; margin: 12px 0 6px; color: #0369a1; }
  .pdf-content p { margin: 6px 0; line-height: 1.6; }
  .pdf-content .question { margin-top: 14px; font-weight: 600; color: #111827; }
  .pdf-content .option { margin-left: 20px; color: #374151; }
  .pdf-content .answer { margin-left: 20px; color: #047857; font-weight: 500; }
  .pdf-content .blank { margin: 8px 0 8px 20px; letter-spacing: 2px; color: #6b7280; }
  .pdf-content .section { margin-top: 18px; font-weight: 700; color: #1d4ed8; font-size: 16px; }
  .pdf-content .meta { color: #4b5563; font-size: 13px; }
  .pdf-content ul, .pdf-content ol { margin: 8px 0; padding-left: 20px; }
  .pdf-content li { margin: 4px 0; }
  .pdf-content hr { border: none; border-top: 2px solid #e5e7eb; margin: 16px 0; }
  .pdf-content .spacer { height: 8px; }
  .pdf-content .katex { font-size: 1.05em; }
  .pdf-content .katex-display { margin: 10px 0; overflow-x: auto; }
`;

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderLatexInText(
  text: string,
  katex: typeof import('katex').default,
): string {
  const mathRegex = /\$\$([^$]+)\$\$|\$([^$\n]+)\$/g;
  const parts: string[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = mathRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(escapeHtml(text.substring(lastIndex, match.index)));
    }

    const mathContent = match[1] || match[2];
    const isDisplay = match[0].startsWith('$$');

    try {
      parts.push(
        katex.renderToString(mathContent, {
          displayMode: isDisplay,
          throwOnError: false,
          trust: false,
        }),
      );
    } catch {
      parts.push(escapeHtml(match[0]));
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(escapeHtml(text.substring(lastIndex)));
  }

  return parts.join('');
}

function processLineContent(
  line: string,
  katex: typeof import('katex').default,
): string {
  const withBoldMarkers = line.replace(/\*\*(.+?)\*\*/g, '⟦BOLD:$1⟧');
  const rendered = renderLatexInText(withBoldMarkers, katex);
  return rendered.replace(/⟦BOLD:(.+?)⟧/g, '<strong>$1</strong>');
}

function lineToHtml(
  line: string,
  katex: typeof import('katex').default,
): string {
  const trimmed = line.trim();

  if (!trimmed) {
    return '<div class="spacer"></div>';
  }

  const content = processLineContent(trimmed, katex);

  if (trimmed.startsWith('### ')) {
    return `<h3>${processLineContent(trimmed.slice(4), katex)}</h3>`;
  }
  if (trimmed.startsWith('## ')) {
    return `<h2>${processLineContent(trimmed.slice(3), katex)}</h2>`;
  }
  if (trimmed.startsWith('# ')) {
    return `<h1>${processLineContent(trimmed.slice(2), katex)}</h1>`;
  }
  if (/^Section [A-Z]:/i.test(trimmed) || /^ANSWER KEY/i.test(trimmed)) {
    return `<h2 class="section">${content}</h2>`;
  }
  if (/^Section [A-Z]$/i.test(trimmed)) {
    return `<h3 class="section">${content}</h3>`;
  }
  if (/^Q\[?\d+\]?:/i.test(trimmed)) {
    return `<p class="question">${content}</p>`;
  }
  if (/^[A-D]\)/.test(trimmed)) {
    return `<p class="option">${content}</p>`;
  }
  if (trimmed.includes('✓ Correct') || trimmed.includes('✓ Explanation')) {
    return `<p class="answer">${content}</p>`;
  }
  if (trimmed === '_______' || /^_{3,}$/.test(trimmed)) {
    return '<p class="blank">______________________________</p>';
  }
  if (/^\*\*[^*]+\*\*/.test(trimmed) && trimmed.includes(':**')) {
    return `<p class="meta">${content}</p>`;
  }
  if (trimmed === '---') {
    return '<hr />';
  }
  if (trimmed.startsWith('- ')) {
    return `<li>${processLineContent(trimmed.slice(2), katex)}</li>`;
  }
  if (/^\d+\.\s/.test(trimmed)) {
    return `<p>${content}</p>`;
  }

  return `<p>${content}</p>`;
}

async function convertContentToHTML(content: string): Promise<string> {
  const katex = (await import('katex')).default;
  const lines = content.split('\n');
  const htmlParts: string[] = [];
  let listOpen = false;

  for (const line of lines) {
    const trimmed = line.trim();
    const isListItem = trimmed.startsWith('- ');

    if (isListItem && !listOpen) {
      htmlParts.push('<ul>');
      listOpen = true;
    } else if (!isListItem && listOpen) {
      htmlParts.push('</ul>');
      listOpen = false;
    }

    htmlParts.push(lineToHtml(line, katex));
  }

  if (listOpen) {
    htmlParts.push('</ul>');
  }

  return htmlParts.join('\n');
}

async function ensureKatexStyles(container: HTMLElement): Promise<void> {
  const existing = document.querySelector('link[data-katex-pdf]');
  if (existing) return;

  await new Promise<void>((resolve) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css';
    link.setAttribute('data-katex-pdf', 'true');
    link.onload = () => resolve();
    link.onerror = () => resolve();
    container.appendChild(link);
    window.setTimeout(resolve, 400);
  });
}

function buildPrintableHTML(bodyHtml: string, title?: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title || 'Document'}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css" crossorigin="anonymous" />
  <style>
    @page { size: A4; margin: 20mm; }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 210mm;
      margin: 0 auto;
      padding: 20px;
    }
    ${PDF_CONTENT_STYLES.replace(/\.pdf-content/g, 'body')}
    @media print { body { padding: 0; } .no-print { display: none; } }
  </style>
</head>
<body>
  ${title ? `<h1>${escapeHtml(title)}</h1><hr/>` : ''}
  ${bodyHtml}
</body>
</html>`;
}

export async function printMarkdown(content: string, title?: string): Promise<void> {
  const bodyHtml = await convertContentToHTML(content);
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow pop-ups to print this document.');
    return;
  }
  printWindow.document.open();
  printWindow.document.write(buildPrintableHTML(bodyHtml, title));
  printWindow.document.close();
  printWindow.focus();
  printWindow.addEventListener('load', () => {
    printWindow.print();
  });
}

export async function generatePDFFromMarkdown(
  content: string,
  filename: string,
  title?: string,
): Promise<void> {
  try {
    const bodyHtml = await convertContentToHTML(content);

    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.width = '210mm';
    container.style.padding = '20mm';
    container.style.backgroundColor = 'white';
    container.style.fontFamily = 'Arial, sans-serif';
    container.style.fontSize = '12px';
    container.style.lineHeight = '1.6';
    container.style.color = '#000';

    container.innerHTML = `
      <style>${PDF_CONTENT_STYLES}</style>
      <div class="pdf-content">
        ${title ? `<h1>${escapeHtml(title)}</h1><hr/>` : ''}
        ${bodyHtml}
      </div>
    `;

    document.body.appendChild(container);
    await ensureKatexStyles(container);
    await new Promise((resolve) => window.setTimeout(resolve, 150));

    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    document.body.removeChild(container);

    const imgWidth = 210;
    const pageHeight = 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;

    const pdf = new jsPDF('p', 'mm', 'a4');
    let position = 0;

    const imgData = canvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(filename);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF');
  }
}

export async function downloadAsHTML(content: string, filename: string, title?: string): Promise<void> {
  const bodyHtml = await convertContentToHTML(content);
  const html = buildPrintableHTML(bodyHtml, title).replace(
    '<body>',
    `<body>
  <div class="no-print" style="background: #f0f9ff; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
    <p style="margin: 0;"><strong>Tip:</strong> Press <kbd>Ctrl+P</kbd> (Windows) or <kbd>Cmd+P</kbd> (Mac) to print this document as PDF.</p>
  </div>`,
  );

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.replace('.md', '.html');
  a.click();
  URL.revokeObjectURL(url);
}
