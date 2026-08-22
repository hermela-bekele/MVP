'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { KpiWidget, KpiGrid } from '@/components/dashboard/KpiWidget';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ContentCard } from '@/components/dashboard/ContentCard';
import { TablePanel } from '@/components/dashboard/TablePanel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MetricProgressRow } from '@/components/ui/metric-progress-row';
import { PublishedAcademicCalendarPanel } from '@/components/dashboard/PublishedAcademicCalendarPanel';
import { ParentCommunicationModule } from '@/components/dashboard/parent/ParentCommunicationModule';
import { PortalProfileCard } from '@/components/dashboard/shared/PortalProfileCard';
import { EmptyState } from '@/components/ui/empty-state';
import { UserX } from 'lucide-react';
import { generatePDFFromMarkdown, slugifyFilename } from '@/lib/pdfUtils';

export default function StudentPortalPage() {
  const { students, addNotification, currentUser } = useApp();
  const [activeTab, setActiveTab] = useState('dashboard');

  // Resolve the logged-in student from session; fall back to the first
  // student record only if this account has no link yet (demo/unlinked accounts).
  const activeStudent = students.find(s => s.id === currentUser?.linkedStudentId) ?? students[0];

  const homeworkList = [
    { id: 'hw-1', subject: 'Biology', task: 'Write 200 words on Mitochondria cellular functions.', due: 'Tomorrow', status: 'Pending' },
    { id: 'hw-2', subject: 'Mathematics', task: 'Factor equations 1-10 on page 84.', due: 'In 2 days', status: 'Completed' },
    { id: 'hw-3', subject: 'English', task: 'Read chapter 4 grammar worksheets.', due: 'Next Monday', status: 'Pending' },
  ];

  const disseminatedResources = [
    { id: 'res-1', name: 'Grade 9 Biology Textbook (Ethiopian MOE)', format: 'PDF', size: '14.2 MB' },
    { id: 'res-2', name: 'Grade 9 Mathematics Syllabus Guide', format: 'PDF', size: '5.8 MB' },
    { id: 'res-3', name: 'Continuous Chemistry Assessment Lab Sheet', format: 'DOCX', size: '2.1 MB' },
  ];

  const SYLLABUS_TARGET_PCT = 70;

  const syllabusGrades = [
    { id: 'bio', subject: 'Biology', topic: 'Genetics/Cells', score: 95, letter: 'A+' },
    { id: 'math', subject: 'Mathematics', topic: 'Algebraic Formulas', score: 88, letter: 'A' },
    { id: 'chem', subject: 'Chemistry', topic: 'Hybrid energy overlap', score: 72, letter: 'B' },
  ] as const;

  const syllabusBarClass = (score: number) => {
    if (score >= 90) return 'bg-primary';
    if (score >= 80) return 'bg-primary/75';
    if (score >= SYLLABUS_TARGET_PCT) return 'bg-primary/55';
    return 'bg-primary/40';
  };

  const syllabusStatusLabel = (score: number) => {
    if (score >= 90) return 'Exceeds target';
    if (score >= SYLLABUS_TARGET_PCT) return 'Meets target';
    return 'Below target';
  };

  const classSchedule = [
    { time: '08:30 - 09:15', monday: ['Grade 9 Math', 'Abebe K.'], tuesday: ['Grade 9 English', 'Tigist A.'], wednesday: ['Grade 9 Math', 'Abebe K.'], thursday: ['Grade 9 English', 'Tigist A.'], friday: ['Grade 9 Math', 'Abebe K.'] },
    { time: '09:15 - 10:00', monday: ['Grade 9 Biology', 'Martha F.'], tuesday: ['Grade 9 Chemistry', 'Ato Demis'], wednesday: ['Grade 9 Biology', 'Martha F.'], thursday: ['Grade 9 Chemistry', 'Ato Demis'], friday: ['Study Hall'] },
    { time: '10:00 - 10:30', monday: ['Recess'], tuesday: ['Recess'], wednesday: ['Recess'], thursday: ['Recess'], friday: ['Recess'] },
    { time: '10:30 - 11:15', monday: ['Grade 9 Chemistry', 'Ato Demis'], tuesday: ['Grade 9 Math', 'Abebe K.'], wednesday: ['Grade 9 Chemistry', 'Ato Demis'], thursday: ['Grade 9 Math', 'Abebe K.'], friday: ['Assembly'] },
  ] as const;

  const TimetableCell: React.FC<{ entry: readonly string[] }> = ({ entry }) => {
    const [subject, teacher] = entry;
    return (
      <div className="flex flex-col">
        <span className="font-bold">{subject}</span>
        {teacher && <span className="text-[10px] font-normal text-muted-foreground">{teacher}</span>}
      </div>
    );
  };

  const tabTitles: Record<string, { title: string; subtitle?: string }> = {
    dashboard: { title: 'My Performance', subtitle: 'Grades, attendance, and homework at a glance.' },
    resources: { title: 'Books & Resources', subtitle: 'Digital textbooks and study materials.' },
    timetable: { title: 'Class Timetable', subtitle: 'Your weekly class schedule.' },
    communication: { title: 'Communication' },
    profile: { title: 'My Profile', subtitle: 'Your student account information.' },
  };
  const meta = tabTitles[activeTab] ?? tabTitles.dashboard;

  if (!activeStudent) {
    return (
      <DashboardShell
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        title="My Performance"
        eyebrow="Student Portal"
      >
        <EmptyState
          icon={<UserX />}
          title="No student record linked"
          description="This account isn't linked to a student record yet. Contact your school registrar to get set up."
        />
      </DashboardShell>
    );
  }

  const classmates = students.filter(s => s.grade === activeStudent.grade && s.section === activeStudent.section);
  const classAverageGpa = classmates.length > 0
    ? classmates.reduce((sum, s) => sum + s.gpa, 0) / classmates.length
    : activeStudent.gpa;
  const completedHomeworkCount = homeworkList.filter(hw => hw.status === 'Completed').length;
  const gpaStandingHint = activeStudent.gpa >= 3.5 ? 'Excellent standing' : activeStudent.gpa >= 3.0 ? 'Good standing' : 'Needs improvement';

  const handleDownloadResource = async (res: { name: string; format: string; size: string }) => {
    await generatePDFFromMarkdown(
      `**Format:** ${res.format}\n**Size:** ${res.size}\n\nCover page for **${res.name}**. Contact your school for the full distributed file.`,
      `${slugifyFilename(res.name)}.pdf`,
      res.name,
    );
    addNotification('Asset Downloaded', `Download started for "${res.name}".`, 'info');
  };

  return (
    <DashboardShell
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      title={meta.title}
      subtitle={meta.subtitle}
      eyebrow="Student Portal"
      actions={
        <Badge variant="primary" badgeStyle="subtle" size="md">
          {activeStudent.name} · {activeStudent.grade} {activeStudent.section}
        </Badge>
      }
    >
          {activeTab === 'dashboard' && (
            <div className="space-y-6 text-left">
              <KpiGrid>
                <KpiWidget label="Cumulative GPA" value={activeStudent.gpa.toFixed(2)} hint={gpaStandingHint} tone="emphasis" icon={<span>★</span>} />
                <KpiWidget label="Attendance" value={`${activeStudent.attendanceRate}%`} hint="This term" tone="emphasis" icon={<span>✓</span>} />
                <KpiWidget label="Tasks Done" value={`${completedHomeworkCount}/${homeworkList.length}`} hint="Assessments" tone="default" icon={<span>📋</span>} />
                <KpiWidget label="Class Average" value={classAverageGpa.toFixed(2)} hint={`Section ${activeStudent.section}`} tone="default" icon={<span>📊</span>} />
              </KpiGrid>

              {/* Progress and Homework details */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                <ContentCard
                  title="My Syllabus Grades Completion"
                  description={`Estimated score averages compared with school target level criteria (${SYLLABUS_TARGET_PCT}% minimum).`}
                >
                  <div className="space-y-5">
                    {syllabusGrades.map((row) => {
                      const meetsTarget = row.score >= SYLLABUS_TARGET_PCT;
                      return (
                        <MetricProgressRow
                          key={row.id}
                          label={
                            <>
                              {row.subject}{' '}
                              <span className="font-normal text-muted-foreground">({row.topic})</span>
                            </>
                          }
                          headerExtra={
                            <Badge variant={meetsTarget ? 'success' : 'warning'} size="sm">
                              {syllabusStatusLabel(row.score)}
                            </Badge>
                          }
                          value={row.score}
                          valueDisplay={
                            <>
                              {row.score}% <span className="text-muted-foreground font-semibold mx-0.5">•</span>{' '}
                              {row.letter}
                            </>
                          }
                          barClassName={syllabusBarClass(row.score)}
                          targetPercent={SYLLABUS_TARGET_PCT}
                        />
                      );
                    })}
                  </div>
                </ContentCard>

                {/* Homework Task checklist */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-semibold">Pending Class Homework Checklist</CardTitle>
                    <CardDescription>Assignments due for submission in your active term blocks.</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-2 space-y-3">
                    {homeworkList.map((hw) => (
                      <div key={hw.id} className="flex justify-between items-center p-3 bg-muted/40 border border-border/40 rounded-lg">
                        <div>
                          <span className="text-xs font-bold text-foreground">{hw.task}</span>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{hw.subject} • Due: {hw.due}</p>
                        </div>
                        <Badge variant={hw.status === 'Completed' ? 'success' : 'neutral'} badgeStyle="subtle" size="sm">
                          {hw.status}
                        </Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>

              </div>

            </div>
          )}

          {activeTab === 'academic-calendar' && (
            <div className="space-y-6 animate-fade-in text-left">
          <PublishedAcademicCalendarPanel
            schoolId={activeStudent?.schoolId || 'sch-1'}
          />
            </div>
          )}

          {activeTab === 'communication' && (
            <ParentCommunicationModule
              mode="student"
              childrenOptions={
                activeStudent
                  ? [{ id: activeStudent.id, name: activeStudent.name }]
                  : []
              }
            />
          )}

          {/* ==================================================== */}
          {/* TAB 2: BOOKS & RESOURCES                             */}
          {/* ==================================================== */}
          {activeTab === 'resources' && (
            <div className="space-y-6 animate-fade-in text-left">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-semibold">Government Disseminated Textbook Assets</CardTitle>
                  <CardDescription>Syllabus books and guidelines broadcast by curriculum directors ready for download.</CardDescription>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {disseminatedResources.map((res) => (
                      <div key={res.id} className="p-4 bg-muted/40 border border-border/40 rounded-xl space-y-3">
                        <span className="text-2xl">📚</span>
                        <div>
                          <h4 className="text-xs font-bold text-foreground line-clamp-1">{res.name}</h4>
                          <p className="text-[10px] text-muted-foreground mt-0.5">Format: {res.format} • Size: {res.size}</p>
                        </div>
                        <Button
                          onClick={() => void handleDownloadResource(res)}
                          className="w-full text-xxs h-8 bg-card border border-border hover:bg-muted font-semibold cursor-pointer"
                        >
                          ⬇️ Download PDF
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 3: CLASS TIMETABLE                               */}
          {/* ==================================================== */}
          {activeTab === 'timetable' && (
            <div className="space-y-6 animate-fade-in text-left">
              <TablePanel
                title="Weekly Lecture Period Scheduler"
                description="Synced conflict-free schedule grid for Grade 9 Section A class."
              >
                    <table className="eskooly-table">
                      <thead>
                        <tr>
                          <th className="p-3 text-muted-foreground font-semibold">Time Block</th>
                          <th className="p-3 text-muted-foreground font-semibold">Monday</th>
                          <th className="p-3 text-muted-foreground font-semibold">Tuesday</th>
                          <th className="p-3 text-muted-foreground font-semibold">Wednesday</th>
                          <th className="p-3 text-muted-foreground font-semibold">Thursday</th>
                          <th className="p-3 text-muted-foreground font-semibold">Friday</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40 text-foreground font-semibold">
                        {classSchedule.map((row, i) => (
                          <tr key={i} className="hover:bg-muted/20">
                            <td className="p-3 font-bold font-mono text-primary bg-muted/10">{row.time}</td>
                            <td className="p-3"><TimetableCell entry={row.monday} /></td>
                            <td className="p-3"><TimetableCell entry={row.tuesday} /></td>
                            <td className="p-3"><TimetableCell entry={row.wednesday} /></td>
                            <td className="p-3"><TimetableCell entry={row.thursday} /></td>
                            <td className="p-3"><TimetableCell entry={row.friday} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
              </TablePanel>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="space-y-6 animate-fade-in text-left">
              <PortalProfileCard
                roleLabel="Student"
                fields={[
                  { label: 'Grade / Section', value: `${activeStudent.grade} · Section ${activeStudent.section}` },
                  { label: 'Student ID', value: activeStudent.studentId },
                  { label: 'Cumulative GPA', value: activeStudent.gpa.toFixed(2) },
                  { label: 'Attendance rate', value: `${activeStudent.attendanceRate}%` },
                ]}
              />
            </div>
          )}

    </DashboardShell>
  );
}
