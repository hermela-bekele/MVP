'use client';

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
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
  title: string;
  description?: string;
  variant?: ToastVariant;
  durationMs?: number;
};

type ToastContextValue = {
  toast: (input: ToastInput) => void;
  dismiss: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const VARIANT_STYLES: Record<
  ToastVariant,
  { bar: string; icon: string; Icon: React.ComponentType<{ className?: string }> }
> = {
  success: {
    bar: 'border-l-emerald-500',
    icon: 'text-emerald-600',
    Icon: CheckCircle2,
  },
  info: {
    bar: 'border-l-primary',
    icon: 'text-primary',
    Icon: Info,
  },
  alert: {
    bar: 'border-l-red-500',
    icon: 'text-red-600',
    Icon: AlertTriangle,
  },
  request: {
    bar: 'border-l-amber-500',
    icon: 'text-amber-600',
    Icon: Info,
  },
};

let externalToast: ((input: ToastInput) => void) | null = null;

/** Imperative toast helper — safe to call outside React components. */
export function toast(input: ToastInput) {
  externalToast?.(input);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => setMounted(true), []);

  const dismiss = useCallback((id: string) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (input: ToastInput) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const item: ToastItem = {
        id,
        title: input.title,
        description: input.description,
        variant: input.variant ?? 'info',
      };
      setItems((prev) => [item, ...prev].slice(0, 5));
      const duration = input.durationMs ?? 4200;
      window.setTimeout(() => dismiss(id), duration);
    },
    [dismiss],
  );

  React.useEffect(() => {
    externalToast = push;
    return () => {
      if (externalToast === push) externalToast = null;
    };
  }, [push]);

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
                  className={`pointer-events-auto w-full max-w-md animate-fade-in-down rounded-xl border border-border/70 border-l-4 ${style.bar} bg-white/95 px-4 py-3 shadow-lg shadow-black/10 backdrop-blur-sm`}
                >
                  <div className="flex items-start gap-3">
                    <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${style.icon}`} />
                    <div className="min-w-0 flex-1">
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
                      className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
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
