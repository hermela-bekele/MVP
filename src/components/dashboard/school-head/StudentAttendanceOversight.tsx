'use client';

import React, { useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { readStoredSession } from '@/lib/auth';
import { api, ApiError } from '@/lib/api';
import { computeStudentAttendanceExceptions } from '@/lib/schoolHeadAnalytics';
import { TablePanel } from '@/components/dashboard/TablePanel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Dialog, DialogFooter } from '@/components/ui/dialog';
import { FormField, formFieldInputClass } from '@/components/ui/form-field';

const FOLLOW_UP_RECIPIENTS = ['Homeroom Teacher', 'HOD', 'Counsellor', 'Administration'] as const;

/**
 * Trend → Exception → Action for student attendance. The school head does not
 * create a new attendance record here — teachers already own that (see
 * TeacherAttendanceTab). This reads the same real `attendance` table and
 * surfaces only classes whose most recent tracked week fell below the
 * threshold, with an action that writes into the existing leadership_actions
 * table rather than a bespoke "follow-up" entity.
 */
export const StudentAttendanceOversight: React.FC = () => {
  const { attendance } = useApp();
  const session = readStoredSession();
  const schoolId = session?.schoolId ?? undefined;

  const exceptions = useMemo(() => computeStudentAttendanceExceptions(attendance), [attendance]);

  const [assigning, setAssigning] = useState<typeof exceptions[number] | null>(null);
  const [recipient, setRecipient] = useState<string>(FOLLOW_UP_RECIPIENTS[0]);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const openAssign = (row: typeof exceptions[number]) => {
    setAssigning(row);
    setRecipient(FOLLOW_UP_RECIPIENTS[0]);
    setNote('');
    setError('');
    setDone(false);
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigning) return;
    setSaving(true);
    setError('');
    try {
      await api.createLeadershipAction({
        schoolId,
        category: 'exception',
        issue: `${assigning.grade} Section ${assigning.section} attendance fell below 85% (${Math.round(assigning.currentWeekRate * 100)}% for the week of ${assigning.currentWeekStart})`,
        evidence: note.trim() || undefined,
        source: 'Student Attendance Trend',
        severity: assigning.weeksBelowThreshold >= 2 ? 'High' : 'Medium',
        owner: recipient,
        decisionRequired: 'Review attendance drivers and confirm a recovery plan.',
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not assign this follow-up.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <TablePanel
        title="Attendance Exceptions"
        description="Classes whose most recent tracked week fell below the 85% attendance threshold."
      >
        {exceptions.length === 0 ? (
          <p className="text-xs text-muted-foreground py-8 text-center">No class is currently below the attendance threshold.</p>
        ) : (
          <table className="eskooly-table">
            <thead>
              <tr>
                <th className="p-3 text-left text-muted-foreground font-semibold">Class</th>
                <th className="p-3 text-left text-muted-foreground font-semibold">Week Of</th>
                <th className="p-3 text-left text-muted-foreground font-semibold">Attendance Rate</th>
                <th className="p-3 text-left text-muted-foreground font-semibold">Weeks Below 85%</th>
                <th className="p-3 text-left text-muted-foreground font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 text-muted-foreground">
              {exceptions.map((row) => (
                <tr key={`${row.grade}-${row.section}`} className="hover:bg-muted/10">
                  <td className="p-3 text-foreground font-bold">{row.grade} · Section {row.section}</td>
                  <td className="p-3 font-mono">{row.currentWeekStart}</td>
                  <td className="p-3">
                    <Badge variant="danger" size="sm" className="font-bold">{Math.round(row.currentWeekRate * 100)}%</Badge>
                  </td>
                  <td className="p-3">{row.weeksBelowThreshold} of {row.weeksTracked} tracked</td>
                  <td className="p-3">
                    <Button variant="outline" size="sm" onClick={() => openAssign(row)} className="text-[10px] h-7 font-bold border-none">
                      Assign Follow-up
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </TablePanel>

      <Dialog isOpen={!!assigning} onClose={() => setAssigning(null)} title="Assign Follow-up" description={assigning ? `${assigning.grade} · Section ${assigning.section}` : undefined}>
        {done ? (
          <div className="space-y-3 text-left">
            <p className="text-xs text-success font-semibold">Follow-up assigned — it now appears on the Leadership Attention & Actions queue.</p>
            <DialogFooter>
              <Button type="button" variant="organic" size="sm" className="border-none" onClick={() => setAssigning(null)}>Done</Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleAssign} className="space-y-3 text-left">
            {error && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-md text-xxs font-bold">⚠ {error}</div>}
            <FormField label="Assign to">
              <Select options={FOLLOW_UP_RECIPIENTS.map((r) => ({ value: r, label: r }))} value={recipient} onChange={(e) => setRecipient(e.target.value)} />
            </FormField>
            <FormField label="Note (optional)">
              <textarea className={`${formFieldInputClass} h-20 py-2`} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Context for the recipient" />
            </FormField>
            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setAssigning(null)}>Cancel</Button>
              <Button type="submit" variant="organic" size="sm" className="border-none" disabled={saving}>{saving ? 'Assigning…' : 'Assign'}</Button>
            </DialogFooter>
          </form>
        )}
      </Dialog>
    </>
  );
};
