"use client";

import React, { useMemo, useState, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { uploadFile } from "@/lib/api";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { KpiWidget, KpiGrid } from "@/components/dashboard/KpiWidget";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { ContentCard } from "@/components/dashboard/ContentCard";
import { TablePanel } from "@/components/dashboard/TablePanel";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Dialog, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import type { Teacher, SchoolClass, LessonPlan } from "@/lib/mockData";
import { MetricProgressRow } from "@/components/ui/metric-progress-row";
import { ArrowLeft, BarChart3, ClipboardList, Users, AlertTriangle, School, Inbox } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { computeSubjectPerformance } from "@/lib/analytics";
import {
  classSectionKey,
  filterBySubjectScope,
  isSubjectTeacher,
  resolveDeptHeadScope,
  subjectMatches,
  subjectPerformanceBarClass,
  subjectStatusLabel,
  type SubjectPerformanceStatus,
} from "@/lib/departmentHead";
import { assessmentNeedsApproval } from "@/lib/teacherPortal";
import { DeptAnnualPlanPanel } from "@/components/dashboard/department-head/DeptAnnualPlanPanel";
import { DeptLessonPlansPanel } from "@/components/dashboard/department-head/DeptLessonPlansPanel";
import { DeptGapAnalysisPanel } from "@/components/dashboard/department-head/DeptGapAnalysisPanel";
import { DeptTeacherDevelopmentAssignmentPanel } from "@/components/dashboard/department-head/DeptTeacherDevelopmentAssignmentPanel";
import { DeptFeedbackPanel } from "@/components/dashboard/department-head/DeptFeedbackPanel";
import { DeptWellnessCheckins } from "@/components/dashboard/department-head/DeptWellnessCheckins";
import { PublishedAcademicCalendarPanel } from "@/components/dashboard/PublishedAcademicCalendarPanel";
import { portalTabPath, tabFromPortalPath } from "@/lib/portalPaths";
import { CommunicationModule } from "@/components/dashboard/communication/CommunicationModule";
import { DeptAssessmentCreatePanel } from "@/components/dashboard/department-head/DeptAssessmentCreatePanel";
import { TeacherTrainingTab } from "@/components/dashboard/teacher/TeacherTrainingTab";
import { PortalProfileCard } from "@/components/dashboard/shared/PortalProfileCard";
import { DetailField } from "@/components/dashboard/shared/DetailField";

function studentReportStatus(gpa: number): "Excellent" | "On Track" | "At Risk" {
  if (gpa >= 3.5) return "Excellent";
  if (gpa >= 2.5) return "On Track";
  return "At Risk";
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-primary" style={{ width: `${value}%` }} />
      </div>
      <span className="text-xxs font-bold text-foreground font-mono">{value}%</span>
    </div>
  );
}

/** Workflow-stage completion for a plan (Draft → Pending Dept Head → Pending School Head/Approved). */
function planStageProgress(status: LessonPlan["status"] | undefined): number {
  switch (status) {
    case "Approved":
    case "Pending School Head":
      return 100;
    case "Pending Dept Head":
      return 55;
    case "Rejected":
      return 15;
    case "Draft":
      return 25;
    default:
      return 0;
  }
}

type PaceStatus = "On Track" | "Ahead of Plan" | "At Risk";

function paceStatusBadgeVariant(status: PaceStatus): "success" | "info" | "danger" {
  if (status === "Ahead of Plan") return "info";
  if (status === "At Risk") return "danger";
  return "success";
}

