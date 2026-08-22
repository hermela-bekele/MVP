'use client';

import React, { useState } from 'react';
import { MessageSquare, Reply, Smile, Trash2 } from 'lucide-react';
import type { CommunityMessage } from '@/lib/communityTypes';
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
  const isOwn = Boolean(currentUserId) && message.authorId === currentUserId;
  const canDelete = isOwn || canModerate;
  const threadId = message.threadIdForRoot;
  const replyCount = message.threadReplyCount ?? 0;

  return (
    <div
      className={`group relative px-4 py-2 transition-colors ${
        message.pending ? 'opacity-70' : ''
      } ${message.failed ? 'bg-destructive/5' : ''} ${
        isOwn ? 'flex justify-end' : 'flex justify-start'
      }`}
    >
      <div
        className={`flex max-w-[min(88%,36rem)] gap-2.5 ${
          isOwn ? 'flex-row-reverse' : 'flex-row'
        }`}
      >
        {!isOwn && (
          <div
            className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${avatarColor(
              message.authorId,
            )}`}
          >
            {communityInitials(message.authorName)}
          </div>
        )}
        <div className={`min-w-0 ${isOwn ? 'text-right' : 'text-left'}`}>
          <div
            className={`mb-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5 ${
              isOwn ? 'justify-end' : 'justify-start'
            }`}
          >
            {!isOwn && (
              <span className="text-sm font-bold text-foreground">{message.authorName}</span>
            )}
            <span className="text-[11px] text-muted-foreground">
              {formatMessageTime(message.createdAt)}
              {message.editedAt ? ' · edited' : ''}
              {message.pending ? ' · sending…' : ''}
              {message.failed ? ' · failed' : ''}
            </span>
          </div>
          <div
            className={`inline-block px-3.5 py-2.5 text-left text-sm shadow-sm ${
              isOwn
                ? 'rounded-2xl rounded-br-md bg-primary/12 text-foreground ring-1 ring-primary/15'
                : 'rounded-2xl rounded-bl-md bg-muted text-foreground ring-1 ring-border'
            }`}
          >
            <p className="whitespace-pre-wrap break-words leading-relaxed">
              {renderInlineFormatting(message.content)}
            </p>
          </div>

          {message.reactions.length > 0 && (
            <div
              className={`mt-1.5 flex flex-wrap gap-1.5 ${
                isOwn ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.reactions.map((r) => (
                <button
                  key={r.emoji}
                  type="button"
                  onClick={() => onReact(message.id, r.emoji)}
                  className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-xs font-semibold transition-colors ${
                    r.me
                      ? 'border-primary/30 bg-primary/10 text-primary'
                      : 'border-border bg-white text-muted-foreground hover:border-primary/20'
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
              className="mt-1.5 inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-bold text-primary transition-colors hover:bg-primary/10"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
            </button>
          )}
        </div>
      </div>

      <div
        className={`absolute top-1 hidden items-center gap-0.5 rounded-lg border border-border bg-white p-0.5 shadow-[0_1px_3px_rgba(15,23,42,0.08)] group-hover:flex ${
          isOwn ? 'left-3' : 'right-3'
        }`}
      >
        <div className="relative">
          <button
            type="button"
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
            title="Add reaction"
            onClick={() => setPickerOpen((o) => !o)}
          >
            <Smile className="h-3.5 w-3.5" />
          </button>
          {pickerOpen && (
            <div
              className={`absolute z-20 mt-1 flex gap-0.5 rounded-lg border border-border bg-white p-1 shadow-[0_4px_12px_rgba(15,23,42,0.08)] ${
                isOwn ? 'left-0' : 'right-0'
              }`}
            >
              {QUICK_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  className="rounded-md p-1 text-base hover:bg-muted"
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
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
            title="Start thread"
            onClick={() => onStartThread(message)}
          >
            <Reply className="h-3.5 w-3.5" />
          </button>
        )}
        {showThreadLink && threadId && (
          <button
            type="button"
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
            title="Open thread"
            onClick={() => onOpenThread?.(threadId)}
          >
            <MessageSquare className="h-3.5 w-3.5" />
          </button>
        )}
        {canDelete && onDelete && (
          <button
            type="button"
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            title="Delete"
            onClick={() => onDelete(message.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
