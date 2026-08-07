'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Hash, Loader2, Users, Volume2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useApp } from '@/context/AppContext';
import type { Community, CommunityChannel, CommunityMessage } from '@/lib/communityTypes';
import { toast } from '@/components/ui/toast';
import { aisBodySm, aisLabelCaps } from '@/components/dashboard/teacher/aisStyles';
import { avatarColor, communityInitials } from '@/components/dashboard/teacher/community/communityUi';
import { MessageBubble } from '@/components/dashboard/teacher/community/MessageBubble';
import { MessageComposer } from '@/components/dashboard/teacher/community/MessageComposer';
import { ThreadPanel } from '@/components/dashboard/teacher/community/ThreadPanel';
import { useCommunityRealtime } from '@/hooks/useCommunityRealtime';

/**
 * Card-based community picker: each card is a community (grouped by department),
 * showing only the ones the current user is a member of. Selecting a card opens
 * that community's channels as flat tabs — no nested sidebar-within-sidebar.
 */
export function CommunityChannelsPanel() {
  const { currentUser, departments } = useApp();
  const userId = currentUser?.id ?? '';
  const userName = currentUser?.displayName ?? 'You';

  const [communities, setCommunities] = useState<Community[]>([]);
  const [loadingCommunities, setLoadingCommunities] = useState(true);
  const [activeCommunityId, setActiveCommunityId] = useState<string | null>(null);

  const [channels, setChannels] = useState<CommunityChannel[]>([]);
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    setLoadingCommunities(true);
    void api
      .listCommunities()
      .then((rows) => {
        if (!cancelled) setCommunities(rows);
      })
      .catch(() => {
        if (!cancelled) setError('Could not load communities.');
      })
      .finally(() => {
        if (!cancelled) setLoadingCommunities(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const activeCommunity = useMemo(
    () => communities.find((c) => c.id === activeCommunityId) ?? null,
    [communities, activeCommunityId],
  );
  const activeChannel = useMemo(
    () => channels.find((c) => c.id === activeChannelId) ?? null,
    [channels, activeChannelId],
  );

  const groups = useMemo(() => {
    const byDept = new Map<string, Community[]>();
    for (const c of communities) {
      const key = c.departmentId
        ? departments.find((d) => d.id === c.departmentId)?.name ?? 'Department'
        : 'School-wide';
      const list = byDept.get(key) ?? [];
      list.push(c);
      byDept.set(key, list);
    }
    return Array.from(byDept.entries());
  }, [communities, departments]);

  useEffect(() => {
    if (!activeCommunityId) {
      setChannels([]);
      setActiveChannelId(null);
      return;
    }
    let cancelled = false;
    void api.listCommunityChannels(activeCommunityId).then((rows) => {
      if (cancelled) return;
      setChannels(rows);
      setActiveChannelId(rows[0]?.id ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [activeCommunityId]);

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
    communityId: activeCommunityId,
    channelId: activeChannelId,
    threadId: activeThreadId,
  });

  // Card grid — pick a community you belong to.
  if (!activeCommunityId) {
    return (
      <div className="space-y-6">
        {loadingCommunities ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-ais-on-surface-variant">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading your communities…
          </div>
        ) : communities.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-ais-card-border bg-ais-surface-container-low/30 py-16 text-center">
            <Users className="mx-auto h-8 w-8 text-ais-on-surface-variant" />
            <p className={`${aisBodySm} mt-2`}>You aren&apos;t a member of any community yet.</p>
          </div>
        ) : (
          groups.map(([groupName, items]) => (
            <div key={groupName} className="space-y-3">
              <p className={aisLabelCaps}>{groupName}</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setActiveCommunityId(c.id)}
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
            </div>
          ))
        )}
      </div>
    );
  }

  const textChannels = channels.filter((c) => c.type === 'text');
  const announcementChannels = channels.filter((c) => c.type === 'announcement');

  return (
    <div className="flex h-[min(68vh,680px)] min-h-[420px] flex-col overflow-hidden rounded-2xl border border-ais-card-border bg-white dark:bg-ais-surface">
      <div className="flex shrink-0 items-center gap-3 border-b border-ais-card-border px-4 py-3">
        <button
          type="button"
          onClick={() => setActiveCommunityId(null)}
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-ais-on-surface-variant transition-colors hover:bg-ais-row-hover hover:text-ais-on-surface"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Communities
        </button>
        <div className="h-4 w-px bg-ais-card-border" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-ais-on-surface">{activeCommunity?.name}</p>
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap gap-1.5 border-b border-ais-card-border px-3 py-2">
        {announcementChannels.map((ch) => (
          <ChannelTab key={ch.id} channel={ch} active={ch.id === activeChannelId} icon={<Volume2 className="h-3.5 w-3.5" />} onClick={() => setActiveChannelId(ch.id)} />
        ))}
        {textChannels.map((ch) => (
          <ChannelTab key={ch.id} channel={ch} active={ch.id === activeChannelId} icon={<Hash className="h-3.5 w-3.5" />} onClick={() => setActiveChannelId(ch.id)} />
        ))}
        {channels.length === 0 && (
          <p className="px-1 py-1 text-xs text-ais-on-surface-variant">No channels yet.</p>
        )}
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
            communityId={activeCommunityId}
            placeholder={activeChannel ? `Message #${activeChannel.name}` : 'Select a channel to message'}
            disabled={!activeChannelId}
            onSend={sendChannelMessage}
            onTyping={() => {
              window.dispatchEvent(
                new CustomEvent('community:local-typing', {
                  detail: { channelId: activeChannelId, communityId: activeCommunityId },
                }),
              );
            }}
          />
        </div>

        {activeThreadId && activeCommunityId ? (
          <div className="absolute inset-0 z-20 bg-white md:static md:z-auto md:w-80 md:shrink-0 md:border-l md:border-ais-card-border">
            <ThreadPanel
              threadId={activeThreadId}
              communityId={activeCommunityId}
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

function ChannelTab({
  channel,
  active,
  icon,
  onClick,
}: {
  channel: CommunityChannel;
  active: boolean;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
        active
          ? 'bg-ais-primary text-white'
          : 'text-ais-on-surface-variant hover:bg-ais-row-hover hover:text-ais-on-surface'
      }`}
    >
      {icon}
      {channel.name}
    </button>
  );
}
