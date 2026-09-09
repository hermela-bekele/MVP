'use client';

import React, { useMemo, useState } from 'react';
import { CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { getDemoTeacher } from '@/lib/teacherPortal';
import { AisPage } from '@/components/dashboard/teacher/TeacherPortalUi';
import { aisBodyMd, aisBodySm, aisCard, aisHeadlineSm } from '@/components/dashboard/teacher/aisStyles';

/**
 * TR-007: only assignments the backend has actually marked 'completed' appear here —
 * that status is only ever set once sessions, assessment, and reflection are all done
 * (enforced in PATCH /teacher-training-assignments/:id/progress), so this list is real
 * evidence of finished learning, not just "assessment passed."
 */
export const TeacherCompletedTrainingTab: React.FC = () => {
  const { teachers, currentUser, teacherTrainingAssignments } = useApp();
  const teacher = getDemoTeacher(teachers, currentUser?.email, currentUser?.displayName);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const completed = useMemo(
    () =>
      teacherTrainingAssignments
        .filter((a) => a.teacherId === teacher.id && a.status === 'completed')
        .sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? '')),
    [teacherTrainingAssignments, teacher.id],
  );

  if (completed.length === 0) {
    return (
      <AisPage>
        <div className={`${aisCard} p-8 text-center`}>
          <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className={`${aisBodyMd} font-semibold`}>No completed training yet.</p>
          <p className={aisBodySm}>
            A module appears here once its sessions, final assessment, and reflection are all done.
          </p>
        </div>
      </AisPage>
    );
  }

  return (
    <AisPage>
      <div className="space-y-3">
        {completed.map((a) => {
          const expanded = expandedId === a.id;
          return (
            <div key={a.id} className={`${aisCard} overflow-hidden`}>
              <button
                type="button"
                className="flex w-full items-center justify-between gap-3 p-4 text-left"
                onClick={() => setExpandedId(expanded ? null : a.id)}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                    <h3 className={`${aisHeadlineSm} !text-title truncate`}>{a.moduleTitle}</h3>
                  </div>
                  <p className={`${aisBodySm} mt-1`}>
                    {a.program} · Completed {a.completedAt?.slice(0, 10) ?? '—'} · Assessment{' '}
                    {a.assessmentScore != null ? `${a.assessmentScore}%` : '—'}
                  </p>
                </div>
                {expanded ? (
                  <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
              </button>
              {expanded && (
                <div className="space-y-3 border-t border-ais-card-border p-4">
                  <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                    <div>
                      <p className={aisBodySm}>Sessions</p>
                      <p className="font-semibold">
                        {a.sessionsCompleted}
                        {a.sessionsTotal != null ? `/${a.sessionsTotal}` : ''}
                      </p>
                    </div>
                    <div>
                      <p className={aisBodySm}>Assessment</p>
                      <p className="font-semibold">
                        {a.assessmentPassed ? 'Passed' : 'Not passed'} ({a.assessmentScore ?? '—'}%)
                      </p>
                    </div>
                    <div>
                      <p className={aisBodySm}>Assigned by</p>
                      <p className="font-semibold">{a.assignedByName}</p>
                    </div>
                    <div>
                      <p className={aisBodySm}>Completed</p>
                      <p className="font-semibold">{a.completedAt?.slice(0, 10) ?? '—'}</p>
                    </div>
                  </div>
                  {a.reflectionAnswers && Object.keys(a.reflectionAnswers).length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                        Teacher Reflection
                      </p>
                      {Object.entries(a.reflectionAnswers).map(([idx, text]) => (
                        <p key={idx} className={`${aisBodySm} rounded-lg bg-ais-surface-container-low/60 p-3`}>
                          {text}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </AisPage>
  );
};
