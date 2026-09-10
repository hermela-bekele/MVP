'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { api, ApiError, LEADERSHIP_ACTION_SEVERITIES, type LeadershipAction } from '@/lib/api';
import { readStoredSession } from '@/lib/auth';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Dialog, DialogFooter } from '@/components/ui/dialog';
import { FormField, formFieldInputClass } from '@/components/ui/form-field';
import { EmptyState } from '@/components/ui/empty-state';
import { CheckCircle2 } from 'lucide-react';

function severityVariant(severity: string): 'danger' | 'warning' | 'info' | 'neutral' {
  if (severity === 'Critical') return 'danger';
  if (severity === 'High') return 'warning';
  if (severity === 'Medium') return 'info';
  return 'neutral';
}

/**
 * "What institutional issues require action?" — the central leadership exception
 * queue. Deliberately not a feed of informational notices (e.g. "syllabus
 * updated"): every item here is a structured, ownable, decidable action backed
 * by the real leadership_actions table, not a fabricated record.
 */
export function LeadershipAttentionQueue() {
  const session = readStoredSession();
  const schoolId = session?.schoolId || 'sch-1';

  const [actions, setActions] = useState<LeadershipAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [isNewOpen, setIsNewOpen] = useState(false);
  const [issue, setIssue] = useState('');
  const [evidence, setEvidence] = useState('');
  const [source, setSource] = useState('');
  const [severity, setSeverity] = useState<string>('Medium');
  const [owner, setOwner] = useState('');
  const [decisionRequired, setDecisionRequired] = useState('');
  const [recommendedAction, setRecommendedAction] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    api.listLeadershipActions({ schoolId, category: 'exception' })
      .then((rows) => setActions(rows.filter((a) => a.status !== 'resolved')))
      .catch(() => setError('Could not load leadership actions.'))
      .finally(() => setLoading(false));
  }, [schoolId]);

  useEffect(() => { load(); }, [load]);

  const resetForm = () => {
    setIssue(''); setEvidence(''); setSource(''); setSeverity('Medium'); setOwner('');
    setDecisionRequired(''); setRecommendedAction(''); setDueDate(''); setFormError('');
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issue.trim()) return;
    setSaving(true);
    setFormError('');
    try {
      await api.createLeadershipAction({
        schoolId,
        category: 'exception',
        issue: issue.trim(),
        evidence: evidence.trim() || undefined,
        source: source.trim() || undefined,
        severity: severity as LeadershipAction['severity'],
        owner: owner.trim() || undefined,
        decisionRequired: decisionRequired.trim() || undefined,
        recommendedAction: recommendedAction.trim() || undefined,
        dueDate: dueDate || undefined,
      });
      setIsNewOpen(false);
      resetForm();
      load();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Could not create this action.');
    } finally {
      setSaving(false);
    }
  };

  const resolve = async (id: string) => {
    try {
      await api.updateLeadershipAction(id, { status: 'resolved' });
      setActions((prev) => prev.filter((a) => a.id !== id));
    } catch {
      setError('Could not resolve this action.');
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3 border-b border-border/30">
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base font-bold">Leadership Attention & Actions</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">What institutional issues require action?</p>
          </div>
          <Button size="sm" variant="organic" className="border-none text-xs shrink-0" onClick={() => setIsNewOpen(true)}>
            + New Action
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {error && <p className="text-xs text-red-500 mb-2">{error}</p>}
        {loading ? (
          <p className="text-xs text-muted-foreground py-6 text-center">Loading…</p>
        ) : actions.length === 0 ? (
          <EmptyState icon={<CheckCircle2 />} title="No open leadership actions" description="Nothing currently needs your decision." />
        ) : (
          <div className="space-y-3">
            {actions.map((a) => {
              const overdue = a.dueDate && a.dueDate < today;
              return (
                <div key={a.id} className="rounded-xl border border-border/60 p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-bold text-foreground">{a.issue}</p>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Badge variant={severityVariant(a.severity)} badgeStyle="subtle" size="sm">{a.severity}</Badge>
                      {overdue && <Badge variant="danger" badgeStyle="subtle" size="sm">Overdue</Badge>}
                    </div>
                  </div>
                  {a.evidence && <p className="text-xs text-muted-foreground">Evidence: {a.evidence}</p>}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                    {a.source && <span>Source: <strong className="text-foreground">{a.source}</strong></span>}
                    {a.owner && <span>Owner: <strong className="text-foreground">{a.owner}</strong></span>}
                    {a.dueDate && <span>Decision due: <strong className="text-foreground">{a.dueDate}</strong></span>}
                  </div>
                  {a.decisionRequired && (
                    <p className="text-xs text-foreground"><span className="font-semibold">Decision required:</span> {a.decisionRequired}</p>
                  )}
                  {a.recommendedAction && (
                    <p className="text-xs text-foreground"><span className="font-semibold">Recommended action:</span> {a.recommendedAction}</p>
                  )}
                  <div className="flex justify-end pt-1">
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => resolve(a.id)}>
                      Mark Resolved
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      <Dialog isOpen={isNewOpen} onClose={() => { setIsNewOpen(false); resetForm(); }} title="New Leadership Action" description="Record a structured, decidable issue — not an informational notice.">
        <form onSubmit={handleCreate} className="space-y-3 text-left">
          {formError && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-md text-xxs font-bold">⚠ {formError}</div>}
          <FormField label="Issue">
            <input className={formFieldInputClass} value={issue} onChange={(e) => setIssue(e.target.value)} required placeholder="e.g. Mathematics curriculum is behind by 3 weeks" />
          </FormField>
          <FormField label="Evidence">
            <textarea className={`${formFieldInputClass} h-16 py-2`} value={evidence} onChange={(e) => setEvidence(e.target.value)} placeholder="What data or observation supports this?" />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Source">
              <input className={formFieldInputClass} value={source} onChange={(e) => setSource(e.target.value)} placeholder="e.g. Head of Academics" />
            </FormField>
            <FormField label="Severity">
              <Select options={LEADERSHIP_ACTION_SEVERITIES.map((s) => ({ value: s, label: s }))} value={severity} onChange={(e) => setSeverity(e.target.value)} />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Owner">
              <input className={formFieldInputClass} value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="Who is responsible" />
            </FormField>
            <FormField label="Decision Due Date">
              <input type="date" className={formFieldInputClass} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </FormField>
          </div>
          <FormField label="Decision Required">
            <input className={formFieldInputClass} value={decisionRequired} onChange={(e) => setDecisionRequired(e.target.value)} placeholder="What decision are you being asked to make?" />
          </FormField>
          <FormField label="Recommended Action (optional)">
            <input className={formFieldInputClass} value={recommendedAction} onChange={(e) => setRecommendedAction(e.target.value)} />
          </FormField>
          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => { setIsNewOpen(false); resetForm(); }}>Cancel</Button>
            <Button type="submit" variant="organic" size="sm" className="border-none" disabled={saving}>{saving ? 'Saving…' : 'Create Action'}</Button>
          </DialogFooter>
        </form>
      </Dialog>
    </Card>
  );
}
