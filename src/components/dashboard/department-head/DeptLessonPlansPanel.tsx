'use client';

import React, { useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { TablePanel } from '@/components/dashboard/TablePanel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogFooter } from '@/components/ui/dialog';
import { filterBySubjectScope, type DeptHeadScope } from '@/lib/departmentHead';
import { weeklyPlanStatusLabel } from '@/lib/teacherPortal';
import { DetailedLessonPlanRenderer } from '@/components/ui/DetailedLessonPlanRenderer';
import type { AIDetailedLessonPlanResult } from '@/lib/ai';

interface DeptLessonPlansPanelProps {
  scope: DeptHeadScope | null;
}

export const DeptLessonPlansPanel: React.FC<DeptLessonPlansPanelProps> = ({ scope }) => {
  const { lessonPlans, teachers, approveLessonPlan, rejectLessonPlan } = useApp();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [comments, setComments] = useState('');
  const [open, setOpen] = useState(false);

  const plans = useMemo(() => {
    if (!scope) return [];
    return filterBySubjectScope(lessonPlans, scope).filter(
      (p) => p.planType !== 'yearly' && p.createdByRole !== 'department-head',
    );
  }, [lessonPlans, scope]);

  const pending = plans.filter((p) => p.status === 'Pending Dept Head');
  const recent = plans.filter((p) => p.status !== 'Pending Dept Head').slice(0, 20);
  const selected = plans.find((p) => p.id === selectedId);

  const parsedDetail = useMemo(() => {
    if (!selected?.planDetail) return null;
    try {
      return JSON.parse(selected.planDetail) as AIDetailedLessonPlanResult;
    } catch {
      return null;
    }
  }, [selected]);

  const openReview = (id: string) => {
    setSelectedId(id);
    setComments('');
    setOpen(true);
  };

  return (
    <div className="space-y-6">
      <TablePanel
        title="Pending weekly plans"
        description={`${pending.length} plan${pending.length === 1 ? '' : 's'} awaiting review. Your approval is final — no school head step.`}
      >
        <table className="eskooly-table w-full">
          <thead>
            <tr>
              <th>Title</th>
              <th>Teacher</th>
              <th>Grade</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {pending.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-sm text-muted-foreground">
                  No weekly lesson plans pending approval.
                </td>
              </tr>
            ) : (
              pending.map((plan) => {
                const teacher = teachers.find((t) => t.id === plan.teacherId);
                return (
                  <tr key={plan.id}>
                    <td className="font-medium">{plan.title}</td>
                    <td>{teacher?.name || plan.teacherName || '—'}</td>
                    <td>{plan.grade}</td>
                    <td>
                      <Badge variant="warning">{plan.status}</Badge>
                    </td>
                    <td className="text-right">
                      <Button size="sm" variant="outline" onClick={() => openReview(plan.id)}>
                        Review
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </TablePanel>

      <TablePanel title="Recent lesson plans" description="Approved / returned plans remain available.">
        <table className="eskooly-table w-full">
          <thead>
            <tr>
              <th>Title</th>
              <th>Teacher</th>
              <th>Type</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {recent.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-sm text-muted-foreground">
                  No other lesson plans yet.
                </td>
              </tr>
            ) : (
              recent.map((plan) => (
                <tr key={plan.id}>
                  <td className="font-medium">{plan.title}</td>
                  <td>{plan.teacherName || '—'}</td>
                  <td>{plan.planType || 'weekly'}</td>
                  <td>
                    <Badge
                      variant={
                        plan.status === 'Approved' || plan.status === 'Pending School Head'
                          ? 'success'
                          : plan.status === 'Rejected'
                            ? 'danger'
                            : 'neutral'
                      }
                    >
                      {weeklyPlanStatusLabel(plan.status)}
                    </Badge>
                  </td>
                  <td className="text-right">
                    <Button size="sm" variant="ghost" onClick={() => openReview(plan.id)}>
                      View
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </TablePanel>

      <Dialog
        isOpen={open}
        onClose={() => setOpen(false)}
        title={selected?.title || 'Lesson plan'}
        description={`${selected?.grade || ''} · ${selected?.subject || ''} · ${selected?.status || ''}`}
        size="2xl"
      >
        <div className="max-h-[55vh] space-y-4 overflow-y-auto py-2">
          {parsedDetail ? (
            <DetailedLessonPlanRenderer content={parsedDetail} />
          ) : (
            <ul className="list-disc space-y-1 pl-5 text-sm">
              {(selected?.objectives || []).map((o, i) => (
                <li key={i}>{o}</li>
              ))}
            </ul>
          )}
          {selected?.status === 'Pending Dept Head' ? (
            <div className="space-y-1">
              <label className="text-xs font-semibold">Comments</label>
              <textarea
                className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                rows={3}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Optional feedback for the teacher"
              />
            </div>
          ) : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
          {selected?.status === 'Pending Dept Head' ? (
            <>
              <Button
                variant="destructive"
                onClick={() => {
                  if (!selected) return;
                  rejectLessonPlan(selected.id, 'dept', comments || 'Please revise and resubmit.');
                  setOpen(false);
                }}
              >
                Return
              </Button>
              <Button
                onClick={() => {
                  if (!selected) return;
                  approveLessonPlan(selected.id, 'dept', comments || 'Approved');
                  setOpen(false);
                }}
              >
                Approve
              </Button>
            </>
          ) : null}
        </DialogFooter>
      </Dialog>
    </div>
  );
};
