'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Send } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { aisInput } from '@/components/dashboard/teacher/TeacherPortalUi';
import { aisBodySm, aisCard } from '@/components/dashboard/teacher/aisStyles';
import { avatarColor, communityInitials } from '@/components/dashboard/teacher/community/communityUi';

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

  const myName = teacher?.name ?? currentUser?.displayName ?? 'You';

  return (
    <div className={`${aisCard} flex h-[min(70vh,720px)] min-h-[420px] flex-col overflow-hidden`}>
      <header className="flex h-16 shrink-0 items-center gap-3 border-b border-ais-card-border bg-ais-surface-container-low/40 px-4 sm:px-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ais-primary text-xs font-bold text-white">
          HoD
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-ais-on-surface">Department Head</p>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex-1 space-y-1 overflow-y-auto py-3">
          {thread.length === 0 ? (
            <div className="mx-4 mt-4 rounded-2xl bg-gradient-to-br from-ais-primary/8 via-ais-primary/5 to-transparent px-6 py-10 text-center sm:mx-6">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-ais-primary text-white shadow-sm">
                <Send className="h-6 w-6" />
              </div>
              <p className="mt-4 text-lg font-bold text-ais-on-surface">Start the conversation</p>
              <p className={`${aisBodySm} mx-auto mt-1.5 max-w-sm`}>
                Say hello or share a classroom challenge with your department head.
              </p>
            </div>
          ) : (
            thread.map((msg) => {
              const mine =
                msg.senderRole === 'teacher' ||
                msg.senderId === teacherId ||
                msg.senderId === currentUser?.id;
              const displayName = mine ? myName : msg.senderName;
              return (
                <div
                  key={msg.id}
                  className="group flex gap-3 px-4 py-2 transition-colors hover:bg-ais-row-hover/60 sm:px-5"
                >
                  <div
                    className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${avatarColor(
                      msg.senderId || (mine ? 'teacher' : 'hod'),
                    )}`}
                  >
                    {communityInitials(displayName)}
                  </div>
                  <div className="min-w-0 flex-1 text-left">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                      <span className="text-sm font-bold text-ais-on-surface">{displayName}</span>
                      <span className="rounded-full bg-ais-primary/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-ais-primary">
                        {mine ? 'You' : 'Dept. head'}
                      </span>
                      <span className="text-[11px] text-ais-outline">{timeLabel(msg.createdAt)}</span>
                    </div>
                    <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-ais-on-surface">
                      {msg.body}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        <div className="flex shrink-0 items-end gap-2 border-t border-ais-card-border bg-ais-surface-container-low/30 px-4 py-3 sm:px-5">
          <textarea
            rows={1}
            className={`${aisInput} max-h-32 min-h-10 flex-1 resize-none py-2.5`}
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
          <button
            type="button"
            disabled={sending || !draft.trim()}
            onClick={() => void handleSend()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-btn-primary text-btn-primary-foreground shadow-sm transition-colors hover:bg-btn-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Send"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
