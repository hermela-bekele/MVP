'use client';

import React, { useMemo } from 'react';
import { GraduationCap } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { getDemoTeacher } from '@/lib/teacherPortal';
import { AisPage, AisStatusBadge, approvalBadgeVariant } from '@/components/dashboard/teacher/TeacherPortalUi';
import {
  aisBodySm,
  aisCard,
  aisDataMd,
  aisDisplayMd,
  aisLabelCaps,
} from '@/components/dashboard/teacher/aisStyles';
import { CircularProgress } from '@/components/ui/progress';

const autoCardGrid =
  'grid gap-3 grid-cols-[repeat(auto-fill,minmax(min(100%,260px),1fr))]';

export const TeacherTrainingTab: React.FC<{ typeFilter: string }> = ({ typeFilter }) => {
  const { trainings, trainingMaterials, teachers } = useApp();
  const teacher = getDemoTeacher(teachers);

  const filteredMaterials = useMemo(() => {
    if (typeFilter === 'All') return trainingMaterials;
    return trainingMaterials.filter((m) => m.trainingType === typeFilter || m.category === typeFilter);
  }, [trainingMaterials, typeFilter]);

  return (
    <AisPage>
      <div className={`${aisCard} flex w-full items-center justify-between gap-6 p-4`}>
        <div className="min-w-0 space-y-1.5">
          <h2 className={aisDisplayMd}>MOE training progress</h2>
          <p className="flex items-center gap-1.5 text-sm font-semibold text-ais-on-surface">
            <GraduationCap className="h-4 w-4 shrink-0 text-ais-primary" aria-hidden />
            <span className="truncate">{teacher.certification}</span>
          </p>
        </div>

        <CircularProgress
          value={teacher.trainingProgress}
          size={72}
          strokeWidth={7}
          strokeClassName="stroke-ais-primary"
          trackClassName="stroke-ais-primary/15"
          valueClassName="text-sm font-bold tabular-nums text-ais-primary"
          label="Your MOE training progress"
        />
      </div>

      <section className="space-y-3">
        <p className={aisLabelCaps}>Training materials</p>
        <div className={autoCardGrid}>
          {filteredMaterials.map((m) => (
            <div key={m.id} className={`${aisCard} flex flex-col gap-3 p-4`}>
              <div className="min-w-0 flex-1">
                <p className={`${aisDataMd} line-clamp-2 font-bold leading-snug`}>{m.title}</p>
                <p className={`${aisBodySm} mt-1.5`}>{m.trainingType ?? m.category}</p>
                <p className={`${aisBodySm} mt-0.5 text-ais-on-surface-variant/80`}>
                  Uploaded {m.uploadedAt}
                </p>
              </div>
              <AisStatusBadge variant="neutral" className="self-start">
                {m.category}
              </AisStatusBadge>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <p className={aisLabelCaps}>MOE course catalog</p>
        <div className={autoCardGrid}>
          {trainings.map((tr) => {
            const enrollmentPct =
              tr.totalCount > 0 ? Math.round((tr.completedCount / tr.totalCount) * 100) : 0;

            return (
              <div key={tr.id} className={`${aisCard} flex flex-col gap-3 p-4`}>
                <AisStatusBadge variant={approvalBadgeVariant(tr.status)} className="self-start">
                  {tr.status}
                </AisStatusBadge>
                <div className="min-w-0 flex-1">
                  <p className={`${aisDataMd} line-clamp-2 font-bold leading-snug`}>{tr.title}</p>
                  <p className={`${aisBodySm} mt-1.5 truncate`}>{tr.instructor}</p>
                  <p className={`${aisBodySm} mt-0.5 text-ais-on-surface-variant/80`}>
                    {tr.duration} · Starts {tr.startDate}
                  </p>
                </div>
                <div className="mt-auto space-y-1.5 border-t border-ais-card-border pt-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className={aisBodySm}>Enrollment</span>
                    <span className="text-xs font-bold tabular-nums text-ais-primary">{enrollmentPct}%</span>
                  </div>
                  <div
                    className="h-1.5 overflow-hidden rounded-full bg-ais-primary/10"
                    role="progressbar"
                    aria-valuenow={tr.completedCount}
                    aria-valuemin={0}
                    aria-valuemax={tr.totalCount}
                    aria-label={`${tr.completedCount} of ${tr.totalCount} teachers enrolled`}
                  >
                    <div
                      className="h-full rounded-full bg-ais-primary transition-all duration-500"
                      style={{ width: `${enrollmentPct}%` }}
                    />
                  </div>
                  <p className={`${aisBodySm} text-ais-on-surface-variant/80`}>
                    {tr.completedCount.toLocaleString()} of {tr.totalCount.toLocaleString()} teachers
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </AisPage>
  );
};
