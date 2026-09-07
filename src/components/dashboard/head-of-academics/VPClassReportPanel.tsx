'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { ApiError } from '@/lib/api';
import { readStoredSession } from '@/lib/auth';
import { ContentCard } from '@/components/dashboard/ContentCard';
import { TablePanel } from '@/components/dashboard/TablePanel';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { generateReportDocumentPDF, type RenderableReportDoc } from '@/lib/reportCardPdf';
import { slugifyFilename } from '@/lib/pdfUtils';
import { DEFAULT_TEMPLATE, mergeTemplateSettings, type ReportCardTemplate } from '@/lib/headOfAcademicsPortal';
import { academicResultsApi } from '@/lib/academicResults';
import { ReportDocumentPreview } from './ReportDocumentPreview';
import { Pagination } from '@/components/ui/pagination';

const ROWS_PAGE_SIZE = 10;

export function VPClassReportPanel() {
  const { classes, students, schools } = useApp();
  const session = readStoredSession();
  const schoolId = session?.schoolId || 'sch-1';
  const school = schools.find((s) => s.id === schoolId);

  const [template, setTemplate] = useState<ReportCardTemplate>(DEFAULT_TEMPLATE.reportCard);
  const [grade, setGrade] = useState('');
  const [section, setSection] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [term, setTerm] = useState('');
  const [previewDoc, setPreviewDoc] = useState<RenderableReportDoc | null>(null);
  const [generating, setGenerating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<{ studentId: string; studentName: string; average: number | null }[]>([]);
  const [loadingRows, setLoadingRows] = useState(false);
  const [rowsPage, setRowsPage] = useState(1);
  const [academicYearOptions, setAcademicYearOptions] = useState<string[]>([]);
  const [termOptions, setTermOptions] = useState<string[]>([]);

  useEffect(() => {
    academicResultsApi
      .getActiveReportTemplate('report_card', schoolId)
      .then((t) => setTemplate(mergeTemplateSettings({ reportCard: t.config as unknown as ReportCardTemplate }).reportCard))
      .catch(() => setTemplate(DEFAULT_TEMPLATE.reportCard));
  }, [schoolId]);

  useEffect(() => {
    academicResultsApi
      .listAcademicYears(schoolId)
      .then((years) => {
        setAcademicYearOptions(years);
        setAcademicYear((prev) => prev || years[0] || '');
      })
      .catch(() => setAcademicYearOptions([]));
  }, [schoolId]);

  useEffect(() => {
    if (!academicYear) {
      setTermOptions([]);
      return;
    }
    academicResultsApi
      .listTerms({ schoolId, academicYear, gradeLevel: grade || undefined, section: section || undefined })
      .then((terms) => {
        setTermOptions(terms);
        setTerm((prev) => (terms.includes(prev) ? prev : terms[0] || ''));
      })
      .catch(() => setTermOptions([]));
  }, [schoolId, academicYear, grade, section]);

  const gradeOptions = useMemo(
    () => Array.from(new Set(classes.map((c) => c.grade))).map((g) => ({ value: g, label: g })),
    [classes],
  );
  const sectionOptions = useMemo(
    () => Array.from(new Set(classes.filter((c) => c.grade === grade).map((c) => c.section))).map((sec) => ({ value: sec, label: sec })),
    [classes, grade],
  );

  const classStudents = useMemo(
    () => students.filter((s) => s.grade === grade && s.section === section).sort((a, b) => a.name.localeCompare(b.name)),
    [students, grade, section],
  );

  useEffect(() => {
    setRowsPage(1);
    if (!grade || !section || !academicYear || !term) {
      setRows([]);
      return;
    }
    setLoadingRows(true);
    academicResultsApi
      .list({ schoolId, gradeLevel: grade, section, academicYear, term })
      .then(({ results }) => {
        const byStudent = new Map<string, number[]>();
        for (const r of results) {
          if (r.averagePercent == null) continue;
          const list = byStudent.get(r.studentId) ?? [];
          list.push(r.averagePercent);
          byStudent.set(r.studentId, list);
        }
        setRows(
          classStudents.map((s) => {
            const values = byStudent.get(s.id) ?? [];
            const average = values.length ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100 : null;
            return { studentId: s.id, studentName: s.name, average };
          }),
        );
      })
      .catch(() => setRows([]))
      .finally(() => setLoadingRows(false));
  }, [schoolId, grade, section, academicYear, term, classStudents]);

  const buildDoc = async (studentId: string): Promise<RenderableReportDoc | null> => {
    const student = classStudents.find((s) => s.id === studentId);
    if (!student || !term) return null;
    const card = await academicResultsApi.getReportCard({ studentId, academicYear, term, gradeLevel: grade, section, schoolId });
    return {
      kind: 'report-card',
      schoolName: school?.name ?? 'School',
      student: { name: student.name, studentId: student.studentId, grade: student.grade, section: student.section, parentName: student.parentName },
      term: card.term,
      academicYear: card.academicYear,
      subjectGroups: [
        {
          rows: card.subjects.map((s) => ({ subject: s.subject, entries: [], averagePercent: s.averagePercent, letterGrade: null })),
          averagePercent: card.overallAverage,
          gpa: null,
        },
      ],
      rank: card.rank,
      rankPopulation: card.rankPopulation,
      attendanceRate: card.attendanceRate,
      conduct: card.conduct,
      promotionStatus: card.promotionStatus,
      generalRemark: card.generalRemark,
    };
  };

  const generateOne = async (studentId: string) => {
    setGenerating(studentId);
    setError(null);
    try {
      const doc = await buildDoc(studentId);
      if (!doc) return;
      await generateReportDocumentPDF(template, doc, `${slugifyFilename(`${doc.student.name}-${term}-report-card`)}.pdf`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to generate report card. Results may not be finalized yet.');
    } finally {
      setGenerating(null);
    }
  };

  const rowsTotalPages = Math.max(1, Math.ceil(rows.length / ROWS_PAGE_SIZE));
  const rowsCurrentPage = Math.min(rowsPage, rowsTotalPages);
  const pagedRows = rows.slice((rowsCurrentPage - 1) * ROWS_PAGE_SIZE, rowsCurrentPage * ROWS_PAGE_SIZE);

  const generateAll = async () => {
    for (const student of classStudents) {
      await generateOne(student.id);
    }
  };

  const preview = async (studentId: string) => {
    setError(null);
    try {
      const doc = await buildDoc(studentId);
      setPreviewDoc(doc);
    } catch (err) {
      setPreviewDoc(null);
      setError(err instanceof ApiError ? err.message : 'Failed to load report card. Results may not be finalized yet.');
    }
  };

  return (
    <div className="space-y-6">
      <ContentCard title="Select class & term" description="Pick a class, academic year and term to generate report cards for">
        <div className="grid gap-3 sm:grid-cols-4">
          <Select
            label="Grade"
            placeholder="Select grade"
            options={gradeOptions}
            value={grade}
            onValueChange={(v) => {
              setGrade(v);
              setSection('');
              setPreviewDoc(null);
            }}
          />
          <Select
            label="Section"
            placeholder="Select section"
            options={sectionOptions}
            value={section}
            onValueChange={(v) => {
              setSection(v);
              setPreviewDoc(null);
            }}
            disabled={!grade}
          />
          <Select
            label="Academic year"
            placeholder="Select academic year"
            options={academicYearOptions.map((y) => ({ value: y, label: y }))}
            value={academicYear}
            onValueChange={(v) => {
              setAcademicYear(v);
              setTerm('');
              setPreviewDoc(null);
            }}
          />
          <Select
            label="Term"
            placeholder={academicYear ? 'Select term' : 'Select academic year first'}
            options={termOptions.map((t) => ({ value: t, label: t }))}
            value={term}
            onValueChange={(v) => {
              setTerm(v);
              setPreviewDoc(null);
            }}
            disabled={!academicYear}
          />
        </div>
        {academicYear && termOptions.length === 0 && (
          <p className="mt-3 text-xs text-muted-foreground">
            No terms have any submitted results yet for {academicYear}
            {grade ? ` · ${grade}` : ''}
            {section ? ` · ${section}` : ''}. Ask teachers to submit results first.
          </p>
        )}
      </ContentCard>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {grade && section && academicYear && term && (
        <TablePanel
          title={`${grade} - ${section} · ${academicYear} · ${term}`}
          actions={
            <Button size="sm" variant="organic" className="border-none" onClick={generateAll} disabled={!classStudents.length}>
              Generate All
            </Button>
          }
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-muted-foreground border-b border-border/60">
                <th className="py-2 px-3">Student</th>
                <th className="py-2 px-3">Student ID</th>
                <th className="py-2 px-3">Term Avg</th>
                <th className="py-2 px-3" />
              </tr>
            </thead>
            <tbody>
              {loadingRows ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-muted-foreground">Loading…</td>
                </tr>
              ) : (
                pagedRows.map((r) => (
                  <tr key={r.studentId} className="border-b border-border/40">
                    <td className="py-2 px-3 font-medium">{r.studentName}</td>
                    <td className="py-2 px-3 text-muted-foreground">
                      {classStudents.find((s) => s.id === r.studentId)?.studentId}
                    </td>
                    <td className="py-2 px-3">{r.average != null ? `${r.average}%` : '—'}</td>
                    <td className="py-2 px-3 text-right space-x-2">
                      <Button size="sm" variant="outline" onClick={() => preview(r.studentId)}>
                        Preview
                      </Button>
                      <Button size="sm" variant="primary" disabled={generating === r.studentId} onClick={() => generateOne(r.studentId)}>
                        {generating === r.studentId ? 'Generating…' : 'Generate PDF'}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {rows.length > 0 && (
            <Pagination
              className="mt-3"
              currentPage={rowsCurrentPage}
              totalPages={rowsTotalPages}
              onPageChange={setRowsPage}
              totalItems={rows.length}
              pageSize={ROWS_PAGE_SIZE}
              entityLabel="students"
            />
          )}
        </TablePanel>
      )}

      {previewDoc && (
        <ContentCard title="Preview">
          <ReportDocumentPreview template={template} doc={previewDoc} />
        </ContentCard>
      )}
    </div>
  );
}
