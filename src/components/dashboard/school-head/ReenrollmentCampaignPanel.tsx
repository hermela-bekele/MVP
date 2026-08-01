'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { readStoredSession } from '@/lib/auth';
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import { ContentCard } from '@/components/dashboard/ContentCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';

export function ReenrollmentCampaignPanel() {
  const session = readStoredSession();
  const [title, setTitle] = useState('Next-year re-enrollment');
  const [grade, setGrade] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [campaigns, setCampaigns] = useState<
    { id: string; title: string; inviteCount: number; confirmedCount: number; status: string }[]
  >([]);
  const [status, setStatus] = useState('');

  const load = () =>
    api
      .listReenrollmentCampaigns(session?.schoolId || 'sch-1')
      .then(setCampaigns)
      .catch(() => setCampaigns([]));

  useEffect(() => {
    load();
  }, [session?.schoolId]);

  return (
    <PermissionGuard code="enrollment.transfer">
      <ContentCard
        title="Re-enrollment campaign"
        description="Invite active students/parents to confirm for next year"
        actions={
          <Button
            size="sm"
            variant="organic"
            className="border-none"
            onClick={async () => {
              try {
                const r = await api.createReenrollmentCampaign({
                  schoolId: session?.schoolId || 'sch-1',
                  title,
                  targetGrade: grade || undefined,
                  dueDate: dueDate || undefined,
                });
                setStatus(`Campaign created with ${r.inviteCount} invites.`);
                await load();
              } catch (err) {
                setStatus(err instanceof Error ? err.message : 'Failed');
              }
            }}
          >
            Launch campaign
          </Button>
        }
      >
        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Select
            label="Target grade (optional)"
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            options={[
              { value: '', label: 'All grades' },
              ...['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'].map((g) => ({ value: g, label: g })),
            ]}
          />
          <Input label="Due date" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>
        {status && <p className="mb-3 text-xs text-muted-foreground">{status}</p>}
        <div className="space-y-2">
          {campaigns.map((c) => (
            <div key={c.id} className="flex items-center justify-between rounded-xl border border-border/60 px-4 py-3 text-sm">
              <div>
                <p className="font-semibold">{c.title}</p>
                <p className="text-xs text-muted-foreground">
                  {c.confirmedCount}/{c.inviteCount} confirmed · {c.status}
                </p>
              </div>
            </div>
          ))}
        </div>
      </ContentCard>
    </PermissionGuard>
  );
}
