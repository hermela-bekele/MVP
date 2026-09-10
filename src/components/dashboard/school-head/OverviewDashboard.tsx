"use client";

import React from "react";
import { motion } from "framer-motion";
import { useApp } from "@/context/AppContext";
import { api } from "@/lib/api";
import { KpiWidget } from "@/components/dashboard/KpiWidget";
import { ChartCard } from "@/components/ui/chart-card";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { gpaToMark } from "@/lib/grading";
import { computeLessonPlanRollup, computeTeacherDevelopmentRollup } from "@/lib/schoolHeadAnalytics";
import { PerformanceReports } from "@/components/dashboard/school-head/PerformanceReports";
import { LeadershipAttentionQueue } from "@/components/dashboard/school-head/LeadershipAttentionQueue";
import { SchoolImprovementTracker } from "@/components/dashboard/school-head/SchoolImprovementTracker";
import {
  GraduationCap,
  Briefcase,
  ClipboardList,
  HeartPulse,
  Megaphone,
} from "lucide-react";

export const OverviewDashboard: React.FC = () => {
  const {
    students, teachers, checkIns, classes, schools, currentUser,
    departments, lessonPlans, leaveRequests, teacherTrainingAssignments,
  } = useApp();

  const currentSchool = schools.find((s) => s.id === currentUser?.schoolId) ?? schools[0];
  const schoolName = currentSchool?.name ?? 'your school';
  const schoolId = currentSchool?.id;

  // Announcements are published in one place (SchoolHeadAnnouncements) and
  // surfaced read-only here — this dashboard never publishes a second copy.
  const [recentAnnouncements, setRecentAnnouncements] = React.useState<{ id: string; title: string; publishedAt?: string }[]>([]);
  React.useEffect(() => {
    api.portalAnnouncements(schoolId).then((rows) => {
      setRecentAnnouncements((rows as { id: string; title: string; publishedAt?: string }[]).slice(0, 3));
    }).catch(() => setRecentAnnouncements([]));
  }, [schoolId]);

  const schoolTeachers = React.useMemo(
    () => teachers.filter((t) => !schoolId || t.schoolId === schoolId),
    [teachers, schoolId],
  );
  const schoolTeacherIds = React.useMemo(() => new Set(schoolTeachers.map((t) => t.id)), [schoolTeachers]);

  const totalStudents = students.length;
  const activeTeachers = schoolTeachers.filter((t) => t.status === "Active").length;
  const totalClasses = classes.length;

  const avgSatisfaction = React.useMemo(() => {
    if (checkIns.length === 0) return 0;
    const sum = checkIns.reduce((acc, curr) => acc + curr.rating, 0);
    return Math.round((sum / checkIns.length) * 20);
  }, [checkIns]);

  const enrollmentTrend = React.useMemo(() => {
    const grades = ["Grade 9", "Grade 10", "Grade 11", "Grade 12"];
    return grades.map((grade) => ({
      name: grade.replace("Grade ", "G"),
      students: students.filter((s) => s.grade === grade).length,
    }));
  }, [students]);

  const performanceTrend = React.useMemo(() => {
    const grades = ["Grade 9", "Grade 10", "Grade 11", "Grade 12"];
    return grades.map((grade) => {
      const gradeStudents = students.filter((s) => s.grade === grade);
      const avgMark =
        gradeStudents.length > 0
          ? Math.round(
              gradeStudents.reduce((acc, s) => acc + gpaToMark(s.gpa), 0) /
                gradeStudents.length,
            )
          : 0;
      return { name: grade.replace("Grade ", "G"), mark: avgMark };
    });
  }, [students]);

  // --- 1. Academic & Student Outcome: "Are students learning?" ---
  const passRate = React.useMemo(() => {
    if (students.length === 0) return 0;
    return Math.round((students.filter((s) => s.gpa >= 2.0).length / students.length) * 100);
  }, [students]);
  const avgAttendance = React.useMemo(() => {
    if (students.length === 0) return 0;
    return Math.round(students.reduce((acc, s) => acc + s.attendanceRate, 0) / students.length);
  }, [students]);
  const atRiskStudents = React.useMemo(
    () => students.filter((s) => s.gpa < 2.0 || s.attendanceRate < 75).length,
    [students],
  );

  // --- 2. Curriculum & Instruction: "Are we implementing the curriculum?" ---
  const lessonPlanRollup = React.useMemo(
    () => computeLessonPlanRollup(lessonPlans, schoolTeachers, departments, schoolTeacherIds),
    [lessonPlans, schoolTeachers, departments, schoolTeacherIds],
  );
  const { approved: plansApproved, pendingReview: plansPending, returned: plansReturned, draft: plansDraft } = lessonPlanRollup;
  const departmentIssues = lessonPlanRollup.departmentsWithRecurringIssues.slice(0, 3);

  // --- 3. People & Professional Development: "Are teachers and departments performing effectively?" ---
  const onLeaveTeachers = schoolTeachers.filter((t) => t.status === 'On Leave').length;
  const expectedTeachers = Math.ceil(totalStudents / 30);
  const staffingGap = Math.max(0, expectedTeachers - schoolTeachers.length);
  const pendingLeaveRequests = leaveRequests.filter((r) => r.status === 'Pending').length;
  const developmentRollup = React.useMemo(
    () => computeTeacherDevelopmentRollup(teacherTrainingAssignments, schoolTeacherIds),
    [teacherTrainingAssignments, schoolTeacherIds],
  );
  const trainingCompletionRate = developmentRollup.overallCompletionRate;
  const overdueTraining = developmentRollup.byProgram.reduce((acc, p) => acc + p.overdueCount, 0);

  const handleQuickAction = (tabId: string, eventName?: string) => {
    window.dispatchEvent(new CustomEvent("change-tab", { detail: tabId }));
    if (eventName) {
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent(eventName));
      }, 100);
    }
  };

  const scrollToPerformanceReports = () => {
    document
      .getElementById("performance-reports")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <motion.div
      className="school-head-dashboard space-y-6"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      <motion.div
        variants={staggerItem}
        className="relative rounded-xl p-6 md:p-8 overflow-hidden bg-[hsl(var(--sidebar-bg))] text-[hsl(218_32%_14%)] shadow-md border border-[hsl(var(--primary-light)/0.4)]"
      >
        <div className="pointer-events-none absolute top-0 right-0 h-full w-1/2 opacity-60 bg-[hsl(var(--primary-light)/0.3)] rounded-full blur-3xl translate-x-1/4" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-title">
              Welcome Back{currentUser?.displayName ? `, ${currentUser.displayName}` : ''}
            </h1>
            <p className="text-sm text-muted-foreground max-w-xl leading-relaxed">
              Empowering {schoolName} with data-driven academic insights
              and seamless staff alignment for the 2018 Ethiopian E.C. academic
              year.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <Button
              size="sm"
              onClick={() => handleQuickAction("manage-students")}
              className="text-xs h-9 border-[hsl(var(--primary)/0.3)] bg-white/70 text-[hsl(218_32%_14%)] hover:bg-white"
            >
              View Students
            </Button>
            <Button
              size="sm"
              onClick={scrollToPerformanceReports}
              className="text-xs h-9 border-[hsl(var(--primary)/0.3)] bg-white/70 text-[hsl(218_32%_14%)] hover:bg-white"
            >
              Performance Reports
            </Button>
          </div>
        </div>
      </motion.div>

      <motion.div
        variants={staggerItem}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <KpiWidget
          label="Total Enrollment"
          value={totalStudents}
          hint="Registered Active Students"
          tone="default"
          animated
          icon={
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 017.731-4.41 60.437 60.437 0 00-.491-6.347M4.26 10.147a48.47 48.47 0 017.741-4.153 48.47 48.47 0 017.741 4.153m-15.482 0a48.53 48.53 0 013.44 1.598m11.052-1.598a48.53 48.53 0 00-3.44 1.598" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v.75a48.535 48.535 0 00-3.44 1.598A48.535 48.535 0 0012 3.75l3.44 3.098a48.535 48.535 0 00-3.44-1.598V4.5z" />
            </svg>
          }
        />
        <KpiWidget
          label="Active Instructors"
          value={activeTeachers}
          hint="Certified Teaching Staff"
          tone="muted"
          animated
          icon={
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.964 0a9 9 0 10-11.964 0m11.964 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
        />
        <KpiWidget
          label="Class Sections"
          value={totalClasses}
          hint="Registered Homeroom Divisions"
          tone="emphasis"
          animated
          icon={
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
            </svg>
          }
        />
        <KpiWidget
          label="Wellness & Satisfaction"
          value={checkIns.length > 0 ? `${avgSatisfaction}%` : '—'}
          hint="Teacher & Student Index"
          tone="muted"
          icon={
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
          }
        />
      </motion.div>

      {/* 1. Academic & Student Outcome */}
      <motion.div variants={staggerItem} className="space-y-3">
        <div>
          <h2 className="text-base font-bold text-title">Academic & Student Outcome</h2>
          <p className="text-xs text-muted-foreground">Are students learning?</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="border-border/60">
            <CardContent className="pt-5 space-y-3">
              <div><p className="text-2xl font-bold text-primary">{passRate}%</p><p className="text-xs text-muted-foreground">Pass rate (GPA ≥ 2.0)</p></div>
              <div><p className="text-2xl font-bold text-foreground">{avgAttendance}%</p><p className="text-xs text-muted-foreground">Average attendance rate</p></div>
              <div><p className={`text-2xl font-bold ${atRiskStudents > 0 ? 'text-red-600' : 'text-foreground'}`}>{atRiskStudents}</p><p className="text-xs text-muted-foreground">Students at learning risk (low GPA or attendance)</p></div>
            </CardContent>
          </Card>
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ChartCard
              title="Enrollment by Grade"
              description="Active student distribution"
              data={enrollmentTrend}
              type="bar"
              dataKey="students"
              xKey="name"
              colors={["hsl(var(--primary))", "hsl(var(--primary-light))", "hsl(43 65% 78%)", "hsl(43 55% 90%)"]}
            />
            <ChartCard
              title="Average Mark Trend"
              description="By grade level"
              data={performanceTrend}
              type="area"
              dataKey="mark"
              xKey="name"
              color="hsl(var(--primary-light))"
            />
          </div>
        </div>
      </motion.div>

      {/* 2. Curriculum & Instruction */}
      <motion.div variants={staggerItem} className="space-y-3">
        <div>
          <h2 className="text-base font-bold text-title">Curriculum & Instruction</h2>
          <p className="text-xs text-muted-foreground">Are we implementing the curriculum?</p>
        </div>
        <Card className="border-border/60">
          <CardContent className="pt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
            <div className="grid grid-cols-3 gap-3">
              <div><p className="text-xl font-bold text-foreground">{plansApproved}</p><p className="text-[10px] text-muted-foreground">Approved</p></div>
              <div><p className="text-xl font-bold text-amber-600">{plansPending}</p><p className="text-[10px] text-muted-foreground">Pending review</p></div>
              <div><p className="text-xl font-bold text-red-600">{plansReturned + plansDraft}</p><p className="text-[10px] text-muted-foreground">Draft / returned</p></div>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-2">Departments with the most recurring issues</p>
              {departmentIssues.length === 0 ? (
                <p className="text-xs text-muted-foreground">No outstanding lesson-plan issues.</p>
              ) : (
                <div className="space-y-1.5">
                  {departmentIssues.map(({ name, unresolvedCount }) => (
                    <div key={name} className="flex items-center justify-between text-xs">
                      <span className="text-foreground">{name}</span>
                      <Badge variant="warning" badgeStyle="subtle" size="sm">{unresolvedCount} unresolved</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 3. People & Professional Development */}
      <motion.div variants={staggerItem} className="space-y-3">
        <div>
          <h2 className="text-base font-bold text-title">People & Professional Development</h2>
          <p className="text-xs text-muted-foreground">Are teachers and departments performing effectively?</p>
        </div>
        <Card className="border-border/60">
          <CardContent className="pt-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <div><p className="text-xl font-bold text-foreground">{activeTeachers}</p><p className="text-[10px] text-muted-foreground">Active teachers</p></div>
            <div><p className="text-xl font-bold text-foreground">{onLeaveTeachers}</p><p className="text-[10px] text-muted-foreground">On leave</p></div>
            <div><p className={`text-xl font-bold ${staffingGap > 0 ? 'text-red-600' : 'text-foreground'}`}>{staffingGap}</p><p className="text-[10px] text-muted-foreground">Estimated staffing gap</p></div>
            <div><p className={`text-xl font-bold ${pendingLeaveRequests > 0 ? 'text-amber-600' : 'text-foreground'}`}>{pendingLeaveRequests}</p><p className="text-[10px] text-muted-foreground">Pending leave requests</p></div>
            <div>
              <p className="text-xl font-bold text-foreground">{trainingCompletionRate !== null ? `${trainingCompletionRate}%` : '—'}</p>
              <p className="text-[10px] text-muted-foreground">Training completion{overdueTraining > 0 ? ` (${overdueTraining} overdue)` : ''}</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 4. Leadership Attention & Actions + Quick Actions */}
      <motion.div variants={staggerItem} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <LeadershipAttentionQueue />
          {recentAnnouncements.length > 0 && (
            <Card className="border-border/60">
              <CardHeader className="pb-3 border-b border-border/30">
                <div className="flex items-center gap-2">
                  <Megaphone className="h-4 w-4 text-muted-foreground" aria-hidden />
                  <CardTitle className="text-sm font-bold">Recent Announcements</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-3 space-y-2">
                {recentAnnouncements.map((a) => (
                  <p key={a.id} className="text-xs text-foreground font-medium truncate">{a.title}</p>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
        <Card className="border-border/60">
          <CardHeader className="pb-3 border-b border-border/30">
            <CardTitle className="text-base font-bold">Portal Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            {[
              {
                tab: "manage-students",
                icon: <GraduationCap className="h-4 w-4" aria-hidden />,
                title: "View Student Directory",
                desc: "Browse enrolled student records",
                hover: "hover:border-primary/30 group-hover:text-primary",
                bg: "bg-primary/10 text-primary",
              },
              {
                tab: "manage-employees",
                icon: <Briefcase className="h-4 w-4" aria-hidden />,
                title: "View Faculty Directory",
                desc: "Browse instructional staff profiles",
                hover: "hover:border-accent/30 group-hover:text-accent",
                bg: "bg-accent/10 text-accent",
              },
              {
                tab: "manage-attendance",
                icon: <ClipboardList className="h-4 w-4" aria-hidden />,
                title: "View Attendance Ledger",
                desc: "Inspect student and staff attendance",
                hover: "hover:border-primary/30 group-hover:text-primary",
                bg: "bg-primary/10 text-primary",
              },
              {
                tab: "manage-checkins",
                event: "open-checkin-modal",
                icon: <HeartPulse className="h-4 w-4" aria-hidden />,
                title: "New Wellness Check-in",
                desc: "Publish wellness survey",
                hover: "hover:border-primary/30 group-hover:text-primary",
                bg: "bg-primary/10 text-primary",
              },
            ].map((action) => (
              <button
                key={action.tab}
                type="button"
                onClick={() => handleQuickAction(action.tab, action.event)}
                className={`w-full text-left p-3 min-h-[44px] rounded-xl border border-border/50 hover:bg-muted/40 flex items-center gap-3 transition-all duration-200 group cursor-pointer active:scale-[0.98] ${action.hover}`}
              >
                <div
                  className={`h-8 w-8 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform duration-200 shrink-0 ${action.bg}`}
                >
                  {action.icon}
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-title transition-colors">
                    {action.title}
                  </h4>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {action.desc}
                  </p>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      {/* 5. School Improvement & Quality */}
      <motion.div variants={staggerItem}>
        <SchoolImprovementTracker />
      </motion.div>

      <motion.div id="performance-reports" variants={staggerItem} className="space-y-3 scroll-mt-6">
        <div>
          <h2 className="text-base font-bold text-title">Performance Reports</h2>
          <p className="text-xs text-muted-foreground">
            Analyze academic indicators, curriculum passing rates, and class averages.
          </p>
        </div>
        <PerformanceReports />
      </motion.div>
    </motion.div>
  );
};
