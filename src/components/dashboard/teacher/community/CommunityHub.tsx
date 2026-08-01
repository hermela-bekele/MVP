"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Bell, Hash, Loader2, Menu, Plus, Volume2, X } from "lucide-react";
import { api } from "@/lib/api";
import { useApp } from "@/context/AppContext";
import type {
  Community,
  CommunityChannel,
  CommunityMessage,
  MentionNotification,
} from "@/lib/communityTypes";
import { Dialog, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import {
  AisBtnPrimary,
  AisBtnSecondary,
  AisPage,
  aisFormLabel,
  aisInput,
  aisTextarea,
} from "@/components/dashboard/teacher/TeacherPortalUi";
import {
  aisBodySm,
  aisCard,
  aisHeadlineSm,
  aisLabelCaps,
  aisNavbarIconBtn,
  aisSidebarBadge,
  aisSidebarNavItem,
  aisSidebarNavItemActive,
  aisSidebarNavItemInactive,
  aisSidebarSectionHeader,
} from "@/components/dashboard/teacher/aisStyles";
import { avatarColor, communityInitials } from "./communityUi";
import { MessageBubble } from "./MessageBubble";
import { MessageComposer } from "./MessageComposer";
import { ThreadPanel } from "./ThreadPanel";
import { useCommunityRealtime } from "@/hooks/useCommunityRealtime";

function canCreateCommunities(role?: string) {
  return (
    role === "school-head" ||
    role === "moe" ||
    role === "curriculum-head" ||
    role === "department-head"
  );
}

function isCommunityAdmin(role?: string) {
  return role === "owner" || role === "admin";
}

export function CommunityHub() {
  const { currentUser } = useApp();
  const userId = currentUser?.id ?? "";
  const userName = currentUser?.displayName ?? "You";

  const [communities, setCommunities] = useState<Community[]>([]);
  const [activeCommunityId, setActiveCommunityId] = useState<string | null>(
    null,
  );
  const [channels, setChannels] = useState<CommunityChannel[]>([]);
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loadingCommunities, setLoadingCommunities] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [error, setError] = useState("");
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [mobileNav, setMobileNav] = useState<
    "closed" | "communities" | "channels"
  >("closed");
  const [createOpen, setCreateOpen] = useState(false);
  const [createChannelOpen, setCreateChannelOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<MentionNotification[]>([]);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newChannelName, setNewChannelName] = useState("");
  const [typingLabel, setTypingLabel] = useState("");
  const [onlineIds, setOnlineIds] = useState<Set<string>>(new Set());

  const bottomRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);
  const topSentinelRef = useRef<HTMLDivElement>(null);
  const feedRef = useRef<HTMLDivElement>(null);

  const activeCommunity = useMemo(
    () => communities.find((c) => c.id === activeCommunityId) ?? null,
    [communities, activeCommunityId],
  );
  const activeChannel = useMemo(
    () => channels.find((c) => c.id === activeChannelId) ?? null,
    [channels, activeChannelId],
  );
  const canModerate = isCommunityAdmin(activeCommunity?.memberRole);
  const unreadMentions = notifications.filter((n) => !n.isRead).length;

  const refreshCommunities = useCallback(async () => {
    setLoadingCommunities(true);
    try {
      const rows = await api.listCommunities();
      setCommunities(rows);
      setActiveCommunityId((prev) => prev ?? rows[0]?.id ?? null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load communities",
      );
    } finally {
      setLoadingCommunities(false);
    }
  }, []);

  const refreshNotifications = useCallback(async () => {
    try {
      const rows = await api.getCommunityNotifications();
      setNotifications(rows);
    } catch {
      /* optional */
    }
  }, []);

  useEffect(() => {
    void refreshCommunities();
    void refreshNotifications();
  }, [refreshCommunities, refreshNotifications]);

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
      setActiveChannelId((prev) => {
        if (prev && rows.some((r) => r.id === prev)) return prev;
        return rows[0]?.id ?? null;
      });
    });
    return () => {
      cancelled = true;
    };
  }, [activeCommunityId]);

  const loadMessages = useCallback(
    async (channelId: string) => {
      setLoadingMessages(true);
      setError("");
      try {
        const data = await api.getChannelMessages(channelId, { limit: 50 });
        setMessages(data.messages);
        setHasMore(data.hasMore);
        void api.markChannelRead(channelId);
        setCommunities((prev) =>
          prev.map((c) =>
            c.id === activeCommunityId
              ? { ...c, unreadCount: Math.max(0, (c.unreadCount ?? 0) - 1) }
              : c,
          ),
        );
        setChannels((prev) =>
          prev.map((ch) =>
            ch.id === channelId ? { ...ch, unreadCount: 0 } : ch,
          ),
        );
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load messages",
        );
        setMessages([]);
      } finally {
        setLoadingMessages(false);
      }
    },
    [activeCommunityId],
  );

  useEffect(() => {
    if (!activeChannelId) {
      setMessages([]);
      return;
    }
    setActiveThreadId(null);
    void loadMessages(activeChannelId);
  }, [activeChannelId, loadMessages]);

  useEffect(() => {
    if (stickToBottom.current) {
      bottomRef.current?.scrollIntoView({ behavior: "auto" });
    }
  }, [messages.length, activeChannelId]);

  const loadOlder = useCallback(async () => {
    if (!activeChannelId || !hasMore || loadingOlder || messages.length === 0)
      return;
    const oldest = messages[0];
    setLoadingOlder(true);
    const el = feedRef.current;
    const prevHeight = el?.scrollHeight ?? 0;
    try {
      const data = await api.getChannelMessages(activeChannelId, {
        limit: 50,
        before: oldest.id,
      });
      setMessages((prev) => {
        const ids = new Set(prev.map((m) => m.id));
        const merged = [
          ...data.messages.filter((m) => !ids.has(m.id)),
          ...prev,
        ];
        return merged;
      });
      setHasMore(data.hasMore);
      requestAnimationFrame(() => {
        if (el) el.scrollTop = el.scrollHeight - prevHeight;
      });
    } finally {
      setLoadingOlder(false);
    }
  }, [activeChannelId, hasMore, loadingOlder, messages]);

  useEffect(() => {
    const node = topSentinelRef.current;
    const root = feedRef.current;
    if (!node || !root) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void loadOlder();
      },
      { root, threshold: 0.1 },
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [loadOlder]);

  // Channel message live events (socket will dispatch these)
  useEffect(() => {
    const handler = (e: Event) => {
      const msg = (e as CustomEvent<CommunityMessage>).detail;
      if (!msg || msg.channelId !== activeChannelId) return;
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) {
          return prev.map((m) =>
            m.id === msg.id ? { ...msg, pending: false } : m,
          );
        }
        // Drop matching optimistic temps from self
        const withoutTemp = prev.filter(
          (m) =>
            !(
              m.pending &&
              m.authorId === msg.authorId &&
              m.content === msg.content
            ),
        );
        return [...withoutTemp, msg];
      });
      if (msg.authorId !== userId) {
        const mentioned = msg.content
          .toLowerCase()
          .includes(`@${userName.toLowerCase()}`);
        if (mentioned) {
          toast({
            title: `${msg.authorName} mentioned you`,
            description: msg.content.slice(0, 80),
            variant: "info",
          });
          void refreshNotifications();
        }
      }
    };
    const typingHandler = (e: Event) => {
      const detail = (
        e as CustomEvent<{ channelId: string; displayName: string }>
      ).detail;
      if (detail?.channelId !== activeChannelId) return;
      setTypingLabel(`${detail.displayName} is typingâ€¦`);
      window.setTimeout(() => setTypingLabel(""), 2000);
    };
    const presenceHandler = (e: Event) => {
      const detail = (e as CustomEvent<{ onlineUserIds: string[] }>).detail;
      if (detail?.onlineUserIds) setOnlineIds(new Set(detail.onlineUserIds));
    };
    window.addEventListener("community:channel-message", handler);
    window.addEventListener("community:typing", typingHandler);
    window.addEventListener("community:presence", presenceHandler);
    return () => {
      window.removeEventListener("community:channel-message", handler);
      window.removeEventListener("community:typing", typingHandler);
      window.removeEventListener("community:presence", presenceHandler);
    };
  }, [activeChannelId, userId, userName, refreshNotifications]);

  useEffect(() => {
    const onMention = () => {
      void refreshNotifications();
    };
    const onReaction = () => {
      if (activeChannelId) void loadMessages(activeChannelId);
    };
    window.addEventListener("community:mention", onMention);
    window.addEventListener("community:reaction", onReaction);
    return () => {
      window.removeEventListener("community:mention", onMention);
      window.removeEventListener("community:reaction", onReaction);
    };
  }, [refreshNotifications, activeChannelId, loadMessages]);

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
    stickToBottom.current = true;
    try {
      const saved = await api.postChannelMessage(activeChannelId, { content });
      setMessages((prev) => prev.map((m) => (m.id === tempId ? saved : m)));
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempId ? { ...m, pending: false, failed: true } : m,
        ),
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
      setMessages((prev) =>
        prev.map((m) =>
          m.id === message.id
            ? {
                ...m,
                threadIdForRoot: thread.id,
                threadReplyCount: m.threadReplyCount ?? 0,
              }
            : m,
        ),
      );
    } catch (err) {
      toast({
        title: "Could not start thread",
        description: err instanceof Error ? err.message : "Try again",
        variant: "alert",
      });
    }
  };

  const onDelete = async (messageId: string) => {
    try {
      await api.deleteCommunityMessage(messageId);
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    } catch (err) {
      toast({
        title: "Delete failed",
        description: err instanceof Error ? err.message : "Try again",
        variant: "alert",
      });
    }
  };

  const createCommunity = async () => {
    if (!newName.trim()) return;
    try {
      const created = await api.createCommunity({
        name: newName.trim(),
        description: newDesc.trim(),
        type: "custom",
      });
      setCommunities((prev) =>
        [...prev, created].sort((a, b) => a.name.localeCompare(b.name)),
      );
      setActiveCommunityId(created.id);
      setCreateOpen(false);
      setNewName("");
      setNewDesc("");
      toast({ title: "Community created", variant: "success" });
    } catch (err) {
      toast({
        title: "Create failed",
        description: err instanceof Error ? err.message : "Try again",
        variant: "alert",
      });
    }
  };

  const createChannel = async () => {
    if (!activeCommunityId || !newChannelName.trim()) return;
    try {
      const ch = await api.createCommunityChannel(activeCommunityId, {
        name: newChannelName.trim(),
      });
      setChannels((prev) =>
        [...prev, ch].sort((a, b) => a.position - b.position),
      );
      setActiveChannelId(ch.id);
      setCreateChannelOpen(false);
      setNewChannelName("");
    } catch (err) {
      toast({
        title: "Could not create channel",
        description: err instanceof Error ? err.message : "Try again",
        variant: "alert",
      });
    }
  };

  const textChannels = channels.filter((c) => c.type === "text");
  const announcementChannels = channels.filter(
    (c) => c.type === "announcement",
  );

  useCommunityRealtime({
    communityId: activeCommunityId,
    channelId: activeChannelId,
    threadId: activeThreadId,
  });
  const communityRail = (
    <div className="flex h-full w-[4.5rem] shrink-0 flex-col items-center gap-2 border-r border-ais-card-border bg-ais-surface-container-low py-3">
      <button
        type="button"
        className={`relative ${aisNavbarIconBtn} h-10 w-10`}
        title="Mentions"
        onClick={() => {
          setNotifOpen(true);
          void refreshNotifications();
        }}
      >
        <Bell className="h-4 w-4" />
        {unreadMentions > 0 && (
          <span
            className={`${aisSidebarBadge} absolute -right-0.5 -top-0.5 !ml-0`}
          >
            {unreadMentions}
          </span>
        )}
      </button>
      <div className="mb-1 h-px w-8 bg-ais-card-border" />
      <div className="flex w-full flex-1 flex-col items-center gap-2 overflow-y-auto px-2">
        {loadingCommunities && (
          <Loader2 className="h-5 w-5 animate-spin text-ais-outline" />
        )}
        {communities.map((c) => {
          const active = c.id === activeCommunityId;
          return (
            <button
              key={c.id}
              type="button"
              title={c.name}
              onClick={() => {
                setActiveCommunityId(c.id);
                setMobileNav("channels");
              }}
              className={`relative flex h-11 w-11 items-center justify-center rounded-xl text-xs font-bold text-white shadow-sm transition-all ${
                active
                  ? "ring-2 ring-ais-primary ring-offset-2 ring-offset-ais-surface-container-low"
                  : "opacity-90 hover:opacity-100"
              } ${avatarColor(c.id)}`}
            >
              {c.iconUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={c.iconUrl}
                  alt=""
                  className="h-full w-full rounded-xl object-cover"
                />
              ) : (
                communityInitials(c.name)
              )}
              {(c.unreadCount ?? 0) > 0 && !active && (
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-ais-surface-container-low bg-ais-primary" />
              )}
            </button>
          );
        })}
      </div>
      {canCreateCommunities(currentUser?.role) && (
        <button
          type="button"
          title="Create community"
          onClick={() => setCreateOpen(true)}
          className="mt-1 flex h-11 w-11 items-center justify-center rounded-xl border border-dashed border-ais-outline-variant text-ais-primary transition-colors hover:border-ais-primary hover:bg-white"
        >
          <Plus className="h-5 w-5" />
        </button>
      )}
    </div>
  );

  const channelSidebar = (
    <div className="flex h-full w-56 shrink-0 flex-col border-r border-ais-card-border bg-ais-surface-container-low">
      <div className="flex h-14 items-center border-b border-ais-card-border px-3">
        <div className="min-w-0">
          <p className={aisLabelCaps}>Community</p>
          <h2 className="truncate text-sm font-bold text-ais-on-surface">
            {activeCommunity?.name ?? "Select a community"}
          </h2>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-2 py-2">
        {announcementChannels.length > 0 && (
          <div className="mb-2">
            <p className={aisSidebarSectionHeader}>Announcements</p>
            {announcementChannels.map((ch) => (
              <ChannelButton
                key={ch.id}
                channel={ch}
                active={ch.id === activeChannelId}
                icon={<Volume2 className="h-4 w-4" />}
                onClick={() => {
                  setActiveChannelId(ch.id);
                  setMobileNav("closed");
                }}
              />
            ))}
          </div>
        )}
        <div>
          <div className="mb-0.5 flex items-center justify-between pr-1">
            <p className={aisSidebarSectionHeader}>Text channels</p>
            {canModerate && (
              <button
                type="button"
                className={aisNavbarIconBtn}
                title="Create channel"
                onClick={() => setCreateChannelOpen(true)}
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          {textChannels.map((ch) => (
            <ChannelButton
              key={ch.id}
              channel={ch}
              active={ch.id === activeChannelId}
              icon={<Hash className="h-4 w-4" />}
              onClick={() => {
                setActiveChannelId(ch.id);
                setMobileNav("closed");
              }}
            />
          ))}
        </div>
      </div>
      <div className="border-t border-ais-card-border px-3 py-3">
        <div className="flex items-center gap-2.5">
          <div
            className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${avatarColor(userId)}`}
          >
            {communityInitials(userName)}
            <span
              className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-ais-surface-container-low ${
                onlineIds.size === 0 || onlineIds.has(userId)
                  ? "bg-ais-success"
                  : "bg-ais-outline"
              }`}
            />
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-bold text-ais-on-surface">
              {userName}
            </p>
            <p className="truncate text-[10px] font-medium capitalize text-ais-on-surface-variant">
              {activeCommunity?.memberRole ?? "member"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <AisPage>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className={`${aisBodySm} mt-1 max-w-xl`}>
            Collaborate by department or school-wide. Use channels for topics
            and threads for focused side discussions.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <AisBtnSecondary
            type="button"
            onClick={() => {
              setNotifOpen(true);
              void refreshNotifications();
            }}
          >
            <Bell className="h-3.5 w-3.5" aria-hidden />
            Mentions
            {unreadMentions > 0 ? ` (${unreadMentions})` : ""}
          </AisBtnSecondary>
          {canCreateCommunities(currentUser?.role) && (
            <AisBtnPrimary type="button" onClick={() => setCreateOpen(true)}>
              <Plus className="h-3.5 w-3.5" aria-hidden />
              New community
            </AisBtnPrimary>
          )}
        </div>
      </div>

      <div
        className={`${aisCard} flex h-[min(70vh,720px)] min-h-[420px] overflow-hidden`}
      >
        <div className="hidden h-full md:flex">{communityRail}</div>
        <div className="hidden h-full md:flex">{channelSidebar}</div>

        <div className="flex h-full min-w-0 flex-1 flex-col bg-white">
          <header className="flex h-14 shrink-0 items-center gap-2 border-b border-ais-card-border bg-ais-surface-container-low/40 px-3 sm:px-4">
            <button
              type="button"
              className={`${aisNavbarIconBtn} md:hidden`}
              onClick={() => setMobileNav("communities")}
              aria-label="Open navigation"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-ais-on-surface">
                {activeChannel ? (
                  <>
                    <span className="text-ais-outline">#</span>
                    {activeChannel.name}
                  </>
                ) : (
                  "Select a channel"
                )}
              </p>
              {activeChannel?.description ? (
                <p className="truncate text-[11px] text-ais-on-surface-variant">
                  {activeChannel.description}
                </p>
              ) : null}
            </div>
          </header>

          <div className="relative flex min-h-0 flex-1">
            <div className="flex min-w-0 flex-1 flex-col">
              <div
                ref={feedRef}
                className="flex-1 overflow-y-auto"
                onScroll={(e) => {
                  const el = e.currentTarget;
                  stickToBottom.current =
                    el.scrollHeight - el.scrollTop - el.clientHeight < 100;
                }}
              >
                <div ref={topSentinelRef} className="h-1" />
                {loadingOlder && (
                  <p className="py-2 text-center text-xs text-ais-outline">
                    Loading older messages…
                  </p>
                )}
                {loadingMessages && (
                  <div className="flex items-center justify-center gap-2 py-16 text-sm text-ais-on-surface-variant">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading messages…
                  </div>
                )}
                {!loadingMessages && error && (
                  <p className="px-4 py-8 text-center text-sm text-ais-error">
                    {error}
                  </p>
                )}
                {!loadingMessages && !error && messages.length === 0 && (
                  <div className="px-6 py-16 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-ais-surface-container-low text-ais-primary">
                      <Hash className="h-6 w-6" />
                    </div>
                    <p className="mt-3 text-base font-semibold text-ais-on-surface">
                      Welcome to #{activeChannel?.name ?? "channel"}
                    </p>
                    <p className={`${aisBodySm} mx-auto mt-1 max-w-sm`}>
                      This is the start of the channel. Send a message to get
                      the conversation going.
                    </p>
                  </div>
                )}
                {!loadingMessages &&
                  messages.map((m) => (
                    <MessageBubble
                      key={m.id}
                      message={m}
                      currentUserId={userId}
                      canModerate={canModerate}
                      onReact={onReact}
                      onStartThread={onStartThread}
                      onOpenThread={(id) => setActiveThreadId(id)}
                      onDelete={onDelete}
                    />
                  ))}
                <div ref={bottomRef} />
              </div>

              {typingLabel ? (
                <p className="px-4 py-1 text-[11px] text-ais-on-surface-variant">
                  {typingLabel}
                </p>
              ) : null}

              <MessageComposer
                communityId={activeCommunityId}
                placeholder={
                  activeChannel
                    ? `Message #${activeChannel.name}`
                    : "Select a channel to message"
                }
                disabled={!activeChannelId}
                onSend={sendChannelMessage}
                onTyping={() => {
                  window.dispatchEvent(
                    new CustomEvent("community:local-typing", {
                      detail: {
                        channelId: activeChannelId,
                        communityId: activeCommunityId,
                      },
                    }),
                  );
                }}
              />
            </div>

            {activeThreadId && activeCommunityId ? (
              <div className="absolute inset-0 z-20 bg-white md:static md:z-auto">
                <ThreadPanel
                  threadId={activeThreadId}
                  communityId={activeCommunityId}
                  currentUserId={userId}
                  currentUserName={userName}
                  canModerate={canModerate}
                  onClose={() => setActiveThreadId(null)}
                />
              </div>
            ) : null}
          </div>
        </div>

        {mobileNav !== "closed" && (
          <div className="fixed inset-0 z-40 flex md:hidden">
            <div
              className="absolute inset-0 bg-ais-on-surface/40"
              onClick={() => setMobileNav("closed")}
              aria-hidden
            />
            <div className="relative z-10 flex h-full shadow-2xl">
              {communityRail}
              {mobileNav === "channels" || activeCommunityId
                ? channelSidebar
                : null}
            </div>
            <button
              type="button"
              className="absolute right-3 top-3 z-20 rounded-lg border border-ais-card-border bg-white p-2 shadow-sm"
              onClick={() => setMobileNav("closed")}
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <Dialog
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create community"
      >
        <div className="space-y-3">
          <label className="block">
            <span className={aisFormLabel}>Name</span>
            <input
              className={`${aisInput} mt-1`}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Grade 11 Teachers"
            />
          </label>
          <label className="block">
            <span className={aisFormLabel}>Description</span>
            <textarea
              className={`${aisTextarea} mt-1`}
              rows={3}
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
            />
          </label>
        </div>
        <DialogFooter>
          <AisBtnSecondary type="button" onClick={() => setCreateOpen(false)}>
            Cancel
          </AisBtnSecondary>
          <AisBtnPrimary type="button" onClick={() => void createCommunity()}>
            Create
          </AisBtnPrimary>
        </DialogFooter>
      </Dialog>

      <Dialog
        isOpen={createChannelOpen}
        onClose={() => setCreateChannelOpen(false)}
        title="Create channel"
      >
        <label className="block">
          <span className={aisFormLabel}>Channel name</span>
          <input
            className={`${aisInput} mt-1`}
            value={newChannelName}
            onChange={(e) => setNewChannelName(e.target.value)}
            placeholder="lesson-planning"
          />
        </label>
        <DialogFooter>
          <AisBtnSecondary
            type="button"
            onClick={() => setCreateChannelOpen(false)}
          >
            Cancel
          </AisBtnSecondary>
          <AisBtnPrimary type="button" onClick={() => void createChannel()}>
            Create
          </AisBtnPrimary>
        </DialogFooter>
      </Dialog>

      <Dialog
        isOpen={notifOpen}
        onClose={() => setNotifOpen(false)}
        title="Mentions & replies"
      >
        <div className="max-h-80 space-y-2 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="py-6 text-center text-sm text-ais-on-surface-variant">
              No mention notifications yet.
            </p>
          ) : (
            notifications.map((n) => (
              <button
                key={n.id}
                type="button"
                className={`w-full rounded-lg border px-3 py-2.5 text-left transition-colors ${
                  n.isRead
                    ? "border-ais-card-border bg-white hover:bg-ais-row-hover"
                    : "border-ais-primary/20 bg-ais-primary/5 hover:bg-ais-primary/10"
                }`}
                onClick={() => {
                  void api.markCommunityNotificationRead(n.id);
                  setNotifications((prev) =>
                    prev.map((x) =>
                      x.id === n.id ? { ...x, isRead: true } : x,
                    ),
                  );
                  if (n.communityId) setActiveCommunityId(n.communityId);
                  if (n.channelId) setActiveChannelId(n.channelId);
                  if (n.threadId) setActiveThreadId(n.threadId);
                  setNotifOpen(false);
                }}
              >
                <p className="text-xs font-bold text-ais-on-surface">
                  {n.authorName ?? "Someone"} mentioned you
                </p>
                <p className="mt-0.5 line-clamp-2 text-xs text-ais-on-surface-variant">
                  {n.contentPreview}
                </p>
              </button>
            ))
          )}
        </div>
        {notifications.some((n) => !n.isRead) && (
          <DialogFooter>
            <button
              type="button"
              className="text-xs font-bold text-ais-primary hover:underline"
              onClick={() => {
                void api.markAllCommunityNotificationsRead();
                setNotifications((prev) =>
                  prev.map((n) => ({ ...n, isRead: true })),
                );
              }}
            >
              Mark all read
            </button>
          </DialogFooter>
        )}
      </Dialog>
    </AisPage>
  );
}

function ChannelButton({
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
  const unread = (channel.unreadCount ?? 0) > 0;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${aisSidebarNavItem} gap-2 px-3 py-2 ${
        active ? aisSidebarNavItemActive : aisSidebarNavItemInactive
      } ${unread && !active ? "font-bold text-ais-on-surface" : ""}`}
    >
      <span className={active ? "text-ais-primary" : "text-ais-primary/70"}>
        {icon}
      </span>
      <span className="min-w-0 flex-1 truncate">{channel.name}</span>
      {unread && !active ? (
        <span className="h-2 w-2 shrink-0 rounded-full bg-ais-primary" />
      ) : null}
    </button>
  );
}
