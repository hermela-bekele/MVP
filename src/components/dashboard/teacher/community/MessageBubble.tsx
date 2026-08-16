'use client';

import React, { useState } from 'react';
import { MessageSquare, MoreHorizontal, Reply, Smile, Trash2 } from 'lucide-react';
import type { CommunityMessage } from '@/lib/communityTypes';
import { isPortalRole, roleLabel } from '@/lib/auth';
import {
  QUICK_EMOJIS,
  avatarColor,
  communityInitials,
  formatMessageTime,
  renderInlineFormatting,
} from './communityUi';

type Props = {
  message: CommunityMessage;
  currentUserId: string;
  canModerate: boolean;
  showThreadLink?: boolean;
  onReact: (messageId: string, emoji: string) => void;
  onStartThread?: (message: CommunityMessage) => void;
  onOpenThread?: (threadId: string) => void;
  onDelete?: (messageId: string) => void;
};

function authorRoleLabel(role?: string): string | null {
  if (!role) return null;
  if (isPortalRole(role)) return roleLabel(role);
  return role.charAt(0).toUpperCase() + role.slice(1);
}

export function MessageBubble({
  message,
  currentUserId,
  canModerate,
  showThreadLink = true,
  onReact,
  onStartThread,
  onOpenThread,
  onDelete,
}: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const isOwn = Boolean(currentUserId) && message.authorId === currentUserId;
  const canDelete = isOwn || canModerate;
  const threadId = message.threadIdForRoot;
  const replyCount = message.threadReplyCount ?? 0;
  const roleTag = authorRoleLabel(message.authorRole);

  return (
    <div
      className={`group relative flex gap-3 px-4 py-2 transition-colors hover:bg-ais-row-hover/60 ${
        message.pending ? 'opacity-70' : ''
      } ${message.failed ? 'bg-ais-error/5' : ''}`}
    >
      <div
        className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${avatarColor(
          message.authorId,
        )}`}
      >
        {communityInitials(message.authorName)}
      </div>
      <div className="min-w-0 flex-1 text-left">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-sm font-bold text-ais-on-surface">{message.authorName}</span>
          {roleTag && (
            <span className="rounded-full bg-ais-primary/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-ais-primary">
              {roleTag}
            </span>
          )}
          <span className="text-[11px] text-ais-outline">
            {formatMessageTime(message.createdAt)}
            {message.editedAt ? ' · edited' : ''}
            {message.pending ? ' · sending…' : ''}
            {message.failed ? ' · failed' : ''}
          </span>
        </div>
        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-ais-on-surface">
          {renderInlineFormatting(message.content)}
        </p>

        {message.reactions.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {message.reactions.map((r) => (
              <button
                key={r.emoji}
                type="button"
                onClick={() => onReact(message.id, r.emoji)}
                className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold transition-colors ${
                  r.me
                    ? 'border-ais-primary/30 bg-ais-primary/10 text-ais-primary'
                    : 'border-ais-card-border bg-white text-ais-on-surface-variant hover:border-ais-primary/20'
                }`}
              >
                <span>{r.emoji}</span>
                <span>{r.count}</span>
              </button>
            ))}
          </div>
        )}

        {showThreadLink && threadId && replyCount > 0 && (
          <button
            type="button"
            onClick={() => onOpenThread?.(threadId)}
            className="mt-1.5 inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-bold text-ais-primary transition-colors hover:bg-ais-primary/10"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
          </button>
        )}
      </div>

      <div className="absolute right-3 top-1 hidden items-center gap-0.5 rounded-lg border border-ais-card-border bg-white p-0.5 shadow-[0_1px_3px_rgba(15,23,42,0.08)] group-hover:flex">
        <div className="relative">
          <button
            type="button"
            className="rounded-md p-1.5 text-ais-on-surface-variant transition-colors hover:bg-ais-row-hover hover:text-ais-primary"
            title="Add reaction"
            onClick={() => setPickerOpen((o) => !o)}
          >
            <Smile className="h-3.5 w-3.5" />
          </button>
          {pickerOpen && (
            <div className="absolute right-0 z-20 mt-1 flex gap-0.5 rounded-lg border border-ais-card-border bg-white p-1 shadow-[0_4px_12px_rgba(15,23,42,0.08)]">
              {QUICK_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  className="rounded-md p-1 text-base hover:bg-ais-row-hover"
                  onClick={() => {
                    onReact(message.id, emoji);
                    setPickerOpen(false);
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>
        {showThreadLink && onStartThread && !threadId && (
          <button
            type="button"
            className="rounded-md p-1.5 text-ais-on-surface-variant transition-colors hover:bg-ais-row-hover hover:text-ais-primary"
            title="Start thread"
            onClick={() => onStartThread(message)}
          >
            <Reply className="h-3.5 w-3.5" />
          </button>
        )}
        {showThreadLink && threadId && (
          <button
            type="button"
            className="rounded-md p-1.5 text-ais-on-surface-variant transition-colors hover:bg-ais-row-hover hover:text-ais-primary"
            title="Open thread"
            onClick={() => onOpenThread?.(threadId)}
          >
            <MessageSquare className="h-3.5 w-3.5" />
          </button>
        )}
        {canDelete && onDelete && (
          <div className="relative">
            <button
              type="button"
              className="rounded-md p-1.5 text-ais-on-surface-variant transition-colors hover:bg-ais-row-hover hover:text-ais-primary"
              title="More actions"
              onClick={() => setMenuOpen((o) => !o)}
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </button>
            {menuOpen && (
              <div
                className={`absolute z-20 mt-1 w-40 rounded-lg border border-ais-card-border bg-white p-1 shadow-[0_4px_12px_rgba(15,23,42,0.08)] ${
                  isOwn ? 'left-0' : 'right-0'
                }`}
              >
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs font-semibold text-ais-error transition-colors hover:bg-ais-error/10"
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete(message.id);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete message
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
