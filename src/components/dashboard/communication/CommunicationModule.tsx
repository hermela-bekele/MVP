'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, Megaphone, Plus, Users } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { CommunityChannelsPanel } from '@/components/dashboard/communication/CommunityChannelsPanel';
import { StudentFeedbackTab } from '@/components/dashboard/student/StudentFeedbackTab';
import type { CommunicationMainTab } from '@/components/dashboard/communication/CommunicationTabToggle';
import {
  AisPage,
  aisInput,
  AisBtnPrimary,
} from '@/components/dashboard/teacher/TeacherPortalUi';
import {
  aisBodySm,
  aisLabelCaps,
} from '@/components/dashboard/teacher/aisStyles';
import { api } from '@/lib/api';
import { departmentIdForSubject, resolveDeptHeadScope } from '@/lib/departmentHead';
import { canCreateCommunity, type Community } from '@/lib/communityTypes';
import { avatarColor, communityInitials } from '@/components/dashboard/teacher/community/communityUi';
import { Pagination } from '@/components/ui/pagination';

const ANNOUNCEMENTS_PAGE_SIZE = 10;

export type { CommunicationMainTab } from '@/components/dashboard/communication/CommunicationTabToggle';

type Announcement = {
  id: string;
  title: string;
  body: string;
  authorName: string;
  createdAt: string;
};

/**
 * Communication surface for a school: the school-wide announcements board,
 * plus a card grid of the user's Communities. Picking a card opens that
 * community's channel workspace; opening a channel takes over the page.
 * Students get a dedicated Feedback tab (selected via mainTab) instead of
 * the channel/community view.
 */
