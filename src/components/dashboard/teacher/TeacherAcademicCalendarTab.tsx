'use client';

import React from 'react';
import { AisPage, AisPanel } from '@/components/dashboard/teacher/TeacherPortalUi';
import { PublishedAcademicCalendarPanel } from '@/components/dashboard/PublishedAcademicCalendarPanel';
import { useApp } from '@/context/AppContext';
import { resolveTeacherProfile, DEMO_SCHOOL_ID } from '@/lib/teacherPortal';

export const TeacherAcademicCalendarTab: React.FC = () => {
  const { teachers, resolveTeacherId } = useApp();
  const teacher = resolveTeacherProfile(teachers, resolveTeacherId());
  const schoolId = teacher.schoolId || DEMO_SCHOOL_ID;

  return (
    <AisPage>
      <AisPanel
        title="School academic calendar"
        description="Official calendar from your school head — month view with Ethiopian dates, MOE activities, and working-day analysis."
        flush
      >
        <div className="p-4">
          <PublishedAcademicCalendarPanel schoolId={schoolId} showWorkingDays />
        </div>
      </AisPanel>
    </AisPage>
  );
};
