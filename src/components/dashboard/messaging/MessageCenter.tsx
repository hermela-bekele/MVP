'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { api, type MessageThread, type ThreadMessage } from '@/lib/api';
import { readStoredSession } from '@/lib/auth';
import { ContentCard } from '@/components/dashboard/ContentCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';

type Contact = { id: string; label: string; role: string };

type Props = {
  mode: 'parent' | 'staff';
  staffRoleHint?: string;
  childrenOptions?: { id: string; name: string }[];
};

function threadSubject(t: MessageThread) {
  return t.subject || 'Conversation';
}

function fmtTime(iso?: string) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(iso);
  }
}

export function MessageCenter({ mode, staffRoleHint, childrenOptions = [] }: Props) {
  const session = readStoredSession();
  const schoolId = session?.schoolId || 'sch-1';
  const myId = session?.id || '';

  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [composeOpen, setComposeOpen] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [toUserId, setToUserId] = useState('');
  const [studentId, setStudentId] = useState(childrenOptions[0]?.id ?? '');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  const refreshThreads = useCallback(async () => {
    try {
      const rows = await api.listMessageThreads();
      setThreads(rows);
      setActiveId((prev) => prev || rows[0]?.id || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    }
  }, []);

  useEffect(() => {
    void refreshThreads();
  }, [refreshThreads]);

  useEffect(() => {
    if (!activeId) {
      setMessages([]);
      return;
    }
    api
      .getThreadMessages(activeId)
      .then(setMessages)
      .catch(() => setMessages([]));
  }, [activeId]);

  useEffect(() => {
    if (!composeOpen) return;
    api
      .listPortalContacts(schoolId)
      .then((data) => {
        const list: Contact[] =
          mode === 'parent'
            ? [
                ...data.teachers
                  .filter((t) => t.userId)
                  .map((t) => ({
                    id: String(t.userId),
                    label: t.displayName,
                    role: 'teacher',
                  })),
                ...data.schoolHeads.map((h) => ({
                  id: h.userId,
                  label: h.displayName,
                  role: h.role,
                })),
              ]
            : data.parents.map((p) => ({
                id: p.userId,
                label: p.displayName,
                role: 'parent',
              }));
        setContacts(list);
        if (list[0]) setToUserId(list[0].id);
      })
      .catch(() => setContacts([]));
  }, [composeOpen, mode, schoolId]);

  const active = useMemo(() => threads.find((t) => t.id === activeId) ?? null, [threads, activeId]);

  const sendReply = async () => {
    if (!activeId || !reply.trim()) return;
    setBusy(true);
    setError('');
    try {
      await api.replyToThread(activeId, reply.trim());
      setReply('');
      setMessages(await api.getThreadMessages(activeId));
      await refreshThreads();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Send failed');
    } finally {
      setBusy(false);
    }
  };

  const startThread = async () => {
    if (!subject.trim() || !body.trim() || !toUserId) return;
    setBusy(true);
    setError('');
    try {
      const contact = contacts.find((c) => c.id === toUserId);
      const payload =
        mode === 'parent'
          ? {
              schoolId,
              studentId: studentId || undefined,
              parentUserId: myId,
              staffUserId: toUserId,
              staffRole: contact?.role || staffRoleHint || 'teacher',
              subject: subject.trim(),
              body: body.trim(),
            }
          : {
              schoolId,
              studentId: studentId || undefined,
              parentUserId: toUserId,
              staffUserId: myId,
              staffRole: session?.role || staffRoleHint || 'teacher',
              subject: subject.trim(),
              body: body.trim(),
            };
      const { id } = await api.createMessageThread(payload);
      setComposeOpen(false);
      setSubject('');
      setBody('');
      await refreshThreads();
      setActiveId(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start conversation');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-5 animate-fade-in">
      <ContentCard
        title="Inbox"
        description={mode === 'parent' ? 'Teachers and school head' : 'Parent conversations'}
        className="lg:col-span-2"
        actions={
          <Button size="sm" variant="organic" className="border-none" onClick={() => setComposeOpen((v) => !v)}>
            {composeOpen ? 'Close' : 'New message'}
          </Button>
        }
      >
        {composeOpen && (
          <div className="mb-4 space-y-3 rounded-xl border border-primary/20 bg-primary/[0.04] p-3.5">
            <Select
              label={mode === 'parent' ? 'Send to' : 'Parent'}
              value={toUserId}
              onChange={(e) => setToUserId(e.target.value)}
              options={contacts.map((u) => ({
                value: u.id,
                label: `${u.label} (${u.role})`,
              }))}
            />
            {childrenOptions.length > 0 && (
              <Select
                label="About student"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                options={childrenOptions.map((c) => ({ value: c.id, label: c.name }))}
              />
            )}
            <Input label="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Topic" />
            <textarea
              className="min-h-[88px] w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              placeholder="Write your message…"
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
            <Button size="sm" disabled={busy} onClick={startThread}>
              Send
            </Button>
          </div>
        )}

        <div className="max-h-[480px] space-y-1.5 overflow-y-auto">
          {threads.map((t) => {
            const on = t.id === activeId;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveId(t.id)}
                className={`w-full rounded-xl border px-3.5 py-3 text-left transition ${
                  on
                    ? 'border-primary/40 bg-primary/10 shadow-sm'
                    : 'border-border/50 bg-card hover:border-primary/25'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-foreground">{threadSubject(t)}</p>
                  <Badge variant="neutral">{t.staffRole || t.staff_role || 'staff'}</Badge>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {fmtTime(t.updatedAt || t.updated_at)}
                </p>
              </button>
            );
          })}
          {!threads.length && (
            <EmptyState title="No conversations yet" description="Start a new message to begin." />
          )}
        </div>
      </ContentCard>

      <ContentCard
        title={active ? threadSubject(active) : 'Conversation'}
        description={active ? 'Secure school messaging' : 'Select a thread'}
        className="lg:col-span-3"
      >
        {error && <p className="mb-3 text-xs text-destructive">{error}</p>}
        {!active ? (
          <EmptyState title="Nothing selected" description="Choose a conversation from the inbox." />
        ) : (
          <div className="flex h-[480px] flex-col">
            <div className="flex-1 space-y-3 overflow-y-auto pr-1">
              {messages.map((m) => {
                const mine = (m.sender_user_id || '') === myId;
                return (
                  <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm shadow-sm ${
                        mine
                          ? 'rounded-br-md bg-primary text-primary-foreground'
                          : 'rounded-bl-md border border-border/60 bg-muted/40 text-foreground'
                      }`}
                    >
                      <p className="text-[10px] font-bold uppercase tracking-wide opacity-70">
                        {m.sender_role || 'user'}
                      </p>
                      <p className="mt-0.5 leading-relaxed">{m.body}</p>
                      <p className={`mt-1 text-[10px] ${mine ? 'opacity-70' : 'text-muted-foreground'}`}>
                        {fmtTime(m.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })}
              {!messages.length && (
                <p className="py-8 text-center text-xs text-muted-foreground">No messages in this thread yet.</p>
              )}
            </div>
            <div className="mt-3 flex gap-2 border-t border-border/50 pt-3">
              <input
                className="h-10 flex-1 rounded-lg border border-border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                placeholder="Type a reply…"
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void sendReply();
                  }
                }}
              />
              <Button size="sm" disabled={busy || !reply.trim()} onClick={sendReply}>
                Reply
              </Button>
            </div>
          </div>
        )}
      </ContentCard>
    </div>
  );
}
