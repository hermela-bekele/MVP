'use client';

import React, { useState, useMemo } from 'react';
import { GraduationCap } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Select } from '@/components/ui/select';
import { getDemoTeacher, TRAINING_TYPE_FILTERS } from '@/lib/teacherPortal';
import { AisPage, AisStatusBadge, approvalBadgeVariant } from '@/components/dashboard/teacher/TeacherPortalUi';
import {
  aisBodyMd,
  aisBodySm,
  aisCard,
  aisDataMd,
  aisHeadlineSm,
  aisLabelCaps,
  aisListRow,
} from '@/components/dashboard/teacher/aisStyles';
import { MetricProgressRow } from '@/components/ui/metric-progress-row';

export const TeacherTrainingTab: React.FC = () => {
  const { trainings, trainingMaterials, teachers } = useApp();
  const teacher = getDemoTeacher(teachers);
  const [typeFilter, setTypeFilter] = useState<string>('All');

  const filteredMaterials = useMemo(() => {
    if (typeFilter === 'All') return trainingMaterials;
    return trainingMaterials.filter((m) => m.trainingType === typeFilter || m.category === typeFilter);
  }, [trainingMaterials, typeFilter]);

  return (
    <AisPage>
      <div className={`${aisCard} border-ais-primary/20 bg-ais-primary/5 p-4`}>
        <MetricProgressRow
          label="Your MOE training progress"
          value={teacher.trainingProgress}
          valueDisplay={`${teacher.trainingProgress}% complete`}
          barClassName="bg-ais-primary"
        />
        <p className={`${aisBodySm} mt-2 flex items-center gap-1.5`}>
          <GraduationCap className="h-3.5 w-3.5 text-ais-primary" aria-hidden />
          Certification: {teacher.certification}
        </p>
      </div>

      <div className="max-w-xs">
        <Select
          variant="ais"
          label="Filter by training type"
          options={TRAINING_TYPE_FILTERS.map((t) => ({ value: t, label: t }))}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        />
      </div>

      <section className="space-y-3">
        <p className={aisLabelCaps}>Training materials</p>
        {filteredMaterials.map((m) => (
          <div key={m.id} className={`${aisListRow} flex justify-between gap-4`}>
            <div>
              <p className={`${aisDataMd} font-bold`}>{m.title}</p>
              <p className={`${aisBodySm} mt-1`}>
                {m.trainingType ?? m.category} · Uploaded {m.uploadedAt}
              </p>
            </div>
            <AisStatusBadge variant="neutral">{m.category}</AisStatusBadge>
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <p className={aisLabelCaps}>MOE course catalog</p>
        {trainings.map((tr) => (
          <div key={tr.id} className={`${aisCard} flex justify-between gap-4 p-4`}>
            <div className="space-y-1">
              <p className={`${aisDataMd} font-bold`}>{tr.title}</p>
              <p className={aisBodySm}>
                {tr.instructor} · {tr.duration} · Starts {tr.startDate}
              </p>
            </div>
            <div className="text-right">
              <AisStatusBadge variant={approvalBadgeVariant(tr.status)}>{tr.status}</AisStatusBadge>
              <p className={`${aisBodySm} mt-2 font-mono tabular-nums`}>
                {tr.completedCount}/{tr.totalCount} teachers
              </p>
            </div>
          </div>
        ))}
      </section>
    </AisPage>
  );
};
