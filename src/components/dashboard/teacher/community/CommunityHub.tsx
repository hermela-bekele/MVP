"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Bell,
  Hash,
  Info,
  Loader2,
  Menu,
  Plus,
  Search,
  Send,
  Star,
  Volume2,
  X,
} from "lucide-react";
import { api } from "@/lib/api";
import { useApp } from "@/context/AppContext";
import type {
  Community,
  CommunityChannel,
  CommunityMember,
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
import { aisBodySm } from "@/components/dashboard/teacher/aisStyles";
import {
  avatarColor,
  communityInitials,
  formatMessageTime,
} from "./communityUi";
import { MessageBubble } from "./MessageBubble";
import { MessageComposer } from "./MessageComposer";
import { ThreadPanel } from "./ThreadPanel";
import { useCommunityRealtime } from "@/hooks/useCommunityRealtime";

const FAVORITES_STORAGE_KEY = "pts-community-favorites";
const NAVY = "#14213D";
const ORANGE = "#E88700";
const CREAM = "#FCBA65";

function canCreateCommunities(role?: string) {
  return (
    role === "school-head" ||
    role === "moe" ||
    role === "head-of-academics" ||
    role === "department-head"
  );
}

function isCommunityAdmin(role?: string) {
  return role === "owner" || role === "admin";
}

function loadFavorites(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(FAVORITES_STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

export function CommunityHub() {
  const {
    currentUser,
    staffMessages,
    teachers,
    resolveTeacherId,
    sendStaffMessage,
    refreshStaffMessages,
    markStaffMessagesRead,
  } = useApp();
  const userId = currentUser?.id ?? "";
  const userName = currentUser?.displayName ?? "You";
  const teacherId = resolveTeacherId();
  const myTeacher = teachers.find((t) => t.id === teacherId);
  const myName = myTeacher?.name ?? userName;

  const [communities, setCommunities] = useState<Community[]>([]);
  const [activeCommunityId, setActiveCommunityId] = useState<string | null>(
    null,
  );
  const [channels, setChannels] = useState<CommunityChannel[]>([]);
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<"channel" | "hod">("channel");
  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loadingCommunities, setLoadingCommunities] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [error, setError] = useState("");
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createChannelOpen, setCreateChannelOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<MentionNotification[]>([]);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newChannelName, setNewChannelName] = useState("");
  const [typingLabel, setTypingLabel] = useState("");
  const [onlineIds, setOnlineIds] = useState<Set<string>>(new Set());
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [memberPanelOpen, setMemberPanelOpen] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(() => loadFavorites());
  const [search, setSearch] = useState("");
  const [hodDraft, setHodDraft] = useState("");
  const [hodSending, setHodSending] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const hodBottomRef = useRef<HTMLDivElement>(null);
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

  const toggleFavorite = (channelId: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(channelId)) next.delete(channelId);
      else next.add(channelId);
      try {
        window.localStorage.setItem(
          FAVORITES_STORAGE_KEY,
          JSON.stringify(Array.from(next)),
        );
      } catch {
        /* best-effort persistence only */
      }
      return next;
    });
  };

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

  useEffect(() => {
    if (!activeCommunityId) {
      setMembers([]);
      return;
    }
    let cancelled = false;
    void api
      .listCommunityMembers(activeCommunityId)
      .then((rows) => {
        if (!cancelled) setMembers(rows);
      })
      .catch(() => {
        if (!cancelled) setMembers([]);
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
    if (activeView === "channel" && stickToBottom.current) {
      bottomRef.current?.scrollIntoView({ behavior: "auto" });
    }
  }, [messages.length, activeChannelId, activeView]);

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
      setActiveView("channel");
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

  const query = search.trim().toLowerCase();
  const matches = (name: string) => !query || name.toLowerCase().includes(query);
  const filteredAnnouncementChannels = announcementChannels.filter((c) => matches(c.name));
  const filteredTextChannels = textChannels.filter((c) => matches(c.name));
  const favoriteChannels = channels.filter(
    (c) => favorites.has(c.id) && matches(c.name),
  );
  const hodMatchesSearch = !query || "department head".includes(query) || "hod".includes(query);

  // Department head presence: best-effort — true only if the HoD happens to be a
  // member of the active community and is currently connected to it.
  const hodMember = useMemo(
    () =>
      members.find(
        (m) => m.userRole === "department-head" || m.userRole === "head-of-academics",
      ),
    [members],
  );
  const hodOnline = hodMember ? onlineIds.has(hodMember.userId) : false;

  const hodThread = useMemo(
    () => staffMessages.filter((m) => m.teacherId === teacherId),
    [staffMessages, teacherId],
  );
  const hodUnread = useMemo(
    () => hodThread.filter((m) => m.senderRole === "department-head" && !m.read).length,
    [hodThread],
  );

  useEffect(() => {
    void refreshStaffMessages({ teacherId });
    const id = window.setInterval(() => {
      void refreshStaffMessages({ teacherId });
    }, 3500);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teacherId]);

  useEffect(() => {
    if (activeView === "hod") markStaffMessagesRead(teacherId, "teacher");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeView, teacherId, hodThread.length]);

  useEffect(() => {
    if (activeView === "hod") {
      hodBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [hodThread.length, activeView]);

  const handleSendHod = async () => {
    if (!hodDraft.trim()) return;
    setHodSending(true);
    try {
      await sendStaffMessage({ teacherId, body: hodDraft.trim(), senderRole: "teacher" });
      setHodDraft("");
      await refreshStaffMessages({ teacherId });
    } finally {
      setHodSending(false);
    }
  };

  useCommunityRealtime({
    communityId: activeCommunityId,
    channelId: activeChannelId,
    threadId: activeThreadId,
  });

  const sidebarContent = (
    <>
      <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-[#eef0f4] px-3.5">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[11px] font-bold text-white"
          style={{ backgroundColor: NAVY }}
        >
          {communityInitials(activeCommunity?.name ?? "Teacher Community")}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-bold" style={{ color: NAVY }}>
            {activeCommunity?.name ?? "Teacher Community"}
          </p>
          <p className="truncate text-[10px] font-medium text-ais-on-surface-variant">
            Workspace
          </p>
        </div>
        {canCreateCommunities(currentUser?.role) && (
          <button
            type="button"
            title="Create community"
            onClick={() => setCreateOpen(true)}
            className="shrink-0 rounded-lg p-1.5 text-ais-on-surface-variant transition-colors hover:bg-ais-row-hover hover:text-[#14213D]"
          >
            <Plus className="h-4 w-4" />
          </button>
        )}
      </div>

      {communities.length > 1 && (
        <div className="border-b border-[#eef0f4] px-3 py-2">
          <select
            value={activeCommunityId ?? ""}
            onChange={(e) => {
              setActiveCommunityId(e.target.value);
              setActiveView("channel");
            }}
            className="w-full rounded-lg border border-[#eef0f4] bg-[#f7f8fb] px-2 py-1.5 text-xs font-semibold text-ais-on-surface outline-none"
          >
            {communities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <nav className="flex-1 space-y-4 overflow-y-auto px-2 py-3">
        {loadingCommunities && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-4 w-4 animate-spin text-ais-outline" />
          </div>
        )}

        {favoriteChannels.length > 0 && (
          <SidebarSection label="Favorites">
            {favoriteChannels.map((ch) => (
              <SidebarChannelRow
                key={ch.id}
                channel={ch}
                icon={ch.type === "announcement" ? <Volume2 className="h-3.5 w-3.5" /> : undefined}
                active={activeView === "channel" && ch.id === activeChannelId}
                favorite
                onToggleFavorite={() => toggleFavorite(ch.id)}
                onClick={() => {
                  setActiveView("channel");
                  setActiveChannelId(ch.id);
                  setMobileNavOpen(false);
                }}
              />
            ))}
          </SidebarSection>
        )}

        <SidebarSection
          label="Channels"
          action={
            canModerate ? (
              <button
                type="button"
                className="rounded-md p-1 text-ais-on-surface-variant transition-colors hover:bg-ais-row-hover hover:text-[#14213D]"
                title="Create channel"
                onClick={() => setCreateChannelOpen(true)}
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            ) : null
          }
        >
          {filteredAnnouncementChannels.map((ch) => (
            <SidebarChannelRow
              key={ch.id}
              channel={ch}
              icon={<Volume2 className="h-3.5 w-3.5" />}
              active={activeView === "channel" && ch.id === activeChannelId}
              favorite={favorites.has(ch.id)}
              onToggleFavorite={() => toggleFavorite(ch.id)}
              onClick={() => {
                setActiveView("channel");
                setActiveChannelId(ch.id);
                setMobileNavOpen(false);
              }}
            />
          ))}
          {filteredTextChannels.map((ch) => (
            <SidebarChannelRow
              key={ch.id}
              channel={ch}
              active={activeView === "channel" && ch.id === activeChannelId}
              favorite={favorites.has(ch.id)}
              onToggleFavorite={() => toggleFavorite(ch.id)}
              onClick={() => {
                setActiveView("channel");
                setActiveChannelId(ch.id);
                setMobileNavOpen(false);
              }}
            />
          ))}
          {!loadingCommunities &&
            filteredAnnouncementChannels.length === 0 &&
            filteredTextChannels.length === 0 && (
              <p className="px-2.5 py-1.5 text-[11px] text-ais-on-surface-variant">
                No channels found.
              </p>
            )}
        </SidebarSection>

        {hodMatchesSearch && (
          <SidebarSection label="Direct messages">
            <button
              type="button"
              onClick={() => {
                setActiveView("hod");
                setMobileNavOpen(false);
              }}
              className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] font-semibold transition-colors ${
                activeView === "hod"
                  ? "text-[#14213D]"
                  : "text-ais-on-surface-variant hover:bg-ais-row-hover hover:text-ais-on-surface"
              }`}
              style={activeView === "hod" ? { backgroundColor: `${CREAM}40` } : undefined}
            >
              <span
                className="relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white"
                style={{ backgroundColor: NAVY }}
              >
                HD
                <span
                  className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border-2 border-white ${
                    hodOnline ? "bg-ais-success" : "bg-ais-outline-variant"
                  }`}
                />
              </span>
              <span className="min-w-0 flex-1 truncate">Department Head</span>
              {hodUnread > 0 && activeView !== "hod" && (
                <span
                  className="flex h-4 min-w-[16px] shrink-0 items-center justify-center rounded-full px-1 text-[9px] font-bold text-white"
                  style={{ backgroundColor: ORANGE }}
                >
                  {hodUnread}
                </span>
              )}
            </button>
          </SidebarSection>
        )}
      </nav>

      <div className="border-t border-[#eef0f4] px-3 py-3">
        <div className="flex items-center gap-2.5">
          <div
            className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${avatarColor(userId)}`}
          >
            {communityInitials(userName)}
            <span
              className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white ${
                onlineIds.size === 0 || onlineIds.has(userId)
                  ? "bg-ais-success"
                  : "bg-ais-outline"
              }`}
            />
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-bold text-ais-on-surface">{userName}</p>
            <p className="truncate text-[10px] font-medium capitalize text-ais-on-surface-variant">
              {activeCommunity?.memberRole ?? "member"}
            </p>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <AisPage>
      <div className="flex h-[min(78vh,760px)] min-h-[540px] flex-col overflow-hidden rounded-2xl border border-[#e7e9ee] bg-white shadow-[0_1px_3px_rgba(15,23,42,0.05)]">
        {/* Top bar: brand + global search + notifications + profile */}
        <div className="flex h-14 shrink-0 items-center gap-3 border-b border-[#eef0f4] px-4">
          <button
            type="button"
            className="rounded-lg p-1.5 text-ais-on-surface-variant transition-colors hover:bg-ais-row-hover md:hidden"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
          <p className="hidden shrink-0 text-sm font-bold md:block" style={{ color: NAVY }}>
            Teacher Community
          </p>
          <div className="relative mx-auto w-full max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ais-outline" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search channels, people…"
              className="h-9 w-full rounded-full border border-[#eef0f4] bg-[#f7f8fb] pl-9 pr-3 text-xs text-ais-on-surface outline-none transition-colors focus:bg-white"
              style={{ borderColor: search ? `${ORANGE}66` : undefined }}
            />
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              className="relative rounded-lg p-2 text-ais-on-surface-variant transition-colors hover:bg-ais-row-hover hover:text-[#14213D]"
              title="Notifications"
              onClick={() => {
                setNotifOpen(true);
                void refreshNotifications();
              }}
            >
              <Bell className="h-4 w-4" />
              {unreadMentions + hodUnread > 0 && (
                <span
                  className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[9px] font-bold text-white"
                  style={{ backgroundColor: ORANGE }}
                >
                  {unreadMentions + hodUnread}
                </span>
              )}
            </button>
            <div className="ml-1 hidden items-center gap-2 border-l border-[#eef0f4] pl-3 sm:flex">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-bold text-white ${avatarColor(userId)}`}
              >
                {communityInitials(userName)}
              </div>
              <div className="hidden min-w-0 lg:block">
                <p className="truncate text-xs font-bold text-ais-on-surface">{userName}</p>
                <p className="truncate text-[10px] text-ais-on-surface-variant">Teacher</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative flex min-h-0 flex-1">
          <aside className="hidden h-full w-[280px] shrink-0 flex-col border-r border-[#eef0f4] bg-white md:flex">
            {sidebarContent}
          </aside>

          <div className="flex h-full min-w-0 flex-1 flex-col bg-white">
            {activeView === "hod" ? (
              <>
                <header className="flex h-16 shrink-0 items-center gap-3 border-b border-[#eef0f4] px-4 sm:px-5">
                  <button
                    type="button"
                    className="rounded-lg p-1.5 text-ais-on-surface-variant transition-colors hover:bg-ais-row-hover md:hidden"
                    onClick={() => setMobileNavOpen(true)}
                    aria-label="Open navigation"
                  >
                    <Menu className="h-5 w-5" />
                  </button>
                  <span
                    className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                    style={{ backgroundColor: NAVY }}
                  >
                    HD
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white ${
                        hodOnline ? "bg-ais-success" : "bg-ais-outline-variant"
                      }`}
                    />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-bold" style={{ color: NAVY }}>
                      Department Head
                    </p>
                    <p className="truncate text-[12px] text-ais-on-surface-variant">
                      {hodOnline ? "Online" : "Offline"} · Direct message
                    </p>
                  </div>
                </header>

                <div className="flex-1 overflow-y-auto">
                  {hodThread.length === 0 ? (
                    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-xl"
                        style={{ backgroundColor: `${NAVY}12`, color: NAVY }}
                      >
                        <Send className="h-5 w-5" />
                      </div>
                      <p className="mt-3 text-sm font-bold text-ais-on-surface">
                        Start the conversation
                      </p>
                      <p className={`${aisBodySm} mt-1 max-w-xs`}>
                        Say hello or share a classroom challenge with your department head.
                      </p>
                    </div>
                  ) : (
                    hodThread.map((msg) => {
                      const mine =
                        msg.senderRole === "teacher" ||
                        msg.senderId === teacherId ||
                        msg.senderId === currentUser?.id;
                      const displayName = mine ? myName : msg.senderName;
                      return (
                        <div
                          key={msg.id}
                          className="group flex gap-3 px-4 py-2 transition-colors hover:bg-ais-row-hover/60 sm:px-5"
                        >
                          <div
                            className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${avatarColor(
                              msg.senderId || (mine ? "teacher" : "hod"),
                            )}`}
                          >
                            {communityInitials(displayName)}
                          </div>
                          <div className="min-w-0 flex-1 text-left">
                            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                              <span className="text-sm font-bold text-ais-on-surface">
                                {displayName}
                              </span>
                              <span
                                className="rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide"
                                style={{ backgroundColor: `${CREAM}40`, color: NAVY }}
                              >
                                {mine ? "You" : "Dept. head"}
                              </span>
                              <span className="text-[11px] text-ais-outline">
                                {formatMessageTime(msg.createdAt)}
                              </span>
                            </div>
                            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-ais-on-surface">
                              {msg.body}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={hodBottomRef} />
                </div>

                <div className="flex shrink-0 items-end gap-2 border-t border-[#eef0f4] bg-[#f9fafc] px-4 py-3 sm:px-5">
                  <textarea
                    rows={1}
                    className={`${aisInput} max-h-32 min-h-10 flex-1 resize-none py-2.5`}
                    placeholder="Message your HoD…"
                    value={hodDraft}
                    onChange={(e) => setHodDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        void handleSendHod();
                      }
                    }}
                  />
                  <button
                    type="button"
                    disabled={hodSending || !hodDraft.trim()}
                    onClick={() => void handleSendHod()}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                    style={{ backgroundColor: ORANGE }}
                    aria-label="Send"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </>
            ) : (
              <>
                <header className="flex h-16 shrink-0 items-center gap-2 border-b border-[#eef0f4] px-3 sm:px-4">
                  <button
                    type="button"
                    className="rounded-lg p-1.5 text-ais-on-surface-variant transition-colors hover:bg-ais-row-hover md:hidden"
                    onClick={() => setMobileNavOpen(true)}
                    aria-label="Open navigation"
                  >
                    <Menu className="h-5 w-5" />
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-[15px] font-bold" style={{ color: NAVY }}>
                        {activeChannel ? (
                          <>
                            <span className="text-ais-outline">#</span>
                            {activeChannel.name}
                          </>
                        ) : (
                          "Select a channel"
                        )}
                      </p>
                      {activeChannel && (
                        <button
                          type="button"
                          onClick={() => toggleFavorite(activeChannel.id)}
                          className="shrink-0 rounded-md p-1 transition-colors"
                          style={{
                            color: favorites.has(activeChannel.id) ? ORANGE : "var(--color-ais-outline)",
                          }}
                          title={
                            favorites.has(activeChannel.id)
                              ? "Remove from favorites"
                              : "Add to favorites"
                          }
                        >
                          <Star
                            className={`h-4 w-4 ${favorites.has(activeChannel.id) ? "fill-current" : ""}`}
                          />
                        </button>
                      )}
                    </div>
                    {activeChannel?.description ? (
                      <p className="truncate text-[12px] text-ais-on-surface-variant">
                        {activeChannel.description}
                      </p>
                    ) : null}
                  </div>
                  {activeCommunity && (
                    <button
                      type="button"
                      onClick={() => setMemberPanelOpen(true)}
                      className="flex shrink-0 items-center gap-2 rounded-full border border-[#eef0f4] bg-[#f7f8fb] py-1 pl-1.5 pr-3 text-xs font-semibold text-ais-on-surface-variant shadow-sm transition-colors hover:border-[#E88700]/30 hover:text-[#14213D]"
                      title="Channel info"
                    >
                      <span className="flex -space-x-2">
                        {members.slice(0, 4).map((m) => (
                          <span
                            key={m.id}
                            className={`flex h-6 w-6 items-center justify-center rounded-full border-2 border-white text-[9px] font-bold text-white ${avatarColor(
                              m.userId,
                            )}`}
                          >
                            {communityInitials(m.displayName ?? "User")}
                          </span>
                        ))}
                      </span>
                      <span className="hidden sm:inline">
                        {members.length} {members.length === 1 ? "member" : "members"}
                      </span>
                      <Info className="h-3.5 w-3.5 shrink-0" />
                    </button>
                  )}
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
                        <p className="px-4 py-8 text-center text-sm text-ais-error">{error}</p>
                      )}
                      {!loadingMessages && !error && messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
                          <div
                            className="flex h-10 w-10 items-center justify-center rounded-xl"
                            style={{ backgroundColor: `${NAVY}12`, color: NAVY }}
                          >
                            <Hash className="h-5 w-5" />
                          </div>
                          <p className="mt-3 text-sm font-bold text-ais-on-surface">
                            Welcome to #{activeChannel?.name ?? "channel"}
                          </p>
                          <p className={`${aisBodySm} mt-1 max-w-xs`}>
                            This is the start of the channel. Send a message to get things going.
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
              </>
            )}
          </div>

          {mobileNavOpen && (
            <div className="fixed inset-0 z-40 flex md:hidden">
              <div
                className="absolute inset-0 bg-ais-on-surface/40"
                onClick={() => setMobileNavOpen(false)}
                aria-hidden
              />
              <div className="relative z-10 flex h-full w-[280px] flex-col bg-white shadow-2xl">
                {sidebarContent}
              </div>
              <button
                type="button"
                className="absolute right-3 top-3 z-20 rounded-lg border border-[#eef0f4] bg-white p-2 shadow-sm"
                onClick={() => setMobileNavOpen(false)}
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      <Dialog isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Create community">
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
          <AisBtnSecondary type="button" onClick={() => setCreateChannelOpen(false)}>
            Cancel
          </AisBtnSecondary>
          <AisBtnPrimary type="button" onClick={() => void createChannel()}>
            Create
          </AisBtnPrimary>
        </DialogFooter>
      </Dialog>

      <Dialog isOpen={notifOpen} onClose={() => setNotifOpen(false)} title="Mentions & replies">
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
                    ? "border-[#eef0f4] bg-white hover:bg-ais-row-hover"
                    : "border-[#E88700]/20 bg-[#E88700]/5 hover:bg-[#E88700]/10"
                }`}
                onClick={() => {
                  void api.markCommunityNotificationRead(n.id);
                  setNotifications((prev) =>
                    prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)),
                  );
                  if (n.communityId) setActiveCommunityId(n.communityId);
                  if (n.channelId) setActiveChannelId(n.channelId);
                  if (n.threadId) setActiveThreadId(n.threadId);
                  setActiveView("channel");
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
              className="text-xs font-bold hover:underline"
              style={{ color: ORANGE }}
              onClick={() => {
                void api.markAllCommunityNotificationsRead();
                setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
              }}
            >
              Mark all read
            </button>
          </DialogFooter>
        )}
      </Dialog>

      <Dialog
        isOpen={memberPanelOpen}
        onClose={() => setMemberPanelOpen(false)}
        title={activeCommunity ? `${activeCommunity.name} · Members` : "Members"}
      >
        <div className="max-h-96 space-y-1 overflow-y-auto">
          {members.length === 0 ? (
            <p className="py-6 text-center text-sm text-ais-on-surface-variant">No members yet.</p>
          ) : (
            members.map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-ais-row-hover"
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${avatarColor(
                    m.userId,
                  )}`}
                >
                  {communityInitials(m.displayName ?? "User")}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-ais-on-surface">
                    {m.displayName ?? "Member"}
                  </p>
                  {m.email ? (
                    <p className="truncate text-[11px] text-ais-on-surface-variant">{m.email}</p>
                  ) : null}
                </div>
                <span className="shrink-0 rounded-full bg-ais-surface-container-low px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ais-on-surface-variant">
                  {m.role}
                </span>
              </div>
            ))
          )}
        </div>
      </Dialog>
    </AisPage>
  );
}

function SidebarSection({
  label,
  action,
  children,
}: {
  label: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between px-2">
        <p className="text-[10px] font-bold uppercase tracking-widest text-ais-outline">{label}</p>
        {action}
      </div>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function SidebarChannelRow({
  channel,
  active,
  icon,
  favorite,
  onToggleFavorite,
  onClick,
}: {
  channel: CommunityChannel;
  active: boolean;
  icon?: React.ReactNode;
  favorite: boolean;
  onToggleFavorite: () => void;
  onClick: () => void;
}) {
  const unread = (channel.unreadCount ?? 0) > 0;
  return (
    <div
      className={`group flex items-center rounded-lg pr-1.5 transition-colors ${
        active ? "" : "hover:bg-ais-row-hover"
      }`}
      style={active ? { backgroundColor: `${CREAM}40` } : undefined}
    >
      <button
        type="button"
        onClick={onClick}
        className="flex min-w-0 flex-1 items-center gap-2 px-2.5 py-2 text-left"
      >
        <span style={{ color: active ? NAVY : undefined }} className={!active ? "text-ais-on-surface-variant/70" : ""}>
          {icon ?? <Hash className="h-3.5 w-3.5" />}
        </span>
        <span
          className={`min-w-0 flex-1 truncate text-[13px] ${
            active ? "font-bold" : unread ? "font-bold text-ais-on-surface" : "font-medium text-ais-on-surface-variant"
          }`}
          style={active ? { color: NAVY } : undefined}
        >
          {channel.name}
        </span>
        {unread && !active ? (
          <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: ORANGE }} />
        ) : null}
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite();
        }}
        className={`shrink-0 rounded-md p-1 transition-colors ${
          favorite ? "opacity-100" : "text-ais-outline opacity-0 group-hover:opacity-100 hover:text-[#E88700]"
        }`}
        style={favorite ? { color: ORANGE } : undefined}
        title={favorite ? "Remove from favorites" : "Add to favorites"}
      >
        <Star className={`h-3.5 w-3.5 ${favorite ? "fill-current" : ""}`} />
      </button>
    </div>
  );
}
