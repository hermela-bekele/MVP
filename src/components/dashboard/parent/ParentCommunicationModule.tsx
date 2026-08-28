'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GraduationCap, Megaphone, Send } from 'lucide-react';
import { api, type MessageThread, type ThreadMessage } from '@/lib/api';
import { readStoredSession } from '@/lib/auth';
import { useApp } from '@/context/AppContext';
import {
  AisPage,
  AisBtnPrimary,
  aisInput,
} from '@/components/dashboard/teacher/TeacherPortalUi';
import {
  aisBodySm,
  aisLabelCaps,
} from '@/components/dashboard/teacher/aisStyles';
import { Select } from '@/components/ui/select';

type SidebarId = 'announcements' | string; // announcements | teacher userId

type TeacherContact = {
  teacherId: string;
  userId: string;
  displayName: string;
  email: string;
  subjects: string[];
};

type AnnouncementItem = {
  id: string;
  title: string;
  body: string;
  authorName?: string;
  publishedAt?: string | null;
};

type Props = {
  announcements?: AnnouncementItem[];
  childrenOptions?: { id: string; name: string }[];
  mode?: 'parent' | 'student';
};

function timeLabel(iso?: string | null) {
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

function subjectLabel(subjects: string[]) {
  if (!subjects.length) return 'General';
  return subjects.join(' · ');
}

export function ParentCommunicationModule({
  announcements: announcementsProp = [],
  childrenOptions = [],
  mode = 'parent',
}: Props) {
  const session = readStoredSession();
  const schoolId = session?.schoolId || 'sch-1';
  const myId = session?.id || '';
  const { teachers: appTeachers, communityPosts, refreshFromApi } = useApp();

  const [activeId, setActiveId] = useState<SidebarId>('announcements');
  const [teachers, setTeachers] = useState<TeacherContact[]>([]);
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [subject, setSubject] = useState('');
  const [studentId, setStudentId] = useState(childrenOptions[0]?.id ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [loadingTeachers, setLoadingTeachers] = useState(true);
  const [portalAnns, setPortalAnns] = useState<AnnouncementItem[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  const selectedTeacher =
    activeId === 'announcements'
      ? undefined
      : teachers.find((t) => t.userId === activeId || t.teacherId === activeId);

  const mergedAnnouncements = useMemo(() => {
    const fromFeed = (communityPosts || [])
      .filter(
        (p) =>
          p.authorRole === 'school-head' ||
          /^announcement\s*:/i.test(p.title || '') ||
          (p.title || '').toLowerCase().includes('announcement'),
      )
      .map((p) => ({
        id: p.id,
        title: (p.title || 'Announcement').replace(/^Announcement:\s*/i, ''),
        body: p.body,
        authorName: p.authorName || 'School Head',
        publishedAt: p.createdAt,
      }));

    const map = new Map<string, AnnouncementItem>();
    for (const a of [...fromFeed, ...portalAnns, ...announcementsProp]) {
      if (!a?.id) continue;
      if (!map.has(a.id)) map.set(a.id, a);
    }
    return [...map.values()].sort((a, b) => {
      const ta = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const tb = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return tb - ta;
    });
  }, [communityPosts, portalAnns, announcementsProp]);

  const teacherThread = useMemo(() => {
    if (!selectedTeacher) return null;
    return (
      threads.find((t) => {
        const staffId = String(t.staffUserId || t.staff_user_id || '');
        return (
          staffId === selectedTeacher.userId || staffId === selectedTeacher.teacherId
        );
      }) ?? null
    );
  }, [threads, selectedTeacher]);

  const refreshThreads = useCallback(async () => {
    try {
      const rows = await api.listMessageThreads();
      setThreads(rows);
    } catch {
      /* keep existing */
    }
  }, []);

  useEffect(() => {
    void refreshFromApi();
    api
      .portalAnnouncements(schoolId)
      .then((rows) => {
        const list = (Array.isArray(rows) ? rows : []).map((a) => {
          const row = a as Record<string, unknown>;
          return {
            id: String(row.id),
            title: String(row.title ?? 'Announcement'),
            body: String(row.body ?? ''),
            authorName: String(row.authorName ?? row.author_name ?? 'School Head'),
            publishedAt: row.publishedAt
              ? String(row.publishedAt)
              : row.published_at
                ? String(row.published_at)
                : row.createdAt
                  ? String(row.createdAt)
                  : null,
          };
        });
        setPortalAnns(list);
      })
      .catch(() => setPortalAnns([]));
  }, [schoolId, refreshFromApi]);

  useEffect(() => {
    setLoadingTeachers(true);
    const enrich = (list: TeacherContact[]) =>
      list.map((t) => {
        const match =
          appTeachers.find((at) => at.id === t.teacherId) ||
          appTeachers.find((at) => at.email?.toLowerCase() === t.email?.toLowerCase()) ||
          appTeachers.find((at) => at.name === t.displayName);
        return {
          ...t,
          subjects: t.subjects.length ? t.subjects : match?.subjects ?? [],
        };
      });

    api
      .listPortalContacts(schoolId)
      .then((data) => {
        const list = (data.teachers || [])
          .filter((t) => t.userId || t.teacherId)
          .map((t) => ({
            teacherId: t.teacherId,
            userId: String(t.userId || t.teacherId),
            displayName: t.displayName,
            email: t.email,
            subjects: [] as string[],
          }));
        if (list.length) {
          setTeachers(enrich(list));
          return;
        }
        throw new Error('empty');
      })
      .catch(() => {
        const fallback = (appTeachers || [])
          .filter((t) => t.status === 'Active')
          .map((t) => ({
            teacherId: t.id,
            userId: t.id,
            displayName: t.name,
            email: t.email || '',
            subjects: t.subjects || [],
          }));
        setTeachers(fallback);
      })
      .finally(() => setLoadingTeachers(false));
    void refreshThreads();
  }, [schoolId, refreshThreads, appTeachers]);

  useEffect(() => {
    if (childrenOptions[0]?.id && !studentId) {
      setStudentId(childrenOptions[0].id);
    }
  }, [childrenOptions, studentId]);

  useEffect(() => {
    if (!teacherThread?.id) {
      setMessages([]);
      return;
    }
    api
      .getThreadMessages(teacherThread.id)
      .then(setMessages)
      .catch(() => setMessages([]));
  }, [teacherThread?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, activeId]);

  const ensureThreadAndSend = async () => {
    if (!draft.trim() || !selectedTeacher) return;
    setBusy(true);
    setError('');
    try {
      let threadId = teacherThread?.id;
      if (!threadId) {
        const { id } = await api.createMessageThread({
          schoolId,
          studentId: studentId || undefined,
          parentUserId: myId,
          staffUserId: selectedTeacher.userId,
          staffRole: 'teacher',
          subject:
            subject.trim() || `Message to ${selectedTeacher.displayName}`,
          body: draft.trim(),
        });
        threadId = id;
        setSubject('');
        setDraft('');
        await refreshThreads();
        setMessages(await api.getThreadMessages(threadId));
      } else {
        await api.replyToThread(threadId, draft.trim());
        setDraft('');
        setMessages(await api.getThreadMessages(threadId));
        await refreshThreads();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send message');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AisPage className="!space-y-0 h-[calc(100vh-220px)]">
      <div className="grid h-full min-h-0 grid-cols-1 gap-4 md:grid-cols-[260px_1fr] md:items-stretch">
        <aside className="flex h-full min-h-0 flex-col rounded-2xl border border-border bg-white p-3 dark:bg-card">
          <p className="px-2 pb-2 pt-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
            Your channels
          </p>
          <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto">
            <button
              type="button"
              onClick={() => setActiveId('announcements')}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                activeId === 'announcements'
                  ? 'bg-primary/10 text-primary'
                  : 'text-foreground hover:bg-muted'
              }`}
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                  activeId === 'announcements'
                    ? 'bg-primary text-white'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                <Megaphone className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">#announcements</span>
                <span className="block truncate text-[11px] text-muted-foreground">
                  From the school head
                </span>
              </span>
            </button>

            <p className="px-2 pb-1 pt-3 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
              Teachers
            </p>
            {loadingTeachers ? (
              <p className="px-3 py-2 text-xs text-muted-foreground">Loading…</p>
            ) : teachers.length === 0 ? (
              <p className="px-3 py-2 text-xs text-muted-foreground">No teachers yet</p>
            ) : (
              teachers.map((t) => {
                const active = activeId === t.userId;
                return (
                  <button
                    key={t.userId}
                    type="button"
                    onClick={() => setActiveId(t.userId)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                      active
                        ? 'bg-primary/10 text-primary'
                        : 'text-foreground hover:bg-muted'
                    }`}
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                        active
                          ? 'bg-primary text-white'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      <GraduationCap className="h-4 w-4" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{t.displayName}</span>
                      <span
                        className={`block truncate text-[11px] ${
                          active ? 'text-primary/80' : 'text-muted-foreground'
                        }`}
                      >
                        {subjectLabel(t.subjects)}
                      </span>
                    </span>
                  </button>
                );
              })
            )}
          </nav>
        </aside>

        <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-border bg-white dark:bg-card">
          {activeId === 'announcements' && (
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
              <div>
                <p className={aisLabelCaps}>#announcements</p>
                <p className={`${aisBodySm} mt-1`}>School-wide notices from the school head.</p>
              </div>
              {mergedAnnouncements.length === 0 ? (
                <p className={`${aisBodySm} py-10 text-center`}>No announcements yet.</p>
              ) : (
                <ul className="space-y-3">
                  {mergedAnnouncements.map((a) => (
                    <li
                      key={a.id}
                      className="rounded-xl border border-border bg-muted/40 p-4"
                    >
                      <p className="text-sm font-bold text-foreground">{a.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {a.authorName || 'School Head'}
                        {a.publishedAt ? ` · ${timeLabel(a.publishedAt)}` : ''}
                      </p>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{a.body}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {selectedTeacher && (
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="flex shrink-0 items-start gap-3 border-b border-border px-4 py-3">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <GraduationCap className="h-4 w-4" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    {selectedTeacher.displayName}
                  </p>
                  <p className="text-xs font-medium text-primary">
                    {subjectLabel(selectedTeacher.subjects)}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Direct message
                    {mode === 'parent' ? ' · about your child' : ''}
                  </p>
                </div>
              </div>

              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
                {messages.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No messages yet with {selectedTeacher.displayName}. Send the first one below.
                  </p>
                ) : (
                  messages.map((m) => {
                    const mine = String(m.sender_user_id || '') === myId;
                    return (
                      <div
                        key={m.id}
                        className={`flex w-full ${mine ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[85%] px-3.5 py-2.5 text-sm shadow-sm ${
                            mine
                              ? 'rounded-2xl rounded-br-md bg-primary/12 text-foreground ring-1 ring-primary/15'
                              : 'rounded-2xl rounded-bl-md bg-muted text-foreground ring-1 ring-border'
                          }`}
                        >
                          {!mine && (
                            <p className="mb-0.5 text-[11px] font-semibold text-muted-foreground">
                              {m.sender_role || 'teacher'}
                            </p>
                          )}
                          <p className="whitespace-pre-wrap leading-relaxed">{m.body}</p>
                          <p className="mt-1 text-right text-[10px] text-muted-foreground/80">
                            {timeLabel(m.created_at)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={bottomRef} />
              </div>

              {error && <p className="shrink-0 px-4 pb-1 text-xs text-red-600">{error}</p>}

              <div className="mt-auto shrink-0 space-y-2 border-t border-border bg-white p-3 dark:bg-card">
                {!teacherThread && mode === 'parent' && childrenOptions.length > 0 && (
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Select
                      variant="ais"
                      label="About student"
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      options={childrenOptions.map((c) => ({
                        value: c.id,
                        label: c.name,
                      }))}
                    />
                    <div className="min-w-0">
                      <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Topic
                      </label>
                      <input
                        className={aisInput}
                        placeholder="Topic (optional)"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                      />
                    </div>
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    className={`${aisInput} flex-1`}
                    placeholder={`Message ${selectedTeacher.displayName}…`}
                    value={draft}
                    disabled={busy}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        void ensureThreadAndSend();
                      }
                    }}
                  />
                  <AisBtnPrimary
                    type="button"
                    disabled={busy || !draft.trim()}
                    onClick={() => void ensureThreadAndSend()}
                  >
                    <Send className="h-3.5 w-3.5" aria-hidden />
                    Send
                  </AisBtnPrimary>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AisPage>
  );
}
