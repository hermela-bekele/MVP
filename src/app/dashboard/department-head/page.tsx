"use client";

import React, { useMemo, useState } from "react";
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
import { MetricProgressRow } from "@/components/ui/metric-progress-row";
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

export default function DepartmentHeadPortalPage() {
  const {
    teachers,
    students,
    lessonPlans,
    assessments,
    attendance,
    classes,
    departments,
    trainings,
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
  } = useApp();

  const scope = useMemo(
    () => resolveDeptHeadScope(currentUser),
    [currentUser],
  );

  const department = useMemo(
    () =>
      scope
        ? departments.find((d) => d.id === scope.departmentId)
        : undefined,
    [departments, scope],
  );

  const [activeTab, setActiveTab] = useState("dashboard");

  // Assessment Modal State
  const [selectedAsmId, setSelectedAsmId] = useState<string | null>(null);
  const [isAsmOpen, setIsAsmOpen] = useState(false);
  const [deptComments, setDeptComments] = useState("");

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

  const departmentAttendance = useMemo(() => {
    const sectionKeys = new Set(
      departmentClasses.map((cls) => classSectionKey(cls.grade, cls.section)),
    );
    return attendance.filter((row) =>
      sectionKeys.has(classSectionKey(row.grade, row.section)),
    );
  }, [attendance, departmentClasses]);

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
    (asm) => asm.status === "Pending Dept Head",
  );
  const selectedAsm = departmentAssessments.find(
    (asm) => asm.id === selectedAsmId,
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

  const departmentTrainings = useMemo(() => {
    if (!scope) return [];
    const subjectKey = scope.subject.toLowerCase();
    return trainings.filter((tr) => tr.title.toLowerCase().includes(subjectKey));
  }, [trainings, scope]);

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

  const handleApproveAsm = () => {
    if (!selectedAsmId) return;
    approveAssessment(
      selectedAsmId,
      deptComments || "Verified layout and syllabus alignment.",
    );
    setDeptComments("");
    setIsAsmOpen(false);
  };

  const handleRejectAsm = () => {
    if (!selectedAsmId) return;
    rejectAssessment(
      selectedAsmId,
      deptComments || "Needs questions aligned with secondary difficulty.",
    );
    setDeptComments("");
    setIsAsmOpen(false);
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
      subtitle: `${scope?.subject ?? "Subject"} department metrics and alerts.`,
    },
    reports: {
      title: "Class Reports",
      subtitle: "Section-level academic reports.",
    },
    analysis: {
      title: "Department Analysis",
      subtitle: "Deep-dive analytics.",
    },
    timetable: {
      title: "Academic Calendar",
      subtitle: "Scheduling and sessions.",
    },
    sessions: {
      title: "Session Progress",
      subtitle: "Curriculum delivery tracking.",
    },
    teachers: {
      title: "Manage Teachers",
      subtitle: "Department instructor roster.",
    },
    classes: {
      title: "Manage Classes",
      subtitle: "Class sections and assignments.",
    },
    attendance: {
      title: "Manage Attendance",
      subtitle: "Department attendance overview.",
    },
    assessments: {
      title: "Manage Assessments",
      subtitle: "Review and approve assessments.",
    },
    training: {
      title: "Teacher Development",
      subtitle: "Professional growth resources.",
    },
    resources: {
      title: "Study Resources",
      subtitle: "Shared learning materials.",
    },
    feedbacks: {
      title: "Feedback Loops",
      subtitle: "Teacher and student feedback.",
    },
    checkins: {
      title: "Wellness Check-ins",
      subtitle: "Staff wellness surveys.",
    },
    settings: { title: "Portal Settings", subtitle: "Department preferences." },
  };
  const meta = tabTitles[activeTab] ?? tabTitles.dashboard;

  return (
    <DashboardShell
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      title={meta.title}
      subtitle={meta.subtitle}
      eyebrow={`${scope?.subject ?? "Subject"} Department · Bole Secondary`}
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
              icon={<span>📊</span>}
            />
            <KpiWidget
              label="Pending Reviews"
              value={pendingAssessments.length}
              hint={`${pendingAssessments.length} tests awaiting review`}
              tone="emphasis"
              icon={<span>📝</span>}
            />
            <KpiWidget
              label="Active Instructors"
              value={activeInstructors}
              hint={`${departmentTeachers.length} on roster`}
              tone="default"
              icon={<span>👩‍🏫</span>}
            />
            <KpiWidget
              label="Subject Alerts"
              value={subjectAlerts}
              hint="Critical & warning"
              tone="emphasis"
              icon={<span>⚠</span>}
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
                  Tests and Quizzes submitted by teachers awaiting department
                  head endorsement.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2 space-y-3">
                {pendingAssessments.length === 0 ? (
                  <div className="text-center py-10 text-xxs text-muted-foreground font-semibold">
                    All assessment reviews are fully completed. Good job!
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
                        onClick={() => {
                          setSelectedAsmId(asm.id);
                          setIsAsmOpen(true);
                        }}
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
        </div>
      )}

      {activeTab === "reports" && (
        <div className="space-y-6 animate-fade-in">
          <TablePanel
            title="Class Performance Reports"
            description={`Student GPA and attendance for ${scope?.subject ?? "subject"} class sections`}
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
                {departmentStudents.map((std) => (
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
                        {std.gpa >= 3.5
                          ? "Excellent"
                          : std.gpa >= 2.5
                            ? "On Track"
                            : "At Risk"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TablePanel>
        </div>
      )}

      {activeTab === "analysis" && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {subjectMetrics.map((sub) => (
              <Card key={sub.subject}>
                <CardContent className="pt-5 space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">
                    {sub.subject}
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {sub.average}%
                  </p>
                  <p className="text-xxs text-muted-foreground">
                    Risk index: {sub.riskIndex}%
                  </p>
                  <Badge
                    variant={
                      sub.status === "Critical"
                        ? "danger"
                        : sub.status === "Warning"
                          ? "warning"
                          : "success"
                    }
                    size="sm"
                  >
                    {sub.status}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">
                Department snapshot
              </CardTitle>
              <CardDescription>
                {department?.name ?? `${scope?.subject ?? "Subject"} Department`} · Bole Community School
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div className="p-3 rounded-lg bg-muted/40 border border-border/40">
                <p className="text-2xl font-bold text-primary">
                  {departmentTeachers.length}
                </p>
                <p className="text-xxs text-muted-foreground mt-1">
                  Instructors
                </p>
              </div>
              <div className="p-3 rounded-lg bg-muted/40 border border-border/40">
                <p className="text-2xl font-bold text-primary">
                  {departmentClasses.length}
                </p>
                <p className="text-xxs text-muted-foreground mt-1">
                  Class sections
                </p>
              </div>
              <div className="p-3 rounded-lg bg-muted/40 border border-border/40">
                <p className="text-2xl font-bold text-primary">
                  {departmentStudents.length}
                </p>
                <p className="text-xxs text-muted-foreground mt-1">Students</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/40 border border-border/40">
                <p className="text-2xl font-bold text-primary">
                  {pendingAssessments.length}
                </p>
                <p className="text-xxs text-muted-foreground mt-1">
                  Pending tests
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "sessions" && (
        <div className="space-y-6 animate-fade-in">
          <TablePanel
            title="Session delivery progress"
            description="Lesson plan session counts and workflow status by instructor"
          >
            <table className="eskooly-table">
              <thead>
                <tr>
                  <th>Plan</th>
                  <th>Teacher</th>
                  <th>Sessions planned</th>
                  <th>Delivery status</th>
                </tr>
              </thead>
              <tbody>
                {departmentLessonPlans.map((lp) => {
                  const progress =
                    lp.status === "Approved"
                      ? 100
                      : lp.status === "Pending School Head"
                        ? 85
                        : lp.status === "Pending Dept Head"
                          ? 55
                          : 30;
                  return (
                    <tr key={lp.id} className="hover:bg-muted/20">
                      <td className="p-3 font-semibold text-foreground">
                        {lp.title}
                      </td>
                      <td className="p-3">{lp.teacherName}</td>
                      <td className="p-3 font-mono">{lp.sessions}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2 min-w-[140px]">
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-xxs font-bold text-foreground">
                            {progress}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TablePanel>
        </div>
      )}

      {activeTab === "classes" && (
        <div className="space-y-6 animate-fade-in">
          <TablePanel
            title={`${scope?.subject ?? "Subject"} class sections`}
            description="Homeroom assignments linked to your department instructors"
          >
            <table className="eskooly-table">
              <thead>
                <tr>
                  <th>Class</th>
                  <th>Grade</th>
                  <th>Section</th>
                  <th>Homeroom teacher</th>
                  <th>Enrollment</th>
                </tr>
              </thead>
              <tbody>
                {departmentClasses.map((cls) => (
                  <tr key={cls.id} className="hover:bg-muted/20">
                    <td className="p-3 font-semibold text-foreground">
                      {cls.name}
                    </td>
                    <td className="p-3">{cls.grade}</td>
                    <td className="p-3">{cls.section}</td>
                    <td className="p-3">{cls.homeroomTeacher}</td>
                    <td className="p-3 font-mono">{cls.studentsCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TablePanel>
        </div>
      )}

      {activeTab === "attendance" && (
        <div className="space-y-6 animate-fade-in">
          <TablePanel
            title="Department attendance log"
            description={`Recent roll-call entries for ${scope?.subject ?? "subject"} class sections`}
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
                {departmentAttendance.map((row) => (
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
                ))}
              </tbody>
            </table>
          </TablePanel>
        </div>
      )}

      {activeTab === "training" && (
        <div className="space-y-6 animate-fade-in">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">
                MOE professional development catalog
              </CardTitle>
              <CardDescription>
                Programs relevant to {scope?.subject ?? "your"} instructors at your school
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
              {departmentTrainings.length === 0 ? (
                <p className="text-center py-8 text-sm text-muted-foreground">
                  No professional development programs tagged for {scope?.subject ?? "this subject"} yet.
                </p>
              ) : (
                departmentTrainings.map((tr) => (
                <div
                  key={tr.id}
                  className="p-4 bg-muted/40 border border-border/40 rounded-xl flex flex-col sm:flex-row sm:justify-between gap-3"
                >
                  <div className="space-y-1 text-left">
                    <p className="text-xs font-bold text-foreground">
                      {tr.title}
                    </p>
                    <p className="text-xxs text-muted-foreground">
                      {tr.instructor} · {tr.duration} · Starts {tr.startDate}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <Badge
                      variant={tr.status === "Active" ? "success" : "warning"}
                      size="sm"
                    >
                      {tr.status}
                    </Badge>
                    <p className="text-xxs font-mono font-bold text-foreground mt-2">
                      {tr.completedCount}/{tr.totalCount} enrolled
                    </p>
                  </div>
                </div>
              ))
              )}
            </CardContent>
          </Card>
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
                    <td colSpan={6} className="p-8 text-center text-sm text-muted-foreground">
                      No study resources uploaded yet.
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

      {activeTab === "checkins" && (
        <div className="space-y-6 animate-fade-in text-left">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">
                Wellness & satisfaction check-ins
              </CardTitle>
              <CardDescription>
                Teacher wellness and student feedback from {scope?.subject ?? "subject"} instructors
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
              {departmentCheckIns.length === 0 ? (
                <p className="text-center py-8 text-sm text-muted-foreground">
                  No check-ins recorded yet.
                </p>
              ) : (
                departmentCheckIns.map((ch) => (
                  <div
                    key={ch.id}
                    className="p-4 bg-muted/40 border border-border/40 rounded-xl flex justify-between items-start gap-3"
                  >
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-xs text-foreground">
                          {ch.respondentName}
                        </span>
                        <Badge variant="neutral" size="sm">
                          {ch.type}
                        </Badge>
                      </div>
                      <p className="text-xxs text-muted-foreground leading-relaxed">
                        {ch.comment}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-semibold">
                        Logged: {ch.date}
                      </p>
                    </div>
                    <div className="text-amber-500 text-xs shrink-0">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i}>{i < ch.rating ? "★" : "☆"}</span>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "settings" && (
        <div className="space-y-6 animate-fade-in">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">
                Department portal settings
              </CardTitle>
              <CardDescription>
                {scope?.subject ?? "Subject"} department preferences at Bole Community School
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
                <span className="font-semibold">Bole Community School</span>
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

      {/* ==================================================== */}
      {/* TAB 3: CALENDAR SCHEDULING                          */}
      {/* ==================================================== */}
      {activeTab === "timetable" && (
        <div className="space-y-6 animate-fade-in text-left">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">
                Calendar Teacher Scheduler
              </CardTitle>
              <CardDescription>
                Allocate subject block configurations and section limits for the
                active term.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              {departmentClasses.length === 0 ? (
                <p className="text-center py-8 text-sm text-muted-foreground">
                  No class sections assigned to {scope?.subject ?? "subject"} instructors yet.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {departmentClasses.map((cls) => (
                    <div
                      key={cls.id}
                      className="p-4 bg-muted/40 border border-border/40 rounded-xl space-y-2"
                    >
                      <span className="text-lg">🏫</span>
                      <h4 className="text-xs font-bold text-foreground">
                        {cls.grade} · Section {cls.section}
                      </h4>
                      <p className="text-xxs text-muted-foreground">
                        Homeroom: {cls.homeroomTeacher}
                      </p>
                      <p className="text-xxs text-primary font-bold">
                        {scope?.subject ?? "Subject"} block · {cls.studentsCount} pupils
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
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
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          tch.status === "Active"
                            ? "bg-primary/10 text-primary border border-primary/20"
                            : "bg-muted text-muted-foreground border border-border"
                        }`}
                      >
                        {tch.status}
                      </span>
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
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 5: ASSESSMENT REVIEW                             */}
      {/* ==================================================== */}
      {activeTab === "assessments" && (
        <div className="space-y-6 animate-fade-in text-left">
          <TablePanel
            title="Exam & Quiz Verification Desk"
            description="Verify syllabus alignment, balance, and quality of assessments before school circulation."
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
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-muted text-foreground border border-border">
                        {asm.difficulty}
                      </span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          asm.status === "Approved"
                            ? "bg-primary/10 text-primary border border-primary/20"
                            : asm.status === "Rejected"
                              ? "bg-muted text-muted-foreground border border-border"
                              : "bg-muted text-foreground border border-border"
                        }`}
                      >
                        {asm.status}
                      </span>
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => {
                          setSelectedAsmId(asm.id);
                          setIsAsmOpen(true);
                        }}
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

          {/* Assessment Review Dialog */}
          <Dialog
            isOpen={isAsmOpen}
            onClose={() => setIsAsmOpen(false)}
            title={
              selectedAsm ? `Review Assessment: ${selectedAsm.title}` : "Review"
            }
            size="xl"
          >
            {selectedAsm && (
              <div className="space-y-5 text-left text-xxs leading-relaxed">
                <div className="grid grid-cols-3 gap-4 border-b border-border/40 pb-3">
                  <div>
                    <span className="text-muted-foreground uppercase font-bold text-[9px]">
                      Subject / Grade
                    </span>
                    <p className="text-foreground font-semibold mt-0.5">
                      {selectedAsm.subject} ({selectedAsm.grade})
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground uppercase font-bold text-[9px]">
                      Submitted By
                    </span>
                    <p className="text-foreground font-semibold mt-0.5">
                      {selectedAsm.teacherName}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground uppercase font-bold text-[9px]">
                      Assessment Level
                    </span>
                    <p className="text-foreground font-semibold mt-0.5">
                      {selectedAsm.difficulty} Level
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold text-foreground text-xs">
                    Test Questions Blueprint
                  </h4>
                  <div className="space-y-3 max-h-56 overflow-y-auto border border-border/40 p-4 rounded-lg bg-muted/20">
                    {selectedAsm.questions.map((q, idx) => (
                      <div
                        key={q.id}
                        className="border-b border-border/30 pb-2 last:border-0 last:pb-0"
                      >
                        <p className="font-bold text-foreground">
                          Question {idx + 1}: {q.question}
                        </p>
                        {q.options && (
                          <ul className="list-disc pl-5 mt-1 text-muted-foreground font-semibold">
                            {q.options.map((opt, i) => (
                              <li key={i}>{opt}</li>
                            ))}
                          </ul>
                        )}
                        <p className="text-primary font-bold mt-1 text-[10px]">
                          Expected Answer: {q.answer}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="font-bold text-foreground text-xs uppercase tracking-wider">
                    Evaluation Comments
                  </label>
                  <textarea
                    value={deptComments}
                    onChange={(e) => setDeptComments(e.target.value)}
                    placeholder="Add review directive notes or improvement recommendations..."
                    className="w-full h-20 p-3 bg-muted/40 border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200"
                  />
                </div>

                <DialogFooter className="mt-6 border-t border-border/40 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsAsmOpen(false)}
                    className="text-xs h-10 cursor-pointer"
                  >
                    Close
                  </Button>

                  {selectedAsm.status === "Pending Dept Head" && (
                    <div className="flex space-x-2">
                      <Button
                        variant="destructive"
                        onClick={handleRejectAsm}
                        className="text-xs h-10 cursor-pointer"
                      >
                        Reject Draft
                      </Button>
                      <Button
                        variant="organic"
                        onClick={handleApproveAsm}
                        className="text-xs h-10 border-none cursor-pointer"
                      >
                        Approve & Circulate
                      </Button>
                    </div>
                  )}
                </DialogFooter>
              </div>
            )}
          </Dialog>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 6: SURVEYS & WELLNESS FEED                       */}
      {/* ==================================================== */}
      {activeTab === "feedbacks" && (
        <div className="space-y-6 animate-fade-in text-left">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">
                Feedback loops
              </CardTitle>
              <CardDescription>
                Teacher wellness and student satisfaction tied to {scope?.subject ?? "subject"} instruction this term.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
              {departmentCheckIns.map((ch) => (
                <div
                  key={ch.id}
                  className="p-4 bg-muted/40 border border-border/40 rounded-xl text-xxs font-medium flex justify-between items-start text-left gap-3"
                >
                  <div className="space-y-1.5 max-w-xl">
                    <div className="flex items-center space-x-2.5">
                      <span className="font-bold text-foreground text-xs">
                        {ch.respondentName}
                      </span>
                      <Badge variant="neutral" size="sm">
                        {ch.type}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground leading-normal">
                      {ch.comment}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-semibold">
                      Logged: {ch.date}
                    </p>
                  </div>
                  <div className="text-right shrink-0 text-amber-500 font-bold text-xs">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i}>{i < ch.rating ? "★" : "☆"}</span>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </DashboardShell>
  );
}
