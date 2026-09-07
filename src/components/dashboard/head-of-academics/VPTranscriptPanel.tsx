'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { ApiError } from '@/lib/api';
import { readStoredSession } from '@/lib/auth';
import { ContentCard } from '@/components/dashboard/ContentCard';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { generateReportDocumentPDF, type RenderableReportDoc } from '@/lib/reportCardPdf';
import { slugifyFilename } from '@/lib/pdfUtils';
import { DEFAULT_TEMPLATE, mergeTemplateSettings, type ReportCardTemplate } from '@/lib/headOfAcademicsPortal';
import { GRADE_OPTIONS } from '@/lib/teacherPortal';
import { academicResultsApi, type TranscriptData } from '@/lib/academicResults';
import { ReportDocumentPreview } from './ReportDocumentPreview';

export function VPTranscriptPanel() {
  const { students, schools } = useApp();
  const session = readStoredSession();
  const schoolId = session?.schoolId || 'sch-1';
  const school = schools.find((s) => s.id === schoolId);

  const [template, setTemplate] = useState<ReportCardTemplate>(DEFAULT_TEMPLATE.transcript);
  const [grade, setGrade] = useState('');
  const [section, setSection] = useState('');
  const [studentId, setStudentId] = useState('');
  const [fromGrade, setFromGrade] = useState(GRADE_OPTIONS[0]);
  const [toGrade, setToGrade] = useState(GRADE_OPTIONS[GRADE_OPTIONS.length - 1]);
  const [generating, setGenerating] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    academicResultsApi
      .getActiveReportTemplate('transcript', schoolId)
      .then((t) => setTemplate(mergeTemplateSettings({ transcript: t.config as unknown as ReportCardTemplate }).transcript))
      .catch(() => setTemplate(DEFAULT_TEMPLATE.transcript));
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
  const gradeRangeOptions = GRADE_OPTIONS.map((g) => ({ value: g, label: g }));

  const student = students.find((s) => s.id === studentId);

  useEffect(() => {
    setTranscript(null);
    if (!studentId || !fromGrade || !toGrade) return;
    setLoading(true);
    setError(null);
    academicResultsApi
      .getTranscript({ studentId, fromGrade, toGrade, schoolId })
      .then(setTranscript)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load transcript.'))
      .finally(() => setLoading(false));
  }, [studentId, fromGrade, toGrade, schoolId]);

  const doc: RenderableReportDoc | null = useMemo(() => {
    if (!student || !transcript) return null;
    return {
      kind: 'transcript',
      schoolName: school?.name ?? 'School',
      student: { name: student.name, studentId: student.studentId, grade: student.grade, section: student.section, parentName: student.parentName },
      subjectGroups: transcript.grades.flatMap((g) =>
        g.terms.map((t) => ({
          term: `${g.gradeLevel}${g.academicYear ? ` (${g.academicYear})` : ''} — ${t.term}`,
          rows: t.subjects.map((s) => ({ subject: s.subject, entries: [], averagePercent: s.averagePercent, letterGrade: null })),
          averagePercent: t.termAveragePercent,
          gpa: null,
        })),
      ),
      overallGpa: null,
      rank: transcript.grades[transcript.grades.length - 1]?.rank ?? null,
      rankPopulation: transcript.grades[transcript.grades.length - 1]?.rankPopulation ?? null,
      attendanceRate: student.attendanceRate,
    };
  }, [student, transcript, school]);

  const generate = async () => {
    if (!doc || !student) return;
    setGenerating(true);
    try {
      await generateReportDocumentPDF(template, doc, `${slugifyFilename(`${student.name}-transcript`)}.pdf`);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <ContentCard title="Select student" description="Filter by grade/section, then pick a student and grade range">
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
          <Select label="Student" placeholder="Select student" options={studentOptions} value={studentId} onValueChange={setStudentId} />
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Select label="From grade" options={gradeRangeOptions} value={fromGrade} onValueChange={setFromGrade} />
          <Select label="To grade" options={gradeRangeOptions} value={toGrade} onValueChange={setToGrade} />
        </div>
      </ContentCard>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {loading && <p className="text-sm text-muted-foreground">Loading transcript…</p>}

      {doc && (
        <>
          <div className="flex justify-end">
            <Button variant="organic" className="border-none" disabled={generating} onClick={generate}>
              {generating ? 'Generating…' : 'Generate Transcript PDF'}
            </Button>
          </div>
          <ContentCard title="Preview">
            <ReportDocumentPreview template={template} doc={doc} />
          </ContentCard>
        </>
      )}

      {!loading && studentId && transcript && transcript.grades.length === 0 && (
        <p className="text-sm text-muted-foreground">No finalized results found for {fromGrade}–{toGrade}.</p>
      )}
    </div>
  );
}
