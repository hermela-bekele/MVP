'use client';

import React, { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { TablePanel } from '@/components/dashboard/TablePanel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { Dialog, DialogFooter } from '@/components/ui/dialog';
import type { DataTableColumn } from '@/components/ui/data-table';
import type { LeaveRequest } from '@/lib/hrPortal';
import { hrStatusBadgeVariant } from '@/lib/hrPortal';

const inputClass =
  'w-full h-10 px-3 bg-muted/40 border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring';

export const HrLeaveManagement: React.FC = () => {
  const { leaveRequests, hrEmployees, submitLeaveRequest, reviewLeaveRequest } = useApp();
  const [selected, setSelected] = useState<LeaveRequest | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [isNewOpen, setIsNewOpen] = useState(false);

  const [employeeId, setEmployeeId] = useState('');
  const [type, setType] = useState<LeaveRequest['type']>('Annual');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    const handleOpen = () => setIsNewOpen(true);
    window.addEventListener('open-hr-leave', handleOpen);
    return () => window.removeEventListener('open-hr-leave', handleOpen);
  }, []);

  const calcDays = (start: string, end: string) => {
    if (!start || !end) return 0;
    const diff = new Date(end).getTime() - new Date(start).getTime();
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const employee = hrEmployees.find((emp) => emp.id === employeeId);
    if (!employee || !startDate || !endDate) return;
    submitLeaveRequest({
      employeeId,
      employeeName: employee.name,
      type,
      startDate,
      endDate,
      days: calcDays(startDate, endDate),
      reason,
    });
    setIsNewOpen(false);
    setEmployeeId('');
    setReason('');
    setStartDate('');
    setEndDate('');
  };

  const columns: DataTableColumn<LeaveRequest>[] = [
    {
      key: 'employeeName',
      header: 'Employee',
      sortable: true,
      render: (row) => <p className="text-xs font-semibold">{row.employeeName}</p>,
    },
    {
      key: 'type',
      header: 'Leave Type',
      render: (row) => <Badge variant="neutral" size="sm">{row.type}</Badge>,
    },
    {
      key: 'startDate',
      header: 'Period',
      render: (row) => (
        <span className="text-xs text-muted-foreground">
          {row.startDate} → {row.endDate} ({row.days}d)
        </span>
      ),
    },
    {
      key: 'submittedAt',
      header: 'Submitted',
      sortable: true,
      render: (row) => <span className="text-xs text-muted-foreground">{row.submittedAt}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (row) => (
        <Badge variant={hrStatusBadgeVariant(row.status)} size="sm">{row.status}</Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <Button variant="ghost" size="sm" className="text-[10px] h-7" onClick={() => { setSelected(row); setReviewNotes(row.reviewerNotes ?? ''); }}>
          Review
        </Button>
      ),
    },
  ];

  return (
    <TablePanel title="Leave Management" description="Submit, review, and track staff leave requests">
      <DataTable columns={columns} data={leaveRequests} emptyTitle="No leave requests." />

      <Dialog isOpen={isNewOpen} onClose={() => setIsNewOpen(false)} title="New Leave Request">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Employee</label>
            <select className={inputClass} value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} required>
              <option value="">Select employee</option>
              {hrEmployees.filter((e) => e.status === 'Active').map((e) => (
                <option key={e.id} value={e.id}>{e.name} — {e.position}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Leave Type</label>
            <select className={inputClass} value={type} onChange={(e) => setType(e.target.value as LeaveRequest['type'])}>
              <option value="Annual">Annual</option>
              <option value="Sick">Sick</option>
              <option value="Maternity">Maternity</option>
              <option value="Paternity">Paternity</option>
              <option value="Unpaid">Unpaid</option>
              <option value="Emergency">Emergency</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-[10px] font-bold text-muted-foreground uppercase">Start Date</label><input type="date" className={inputClass} value={startDate} onChange={(e) => setStartDate(e.target.value)} required /></div>
            <div><label className="text-[10px] font-bold text-muted-foreground uppercase">End Date</label><input type="date" className={inputClass} value={endDate} onChange={(e) => setEndDate(e.target.value)} required /></div>
          </div>
          <div><label className="text-[10px] font-bold text-muted-foreground uppercase">Reason</label><textarea className={`${inputClass} h-20 py-2`} value={reason} onChange={(e) => setReason(e.target.value)} required /></div>
          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => setIsNewOpen(false)}>Cancel</Button>
            <Button type="submit" variant="organic" size="sm">Submit Request</Button>
          </DialogFooter>
        </form>
      </Dialog>

      {selected && (
        <Dialog isOpen onClose={() => setSelected(null)} title={`Review — ${selected.employeeName}`}>
          <div className="space-y-3 text-xs">
            <p><span className="text-muted-foreground">Type:</span> {selected.type}</p>
            <p><span className="text-muted-foreground">Period:</span> {selected.startDate} → {selected.endDate} ({selected.days} days)</p>
            <p><span className="text-muted-foreground">Reason:</span> {selected.reason}</p>
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Reviewer Notes</label>
              <textarea className={`${inputClass} h-16 py-2`} value={reviewNotes} onChange={(e) => setReviewNotes(e.target.value)} disabled={selected.status !== 'Pending'} />
            </div>
          </div>
          {selected.status === 'Pending' && (
            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => { reviewLeaveRequest(selected.id, 'Rejected', reviewNotes); setSelected(null); }}>Reject</Button>
              <Button variant="organic" size="sm" onClick={() => { reviewLeaveRequest(selected.id, 'Approved', reviewNotes); setSelected(null); }}>Approve</Button>
            </DialogFooter>
          )}
        </Dialog>
      )}
    </TablePanel>
  );
};
