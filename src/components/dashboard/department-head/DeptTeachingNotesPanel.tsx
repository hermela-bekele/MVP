'use client';

import React, { useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { ContentCard } from '@/components/dashboard/ContentCard';
import { TablePanel } from '@/components/dashboard/TablePanel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogFooter } from '@/components/ui/dialog';
import { filterBySubjectScope, filterDeptTeachingNotes, type DeptHeadScope } from '@/lib/departmentHead';
import { TeachingNotesRenderer } from '@/components/ui/TeachingNotesRenderer';
import type { AITeachingNotesResult } from '@/lib/ai';

interface DeptTeachingNotesPanelProps {
  scope: DeptHeadScope | null;
}

export const DeptTeachingNotesPanel: React.FC<DeptTeachingNotesPanelProps> = ({ scope }) => {
  const { teachingNotes, teachers, approveTeachingNote, rejectTeachingNote } = useApp();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [comments, setComments] = useState('');
  const [open, setOpen] = useState(false);

  const notes = useMemo(() => {
    if (!scope) return [];
    return filterDeptTeachingNotes(teachingNotes, teachers, scope);
  }, [teachingNotes, teachers, scope]);

  const pending = notes.filter((n) => n.status === 'Pending Dept Head');
  const selected = notes.find((n) => n.id === selectedId);

  const parsedContent = useMemo(() => {
    if (!selected?.contentBody) return null;
    try {
      return JSON.parse(selected.contentBody) as AITeachingNotesResult;
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
      <ContentCard
        title="Teaching notes approval"
        description="Review AI-generated teaching notes submitted by department teachers."
      >
        <p className="text-sm text-muted-foreground">
          {pending.length} note{pending.length === 1 ? '' : 's'} awaiting your review.
        </p>
      </ContentCard>

      <TablePanel title="Pending teaching notes" description="Approve or return notes to teachers.">
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
                  No teaching notes pending approval.
                </td>
              </tr>
            ) : (
              pending.map((note) => {
                const teacher = teachers.find((t) => t.id === note.teacherId);
                return (
                  <tr key={note.id}>
                    <td className="font-semibold">{note.title}</td>
                    <td>{teacher?.name ?? note.teacherId}</td>
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

      <TablePanel title="All department notes" description="Recently approved, saved, and rejected notes.">
        <table className="eskooly-table w-full">
          <thead>
            <tr>
              <th>Title</th>
              <th>Grade</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {notes.filter((n) => n.status !== 'Pending Dept Head').map((note) => (
              <tr key={note.id}>
                <td>{note.title}</td>
                <td>{note.grade}</td>
                <td>
                  <Badge variant={note.status === 'Approved' ? 'success' : note.status === 'Rejected' ? 'danger' : 'neutral'}>
                    {note.status}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TablePanel>

      <Dialog isOpen={open} onClose={() => setOpen(false)} title={selected?.title ?? 'Review note'} size="xl">
        {selected && (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pt-2">
            <p className="text-sm text-muted-foreground">{selected.grade} · {selected.subject} · {selected.topic}</p>
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
