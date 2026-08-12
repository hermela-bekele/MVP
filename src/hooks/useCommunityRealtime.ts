'use client';

import { useEffect, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';
import { getApiBase } from '@/lib/api';
import { readStoredSession } from '@/lib/auth';
import type { CommunityMessage } from '@/lib/communityTypes';
import { toast } from '@/components/ui/toast';

type Options = {
  communityId: string | null;
  channelId: string | null;
  threadId?: string | null;
  enabled?: boolean;
};

/**
 * Connects to the Express Socket.IO server and bridges events into
 * window CustomEvents that CommunityHub / ThreadPanel already listen for.
 */
export function useCommunityRealtime({
  communityId,
  channelId,
  threadId = null,
  enabled = true,
}: Options) {
  const socketRef = useRef<Socket | null>(null);
  const communityIdRef = useRef(communityId);
  const channelIdRef = useRef(channelId);
  const threadIdRef = useRef(threadId);
  
  useEffect(() => {
    communityIdRef.current = communityId;
    channelIdRef.current = channelId;
    threadIdRef.current = threadId;
  }, [communityId, channelId, threadId]);

  useEffect(() => {
    if (!enabled) return;
    const session = readStoredSession();
    if (!session?.id) return;

    const socket = io(getApiBase(), {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      auth: {
        token: session.token,
        userId: session.id,
      },
    });
    socketRef.current = socket;

    const syncRooms = () => {
      const cId = communityIdRef.current;
      const chId = channelIdRef.current;
      const tId = threadIdRef.current;
      if (cId) socket.emit('community:join', { communityId: cId });
      if (chId && cId) socket.emit('channel:join', { channelId: chId, communityId: cId });
      if (tId && cId) socket.emit('thread:join', { threadId: tId, communityId: cId });
    };

    socket.on('connect', syncRooms);

    socket.on('message:new', (payload: {
      scope: 'channel' | 'thread';
      message: CommunityMessage;
    }) => {
      if (payload.scope === 'channel') {
        window.dispatchEvent(
          new CustomEvent('community:channel-message', { detail: payload.message }),
        );
      } else {
        window.dispatchEvent(
          new CustomEvent('community:thread-message', { detail: payload.message }),
        );
      }
    });

    socket.on('typing:update', (payload: {
      displayName: string;
      channelId?: string;
      threadId?: string;
    }) => {
      window.dispatchEvent(
        new CustomEvent('community:typing', {
          detail: {
            displayName: payload.displayName,
            channelId: payload.channelId,
            threadId: payload.threadId,
          },
        }),
      );
    });

    socket.on('presence:update', (payload: {
      communityId: string;
      onlineUserIds: string[];
    }) => {
      window.dispatchEvent(
        new CustomEvent('community:presence', {
          detail: { onlineUserIds: payload.onlineUserIds, communityId: payload.communityId },
        }),
      );
    });

    socket.on('mention:new', (payload: { message?: CommunityMessage }) => {
      const msg = payload?.message;
      toast({
        title: msg ? `${msg.authorName} mentioned you` : 'You were mentioned',
        description: msg?.content?.slice(0, 80),
        variant: 'info',
      });
      window.dispatchEvent(new CustomEvent('community:mention', { detail: payload }));
    });

    socket.on('reaction:update', (payload: { messageId: string; channelId?: string }) => {
      window.dispatchEvent(new CustomEvent('community:reaction', { detail: payload }));
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [enabled]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket?.connected || !communityId) return;
    socket.emit('community:join', { communityId });
    return () => {
      socket.emit('community:leave', { communityId });
    };
  }, [communityId]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket?.connected || !channelId || !communityId) return;
    socket.emit('channel:join', { channelId, communityId });
    return () => {
      socket.emit('channel:leave', { channelId });
    };
  }, [channelId, communityId]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket?.connected || !threadId || !communityId) return;
    socket.emit('thread:join', { threadId, communityId });
    return () => {
      socket.emit('thread:leave', { threadId });
    };
  }, [threadId, communityId]);

  useEffect(() => {
    const onLocalTyping = (e: Event) => {
      const detail = (e as CustomEvent<{
        channelId: string | null;
        communityId: string | null;
      }>).detail;
      const socket = socketRef.current;
      if (!socket || !detail?.communityId) return;
      socket.emit('typing:start', {
        communityId: detail.communityId,
        channelId: detail.channelId ?? undefined,
      });
    };
    window.addEventListener('community:local-typing', onLocalTyping);
    return () => window.removeEventListener('community:local-typing', onLocalTyping);
  }, []);
}
