'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Select } from '@/components/ui/select';
import { GradeGapAnalysisPanel } from '@/components/dashboard/teacher/GradeGapAnalysisPanel';
import { isSubjectTeacher, resolveDeptHeadScope } from '@/lib/departmentHead';
import {
  GRADE_OPTIONS,
  SECTION_OPTIONS,
  normalizeGradeLabel,
} from '@/lib/teacherPortal';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

/** HoD: grade → teacher (for that grade) → assessment with results → AI gap analysis. */
export function DeptGapAnalysisPanel() {
  const { currentUser, teachers, studentGradeEntries, assessments } = useApp();
  const scope = useMemo(() => resolveDeptHeadScope(currentUser), [currentUser]);

  const deptTeachers = useMemo(
    () =>
      scope ? teachers.filter((t) => isSubjectTeacher(t, scope) && t.status === 'Active') : [],
    [teachers, scope],
  );

  const gradeOptions = useMemo(() => {
    const grades = new Set<string>();
    for (const t of deptTeachers) {
      for (const g of t.grades || []) {
        if (g?.trim()) grades.add(g.trim());
      }
    }
    // Include grades that already have recorded results in the department
    const deptIds = new Set(deptTeachers.map((t) => t.id));
    for (const e of studentGradeEntries) {
      if (deptIds.has(e.teacherId) && e.gradeLevel?.trim()) grades.add(e.gradeLevel.trim());
    }
    const list = [...grades].sort((a, b) => {
      const an = Number(normalizeGradeLabel(a).replace(/\D/g, '')) || 0;
      const bn = Number(normalizeGradeLabel(b).replace(/\D/g, '')) || 0;
      return an - bn || a.localeCompare(b);
    });
    return list.length ? list : GRADE_OPTIONS;
  }, [deptTeachers, studentGradeEntries]);

  const [classGrade, setClassGrade] = useState(() => gradeOptions[0] ?? 'Grade 9');
  const [classSection, setClassSection] = useState('A');
  const [teacherId, setTeacherId] = useState('');

  useEffect(() => {
    if (gradeOptions.length && !gradeOptions.includes(classGrade)) {
      setClassGrade(gradeOptions[0]);
    }
  }, [gradeOptions, classGrade]);

  const teachersForGrade = useMemo(() => {
    const gradeKey = normalizeGradeLabel(classGrade);
    return deptTeachers.filter((t) =>
      (t.grades || []).some((g) => normalizeGradeLabel(g) === gradeKey),
    );
  }, [deptTeachers, classGrade]);

  useEffect(() => {
    if (!teachersForGrade.length) {
      setTeacherId('');
      return;
    }
    if (!teachersForGrade.some((t) => t.id === teacherId)) {
      setTeacherId(teachersForGrade[0].id);
    }
  }, [teachersForGrade, teacherId]);

  const classEntries = useMemo(() => {
    if (!teacherId) return [];
    return studentGradeEntries.filter(
      (e) =>
        e.teacherId === teacherId &&
        normalizeGradeLabel(e.gradeLevel) === normalizeGradeLabel(classGrade) &&
        e.section === classSection,
    );
  }, [studentGradeEntries, teacherId, classGrade, classSection]);

  const teacherAssessments = useMemo(() => {
    if (!teacherId) return [];
    const sub = (scope?.subject || '').toLowerCase();
    const gradeKey = normalizeGradeLabel(classGrade);
    return assessments.filter((a) => {
      if (normalizeGradeLabel(a.grade) !== gradeKey) return false;
      if (a.teacherId === teacherId) return true;
      if (!sub) return false;
      return a.subject.toLowerCase().includes(sub) || sub.includes(a.subject.toLowerCase());
    });
  }, [assessments, teacherId, scope?.subject, classGrade]);

  if (!scope) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold">Gap analysis from student results</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-2">
        <div className="grid gap-3 sm:grid-cols-3">
          <Select
            label="Grade"
            options={gradeOptions.map((g) => ({ value: g, label: g }))}
            value={classGrade}
            onChange={(e) => setClassGrade(e.target.value)}
          />
          <Select
            label="Section"
            options={SECTION_OPTIONS.map((s) => ({ value: s, label: `Section ${s}` }))}
            value={classSection}
            onChange={(e) => setClassSection(e.target.value)}
          />
          <Select
            label="Teacher"
            options={
              teachersForGrade.length
                ? teachersForGrade.map((t) => ({ value: t.id, label: t.name }))
                : [{ value: '', label: 'No teachers for this grade' }]
            }
            value={teacherId}
            onChange={(e) => setTeacherId(e.target.value)}
            disabled={!teachersForGrade.length}
          />
        </div>

        {!teacherId ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            Select a grade and teacher to see assessments with recorded results.
          </p>
        ) : (
          <GradeGapAnalysisPanel
            classEntries={classEntries}
            assessments={teacherAssessments}
            teacherId={teacherId}
            classGrade={classGrade}
            classSection={classSection}
            defaultSubject={scope.subject || 'Subject'}
            viewerRole="department-head"
          />
        )}
      </CardContent>
    </Card>
  );
}
