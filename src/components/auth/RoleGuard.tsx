'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { dashboardPathForRole, isPortalRole } from '@/lib/auth';

export function RoleGuard({ children }: { children: React.ReactNode }) {
  const { currentUser, authReady } = useApp();
  const pathname = usePathname();
  const router = useRouter();

  const routeMatch = pathname.match(/^\/dashboard\/([^/]+)/);
  const routeRole = routeMatch?.[1] ?? null;

  useEffect(() => {
    if (!authReady) return;

    if (!currentUser) {
      router.replace('/login');
      return;
    }

    if (routeRole && isPortalRole(routeRole) && routeRole !== currentUser.role) {
      router.replace(dashboardPathForRole(currentUser.role));
    }
  }, [authReady, currentUser, routeRole, router]);

  if (!authReady) {
    return (
      <div className="flex flex-1 min-h-screen items-center justify-center bg-[hsl(var(--dashboard-bg))]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading your portal…</p>
        </div>
      </div>
    );
  }

  if (!currentUser) return null;

  if (routeRole && isPortalRole(routeRole) && routeRole !== currentUser.role) {
    return null;
  }

  return <>{children}</>;
}
