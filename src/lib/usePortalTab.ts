'use client';

import { useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { portalTabPath, tabFromPortalPath } from '@/lib/portalPaths';

/** Sync dashboard tab state with `/dashboard/{role}/{tab}` URLs. */
export function usePortalTab(role: string, defaultTab = 'dashboard') {
  const pathname = usePathname();
  const router = useRouter();
  const fromPath = tabFromPortalPath(pathname, role);
  const activeTab = fromPath === 'dashboard' ? defaultTab : fromPath;

  const setActiveTab = useCallback(
    (tab: string) => {
      router.push(portalTabPath(role, tab));
    },
    [router, role],
  );

  return { activeTab, setActiveTab };
}
