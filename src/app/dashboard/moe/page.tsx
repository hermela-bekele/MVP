'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { KpiWidget, KpiGrid } from '@/components/dashboard/KpiWidget';
import { TablePanel } from '@/components/dashboard/TablePanel';
import { Badge } from '@/components/ui/badge';
import { MetricProgressRow } from '@/components/ui/metric-progress-row';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Pagination } from '@/components/ui/pagination';
import { computeNationalStats, computeRegionalPerformance, computeSubjectPassRate, computeTeacherDevelopmentNeeds } from '@/lib/analytics';
import { usePortalTab } from '@/lib/usePortalTab';
import { PortalProfileCard } from '@/components/dashboard/shared/PortalProfileCard';
import { MoeAcademicCalendarPanel } from '@/components/dashboard/moe/MoeAcademicCalendarPanel';
import { ConnectSchoolDialog } from '@/components/dashboard/moe/ConnectSchoolDialog';
import { RegionsPanel } from '@/components/dashboard/moe/RegionsPanel';
import { MoeDocumentsPanel } from '@/components/dashboard/moe/MoeDocumentsPanel';
import { MoeTrainingPanel } from '@/components/dashboard/moe/MoeTrainingPanel';
import { MoeCompliancePanel } from '@/components/dashboard/moe/MoeCompliancePanel';
import { MoeSchoolMessagesPanel } from '@/components/dashboard/moe/MoeSchoolMessagesPanel';
import { MoeTeacherStaffingPanel } from '@/components/dashboard/moe/MoeTeacherStaffingPanel';
import { useConfirmDialog } from '@/components/ui/confirm-dialog';
export default function MoePortalPage() {
  const {
    schools,
    regions,
    teachers,
    students,
    studentGradeEntries,
    academicCalendars,
    teacherTrainingAssignments,
    updateSchoolIntegrationStatus,
    addNotification,
    activeEngine,
  } = useApp();
  const { confirm, ConfirmDialog } = useConfirmDialog();

  // Dashboard reporting scope — every metric below respects these two selections.
  const [dashboardRegion, setDashboardRegion] = useState('All');
  const [dashboardYear, setDashboardYear] = useState('All');
  const dashboardScope = React.useMemo(() => ({ region: dashboardRegion, academicYear: dashboardYear }), [dashboardRegion, dashboardYear]);
  const academicYearOptions = React.useMemo(
    () => Array.from(new Set(academicCalendars.map((c) => c.academicYear))).sort(),
    [academicCalendars]
  );

  const nationalStats = React.useMemo(
    () => computeNationalStats(schools, teachers, students, dashboardScope, academicCalendars),
    [schools, teachers, students, dashboardScope, academicCalendars]
  );
  const regionalPerformance = React.useMemo(() => computeRegionalPerformance(schools, teachers, students), [schools, teachers, students]);
  const subjectPassRate = React.useMemo(
    () => computeSubjectPassRate(studentGradeEntries, students, schools, dashboardScope),
    [studentGradeEntries, students, schools, dashboardScope]
  );
  const teacherDevelopmentNeeds = React.useMemo(
    () => computeTeacherDevelopmentNeeds(teacherTrainingAssignments, teachers, schools, dashboardScope),
    [teacherTrainingAssignments, teachers, schools, dashboardScope]
  );

  const { activeTab, setActiveTab } = usePortalTab('moe');

  // The National Dashboard belongs to the Administrative Engine only — a direct link
  // into /dashboard/moe/dashboard while another engine is active must not render it.
  React.useEffect(() => {
    if (activeTab !== 'dashboard' || !activeEngine || activeEngine === 'administrative') return;
    setActiveTab(activeEngine === 'curriculum' ? 'curriculum' : 'training');
  }, [activeTab, activeEngine, setActiveTab]);
  const [searchSchool, setSearchSchool] = useState('');
  const [filterRegion, setFilterRegion] = useState('All');
  const [filterType, setFilterType] = useState('All');
  const [calendarHeaderActions, setCalendarHeaderActions] = useState<React.ReactNode>(null);

  // Pagination state
  const SCHOOLS_PAGE_SIZE = 10;
  const [schoolsPage, setSchoolsPage] = useState(1);

  // Connect/Activate School dialog + Schools/Regions sub-view
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [schoolsSubView, setSchoolsSubView] = useState<'schools' | 'regions'>('schools');

  // AI Generation State
  const [generatingReport, setGeneratingReport] = useState(false);
  const [aiReportOutput, setAiReportOutput] = useState<string | null>(null);

  const handleManageConnection = async (schoolId: string, schoolName: string, nextStatus: 'Active' | 'Suspended') => {
    const ok = await confirm(
      nextStatus === 'Suspended' ? `Deactivate ${schoolName}'s PRIME participation?` : `Reactivate ${schoolName}'s PRIME participation?`,
      {
        description:
          nextStatus === 'Suspended'
            ? 'Staff and students at this school will lose portal access until it is reactivated.'
            : 'This school will regain full portal access immediately.',
        confirmLabel: nextStatus === 'Suspended' ? 'Deactivate' : 'Reactivate',
        danger: nextStatus === 'Suspended',
      }
    );
    if (!ok) return;
    try {
      await updateSchoolIntegrationStatus(schoolId, nextStatus);
    } catch {
      addNotification('Action Failed', 'Could not update this school’s connection status.', 'alert');
    }
  };

  const handleGenerateAIReport = () => {
    setGeneratingReport(true);
    setTimeout(() => {
      const worstPassRateRegion = [...regionalPerformance].sort((a, b) => a.passRate - b.passRate)[0];
      const worstShortageRegion = [...regionalPerformance].sort((a, b) => b.teachersShortage - a.teachersShortage)[0];
      const worstSubject = [...subjectPassRate].sort((a, b) => a.passRate - b.passRate)[0];
      const generatedAt = new Date().toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' });

      const lines = [
        `[Ethiopian MOE Analytics Synthesis – generated ${generatedAt}]`,
        '',
        '1. Regional Pass Rate:',
        worstPassRateRegion
          ? `   - Lowest pass rate is ${worstPassRateRegion.name} at ${worstPassRateRegion.passRate}% across ${worstPassRateRegion.schools} registered school(s).`
          : '   - No regional student data available yet.',
        '',
        '2. Teacher Shortage:',
        worstShortageRegion && worstShortageRegion.teachersShortage > 0
          ? `   - Largest projected teacher shortage is ${worstShortageRegion.name} at ${worstShortageRegion.teachersShortage}% of the expected staffing level.`
          : '   - No significant teacher shortage detected in current data.',
        '',
        '3. Subject Performance:',
        worstSubject
          ? `   - ${worstSubject.subject} has the lowest pass rate at ${worstSubject.passRate}% (status: ${worstSubject.status}).`
          : '   - No graded assessment data available yet.',
        '',
        `Based on ${nationalStats.schoolsCount} school(s), ${nationalStats.teachersCount} teacher(s), and ${nationalStats.studentsCount} student(s) currently on record.`,
      ];

      setAiReportOutput(lines.join('\n'));
      addNotification('Analytics Report Ready', 'Regional pass-rate, staffing, and subject performance summary is now available.', 'success');
      setGeneratingReport(false);
    }, 800);
  };

  const portalMeta: Record<string, { title: string; subtitle?: string; eyebrow?: string }> = {
    dashboard: {
      title: 'National Dashboard',
      eyebrow: 'Ministry of Education · Ethiopia',
      subtitle: 'National enrollment, pass rates, and regional performance at a glance.',
    },
    schools: {
      title: 'Manage Schools',
      subtitle: 'Register and monitor schools across all regions.',
    },
    curriculum: {
      title: 'Documents',
      subtitle: 'Upload and manage national policy, curriculum, and compliance documents.',
    },
    training: {
      title: 'Training',
      subtitle: 'National training programs and resources for schools and teachers.',
    },
    compliance: {
      title: 'Compliance',
      subtitle: 'Issue regulatory requirements and verify what schools submit against them.',
    },
    'school-messages': {
      title: 'School Messages',
      subtitle: 'Direct case-numbered communication threads with individual schools.',
    },
    'teacher-staffing': {
      title: 'Teacher Staffing',
      subtitle: 'Review Public-school departure notices and assign replacement teachers.',
    },
    'academic-calendar': {
      title: 'Academic Calendar',
      subtitle: 'Build and disseminate the national reference calendar to school heads.',
    },
    profile: {
      title: 'My Profile',
      subtitle: 'Your MOE account information.',
    },
  };

  const meta = portalMeta[activeTab] ?? portalMeta.dashboard;

  // Region options for the filter — sourced from MOE's region catalog, the one
  // authoritative list (replacing what used to be several separately-hardcoded ones).
  const regionFilterOptions = React.useMemo(
    () => [{ value: 'All', label: 'All Regions' }, ...regions.map((r) => ({ value: r.name, label: r.name }))],
    [regions]
  );

  // Filtered schools
  const filteredSchools = schools.filter(sch => {
    const matchesSearch = sch.name.toLowerCase().includes(searchSchool.toLowerCase()) || sch.code.toLowerCase().includes(searchSchool.toLowerCase());
    const matchesRegion = filterRegion === 'All' || sch.region === filterRegion;
    const matchesType = filterType === 'All' || sch.type === filterType;
    return matchesSearch && matchesRegion && matchesType;
  });

  const schoolsTotalPages = Math.max(1, Math.ceil(filteredSchools.length / SCHOOLS_PAGE_SIZE));
  const schoolsCurrentPage = Math.min(schoolsPage, schoolsTotalPages);
  const pagedSchools = filteredSchools.slice(
    (schoolsCurrentPage - 1) * SCHOOLS_PAGE_SIZE,
    schoolsCurrentPage * SCHOOLS_PAGE_SIZE,
  );

  return (
    <DashboardShell
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      title={meta.title}
      subtitle={meta.subtitle}
      eyebrow={meta.eyebrow}
      actions={
        activeTab === 'academic-calendar' ? (
          calendarHeaderActions
        ) : (
          <Badge variant="success" badgeStyle="subtle" size="md">
            Federal Access Active
          </Badge>
        )
      }
    >
          {activeTab === 'dashboard' && (!activeEngine || activeEngine === 'administrative') && (
            <div className="space-y-6">
              {/* Reporting scope — every metric on this dashboard respects these two selections */}
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-card p-4 rounded-xl border border-border/60">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Reporting Scope</span>
                <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                  <div className="w-44">
                    <Select
                      options={[{ value: 'All', label: 'All Regions (National)' }, ...regions.map((r) => ({ value: r.name, label: r.name }))]}
                      value={dashboardRegion}
                      onChange={(e) => setDashboardRegion(e.target.value)}
                    />
                  </div>
                  <div className="w-44">
                    <Select
                      options={[{ value: 'All', label: 'All Academic Years' }, ...academicYearOptions.map((y) => ({ value: y, label: y }))]}
                      value={dashboardYear}
                      onChange={(e) => setDashboardYear(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <KpiGrid>
                <KpiWidget label="Unique Active Institutions" value={nationalStats.uniqueActiveInstitutions} hint={dashboardRegion === 'All' ? 'All regions' : dashboardRegion} tone="default" icon={<span className="text-lg">🏫</span>} />
                <KpiWidget label="Certified Teachers" value={nationalStats.teachersCount.toLocaleString()} hint={dashboardRegion === 'All' ? 'All regions' : dashboardRegion} tone="emphasis" icon={<span className="text-lg">👩‍🏫</span>} />
                <KpiWidget label="Enrolled Students" value={nationalStats.studentsCount.toLocaleString()} hint={dashboardRegion === 'All' ? 'All regions' : dashboardRegion} tone="default" icon={<span className="text-lg">🎓</span>} />
                <KpiWidget label="Average Pass Rate" value={`${nationalStats.averagePassRate}%`} hint="Based on recorded student GPA" tone="emphasis" icon={<span className="text-lg">📊</span>} />
              </KpiGrid>

              {/* Data Visualization Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* SVG-based Region Comparison Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-semibold">Regional Pass Rate Comparison</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <div className="space-y-4">
                      {regionalPerformance.map((reg) => (
                        <MetricProgressRow
                          key={reg.name}
                          label={reg.name}
                          value={reg.passRate}
                          barClassName="bg-chart-color"
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Subject Pass Rate */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-semibold">Subject Pass Rate</CardTitle>
                    <CardDescription>Share of recorded results at or above the pass mark{dashboardRegion !== 'All' ? ` in ${dashboardRegion}` : ''}.</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-2">
                    {subjectPassRate.length === 0 ? (
                      <p className="text-xs text-muted-foreground py-6 text-center">No recorded results in this scope yet.</p>
                    ) : (
                      <div className="space-y-4">
                        {subjectPassRate.map((sub) => (
                          <div key={sub.subject} className="flex items-center justify-between p-3 bg-muted/40 border border-border/40 rounded-lg">
                            <div className="flex flex-col text-left">
                              <span className="text-xs font-semibold text-foreground">{sub.subject}</span>
                              <span className="text-[10px] text-muted-foreground mt-0.5">{sub.resultsCount} recorded results</span>
                            </div>

                            <div className="flex items-center space-x-3">
                              <div className="text-right">
                                <p className="text-[10px] font-semibold text-muted-foreground">Pass Rate</p>
                                <p className="text-xs font-bold text-foreground">{sub.passRate}%</p>
                              </div>

                              <Badge
                                variant={sub.status === 'Critical' ? 'danger' : sub.status === 'Warning' ? 'warning' : 'success'}
                                badgeStyle="subtle"
                                size="sm"
                              >
                                {sub.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Teacher Development */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-sm font-semibold">Teacher Development</CardTitle>
                    <CardDescription>What professional-development needs are emerging{dashboardRegion !== 'All' ? ` in ${dashboardRegion}` : ''}?</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-2">
                    {teacherDevelopmentNeeds.length === 0 ? (
                      <p className="text-xs text-muted-foreground py-6 text-center">No training assignment data in this scope yet.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {teacherDevelopmentNeeds.map((need) => (
                          <div key={need.program} className="p-3 bg-muted/40 border border-border/40 rounded-lg">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-semibold text-foreground">{need.program}</span>
                              {need.overdueCount > 0 && (
                                <Badge variant="danger" badgeStyle="subtle" size="sm">{need.overdueCount} overdue</Badge>
                              )}
                            </div>
                            <p className="text-[10px] text-muted-foreground">{need.assignedCount} assigned · {need.completionRate}% completed</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

              </div>

            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 2: MANAGE SCHOOLS                              */}
          {/* ==================================================== */}
          {activeTab === 'schools' && (
            <div className="space-y-6 animate-fade-in">

              <div className="inline-flex rounded-xl border border-border bg-white p-1 shadow-sm dark:bg-card">
                <button
                  type="button"
                  onClick={() => setSchoolsSubView('schools')}
                  className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors ${schoolsSubView === 'schools' ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Schools
                </button>
                <button
                  type="button"
                  onClick={() => setSchoolsSubView('regions')}
                  className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors ${schoolsSubView === 'regions' ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Regions
                </button>
              </div>

              {schoolsSubView === 'regions' ? (
                <RegionsPanel onViewSchools={(name) => { setFilterRegion(name); setSchoolsSubView('schools'); }} />
              ) : (
              <>
              {/* Directory Filter Controls */}
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-card p-4 rounded-xl border border-border/60">
                <div className="relative w-full sm:w-72">
                  <input
                    type="text"
                    value={searchSchool}
                    onChange={(e) => setSearchSchool(e.target.value)}
                    placeholder="Search schools by name or code..."
                    className="w-full h-10 pl-9 pr-4 bg-muted/40 border border-border rounded-md text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                  <div className="w-36">
                    <Select
                      options={regionFilterOptions}
                      value={filterRegion}
                      onChange={(e) => setFilterRegion(e.target.value)}
                    />
                  </div>

                  <div className="w-36">
                    <Select
                      options={[
                        { value: 'All', label: 'All Types' },
                        { value: 'Public', label: 'Public' },
                        { value: 'Private', label: 'Private' },
                      ]}
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                    />
                  </div>

                  <Button onClick={() => setIsAddOpen(true)} size="sm" className="h-10 font-semibold">
                    + Connect / Activate School
                  </Button>
                </div>
              </div>

              <TablePanel
                title="School Registry"
              >
                <table className="eskooly-table">
                  <thead>
                    <tr>
                      <th>School Code</th>
                      <th>School Name</th>
                      <th>Region</th>
                      <th>Type</th>
                      <th>Principal</th>
                      <th>Enrollment</th>
                      <th>Integration Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSchools.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center text-muted-foreground py-12">
                          No schools matching filter parameters were found in the registry.
                        </td>
                      </tr>
                    ) : (
                      pagedSchools.map((sch) => (
                        <tr key={sch.id}>
                          <td className="font-mono font-semibold">{sch.code}</td>
                          <td className="font-medium">{sch.name}</td>
                          <td className="text-muted-foreground">{sch.region}</td>
                          <td>
                            <Badge variant="neutral" badgeStyle="subtle" size="sm">
                              {sch.type}
                            </Badge>
                          </td>
                          <td>{sch.principal}</td>
                          <td className="text-muted-foreground">
                            {sch.studentsCount} / {sch.capacity}
                          </td>
                          <td>
                            <Badge
                              variant={sch.status === 'Active' ? 'success' : 'danger'}
                              badgeStyle="subtle"
                              size="sm"
                            >
                              {sch.status}
                            </Badge>
                          </td>
                          <td>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => void handleManageConnection(sch.id, sch.name, sch.status === 'Active' ? 'Suspended' : 'Active')}
                              className="h-8 text-xs"
                            >
                              {sch.status === 'Active' ? 'Deactivate Connection' : 'Reactivate Connection'}
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </TablePanel>

              <Pagination
                className="mt-3"
                currentPage={schoolsCurrentPage}
                totalPages={schoolsTotalPages}
                onPageChange={setSchoolsPage}
                totalItems={filteredSchools.length}
                pageSize={SCHOOLS_PAGE_SIZE}
                entityLabel="schools"
              />
              </>
              )}

              <ConnectSchoolDialog isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} />
              {ConfirmDialog}

            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 3: CURRICULUM MANAGEMENT                        */}
          {/* ==================================================== */}
          {activeTab === 'curriculum' && <MoeDocumentsPanel />}

          {activeTab === 'training' && <MoeTrainingPanel />}

          {activeTab === 'compliance' && <MoeCompliancePanel />}

          {activeTab === 'school-messages' && <MoeSchoolMessagesPanel />}

          {activeTab === 'teacher-staffing' && <MoeTeacherStaffingPanel />}

          {/* ==================================================== */}
          {/* TAB: ACADEMIC CALENDAR                              */}
          {/* ==================================================== */}
          {activeTab === 'analytics' && (
            <div className="space-y-6 animate-fade-in">
              
              <Card accent="accent" glow>
                <CardHeader>
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <span className="animate-pulse h-2.5 w-2.5 rounded-full bg-primary"></span>
                    AI Predictive Neural Engine – Federal Analytics Desk
                  </CardTitle>
                  <CardDescription>Utilize curriculum feedback and regional attendance models to forecast national education risks.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-2">
                  <div className="flex items-center space-x-3 bg-muted/40 p-4 border border-border/40 rounded-xl max-w-xl">
                    <span className="text-2xl">🧠</span>
                    <div className="text-left">
                      <h4 className="text-xs font-bold text-foreground">Forecast Gaps & Teacher Shortages</h4>
                      <p className="text-xxs text-muted-foreground mt-0.5">Generates deep recommendations mapping geographical teacher shortages and grade level risk thresholds.</p>
                    </div>
                  </div>

                  <Button 
                    variant="organic" 
                    onClick={handleGenerateAIReport}
                    loading={generatingReport}
                    className="text-xs h-10 border-none cursor-pointer"
                  >
                    🧠 Generate Neural Report
                  </Button>

                  {aiReportOutput && (
                    <div className="p-5 bg-muted border border-border text-foreground rounded-lg text-xxs font-mono leading-relaxed text-left whitespace-pre-wrap shadow-inner">
                      {aiReportOutput}
                    </div>
                  )}
                </CardContent>
              </Card>

            </div>
          )}

          {activeTab === 'academic-calendar' && (
            <MoeAcademicCalendarPanel onActionsChange={setCalendarHeaderActions} />
          )}

          {activeTab === 'profile' && (
            <div className="space-y-6 animate-fade-in text-left">
              <PortalProfileCard
                roleLabel="MOE Admin"
                fields={[
                  { label: 'Scope', value: 'National — all regions' },
                  { label: 'Schools overseen', value: schools.length },
                  { label: 'Certified teachers tracked', value: teachers.length.toLocaleString() },
                ]}
              />
            </div>
          )}

    </DashboardShell>
  );
}
