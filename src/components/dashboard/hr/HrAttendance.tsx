'use client';

import React, { useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { TablePanel } from '@/components/dashboard/TablePanel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import type { DataTableColumn } from '@/components/ui/data-table';
import type { StaffAttendanceRecord, StaffAttendanceStatus } from '@/lib/hrPortal';
import { hrStatusBadgeVariant } from '@/lib/hrPortal';

const inputClass =
  'w-full h-10 px-3 bg-muted/40 border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring';

export const HrAttendance: React.FC = () => {
  const { staffAttendance, hrEmployees, recordStaffAttendance } = useApp();
  const [selectedDate, setSelectedDate] = useState('2026-06-05');
  const [employeeId, setEmployeeId] = useState('');
  const [status, setStatus] = useState<StaffAttendanceStatus>('Present');
  const [checkIn, setCheckIn] = useState('08:00');
  const [checkOut, setCheckOut] = useState('17:00');
  const [notes, setNotes] = useState('');

  const dayRecords = useMemo(
    () => staffAttendance.filter((r) => r.date === selectedDate),
    [staffAttendance, selectedDate]
  );

  const presentCount = dayRecords.filter((r) => r.status === 'Present' || r.status === 'Late').length;
  const absentCount = dayRecords.filter((r) => r.status === 'Absent').length;
  const onLeaveCount = dayRecords.filter((r) => r.status === 'On Leave').length;

  const handleRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId) return;
    recordStaffAttendance({
      employeeId,
      date: selectedDate,
      status,
      checkIn: status === 'Present' || status === 'Late' ? checkIn : undefined,
      checkOut: status === 'Present' || status === 'Late' ? checkOut : undefined,
      notes: notes || undefined,
    });
    setEmployeeId('');
    setNotes('');
  };

  const columns: DataTableColumn<StaffAttendanceRecord>[] = [
    {
      key: 'employeeName',
      header: 'Employee',
      sortable: true,
      render: (row) => <p className="text-xs font-semibold">{row.employeeName}</p>,
    },
    {
      key: 'checkIn',
      header: 'Check In / Out',
      render: (row) => (
        <span className="text-xs text-muted-foreground">
          {row.checkIn ? `${row.checkIn} – ${row.checkOut ?? '—'}` : '—'}
        </span>
      ),
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
      key: 'notes',
      header: 'Notes',
      render: (row) => <span className="text-[10px] text-muted-foreground">{row.notes ?? '—'}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 rounded-lg border border-border/60 bg-muted/20 text-center">
          <p className="text-2xl font-bold text-primary">{presentCount}</p>
          <p className="text-[10px] text-muted-foreground uppercase">Present / Late</p>
        </div>
        <div className="p-4 rounded-lg border border-border/60 bg-muted/20 text-center">
          <p className="text-2xl font-bold text-destructive">{absentCount}</p>
          <p className="text-[10px] text-muted-foreground uppercase">Absent</p>
        </div>
        <div className="p-4 rounded-lg border border-border/60 bg-muted/20 text-center">
          <p className="text-2xl font-bold text-muted-foreground">{onLeaveCount}</p>
          <p className="text-[10px] text-muted-foreground uppercase">On Leave</p>
        </div>
      </div>

      <TablePanel
        title="Staff Attendance"
        description="Daily attendance tracking for all personnel"
        actions={
          <input
            type="date"
            className="h-9 px-3 bg-muted/40 border border-border rounded-md text-xs"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        }
      >
        <form onSubmit={handleRecord} className="mb-4 p-4 rounded-lg border border-border/60 bg-muted/10 grid grid-cols-1 sm:grid-cols-6 gap-3 items-end">
          <div className="sm:col-span-2">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Employee</label>
            <select className={inputClass} value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} required>
              <option value="">Select</option>
              {hrEmployees.filter((e) => e.status !== 'Terminated').map((e) => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Status</label>
            <select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value as StaffAttendanceStatus)}>
              <option value="Present">Present</option>
              <option value="Late">Late</option>
              <option value="Absent">Absent</option>
              <option value="Half Day">Half Day</option>
              <option value="On Leave">On Leave</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Check In</label>
            <input type="time" className={inputClass} value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
          </div>
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Check Out</label>
            <input type="time" className={inputClass} value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
          </div>
          <Button type="submit" variant="organic" size="sm" className="h-10">Record</Button>
        </form>

        <DataTable columns={columns} data={dayRecords} emptyTitle="No attendance records for this date." />
      </TablePanel>
    </div>
  );
};
