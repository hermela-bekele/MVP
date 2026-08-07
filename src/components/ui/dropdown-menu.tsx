'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';

/* ───────────── Types ───────────── */

export interface DropdownMenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  shortcut?: string;
  disabled?: boolean;
  danger?: boolean;
  onClick?: () => void;
}

export interface DropdownMenuSection {
  header?: string;
  items: DropdownMenuItem[];
}

export interface DropdownMenuProps {
  trigger: React.ReactNode;
  sections: DropdownMenuSection[];
  align?: 'left' | 'right';
  /** Force menu direction. Default `auto` opens upward when near the bottom of the viewport. */
  side?: 'auto' | 'top' | 'bottom';
  className?: string;
}

/* ───────────── Component ───────────── */

export const DropdownMenu: React.FC<DropdownMenuProps> = ({
  trigger,
  sections,
  align = 'left',
  side = 'auto',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [closing, setClosing] = useState(false);
  const [openUp, setOpenUp] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Build a flat list of selectable item indices
  const flatItems = sections.flatMap((s) => s.items);
  const selectableIndices = flatItems
    .map((item, i) => (!item.disabled ? i : -1))
    .filter((i) => i !== -1);

  const resolvePlacement = useCallback(() => {
    if (side === 'top') {
      setOpenUp(true);
      return;
    }
    if (side === 'bottom') {
      setOpenUp(false);
      return;
    }
    const el = containerRef.current;
    if (!el) {
      setOpenUp(false);
      return;
    }
    const rect = el.getBoundingClientRect();
    const estimatedMenuHeight = Math.max(120, flatItems.length * 40 + 16);
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    setOpenUp(spaceBelow < estimatedMenuHeight && spaceAbove > spaceBelow);
  }, [side, flatItems.length]);

  /* ── Open / Close helpers ── */
  const open = useCallback(() => {
    resolvePlacement();
    setClosing(false);
    setIsOpen(true);
    setActiveIndex(-1);
  }, [resolvePlacement]);

  const close = useCallback(() => {
    setClosing(true);
    const timer = setTimeout(() => {
      setIsOpen(false);
      setClosing(false);
      setActiveIndex(-1);
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  const toggle = useCallback(() => {
    if (isOpen) close();
    else open();
  }, [isOpen, open, close]);

  /* ── Click‑outside ── */
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        close();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen, close]);

  /* ── Recompute placement on resize/scroll while open ── */
  useEffect(() => {
    if (!isOpen || side !== 'auto') return;
    const onMove = () => resolvePlacement();
    window.addEventListener('resize', onMove);
    window.addEventListener('scroll', onMove, true);
    return () => {
      window.removeEventListener('resize', onMove);
      window.removeEventListener('scroll', onMove, true);
    };
  }, [isOpen, side, resolvePlacement]);

  /* ── Keyboard navigation ── */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen) {
        if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          open();
        }
        return;
      }

      switch (e.key) {
        case 'ArrowDown': {
          e.preventDefault();
          const currPos = selectableIndices.indexOf(activeIndex);
          const next = currPos < selectableIndices.length - 1 ? selectableIndices[currPos + 1] : selectableIndices[0];
          setActiveIndex(next);
          itemRefs.current[next]?.focus();
          break;
        }
        case 'ArrowUp': {
          e.preventDefault();
          const currPos = selectableIndices.indexOf(activeIndex);
          const prev = currPos > 0 ? selectableIndices[currPos - 1] : selectableIndices[selectableIndices.length - 1];
          setActiveIndex(prev);
          itemRefs.current[prev]?.focus();
          break;
        }
        case 'Enter':
        case ' ': {
          e.preventDefault();
          if (activeIndex >= 0 && !flatItems[activeIndex]?.disabled) {
            flatItems[activeIndex]?.onClick?.();
            close();
          }
          break;
        }
        case 'Escape': {
          e.preventDefault();
          close();
          break;
        }
        case 'Tab': {
          close();
          break;
        }
      }
    },
    [isOpen, activeIndex, selectableIndices, flatItems, open, close],
  );

  /* ── Render helpers ── */
  let globalIdx = -1;

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`} onKeyDown={handleKeyDown}>
      {/* Trigger */}
      <button
        type="button"
        onClick={toggle}
        aria-haspopup="true"
        aria-expanded={isOpen}
        className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md cursor-pointer"
      >
        {trigger}
      </button>

      {/* Menu */}
      {isOpen && (
        <div
          ref={menuRef}
          role="menu"
          aria-orientation="vertical"
          className={`
            absolute z-50 min-w-[200px] rounded-lg border border-border bg-popover text-popover-foreground shadow-lg
            ${align === 'right' ? 'right-0' : 'left-0'}
            ${openUp ? 'bottom-full mb-1.5' : 'top-full mt-1.5'}
            ${closing ? 'animate-dropdown-exit' : openUp ? 'animate-dropdown-enter-up' : 'animate-dropdown-enter'}
          `}
          style={{
            animationDuration: '150ms',
            animationFillMode: 'forwards',
          }}
        >
          <div className="py-1">
            {sections.map((section, sIdx) => (
              <React.Fragment key={sIdx}>
                {/* Divider between sections */}
                {sIdx > 0 && <div className="my-1 h-px bg-border" role="separator" />}

                {/* Section header */}
                {section.header && (
                  <p className="px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground select-none">
                    {section.header}
                  </p>
                )}

                {/* Items */}
                {section.items.map((item) => {
                  globalIdx++;
                  const idx = globalIdx;
                  const isActive = activeIndex === idx;

                  return (
                    <button
                      key={item.id}
                      ref={(el) => { itemRefs.current[idx] = el; }}
                      role="menuitem"
                      tabIndex={-1}
                      disabled={item.disabled}
                      onClick={() => {
                        if (!item.disabled) {
                          item.onClick?.();
                          close();
                        }
                      }}
                      onMouseEnter={() => setActiveIndex(idx)}
                      onMouseLeave={() => setActiveIndex(-1)}
                      className={`
                        flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors duration-100 cursor-pointer
                        focus-visible:outline-none
                        ${item.disabled ? 'opacity-40 pointer-events-none' : ''}
                        ${item.danger
                          ? isActive
                            ? 'bg-destructive/10 text-destructive'
                            : 'text-destructive/80 hover:bg-destructive/10 hover:text-destructive'
                          : isActive
                          ? 'bg-muted text-foreground'
                          : 'text-foreground/80 hover:bg-muted hover:text-foreground'
                        }
                      `}
                    >
                      {item.icon && <span className="flex h-4 w-4 items-center justify-center text-current opacity-70">{item.icon}</span>}
                      <span className="flex-1 text-left">{item.label}</span>
                      {item.shortcut && (
                        <kbd className="ml-auto hidden text-[11px] font-mono tracking-wide text-muted-foreground sm:inline-block">
                          {item.shortcut}
                        </kbd>
                      )}
                    </button>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* Inline keyframes (injected once) */}
      <style>{`
        @keyframes dropdown-enter {
          from { opacity: 0; transform: translateY(-4px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes dropdown-enter-up {
          from { opacity: 0; transform: translateY(4px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes dropdown-exit {
          from { opacity: 1; transform: translateY(0) scale(1); }
          to   { opacity: 0; transform: translateY(-4px) scale(0.97); }
        }
        .animate-dropdown-enter { animation-name: dropdown-enter; animation-timing-function: cubic-bezier(0.16,1,0.3,1); }
        .animate-dropdown-enter-up { animation-name: dropdown-enter-up; animation-timing-function: cubic-bezier(0.16,1,0.3,1); }
        .animate-dropdown-exit  { animation-name: dropdown-exit;  animation-timing-function: cubic-bezier(0.16,1,0.3,1); }
      `}</style>
    </div>
  );
};
