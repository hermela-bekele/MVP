'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { readStoredSession } from '@/lib/auth';
import { ContentCard } from '@/components/dashboard/ContentCard';
import { TablePanel } from '@/components/dashboard/TablePanel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';

type WaitlistRow = {
  id: string;
  application_id: string;
  grade: string;
  priority_score: number | string;
  force_back: boolean;
  applicant_name?: string;
  parent_name?: string;
  reference_code?: string;
  created_at?: string;
};

type CapacityRow = {
  id: string;
  grade: string;
  section: string;
  capacity: number;
  reserved_count: number;
  enrolled_count: number;
};

export function RegistrarWaitlist() {
  const session = readStoredSession();
  const schoolId = session?.schoolId || 'sch-1';
  const [waitlist, setWaitlist] = useState<WaitlistRow[]>([]);
  const [capacity, setCapacity] = useState<CapacityRow[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [editCap, setEditCap] = useState<Record<string, string>>({});

  const refresh = useCallback(async () => {
    try {
      const [w, c] = await Promise.all([
        api.listWaitlist(schoolId) as Promise<WaitlistRow[]>,
        api.listCapacity(schoolId) as Promise<CapacityRow[]>,
      ]);
      setWaitlist(w);
      setCapacity(c);
      const map: Record<string, string> = {};
      for (const row of c) map[row.id] = String(row.capacity);
      setEditCap(map);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load waitlist');
    }
  }, [schoolId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const promote = async (applicationId: string) => {
    setBusy(true);
    setError('');
    try {
      await api.acceptApplication(applicationId);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Accept failed — check capacity and fees');
    } finally {
      setBusy(false);
    }
  };

  const saveCapacity = async (id: string) => {
    const n = Number(editCap[id]);
    if (!Number.isFinite(n) || n < 1) return;
    setBusy(true);
    try {
      await api.updateCapacity(id, { capacity: n });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Capacity update failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <ContentCard title="Waiting" description="Active waitlist">
          <p className="text-3xl font-bold tabular-nums text-primary">{waitlist.length}</p>
        </ContentCard>
        <ContentCard title="Seats reserved" description="Across grades">
          <p className="text-3xl font-bold tabular-nums">
            {capacity.reduce((s, r) => s + Number(r.reserved_count || 0), 0)}
          </p>
        </ContentCard>
        <ContentCard title="Open seats" description="Capacity − enrolled − reserved">
          <p className="text-3xl font-bold tabular-nums text-success">
            {capacity.reduce(
              (s, r) =>
                s +
                Math.max(
                  0,
                  Number(r.capacity) - Number(r.enrolled_count || 0) - Number(r.reserved_count || 0)
                ),
              0
            )}
          </p>
        </ContentCard>
      </div>

      <TablePanel title="Waitlist board">
        {waitlist.length === 0 ? (
          <EmptyState title="Waitlist is empty" description="Scored applicants appear here when waitlisted." />
        ) : (
          <div className="overflow-x-auto">
            <table className="eskooly-table w-full">
              <thead>
                <tr>
                  <th className="p-3 text-left text-xs font-bold text-muted-foreground">#</th>
                  <th className="p-3 text-left text-xs font-bold text-muted-foreground">Applicant</th>
                  <th className="p-3 text-left text-xs font-bold text-muted-foreground">Grade</th>
                  <th className="p-3 text-left text-xs font-bold text-muted-foreground">Score</th>
                  <th className="p-3 text-left text-xs font-bold text-muted-foreground">Flags</th>
                  <th className="p-3 text-left text-xs font-bold text-muted-foreground">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {waitlist.map((row, i) => (
                  <tr key={row.id} className="hover:bg-muted/10">
                    <td className="p-3 text-sm tabular-nums text-muted-foreground">{i + 1}</td>
                    <td className="p-3">
                      <p className="text-sm font-semibold">{row.applicant_name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {row.reference_code} · {row.parent_name}
                      </p>
                    </td>
                    <td className="p-3 text-sm">{row.grade}</td>
                    <td className="p-3 font-mono text-sm font-bold tabular-nums">
                      {Number(row.priority_score).toFixed(1)}
                    </td>
                    <td className="p-3">
                      {row.force_back ? <Badge variant="warning">Back of line</Badge> : <Badge variant="info">Priority</Badge>}
                    </td>
                    <td className="p-3">
                      <Button size="sm" disabled={busy} onClick={() => promote(row.application_id)}>
                        Offer seat
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={busy}
                        onClick={() => {
                          setBusy(true);
                          api
                            .forcePromoteWaitlist(row.id)
                            .then(() => refresh())
                            .catch((err) =>
                              setError(err instanceof Error ? err.message : 'Force promote failed')
                            )
                            .finally(() => setBusy(false));
                        }}
                      >
                        Force promote
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </TablePanel>

      <TablePanel title="Grade & section capacity">
        <div className="overflow-x-auto">
          <table className="eskooly-table w-full">
            <thead>
              <tr>
                <th className="p-3 text-left text-xs font-bold text-muted-foreground">Grade</th>
                <th className="p-3 text-left text-xs font-bold text-muted-foreground">Section</th>
                <th className="p-3 text-left text-xs font-bold text-muted-foreground">Capacity</th>
                <th className="p-3 text-left text-xs font-bold text-muted-foreground">Reserved</th>
                <th className="p-3 text-left text-xs font-bold text-muted-foreground">Enrolled</th>
                <th className="p-3 text-left text-xs font-bold text-muted-foreground">Open</th>
                <th className="p-3 text-left text-xs font-bold text-muted-foreground">Update</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {capacity.map((row) => {
                const open =
                  Number(row.capacity) - Number(row.enrolled_count || 0) - Number(row.reserved_count || 0);
                return (
                  <tr key={row.id} className="hover:bg-muted/10">
                    <td className="p-3 text-sm font-semibold">{row.grade}</td>
                    <td className="p-3 text-sm">{row.section}</td>
                    <td className="p-3 w-28">
                      <Input
                        value={editCap[row.id] ?? String(row.capacity)}
                        onChange={(e) => setEditCap((prev) => ({ ...prev, [row.id]: e.target.value }))}
                      />
                    </td>
                    <td className="p-3 tabular-nums">{row.reserved_count}</td>
                    <td className="p-3 tabular-nums">{row.enrolled_count}</td>
                    <td className="p-3 font-bold tabular-nums text-success">{Math.max(0, open)}</td>
                    <td className="p-3">
                      <Button size="sm" variant="secondary" disabled={busy} onClick={() => saveCapacity(row.id)}>
                        Save
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!capacity.length && (
            <EmptyState title="No capacity rows" description="Seed or configure grade sections for this school." />
          )}
        </div>
      </TablePanel>
    </div>
  );
}
