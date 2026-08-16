"use client";

import React from "react";
import { motion } from "framer-motion";
import { useApp } from "@/context/AppContext";
import { StatCard } from "@/components/ui/stat-card";
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
import { PerformanceReports } from "@/components/dashboard/school-head/PerformanceReports";

export const OverviewDashboard: React.FC = () => {
  const { students, teachers, checkIns, notifications, classes } = useApp();

  const totalStudents = students.length;
  const activeTeachers = teachers.filter((t) => t.status === "Active").length;
  const totalClasses = classes.length;

  const avgSatisfaction = React.useMemo(() => {
    if (checkIns.length === 0) return 0;
    const sum = checkIns.reduce((acc, curr) => acc + curr.rating, 0);
    return Math.round((sum / checkIns.length) * 20);
  }, [checkIns]);

  const recentNotifications = React.useMemo(
    () => notifications.slice(0, 5),
    [notifications],
  );

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
        className="relative rounded-xl p-6 md:p-8 overflow-hidden bg-[#C79C58] text-white shadow-md"
      >
        <div className="absolute top-0 right-0 h-full w-1/2 opacity-20 bg-white/10 pointer-events-none rounded-full blur-3xl translate-x-1/4" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-title">
              Welcome Back, Principal
            </h1>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <Button
              size="sm"
              onClick={() => handleQuickAction("manage-students")}
              className="text-xs h-9 border-white/30 bg-white/10 text-white hover:bg-white/20"
            >
              View Students
            </Button>
            <Button
              size="sm"
              onClick={scrollToPerformanceReports}
              className="text-xs h-9 border-white/30 bg-white/10 text-white hover:bg-white/20"
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
        <StatCard
          title="Total Enrollment"
          value={totalStudents}
          subtitle="Registered Active Students"
          trend={{ direction: "up", value: "+4.2%" }}
          color="primary"
          icon={
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 017.731-4.41 60.437 60.437 0 00-.491-6.347M4.26 10.147a48.47 48.47 0 017.741-4.153 48.47 48.47 0 017.741 4.153m-15.482 0a48.53 48.53 0 013.44 1.598m11.052-1.598a48.53 48.53 0 00-3.44 1.598" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v.75a48.535 48.535 0 00-3.44 1.598A48.535 48.535 0 0012 3.75l3.44 3.098a48.535 48.535 0 00-3.44-1.598V4.5z" />
            </svg>
          }
        />
        <StatCard
          title="Active Instructors"
          value={activeTeachers}
          subtitle="Certified Teaching Staff"
          trend={{ direction: "neutral", value: "0.0%" }}
          color="muted"
          icon={
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.964 0a9 9 0 10-11.964 0m11.964 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
        />
        <StatCard
          title="Class Sections"
          value={totalClasses}
          subtitle="Registered Homeroom Divisions"
          trend={{ direction: "neutral", value: "0.0%" }}
          color="emphasis"
          icon={
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
            </svg>
          }
        />
        <StatCard
          title="Wellness & Satisfaction"
          value={`${avgSatisfaction}%`}
          subtitle="Teacher & Student Index"
          trend={{ direction: "up", value: "+3.5%" }}
          color="muted"
          icon={
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
          }
        />
      </motion.div>

      <motion.div
        variants={staggerItem}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        <ChartCard
          title="Enrollment by Grade"
          description="Active student distribution across grade levels"
          data={enrollmentTrend}
          type="bar"
          dataKey="students"
          xKey="name"
          colors={["#3478B8", "#5A95C8", "#7FB0D8", "#A4CAE8"]}
        />
        <ChartCard
          title="Average Mark Trend"
          description="Academic performance index by grade level"
          data={performanceTrend}
          type="area"
          dataKey="mark"
          xKey="name"
          color="#3478B8"
        />
      </motion.div>

      <motion.div
        variants={staggerItem}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        <Card className="lg:col-span-2 border-border/60">
          <CardHeader className="pb-3 border-b border-border/30">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold">
                  Principal Attention Feed
                </CardTitle>
              </div>
              <Badge
                badgeStyle="subtle"
                size="sm"
                variant="danger"
                className="font-semibold px-2 py-0.5"
              >
                Action Needed
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-4 px-0">
            <div className="divide-y divide-border/30">
              {recentNotifications.length === 0 ? (
                <div className="text-center py-10 text-xs text-muted-foreground">
                  No pending alerts or notifications.
                </div>
              ) : (
                recentNotifications.map((notif) => (
                  <div
                    key={notif.id}
                    className="px-6 py-4 flex gap-4 items-start hover:bg-muted/30 transition-colors duration-200"
                  >
                    <div className="mt-1 shrink-0">
                      {notif.type === "alert" ? (
                        <div className="h-8 w-8 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center border border-destructive/20 text-sm">
                          ⚠️
                        </div>
                      ) : notif.type === "success" ? (
                        <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center border border-primary/20 text-sm">
                          ✓
                        </div>
                      ) : (
                        <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center border border-primary/20 text-sm">
                          ℹ
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-xs font-bold text-title truncate">
                          {notif.title}
                        </h4>
                        <span className="text-[10px] text-muted-foreground font-semibold shrink-0">
                          {notif.timestamp}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-normal">
                        {notif.description}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-3 border-b border-border/30">
            <CardTitle className="text-base font-bold">
              Portal Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            {[
              {
                tab: "manage-students",
                icon: "🎓",
                title: "View Student Directory",
                desc: "Browse enrolled student records",
                hover: "hover:border-primary/30 group-hover:text-primary",
                bg: "bg-primary/10 text-primary",
              },
              {
                tab: "manage-employees",
                icon: "💼",
                title: "View Faculty Directory",
                desc: "Browse instructional staff profiles",
                hover: "hover:border-accent/30 group-hover:text-accent",
                bg: "bg-accent/10 text-accent",
              },
              {
                tab: "manage-attendance",
                icon: "📋",
                title: "View Attendance Ledger",
                desc: "Inspect student and staff attendance",
                hover: "hover:border-primary/30 group-hover:text-primary",
                bg: "bg-primary/10 text-primary",
              },
              {
                tab: "manage-checkins",
                event: "open-checkin-modal",
                icon: "❤️",
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
                  className={`h-8 w-8 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform duration-200 text-sm font-semibold shrink-0 ${action.bg}`}
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
