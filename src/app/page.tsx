'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { dashboardPathForRole } from '@/lib/auth';

export default function Home() {
  const router = useRouter();
  const { currentUser, authReady } = useApp();

  useEffect(() => {
    if (!authReady) return;

    if (currentUser) {
      router.replace(dashboardPathForRole(currentUser.role));
    } else {
      router.replace('/login');
    }
  }, [authReady, currentUser, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <p className="text-muted-foreground text-sm font-medium">Redirecting…</p>
      </div>
    </div>
  );
}
