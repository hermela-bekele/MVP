'use client';

import React, { useMemo, useState } from 'react';
import { MessageCircle, Plus, Send } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import {
  AisBtnPrimary,
  AisBtnSecondary,
  AisPage,
  aisFormLabel,
  aisInput,
  aisTextarea,
} from '@/components/dashboard/teacher/TeacherPortalUi';
import {
  aisBodySm,
  aisCard,
  aisHeadlineSm,
  aisLabelCaps,
} from '@/components/dashboard/teacher/aisStyles';
import { Dialog, DialogFooter } from '@/components/ui/dialog';

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

export function TeacherCommunityTab() {
  const {
    communityPosts,
    communityReplies,
    createCommunityPost,
    replyToCommunityPost,
    currentUser,
  } = useApp();

  const [composeOpen, setComposeOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [posting, setPosting] = useState(false);

  const sortedPosts = useMemo(
    () =>
      [...communityPosts].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [communityPosts],
  );

  const repliesByPost = useMemo(() => {
    const map = new Map<string, typeof communityReplies>();
    for (const reply of communityReplies) {
      const list = map.get(reply.postId) ?? [];
      list.push(reply);
      map.set(reply.postId, list);
    }
    for (const [id, list] of map) {
      map.set(
        id,
        [...list].sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        ),
      );
    }
    return map;
  }, [communityReplies]);

  const handleCreate = async () => {
    if (!title.trim() || !body.trim()) return;
    setPosting(true);
    try {
      await createCommunityPost({ title: title.trim(), body: body.trim() });
      setTitle('');
      setBody('');
      setComposeOpen(false);
    } finally {
      setPosting(false);
    }
  };

  const handleReply = async (postId: string) => {
    const text = (replyDrafts[postId] ?? '').trim();
    if (!text) return;
    await replyToCommunityPost(postId, text);
    setReplyDrafts((prev) => ({ ...prev, [postId]: '' }));
  };

  return (
    <AisPage>
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className={aisLabelCaps}>Teacher community</p>
            <h2 className={`${aisHeadlineSm} mt-1`}>Share challenges, get peer feedback</h2>
            <p className={`${aisBodySm} mt-1 max-w-xl`}>
              Post classroom challenges or opportunities. Colleagues reply in threads — keep it
              practical and supportive.
            </p>
          </div>
          <AisBtnPrimary type="button" onClick={() => setComposeOpen(true)}>
            <Plus className="h-3.5 w-3.5" aria-hidden />
            New post
          </AisBtnPrimary>
        </div>

        {sortedPosts.length === 0 ? (
          <div className={`${aisCard} flex flex-col items-center gap-3 px-6 py-14 text-center`}>
            <MessageCircle className="h-8 w-8 text-ais-on-surface-variant" />
            <p className={aisHeadlineSm}>No posts yet</p>
            <p className={aisBodySm}>
              Be the first to share a challenge from your classroom. Peers and your HoD can respond.
            </p>
            <AisBtnSecondary type="button" onClick={() => setComposeOpen(true)}>
              Start a thread
            </AisBtnSecondary>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedPosts.map((post) => {
              const replies = repliesByPost.get(post.id) ?? [];
              const open = activePostId === post.id;
              return (
                <article key={post.id} className={`${aisCard} overflow-hidden`}>
                  <button
                    type="button"
                    className="w-full px-5 py-4 text-left transition-colors hover:bg-ais-row-hover"
                    onClick={() => setActivePostId(open ? null : post.id)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-base font-semibold text-ais-on-surface">{post.title}</h3>
                        <p className="mt-1 text-xs text-ais-on-surface-variant">
                          {post.authorName}
                          {post.subject ? ` · ${post.subject}` : ''}
                          {post.grade ? ` · ${post.grade}` : ''}
                          {' · '}
                          {timeLabel(post.createdAt)}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-ais-surface-container-low px-2.5 py-1 text-[11px] font-medium text-ais-on-surface-variant">
                        {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
                      </span>
                    </div>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-ais-on-surface/90">
                      {post.body}
                    </p>
                  </button>

                  {open && (
                    <div className="border-t border-ais-card-border bg-ais-surface-container-low/30 px-5 py-4">
                      <div className="space-y-3">
                        {replies.length === 0 ? (
                          <p className="text-xs text-ais-on-surface-variant">
                            No replies yet — offer a tip or ask a clarifying question.
                          </p>
                        ) : (
                          replies.map((reply) => (
                            <div
                              key={reply.id}
                              className={`rounded-xl border border-ais-card-border bg-white px-3.5 py-3 dark:bg-ais-surface ${
                                reply.parentReplyId ? 'ml-6' : ''
                              }`}
                            >
                              <p className="text-xs font-semibold text-ais-on-surface">
                                {reply.authorName}
                                <span className="ml-2 font-normal text-ais-on-surface-variant">
                                  {timeLabel(reply.createdAt)}
                                </span>
                              </p>
                              <p className="mt-1 whitespace-pre-wrap text-sm text-ais-on-surface/90">
                                {reply.body}
                              </p>
                            </div>
                          ))
                        )}
                      </div>

                      <div className="mt-4 flex gap-2">
                        <input
                          className={`${aisInput} flex-1`}
                          placeholder={
                            currentUser?.role === 'department-head'
                              ? 'Reply as HoD…'
                              : 'Write a reply…'
                          }
                          value={replyDrafts[post.id] ?? ''}
                          onChange={(e) =>
                            setReplyDrafts((prev) => ({ ...prev, [post.id]: e.target.value }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              void handleReply(post.id);
                            }
                          }}
                        />
                        <AisBtnPrimary
                          type="button"
                          onClick={() => void handleReply(post.id)}
                          disabled={!(replyDrafts[post.id] ?? '').trim()}
                        >
                          <Send className="h-3.5 w-3.5" aria-hidden />
                          Reply
                        </AisBtnPrimary>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>

      <Dialog
        isOpen={composeOpen}
        onClose={() => setComposeOpen(false)}
        title="Share with the community"
        size="md"
        largeTitle
      >
        <div className="space-y-4 pt-1">
          <div>
            <label className={aisFormLabel}>Title</label>
            <input
              className={`${aisInput} mt-1`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Short summary of the challenge"
            />
          </div>
          <div>
            <label className={aisFormLabel}>Details</label>
            <textarea
              className={`${aisTextarea} mt-1 min-h-[140px]`}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="What happened in class? What support or ideas would help?"
            />
          </div>
          <DialogFooter>
            <AisBtnSecondary type="button" onClick={() => setComposeOpen(false)}>
              Cancel
            </AisBtnSecondary>
            <AisBtnPrimary
              type="button"
              disabled={posting || !title.trim() || !body.trim()}
              onClick={() => void handleCreate()}
            >
              <Send className="h-3.5 w-3.5" aria-hidden />
              {posting ? 'Posting…' : 'Post'}
            </AisBtnPrimary>
          </DialogFooter>
        </div>
      </Dialog>
    </AisPage>
  );
}
