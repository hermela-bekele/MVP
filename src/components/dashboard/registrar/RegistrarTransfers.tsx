'use client';

import React, { useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { api } from '@/lib/api';
import { TablePanel } from '@/components/dashboard/TablePanel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Dialog, DialogFooter } from '@/components/ui/dialog';
import type { Student } from '@/lib/mockData';
import { filterSchoolStudents, statusBadgeVariant } from '@/lib/registrarPortal';
import { gpaToMark } from '@/lib/grading';

export const RegistrarTransfers: React.FC = () => {
  const { students, updateStudent, addNotification } = useApp();
  const schoolStudents = filterSchoolStudents(students);

  const [statusFilter, setStatusFilter] = useState<Student['status'] | 'All'>('All');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [newStatus, setNewStatus] = useState<Student['status']>('Active');
  const [transferNotes, setTransferNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const filtered = useMemo(() => {
    if (statusFilter === 'All') return schoolStudents;
    return schoolStudents.filter((s) => s.status === statusFilter);
  }, [schoolStudents, statusFilter]);

  const statusCounts = useMemo(
    () => ({
      Active: schoolStudents.filter((s) => s.status === 'Active').length,
      Suspended: schoolStudents.filter((s) => s.status === 'Suspended').length,
      Transferred: schoolStudents.filter((s) => s.status === 'Transferred').length,
      Graduated: schoolStudents.filter((s) => s.status === 'Graduated').length,
    }),
    [schoolStudents]
  );

  const handleStatusChange = async () => {
    if (!selectedStudent) return;
    setBusy(true);
    setError('');
    try {
      const result = (await api.updateStudent(selectedStudent.id, {
        status: newStatus,
        notes: transferNotes || undefined,
        applyProration: newStatus === 'Transferred' || newStatus === 'Graduated',
      })) as Student & { prorationCredit?: number };
      updateStudent(selectedStudent.id, { status: newStatus });
      const creditNote =
        result.prorationCredit && result.prorationCredit > 0
          ? ` Proration credit ${result.prorationCredit.toLocaleString()} ETB applied.`
          : '';
      addNotification?.(
        'Status updated',
        `${selectedStudent.name} is now ${newStatus}.${creditNote}`,
        'success'
      );
      setSelectedStudent(null);
      setTransferNotes('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(['Active', 'Suspended', 'Transferred', 'Graduated'] as const).map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setStatusFilter(statusFilter === status ? 'All' : status)}
            className={`p-4 rounded-lg border text-left transition-colors cursor-pointer ${
              statusFilter === status
                ? 'border-primary bg-primary/10'
                : 'border-border/60 bg-card hover:border-primary/30'
            }`}
          >
            <p className="text-[10px] font-bold text-muted-foreground uppercase">{status}</p>
            <p className="text-xl font-bold text-foreground mt-1">{statusCounts[status]}</p>
          </button>
        ))}
      </div>

      <TablePanel
        title="Student Status Management"
      >
        <table className="eskooly-table">
          <thead>
            <tr>
              <th className="p-3 text-left text-muted-foreground font-semibold text-xs">Student</th>
              <th className="p-3 text-left text-muted-foreground font-semibold text-xs">Grade</th>
              <th className="p-3 text-left text-muted-foreground font-semibold text-xs">Current Status</th>
              <th className="p-3 text-left text-muted-foreground font-semibold text-xs">Mark</th>
              <th className="p-3 text-left text-muted-foreground font-semibold text-xs">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {filtered.map((student) => (
              <tr key={student.id} className="hover:bg-muted/10">
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <Avatar name={student.name} size="sm" />
                    <div>
                      <p className="text-xs font-semibold text-foreground">{student.name}</p>
                      <code className="text-[9px] font-mono text-muted-foreground">{student.studentId}</code>
                    </div>
                  </div>
                </td>
                <td className="p-3 text-xs">
                  {student.grade} · {student.section}
                </td>
                <td className="p-3">
                  <Badge variant={statusBadgeVariant(student.status)} size="sm">
                    {student.status}
                  </Badge>
                </td>
                <td className="p-3 text-xs font-semibold">{gpaToMark(student.gpa)}%</td>
                <td className="p-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedStudent(student);
                      setNewStatus(student.status);
                      setError('');
                    }}
                    className="text-[10px] h-7 px-2"
                  >
                    Change Status
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TablePanel>

      <Dialog
        isOpen={!!selectedStudent}
        onClose={() => setSelectedStudent(null)}
        title="Update Student Status"
      >
        {selectedStudent && (
          <div className="space-y-4 pt-2">
            <p className="text-xs text-muted-foreground">
              Updating status for <strong className="text-foreground">{selectedStudent.name}</strong> (
              {selectedStudent.studentId})
            </p>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">New Status</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as Student['status'])}
                className="w-full h-10 px-3 bg-muted/40 border border-border rounded-md text-xs"
              >
                <option value="Active">Active — Currently enrolled</option>
                <option value="Suspended">Suspended — Temporarily removed</option>
                <option value="Transferred">Transferred — Moved to another school (proration credit)</option>
                <option value="Graduated">Graduated — Completed studies (proration credit)</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Notes (Optional)</label>
              <textarea
                value={transferNotes}
                onChange={(e) => setTransferNotes(e.target.value)}
                placeholder="Transfer destination, suspension reason, graduation ceremony date, etc."
                className="w-full h-20 p-3 bg-muted/40 border border-border rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
            <DialogFooter className="border-t border-border/20 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedStudent(null)}
                className="text-xs h-9"
              >
                Cancel
              </Button>
              <Button
                variant="organic"
                size="sm"
                onClick={handleStatusChange}
                disabled={busy}
                className="text-xs h-9 border-none font-semibold"
              >
                {busy ? 'Saving…' : 'Confirm Status Change'}
              </Button>
            </DialogFooter>
          </div>
        )}
      </Dialog>
    </div>
  );
};
