'use client';

import React, { useRef, useState } from 'react';
import { Send } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import {
  AisBtnPrimary,
  AisPage,
  aisInput,
} from '@/components/dashboard/teacher/TeacherPortalUi';
import { aisBodySm, aisHeadlineSm, aisLabelCaps } from '@/components/dashboard/teacher/aisStyles';

type MoeMessage = {
  id: string;
  body: string;
  from: 'school-head' | 'moe';
  senderName: string;
  createdAt: string;
};

const SEED_MESSAGES: MoeMessage[] = [
  {
    id: 'moe-seed-1',
    body:
      'Welcome to the MOE communication channel. Use this thread to raise questions about compliance ' +
      'circulars, request clarifications, or report school-level updates directly to the Ministry.',
    from: 'moe',
    senderName: 'MOE Regional Desk',
    createdAt: new Date().toISOString(),
  },
];

function timeLabel(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

/** Session-local messaging thread between the school head and the MOE regional desk. */
export const MoeMessagesPanel: React.FC = () => {
  const { currentUser } = useApp();
  const [messages, setMessages] = useState<MoeMessage[]>(SEED_MESSAGES);
  const [draft, setDraft] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const handleSend = () => {
    if (!draft.trim()) return;
    const message: MoeMessage = {
      id: `local-${Date.now()}`,
      body: draft.trim(),
      from: 'school-head',
      senderName: currentUser?.displayName || 'School Head',
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, message]);
    setDraft('');
    window.setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  };

  return (
    <AisPage>
      <div className="space-y-4">
        <div>
          <p className={aisLabelCaps}>Regulatory Engine</p>
          <h2 className={`${aisHeadlineSm} mt-1 !text-title`}>Message MOE</h2>
          <p className={`${aisBodySm} mt-1`}>
            Direct line to the Ministry of Education regional desk. Messages are kept for this session.
          </p>
        </div>

        <div className="flex min-h-[420px] flex-col overflow-hidden rounded-2xl border border-ais-card-border bg-white dark:bg-ais-surface">
          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4" style={{ maxHeight: 420 }}>
            {messages.map((msg) => {
              const mine = msg.from === 'school-head';
              return (
                <div key={msg.id} className={`flex w-full ${mine ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] px-3.5 py-2.5 text-sm shadow-sm ${
                      mine
                        ? 'rounded-2xl rounded-br-md bg-ais-primary/12 text-ais-on-surface ring-1 ring-ais-primary/15'
                        : 'rounded-2xl rounded-bl-md bg-ais-surface-container-low text-ais-on-surface ring-1 ring-ais-card-border'
                    }`}
                  >
                    {!mine && (
                      <p className="mb-0.5 text-[11px] font-semibold text-ais-on-surface-variant">
                        {msg.senderName}
                      </p>
                    )}
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.body}</p>
                    <p className="mt-1 text-right text-[10px] text-ais-on-surface-variant/80">
                      {timeLabel(msg.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
          <div className="flex gap-2 border-t border-ais-card-border p-3">
            <input
              className={`${aisInput} flex-1`}
              placeholder="Write to the MOE regional desk…"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <AisBtnPrimary type="button" disabled={!draft.trim()} onClick={handleSend}>
              <Send className="h-3.5 w-3.5" aria-hidden />
              Send
            </AisBtnPrimary>
          </div>
        </div>
      </div>
    </AisPage>
  );
};
