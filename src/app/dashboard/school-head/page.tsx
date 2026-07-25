'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
// import { generateAICalendarTimetable } from '@/lib/ai'; // TODO: Implement this function

// Decomposed Sub-components
import { OverviewDashboard } from '@/components/dashboard/school-head/OverviewDashboard';
import { PerformanceReports } from '@/components/dashboard/school-head/PerformanceReports';
import { StudentManagement } from '@/components/dashboard/school-head/StudentManagement';
import { EmployeeManagement } from '@/components/dashboard/school-head/EmployeeManagement';
import { WellnessCheckins } from '@/components/dashboard/school-head/WellnessCheckins';
import { SettingsPanel } from '@/components/dashboard/school-head/SettingsPanel';
import { SchoolHeadAnnouncements } from '@/components/dashboard/school-head/SchoolHeadAnnouncements';
import { PermissionsAdminPanel } from '@/components/dashboard/school-head/PermissionsAdminPanel';
import { SchoolHeadCalendar } from '@/components/dashboard/school-head/SchoolHeadCalendar';
import { ApplicationFormBuilder } from '@/components/dashboard/school-head/ApplicationFormBuilder';
import { SchoolBillingSettings } from '@/components/dashboard/school-head/SchoolBillingSettings';
import { ReenrollmentCampaignPanel } from '@/components/dashboard/school-head/ReenrollmentCampaignPanel';
import { MessageCenter } from '@/components/dashboard/messaging/MessageCenter';
import { TablePanel } from '@/components/dashboard/TablePanel';

