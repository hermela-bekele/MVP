'use client';

import React from 'react';
import { hasPermission, readStoredSession } from '@/lib/auth';

export function PermissionGuard({
  code,
  children,
  fallback = null,
}: {
  code: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const user = readStoredSession();
  if (!hasPermission(user, code)) return <>{fallback}</>;
  return <>{children}</>;
}
