'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Folder,
  Hash,
  Loader2,
  Megaphone,
  Star,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useApp } from '@/context/AppContext';
import type { CommunityChannel, CommunityMessage } from '@/lib/communityTypes';
import { toast } from '@/components/ui/toast';
import { aisBodySm, aisLabelCaps } from '@/components/dashboard/teacher/aisStyles';
import { avatarColor, communityInitials, formatMessageTime } from '@/components/dashboard/teacher/community/communityUi';
import { MessageBubble } from '@/components/dashboard/teacher/community/MessageBubble';
import { MessageComposer } from '@/components/dashboard/teacher/community/MessageComposer';
import { ThreadPanel } from '@/components/dashboard/teacher/community/ThreadPanel';
import { useCommunityRealtime } from '@/hooks/useCommunityRealtime';

type ChannelFilter = 'all' | 'announcement' | 'text';

function channelIcon(channel: CommunityChannel) {
  if (channel.type === 'announcement') return <Megaphone className="h-5 w-5" />;
  const name = channel.name.toLowerCase();
  if (name.includes('event')) return <Calendar className="h-5 w-5" />;
  if (name.includes('resource')) return <Folder className="h-5 w-5" />;
  if (name.includes('feedback')) return <Star className="h-5 w-5" />;
  if (name.includes('lesson') || name.includes('plan')) return <BookOpen className="h-5 w-5" />;
  return <Hash className="h-5 w-5" />;
}

/**
 * Workspace home for one Community: header (name, favorite, member count),
 * All/Announcements/Posts filter tabs, a card grid of channels, and a
 * recent-activity feed. Clicking a card opens that channel's chat.
 * Which community is active is decided by the sidebar (see Sidebar.tsx).
 */
