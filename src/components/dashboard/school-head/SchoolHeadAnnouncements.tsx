'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { readStoredSession } from '@/lib/auth';
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import { ContentCard } from '@/components/dashboard/ContentCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';

type Announcement = {
  id: string;
  title: string;
  body: string;
  audience?: string;
  publishedAt?: string | null;
  published_at?: string | null;
};

export function SchoolHeadAnnouncements() {
  const session = readStoredSession();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [items, setItems] = useState<Announcement[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [status, setStatus] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const rows = (await api.portalAnnouncements(session?.schoolId || undefined)) as Announcement[];
    setItems(rows);
  };

  useEffect(() => {
    load().catch(() => setItems([]));
  }, [session?.schoolId]);

  const publish = async () => {
    setSaving(true);
    setStatus(null);
    try {
      if (editingId) {
        await api.updateAnnouncement(editingId, { title, body });
        setStatus({ type: 'ok', text: 'Announcement updated.' });
      } else {
        await api.createAnnouncement({
          schoolId: session?.schoolId || 'sch-1',
          title,
          body,
          audience: 'all',
        });
        setStatus({ type: 'ok', text: 'Announcement published to parents and students.' });
      }
      setTitle('');
      setBody('');
      setEditingId(null);
      await load();
    } catch (err) {
      setStatus({ type: 'err', text: err instanceof Error ? err.message : 'Failed' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <PermissionGuard code="announcements.manage">
      <div className="space-y-4">
        <ContentCard
          title={editingId ? 'Edit announcement' : 'Publish announcement'}
          description="Visible in parent and student portals"
        >
          <div className="space-y-4">
            <Input
              label="Title"
              placeholder="e.g. Sports day this Friday"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Message</label>
              <textarea
                className="min-h-[110px] w-full rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="Write a clear notice for families…"
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                onClick={publish}
                disabled={!title || !body || saving}
                variant="organic"
                className="border-none"
              >
                {saving ? 'Saving…' : editingId ? 'Save changes' : 'Publish announcement'}
              </Button>
              {editingId && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingId(null);
                    setTitle('');
                    setBody('');
                  }}
                >
                  Cancel edit
                </Button>
              )}
              {status && (
                <p className={`text-xs ${status.type === 'ok' ? 'text-success' : 'text-destructive'}`}>
                  {status.text}
                </p>
              )}
            </div>
          </div>
        </ContentCard>

        <ContentCard title="Published announcements" description="Edit or remove active notices">
          {items.length ? (
            <div className="space-y-3">
              {items.map((a) => (
                <div
                  key={a.id}
                  className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-border/70 bg-card p-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold">{a.title}</p>
                      <Badge variant="neutral">{a.audience || 'all'}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{a.body}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingId(a.id);
                        setTitle(a.title);
                        setBody(a.body);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        await api.deleteAnnouncement(a.id);
                        await load();
                        setStatus({ type: 'ok', text: 'Announcement removed.' });
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No announcements" description="Publish your first notice above." />
          )}
        </ContentCard>
      </div>
    </PermissionGuard>
  );
}
