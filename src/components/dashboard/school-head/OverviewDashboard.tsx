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
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { staggerContainer, staggerItem } from "@/lib/animations";

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
      const avgGpa =
        gradeStudents.length > 0
          ? parseFloat(
              (
                gradeStudents.reduce((acc, s) => acc + s.gpa, 0) /
                gradeStudents.length
              ).toFixed(1),
            )
          : 0;
      return { name: grade.replace("Grade ", "G"), gpa: avgGpa };
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

  return (
    <motion.div
      className="space-y-6"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      <motion.div
        variants={staggerItem}
        className="relative rounded-xl p-6 md:p-8 overflow-hidden bg-primary text-primary-foreground shadow-md"
      >
        <div className="absolute top-0 right-0 h-full w-1/2 opacity-20 bg-white/10 pointer-events-none rounded-full blur-3xl translate-x-1/4" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
              Welcome Back, Principal
            </h1>
            <p className="text-sm text-white/80 max-w-xl leading-relaxed">
              Empowering Bole Secondary School with AI-driven academic insights
              and seamless staff alignment for the 2018 Ethiopian E.C. academic
              year.
            </p>
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
              variant="outline"
              size="sm"
              onClick={() => handleQuickAction("reports")}
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
        />
        <StatCard
          title="Active Instructors"
          value={activeTeachers}
          subtitle="Certified Teaching Staff"
          trend={{ direction: "neutral", value: "0.0%" }}
          color="muted"
        />
        <StatCard
          title="Class Sections"
          value={totalClasses}
          subtitle="Registered Homeroom Divisions"
          trend={{ direction: "neutral", value: "0.0%" }}
          color="emphasis"
        />
        <StatCard
          title="Wellness & Satisfaction"
          value={`${avgSatisfaction}%`}
          subtitle="Teacher & Student Index"
          trend={{ direction: "up", value: "+3.5%" }}
          color="muted"
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
          color="hsl(var(--primary))"
        />
        <ChartCard
          title="Average GPA Trend"
          description="Academic performance index by grade level"
          data={performanceTrend}
          type="area"
          dataKey="gpa"
          xKey="name"
          color="hsl(var(--accent))"
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
                <CardDescription className="text-xs">
                  Real-time alerts requiring immediate review
                </CardDescription>
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
                        <h4 className="text-xs font-bold text-foreground truncate">
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
            <CardDescription className="text-xs">
              Fast administrative navigation
            </CardDescription>
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
                  <h4 className="text-xs font-bold text-foreground transition-colors">
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
    </motion.div>
  );
};
