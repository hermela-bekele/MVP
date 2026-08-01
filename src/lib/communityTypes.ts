export type CommunityType = 'department' | 'general' | 'custom';
export type CommunityMemberRole = 'owner' | 'admin' | 'member';
export type ChannelType = 'text' | 'announcement';

export interface Community {
  id: string;
  schoolId: string | null;
  name: string;
  description: string;
  iconUrl: string | null;
  type: CommunityType;
  departmentId: string | null;
  createdBy: string | null;
  createdAt: string;
  memberRole?: CommunityMemberRole;
  unreadCount?: number;
}

export interface CommunityMember {
  id: string;
  communityId: string;
  userId: string;
  role: CommunityMemberRole;
  joinedAt: string;
  displayName?: string;
  email?: string;
  userRole?: string;
}

export interface CommunityChannel {
  id: string;
  communityId: string;
  name: string;
  description: string;
  type: ChannelType;
  position: number;
  createdAt: string;
  unreadCount?: number;
}

export interface CommunityThread {
  id: string;
  channelId: string;
  title: string;
  createdBy: string | null;
  rootMessageId: string | null;
  isPinned: boolean;
  isArchived: boolean;
  createdAt: string;
  replyCount?: number;
}

export interface ReactionSummary {
  emoji: string;
  count: number;
  me: boolean;
}

export interface CommunityMessage {
  id: string;
  channelId: string | null;
  threadId: string | null;
  authorId: string;
  authorName: string;
  authorRole?: string;
  content: string;
  parentMessageId: string | null;
  createdAt: string;
  editedAt: string | null;
  reactions: ReactionSummary[];
  threadIdForRoot?: string | null;
  threadReplyCount?: number;
  /** Client-only optimistic flag */
  pending?: boolean;
  failed?: boolean;
}

export interface MentionNotification {
  id: string;
  userId: string;
  messageId: string;
  isRead: boolean;
  createdAt: string;
  contentPreview?: string;
  authorName?: string;
  channelId?: string | null;
  threadId?: string | null;
  communityId?: string | null;
}

export interface MentionSuggestion {
  id: string;
  displayName: string;
  email: string;
  role: string;
}
