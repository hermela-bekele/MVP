'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { TablePanel } from '@/components/dashboard/TablePanel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { Dialog, DialogFooter } from '@/components/ui/dialog';
import type { DataTableColumn } from '@/components/ui/data-table';
import type { PerformanceReview } from '@/lib/hrPortal';
import { hrStatusBadgeVariant } from '@/lib/hrPortal';

const inputClass =
  'w-full h-10 px-3 bg-muted/40 border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring';

export const HrPerformance: React.FC = () => {
  const { performanceReviews, hrEmployees, addPerformanceReview, updatePerformanceReview, currentUser } = useApp();
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [selected, setSelected] = useState<PerformanceReview | null>(null);

  const [employeeId, setEmployeeId] = useState('');
  const [period, setPeriod] = useState('');
  const [rating, setRating] = useState('4.0');
  const [goals, setGoals] = useState('');
  const [strengths, setStrengths] = useState('');
  const [improvements, setImprovements] = useState('');
  const reviewerName = currentUser?.displayName ?? 'HR Officer';

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const employee = hrEmployees.find((emp) => emp.id === employeeId);
    if (!employee || !period) return;
    addPerformanceReview({
      employeeId,
      employeeName: employee.name,
      period,
      rating: Number(rating) || 0,
      goals: goals.split('\n').filter(Boolean),
      strengths,
      improvements,
      reviewerName,
    });
    setIsNewOpen(false);
    setEmployeeId('');
    setPeriod('');
    setGoals('');
    setStrengths('');
    setImprovements('');
  };

  const columns: DataTableColumn<PerformanceReview>[] = [
    {
      key: 'employeeName',
      header: 'Employee',
      sortable: true,
      render: (row) => (
        <div>
          <p className="text-xs font-semibold">{row.employeeName}</p>
          <p className="text-[9px] text-muted-foreground">{row.period}</p>
        </div>
      ),
    },
    {
      key: 'rating',
      header: 'Rating',
      sortable: true,
      render: (row) => (
        <span className="text-xs font-bold text-primary">{row.rating.toFixed(1)} / 5.0</span>
      ),
    },
    {
      key: 'reviewerName',
      header: 'Reviewer',
      render: (row) => <span className="text-xs text-muted-foreground">{row.reviewerName}</span>,
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
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" className="text-[10px] h-7" onClick={() => setSelected(row)}>View</Button>
          {row.status !== 'Completed' && (
            <Button variant="ghost" size="sm" className="text-[10px] h-7" onClick={() => updatePerformanceReview(row.id, { status: 'Completed', completedAt: new Date().toISOString().slice(0, 10) })}>
              Complete
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <TablePanel
      title="Performance Reviews"
      actions={
        <Button variant="organic" size="sm" className="text-xs h-9" onClick={() => setIsNewOpen(true)}>
          + New Review
        </Button>
      }
    >
      <DataTable columns={columns} data={performanceReviews} emptyTitle="No performance reviews." />

      <Dialog isOpen={isNewOpen} onClose={() => setIsNewOpen(false)} title="Schedule Performance Review">
        <form onSubmit={handleCreate} className="space-y-3">
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Employee</label>
            <select className={inputClass} value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} required>
              <option value="">Select employee</option>
              {hrEmployees.filter((e) => e.status !== 'Terminated').map((e) => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
          </div>
          <div><label className="text-[10px] font-bold text-muted-foreground uppercase">Review Period</label><input className={inputClass} value={period} onChange={(e) => setPeriod(e.target.value)} placeholder="2025/2026 — Semester 2" required /></div>
          <div><label className="text-[10px] font-bold text-muted-foreground uppercase">Initial Rating</label><input type="number" step="0.1" min="1" max="5" className={inputClass} value={rating} onChange={(e) => setRating(e.target.value)} /></div>
          <div><label className="text-[10px] font-bold text-muted-foreground uppercase">Goals (one per line)</label><textarea className={`${inputClass} h-16 py-2`} value={goals} onChange={(e) => setGoals(e.target.value)} /></div>
          <div><label className="text-[10px] font-bold text-muted-foreground uppercase">Strengths</label><textarea className={`${inputClass} h-12 py-2`} value={strengths} onChange={(e) => setStrengths(e.target.value)} /></div>
          <div><label className="text-[10px] font-bold text-muted-foreground uppercase">Areas for Improvement</label><textarea className={`${inputClass} h-12 py-2`} value={improvements} onChange={(e) => setImprovements(e.target.value)} /></div>
          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => setIsNewOpen(false)}>Cancel</Button>
            <Button type="submit" variant="organic" size="sm">Create Review</Button>
          </DialogFooter>
        </form>
      </Dialog>

      {selected && (
        <Dialog isOpen onClose={() => setSelected(null)} title={`Review — ${selected.employeeName}`}>
          <div className="space-y-3 text-xs">
            <p><span className="text-muted-foreground">Period:</span> {selected.period}</p>
            <p><span className="text-muted-foreground">Rating:</span> <span className="font-bold text-primary">{selected.rating}/5</span></p>
            <div><p className="text-muted-foreground mb-1">Goals:</p><ul className="list-disc pl-4">{selected.goals.map((g) => <li key={g}>{g}</li>)}</ul></div>
            <p><span className="text-muted-foreground">Strengths:</span> {selected.strengths}</p>
            <p><span className="text-muted-foreground">Improvements:</span> {selected.improvements}</p>
          </div>
        </Dialog>
      )}
    </TablePanel>
  );
};
