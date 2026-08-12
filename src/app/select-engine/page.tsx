'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { dashboardPathForRole } from '@/lib/auth';
import { ENGINE_DESCRIPTIONS, enginesForRole, engineLabel, requiresEngineSelection, type EngineId } from '@/lib/engines';

const ENGINE_ICONS: Record<EngineId, React.ReactNode> = {
  administrative: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m9 0V9a2 2 0 00-2-2M5 12h5m0 0l-2-2m2 2l-2 2"/></svg>
  ),
  registrar: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
  ),
  curriculum: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
  ),
  regulatory: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 2l9 4v2H3V6l9-4zM5 10v9m4-9v9m6-9v9m4-9v9M3 21h18"/></svg>
  ),
  training: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222"/></svg>
  ),
  academic: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
  ),
  teaching: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
  ),
  management: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>
  ),
  communications: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
  ),
};

export default function SelectEnginePage() {
  const { currentUser, authReady, setEngine, logout } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!authReady) return;
    if (!currentUser) {
      router.replace('/login');
      return;
    }
    if (!requiresEngineSelection(currentUser.role)) {
      router.replace(dashboardPathForRole(currentUser.role));
    }
  }, [authReady, currentUser, router]);

  if (!authReady || !currentUser || !requiresEngineSelection(currentUser.role)) {
    return (
      <div className="flex flex-1 min-h-screen items-center justify-center bg-[hsl(var(--dashboard-bg))]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const engines = enginesForRole(currentUser.role);

  const handleSelect = (engine: EngineId) => {
    setEngine(engine);
    router.replace(dashboardPathForRole(currentUser.role));
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[hsl(var(--dashboard-bg))] p-6">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-8">
          <div className="mx-auto h-11 w-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg shadow-md mb-4">
            PE
          </div>
          <h1 className="text-xl font-bold text-foreground">Choose an Engine</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Select the workspace you&apos;d like to use, {currentUser.displayName}. You can switch engines later.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {engines.map((engine) => (
            <button
              key={engine}
              type="button"
              onClick={() => handleSelect(engine)}
              className="text-left bg-card rounded-xl border border-border/80 shadow-sm hover:shadow-lg hover:border-primary/60 transition-all p-5 flex items-start gap-4 focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <div className="h-11 w-11 shrink-0 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                {ENGINE_ICONS[engine]}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-foreground">{engineLabel(engine, currentUser.role)}</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {ENGINE_DESCRIPTIONS[engine]}
                </p>
              </div>
            </button>
          ))}
        </div>

        <div className="text-center mt-8">
          <button
            type="button"
            onClick={() => {
              logout();
              router.push('/login');
            }}
            className="text-xs text-muted-foreground hover:text-foreground hover:underline"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
