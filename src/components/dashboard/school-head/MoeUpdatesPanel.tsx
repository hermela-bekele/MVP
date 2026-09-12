'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogFooter } from '@/components/ui/dialog';
import { Select } from '@/components/ui/select';
import { TablePanel } from '@/components/dashboard/TablePanel';
import { FormField, formFieldInputClass } from '@/components/ui/form-field';
import { readStoredSession } from '@/lib/auth';
import { api, ApiError, COMPLIANCE_STATUS_VALUES, type SchoolComplianceStatus } from '@/lib/api';
import {
  MOE_ACADEMIC_YEAR_TITLE,
  MOE_MAJOR_ACTIVITIES,
} from '@/lib/moeCalendarData';

const COMPLIANCE_STATUS_VARIANT: Record<string, 'neutral' | 'warning' | 'info' | 'success' | 'danger'> = {
  'Not Started': 'neutral',
  'In Progress': 'warning',
  Submitted: 'info',
  Verified: 'success',
  Rejected: 'danger',
};

const activityTypeVariant: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
  moe: 'info',
  term: 'success',
  exam: 'warning',
  break: 'neutral',
  holiday: 'neutral',
};

function formatEcDate(ec: { year: number; month: number; day: number }) {
  return `${String(ec.day).padStart(2, '0')}/${String(ec.month).padStart(2, '0')}/${ec.year} E.C.`;
}

/** Read-only circular reference, plus a real compliance-requirement tracker the
 * school head updates for their own school (MOE issues the requirement once,
 * every school tracks its own status/evidence against it — see the Regulatory
 * Engine schema note in schema_portal.sql). */
