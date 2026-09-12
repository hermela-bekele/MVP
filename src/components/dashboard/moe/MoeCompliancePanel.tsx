'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  api,
  ApiError,
  MOE_DOCUMENT_AUDIENCES,
  type ComplianceRequirement,
  type SchoolComplianceStatus,
} from '@/lib/api';
import { useApp } from '@/context/AppContext';
import { TablePanel } from '@/components/dashboard/TablePanel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Dialog, DialogFooter } from '@/components/ui/dialog';
import { FormField, formFieldInputClass } from '@/components/ui/form-field';
import { useConfirmDialog } from '@/components/ui/confirm-dialog';

const STATUS_VARIANT: Record<string, 'neutral' | 'warning' | 'info' | 'success' | 'danger'> = {
  'Not Started': 'neutral',
  'In Progress': 'warning',
  Submitted: 'info',
  Verified: 'success',
  Rejected: 'danger',
};

/**
 * MOE issues a compliance requirement once; every school gets its own tracked
 * status against it (see compliance_requirements / school_compliance_status).
 * This panel is where MOE creates requirements and verifies what schools
 * submit — the school-head side (MoeUpdatesPanel) is where a school tracks
 * its own status and submits evidence.
 */
export function MoeCompliancePanel() {
  const { schools } = useApp();
  const { confirm, ConfirmDialog } = useConfirmDialog();

  const [requirements, setRequirements] = useState<ComplianceRequirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    api
      .listComplianceRequirements()
      .then(setRequirements)
      .catch(() => setLoadError('Could not load compliance requirements.'))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [authority, setAuthority] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [evidenceRequired, setEvidenceRequired] = useState('');
  const [audience, setAudience] = useState<string>('Schools');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const resetForm = () => {
    setTitle(''); setAuthority(''); setDescription(''); setDueDate('');
    setEvidenceRequired(''); setAudience('Schools'); setFormError('');
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !authority.trim()) return;
    setSaving(true);
    setFormError('');
    try {
      await api.createComplianceRequirement({
        title: title.trim(),
        authority: authority.trim(),
        description: description.trim() || undefined,
        dueDate: dueDate || undefined,
        evidenceRequired: evidenceRequired.trim() || undefined,
        audience,
      });
      setIsCreateOpen(false);
      resetForm();
      load();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Could not create this requirement.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (req: ComplianceRequirement) => {
    const ok = await confirm(`Delete "${req.title}"?`, {
      description: 'This removes the requirement and every school\'s tracked status against it. This cannot be undone.',
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!ok) return;
    try {
      await api.deleteComplianceRequirement(req.id);
      setRequirements((prev) => prev.filter((r) => r.id !== req.id));
      if (expandedId === req.id) setExpandedId(null);
    } catch {
      setLoadError('Could not delete this requirement.');
    }
  };

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [statusRows, setStatusRows] = useState<SchoolComplianceStatus[]>([]);
  const [statusLoading, setStatusLoading] = useState(false);

  const toggleExpand = (req: ComplianceRequirement) => {
    if (expandedId === req.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(req.id);
    setStatusLoading(true);
    Promise.all(schools.map((s) => api.listComplianceStatus(s.id)))
      .then((perSchool) => {
        const merged = perSchool
          .flat()
          .filter((row) => row.requirementId === req.id);
        setStatusRows(merged);
      })
      .catch(() => setStatusRows([]))
      .finally(() => setStatusLoading(false));
  };

  const [verifying, setVerifying] = useState<SchoolComplianceStatus | null>(null);
  const [verificationNote, setVerificationNote] = useState('');
  const [verifySaving, setVerifySaving] = useState(false);

  const handleVerify = async (decision: 'Verified' | 'Rejected') => {
    if (!verifying?.id) return;
    setVerifySaving(true);
    try {
      await api.verifyComplianceStatus(verifying.id, { status: decision, verificationNote: verificationNote.trim() || undefined });
      setStatusRows((prev) => prev.map((r) => (r.id === verifying.id ? { ...r, status: decision, verificationNote } : r)));
      setVerifying(null);
      setVerificationNote('');
    } catch {
      setLoadError('Could not save the verification decision.');
    } finally {
      setVerifySaving(false);
    }
  };

  const schoolName = (schoolId: string) => schools.find((s) => s.id === schoolId)?.name ?? schoolId;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-end">
        <Button onClick={() => setIsCreateOpen(true)} size="sm" className="h-10 font-semibold">
          + New Requirement
        </Button>
      </div>

      <TablePanel title="Compliance Requirements">
        {loadError && <p className="text-xs text-red-500 px-3 py-2">{loadError}</p>}
        <table className="eskooly-table">
          <thead>
            <tr>
              <th>Requirement</th>
              <th>Authority</th>
              <th>Due</th>
              <th>Audience</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="text-center text-muted-foreground py-12">Loading…</td></tr>
            ) : requirements.length === 0 ? (
              <tr><td colSpan={5} className="text-center text-muted-foreground py-12">No compliance requirements issued yet.</td></tr>
            ) : (
              requirements.map((req) => (
                <React.Fragment key={req.id}>
                  <tr>
                    <td className="font-medium">{req.title}</td>
                    <td className="text-muted-foreground">{req.authority}</td>
                    <td className="text-muted-foreground">{req.dueDate ?? '—'}</td>
                    <td><Badge variant="neutral" badgeStyle="subtle" size="sm">{req.audience}</Badge></td>
                    <td className="space-x-2">
                      <Button type="button" size="sm" variant="outline" className="h-8 text-xs" onClick={() => toggleExpand(req)}>
                        {expandedId === req.id ? 'Hide' : 'View'} School Status
                      </Button>
                      <Button type="button" size="sm" variant="outline" className="h-8 text-xs text-destructive" onClick={() => void handleDelete(req)}>
                        Delete
                      </Button>
                    </td>
                  </tr>
                  {expandedId === req.id && (
                    <tr>
                      <td colSpan={5} className="bg-muted/20 p-4">
                        {statusLoading ? (
                          <p className="text-xs text-muted-foreground py-4 text-center">Loading school statuses…</p>
                        ) : statusRows.filter((r) => r.status !== 'Not Started').length === 0 ? (
                          <p className="text-xs text-muted-foreground py-4 text-center">No school has started tracking this requirement yet.</p>
                        ) : (
                          <div className="space-y-2">
                            {statusRows
                              .filter((r) => r.status !== 'Not Started')
                              .map((row) => (
                                <div key={row.schoolId} className="flex items-center justify-between gap-3 rounded-lg border border-border/50 bg-card p-3">
                                  <div className="min-w-0">
                                    <p className="text-xs font-bold text-foreground">{schoolName(row.schoolId)}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Badge variant={STATUS_VARIANT[row.status] ?? 'neutral'} size="sm" className="font-bold">{row.status}</Badge>
                                      {row.responsiblePerson && <span className="text-[10px] text-muted-foreground">Owner: {row.responsiblePerson}</span>}
                                    </div>
                                    {row.outstandingIssue && <p className="text-[10px] text-muted-foreground mt-1">Issue: {row.outstandingIssue}</p>}
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    {row.evidenceSubmittedUrl && (
                                      <a href={row.evidenceSubmittedUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline font-bold text-xxs">
                                        View evidence →
                                      </a>
                                    )}
                                    {row.status === 'Submitted' && (
                                      <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => { setVerifying(row); setVerificationNote(''); }}>
                                        Verify
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </TablePanel>

      <Dialog
        isOpen={isCreateOpen}
        onClose={() => { setIsCreateOpen(false); resetForm(); }}
        title="New Compliance Requirement"
        description="Issue a requirement every applicable school will track its own status against."
      >
        <form onSubmit={handleCreate} className="space-y-4 text-left">
          {formError && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-md text-xxs font-bold">⚠ {formError}</div>}
          <FormField label="Requirement Title">
            <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Annual Fire Safety Inspection" className={formFieldInputClass} />
          </FormField>
          <FormField label="Issuing Authority">
            <input required value={authority} onChange={(e) => setAuthority(e.target.value)} placeholder="e.g. Federal MOE, Regional Bureau" className={formFieldInputClass} />
          </FormField>
          <FormField label="Description (optional)">
            <textarea className={`${formFieldInputClass} h-16 py-2`} value={description} onChange={(e) => setDescription(e.target.value)} />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Due Date">
              <input type="date" className={formFieldInputClass} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </FormField>
            <FormField label="Audience">
              <Select options={MOE_DOCUMENT_AUDIENCES.map((a) => ({ value: a, label: a }))} value={audience} onChange={(e) => setAudience(e.target.value)} />
            </FormField>
          </div>
          <FormField label="Evidence Required">
            <input value={evidenceRequired} onChange={(e) => setEvidenceRequired(e.target.value)} placeholder="What must schools submit to prove compliance?" className={formFieldInputClass} />
          </FormField>
          <DialogFooter className="mt-2">
            <Button type="button" variant="outline" onClick={() => { setIsCreateOpen(false); resetForm(); }} className="text-xs h-10">
              Cancel
            </Button>
            <Button type="submit" variant="organic" className="text-xs h-10 border-none" disabled={saving}>
              {saving ? 'Creating…' : 'Create Requirement'}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      <Dialog
        isOpen={!!verifying}
        onClose={() => setVerifying(null)}
        title="Verify Submission"
        description={verifying ? `${schoolName(verifying.schoolId)} — ${verifying.requirementTitle ?? ''}` : undefined}
      >
        <div className="space-y-3 text-left">
          <FormField label="Verification Note (optional)">
            <textarea className={`${formFieldInputClass} h-16 py-2`} value={verificationNote} onChange={(e) => setVerificationNote(e.target.value)} placeholder="Reason for your decision" />
          </FormField>
          <DialogFooter>
            <Button type="button" variant="outline" size="sm" disabled={verifySaving} onClick={() => handleVerify('Rejected')}>
              Reject
            </Button>
            <Button type="button" variant="organic" size="sm" className="border-none" disabled={verifySaving} onClick={() => handleVerify('Verified')}>
              {verifySaving ? 'Saving…' : 'Verify'}
            </Button>
          </DialogFooter>
        </div>
      </Dialog>

      {ConfirmDialog}
    </div>
  );
}
