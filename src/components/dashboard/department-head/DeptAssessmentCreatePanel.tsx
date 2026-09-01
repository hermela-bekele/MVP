'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { FilePlus } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { filterDeptTeachingNotes, resolveDeptHeadScope } from '@/lib/departmentHead';
import { normalizeGradeLabel } from '@/lib/teacherPortal';

/** HoD entry point for creating department exams from topics teachers marked as delivered. */
export function DeptAssessmentCreatePanel() {
  const router = useRouter();
  const { currentUser, teachers, teachingNotes, lessonDeliveries } = useApp();
  const scope = useMemo(() => resolveDeptHeadScope(currentUser), [currentUser]);
  const subject = scope?.subject || 'Mathematics';

  const deliveredTopicCount = useMemo(() => {
    if (!scope) return 0;
    const notes = filterDeptTeachingNotes(teachingNotes, teachers, scope).filter(
      (n) =>
        normalizeGradeLabel(n.grade) === normalizeGradeLabel('Grade 11') &&
        (n.status === 'Approved' || lessonDeliveries.some((d) => d.teachingNoteId === n.id)),
    );
    return notes.filter((n) => lessonDeliveries.some((d) => d.teachingNoteId === n.id)).length;
  }, [scope, teachingNotes, teachers, lessonDeliveries]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle className="text-sm font-semibold">Generate department exams</CardTitle>
        </div>
        <Button
          type="button"
          variant="organic"
          size="sm"
          className="shrink-0 gap-1.5 border-none text-xs"
          onClick={() => router.push('/dashboard/department-head/assessments/generate')}
        >
          <FilePlus className="h-3.5 w-3.5" />
          New exam
        </Button>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">
          Subject scope: <strong>{subject}</strong>
          {deliveredTopicCount > 0
            ? ` · ${deliveredTopicCount} delivered topic${deliveredTopicCount === 1 ? '' : 's'} available`
            : ''}
        </p>
      </CardContent>
    </Card>
  );
}
