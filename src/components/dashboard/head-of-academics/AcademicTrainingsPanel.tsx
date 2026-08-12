'use client';

import React from 'react';
import { TeacherTrainingTab } from '@/components/dashboard/teacher/TeacherTrainingTab';

export function AcademicTrainingsPanel() {
  return (
    <div className="animate-fade-in text-left">
      <TeacherTrainingTab typeFilter="all" activeTabType="training-continuous" />
    </div>
  );
}
