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
import { Dialog, DialogFooter } from '@/components/ui/dialog';
import { FormField, FormSectionHeading, formFieldInputClass } from '@/components/ui/form-field';
import { computeNationalStats, computeRegionalPerformance, computeSubjectPerformance } from '@/lib/analytics';
import { uploadFile } from '@/lib/api';
import { usePortalTab } from '@/lib/usePortalTab';
import { PortalProfileCard } from '@/components/dashboard/shared/PortalProfileCard';
import { MoeAcademicCalendarPanel } from '@/components/dashboard/moe/MoeAcademicCalendarPanel';
export default function MoePortalPage() {
  const { 
    schools, 
    teachers,
    students,
    studentGradeEntries,
    addSchool,
    toggleSchoolStatus,
    trainings,
    addNotification,
  } = useApp();

  const nationalStats = React.useMemo(() => computeNationalStats(schools, teachers, students), [schools, teachers, students]);
  const regionalPerformance = React.useMemo(() => computeRegionalPerformance(schools, teachers, students), [schools, teachers, students]);
  const subjectPerformance = React.useMemo(() => computeSubjectPerformance(studentGradeEntries), [studentGradeEntries]);

  const { activeTab, setActiveTab } = usePortalTab('moe');
  const [searchSchool, setSearchSchool] = useState('');
  const [filterRegion, setFilterRegion] = useState('All');
  const [filterType, setFilterType] = useState('All');
  const [calendarHeaderActions, setCalendarHeaderActions] = useState<React.ReactNode>(null);

  // Add School Modal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [schoolName, setSchoolName] = useState('');
  const [schoolRegion, setSchoolRegion] = useState('Addis Ababa');
  const [schoolType, setSchoolType] = useState('Public');
  const [schoolPrincipal, setSchoolPrincipal] = useState('');
  const [schoolCapacity, setSchoolCapacity] = useState(1000);
  const [schoolEmail, setSchoolEmail] = useState('');
  const [schoolPhone, setSchoolPhone] = useState('');

  // AI Generation State
  const [generatingReport, setGeneratingReport] = useState(false);
  const [aiReportOutput, setAiReportOutput] = useState<string | null>(null);

  // Syllabus upload state
  const [uploadingSyllabus, setUploadingSyllabus] = useState(false);
  const syllabusFileInputRef = React.useRef<HTMLInputElement>(null);

  const handleSyllabusFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploadingSyllabus(true);
    uploadFile(file)
      .then(() => {
        addNotification('Syllabus Uploaded', `${file.name} was uploaded successfully.`, 'success');
      })
      .catch(() => {
        addNotification('Upload Failed', `${file.name} could not be uploaded — try again.`, 'alert');
      })
      .finally(() => setUploadingSyllabus(false));
  };

  const handleRegisterSchool = (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolName || !schoolPrincipal || !schoolEmail) return;

    addSchool({
      name: schoolName,
      region: schoolRegion,
      type: schoolType as 'Public' | 'Private',
      principal: schoolPrincipal,
      capacity: Number(schoolCapacity),
      email: schoolEmail,
      phone: schoolPhone || '+251-11-000-0000',
    });

    // Reset Form
    setSchoolName('');
    setSchoolPrincipal('');
    setSchoolEmail('');
    setSchoolPhone('');
    setIsAddOpen(false);
  };

  const handleGenerateAIReport = () => {
    setGeneratingReport(true);
    setTimeout(() => {
      const worstPassRateRegion = [...regionalPerformance].sort((a, b) => a.passRate - b.passRate)[0];
      const worstShortageRegion = [...regionalPerformance].sort((a, b) => b.teachersShortage - a.teachersShortage)[0];
      const worstSubject = [...subjectPerformance].sort((a, b) => a.average - b.average)[0];
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
          ? `   - ${worstSubject.subject} has the lowest national average at ${worstSubject.average}% (status: ${worstSubject.status}).`
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
      title: 'Curriculum Management',
      subtitle: 'National curriculum standards and textbook alignment.',
    },
    training: {
      title: 'Teacher Training',
      subtitle: 'Professional development programs nationwide.',
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

  // Region options for the filter — derived from actual schools on record, so a school
  // registered in any region can always be filtered, not just the five originally seeded ones.
  const regionFilterOptions = React.useMemo(() => {
    const distinctRegions = Array.from(new Set(schools.map((sch) => sch.region))).sort();
    const regions = distinctRegions.length > 0
      ? distinctRegions
      : ['Addis Ababa', 'Oromia', 'Amhara', 'Tigray', 'Sidama', 'SNNPR'];
    return [{ value: 'All', label: 'All Regions' }, ...regions.map((region) => ({ value: region, label: region }))];
  }, [schools]);

  // Filtered schools
  const filteredSchools = schools.filter(sch => {
    const matchesSearch = sch.name.toLowerCase().includes(searchSchool.toLowerCase()) || sch.code.toLowerCase().includes(searchSchool.toLowerCase());
    const matchesRegion = filterRegion === 'All' || sch.region === filterRegion;
    const matchesType = filterType === 'All' || sch.type === filterType;
    return matchesSearch && matchesRegion && matchesType;
  });

  return (
    <DashboardShell
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      title={meta.title}
      subtitle={meta.subtitle}
      eyebrow={meta.eyebrow}
      actions={
        activeTab === 'schools' ? (
          <Button size="sm" onClick={() => setIsAddOpen(true)}>
            + Register School
          </Button>
        ) : activeTab === 'academic-calendar' ? (
          calendarHeaderActions
        ) : (
          <Badge variant="success" badgeStyle="subtle" size="md">
            Federal Access Active
          </Badge>
        )
      }
    >
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <KpiGrid>
                <KpiWidget label="National Schools" value={nationalStats.schoolsCount} hint="↑ +4.2% year-over-year" tone="default" icon={<span className="text-lg">🏫</span>} />
                <KpiWidget label="Certified Teachers" value={nationalStats.teachersCount.toLocaleString()} hint="↑ +8.1% training" tone="emphasis" icon={<span className="text-lg">👩‍🏫</span>} />
                <KpiWidget label="Enrolled Students" value={nationalStats.studentsCount.toLocaleString()} hint="All regions" tone="default" icon={<span className="text-lg">🎓</span>} />
                <KpiWidget label="Average Pass Rate" value={`${nationalStats.averagePassRate}%`} hint="↑ +1.4% above target" tone="emphasis" icon={<span className="text-lg">📊</span>} />
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

                {/* Subject Risk and Vacancy Analytics */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-semibold">Subject Coverage Performance & Risks</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <div className="space-y-4">
                      {subjectPerformance.map((sub) => (
                        <div key={sub.subject} className="flex items-center justify-between p-3 bg-muted/40 border border-border/40 rounded-lg">
                          <div className="flex flex-col text-left">
                            <span className="text-xs font-semibold text-foreground">{sub.subject}</span>
                            <span className="text-[10px] text-muted-foreground mt-0.5">National Average: {sub.average}%</span>
                          </div>
                          
                          <div className="flex items-center space-x-3">
                            <div className="text-right">
                              <p className="text-[10px] font-semibold text-muted-foreground">Dropout Correlation</p>
                              <p className="text-xs font-bold text-foreground">{sub.riskIndex}%</p>
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
                    + Add School
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
                      <th>Status</th>
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
                      filteredSchools.map((sch) => (
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
                              onClick={() => toggleSchoolStatus(sch.id)}
                              className="h-8 text-xs"
                            >
                              {sch.status === 'Active' ? 'Suspend' : 'Activate'}
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </TablePanel>

              {/* Add School Dialog */}
              <Dialog
                isOpen={isAddOpen}
                onClose={() => setIsAddOpen(false)}
                title="Register New School Node"
                description="Input institutional profile details to assign federal identification codes."
              >
                <form onSubmit={handleRegisterSchool} className="space-y-5 text-left">
                  <div className="space-y-4">
                    <FormSectionHeading>School Identity</FormSectionHeading>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField label="School Name">
                        <input
                          type="text"
                          required
                          value={schoolName}
                          onChange={(e) => setSchoolName(e.target.value)}
                          placeholder="e.g. Hawassa Academy"
                          className={formFieldInputClass}
                        />
                      </FormField>
                      <FormField label="Institution Principal">
                        <input
                          type="text"
                          required
                          value={schoolPrincipal}
                          onChange={(e) => setSchoolPrincipal(e.target.value)}
                          placeholder="e.g. Ato Martha"
                          className={formFieldInputClass}
                        />
                      </FormField>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <FormField label="Region Zone">
                        <Select
                          options={[
                            { value: 'Addis Ababa', label: 'Addis Ababa' },
                            { value: 'Oromia', label: 'Oromia' },
                            { value: 'Amhara', label: 'Amhara' },
                            { value: 'Tigray', label: 'Tigray' },
                            { value: 'Sidama', label: 'Sidama' },
                          ]}
                          value={schoolRegion}
                          onChange={(e) => setSchoolRegion(e.target.value)}
                        />
                      </FormField>
                      <FormField label="Funding Sector">
                        <Select
                          options={[
                            { value: 'Public', label: 'Public Sector' },
                            { value: 'Private', label: 'Private Sector' },
                          ]}
                          value={schoolType}
                          onChange={(e) => setSchoolType(e.target.value)}
                        />
                      </FormField>
                      <FormField label="Total Student Capacity">
                        <input
                          type="number"
                          required
                          value={schoolCapacity}
                          onChange={(e) => setSchoolCapacity(Number(e.target.value))}
                          className={formFieldInputClass}
                        />
                      </FormField>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <FormSectionHeading>Contact Information</FormSectionHeading>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField label="Administrative Email">
                        <input
                          type="email"
                          required
                          value={schoolEmail}
                          onChange={(e) => setSchoolEmail(e.target.value)}
                          placeholder="office@academy.edu.et"
                          className={formFieldInputClass}
                        />
                      </FormField>
                      <FormField label="Direct Hotline Phone">
                        <input
                          type="text"
                          value={schoolPhone}
                          onChange={(e) => setSchoolPhone(e.target.value)}
                          placeholder="+251-46-XXX-XXXX"
                          className={formFieldInputClass}
                        />
                      </FormField>
                    </div>
                  </div>

                  <DialogFooter className="mt-2">
                    <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)} className="text-xs h-10 cursor-pointer">
                      Cancel
                    </Button>
                    <Button type="submit" variant="organic" className="text-xs h-10 border-none cursor-pointer">
                      Register School Node
                    </Button>
                  </DialogFooter>
                </form>
              </Dialog>

            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 3: CURRICULUM MANAGEMENT                        */}
          {/* ==================================================== */}
          {activeTab === 'curriculum' && (
            <div className="space-y-6 animate-fade-in">
              <TablePanel
                title="Federal Curriculum Syllabi Registry"
                actions={
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] bg-muted text-foreground border border-border px-3 py-1 rounded-full font-bold">
                      Academic Year: 2026 / 2027
                    </span>
                    <input
                      ref={syllabusFileInputRef}
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={handleSyllabusFileSelected}
                    />
                    <Button
                      variant="outline"
                      className="text-xxs h-8 cursor-pointer"
                      loading={uploadingSyllabus}
                      onClick={() => syllabusFileInputRef.current?.click()}
                    >
                      + Upload Syllabus PDF
                    </Button>
                  </div>
                }
              >
                    <table className="eskooly-table">
                      <thead>
                        <tr>
                          <th>Stream</th>
                          <th>Grade</th>
                          <th>Core Subjects</th>
                          <th>Syllabus Code</th>
                          <th>Active Version</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40 text-muted-foreground">
                        <tr>
                          <td className="p-3 font-bold text-foreground">Natural Science</td>
                          <td className="p-3 font-semibold">Grade 9</td>
                          <td className="p-3 text-foreground">Biology, Chemistry, Math, Physics, English</td>
                          <td className="p-3 font-mono">ETH-NS-09-V3</td>
                          <td className="p-3">v3.4.1 (May 2026)</td>
                          <td className="p-3"><Badge variant="success" badgeStyle="subtle" size="sm">Approved</Badge></td>
                        </tr>
                        <tr>
                          <td className="p-3 font-bold text-foreground">Natural Science</td>
                          <td className="p-3 font-semibold">Grade 10</td>
                          <td className="p-3 text-foreground">Biology, Chemistry, Math, Physics, English</td>
                          <td className="p-3 font-mono">ETH-NS-10-V2</td>
                          <td className="p-3">v2.1.2 (Dec 2025)</td>
                          <td className="p-3"><Badge variant="success" badgeStyle="subtle" size="sm">Approved</Badge></td>
                        </tr>
                        <tr>
                          <td className="p-3 font-bold text-foreground">Social Science</td>
                          <td className="p-3 font-semibold">Grade 11</td>
                          <td className="p-3 text-foreground">History, Geography, Economics, Civics, Amharic</td>
                          <td className="p-3 font-mono">ETH-SS-11-V4</td>
                          <td className="p-3">v4.0.0 (New Draft)</td>
                          <td className="p-3"><Badge variant="warning" badgeStyle="subtle" size="sm">In Review</Badge></td>
                        </tr>
                      </tbody>
                    </table>
              </TablePanel>
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 4: TEACHER TRAINING                             */}
          {/* ==================================================== */}
          {activeTab === 'training' && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {trainings.map((tr) => (
                  <Card key={tr.id} hoverGlow>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <Badge variant={tr.status === 'Active' ? 'success' : 'neutral'} badgeStyle="subtle" size="sm">
                          {tr.status}
                        </Badge>
                        <span className="text-[9px] text-muted-foreground">{tr.duration}</span>
                      </div>
                      <CardTitle className="text-sm font-bold text-foreground mt-2 leading-snug">{tr.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-2 text-xxs font-medium text-muted-foreground">
                      <MetricProgressRow
                        label="Teachers Graduated"
                        value={(tr.completedCount / tr.totalCount) * 100}
                        valueDisplay={`${tr.completedCount} / ${tr.totalCount}`}
                        barClassName="bg-primary"
                        className="mb-1"
                      />
                      <p className="text-[10px] text-muted-foreground mt-2.5">Start Date: {tr.startDate}</p>
                    </CardContent>
                  </Card>
                ))}

              </div>
            </div>
          )}

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
