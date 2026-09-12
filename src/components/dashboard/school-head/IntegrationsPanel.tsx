'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { readStoredSession } from '@/lib/auth';

type IntegrationType = 'emis' | 'sms' | 'email';

interface IntegrationRow {
  type: IntegrationType;
  status: 'not_configured' | 'configured' | 'disabled';
  config: Record<string, string>;
  updatedAt: string | null;
}

const INTEGRATIONS: { type: IntegrationType; label: string; description: string; fields: { key: string; label: string }[] }[] = [
  {
    type: 'emis',
    label: 'MOE EMIS',
    description: 'Ministry of Education Education Management Information System — the authoritative school registry. No live credentials have been issued yet; saving here only records the connection details for when they are.',
    fields: [
      { key: 'baseUrl', label: 'EMIS API base URL' },
      { key: 'apiKey', label: 'API key' },
    ],
  },
  {
    type: 'sms',
    label: 'SMS Provider',
    description: 'Used for announcement and reminder delivery to parents by text message.',
    fields: [
      { key: 'provider', label: 'Provider name' },
      { key: 'apiKey', label: 'API key' },
      { key: 'senderId', label: 'Sender ID' },
    ],
  },
  {
    type: 'email',
    label: 'Email Provider',
    description: 'Outbound email for invoices, admission decisions, and notifications.',
    fields: [
      { key: 'fromAddress', label: 'From address' },
      { key: 'apiKey', label: 'API key' },
    ],
  },
];

const STATUS_LABEL: Record<IntegrationRow['status'], string> = {
  not_configured: 'Not Configured',
  configured: 'Configured (Unverified)',
  disabled: 'Disabled',
};

const STATUS_VARIANT: Record<IntegrationRow['status'], 'neutral' | 'success' | 'danger'> = {
  not_configured: 'neutral',
  configured: 'success',
  disabled: 'danger',
};

export function IntegrationsPanel() {
  const session = readStoredSession();
  const schoolId = session?.schoolId || 'sch-1';
  const [rows, setRows] = useState<Record<IntegrationType, IntegrationRow | undefined>>({} as never);
  const [drafts, setDrafts] = useState<Record<string, Record<string, string>>>({});
  const [saving, setSaving] = useState<IntegrationType | null>(null);
  const [message, setMessage] = useState<{ type: IntegrationType; text: string } | null>(null);

  useEffect(() => {
    api.getSchoolIntegrations(schoolId).then((data) => {
      const rowsData = data as IntegrationRow[];
      const byType = Object.fromEntries(rowsData.map((r) => [r.type, r])) as Record<IntegrationType, IntegrationRow>;
      setRows(byType);
      const nextDrafts: Record<string, Record<string, string>> = {};
      for (const r of rowsData) nextDrafts[r.type] = r.config ?? {};
      setDrafts(nextDrafts);
    });
  }, [schoolId]);

  const save = async (type: IntegrationType) => {
    setSaving(type);
    setMessage(null);
    try {
      const updated = (await api.updateSchoolIntegration(schoolId, type, {
        config: drafts[type] ?? {},
        status: 'configured',
      })) as IntegrationRow;
      setRows((prev) => ({ ...prev, [type]: updated }));
      setMessage({ type, text: 'Saved.' });
    } catch (err) {
      setMessage({ type, text: err instanceof Error ? err.message : 'Save failed.' });
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="space-y-5">
      {INTEGRATIONS.map((integration) => {
        const row = rows[integration.type];
        const status = row?.status ?? 'not_configured';
        return (
          <Card key={integration.type} className="border-border/60">
            <CardHeader className="pb-3 border-b border-border/30 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold">{integration.label}</CardTitle>
                <p className="text-xs text-muted-foreground mt-1 max-w-2xl">{integration.description}</p>
              </div>
              <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                {integration.fields.map((f) => (
                  <div key={f.key} className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase block">{f.label}</label>
                    <input
                      type="text"
                      value={drafts[integration.type]?.[f.key] ?? ''}
                      onChange={(e) =>
                        setDrafts((prev) => ({
                          ...prev,
                          [integration.type]: { ...prev[integration.type], [f.key]: e.target.value },
                        }))
                      }
                      className="w-full h-10 px-3 bg-muted/40 border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <Button
                  size="sm"
                  variant="organic"
                  className="border-none text-xs"
                  disabled={saving === integration.type}
                  onClick={() => save(integration.type)}
                >
                  {saving === integration.type ? 'Saving…' : 'Save configuration'}
                </Button>
                {message?.type === integration.type && (
                  <p className="text-xs text-muted-foreground">{message.text}</p>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
