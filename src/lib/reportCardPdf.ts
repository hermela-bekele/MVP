import { renderNodeToPDF } from './pdfUtils';
import { resolveLetterGrade, type ReportCardTemplate, type SubjectReportRow } from './headOfAcademicsPortal';

export interface RenderableReportDoc {
  kind: 'report-card' | 'transcript';
  schoolName: string;
  schoolLogoUrl?: string;
  student: {
    name: string;
    studentId: string;
    grade: string;
    section: string;
    parentName?: string;
  };
  /** Report-card only — the single term this document covers. */
  term?: string;
  /** Report card: one group (the selected term). Transcript: one group per term. */
  subjectGroups: {
    term?: string;
    rows: SubjectReportRow[];
    averagePercent: number | null;
    gpa: number | null;
  }[];
  /** Transcript cumulative GPA across all terms. */
  overallGpa?: number | null;
  rank?: number | null;
  attendanceRate?: number | null;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const STUDENT_INFO_VALUES: Record<string, (doc: RenderableReportDoc) => string> = {
  name: (doc) => doc.student.name,
  studentId: (doc) => doc.student.studentId,
  grade: (doc) => doc.student.grade,
  section: (doc) => doc.student.section,
  term: (doc) => doc.term ?? '',
  parentName: (doc) => doc.student.parentName ?? '',
};

function renderHeader(template: ReportCardTemplate, doc: RenderableReportDoc): string {
  const schoolName = template.header.schoolNameOverride || doc.schoolName;
  return `
    <div style="display:flex;align-items:center;gap:16px;border-bottom:2px solid #1f2937;padding-bottom:12px;margin-bottom:16px;">
      ${template.header.showLogo && doc.schoolLogoUrl ? `<img src="${doc.schoolLogoUrl}" style="height:56px;width:56px;object-fit:contain;" />` : ''}
      <div>
        <div style="font-size:16px;font-weight:700;">${escapeHtml(schoolName)}</div>
        <div style="font-size:14px;font-weight:600;color:#374151;">${escapeHtml(template.header.title)}</div>
        ${template.header.subtitle ? `<div style="font-size:11px;color:#6b7280;">${escapeHtml(template.header.subtitle)}</div>` : ''}
      </div>
    </div>
  `;
}

function renderStudentInfo(template: ReportCardTemplate, doc: RenderableReportDoc): string {
  const enabled = template.studentInfoFields.filter((f) => f.enabled && STUDENT_INFO_VALUES[f.key]);
  if (!enabled.length) return '';
  return `
    <div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:8px;margin-bottom:16px;font-size:11px;">
      ${enabled
        .map(
          (f) => `
        <div>
          <div style="color:#6b7280;text-transform:uppercase;font-size:9px;letter-spacing:0.04em;">${escapeHtml(f.label)}</div>
          <div style="font-weight:600;">${escapeHtml(STUDENT_INFO_VALUES[f.key](doc) || '—')}</div>
        </div>`,
        )
        .join('')}
    </div>
  `;
}

function renderSubjectTable(template: ReportCardTemplate, rows: SubjectReportRow[]): string {
  const cols = template.subjectColumns;
  const headers = ['Subject'];
  if (cols.showScore) headers.push('Score');
  if (cols.showMaxScore) headers.push('Max');
  if (cols.showPercentage) headers.push('%');
  if (cols.showLetterGrade) headers.push('Grade');
  if (cols.showRemarks) headers.push('Remarks');

  const bodyRows = rows
    .map((row) => {
      const totalScore = row.entries.reduce((a, e) => a + e.score, 0);
      const totalMax = row.entries.reduce((a, e) => a + e.maxScore, 0);
      const letter = resolveLetterGrade(row.averagePercent, template.gradingScale);
      const remarks = row.entries.find((e) => e.remarks)?.remarks ?? '';
      const cells = [escapeHtml(row.subject)];
      if (cols.showScore) cells.push(String(totalScore));
      if (cols.showMaxScore) cells.push(String(totalMax));
      if (cols.showPercentage) cells.push(row.averagePercent != null ? `${row.averagePercent}%` : '—');
      if (cols.showLetterGrade) cells.push(letter ?? '—');
      if (cols.showRemarks) cells.push(escapeHtml(remarks));
      return `<tr>${cells.map((c) => `<td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;">${c}</td>`).join('')}</tr>`;
    })
    .join('');

  return `
    <table style="width:100%;border-collapse:collapse;font-size:11px;margin-bottom:12px;">
      <thead>
        <tr>
          ${headers.map((h) => `<th style="text-align:left;padding:6px 8px;background:#f3f4f6;border-bottom:2px solid #d1d5db;">${escapeHtml(h)}</th>`).join('')}
        </tr>
      </thead>
      <tbody>${bodyRows || `<tr><td style="padding:8px;color:#9ca3af;" colspan="${headers.length}">No grade entries for this term.</td></tr>`}</tbody>
    </table>
  `;
}

function renderGradingScale(template: ReportCardTemplate): string {
  if (!template.gradingScale.length) return '';
  return `
    <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px;font-size:9px;color:#4b5563;">
      ${template.gradingScale
        .map((b) => `<span>${escapeHtml(b.letter)}: ${b.minPercent}–${b.maxPercent}%</span>`)
        .join('')}
    </div>
  `;
}

function renderSummary(template: ReportCardTemplate, doc: RenderableReportDoc, group: RenderableReportDoc['subjectGroups'][number]): string {
  const items: string[] = [];
  if (template.summaryBlock.showTermAverage) {
    items.push(`Term Average: <strong>${group.averagePercent != null ? `${group.averagePercent}%` : '—'}</strong>`);
  }
  if (template.summaryBlock.showGpa) {
    const gpa = doc.kind === 'transcript' ? doc.overallGpa ?? group.gpa : group.gpa;
    items.push(`GPA: <strong>${gpa != null ? gpa.toFixed(2) : '—'}</strong>`);
  }
  if (template.summaryBlock.showRank) {
    items.push(`Class Rank: <strong>${doc.rank != null ? `#${doc.rank}` : '—'}</strong>`);
  }
  if (template.summaryBlock.showAttendanceRate) {
    items.push(`Attendance: <strong>${doc.attendanceRate != null ? `${doc.attendanceRate}%` : '—'}</strong>`);
  }
  if (!items.length) return '';
  return `<div style="display:flex;gap:20px;font-size:11px;margin:8px 0 16px;">${items.map((i) => `<span>${i}</span>`).join('')}</div>`;
}

function renderSignatureLines(template: ReportCardTemplate): string {
  if (!template.signatureLines.length) return '';
  return `
    <div style="display:flex;gap:24px;margin-top:36px;">
      ${template.signatureLines
        .map(
          (s) => `
        <div style="flex:1;text-align:center;">
          <div style="border-top:1px solid #374151;padding-top:4px;font-size:10px;color:#4b5563;">${escapeHtml(s.label)}</div>
        </div>`,
        )
        .join('')}
    </div>
  `;
}

/**
 * Builds the report/transcript markup as a plain HTML string, shared by the on-screen
 * `ReportDocumentPreview` component (dangerouslySetInnerHTML) and the off-screen PDF
 * container below, so the preview and the generated PDF can never drift apart.
 */
export function buildReportDocumentInnerHTML(template: ReportCardTemplate, doc: RenderableReportDoc): string {
  const groupsHtml = doc.subjectGroups
    .map((group) => {
      const termHeading =
        doc.kind === 'transcript' && group.term
          ? `<div style="font-size:12px;font-weight:700;margin:14px 0 6px;">${escapeHtml(group.term)}</div>`
          : '';
      return `${termHeading}${renderSubjectTable(template, group.rows)}${renderSummary(template, doc, group)}`;
    })
    .join('');

  return `
    ${renderHeader(template, doc)}
    ${renderStudentInfo(template, doc)}
    ${groupsHtml}
    ${renderGradingScale(template)}
    ${renderSignatureLines(template)}
    ${template.footerText ? `<div style="margin-top:20px;font-size:10px;color:#6b7280;">${escapeHtml(template.footerText)}</div>` : ''}
  `;
}

export function renderReportDocumentHTML(template: ReportCardTemplate, doc: RenderableReportDoc): HTMLElement {
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.width = '210mm';
  container.style.padding = '16mm';
  container.style.backgroundColor = 'white';
  container.style.fontFamily = 'Arial, sans-serif';
  container.style.color = '#111827';
  container.innerHTML = buildReportDocumentInnerHTML(template, doc);
  return container;
}

export async function generateReportDocumentPDF(
  template: ReportCardTemplate,
  doc: RenderableReportDoc,
  filename: string,
): Promise<void> {
  const container = renderReportDocumentHTML(template, doc);
  await renderNodeToPDF(container, filename);
}
