'use client';

import React, { useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { TablePanel } from '@/components/dashboard/TablePanel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ContentCard } from '@/components/dashboard/ContentCard';
import { Dialog, DialogFooter } from '@/components/ui/dialog';
import { hrStatusBadgeVariant } from '@/lib/hrPortal';

const inputClass =
  'w-full h-10 px-3 bg-muted/40 border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring';

export const HrOnboarding: React.FC = () => {
  const { onboardingTasks, hrEmployees, addOnboardingTask, toggleOnboardingTask, addHrEmployee, currentUser } = useApp();
  const hrOfficerName = currentUser?.displayName ?? 'HR Officer';
  const [isNewEmployeeOpen, setIsNewEmployeeOpen] = useState(false);
  const [isTaskOpen, setIsTaskOpen] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [position, setPosition] = useState('Teacher Assistant');
  const [department, setDepartment] = useState('Administration');
  const [salary, setSalary] = useState('12000');

  const [taskEmployeeId, setTaskEmployeeId] = useState('');
  const [taskName, setTaskName] = useState('');
  const [taskAssignee, setTaskAssignee] = useState(hrOfficerName);
  const [taskDueDate, setTaskDueDate] = useState('');

  const probationEmployees = useMemo(
    () => hrEmployees.filter((e) => e.status === 'Probation'),
    [hrEmployees]
  );

  const groupedTasks = useMemo(() => {
    const groups: Record<string, typeof onboardingTasks> = {};
    for (const task of onboardingTasks) {
      if (!groups[task.employeeId]) groups[task.employeeId] = [];
      groups[task.employeeId].push(task);
    }
    return groups;
  }, [onboardingTasks]);

  const defaultOnboardingTasks = (employeeId: string, employeeName: string) => [
    { employeeId, employeeName, task: 'Employment contract signing', assignee: hrOfficerName, dueDate: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10) },
    { employeeId, employeeName, task: 'IT systems access setup', assignee: 'IT Support', dueDate: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10) },
    { employeeId, employeeName, task: 'Department orientation', assignee: 'Department Head', dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10) },
    { employeeId, employeeName, task: '90-day probation review', assignee: hrOfficerName, dueDate: new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10) },
  ];

  const handleOnboard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone) return;
    void addHrEmployee({
      name,
      email,
      phone,
      position,
      department,
      employmentType: 'Full-time',
      hireDate: new Date().toISOString().slice(0, 10),
      salary: Number(salary) || 0,
      status: 'Probation',
    }).then((employee) => {
      defaultOnboardingTasks(employee.id, name).forEach((t) => addOnboardingTask(t));
    });
    setIsNewEmployeeOpen(false);
    setName('');
    setEmail('');
    setPhone('');
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    const employee = hrEmployees.find((emp) => emp.id === taskEmployeeId);
    if (!employee || !taskName) return;
    addOnboardingTask({
      employeeId: taskEmployeeId,
      employeeName: employee.name,
      task: taskName,
      assignee: taskAssignee,
      dueDate: taskDueDate || new Date().toISOString().slice(0, 10),
    });
    setIsTaskOpen(false);
    setTaskName('');
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <Button variant="organic" size="sm" className="text-xs h-9" onClick={() => setIsNewEmployeeOpen(true)}>
          + Start Onboarding
        </Button>
        <Button variant="outline" size="sm" className="text-xs h-9" onClick={() => setIsTaskOpen(true)}>
          + Add Task
        </Button>
      </div>

      {probationEmployees.length > 0 && (
        <ContentCard title="Employees on Probation" description="New hires in onboarding period">
          <div className="flex flex-wrap gap-2">
            {probationEmployees.map((e) => (
              <Badge key={e.id} variant="warning" size="sm">{e.name} — {e.position}</Badge>
            ))}
          </div>
        </ContentCard>
      )}

      <TablePanel title="Onboarding Checklists">
        <div className="space-y-4">
          {Object.entries(groupedTasks).map(([empId, tasks]) => {
            const completed = tasks.filter((t) => t.completed).length;
            const employeeName = tasks[0]?.employeeName ?? 'Unknown';
            return (
              <div key={empId} className="p-4 rounded-lg border border-border/60 bg-muted/10">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-xs font-semibold">{employeeName}</p>
                    <p className="text-[10px] text-muted-foreground">{completed}/{tasks.length} tasks completed</p>
                  </div>
                  <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${(completed / tasks.length) * 100}%` }} />
                  </div>
                </div>
                <div className="space-y-1">
                  {tasks.map((task) => (
                    <label key={task.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/30 cursor-pointer">
                      <input type="checkbox" checked={task.completed} onChange={() => toggleOnboardingTask(task.id)} className="rounded" />
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs ${task.completed ? 'line-through text-muted-foreground' : 'font-medium'}`}>{task.task}</p>
                        <p className="text-[9px] text-muted-foreground">{task.assignee} · Due {task.dueDate}</p>
                      </div>
                      <Badge variant={task.completed ? hrStatusBadgeVariant('Completed') : hrStatusBadgeVariant('In Progress')} size="sm">
                        {task.completed ? 'Done' : 'Pending'}
                      </Badge>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </TablePanel>

      <Dialog isOpen={isNewEmployeeOpen} onClose={() => setIsNewEmployeeOpen(false)} title="Start Employee Onboarding">
        <form onSubmit={handleOnboard} className="space-y-3">
          <div><label className="text-[10px] font-bold text-muted-foreground uppercase">Full Name</label><input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required /></div>
          <div><label className="text-[10px] font-bold text-muted-foreground uppercase">Email</label><input type="email" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
          <div><label className="text-[10px] font-bold text-muted-foreground uppercase">Phone</label><input className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} required /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-[10px] font-bold text-muted-foreground uppercase">Position</label><input className={inputClass} value={position} onChange={(e) => setPosition(e.target.value)} /></div>
            <div><label className="text-[10px] font-bold text-muted-foreground uppercase">Department</label><input className={inputClass} value={department} onChange={(e) => setDepartment(e.target.value)} /></div>
          </div>
          <div><label className="text-[10px] font-bold text-muted-foreground uppercase">Salary (ETB)</label><input type="number" className={inputClass} value={salary} onChange={(e) => setSalary(e.target.value)} /></div>
          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => setIsNewEmployeeOpen(false)}>Cancel</Button>
            <Button type="submit" variant="organic" size="sm">Onboard & Create Checklist</Button>
          </DialogFooter>
        </form>
      </Dialog>

      <Dialog isOpen={isTaskOpen} onClose={() => setIsTaskOpen(false)} title="Add Onboarding Task">
        <form onSubmit={handleAddTask} className="space-y-3">
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Employee</label>
            <select className={inputClass} value={taskEmployeeId} onChange={(e) => setTaskEmployeeId(e.target.value)} required>
              <option value="">Select</option>
              {hrEmployees.filter((e) => e.status === 'Probation' || e.status === 'Active').map((e) => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
          </div>
          <div><label className="text-[10px] font-bold text-muted-foreground uppercase">Task</label><input className={inputClass} value={taskName} onChange={(e) => setTaskName(e.target.value)} required /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-[10px] font-bold text-muted-foreground uppercase">Assignee</label><input className={inputClass} value={taskAssignee} onChange={(e) => setTaskAssignee(e.target.value)} /></div>
            <div><label className="text-[10px] font-bold text-muted-foreground uppercase">Due Date</label><input type="date" className={inputClass} value={taskDueDate} onChange={(e) => setTaskDueDate(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => setIsTaskOpen(false)}>Cancel</Button>
            <Button type="submit" variant="organic" size="sm">Add Task</Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
};
