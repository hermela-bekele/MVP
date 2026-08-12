'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Send } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import {
  AisBtnPrimary,
  aisInput,
} from '@/components/dashboard/teacher/TeacherPortalUi';
import {
  aisHeadlineSm,
  aisLabelCaps,
} from '@/components/dashboard/teacher/aisStyles';

function timeLabel(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

/** Teacher ↔ HoD chat with short-interval polling for near real-time updates. */
export function TeacherHodMessagesTab() {
  const {
    staffMessages,
    teachers,
    resolveTeacherId,
    sendStaffMessage,
    refreshStaffMessages,
    markStaffMessagesRead,
    currentUser,
  } = useApp();

  const teacherId = resolveTeacherId();
  const teacher = teachers.find((t) => t.id === teacherId);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const thread = useMemo(
    () => staffMessages.filter((m) => m.teacherId === teacherId),
    [staffMessages, teacherId],
  );

  useEffect(() => {
    void refreshStaffMessages({ teacherId });
    const id = window.setInterval(() => {
      void refreshStaffMessages({ teacherId });
    }, 3500);
    return () => window.clearInterval(id);
    // Poll while this tab is open; refreshStaffMessages is stable enough for interval use.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teacherId]);

  useEffect(() => {
    markStaffMessagesRead(teacherId, 'teacher');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teacherId, thread.length]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread.length]);

  const handleSend = async () => {
    if (!draft.trim()) return;
    setSending(true);
    try {
      await sendStaffMessage({
        teacherId,
        body: draft.trim(),
        senderRole: 'teacher',
      });
      setDraft('');
      await refreshStaffMessages({ teacherId });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-full min-h-[calc(100vh-240px)] flex-col overflow-hidden rounded-2xl border border-ais-card-border bg-white dark:bg-ais-surface">
      <div className="shrink-0 border-b border-ais-card-border px-4 py-3 sm:px-5">
        <p className={aisLabelCaps}>HoD messaging</p>
        <h2 className={`${aisHeadlineSm} mt-1`}>Chat with your department head</h2>
        <p className="mt-0.5 text-sm font-semibold text-ais-on-surface">
          {teacher?.name ?? currentUser?.displayName ?? 'You'} ↔ Department Head
        </p>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4 sm:px-5">
          {thread.length === 0 ? (
            <p className="py-10 text-center text-sm text-ais-on-surface-variant">
              No messages yet. Say hello or share a classroom challenge.
            </p>
          ) : (
            thread.map((msg) => {
              const mine =
                msg.senderRole === 'teacher' ||
                msg.senderId === teacherId ||
                msg.senderId === currentUser?.id;
              return (
                <div
                  key={msg.id}
                  className={`flex w-full ${mine ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[min(85%,36rem)] px-3.5 py-2.5 text-sm shadow-sm ${
                      mine
                        ? 'rounded-2xl rounded-br-md bg-ais-primary/12 text-ais-on-surface ring-1 ring-ais-primary/15'
                        : 'rounded-2xl rounded-bl-md bg-ais-surface-container-low text-ais-on-surface ring-1 ring-ais-card-border'
                    }`}
                  >
                    {!mine && (
                      <p className="mb-0.5 text-[11px] font-semibold text-ais-on-surface-variant">
                        {msg.senderName}
                      </p>
                    )}
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.body}</p>
                    <p className="mt-1 text-right text-[10px] text-ais-on-surface-variant/80">
                      {timeLabel(msg.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        <div className="flex shrink-0 gap-2 border-t border-ais-card-border p-3 sm:p-4">
          <input
            className={`${aisInput} flex-1`}
            placeholder="Message your HoD…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void handleSend();
              }
            }}
          />
          <AisBtnPrimary
            type="button"
            disabled={sending || !draft.trim()}
            onClick={() => void handleSend()}
          >
            <Send className="h-3.5 w-3.5" aria-hidden />
            Send
          </AisBtnPrimary>
        </div>
      </div>
    </div>
  );
}
