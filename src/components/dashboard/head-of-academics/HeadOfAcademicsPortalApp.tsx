'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { KpiWidget, KpiGrid } from '@/components/dashboard/KpiWidget';
import { ContentCard } from '@/components/dashboard/ContentCard';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { MetricProgressRow } from '@/components/ui/metric-progress-row';
import { computeSubjectPerformance } from '@/lib/analytics';
import { portalTabPath, tabFromPortalPath } from '@/lib/portalPaths';
import { resolveHeadOfAcademicsScope } from '@/lib/headOfAcademicsPortal';
import { departmentIdForSubject } from '@/lib/departmentHead';
import { PortalProfileCard } from '@/components/dashboard/shared/PortalProfileCard';
import { FileText, GraduationCap, Settings2, Users } from 'lucide-react';
import { VPClassReportPanel } from './VPClassReportPanel';
import { VPTranscriptPanel } from './VPTranscriptPanel';
import { VPReportTemplateBuilder } from './VPReportTemplateBuilder';
import { AnnualLessonPlanPanel } from './AnnualLessonPlanPanel';
import { AcademicCalendarPanel } from './AcademicCalendarPanel';
import { ResourcesPanel } from './ResourcesPanel';
import { TrainingPanel } from './TrainingPanel';

const COVERAGE_DATA = [
  { grade: 'Grade 9', stream: 'Natural Science', coverage: 78.4, status: 'On Track' },
  { grade: 'Grade 10', stream: 'Natural Science', coverage: 82.1, status: 'On Track' },
  { grade: 'Grade 11', stream: 'Natural Science', coverage: 64.8, status: 'Behind Schedule' },
  { grade: 'Grade 12', stream: 'Natural Science', coverage: 91.2, status: 'Completed' },
];

