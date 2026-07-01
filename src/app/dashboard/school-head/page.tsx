'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogFooter } from '@/components/ui/dialog';
// import { generateAICalendarTimetable } from '@/lib/ai'; // TODO: Implement this function

// Decomposed Sub-components
import { OverviewDashboard } from '@/components/dashboard/school-head/OverviewDashboard';
import { PerformanceReports } from '@/components/dashboard/school-head/PerformanceReports';
import { StudentManagement } from '@/components/dashboard/school-head/StudentManagement';
import { EmployeeManagement } from '@/components/dashboard/school-head/EmployeeManagement';
import { LessonPlanReview } from '@/components/dashboard/school-head/LessonPlanReview';
import { WellnessCheckins } from '@/components/dashboard/school-head/WellnessCheckins';
import { SettingsPanel } from '@/components/dashboard/school-head/SettingsPanel';
import type { ExamQuestion } from '@/lib/mockData';
import { TablePanel } from '@/components/dashboard/TablePanel';

export default function SchoolHeadPortalPage() {
  const {
    exams,
    approveExam,
    rejectExam,
    departments,
    addDepartment,
    classes,
    addClass,
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
      case 'lesson-plans': return [...base, { label: 'Lesson Plan Review' }];
      case 'exam-bank': return [...base, { label: 'Exam Bank Review' }];
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

  // Exam Blueprint Review Modal State
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [isExamReviewOpen, setIsExamReviewOpen] = useState(false);
  const [examComments, setExamComments] = useState('');

  const selectedExam = exams.find((ex) => ex.id === selectedExamId);

  const handleExamApprove = () => {
    if (!selectedExamId) return;
    approveExam(selectedExamId, examComments || 'Exam blueprint meets national standards.');
    setIsExamReviewOpen(false);
  };

  const handleExamReject = () => {
    if (!selectedExamId) return;
    rejectExam(selectedExamId, examComments || 'Please add more multiple-choice questions.');
    setIsExamReviewOpen(false);
  };

  // Add Class Modal State
  const [isAddClassOpen, setIsAddClassOpen] = useState(false);
  const [classNameInput, setClassNameInput] = useState('');
  const [classGradeInput, setClassGradeInput] = useState('Grade 9');
  const [classSectionInput, setClassSectionInput] = useState('A');
  const [classTeacherInput, setClassTeacherInput] = useState('');

  const handleAddClassSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!classNameInput || !classTeacherInput) return;
    addClass(classNameInput, classGradeInput, classSectionInput, classTeacherInput);
    setClassNameInput('');
    setClassTeacherInput('');
    setIsAddClassOpen(false);
  };

  // Add Department Modal State
  const [isAddDeptOpen, setIsAddDeptOpen] = useState(false);
  const [deptNameInput, setDeptNameInput] = useState('');
  const [deptHeadInput, setDeptHeadInput] = useState('');

  const handleAddDeptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptNameInput || !deptHeadInput) return;
    addDepartment(deptNameInput, deptHeadInput);
    setDeptNameInput('');
    setDeptHeadInput('');
    setIsAddDeptOpen(false);
  };

  // Professional Development Tab State
  const [devSubTab, setDevSubTab] = useState<'training' | 'progress'>('training');
  const [newMaterialTitle, setNewMaterialTitle] = useState('');
  const [newMaterialUrl, setNewMaterialUrl] = useState('');
  const [newMaterialCategory, setNewMaterialCategory] = useState('Pedagogy');

  const handleDevFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMaterialTitle || !newMaterialUrl) return;
    addTrainingMaterial(newMaterialTitle, newMaterialUrl, newMaterialCategory);
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
      subtitle: 'Manage administrative school terms, holidays, and schedule classes using AI.',
    },
    'lesson-plans': {
      title: 'Lesson Plan Review',
      subtitle: 'Audit department subject plans, monitor pedagogical objectives, and issue secondary academic approvals.',
    },
    'exam-bank': {
      title: 'Exam Bank Review',
      subtitle: 'Approve exam blueprints, review test item difficulty curves, and maintain national exam banks.',
    },
    'manage-students': {
      title: 'Student Directory',
      subtitle: 'Manage active student credentials, parents contact details, and grade statistics.',
    },
    'manage-employees': {
      title: 'Faculty Directory',
      subtitle: 'Manage active subject instructors, review MOE training courseware progress, and onboard employees.',
    },
    'manage-classes': {
      title: 'Classes Registry',
      subtitle: 'Monitor classroom divisions, homeroom advisors, and classroom capacities.',
    },
    'manage-departments': {
      title: 'Department Registry',
      subtitle: 'Manage administrative school department divisions and coordinate designated curriculum supervisors.',
    },
    'manage-attendance': {
      title: 'Attendance Ledger',
      subtitle: 'Inspect student classroom roll-call rates and monitor staff check-in history.',
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
    activeTab === 'manage-students' ? (
      <Button
        variant="organic"
        size="sm"
        onClick={() => window.dispatchEvent(new Event('open-enroll-modal'))}
        className="text-xs h-9 font-semibold border-none shrink-0"
        leftIcon={<span className="text-sm">+</span>}
      >
        Enroll New Student
      </Button>
    ) : activeTab === 'manage-employees' ? (
      <Button
        variant="organic"
        size="sm"
        onClick={() => window.dispatchEvent(new Event('open-onboard-modal'))}
        className="text-xs h-9 font-semibold border-none shrink-0"
        leftIcon={<span className="text-sm">+</span>}
      >
        Onboard New Instructor
      </Button>
    ) : activeTab === 'manage-classes' ? (
      <Button
        variant="organic"
        size="sm"
        onClick={() => setIsAddClassOpen(true)}
        className="text-xs h-9 font-semibold border-none shrink-0"
      >
        Add Class Section
      </Button>
    ) : activeTab === 'manage-departments' ? (
      <Button
        variant="organic"
        size="sm"
        onClick={() => setIsAddDeptOpen(true)}
        className="text-xs h-9 font-semibold border-none shrink-0"
      >
        Add Department Division
      </Button>
    ) : activeTab === 'manage-checkins' ? (
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

          {/* 3. Academic Calendar & AI Timetable */}
          {activeTab === 'academic-calendar' && (
            <div className="space-y-6 animate-fade-in text-left">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* AI Timetable Generator Control */}
                <Card className="border-border/60">
                  <CardHeader>
                    <CardTitle className="text-sm font-bold">AI Timetable Planner</CardTitle>
                    <CardDescription>Generate customized classroom schedulers dynamically.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Select
                      label="Select Target Grade"
                      options={[
                        { value: 'Grade 9', label: 'Grade 9' },
                        { value: 'Grade 10', label: 'Grade 10' },
                        { value: 'Grade 11', label: 'Grade 11' },
                        { value: 'Grade 12', label: 'Grade 12' },
                      ]}
                      value={calendarGrade}
                      onChange={(e) => setCalendarGrade(e.target.value)}
                    />
                    <Button
                      onClick={handleAISelectCalendar}
                      loading={generatingTimetable}
                      className="w-full text-xs h-10 bg-primary font-bold border-none"
                    >
                      Plan Class Schedules
                    </Button>
                  </CardContent>
                </Card>

                {/* AI Planner Output */}
                <div className="lg:col-span-2">
                  <TablePanel
                    title="Class Schedule Matrix"
                    description="Visual weekly timeline layout generated by Prime AI"
                  >
                    {timetableOutput ? (
                        <table className="eskooly-table">
                          <thead>
                            <tr>
                              <th className="p-3 text-left font-bold text-muted-foreground">Period Cycle</th>
                              <th className="p-3 text-left font-bold text-muted-foreground">Monday</th>
                              <th className="p-3 text-left font-bold text-muted-foreground">Tuesday</th>
                              <th className="p-3 text-left font-bold text-muted-foreground">Wednesday</th>
                              <th className="p-3 text-left font-bold text-muted-foreground">Thursday</th>
                              <th className="p-3 text-left font-bold text-muted-foreground">Friday</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/40 text-foreground">
                            {timetableOutput.schedules.map((row: any, i: number) => (
                              <tr key={i} className="hover:bg-muted/10">
                                <td className="p-3 font-semibold text-muted-foreground bg-muted/20">{row.time}</td>
                                <td className="p-3 font-bold">{row.monday}</td>
                                <td className="p-3 font-bold">{row.tuesday}</td>
                                <td className="p-3 font-bold">{row.wednesday}</td>
                                <td className="p-3 font-bold">{row.thursday}</td>
                                <td className="p-3 font-bold">{row.friday}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 px-4 text-center text-xs text-muted-foreground space-y-2">
                        <span>🤖</span>
                        <span>Click &quot;Plan Class Schedules&quot; to let the AI balance syllabus cycles and room capacities.</span>
                      </div>
                    )}
                  </TablePanel>
                </div>

              </div>
            </div>
          )}

          {/* 4. Lesson Plan Review */}
          {activeTab === 'lesson-plans' && <LessonPlanReview />}

          {/* 5. Exam Bank Review */}
          {activeTab === 'exam-bank' && (
            <div className="space-y-6 animate-fade-in text-left">
              <TablePanel
                title="Exam Blueprint Filings"
                description="Audit active exam papers submitted by instructional staff"
              >
                    <table className="eskooly-table">
                      <thead>
                        <tr>
                          <th className="p-3 text-left text-muted-foreground font-semibold">Exam Title</th>
                          <th className="p-3 text-left text-muted-foreground font-semibold">Subject</th>
                          <th className="p-3 text-left text-muted-foreground font-semibold">Target Grade</th>
                          <th className="p-3 text-left text-muted-foreground font-semibold">Status</th>
                          <th className="p-3 text-left text-muted-foreground font-semibold">Operation</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40 text-muted-foreground">
                        {exams.map((ex) => (
                          <tr key={ex.id} className="hover:bg-muted/10">
                            <td className="p-3">
                              <div className="flex flex-col">
                                <span className="font-bold text-foreground text-xs">{ex.title}</span>
                                <span className="text-[9px] text-muted-foreground mt-0.5">Author: {ex.teacherName}</span>
                              </div>
                            </td>
                            <td className="p-3">
                              <Badge variant="primary" size="sm" className="font-medium bg-accent/10 border-accent/20 text-accent">
                                {ex.subject}
                              </Badge>
                            </td>
                            <td className="p-3 font-semibold text-foreground">{ex.grade}</td>
                            <td className="p-3">
                                <Badge
                                variant={
                                  ex.status === 'Approved' 
                                    ? 'success' 
                                    : ex.status === 'Rejected' 
                                    ? 'danger' 
                                    : 'warning'
                                }
                                size="sm"
                                className="font-bold"
                              >
                                {ex.status}
                              </Badge>
                            </td>
                            <td className="p-3">
                              <Button
                                size="sm"
                                variant={ex.status === 'Pending Approval' ? 'primary' : 'outline'}
                                onClick={() => {
                                  setSelectedExamId(ex.id);
                                  setExamComments('');
                                  setIsExamReviewOpen(true);
                                }}
                                className="text-xxs h-7 font-bold border-none"
                              >
                                {ex.status === 'Pending Approval' ? 'Review Draft' : 'Inspect Rulings'}
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
              </TablePanel>

              {/* Review Exam Blueprint Dialog Modal */}
              <Dialog
                isOpen={isExamReviewOpen}
                onClose={() => setIsExamReviewOpen(false)}
                title="Exam Blueprint Audit"
              >
                {selectedExam && (
                  <div className="space-y-4 pt-2">
                    <div className="p-3 bg-muted/40 border border-border/60 rounded-xl text-left space-y-0.5">
                      <h4 className="text-xs font-bold text-foreground">{selectedExam.title}</h4>
                      <p className="text-[10px] text-muted-foreground">Drafted by: {selectedExam.teacherName} ({selectedExam.subject})</p>
                    </div>

                    <div className="text-left space-y-1">
                      <span className="text-[9px] font-bold text-muted-foreground uppercase">Questions blueprint preview</span>
                      <div className="p-3 bg-muted/20 border border-border/40 rounded-xl space-y-2 text-xxs text-muted-foreground">
                        {selectedExam.questions?.map((q: ExamQuestion, idx: number) => (
                          <div key={idx} className="space-y-1 border-b border-border/30 pb-2 last:border-b-0 last:pb-0">
                            <p className="font-semibold text-foreground">{idx + 1}. {q.text}</p>
                            <div className="grid grid-cols-2 gap-1 pl-2 text-[10px]">
                              {q.options && q.options.map((opt: string, oi: number) => (
                                <span key={oi} className={opt === q.answer ? 'text-primary font-bold' : ''}>• {opt}</span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {selectedExam.status === 'Pending Approval' ? (
                      <div className="space-y-3 text-left">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase">Administrative comments</label>
                        <textarea
                          placeholder="Provide directives for exam adjustments..."
                          value={examComments}
                          onChange={(e) => setExamComments(e.target.value)}
                          className="w-full h-20 p-3 bg-muted/40 border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />

                        <DialogFooter className="mt-4 border-t border-border/20 pt-3 flex gap-2 justify-end">
                          <Button variant="outline" size="sm" onClick={() => setIsExamReviewOpen(false)} className="text-xs h-9">
                            Close
                          </Button>
                          <Button variant="destructive" size="sm" onClick={handleExamReject} className="text-xs h-9 border-none font-bold">
                            Reject Exam
                          </Button>
                          <Button variant="organic" size="sm" onClick={handleExamApprove} className="text-xs h-9 border-none font-bold">
                            Approve Exam
                          </Button>
                        </DialogFooter>
                      </div>
                    ) : (
                      <DialogFooter className="mt-4 border-t border-border/20 pt-3">
                        <Button variant="outline" size="sm" onClick={() => setIsExamReviewOpen(false)} className="text-xs h-9">
                          Close
                        </Button>
                      </DialogFooter>
                    )}
                  </div>
                )}
              </Dialog>
            </div>
          )}

          {/* 6. Student Management */}
          {activeTab === 'manage-students' && <StudentManagement />}

          {/* 7. Employee Management */}
          {activeTab === 'manage-employees' && <EmployeeManagement />}

          {/* 8. Manage Classes */}
          {activeTab === 'manage-classes' && (
            <div className="space-y-6 animate-fade-in text-left">
              {/* Roster Grid */}
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

              {/* Add Class Dialog Modal */}
              <Dialog
                isOpen={isAddClassOpen}
                onClose={() => setIsAddClassOpen(false)}
                title="Add New Homeroom Class Section"
              >
                <form onSubmit={handleAddClassSubmit} className="space-y-4 pt-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase block">Section Name</label>
                    <input 
                      type="text"
                      required
                      value={classNameInput}
                      onChange={(e) => setClassNameInput(e.target.value)}
                      placeholder="e.g. Grade 9 Section D"
                      className="w-full h-10 px-3 bg-muted/40 border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Select
                      label="Grade level"
                      options={[
                        { value: 'Grade 9', label: 'Grade 9' },
                        { value: 'Grade 10', label: 'Grade 10' },
                        { value: 'Grade 11', label: 'Grade 11' },
                        { value: 'Grade 12', label: 'Grade 12' },
                      ]}
                      value={classGradeInput}
                      onChange={(e) => setClassGradeInput(e.target.value)}
                    />
                    <Select
                      label="Section partition"
                      options={[
                        { value: 'A', label: 'A' },
                        { value: 'B', label: 'B' },
                        { value: 'C', label: 'C' },
                        { value: 'D', label: 'D' },
                      ]}
                      value={classSectionInput}
                      onChange={(e) => setClassSectionInput(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase block font-bold">Assigned Homeroom Teacher</label>
                    <input 
                      type="text"
                      required
                      value={classTeacherInput}
                      onChange={(e) => setClassTeacherInput(e.target.value)}
                      placeholder="e.g. Martha Feyissa"
                      className="w-full h-10 px-3 bg-muted/40 border border-border rounded-md text-xs text-foreground focus:outline-none"
                    />
                  </div>

                  <DialogFooter className="mt-6 border-t border-border/20 pt-4">
                    <Button type="button" variant="outline" size="sm" onClick={() => setIsAddClassOpen(false)} className="text-xs h-9">
                      Cancel
                    </Button>
                    <Button type="submit" variant="organic" size="sm" className="text-xs h-9 border-none font-semibold">
                      Register Class Section
                    </Button>
                  </DialogFooter>
                </form>
              </Dialog>
            </div>
          )}

          {/* 9. Manage Departments */}
          {activeTab === 'manage-departments' && (
            <div className="space-y-6 animate-fade-in text-left">
              {/* Roster Grid */}
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

              {/* Add Department Dialog Modal */}
              <Dialog
                isOpen={isAddDeptOpen}
                onClose={() => setIsAddDeptOpen(false)}
                title="Register New Subject Department"
              >
                <form onSubmit={handleAddDeptSubmit} className="space-y-4 pt-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase block">Department Division Name</label>
                    <input 
                      type="text"
                      required
                      value={deptNameInput}
                      onChange={(e) => setDeptNameInput(e.target.value)}
                      placeholder="e.g. Department of Chemistry"
                      className="w-full h-10 px-3 bg-muted/40 border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase block font-bold">Assigned Subject Coordinator</label>
                    <input 
                      type="text"
                      required
                      value={deptHeadInput}
                      onChange={(e) => setDeptHeadInput(e.target.value)}
                      placeholder="e.g. Ato Abraham"
                      className="w-full h-10 px-3 bg-muted/40 border border-border rounded-md text-xs text-foreground focus:outline-none"
                    />
                  </div>

                  <DialogFooter className="mt-6 border-t border-border/20 pt-4">
                    <Button type="button" variant="outline" size="sm" onClick={() => setIsAddDeptOpen(false)} className="text-xs h-9">
                      Cancel
                    </Button>
                    <Button type="submit" variant="organic" size="sm" className="text-xs h-9 border-none font-semibold">
                      Register Department
                    </Button>
                  </DialogFooter>
                </form>
              </Dialog>
            </div>
          )}

          {/* 10. Manage Attendance */}
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
          {activeTab === 'account-settings' && <SettingsPanel />}

    </DashboardShell>
  );
}
