'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Bold, Code, Italic, List, Paperclip, Send, Smile } from 'lucide-react';
import { api } from '@/lib/api';
import type { MentionSuggestion } from '@/lib/communityTypes';
import { aisInput } from '@/components/dashboard/teacher/aisStyles';
import { QUICK_EMOJIS } from './communityUi';

type Props = {
  communityId: string | null;
  placeholder?: string;
  disabled?: boolean;
  onSend: (content: string) => Promise<void> | void;
  onTyping?: () => void;
};

export function MessageComposer({
  communityId,
  placeholder = 'Message…',
  disabled,
  onSend,
  onTyping,
}: Props) {
  const [value, setValue] = useState('');
  const [sending, setSending] = useState(false);
  const [suggestions, setSuggestions] = useState<MentionSuggestion[]>([]);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const wrapSelection = (before: string, after: string = before) => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = value.slice(start, end);
    const next = value.slice(0, start) + before + selected + after + value.slice(end);
    setValue(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + before.length, start + before.length + selected.length);
    });
  };

  const insertListPrefix = () => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    const next = `${value.slice(0, lineStart)}- ${value.slice(lineStart)}`;
    setValue(next);
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + 2;
      el.setSelectionRange(pos, pos);
    });
  };

  const insertEmoji = (emoji: string) => {
    const el = textareaRef.current;
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? value.length;
    const next = value.slice(0, start) + emoji + value.slice(end);
    setValue(next);
    setEmojiOpen(false);
    requestAnimationFrame(() => {
      el?.focus();
      const pos = start + emoji.length;
      el?.setSelectionRange(pos, pos);
    });
  };

  useEffect(() => {
    if (!communityId || mentionQuery == null) {
      setSuggestions([]);
      return;
    }
    let cancelled = false;
    const t = setTimeout(() => {
      void api.getMentionSuggestions(communityId, mentionQuery).then((rows) => {
        if (!cancelled) setSuggestions(rows);
      });
    }, 150);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [communityId, mentionQuery]);

  const detectMention = (text: string, caret: number) => {
    const before = text.slice(0, caret);
    const m = before.match(/@([^\s@]*)$/);
    setMentionQuery(m ? m[1] : null);
  };

  const insertMention = (s: MentionSuggestion) => {
    const el = textareaRef.current;
    if (!el) return;
    const caret = el.selectionStart;
    const before = value.slice(0, caret);
    const after = value.slice(caret);
    const replaced = before.replace(/@([^\s@]*)$/, `@${s.displayName} `);
    setValue(replaced + after);
    setMentionQuery(null);
    setSuggestions([]);
    requestAnimationFrame(() => {
      el.focus();
      const pos = replaced.length;
      el.setSelectionRange(pos, pos);
    });
  };

  const submit = async () => {
    const content = value.trim();
    if (!content || sending || disabled) return;
    setSending(true);
    try {
      await onSend(content);
      setValue('');
      setMentionQuery(null);
    } finally {
      setSending(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void submit();
    }
  };

  const onChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    detectMention(e.target.value, e.target.selectionStart);
    if (onTyping) {
      if (typingTimer.current) clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => onTyping(), 300);
    }
  };

  return (
    <div className="relative border-t border-ais-card-border bg-ais-surface-container-low/30 px-4 py-3">
      {suggestions.length > 0 && mentionQuery != null && (
        <div className="absolute bottom-full left-4 right-4 mb-1 max-h-40 overflow-auto rounded-lg border border-ais-card-border bg-white shadow-[0_4px_12px_rgba(15,23,42,0.08)]">
          {suggestions.map((s) => (
            <button
              key={s.id}
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-ais-on-surface-variant transition-colors hover:bg-ais-row-hover hover:text-ais-primary"
              onClick={() => insertMention(s)}
            >
              <span className="font-semibold text-ais-on-surface">{s.displayName}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-ais-outline">
                {s.role}
              </span>
            </button>
          ))}
        </div>
      )}
      <div className="mb-2 flex items-center gap-0.5">
        <button
          type="button"
          className="rounded-md p-1.5 text-ais-on-surface-variant transition-colors hover:bg-ais-row-hover hover:text-ais-primary"
          title="Bold"
          disabled={disabled}
          onClick={() => wrapSelection('**')}
        >
          <Bold className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          className="rounded-md p-1.5 text-ais-on-surface-variant transition-colors hover:bg-ais-row-hover hover:text-ais-primary"
          title="Italic"
          disabled={disabled}
          onClick={() => wrapSelection('*')}
        >
          <Italic className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          className="rounded-md p-1.5 text-ais-on-surface-variant transition-colors hover:bg-ais-row-hover hover:text-ais-primary"
          title="Code"
          disabled={disabled}
          onClick={() => wrapSelection('`')}
        >
          <Code className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          className="rounded-md p-1.5 text-ais-on-surface-variant transition-colors hover:bg-ais-row-hover hover:text-ais-primary"
          title="Bullet list"
          disabled={disabled}
          onClick={insertListPrefix}
        >
          <List className="h-3.5 w-3.5" />
        </button>
        <div className="relative">
          <button
            type="button"
            className="rounded-md p-1.5 text-ais-on-surface-variant transition-colors hover:bg-ais-row-hover hover:text-ais-primary"
            title="Emoji"
            disabled={disabled}
            onClick={() => setEmojiOpen((o) => !o)}
          >
            <Smile className="h-3.5 w-3.5" />
          </button>
          {emojiOpen && (
            <div className="absolute bottom-full left-0 z-20 mb-1 flex gap-0.5 rounded-lg border border-ais-card-border bg-white p-1 shadow-[0_4px_12px_rgba(15,23,42,0.08)]">
              {QUICK_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  className="rounded-md p-1 text-base hover:bg-ais-row-hover"
                  onClick={() => insertEmoji(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          type="button"
          className="rounded-md p-1.5 text-ais-on-surface-variant/50 transition-colors hover:bg-ais-row-hover disabled:cursor-not-allowed"
          title="Attachments coming soon"
          disabled
        >
          <Paperclip className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          rows={1}
          value={value}
          disabled={disabled || sending}
          placeholder={placeholder}
          onChange={onChange}
          onKeyDown={onKeyDown}
          className={`${aisInput} max-h-32 min-h-10 flex-1 resize-none py-2.5`}
        />
        <button
          type="button"
          disabled={disabled || sending || !value.trim()}
          onClick={() => void submit()}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#E88700] text-white shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Send"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
