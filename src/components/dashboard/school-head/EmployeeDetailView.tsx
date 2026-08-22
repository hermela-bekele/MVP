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

interface EmployeeDetailViewProps {
  teacherId: string;
}

/** Read-only instructor record view — used by portals with oversight-only access (e.g. School Head). */
export const EmployeeDetailView: React.FC<EmployeeDetailViewProps> = ({ teacherId }) => {
  const router = useRouter();
  const { teachers } = useApp();
  const teacher = teachers.find((t) => t.id === teacherId);

  if (!teacher) {
    return (
      <EmptyState
        icon={<UserX />}
        title="Instructor not found"
        description="This instructor record may have been removed."
        action={
          <Button size="sm" onClick={() => router.push('/dashboard/school-head/manage-employees')}>
            Back to directory
          </Button>
        }
      />
    );
  }

  return (
    <div className="max-w-4xl space-y-5">
      <div className="rounded-xl border border-border/60 bg-card p-5 sm:p-6">
        <div className="flex items-center gap-4">
          <Avatar name={teacher.name} size="lg" />
          <div className="space-y-1.5">
            <p className="text-lg font-bold text-foreground leading-tight">{teacher.name}</p>
            <Badge variant={teacher.status === 'Active' ? 'success' : 'neutral'} badgeStyle="subtle" size="sm" dot>
              {teacher.status}
            </Badge>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border/60 bg-card p-5 sm:p-6 space-y-4">
        <h3 className="text-sm font-bold text-foreground">Contact & Credentials</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <DetailField label="Email" value={teacher.email} />
          <DetailField label="Mobile phone" value={teacher.phone} />
          <DetailField label="MOE license" value={teacher.certification} />
        </div>
      </div>

      <div className="rounded-xl border border-border/60 bg-card p-5 sm:p-6 space-y-4">
        <h3 className="text-sm font-bold text-foreground">Instructional Allocation</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <DetailField label="Primary subject" value={teacher.subjects.join(', ')} />
          <DetailField label="Grade levels" value={teacher.grades.join(', ')} />
          <DetailField label="MOE training progress" value={`${teacher.trainingProgress}%`} />
        </div>
      </div>
    </div>
  );
};
