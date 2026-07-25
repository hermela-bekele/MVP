'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { KpiWidget, KpiGrid } from '@/components/dashboard/KpiWidget';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MetricProgressRow } from '@/components/ui/metric-progress-row';
import { PublishedAcademicCalendarPanel } from '@/components/dashboard/PublishedAcademicCalendarPanel';

export default function ParentPortalPage() {
  const { students, attendance, addNotification } = useApp();
  const [activeTab, setActiveTab] = useState('dashboard');

  // Let's implement an interactive Child Switcher so the parent can inspect
  // both Selam Abebe (High score) and Yonas Kassa (Low score/attendance warning)
  const [selectedChildId, setSelectedChildId] = useState('std-1');

  // Messaging State
  const [messageInput, setMessageInput] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { role: 'teacher', text: 'Greeting! This is homeroom teacher Martha Feyissa. Selam has been performing exceptionally in our Grade 9 Biology laboratory assignments.' }
  ]);

  const activeChild = students.find(s => s.id === selectedChildId) || students[0];

  const handleChildSwitch = (id: string) => {
    setSelectedChildId(id);

    // Update initial message thread based on child
    if (id === 'std-2') {
      setChatHistory([
        { role: 'teacher', text: 'Hello Ato Kassa. I am writing to alert you that Yonas has missed two consecutive chemistry laboratory blocks this week. Daily attendance is critical for exam preparation.' }
      ]);
    } else {
      setChatHistory([
        { role: 'teacher', text: 'Greeting! This is homeroom teacher Martha Feyissa. Selam has been performing exceptionally in our Grade 9 Biology laboratory assignments.' }
      ]);
    }
  };

  const handleSendMessage = (textToSend?: string) => {
    const text = textToSend || messageInput;
    if (!text.trim()) return;

    setChatHistory((prev) => [...prev, { role: 'parent', text }]);
    setMessageInput('');

    // Simulate reply cycle
    setTimeout(() => {
      setChatHistory((prev) => [
        ...prev,
        { role: 'teacher', text: `Received. I have noted this down in the ${activeChild.name} portal log. Let's keep aligned on the homework sheets.` }
      ]);
      addNotification('Teacher Replied', 'Martha Feyissa sent you a message back.', 'info');
    }, 1200);
  };

  // Filter attendance logs for active child
  const childAttendance = attendance.filter((att) => att.studentId === activeChild.id);

  // Calendar parameters (May 2026)
  const calendarDays = Array.from({ length: 31 }).map((_, i) => {
    const day = i + 1;
    const dateStr = `2026-05-${day < 10 ? '0' + day : day}`;
    const log = childAttendance.find((att) => att.date === dateStr);
    return { day, log };
  });

  const childSwitcher = (
    <div className="flex items-center gap-1 p-1 bg-muted/50 border border-border/70 rounded-lg">
      <button
        type="button"
        onClick={() => handleChildSwitch('std-1')}
        className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-all ${
          selectedChildId === 'std-1' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        Selam Abebe
      </button>
      <button
        type="button"
        onClick={() => handleChildSwitch('std-2')}
        className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-all ${
          selectedChildId === 'std-2' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        Yonas Kassa
      </button>
    </div>
  );

  const tabTitles: Record<string, { title: string; subtitle?: string }> = {
    dashboard: { title: 'Child Progress Hub', subtitle: `Monitoring ${activeChild.name}` },
    attendance: { title: 'Attendance Log', subtitle: 'Monthly attendance calendar.' },
    messaging: { title: 'Teacher Messaging', subtitle: 'Communicate with homeroom teachers.' },
  };
  const meta = tabTitles[activeTab] ?? tabTitles.dashboard;

  return (
    <DashboardShell
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      title={meta.title}
      subtitle={meta.subtitle}
      eyebrow="Parent Portal · Bole Secondary"
      actions={childSwitcher}
    >
          {activeTab === 'dashboard' && (
            <div className="space-y-6 text-left">
              <KpiGrid>
                <KpiWidget label="Cumulative GPA" value={activeChild.gpa.toFixed(2)} hint={activeChild.gpa >= 3 ? 'High standing' : 'Needs support'} tone="default" icon={<span>★</span>} />
                <KpiWidget label="Attendance" value={`${activeChild.attendanceRate}%`} hint={activeChild.attendanceRate >= 90 ? 'On target' : 'Below target'} tone="emphasis" icon={<span>📅</span>} />
                <KpiWidget label="Section" value={`G9-${activeChild.section}`} hint="Homeroom: Martha F." tone="default" icon={<span>🏫</span>} />
                <KpiWidget label="Status" value={activeChild.status} hint="Enrollment" tone="emphasis" icon={<span>✓</span>} />
              </KpiGrid>

              {/* Progress Gauges and Alert Watchlists */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* GPA Comparison gauge */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-semibold">GPA Comparison Benchmark</CardTitle>
                    <CardDescription>Comparative scores against overall Bole school grade-level average.</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-2 space-y-4">
                    <MetricProgressRow
                      label={`${activeChild.name} Cumulative GPA`}
                      value={(activeChild.gpa / 4.0) * 100}
                      valueDisplay={activeChild.gpa.toFixed(2)}
                      barClassName="bg-primary"
                    />
                    <MetricProgressRow
                      label="Grade Level Average GPA"
                      value={(2.98 / 4.0) * 100}
                      valueDisplay="2.98"
                      barClassName="bg-primary/45"
                    />
                  </CardContent>
                </Card>

                {/* Directive watch lists */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-semibold">Urgent School Alerts</CardTitle>
                    <CardDescription>Direct alerts logged by instructors or principal regarding your child.</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-2">
                    {activeChild.id === 'std-2' ? (
                      <div className="p-3.5 bg-red-500/5 border border-red-500/20 text-foreground rounded-lg text-xxs leading-normal flex items-start space-x-3 text-left">
                        <span className="text-base">⚠️</span>
                        <div className="space-y-1">
                          <h4 className="font-bold text-red-500">Critical Attendance Drop: Yonas Kassa</h4>
                          <p className="text-muted-foreground">Yonas attendance rate has fallen to 85.2%. School rules require principal conference if attendance drops below 85%.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3.5 bg-muted/50 border border-border text-foreground rounded-lg text-xxs leading-normal flex items-start space-x-3 text-left">
                        <span className="text-base">✓</span>
                        <div className="space-y-1">
                          <h4 className="font-bold text-foreground">Academic Standing: Excellent</h4>
                          <p className="text-muted-foreground">Selam is currently ranked top 5% in Section A. Nominated for Science and Math regional olympiads.</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

              </div>

            </div>
          )}

          {activeTab === 'academic-calendar' && (
            <div className="space-y-6 animate-fade-in text-left">
              <PublishedAcademicCalendarPanel
                schoolId={activeChild?.schoolId || 'sch-1'}
                title="School academic calendar"
                description="Stay on top of exam windows, breaks, and parent gatherings disseminated by the school."
              />
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 2: ATTENDANCE LOG                                */}
          {/* ==================================================== */}
          {activeTab === 'attendance' && (
            <div className="space-y-6 animate-fade-in text-left">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-semibold">Attendance Log Calendar (May 2026)</CardTitle>
                  <CardDescription>Flagging present, late, or absent logs. Helps trace consistency.</CardDescription>
                </CardHeader>
                <CardContent className="pt-2 space-y-6">
                  
                  {/* Indicators */}
                  <div className="flex space-x-4 text-xxs font-bold">
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-primary rounded-full" /> Present</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-muted-foreground rounded-full" /> Late</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-red-500 rounded-full" /> Absent</span>
                  </div>

                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-2 max-w-xl mx-auto border border-border/40 p-4 rounded-xl bg-muted/20 text-center text-xxs font-bold">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                      <div key={day} className="text-muted-foreground py-1">{day}</div>
                    ))}
                    
                    {/* Filler for calendar alignment */}
                    <div />
                    <div />
                    <div />
                    <div />

                    {calendarDays.map(({ day, log }) => {
                      const isToday = day === 20;
                      return (
                        <div 
                          key={day} 
                          className={`p-2 border border-border/30 rounded-md relative flex flex-col items-center justify-between h-12 bg-card ${
                            isToday ? 'ring-2 ring-primary ring-offset-2' : ''
                          }`}
                        >
                          <span className="text-[10px] text-muted-foreground">{day}</span>
                          {log ? (
                            <span className={`w-2 h-2 rounded-full mt-1 ${
                              log.status === 'Present' 
                                ? 'bg-primary' 
                                : log.status === 'Late'
                                ? 'bg-muted-foreground'
                                : 'bg-primary/40'
                            }`} title={`${log.status}: ${log.remarks || 'None'}`} />
                          ) : (
                            <span className="w-2 h-2 bg-primary rounded-full mt-1" title="Present (Simulated)" />
                          )}
                        </div>
                      );
                    })}
                  </div>

                </CardContent>
              </Card>
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 3: TEACHER MESSAGING                             */}
          {/* ==================================================== */}
          {activeTab === 'messaging' && (
            <div className="space-y-6 animate-fade-in text-left">
              <Card className="flex flex-col h-[500px]">
                <CardHeader className="shrink-0 border-b border-border/40">
                  <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                    <span>💬</span> Live-Simulated Messaging Desk
                  </CardTitle>
                  <CardDescription>Direct alignment threads with homeroom teacher Martha Feyissa.</CardDescription>
                </CardHeader>
                
                {/* Chat History */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3.5 leading-normal text-xxs font-medium">
                  {chatHistory.map((ch, idx) => (
                    <div 
                      key={idx} 
                      className={`flex ${ch.role === 'parent' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-xs p-3 rounded-lg border ${
                        ch.role === 'parent'
                          ? 'bg-primary border-primary/20 text-primary-foreground font-semibold rounded-br-none'
                          : 'bg-card border-border/80 text-foreground rounded-bl-none'
                      }`}>
                        <p>{ch.text}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Quick replies for instant feedback */}
                <div className="p-3 border-t border-border/40 bg-card shrink-0 flex flex-wrap gap-2 justify-start">
                  <span className="text-[10px] text-muted-foreground w-full mb-1 font-semibold uppercase tracking-wider">Quick Preset Replies:</span>
                  {activeChild.id === 'std-2' ? (
                    <>
                      <button 
                        onClick={() => handleSendMessage("I will strictly review his math worksheets tonight.")}
                        className="px-3 py-1.5 bg-muted hover:bg-muted/80 text-foreground rounded-md text-[10px] font-bold cursor-pointer border border-border"
                      >
                        ✏️ Will review math sheets tonight
                      </button>
                      <button 
                        onClick={() => handleSendMessage("Please arrange a homeroom discussion session this Friday.")}
                        className="px-3 py-1.5 bg-muted hover:bg-muted/80 text-foreground rounded-md text-[10px] font-bold cursor-pointer border border-border"
                      >
                        📅 Arrange homeroom meeting
                      </button>
                    </>
                  ) : (
                    <>
                      <button 
                        onClick={() => handleSendMessage("Thank you, she is excited to join the regional STEM olympiad!")}
                        className="px-3 py-1.5 bg-muted hover:bg-muted/80 text-foreground rounded-md text-[10px] font-bold cursor-pointer border border-border"
                      >
                        🏅 Glad she will join Science Olympiad!
                      </button>
                      <button 
                        onClick={() => handleSendMessage("Please send any extra continuous biology laboratory worksheets.")}
                        className="px-3 py-1.5 bg-muted hover:bg-muted/80 text-foreground rounded-md text-[10px] font-bold cursor-pointer border border-border"
                      >
                        📚 Request extra biology sheets
                      </button>
                    </>
                  )}
                </div>

                {/* Manual Input */}
                <div className="p-3 border-t border-border/40 bg-muted/20 shrink-0 flex gap-2">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Type custom message to homeroom teacher..."
                    className="flex-1 h-10 px-3 bg-card border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                  <Button 
                    onClick={() => handleSendMessage()}
                    variant="organic" 
                    className="h-10 text-xs shrink-0 border-none cursor-pointer"
                  >
                    Send
                  </Button>
                </div>
              </Card>
            </div>
          )}

    </DashboardShell>
  );
}
