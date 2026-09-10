'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { api, ApiError, type LeadershipAction } from '@/lib/api';
import { readStoredSession } from '@/lib/auth';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogFooter } from '@/components/ui/dialog';
import { FormField, formFieldInputClass } from '@/components/ui/form-field';
import { MetricProgressRow } from '@/components/ui/metric-progress-row';
import { EmptyState } from '@/components/ui/empty-state';
import { Target } from 'lucide-react';

/**
 * "Are improvement priorities on track?" — real, owned initiatives with a
 * deadline and a progress figure the school head updates over time, backed by
 * the same leadership_actions table (category='improvement_initiative').
 */
export function SchoolImprovementTracker() {
  const session = readStoredSession();
  const schoolId = session?.schoolId || 'sch-1';

  const [initiatives, setInitiatives] = useState<LeadershipAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [isNewOpen, setIsNewOpen] = useState(false);
  const [issue, setIssue] = useState('');
  const [owner, setOwner] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [decisionRequired, setDecisionRequired] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [editing, setEditing] = useState<LeadershipAction | null>(null);
  const [editProgress, setEditProgress] = useState(0);
  const [editStatus, setEditStatus] = useState<LeadershipAction['status']>('open');

  const load = useCallback(() => {
    setLoading(true);
    api.listLeadershipActions({ schoolId, category: 'improvement_initiative' })
      .then(setInitiatives)
      .catch(() => setError('Could not load improvement initiatives.'))
      .finally(() => setLoading(false));
  }, [schoolId]);

  useEffect(() => { load(); }, [load]);

  const resetForm = () => { setIssue(''); setOwner(''); setDueDate(''); setDecisionRequired(''); setFormError(''); };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issue.trim()) return;
    setSaving(true);
    setFormError('');
    try {
      await api.createLeadershipAction({
        schoolId,
        category: 'improvement_initiative',
        issue: issue.trim(),
        owner: owner.trim() || undefined,
        dueDate: dueDate || undefined,
        decisionRequired: decisionRequired.trim() || undefined,
        progressPercent: 0,
      });
      setIsNewOpen(false);
      resetForm();
      load();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Could not create this initiative.');
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (initiative: LeadershipAction) => {
    setEditing(initiative);
    setEditProgress(initiative.progressPercent ?? 0);
    setEditStatus(initiative.status);
  };

  const saveEdit = async () => {
    if (!editing) return;
    try {
      const updated = await api.updateLeadershipAction(editing.id, {
        progressPercent: editProgress,
        status: editProgress >= 100 ? 'resolved' : editStatus,
      });
      setInitiatives((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
      setEditing(null);
    } catch {
      setError('Could not update this initiative.');
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3 border-b border-border/30">
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base font-bold">School Improvement & Quality</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Are improvement priorities on track?</p>
          </div>
          <Button size="sm" variant="organic" className="border-none text-xs shrink-0" onClick={() => setIsNewOpen(true)}>
            + New Initiative
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {error && <p className="text-xs text-red-500 mb-2">{error}</p>}
        {loading ? (
          <p className="text-xs text-muted-foreground py-6 text-center">Loading…</p>
        ) : initiatives.length === 0 ? (
          <EmptyState icon={<Target />} title="No improvement initiatives yet" description="Track your school's quality and improvement priorities here." />
        ) : (
          <div className="space-y-4">
            {initiatives.map((i) => {
              const overdue = i.dueDate && i.dueDate < today && i.status !== 'resolved';
              return (
                <div key={i.id} className="rounded-xl border border-border/60 p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-bold text-foreground">{i.issue}</p>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Badge variant={i.status === 'resolved' ? 'success' : overdue ? 'danger' : 'neutral'} badgeStyle="subtle" size="sm">
                        {i.status === 'resolved' ? 'Completed' : overdue ? 'Overdue' : i.status === 'in_progress' ? 'In Progress' : 'Open'}
                      </Badge>
                    </div>
                  </div>
                  <MetricProgressRow label="Progress" value={i.progressPercent ?? 0} barClassName="bg-primary" />
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>
                      {i.owner && <>Owner: <strong className="text-foreground">{i.owner}</strong></>}
                      {i.dueDate && <> · Due: <strong className="text-foreground">{i.dueDate}</strong></>}
                    </span>
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => openEdit(i)}>Update</Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      <Dialog isOpen={isNewOpen} onClose={() => { setIsNewOpen(false); resetForm(); }} title="New Improvement Initiative">
        <form onSubmit={handleCreate} className="space-y-3 text-left">
          {formError && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-md text-xxs font-bold">⚠ {formError}</div>}
          <FormField label="Initiative">
            <input className={formFieldInputClass} value={issue} onChange={(e) => setIssue(e.target.value)} required placeholder="e.g. Reduce Grade 10 absenteeism below 10%" />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Owner">
              <input className={formFieldInputClass} value={owner} onChange={(e) => setOwner(e.target.value)} />
            </FormField>
            <FormField label="Deadline">
              <input type="date" className={formFieldInputClass} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </FormField>
          </div>
          <FormField label="Quality / Compliance Indicator (optional)">
            <input className={formFieldInputClass} value={decisionRequired} onChange={(e) => setDecisionRequired(e.target.value)} placeholder="What indicator defines success?" />
          </FormField>
          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => { setIsNewOpen(false); resetForm(); }}>Cancel</Button>
            <Button type="submit" variant="organic" size="sm" className="border-none" disabled={saving}>{saving ? 'Saving…' : 'Create Initiative'}</Button>
          </DialogFooter>
        </form>
      </Dialog>

      {editing && (
        <Dialog isOpen onClose={() => setEditing(null)} title={editing.issue}>
          <div className="space-y-4 text-left">
            <FormField label={`Progress: ${editProgress}%`}>
              <input type="range" min={0} max={100} step={5} value={editProgress} onChange={(e) => setEditProgress(Number(e.target.value))} className="w-full" />
            </FormField>
            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setEditing(null)}>Cancel</Button>
              <Button type="button" variant="organic" size="sm" className="border-none" onClick={saveEdit}>Save</Button>
            </DialogFooter>
          </div>
        </Dialog>
      )}
    </Card>
  );
}
