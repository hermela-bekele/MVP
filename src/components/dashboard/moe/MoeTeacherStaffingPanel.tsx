'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { api, ApiError, type TeacherReplacementRequest } from '@/lib/api';
import { TablePanel } from '@/components/dashboard/TablePanel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Dialog, DialogFooter } from '@/components/ui/dialog';
import { FormField, formFieldInputClass } from '@/components/ui/form-field';

export function MoeTeacherStaffingPanel() {
  const { teachers, schools, addNotification, refreshFromApi } = useApp();
  const [requests, setRequests] = useState<TeacherReplacementRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [active, setActive] = useState<TeacherReplacementRequest | null>(null);
  const [assignTeacherId, setAssignTeacherId] = useState('');
  const [moeNotes, setMoeNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [actionMode, setActionMode] = useState<'assign' | 'reject' | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    api
      .listTeacherReplacementRequests(statusFilter ? { status: statusFilter } : {})
      .then(setRequests)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load staffing requests.'))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const candidateTeachers = useMemo(() => {
    if (!active) return [];
    return teachers
      .filter((t) => t.status === 'Active' && t.schoolId !== active.schoolId && t.id !== active.departingTeacherId)
      .map((t) => {
        const schoolName = schools.find((s) => s.id === t.schoolId)?.name ?? t.schoolId ?? 'Unassigned';
        return {
          value: t.id,
          label: `${t.name} — ${schoolName} (${t.subjects[0] ?? '—'})`,
        };
      });
  }, [active, teachers, schools]);

  const openAssign = (req: TeacherReplacementRequest) => {
    setActive(req);
    setActionMode('assign');
    setAssignTeacherId('');
    setMoeNotes('');
  };

  const openReject = (req: TeacherReplacementRequest) => {
    setActive(req);
    setActionMode('reject');
    setAssignTeacherId('');
    setMoeNotes('');
  };

  const closeDialog = (force = false) => {
    if (busy && !force) return;
    setActive(null);
    setActionMode(null);
    setError('');
  };

  const submitAction = async () => {
    if (!active || !actionMode) return;
    setBusy(true);
    setError('');
    try {
      if (actionMode === 'assign') {
        if (!assignTeacherId) {
          setError('Select a replacement teacher.');
          setBusy(false);
          return;
        }
        await api.assignTeacherReplacement(active.id, {
          assignedTeacherId: assignTeacherId,
          moeNotes: moeNotes.trim() || undefined,
        });
        addNotification('Teacher assigned', `Replacement assigned for ${active.schoolName || active.schoolId}.`, 'success');
      } else {
        if (!moeNotes.trim()) {
          setError('Rejection notes are required.');
          setBusy(false);
          return;
        }
        await api.rejectTeacherReplacement(active.id, { moeNotes: moeNotes.trim() });
        addNotification('Request rejected', 'The school has been notified via the linked MOE thread.', 'info');
      }
      setBusy(false);
      closeDialog(true);
      load();
      void refreshFromApi();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Action failed.');
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Teacher staffing</h2>
          <p className="text-sm text-muted-foreground">
            Review Public-school departure notices and assign replacement teachers.
          </p>
        </div>
        <Select
          label="Status"
          options={[
            { value: 'pending', label: 'Pending' },
            { value: 'under_review', label: 'Under review' },
            { value: 'assigned', label: 'Assigned' },
            { value: 'rejected', label: 'Rejected' },
            { value: '', label: 'All' },
          ]}
          value={statusFilter}
          onValueChange={setStatusFilter}
        />
      </div>

      {error && !actionMode && <p className="text-sm text-red-600">{error}</p>}

      <TablePanel
        title="Replacement requests"
        description={loading ? 'Loading…' : `${requests.length} request${requests.length === 1 ? '' : 's'}`}
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/60 text-left text-xs uppercase text-muted-foreground">
              <th className="px-3 py-2">School</th>
              <th className="px-3 py-2">Departing teacher</th>
              <th className="px-3 py-2">Needs</th>
              <th className="px-3 py-2">Departure</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">
                  {loading ? 'Loading…' : 'No requests in this filter.'}
                </td>
              </tr>
            ) : (
              requests.map((req) => (
                <tr key={req.id} className="border-b border-border/40">
                  <td className="px-3 py-2 font-medium">{req.schoolName || req.schoolId}</td>
                  <td className="px-3 py-2">
                    {req.departingTeacherName || req.departingTeacherId}
                    <div className="text-xs capitalize text-muted-foreground">{req.reason}</div>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {(req.subjectsNeeded || []).join(', ') || '—'}
                    <div className="text-xs">{(req.gradeLevelsNeeded || []).join(', ')}</div>
                  </td>
                  <td className="px-3 py-2">{String(req.departureDate).slice(0, 10)}</td>
                  <td className="px-3 py-2">
                    <Badge
                      variant={
                        req.status === 'assigned' ? 'success' : req.status === 'rejected' ? 'danger' : 'warning'
                      }
                      size="sm"
                    >
                      {req.status.replace('_', ' ')}
                    </Badge>
                    {req.assignedTeacherName && (
                      <div className="mt-1 text-xs text-muted-foreground">→ {req.assignedTeacherName}</div>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {['pending', 'under_review'].includes(req.status) ? (
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="organic" className="border-none" onClick={() => openAssign(req)}>
                          Assign
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => openReject(req)}>
                          Reject
                        </Button>
                      </div>
                    ) : (
                      <span className="block text-right text-xs text-muted-foreground">Resolved</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </TablePanel>

      <Dialog
        isOpen={active != null && actionMode != null}
        onClose={closeDialog}
        title={actionMode === 'assign' ? 'Assign replacement teacher' : 'Reject replacement request'}
        description={
          active
            ? `${active.schoolName || active.schoolId} — replacing ${active.departingTeacherName || active.departingTeacherId}`
            : undefined
        }
      >
        {actionMode === 'assign' && (
          <div className="space-y-3 pt-2">
            <Select
              label="Replacement teacher"
              placeholder="Select an Active teacher from another school"
              options={candidateTeachers}
              value={assignTeacherId}
              onValueChange={setAssignTeacherId}
            />
            <FormField label="Notes (optional)">
              <textarea
                className={formFieldInputClass}
                rows={3}
                value={moeNotes}
                onChange={(e) => setMoeNotes(e.target.value)}
              />
            </FormField>
          </div>
        )}
        {actionMode === 'reject' && (
          <FormField label="Rejection notes (required)" className="pt-2">
            <textarea
              className={formFieldInputClass}
              rows={3}
              value={moeNotes}
              onChange={(e) => setMoeNotes(e.target.value)}
              placeholder="Explain why this request cannot be fulfilled"
            />
          </FormField>
        )}
        {error && actionMode && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={() => closeDialog()} disabled={busy}>
            Cancel
          </Button>
          <Button
            variant={actionMode === 'assign' ? 'organic' : 'destructive'}
            className={actionMode === 'assign' ? 'border-none' : ''}
            onClick={submitAction}
            disabled={busy}
          >
            {busy ? 'Working…' : actionMode === 'assign' ? 'Assign teacher' : 'Reject request'}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
