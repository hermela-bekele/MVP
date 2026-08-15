'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { TablePanel } from '@/components/dashboard/TablePanel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { Dialog, DialogFooter } from '@/components/ui/dialog';
import type { DataTableColumn } from '@/components/ui/data-table';
import type { HrEmployee } from '@/lib/hrPortal';
import {
  filterSchoolEmployees,
  hrStatusBadgeVariant,
  formatCurrency,
  HR_DEPARTMENTS,
  HR_POSITIONS,
  HR_TEACHER_LINKED_POSITIONS,
} from '@/lib/hrPortal';

const inputClass =
  'w-full h-10 px-3 bg-muted/40 border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring';

export const HrEmployeeDirectory: React.FC = () => {
  const { hrEmployees, teachers, addHrEmployee, updateHrEmployee, toggleHrEmployeeStatus } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [detailEmployee, setDetailEmployee] = useState<HrEmployee | null>(null);
  const [detailMode, setDetailMode] = useState<'view' | 'edit' | null>(null);
  const [search, setSearch] = useState('');

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

  const employees = useMemo(() => filterSchoolEmployees(hrEmployees), [hrEmployees]);
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return employees;
    return employees.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.employeeId.toLowerCase().includes(q) ||
        e.position.toLowerCase().includes(q) ||
        e.department.toLowerCase().includes(q)
    );
  }, [employees, search]);

  useEffect(() => {
    const handleOpen = () => setIsModalOpen(true);
    window.addEventListener('open-hr-employee', handleOpen);
    return () => window.removeEventListener('open-hr-employee', handleOpen);
  }, []);

  const resetForm = () => {
    setName('');
    setEmail('');
    setPhone('');
    setPosition('Teacher');
    setDepartment('Administration');
    setEmploymentType('Full-time');
    setHireDate('');
    setSalary('15000');
    setManager('');
    setTeacherId('');
  };

  const loadForm = (emp: HrEmployee) => {
    setName(emp.name);
    setEmail(emp.email);
    setPhone(emp.phone);
    setPosition(emp.position);
    setDepartment(emp.department);
    setEmploymentType(emp.employmentType);
    setHireDate(emp.hireDate);
    setSalary(String(emp.salary));
    setManager(emp.manager ?? '');
    setTeacherId(emp.teacherId ?? '');
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone) return;
    void addHrEmployee({
      name,
      email,
      phone,
      position,
      department,
      employmentType,
      hireDate: hireDate || new Date().toISOString().slice(0, 10),
      salary: Number(salary) || 0,
      status: 'Active',
      manager: manager || undefined,
      teacherId: isTeacherLinkedPosition && teacherId ? teacherId : undefined,
    });
    resetForm();
    setIsModalOpen(false);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!detailEmployee) return;
    updateHrEmployee(detailEmployee.id, {
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
    closeDetail();
  };

  const closeDetail = () => {
    setDetailEmployee(null);
    setDetailMode(null);
  };

  const columns: DataTableColumn<HrEmployee>[] = [
    {
      key: 'employeeId',
      header: 'ID / Name',
      sortable: true,
      render: (row) => (
        <div>
          <p className="text-xs font-semibold text-foreground">{row.name}</p>
          <p className="text-[9px] text-muted-foreground">{row.employeeId}</p>
        </div>
      ),
    },
    {
      key: 'position',
      header: 'Position',
      render: (row) => (
        <div>
          <p className="text-[11px] font-medium">{row.position}</p>
          <p className="text-[9px] text-muted-foreground">{row.department}</p>
        </div>
      ),
    },
    {
      key: 'employmentType',
      header: 'Type',
      render: (row) => (
        <Badge variant="neutral" size="sm">
          {row.employmentType}
        </Badge>
      ),
    },
    {
      key: 'salary',
      header: 'Salary',
      sortable: true,
      render: (row) => <span className="text-xs">{formatCurrency(row.salary)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (row) => (
        <Badge variant={hrStatusBadgeVariant(row.status)} size="sm">
          {row.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" className="text-[10px] h-7" onClick={() => { setDetailEmployee(row); loadForm(row); setDetailMode('view'); }}>
            View
          </Button>
          <Button variant="ghost" size="sm" className="text-[10px] h-7" onClick={() => { setDetailEmployee(row); loadForm(row); setDetailMode('edit'); }}>
            Edit
          </Button>
        </div>
      ),
    },
  ];

  const formFields = (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
  );

  return (
    <TablePanel
      title="Employee Directory"
      description="Complete staff records — teaching and non-teaching personnel"
      actions={
        <input
          className="h-9 px-3 bg-muted/40 border border-border rounded-md text-xs w-48"
          placeholder="Search employees..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      }
    >
      <DataTable columns={columns} data={filtered} emptyTitle="No employees found." />

      <Dialog isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Employee">
        <form onSubmit={handleAdd} className="space-y-4">
          {formFields}
          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="organic" size="sm">Add Employee</Button>
          </DialogFooter>
        </form>
      </Dialog>

      {detailEmployee && detailMode === 'view' && (
        <Dialog isOpen onClose={closeDetail} title={detailEmployee.name}>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div><p className="text-[10px] text-muted-foreground uppercase">Employee ID</p><p className="font-medium">{detailEmployee.employeeId}</p></div>
            <div><p className="text-[10px] text-muted-foreground uppercase">Status</p><Badge variant={hrStatusBadgeVariant(detailEmployee.status)} size="sm">{detailEmployee.status}</Badge></div>
            <div><p className="text-[10px] text-muted-foreground uppercase">Email</p><p className="font-medium">{detailEmployee.email}</p></div>
            <div><p className="text-[10px] text-muted-foreground uppercase">Phone</p><p className="font-medium">{detailEmployee.phone}</p></div>
            <div><p className="text-[10px] text-muted-foreground uppercase">Position</p><p className="font-medium">{detailEmployee.position}</p></div>
            <div><p className="text-[10px] text-muted-foreground uppercase">Department</p><p className="font-medium">{detailEmployee.department}</p></div>
            <div><p className="text-[10px] text-muted-foreground uppercase">Hire Date</p><p className="font-medium">{detailEmployee.hireDate}</p></div>
            <div><p className="text-[10px] text-muted-foreground uppercase">Salary</p><p className="font-medium">{formatCurrency(detailEmployee.salary)}</p></div>
            {detailEmployee.teacherId && (
              <div className="col-span-2">
                <p className="text-[10px] text-muted-foreground uppercase">Linked Instructional Record</p>
                <p className="font-medium">
                  {teachers.find((t) => t.id === detailEmployee.teacherId)?.name ?? 'Linked record not found'}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => toggleHrEmployeeStatus(detailEmployee.id)}>
              {detailEmployee.status === 'Active' ? 'Terminate' : 'Reactivate'}
            </Button>
            <Button variant="organic" size="sm" onClick={() => setDetailMode('edit')}>Edit</Button>
          </DialogFooter>
        </Dialog>
      )}

      {detailEmployee && detailMode === 'edit' && (
        <Dialog isOpen onClose={closeDetail} title={`Edit — ${detailEmployee.name}`}>
          <form onSubmit={handleUpdate} className="space-y-4">
            {formFields}
            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={closeDetail}>Cancel</Button>
              <Button type="submit" variant="organic" size="sm">Save Changes</Button>
            </DialogFooter>
          </form>
        </Dialog>
      )}
    </TablePanel>
  );
};
