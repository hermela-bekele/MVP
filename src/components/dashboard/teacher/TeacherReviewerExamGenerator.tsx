'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Select } from '@/components/ui/select';
import { DEPT_SCHOOL_ID, subjectForDepartmentId, type DeptHeadScope } from '@/lib/departmentHead';
import { portalTabPath } from '@/lib/portalPaths';
import { api } from '@/lib/api';
import { DeptAssessmentGenerator } from '@/components/dashboard/department-head/DeptAssessmentGenerator';

type ReviewerDept = { departmentId: string; departmentName?: string };

/** Lets a designated exam reviewer generate a Mid/Final Exam "as HoD" for a department
 * they review — same generator the department head uses, scoped to the reviewer's
 * department(s) instead of resolveDeptHeadScope(currentUser). */
export function TeacherReviewerExamGenerator() {
  const [depts, setDepts] = useState<ReviewerDept[] | null>(null);
  const [selectedDeptId, setSelectedDeptId] = useState('');

  useEffect(() => {
    let cancelled = false;
    api
      .listMyAssessmentReviewerDepartments()
      .then((rows) => {
        if (cancelled) return;
        const list = rows as ReviewerDept[];
        setDepts(list);
        if (list[0]) setSelectedDeptId(list[0].departmentId);
      })
      .catch(() => {
        if (!cancelled) setDepts([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const scopeOverride: DeptHeadScope | null = useMemo(() => {
    if (!selectedDeptId) return null;
    return {
      departmentId: selectedDeptId,
      subject: subjectForDepartmentId(selectedDeptId),
      schoolId: DEPT_SCHOOL_ID,
    };
  }, [selectedDeptId]);

  if (depts === null) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  if (depts.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        You are not currently designated as an exam reviewer for any department.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {depts.length > 1 && (
        <div className="max-w-xs">
          <Select
            label="Department"
            value={selectedDeptId}
            onValueChange={setSelectedDeptId}
            options={depts.map((d) => ({
              value: d.departmentId,
              label: d.departmentName || d.departmentId,
            }))}
          />
        </div>
      )}
      {scopeOverride && (
        <DeptAssessmentGenerator
          key={scopeOverride.departmentId}
          scopeOverride={scopeOverride}
          backPath={portalTabPath('teacher', 'assessments')}
        />
      )}
    </div>
  );
}
