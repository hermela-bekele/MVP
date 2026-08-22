'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Hash, Megaphone, MessageSquare } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { TeacherHodMessagesTab } from '@/components/dashboard/teacher/TeacherHodMessagesTab';
import { DeptHodMessagesPanel } from '@/components/dashboard/department-head/DeptHodMessagesPanel';
import { CommunityChannelsPanel } from '@/components/dashboard/communication/CommunityChannelsPanel';
import { StudentFeedbackTab } from '@/components/dashboard/student/StudentFeedbackTab';
import type { CommunicationMainTab } from '@/components/dashboard/communication/CommunicationTabToggle';
import {
  AisPage,
  aisInput,
  aisTextarea,
  AisBtnPrimary,
} from '@/components/dashboard/teacher/TeacherPortalUi';
import {
  aisBodySm,
  aisLabelCaps,
} from '@/components/dashboard/teacher/aisStyles';
import { api } from '@/lib/api';
import { resolveDeptHeadScope } from '@/lib/departmentHead';

export type { CommunicationMainTab } from '@/components/dashboard/communication/CommunicationTabToggle';

type ChannelId = 'announcements' | 'hod' | 'community';

type Announcement = {
  id: string;
  title: string;
  body: string;
  authorName: string;
  createdAt: string;
};

/**
 * Unified Communication module: channel sidebar (Announcements, HoD, Community).
 */
