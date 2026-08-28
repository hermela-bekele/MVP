'use client';

import React, { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { portalTabPath, tabFromPortalPath } from '@/lib/portalPaths';

// Decomposed Sub-components
import { OverviewDashboard } from '@/components/dashboard/school-head/OverviewDashboard';
import { StudentManagement } from '@/components/dashboard/school-head/StudentManagement';
import { EmployeeManagement } from '@/components/dashboard/school-head/EmployeeManagement';
import { WellnessCheckins } from '@/components/dashboard/school-head/WellnessCheckins';
import { SettingsPanel } from '@/components/dashboard/school-head/SettingsPanel';
import { MoeUpdatesPanel } from '@/components/dashboard/school-head/MoeUpdatesPanel';
import { MoeMessagesPanel } from '@/components/dashboard/school-head/MoeMessagesPanel';
import { HrOverviewPanel } from '@/components/dashboard/school-head/HrOverviewPanel';
import { RegistrarOverviewPanel } from '@/components/dashboard/school-head/RegistrarOverviewPanel';
import { FinanceOverviewPanel } from '@/components/dashboard/school-head/FinanceOverviewPanel';
import { TablePanel } from '@/components/dashboard/TablePanel';
import { CommunicationModule } from '@/components/dashboard/communication/CommunicationModule';
import { SchoolHeadHodMessagesPanel } from '@/components/dashboard/school-head/SchoolHeadHodMessagesPanel';
import { TeacherTrainingTab } from '@/components/dashboard/teacher/TeacherTrainingTab';
import { PortalProfileCard } from '@/components/dashboard/shared/PortalProfileCard';
import { SchoolHeadAnnouncements } from '@/components/dashboard/school-head/SchoolHeadAnnouncements';
import { SchoolHeadCalendar } from '@/components/dashboard/school-head/SchoolHeadCalendar';
import { SchoolBillingSettings } from '@/components/dashboard/school-head/SchoolBillingSettings';
import { PermissionsAdminPanel } from '@/components/dashboard/school-head/PermissionsAdminPanel';
import { ApplicationFormBuilder } from '@/components/dashboard/school-head/ApplicationFormBuilder';
import { LessonPlanReview } from '@/components/dashboard/school-head/LessonPlanReview';
import { SchoolHeadAcademicCalendarPanel } from '@/components/dashboard/school-head/SchoolHeadAcademicCalendarPanel';
import { TEACHER_CLASS_ASSIGNMENTS } from '@/lib/teacherPortal';
import { formatMark } from '@/lib/grading';
import type { SchoolClass } from '@/lib/mockData';
import { ArrowLeft, MapPin, Clock, CalendarDays } from 'lucide-react';
export default function SchoolHeadPortalPage() {
  const {
    departments,
    classes,
    trainingMaterials,
    addTrainingMaterial,
    attendance,
    teachers,
    schools,
    currentUser,
    students,
  } = useApp();
  const [detailClass, setDetailClass] = useState<SchoolClass | null>(null);

  // Resolve the logged-in school head's actual school from session; fall back to the
  // first school on record only for demo/unlinked accounts.
  const currentSchool = schools.find((s) => s.id === currentUser?.schoolId) ?? schools[0];
  const currentSchoolId = currentSchool?.id;
  const schoolName = currentSchool?.name ?? 'your school';

  const pathname = usePathname();
  const router = useRouter();
  const activeTab = tabFromPortalPath(pathname, 'school-head');
  const setActiveTab = (tab: string) => {
    router.push(portalTabPath('school-head', tab));
  };

  // Listen to command palette tab change events
  React.useEffect(() => {
    const handleTabChange = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail) {
        router.push(portalTabPath('school-head', customEvent.detail));
      }
    };
    window.addEventListener('change-tab', handleTabChange);
    return () => window.removeEventListener('change-tab', handleTabChange);
  }, [router]);

  // Compute breadcrumbs
  const getBreadcrumbs = () => {
    const base = [{ label: 'School Head Portal', href: '#' }];
    switch (activeTab) {
      case 'dashboard': return [...base, { label: 'Overview' }];
      case 'manage-students': return [...base, { label: 'Student Directory' }];
      case 'manage-employees': return [...base, { label: 'Faculty Directory' }];
      case 'manage-classes': return [...base, { label: 'Classes Registry' }];
      case 'manage-departments': return [...base, { label: 'Department Registry' }];
      case 'manage-attendance': return [...base, { label: 'Attendance Ledger' }];
      case 'hr-overview': return [...base, { label: 'HR Overview' }];
      case 'registrar-overview': return [...base, { label: 'Registrar Overview' }];
      case 'finance-overview': return [...base, { label: 'Finance Overview' }];
      case 'moe-updates': return [...base, { label: 'MOE Updates & Compliance' }];
      case 'moe-messages': return [...base, { label: 'Message MOE' }];
      case 'lesson-plan-review': return [...base, { label: 'Lesson Plan Review' }];
      case 'announcements': return [...base, { label: 'Announcements' }];
      case 'school-calendar': return [...base, { label: 'School Calendar' }];
      case 'admissions-form-builder': return [...base, { label: 'Application Form Builder' }];
      case 'billing-settings': return [...base, { label: 'Billing Settings' }];
      case 'permissions-admin': return [...base, { label: 'Permissions' }];
      case 'teachers-development': return [...base, { label: 'Professional Development' }];
      case 'communication': return [...base, { label: 'Community' }];
      case 'department-messages': return [...base, { label: 'Direct Messages' }];
      case 'manage-checkins': return [...base, { label: 'Wellness Checkins' }];
      case 'account-settings': return [...base, { label: 'Portal Settings' }];
      case 'leadership-development': return [...base, { label: 'ELEP Leadership Development' }];
      case 'profile': return [...base, { label: 'My Profile' }];
      case 'academic-calendar': return [...base, { label: 'Academic Calendar' }];
      default: return base;
    }
  };

  // ==========================================
  // INLINE TABS LOGIC & STATES
  // ==========================================

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

  // Academic Calendar Tab State
  const [calendarHeaderActions, setCalendarHeaderActions] = useState<React.ReactNode>(null);

  const tabMeta: Record<string, { title: string; subtitle?: string }> = {
    dashboard: { title: 'Overview' },
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
    'hr-overview': {
      title: 'HR Overview',
      subtitle: 'Cross-functional read-only view of staff leave and payroll status.',
    },
    'registrar-overview': {
      title: 'Registrar Overview',
      subtitle: 'Cross-functional read-only view of registration and enrollment activity.',
    },
    'finance-overview': {
      title: 'Finance Overview',
      subtitle: 'Cross-functional read-only view of school billing and collections.',
    },
    'moe-updates': {
      title: 'MOE Updates & Compliance',
      subtitle: 'Ministry of Education circulars and compliance milestones for this academic year.',
    },
    'moe-messages': {
      title: 'Message MOE',
      subtitle: 'Direct communication channel with the Ministry of Education regional desk.',
    },
    'lesson-plan-review': {
      title: 'Lesson Plan Review',
      subtitle: 'Review lesson plans submitted for school-head approval.',
    },
    announcements: {
      title: 'Announcements',
      subtitle: 'Post and manage school-wide announcements.',
    },
    'school-calendar': {
      title: 'School Calendar',
      subtitle: 'Manage academic events and published dates for this school.',
    },
    'admissions-form-builder': {
      title: 'Application Form Builder',
      subtitle: 'Configure the fields collected on the admissions application form.',
    },
    'billing-settings': {
      title: 'Billing Settings',
      subtitle: 'Configure fee schedules and billing preferences for this school.',
    },
    'permissions-admin': {
      title: 'Permissions',
      subtitle: 'Manage staff role permissions across the portal.',
    },
    'teachers-development': {
      title: 'Professional Development',
      subtitle: 'Monitor MOE training participation rates and upload pedagogy instructional guidelines.',
    },
    communication: {
      title: 'Community',
      subtitle: 'Post school-wide announcements and browse your community channels.',
    },
    'department-messages': {
      title: 'Direct Messages',
      subtitle: 'Message your department heads.',
    },
    'manage-checkins': {
      title: 'Wellness Check-ins',
      subtitle: 'Recurrent questionnaire towards general challenges and school improvement ideas.',
    },
    'account-settings': {
      title: 'Portal Settings',
      subtitle: 'Adjust school coordinates visible on regional reports and update administrative password credentials.',
    },
    'leadership-development': {
      title: 'ELEP · Leadership Development',
      subtitle: 'Education Leadership Excellence Program modules for school heads.',
    },
    profile: {
      title: 'My Profile',
      subtitle: 'Your school head account information.',
    },
    'academic-calendar': {
      title: 'Academic Calendar',
      subtitle: 'Click days on the MOE calendar to assign events, then generate, save, and publish.',
    },
  };

  const meta = tabMeta[activeTab] ?? { title: 'School Head Portal' };

  const shellActions =
    activeTab === 'academic-calendar'
      ? calendarHeaderActions
      : activeTab === 'manage-checkins' ? (
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
      eyebrow={schoolName}
      subtitle={meta.subtitle}
      actions={shellActions}
      showPageHeader={activeTab !== 'dashboard'}
    >
          {activeTab === 'dashboard' && <OverviewDashboard />}

          {/* Communication */}
          {activeTab === 'communication' && <CommunicationModule mode="school-head" />}
          {activeTab === 'department-messages' && <SchoolHeadHodMessagesPanel />}

          {/* Student Management */}
          {activeTab === 'manage-students' && <StudentManagement readOnly />}

          {/* Employee Management */}
          {activeTab === 'manage-employees' && <EmployeeManagement readOnly />}

          {/* View Classes */}
          {activeTab === 'manage-classes' && !detailClass && (
            <div className="space-y-6 animate-fade-in text-left">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {classes.map((cls) => (
                  <button
                    key={cls.id}
                    type="button"
                    onClick={() => setDetailClass(cls)}
                    className="text-left"
                  >
                    <Card className="flex flex-col justify-between border-border/60 hover:border-primary/40 hover:shadow-md transition-all duration-200">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold text-foreground">{cls.name}</CardTitle>
                      </CardHeader>
                      <CardContent className="text-xxs text-muted-foreground space-y-1 pb-4">
                        <p>• Homeroom Teacher: <strong className="text-foreground">{cls.homeroomTeacher}</strong></p>
                        <p>• Student Roster Count: <strong className="text-foreground">{cls.studentsCount || 40} pupils</strong></p>
                      </CardContent>
                    </Card>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'manage-classes' && detailClass && (
            <div className="space-y-6 animate-fade-in text-left">
              <Button variant="outline" size="sm" onClick={() => setDetailClass(null)}>
                <ArrowLeft className="h-3.5 w-3.5 mr-1.5" aria-hidden />
                Back to classes
              </Button>

              <Card className="border-border/60">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-bold text-foreground">{detailClass.name}</CardTitle>
                </CardHeader>
              </Card>

              <Card className="border-border/60">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold text-foreground">Weekly Timetable</CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const periods = TEACHER_CLASS_ASSIGNMENTS.filter(
                      (a) => a.grade === detailClass.grade && a.section === detailClass.section,
                    );
                    if (periods.length === 0) {
                      return <p className="text-xs text-muted-foreground">No timetable published for this class yet.</p>;
                    }
                    return (
                      <ul className="space-y-2">
                        {periods.map((p) => (
                          <li key={p.id} className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-muted-foreground">
                            <span className="font-semibold text-foreground min-w-[7rem]">{p.subject}</span>
                            <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-primary" aria-hidden /> {p.room}</span>
                            <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-primary" aria-hidden /> {p.period}</span>
                            <span className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5 text-primary" aria-hidden /> {p.days}</span>
                          </li>
                        ))}
                      </ul>
                    );
                  })()}
                </CardContent>
              </Card>

              <Card className="border-border/60">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold text-foreground">Class Roster</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border/60 text-left text-[10px] uppercase tracking-wide text-muted-foreground">
                          <th className="py-2 px-4 font-semibold">Student</th>
                          <th className="py-2 px-4 font-semibold">ID</th>
                          <th className="py-2 px-4 font-semibold">Attendance</th>
                          <th className="py-2 px-4 font-semibold">Cumulative Mark</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students
                          .filter((s) => s.grade === detailClass.grade && s.section === detailClass.section)
                          .map((s) => (
                            <tr key={s.id} className="border-b border-border/40 last:border-0 hover:bg-muted/20">
                              <td className="py-2 px-4 font-semibold text-foreground">{s.name}</td>
                              <td className="py-2 px-4 font-mono text-muted-foreground">{s.studentId}</td>
                              <td className="py-2 px-4 tabular-nums">{s.attendanceRate}%</td>
                              <td className="py-2 px-4 tabular-nums font-semibold">{formatMark(s.gpa)}</td>
                            </tr>
                          ))}
                        {students.filter((s) => s.grade === detailClass.grade && s.section === detailClass.section).length === 0 && (
                          <tr>
                            <td colSpan={4} className="py-6 text-center text-muted-foreground">No students on record for this class.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
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
                          {teachers.filter(t => t.schoolId === currentSchoolId).map((teacher) => (
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

          {/* HR / Registrar / Finance cross-functional overviews (Administrative Engine) */}
          {activeTab === 'hr-overview' && <HrOverviewPanel />}
          {activeTab === 'registrar-overview' && <RegistrarOverviewPanel />}
          {activeTab === 'finance-overview' && <FinanceOverviewPanel />}

          {/* Regulatory Engine: MOE updates & communication */}
          {activeTab === 'moe-updates' && <MoeUpdatesPanel />}
          {activeTab === 'moe-messages' && <MoeMessagesPanel />}
          {activeTab === 'lesson-plan-review' && <LessonPlanReview />}

          {/* Announcements & calendar */}
          {activeTab === 'announcements' && <SchoolHeadAnnouncements />}
          {activeTab === 'school-calendar' && <SchoolHeadCalendar />}
          {activeTab === 'admissions-form-builder' && <ApplicationFormBuilder />}
          {activeTab === 'billing-settings' && <SchoolBillingSettings />}
          {activeTab === 'permissions-admin' && <PermissionsAdminPanel />}

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
                    </CardHeader>
                    <CardContent className="pt-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {trainingMaterials.map((mat) => (
                          <Card key={mat.id} className="border-border/60 hover:border-primary/40 transition-colors duration-200">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-xs font-bold text-foreground truncate">{mat.title}</CardTitle>
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
                  description={`Track certification status of educational practitioners at ${schoolName}`}
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
                          {teachers.filter(t => t.schoolId === currentSchoolId).map((teacher) => (
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
          {activeTab === 'account-settings' && <SettingsPanel />}

          {/* 14. ELEP Leadership Development */}
          {activeTab === 'leadership-development' && (
            <div className="animate-fade-in text-left">
              <TeacherTrainingTab typeFilter="all" activeTabType="leadership-development" />
            </div>
          )}

          {/* 15. Academic Calendar & AI Timetable */}
          {activeTab === 'academic-calendar' && (
            <SchoolHeadAcademicCalendarPanel onActionsChange={setCalendarHeaderActions} />
          )}

          {/* 16. Profile */}
          {activeTab === 'profile' && (
            <div className="space-y-6 animate-fade-in text-left">
              <PortalProfileCard
                roleLabel="School Head"
                fields={[
                  { label: 'School', value: schoolName },
                  { label: 'Leadership track', value: 'ELEP' },
                  { label: 'Departments overseen', value: departments.length },
                ]}
              />
            </div>
          )}

    </DashboardShell>
  );
}
