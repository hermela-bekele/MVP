'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { readStoredSession } from '@/lib/auth';
import { ContentCard } from '@/components/dashboard/ContentCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { PermissionGuard } from '@/components/auth/PermissionGuard';

type CalEvent = {
  id: string;
  title: string;
  description?: string | null;
  event_date: string;
  end_date?: string | null;
  event_type?: string;
};

const EVENT_TYPES = [
  { value: 'term', label: 'Term' },
  { value: 'exam', label: 'Exam' },
  { value: 'holiday', label: 'Holiday' },
  { value: 'event', label: 'School event' },
  { value: 'general', label: 'General' },
];

function typeVariant(t?: string) {
  if (t === 'exam') return 'danger' as const;
  if (t === 'holiday') return 'success' as const;
  if (t === 'term') return 'info' as const;
  return 'neutral' as const;
}

export function SchoolHeadCalendar() {
  const session = readStoredSession();
  const schoolId = session?.schoolId || 'sch-1';
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [eventType, setEventType] = useState('general');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const rows = (await api.portalCalendar(schoolId)) as CalEvent[];
      setEvents(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load calendar');
    }
  }, [schoolId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !eventDate) return;
    setBusy(true);
    setError('');
    try {
      await api.createCalendarEvent({
        schoolId,
        title: title.trim(),
        description: description || undefined,
        eventDate,
        endDate: endDate || undefined,
        eventType,
      });
      setTitle('');
      setDescription('');
      setEventDate('');
      setEndDate('');
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create event');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-5 lg:grid-cols-5 animate-fade-in">
      <PermissionGuard code="calendar.manage">
        <ContentCard title="Add calendar event" description="Term dates, exams, and school events" className="lg:col-span-2">
          <form onSubmit={create} className="space-y-3">
            <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. Mid-year exams" />
            <Select
              label="Type"
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              options={EVENT_TYPES}
            />
            <Input label="Start date" type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} required />
            <Input label="End date (optional)" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Description</label>
              <textarea
                className="min-h-[80px] w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional details for parents and staff"
              />
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
            <Button type="submit" size="sm" disabled={busy}>
              {busy ? 'Saving…' : 'Publish event'}
            </Button>
          </form>
        </ContentCard>
      </PermissionGuard>

      <ContentCard title="Academic calendar" description="Shared with parent and student portals" className="lg:col-span-3">
        <div className="max-h-[560px] space-y-2.5 overflow-y-auto">
          {events.map((ev) => (
            <div
              key={ev.id}
              className="flex items-start justify-between gap-3 rounded-xl border border-border/60 bg-gradient-to-br from-primary/[0.03] to-transparent p-3.5"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-foreground">{ev.title}</p>
                  <Badge variant={typeVariant(ev.event_type)}>{ev.event_type || 'general'}</Badge>
                </div>
                {ev.description && (
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{ev.description}</p>
                )}
                <p className="mt-1.5 text-[11px] font-medium text-muted-foreground">
                  {String(ev.event_date).slice(0, 10)}
                  {ev.end_date ? ` → ${String(ev.end_date).slice(0, 10)}` : ''}
                </p>
              </div>
            </div>
          ))}
          {!events.length && (
            <EmptyState title="No events yet" description="Add the first term or exam date." />
          )}
        </div>
      </ContentCard>
    </div>
  );
}
