'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Send, MessageSquare, Flag } from 'lucide-react';
import { readStoredSession } from '@/lib/auth';
import { api, ApiError, LEADERSHIP_ACTION_SEVERITIES, type MoeMessageThread, type MoeThreadMessage } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Dialog, DialogFooter } from '@/components/ui/dialog';
import { FormField, formFieldInputClass } from '@/components/ui/form-field';
import { EmptyState } from '@/components/ui/empty-state';

const STATUS_LABEL: Record<string, string> = {
  open: 'Open',
  awaiting_moe: 'Awaiting MOE',
  awaiting_school: 'Awaiting your reply',
  resolved: 'Resolved',
  closed: 'Closed',
};

const STATUS_VARIANT: Record<string, 'neutral' | 'warning' | 'info' | 'success'> = {
  open: 'info',
  awaiting_moe: 'warning',
  awaiting_school: 'info',
  resolved: 'success',
  closed: 'neutral',
};

function timeLabel(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

/** Real, persisted case-numbered threads between this school and the MOE
 * regional desk — replacing what used to be a session-local chat with no
 * backend at all. */
export const MoeMessagesPanel: React.FC = () => {
  const session = readStoredSession();
  const schoolId = session?.schoolId ?? undefined;
  const bottomRef = useRef<HTMLDivElement>(null);

  const [threads, setThreads] = useState<MoeMessageThread[]>([]);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MoeThreadMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const loadThreads = useCallback(() => {
    setLoadingThreads(true);
    api
      .listMoeMessageThreads(schoolId)
      .then((rows) => {
        setThreads(rows);
        if (!activeThreadId && rows.length > 0) setActiveThreadId(rows[0].id);
      })
      .catch(() => setError('Could not load message threads.'))
      .finally(() => setLoadingThreads(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schoolId]);
  useEffect(() => { loadThreads(); }, [loadThreads]);

  const loadMessages = useCallback((threadId: string) => {
    setLoadingMessages(true);
    api
      .listMoeThreadMessages(threadId)
      .then(setMessages)
      .catch(() => setError('Could not load this thread.'))
      .finally(() => setLoadingMessages(false));
  }, []);

  useEffect(() => {
    if (!activeThreadId) return;
    loadMessages(activeThreadId);
    void api.updateMoeMessageThread(activeThreadId, { markRead: true }).then((updated) => {
      setThreads((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    });
  }, [activeThreadId, loadMessages]);

  const activeThread = threads.find((t) => t.id === activeThreadId) ?? null;

  const handleSend = async () => {
    if (!draft.trim() || !activeThreadId) return;
    setSending(true);
    try {
      const msg = await api.sendMoeThreadMessage(activeThreadId, draft.trim());
      setMessages((prev) => [...prev, msg]);
      setDraft('');
      loadThreads();
      window.setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    } catch {
      setError('Could not send your message.');
    } finally {
      setSending(false);
    }
  };

  const [isNewOpen, setIsNewOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');

  const [isActionOpen, setIsActionOpen] = useState(false);
  const [actionIssue, setActionIssue] = useState('');
  const [actionSeverity, setActionSeverity] = useState<string>('Medium');
  const [actionOwner, setActionOwner] = useState('');
  const [actionDueDate, setActionDueDate] = useState('');
  const [actionSaving, setActionSaving] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionCreated, setActionCreated] = useState(false);

  const openActionDialog = () => {
    if (!activeThread) return;
    setActionIssue(activeThread.subject);
    setActionSeverity('Medium');
    setActionOwner('');
    setActionDueDate('');
    setActionError('');
    setActionCreated(false);
    setIsActionOpen(true);
  };

  const handleCreateAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeThread || !actionIssue.trim()) return;
    setActionSaving(true);
    setActionError('');
    try {
      const lastMessage = messages[messages.length - 1];
      await api.createLeadershipAction({
        schoolId,
        category: 'exception',
        issue: actionIssue.trim(),
        evidence: lastMessage?.body,
        source: `Message MOE — ${activeThread.referenceNumber}`,
        severity: actionSeverity as (typeof LEADERSHIP_ACTION_SEVERITIES)[number],
        owner: actionOwner.trim() || undefined,
        dueDate: actionDueDate || undefined,
      });
      setActionCreated(true);
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Could not create this action.');
    } finally {
      setActionSaving(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) return;
    setCreating(true);
    setFormError('');
    try {
      const thread = await api.createMoeMessageThread({ subject: subject.trim(), body: body.trim(), schoolId });
      setIsNewOpen(false);
      setSubject('');
      setBody('');
      setThreads((prev) => [thread, ...prev]);
      setActiveThreadId(thread.id);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Could not start this thread.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in text-left">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Direct, case-numbered communication with the Ministry of Education regional desk.
        </p>
        <Button size="sm" variant="organic" className="border-none text-xs" onClick={() => setIsNewOpen(true)}>
          + New Thread
        </Button>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-4 rounded-2xl border border-border overflow-hidden" style={{ minHeight: 480 }}>
        <div className="border-r border-border bg-muted/20 overflow-y-auto" style={{ maxHeight: 480 }}>
          {loadingThreads ? (
            <p className="text-xs text-muted-foreground p-4 text-center">Loading…</p>
          ) : threads.length === 0 ? (
            <p className="text-xs text-muted-foreground p-4 text-center">No threads yet.</p>
          ) : (
            threads.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveThreadId(t.id)}
                className={`w-full text-left p-3 border-b border-border/40 transition-colors ${
                  activeThreadId === t.id ? 'bg-card' : 'hover:bg-card/60'
                }`}
              >
                <p className="text-[10px] font-mono text-muted-foreground">{t.referenceNumber}</p>
                <p className="text-xs font-bold text-foreground truncate mt-0.5">{t.subject}</p>
                <div className="flex items-center justify-between mt-1.5">
                  <Badge variant={STATUS_VARIANT[t.status] ?? 'neutral'} size="sm">{STATUS_LABEL[t.status] ?? t.status}</Badge>
                  <span className="text-[9px] text-muted-foreground">{timeLabel(t.lastMessageAt)}</span>
                </div>
              </button>
            ))
          )}
        </div>

        <div className="flex flex-col overflow-hidden bg-white dark:bg-card">
          {!activeThread ? (
            <EmptyState icon={<MessageSquare />} title="No thread selected" description="Start a new thread to reach the MOE regional desk." />
          ) : (
            <>
              <div className="border-b border-border p-3 flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-bold text-foreground">{activeThread.subject}</p>
                  <p className="text-[10px] font-mono text-muted-foreground">{activeThread.referenceNumber}</p>
                </div>
                <Button size="sm" variant="outline" className="h-7 text-[10px] shrink-0" onClick={openActionDialog}>
                  <Flag className="h-3 w-3 mr-1" aria-hidden />
                  Create Formal Action
                </Button>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4" style={{ maxHeight: 380 }}>
                {loadingMessages ? (
                  <p className="text-xs text-muted-foreground text-center py-6">Loading…</p>
                ) : (
                  messages.map((msg) => {
                    const mine = msg.senderRole === 'school-head';
                    return (
                      <div key={msg.id} className={`flex w-full ${mine ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-[85%] px-3.5 py-2.5 text-sm shadow-sm ${
                            mine
                              ? 'rounded-2xl rounded-br-md bg-primary/12 text-foreground ring-1 ring-primary/15'
                              : 'rounded-2xl rounded-bl-md bg-muted text-foreground ring-1 ring-border'
                          }`}
                        >
                          {!mine && <p className="mb-0.5 text-[11px] font-semibold text-muted-foreground">{msg.senderName}</p>}
                          <p className="whitespace-pre-wrap leading-relaxed">{msg.body}</p>
                          <p className="mt-1 text-right text-[10px] text-muted-foreground/80">{timeLabel(msg.createdAt)}</p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={bottomRef} />
              </div>
              {activeThread.status !== 'closed' && (
                <div className="flex gap-2 border-t border-border p-3">
                  <input
                    className={`${formFieldInputClass} flex-1`}
                    placeholder="Write to the MOE regional desk…"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        void handleSend();
                      }
                    }}
                  />
                  <Button type="button" variant="organic" className="border-none" disabled={!draft.trim() || sending} onClick={() => void handleSend()}>
                    <Send className="h-3.5 w-3.5" aria-hidden />
                    Send
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <Dialog isOpen={isNewOpen} onClose={() => setIsNewOpen(false)} title="New Thread to MOE">
        <form onSubmit={handleCreate} className="space-y-3 text-left">
          {formError && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-md text-xxs font-bold">⚠ {formError}</div>}
          <FormField label="Subject">
            <input required className={formFieldInputClass} value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="What is this about?" />
          </FormField>
          <FormField label="Message">
            <textarea required className={`${formFieldInputClass} h-24 py-2`} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Describe your question or update." />
          </FormField>
          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => setIsNewOpen(false)}>Cancel</Button>
            <Button type="submit" variant="organic" size="sm" className="border-none" disabled={creating}>{creating ? 'Sending…' : 'Send'}</Button>
          </DialogFooter>
        </form>
      </Dialog>

      <Dialog
        isOpen={isActionOpen}
        onClose={() => setIsActionOpen(false)}
        title="Create Formal Action"
        description="Turns this thread into a tracked item on your Leadership Attention & Actions queue."
      >
        {actionCreated ? (
          <div className="space-y-3 text-left">
            <p className="text-xs text-success font-semibold">Action created — it now appears on your Leadership Attention & Actions queue.</p>
            <DialogFooter>
              <Button type="button" variant="organic" size="sm" className="border-none" onClick={() => setIsActionOpen(false)}>Done</Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleCreateAction} className="space-y-3 text-left">
            {actionError && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-md text-xxs font-bold">⚠ {actionError}</div>}
            <FormField label="Issue">
              <input className={formFieldInputClass} value={actionIssue} onChange={(e) => setActionIssue(e.target.value)} required />
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Severity">
                <Select options={LEADERSHIP_ACTION_SEVERITIES.map((s) => ({ value: s, label: s }))} value={actionSeverity} onChange={(e) => setActionSeverity(e.target.value)} />
              </FormField>
              <FormField label="Owner">
                <input className={formFieldInputClass} value={actionOwner} onChange={(e) => setActionOwner(e.target.value)} placeholder="Who is responsible" />
              </FormField>
            </div>
            <FormField label="Decision Due Date">
              <input type="date" className={formFieldInputClass} value={actionDueDate} onChange={(e) => setActionDueDate(e.target.value)} />
            </FormField>
            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setIsActionOpen(false)}>Cancel</Button>
              <Button type="submit" variant="organic" size="sm" className="border-none" disabled={actionSaving}>{actionSaving ? 'Saving…' : 'Create Action'}</Button>
            </DialogFooter>
          </form>
        )}
      </Dialog>
    </div>
  );
};
