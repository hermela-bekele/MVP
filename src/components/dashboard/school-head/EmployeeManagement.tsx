'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
import { readStoredSession } from '@/lib/auth';
import { api, ApiError, type TeacherReplacementReason, type TeacherReplacementRequest } from '@/lib/api';

const inputClass =
  'w-full h-10 px-3 bg-muted/40 border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring';

function subjectToDeptId(subject: string) {
  if (subject === 'Mathematics') return 'dept-math';
  if (subject === 'Chemistry') return 'dept-chem';
  return 'dept-stem';
}

const REASON_OPTIONS: { value: TeacherReplacementReason; label: string }[] = [
  { value: 'resignation', label: 'Resignation' },
  { value: 'transfer', label: 'Transfer' },
  { value: 'retirement', label: 'Retirement' },
  { value: 'other', label: 'Other' },
];

export const EmployeeManagement: React.FC<{ readOnly?: boolean }> = ({ readOnly = false }) => {
  const router = useRouter();
  const { teachers, schools, addTeacher, updateTeacher, toggleTeacherStatus, addNotification, refreshFromApi } = useApp();
  const session = readStoredSession();
  const schoolId = session?.schoolId || 'sch-1';
  const school = schools.find((s) => s.id === schoolId);
  const isPublicSchool = school?.type === 'Public';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [detailTeacher, setDetailTeacher] = useState<Teacher | null>(null);
  const [detailMode, setDetailMode] = useState<'view' | 'edit' | null>(null);

  const [employeeName, setEmployeeName] = useState('');
  const [employeeEmail, setEmployeeEmail] = useState('');
  const [employeePhone, setEmployeePhone] = useState('');
  const [employeeSubject, setEmployeeSubject] = useState('Biology');
  const [employeeGrade, setEmployeeGrade] = useState('Grade 9');
  const [employeeCert, setEmployeeCert] = useState('Professional License A');

  const [replacementTeacher, setReplacementTeacher] = useState<Teacher | null>(null);
  const [departureDate, setDepartureDate] = useState('');
  const [departureReason, setDepartureReason] = useState<TeacherReplacementReason>('resignation');
  const [departureNotes, setDepartureNotes] = useState('');
  const [replacementBusy, setReplacementBusy] = useState(false);
  const [replacementError, setReplacementError] = useState('');
  const [replacementRequests, setReplacementRequests] = useState<TeacherReplacementRequest[]>([]);

  const schoolTeachers = React.useMemo(() => {
    return teachers.filter((t) => t.schoolId === schoolId);
  }, [teachers, schoolId]);

  const loadReplacementRequests = useCallback(() => {
    if (!isPublicSchool) {
      setReplacementRequests([]);
      return;
    }
    api
      .listTeacherReplacementRequests()
      .then(setReplacementRequests)
      .catch(() => setReplacementRequests([]));
  }, [isPublicSchool]);

  useEffect(() => {
    loadReplacementRequests();
  }, [loadReplacementRequests]);

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

  const openReplacementDialog = (teacher: Teacher) => {
    setReplacementTeacher(teacher);
    setDepartureDate(new Date().toISOString().slice(0, 10));
    setDepartureReason('resignation');
    setDepartureNotes('');
    setReplacementError('');
    closeEmployeeDetail();
  };

  const handleReplacementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replacementTeacher || !departureDate) return;
    setReplacementBusy(true);
    setReplacementError('');
    try {
      await api.createTeacherReplacementRequest({
        departingTeacherId: replacementTeacher.id,
        departureDate,
        reason: departureReason,
        subjectsNeeded: replacementTeacher.subjects,
        gradeLevelsNeeded: replacementTeacher.grades,
        notes: departureNotes.trim() || undefined,
        schoolId,
      });
      addNotification(
        'MOE notified',
        `Departure notice and replacement request filed for ${replacementTeacher.name}.`,
        'success',
      );
      setReplacementTeacher(null);
      loadReplacementRequests();
      void refreshFromApi();
    } catch (err) {
      setReplacementError(err instanceof ApiError ? err.message : 'Failed to file replacement request.');
    } finally {
      setReplacementBusy(false);
    }
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
      schoolId,
      departmentId: deptId,
      yearsOfExperience: 0,
    });

    setEmployeeName('');
    setEmployeeEmail('');
    setEmployeePhone('');
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
        <Badge
          variant={row.status === 'Active' ? 'success' : row.status === 'Left' ? 'danger' : 'neutral'}
          size="sm"
        >
          {row.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex flex-wrap items-center gap-1.5">
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
          {!readOnly && isPublicSchool && row.status !== 'Left' && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => openReplacementDialog(row)}
              className="text-[10px] h-7 px-2"
            >
              Notify MOE
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {!isPublicSchool && (
        <p className="rounded-lg border border-border/60 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          MOE teacher assignment applies to Public (government) schools only. Private schools hire and replace staff locally.
        </p>
      )}

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

      {isPublicSchool && (
        <TablePanel
          title="MOE replacement requests"
          description={
            replacementRequests.length
              ? `${replacementRequests.length} notice${replacementRequests.length === 1 ? '' : 's'} filed with MOE`
              : 'No departure notices filed yet'
          }
        >
          {replacementRequests.length === 0 ? (
            <p className="px-3 py-4 text-sm text-muted-foreground">
              When a teacher leaves, file a departure notice to request an MOE replacement assignment.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 text-left text-xs uppercase text-muted-foreground">
                  <th className="px-3 py-2">Teacher</th>
                  <th className="px-3 py-2">Departure</th>
                  <th className="px-3 py-2">Reason</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Assigned</th>
                </tr>
              </thead>
              <tbody>
                {replacementRequests.map((req) => (
                  <tr key={req.id} className="border-b border-border/40">
                    <td className="px-3 py-2 font-medium">{req.departingTeacherName || req.departingTeacherId}</td>
                    <td className="px-3 py-2">{String(req.departureDate).slice(0, 10)}</td>
                    <td className="px-3 py-2 capitalize">{req.reason}</td>
                    <td className="px-3 py-2">
                      <Badge
                        variant={
                          req.status === 'assigned'
                            ? 'success'
                            : req.status === 'rejected'
                              ? 'danger'
                              : 'warning'
                        }
                        size="sm"
                      >
                        {req.status.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{req.assignedTeacherName || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </TablePanel>
      )}

      {!readOnly && (
        <Dialog
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Onboard Instructor Profile"
          size="lg"
        >
          <form onSubmit={handleOnboardSubmit} className="space-y-4 pt-2">
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
                    className={inputClass}
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
                    className={inputClass}
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
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            <hr className="border-border/30" />

            <div className="space-y-2.5">
              <h4 className="text-[10px] font-bold text-accent uppercase tracking-wider">Instructional Allocation</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Primary Subject Domain</label>
                  <select
                    value={employeeSubject}
                    onChange={(e) => setEmployeeSubject(e.target.value)}
                    className={inputClass}
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
                    className={inputClass}
                  >
                    <option value="Grade 9">Grade 9</option>
                    <option value="Grade 10">Grade 10</option>
                    <option value="Grade 11">Grade 11</option>
                    <option value="Grade 12">Grade 12</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Accreditation</label>
                  <input
                    type="text"
                    value={employeeCert}
                    onChange={(e) => setEmployeeCert(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="mt-4 border-t border-border/20 pt-4">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)} className="text-xs h-9">
                Cancel
              </Button>
              <Button type="submit" variant="organic" size="sm" className="text-xs h-9 border-none font-semibold">
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
                <Badge
                  variant={
                    detailTeacher.status === 'Active'
                      ? 'success'
                      : detailTeacher.status === 'Left'
                        ? 'danger'
                        : 'neutral'
                  }
                  size="sm"
                  className="mt-1"
                >
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
              {!readOnly && detailTeacher.status !== 'Left' && (
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
              {!readOnly && isPublicSchool && detailTeacher.status !== 'Left' && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => openReplacementDialog(detailTeacher)}
                  className="text-xs h-9"
                >
                  Notify MOE / Request replacement
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
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Accreditation</label>
                  <input type="text" value={employeeCert} onChange={(e) => setEmployeeCert(e.target.value)} className={inputClass} />
                </div>
              </div>
            </div>

            <DialogFooter className="mt-4 border-t border-border/20 pt-4">
              <Button type="button" variant="outline" size="sm" onClick={closeEmployeeDetail} className="text-xs h-9">
                Cancel
              </Button>
              <Button type="submit" variant="organic" size="sm" className="text-xs h-9 border-none font-semibold">
                Save changes
              </Button>
            </DialogFooter>
          </form>
        )}
      </Dialog>

      <Dialog
        isOpen={replacementTeacher != null}
        onClose={() => !replacementBusy && setReplacementTeacher(null)}
        title="Notify MOE — request replacement"
        description={
          replacementTeacher
            ? `File a departure notice for ${replacementTeacher.name}. MOE assigns replacement teachers for Public schools.`
            : undefined
        }
      >
        {replacementTeacher && (
          <form onSubmit={handleReplacementSubmit} className="space-y-4 pt-2">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Departure date</label>
                <input
                  type="date"
                  required
                  value={departureDate}
                  onChange={(e) => setDepartureDate(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Reason</label>
                <select
                  value={departureReason}
                  onChange={(e) => setDepartureReason(e.target.value as TeacherReplacementReason)}
                  className={inputClass}
                >
                  {REASON_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Notes for MOE</label>
              <textarea
                className={`${inputClass} h-24 py-2`}
                value={departureNotes}
                onChange={(e) => setDepartureNotes(e.target.value)}
                placeholder="Subjects coverage needs, timing, or other context"
              />
            </div>
            {replacementError && <p className="text-sm text-red-600">{replacementError}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setReplacementTeacher(null)} disabled={replacementBusy}>
                Cancel
              </Button>
              <Button type="submit" variant="organic" className="border-none" disabled={replacementBusy}>
                {replacementBusy ? 'Submitting…' : 'Submit to MOE'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </Dialog>
    </div>
  );
};
