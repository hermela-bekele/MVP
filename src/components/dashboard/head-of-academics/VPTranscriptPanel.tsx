'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { api } from '@/lib/api';
import { readStoredSession } from '@/lib/auth';
import { ContentCard } from '@/components/dashboard/ContentCard';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { generateReportDocumentPDF, type RenderableReportDoc } from '@/lib/reportCardPdf';
import { slugifyFilename } from '@/lib/pdfUtils';
import {
  DEFAULT_TEMPLATE,
  mergeTemplateSettings,
  transcriptRowsForStudent,
  type ReportCardTemplateSettings,
} from '@/lib/headOfAcademicsPortal';
import { percentToGpa } from '@/lib/teacherPortal';
import { ReportDocumentPreview } from './ReportDocumentPreview';

export function VPTranscriptPanel() {
  const { students, studentGradeEntries, schools } = useApp();
  const session = readStoredSession();
  const schoolId = session?.schoolId || 'sch-1';
  const school = schools.find((s) => s.id === schoolId);

  const [settings, setSettings] = useState<ReportCardTemplateSettings>(DEFAULT_TEMPLATE);
  const [grade, setGrade] = useState('');
  const [section, setSection] = useState('');
  const [studentId, setStudentId] = useState('');
  const [generating, setGenerating] = useState(false);

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
    () => Array.from(new Set(students.map((s) => s.grade))).map((g) => ({ value: g, label: g })),
    [students],
  );
  const sectionOptions = useMemo(
    () =>
      Array.from(new Set(students.filter((s) => s.grade === grade).map((s) => s.section))).map((sec) => ({
        value: sec,
        label: sec,
      })),
    [students, grade],
  );
  const studentOptions = useMemo(
    () =>
      students
        .filter((s) => (!grade || s.grade === grade) && (!section || s.section === section))
        .map((s) => ({ value: s.id, label: `${s.name} (${s.studentId})` })),
    [students, grade, section],
  );

  const student = students.find((s) => s.id === studentId);
  const termGroups = useMemo(
    () => (studentId ? transcriptRowsForStudent(studentGradeEntries, studentId) : []),
    [studentGradeEntries, studentId],
  );

  const overallGpa = useMemo(() => {
    const gpas = termGroups.map((g) => g.termGpa).filter((g): g is number => g != null);
    return gpas.length ? gpas.reduce((a, b) => a + b, 0) / gpas.length : null;
  }, [termGroups]);

  const doc: RenderableReportDoc | null = useMemo(() => {
    if (!student) return null;
    return {
      kind: 'transcript',
      schoolName: school?.name ?? 'School',
      student: {
        name: student.name,
        studentId: student.studentId,
        grade: student.grade,
        section: student.section,
        parentName: student.parentName,
      },
      subjectGroups: termGroups.map((g) => ({
        term: g.term,
        rows: g.subjects,
        averagePercent: g.termAveragePercent,
        gpa: g.termGpa,
      })),
      overallGpa,
      attendanceRate: student.attendanceRate,
    };
  }, [student, termGroups, overallGpa, school]);

  const generate = async () => {
    if (!doc || !student) return;
    setGenerating(true);
    try {
      await generateReportDocumentPDF(
        settings.transcript,
        doc,
        `${slugifyFilename(`${student.name}-transcript`)}.pdf`,
      );
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <ContentCard title="Select student" description="Filter by grade/section, then pick a student">
        <div className="grid gap-3 sm:grid-cols-3">
          <Select
            label="Grade (optional)"
            placeholder="All grades"
            options={gradeOptions}
            value={grade}
            onValueChange={(v) => {
              setGrade(v);
              setSection('');
              setStudentId('');
            }}
          />
          <Select
            label="Section (optional)"
            placeholder="All sections"
            options={sectionOptions}
            value={section}
            onValueChange={(v) => {
              setSection(v);
              setStudentId('');
            }}
            disabled={!grade}
          />
          <Select
            label="Student"
            placeholder="Select student"
            options={studentOptions}
            value={studentId}
            onValueChange={setStudentId}
          />
        </div>
      </ContentCard>

      {doc && (
        <>
          <div className="flex justify-end">
            <Button variant="organic" className="border-none" disabled={generating} onClick={generate}>
              {generating ? 'Generating…' : 'Generate Transcript PDF'}
            </Button>
          </div>
          <ContentCard title="Preview">
            <ReportDocumentPreview template={settings.transcript} doc={doc} />
          </ContentCard>
        </>
      )}
    </div>
  );
}
