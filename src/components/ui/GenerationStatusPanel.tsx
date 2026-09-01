'use client';

import React from 'react';
import { CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react';
import { LinearProgress } from '@/components/ui/progress';
import { formatElapsed } from '@/hooks/useElapsedTime';

export type GenerationPhase = 'idle' | 'generating' | 'success' | 'error';

export interface GenerationStatusPanelProps {
  phase: GenerationPhase;
  /** Short current-activity line, e.g. "Generating batch 3 of 5…" or "Retrieving textbook context…" */
  statusText: string;
  elapsedSeconds: number;
  /** Present for multi-batch flows (annual plans) — omit for single-call generations. */
  batchCurrent?: number;
  batchTotal?: number;
  errorMessage?: string;
  /** Shown once phase === 'success', alongside the built-in checkmark line. */
  successMessage?: string;
}

/**
 * Shared "generation in progress" status card used on every dedicated generation page
 * (annual plans, weekly plans, lesson notes, assessments). Long-running generation requests
 * (a full annual plan can take 60-150s+ across several batches) need to show the user
 * something is actively moving — a live elapsed-time counter plus a specific status line —
 * rather than a bare spinner that gives no signal the request hasn't silently hung. When
 * `batchTotal` is set, also renders a determinate progress bar; otherwise an indeterminate
 * spinner communicates "working" for single-call generations of unknown duration.
 */
export function GenerationStatusPanel({
  phase,
  statusText,
  elapsedSeconds,
  batchCurrent,
  batchTotal,
  errorMessage,
  successMessage,
}: GenerationStatusPanelProps) {
  if (phase === 'idle') return null;

  return (
    <div
      className={`rounded-xl border p-4 sm:p-5 space-y-3 ${
        phase === 'error'
          ? 'border-destructive/30 bg-destructive/5'
          : phase === 'success'
            ? 'border-emerald-500/30 bg-emerald-500/5'
            : 'border-border/70 bg-ais-surface-container-low/50'
      }`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-3">
        {phase === 'generating' && (
          <div className="h-8 w-8 shrink-0 animate-spin rounded-full border-[3px] border-primary border-t-transparent" />
        )}
        {phase === 'success' && (
          <CheckCircle2 className="h-8 w-8 shrink-0 text-emerald-500" aria-hidden />
        )}
        {phase === 'error' && (
          <AlertTriangle className="h-8 w-8 shrink-0 text-destructive" aria-hidden />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground truncate">
            {phase === 'error' ? 'Generation failed' : phase === 'success' ? (successMessage || 'Generated successfully') : statusText}
          </p>
          {phase === 'generating' && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {formatElapsed(elapsedSeconds)} elapsed — this can take a while for longer content, please keep this tab open.
            </p>
          )}
          {phase === 'error' && errorMessage && (
            <p className="text-xs text-destructive/90 mt-0.5">{errorMessage}</p>
          )}
        </div>
        {phase === 'generating' && (
          <Sparkles className="h-4 w-4 shrink-0 text-primary/60 animate-pulse" aria-hidden />
        )}
      </div>

      {phase === 'generating' && typeof batchTotal === 'number' && batchTotal > 1 && (
        <LinearProgress
          value={batchCurrent ?? 0}
          max={batchTotal}
          label={`Batch ${batchCurrent ?? 0} of ${batchTotal}`}
          showValue
          size="md"
        />
      )}
    </div>
  );
}
