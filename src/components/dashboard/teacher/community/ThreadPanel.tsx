'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { api } from '@/lib/api';
import type { CommunityMessage, CommunityThread } from '@/lib/communityTypes';
import { aisLabelCaps, aisNavbarIconBtn } from '@/components/dashboard/teacher/aisStyles';
import { MessageBubble } from './MessageBubble';
import { MessageComposer } from './MessageComposer';

type Props = {
  threadId: string;
  communityId: string;
  currentUserId: string;
  currentUserName: string;
  canModerate: boolean;
  onClose: () => void;
  onMessageEvent?: (msg: CommunityMessage) => void;
};

export function ThreadPanel({
  threadId,
  communityId,
  currentUserId,
  currentUserName,
  canModerate,
  onClose,
  onMessageEvent,
}: Props) {
  const [thread, setThread] = useState<CommunityThread | null>(null);
  const [root, setRoot] = useState<CommunityMessage | null>(null);
  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getCommunityThreadMessages(threadId, { limit: 50 });
      setThread(data.thread);
      setRoot(data.rootMessage);
      setMessages(data.messages);
      void api.markThreadRead(threadId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load thread');
    } finally {
      setLoading(false);
    }
  }, [threadId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (stickToBottom.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  const appendMessage = useCallback(
    (msg: CommunityMessage) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      onMessageEvent?.(msg);
    },
    [onMessageEvent],
  );

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<CommunityMessage>).detail;
      if (detail?.threadId === threadId) appendMessage(detail);
    };
    window.addEventListener('community:thread-message', handler);
    return () => window.removeEventListener('community:thread-message', handler);
  }, [threadId, appendMessage]);

  const send = async (content: string) => {
    const tempId = `temp-${Date.now()}`;
    const optimistic: CommunityMessage = {
      id: tempId,
      channelId: null,
      threadId,
      authorId: currentUserId,
      authorName: currentUserName,
      content,
      parentMessageId: null,
      createdAt: new Date().toISOString(),
      editedAt: null,
      reactions: [],
      pending: true,
    };
    setMessages((prev) => [...prev, optimistic]);
    try {
      const saved = await api.postCommunityThreadMessage(threadId, { content });
      setMessages((prev) => prev.map((m) => (m.id === tempId ? saved : m)));
      onMessageEvent?.(saved);
    } catch {
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, pending: false, failed: true } : m)),
      );
    }
  };

  const onReact = async (messageId: string, emoji: string) => {
    try {
      await api.toggleMessageReaction(messageId, emoji);
      await load();
    } catch {
      /* ignore */
    }
  };

  const onDelete = async (messageId: string) => {
    try {
      await api.deleteCommunityMessage(messageId);
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
      if (root?.id === messageId) setRoot(null);
    } catch {
      /* ignore */
    }
  };

  return (
    <aside className="flex h-full w-full flex-col border-l border-border bg-white md:w-80 lg:w-96">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-muted/40 px-4">
        <div className="min-w-0">
          <p className={aisLabelCaps}>Thread</p>
          <p className="truncate text-sm font-bold text-foreground">
            {thread?.title || 'Discussion'}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className={aisNavbarIconBtn}
          aria-label="Close thread"
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      <div
        className="flex-1 overflow-y-auto"
        onScroll={(e) => {
          const el = e.currentTarget;
          stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
        }}
      >
        {loading && (
          <p className="px-4 py-6 text-sm text-muted-foreground">Loading thread…</p>
        )}
        {error && <p className="px-4 py-6 text-sm text-destructive">{error}</p>}
        {!loading && !error && (
          <>
            {root && (
              <div className="border-b border-border bg-muted/50">
                <MessageBubble
                  message={root}
                  currentUserId={currentUserId}
                  canModerate={canModerate}
                  showThreadLink={false}
                  onReact={onReact}
                  onDelete={onDelete}
                />
              </div>
            )}
            <div>
              {messages.length === 0 ? (
                <p className="px-4 py-6 text-center text-xs text-muted-foreground">
                  No replies yet — start the discussion.
                </p>
              ) : (
                messages.map((m) => (
                  <MessageBubble
                    key={m.id}
                    message={m}
                    currentUserId={currentUserId}
                    canModerate={canModerate}
                    showThreadLink={false}
                    onReact={onReact}
                    onDelete={onDelete}
                  />
                ))
              )}
            </div>
            <div ref={bottomRef} />
          </>
        )}
      </div>

      <MessageComposer
        communityId={communityId}
        placeholder="Reply in thread…"
        disabled={thread?.isArchived}
        onSend={send}
      />
    </aside>
  );
}
