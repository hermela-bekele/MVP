'use client';

import React from 'react';
import { X } from 'lucide-react';
import { avatarColor, communityInitials } from './teacher/community/communityUi';

export interface DMConversation {
  id: string;
  userId: string;
  userName: string;
  userRole?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isOnline?: boolean;
}

interface DMSecondarySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  conversations: DMConversation[];
  activeConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
}

function formatMessageTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

export function DMSecondarySidebar({
  isOpen,
  onClose,
  conversations,
  activeConversationId,
  onSelectConversation,
}: DMSecondarySidebarProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Mobile overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/20 md:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-50 h-full w-[280px] border-r border-[#eef0f4] bg-white shadow-lg transition-transform md:static md:z-auto md:shadow-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Header */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-[#eef0f4] px-4">
          <h2 className="text-sm font-bold text-[#14213D]">Direct Messages</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-ais-on-surface-variant transition-colors hover:bg-ais-row-hover md:hidden"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Conversations list */}
        <div className="overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-xs text-ais-on-surface-variant">No conversations yet</p>
            </div>
          ) : (
            <div className="divide-y divide-[#eef0f4]">
              {conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => {
                    onSelectConversation(conversation.id);
                    // Close on mobile after selection
                    if (window.innerWidth < 768) {
                      onClose();
                    }
                  }}
                  className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors ${
                    activeConversationId === conversation.id
                      ? 'bg-[#FCBA6540]'
                      : 'hover:bg-ais-row-hover'
                  }`}
                >
                  {/* Avatar with online indicator */}
                  <div className="relative shrink-0">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold text-white ${avatarColor(
                        conversation.userId,
                      )}`}
                    >
                      {communityInitials(conversation.userName)}
                    </div>
                    {conversation.isOnline !== undefined && (
                      <span
                        className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white ${
                          conversation.isOnline ? 'bg-ais-success' : 'bg-ais-outline-variant'
                        }`}
                      />
                    )}
                  </div>

                  {/* Conversation info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p
                        className={`truncate text-sm ${
                          conversation.unreadCount > 0 ? 'font-bold' : 'font-semibold'
                        } text-ais-on-surface`}
                      >
                        {conversation.userName}
                      </p>
                      <span className="shrink-0 text-[10px] text-ais-outline">
                        {formatMessageTime(conversation.lastMessageTime)}
                      </span>
                    </div>
                    
                    {conversation.userRole && (
                      <p className="text-[10px] font-medium capitalize text-ais-on-surface-variant">
                        {conversation.userRole.replace(/-/g, ' ')}
                      </p>
                    )}
                    
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <p
                        className={`truncate text-xs ${
                          conversation.unreadCount > 0
                            ? 'font-medium text-ais-on-surface'
                            : 'text-ais-on-surface-variant'
                        }`}
                      >
                        {conversation.lastMessage}
                      </p>
                      {conversation.unreadCount > 0 && (
                        <span className="flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full bg-[#E88700] px-1.5 text-[10px] font-bold text-white">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
