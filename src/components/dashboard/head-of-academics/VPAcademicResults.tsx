'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Lock, RefreshCw } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { readStoredSession } from '@/lib/auth';
import { ApiError } from '@/lib/api';
import { academicResultsApi, type MissingResult, type ResultChangeRequest, type ResultStatus, type SubjectTermResult } from '@/lib/academicResults';
import { ContentCard } from '@/components/dashboard/ContentCard';
import { TablePanel } from '@/components/dashboard/TablePanel';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Dialog, DialogFooter } from '@/components/ui/dialog';
import { Pagination } from '@/components/ui/pagination';
import { Badge } from '@/components/ui/badge';
import { FormField, formFieldInputClass } from '@/components/ui/form-field';

const STUDENT_ROWS_PAGE_SIZE = 10;

const STATUS_OPTIONS: { value: ResultStatus | ''; label: string }[] = [
  { value: '', label: 'All statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'finalized', label: 'Finalized' },
];

export function VPAcademicResults() {
  const { students, classes, teachers, studentGradeEntries } = useApp();
  const session = readStoredSession();
  const schoolId = session?.schoolId || 'sch-1';

  const [academicYear, setAcademicYear] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [section, setSection] = useState('');
  const [subject, setSubject] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [term, setTerm] = useState('');
  const [studentId, setStudentId] = useState('');
  const [status, setStatus] = useState<ResultStatus | ''>('');

  const [results, setResults] = useState<SubjectTermResult[]>([]);
  const [missing, setMissing] = useState<MissingResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<'finalize' | 'reopen' | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [studentRowsPage, setStudentRowsPage] = useState(1);
  const [reopenReason, setReopenReason] = useState('');
  const [changeRequests, setChangeRequests] = useState<ResultChangeRequest[]>([]);
  const [reviewTarget, setReviewTarget] = useState<{ id: string; action: 'approve' | 'reject' } | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [reviewBusy, setReviewBusy] = useState(false);

  const gradeOptions = useMemo(
    () => Array.from(new Set(classes.map((c) => c.grade))).map((g) => ({ value: g, label: g })),
    [classes],
  );
  const sectionOptions = useMemo(
    () =>
      Array.from(new Set(classes.filter((c) => c.grade === gradeLevel).map((c) => c.section))).map((sec) => ({
        value: sec,
        label: sec,
      })),
    [classes, gradeLevel],
  );
  const subjectOptions = useMemo(
    () => Array.from(new Set(studentGradeEntries.map((e) => e.subject))).sort().map((s) => ({ value: s, label: s })),
    [studentGradeEntries],
  );
  const [academicYearOptions, setAcademicYearOptions] = useState<string[]>([]);
  const [termOptions, setTermOptions] = useState<string[]>([]);

  useEffect(() => {
    academicResultsApi
      .listAcademicYears(schoolId)
      .then(setAcademicYearOptions)
      .catch(() => setAcademicYearOptions([]));
  }, [schoolId]);

  useEffect(() => {
    if (!academicYear) {
      setTermOptions([]);
      return;
    }
    academicResultsApi
      .listTerms({ schoolId, academicYear, gradeLevel: gradeLevel || undefined, section: section || undefined })
      .then(setTermOptions)
      .catch(() => setTermOptions([]));
  }, [schoolId, academicYear, gradeLevel, section]);

  const teacherOptions = useMemo(() => teachers.map((t) => ({ value: t.id, label: t.name })), [teachers]);
  const studentOptions = useMemo(() => students.map((s) => ({ value: s.id, label: `${s.name} (${s.studentId})` })), [students]);

  const canFinalizeScope = Boolean(gradeLevel && section && academicYear && term);

  const load = React.useCallback(() => {
    setLoading(true);
    setError(null);
    academicResultsApi
      .list({ schoolId, academicYear, gradeLevel, section, subject, teacherId, term, studentId, status: status || undefined })
      .then(({ results, missing }) => {
        setResults(results);
        setMissing(missing);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load results.'))
      .finally(() => setLoading(false));
  }, [schoolId, academicYear, gradeLevel, section, subject, teacherId, term, studentId, status]);

  const loadChangeRequests = React.useCallback(() => {
    academicResultsApi
      .listChangeRequests({ schoolId, status: 'pending' })
      .then(setChangeRequests)
      .catch(() => setChangeRequests([]));
  }, [schoolId]);

  useEffect(() => {
    load();
    setStudentRowsPage(1);
  }, [load]);

  useEffect(() => {
    loadChangeRequests();
  }, [loadChangeRequests]);

  const subjectsInResults = useMemo(() => Array.from(new Set(results.map((r) => r.subject))).sort(), [results]);
  const studentRows = useMemo(() => {
    const byStudent = new Map<string, { studentId: string; studentName: string; cells: Map<string, SubjectTermResult> }>();
    for (const r of results) {
      const key = r.studentId;
      const row = byStudent.get(key) ?? { studentId: r.studentId, studentName: r.studentName || r.studentId, cells: new Map() };
      row.cells.set(r.subject, r);
      byStudent.set(key, row);
    }
    return Array.from(byStudent.values()).sort((a, b) => a.studentName.localeCompare(b.studentName));
  }, [results]);

  const studentRowsTotalPages = Math.max(1, Math.ceil(studentRows.length / STUDENT_ROWS_PAGE_SIZE));
  const studentRowsCurrentPage = Math.min(studentRowsPage, studentRowsTotalPages);
  const pagedStudentRows = studentRows.slice(
    (studentRowsCurrentPage - 1) * STUDENT_ROWS_PAGE_SIZE,
    studentRowsCurrentPage * STUDENT_ROWS_PAGE_SIZE,
  );

  const missingByStudent = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const m of missing) {
      const list = map.get(m.studentId) ?? [];
      list.push(m.subject);
      map.set(m.studentId, list);
    }
    return map;
  }, [missing]);

  const runAction = async (action: 'finalize' | 'reopen') => {
    if (!canFinalizeScope) return;
    if (action === 'reopen' && !reopenReason.trim()) {
      setActionError('A reason is required for emergency unlock.');
      return;
    }
    setActionBusy(true);
    setActionError(null);
    try {
      if (action === 'finalize') {
        await academicResultsApi.finalize({ gradeLevel, section, academicYear, term, schoolId });
      } else {
        await academicResultsApi.reopen({
          gradeLevel,
          section,
          academicYear,
          term,
          schoolId,
          reason: reopenReason.trim(),
          subject: subject || undefined,
        });
      }
      setConfirmAction(null);
      setReopenReason('');
      load();
      loadChangeRequests();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : `Failed to ${action} results.`);
    } finally {
      setActionBusy(false);
    }
  };

  const runReview = async () => {
    if (!reviewTarget) return;
    setReviewBusy(true);
    setActionError(null);
    try {
      if (reviewTarget.action === 'approve') {
        await academicResultsApi.approveChangeRequest(reviewTarget.id, { reviewNote: reviewNote.trim() || undefined });
      } else {
        await academicResultsApi.rejectChangeRequest(reviewTarget.id, { reviewNote: reviewNote.trim() || undefined });
      }
      setReviewTarget(null);
      setReviewNote('');
      load();
      loadChangeRequests();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Failed to review change request.');
    } finally {
      setReviewBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <TablePanel
        title="Edit approval requests"
        description={
          changeRequests.length
            ? `${changeRequests.length} pending teacher request${changeRequests.length === 1 ? '' : 's'}`
            : 'No pending teacher edit requests'
        }
      >
        {changeRequests.length === 0 ? (
          <p className="px-3 py-4 text-sm text-muted-foreground">Teachers request approval here after results are submitted or finalized.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 text-left text-xs uppercase text-muted-foreground">
                <th className="px-3 py-2">Teacher</th>
                <th className="px-3 py-2">Scope</th>
                <th className="px-3 py-2">Reason</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {changeRequests.map((req) => (
                <tr key={req.id} className="border-b border-border/40">
                  <td className="px-3 py-2 font-medium">{req.teacherName || req.teacherId}</td>
                  <td className="px-3 py-2">
                    {req.subject} · {req.gradeLevel} · {req.section} · {req.term}
                    <div className="text-xs text-muted-foreground">{req.academicYear}</div>
                  </td>
                  <td className="max-w-xs px-3 py-2 text-muted-foreground">{req.reason}</td>
                  <td className="px-3 py-2">
                    <Badge variant="warning">Pending</Badge>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="organic"
                        className="border-none"
                        onClick={() => {
                          setReviewTarget({ id: req.id, action: 'approve' });
                          setReviewNote('');
                        }}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setReviewTarget({ id: req.id, action: 'reject' });
                          setReviewNote('');
                        }}
                      >
                        Reject
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </TablePanel>

      <ContentCard title="Filters" description="Narrow down results by scope, then finalize a class + term">
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <Select
            label="Academic year"
            placeholder="All years"
            options={academicYearOptions.map((y) => ({ value: y, label: y }))}
            value={academicYear}
            onValueChange={(v) => {
              setAcademicYear(v);
              setTerm('');
            }}
          />
          <Select
            label="Grade"
            placeholder="All grades"
            options={gradeOptions}
            value={gradeLevel}
            onValueChange={(v) => {
              setGradeLevel(v);
              setSection('');
            }}
          />
          <Select label="Section" placeholder="All sections" options={sectionOptions} value={section} onValueChange={setSection} disabled={!gradeLevel} />
          <Select
            label="Term"
            placeholder={academicYear ? 'All terms' : 'Select academic year first'}
            options={termOptions.map((t) => ({ value: t, label: t }))}
            value={term}
            onValueChange={setTerm}
            disabled={!academicYear}
          />
          <Select label="Subject" placeholder="All subjects" options={subjectOptions} value={subject} onValueChange={setSubject} />
          <Select label="Teacher" placeholder="All teachers" options={teacherOptions} value={teacherId} onValueChange={setTeacherId} />
          <Select label="Student" placeholder="All students" options={studentOptions} value={studentId} onValueChange={setStudentId} />
          <Select
            label="Status"
            options={STATUS_OPTIONS}
            value={status}
            onValueChange={(v) => setStatus(v as ResultStatus | '')}
          />
        </div>
      </ContentCard>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {actionError && <p className="text-sm text-red-600">{actionError}</p>}

      {canFinalizeScope && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/30 px-4 py-3">
          <p className="text-sm text-muted-foreground">
            Scope: <strong>{gradeLevel} · {section} · {academicYear} · {term}</strong>
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
              onClick={() => {
                setReopenReason('');
                setConfirmAction('reopen');
              }}
              disabled={actionBusy}
            >
              Emergency unlock
            </Button>
            <Button
              size="sm"
              variant="organic"
              className="border-none"
              leftIcon={<Lock className="h-3.5 w-3.5" />}
              onClick={() => setConfirmAction('finalize')}
              disabled={actionBusy}
            >
              Finalize Results
            </Button>
          </div>
        </div>
      )}

      {missing.length > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{missing.length} student/subject result{missing.length === 1 ? '' : 's'} missing in this scope.</span>
        </div>
      )}

      <TablePanel title="Results" description={loading ? 'Loading…' : `${studentRows.length} students`}>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase text-muted-foreground border-b border-border/60">
              <th className="py-2 px-3">Student</th>
              {subjectsInResults.map((s) => (
                <th key={s} className="py-2 px-3 text-center">{s}</th>
              ))}
              <th className="py-2 px-3 text-center">Average</th>
            </tr>
          </thead>
          <tbody>
            {studentRows.length === 0 ? (
              <tr>
                <td colSpan={subjectsInResults.length + 2} className="py-6 text-center text-muted-foreground">
                  {loading ? 'Loading…' : 'No results for this scope yet.'}
                </td>
              </tr>
            ) : (
              pagedStudentRows.map((row) => {
                const values = subjectsInResults.map((s) => row.cells.get(s)?.averagePercent ?? null).filter((v): v is number => v != null);
                const avg = values.length ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100 : null;
                const missingSubjects = missingByStudent.get(row.studentId) ?? [];
                return (
                  <tr key={row.studentId} className="border-b border-border/40">
                    <td className="py-2 px-3 font-medium">{row.studentName}</td>
                    {subjectsInResults.map((s) => {
                      const cell = row.cells.get(s);
                      const isMissing = missingSubjects.includes(s);
                      return (
                        <td key={s} className="py-2 px-3 text-center">
                          {cell ? (
                            <span className="inline-flex items-center gap-1">
                              {cell.averagePercent != null ? `${cell.averagePercent}%` : '—'}
                              {cell.status === 'finalized' && <CheckCircle2 className="h-3 w-3 text-emerald-600" />}
                              {cell.status === 'submitted' && <Lock className="h-3 w-3 text-blue-600" />}
                            </span>
                          ) : isMissing ? (
                            <span className="text-amber-600" title="Missing result">—</span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="py-2 px-3 text-center font-semibold">{avg != null ? `${avg}%` : '—'}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        {studentRows.length > 0 && (
          <Pagination
            className="mt-3"
            currentPage={studentRowsCurrentPage}
            totalPages={studentRowsTotalPages}
            onPageChange={setStudentRowsPage}
            totalItems={studentRows.length}
            pageSize={STUDENT_ROWS_PAGE_SIZE}
            entityLabel="students"
          />
        )}
      </TablePanel>

      <Dialog
        isOpen={confirmAction != null}
        onClose={() => {
          if (!actionBusy) {
            setConfirmAction(null);
            setReopenReason('');
          }
        }}
        title={confirmAction === 'finalize' ? 'Finalize results?' : 'Emergency unlock?'}
        description={
          confirmAction === 'finalize'
            ? `This locks all submitted results for ${gradeLevel} · ${section} · ${academicYear} · ${term} and computes final averages and ranks. Teachers will need edit approval to change them afterward.`
            : `Unlocks submitted/finalized results for ${gradeLevel} · ${section} · ${academicYear} · ${term}${subject ? ` · ${subject}` : ''} for editing. Prefer approving a teacher change request when possible.`
        }
      >
        {confirmAction === 'reopen' && (
          <FormField label="Reason (required)" className="mt-2">
            <textarea
              className={formFieldInputClass}
              rows={3}
              value={reopenReason}
              onChange={(e) => setReopenReason(e.target.value)}
              placeholder="Why is an emergency unlock needed?"
            />
          </FormField>
        )}
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setConfirmAction(null);
              setReopenReason('');
            }}
            disabled={actionBusy}
          >
            Cancel
          </Button>
          <Button
            variant={confirmAction === 'finalize' ? 'organic' : 'destructive'}
            className={confirmAction === 'finalize' ? 'border-none' : ''}
            onClick={() => confirmAction && runAction(confirmAction)}
            disabled={actionBusy || (confirmAction === 'reopen' && !reopenReason.trim())}
          >
            {actionBusy ? 'Working…' : confirmAction === 'finalize' ? 'Finalize' : 'Unlock'}
          </Button>
        </DialogFooter>
      </Dialog>

      <Dialog
        isOpen={reviewTarget != null}
        onClose={() => {
          if (!reviewBusy) {
            setReviewTarget(null);
            setReviewNote('');
          }
        }}
        title={reviewTarget?.action === 'approve' ? 'Approve edit request?' : 'Reject edit request?'}
        description={
          reviewTarget?.action === 'approve'
            ? 'The teacher will get a 48-hour edit window for this subject/term, then must resubmit.'
            : 'The teacher will stay locked out of this subject/term.'
        }
      >
        <FormField label="Review note (optional)" className="mt-2">
          <textarea
            className={formFieldInputClass}
            rows={3}
            value={reviewNote}
            onChange={(e) => setReviewNote(e.target.value)}
            placeholder="Optional note for the record"
          />
        </FormField>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setReviewTarget(null);
              setReviewNote('');
            }}
            disabled={reviewBusy}
          >
            Cancel
          </Button>
          <Button
            variant={reviewTarget?.action === 'approve' ? 'organic' : 'destructive'}
            className={reviewTarget?.action === 'approve' ? 'border-none' : ''}
            onClick={runReview}
            disabled={reviewBusy}
          >
            {reviewBusy ? 'Working…' : reviewTarget?.action === 'approve' ? 'Approve' : 'Reject'}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
