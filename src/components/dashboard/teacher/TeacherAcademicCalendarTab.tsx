'use client';

import React from 'react';
import { AisPage } from '@/components/dashboard/teacher/TeacherPortalUi';
import { PublishedAcademicCalendarPanel } from '@/components/dashboard/PublishedAcademicCalendarPanel';
import { useApp } from '@/context/AppContext';
import { resolveTeacherProfile, DEMO_SCHOOL_ID } from '@/lib/teacherPortal';

export const TeacherAcademicCalendarTab: React.FC = () => {
  const { teachers, resolveTeacherId } = useApp();
  const teacher = resolveTeacherProfile(teachers, resolveTeacherId());
  const schoolId = teacher.schoolId || DEMO_SCHOOL_ID;

  return (
    <AisPage>
      <PublishedAcademicCalendarPanel schoolId={schoolId} showWorkingDays />
    </AisPage>
  );
};
