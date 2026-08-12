'use client';

import React, { useEffect, useState } from 'react';
import { api, type PortalUserSummary } from '@/lib/api';
import { readStoredSession } from '@/lib/auth';
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import { ContentCard } from '@/components/dashboard/ContentCard';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

const ROLES = ['registrar', 'teacher', 'parent', 'student', 'finance', 'school-head', 'department-head', 'head-of-academics'];

export function PermissionsAdminPanel() {
  const session = readStoredSession();
  const schoolId = session?.schoolId || 'sch-1';
  const [catalog, setCatalog] = useState<{ code: string; label: string; module: string }[]>([]);
  const [role, setRole] = useState('registrar');
  const [selected, setSelected] = useState<string[]>([]);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const [users, setUsers] = useState<PortalUserSummary[]>([]);
  const [userId, setUserId] = useState('');
  const [userEffective, setUserEffective] = useState<string[]>([]);
  const [overrides, setOverrides] = useState<{ permissionCode: string; effect: string }[]>([]);
  const [overrideCode, setOverrideCode] = useState('');
  const [overrideEffect, setOverrideEffect] = useState<'allow' | 'deny'>('allow');
  const [userMsg, setUserMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    api.permissionCatalog().then(setCatalog).catch(() => undefined);
    api
      .listPortalUsers(schoolId)
      .then((rows) => {
        setUsers(rows);
        if (rows[0]) setUserId(rows[0].id);
      })
      .catch(() => setUsers([]));
  }, [schoolId]);

  useEffect(() => {
    api
      .getRolePermissions(role, schoolId)
      .then((codes) => setSelected(codes as string[]))
      .catch(() => setSelected([]));
  }, [role, schoolId]);

  useEffect(() => {
    if (!userId) return;
    api
      .getUserPermissions(userId, schoolId)
      .then((data) => {
        const d = data as { effective?: string[]; overrides?: { permissionCode: string; effect: string }[] };
        setUserEffective(d.effective ?? []);
        setOverrides(d.overrides ?? []);
      })
      .catch(() => {
        setUserEffective([]);
        setOverrides([]);
      });
  }, [userId, schoolId]);

  useEffect(() => {
    if (!overrideCode && catalog[0]) setOverrideCode(catalog[0].code);
  }, [catalog, overrideCode]);

  const toggle = (code: string) => {
    setSelected((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]));
  };

  const modules = [...new Set(catalog.map((p) => p.module))];

  const save = async () => {
    setSaving(true);
    try {
      await api.setRolePermissions(role, selected, schoolId);
      setMsg({ type: 'ok', text: `Saved ${selected.length} permissions for ${role}.` });
    } catch (err) {
      setMsg({ type: 'err', text: err instanceof Error ? err.message : 'Save failed' });
    } finally {
      setSaving(false);
    }
  };

  const saveUserOverride = async () => {
    if (!userId || !overrideCode) return;
    setSaving(true);
    setUserMsg(null);
    try {
      await api.setUserPermission(userId, {
        permissionCode: overrideCode,
        effect: overrideEffect,
        schoolId,
      });
      const data = (await api.getUserPermissions(userId, schoolId)) as {
        effective?: string[];
        overrides?: { permissionCode: string; effect: string }[];
      };
      setUserEffective(data.effective ?? []);
      setOverrides(data.overrides ?? []);
      setUserMsg({ type: 'ok', text: `Applied ${overrideEffect} for ${overrideCode}.` });
    } catch (err) {
      setUserMsg({ type: 'err', text: err instanceof Error ? err.message : 'Override failed' });
    } finally {
      setSaving(false);
    }
  };

  const removeOverride = async (code: string) => {
    setSaving(true);
    try {
      await api.revokeUserPermission(userId, code, schoolId);
      const data = (await api.getUserPermissions(userId, schoolId)) as {
        effective?: string[];
        overrides?: { permissionCode: string; effect: string }[];
      };
      setUserEffective(data.effective ?? []);
      setOverrides(data.overrides ?? []);
    } catch (err) {
      setUserMsg({ type: 'err', text: err instanceof Error ? err.message : 'Revoke failed' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <PermissionGuard code="permissions.grant">
      <div className="space-y-5">
        <ContentCard
          title="Role permissions"
          description="Grant or revoke module access by role for this school"
          actions={<Badge variant="primary">{selected.length} selected</Badge>}
        >
          <div className="space-y-5">
            <Select
              label="Role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              options={ROLES.map((r) => ({ value: r, label: r }))}
            />

            <div className="max-h-80 space-y-4 overflow-y-auto rounded-xl border border-border/60 bg-muted/20 p-4">
              {modules.map((mod) => (
                <div key={mod}>
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-primary">{mod}</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {catalog
                      .filter((p) => p.module === mod)
                      .map((p) => {
                        const on = selected.includes(p.code);
                        return (
                          <button
                            key={p.code}
                            type="button"
                            onClick={() => toggle(p.code)}
                            className={`rounded-lg border px-3 py-2.5 text-left transition ${
                              on
                                ? 'border-primary/40 bg-primary/10 shadow-sm'
                                : 'border-border/60 bg-card hover:border-primary/25'
                            }`}
                          >
                            <p className="text-xs font-semibold text-foreground">{p.label}</p>
                            <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">{p.code}</p>
                          </button>
                        );
                      })}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm" variant="organic" className="border-none" disabled={saving} onClick={save}>
                {saving ? 'Saving…' : 'Save role permissions'}
              </Button>
              {msg && (
                <p className={`text-xs ${msg.type === 'ok' ? 'text-success' : 'text-destructive'}`}>
                  {msg.text}
                </p>
              )}
            </div>
          </div>
        </ContentCard>

        <ContentCard
          title="Individual user overrides"
          description="Allow or deny specific permissions for one account"
          actions={<Badge variant="info">{overrides.length} overrides</Badge>}
        >
          <div className="space-y-4">
            <Select
              label="User"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              options={users.map((u) => ({
                value: u.id,
                label: `${u.displayName} · ${u.role}`,
              }))}
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <Select
                label="Permission"
                value={overrideCode}
                onChange={(e) => setOverrideCode(e.target.value)}
                options={catalog.map((p) => ({ value: p.code, label: `${p.label} (${p.code})` }))}
              />
              <Select
                label="Effect"
                value={overrideEffect}
                onChange={(e) => setOverrideEffect(e.target.value as 'allow' | 'deny')}
                options={[
                  { value: 'allow', label: 'Allow' },
                  { value: 'deny', label: 'Deny' },
                ]}
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm" disabled={saving || !userId} onClick={saveUserOverride}>
                Apply override
              </Button>
              {userMsg && (
                <p className={`text-xs ${userMsg.type === 'ok' ? 'text-success' : 'text-destructive'}`}>
                  {userMsg.text}
                </p>
              )}
            </div>

            {overrides.length > 0 && (
              <div className="space-y-2 rounded-xl border border-border/60 bg-muted/20 p-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Active overrides</p>
                {overrides.map((o) => (
                  <div key={`${o.permissionCode}-${o.effect}`} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={o.effect === 'allow' ? 'success' : 'danger'}>{o.effect}</Badge>
                      <span className="font-mono text-xs">{o.permissionCode}</span>
                    </div>
                    <Button size="sm" variant="secondary" disabled={saving} onClick={() => removeOverride(o.permissionCode)}>
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="rounded-xl border border-border/50 bg-card p-3">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Effective permissions ({userEffective.length})
              </p>
              <div className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto">
                {userEffective.map((code) => (
                  <Badge key={code} variant="neutral">
                    {code}
                  </Badge>
                ))}
                {!userEffective.length && (
                  <p className="text-xs text-muted-foreground">No effective permissions loaded.</p>
                )}
              </div>
            </div>
          </div>
        </ContentCard>
      </div>
    </PermissionGuard>
  );
}
