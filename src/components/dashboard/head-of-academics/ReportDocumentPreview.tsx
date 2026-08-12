'use client';

import React from 'react';
import { buildReportDocumentInnerHTML, type RenderableReportDoc } from '@/lib/reportCardPdf';
import type { ReportCardTemplate } from '@/lib/headOfAcademicsPortal';

/** On-screen preview of a report card / transcript. Renders the exact same markup the PDF
 *  exporter screenshots, so the preview and the downloaded PDF can never drift apart. */
export function ReportDocumentPreview({
  template,
  doc,
}: {
  template: ReportCardTemplate;
  doc: RenderableReportDoc;
}) {
  const html = React.useMemo(() => buildReportDocumentInnerHTML(template, doc), [template, doc]);

  return (
    <div
      className="mx-auto max-w-[210mm] rounded-lg border border-border/60 bg-white p-6 text-[#111827] shadow-sm"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
