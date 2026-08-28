import { renderNodeToPDF } from './pdfUtils';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export interface RegistrarStudentDoc {
  schoolName: string;
  schoolLogoUrl?: string;
  student: {
    name: string;
    studentId: string;
    grade: string;
    section: string;
    parentName?: string;
  };
  academicYear?: string;
  issueDate?: string;
}

/**
 * Pure string builders, shared between the off-screen PDF container and (were one ever
 * added) an on-screen preview — same convention as buildReportDocumentInnerHTML in
 * reportCardPdf.ts, so the two representations can't drift apart.
 */
export function buildEnrollmentLetterInnerHTML(doc: RegistrarStudentDoc): string {
  const issueDate = doc.issueDate ?? new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
  return `
    <div style="display:flex;align-items:center;gap:16px;border-bottom:2px solid #1f2937;padding-bottom:12px;margin-bottom:24px;">
      ${doc.schoolLogoUrl ? `<img src="${doc.schoolLogoUrl}" style="height:56px;width:56px;object-fit:contain;" />` : ''}
      <div>
        <div style="font-size:16px;font-weight:700;">${escapeHtml(doc.schoolName)}</div>
        <div style="font-size:14px;font-weight:600;color:#374151;">Enrollment Verification Letter</div>
      </div>
    </div>
    <p style="font-size:12px;color:#4b5563;margin-bottom:16px;">${escapeHtml(issueDate)}</p>
    <p style="font-size:12px;line-height:1.7;margin-bottom:16px;">To Whom It May Concern,</p>
    <p style="font-size:12px;line-height:1.7;margin-bottom:16px;">
      This letter confirms that <strong>${escapeHtml(doc.student.name)}</strong> (Student ID:
      <strong>${escapeHtml(doc.student.studentId)}</strong>) is currently enrolled at
      <strong>${escapeHtml(doc.schoolName)}</strong> in <strong>${escapeHtml(doc.student.grade)}, Section ${escapeHtml(doc.student.section || '—')}</strong>${doc.academicYear ? `, for the ${escapeHtml(doc.academicYear)} academic year` : ''}.
    </p>
    ${doc.student.parentName ? `<p style="font-size:12px;line-height:1.7;margin-bottom:16px;">Parent/Guardian on record: <strong>${escapeHtml(doc.student.parentName)}</strong>.</p>` : ''}
    <p style="font-size:12px;line-height:1.7;margin-bottom:32px;">This letter is issued upon request for official purposes.</p>
    <div style="display:flex;gap:24px;margin-top:48px;">
      <div style="flex:1;text-align:center;">
        <div style="border-top:1px solid #374151;padding-top:4px;font-size:10px;color:#4b5563;">Registrar Signature</div>
      </div>
      <div style="flex:1;text-align:center;">
        <div style="border-top:1px solid #374151;padding-top:4px;font-size:10px;color:#4b5563;">School Seal</div>
      </div>
    </div>
  `;
}

export function renderEnrollmentLetterHTML(doc: RegistrarStudentDoc): HTMLElement {
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.width = '210mm';
  container.style.padding = '20mm';
  container.style.backgroundColor = 'white';
  container.style.fontFamily = 'Arial, sans-serif';
  container.style.color = '#111827';
  container.innerHTML = buildEnrollmentLetterInnerHTML(doc);
  return container;
}

export async function generateEnrollmentLetterPDF(doc: RegistrarStudentDoc, filename: string): Promise<void> {
  const container = renderEnrollmentLetterHTML(doc);
  await renderNodeToPDF(container, filename);
}

export function buildIdCardInnerHTML(doc: RegistrarStudentDoc): string {
  return `
    <div style="width:86mm;border:2px solid #1f2937;border-radius:6px;padding:10mm;font-family:Arial, sans-serif;color:#111827;">
      <div style="display:flex;align-items:center;gap:8px;border-bottom:1px solid #d1d5db;padding-bottom:6px;margin-bottom:8px;">
        ${doc.schoolLogoUrl ? `<img src="${doc.schoolLogoUrl}" style="height:28px;width:28px;object-fit:contain;" />` : ''}
        <div style="font-size:11px;font-weight:700;">${escapeHtml(doc.schoolName)}</div>
      </div>
      <div style="font-size:9px;color:#6b7280;text-transform:uppercase;letter-spacing:0.04em;">Student ID Card</div>
      <div style="font-size:14px;font-weight:700;margin-top:6px;">${escapeHtml(doc.student.name)}</div>
      <div style="font-size:10px;color:#374151;margin-top:2px;">${escapeHtml(doc.student.grade)} · Section ${escapeHtml(doc.student.section || '—')}</div>
      <div style="font-size:10px;font-family:monospace;color:#374151;margin-top:6px;">${escapeHtml(doc.student.studentId)}</div>
      ${doc.academicYear ? `<div style="font-size:9px;color:#6b7280;margin-top:6px;">${escapeHtml(doc.academicYear)}</div>` : ''}
    </div>
  `;
}

export function renderIdCardHTML(doc: RegistrarStudentDoc): HTMLElement {
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.width = '210mm';
  container.style.padding = '20mm';
  container.style.backgroundColor = 'white';
  container.innerHTML = buildIdCardInnerHTML(doc);
  return container;
}

export async function generateIdCardPDF(doc: RegistrarStudentDoc, filename: string): Promise<void> {
  const container = renderIdCardHTML(doc);
  await renderNodeToPDF(container, filename);
}
