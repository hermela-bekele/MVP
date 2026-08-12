'use client';

import React, { useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { getDemoTeacher } from '@/lib/teacherPortal';
import { AisBtnPrimary, AisBtnSecondary, AisPage, AisPanel } from '@/components/dashboard/teacher/TeacherPortalUi';
import { aisBodyMd, aisBodySm, aisLabelCaps } from '@/components/dashboard/teacher/aisStyles';
import {
  SELF_ASSESSMENT_COMPETENCIES,
  scoreSelfAssessment,
  type SelfAssessmentResponse,
} from '@/lib/selfAssessmentRubric';
import { CheckCircle2, RotateCcw } from 'lucide-react';

const RATING_LABELS: Record<number, string> = {
  1: 'Developing',
  2: 'Emerging',
  3: 'Proficient',
  4: 'Strong',
  5: 'Exemplary',
};

/**
 * STEP self-assessment rubric. Teachers self-rate 1-5 against nine competencies;
 * the result is recorded and visible to their HoD alongside AI gap-analysis data
 * so the HoD can decide what to assign on the Teacher Development page.
 */
export const StepSelfAssessment: React.FC = () => {
  const { teachers, currentUser, teacherSelfAssessments, submitSelfAssessment } = useApp();
  const teacher = getDemoTeacher(teachers, currentUser?.email, currentUser?.displayName);

  const latest = useMemo(() => {
    const mine = teacherSelfAssessments.filter((a) => a.teacherId === teacher.id);
    if (mine.length === 0) return undefined;
    return mine.reduce((a, b) => (a.submittedAt > b.submittedAt ? a : b));
  }, [teacherSelfAssessments, teacher.id]);

  const [isRetaking, setIsRetaking] = useState(false);
  const [ratings, setRatings] = useState<Record<string, number>>({});

  const groupedByCategory = useMemo(() => {
    const groups = new Map<string, typeof SELF_ASSESSMENT_COMPETENCIES>();
    for (const c of SELF_ASSESSMENT_COMPETENCIES) {
      const list = groups.get(c.category) ?? [];
      list.push(c);
      groups.set(c.category, list);
    }
    return Array.from(groups.entries());
  }, []);

  const allRated = SELF_ASSESSMENT_COMPETENCIES.every((c) => ratings[c.id] > 0);

  const handleSubmit = () => {
    const responses: SelfAssessmentResponse[] = SELF_ASSESSMENT_COMPETENCIES.map((c) => ({
      competencyId: c.id,
      rating: ratings[c.id] ?? 3,
    }));
    const { overallScore, weakestCompetencyId } = scoreSelfAssessment(responses);
    submitSelfAssessment({ teacherId: teacher.id, responses, overallScore, weakestCompetencyId });
    setIsRetaking(false);
    setRatings({});
  };

  if (latest && !isRetaking) {
    return (
      <AisPage>
        <AisPanel
          title="Your latest self-assessment"
          description={`Submitted ${new Date(latest.submittedAt).toLocaleDateString()} · shared with your HoD`}
          actions={
            <AisBtnSecondary onClick={() => setIsRetaking(true)}>
              <RotateCcw className="h-4 w-4" /> Retake
            </AisBtnSecondary>
          }
        >
          <div className="mb-6 flex items-center gap-4 rounded-xl border border-ais-card-border bg-ais-surface-container-low p-4">
            <div className="text-3xl font-bold text-ais-primary">{latest.overallScore}%</div>
            <div>
              <p className={aisLabelCaps}>Overall self-rating</p>
              <p className={aisBodySm}>
                Based on {latest.responses.length} competencies · 1 = developing, 5 = exemplary
              </p>
            </div>
          </div>
          <div className="space-y-4">
            {groupedByCategory.map(([category, items]) => (
              <div key={category}>
                <p className={`${aisLabelCaps} mb-2`}>{category}</p>
                <div className="space-y-2">
                  {items.map((c) => {
                    const r = latest.responses.find((res) => res.competencyId === c.id);
                    return (
                      <div
                        key={c.id}
                        className="flex items-center justify-between gap-3 rounded-lg border border-ais-card-border px-3 py-2"
                      >
                        <div>
                          <p className="text-sm font-semibold text-ais-on-surface">{c.label}</p>
                          <p className={aisBodySm}>{c.description}</p>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                            (r?.rating ?? 0) <= 2
                              ? 'bg-red-100 text-red-700'
                              : (r?.rating ?? 0) === 3
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {r?.rating ?? '—'}/5 · {RATING_LABELS[r?.rating ?? 0] ?? ''}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </AisPanel>
      </AisPage>
    );
  }

  return (
    <AisPage>
      <AisPanel
        title="STEP self-assessment"
        description="Rate yourself honestly on each competency. Your HoD will use this alongside AI gap-analysis on your students' results to assign the right training — not to judge you."
      >
        <div className="space-y-6">
          {groupedByCategory.map(([category, items]) => (
            <div key={category}>
              <p className={`${aisLabelCaps} mb-3`}>{category}</p>
              <div className="space-y-3">
                {items.map((c) => (
                  <div key={c.id} className="rounded-xl border border-ais-card-border p-3">
                    <p className="text-sm font-semibold text-ais-on-surface">{c.label}</p>
                    <p className={`${aisBodySm} mb-2.5`}>{c.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setRatings((prev) => ({ ...prev, [c.id]: n }))}
                          className={`flex flex-col items-center rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                            ratings[c.id] === n
                              ? 'border-ais-primary bg-ais-primary text-white'
                              : 'border-ais-card-border text-ais-on-surface-variant hover:border-ais-primary/50'
                          }`}
                        >
                          <span>{n}</span>
                          <span className="text-[10px] font-normal">{RATING_LABELS[n]}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="flex items-center justify-between border-t border-ais-card-border pt-4">
            <p className={aisBodyMd}>
              {Object.keys(ratings).length}/{SELF_ASSESSMENT_COMPETENCIES.length} rated
            </p>
            <div className="flex gap-2">
              {isRetaking && <AisBtnSecondary onClick={() => setIsRetaking(false)}>Cancel</AisBtnSecondary>}
              <AisBtnPrimary onClick={handleSubmit} disabled={!allRated}>
                <CheckCircle2 className="h-4 w-4" /> Submit self-assessment
              </AisBtnPrimary>
            </div>
          </div>
        </div>
      </AisPanel>
    </AisPage>
  );
};
