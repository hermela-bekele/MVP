'use client';

import React, { useEffect, useState } from 'react';
import { api, type PortalUserSummary } from '@/lib/api';
import { readStoredSession } from '@/lib/auth';
import { useApp } from '@/context/AppContext';
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import { ContentCard } from '@/components/dashboard/ContentCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PermissionsAdminPanel } from '@/components/dashboard/school-head/PermissionsAdminPanel';
import { PortalAccessPanel } from '@/components/dashboard/school-head/PortalAccessPanel';

export function UsersRolesPanel() {
  const session = readStoredSession();
  const schoolId = session?.schoolId || 'sch-1';
  const { currentUser } = useApp();
  const [users, setUsers] = useState<PortalUserSummary[]>([]);
  const [toggling, setToggling] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const load = () => {
    api.listPortalUsers(schoolId, true).then(setUsers).catch(() => setError('Could not load users.'));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schoolId]);

  const toggle = async (id: string) => {
    setToggling(id);
    setError('');
    try {
      const result = await api.toggleUserStatus(id);
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, isActive: result.isActive } : u)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update that account.');
    } finally {
      setToggling(null);
    }
  };

  return (
    <div className="space-y-6">
      <PermissionGuard code="users.manage">
        <ContentCard
          title="Portal accounts"
          description="Everyone with login access to this school's portals"
          actions={<Badge variant="neutral">{users.length} accounts</Badge>}
        >
          <div className="space-y-2">
            {error && <p className="text-xs text-red-500">{error}</p>}
            {users.map((u) => (
              <div key={u.id} className="flex items-center justify-between gap-2 rounded-md border border-border/60 bg-muted/20 px-3 py-2.5">
                <div>
                  <p className="text-xs font-semibold text-foreground">
                    {u.displayName}
                    {u.isActive === false && <span className="ml-2 text-[10px] font-bold text-red-500 uppercase">Deactivated</span>}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{u.email} · {u.role}</p>
                </div>
                {u.id !== currentUser?.id && (
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={toggling === u.id}
                    onClick={() => toggle(u.id)}
                    className="text-xxs shrink-0"
                  >
                    {toggling === u.id ? 'Updating…' : u.isActive === false ? 'Reactivate' : 'Deactivate'}
                  </Button>
                )}
              </div>
            ))}
            {!users.length && !error && <p className="text-xs text-muted-foreground">Loading accounts…</p>}
          </div>
        </ContentCard>
      </PermissionGuard>

      <PortalAccessPanel />

      <div>
        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          className="text-xs font-semibold text-muted-foreground hover:text-foreground underline underline-offset-2"
        >
          {showAdvanced ? 'Hide advanced permission editor' : 'Advanced: edit individual permission codes'}
        </button>
        {showAdvanced && (
          <div className="mt-4">
            <PermissionsAdminPanel />
          </div>
        )}
      </div>
    </div>
  );
}
