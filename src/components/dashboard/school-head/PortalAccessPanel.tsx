'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { api, type PortalUserSummary } from '@/lib/api';
import { readStoredSession } from '@/lib/auth';
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import { ContentCard } from '@/components/dashboard/ContentCard';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

const MODULE_LABELS: Record<string, string> = {
  portal: 'Portal Selection',
  admissions: 'Admissions',
  enrollment: 'Enrollment',
  billing: 'Billing & Fees',
  academics: 'Academics & Grading',
  comms: 'Communications',
  documents: 'Documents',
  admin: 'Administration',
  hr: 'HR & Staff',
  finance: 'Finance',
};

const MODULE_DESCRIPTIONS: Record<string, string> = {
  portal: 'Which portals this account can open',
  admissions: 'Reviewing and deciding on applications',
  enrollment: 'Enrolling, transferring, and promoting students',
  billing: 'Invoices, payments, and fee settings',
  academics: 'Grades, timetables, and the academic calendar',
  comms: 'Announcements and messaging',
  documents: 'Uploading and verifying documents',
  admin: 'Users, roles, and school settings',
  hr: 'Staff records, leave, and payroll',
  finance: 'Budgets and financial reporting',
};

interface CatalogEntry { code: string; label: string; module: string }

/**
 * Replaces the flat ~50-checkbox permission matrix as the default view: pick a
 * user, then grant or revoke access one portal-area at a time. Underneath, this
 * still uses the exact same per-user allow/deny override mechanism as before
 * (POST/DELETE /permissions/users/:userId) — nothing about the authorization
 * model changes, only how an admin interacts with it. The full code-by-code
 * matrix is still available lower down for anyone who genuinely needs it.
 */
export function PortalAccessPanel() {
  const session = readStoredSession();
  const schoolId = session?.schoolId || 'sch-1';

  const [catalog, setCatalog] = useState<CatalogEntry[]>([]);
  const [users, setUsers] = useState<PortalUserSummary[]>([]);
  const [userId, setUserId] = useState('');
  const [effective, setEffective] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [updatingModule, setUpdatingModule] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.permissionCatalog().then(setCatalog).catch(() => undefined);
    api.listPortalUsers(schoolId).then((rows) => {
      setUsers(rows);
      if (rows[0]) setUserId(rows[0].id);
    }).catch(() => setUsers([]));
  }, [schoolId]);

  const loadEffective = useCallback(() => {
    if (!userId) return;
    setLoading(true);
    api.getUserPermissions(userId, schoolId)
      .then((data) => setEffective((data as { effective?: string[] }).effective ?? []))
      .catch(() => setError('Could not load this user’s access.'))
      .finally(() => setLoading(false));
  }, [userId, schoolId]);

  useEffect(() => { loadEffective(); }, [loadEffective]);

  const modules = Array.from(new Set(catalog.map((p) => p.module)));
  const selectedUser = users.find((u) => u.id === userId);

  const moduleState = (mod: string): 'full' | 'partial' | 'none' => {
    const codes = catalog.filter((p) => p.module === mod).map((p) => p.code);
    if (!codes.length) return 'none';
    const grantedCount = codes.filter((c) => effective.includes(c)).length;
    if (grantedCount === 0) return 'none';
    if (grantedCount === codes.length) return 'full';
    return 'partial';
  };

  const toggleModule = async (mod: string) => {
    const codes = catalog.filter((p) => p.module === mod).map((p) => p.code);
    const state = moduleState(mod);
    setUpdatingModule(mod);
    setError('');
    try {
      if (state === 'full') {
        // Revoke: an explicit deny blocks it even if the role would otherwise grant it.
        await Promise.all(codes.map((code) => api.setUserPermission(userId, { permissionCode: code, effect: 'deny', schoolId })));
      } else {
        // Grant: allow every code in this module not already effective.
        const toGrant = codes.filter((c) => !effective.includes(c));
        await Promise.all(toGrant.map((code) => api.setUserPermission(userId, { permissionCode: code, effect: 'allow', schoolId })));
      }
      loadEffective();
    } catch {
      setError('Could not update this portal area. Please try again.');
    } finally {
      setUpdatingModule(null);
    }
  };

  return (
    <PermissionGuard code="permissions.grant">
      <ContentCard
        title="Portal Access"
        description="Give a user access to a portal area. Each toggle grants or revokes everything under that area at once."
      >
        <div className="space-y-5">
          <Select
            label="User"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            options={users.map((u) => ({ value: u.id, label: `${u.displayName} · ${u.role}` }))}
          />

          {selectedUser && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Base role:</span>
              <Badge variant="neutral" size="sm">{selectedUser.role}</Badge>
              <span>— already includes a default access set for this role; toggles below add to or restrict that default for this one person.</span>
            </div>
          )}

          {error && <p className="text-xs text-red-500">{error}</p>}

          <div className="grid gap-3 sm:grid-cols-2">
            {modules.map((mod) => {
              const state = moduleState(mod);
              return (
                <button
                  key={mod}
                  type="button"
                  disabled={loading || updatingModule === mod || !userId}
                  onClick={() => toggleModule(mod)}
                  className={`flex items-start justify-between gap-3 rounded-xl border p-4 text-left transition disabled:opacity-60 ${
                    state === 'full'
                      ? 'border-primary/40 bg-primary/10'
                      : state === 'partial'
                        ? 'border-amber-400/50 bg-amber-50 dark:bg-amber-950/20'
                        : 'border-border/60 bg-card hover:border-primary/25'
                  }`}
                >
                  <div>
                    <p className="text-sm font-semibold text-foreground">{MODULE_LABELS[mod] ?? mod}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{MODULE_DESCRIPTIONS[mod] ?? ''}</p>
                  </div>
                  <Badge
                    variant={state === 'full' ? 'success' : state === 'partial' ? 'warning' : 'neutral'}
                    badgeStyle="subtle"
                    size="sm"
                    className="shrink-0"
                  >
                    {updatingModule === mod ? 'Updating…' : state === 'full' ? 'Granted' : state === 'partial' ? 'Partial' : 'Not granted'}
                  </Badge>
                </button>
              );
            })}
          </div>
        </div>
      </ContentCard>
    </PermissionGuard>
  );
}
