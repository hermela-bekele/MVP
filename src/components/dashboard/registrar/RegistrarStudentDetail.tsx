'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { UserX } from 'lucide-react';
import type { Student } from '@/lib/mockData';
import { statusBadgeVariant } from '@/lib/registrarPortal';
import { api, type AuditLogEntry } from '@/lib/api';
import { generateEnrollmentLetterPDF, generateIdCardPDF } from '@/lib/registrarDocs';
import { slugifyFilename } from '@/lib/pdfUtils';
import { DetailField } from '@/components/dashboard/shared/DetailField';

const inputClass =
  'w-full h-10 px-3 bg-muted/40 border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring';

function normalizeContact(value?: string): string {
  return (value ?? '').replace(/[^0-9a-z]/gi, '').toLowerCase();
}

interface RegistrarStudentDetailProps {
  studentId: string;
  schoolStudents: Student[];
  schoolName: string;
}

export const RegistrarStudentDetail: React.FC<RegistrarStudentDetailProps> = ({
  studentId,
  schoolStudents,
  schoolName,
}) => {
  const router = useRouter();
  const { updateStudent } = useApp();
  const student = useMemo(() => schoolStudents.find((s) => s.id === studentId), [schoolStudents, studentId]);

  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [history, setHistory] = useState<AuditLogEntry[]>([]);
  const [docBusy, setDocBusy] = useState<'letter' | 'card' | null>(null);

  const [studentName, setStudentName] = useState('');
  const [studentGrade, setStudentGrade] = useState('Grade 9');
  const [studentSection, setStudentSection] = useState('A');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [studentStatus, setStudentStatus] = useState<Student['status']>('Active');

  useEffect(() => {
    if (!student) return;
    setStudentName(student.name);
    setStudentGrade(student.grade);
    setStudentSection(student.section);
    setDateOfBirth(student.dateOfBirth ?? '');
    setStudentStatus(student.status);
  }, [student]);

  useEffect(() => {
    api
      .listAuditLogs({ entityType: 'student', entityId: studentId, limit: 15 })
      .then(setHistory)
      .catch(() => setHistory([]));
  }, [studentId]);

  const siblings = useMemo(() => {
    if (!student) return [];
    const phone = normalizeContact(student.parentPhone);
    const email = normalizeContact(student.parentEmail);
    return schoolStudents.filter(
      (s) =>
        s.id !== student.id &&
        ((phone && normalizeContact(s.parentPhone) === phone) ||
          (email && normalizeContact(s.parentEmail) === email))
    );
  }, [student, schoolStudents]);

  if (!student) {
    return (
      <EmptyState
        icon={<UserX />}
        title="Student not found"
        description="This student record may have been removed."
        action={
          <Button size="sm" onClick={() => router.push('/dashboard/registrar/student-registry')}>
            Back to registry
          </Button>
        }
      />
    );
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateStudent(student.id, {
      name: studentName,
      grade: studentGrade,
      section: studentSection,
      dateOfBirth: dateOfBirth || undefined,
      status: studentStatus,
    });
    setMode('view');
  };

  const handleEnrollmentLetter = async () => {
    setDocBusy('letter');
    try {
      await generateEnrollmentLetterPDF(
        {
          schoolName,
          student: {
            name: student.name,
            studentId: student.studentId,
            grade: student.grade,
            section: student.section,
            parentName: student.parentName,
          },
          academicYear: student.academicYear,
        },
        `${slugifyFilename(student.name)}-enrollment-letter.pdf`
      );
    } finally {
      setDocBusy(null);
    }
  };

  const handleIdCard = async () => {
    setDocBusy('card');
    try {
      await generateIdCardPDF(
        {
          schoolName,
          student: {
            name: student.name,
            studentId: student.studentId,
            grade: student.grade,
            section: student.section,
          },
          academicYear: student.academicYear,
        },
        `${slugifyFilename(student.name)}-id-card.pdf`
      );
    } finally {
      setDocBusy(null);
    }
  };

  if (mode === 'edit') {
    return (
      <form onSubmit={handleSave} className="max-w-4xl space-y-4">
        <div className="rounded-xl border border-border/60 bg-card p-5">
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
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Date of Birth</label>
              <input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} className={inputClass} />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setMode('view')}>Cancel</Button>
          <Button type="submit" variant="organic" size="sm" className="border-none">Save Changes</Button>
        </div>
      </form>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="rounded-xl border border-border/60 bg-card p-5 sm:p-6 space-y-4">
        <h3 className="text-sm font-bold text-foreground">Student Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <DetailField label="Name" value={student.name} />
          <DetailField label="Student ID" value={<span className="font-mono">{student.studentId}</span>} />
          <DetailField label="Grade" value={`${student.grade} · ${student.section}`} />
          <DetailField label="Status" value={<Badge variant={statusBadgeVariant(student.status)} size="sm">{student.status}</Badge>} />
          <DetailField label="GPA" value={student.gpa.toFixed(2)} />
          <DetailField label="Attendance" value={`${student.attendanceRate}%`} />
          <DetailField label="Parent" value={student.parentName} />
          <DetailField label="Phone" value={student.parentPhone} />
          <DetailField label="Email" value={student.parentEmail || '—'} />
          <DetailField label="Date of Birth" value={student.dateOfBirth || '—'} />
          <DetailField label="Academic Year" value={student.academicYear || '—'} />
        </div>
      </div>

      {siblings.length > 0 && (
        <div className="rounded-xl border border-border/60 bg-card p-5 sm:p-6 space-y-3">
          <h3 className="text-sm font-bold text-foreground">Siblings at this school</h3>
          <div className="space-y-1.5">
            {siblings.map((sib) => (
              <div key={sib.id} className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 px-3.5 py-2.5">
                <p className="text-xs font-medium text-foreground">{sib.name}</p>
                <p className="text-[10px] text-muted-foreground">{sib.grade} · {sib.section || 'Unplaced'}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border/60 bg-card p-5 sm:p-6 space-y-3">
        <h3 className="text-sm font-bold text-foreground">Record History</h3>
        {history.length === 0 ? (
          <p className="text-xs text-muted-foreground">No recorded changes yet.</p>
        ) : (
          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {history.map((h) => (
              <div key={h.id} className="flex items-center justify-between text-[10px] py-1.5 border-b border-border/40 last:border-0">
                <span className="text-foreground">
                  {(h.actorName || h.actorEmail || 'Someone')} · {h.action.replace(/[._]/g, ' ')}
                </span>
                <span className="text-muted-foreground whitespace-nowrap ml-2">
                  {new Date(h.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="outline" size="sm" disabled={docBusy !== null} onClick={handleEnrollmentLetter} className="text-xs h-9">
          {docBusy === 'letter' ? 'Generating…' : 'Enrollment Letter'}
        </Button>
        <Button variant="outline" size="sm" disabled={docBusy !== null} onClick={handleIdCard} className="text-xs h-9">
          {docBusy === 'card' ? 'Generating…' : 'ID Card'}
        </Button>
        <Button variant="organic" size="sm" onClick={() => setMode('edit')} className="text-xs h-9 border-none">Edit Record</Button>
      </div>
    </div>
  );
};
