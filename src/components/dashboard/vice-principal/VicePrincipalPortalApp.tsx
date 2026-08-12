'use client';

import React, { useCallback, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { KpiWidget, KpiGrid } from '@/components/dashboard/KpiWidget';
import { ContentCard } from '@/components/dashboard/ContentCard';
import { portalTabPath, tabFromPortalPath } from '@/lib/portalPaths';
import { resolveVicePrincipalScope } from '@/lib/vicePrincipalPortal';
import { PortalProfileCard } from '@/components/dashboard/shared/PortalProfileCard';
import { FileText, GraduationCap, Settings2, Users } from 'lucide-react';
import { VPClassReportPanel } from './VPClassReportPanel';
import { VPTranscriptPanel } from './VPTranscriptPanel';
import { VPReportTemplateBuilder } from './VPReportTemplateBuilder';

export default function VicePrincipalPortalApp() {
  const pathname = usePathname();
  const router = useRouter();
  const activeTab = tabFromPortalPath(pathname, 'vice-principal');
  const setActiveTab = useCallback(
    (tab: string) => {
      router.push(portalTabPath('vice-principal', tab));
    },
    [router],
  );

  const { currentUser, students, classes, schools } = useApp();
  const scope = useMemo(() => resolveVicePrincipalScope(currentUser), [currentUser]);
  const school = useMemo(() => schools.find((s) => s.id === scope?.schoolId), [schools, scope]);

  const meta = useMemo(() => {
    switch (activeTab) {
      case 'class-reports':
        return { title: 'Class Reports', subtitle: 'Generate term report cards for a class' };
      case 'transcripts':
        return { title: 'Transcripts', subtitle: 'Generate cumulative transcripts for a student' };
      case 'template-builder':
        return { title: 'Report Template Builder', subtitle: 'Configure this school’s report card and transcript layout' };
      case 'settings':
        return { title: 'Portal Settings', subtitle: 'Your account and school details' };
      default:
        return { title: 'Vice Principal Dashboard', subtitle: 'Overview of school-wide academic records' };
    }
  }, [activeTab]);

  return (
    <DashboardShell
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      title={meta.title}
      subtitle={meta.subtitle}
      eyebrow={school ? `${school.name}` : 'Vice Principal'}
      actions={
        <span className="text-xs px-3 py-1.5 rounded-md bg-primary/10 text-primary font-medium border border-primary/20">
          {currentUser?.displayName ?? 'Vice Principal'}
        </span>
      }
    >
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <KpiGrid>
            <KpiWidget
              label="Students"
              value={students.length}
              hint="School-wide enrollment"
              icon={<Users className="h-5 w-5" strokeWidth={1.75} />}
            />
            <KpiWidget
              label="Classes"
              value={classes.length}
              hint="Grade/section combinations"
              tone="default"
              icon={<GraduationCap className="h-5 w-5" strokeWidth={1.75} />}
            />
            <KpiWidget
              label="Class Reports"
              value="Generate"
              hint="Term report cards by class"
              tone="emphasis"
              icon={<FileText className="h-5 w-5" strokeWidth={1.75} />}
            />
            <KpiWidget
              label="Templates"
              value="Configure"
              hint="Per-school document layout"
              icon={<Settings2 className="h-5 w-5" strokeWidth={1.75} />}
            />
          </KpiGrid>

          <ContentCard
            title="Getting started"
            description="Generate official student documents from grades teachers have already entered"
          >
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <strong className="text-foreground">Class Reports</strong> — pick a grade, section, and term to
                generate every student&apos;s report card for that term.
              </li>
              <li>
                <strong className="text-foreground">Transcripts</strong> — pick a student to generate their
                cumulative academic record across all terms.
              </li>
              <li>
                <strong className="text-foreground">Report Template Builder</strong> — configure how this
                school&apos;s report cards and transcripts are laid out (header, grading scale, columns, signatures).
              </li>
            </ul>
          </ContentCard>
        </div>
      )}

      {activeTab === 'class-reports' && <VPClassReportPanel />}
      {activeTab === 'transcripts' && <VPTranscriptPanel />}
      {activeTab === 'template-builder' && <VPReportTemplateBuilder />}

      {activeTab === 'settings' && (
        <div className="space-y-6 animate-fade-in text-left">
          <PortalProfileCard
            roleLabel="Vice Principal"
            fields={[
              { label: 'School', value: school?.name ?? '—' },
              { label: 'Students', value: students.length },
              { label: 'Classes', value: classes.length },
            ]}
          />
        </div>
      )}
    </DashboardShell>
  );
}