export function CommunicationModule({
  mode,
  mainTab,
  onMainTabChange: _onMainTabChange,
}: {
  mode: 'teacher' | 'department-head' | 'school-head' | 'student';
  mainTab: CommunicationMainTab;
  onMainTabChange: (tab: CommunicationMainTab) => void;
}) {
  const { currentUser, communityPosts, refreshFromApi } = useApp();
  const hasDirectChannel = mode === 'teacher' || mode === 'department-head';
  const [channel, setChannel] = useState<ChannelId>(hasDirectChannel ? 'hod' : 'announcements');
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [announceTitle, setAnnounceTitle] = useState('');
  const [announceBody, setAnnounceBody] = useState('');
  const [posting, setPosting] = useState(false);

  const scope = useMemo(
    () => (mode === 'department-head' ? resolveDeptHeadScope(currentUser) : null),
    [currentUser, mode],
  );

  const canPostAnnouncement =
    mode === 'school-head' || currentUser?.role === 'school-head';

  useEffect(() => {
    // Seed announcements from challenge/community posts tagged as announcements,
    // plus any local posts the HoD creates in this session.
    const fromFeed = (communityPosts || [])
      .filter((p) => p.title?.toLowerCase().includes('announcement') || p.authorRole === 'department-head')
      .slice(0, 30)
      .map((p) => ({
        id: p.id,
        title: p.title || 'Announcement',
        body: p.body,
        authorName: p.authorName,
        createdAt: p.createdAt,
      }));
    setAnnouncements((prev) => {
      const ids = new Set(fromFeed.map((a) => a.id));
      const localOnly = prev.filter((a) => !ids.has(a.id) && a.id.startsWith('local-'));
      return [...localOnly, ...fromFeed];
    });
  }, [communityPosts]);

  const channels: { id: ChannelId; label: string; description: string; icon: React.ReactNode }[] = [
    {
      id: 'announcements',
      label: 'announcements',
      description: 'Notices from the school head',
      icon: <Megaphone className="h-4 w-4" />,
    },
    ...(hasDirectChannel
      ? [
          {
            id: 'hod' as ChannelId,
            label: mode === 'teacher' ? 'hod-direct' : 'teachers',
            description: mode === 'teacher' ? 'Direct line to your HoD' : 'Chat with your teachers',
            icon: <MessageSquare className="h-4 w-4" />,
          },
        ]
      : []),
    {
      id: 'community',
      label: 'community',
      description:
        mode === 'school-head'
          ? 'Department, HoD & student groups'
          : mode === 'student'
            ? 'Your class & school groups'
            : 'Department & school groups',
      icon: <Hash className="h-4 w-4" />,
    },
  ];

  const postAnnouncement = async () => {
    if (!announceTitle.trim() || !announceBody.trim()) return;
    setPosting(true);
    try {
      const local: Announcement = {
        id: `local-${Date.now()}`,
        title: announceTitle.trim(),
        body: announceBody.trim(),
        authorName: currentUser?.displayName || 'School Head',
        createdAt: new Date().toISOString(),
      };
      try {
        await api.createCommunityPost({
          title: `Announcement: ${local.title}`,
          body: local.body,
          authorId: currentUser?.id,
          authorName: local.authorName,
          authorRole: 'school-head',
          departmentId: scope?.departmentId,
        });
        try {
          await api.createAnnouncement({
            title: local.title,
            body: local.body,
            schoolId: currentUser?.schoolId,
            audience: 'all',
            authorName: local.authorName,
            authorRole: 'school-head',
          });
        } catch {
          /* portal announcements table may be unavailable — community post still works */
        }
        await refreshFromApi();
        setAnnouncements((prev) => [local, ...prev.filter((a) => a.id !== local.id)]);
      } catch {
        setAnnouncements((prev) => [local, ...prev]);
      }
      setAnnounceTitle('');
      setAnnounceBody('');
    } finally {
      setPosting(false);
    }
  };

  if (mainTab === 'students' && mode === 'student') {
    return (
      <AisPage>
        <StudentFeedbackTab />
      </AisPage>
    );
  }

  return (
    <AisPage>
      <div className="grid min-h-[calc(100vh-220px)] grid-cols-1 gap-4 md:grid-cols-[260px_1fr] md:items-stretch">
        <aside className="flex h-full min-h-[calc(100vh-220px)] flex-col rounded-2xl border border-border bg-white p-3 dark:bg-card">
            <p className="px-2 pb-2 pt-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
              Your channels
            </p>
            <nav className="min-h-0 flex-1 space-y-1.5">
              {channels.map((c) => {
                const active = channel === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setChannel(c.id)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                      active
                        ? 'bg-primary/10 text-primary'
                        : 'text-foreground hover:bg-muted'
                    }`}
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                        active
                          ? 'bg-primary text-white'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {c.icon}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">#{c.label}</span>
                      <span className="block truncate text-[11px] text-muted-foreground">
                        {c.description}
                      </span>
                    </span>
                  </button>
                );
              })}
            </nav>
          </aside>

          <div
            className={
              channel === 'community'
                ? 'min-h-0'
                  : channel === 'hod'
                  ? 'flex min-h-0 flex-col'
                  : 'min-h-0 overflow-y-auto rounded-2xl border border-border bg-white p-4 dark:bg-card'
            }
          >
            {channel === 'announcements' && (
              <div className="space-y-4">
                <div>
                  <p className={aisLabelCaps}>#announcements</p>
                  <p className={`${aisBodySm} mt-1`}>
                    School-wide notices from the school head. Only the school head can publish here.
                  </p>
                </div>
                {canPostAnnouncement && (
                  <div className="space-y-2 rounded-xl border border-border p-3">
                    <input
                      className={aisInput}
                      placeholder="Announcement title"
                      value={announceTitle}
                      onChange={(e) => setAnnounceTitle(e.target.value)}
                    />
                    <textarea
                      className={aisTextarea}
                      placeholder="Write the announcement…"
                      value={announceBody}
                      onChange={(e) => setAnnounceBody(e.target.value)}
                      rows={3}
                    />
                    <AisBtnPrimary
                      type="button"
                      disabled={posting || !announceTitle.trim() || !announceBody.trim()}
                      onClick={() => void postAnnouncement()}
                    >
                      Post announcement
                    </AisBtnPrimary>
                  </div>
                )}
                {announcements.length === 0 ? (
                  <p className={`${aisBodySm} py-8 text-center`}>No announcements yet.</p>
                ) : (
                  <ul className="space-y-3">
                    {announcements.map((a) => (
                      <li
                        key={a.id}
                        className="rounded-xl border border-border bg-muted/40 p-4"
                      >
                        <p className="text-sm font-bold text-foreground">{a.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {a.authorName} ·{' '}
                          {new Date(a.createdAt).toLocaleString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{a.body}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {channel === 'hod' && hasDirectChannel &&
              (mode === 'teacher' ? <TeacherHodMessagesTab /> : <DeptHodMessagesPanel />)}

            {channel === 'community' && <CommunityChannelsPanel />}
          </div>
        </div>
    </AisPage>
  );
}
