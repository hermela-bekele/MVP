'use client';

import React, { useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { TablePanel } from '@/components/dashboard/TablePanel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogFooter } from '@/components/ui/dialog';
import { filterDeptTeachingNotes, type DeptHeadScope } from '@/lib/departmentHead';
import { TeachingNotesRenderer } from '@/components/ui/TeachingNotesRenderer';
import type { AITeachingNotesResult } from '@/lib/ai';
import { graspOutcomeLabel } from '@/lib/teacherPortal';
import type { GraspOutcome } from '@/lib/mockData';

interface DeptTeachingNotesPanelProps {
  scope: DeptHeadScope | null;
}

function graspBadgeVariant(outcome: GraspOutcome): 'success' | 'warning' | 'neutral' {
  if (outcome === 'well_grasped') return 'success';
  if (outcome === 'majority_grasped') return 'neutral';
  return 'warning';
}

export const DeptTeachingNotesPanel: React.FC<DeptTeachingNotesPanelProps> = ({ scope }) => {
  const {
    teachingNotes,
    teachers,
    lessonPlans,
    lessonDeliveries,
    approveTeachingNote,
    rejectTeachingNote,
  } = useApp();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [comments, setComments] = useState('');
  const [open, setOpen] = useState(false);

  const notes = useMemo(() => {
    if (!scope) return [];
    return filterDeptTeachingNotes(teachingNotes, teachers, scope);
  }, [teachingNotes, teachers, scope]);

  const deliveryFor = (noteId: string) =>
    lessonDeliveries.find((d) => d.teachingNoteId === noteId);

  const pending = notes.filter((n) => n.status === 'Pending Dept Head' && !deliveryFor(n.id));
  const approvedOrDelivered = notes.filter(
    (n) => n.status === 'Approved' || Boolean(deliveryFor(n.id)),
  );
  const other = notes.filter(
    (n) =>
      n.status !== 'Pending Dept Head' &&
      n.status !== 'Approved' &&
      !deliveryFor(n.id),
  );
  const selected = notes.find((n) => n.id === selectedId);

  const planTitleFor = (noteId: string, lessonPlanId?: string) => {
    const delivery = deliveryFor(noteId);
    const planId = lessonPlanId || delivery?.lessonPlanId;
    if (!planId) return '—';
    return lessonPlans.find((p) => p.id === planId)?.title ?? '—';
  };

  const parsedContent = useMemo(() => {
    if (!selected?.contentBody) return null;
    const raw = selected.contentBody.trim();
    try {
      return JSON.parse(raw) as AITeachingNotesResult;
    } catch {
      // Plain markdown body
      if (raw.length > 20) {
        return {
          title: selected.title,
          language: selected.language || 'English',
          introduction: '',
          explanations: [{ subtitle: 'Content', content: raw, examples: [] }],
          visualAids: [],
          exercises: [],
        } as AITeachingNotesResult;
      }
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
        title="Pending teaching notes"
        description={`${pending.length} note${pending.length === 1 ? '' : 's'} awaiting review. Approve or return AI-generated notes from department teachers.`}
      >
        <table className="eskooly-table w-full">
          <thead>
            <tr>
              <th>Title</th>
              <th>Teacher</th>
              <th>Topic</th>
              <th>Weekly plan</th>
              <th>Grade</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {pending.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-6 text-center text-sm text-muted-foreground">
                  No teaching notes pending approval.
                </td>
              </tr>
            ) : (
              pending.map((note) => {
                const teacher = teachers.find((t) => t.id === note.teacherId);
                return (
                  <tr key={note.id}>
                    <td className="font-semibold max-w-[180px]">
                      <span className="block truncate" title={note.title}>
                        {note.title}
                      </span>
                    </td>
                    <td>{teacher?.name ?? note.teacherId}</td>
                    <td className="max-w-[140px]">
                      <span className="block truncate" title={note.topic}>
                        {note.topic}
                      </span>
                    </td>
                    <td className="text-xs max-w-[160px]">
                      <span
                        className="block truncate"
                        title={planTitleFor(note.id, note.lessonPlanId)}
                      >
                        {planTitleFor(note.id, note.lessonPlanId)}
                      </span>
                    </td>
                    <td>{note.grade}</td>
                    <td>
                      <Badge variant="warning">Pending</Badge>
                    </td>
                    <td>
                      <Button size="sm" variant="outline" onClick={() => openReview(note.id)}>
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

      <TablePanel
        title="Approved notes & delivery feedback"
        description="After approval, teachers mark delivery. Grasp outcome feeds the exam topic list on Manage Assessments."
      >
        <table className="eskooly-table w-full">
          <thead>
            <tr>
              <th>Title</th>
              <th>Teacher</th>
              <th>Topic</th>
              <th>Weekly plan</th>
              <th>Delivered</th>
              <th>Grasp</th>
            </tr>
          </thead>
          <tbody>
            {approvedOrDelivered.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-sm text-muted-foreground">
                  No approved teaching notes yet.
                </td>
              </tr>
            ) : (
              approvedOrDelivered.map((note) => {
                const teacher = teachers.find((t) => t.id === note.teacherId);
                const delivery = deliveryFor(note.id);
                return (
                  <tr key={note.id}>
                    <td className="font-semibold max-w-[180px]">
                      <span className="block truncate" title={note.title}>
                        {note.title}
                      </span>
                    </td>
                    <td>{teacher?.name ?? note.teacherId}</td>
                    <td className="max-w-[140px]">
                      <span className="block truncate" title={note.topic}>
                        {note.topic}
                      </span>
                    </td>
                    <td className="text-xs max-w-[160px]">
                      <span
                        className="block truncate"
                        title={planTitleFor(note.id, note.lessonPlanId)}
                      >
                        {planTitleFor(note.id, note.lessonPlanId)}
                      </span>
                    </td>
                    <td>
                      {delivery ? (
                        <Badge variant="success" size="sm">
                          Delivered
                        </Badge>
                      ) : (
                        <Badge variant="neutral" size="sm">
                          Not yet
                        </Badge>
                      )}
                    </td>
                    <td>
                      {delivery ? (
                        <Badge variant={graspBadgeVariant(delivery.graspOutcome)} size="sm">
                          {graspOutcomeLabel(delivery.graspOutcome)}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </TablePanel>

      {other.length > 0 && (
        <TablePanel title="Other notes" description="Draft, saved, and rejected notes in the department.">
          <table className="eskooly-table w-full">
            <thead>
              <tr>
                <th>Title</th>
                <th>Teacher</th>
                <th>Grade</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {other.map((note) => {
                const teacher = teachers.find((t) => t.id === note.teacherId);
                return (
                  <tr key={note.id}>
                    <td className="max-w-[220px]">
                      <span className="block truncate" title={note.title}>
                        {note.title}
                      </span>
                    </td>
                    <td>{teacher?.name ?? note.teacherId}</td>
                    <td>{note.grade}</td>
                    <td>
                      <Badge
                        variant={
                          note.status === 'Rejected' ? 'danger' : 'neutral'
                        }
                      >
                        {note.status}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TablePanel>
      )}

      <Dialog isOpen={open} onClose={() => setOpen(false)} title={selected?.title ?? 'Review note'} size="xl">
        {selected && (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pt-2">
            <p className="text-sm text-muted-foreground">
              {selected.grade} · {selected.subject} · {selected.topic}
            </p>
            {selected.lessonPlanId && (
              <p className="text-xs text-muted-foreground">
                Weekly plan: {planTitleFor(selected.id, selected.lessonPlanId)}
              </p>
            )}
            {parsedContent ? (
              <TeachingNotesRenderer content={parsedContent} />
            ) : (
              <p className="text-sm">{selected.contentSummary}</p>
            )}
            <textarea
              className="w-full min-h-[80px] rounded-lg border border-border p-3 text-sm"
              placeholder="Comments for teacher (optional)"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
            />
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  rejectTeachingNote(selected.id, comments || 'Please revise and resubmit.');
                  setOpen(false);
                }}
              >
                Reject
              </Button>
              <Button
                onClick={() => {
                  approveTeachingNote(selected.id, comments || 'Approved for classroom use.');
                  setOpen(false);
                }}
              >
                Approve
              </Button>
            </DialogFooter>
          </div>
        )}
      </Dialog>
    </div>
  );
};