export function CommunicationModule({
  mode,
  mainTab,
  onMainTabChange: _onMainTabChange,
}: {
  mode: 'teacher' | 'department-head' | 'school-head' | 'student';
  mainTab?: CommunicationMainTab;
  onMainTabChange?: (tab: CommunicationMainTab) => void;
}) {
  const { currentUser, teachers, resolveTeacherId } = useApp();
  const [communityId, setCommunityId] = useState<string | null>(null);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loadingCommunities, setLoadingCommunities] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCommunityName, setNewCommunityName] = useState('');
  const [newCommunityDescription, setNewCommunityDescription] = useState('');
  const [creating, setCreating] = useState(false);

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [announcementsPage, setAnnouncementsPage] = useState(1);

  const scope = useMemo(
    () => (mode === 'department-head' ? resolveDeptHeadScope(currentUser) : null),
    [currentUser, mode],
  );

  // CO-001: only school admins/leadership/department heads may create permanent
  // communities — a plain teacher must not see (or be able to trigger) this affordance.
  const canCreate = canCreateCommunity(currentUser?.role);

  // A subject teacher (or their department head) only sees their own department's
  // communities, plus any school-wide ones. School-head sees everything.
  const myDepartmentId = useMemo(() => {
    if (mode === 'department-head') return scope?.departmentId ?? null;
    if (mode === 'teacher') {
      const teacherId = resolveTeacherId();
      const subject = teachers.find((t) => t.id === teacherId)?.subjects?.[0];
      return subject ? departmentIdForSubject(subject) : null;
    }
    return null;
  }, [mode, scope, teachers, resolveTeacherId]);

  const visibleCommunities = useMemo(() => {
    if (!myDepartmentId) return communities;
    return communities.filter((c) => !c.departmentId || c.departmentId === myDepartmentId);
  }, [communities, myDepartmentId]);

  const loadCommunities = React.useCallback(() => {
    setLoadingCommunities(true);
    return api
      .listCommunities()
      .then((rows) => setCommunities(rows))
      .finally(() => setLoadingCommunities(false));
  }, []);

  useEffect(() => {
    void loadCommunities();
  }, [loadCommunities]);

  // Real announcements from the one source of truth (the `announcements` table,
  // the same one SchoolHeadAnnouncements.tsx publishes to) — this module only
  // displays them; publishing happens on the school head's dedicated Announcements
  // page so there is exactly one write path, not two.
  useEffect(() => {
    api
      .portalAnnouncements(currentUser?.schoolId ?? undefined)
      .then((rows) =>
        setAnnouncements(
          (rows as Record<string, unknown>[]).map((r) => ({
            id: String(r.id),
            title: String(r.title ?? ''),
            body: String(r.body ?? ''),
            authorName: 'School Head',
            createdAt: String(r.publishedAt ?? ''),
          })),
        ),
      )
      .catch(() => setAnnouncements([]));
  }, [currentUser?.schoolId]);

  const createCommunity = async () => {
    if (!newCommunityName.trim()) return;
    setCreating(true);
    try {
      const created = await api.createCommunity({
        name: newCommunityName.trim(),
        description: newCommunityDescription.trim() || undefined,
        departmentId: scope?.departmentId,
      });
      setNewCommunityName('');
      setNewCommunityDescription('');
      setShowCreateForm(false);
      await loadCommunities();
      setCommunityId(created.id);
    } finally {
      setCreating(false);
    }
  };

  if (mainTab === 'students' && mode === 'student') {
    return (
      <AisPage>
        <StudentFeedbackTab />
      </AisPage>
    );
  }

  if (communityId) {
    return (
      <AisPage>
        <div className="mx-auto max-w-5xl">
          <CommunityChannelsPanel communityId={communityId} onBack={() => setCommunityId(null)} />
        </div>
      </AisPage>
    );
  }

  const announcementsTotalPages = Math.max(1, Math.ceil(announcements.length / ANNOUNCEMENTS_PAGE_SIZE));
  const announcementsCurrentPage = Math.min(announcementsPage, announcementsTotalPages);
  const pagedAnnouncements = announcements.slice(
    (announcementsCurrentPage - 1) * ANNOUNCEMENTS_PAGE_SIZE,
    announcementsCurrentPage * ANNOUNCEMENTS_PAGE_SIZE
  );

  return (
    <AisPage>
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="space-y-4 rounded-2xl border border-ais-card-border bg-white p-4 dark:bg-ais-surface">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ais-primary/10 text-ais-primary">
              <Megaphone className="h-5 w-5" />
            </span>
            <div>
              <p className={aisLabelCaps}>#announcements</p>
              <p className={aisBodySm}>
                School-wide notices from the school head.
              </p>
            </div>
          </div>

          {announcements.length === 0 ? (
            <p className={`${aisBodySm} py-4 text-center`}>No announcements yet.</p>
          ) : (
            <ul className="space-y-3">
              {pagedAnnouncements.map((a) => (
                <li
                  key={a.id}
                  className="rounded-xl border border-ais-card-border bg-ais-surface-container-low/40 p-4"
                >
                  <p className="text-sm font-bold text-ais-on-surface">{a.title}</p>
                  <p className="mt-1 text-xs text-ais-on-surface-variant">
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
          <Pagination
            className="mt-3"
            currentPage={announcementsCurrentPage}
            totalPages={announcementsTotalPages}
            onPageChange={setAnnouncementsPage}
            totalItems={announcements.length}
            pageSize={ANNOUNCEMENTS_PAGE_SIZE}
            entityLabel="announcements"
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className={aisLabelCaps}>Your Communities</p>
            {canCreate && (
              <button
                type="button"
                onClick={() => setShowCreateForm((v) => !v)}
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold text-ais-primary transition-colors hover:bg-ais-primary/10"
              >
                <Plus className="h-3.5 w-3.5" />
                Create Community
              </button>
            )}
          </div>

          {canCreate && showCreateForm && (
            <div className="space-y-2 rounded-xl border border-ais-card-border p-3">
              <input
                className={aisInput}
                placeholder="Community name"
                value={newCommunityName}
                onChange={(e) => setNewCommunityName(e.target.value)}
              />
              <input
                className={aisInput}
                placeholder="Description (optional)"
                value={newCommunityDescription}
                onChange={(e) => setNewCommunityDescription(e.target.value)}
              />
              <AisBtnPrimary
                type="button"
                disabled={creating || !newCommunityName.trim()}
                onClick={() => void createCommunity()}
              >
                Create
              </AisBtnPrimary>
            </div>
          )}

          {loadingCommunities ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-ais-on-surface-variant">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading your communities…
            </div>
          ) : visibleCommunities.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-ais-card-border bg-ais-surface-container-low/30 py-16 text-center">
              <Users className="mx-auto h-8 w-8 text-ais-on-surface-variant" />
              <p className={`${aisBodySm} mt-2`}>You aren&apos;t a member of any community yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visibleCommunities.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCommunityId(c.id)}
                  className="group flex items-start gap-3 rounded-2xl border border-ais-card-border bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:border-ais-primary/40 hover:shadow-md dark:bg-ais-surface"
                >
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white ${avatarColor(c.id)}`}
                  >
                    {communityInitials(c.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-ais-on-surface group-hover:text-ais-primary">
                      {c.name}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-ais-on-surface-variant">
                      {c.description || 'No description yet.'}
                    </p>
                    {(c.unreadCount ?? 0) > 0 && (
                      <span className="mt-2 inline-flex items-center rounded-full bg-ais-primary/10 px-2 py-0.5 text-[10px] font-bold text-ais-primary">
                        {c.unreadCount} new
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </AisPage>
  );
}
