'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { KpiWidget, KpiGrid } from '@/components/dashboard/KpiWidget';
import { TablePanel } from '@/components/dashboard/TablePanel';
import { Badge } from '@/components/ui/badge';
import { MetricProgressRow } from '@/components/ui/metric-progress-row';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Dialog, DialogFooter } from '@/components/ui/dialog';
import { FormField, FormSectionHeading, formFieldInputClass } from '@/components/ui/form-field';
import { computeNationalStats, computeRegionalPerformance, computeSubjectPerformance } from '@/lib/analytics';
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
        ) : undefined
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
                            
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                              sub.status === 'Critical' 
                                ? 'bg-red-500/10 text-red-500 border border-red-500/20' 
                                : sub.status === 'Warning' 
                                ? 'bg-muted text-muted-foreground border border-border' 
                                : 'bg-primary/10 text-primary border border-primary/20'
                            }`}>
                              {sub.status}
                            </span>
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
                      options={[
                        { value: 'All', label: 'All Regions' },
                        { value: 'Addis Ababa', label: 'Addis Ababa' },
                        { value: 'Sidama', label: 'Sidama' },
                        { value: 'Amhara', label: 'Amhara' },
                        { value: 'Tigray', label: 'Tigray' },
                        { value: 'Oromia', label: 'Oromia' },
                      ]}
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
                            <button
                              type="button"
                              onClick={() => toggleSchoolStatus(sch.id)}
                              className="text-xs font-semibold text-foreground hover:text-primary cursor-pointer underline-offset-2 hover:underline"
                            >
                              {sch.status === 'Active' ? 'Suspend' : 'Activate'}
                            </button>
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
                    <Button variant="outline" className="text-xxs h-8 cursor-pointer">+ Upload Syllabus PDF</Button>
                  </div>
                }
              >
                    <table className="eskooly-table">
                      <thead>
                        <tr>
                          <th className="p-3 uppercase text-xxs text-muted-foreground font-semibold">Stream</th>
                          <th className="p-3 uppercase text-xxs text-muted-foreground font-semibold">Grade</th>
                          <th className="p-3 uppercase text-xxs text-muted-foreground font-semibold">Core Subjects</th>
                          <th className="p-3 uppercase text-xxs text-muted-foreground font-semibold">Syllabus Code</th>
                          <th className="p-3 uppercase text-xxs text-muted-foreground font-semibold">Active Version</th>
                          <th className="p-3 uppercase text-xxs text-muted-foreground font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40 text-muted-foreground">
                        <tr>
                          <td className="p-3 font-bold text-foreground">Natural Science</td>
                          <td className="p-3 font-semibold">Grade 9</td>
                          <td className="p-3 text-foreground">Biology, Chemistry, Math, Physics, English</td>
                          <td className="p-3 font-mono">ETH-NS-09-V3</td>
                          <td className="p-3">v3.4.1 (May 2026)</td>
                          <td className="p-3"><span className="text-foreground font-bold">✓ Approved</span></td>
                        </tr>
                        <tr>
                          <td className="p-3 font-bold text-foreground">Natural Science</td>
                          <td className="p-3 font-semibold">Grade 10</td>
                          <td className="p-3 text-foreground">Biology, Chemistry, Math, Physics, English</td>
                          <td className="p-3 font-mono">ETH-NS-10-V2</td>
                          <td className="p-3">v2.1.2 (Dec 2025)</td>
                          <td className="p-3"><span className="text-foreground font-bold">✓ Approved</span></td>
                        </tr>
                        <tr>
                          <td className="p-3 font-bold text-foreground">Social Science</td>
                          <td className="p-3 font-semibold">Grade 11</td>
                          <td className="p-3 text-foreground">History, Geography, Economics, Civics, Amharic</td>
                          <td className="p-3 font-mono">ETH-SS-11-V4</td>
                          <td className="p-3">v4.0.0 (New Draft)</td>
                          <td className="p-3"><span className="text-muted-foreground font-bold">⏳ In Review</span></td>
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
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          tr.status === 'Active' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                        }`}>
                          {tr.status}
                        </span>
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