export default function SchoolHeadPortalPage() {
  const {
    departments,
    classes,
    trainingMaterials,
    addTrainingMaterial,
    attendance,
    teachers,
  } = useApp();

  // Navigation state
  const [activeTab, setActiveTab] = useState('dashboard');

  // Listen to command palette tab change events
  React.useEffect(() => {
    const handleTabChange = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail) {
        setActiveTab(customEvent.detail);
      }
    };
    window.addEventListener('change-tab', handleTabChange);
    return () => window.removeEventListener('change-tab', handleTabChange);
  }, []);

  // Compute breadcrumbs
  const getBreadcrumbs = () => {
    const base = [{ label: 'School Head Portal', href: '#' }];
    switch (activeTab) {
      case 'dashboard': return [...base, { label: 'Overview' }];
      case 'reports': return [...base, { label: 'Performance Reports' }];
      case 'academic-calendar': return [...base, { label: 'Academic Calendar' }];
      case 'messages': return [...base, { label: 'Parent Messages' }];
      case 'manage-students': return [...base, { label: 'Student Directory' }];
      case 'manage-employees': return [...base, { label: 'Faculty Directory' }];
      case 'manage-classes': return [...base, { label: 'Classes Registry' }];
      case 'manage-departments': return [...base, { label: 'Department Registry' }];
      case 'manage-attendance': return [...base, { label: 'Attendance Ledger' }];
      case 'teachers-development': return [...base, { label: 'Professional Development' }];
      case 'manage-checkins': return [...base, { label: 'Wellness Checkins' }];
      case 'account-settings': return [...base, { label: 'Portal Settings' }];
      default: return base;
    }
  };

  // ==========================================
  // INLINE TABS LOGIC & STATES
  // ==========================================

  // AI Timetable Generation State
  const [calendarGrade, setCalendarGrade] = useState('Grade 9');
  const [generatingTimetable, setGeneratingTimetable] = useState(false);
  const [timetableOutput, setTimetableOutput] = useState<any | null>(null);

  const handleAISelectCalendar = async () => {
    setGeneratingTimetable(true);
    try {
      // TODO: Implement generateAICalendarTimetable function
      // const response = await generateAICalendarTimetable();
      const response = { message: 'Timetable generation not yet implemented' };
      setTimetableOutput(response);
    } catch {
      // Catch silently
    }
    setGeneratingTimetable(false);
  };

  // Professional Development Tab State
  const [devSubTab, setDevSubTab] = useState<'training' | 'progress'>('training');
  const [newMaterialTitle, setNewMaterialTitle] = useState('');
  const [newMaterialUrl, setNewMaterialUrl] = useState('');
  const [newMaterialCategory, setNewMaterialCategory] = useState('Pedagogy');

  const handleDevFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMaterialTitle || !newMaterialUrl) return;
    addTrainingMaterial({
      title: newMaterialTitle,
      resourceUrl: newMaterialUrl,
      category: newMaterialCategory,
    });
    setNewMaterialTitle('');
    setNewMaterialUrl('');
  };

  // Attendance Filters State
  const [attendanceTab, setAttendanceTab] = useState<'student' | 'employee'>('student');
  const [attStudentGrade, setAttStudentGrade] = useState('Grade 9');
  const [attStudentSection, setAttStudentSection] = useState('A');
  const [attStaffSearch, setAttStaffSearch] = useState('');

  const tabMeta: Record<string, { title: string; subtitle?: string }> = {
    dashboard: { title: 'Overview' },
    reports: {
      title: 'Performance Reports',
      subtitle: 'Analyze academic indicators, curriculum passing rates, and class averages.',
    },
    'academic-calendar': {
      title: 'Academic Calendar',
      subtitle: 'Publish term dates, exams, and school events for parent and student portals.',
    },
    messages: {
      title: 'Parent Messages',
      subtitle: 'Direct conversations with parents about attendance, progress, and support.',
    },
    'manage-students': {
      title: 'Student Directory',
      subtitle: 'View active student credentials, parent contact details, and grade statistics.',
    },
    'manage-employees': {
      title: 'Faculty Directory',
      subtitle: 'View subject instructors and MOE training courseware progress.',
    },
    'manage-classes': {
      title: 'Classes Registry',
      subtitle: 'View classroom divisions, homeroom advisors, and classroom capacities.',
    },
    'manage-departments': {
      title: 'Department Registry',
      subtitle: 'View school department divisions and designated curriculum supervisors.',
    },
    'manage-attendance': {
      title: 'Attendance Ledger',
      subtitle: 'View student classroom roll-call rates and staff check-in history.',
    },
    'teachers-development': {
      title: 'Professional Development',
      subtitle: 'Monitor MOE training participation rates and upload pedagogy instructional guidelines.',
    },
    'manage-checkins': {
      title: 'Wellness Check-ins',
      subtitle: 'Monitor environmental satisfaction index, review teacher burnout variables, and capture parent feedback loops.',
    },
    'account-settings': {
      title: 'Portal Settings',
      subtitle: 'Adjust school coordinates visible on regional reports and update administrative password credentials.',
    },
  };

  const meta = tabMeta[activeTab] ?? { title: 'School Head Portal' };

  const shellActions =
    activeTab === 'manage-checkins' ? (
      <Button
        variant="organic"
        size="sm"
        onClick={() => window.dispatchEvent(new Event('open-checkin-modal'))}
        className="text-xs h-9 font-semibold border-none shrink-0"
        leftIcon={<span className="text-sm">+</span>}
      >
        Publish Wellness Survey
      </Button>
    ) : undefined;

  return (
    <DashboardShell
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      breadcrumbs={getBreadcrumbs()}
      title={meta.title}
      eyebrow="Bole Secondary School"
      subtitle={meta.subtitle}
      actions={shellActions}
      showPageHeader={activeTab !== 'dashboard'}
    >
          {activeTab === 'dashboard' && <OverviewDashboard />}

          {/* 2. Performance Reports */}
          {activeTab === 'reports' && <PerformanceReports />}

          {/* 3. Academic Calendar */}
          {activeTab === 'academic-calendar' && <SchoolHeadCalendar />}

          {activeTab === 'messages' && (
            <MessageCenter mode="staff" staffRoleHint="school-head" />
          )}

          {/* Student Management */}
          {activeTab === 'manage-students' && <StudentManagement readOnly />}

          {/* Employee Management */}
          {activeTab === 'manage-employees' && <EmployeeManagement readOnly />}

          {/* View Classes */}
          {activeTab === 'manage-classes' && (
            <div className="space-y-6 animate-fade-in text-left">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {classes.map((cls) => (
                  <Card key={cls.id} className="flex flex-col justify-between border-border/60 hover:border-primary/40 transition-colors duration-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-bold text-foreground">{cls.name}</CardTitle>
                      <CardDescription className="uppercase text-[9px] font-bold">Grade Level: {cls.grade}</CardDescription>
                    </CardHeader>
                    <CardContent className="text-xxs text-muted-foreground space-y-1 pb-4">
                      <p>• Homeroom Teacher: <strong className="text-foreground">{cls.homeroomTeacher}</strong></p>
                      <p>• Student Roster Count: <strong className="text-foreground">{cls.studentsCount || 40} pupils</strong></p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* View Departments */}
          {activeTab === 'manage-departments' && (
            <div className="space-y-6 animate-fade-in text-left">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {departments.map((dept) => (
                  <Card key={dept.id} className="flex flex-col justify-between border-border/60 hover:border-primary/40 transition-colors duration-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-bold text-foreground">{dept.name}</CardTitle>
                      <CardDescription className="uppercase text-[9px] font-bold">Curriculum Head: {dept.headName}</CardDescription>
                    </CardHeader>
                    <CardContent className="text-xxs text-muted-foreground space-y-1 pb-4">
                      <p>• Department ID: <code className="text-xxs font-mono">{dept.id}</code></p>
                      <p>• Courses Managed: <strong className="text-foreground">Syllabi certified</strong></p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* View Attendance */}
          {activeTab === 'manage-attendance' && (
            <div className="space-y-6 animate-fade-in text-left">
              <div className="flex justify-end">
                <div className="flex bg-muted/60 p-0.5 rounded-lg border border-border/40 shrink-0">
                  <button
                    onClick={() => setAttendanceTab('student')}
                    className={`px-3 py-1.5 text-xxs font-bold rounded-md transition-all cursor-pointer ${
                      attendanceTab === 'student' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Student Cohorts
                  </button>
                  <button
                    onClick={() => setAttendanceTab('employee')}
                    className={`px-3 py-1.5 text-xxs font-bold rounded-md transition-all cursor-pointer ${
                      attendanceTab === 'employee' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Faculty Check-ins
                  </button>
                </div>
              </div>

              <TablePanel
                title={attendanceTab === 'student' ? 'Student Roster Attendance Logs' : 'Faculty Checked-in Ledger'}
                description="Historical ledger matching official regional records"
              >
                  {attendanceTab === 'student' ? (
                      <table className="eskooly-table">
                        <thead>
                          <tr>
                            <th className="p-3 text-left text-muted-foreground font-semibold">Student Name</th>
                            <th className="p-3 text-left text-muted-foreground font-semibold">Grade Segment</th>
                            <th className="p-3 text-left text-muted-foreground font-semibold">Date Logged</th>
                            <th className="p-3 text-left text-muted-foreground font-semibold">Status Indicator</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40 text-muted-foreground">
                          {attendance.slice(0, 8).map((record) => (
                            <tr key={record.id} className="hover:bg-muted/10">
                              <td className="p-3 text-foreground font-bold">{record.studentName}</td>
                              <td className="p-3">{record.grade} Section {record.section}</td>
                              <td className="p-3">{record.date}</td>
                              <td className="p-3">
                                <Badge
                                  variant={
                                    record.status === 'Present' 
                                      ? 'success' 
                                      : record.status === 'Absent' 
                                      ? 'danger' 
                                      : 'warning'
                                  }
                                  size="sm"
                                  className="font-bold"
                                >
                                  {record.status}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                  ) : (
                      <table className="eskooly-table">
                        <thead>
                          <tr>
                            <th className="p-3 text-left text-muted-foreground font-semibold">Faculty Instructor</th>
                            <th className="p-3 text-left text-muted-foreground font-semibold">Phone Contact</th>
                            <th className="p-3 text-left text-muted-foreground font-semibold">Subject Focus</th>
                            <th className="p-3 text-left text-muted-foreground font-semibold">Check-in Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40 text-muted-foreground">
                          {teachers.filter(t => t.schoolId === 'sch-1').map((teacher) => (
                            <tr key={teacher.id} className="hover:bg-muted/10">
                              <td className="p-3 text-foreground font-bold">{teacher.name}</td>
                              <td className="p-3">{teacher.phone}</td>
                              <td className="p-3 font-semibold text-primary">{teacher.subjects.join(', ')}</td>
                              <td className="p-3">
                                <Badge variant={teacher.status === 'Active' ? 'success' : 'neutral'} size="sm" className="font-bold">
                                  {teacher.status === 'Active' ? 'Active Duty' : 'Checked-out'}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                  )}
              </TablePanel>
            </div>
          )}

          {/* 11. Teacher Development */}
          {activeTab === 'teachers-development' && (
            <div className="space-y-6 animate-fade-in text-left">
              <div className="flex justify-end">
                <div className="flex bg-muted/60 p-0.5 rounded-lg border border-border/40 shrink-0">
                  <button
                    onClick={() => setDevSubTab('training')}
                    className={`px-3 py-1.5 text-xxs font-bold rounded-md transition-all cursor-pointer ${
                      devSubTab === 'training' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Course Catalog
                  </button>
                  <button
                    onClick={() => setDevSubTab('progress')}
                    className={`px-3 py-1.5 text-xxs font-bold rounded-md transition-all cursor-pointer ${
                      devSubTab === 'progress' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Faculty Enrollment
                  </button>
                </div>
              </div>

              {devSubTab === 'training' ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Upload course Form */}
                  <Card className="border-border/60">
                    <CardHeader>
                      <CardTitle className="text-sm font-bold">Publish Pedagogy Training Course</CardTitle>
                      <CardDescription>Add secondary school course resource guidelines.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleDevFormSubmit} className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-muted-foreground uppercase">Resource Course Title</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Modern Biology Pedagogy"
                            value={newMaterialTitle}
                            onChange={(e) => setNewMaterialTitle(e.target.value)}
                            className="w-full h-10 px-3 bg-muted/40 border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-xxs">
                          <div className="space-y-1">
                            <label className="text-[10px] font-semibold text-muted-foreground uppercase">Subject category</label>
                            <select
                              value={newMaterialCategory}
                              onChange={(e) => setNewMaterialCategory(e.target.value)}
                              className="w-full h-10 px-3 bg-muted/40 border border-border rounded-md text-xs text-foreground focus:outline-none"
                            >
                              <option value="Pedagogy">Pedagogy</option>
                              <option value="Curriculum Integration">Curriculum</option>
                              <option value="Assessment Design">Assessment</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-semibold text-muted-foreground uppercase">Resource URL Link</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. https://moe.gov/res"
                              value={newMaterialUrl}
                              onChange={(e) => setNewMaterialUrl(e.target.value)}
                              className="w-full h-10 px-3 bg-muted/40 border border-border rounded-md text-xs text-foreground focus:outline-none"
                            />
                          </div>
                        </div>

                        <Button type="submit" variant="organic" className="w-full text-xs h-10 mt-2 font-bold border-none">
                          Publish Pedagogy Guideline
                        </Button>
                      </form>
                    </CardContent>
                  </Card>

                  {/* Course list */}
                  <Card className="lg:col-span-2 border-border/60">
                    <CardHeader>
                      <CardTitle className="text-sm font-bold">MOE Pedagogy Catalog</CardTitle>
                      <CardDescription>Active training guides and certifications published to instructors</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {trainingMaterials.map((mat) => (
                          <Card key={mat.id} className="border-border/60 hover:border-primary/40 transition-colors duration-200">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-xs font-bold text-foreground truncate">{mat.title}</CardTitle>
                              <CardDescription className="text-[9px] uppercase font-bold">{mat.category}</CardDescription>
                            </CardHeader>
                            <CardContent className="text-xxs pb-4 flex justify-between items-center">
                              <a href={mat.resourceUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline font-bold">
                                View Guide Document →
                              </a>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                </div>
              ) : (
                <TablePanel
                  title="Faculty Enrollment Course Progress"
                  description="Track certification status of educational practitioners in Bole Community School"
                >
                      <table className="eskooly-table">
                        <thead>
                          <tr>
                            <th className="p-3 text-left text-muted-foreground font-semibold">Faculty Member</th>
                            <th className="p-3 text-left text-muted-foreground font-semibold">Designated Role</th>
                            <th className="p-3 text-left text-muted-foreground font-semibold">Active Certification Course</th>
                            <th className="p-3 text-left text-muted-foreground font-semibold">Program Progress</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40 text-muted-foreground">
                          {teachers.filter(t => t.schoolId === 'sch-1').map((teacher) => (
                            <tr key={teacher.id} className="hover:bg-muted/10">
                              <td className="p-3 text-foreground font-bold">{teacher.name}</td>
                              <td className="p-3 font-semibold text-primary">{teacher.subjects[0] ?? 'General'} Instructor</td>
                              <td className="p-3 text-foreground">National Pedagogy Masterclass</td>
                              <td className="p-3 font-bold text-foreground font-mono">{teacher.trainingProgress}% Completed</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                </TablePanel>
              )}
            </div>
          )}

          {/* 12. Wellness Checkins */}
          {activeTab === 'manage-checkins' && <WellnessCheckins />}

          {/* 13. Settings Panel */}
          {activeTab === 'account-settings' && (
            <div className="space-y-4">
              <SchoolHeadAnnouncements />
              <SchoolBillingSettings />
              <ApplicationFormBuilder />
              <ReenrollmentCampaignPanel />
              <PermissionsAdminPanel />
              <SettingsPanel />
            </div>
          )}

    </DashboardShell>
  );
}
