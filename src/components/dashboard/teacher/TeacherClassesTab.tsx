'use client';

import React from 'react';
import { MapPin, Clock, CalendarDays, Users } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { TEACHER_CLASS_ASSIGNMENTS, filterTeacherStudents } from '@/lib/teacherPortal';
import { AisPage, AisStatusBadge } from '@/components/dashboard/teacher/TeacherPortalUi';
import { aisBodyMd, aisBodySm, aisCard, aisDataLg, aisHeadlineSm } from '@/components/dashboard/teacher/aisStyles';

export const TeacherClassesTab: React.FC = () => {
  const { students } = useApp();

  return (
    <AisPage>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {TEACHER_CLASS_ASSIGNMENTS.map((a) => {
          const count = filterTeacherStudents(students, a.grade, a.section).length;
          return (
            <div key={a.id} className={`${aisCard} flex flex-col p-4`}>
              <div className="mb-3 border-b border-border pb-3">
                <h3 className={aisHeadlineSm}>
                  {a.grade} — Section {a.section}
                </h3>
                <p className={`${aisBodyMd} mt-0.5`}>{a.subject}</p>
              </div>
              <div className={`${aisBodySm} space-y-2`}>
                <p className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
                  <span className="font-semibold text-foreground">Room:</span> {a.room}
                </p>
                <p className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
                  <span className="font-semibold text-foreground">Period:</span> {a.period}
                </p>
                <p className="flex items-center gap-2">
                  <CalendarDays className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
                  <span className="font-semibold text-foreground">Schedule:</span> {a.days}
                </p>
              </div>
              <div className="mt-4 flex items-end justify-between border-t border-border pt-3">
                <div>
                  <span className={`${aisDataLg} text-primary`}>{count}</span>
                  <p className={aisBodySm}>students enrolled</p>
                </div>
                <AisStatusBadge variant="primary">
                  <Users className="h-3 w-3" aria-hidden />
                  Active
                </AisStatusBadge>
              </div>
            </div>
          );
        })}
      </div>
    </AisPage>
  );
};
