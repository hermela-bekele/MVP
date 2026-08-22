'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { EmptyState } from '@/components/ui/empty-state';
import { useConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  UserX,
  Phone,
  Mail,
  Calendar,
  Briefcase,
  Building2,
  IdCard,
  CheckCircle2,
  Wallet,
  Trash2,
  Pencil,
  RotateCcw,
  Info,
} from 'lucide-react';
import type { HrEmployee } from '@/lib/hrPortal';
import {
  hrStatusBadgeVariant,
  formatCurrency,
  HR_DEPARTMENTS,
  HR_POSITIONS,
  HR_TEACHER_LINKED_POSITIONS,
} from '@/lib/hrPortal';
import { DetailField } from '@/components/dashboard/shared/DetailField';

const inputClass =
  'w-full h-10 px-3 bg-muted/40 border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring';

interface HrEmployeeDetailProps {
  employeeId: string;
}

export const HrEmployeeDetail: React.FC<HrEmployeeDetailProps> = ({ employeeId }) => {
  const router = useRouter();
  const { hrEmployees, teachers, updateHrEmployee, toggleHrEmployeeStatus } = useApp();
  const { confirm, ConfirmDialog } = useConfirmDialog();

  const employee = useMemo(() => hrEmployees.find((e) => e.id === employeeId), [hrEmployees, employeeId]);
  const [mode, setMode] = useState<'view' | 'edit'>('view');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [position, setPosition] = useState('Teacher');
  const [department, setDepartment] = useState('Administration');
  const [employmentType, setEmploymentType] = useState<HrEmployee['employmentType']>('Full-time');
  const [hireDate, setHireDate] = useState('');
  const [salary, setSalary] = useState('15000');
  const [manager, setManager] = useState('');
  const [teacherId, setTeacherId] = useState('');

  const isTeacherLinkedPosition = HR_TEACHER_LINKED_POSITIONS.includes(position);

  useEffect(() => {
    if (!employee) return;
    setName(employee.name);
    setEmail(employee.email);
    setPhone(employee.phone);
    setPosition(employee.position);
    setDepartment(employee.department);
    setEmploymentType(employee.employmentType);
    setHireDate(employee.hireDate);
    setSalary(String(employee.salary));
    setManager(employee.manager ?? '');
    setTeacherId(employee.teacherId ?? '');
  }, [employee]);

  if (!employee) {
    return (
      <EmptyState
        icon={<UserX />}
        title="Employee not found"
        description="This employee record may have been removed."
        action={
          <Button size="sm" onClick={() => router.push('/dashboard/hr/employees')}>
            Back to directory
          </Button>
        }
      />
    );
  }

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    updateHrEmployee(employee.id, {
      name,
      email,
      phone,
      position,
      department,
      employmentType,
      hireDate,
      salary: Number(salary) || 0,
      manager: manager || undefined,
      teacherId: isTeacherLinkedPosition && teacherId ? teacherId : undefined,
    });
    setMode('view');
  };

  const isActive = employee.status === 'Active';
  const isTerminated = employee.status === 'Terminated';

  const handleToggleStatus = async () => {
    const ok = await confirm(isActive ? `Terminate ${employee.name}?` : `Reactivate ${employee.name}?`, {
      description: isActive
        ? 'This marks the employee as terminated and can be reversed later, but should only be done deliberately.'
        : undefined,
      confirmLabel: isActive ? 'Terminate' : 'Reactivate',
      danger: isActive,
    });
    if (ok) toggleHrEmployeeStatus(employee.id);
  };

  if (mode === 'edit') {
    return (
      <form onSubmit={handleUpdate} className="w-full space-y-4">
        <div className="rounded-xl border border-border/60 bg-card p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div><label className="text-[10px] font-bold text-muted-foreground uppercase">Full Name</label><input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required /></div>
            <div><label className="text-[10px] font-bold text-muted-foreground uppercase">Email</label><input type="email" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
            <div><label className="text-[10px] font-bold text-muted-foreground uppercase">Phone</label><input className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} required /></div>
            <div><label className="text-[10px] font-bold text-muted-foreground uppercase">Position</label><select className={inputClass} value={position} onChange={(e) => setPosition(e.target.value)}>{HR_POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}</select></div>
            <div><label className="text-[10px] font-bold text-muted-foreground uppercase">Department</label><select className={inputClass} value={department} onChange={(e) => setDepartment(e.target.value)}>{HR_DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}</select></div>
            <div><label className="text-[10px] font-bold text-muted-foreground uppercase">Employment Type</label><select className={inputClass} value={employmentType} onChange={(e) => setEmploymentType(e.target.value as HrEmployee['employmentType'])}><option value="Full-time">Full-time</option><option value="Part-time">Part-time</option><option value="Contract">Contract</option><option value="Intern">Intern</option></select></div>
            <div><label className="text-[10px] font-bold text-muted-foreground uppercase">Hire Date</label><input type="date" className={inputClass} value={hireDate} onChange={(e) => setHireDate(e.target.value)} /></div>
            <div><label className="text-[10px] font-bold text-muted-foreground uppercase">Monthly Salary (ETB)</label><input type="number" className={inputClass} value={salary} onChange={(e) => setSalary(e.target.value)} /></div>
            <div className="sm:col-span-2"><label className="text-[10px] font-bold text-muted-foreground uppercase">Manager</label><input className={inputClass} value={manager} onChange={(e) => setManager(e.target.value)} placeholder="Reporting manager" /></div>
            {isTeacherLinkedPosition && (
              <div className="sm:col-span-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Linked Instructional Record</label>
                <select className={inputClass} value={teacherId} onChange={(e) => setTeacherId(e.target.value)}>
                  <option value="">— Not linked to a teacher roster record —</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>{t.name} ({t.subjects.join(', ') || 'no subjects set'})</option>
                  ))}
                </select>
                <p className="text-[9px] text-muted-foreground mt-1">
                  Linking keeps this HR record and the instructor&apos;s teaching profile (subjects, grades, training) in sync — leave status here mirrors to the linked record.
                </p>
              </div>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setMode('view')}>Cancel</Button>
          <Button type="submit" variant="organic" size="sm" className="border-none gap-1.5">
            <Pencil className="h-3.5 w-3.5" aria-hidden />
            Save Changes
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Profile header */}
      <div className="rounded-xl border border-border/60 bg-card p-5 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <Avatar name={employee.name} size="lg" />
            <div className="space-y-1.5">
              <p className="text-lg font-bold text-foreground leading-tight">{employee.name}</p>
              <Badge variant={hrStatusBadgeVariant(employee.status)} badgeStyle="subtle" size="sm" dot>
                {employee.status}
              </Badge>
              <div className="flex flex-col gap-1 pt-0.5 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Briefcase className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  {employee.position}
                </span>
                <span className="flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  Department: {employee.department}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 text-xs text-muted-foreground sm:items-end sm:text-right shrink-0">
            <span className="flex items-center gap-1.5 sm:flex-row-reverse">
              <Phone className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {employee.phone}
            </span>
            <span className="flex items-center gap-1.5 sm:flex-row-reverse">
              <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {employee.email}
            </span>
            <span className="flex items-center gap-1.5 sm:flex-row-reverse">
              <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden />
              Joined: {employee.hireDate}
            </span>
          </div>
        </div>
      </div>

      {/* Employee information grid */}
      <div className="rounded-xl border border-border/60 bg-card p-5 sm:p-6 space-y-4">
        <h3 className="text-sm font-bold text-foreground">Employee Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          <DetailField icon={<IdCard />} label="Employee ID" value={<span className="font-mono">{employee.employeeId}</span>} />
          <DetailField
            icon={<CheckCircle2 />}
            label="Status"
            value={employee.status}
            tone={isActive ? 'success' : isTerminated ? 'danger' : 'default'}
          />
          <DetailField icon={<Mail />} label="Email" value={employee.email} />
          <DetailField icon={<Phone />} label="Phone" value={employee.phone} />
          <DetailField icon={<Building2 />} label="Department" value={employee.department} />
          <DetailField icon={<Wallet />} label="Salary" value={formatCurrency(employee.salary)} />
        </div>

        {employee.teacherId && (
          <div className="pt-1">
            <DetailField
              icon={<Briefcase />}
              label="Linked Instructional Record"
              value={teachers.find((t) => t.id === employee.teacherId)?.name ?? 'Linked record not found'}
            />
          </div>
        )}

        <div
          className={`flex items-start gap-2.5 rounded-lg border p-3.5 text-xs ${
            isActive
              ? 'border-primary/20 bg-primary/5 text-foreground'
              : isTerminated
                ? 'border-destructive/20 bg-destructive/5 text-foreground'
                : 'border-border bg-muted/30 text-foreground'
          }`}
        >
          <Info className={`h-4 w-4 shrink-0 mt-0.5 ${isActive ? 'text-primary' : isTerminated ? 'text-destructive' : 'text-muted-foreground'}`} aria-hidden />
          <p>
            {isActive && 'This employee is currently active and has access to the HR portal.'}
            {isTerminated && 'This employee has been terminated and no longer has active portal access.'}
            {!isActive && !isTerminated && `This employee's current status is ${employee.status.toLowerCase()}.`}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap justify-end gap-2">
        <Button
          variant={isActive ? 'destructive' : 'outline'}
          size="sm"
          className="gap-1.5"
          onClick={() => void handleToggleStatus()}
        >
          {isActive ? <Trash2 className="h-3.5 w-3.5" aria-hidden /> : <RotateCcw className="h-3.5 w-3.5" aria-hidden />}
          {isActive ? 'Terminate Employee' : 'Reactivate Employee'}
        </Button>
        <Button variant="organic" size="sm" className="border-none gap-1.5" onClick={() => setMode('edit')}>
          <Pencil className="h-3.5 w-3.5" aria-hidden />
          Edit Employee
        </Button>
      </div>
      {ConfirmDialog}
    </div>
  );
};
