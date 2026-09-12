'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { readStoredSession } from '@/lib/auth';
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import { ContentCard } from '@/components/dashboard/ContentCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function BrandingPanel() {
  const session = readStoredSession();
  const schoolId = session?.schoolId || 'sch-1';
  const [primaryColor, setPrimaryColor] = useState('#1d4ed8');
  const [tagline, setTagline] = useState('');
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getSchoolSettings(schoolId).then((settings) => {
      const s = settings as Record<string, unknown>;
      const branding = (s.branding as { primaryColor?: string; tagline?: string }) || {};
      setPrimaryColor(branding.primaryColor || '#1d4ed8');
      setTagline(branding.tagline || '');
    });
  }, [schoolId]);

  const save = async () => {
    setSaving(true);
    setStatus('');
    try {
      await api.updateSchoolSettings(schoolId, { branding: { primaryColor, tagline } });
      setStatus('Branding saved.');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PermissionGuard code="school.settings">
      <ContentCard
        title="Branding"
        description="Brand color and tagline shown on the public application page"
        actions={
          <Button size="sm" variant="organic" className="border-none" disabled={saving} onClick={save}>
            {saving ? 'Saving…' : 'Save branding'}
          </Button>
        }
      >
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Brand color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} />
            <Input label="Apply page tagline" value={tagline} onChange={(e) => setTagline(e.target.value)} />
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/20 p-4">
            <span
              className="h-10 w-10 shrink-0 rounded-lg border border-border/60"
              style={{ backgroundColor: primaryColor }}
            />
            <div>
              <p className="text-xs font-semibold text-foreground">Preview</p>
              <p className="text-xs text-muted-foreground">{tagline || 'No tagline set yet.'}</p>
            </div>
          </div>
          {status && <p className="text-xs text-muted-foreground">{status}</p>}
        </div>
      </ContentCard>
    </PermissionGuard>
  );
}
