'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { ContentCard } from '@/components/dashboard/ContentCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';

export function ParentReenrollmentInvites() {
  const [invites, setInvites] = useState<
    { id: string; title: string; studentName: string; grade: string; status: string; dueDate?: string }[]
  >([]);
  const [msg, setMsg] = useState('');

  const load = () =>
    api
      .myReenrollmentInvites()
      .then(setInvites)
      .catch(() => setInvites([]));

  useEffect(() => {
    load();
  }, []);

  if (!invites.length) {
    return (
      <ContentCard title="Re-enrollment" description="Confirm next-year placement when invited">
        <EmptyState title="No open invites" description="Your school will send re-enrollment invites here." />
      </ContentCard>
    );
  }

  return (
    <ContentCard title="Re-enrollment" description="Confirm next-year placement">
      {msg && <p className="mb-3 text-xs text-muted-foreground">{msg}</p>}
      <div className="space-y-3">
        {invites.map((inv) => (
          <div
            key={inv.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/70 bg-card p-4"
          >
            <div>
              <p className="text-sm font-semibold">
                {inv.studentName} · {inv.grade}
              </p>
              <p className="text-xs text-muted-foreground">
                {inv.title}
                {inv.dueDate ? ` · due ${String(inv.dueDate).slice(0, 10)}` : ''}
              </p>
              <Badge className="mt-2" variant={inv.status === 'confirmed' ? 'success' : 'neutral'}>
                {inv.status}
              </Badge>
            </div>
            {inv.status === 'pending' && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="organic"
                  className="border-none"
                  onClick={async () => {
                    await api.respondReenrollmentInvite(inv.id, 'confirmed');
                    setMsg('Re-enrollment confirmed.');
                    await load();
                  }}
                >
                  Confirm
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    await api.respondReenrollmentInvite(inv.id, 'declined');
                    setMsg('Invite declined.');
                    await load();
                  }}
                >
                  Decline
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </ContentCard>
  );
}
