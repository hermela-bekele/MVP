'use client';

import React from 'react';
import { CloudOff, RefreshCw, Wifi } from 'lucide-react';
import { useApp } from '@/context/AppContext';

function formatSyncedAt(iso: string | null): string {
  if (!iso) return 'never';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

/** Compact status strip when offline or serving cached portal data. */
export const OfflineBanner: React.FC = () => {
  const {
    isOnline,
    dataSource,
    lastSyncedAt,
    pendingSyncCount,
    refreshFromApi,
    isDataLoading,
  } = useApp();

  if (isOnline && dataSource === 'api' && pendingSyncCount === 0) {
    return null;
  }

  const offline = !isOnline;
  const cached = dataSource === 'offline-cache';
  const mock = dataSource === 'mock';

  let message = '';
  if (offline && cached) {
    message = `Offline — showing saved portal data (last synced ${formatSyncedAt(lastSyncedAt)}). AI generation and live sync are unavailable.`;
  } else if (offline && mock) {
    message = 'Offline — no saved school data on this device yet. Connect once to download your portal.';
  } else if (offline) {
    message = 'You are offline. Changes stay on this device until you reconnect.';
  } else if (cached) {
    message = `Using saved data (last synced ${formatSyncedAt(lastSyncedAt)}). Server unreachable.`;
  } else if (mock) {
    message = 'Live server unavailable — demo data only.';
  } else if (pendingSyncCount > 0) {
    message = `${pendingSyncCount} change${pendingSyncCount === 1 ? '' : 's'} waiting to sync.`;
  }

  if (!message) return null;

  return (
    <div
      role="status"
      className={`sticky top-0 z-[60] flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2 text-xs sm:text-sm ${
        offline || mock
          ? 'border-amber-300/80 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100'
          : 'border-sky-300/80 bg-sky-50 text-sky-950 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-100'
      }`}
    >
      <div className="flex min-w-0 items-start gap-2">
        {offline ? (
          <CloudOff className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        ) : (
          <Wifi className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        )}
        <p className="min-w-0 leading-snug">{message}</p>
      </div>
      {isOnline && (
        <button
          type="button"
          disabled={isDataLoading}
          onClick={() => void refreshFromApi()}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-current/20 bg-white/70 px-2.5 py-1 text-xs font-semibold hover:bg-white dark:bg-black/20"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isDataLoading ? 'animate-spin' : ''}`} aria-hidden />
          Sync now
        </button>
      )}
    </div>
  );
};
