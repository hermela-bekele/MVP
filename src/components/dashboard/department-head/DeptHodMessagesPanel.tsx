'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Send } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import {
  AisBtnPrimary,
  AisPage,
  aisInput,
} from '@/components/dashboard/teacher/TeacherPortalUi';
import {
  aisBodySm,
  aisHeadlineSm,
  aisLabelCaps,
} from '@/components/dashboard/teacher/aisStyles';
import { isSubjectTeacher, resolveDeptHeadScope } from '@/lib/departmentHead';

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

/** HoD inbox: teacher conversations + challenges, polled for near real-time. */
export function DeptHodMessagesPanel() {
  const {
    staffMessages,
    teachers,
    currentUser,
    sendStaffMessage,
    refreshStaffMessages,
    markStaffMessagesRead,
  } = useApp();

  const scope = useMemo(() => resolveDeptHeadScope(currentUser), [currentUser]);
  const deptTeachers = useMemo(
    () =>
      (scope ? teachers.filter((t) => isSubjectTeacher(t, scope)) : []).filter(
        (t) => t.status === 'Active',
      ),
    [teachers, scope],
  );

  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!selectedTeacherId && deptTeachers[0]) {
      setSelectedTeacherId(deptTeachers[0].id);
    }
  }, [deptTeachers, selectedTeacherId]);

  useEffect(() => {
    if (!scope?.departmentId) return;
    void refreshStaffMessages({ departmentId: scope.departmentId });
    const id = window.setInterval(() => {
      void refreshStaffMessages({ departmentId: scope.departmentId });
    }, 3500);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope?.departmentId]);

  const thread = useMemo(
    () =>
      selectedTeacherId
        ? staffMessages.filter((m) => m.teacherId === selectedTeacherId)
        : [],
    [staffMessages, selectedTeacherId],
  );

  const unreadByTeacher = useMemo(() => {
    const map = new Map<string, number>();
    for (const m of staffMessages) {
      if (m.senderRole === 'teacher' && !m.read) {
        map.set(m.teacherId, (map.get(m.teacherId) ?? 0) + 1);
      }
    }
    return map;
  }, [staffMessages]);

  useEffect(() => {
    if (selectedTeacherId) {
      markStaffMessagesRead(selectedTeacherId, 'department-head');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTeacherId, thread.length]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread.length]);

  const handleSend = async () => {
    if (!draft.trim() || !selectedTeacherId) return;
    setSending(true);
    try {
      await sendStaffMessage({
        teacherId: selectedTeacherId,
        body: draft.trim(),
        senderRole: 'department-head',
      });
      setDraft('');
      if (scope?.departmentId) {
        await refreshStaffMessages({ departmentId: scope.departmentId });
      }
    } finally {
      setSending(false);
    }
  };

  const selectedTeacher = deptTeachers.find((t) => t.id === selectedTeacherId);

  return (
    <AisPage>
      <div className="space-y-4">
        <div>
          <p className={aisLabelCaps}>Teacher messaging</p>
          <h2 className={`${aisHeadlineSm} mt-1`}>Live chat with teachers</h2>
          <p className={`${aisBodySm} mt-1`}>
            Select an active teacher to message. Conversations refresh every few seconds.
          </p>
        </div>

        <div className="grid min-h-[480px] grid-cols-1 overflow-hidden rounded-2xl border border-ais-card-border bg-white dark:bg-ais-surface md:grid-cols-[220px_1fr]">
          <aside className="border-b border-ais-card-border md:border-b-0 md:border-r">
            <p className="px-3 py-2.5 text-[11px] font-bold uppercase tracking-wide text-ais-on-surface-variant">
              Active teachers
            </p>
            <div className="max-h-[200px] overflow-y-auto md:max-h-none">
              {deptTeachers.length === 0 ? (
                <p className="px-3 py-4 text-xs text-ais-on-surface-variant">
                  No active teachers in this department.
                </p>
              ) : (
                deptTeachers.map((t) => {
                const unread = unreadByTeacher.get(t.id) ?? 0;
                const active = t.id === selectedTeacherId;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedTeacherId(t.id)}
                    className={`flex w-full items-center justify-between px-3 py-2.5 text-left text-sm ${
                      active ? 'bg-ais-primary/10 font-semibold text-ais-primary' : 'hover:bg-ais-row-hover'
                    }`}
                  >
                    <span className="truncate">{t.name}</span>
                    {unread > 0 && (
                      <span className="ml-2 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-ais-primary px-1.5 text-[10px] font-bold text-white">
                        {unread}
                      </span>
                    )}
                  </button>
                );
              })
              )}
            </div>
          </aside>

          <div className="flex min-h-0 flex-col">
            <div className="border-b border-ais-card-border px-4 py-3">
              <p className="text-sm font-semibold">
                {selectedTeacher?.name ?? 'Select a teacher'}
              </p>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4" style={{ maxHeight: 360 }}>
              {!selectedTeacherId ? (
                <p className="py-8 text-center text-sm text-ais-on-surface-variant">
                  Select a teacher to open the thread.
                </p>
              ) : thread.length === 0 ? (
                <p className="py-8 text-center text-sm text-ais-on-surface-variant">
                  No messages yet with this teacher.
                </p>
              ) : (
                thread.map((msg) => {
                  const mine =
                    msg.senderRole === 'department-head' ||
                    msg.senderId === currentUser?.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex w-full ${mine ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] px-3.5 py-2.5 text-sm shadow-sm ${
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
            <div className="flex gap-2 border-t border-ais-card-border p-3">
              <input
                className={`${aisInput} flex-1`}
                placeholder="Reply to teacher…"
                value={draft}
                disabled={!selectedTeacherId}
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
                disabled={sending || !draft.trim() || !selectedTeacherId}
                onClick={() => void handleSend()}
              >
                <Send className="h-3.5 w-3.5" aria-hidden />
                Send
              </AisBtnPrimary>
            </div>
          </div>
        </div>
      </div>
    </AisPage>
  );
}
