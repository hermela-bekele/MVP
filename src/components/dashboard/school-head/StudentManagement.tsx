'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { TablePanel } from '@/components/dashboard/TablePanel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { DataTable } from '@/components/ui/data-table';
import { Dialog, DialogFooter } from '@/components/ui/dialog';
import type { DataTableColumn } from '@/components/ui/data-table';
import type { Student } from '@/lib/mockData';

const inputClass =
  'w-full h-10 px-3 bg-muted/40 border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring';

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <p className="text-[10px] font-bold text-muted-foreground uppercase">{label}</p>
      <p className="text-xs font-medium text-foreground">{value ?? '—'}</p>
    </div>
  );
}

export const StudentManagement: React.FC<{ readOnly?: boolean }> = ({ readOnly = false }) => {
  const { students, enrollStudent, updateStudent } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [detailStudent, setDetailStudent] = useState<Student | null>(null);
  const [detailMode, setDetailMode] = useState<'view' | 'edit' | null>(null);

  // Form States
  const [studentName, setStudentName] = useState('');
  const [studentGrade, setStudentGrade] = useState('Grade 9');
  const [studentSection, setStudentSection] = useState('A');
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [medicalInfo, setMedicalInfo] = useState('');
  const [studentGpa, setStudentGpa] = useState('0');
  const [studentAttendance, setStudentAttendance] = useState('100');
  const [studentStatus, setStudentStatus] = useState<Student['status']>('Active');

  const loadStudentForm = (student: Student) => {
    setStudentName(student.name);
    setStudentGrade(student.grade);
    setStudentSection(student.section);
    setParentName(student.parentName);
    setParentPhone(student.parentPhone);
    setParentEmail(student.parentEmail ?? '');
    setEmergencyContact(student.emergencyContact);
    setMedicalInfo(student.medicalInfo ?? '');
    setStudentGpa(student.gpa.toFixed(2));
    setStudentAttendance(String(student.attendanceRate));
    setStudentStatus(student.status);
  };

  const openStudentView = (student: Student) => {
    setDetailStudent(student);
    loadStudentForm(student);
    setDetailMode('view');
  };

  const openStudentEdit = (student: Student) => {
    setDetailStudent(student);
    loadStudentForm(student);
    setDetailMode('edit');
  };

  const closeStudentDetail = () => {
    setDetailStudent(null);
    setDetailMode(null);
  };

  // Handle external modal open trigger (from OverviewDashboard quick actions)
  useEffect(() => {
    if (readOnly) return;
    const handleOpenModal = () => {
      setIsModalOpen(true);
    };
    window.addEventListener('open-enroll-modal', handleOpenModal);
    return () => window.removeEventListener('open-enroll-modal', handleOpenModal);
  }, [readOnly]);

  const handleEnrollSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName || !parentName || !parentPhone) return;

    // Call context action
    enrollStudent({
      name: studentName,
      grade: studentGrade,
      section: studentSection,
      parentName,
      parentPhone,
      parentEmail,
      emergencyContact,
      medicalInfo,
      schoolId: 'sch-1',
    });

    // Reset Form
    setStudentName('');
    setParentName('');
    setParentPhone('');
    setParentEmail('');
    setEmergencyContact('');
    setMedicalInfo('');
    
    // Close Modal
    setIsModalOpen(false);
  };

  const handleDetailSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!detailStudent || !studentName || !parentName || !parentPhone) return;

    updateStudent(detailStudent.id, {
      name: studentName,
      grade: studentGrade,
      section: studentSection,
      parentName,
      parentPhone,
      parentEmail,
      emergencyContact,
      medicalInfo,
      gpa: parseFloat(studentGpa) || 0,
      attendanceRate: parseFloat(studentAttendance) || 0,
      status: studentStatus,
    });
    closeStudentDetail();
  };

  const studentColumns: DataTableColumn<Student>[] = [
    {
      key: 'name',
      header: 'Student Name',
      sortable: true,
      render: (row) => (
        <div className="flex items-center space-x-2.5">
          <Avatar name={row.name} size="sm" />
          <span className="font-semibold text-foreground text-xs">{row.name}</span>
        </div>
      ),
    },
    {
      key: 'studentId',
      header: 'Student ID',
      sortable: true,
      render: (row) => <code className="text-xxs font-mono text-muted-foreground">{row.studentId}</code>,
    },
    {
      key: 'grade',
      header: 'Grade & Section',
      sortable: true,
      render: (row) => (
        <Badge variant="neutral" size="sm">
          {row.grade} - {row.section}
        </Badge>
      ),
    },
    {
      key: 'gpa',
      header: 'Cumulative GPA',
      sortable: true,
      render: (row) => (
        <Badge variant={row.gpa >= 3.5 ? 'success' : row.gpa >= 3.0 ? 'primary' : row.gpa >= 2.0 ? 'info' : 'warning'} size="sm" className="font-semibold">
          {row.gpa.toFixed(2)} GPA
        </Badge>
      ),
    },
    {
      key: 'attendanceRate',
      header: 'Attendance',
      sortable: true,
      render: (row) => (
        <span className={`text-xs font-semibold ${row.attendanceRate >= 90 ? 'text-foreground' : 'text-muted-foreground'}`}>
          {row.attendanceRate}%
        </span>
      ),
    },
    {
      key: 'parentName',
      header: 'Parent Contact',
      render: (row) => (
        <div className="flex flex-col text-left">
          <span className="text-[11px] font-medium text-foreground">{row.parentName}</span>
          <span className="text-[9px] text-muted-foreground">{row.parentPhone}</span>
        </div>
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
            onClick={() => openStudentView(row)}
            className="text-[10px] h-7 px-2"
          >
            View
          </Button>
          {!readOnly && (
            <Button
              type="button"
              variant="organic"
              size="sm"
              onClick={() => openStudentEdit(row)}
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
        title="Active Student Roster"
        description="Search and filter active student databases"
      >
          <DataTable<Student>
            columns={studentColumns}
            data={students}
            searchable
            searchKeys={['name', 'studentId', 'parentName']}
            pageSize={10}
          />
      </TablePanel>

      {/* Enroll Student Dialog Modal */}
      {!readOnly && (
      <Dialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Enroll Student Registry"
        size="lg"
      >
        <form onSubmit={handleEnrollSubmit} className="space-y-4 pt-2">
          
          {/* Student Info Group */}
          <div className="space-y-2.5">
            <h4 className="text-[10px] font-bold text-primary uppercase tracking-wider">Student Primary Profile</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-1 space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Almaz Kebede"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="w-full h-10 px-3 bg-muted/40 border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Grade Level</label>
                <select
                  value={studentGrade}
                  onChange={(e) => setStudentGrade(e.target.value)}
                  className="w-full h-10 px-3 bg-muted/45 border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="Grade 9">Grade 9</option>
                  <option value="Grade 10">Grade 10</option>
                  <option value="Grade 11">Grade 11</option>
                  <option value="Grade 12">Grade 12</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Section Division</label>
                <select
                  value={studentSection}
                  onChange={(e) => setStudentSection(e.target.value)}
                  className="w-full h-10 px-3 bg-muted/45 border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="A">Section A</option>
                  <option value="B">Section B</option>
                  <option value="C">Section C</option>
                  <option value="D">Section D</option>
                </select>
              </div>
            </div>
          </div>

          <hr className="border-border/30" />

          {/* Parent Info Group */}
          <div className="space-y-2.5">
            <h4 className="text-[10px] font-bold text-accent uppercase tracking-wider">Parent / Guardian Coordinates</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Guardian Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kebede Abebe"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  className="w-full h-10 px-3 bg-muted/40 border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Contact Phone</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. +251-911-000000"
                  value={parentPhone}
                  onChange={(e) => setParentPhone(e.target.value)}
                  className="w-full h-10 px-3 bg-muted/40 border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Parent Email (Optional)</label>
                <input
                  type="email"
                  placeholder="e.g. parent@email.com"
                  value={parentEmail}
                  onChange={(e) => setParentEmail(e.target.value)}
                  className="w-full h-10 px-3 bg-muted/40 border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
          </div>

          <hr className="border-border/30" />

          {/* Auxiliary/Medical Group */}
          <div className="space-y-2.5">
            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Auxiliary & Health Variables</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Alternative Emergency Contact</label>
                <input
                  type="text"
                  placeholder="e.g. Uncle: +251-912-111111"
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  className="w-full h-10 px-3 bg-muted/40 border border-border rounded-md text-xs text-foreground focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Medical notes / comments</label>
                <input
                  type="text"
                  placeholder="e.g. None or Asthma history"
                  value={medicalInfo}
                  onChange={(e) => setMedicalInfo(e.target.value)}
                  className="w-full h-10 px-3 bg-muted/40 border border-border rounded-md text-xs text-foreground focus:outline-none"
                />
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
              Cancel Registry
            </Button>
            <Button
              type="submit"
              variant="organic"
              size="sm"
              className="text-xs h-9 border-none font-semibold"
            >
              Complete Student Enrollment
            </Button>
          </DialogFooter>

        </form>
      </Dialog>
      )}

      {/* View / Edit full student record */}
      <Dialog
        isOpen={detailStudent !== null && detailMode !== null}
        onClose={closeStudentDetail}
        title={detailMode === 'edit' ? 'Edit Student Record' : 'Student Record'}
        description={
          detailStudent
            ? `${detailStudent.studentId} · ${detailStudent.grade} Section ${detailStudent.section}`
            : undefined
        }
        size="xl"
      >
        {detailStudent && detailMode === 'view' && (
          <div className="space-y-5 pt-2">
            <div className="flex items-center gap-3 pb-3 border-b border-border/40">
              <Avatar name={detailStudent.name} size="md" />
              <div>
                <p className="text-sm font-bold text-foreground">{detailStudent.name}</p>
                <Badge variant={detailStudent.status === 'Active' ? 'success' : 'neutral'} size="sm" className="mt-1">
                  {detailStudent.status}
                </Badge>
              </div>
            </div>

            <div className="space-y-2.5">
              <h4 className="text-[10px] font-bold text-primary uppercase tracking-wider">Academic profile</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <DetailRow label="Student ID" value={<code className="font-mono text-xxs">{detailStudent.studentId}</code>} />
                <DetailRow label="Grade & section" value={`${detailStudent.grade} · ${detailStudent.section}`} />
                <DetailRow label="Cumulative GPA" value={detailStudent.gpa.toFixed(2)} />
                <DetailRow label="Attendance" value={`${detailStudent.attendanceRate}%`} />
              </div>
            </div>

            <div className="space-y-2.5">
              <h4 className="text-[10px] font-bold text-accent uppercase tracking-wider">Parent / guardian</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <DetailRow label="Guardian name" value={detailStudent.parentName} />
                <DetailRow label="Phone" value={detailStudent.parentPhone} />
                <DetailRow label="Email" value={detailStudent.parentEmail || '—'} />
              </div>
            </div>

            <div className="space-y-2.5">
              <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Health & emergency</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DetailRow label="Emergency contact" value={detailStudent.emergencyContact || '—'} />
                <DetailRow label="Medical notes" value={detailStudent.medicalInfo || 'None recorded'} />
              </div>
            </div>

            <DialogFooter className="mt-4 border-t border-border/20 pt-4">
              <Button type="button" variant="outline" size="sm" onClick={closeStudentDetail} className="text-xs h-9">
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

        {detailStudent && detailMode === 'edit' && (
          <form onSubmit={handleDetailSave} className="space-y-4 pt-2">
            <div className="space-y-2.5">
              <h4 className="text-[10px] font-bold text-primary uppercase tracking-wider">Student primary profile</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="md:col-span-2 space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Full name</label>
                  <input type="text" required value={studentName} onChange={(e) => setStudentName(e.target.value)} className={inputClass} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Grade</label>
                  <select value={studentGrade} onChange={(e) => setStudentGrade(e.target.value)} className={inputClass}>
                    {['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'].map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Section</label>
                  <select value={studentSection} onChange={(e) => setStudentSection(e.target.value)} className={inputClass}>
                    {['A', 'B', 'C', 'D'].map((s) => (
                      <option key={s} value={s}>Section {s}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">GPA</label>
                  <input type="number" step="0.01" min="0" max="4" value={studentGpa} onChange={(e) => setStudentGpa(e.target.value)} className={inputClass} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Attendance %</label>
                  <input type="number" step="0.1" min="0" max="100" value={studentAttendance} onChange={(e) => setStudentAttendance(e.target.value)} className={inputClass} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Enrollment status</label>
                  <select value={studentStatus} onChange={(e) => setStudentStatus(e.target.value as Student['status'])} className={inputClass}>
                    <option value="Active">Active</option>
                    <option value="Suspended">Suspended</option>
                    <option value="Transferred">Transferred</option>
                    <option value="Graduated">Graduated</option>
                  </select>
                </div>
              </div>
            </div>

            <hr className="border-border/30" />

            <div className="space-y-2.5">
              <h4 className="text-[10px] font-bold text-accent uppercase tracking-wider">Parent / guardian coordinates</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Guardian name</label>
                  <input type="text" required value={parentName} onChange={(e) => setParentName(e.target.value)} className={inputClass} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Contact phone</label>
                  <input type="tel" required value={parentPhone} onChange={(e) => setParentPhone(e.target.value)} className={inputClass} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Parent email</label>
                  <input type="email" value={parentEmail} onChange={(e) => setParentEmail(e.target.value)} className={inputClass} />
                </div>
              </div>
            </div>

            <hr className="border-border/30" />

            <div className="space-y-2.5">
              <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Auxiliary & health</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Emergency contact</label>
                  <input type="text" value={emergencyContact} onChange={(e) => setEmergencyContact(e.target.value)} className={inputClass} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Medical notes</label>
                  <input type="text" value={medicalInfo} onChange={(e) => setMedicalInfo(e.target.value)} className={inputClass} />
                </div>
              </div>
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
