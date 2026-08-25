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
import {
  DEPT_THREAD_SELECT_EVENT,
  readActiveDeptThreadId,
  writeActiveDeptThreadId,
} from '@/lib/communitySelectionStorage';

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

/** School Head inbox: one thread per department head. Local-only (no backend). */
export function SchoolHeadHodMessagesPanel() {
  const {
    deptHeadMessages,
    departments,
    sendDeptHeadMessage,
    markDeptHeadMessagesRead,
  } = useApp();

  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('');
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedDepartmentId) return;
    const stored = readActiveDeptThreadId();
    const preselected =
      stored && departments.some((d) => d.id === stored) ? stored : departments[0]?.id;
    if (preselected) setSelectedDepartmentId(preselected);
  }, [departments, selectedDepartmentId]);

  // Sidebar "Direct Messages" list dispatches this when a department is clicked.
  useEffect(() => {
    const handler = (e: Event) => {
      const departmentId = (e as CustomEvent<string>).detail;
      if (departmentId) setSelectedDepartmentId(departmentId);
    };
    window.addEventListener(DEPT_THREAD_SELECT_EVENT, handler);
    return () => window.removeEventListener(DEPT_THREAD_SELECT_EVENT, handler);
  }, []);

  useEffect(() => {
    if (selectedDepartmentId) writeActiveDeptThreadId(selectedDepartmentId);
  }, [selectedDepartmentId]);

  const thread = useMemo(
    () =>
      selectedDepartmentId
        ? deptHeadMessages.filter((m) => m.departmentId === selectedDepartmentId)
        : [],
    [deptHeadMessages, selectedDepartmentId],
  );

  const unreadByDept = useMemo(() => {
    const map = new Map<string, number>();
    for (const m of deptHeadMessages) {
      if (m.senderRole === 'department-head' && !m.read) {
        map.set(m.departmentId, (map.get(m.departmentId) ?? 0) + 1);
      }
    }
    return map;
  }, [deptHeadMessages]);

  useEffect(() => {
    if (selectedDepartmentId) {
      markDeptHeadMessagesRead(selectedDepartmentId, 'school-head');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDepartmentId, thread.length]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread.length]);

  const handleSend = () => {
    if (!draft.trim() || !selectedDepartmentId) return;
    setSending(true);
    try {
      sendDeptHeadMessage({
        departmentId: selectedDepartmentId,
        body: draft.trim(),
        senderRole: 'school-head',
      });
      setDraft('');
    } finally {
      setSending(false);
    }
  };

  const selectedDepartment = departments.find((d) => d.id === selectedDepartmentId);

  return (
    <AisPage>
      <div className="space-y-4">
        <div>
          <p className={aisLabelCaps}>Department messaging</p>
          <h2 className={`${aisHeadlineSm} mt-1 !text-title`}>Live chat with department heads</h2>
          <p className={`${aisBodySm} mt-1`}>
            Select a department head to message.
          </p>
        </div>

        <div className="grid min-h-[480px] grid-cols-1 overflow-hidden rounded-2xl border border-ais-card-border bg-white dark:bg-ais-surface md:grid-cols-[220px_1fr]">
          <aside className="border-b border-ais-card-border md:border-b-0 md:border-r">
            <p className="px-3 py-2.5 text-[11px] font-bold uppercase tracking-wide text-ais-on-surface-variant">
              Departments
            </p>
            <div className="max-h-[200px] overflow-y-auto md:max-h-none">
              {departments.length === 0 ? (
                <p className="px-3 py-4 text-xs text-ais-on-surface-variant">
                  No departments on record.
                </p>
              ) : (
                departments.map((d) => {
                  const unread = unreadByDept.get(d.id) ?? 0;
                  const active = d.id === selectedDepartmentId;
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setSelectedDepartmentId(d.id)}
                      className={`flex w-full items-center justify-between px-3 py-2.5 text-left text-sm ${
                        active ? 'bg-ais-primary/10 font-semibold text-ais-primary' : 'hover:bg-ais-row-hover'
                      }`}
                    >
                      <span className="min-w-0 truncate">
                        <span className="block truncate">{d.headName}</span>
                        <span className="block truncate text-[10px] font-normal text-ais-on-surface-variant">
                          {d.name}
                        </span>
                      </span>
                      {unread > 0 && (
                        <span className="ml-2 inline-flex h-5 min-w-[1.25rem] shrink-0 items-center justify-center rounded-full bg-ais-primary px-1.5 text-[10px] font-bold text-white">
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
                {selectedDepartment?.headName ?? 'Select a department'}
              </p>
              {selectedDepartment && (
                <p className="text-xs text-ais-on-surface-variant">{selectedDepartment.name}</p>
              )}
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4" style={{ maxHeight: 360 }}>
              {!selectedDepartmentId ? (
                <p className="py-8 text-center text-sm text-ais-on-surface-variant">
                  Select a department to open the thread.
                </p>
              ) : thread.length === 0 ? (
                <p className="py-8 text-center text-sm text-ais-on-surface-variant">
                  No messages yet with this department head.
                </p>
              ) : (
                thread.map((msg) => {
                  const mine = msg.senderRole === 'school-head';
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
                placeholder="Reply to department head…"
                value={draft}
                disabled={!selectedDepartmentId}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
              <AisBtnPrimary
                type="button"
                disabled={sending || !draft.trim() || !selectedDepartmentId}
                onClick={() => handleSend()}
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
