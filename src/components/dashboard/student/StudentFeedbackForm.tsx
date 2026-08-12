'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { readStoredSession } from '@/lib/auth';
import { ContentCard } from '@/components/dashboard/ContentCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { EmptyState } from '@/components/ui/empty-state';

type Props = {
  studentId?: string;
  studentName?: string;
};

export function StudentFeedbackForm({ studentId, studentName }: Props) {
  const session = readStoredSession();
  const schoolId = session?.schoolId || 'sch-1';
  const [teachers, setTeachers] = useState<{ teacherId: string; displayName: string }[]>([]);
  const [teacherId, setTeacherId] = useState('');
  const [subject, setSubject] = useState('');
  const [comment, setComment] = useState('');
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

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim() || !teacherId) return;
    setBusy(true);
    setMsg(null);
    try {
      await api.sendPortalFeedback({
        teacherId,
        studentId,
        studentName,
        direction: 'to_teacher',
        authorRole: 'student',
        subject: subject || 'Student feedback',
        comment: comment.trim(),
      });
      setComment('');
      setSubject('');
      setMsg({ type: 'ok', text: 'Feedback sent.' });
    } catch (err) {
      setMsg({ type: 'err', text: err instanceof Error ? err.message : 'Failed to send' });
    } finally {
      setBusy(false);
    }
  };

  if (!studentId) {
    return <EmptyState title="Student profile missing" description="Relink your student account to send feedback." />;
  }

  return (
    <ContentCard title="Feedback to teacher" description="Ask questions or share learning concerns">
      <form onSubmit={submit} className="mx-auto max-w-xl space-y-4">
        <Select
          label="Teacher"
          value={teacherId}
          onChange={(e) => setTeacherId(e.target.value)}
          options={teachers.map((t) => ({ value: t.teacherId, label: t.displayName }))}
        />
        <Input label="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Lab report help" />
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground">Message</label>
          <textarea
            required
            className="min-h-[120px] w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Write your feedback…"
          />
        </div>
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
