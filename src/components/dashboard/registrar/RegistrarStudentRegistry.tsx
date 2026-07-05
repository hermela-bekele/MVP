'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { TablePanel } from '@/components/dashboard/TablePanel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { DataTable } from '@/components/ui/data-table';
import { Dialog, DialogFooter } from '@/components/ui/dialog';
import type { DataTableColumn } from '@/components/ui/data-table';
import type { Student } from '@/lib/mockData';
import { filterSchoolStudents, statusBadgeVariant } from '@/lib/registrarPortal';

const inputClass =
  'w-full h-10 px-3 bg-muted/40 border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring';

export const RegistrarStudentRegistry: React.FC = () => {
  const { students, updateStudent } = useApp();
  const schoolStudents = filterSchoolStudents(students);

  const [detailStudent, setDetailStudent] = useState<Student | null>(null);
  const [detailMode, setDetailMode] = useState<'view' | 'edit' | null>(null);

  const [studentName, setStudentName] = useState('');
  const [studentGrade, setStudentGrade] = useState('Grade 9');
  const [studentSection, setStudentSection] = useState('A');
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [medicalInfo, setMedicalInfo] = useState('');
  const [studentStatus, setStudentStatus] = useState<Student['status']>('Active');

  const loadForm = (student: Student) => {
    setStudentName(student.name);
    setStudentGrade(student.grade);
    setStudentSection(student.section);
    setParentName(student.parentName);
    setParentPhone(student.parentPhone);
    setParentEmail(student.parentEmail ?? '');
    setEmergencyContact(student.emergencyContact);
    setMedicalInfo(student.medicalInfo ?? '');
    setStudentStatus(student.status);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!detailStudent) return;
    updateStudent(detailStudent.id, {
      name: studentName,
      grade: studentGrade,
      section: studentSection,
      parentName,
      parentPhone,
      parentEmail,
      emergencyContact,
      medicalInfo,
      status: studentStatus,
    });
    setDetailStudent(null);
    setDetailMode(null);
  };

  const columns: DataTableColumn<Student>[] = [
    {
      key: 'name',
      header: 'Student',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={row.name} size="sm" />
          <div>
            <p className="text-xs font-semibold text-foreground">{row.name}</p>
            <code className="text-[9px] font-mono text-muted-foreground">{row.studentId}</code>
          </div>
        </div>
      ),
    },
    {
      key: 'grade',
      header: 'Grade / Section',
      sortable: true,
      render: (row) => (
        <Badge variant="neutral" size="sm">{row.grade} · {row.section}</Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (row) => (
        <Badge variant={statusBadgeVariant(row.status)} size="sm">{row.status}</Badge>
      ),
    },
    {
      key: 'gpa',
      header: 'GPA',
      sortable: true,
      render: (row) => <span className="text-xs font-semibold">{row.gpa.toFixed(2)}</span>,
    },
    {
      key: 'parentName',
      header: 'Parent',
      render: (row) => (
        <div>
          <p className="text-[11px] font-medium">{row.parentName}</p>
          <p className="text-[9px] text-muted-foreground">{row.parentPhone}</p>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => { setDetailStudent(row); loadForm(row); setDetailMode('view'); }}
            className="text-[10px] h-7 px-2"
          >
            View
          </Button>
          <Button
            type="button"
            variant="organic"
            size="sm"
            onClick={() => { setDetailStudent(row); loadForm(row); setDetailMode('edit'); }}
            className="text-[10px] h-7 px-2 border-none"
          >
            Edit
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <TablePanel
        title="Official Student Registry"
        description="Complete roster of all enrolled students with searchable records"
      >
        <DataTable<Student>
          columns={columns}
          data={schoolStudents}
          searchable
          searchKeys={['name', 'studentId', 'parentName', 'grade']}
          pageSize={12}
        />
      </TablePanel>

      <Dialog
        isOpen={!!detailStudent && !!detailMode}
        onClose={() => { setDetailStudent(null); setDetailMode(null); }}
        title={detailMode === 'view' ? 'Student Record' : 'Edit Student Record'}
        size="lg"
      >
        {detailStudent && detailMode === 'view' && (
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div><p className="text-[10px] font-bold text-muted-foreground uppercase">Name</p><p className="text-xs font-medium">{detailStudent.name}</p></div>
              <div><p className="text-[10px] font-bold text-muted-foreground uppercase">Student ID</p><p className="text-xs font-mono">{detailStudent.studentId}</p></div>
              <div><p className="text-[10px] font-bold text-muted-foreground uppercase">Grade</p><p className="text-xs font-medium">{detailStudent.grade} · {detailStudent.section}</p></div>
              <div><p className="text-[10px] font-bold text-muted-foreground uppercase">Status</p><Badge variant={statusBadgeVariant(detailStudent.status)} size="sm">{detailStudent.status}</Badge></div>
              <div><p className="text-[10px] font-bold text-muted-foreground uppercase">GPA</p><p className="text-xs font-medium">{detailStudent.gpa.toFixed(2)}</p></div>
              <div><p className="text-[10px] font-bold text-muted-foreground uppercase">Attendance</p><p className="text-xs font-medium">{detailStudent.attendanceRate}%</p></div>
              <div><p className="text-[10px] font-bold text-muted-foreground uppercase">Parent</p><p className="text-xs font-medium">{detailStudent.parentName}</p></div>
              <div><p className="text-[10px] font-bold text-muted-foreground uppercase">Phone</p><p className="text-xs font-medium">{detailStudent.parentPhone}</p></div>
              <div><p className="text-[10px] font-bold text-muted-foreground uppercase">Email</p><p className="text-xs font-medium">{detailStudent.parentEmail || '—'}</p></div>
            </div>
            <DialogFooter className="border-t border-border/20 pt-4">
              <Button variant="outline" size="sm" onClick={() => setDetailMode('edit')} className="text-xs h-9">Edit Record</Button>
              <Button variant="outline" size="sm" onClick={() => { setDetailStudent(null); setDetailMode(null); }} className="text-xs h-9">Close</Button>
            </DialogFooter>
          </div>
        )}

        {detailStudent && detailMode === 'edit' && (
          <form onSubmit={handleSave} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Name</label>
                <input type="text" required value={studentName} onChange={(e) => setStudentName(e.target.value)} className={inputClass} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Status</label>
                <select value={studentStatus} onChange={(e) => setStudentStatus(e.target.value as Student['status'])} className={inputClass}>
                  <option value="Active">Active</option>
                  <option value="Suspended">Suspended</option>
                  <option value="Transferred">Transferred</option>
                  <option value="Graduated">Graduated</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Grade</label>
                <select value={studentGrade} onChange={(e) => setStudentGrade(e.target.value)} className={inputClass}>
                  {['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'].map((g) => (
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
            <DialogFooter className="border-t border-border/20 pt-4">
              <Button type="button" variant="outline" size="sm" onClick={() => setDetailMode('view')} className="text-xs h-9">Cancel</Button>
              <Button type="submit" variant="organic" size="sm" className="text-xs h-9 border-none">Save Changes</Button>
            </DialogFooter>
          </form>
        )}
      </Dialog>
    </div>
  );
};
