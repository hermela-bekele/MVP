'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { TablePanel } from '@/components/dashboard/TablePanel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Avatar } from '@/components/ui/avatar';
import { DataTable } from '@/components/ui/data-table';
import type { DataTableColumn } from '@/components/ui/data-table';
import { Dialog, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu } from '@/components/ui/dropdown-menu';
import { useConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  Users,
  UserCheck,
  CalendarClock,
  Clock,
  UserX,
  Eye,
  MoreVertical,
  Ban,
  RotateCcw,
} from 'lucide-react';
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

interface StatTileProps {
  icon: React.ReactNode;
  value: number;
  label: string;
  hint: string;
  tone: 'primary' | 'success' | 'info' | 'warning' | 'danger';
}

const toneClasses: Record<StatTileProps['tone'], string> = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  info: 'bg-sky-500/10 text-sky-600',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-destructive/10 text-destructive',
};

const StatTile: React.FC<StatTileProps> = ({ icon, value, label, hint, tone }) => (
  <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-3.5">
    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${toneClasses[tone]}`}>
      <span className="[&>svg]:h-5 [&>svg]:w-5">{icon}</span>
    </div>
    <div className="min-w-0">
      <p className="text-xl font-bold leading-tight text-foreground tabular-nums">{value}</p>
      <p className="text-xs font-semibold leading-tight text-foreground truncate">{label}</p>
      <p className="text-[10px] leading-tight text-muted-foreground truncate">{hint}</p>
    </div>
  </div>
);

export const HrEmployeeDirectory: React.FC = () => {
  const router = useRouter();
  const { hrEmployees, teachers, addHrEmployee, toggleHrEmployeeStatus } = useApp();
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState<HrEmployee['status'] | 'All'>('All');
  const [typeFilter, setTypeFilter] = useState<HrEmployee['employmentType'] | 'All'>('All');

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

  const stats = useMemo(
    () => ({
      total: employees.length,
      active: employees.filter((e) => e.status === 'Active').length,
      onLeave: employees.filter((e) => e.status === 'On Leave').length,
      probation: employees.filter((e) => e.status === 'Probation').length,
      terminated: employees.filter((e) => e.status === 'Terminated').length,
    }),
    [employees]
  );

  const filtered = useMemo(() => {
    return employees.filter((e) => {
      const matchesDept = departmentFilter === 'All' || e.department === departmentFilter;
      const matchesStatus = statusFilter === 'All' || e.status === statusFilter;
      const matchesType = typeFilter === 'All' || e.employmentType === typeFilter;
      return matchesDept && matchesStatus && matchesType;
    });
  }, [employees, departmentFilter, statusFilter, typeFilter]);

  const filtersActive = departmentFilter !== 'All' || statusFilter !== 'All' || typeFilter !== 'All';

  const clearFilters = () => {
    setDepartmentFilter('All');
    setStatusFilter('All');
    setTypeFilter('All');
  };

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

  const handleToggleStatus = async (employee: HrEmployee) => {
    const isTerminate = employee.status === 'Active';
    const ok = await confirm(
      isTerminate ? `Terminate ${employee.name}?` : `Reactivate ${employee.name}?`,
      {
        description: isTerminate
          ? 'This marks the employee as terminated and can be reversed later, but should only be done deliberately.'
          : undefined,
        confirmLabel: isTerminate ? 'Terminate' : 'Reactivate',
        danger: isTerminate,
      }
    );
    if (ok) toggleHrEmployeeStatus(employee.id);
  };

  const columns: DataTableColumn<HrEmployee>[] = [
    {
      key: 'name',
      header: 'Employee',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={row.name} size="sm" />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-foreground truncate">{row.name}</p>
            <p className="text-[9px] text-muted-foreground font-mono">{row.employeeId}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'position',
      header: 'Position',
      sortable: true,
      render: (row) => <span className="text-xs font-medium text-foreground">{row.position}</span>,
    },
    {
      key: 'department',
      header: 'Department',
      sortable: true,
      render: (row) => <span className="text-xs text-muted-foreground">{row.department}</span>,
    },
    {
      key: 'employmentType',
      header: 'Type',
      render: (row) => (
        <Badge variant="neutral" badgeStyle="subtle" size="sm">
          {row.employmentType}
        </Badge>
      ),
    },
    {
      key: 'salary',
      header: 'Salary',
      sortable: true,
      render: (row) => <span className="text-xs font-semibold">{formatCurrency(row.salary)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (row) => (
        <Badge variant={hrStatusBadgeVariant(row.status)} badgeStyle="subtle" size="sm" dot>
          {row.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      sortable: false,
      render: (row) => (
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            className="text-[10px] h-7 gap-1"
            onClick={() => router.push(`/dashboard/hr/employees/${row.id}`)}
          >
            <Eye className="h-3 w-3" aria-hidden />
            View
          </Button>
          <DropdownMenu
            align="right"
            trigger={
              <span className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                <MoreVertical className="h-3.5 w-3.5" aria-hidden />
              </span>
            }
            sections={[
              {
                items: [
                  {
                    id: 'view',
                    label: 'View / Edit',
                    icon: <Eye className="h-3.5 w-3.5" aria-hidden />,
                    onClick: () => router.push(`/dashboard/hr/employees/${row.id}`),
                  },
                  {
                    id: 'toggle-status',
                    label: row.status === 'Active' ? 'Terminate' : 'Reactivate',
                    icon:
                      row.status === 'Active' ? (
                        <Ban className="h-3.5 w-3.5" aria-hidden />
                      ) : (
                        <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                      ),
                    danger: row.status === 'Active',
                    onClick: () => void handleToggleStatus(row),
                  },
                ],
              },
            ]}
          />
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
    <div className="space-y-5 animate-fade-in">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatTile icon={<Users />} value={stats.total} label="Total Employees" hint="All staff members" tone="primary" />
        <StatTile icon={<UserCheck />} value={stats.active} label="Active" hint="Currently working" tone="success" />
        <StatTile icon={<CalendarClock />} value={stats.onLeave} label="On Leave" hint="Currently on leave" tone="info" />
        <StatTile icon={<Clock />} value={stats.probation} label="Probation" hint="Under probation" tone="warning" />
        <StatTile icon={<UserX />} value={stats.terminated} label="Terminated" hint="No longer active" tone="danger" />
      </div>

      <TablePanel
        title="Employee Directory"
        description="Manage staff records for teaching and non-teaching personnel."
        actions={
          <Button size="sm" onClick={() => setIsModalOpen(true)}>
            + Add Employee
          </Button>
        }
      >
        <div className="flex flex-wrap items-end gap-2 mb-4">
          <div className="w-40">
            <Select
              options={[{ value: 'All', label: 'All Departments' }, ...HR_DEPARTMENTS.map((d) => ({ value: d, label: d }))]}
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
            />
          </div>
          <div className="w-36">
            <Select
              options={[
                { value: 'All', label: 'All Statuses' },
                { value: 'Active', label: 'Active' },
                { value: 'On Leave', label: 'On Leave' },
                { value: 'Probation', label: 'Probation' },
                { value: 'Terminated', label: 'Terminated' },
              ]}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as HrEmployee['status'] | 'All')}
            />
          </div>
          <div className="w-32">
            <Select
              options={[
                { value: 'All', label: 'All Types' },
                { value: 'Full-time', label: 'Full-time' },
                { value: 'Part-time', label: 'Part-time' },
                { value: 'Contract', label: 'Contract' },
                { value: 'Intern', label: 'Intern' },
              ]}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as HrEmployee['employmentType'] | 'All')}
            />
          </div>
          {filtersActive && (
            <Button type="button" variant="outline" size="sm" className="h-10 text-xs" onClick={clearFilters}>
              Clear Filters
            </Button>
          )}
        </div>

        <DataTable
          columns={columns}
          data={filtered}
          searchable
          searchKeys={['name', 'employeeId', 'position', 'department']}
          pageSize={10}
          pageSizeOptions={[10, 25, 50]}
          entityLabel="employees"
          emptyTitle="No employees found."
          emptyDescription="Try adjusting your search or filters."
        />
      </TablePanel>

      <Dialog isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Employee">
        <form onSubmit={handleAdd} className="space-y-4">
          {formFields}
          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="organic" size="sm">Add Employee</Button>
          </DialogFooter>
        </form>
      </Dialog>
      {ConfirmDialog}
    </div>
  );
};
