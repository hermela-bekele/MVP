'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ModalPortal, useModalScrollLock } from '@/components/ui/modal-overlay';

/* ───────────── Types ───────────── */

export interface CommandItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  group: string;
  action: () => void;
  shortcut?: string;
}

export interface CommandPaletteProps {
  items: CommandItem[];
  groups?: string[];
  placeholder?: string;
  className?: string;
}

/* ───────────── Fuzzy match ───────────── */

function fuzzyMatch(query: string, text: string): boolean {
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  let qi = 0;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) qi++;
  }
  return qi === q.length;
}

/* ───────────── Component ───────────── */

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  items,
  groups,
  placeholder = 'Type a command or search…',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [closing, setClosing] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const isOpenRef = useRef(isOpen);
  
  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  const triggerClose = useCallback(() => {
    setClosing(true);
    setTimeout(() => {
      setIsOpen(false);
      setClosing(false);
    }, 150);
  }, []);

  /* ── Ctrl+K / Cmd+K global shortcut ── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpenRef.current) triggerClose();
        else setIsOpen(true);
      }
    };

    const handleOpenEvent = () => {
      setIsOpen(true);
    };

    document.addEventListener('keydown', handler);
    window.addEventListener('open-command-palette', handleOpenEvent);

    return () => {
      document.removeEventListener('keydown', handler);
      window.removeEventListener('open-command-palette', handleOpenEvent);
    };
  }, [triggerClose]);

  /* ── Focus input on open ── */
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setActiveIndex(0);
      setClosing(false);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isOpen]);

  useModalScrollLock(isOpen);

  /* ── Filter & group items ── */
  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    return items.filter((item) => fuzzyMatch(query, item.label));
  }, [query, items]);

  const groupOrder = groups ?? [...new Set(items.map((i) => i.group))];

  const groupedFiltered = useMemo(() => {
    const map = new Map<string, CommandItem[]>();
    for (const g of groupOrder) map.set(g, []);
    for (const item of filtered) {
      const arr = map.get(item.group);
      if (arr) arr.push(item);
      else map.set(item.group, [item]);
    }
    // Remove empty groups
    for (const [k, v] of map) if (v.length === 0) map.delete(k);
    return map;
  }, [filtered, groupOrder]);

  const flatFiltered = useMemo(() => [...groupedFiltered.values()].flat(), [groupedFiltered]);

  /* ── Keyboard navigation ── */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setActiveIndex((prev) => (prev < flatFiltered.length - 1 ? prev + 1 : 0));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setActiveIndex((prev) => (prev > 0 ? prev - 1 : flatFiltered.length - 1));
          break;
        case 'Enter':
          e.preventDefault();
          if (flatFiltered[activeIndex]) {
            flatFiltered[activeIndex].action();
            triggerClose();
          }
          break;
        case 'Escape':
          e.preventDefault();
          triggerClose();
          break;
      }
    },
    [activeIndex, flatFiltered, triggerClose],
  );

  /* ── Scroll active item into view ── */
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-cmd-index="${activeIndex}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  /* ── Reset active when query changes ── */
  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  if (!isOpen) return null;

  let runningIndex = -1;

  return (
    <ModalPortal>
    <div className={`fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] p-4 ${className}`}>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-slate-950/50 backdrop-blur-md backdrop-saturate-150 [-webkit-backdrop-filter:blur(12px)] ${closing ? 'animate-cmd-backdrop-exit' : 'animate-cmd-backdrop-enter'}`}
        onClick={triggerClose}
      />

      {/* Panel */}
      <div
        className={`
          relative z-10 w-full max-w-lg overflow-hidden rounded-xl border border-border/60
          bg-popover/80 backdrop-blur-xl shadow-2xl
          ${closing ? 'animate-cmd-exit' : 'animate-cmd-enter'}
        `}
        onKeyDown={handleKeyDown}
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
      >
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-border/40 px-4">
          <svg className="h-4 w-4 flex-shrink-0 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="flex-1 bg-transparent py-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            aria-label="Search commands"
          />
          <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-border bg-muted/60 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[320px] overflow-y-auto overscroll-contain py-2" role="listbox">
          {flatFiltered.length === 0 && (
            <div className="flex flex-col items-center py-10 text-sm text-muted-foreground">
              <svg className="mb-2 h-8 w-8 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              No results found
            </div>
          )}

          {[...groupedFiltered.entries()].map(([group, groupItems]) => (
            <div key={group} className="px-2">
              <p className="px-2 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground select-none">
                {group}
              </p>
              {groupItems.map((item) => {
                runningIndex++;
                const idx = runningIndex;
                const isActive = idx === activeIndex;
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    data-cmd-index={idx}
                    onClick={() => {
                      item.action();
                      triggerClose();
                    }}
                    onMouseEnter={() => setActiveIndex(idx)}
                    className={`
                      flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors duration-75 cursor-pointer
                      focus-visible:outline-none
                      ${isActive ? 'bg-primary/10 text-primary' : 'text-foreground/80 hover:bg-muted'}
                    `}
                  >
                    {item.icon && (
                      <span className={`flex h-5 w-5 items-center justify-center flex-shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                        {item.icon}
                      </span>
                    )}
                    <span className="flex-1 text-left truncate">{item.label}</span>
                    {item.shortcut && (
                      <kbd className="ml-auto hidden sm:inline-flex items-center gap-0.5 rounded border border-border bg-muted/60 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                        {item.shortcut}
                      </kbd>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4 border-t border-border/40 px-4 py-2 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1"><kbd className="rounded border border-border bg-muted/60 px-1 py-px font-mono">↑↓</kbd> navigate</span>
          <span className="inline-flex items-center gap-1"><kbd className="rounded border border-border bg-muted/60 px-1 py-px font-mono">↵</kbd> select</span>
          <span className="inline-flex items-center gap-1"><kbd className="rounded border border-border bg-muted/60 px-1 py-px font-mono">esc</kbd> close</span>
        </div>
      </div>

      {/* Inline keyframes */}
      <style>{`
        @keyframes cmd-enter   { from { opacity:0; transform:translateY(-12px) scale(0.98); } to { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes cmd-exit    { from { opacity:1; transform:translateY(0) scale(1); } to { opacity:0; transform:translateY(-8px) scale(0.98); } }
        @keyframes cmd-backdrop-enter { from { opacity:0; } to { opacity:1; } }
        @keyframes cmd-backdrop-exit  { from { opacity:1; } to { opacity:0; } }
        .animate-cmd-enter   { animation: cmd-enter   180ms cubic-bezier(0.16,1,0.3,1) forwards; }
        .animate-cmd-exit    { animation: cmd-exit    150ms cubic-bezier(0.16,1,0.3,1) forwards; }
        .animate-cmd-backdrop-enter { animation: cmd-backdrop-enter 200ms ease forwards; }
        .animate-cmd-backdrop-exit  { animation: cmd-backdrop-exit  150ms ease forwards; }
      `}</style>
    </div>
    </ModalPortal>
  );
};