export default function HeadOfAcademicsPortalApp() {
  const pathname = usePathname();
  const router = useRouter();
  const activeTab = tabFromPortalPath(pathname, 'head-of-academics');
  const setActiveTab = useCallback(
    (tab: string) => {
      router.push(portalTabPath('head-of-academics', tab));
    },
    [router],
  );

  const [calendarHeaderActions, setCalendarHeaderActions] = useState<React.ReactNode>(null);

  const { currentUser, students, classes, schools, departments, studentGradeEntries, trainingMaterials } = useApp();
  const scope = useMemo(() => resolveHeadOfAcademicsScope(currentUser), [currentUser]);
  const school = useMemo(() => schools.find((s) => s.id === scope?.schoolId), [schools, scope]);

  const subjectPerformance = useMemo(
    () => computeSubjectPerformance(studentGradeEntries),
    [studentGradeEntries],
  );

  const departmentProgress = useMemo(() => {
    return departments.map((dept) => {
      const deptEntries = studentGradeEntries.filter(
        (e) => departmentIdForSubject(e.subject) === dept.id,
      );
      const avgPercent = deptEntries.length > 0
        ? deptEntries.reduce((acc, e) => acc + (e.maxScore > 0 ? (e.score / e.maxScore) * 100 : 0), 0) / deptEntries.length
        : 0;
      return { ...dept, progress: parseFloat(avgPercent.toFixed(1)) };
    });
  }, [departments, studentGradeEntries]);

  const gradeSubjectAverages = useMemo(() => {
    const byGrade = new Map<string, Map<string, { total: number; count: number }>>();
    for (const entry of studentGradeEntries) {
      if (!byGrade.has(entry.gradeLevel)) byGrade.set(entry.gradeLevel, new Map());
      const bySubject = byGrade.get(entry.gradeLevel)!;
      const percent = entry.maxScore > 0 ? (entry.score / entry.maxScore) * 100 : 0;
      const existing = bySubject.get(entry.subject) ?? { total: 0, count: 0 };
      bySubject.set(entry.subject, { total: existing.total + percent, count: existing.count + 1 });
    }
    return Array.from(byGrade.entries())
      .map(([gradeLevel, bySubject]) => ({
        gradeLevel,
        subjects: Array.from(bySubject.entries())
          .map(([subject, { total, count }]) => ({ subject, average: parseFloat((total / count).toFixed(1)) }))
          .sort((a, b) => a.subject.localeCompare(b.subject)),
      }))
      .sort((a, b) => a.gradeLevel.localeCompare(b.gradeLevel));
  }, [studentGradeEntries]);

  const curriculumResources = useMemo(
    () => trainingMaterials.filter((m) => !m.departmentId),
    [trainingMaterials],
  );
  const disseminatedCount = useMemo(
    () => curriculumResources.filter((m) => m.disseminated).length,
    [curriculumResources],
  );

  const meta = useMemo(() => {
    switch (activeTab) {
      case 'class-reports':
        return { title: 'Class Reports', subtitle: 'Generate term report cards for a class' };
      case 'transcripts':
        return { title: 'Transcripts', subtitle: 'Generate cumulative transcripts for a student' };
      case 'template-builder':
        return { title: 'Student Report Card Builder', subtitle: 'Configure this school’s report card and transcript layout' };
      case 'annual-plans':
        return { title: 'Annual Lesson Plans', subtitle: 'School-wide view of curriculum maps published by department heads' };
      case 'academic-calendar':
        return { title: 'Academic Calendar', subtitle: 'Click days on the MOE calendar to assign events, then generate, save, and publish.' };
      case 'resources':
        return { title: 'School Resources', subtitle: 'Upload and disseminate school-wide pedagogy and policy materials.' };
      case 'training':
        return { title: 'Training', subtitle: 'Browse every training type — leadership, subject-matter, induction, and continuous development' };
      case 'settings':
        return { title: 'Portal Settings', subtitle: 'Your account and school details' };
      default:
        return { title: 'Head of Academics Dashboard', subtitle: 'Overview of school-wide academic records and curriculum coverage' };
    }
  }, [activeTab]);

  const shellActions = activeTab === 'academic-calendar' ? calendarHeaderActions : undefined;

  return (
    <DashboardShell
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      title={meta.title}
      subtitle={meta.subtitle}
      eyebrow={school ? `${school.name}` : 'Head of Academics'}
      actions={
        shellActions ?? (
          <span className="text-xs px-3 py-1.5 rounded-md bg-primary/10 text-primary font-medium border border-primary/20">
            {currentUser?.displayName ?? 'Head of Academics'}
          </span>
        )
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Syllabus Completion Index by Grade</CardTitle>
                <CardDescription>Estimated percentage of textbook chapters finalized relative to school weeks.</CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="space-y-4">
                  {COVERAGE_DATA.map((cov) => (
                    <MetricProgressRow
                      key={cov.grade}
                      label={`${cov.grade} (${cov.stream})`}
                      headerExtra={
                        <span className="text-xs font-medium text-muted-foreground">{cov.status}</span>
                      }
                      value={cov.coverage}
                      barClassName={cov.status === 'Behind Schedule' ? 'bg-primary/50' : 'bg-primary'}
                      targetPercent={80}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold">National Curriculum Sync Rates</CardTitle>
                <CardDescription>Subject performance average and predicted national examination readiness index.</CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="space-y-4">
                  {subjectPerformance.map((sub) => (
                    <div key={sub.subject} className="flex justify-between items-center p-3 bg-muted/40 border border-border/40 rounded-lg">
                      <div className="text-left">
                        <p className="text-xs font-semibold text-foreground">{sub.subject}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Coverage target: 80%</p>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <p className="text-[10px] font-bold text-muted-foreground">Class average</p>
                          <p className="text-xs font-bold text-foreground">{sub.average}%</p>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                          sub.status === 'Critical' ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'
                        }`}>
                          {sub.average > 70 ? 'On Track' : 'Slowing'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Curriculum Progress by Department</CardTitle>
                <CardDescription>Average student mastery of each department&apos;s subjects, used as a curriculum progress indicator.</CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="space-y-4">
                  {departmentProgress.length === 0 && (
                    <p className="text-xs text-muted-foreground">No departments configured yet.</p>
                  )}
                  {departmentProgress.map((dept) => (
                    <MetricProgressRow
                      key={dept.id}
                      label={dept.name}
                      headerExtra={
                        <span className="text-xs font-medium text-muted-foreground">{dept.teachersCount} teachers</span>
                      }
                      value={dept.progress}
                      targetPercent={80}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Average Grades by Subject &amp; Grade Level</CardTitle>
                <CardDescription>Term-to-date average score per subject, broken down by grade level.</CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="space-y-5 max-h-[360px] overflow-y-auto pr-1">
                  {gradeSubjectAverages.length === 0 && (
                    <p className="text-xs text-muted-foreground">No grade entries recorded yet.</p>
                  )}
                  {gradeSubjectAverages.map((grp) => (
                    <div key={grp.gradeLevel}>
                      <p className="text-xs font-bold text-foreground mb-2">{grp.gradeLevel}</p>
                      <div className="space-y-2">
                        {grp.subjects.map((s) => (
                          <MetricProgressRow
                            key={s.subject}
                            label={s.subject}
                            value={s.average}
                            targetPercent={80}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'class-reports' && <VPClassReportPanel />}
      {activeTab === 'transcripts' && <VPTranscriptPanel />}
      {activeTab === 'template-builder' && <VPReportTemplateBuilder />}
      {activeTab === 'annual-plans' && <AnnualLessonPlanPanel />}
      {activeTab === 'academic-calendar' && (
        <AcademicCalendarPanel onActionsChange={setCalendarHeaderActions} />
      )}
      {activeTab === 'resources' && <ResourcesPanel />}
      {activeTab === 'training' && <TrainingPanel />}

      {activeTab === 'settings' && (
        <div className="space-y-6 animate-fade-in text-left">
          <PortalProfileCard
            roleLabel="Head of Academics"
            fields={[
              { label: 'School', value: school?.name ?? '—' },
              { label: 'Students', value: students.length },
              { label: 'Classes', value: classes.length },
              { label: 'Resources published', value: disseminatedCount },
            ]}
          />
        </div>
      )}
    </DashboardShell>
  );
}
