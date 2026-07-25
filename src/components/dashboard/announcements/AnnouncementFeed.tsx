'use client';

import React, { useMemo, useState } from 'react';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';

export type FeedAnnouncement = {
  id: string;
  title: string;
  body: string;
  publishedAt?: string | null;
  audience?: string;
  authorName?: string;
  authorRole?: string;
};

function timeAgo(raw?: string | null) {
  if (!raw) return 'Just now';
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return String(raw).slice(0, 10);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

export function AnnouncementFeed({
  items,
  schoolName = 'School Head',
}: {
  items: FeedAnnouncement[];
  schoolName?: string;
}) {
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const sorted = useMemo(
    () =>
      [...items].sort((a, b) => {
        const ta = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
        const tb = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
        return tb - ta;
      }),
    [items]
  );

  if (!sorted.length) {
    return (
      <EmptyState
        title="Your feed is quiet"
        description="When the school head posts announcements, they will show up here like a timeline."
      />
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 animate-fade-in">
      <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground shadow-md shadow-primary/20">
            PR
          </div>
          <div className="min-w-0 flex-1 rounded-full border border-border/70 bg-muted/40 px-4 py-2.5 text-sm text-muted-foreground">
            Official school updates appear in your feed
          </div>
        </div>
      </div>

      {sorted.map((post) => {
        const author = post.authorName || schoolName;
        const role = post.authorRole || 'School Head';
        const isLong = post.body.length > 220;
        const showFull = expanded[post.id];
        const body = !isLong || showFull ? post.body : `${post.body.slice(0, 220).trim()}…`;
        const isLiked = !!liked[post.id];

        return (
          <article
            key={post.id}
            className="rounded-2xl border border-border/70 bg-card shadow-sm transition hover:shadow-md"
          >
            <div className="flex gap-3 p-4 pb-2">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 text-xs font-bold text-primary-foreground shadow-sm">
                {initials(author)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <span className="text-sm font-bold text-foreground">{author}</span>
                  <span className="text-[11px] text-muted-foreground">·</span>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                    {role}
                  </span>
                  <span className="text-[11px] text-muted-foreground">· {timeAgo(post.publishedAt)}</span>
                </div>
                {post.audience && post.audience !== 'all' && (
                  <p className="text-[11px] text-muted-foreground">Audience · {post.audience}</p>
                )}
              </div>
              <button
                type="button"
                className="rounded-full p-1.5 text-muted-foreground hover:bg-muted"
                aria-label="More"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zm6 0a2 2 0 11-4 0 2 2 0 014 0zm6 0a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </button>
            </div>

            <div className="px-4 pb-3">
              <h3 className="text-[15px] font-bold leading-snug text-foreground">{post.title}</h3>
              <p className="mt-2 whitespace-pre-wrap text-[14px] leading-relaxed text-foreground/90">{body}</p>
              {isLong && (
                <button
                  type="button"
                  className="mt-1 text-xs font-semibold text-primary hover:underline"
                  onClick={() => setExpanded((e) => ({ ...e, [post.id]: !showFull }))}
                >
                  {showFull ? 'Show less' : 'Show more'}
                </button>
              )}
            </div>

            <div className="mx-4 border-t border-border/60" />

            <div className="grid grid-cols-3 gap-1 px-2 py-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={`h-10 gap-2 text-xs font-semibold ${
                  isLiked ? 'text-primary' : 'text-muted-foreground'
                }`}
                onClick={() => setLiked((l) => ({ ...l, [post.id]: !l[post.id] }))}
              >
                <svg
                  className="h-4 w-4"
                  fill={isLiked ? 'currentColor' : 'none'}
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14zM7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3"
                  />
                </svg>
                {isLiked ? 'Liked' : 'Like'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-10 gap-2 text-xs font-semibold text-muted-foreground"
                onClick={() => {
                  const el = document.getElementById(`comment-${post.id}`);
                  el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                  (el as HTMLInputElement | null)?.focus();
                }}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                Comment
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-10 gap-2 text-xs font-semibold text-muted-foreground"
                onClick={async () => {
                  const text = `${post.title}\n\n${post.body}`;
                  try {
                    await navigator.clipboard.writeText(text);
                  } catch {
                    /* ignore */
                  }
                }}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                  />
                </svg>
                Share
              </Button>
            </div>

            <div className="border-t border-border/50 px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
                  You
                </div>
                <input
                  id={`comment-${post.id}`}
                  className="h-9 flex-1 rounded-full border border-border/70 bg-muted/30 px-3.5 text-xs outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                  placeholder="Write a comment…"
                  disabled
                  title="Comments coming soon"
                />
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
