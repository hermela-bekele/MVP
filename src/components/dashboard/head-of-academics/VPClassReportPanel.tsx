'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { api } from '@/lib/api';
import { readStoredSession } from '@/lib/auth';
import { ContentCard } from '@/components/dashboard/ContentCard';
import { TablePanel } from '@/components/dashboard/TablePanel';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { generateReportDocumentPDF, type RenderableReportDoc } from '@/lib/reportCardPdf';
import { slugifyFilename } from '@/lib/pdfUtils';
import {
  DEFAULT_TEMPLATE,
  classRankingsForReport,
  mergeTemplateSettings,
  overallAverageFromRows,
  studentsForClassReport,
  subjectRowsForReportCard,
  type ReportCardTemplateSettings,
} from '@/lib/headOfAcademicsPortal';
import { percentToGpa } from '@/lib/teacherPortal';
import { ReportDocumentPreview } from './ReportDocumentPreview';

export function VPClassReportPanel() {
  const { classes, students, studentGradeEntries, schools } = useApp();
  const session = readStoredSession();
  const schoolId = session?.schoolId || 'sch-1';
  const school = schools.find((s) => s.id === schoolId);

  const [settings, setSettings] = useState<ReportCardTemplateSettings>(DEFAULT_TEMPLATE);
  const [grade, setGrade] = useState('');
  const [section, setSection] = useState('');
  const [term, setTerm] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [generating, setGenerating] = useState<string | null>(null);

  useEffect(() => {
    api
      .getSchoolSettings(schoolId)
      .then((s) => {
        const raw = (s as { report_card_template?: Partial<ReportCardTemplateSettings> }).report_card_template;
        setSettings(mergeTemplateSettings(raw));
      })
      .catch(() => setSettings(DEFAULT_TEMPLATE));
  }, [schoolId]);

  const gradeOptions = useMemo(
    () => Array.from(new Set(classes.map((c) => c.grade))).map((g) => ({ value: g, label: g })),
    [classes],
  );
  const sectionOptions = useMemo(
    () =>
      Array.from(new Set(classes.filter((c) => c.grade === grade).map((c) => c.section))).map((sec) => ({
        value: sec,
        label: sec,
      })),
    [classes, grade],
  );
  const termOptions = useMemo(
    () => Array.from(new Set(studentGradeEntries.map((e) => e.term))).map((t) => ({ value: t, label: t })),
    [studentGradeEntries],
  );

  const classStudents = useMemo(
    () => (grade && section ? studentsForClassReport(students, grade, section) : []),
    [students, grade, section],
  );

  const rankings = useMemo(
    () => (grade && section && term ? classRankingsForReport(students, studentGradeEntries, grade, section, term) : []),
    [students, studentGradeEntries, grade, section, term],
  );

  const buildDoc = (studentId: string): RenderableReportDoc | null => {
    const student = classStudents.find((s) => s.id === studentId);
    if (!student || !term) return null;
    const rows = subjectRowsForReportCard(studentGradeEntries, student.id, term);
    const averagePercent = overallAverageFromRows(rows);
    const rank = rankings.find((r) => r.studentId === student.id)?.rank ?? null;
    return {
      kind: 'report-card',
      schoolName: school?.name ?? 'School',
      student: {
        name: student.name,
        studentId: student.studentId,
        grade: student.grade,
        section: student.section,
        parentName: student.parentName,
      },
      term,
      subjectGroups: [
        {
          rows,
          averagePercent,
          gpa: averagePercent != null ? percentToGpa(averagePercent) : null,
        },
      ],
      rank,
      attendanceRate: student.attendanceRate,
    };
  };

  const generateOne = async (studentId: string) => {
    const doc = buildDoc(studentId);
    if (!doc) return;
    setGenerating(studentId);
    try {
      await generateReportDocumentPDF(
        settings.reportCard,
        doc,
        `${slugifyFilename(`${doc.student.name}-${term}-report-card`)}.pdf`,
      );
    } finally {
      setGenerating(null);
    }
  };

  const generateAll = async () => {
    for (const student of classStudents) {
      await generateOne(student.id);
    }
  };

  const previewDoc = selectedStudentId ? buildDoc(selectedStudentId) : null;

  return (
    <div className="space-y-6">
      <ContentCard title="Select class & term" description="Pick a class and term to generate report cards for">
        <div className="grid gap-3 sm:grid-cols-3">
          <Select
            label="Grade"
            placeholder="Select grade"
            options={gradeOptions}
            value={grade}
            onValueChange={(v) => {
              setGrade(v);
              setSection('');
              setSelectedStudentId('');
            }}
          />
          <Select
            label="Section"
            placeholder="Select section"
            options={sectionOptions}
            value={section}
            onValueChange={(v) => {
              setSection(v);
              setSelectedStudentId('');
            }}
            disabled={!grade}
          />
          <Select
            label="Term"
            placeholder="Select term"
            options={termOptions}
            value={term}
            onValueChange={setTerm}
          />
        </div>
      </ContentCard>

      {grade && section && term && (
        <TablePanel
          title={`${grade} - ${section} · ${term}`}
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
                <th className="py-2 px-3">Rank</th>
                <th className="py-2 px-3" />
              </tr>
            </thead>
            <tbody>
              {classStudents.map((s) => {
                const rows = subjectRowsForReportCard(studentGradeEntries, s.id, term);
                const avg = overallAverageFromRows(rows);
                const rank = rankings.find((r) => r.studentId === s.id)?.rank ?? null;
                return (
                  <tr key={s.id} className="border-b border-border/40">
                    <td className="py-2 px-3 font-medium">{s.name}</td>
                    <td className="py-2 px-3 text-muted-foreground">{s.studentId}</td>
                    <td className="py-2 px-3">{avg != null ? `${avg}%` : '—'}</td>
                    <td className="py-2 px-3">{rank != null ? `#${rank}` : '—'}</td>
                    <td className="py-2 px-3 text-right space-x-2">
                      <Button size="sm" variant="outline" onClick={() => setSelectedStudentId(s.id)}>
                        Preview
                      </Button>
                      <Button
                        size="sm"
                        variant="primary"
                        disabled={generating === s.id}
                        onClick={() => generateOne(s.id)}
                      >
                        {generating === s.id ? 'Generating…' : 'Generate PDF'}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TablePanel>
      )}

      {previewDoc && (
        <ContentCard title="Preview">
          <ReportDocumentPreview template={settings.reportCard} doc={previewDoc} />
        </ContentCard>
      )}
    </div>
  );
}
