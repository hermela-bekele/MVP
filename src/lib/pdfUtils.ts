import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Generate PDF from markdown content
 * This renders the markdown as HTML first, then converts to PDF
 */
export async function generatePDFFromMarkdown(
  content: string,
  filename: string,
  title?: string
): Promise<void> {
  try {
    // Create a temporary container
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.width = '210mm'; // A4 width
    container.style.padding = '20mm';
    container.style.backgroundColor = 'white';
    container.style.fontFamily = 'Arial, sans-serif';
    container.style.fontSize = '12px';
    container.style.lineHeight = '1.6';
    container.style.color = '#000';
    
    // Add styles for better PDF rendering
    container.innerHTML = `
      <style>
        .pdf-content h1 { font-size: 24px; font-weight: bold; margin: 20px 0 10px; color: #1d4ed8; }
        .pdf-content h2 { font-size: 20px; font-weight: bold; margin: 16px 0 8px; color: #1d4ed8; }
        .pdf-content h3 { font-size: 16px; font-weight: bold; margin: 12px 0 6px; color: #0369a1; }
        .pdf-content h4 { font-size: 14px; font-weight: bold; margin: 10px 0 5px; }
        .pdf-content p { margin: 8px 0; }
        .pdf-content ul, .pdf-content ol { margin: 8px 0; padding-left: 20px; }
        .pdf-content li { margin: 4px 0; }
        .pdf-content table { border-collapse: collapse; width: 100%; margin: 12px 0; }
        .pdf-content th, .pdf-content td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .pdf-content th { background-color: #f3f4f6; font-weight: bold; }
        .pdf-content code { background-color: #f3f4f6; padding: 2px 6px; border-radius: 3px; font-family: monospace; }
        .pdf-content pre { background-color: #f3f4f6; padding: 12px; border-radius: 6px; overflow-x: auto; }
        .pdf-content blockquote { border-left: 4px solid #1d4ed8; padding-left: 12px; margin: 12px 0; color: #4b5563; }
        .pdf-content strong { font-weight: bold; }
        .pdf-content em { font-style: italic; }
        .pdf-content hr { border: none; border-top: 2px solid #e5e7eb; margin: 16px 0; }
      </style>
      <div class="pdf-content">
        ${title ? `<h1>${title}</h1><hr/>` : ''}
        ${convertMarkdownToHTML(content)}
      </div>
    `;
    
    document.body.appendChild(container);
    
    // Capture the content as canvas
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });
    
    // Remove the temporary container
    document.body.removeChild(container);
    
    // Create PDF
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    
    const pdf = new jsPDF('p', 'mm', 'a4');
    let position = 0;
    
    // Add image to PDF (handle multiple pages)
    const imgData = canvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
    
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }
    
    // Save PDF
    pdf.save(filename);
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF');
  }
}

/**
 * Simple markdown to HTML converter
 * For more complex markdown, consider using a library like marked.js
 */
function convertMarkdownToHTML(markdown: string): string {
  let html = markdown;
  
  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
  
  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Italic
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // Code blocks
  html = html.replace(/```([^`]+)```/g, '<pre><code>$1</code></pre>');
  
  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  
  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  
  // Line breaks
  html = html.replace(/\n\n/g, '</p><p>');
  html = html.replace(/\n/g, '<br/>');
  
  // Wrap in paragraphs
  html = '<p>' + html + '</p>';
  
  // Clean up empty paragraphs
  html = html.replace(/<p><\/p>/g, '');
  
  // Unordered lists
  html = html.replace(/^\s*-\s+(.*)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>[\s\S]*<\/li>)/, '<ul>$1</ul>');
  
  // Ordered lists  
  html = html.replace(/^\s*\d+\.\s+(.*)$/gm, '<li>$1</li>');
  
  // Horizontal rules
  html = html.replace(/^---$/gm, '<hr/>');
  
  // Blockquotes
  html = html.replace(/^>\s+(.*)$/gm, '<blockquote>$1</blockquote>');
  
  // Tables (basic support)
  html = html.replace(/\|(.+)\|/g, (match) => {
    const cells = match.split('|').filter(cell => cell.trim());
    const cellTags = cells.map(cell => `<td>${cell.trim()}</td>`).join('');
    return `<tr>${cellTags}</tr>`;
  });
  html = html.replace(/(<tr>[\s\S]*<\/tr>)/, '<table>$1</table>');
  
  return html;
}

/**
 * Alternative: Download as formatted HTML that can be printed to PDF
 */
export function downloadAsHTML(content: string, filename: string, title?: string): void {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title || 'Document'}</title>
  <style>
    @page { 
      size: A4; 
      margin: 20mm; 
    }
    body { 
      font-family: 'Segoe UI', Arial, sans-serif; 
      line-height: 1.6; 
      color: #333; 
      max-width: 210mm;
      margin: 0 auto;
      padding: 20px;
    }
    h1 { font-size: 28px; color: #1d4ed8; border-bottom: 3px solid #1d4ed8; padding-bottom: 10px; }
    h2 { font-size: 22px; color: #1d4ed8; margin-top: 30px; }
    h3 { font-size: 18px; color: #0369a1; margin-top: 20px; }
    h4 { font-size: 16px; color: #075985; margin-top: 15px; }
    p { margin: 10px 0; }
    ul, ol { margin: 10px 0; padding-left: 30px; }
    li { margin: 5px 0; }
    table { border-collapse: collapse; width: 100%; margin: 15px 0; }
    th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
    th { background-color: #f3f4f6; font-weight: bold; }
    code { background-color: #f3f4f6; padding: 2px 8px; border-radius: 4px; font-family: 'Courier New', monospace; }
    pre { background-color: #f3f4f6; padding: 15px; border-radius: 8px; overflow-x: auto; }
    blockquote { border-left: 4px solid #1d4ed8; padding-left: 15px; margin: 15px 0; color: #4b5563; font-style: italic; }
    hr { border: none; border-top: 2px solid #e5e7eb; margin: 20px 0; }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="background: #f0f9ff; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
    <p style="margin: 0;"><strong>💡 Tip:</strong> Press <kbd>Ctrl+P</kbd> (Windows) or <kbd>Cmd+P</kbd> (Mac) to print this document as PDF.</p>
  </div>
  ${title ? `<h1>${title}</h1><hr/>` : ''}
  ${convertMarkdownToHTML(content)}
</body>
</html>
  `;
  
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.replace('.md', '.html');
  a.click();
  URL.revokeObjectURL(url);
}
