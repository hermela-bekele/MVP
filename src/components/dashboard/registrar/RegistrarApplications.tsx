'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { TablePanel } from '@/components/dashboard/TablePanel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { Dialog, DialogFooter } from '@/components/ui/dialog';
import type { DataTableColumn } from '@/components/ui/data-table';
import { api, type AdmissionApplication, type Invoice } from '@/lib/api';
import { readStoredSession } from '@/lib/auth';

function formatDocType(docType: string): string {
  return docType.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

const inputClass =
  'w-full h-10 px-3 bg-muted/40 border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring';

function statusVariant(status: string): 'success' | 'warning' | 'danger' | 'neutral' | 'primary' | 'info' {
  if (['enrolled', 'accepted_pending_payment'].includes(status)) return 'success';
  if (['submitted', 'under_review', 'info_requested', 'waitlisted'].includes(status)) return 'warning';
  if (['rejected', 'expired_unpaid'].includes(status)) return 'danger';
  return 'neutral';
}

function deadlineBadge(color?: string) {
  if (color === 'green') return 'success' as const;
  if (color === 'yellow') return 'warning' as const;
  if (color === 'red') return 'danger' as const;
  return 'neutral' as const;
}

export const RegistrarApplications: React.FC = () => {
  const session = readStoredSession();
  const schoolId = session?.schoolId || 'sch-1';
  const [apps, setApps] = useState<AdmissionApplication[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selected, setSelected] = useState<AdmissionApplication | null>(null);
  const [notes, setNotes] = useState('');
  const [score, setScore] = useState('70');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [requiredDocs, setRequiredDocs] = useState<string[]>([]);

  const refresh = useCallback(async () => {
    try {
      const [a, inv] = await Promise.all([
        api.listApplications(schoolId),
        api.listInvoices({ schoolId }),
      ]);
      setApps(a);
      setInvoices(inv);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    }
  }, [schoolId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    api
      .getSchoolSettings(schoolId)
      .then((s) => {
        const docs = (s as { required_documents?: string[] } | undefined)?.required_documents;
        setRequiredDocs(Array.isArray(docs) ? docs : []);
      })
      .catch(() => setRequiredDocs([]));
  }, [schoolId]);

  const openReview = async (row: AdmissionApplication) => {
    setSelected(row);
    setNotes(row.reviewerNotes || '');
    setScore(String(row.priorityScore || 70));
    try {
      const detail = await api.getApplication(row.id);
      setSelected(detail);
    } catch {
      /* fall back to the row already shown */
    }
  };

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setError('');
    try {
      await fn();
      await refresh();
      setSelected(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setBusy(false);
    }
  };

  const verifyDoc = async (docId: string) => {
    if (!selected) return;
    setBusy(true);
    setError('');
    try {
      await api.verifyApplicationDocument(selected.id, docId, true);
      const detail = await api.getApplication(selected.id);
      setSelected(detail);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verify failed');
    } finally {
      setBusy(false);
    }
  };

  const columns: DataTableColumn<AdmissionApplication>[] = [
    {
      key: 'applicantName',
      header: 'Applicant',
      sortable: true,
      render: (row) => (
        <div>
          <div className="font-medium text-sm">{row.applicantName}</div>
          <div className="text-[11px] text-muted-foreground">{row.referenceCode}</div>
        </div>
      ),
    },
    { key: 'gradeApplied', header: 'Grade', sortable: true },
    {
      key: 'priorityScore',
      header: 'Score',
      sortable: true,
      render: (row) => <span className="font-semibold">{row.priorityScore}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <Badge variant={statusVariant(row.status)}>{row.status.replace(/_/g, ' ')}</Badge>,
    },
    {
      key: 'parentName',
      header: 'Parent',
      render: (row) => (
        <div className="text-xs">
          <div>{row.parentName}</div>
          <div className="text-muted-foreground">{row.parentEmail}</div>
        </div>
      ),
    },
    {
      key: 'invoice',
      header: 'Invoice deadline',
      render: (row) => {
        const inv = invoices.find((i) => i.id === row.invoiceId);
        if (!inv) return <span className="text-muted-foreground text-xs">—</span>;
        return (
          <Badge variant={deadlineBadge(inv.deadlineColor)}>
            {inv.dueDate} · {inv.balanceDue} {inv.currency}
          </Badge>
        );
      },
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <Button
          size="sm"
          variant="outline"
          className="text-xs h-8"
          onClick={(e) => {
            e.stopPropagation();
            void openReview(row);
          }}
        >
          Review
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </div>
      )}
      <TablePanel
        title="Applications queue"
        description="Score/priority waitlist, accept (reserves seat + admission invoice), reject, or waitlist."
        actions={
          <Button size="sm" variant="outline" onClick={() => refresh()}>
            Refresh
          </Button>
        }
      >
        <DataTable columns={columns} data={apps} />
      </TablePanel>

      <Dialog
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.applicantName || 'Application'}
      >
        {selected && (
          <div className="space-y-3 text-sm">
            <p className="text-xs text-muted-foreground">
              {selected.referenceCode} · {selected.gradeApplied} · {selected.sourceChannel}
            </p>
            <p>
              Parent: {selected.parentName} ({selected.parentPhone})
            </p>

            {(requiredDocs.length > 0 || (selected.documents?.length ?? 0) > 0) && (
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Documents</p>
                {requiredDocs.map((docType) => {
                  const doc = selected.documents?.find((d) => d.docType === docType);
                  return (
                    <div
                      key={docType}
                      className="flex items-center justify-between rounded-md border border-border/50 bg-muted/20 px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-medium">{formatDocType(docType)}</p>
                        {doc ? (
                          <a
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-primary hover:underline truncate block"
                          >
                            {doc.fileName}
                          </a>
                        ) : (
                          <p className="text-[10px] text-destructive">Not uploaded</p>
                        )}
                      </div>
                      {doc ? (
                        doc.verified ? (
                          <Badge variant="success" size="sm">Verified</Badge>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-[10px] h-7 px-2"
                            disabled={busy}
                            onClick={() => verifyDoc(doc.id)}
                          >
                            Verify
                          </Button>
                        )
                      ) : (
                        <Badge variant="warning" size="sm">Missing</Badge>
                      )}
                    </div>
                  );
                })}
                {(selected.documents ?? [])
                  .filter((d) => !requiredDocs.includes(d.docType))
                  .map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between rounded-md border border-border/50 bg-muted/20 px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-medium">{formatDocType(doc.docType)}</p>
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-primary hover:underline truncate block"
                        >
                          {doc.fileName}
                        </a>
                      </div>
                      {doc.verified ? (
                        <Badge variant="success" size="sm">Verified</Badge>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-[10px] h-7 px-2"
                          disabled={busy}
                          onClick={() => verifyDoc(doc.id)}
                        >
                          Verify
                        </Button>
                      )}
                    </div>
                  ))}
              </div>
            )}

            <label className="block text-xs space-y-1">
              Priority score
              <input className={inputClass} value={score} onChange={(e) => setScore(e.target.value)} />
            </label>
            <label className="block text-xs space-y-1">
              Notes / reason
              <textarea className={`${inputClass} h-20 py-2`} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </label>
            <DialogFooter className="flex-wrap gap-2">
              <Button size="sm" variant="outline" disabled={busy} onClick={() => run(() => api.scoreApplication(selected.id, Number(score), notes))}>
                Save score
              </Button>
              <Button size="sm" variant="outline" disabled={busy} onClick={() => run(() => api.requestInfoApplication(selected.id, notes || 'Please provide more information'))}>
                Request info
              </Button>
              <Button size="sm" variant="outline" disabled={busy} onClick={() => run(() => api.waitlistApplication(selected.id, notes))}>
                Waitlist
              </Button>
              <Button size="sm" variant="outline" disabled={busy} onClick={() => run(() => api.rejectApplication(selected.id, notes || 'Not selected'))}>
                Reject
              </Button>
              <Button size="sm" variant="outline" disabled={busy} onClick={() => run(() => api.withdrawApplication(selected.id, notes || 'Withdrawn'))}>
                Withdraw
              </Button>
              <Button size="sm" disabled={busy} onClick={() => run(() => api.acceptApplication(selected.id, { section: selected.sectionRequested, notes }))}>
                Accept + invoice
              </Button>
            </DialogFooter>
          </div>
        )}
      </Dialog>
    </div>
  );
};
