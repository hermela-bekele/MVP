'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { KpiWidget, KpiGrid } from '@/components/dashboard/KpiWidget';
import { ContentCard } from '@/components/dashboard/ContentCard';
import { TablePanel } from '@/components/dashboard/TablePanel';
import { Badge } from '@/components/ui/badge';
import { MetricProgressRow } from '@/components/ui/metric-progress-row';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Dialog, DialogFooter } from '@/components/ui/dialog';
import { computeNationalStats, computeRegionalPerformance, computeSubjectPerformance } from '@/lib/analytics';
export default function MoePortalPage() {
  const { 
    schools, 
    teachers,
    students,
    studentGradeEntries,
    addSchool, 
    toggleSchoolStatus,
    trainings,
    addNotification
  } = useApp();

  const nationalStats = React.useMemo(() => computeNationalStats(schools, teachers, students), [schools, teachers, students]);
  const regionalPerformance = React.useMemo(() => computeRegionalPerformance(schools, teachers, students), [schools, teachers, students]);
  const subjectPerformance = React.useMemo(() => computeSubjectPerformance(studentGradeEntries), [studentGradeEntries]);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchSchool, setSearchSchool] = useState('');
  const [filterRegion, setFilterRegion] = useState('All');
  const [filterType, setFilterType] = useState('All');
  
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
      setAiReportOutput(`
[Ethiopian MOE AI Predictive Synthesis – May 2026]

1. Regional Dropout Forecasting:
   - High alert identified in Sidama Region secondary nodes. Current predictive dropout risk sits at 14.2% due to agricultural seasonal migration.
   - Recommended Action: Launch targeted evening study sections and localized attendance tracking.

2. Teacher Shortage Predictions:
   - STEM teacher vacancies in Tigray region are predicted to expand by 8.5% over the next two terms.
   - Mathematics teacher ratios require immediate optimization in Hawassa zones.

3. Curriculum coverage gaps:
   - Grade 11 Physics coverage is lagging by 18% nationwide, attributed to practical lab duration constraints.
      `);
      addNotification('AI Analytics Report Ready', 'Predicted national dropout and teacher shortage analysis is now available.', 'success');
      setGeneratingReport(false);
    }, 1500);
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
    analytics: {
      title: 'AI Risk Analytics',
      subtitle: 'Predictive insights on dropout risk and staffing gaps.',
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
        ) : (
          <span className="text-xs px-3 py-1.5 rounded-md bg-primary/10 text-primary font-semibold border border-primary/20">
            Federal Access Active
          </span>
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
                    <CardDescription>Average secondary graduation percentage by administrative zone</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <div className="space-y-4">
                      {regionalPerformance.map((reg) => (
                        <MetricProgressRow
                          key={reg.name}
                          label={reg.name}
                          value={reg.passRate}
                          barClassName="bg-primary"
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Subject Risk and Vacancy Analytics */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-semibold">Subject Coverage Performance & Risks</CardTitle>
                    <CardDescription>Assessment pass ratios and predicted coverage failure probability</CardDescription>
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
                description={`${filteredSchools.length} institutions matching current filters`}
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
                <form onSubmit={handleRegisterSchool} className="space-y-4 text-left">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">School Name</label>
                      <input 
                        type="text" 
                        required
                        value={schoolName}
                        onChange={(e) => setSchoolName(e.target.value)}
                        placeholder="e.g. Hawassa Academy" 
                        className="w-full h-10 px-3 bg-muted/40 border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Institution Principal</label>
                      <input 
                        type="text" 
                        required
                        value={schoolPrincipal}
                        onChange={(e) => setSchoolPrincipal(e.target.value)}
                        placeholder="e.g. Ato Martha" 
                        className="w-full h-10 px-3 bg-muted/40 border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Region Zone</label>
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
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Funding Sector</label>
                      <Select 
                        options={[
                          { value: 'Public', label: 'Public Sector' },
                          { value: 'Private', label: 'Private Sector' },
                        ]}
                        value={schoolType}
                        onChange={(e) => setSchoolType(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Total Student Capacity</label>
                      <input 
                        type="number" 
                        required
                        value={schoolCapacity}
                        onChange={(e) => setSchoolCapacity(Number(e.target.value))}
                        className="w-full h-10 px-3 bg-muted/40 border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Administrative Email</label>
                      <input 
                        type="email" 
                        required
                        value={schoolEmail}
                        onChange={(e) => setSchoolEmail(e.target.value)}
                        placeholder="office@academy.edu.et" 
                        className="w-full h-10 px-3 bg-muted/40 border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Direct Hotline Phone</label>
                      <input 
                        type="text" 
                        value={schoolPhone}
                        onChange={(e) => setSchoolPhone(e.target.value)}
                        placeholder="+251-46-XXX-XXXX" 
                        className="w-full h-10 px-3 bg-muted/40 border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200"
                      />
                    </div>
                  </div>

                  <DialogFooter className="mt-6">
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
                description="Manage alignment thresholds, stream subdivisions and curriculum version logs."
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
                      <CardDescription className="text-xxs text-primary font-semibold mt-1">Instructor: {tr.instructor}</CardDescription>
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
          {/* TAB 5: AI RISK ANALYTICS                            */}
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
                    <div className="p-5 bg-slate-900/60 border border-slate-800 text-slate-300 rounded-lg text-xxs font-mono leading-relaxed text-left whitespace-pre-wrap shadow-inner glass">
                      {aiReportOutput}
                    </div>
                  )}
                </CardContent>
              </Card>

            </div>
          )}

    </DashboardShell>
  );
}