export const MoeUpdatesPanel: React.FC = () => {
  const session = readStoredSession();
  const schoolId = session?.schoolId ?? undefined;

  const [rows, setRows] = useState<SchoolComplianceStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    api
      .listComplianceStatus(schoolId)
      .then(setRows)
      .catch(() => setError('Could not load compliance requirements.'))
      .finally(() => setLoading(false));
  }, [schoolId]);
  useEffect(() => { load(); }, [load]);

  const [editing, setEditing] = useState<SchoolComplianceStatus | null>(null);
  const [status, setStatus] = useState<string>('In Progress');
  const [responsiblePerson, setResponsiblePerson] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [outstandingIssue, setOutstandingIssue] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const openEdit = (row: SchoolComplianceStatus) => {
    setEditing(row);
    setStatus(row.status === 'Not Started' ? 'In Progress' : row.status);
    setResponsiblePerson(row.responsiblePerson ?? '');
    setEvidenceUrl(row.evidenceSubmittedUrl ?? '');
    setOutstandingIssue(row.outstandingIssue ?? '');
    setFormError('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    setFormError('');
    try {
      await api.updateComplianceStatus({
        requirementId: editing.requirementId,
        schoolId,
        status,
        responsiblePerson: responsiblePerson.trim() || undefined,
        evidenceSubmittedUrl: evidenceUrl.trim() || undefined,
        outstandingIssue: outstandingIssue.trim() || undefined,
      });
      setEditing(null);
      load();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Could not save this update.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-left">
      <Card className="border-border/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold text-foreground">{MOE_ACADEMIC_YEAR_TITLE}</CardTitle>
        </CardHeader>
        <CardContent className="text-xxs text-muted-foreground">
          <p>
            Official reference circular governing this academic year&apos;s term structure, exam windows,
            and registration deadlines as issued by the Ministry of Education.
          </p>
        </CardContent>
      </Card>

      <TablePanel
        title="Compliance Milestones"
      >
        <table className="eskooly-table">
          <thead>
            <tr>
              <th className="p-3 text-left text-muted-foreground font-semibold">Milestone</th>
              <th className="p-3 text-left text-muted-foreground font-semibold">Start (E.C.)</th>
              <th className="p-3 text-left text-muted-foreground font-semibold">End (E.C.)</th>
              <th className="p-3 text-left text-muted-foreground font-semibold">Category</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40 text-muted-foreground">
            {MOE_MAJOR_ACTIVITIES.map((activity) => (
              <tr key={activity.id} className="hover:bg-muted/10">
                <td className="p-3 text-foreground font-bold">{activity.label}</td>
                <td className="p-3 font-mono">{formatEcDate(activity.startEc)}</td>
                <td className="p-3 font-mono">{formatEcDate(activity.endEc)}</td>
                <td className="p-3">
                  <Badge variant={activityTypeVariant[activity.type] ?? 'neutral'} size="sm" className="font-bold capitalize">
                    {activity.type}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TablePanel>

      <TablePanel
        title="Compliance Requirements"
        description="Regulatory requirements issued by MOE and this school's status against each."
      >
        {error && <p className="text-xs text-red-500 p-3">{error}</p>}
        {loading ? (
          <p className="text-xs text-muted-foreground py-8 text-center">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="text-xs text-muted-foreground py-8 text-center">No compliance requirements have been issued yet.</p>
        ) : (
          <table className="eskooly-table">
            <thead>
              <tr>
                <th className="p-3 text-left text-muted-foreground font-semibold">Requirement</th>
                <th className="p-3 text-left text-muted-foreground font-semibold">Authority</th>
                <th className="p-3 text-left text-muted-foreground font-semibold">Due</th>
                <th className="p-3 text-left text-muted-foreground font-semibold">Status</th>
                <th className="p-3 text-left text-muted-foreground font-semibold">Responsible</th>
                <th className="p-3 text-left text-muted-foreground font-semibold">Evidence</th>
                <th className="p-3 text-left text-muted-foreground font-semibold">Outstanding Issue</th>
                <th className="p-3 text-left text-muted-foreground font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 text-muted-foreground">
              {rows.map((row) => (
                <tr key={row.requirementId} className="hover:bg-muted/10 align-top">
                  <td className="p-3 text-foreground font-bold">
                    {row.requirementTitle}
                    {row.requirementEvidenceRequired && (
                      <p className="text-[10px] font-normal text-muted-foreground mt-0.5">Needs: {row.requirementEvidenceRequired}</p>
                    )}
                  </td>
                  <td className="p-3">{row.requirementAuthority}</td>
                  <td className="p-3 font-mono">{row.requirementDueDate ?? '—'}</td>
                  <td className="p-3">
                    <Badge variant={COMPLIANCE_STATUS_VARIANT[row.status] ?? 'neutral'} size="sm" className="font-bold">
                      {row.status}
                    </Badge>
                    {row.verificationNote && (
                      <p className="text-[10px] text-muted-foreground mt-1">&quot;{row.verificationNote}&quot;</p>
                    )}
                  </td>
                  <td className="p-3">{row.responsiblePerson ?? '—'}</td>
                  <td className="p-3">
                    {row.evidenceSubmittedUrl ? (
                      <a href={row.evidenceSubmittedUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline font-bold text-xxs">
                        View evidence →
                      </a>
                    ) : '—'}
                  </td>
                  <td className="p-3 max-w-[220px]">{row.outstandingIssue ?? '—'}</td>
                  <td className="p-3">
                    <Button variant="outline" size="sm" onClick={() => openEdit(row)} className="text-[10px] h-7 font-bold border-none">
                      Update
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </TablePanel>

      <Dialog isOpen={!!editing} onClose={() => setEditing(null)} title="Update Compliance Status" description={editing?.requirementTitle}>
        <form onSubmit={handleSave} className="space-y-3 text-left">
          {formError && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-md text-xxs font-bold">⚠ {formError}</div>}
          <FormField label="Status">
            <Select
              options={COMPLIANCE_STATUS_VALUES.filter((s) => s !== 'Verified' && s !== 'Rejected').map((s) => ({ value: s, label: s }))}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            />
          </FormField>
          <FormField label="Responsible Person">
            <input className={formFieldInputClass} value={responsiblePerson} onChange={(e) => setResponsiblePerson(e.target.value)} placeholder="Who owns this at the school?" />
          </FormField>
          <FormField label="Evidence Submitted (URL)">
            <input className={formFieldInputClass} value={evidenceUrl} onChange={(e) => setEvidenceUrl(e.target.value)} placeholder="Link to the submitted evidence" />
          </FormField>
          <FormField label="Outstanding Issue (optional)">
            <textarea className={`${formFieldInputClass} h-16 py-2`} value={outstandingIssue} onChange={(e) => setOutstandingIssue(e.target.value)} placeholder="What's blocking full compliance?" />
          </FormField>
          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => setEditing(null)}>Cancel</Button>
            <Button type="submit" variant="organic" size="sm" className="border-none" disabled={saving}>{saving ? 'Saving…' : 'Save Update'}</Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
};
