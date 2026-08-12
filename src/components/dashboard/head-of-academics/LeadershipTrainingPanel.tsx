'use client';

import React from 'react';
import { TeacherTrainingTab } from '@/components/dashboard/teacher/TeacherTrainingTab';

export function LeadershipTrainingPanel() {
  return (
    <div className="animate-fade-in text-left">
      <TeacherTrainingTab typeFilter="all" activeTabType="leadership-development" />
    </div>
  );
}
