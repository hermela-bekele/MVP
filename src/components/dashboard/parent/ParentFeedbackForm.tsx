'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { readStoredSession } from '@/lib/auth';
import { ContentCard } from '@/components/dashboard/ContentCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { EmptyState } from '@/components/ui/empty-state';

type Child = { id: string; name: string };

type Props = {
  childrenOptions: Child[];
};

export function ParentFeedbackForm({ childrenOptions }: Props) {
  const session = readStoredSession();
  const schoolId = session?.schoolId || 'sch-1';
  const [teachers, setTeachers] = useState<{ teacherId: string; displayName: string }[]>([]);
  const [teacherId, setTeacherId] = useState('');
  const [studentId, setStudentId] = useState(childrenOptions[0]?.id ?? '');
  const [subject, setSubject] = useState('');
  const [comment, setComment] = useState('');
  const [rating, setRating] = useState('5');
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api
      .listPortalContacts(schoolId)
      .then((data) => {
        const t = data.teachers.map((x) => ({
          teacherId: x.teacherId,
          displayName: x.displayName,
        }));
        setTeachers(t);
        if (t[0]) setTeacherId(t[0].teacherId);
      })
      .catch(() => setTeachers([]));
  }, [schoolId]);

  useEffect(() => {
    if (childrenOptions[0] && !studentId) setStudentId(childrenOptions[0].id);
  }, [childrenOptions, studentId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim() || !teacherId) return;
    setBusy(true);
    setMsg(null);
    try {
      const child = childrenOptions.find((c) => c.id === studentId);
      await api.sendPortalFeedback({
        teacherId,
        studentId: studentId || undefined,
        studentName: child?.name,
        direction: 'to_teacher',
        subject: subject || 'Parent feedback',
        comment: comment.trim(),
        rating: Number(rating) || undefined,
      });
      setComment('');
      setSubject('');
      setMsg({ type: 'ok', text: 'Feedback sent to the teacher.' });
    } catch (err) {
      setMsg({ type: 'err', text: err instanceof Error ? err.message : 'Failed to send' });
    } finally {
      setBusy(false);
    }
  };

  if (!childrenOptions.length) {
    return <EmptyState title="No linked children" description="Link a student to send teacher feedback." />;
  }

  return (
    <ContentCard title="Feedback to teacher" description="Share observations about your child’s learning">
      <form onSubmit={submit} className="mx-auto max-w-xl space-y-4">
        <Select
          label="Teacher"
          value={teacherId}
          onChange={(e) => setTeacherId(e.target.value)}
          options={teachers.map((t) => ({ value: t.teacherId, label: t.displayName }))}
        />
        <Select
          label="About child"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          options={childrenOptions.map((c) => ({ value: c.id, label: c.name }))}
        />
        <Input label="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Homework support" />
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground">Comment</label>
          <textarea
            required
            className="min-h-[120px] w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="What would you like the teacher to know?"
          />
        </div>
        <Select
          label="Rating (optional)"
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
        <div className="flex items-center gap-3">
          <Button type="submit" size="sm" disabled={busy}>
            {busy ? 'Sending…' : 'Send feedback'}
          </Button>
          {msg && (
            <p className={`text-xs ${msg.type === 'ok' ? 'text-success' : 'text-destructive'}`}>{msg.text}</p>
          )}
        </div>
      </form>
    </ContentCard>
  );
}
