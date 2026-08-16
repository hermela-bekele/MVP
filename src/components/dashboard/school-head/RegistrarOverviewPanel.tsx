'use client';

import React, { useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { KpiGrid, KpiWidget } from '@/components/dashboard/KpiWidget';
import { TablePanel } from '@/components/dashboard/TablePanel';
import { Badge } from '@/components/ui/badge';
import type { RegistrationApplicationStatus } from '@/lib/mockData';

const statusVariant: Record<RegistrationApplicationStatus, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
  Draft: 'neutral',
  Submitted: 'info',
  'Under Review': 'warning',
  Approved: 'success',
  Rejected: 'danger',
  Enrolled: 'success',
};

/** Read-only registration/enrollment snapshot surfaced to the school head from the Administrative Engine. */
export const RegistrarOverviewPanel: React.FC = () => {
  const { registrationApplications } = useApp();

  const pending = useMemo(
    () => registrationApplications.filter((a) => a.status === 'Submitted' || a.status === 'Under Review'),
    [registrationApplications],
  );
  const enrolled = useMemo(
    () => registrationApplications.filter((a) => a.status === 'Enrolled'),
    [registrationApplications],
  );
  const rejected = useMemo(
    () => registrationApplications.filter((a) => a.status === 'Rejected'),
    [registrationApplications],
  );

  return (
    <div className="space-y-6 animate-fade-in text-left">
      <KpiGrid>
        <KpiWidget label="Total Applications" value={registrationApplications.length} tone="emphasis" />
        <KpiWidget label="Pending Review" value={pending.length} hint="Submitted or under review" />
        <KpiWidget label="Enrolled" value={enrolled.length} />
        <KpiWidget label="Rejected" value={rejected.length} />
      </KpiGrid>

      <TablePanel title="Applications Queue">
        <table className="eskooly-table">
          <thead>
            <tr>
              <th className="p-3 text-left text-muted-foreground font-semibold">Applicant</th>
              <th className="p-3 text-left text-muted-foreground font-semibold">Grade Applied</th>
              <th className="p-3 text-left text-muted-foreground font-semibold">Parent Contact</th>
              <th className="p-3 text-left text-muted-foreground font-semibold">Submitted</th>
              <th className="p-3 text-left text-muted-foreground font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40 text-muted-foreground">
            {registrationApplications.slice(0, 10).map((app) => (
              <tr key={app.id} className="hover:bg-muted/10">
                <td className="p-3 text-foreground font-bold">{app.applicantName}</td>
                <td className="p-3">{app.gradeApplied}</td>
                <td className="p-3">{app.parentName} · {app.parentPhone}</td>
                <td className="p-3">{app.submittedAt}</td>
                <td className="p-3">
                  <Badge variant={statusVariant[app.status] ?? 'neutral'} size="sm" className="font-bold">
                    {app.status}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TablePanel>
    </div>
  );
};
