'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { requiresEngineSelection } from '@/lib/engines';

/** Redirects to the engine picker if the current user's role needs an engine but hasn't picked one yet. */
export function EngineGuard({ children }: { children: React.ReactNode }) {
  const { currentUser, authReady, activeEngine } = useApp();
  const router = useRouter();

  const needsSelection = !!currentUser && requiresEngineSelection(currentUser.role) && !activeEngine;

  useEffect(() => {
    if (!authReady) return;
    if (needsSelection) {
      router.replace('/select-engine');
    }
  }, [authReady, needsSelection, router]);

  if (needsSelection) return null;

  return <>{children}</>;
}
