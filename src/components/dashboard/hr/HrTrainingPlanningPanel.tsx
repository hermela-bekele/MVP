'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { TablePanel } from '@/components/dashboard/TablePanel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { Dialog, DialogFooter } from '@/components/ui/dialog';
import type { DataTableColumn } from '@/components/ui/data-table';
import type { TrainingPlan, TrainingPlanType, TrainingPlanStatus } from '@/lib/mockData';

const inputClass =
  'w-full h-10 px-3 bg-muted/40 border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring';

const TYPE_LABEL: Record<TrainingPlanType, string> = {
  continuous_development: 'Continuous Development',
  in_person: 'In-Person Training Session',
};

const STATUS_LABEL: Record<TrainingPlanStatus, string> = {
  planned: 'Planned',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

function statusVariant(status: TrainingPlanStatus) {
  switch (status) {
    case 'completed':
      return 'success' as const;
    case 'in_progress':
      return 'warning' as const;
    case 'cancelled':
      return 'danger' as const;
    default:
      return 'info' as const;
  }
}

export function HrTrainingPlanningPanel() {
  const {
    currentUser,
    teachers,
    departments,
    trainingPlans,
    trainingPlanAssignments,
    addTrainingPlan,
    updateTrainingPlanStatus,
    assignTrainingPlan,
    removeTrainingPlanAssignment,
  } = useApp();

  const [isNewOpen, setIsNewOpen] = useState(false);
  const [selected, setSelected] = useState<TrainingPlan | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<TrainingPlanType>('continuous_development');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [location, setLocation] = useState('');
  const [facilitator, setFacilitator] = useState('');

  const [targetType, setTargetType] = useState<'teacher' | 'department'>('teacher');
  const [teacherId, setTeacherId] = useState('');
  const [departmentId, setDepartmentId] = useState('');

  useEffect(() => {
    const handleOpen = () => setIsNewOpen(true);
    window.addEventListener('open-hr-training-plan', handleOpen);
    return () => window.removeEventListener('open-hr-training-plan', handleOpen);
  }, []);

  const activeTeachers = useMemo(() => teachers.filter((t) => t.status === 'Active'), [teachers]);

  useEffect(() => {
    if (!teacherId && activeTeachers[0]) setTeacherId(activeTeachers[0].id);
  }, [activeTeachers, teacherId]);

  useEffect(() => {
    if (!departmentId && departments[0]) setDepartmentId(departments[0].id);
  }, [departments, departmentId]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setType('continuous_development');
    setStartDate('');
    setEndDate('');
    setLocation('');
    setFacilitator('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !startDate) return;
    addTrainingPlan({
      title: title.trim(),
      description: description.trim() || undefined,
      type,
      startDate,
      endDate: endDate || undefined,
      location: location.trim() || undefined,
      facilitator: facilitator.trim() || undefined,
      createdByName: currentUser?.displayName ?? 'HR Officer',
    });
    setIsNewOpen(false);
    resetForm();
  };

  const assignmentsForSelected = useMemo(
    () => (selected ? trainingPlanAssignments.filter((a) => a.trainingPlanId === selected.id) : []),
    [trainingPlanAssignments, selected],
  );

  const handleAssign = () => {
    if (!selected) return;
    if (targetType === 'teacher') {
      if (!teacherId) return;
      assignTrainingPlan(selected.id, {
        targetType: 'teacher',
        teacherId,
        assignedByName: currentUser?.displayName ?? 'HR Officer',
      });
    } else {
      if (!departmentId) return;
      assignTrainingPlan(selected.id, {
        targetType: 'department',
        departmentId,
        assignedByName: currentUser?.displayName ?? 'HR Officer',
      });
    }
  };

  const columns: DataTableColumn<TrainingPlan>[] = [
    {
      key: 'title',
      header: 'Training',
      sortable: true,
      render: (row) => (
        <div>
          <p className="text-xs font-semibold">{row.title}</p>
          {row.location && <p className="text-[11px] text-muted-foreground">{row.location}</p>}
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (row) => (
        <Badge variant={row.type === 'in_person' ? 'primary' : 'info'} size="sm">
          {TYPE_LABEL[row.type]}
        </Badge>
      ),
    },
    {
      key: 'startDate',
      header: 'Dates',
      sortable: true,
      render: (row) => (
        <span className="text-xs text-muted-foreground">
          {row.startDate}
          {row.endDate ? ` → ${row.endDate}` : ''}
        </span>
      ),
    },
    {
      key: 'assigned',
      header: 'Assigned',
      render: (row) => {
        const count = trainingPlanAssignments.filter((a) => a.trainingPlanId === row.id).length;
        return <span className="text-xs text-muted-foreground">{count}</span>;
      },
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (row) => (
        <Badge variant={statusVariant(row.status)} size="sm">
          {STATUS_LABEL[row.status]}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <Button variant="ghost" size="sm" className="text-[10px] h-7" onClick={() => setSelected(row)}>
          Manage
        </Button>
      ),
    },
  ];

  return (
    <TablePanel
      title="Training Planning"
      description="Schedule Continuous Development tracks or In-Person sessions and assign them to teachers or academic teams."
    >
      <DataTable columns={columns} data={trainingPlans} emptyTitle="No trainings planned yet." />

      <Dialog isOpen={isNewOpen} onClose={() => setIsNewOpen(false)} title="Plan a New Training">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Title</label>
            <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Type</label>
            <select className={inputClass} value={type} onChange={(e) => setType(e.target.value as TrainingPlanType)}>
              <option value="continuous_development">Continuous Development</option>
              <option value="in_person">In-Person Training Session</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Description</label>
            <textarea className={`${inputClass} h-16 py-2`} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Start Date</label>
              <input type="date" className={inputClass} value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
            </div>
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase">End Date (optional)</label>
              <input type="date" className={inputClass} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
          {type === 'in_person' && (
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Location</label>
              <input className={inputClass} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Main Campus Hall" />
            </div>
          )}
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Facilitator (optional)</label>
            <input className={inputClass} value={facilitator} onChange={(e) => setFacilitator(e.target.value)} placeholder="Trainer or lead" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => setIsNewOpen(false)}>Cancel</Button>
            <Button type="submit" variant="organic" size="sm">Create Plan</Button>
          </DialogFooter>
        </form>
      </Dialog>

      {selected && (
        <Dialog isOpen onClose={() => setSelected(null)} title={selected.title} size="lg">
          <div className="space-y-4 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={selected.type === 'in_person' ? 'primary' : 'info'} size="sm">
                {TYPE_LABEL[selected.type]}
              </Badge>
              <span className="text-muted-foreground">
                {selected.startDate}
                {selected.endDate ? ` → ${selected.endDate}` : ''}
              </span>
              {selected.location && <span className="text-muted-foreground">· {selected.location}</span>}
              {selected.facilitator && <span className="text-muted-foreground">· {selected.facilitator}</span>}
            </div>
            {selected.description && <p className="text-muted-foreground">{selected.description}</p>}

            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Status</label>
              <select
                className={inputClass}
                value={selected.status}
                onChange={(e) => {
                  const status = e.target.value as TrainingPlanStatus;
                  updateTrainingPlanStatus(selected.id, status);
                  setSelected({ ...selected, status });
                }}
              >
                <option value="planned">Planned</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="rounded-xl border border-border/50 p-3 space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                Assign teachers or academic teams
              </p>
              <div className="grid gap-3 sm:grid-cols-[auto_1fr_auto] items-end">
                <select
                  className={inputClass}
                  value={targetType}
                  onChange={(e) => setTargetType(e.target.value as 'teacher' | 'department')}
                >
                  <option value="teacher">Teacher</option>
                  <option value="department">Academic Team</option>
                </select>
                {targetType === 'teacher' ? (
                  <select className={inputClass} value={teacherId} onChange={(e) => setTeacherId(e.target.value)}>
                    {activeTeachers.length ? (
                      activeTeachers.map((t) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))
                    ) : (
                      <option value="">No active teachers</option>
                    )}
                  </select>
                ) : (
                  <select className={inputClass} value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
                    {departments.length ? (
                      departments.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))
                    ) : (
                      <option value="">No academic teams</option>
                    )}
                  </select>
                )}
                <Button size="sm" variant="organic" className="border-none text-xs h-10" onClick={handleAssign}>
                  Assign
                </Button>
              </div>

              {assignmentsForSelected.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {assignmentsForSelected.map((a) => {
                    const label =
                      a.targetType === 'teacher'
                        ? teachers.find((t) => t.id === a.teacherId)?.name ?? 'Unknown teacher'
                        : `${departments.find((d) => d.id === a.departmentId)?.name ?? 'Unknown team'} (team)`;
                    return (
                      <Badge key={a.id} variant="neutral" size="sm" className="gap-1.5">
                        {label}
                        <button
                          type="button"
                          className="text-muted-foreground hover:text-foreground"
                          onClick={() => removeTrainingPlanAssignment(a.id)}
                          aria-label={`Remove ${label}`}
                        >
                          ×
                        </button>
                      </Badge>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground">No one assigned yet.</p>
              )}
            </div>
          </div>
        </Dialog>
      )}
    </TablePanel>
  );
}
