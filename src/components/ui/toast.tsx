'use client';

import React, { createContext, useCallback, useContext, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';

export type ToastVariant = 'success' | 'info' | 'alert' | 'request';

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
}

type ToastInput = {
  /** Pass the same id across calls to update an existing toast in place instead of stacking a new one. */
  id?: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
  durationMs?: number;
};

type ToastContextValue = {
  toast: (input: ToastInput) => string;
  dismiss: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const VARIANT_STYLES: Record<
  ToastVariant,
  { iconWrap: string; Icon: React.ComponentType<{ className?: string }> }
> = {
  success: {
    iconWrap: 'bg-emerald-500/10 text-emerald-600',
    Icon: CheckCircle2,
  },
  info: {
    iconWrap: 'bg-primary/10 text-primary',
    Icon: Info,
  },
  alert: {
    iconWrap: 'bg-red-500/10 text-red-600',
    Icon: AlertTriangle,
  },
  request: {
    iconWrap: 'bg-amber-500/10 text-amber-600',
    Icon: Info,
  },
};

let externalToast: ((input: ToastInput) => string) | null = null;
let externalDismiss: ((id: string) => void) | null = null;

/** Imperative toast helper — safe to call outside React components. Returns the toast id (pass it back in via `id` to update the same toast). */
export function toast(input: ToastInput): string {
  return externalToast?.(input) ?? input.id ?? '';
}

/** Imperative dismiss helper — safe to call outside React components. */
export function dismissToast(id: string) {
  externalDismiss?.(id);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const timeoutsRef = useRef<Map<string, number>>(new Map());
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );

  const dismiss = useCallback((id: string) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
    const existingTimeout = timeoutsRef.current.get(id);
    if (existingTimeout !== undefined) {
      window.clearTimeout(existingTimeout);
      timeoutsRef.current.delete(id);
    }
  }, []);

  const push = useCallback(
    (input: ToastInput): string => {
      const id = input.id ?? `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setItems((prev) => {
        const item: ToastItem = {
          id,
          title: input.title,
          description: input.description,
          variant: input.variant ?? 'info',
        };
        const existingIndex = prev.findIndex((t) => t.id === id);
        if (existingIndex >= 0) {
          const next = [...prev];
          next[existingIndex] = item;
          return next;
        }
        return [item, ...prev].slice(0, 5);
      });
      const existingTimeout = timeoutsRef.current.get(id);
      if (existingTimeout !== undefined) window.clearTimeout(existingTimeout);
      const duration = input.durationMs ?? 4200;
      const timeoutId = window.setTimeout(() => dismiss(id), duration);
      timeoutsRef.current.set(id, timeoutId);
      return id;
    },
    [dismiss],
  );

  React.useEffect(() => {
    externalToast = push;
    externalDismiss = dismiss;
    return () => {
      if (externalToast === push) externalToast = null;
      if (externalDismiss === dismiss) externalDismiss = null;
    };
  }, [push, dismiss]);

  const value = useMemo(() => ({ toast: push, dismiss }), [push, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {mounted &&
        createPortal(
          <div
            className="pointer-events-none fixed inset-x-0 top-3 z-[200] flex flex-col items-center gap-2 px-3 sm:top-4"
            aria-live="polite"
            aria-relevant="additions"
          >
            {items.map((item) => {
              const style = VARIANT_STYLES[item.variant];
              const Icon = style.Icon;
              return (
                <div
                  key={item.id}
                  role="status"
                  className="pointer-events-auto w-full max-w-md animate-fade-in-down rounded-2xl border border-border/60 bg-white/95 px-4 py-3.5 shadow-[0_16px_40px_rgba(15,23,42,0.16)] backdrop-blur-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${style.iconWrap}`}>
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <div className="min-w-0 flex-1 pt-1">
                      <p className="text-sm font-semibold text-foreground leading-snug">{item.title}</p>
                      {item.description ? (
                        <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                          {item.description}
                        </p>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={() => dismiss(item.id)}
                      className="shrink-0 rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                      aria-label="Dismiss notification"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>,
          document.body,
        )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      toast: (input: ToastInput) => toast(input),
      dismiss: () => undefined,
    };
  }
  return ctx;
}
