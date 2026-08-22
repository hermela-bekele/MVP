'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { TablePanel } from '@/components/dashboard/TablePanel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { DataTable } from '@/components/ui/data-table';
import { Dialog, DialogFooter } from '@/components/ui/dialog';
import type { DataTableColumn } from '@/components/ui/data-table';
import type { Teacher } from '@/lib/mockData';
import { DetailField } from '@/components/dashboard/shared/DetailField';

const inputClass =
  'w-full h-10 px-3 bg-muted/40 border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring';

function subjectToDeptId(subject: string) {
  if (subject === 'Mathematics') return 'dept-math';
  if (subject === 'Chemistry') return 'dept-chem';
  return 'dept-stem';
}

export const EmployeeManagement: React.FC<{ readOnly?: boolean }> = ({ readOnly = false }) => {
  const router = useRouter();
  const { teachers, addTeacher, updateTeacher, toggleTeacherStatus } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [detailTeacher, setDetailTeacher] = useState<Teacher | null>(null);
  const [detailMode, setDetailMode] = useState<'view' | 'edit' | null>(null);

  // Form States
  const [employeeName, setEmployeeName] = useState('');
  const [employeeEmail, setEmployeeEmail] = useState('');
  const [employeePhone, setEmployeePhone] = useState('');
  const [employeeSubject, setEmployeeSubject] = useState('Biology');
  const [employeeGrade, setEmployeeGrade] = useState('Grade 9');
  const [employeeCert, setEmployeeCert] = useState('Professional License A');

  // Filter teachers for this school
  const schoolTeachers = React.useMemo(() => {
    return teachers.filter(t => t.schoolId === 'sch-1');
  }, [teachers]);

  // Handle external open event
  useEffect(() => {
    if (readOnly) return;
    const handleOpenModal = () => {
      setIsModalOpen(true);
    };
    window.addEventListener('open-onboard-modal', handleOpenModal);
    return () => window.removeEventListener('open-onboard-modal', handleOpenModal);
  }, [readOnly]);

  const loadEmployeeForm = (teacher: Teacher) => {
    setEmployeeName(teacher.name);
    setEmployeeEmail(teacher.email);
    setEmployeePhone(teacher.phone);
    setEmployeeSubject(teacher.subjects[0] ?? 'Biology');
    setEmployeeGrade(teacher.grades[0] ?? 'Grade 9');
    setEmployeeCert(teacher.certification);
  };

  const openEmployeeView = (teacher: Teacher) => {
    setDetailTeacher(teacher);
    loadEmployeeForm(teacher);
    setDetailMode('view');
  };

  const openEmployeeEdit = (teacher: Teacher) => {
    setDetailTeacher(teacher);
    loadEmployeeForm(teacher);
    setDetailMode('edit');
  };

  const closeEmployeeDetail = () => {
    setDetailTeacher(null);
    setDetailMode(null);
  };

  const handleOnboardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeName || !employeeEmail || !employeePhone) return;

    const deptId = subjectToDeptId(employeeSubject);

    addTeacher({
      name: employeeName,
      email: employeeEmail,
      phone: employeePhone,
      subjects: [employeeSubject],
      grades: [employeeGrade],
      certification: employeeCert,
      schoolId: 'sch-1',
      departmentId: deptId,
      yearsOfExperience: 0,
    });

    // Reset Form
    setEmployeeName('');
    setEmployeeEmail('');
    setEmployeePhone('');
    
    // Close Modal
    setIsModalOpen(false);
  };

  const handleDetailSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!detailTeacher || !employeeName || !employeeEmail || !employeePhone) return;

    updateTeacher(detailTeacher.id, {
      name: employeeName,
      email: employeeEmail,
      phone: employeePhone,
      subjects: [employeeSubject],
      grades: [employeeGrade],
      certification: employeeCert,
      departmentId: subjectToDeptId(employeeSubject),
    });
    closeEmployeeDetail();
  };

  const employeeColumns: DataTableColumn<Teacher>[] = [
    {
      key: 'name',
      header: 'Instructor Name',
      sortable: true,
      render: (row) => (
        <div className="flex items-center space-x-2.5">
          <Avatar name={row.name} size="sm" />
          <div className="flex flex-col text-left">
            <span className="font-semibold text-foreground text-xs">{row.name}</span>
            <span className="text-[9px] text-muted-foreground">{row.email}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'subjects',
      header: 'Primary Subject',
      sortable: true,
      render: (row) => (
        <Badge variant="primary" size="sm" className="font-medium bg-accent/10 border-accent/20 text-accent">
          {row.subjects[0] ?? '—'}
        </Badge>
      ),
    },
    {
      key: 'grades',
      header: 'Grade Assignment',
      sortable: true,
      render: (row) => (
        <span className="text-xs text-foreground font-medium">{row.grades.join(', ')}</span>
      ),
    },
    {
      key: 'certification',
      header: 'Accreditation',
      render: (row) => (
        <span className="text-xxs font-mono bg-muted border border-border/40 px-2 py-0.5 rounded text-muted-foreground">
          {row.certification}
        </span>
      ),
    },
    {
      key: 'trainingProgress',
      header: 'MOE Training',
      sortable: true,
      render: (row) => (
        <span className="text-xs font-semibold text-primary">{row.trainingProgress}% Complete</span>
      ),
    },
    {
      key: 'status',
      header: 'Roster Status',
      sortable: true,
      render: (row) => (
        <Badge variant={row.status === 'Active' ? 'success' : 'neutral'} size="sm">
          {row.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              readOnly
                ? router.push(`/dashboard/school-head/manage-employees/${row.id}`)
                : openEmployeeView(row)
            }
            className="text-[10px] h-7 px-2"
          >
            View
          </Button>
          {!readOnly && (
            <Button
              type="button"
              variant="organic"
              size="sm"
              onClick={() => openEmployeeEdit(row)}
              className="text-[10px] h-7 px-2 border-none"
            >
              Edit
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <TablePanel
        title="Instructional Staff Roster"
        description="Monitor educational practitioners and curriculum licenses"
      >
          <DataTable<Teacher>
            columns={employeeColumns}
            data={schoolTeachers}
            searchable
            searchKeys={['name', 'subjects', 'email']}
            pageSize={10}
          />
      </TablePanel>

      {/* Onboard Instructor dialog Modal */}
      {!readOnly && (
      <Dialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Onboard Instructor Profile"
        size="lg"
      >
        <form onSubmit={handleOnboardSubmit} className="space-y-4 pt-2">
          
          {/* Section 1 */}
          <div className="space-y-2.5">
            <h4 className="text-[10px] font-bold text-primary uppercase tracking-wider">Employee Coordinates</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ato Demis"
                  value={employeeName}
                  onChange={(e) => setEmployeeName(e.target.value)}
                  className="w-full h-10 px-3 bg-muted/40 border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. instructor@school.edu.et"
                  value={employeeEmail}
                  onChange={(e) => setEmployeeEmail(e.target.value)}
                  className="w-full h-10 px-3 bg-muted/40 border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Mobile Phone</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. +251-912-345678"
                  value={employeePhone}
                  onChange={(e) => setEmployeePhone(e.target.value)}
                  className="w-full h-10 px-3 bg-muted/40 border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
          </div>

          <hr className="border-border/30" />

          {/* Section 2 */}
          <div className="space-y-2.5">
            <h4 className="text-[10px] font-bold text-accent uppercase tracking-wider">Instructional Allocation</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Primary Subject Domain</label>
                <select
                  value={employeeSubject}
                  onChange={(e) => setEmployeeSubject(e.target.value)}
                  className="w-full h-10 px-3 bg-muted/45 border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="Biology">Biology Science</option>
                  <option value="Chemistry">Chemistry Science</option>
                  <option value="Physics">Physics Science</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="English Language">English Language</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Grade Level Allocation</label>
                <select
                  value={employeeGrade}
                  onChange={(e) => setEmployeeGrade(e.target.value)}
                  className="w-full h-10 px-3 bg-muted/45 border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="Grade 9">Grade 9</option>
                  <option value="Grade 10">Grade 10</option>
                  <option value="Grade 11">Grade 11</option>
                  <option value="Grade 12">Grade 12</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">MOE License Classification</label>
                <select
                  value={employeeCert}
                  onChange={(e) => setEmployeeCert(e.target.value)}
                  className="w-full h-10 px-3 bg-muted/45 border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="Professional License A">Professional License A</option>
                  <option value="Professional License B">Professional License B</option>
                  <option value="Expert Educator License">Expert Educator License</option>
                  <option value="Novice Teaching Permit">Novice Teaching Permit</option>
                </select>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-6 border-t border-border/20 pt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
              className="text-xs h-9"
            >
              Cancel Profile
            </Button>
            <Button
              type="submit"
              variant="organic"
              size="sm"
              className="text-xs h-9 border-none font-semibold"
            >
              Complete Roster Onboarding
            </Button>
          </DialogFooter>

        </form>
      </Dialog>
      )}

      <Dialog
        isOpen={detailTeacher !== null && detailMode !== null}
        onClose={closeEmployeeDetail}
        title={detailMode === 'edit' ? 'Edit Instructor Record' : 'Instructor Record'}
        description={detailTeacher ? detailTeacher.email : undefined}
        size="xl"
      >
        {detailTeacher && detailMode === 'view' && (
          <div className="space-y-5 pt-2">
            <div className="flex items-center gap-3 pb-3 border-b border-border/40">
              <Avatar name={detailTeacher.name} size="md" />
              <div>
                <p className="text-sm font-bold text-foreground">{detailTeacher.name}</p>
                <Badge variant={detailTeacher.status === 'Active' ? 'success' : 'neutral'} size="sm" className="mt-1">
                  {detailTeacher.status}
                </Badge>
              </div>
            </div>

            <div className="space-y-2.5">
              <h4 className="text-[10px] font-bold text-primary uppercase tracking-wider">Contact & credentials</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <DetailField label="Email" value={detailTeacher.email} />
                <DetailField label="Mobile phone" value={detailTeacher.phone} />
                <DetailField label="MOE license" value={detailTeacher.certification} />
              </div>
            </div>

            <div className="space-y-2.5">
              <h4 className="text-[10px] font-bold text-accent uppercase tracking-wider">Instructional allocation</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <DetailField label="Primary subject" value={detailTeacher.subjects.join(', ')} />
                <DetailField label="Grade levels" value={detailTeacher.grades.join(', ')} />
                <DetailField label="MOE training progress" value={`${detailTeacher.trainingProgress}%`} />
              </div>
            </div>

            <DialogFooter className="mt-4 border-t border-border/20 pt-4 flex-wrap gap-2">
              {!readOnly && (
                <Button
                  type="button"
                  variant={detailTeacher.status === 'Active' ? 'destructive' : 'organic'}
                  size="sm"
                  onClick={() => {
                    toggleTeacherStatus(detailTeacher.id);
                    closeEmployeeDetail();
                  }}
                  className="text-xs h-9 border-none mr-auto"
                >
                  {detailTeacher.status === 'Active' ? 'Deactivate roster' : 'Activate roster'}
                </Button>
              )}
              <Button type="button" variant="outline" size="sm" onClick={closeEmployeeDetail} className="text-xs h-9">
                Close
              </Button>
              {!readOnly && (
                <Button
                  type="button"
                  variant="organic"
                  size="sm"
                  onClick={() => setDetailMode('edit')}
                  className="text-xs h-9 border-none font-semibold"
                >
                  Edit record
                </Button>
              )}
            </DialogFooter>
          </div>
        )}

        {detailTeacher && detailMode === 'edit' && (
          <form onSubmit={handleDetailSave} className="space-y-4 pt-2">
            <div className="space-y-2.5">
              <h4 className="text-[10px] font-bold text-primary uppercase tracking-wider">Employee coordinates</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Full name</label>
                  <input type="text" required value={employeeName} onChange={(e) => setEmployeeName(e.target.value)} className={inputClass} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Email</label>
                  <input type="email" required value={employeeEmail} onChange={(e) => setEmployeeEmail(e.target.value)} className={inputClass} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Mobile phone</label>
                  <input type="tel" required value={employeePhone} onChange={(e) => setEmployeePhone(e.target.value)} className={inputClass} />
                </div>
              </div>
            </div>

            <hr className="border-border/30" />

            <div className="space-y-2.5">
              <h4 className="text-[10px] font-bold text-accent uppercase tracking-wider">Instructional allocation</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Primary subject</label>
                  <select value={employeeSubject} onChange={(e) => setEmployeeSubject(e.target.value)} className={inputClass}>
                    <option value="Biology">Biology Science</option>
                    <option value="Chemistry">Chemistry Science</option>
                    <option value="Physics">Physics Science</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="English Language">English Language</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Grade level</label>
                  <select value={employeeGrade} onChange={(e) => setEmployeeGrade(e.target.value)} className={inputClass}>
                    {['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'].map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">MOE license</label>
                  <select value={employeeCert} onChange={(e) => setEmployeeCert(e.target.value)} className={inputClass}>
                    <option value="Professional License A">Professional License A</option>
                    <option value="Professional License B">Professional License B</option>
                    <option value="Expert Educator License">Expert Educator License</option>
                    <option value="Novice Teaching Permit">Novice Teaching Permit</option>
                  </select>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Training progress: <span className="font-semibold text-foreground">{detailTeacher.trainingProgress}%</span> (synced from MOE portal)
              </p>
            </div>

            <DialogFooter className="mt-4 border-t border-border/20 pt-4">
              <Button type="button" variant="outline" size="sm" onClick={() => setDetailMode('view')} className="text-xs h-9">
                Cancel
              </Button>
              <Button type="submit" variant="organic" size="sm" className="text-xs h-9 border-none font-semibold">
                Save changes
              </Button>
            </DialogFooter>
          </form>
        )}
      </Dialog>

    </div>
  );
};
