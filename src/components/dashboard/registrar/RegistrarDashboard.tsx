'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { KpiWidget } from '@/components/dashboard/KpiWidget';
import { ContentCard } from '@/components/dashboard/ContentCard';
import { Badge } from '@/components/ui/badge';
import {
  applicationsAwaitingReview,
  enrollmentByGrade,
  filterSchoolStudents,
  pendingApplications,
  statusBadgeVariant,
} from '@/lib/registrarPortal';
import { api, type AuditLogEntry } from '@/lib/api';
import { readStoredSession } from '@/lib/auth';
import { currentAcademicYear } from '@/lib/academicYear';

function describeAuditEntry(entry: AuditLogEntry): string {
  const who = entry.actorName || entry.actorEmail || 'Someone';
  return `${who} · ${entry.action.replace(/[._]/g, ' ')}`;
}

export const RegistrarDashboard: React.FC = () => {
  const { students, registrationApplications, schools, currentUser } = useApp();
  const currentSchool = schools.find((s) => s.id === currentUser?.schoolId) ?? schools[0];
  const schoolName = currentSchool?.name ?? 'your school';
  const session = readStoredSession();
  const [recentActivity, setRecentActivity] = useState<AuditLogEntry[]>([]);

  useEffect(() => {
    api
      .listAuditLogs({ limit: 8 })
      .then(setRecentActivity)
      .catch(() => setRecentActivity([]));
  }, [session?.schoolId]);

  const schoolStudents = useMemo(() => filterSchoolStudents(students), [students]);
  const activeStudents = schoolStudents.filter((s) => s.status === 'Active');
  const pending = pendingApplications(registrationApplications);
  const awaitingReview = applicationsAwaitingReview(registrationApplications);
  const approvedReady = registrationApplications.filter((a) => a.status === 'Approved');
  const byGrade = enrollmentByGrade(schoolStudents);

  const recentApps = [...registrationApplications]
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
    .slice(0, 5);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiWidget
          label="Active Students"
          value={activeStudents.length}
          hint={`Currently enrolled at ${schoolName} · ${currentAcademicYear()}`}
          tone="inverse"
        />
        <KpiWidget
          label="Pending Applications"
          value={pending.length}
          hint={`${awaitingReview.length} awaiting review`}
          tone="emphasis"
        />
        <KpiWidget
          label="Ready to Enroll"
          value={approvedReady.length}
          hint="Approved applications"
        />
        <KpiWidget
          label="Avg. GPA"
          value={
            activeStudents.length > 0
              ? (
                  activeStudents.reduce((a, s) => a + s.gpa, 0) / activeStudents.length
                ).toFixed(2)
              : '—'
          }
          hint="School-wide average"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ContentCard title="Recent Applications" description="Latest registration submissions">
          <div className="space-y-2">
            {recentApps.map((app) => (
              <div
                key={app.id}
                className="flex items-center justify-between p-3 rounded-lg border border-border/60 bg-muted/20"
              >
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">{app.applicantName}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {app.gradeApplied} · {app.sectionRequested} · {app.submittedAt}
                  </p>
                </div>
                <Badge variant={statusBadgeVariant(app.status)} size="sm">
                  {app.status}
                </Badge>
              </div>
            ))}
          </div>
        </ContentCard>

        <ContentCard title="Enrollment by Grade" description="Active students per grade level">
          <div className="space-y-2">
            {Object.entries(byGrade).map(([grade, count]) => (
              <div key={grade} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                <span className="text-xs font-medium text-foreground">{grade}</span>
                <div className="flex items-center gap-3">
                  <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${Math.min(100, (count / 50) * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-muted-foreground w-8 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </ContentCard>
      </div>

      <ContentCard title="Recent Activity" description="Latest registrar-relevant actions across the school">
        {recentActivity.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">No recent activity recorded.</p>
        ) : (
          <div className="space-y-2">
            {recentActivity.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between p-3 rounded-lg border border-border/60 bg-muted/20"
              >
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">{describeAuditEntry(entry)}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {entry.entityType}
                    {entry.entityId ? ` · ${entry.entityId}` : ''}
                  </p>
                </div>
                <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                  {new Date(entry.createdAt).toLocaleString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            ))}
          </div>
        )}
      </ContentCard>
    </div>
  );
};
