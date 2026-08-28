'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import {
  FileX,
  Save,
  MessageCircleQuestion,
  Clock,
  XCircle,
  Undo2,
  CheckCircle2,
} from 'lucide-react';
import { api, type AdmissionApplication } from '@/lib/api';
import { readStoredSession } from '@/lib/auth';
import { statusVariant } from '@/components/dashboard/registrar/RegistrarApplications';
import { DetailField } from '@/components/dashboard/shared/DetailField';

function formatDocType(docType: string): string {
  return docType.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

const inputClass =
  'w-full h-10 px-3 bg-muted/40 border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring';

interface RegistrarApplicationDetailProps {
  applicationId: string;
}

export const RegistrarApplicationDetail: React.FC<RegistrarApplicationDetailProps> = ({ applicationId }) => {
  const router = useRouter();
  const session = readStoredSession();
  const schoolId = session?.schoolId || 'sch-1';
  const [application, setApplication] = useState<AdmissionApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [requiredDocs, setRequiredDocs] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [score, setScore] = useState('70');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const detail = await api.getApplication(applicationId);
      setApplication(detail);
      setNotes(detail.reviewerNotes || '');
      setScore(String(detail.priorityScore || 70));
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    api
      .getSchoolSettings(schoolId)
      .then((s) => {
        const docs = (s as { required_documents?: string[] } | undefined)?.required_documents;
        setRequiredDocs(Array.isArray(docs) ? docs : []);
      })
      .catch(() => setRequiredDocs([]));
  }, [schoolId]);

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setError('');
    try {
      await fn();
      router.push('/dashboard/registrar/applications');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setBusy(false);
    }
  };

  const verifyDoc = async (docId: string) => {
    setBusy(true);
    setError('');
    try {
      await api.verifyApplicationDocument(applicationId, docId, true);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verify failed');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <Skeleton variant="card" className="w-full" height={220} />;
  }

  if (notFound || !application) {
    return (
      <EmptyState
        icon={<FileX />}
        title="Application not found"
        description="This application may have been removed."
        action={
          <Button size="sm" onClick={() => router.push('/dashboard/registrar/applications')}>
            Back to queue
          </Button>
        }
      />
    );
  }

  return (
    <div className="w-full space-y-4">
      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </div>
      )}

      {/* Applicant header */}
      <div className="rounded-xl border border-border/60 bg-card p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <Avatar name={application.applicantName} size="lg" />
          <div className="space-y-1.5">
            <p className="text-lg font-bold text-foreground leading-tight">{application.applicantName}</p>
            <Badge variant={statusVariant(application.status)} badgeStyle="subtle" size="sm" dot>
              {application.status.replace(/_/g, ' ')}
            </Badge>
            <p className="text-xs text-muted-foreground">
              {application.referenceCode} · {application.gradeApplied}
              {application.sourceChannel ? ` · ${application.sourceChannel}` : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Application information */}
      <div className="rounded-xl border border-border/60 bg-card p-5 sm:p-6 space-y-4">
        <h3 className="text-sm font-bold text-foreground">Application Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <DetailField label="Parent" value={application.parentName} />
          <DetailField label="Parent phone" value={application.parentPhone} />
          <DetailField label="Parent email" value={application.parentEmail || '—'} />
          <DetailField label="Grade applied" value={application.gradeApplied} />
          <DetailField label="Section requested" value={application.sectionRequested || '—'} />
          <DetailField label="Previous school" value={application.previousSchool || '—'} />
        </div>
      </div>

      {(requiredDocs.length > 0 || (application.documents?.length ?? 0) > 0) && (
        <div className="rounded-xl border border-border/60 bg-card p-5 sm:p-6 space-y-3">
          <h3 className="text-sm font-bold text-foreground">Documents</h3>
          <div className="space-y-1.5">
            {requiredDocs.map((docType) => {
              const doc = application.documents?.find((d) => d.docType === docType);
              return (
                <div
                  key={docType}
                  className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 px-3.5 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground">{formatDocType(docType)}</p>
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
            {(application.documents ?? [])
              .filter((d) => !requiredDocs.includes(d.docType))
              .map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 px-3.5 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground">{formatDocType(doc.docType)}</p>
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
        </div>
      )}

      {/* Review */}
      <div className="rounded-xl border border-border/60 bg-card p-5 sm:p-6 space-y-3">
        <h3 className="text-sm font-bold text-foreground">Review</h3>
        <label className="block text-xs space-y-1">
          <span className="text-[10px] font-bold text-muted-foreground uppercase">Priority score</span>
          <input className={inputClass} value={score} onChange={(e) => setScore(e.target.value)} />
        </label>
        <label className="block text-xs space-y-1">
          <span className="text-[10px] font-bold text-muted-foreground uppercase">Notes / reason</span>
          <textarea className={`${inputClass} h-20 py-2`} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </label>
      </div>

      <div className="flex flex-wrap justify-end gap-2">
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5"
          disabled={busy}
          onClick={() => run(() => api.scoreApplication(applicationId, Number(score), notes))}
        >
          <Save className="h-3.5 w-3.5" aria-hidden />
          Save score
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5"
          disabled={busy}
          onClick={() => run(() => api.requestInfoApplication(applicationId, notes || 'Please provide more information'))}
        >
          <MessageCircleQuestion className="h-3.5 w-3.5" aria-hidden />
          Request info
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5"
          disabled={busy}
          onClick={() => run(() => api.waitlistApplication(applicationId, notes))}
        >
          <Clock className="h-3.5 w-3.5" aria-hidden />
          Waitlist
        </Button>
        <Button
          size="sm"
          variant="destructive"
          className="gap-1.5"
          disabled={busy}
          onClick={() => run(() => api.rejectApplication(applicationId, notes || 'Not selected'))}
        >
          <XCircle className="h-3.5 w-3.5" aria-hidden />
          Reject
        </Button>
        <Button
          size="sm"
          variant="destructive"
          className="gap-1.5"
          disabled={busy}
          onClick={() => run(() => api.withdrawApplication(applicationId, notes || 'Withdrawn'))}
        >
          <Undo2 className="h-3.5 w-3.5" aria-hidden />
          Withdraw
        </Button>
        <Button
          size="sm"
          className="gap-1.5"
          disabled={busy}
          onClick={() => run(() => api.acceptApplication(applicationId, { section: application.sectionRequested, notes }))}
        >
          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
          Accept + invoice
        </Button>
      </div>
    </div>
  );
};
