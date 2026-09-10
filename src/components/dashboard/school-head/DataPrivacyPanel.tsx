'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api, type AuditLogEntry } from '@/lib/api';
import { readStoredSession } from '@/lib/auth';

export function DataPrivacyPanel() {
  const session = readStoredSession();
  const schoolId = session?.schoolId || 'sch-1';
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [logsError, setLogsError] = useState('');
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');

  useEffect(() => {
    api.listAuditLogs({ limit: 25 }).then(setLogs).catch(() => setLogsError('Could not load the audit trail.'));
  }, []);

  const handleExport = async () => {
    setExporting(true);
    setExportError('');
    try {
      await api.downloadSchoolDataExport(schoolId);
    } catch {
      setExportError('Could not generate the export. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-border/60">
        <CardHeader className="pb-3 border-b border-border/30">
          <CardTitle className="text-base font-bold">Data Export</CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-3">
          <p className="text-xs text-muted-foreground max-w-2xl">
            Download this school&apos;s core records — profile, teachers, students, classes, and departments —
            as a JSON file.
          </p>
          <Button size="sm" variant="organic" className="border-none text-xs" disabled={exporting} onClick={handleExport}>
            {exporting ? 'Preparing export…' : 'Download data export'}
          </Button>
          {exportError && <p className="text-xs text-red-500">{exportError}</p>}
          <p className="text-[10px] text-muted-foreground max-w-2xl pt-2 border-t border-border/40">
            Data retention: institutional records are retained for the lifetime of the school&apos;s participation
            in PRIME EduAI. There is no automated bulk-deletion tool yet — a deletion request should be directed
            to your MOE administrator so it can be verified and carried out safely.
          </p>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader className="pb-3 border-b border-border/30">
          <CardTitle className="text-base font-bold">Recent Audit Activity</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {logsError && <p className="text-xs text-red-500">{logsError}</p>}
          {!logs.length && !logsError && <p className="text-xs text-muted-foreground">Loading audit trail…</p>}
          <div className="space-y-2">
            {logs.map((log) => (
              <div key={log.id} className="flex items-center justify-between gap-2 rounded-md border border-border/60 bg-muted/20 px-3 py-2.5">
                <div>
                  <p className="text-xs font-semibold text-foreground">{log.action}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {log.actorName ?? 'System'} · {log.entityType}{log.entityId ? ` #${log.entityId}` : ''}
                  </p>
                </div>
                <p className="text-[10px] text-muted-foreground shrink-0">
                  {new Date(log.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