export function CommunityChannelsPanel({
  communityId,
  onBack,
}: {
  communityId: string;
  onBack: () => void;
}) {
  const { currentUser } = useApp();
  const userId = currentUser?.id ?? '';
  const userName = currentUser?.displayName ?? 'You';

  const [channels, setChannels] = useState<CommunityChannel[]>([]);
  const [loadingChannels, setLoadingChannels] = useState(true);
  const [filter, setFilter] = useState<ChannelFilter>('all');
  const [activity, setActivity] = useState<{ channel: CommunityChannel; message: CommunityMessage }[]>([]);

  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setActiveChannelId(null);
    setLoadingChannels(true);
    let cancelled = false;
    api
      .listCommunityChannels(communityId)
      .then((ch) => {
        if (!cancelled) setChannels(ch);
      })
      .finally(() => {
        if (!cancelled) setLoadingChannels(false);
      });
    return () => {
      cancelled = true;
    };
  }, [communityId]);

  // Recent Activity: latest message from each channel, merged and sorted.
  useEffect(() => {
    if (channels.length === 0) {
      setActivity([]);
      return;
    }
    let cancelled = false;
    void Promise.all(
      channels.map((channel) =>
        api
          .getChannelMessages(channel.id, { limit: 1 })
          .then((res) => (res.messages[0] ? { channel, message: res.messages[0] } : null))
          .catch(() => null),
      ),
    ).then((results) => {
      if (cancelled) return;
      const withMessage = results.filter(
        (r): r is { channel: CommunityChannel; message: CommunityMessage } => r !== null,
      );
      withMessage.sort((a, b) => b.message.createdAt.localeCompare(a.message.createdAt));
      setActivity(withMessage.slice(0, 6));
    });
    return () => {
      cancelled = true;
    };
  }, [channels]);

  const activeChannel = useMemo(
    () => channels.find((c) => c.id === activeChannelId) ?? null,
    [channels, activeChannelId],
  );

  const filteredChannels = useMemo(
    () => channels.filter((c) => filter === 'all' || c.type === filter),
    [channels, filter],
  );

  const loadMessages = useCallback(async (channelId: string) => {
    setLoadingMessages(true);
    setError('');
    try {
      const data = await api.getChannelMessages(channelId, { limit: 50 });
      setMessages(data.messages);
      void api.markChannelRead(channelId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages');
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    if (!activeChannelId) {
      setMessages([]);
      return;
    }
    setActiveThreadId(null);
    void loadMessages(activeChannelId);
  }, [activeChannelId, loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [messages.length, activeChannelId]);

  useEffect(() => {
    const handler = (e: Event) => {
      const msg = (e as CustomEvent<CommunityMessage>).detail;
      if (!msg || msg.channelId !== activeChannelId) return;
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) {
          return prev.map((m) => (m.id === msg.id ? { ...msg, pending: false } : m));
        }
        const withoutTemp = prev.filter(
          (m) => !(m.pending && m.authorId === msg.authorId && m.content === msg.content),
        );
        return [...withoutTemp, msg];
      });
    };
    window.addEventListener('community:channel-message', handler);
    return () => window.removeEventListener('community:channel-message', handler);
  }, [activeChannelId]);

  const sendChannelMessage = async (content: string) => {
    if (!activeChannelId) return;
    const tempId = `temp-${Date.now()}`;
    const optimistic: CommunityMessage = {
      id: tempId,
      channelId: activeChannelId,
      threadId: null,
      authorId: userId,
      authorName: userName,
      content,
      parentMessageId: null,
      createdAt: new Date().toISOString(),
      editedAt: null,
      reactions: [],
      pending: true,
    };
    setMessages((prev) => [...prev, optimistic]);
    try {
      const saved = await api.postChannelMessage(activeChannelId, { content });
      setMessages((prev) => prev.map((m) => (m.id === tempId ? saved : m)));
    } catch {
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, pending: false, failed: true } : m)),
      );
    }
  };

  const onReact = async (messageId: string, emoji: string) => {
    try {
      await api.toggleMessageReaction(messageId, emoji);
      if (activeChannelId) await loadMessages(activeChannelId);
    } catch {
      /* ignore */
    }
  };

  const onStartThread = async (message: CommunityMessage) => {
    try {
      const thread = await api.startMessageThread(message.id);
      setActiveThreadId(thread.id);
    } catch (err) {
      toast({
        title: 'Could not start thread',
        description: err instanceof Error ? err.message : 'Try again',
        variant: 'alert',
      });
    }
  };

  const onDelete = async (messageId: string) => {
    try {
      await api.deleteCommunityMessage(messageId);
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    } catch (err) {
      toast({
        title: 'Delete failed',
        description: err instanceof Error ? err.message : 'Try again',
        variant: 'alert',
      });
    }
  };

  useCommunityRealtime({
    communityId,
    channelId: activeChannelId,
    threadId: activeThreadId,
  });

  // Channel chat view
  if (activeChannelId) {
    return (
      <div className="flex h-[calc(100vh-150px)] min-h-[520px] flex-col overflow-hidden rounded-2xl border border-ais-card-border bg-white dark:bg-ais-surface">
        <div className="flex shrink-0 items-center gap-3 border-b border-ais-card-border px-4 py-3">
          <button
            type="button"
            onClick={() => setActiveChannelId(null)}
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-ais-on-surface-variant transition-colors hover:bg-ais-row-hover hover:text-ais-on-surface"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Channels
          </button>
          <div className="h-4 w-px bg-ais-card-border" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-ais-on-surface">#{activeChannel?.name}</p>
          </div>
        </div>

        <div className="relative flex min-h-0 flex-1">
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex-1 overflow-y-auto">
              {loadingMessages && (
                <div className="flex items-center justify-center gap-2 py-16 text-sm text-ais-on-surface-variant">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading messages…
                </div>
              )}
              {!loadingMessages && error && (
                <p className="px-4 py-8 text-center text-sm text-ais-error">{error}</p>
              )}
              {!loadingMessages && !error && messages.length === 0 && (
                <div className="px-6 py-16 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-ais-surface-container-low text-ais-primary">
                    <Hash className="h-6 w-6" />
                  </div>
                  <p className="mt-3 text-base font-semibold text-ais-on-surface">
                    Welcome to #{activeChannel?.name ?? 'channel'}
                  </p>
                  <p className={`${aisBodySm} mx-auto mt-1 max-w-sm`}>
                    This is the start of the channel. Send a message to get the conversation going.
                  </p>
                </div>
              )}
              {!loadingMessages &&
                messages.map((m) => (
                  <MessageBubble
                    key={m.id}
                    message={m}
                    currentUserId={userId}
                    canModerate={false}
                    onReact={onReact}
                    onStartThread={onStartThread}
                    onOpenThread={(id) => setActiveThreadId(id)}
                    onDelete={onDelete}
                  />
                ))}
              <div ref={bottomRef} />
            </div>

            <MessageComposer
              communityId={communityId}
              placeholder={activeChannel ? `Message #${activeChannel.name}` : 'Select a channel to message'}
              disabled={!activeChannelId}
              onSend={sendChannelMessage}
              onTyping={() => {
                window.dispatchEvent(
                  new CustomEvent('community:local-typing', {
                    detail: { channelId: activeChannelId, communityId },
                  }),
                );
              }}
            />
          </div>

          {activeThreadId ? (
            <div className="absolute inset-0 z-20 bg-white md:static md:z-auto md:w-80 md:shrink-0 md:border-l md:border-ais-card-border">
              <ThreadPanel
                threadId={activeThreadId}
                communityId={communityId}
                currentUserId={userId}
                currentUserName={userName}
                canModerate={false}
                onClose={() => setActiveThreadId(null)}
              />
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  // Workspace home: header + filter tabs + channel cards + recent activity
  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-ais-on-surface-variant transition-colors hover:bg-ais-row-hover hover:text-ais-on-surface"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Communities
      </button>

      <div className="flex flex-wrap items-center justify-end gap-3">
        <div className="inline-flex rounded-xl border border-ais-card-border bg-ais-surface-container-low/40 p-1">
          {([
            { id: 'all', label: 'All' },
            { id: 'announcement', label: 'Announcements' },
            { id: 'text', label: 'Posts' },
          ] as const).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                filter === tab.id
                  ? 'bg-white text-ais-primary shadow-[0_1px_3px_rgba(15,23,42,0.05)]'
                  : 'text-ais-on-surface-variant hover:text-ais-on-surface'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {loadingChannels ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-ais-on-surface-variant">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading channels…
        </div>
      ) : filteredChannels.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ais-card-border bg-ais-surface-container-low/30 py-16 text-center">
          <Hash className="mx-auto h-8 w-8 text-ais-on-surface-variant" />
          <p className={`${aisBodySm} mt-2`}>No channels here yet.</p>
        </div>
      ) : (
        <div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {filteredChannels.map((channel) => (
              <button
                key={channel.id}
                type="button"
                onClick={() => setActiveChannelId(channel.id)}
                className="group rounded-xl border border-l-4 border-ais-card-border border-l-ais-primary bg-ais-surface-container-low/40 p-3.5 text-left transition-all hover:bg-white hover:shadow-sm dark:bg-ais-surface"
              >
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-ais-primary shadow-sm">
                    {channelIcon(channel)}
                  </span>
                  <p className="truncate text-sm font-bold text-ais-on-surface group-hover:text-ais-primary">
                    #{channel.name}
                  </p>
                </div>
                <p className="mt-2 line-clamp-2 text-xs text-ais-on-surface-variant">
                  {channel.description || (channel.type === 'announcement' ? 'Official updates and important announcements.' : 'General discussion.')}
                </p>
                {(channel.unreadCount ?? 0) > 0 && (
                  <span className="mt-2 inline-flex items-center rounded-full bg-ais-primary/10 px-2 py-0.5 text-[10px] font-bold text-ais-primary">
                    {channel.unreadCount} new
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {activity.length > 0 && (
        <div>
          <p className={`${aisLabelCaps} mb-3`}>Recent Activity</p>
          <div className="divide-y divide-ais-row-border rounded-2xl border border-ais-card-border bg-white dark:bg-ais-surface">
            {activity.map(({ channel, message }) => (
              <button
                key={message.id}
                type="button"
                onClick={() => setActiveChannelId(channel.id)}
                className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-ais-row-hover"
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${avatarColor(message.authorId)}`}
                >
                  {communityInitials(message.authorName)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <span className="text-sm font-bold text-ais-on-surface">{message.authorName}</span>
                    <span className="rounded-full bg-ais-surface-container-low px-1.5 py-0.5 text-[10px] font-semibold text-ais-on-surface-variant">
                      #{channel.name}
                    </span>
                    <span className="text-[11px] text-ais-outline">{formatMessageTime(message.createdAt)}</span>
                  </div>
                  <p className="truncate text-xs text-ais-on-surface-variant">{message.content}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
