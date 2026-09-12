'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Send, MessageSquare } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { api, type MoeMessageThread, type MoeThreadMessage } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { EmptyState } from '@/components/ui/empty-state';
import { formFieldInputClass } from '@/components/ui/form-field';

const STATUS_LABEL: Record<string, string> = {
  open: 'Open',
  awaiting_moe: 'Awaiting MOE',
  awaiting_school: 'Awaiting school reply',
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

/** MOE-side inbox for every school's "Message MOE" thread — real, persisted
 * case-numbered threads, not a per-school mock. */
export function MoeSchoolMessagesPanel() {
  const { schools } = useApp();
  const bottomRef = useRef<HTMLDivElement>(null);

  const [schoolFilter, setSchoolFilter] = useState('All');
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
      .listMoeMessageThreads(schoolFilter !== 'All' ? schoolFilter : undefined)
      .then((rows) => {
        setThreads(rows);
        if (activeThreadId && !rows.some((r) => r.id === activeThreadId)) setActiveThreadId(null);
      })
      .catch(() => setError('Could not load message threads.'))
      .finally(() => setLoadingThreads(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schoolFilter]);
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
  const schoolName = (schoolId: string) => schools.find((s) => s.id === schoolId)?.name ?? schoolId;

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
      setError('Could not send your reply.');
    } finally {
      setSending(false);
    }
  };

  const resolveThread = async () => {
    if (!activeThreadId) return;
    const updated = await api.updateMoeMessageThread(activeThreadId, { status: 'resolved' });
    setThreads((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Every school&apos;s direct communication thread with the Ministry.</p>
        <div className="w-56">
          <Select
            options={[{ value: 'All', label: 'All Schools' }, ...schools.map((s) => ({ value: s.id, label: s.name }))]}
            value={schoolFilter}
            onChange={(e) => setSchoolFilter(e.target.value)}
          />
        </div>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-4 rounded-2xl border border-border overflow-hidden" style={{ minHeight: 480 }}>
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
                <p className="text-xs font-bold text-foreground truncate mt-0.5">{schoolName(t.schoolId)}</p>
                <p className="text-[11px] text-muted-foreground truncate">{t.subject}</p>
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
            <EmptyState icon={<MessageSquare />} title="No thread selected" description="Choose a thread from the list to view and reply." />
          ) : (
            <>
              <div className="border-b border-border p-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-foreground">{schoolName(activeThread.schoolId)} — {activeThread.subject}</p>
                  <p className="text-[10px] font-mono text-muted-foreground">{activeThread.referenceNumber}</p>
                </div>
                {activeThread.status !== 'resolved' && activeThread.status !== 'closed' && (
                  <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => void resolveThread()}>
                    Mark Resolved
                  </Button>
                )}
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4" style={{ maxHeight: 380 }}>
                {loadingMessages ? (
                  <p className="text-xs text-muted-foreground text-center py-6">Loading…</p>
                ) : (
                  messages.map((msg) => {
                    const mine = msg.senderRole === 'moe';
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
                    placeholder="Reply to the school…"
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
    </div>
  );
}
