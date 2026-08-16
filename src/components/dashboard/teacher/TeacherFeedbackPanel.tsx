'use client';

import React, { useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Dialog, DialogFooter } from '@/components/ui/dialog';
import { Select } from '@/components/ui/select';
import type { TeacherFeedback } from '@/lib/mockData';
import {
  AisBtnPrimary,
  AisBtnSecondary,
  AisEmptyRow,
  AisPage,
  AisPanel,
  AisStatusBadge,
  AisSubTabs,
  AisTable,
  AisTd,
  AisTh,
  AisTr,
  aisInput,
  aisTextarea,
  type AisBadgeVariant,
} from '@/components/dashboard/teacher/TeacherPortalUi';
import { aisBodyMd } from '@/components/dashboard/teacher/aisStyles';

type FeedbackFilter = 'all' | 'peer' | 'department-head' | 'parent' | 'student';

const FILTER_TABS: { id: FeedbackFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'peer', label: 'Peer' },
  { id: 'department-head', label: 'Head of Department' },
  { id: 'parent', label: 'Parent' },
  { id: 'student', label: 'Student' },
];

function roleOf(f: TeacherFeedback): FeedbackFilter {
  return (f.authorRole as FeedbackFilter | undefined) ?? 'department-head';
}

function roleLabel(role: FeedbackFilter): string {
  switch (role) {
    case 'peer':
      return 'Peer';
    case 'parent':
      return 'Parent';
    case 'student':
      return 'Student';
    default:
      return 'Head of Department';
  }
}

function roleBadgeVariant(role: FeedbackFilter): AisBadgeVariant {
  switch (role) {
    case 'peer':
      return 'primary';
    case 'parent':
      return 'success';
    case 'student':
      return 'warning';
    default:
      return 'neutral';
  }
}

/**
 * Teacher's Feedback panel: view feedback received (peer, head of department, parent,
 * student) and give a direct peer review to a colleague. All feedback received is shown
 * anonymously by role — teachers never see who specifically left it.
 */
export const TeacherFeedbackPanel: React.FC = () => {
  const { teachers, teacherFeedbacks, giveTeacherFeedback, resolveTeacherId } = useApp();
  const teacherId = resolveTeacherId();
  const ownTeacher = useMemo(() => teachers.find((t) => t.id === teacherId), [teachers, teacherId]);

  const received = useMemo(
    () =>
      teacherFeedbacks
        .filter((f) => f.direction === 'to_teacher' && f.teacherId === teacherId)
        .sort((a, b) => (a.date < b.date ? 1 : -1)),
    [teacherFeedbacks, teacherId],
  );

  const [filter, setFilter] = useState<FeedbackFilter>('all');
  const filtered = useMemo(
    () => (filter === 'all' ? received : received.filter((f) => roleOf(f) === filter)),
    [received, filter],
  );

  const peers = useMemo(
    () =>
      teachers.filter(
        (t) => t.id !== teacherId && (!ownTeacher || t.departmentId === ownTeacher.departmentId),
      ),
    [teachers, teacherId, ownTeacher],
  );

  const [isOpen, setIsOpen] = useState(false);
  const [peerId, setPeerId] = useState('');
  const [subject, setSubject] = useState('');
  const [comment, setComment] = useState('');
  const [rating, setRating] = useState('5');

  const openModal = () => {
    setPeerId(peers[0]?.id ?? '');
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!peerId || !comment.trim()) return;
    giveTeacherFeedback({
      teacherId: peerId,
      authorRole: 'peer',
      subject: subject.trim() || 'Peer feedback',
      comment: comment.trim(),
      rating: Number(rating),
    });
    setSubject('');
    setComment('');
    setRating('5');
    setIsOpen(false);
  };

  return (
    <AisPage>
      <AisPanel
        title="Feedback received"
        description="Direct feedback from your head of department, peer reviews, and parent & student feedback"
        actions={
          <AisBtnPrimary onClick={openModal} disabled={peers.length === 0}>
            Give Peer Feedback
          </AisBtnPrimary>
        }
        flush
      >
        <div className="px-4 pt-4">
          <AisSubTabs tabs={FILTER_TABS} active={filter} onChange={setFilter} />
        </div>
        <AisTable>
          <thead>
            <tr className="bg-ais-surface-container-low">
              <AisTh>Source</AisTh>
              <AisTh>Source</AisTh>
              <AisTh>Subject</AisTh>
              <AisTh>Comment</AisTh>
              <AisTh>Rating</AisTh>
              <AisTh>Date</AisTh>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <AisEmptyRow colSpan={6} message="No feedback in this category yet." />
            ) : (
              filtered.map((f) => {
                const role = roleOf(f);
                return (
                  <AisTr key={f.id}>
                    <AisTd className="font-semibold">
                      Anonymous {roleLabel(role)}
                    </AisTd>
                    <AisTd>
                      <AisStatusBadge variant={roleBadgeVariant(role)}>{roleLabel(role)}</AisStatusBadge>
                    </AisTd>
                    <AisTd>{f.subject}</AisTd>
                    <AisTd className="max-w-sm text-xs">{f.comment}</AisTd>
                    <AisTd className={aisBodyMd}>{f.rating ? `${f.rating} / 5` : '—'}</AisTd>
                    <AisTd className={aisBodyMd}>{f.date}</AisTd>
                  </AisTr>
                );
              })
            )}
          </tbody>
        </AisTable>
      </AisPanel>

      <Dialog isOpen={isOpen} onClose={() => setIsOpen(false)} title="Give peer feedback" size="md">
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <Select
            label="Colleague"
            value={peerId}
            onChange={(e) => setPeerId(e.target.value)}
            options={peers.map((t) => ({ value: t.id, label: t.name }))}
          />
          <input
            className={aisInput}
            required
            placeholder="Subject, e.g. Co-taught lab session"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
          <textarea
            className={aisTextarea}
            required
            placeholder="Share constructive feedback for your colleague..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <Select
            label="Rating"
            value={rating}
            onChange={(e) => setRating(e.target.value)}
            options={[
              { value: '5', label: '5 — Excellent' },
              { value: '4', label: '4 — Good' },
              { value: '3', label: '3 — Fair' },
              { value: '2', label: '2 — Needs attention' },
              { value: '1', label: '1 — Urgent concern' },
            ]}
          />
          <DialogFooter className="pt-4">
            <AisBtnSecondary type="button" onClick={() => setIsOpen(false)}>
              Cancel
            </AisBtnSecondary>
            <button
              type="submit"
              disabled={!peerId || !comment.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-btn-primary px-6 py-2 text-sm font-semibold text-btn-primary-foreground transition-all hover:bg-btn-primary/90 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send feedback
            </button>
          </DialogFooter>
        </form>
      </Dialog>
    </AisPage>
  );
};
