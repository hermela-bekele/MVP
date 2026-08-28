'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { EmptyState } from '@/components/ui/empty-state';
import { UserX } from 'lucide-react';
import { DetailField } from '@/components/dashboard/shared/DetailField';

interface StudentDetailViewProps {
  studentId: string;
}

/** Read-only student record view — used by portals with oversight-only access (e.g. School Head). */
export const StudentDetailView: React.FC<StudentDetailViewProps> = ({ studentId }) => {
  const router = useRouter();
  const { students } = useApp();
  const student = students.find((s) => s.id === studentId);

  if (!student) {
    return (
      <EmptyState
        icon={<UserX />}
        title="Student not found"
        description="This student record may have been removed."
        action={
          <Button size="sm" onClick={() => router.push('/dashboard/school-head/manage-students')}>
            Back to roster
          </Button>
        }
      />
    );
  }

  return (
    <div className="w-full space-y-4">
      <div className="rounded-xl border border-border/60 bg-card p-5 sm:p-6">
        <div className="flex items-center gap-4">
          <Avatar name={student.name} size="lg" />
          <div className="space-y-1.5">
            <p className="text-lg font-bold text-foreground leading-tight">{student.name}</p>
            <Badge variant={student.status === 'Active' ? 'success' : 'neutral'} badgeStyle="subtle" size="sm" dot>
              {student.status}
            </Badge>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border/60 bg-card p-5 sm:p-6 space-y-4">
        <h3 className="text-sm font-bold text-foreground">Academic Profile</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <DetailField label="Student ID" value={<code className="font-mono text-xxs">{student.studentId}</code>} />
          <DetailField label="Grade & section" value={`${student.grade} · ${student.section}`} />
          <DetailField label="Cumulative GPA" value={student.gpa.toFixed(2)} />
          <DetailField label="Attendance" value={`${student.attendanceRate}%`} />
        </div>
      </div>

      <div className="rounded-xl border border-border/60 bg-card p-5 sm:p-6 space-y-4">
        <h3 className="text-sm font-bold text-foreground">Parent / Guardian</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <DetailField label="Guardian name" value={student.parentName} />
          <DetailField label="Phone" value={student.parentPhone} />
          <DetailField label="Email" value={student.parentEmail || '—'} />
        </div>
      </div>

      <div className="rounded-xl border border-border/60 bg-card p-5 sm:p-6 space-y-4">
        <h3 className="text-sm font-bold text-foreground">Health & Emergency</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <DetailField label="Emergency contact" value={student.emergencyContact || '—'} />
          <DetailField label="Medical notes" value={student.medicalInfo || 'None recorded'} />
        </div>
      </div>
    </div>
  );
};