export default function DeptHeadPortalApp() {
  const pathname = usePathname();
  const router = useRouter();
  const activeTab = tabFromPortalPath(pathname, "department-head");

  // Class Detail View State (reset whenever the user navigates away from Class room view)
  const [detailClass, setDetailClass] = useState<SchoolClass | null>(null);

  const setActiveTab = useCallback(
    (tab: string) => {
      setDetailClass(null);
      router.push(portalTabPath("department-head", tab));
    },
    [router],
  );

  const {
    teachers,
    students,
    lessonPlans,
    assessments,
    attendance,
    classes,
    departments,
    trainingMaterials,
    studentGradeEntries,
    approveAssessment,
    rejectAssessment,
    addTeacher,
    checkIns,
    addTrainingMaterial,
    disseminateTrainingMaterial,
    addNotification,
    currentUser,
    schools,
  } = useApp();

  const scope = useMemo(
    () => resolveDeptHeadScope(currentUser),
    [currentUser],
  );

  const currentSchool = useMemo(
    () => schools.find((s) => s.id === currentUser?.schoolId) ?? schools[0],
    [schools, currentUser],
  );
  const schoolName = currentSchool?.name ?? 'your school';

  const department = useMemo(
    () =>
      scope
        ? departments.find((d) => d.id === scope.departmentId)
        : undefined,
    [departments, scope],
  );

  // Teacher Detail View State
  const [detailTeacher, setDetailTeacher] = useState<Teacher | null>(null);

  // Attendance Filters State
  const [attStudentName, setAttStudentName] = useState("");
  const [attGrade, setAttGrade] = useState("All");
  const [attSection, setAttSection] = useState("All");
  const [attStartDate, setAttStartDate] = useState("");
  const [attEndDate, setAttEndDate] = useState("");

  // Class Reports Filters State
  const [reportSearch, setReportSearch] = useState("");
  const [reportGrade, setReportGrade] = useState("All");
  const [reportSection, setReportSection] = useState("All");
  const [reportStatus, setReportStatus] = useState("All");

  // Onboard Teacher State
  const [isOnboardOpen, setIsOnboardOpen] = useState(false);
  const [newTeacherName, setNewTeacherName] = useState("");
  const [newTeacherEmail, setNewTeacherEmail] = useState("");
  const [newTeacherPhone, setNewTeacherPhone] = useState("");
  const [newTeacherGrade, setNewTeacherGrade] = useState("Grade 9");
  const [newTeacherCert, setNewTeacherCert] = useState(
    "Professional License A",
  );

  // Study resources upload state
  const [isResourceUploadOpen, setIsResourceUploadOpen] = useState(false);
  const [resourceTitle, setResourceTitle] = useState("");
  const [resourceUrl, setResourceUrl] = useState("");
  const [resourceFile, setResourceFile] = useState<File | null>(null);
  const [resourceUploading, setResourceUploading] = useState(false);
  const [resourceCategory, setResourceCategory] = useState("Pedagogy");
  const [resourceGrade, setResourceGrade] = useState("Grade 9");

  const departmentTeachers = useMemo(
    () => (scope ? teachers.filter((t) => isSubjectTeacher(t, scope)) : []),
    [teachers, scope],
  );

  const departmentAssessments = useMemo(
    () => (scope ? filterBySubjectScope(assessments, scope) : []),
    [assessments, scope],
  );

  const departmentLessonPlans = useMemo(
    () => (scope ? filterBySubjectScope(lessonPlans, scope) : []),
    [lessonPlans, scope],
  );

  const departmentClasses = useMemo(() => {
    const teacherNames = new Set(departmentTeachers.map((t) => t.name));
    return classes.filter((cls) => teacherNames.has(cls.homeroomTeacher));
  }, [classes, departmentTeachers]);

  const teacherPlanProgress = useMemo(() => {
    const rows = departmentTeachers.map((t) => {
      const weeklyPlans = departmentLessonPlans.filter(
        (lp) => lp.teacherName === t.name && lp.planType !== "yearly",
      );
      const annualPlans = departmentLessonPlans.filter(
        (lp) => lp.teacherName === t.name && lp.planType === "yearly",
      );
      const latestAnnual = [...annualPlans].sort(
        (a, b) => b.version - a.version || b.createdAt.localeCompare(a.createdAt),
      )[0];
      const weeklyApproved = weeklyPlans.filter(
        (p) => p.status === "Approved" || p.status === "Pending School Head",
      ).length;
      const weeklyTotal = weeklyPlans.length;
      const weeklyProgress =
        weeklyTotal > 0 ? Math.round((weeklyApproved / weeklyTotal) * 100) : 0;
      const annualProgress = latestAnnual ? planStageProgress(latestAnnual.status) : 0;
      const hasRejected =
        weeklyPlans.some((p) => p.status === "Rejected") || latestAnnual?.status === "Rejected";
      return { teacher: t, weeklyTotal, weeklyProgress, annualProgress, hasRejected };
    });

    const deptAvgWeekly =
      rows.length > 0
        ? rows.reduce((sum, r) => sum + r.weeklyTotal, 0) / rows.length
        : 0;

    return rows.map((row) => {
      let status: PaceStatus;
      if (row.hasRejected) {
        status = "At Risk";
      } else if (deptAvgWeekly <= 0) {
        status = row.weeklyTotal > 0 ? "Ahead of Plan" : "On Track";
      } else {
        const ratio = row.weeklyTotal / deptAvgWeekly;
        status = ratio >= 1.15 ? "Ahead of Plan" : ratio < 0.7 ? "At Risk" : "On Track";
      }
      return { ...row, status };
    });
  }, [departmentTeachers, departmentLessonPlans]);

  const classPlanProgress = useMemo(
    () =>
      departmentClasses.map((cls) => ({
        cls,
        progress: teacherPlanProgress.find((row) => row.teacher.name === cls.homeroomTeacher),
      })),
    [departmentClasses, teacherPlanProgress],
  );

  const departmentStudents = useMemo(() => {
    if (!scope) return [];
    const sectionKeys = new Set(
      departmentClasses.map((cls) => classSectionKey(cls.grade, cls.section)),
    );
    return students.filter(
      (s) =>
        s.schoolId === scope.schoolId &&
        sectionKeys.has(classSectionKey(s.grade, s.section)),
    );
  }, [students, departmentClasses, scope]);

  const reportGradeOptions = useMemo(
    () => Array.from(new Set(departmentStudents.map((s) => s.grade))).sort(),
    [departmentStudents],
  );

  const reportSectionOptions = useMemo(
    () => Array.from(new Set(departmentStudents.map((s) => s.section))).sort(),
    [departmentStudents],
  );

  const filteredReportStudents = useMemo(() => {
    const q = reportSearch.trim().toLowerCase();
    return departmentStudents.filter((std) => {
      if (q && !std.name.toLowerCase().includes(q)) return false;
      if (reportGrade !== "All" && std.grade !== reportGrade) return false;
      if (reportSection !== "All" && std.section !== reportSection) return false;
      if (reportStatus !== "All" && studentReportStatus(std.gpa) !== reportStatus) {
        return false;
      }
      return true;
    });
  }, [departmentStudents, reportSearch, reportGrade, reportSection, reportStatus]);

  const clearReportFilters = () => {
    setReportSearch("");
    setReportGrade("All");
    setReportSection("All");
    setReportStatus("All");
  };

  const departmentAttendance = useMemo(() => {
    const sectionKeys = new Set(
      departmentClasses.map((cls) => classSectionKey(cls.grade, cls.section)),
    );
    return attendance.filter((row) =>
      sectionKeys.has(classSectionKey(row.grade, row.section)),
    );
  }, [attendance, departmentClasses]);

  const attendanceGradeOptions = useMemo(
    () =>
      Array.from(new Set(departmentAttendance.map((row) => row.grade))).sort(),
    [departmentAttendance],
  );

  const attendanceSectionOptions = useMemo(
    () =>
      Array.from(new Set(departmentAttendance.map((row) => row.section))).sort(),
    [departmentAttendance],
  );

  const filteredDepartmentAttendance = useMemo(() => {
    const nameQuery = attStudentName.trim().toLowerCase();
    return departmentAttendance.filter((row) => {
      if (nameQuery && !row.studentName.toLowerCase().includes(nameQuery)) {
        return false;
      }
      if (attGrade !== "All" && row.grade !== attGrade) return false;
      if (attSection !== "All" && row.section !== attSection) return false;
      if (attStartDate && row.date < attStartDate) return false;
      if (attEndDate && row.date > attEndDate) return false;
      return true;
    });
  }, [
    departmentAttendance,
    attStudentName,
    attGrade,
    attSection,
    attStartDate,
    attEndDate,
  ]);

  const clearAttendanceFilters = () => {
    setAttStudentName("");
    setAttGrade("All");
    setAttSection("All");
    setAttStartDate("");
    setAttEndDate("");
  };

  const subjectPerformance = useMemo(
    () => computeSubjectPerformance(studentGradeEntries),
    [studentGradeEntries],
  );

  const subjectMetrics = useMemo(
    () =>
      scope
        ? subjectPerformance.filter((s) => subjectMatches(s.subject, scope.subject))
        : [],
    [subjectPerformance, scope],
  );

  const pendingAssessments = departmentAssessments.filter(
    (asm) =>
      asm.status === "Pending Dept Head" &&
      assessmentNeedsApproval(asm.type, asm.createdByRole),
  );
  const avgDeptGrade =
    subjectMetrics.length > 0
      ? (
          subjectMetrics.reduce((sum, s) => sum + s.average, 0) /
          subjectMetrics.length
        ).toFixed(1)
      : "—";

  const subjectAlerts = subjectMetrics.filter(
    (s) => s.status === "Critical" || s.status === "Warning",
  ).length;

  const activeInstructors = departmentTeachers.filter(
    (t) => t.status === "Active",
  ).length;

  const deptTeacherNames = useMemo(
    () => new Set(departmentTeachers.map((t) => t.name)),
    [departmentTeachers],
  );

  const departmentCheckIns = useMemo(
    () => checkIns.filter((c) => deptTeacherNames.has(c.respondentName)),
    [checkIns, deptTeacherNames],
  );

  const departmentStudyResources = useMemo(
    () =>
      scope
        ? trainingMaterials.filter(
            (m) =>
              m.departmentId === scope.departmentId ||
              (!m.departmentId &&
                m.subject &&
                subjectMatches(m.subject, scope.subject)),
          )
        : [],
    [trainingMaterials, scope],
  );

  const handleUploadResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resourceTitle || (!resourceFile && !resourceUrl.trim())) return;

    setResourceUploading(true);
    try {
      let finalUrl = resourceUrl.trim();
      if (resourceFile) {
        finalUrl = await uploadFile(resourceFile);
      }
      addTrainingMaterial({
        title: resourceTitle,
        resourceUrl: finalUrl,
        category: resourceCategory,
        departmentId: scope?.departmentId ?? "dept-math",
        grade: resourceGrade,
        subject: scope?.subject ?? "Mathematics",
        trainingType: resourceCategory === "STEM" ? "STEM" : "Pedagogy",
      });
      setResourceTitle("");
      setResourceUrl("");
      setResourceFile(null);
      setIsResourceUploadOpen(false);
    } catch (err) {
      addNotification(
        "Upload failed",
        err instanceof Error ? err.message : "Could not upload file. Try again.",
        "alert",
      );
    } finally {
      setResourceUploading(false);
    }
  };

  const handleDisseminateResource = (id: string) => {
    disseminateTrainingMaterial(id);
  };

  const handleOnboardTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeacherName || !newTeacherEmail || !newTeacherPhone || !scope) return;

    addTeacher({
      name: newTeacherName,
      email: newTeacherEmail,
      phone: newTeacherPhone,
      subjects: [scope.subject],
      grades: [newTeacherGrade],
      certification: newTeacherCert || "Professional License A",
      schoolId: scope.schoolId,
      departmentId: scope.departmentId,
      yearsOfExperience: 0,
    });

    // Reset fields
    setNewTeacherName("");
    setNewTeacherEmail("");
    setNewTeacherPhone("");
    setIsOnboardOpen(false);
  };

  const tabTitles: Record<string, { title: string; subtitle?: string }> = {
    dashboard: {
      title: "Subject Performance",
      subtitle: `${scope?.subject ?? "Subject"} department metrics, alerts, and analysis.`,
    },
    reports: {
      title: "Class Reports",
      subtitle: "Section-level academic reports.",
    },
    timetable: {
      title: "Class room view",
      subtitle: "Scheduling and sessions.",
    },
    "academic-calendar": {
      title: "Academic Calendar",
      subtitle: "School calendar disseminated by the school head.",
    },
    sessions: {
      title: "Session Progress",
      subtitle: "Weekly and annual lesson plan progress by class and by teacher.",
    },
    teachers: {
      title: "Manage Teachers",
      subtitle: "Department instructor roster.",
    },
    attendance: {
      title: "Manage Attendance",
      subtitle: "Department attendance overview.",
    },
    assessments: {
      title: "Manage Assessments",
      subtitle: "Generate department exams and review any teacher submissions that still need approval.",
    },
    "annual-plans": {
      title: "Create Annual Lesson Plan",
      subtitle:
        "Generate a curriculum map aligned with academic calendar and time allocation to plan objectives, teaching requirements, and mastery outcomes.",
    },
    "lesson-plans": {
      title: "Weekly Plans Approval",
      subtitle: "Review and approve weekly detailed lesson plans. Your approval is final.",
    },
    communication: {
      title: "Communication",
    },
    "teacher-messages": {
      title: "Messaging",
      subtitle: "Live chat with teachers and review classroom challenges.",
    },
    training: {
      title: "Teacher Development",
      subtitle: "Gap analysis from student results → AI training modules for your department.",
    },
    resources: {
      title: "Study Resources",
      subtitle: "Shared learning materials.",
    },
    feedbacks: {
      title: "Feedback Loops",
      subtitle: "Give direct feedback and review peer, parent, and student feedback for department teachers.",
    },
    checkins: {
      title: "Wellness Check-ins",
      subtitle: "Recurrent questionnaire towards general challenges and school improvement ideas.",
    },
    settings: { title: "Portal Settings", subtitle: "Department preferences." },
    "leadership-development": {
      title: "ELEP · Leadership Development",
      subtitle: "Education Leadership Excellence Program modules for department heads.",
    },
    profile: { title: "My Profile", subtitle: "Your department head account information." },
  };
  const meta = tabTitles[activeTab] ?? tabTitles.dashboard;

  return (
    <DashboardShell
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      title={meta.title}
      subtitle={meta.subtitle}
      eyebrow={`${scope?.subject ?? "Subject"} Department · ${schoolName}`}
      actions={
        <span className="text-xs px-3 py-1.5 rounded-md bg-primary/10 text-primary font-medium border border-primary/20">
          {currentUser?.displayName ?? department?.headName ?? "Department Head"}
        </span>
      }
    >
      {activeTab === "dashboard" && (
        <div className="space-y-6">
          <KpiGrid>
            <KpiWidget
              label="Avg Dept Grade"
              value={`${avgDeptGrade}%`}
              hint="Target: 70%"
              icon={<BarChart3 className="h-5 w-5" strokeWidth={1.75} />}
            />
            <KpiWidget
              label="Pending Reviews"
              value={pendingAssessments.length}
              hint={`${pendingAssessments.length} tests`}
              tone="emphasis"
              icon={<ClipboardList className="h-5 w-5" strokeWidth={1.75} />}
            />
            <KpiWidget
              label="Active Instructors"
              value={activeInstructors}
              hint={`${departmentTeachers.length} on roster`}
              tone="default"
              icon={<Users className="h-5 w-5" strokeWidth={1.75} />}
            />
            <KpiWidget
              label="Subject Alerts"
              value={subjectAlerts}
              hint="Critical & warning"
              tone="emphasis"
              icon={<AlertTriangle className="h-5 w-5" strokeWidth={1.75} />}
            />
          </KpiGrid>

          {/* Subject Breakdown and Teacher Index */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Subject Performance Index */}
            <ContentCard
              title={`${scope?.subject ?? "Subject"} Performance Indicators`}
              description="Average grades compared with student academic risk index thresholds (target 70%)."
            >
              <div className="space-y-5">
                {subjectMetrics.length === 0 ? (
                  <p className="text-center py-6 text-sm text-muted-foreground">
                    No performance data for {scope?.subject ?? "this subject"} yet.
                  </p>
                ) : (
                  subjectMetrics.map((sub) => {
                  const status = sub.status as SubjectPerformanceStatus;
                  return (
                    <MetricProgressRow
                      key={sub.subject}
                      label={
                        <span className="font-semibold">{sub.subject}</span>
                      }
                      headerExtra={
                        <Badge
                          variant={status === "Stable" ? "success" : "warning"}
                          size="sm"
                        >
                          {subjectStatusLabel(status)}
                        </Badge>
                      }
                      subtitle={`Risk index: ${sub.riskIndex}%`}
                      value={sub.average}
                      barClassName={subjectPerformanceBarClass(
                        sub.average,
                        status,
                      )}
                      targetPercent={70}
                    />
                  );
                })
                )}
              </div>
            </ContentCard>

            {/* Inbox Alert Desk */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold">
                  Verification Desk Inbox
                </CardTitle>
                <CardDescription>
                  Tests and quizzes submitted by teachers awaiting department head endorsement.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2 space-y-3">
                {pendingAssessments.length === 0 ? (
                  <div className="text-center py-10 text-xxs text-muted-foreground font-semibold">
                    All reviews are fully completed. Good job!
                  </div>
                ) : (
                  pendingAssessments.map((asm) => (
                    <div
                      key={asm.id}
                      className="flex justify-between items-center p-3 bg-muted/40 border border-border/40 rounded-lg"
                    >
                      <div className="flex flex-col text-left">
                        <span className="text-xs font-semibold text-foreground">
                          {asm.title}
                        </span>
                        <span className="text-[10px] text-muted-foreground mt-0.5">
                          {asm.grade} {asm.subject} • Difficulty:{" "}
                          {asm.difficulty}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => router.push(`/dashboard/department-head/assessments/${asm.id}`)}
                        className="text-xxs cursor-pointer h-8"
                      >
                        Review
                      </Button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Department snapshot — the per-subject average/status breakdown above already
              covers subject performance, so this only covers headcount, not duplicate stats. */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">
                Department snapshot
              </CardTitle>
              <CardDescription>
                {department?.name ?? `${scope?.subject ?? "Subject"} Department`} · {schoolName}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <KpiGrid>
                <KpiWidget label="Instructors" value={departmentTeachers.length} />
                <KpiWidget label="Class sections" value={departmentClasses.length} />
                <KpiWidget label="Students" value={departmentStudents.length} />
                <KpiWidget label="Pending tests" value={pendingAssessments.length} tone="emphasis" />
              </KpiGrid>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "annual-plans" && scope && (
        <DeptAnnualPlanPanel
          subject={scope.subject}
          onViewCalendar={() => setActiveTab("academic-calendar")}
        />
      )}

      {activeTab === "lesson-plans" && (
        <DeptLessonPlansPanel scope={scope} />
      )}

      {activeTab === "teacher-messages" && (
        <CommunicationModule
          mode="department-head"
          mainTab="channels"
          onMainTabChange={() => {}}
        />
      )}
      {activeTab === "communication" && (
        <CommunicationModule
          mode="department-head"
          mainTab="channels"
          onMainTabChange={() => {}}
        />
      )}

      {activeTab === "reports" && (
        <div className="space-y-6 animate-fade-in">
          <Card>
            <CardContent className="pt-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Student name
                  </label>
                  <input
                    type="text"
                    placeholder="Search student..."
                    value={reportSearch}
                    onChange={(e) => setReportSearch(e.target.value)}
                    className="w-full h-10 px-3 bg-muted/40 border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Grade
                  </label>
                  <Select
                    options={[
                      { value: "All", label: "All grades" },
                      ...reportGradeOptions.map((g) => ({ value: g, label: g })),
                    ]}
                    value={reportGrade}
                    onChange={(e) => setReportGrade(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Section
                  </label>
                  <Select
                    options={[
                      { value: "All", label: "All sections" },
                      ...reportSectionOptions.map((s) => ({
                        value: s,
                        label: `Section ${s}`,
                      })),
                    ]}
                    value={reportSection}
                    onChange={(e) => setReportSection(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Status
                  </label>
                  <Select
                    options={[
                      { value: "All", label: "All statuses" },
                      { value: "Excellent", label: "Excellent" },
                      { value: "On Track", label: "On Track" },
                      { value: "At Risk", label: "At Risk" },
                    ]}
                    value={reportStatus}
                    onChange={(e) => setReportStatus(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex justify-end mt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={clearReportFilters}
                  className="text-xs h-8"
                >
                  Clear filters
                </Button>
              </div>
            </CardContent>
          </Card>

          <TablePanel
            title="Class Performance Reports"
            description={`Showing ${filteredReportStudents.length} of ${departmentStudents.length} students for ${scope?.subject ?? "subject"} class sections`}
          >
            <table className="eskooly-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>ID</th>
                  <th>Grade / Section</th>
                  <th>GPA</th>
                  <th>Attendance</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredReportStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-0">
                      <EmptyState icon={<Inbox />} title="No students match these filters." className="py-8" />
                    </td>
                  </tr>
                ) : (
                  filteredReportStudents.map((std) => (
                    <tr key={std.id} className="hover:bg-muted/20">
                      <td className="p-3 font-semibold text-foreground">
                        {std.name}
                      </td>
                      <td className="p-3 font-mono text-xs">{std.studentId}</td>
                      <td className="p-3">
                        {std.grade} · Section {std.section}
                      </td>
                      <td className="p-3 font-mono font-bold">
                        {std.gpa.toFixed(2)}
                      </td>
                      <td className="p-3">{std.attendanceRate}%</td>
                      <td className="p-3">
                        <Badge
                          variant={std.gpa >= 2.5 ? "success" : "warning"}
                          size="sm"
                        >
                          {studentReportStatus(std.gpa)}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </TablePanel>
        </div>
      )}

      {activeTab === "sessions" && (
        <div className="space-y-6 animate-fade-in">
          <TablePanel
            title="Plan progress by class"
            description="Weekly and annual lesson plan progress for each department class section"
          >
            <table className="eskooly-table">
              <thead>
                <tr>
                  <th>Class</th>
                  <th>Homeroom teacher</th>
                  <th>Weekly plan progress</th>
                  <th>Annual plan progress</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {classPlanProgress.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-0">
                      <EmptyState
                        icon={<Inbox />}
                        title={`No class sections assigned to ${scope?.subject ?? "subject"} instructors yet.`}
                        className="py-8"
                      />
                    </td>
                  </tr>
                ) : (
                  classPlanProgress.map(({ cls, progress }) => (
                    <tr key={cls.id} className="hover:bg-muted/20">
                      <td className="p-3 font-semibold text-foreground">
                        {cls.grade} · Section {cls.section}
                      </td>
                      <td className="p-3">{cls.homeroomTeacher}</td>
                      <td className="p-3">
                        <ProgressBar value={progress?.weeklyProgress ?? 0} />
                      </td>
                      <td className="p-3">
                        <ProgressBar value={progress?.annualProgress ?? 0} />
                      </td>
                      <td className="p-3">
                        <Badge
                          variant={paceStatusBadgeVariant(progress?.status ?? "On Track")}
                          size="sm"
                        >
                          {progress?.status ?? "On Track"}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </TablePanel>

          <TablePanel
            title="Plan progress by teacher"
            description="Weekly plan approval rate and annual plan approval stage, paced against the department average"
          >
            <table className="eskooly-table">
              <thead>
                <tr>
                  <th>Teacher</th>
                  <th>Weekly plans submitted</th>
                  <th>Weekly plan progress</th>
                  <th>Annual plan progress</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {teacherPlanProgress.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-0">
                      <EmptyState icon={<Inbox />} title="No instructors on the department roster yet." className="py-8" />
                    </td>
                  </tr>
                ) : (
                  teacherPlanProgress.map((row) => (
                    <tr key={row.teacher.id} className="hover:bg-muted/20">
                      <td className="p-3 font-semibold text-foreground">
                        {row.teacher.name}
                      </td>
                      <td className="p-3 font-mono">{row.weeklyTotal}</td>
                      <td className="p-3">
                        <ProgressBar value={row.weeklyProgress} />
                      </td>
                      <td className="p-3">
                        <ProgressBar value={row.annualProgress} />
                      </td>
                      <td className="p-3">
                        <Badge variant={paceStatusBadgeVariant(row.status)} size="sm">
                          {row.status}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </TablePanel>
        </div>
      )}

      {activeTab === "attendance" && (
        <div className="space-y-6 animate-fade-in">
          <Card>
            <CardContent className="pt-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Student name
                  </label>
                  <input
                    type="text"
                    placeholder="Search student..."
                    value={attStudentName}
                    onChange={(e) => setAttStudentName(e.target.value)}
                    className="w-full h-10 px-3 bg-muted/40 border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Grade
                  </label>
                  <Select
                    options={[
                      { value: "All", label: "All grades" },
                      ...attendanceGradeOptions.map((g) => ({
                        value: g,
                        label: g,
                      })),
                    ]}
                    value={attGrade}
                    onChange={(e) => setAttGrade(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Section
                  </label>
                  <Select
                    options={[
                      { value: "All", label: "All sections" },
                      ...attendanceSectionOptions.map((s) => ({
                        value: s,
                        label: `Section ${s}`,
                      })),
                    ]}
                    value={attSection}
                    onChange={(e) => setAttSection(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    From date
                  </label>
                  <input
                    type="date"
                    value={attStartDate}
                    onChange={(e) => setAttStartDate(e.target.value)}
                    className="w-full h-10 px-3 bg-muted/40 border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    To date
                  </label>
                  <input
                    type="date"
                    value={attEndDate}
                    onChange={(e) => setAttEndDate(e.target.value)}
                    className="w-full h-10 px-3 bg-muted/40 border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
              <div className="flex justify-end mt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={clearAttendanceFilters}
                  className="text-xs h-8"
                >
                  Clear filters
                </Button>
              </div>
            </CardContent>
          </Card>

          <TablePanel
            title="Department attendance log"
            description={`Showing ${filteredDepartmentAttendance.length} of ${departmentAttendance.length} entries for ${scope?.subject ?? "subject"} class sections`}
          >
            <table className="eskooly-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Grade / Section</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {filteredDepartmentAttendance.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-0">
                      <EmptyState icon={<Inbox />} title="No attendance entries match these filters." className="py-8" />
                    </td>
                  </tr>
                ) : (
                  filteredDepartmentAttendance.map((row) => (
                    <tr key={row.id} className="hover:bg-muted/20">
                      <td className="p-3 font-semibold text-foreground">
                        {row.studentName}
                      </td>
                      <td className="p-3">
                        {row.grade} · {row.section}
                      </td>
                      <td className="p-3">{row.date}</td>
                      <td className="p-3">
                        <Badge
                          variant={
                            row.status === "Present"
                              ? "success"
                              : row.status === "Absent"
                                ? "danger"
                                : "warning"
                          }
                          size="sm"
                        >
                          {row.status}
                        </Badge>
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {row.remarks ?? "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </TablePanel>
        </div>
      )}

      {activeTab === "training" && (
        <div className="space-y-6 animate-fade-in">
          <DeptGapAnalysisPanel />
          <DeptTeacherDevelopmentAssignmentPanel />
        </div>
      )}

      {activeTab === "resources" && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex justify-end">
            <Button
              variant="organic"
              size="sm"
              className="text-xs h-9 gap-1.5 border-none"
              onClick={() => setIsResourceUploadOpen(true)}
            >
              + Upload resource
            </Button>
          </div>

          <TablePanel
            title="Study & pedagogy resources"
            description={`Upload materials for ${scope?.subject ?? "subject"} staff and disseminate to all teacher resource libraries`}
          >
            <table className="eskooly-table">
              <thead>
                <tr>
                  <th>Resource</th>
                  <th>Category</th>
                  <th>Grade / Subject</th>
                  <th>Uploaded</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {departmentStudyResources.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-0">
                      <EmptyState icon={<Inbox />} title="No study resources uploaded yet." className="py-8" />
                    </td>
                  </tr>
                ) : (
                  departmentStudyResources.map((mat) => (
                    <tr key={mat.id} className="hover:bg-muted/20">
                      <td className="p-3 font-semibold text-foreground">
                        <a
                          href={mat.resourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:text-primary hover:underline"
                        >
                          {mat.title}
                        </a>
                      </td>
                      <td className="p-3">{mat.category}</td>
                      <td className="p-3">
                        {mat.grade && mat.subject
                          ? `${mat.grade} · ${mat.subject}`
                          : mat.grade || mat.subject || "—"}
                      </td>
                      <td className="p-3">{mat.uploadedAt}</td>
                      <td className="p-3">
                        <Badge
                          variant={mat.disseminated ? "success" : "neutral"}
                          size="sm"
                        >
                          {mat.disseminated ? "Disseminated" : "Draft"}
                        </Badge>
                      </td>
                      <td className="p-3">
                        {mat.disseminated ? (
                          <span className="text-xs text-muted-foreground">
                            Visible to teachers
                          </span>
                        ) : (
                          <Button
                            variant="organic"
                            size="sm"
                            className="text-xs h-8 border-none"
                            onClick={() => handleDisseminateResource(mat.id)}
                          >
                            Disseminate
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </TablePanel>

          <Dialog
            isOpen={isResourceUploadOpen}
            onClose={() => setIsResourceUploadOpen(false)}
            title="Upload study resource"
            size="md"
          >
            <form onSubmit={handleUploadResource} className="space-y-4 pt-2">
              <input
                className="w-full h-10 px-3 bg-muted/40 border border-border rounded-md text-sm text-foreground focus:outline-none"
                required
                placeholder="Resource title"
                value={resourceTitle}
                onChange={(e) => setResourceTitle(e.target.value)}
              />
              <Select
                label="Category"
                options={[
                  { value: "Pedagogy", label: "Pedagogy" },
                  { value: "STEM", label: "STEM" },
                  { value: "Assessment", label: "Assessment" },
                  { value: "Classroom Management", label: "Classroom Management" },
                  { value: "Biology", label: "Biology" },
                  { value: "Chemistry", label: "Chemistry" },
                  { value: "Physics", label: "Physics" },
                  { value: "Mathematics", label: "Mathematics" },
                ]}
                value={resourceCategory}
                onChange={(e) => setResourceCategory(e.target.value)}
              />
              <Select
                label="Grade"
                options={[
                  { value: "Grade 9", label: "Grade 9" },
                  { value: "Grade 10", label: "Grade 10" },
                  { value: "Grade 11", label: "Grade 11" },
                  { value: "Grade 12", label: "Grade 12" },
                ]}
                value={resourceGrade}
                onChange={(e) => setResourceGrade(e.target.value)}
              />
              <input
                className="w-full h-10 px-3 bg-muted/60 border border-border rounded-md text-sm text-foreground focus:outline-none"
                readOnly
                value={scope?.subject ?? "Mathematics"}
              />
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase">
                  File from device
                </label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.webp,.mp4,.txt,.csv,.zip"
                  className="w-full text-sm text-foreground file:mr-3 file:rounded-md file:border-0 file:bg-primary/10 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-primary hover:file:bg-primary/20"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    setResourceFile(file);
                    if (file && !resourceTitle) {
                      setResourceTitle(file.name.replace(/\.[^.]+$/, ""));
                    }
                  }}
                />
                {resourceFile && (
                  <p className="text-xs text-muted-foreground">
                    Selected: {resourceFile.name} ({(resourceFile.size / 1024).toFixed(0)} KB)
                  </p>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border/60" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">or paste a link</span>
                </div>
              </div>
              <input
                className="w-full h-10 px-3 bg-muted/40 border border-border rounded-md text-sm text-foreground focus:outline-none"
                placeholder="External file URL (optional if uploading from device)"
                value={resourceUrl}
                onChange={(e) => setResourceUrl(e.target.value)}
              />
              <DialogFooter className="flex-wrap gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={resourceUploading}
                  onClick={() => {
                    setIsResourceUploadOpen(false);
                    setResourceFile(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="organic"
                  size="sm"
                  className="border-none"
                  disabled={resourceUploading || (!resourceFile && !resourceUrl.trim())}
                >
                  {resourceUploading ? "Uploading…" : "Save to library"}
                </Button>
              </DialogFooter>
            </form>
          </Dialog>
        </div>
      )}

      {activeTab === "feedbacks" && <DeptFeedbackPanel />}

      {activeTab === "checkins" && <DeptWellnessCheckins />}

      {activeTab === "settings" && (
        <div className="space-y-6 animate-fade-in">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">
                Department portal settings
              </CardTitle>
              <CardDescription>
                {scope?.subject ?? "Subject"} department preferences at {schoolName}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex justify-between py-2 border-b border-border/40">
                <span className="text-muted-foreground">Department head</span>
                <span className="font-semibold">
                  {currentUser?.displayName ?? department?.headName ?? "—"}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/40">
                <span className="text-muted-foreground">School</span>
                <span className="font-semibold">{schoolName}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/40">
                <span className="text-muted-foreground">Subject overseen</span>
                <span className="font-semibold">{scope?.subject ?? "—"}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">
                  Auto-notify on new submissions
                </span>
                <span className="font-semibold text-primary">Enabled</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "leadership-development" && (
        <div className="animate-fade-in text-left">
          <TeacherTrainingTab typeFilter="all" activeTabType="leadership-development" />
        </div>
      )}

      {activeTab === "profile" && (
        <div className="space-y-6 animate-fade-in text-left">
          <PortalProfileCard
            roleLabel="Department Head"
            fields={[
              { label: 'Subject overseen', value: scope?.subject ?? '—' },
              { label: 'Department', value: department?.name ?? scope?.subject ?? '—' },
              { label: 'Leadership track', value: 'ELEP' },
            ]}
          />
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 3: CALENDAR SCHEDULING                          */}
      {/* ==================================================== */}
      {activeTab === "timetable" && detailClass && (
        <div className="space-y-6 animate-fade-in text-left">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setDetailClass(null)}
            className="text-xs h-9 gap-1.5"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to classes
          </Button>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">
                {detailClass.grade} · Section {detailClass.section}
              </CardTitle>
              <CardDescription>
                {detailClass.name} · Homeroom: {detailClass.homeroomTeacher}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
              <DetailField label="Class" value={detailClass.name} />
              <DetailField label="Homeroom teacher" value={detailClass.homeroomTeacher} />
              <DetailField label="Subject block" value={scope?.subject ?? "—"} />
              <DetailField label="Enrollment" value={detailClass.studentsCount} />
            </CardContent>
          </Card>

          <TablePanel
            title="Student roster"
            description={`${scope?.subject ?? "Subject"} class roster for ${detailClass.grade} · Section ${detailClass.section}`}
          >
            <table className="eskooly-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>ID</th>
                  <th>GPA</th>
                  <th>Attendance</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const roster = students.filter(
                    (s) =>
                      s.schoolId === scope?.schoolId &&
                      s.grade === detailClass.grade &&
                      s.section === detailClass.section,
                  );
                  if (roster.length === 0) {
                    return (
                      <tr>
                        <td colSpan={4} className="p-0">
                      <EmptyState icon={<Inbox />} title="No students on record for this class." className="py-8" />
                    </td>
                      </tr>
                    );
                  }
                  return roster.map((std) => (
                    <tr key={std.id} className="hover:bg-muted/20">
                      <td className="p-3 font-semibold text-foreground">
                        {std.name}
                      </td>
                      <td className="p-3 font-mono text-xs">{std.studentId}</td>
                      <td className="p-3 font-mono font-bold">
                        {std.gpa.toFixed(2)}
                      </td>
                      <td className="p-3">{std.attendanceRate}%</td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </TablePanel>
        </div>
      )}

      {activeTab === "timetable" && !detailClass && (
        <div className="space-y-6 animate-fade-in text-left">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">
                Class room view
              </CardTitle>
              <CardDescription>
                Browse {scope?.subject ?? "subject"} class sections. Click a class to view its
                roster and classroom detail.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              {departmentClasses.length === 0 ? (
                <EmptyState
                  icon={<Inbox />}
                  title={`No class sections assigned to ${scope?.subject ?? "subject"} instructors yet.`}
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {departmentClasses.map((cls) => (
                    <button
                      type="button"
                      key={cls.id}
                      onClick={() => setDetailClass(cls)}
                      className="text-left p-4 bg-muted/40 border border-border/40 rounded-xl space-y-2 cursor-pointer hover:bg-muted/60 hover:border-primary/40 transition-colors"
                    >
                      <School className="h-5 w-5 text-primary" />
                      <h4 className="text-xs font-bold text-foreground">
                        {cls.grade} · Section {cls.section}
                      </h4>
                      <p className="text-xxs text-muted-foreground">
                        Homeroom: {cls.homeroomTeacher}
                      </p>
                      <p className="text-xxs text-primary font-bold">
                        {scope?.subject ?? "Subject"} block · {cls.studentsCount} pupils
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "academic-calendar" && (
        <div className="space-y-6 animate-fade-in text-left">
          <PublishedAcademicCalendarPanel />
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 4: TEACHER ROSTER                                */}
      {/* ==================================================== */}
      {activeTab === "teachers" && (
        <div className="space-y-6 animate-fade-in text-left">
          <div className="flex justify-between items-center bg-card p-4 rounded-xl border border-border/60">
            <span className="text-xs font-semibold text-foreground">
              {scope?.subject ?? "Subject"} Instructors: {departmentTeachers.length}
            </span>
            <Button
              onClick={() => setIsOnboardOpen(true)}
              className="text-xs h-10 font-semibold cursor-pointer border-none"
            >
              + Onboard Instructor
            </Button>
          </div>

          <TablePanel
            title={`${scope?.subject ?? "Subject"} Instructors`}
            description="Training sync, certification, and roster status"
          >
            <table className="eskooly-table">
              <thead>
                <tr>
                  <th className="p-3 uppercase text-xxs text-muted-foreground font-semibold">
                    Name
                  </th>
                  <th className="p-3 uppercase text-xxs text-muted-foreground font-semibold">
                    Subjects
                  </th>
                  <th className="p-3 uppercase text-xxs text-muted-foreground font-semibold">
                    Grades
                  </th>
                  <th className="p-3 uppercase text-xxs text-muted-foreground font-semibold">
                    Training Course Sync
                  </th>
                  <th className="p-3 uppercase text-xxs text-muted-foreground font-semibold">
                    Certification Status
                  </th>
                  <th className="p-3 uppercase text-xxs text-muted-foreground font-semibold">
                    Status
                  </th>
                  <th className="p-3 uppercase text-xxs text-muted-foreground font-semibold">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-muted-foreground">
                {departmentTeachers.map((tch) => (
                  <tr key={tch.id} className="hover:bg-muted/20">
                    <td className="p-3 font-bold text-foreground">
                      {tch.name}
                    </td>
                    <td className="p-3">{tch.subjects.join(", ")}</td>
                    <td className="p-3">{tch.grades.join(", ")}</td>
                    <td className="p-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-16 h-2 bg-muted rounded-full overflow-hidden border border-border/40 shrink-0">
                          <div
                            className="h-full bg-primary"
                            style={{ width: `${tch.trainingProgress}%` }}
                          />
                        </div>
                        <span className="font-semibold text-foreground font-mono">
                          {tch.trainingProgress}%
                        </span>
                      </div>
                    </td>
                    <td className="p-3 text-foreground font-semibold">
                      {tch.certification}
                    </td>
                    <td className="p-3">
                      <Badge variant={tch.status === "Active" ? "success" : "neutral"} badgeStyle="subtle" size="sm">
                        {tch.status}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => setDetailTeacher(tch)}
                        className="text-primary hover:underline font-semibold cursor-pointer"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TablePanel>

          {/* Onboard Teacher Dialog */}
          <Dialog
            isOpen={isOnboardOpen}
            onClose={() => setIsOnboardOpen(false)}
            title={`${scope?.subject ?? "Subject"} Instructor Onboarding`}
            description={`Register a new ${scope?.subject ?? "subject"} educator into the department system registry.`}
          >
            <form
              onSubmit={handleOnboardTeacher}
              className="space-y-4 text-left"
            >
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Teacher Full Name
                </label>
                <input
                  type="text"
                  required
                  value={newTeacherName}
                  onChange={(e) => setNewTeacherName(e.target.value)}
                  placeholder="e.g. Ato Teshome Belay"
                  className="w-full h-10 px-3 bg-muted/40 border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    School Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={newTeacherEmail}
                    onChange={(e) => setNewTeacherEmail(e.target.value)}
                    placeholder="teshome.b@prime.edu.et"
                    className="w-full h-10 px-3 bg-muted/40 border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Contact Phone Line
                  </label>
                  <input
                    type="text"
                    required
                    value={newTeacherPhone}
                    onChange={(e) => setNewTeacherPhone(e.target.value)}
                    placeholder="+251-911-XXXXXX"
                    className="w-full h-10 px-3 bg-muted/40 border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Primary Subject
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={scope?.subject ?? "Mathematics"}
                    className="w-full h-10 px-3 bg-muted/60 border border-border rounded-md text-xs text-foreground"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Grade Level Assignment
                  </label>
                  <Select
                    options={[
                      { value: "Grade 9", label: "Grade 9" },
                      { value: "Grade 10", label: "Grade 10" },
                      { value: "Grade 11", label: "Grade 11" },
                      { value: "Grade 12", label: "Grade 12" },
                    ]}
                    value={newTeacherGrade}
                    onChange={(e) => setNewTeacherGrade(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Certification / Licensing Level
                </label>
                <input
                  type="text"
                  value={newTeacherCert}
                  onChange={(e) => setNewTeacherCert(e.target.value)}
                  placeholder="e.g. Professional License A"
                  className="w-full h-10 px-3 bg-muted/40 border border-border rounded-md text-xs text-foreground focus:outline-none"
                />
              </div>

              <DialogFooter className="mt-6 border-t border-border/40 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOnboardOpen(false)}
                  className="text-xs h-10 cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="organic"
                  className="text-xs h-10 border-none cursor-pointer"
                >
                  Complete Registration
                </Button>
              </DialogFooter>
            </form>
          </Dialog>

          {/* Instructor Detail Dialog */}
          <Dialog
            isOpen={detailTeacher !== null}
            onClose={() => setDetailTeacher(null)}
            title="Instructor Record"
            description={detailTeacher ? `${detailTeacher.email} · ${detailTeacher.phone}` : undefined}
            size="xl"
          >
            {detailTeacher && (
              <div className="space-y-5 pt-2 text-left">
                <div className="flex items-center gap-3 pb-3 border-b border-border/40">
                  <Avatar name={detailTeacher.name} size="md" />
                  <div>
                    <p className="text-sm font-bold text-foreground">
                      {detailTeacher.name}
                    </p>
                    <Badge
                      variant={detailTeacher.status === "Active" ? "success" : "neutral"}
                      size="sm"
                      className="mt-1"
                    >
                      {detailTeacher.status}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <h4 className="text-[10px] font-bold text-primary uppercase tracking-wider">
                    Contact
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <DetailField label="Email" value={detailTeacher.email} />
                    <DetailField label="Phone" value={detailTeacher.phone} />
                  </div>
                </div>

                <div className="space-y-2.5">
                  <h4 className="text-[10px] font-bold text-accent uppercase tracking-wider">
                    Academic profile
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <DetailField label="Subjects" value={detailTeacher.subjects.join(", ")} />
                    <DetailField label="Grades" value={detailTeacher.grades.join(", ")} />
                    <DetailField label="Certification" value={detailTeacher.certification} />
                    <DetailField
                      label="Years of experience"
                      value={detailTeacher.yearsOfExperience}
                    />
                    <DetailField
                      label="Training course sync"
                      value={`${detailTeacher.trainingProgress}%`}
                    />
                  </div>
                </div>

                <div className="space-y-2.5">
                  <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Department activity
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <DetailField
                      label="Homeroom classes"
                      value={
                        departmentClasses.filter(
                          (cls) => cls.homeroomTeacher === detailTeacher.name,
                        ).length || "—"
                      }
                    />
                    <DetailField
                      label="Lesson plans"
                      value={
                        departmentLessonPlans.filter(
                          (lp) => lp.teacherName === detailTeacher.name,
                        ).length || "—"
                      }
                    />
                    <DetailField
                      label="Assessments"
                      value={
                        departmentAssessments.filter(
                          (asm) => asm.teacherName === detailTeacher.name,
                        ).length || "—"
                      }
                    />
                    <DetailField
                      label="Wellness check-ins"
                      value={
                        departmentCheckIns.filter(
                          (c) => c.respondentName === detailTeacher.name,
                        ).length || "—"
                      }
                    />
                  </div>
                </div>

                <DialogFooter className="mt-4 border-t border-border/20 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setDetailTeacher(null)}
                    className="text-xs h-9"
                  >
                    Close
                  </Button>
                </DialogFooter>
              </div>
            )}
          </Dialog>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 5: ASSESSMENT REVIEW                             */}
      {/* ==================================================== */}
      {activeTab === "assessments" && (
        <div className="space-y-6 animate-fade-in text-left">
          <DeptAssessmentCreatePanel />
          <TablePanel
            title="Department assessment desk"
            description="HoD-generated exams are published immediately. Quizzes never need approval. Only non-quiz teacher submissions appear for review."
          >
            <table className="eskooly-table">
              <thead>
                <tr>
                  <th className="p-3 uppercase text-xxs text-muted-foreground font-semibold">
                    Title
                  </th>
                  <th className="p-3 uppercase text-xxs text-muted-foreground font-semibold">
                    Subject
                  </th>
                  <th className="p-3 uppercase text-xxs text-muted-foreground font-semibold">
                    Grade
                  </th>
                  <th className="p-3 uppercase text-xxs text-muted-foreground font-semibold">
                    Author
                  </th>
                  <th className="p-3 uppercase text-xxs text-muted-foreground font-semibold">
                    Difficulty
                  </th>
                  <th className="p-3 uppercase text-xxs text-muted-foreground font-semibold">
                    Status
                  </th>
                  <th className="p-3 uppercase text-xxs text-muted-foreground font-semibold">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-muted-foreground">
                {departmentAssessments.map((asm) => (
                  <tr
                    key={asm.id}
                    className="hover:bg-muted/20 transition-colors"
                  >
                    <td className="p-3 font-bold text-foreground">
                      {asm.title}
                    </td>
                    <td className="p-3">{asm.subject}</td>
                    <td className="p-3">{asm.grade}</td>
                    <td className="p-3 text-foreground">{asm.teacherName}</td>
                    <td className="p-3">
                      <Badge variant="neutral" badgeStyle="subtle" size="sm">
                        {asm.difficulty}
                      </Badge>
                    </td>
                    <td className="p-3">
                      {(() => {
                        const needsReview =
                          asm.status === "Pending Dept Head" &&
                          assessmentNeedsApproval(asm.type, asm.createdByRole);
                        const displayStatus =
                          !needsReview && asm.status === "Pending Dept Head"
                            ? "Approved"
                            : asm.status;
                        return (
                          <Badge
                            variant={
                              displayStatus === "Approved"
                                ? "success"
                                : displayStatus === "Rejected"
                                  ? "danger"
                                  : "neutral"
                            }
                            badgeStyle="subtle"
                            size="sm"
                          >
                            {displayStatus}
                          </Badge>
                        );
                      })()}
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => router.push(`/dashboard/department-head/assessments/${asm.id}`)}
                        className="text-primary hover:underline font-semibold cursor-pointer"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TablePanel>
        </div>
      )}
    </DashboardShell>
  );
}
