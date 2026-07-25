'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import {
  School,
  Teacher,
  Student,
  LessonPlan,
  Assessment,
  Attendance,
  TeacherTraining,
  SchoolCheckIn,
  Department,
  SchoolClass,
  ExamPaper,
  TrainingMaterial,
  TeachingNote,
  TeacherResource,
  TeacherFeedback,
  ParentMessage,
  TeacherCheckInPrompt,
  StudentGradeEntry,
  AcademicCalendar,
  RegistrationApplication,
  RegistrationApplicationStatus,
  mockSchools,
  mockTeachers,
  mockStudents,
  mockLessonPlans,
  mockAssessments,
  mockAttendanceRecords,
  mockTrainingPrograms,
  mockCheckIns,
  mockDepartments,
  mockClasses,
  mockExams,
  mockTrainingMaterials,
  mockTeachingNotes,
  mockAcademicCalendars,
  mockTeacherResources,
  mockTeacherFeedbacks,
  mockParentMessages,
  mockTeacherCheckInPrompts,
  mockStudentGradeEntries,
  mockRegistrationApplications,
} from '@/lib/mockData';
import {
  HrEmployee,
  LeaveRequest,
  LeaveStatus,
  PayrollRecord,
  PayrollStatus,
  JobPosting,
  JobApplication,
  ApplicationStatus,
  PerformanceReview,
  OnboardingTask,
  StaffAttendanceRecord,
  StaffAttendanceStatus,
  mockHrEmployees,
  mockLeaveRequests,
  mockPayrollRecords,
  mockJobPostings,
  mockJobApplications,
  mockPerformanceReviews,
  mockOnboardingTasks,
  mockStaffAttendance,
  generateEmployeeId,
} from '@/lib/hrPortal';
import { DEMO_TEACHER_ID, percentToGpa } from '@/lib/teacherPortal';
import { readStoredCalendars, writeStoredCalendars } from '@/lib/calendarStorage';
import {
  type AuthUser,
  clearSession,
  persistSession,
  readStoredSession,
} from '@/lib/auth';

export interface AppNotification {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  type: 'info' | 'alert' | 'success' | 'request';
}

interface AppContextType {
  currentUser: AuthUser | null;
  authReady: boolean;
  login: (user: AuthUser, remember?: boolean) => void;
  logout: () => void;
  activeRole: string;
  setActiveRole: (role: string) => void;
  resolveTeacherId: () => string;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  
  // Tables
  schools: School[];
  teachers: Teacher[];
  students: Student[];
  lessonPlans: LessonPlan[];
  assessments: Assessment[];
  attendance: Attendance[];
  trainings: TeacherTraining[];
  checkIns: SchoolCheckIn[];
  departments: Department[];
  classes: SchoolClass[];
  exams: ExamPaper[];
  trainingMaterials: TrainingMaterial[];
  teachingNotes: TeachingNote[];
  academicCalendars: AcademicCalendar[];
  teacherResources: TeacherResource[];
  teacherFeedbacks: TeacherFeedback[];
  parentMessages: ParentMessage[];
  teacherCheckInPrompts: TeacherCheckInPrompt[];
  studentGradeEntries: StudentGradeEntry[];
  registrationApplications: RegistrationApplication[];
  hrEmployees: HrEmployee[];
  leaveRequests: LeaveRequest[];
  payrollRecords: PayrollRecord[];
  jobPostings: JobPosting[];
  jobApplications: JobApplication[];
  performanceReviews: PerformanceReview[];
  onboardingTasks: OnboardingTask[];
  staffAttendance: StaffAttendanceRecord[];
  notifications: AppNotification[];
  
  // Actions
  addSchool: (school: Omit<School, 'id' | 'code' | 'studentsCount' | 'teachersCount' | 'status' | 'gps'>) => void;
  toggleSchoolStatus: (id: string) => void;
  approveLessonPlan: (id: string, role: 'dept' | 'school', comments: string) => void;
  rejectLessonPlan: (id: string, role: 'dept' | 'school', comments: string) => void;
  approveAssessment: (id: string, comments: string) => void;
  rejectAssessment: (id: string, comments: string) => void;
  createLessonPlan: (plan: Omit<LessonPlan, 'id' | 'teacherId' | 'teacherName' | 'status' | 'version' | 'createdAt'>) => void;
  createAssessment: (asm: Omit<Assessment, 'id' | 'teacherId' | 'teacherName' | 'status' | 'createdAt'>) => void;
  updateAssessmentQuestions: (id: string, questions: Assessment['questions']) => void;
  saveAttendance: (records: { studentId: string; status: 'Present' | 'Absent' | 'Late'; remarks?: string }[]) => void;
  enrollStudent: (student: Omit<Student, 'id' | 'studentId' | 'gpa' | 'attendanceRate' | 'status'>) => void;
  submitRegistrationApplication: (
    app: Omit<RegistrationApplication, 'id' | 'status' | 'submittedAt'>
  ) => void;
  updateRegistrationApplication: (
    id: string,
    updates: Partial<RegistrationApplication>
  ) => void;
  reviewRegistrationApplication: (
    id: string,
    status: RegistrationApplicationStatus,
    reviewerNotes?: string
  ) => void;
  enrollFromApplication: (applicationId: string) => void;
  addHrEmployee: (employee: Omit<HrEmployee, 'id' | 'employeeId' | 'schoolId'>) => string;
  updateHrEmployee: (id: string, updates: Partial<HrEmployee>) => void;
  toggleHrEmployeeStatus: (id: string) => void;
  submitLeaveRequest: (request: Omit<LeaveRequest, 'id' | 'status' | 'submittedAt'>) => void;
  reviewLeaveRequest: (id: string, status: LeaveStatus, reviewerNotes?: string) => void;
  processPayroll: (employeeId: string, month: string) => void;
  updatePayrollStatus: (id: string, status: PayrollStatus) => void;
  addJobPosting: (posting: Omit<JobPosting, 'id' | 'postedAt' | 'applicantCount'>) => void;
  updateJobPosting: (id: string, updates: Partial<JobPosting>) => void;
  updateJobApplication: (id: string, status: ApplicationStatus, notes?: string) => void;
  addPerformanceReview: (review: Omit<PerformanceReview, 'id' | 'status'>) => void;
  updatePerformanceReview: (id: string, updates: Partial<PerformanceReview>) => void;
  addOnboardingTask: (task: Omit<OnboardingTask, 'id' | 'completed'>) => void;
  toggleOnboardingTask: (id: string) => void;
  recordStaffAttendance: (
    record: Omit<StaffAttendanceRecord, 'id' | 'employeeName'> & { employeeName?: string }
  ) => void;
  updateStudent: (id: string, updates: Partial<Student>) => void;
  updateStudentGrade: (id: string, newGpa: number) => void;
  addTeacher: (teacher: Omit<Teacher, 'id' | 'status' | 'trainingProgress'>) => void;
  updateTeacher: (id: string, updates: Partial<Teacher>) => void;
  toggleTeacherStatus: (id: string) => void;
  addDepartment: (name: string, headName: string) => void;
  addClass: (name: string, grade: string, section: string, homeroomTeacher: string) => void;
  approveExam: (id: string, comments: string) => void;
  rejectExam: (id: string, comments: string) => void;
  addTrainingMaterial: (data: {
    title: string;
    resourceUrl: string;
    category: string;
    trainingType?: TrainingMaterial['trainingType'];
    departmentId?: string;
    grade?: string;
    subject?: string;
  }) => void;
  disseminateTrainingMaterial: (id: string) => void;
  addCheckInTemplate: (title: string, type: 'Teacher Wellness' | 'Student Satisfaction' | 'Parent Feedback', respondentName: string, rating: number, comment: string) => void;
  updateLessonPlan: (id: string, title: string, objectives: string[], sessions: number, homework: string) => void;
  distributeLessonPlan: (id: string) => void;
  createTeachingNote: (
    note: Omit<TeachingNote, 'id' | 'teacherId' | 'status' | 'createdAt' | 'updatedAt'>,
    status?: TeachingNote['status']
  ) => string;
  updateTeachingNote: (id: string, updates: Partial<TeachingNote>) => void;
  approveTeachingNote: (id: string, comments: string) => void;
  rejectTeachingNote: (id: string, comments: string) => void;
  createAcademicCalendar: (
    calendar: Omit<AcademicCalendar, 'id' | 'schoolId' | 'status' | 'createdAt' | 'publishedAt'>
  ) => void;
  updateAcademicCalendar: (
    id: string,
    updates: Partial<Omit<AcademicCalendar, 'id' | 'schoolId' | 'createdAt'>>
  ) => void;
  publishAcademicCalendar: (id: string) => void;
  createDeptAnnualLessonPlan: (
    plan: Omit<LessonPlan, 'id' | 'teacherId' | 'teacherName' | 'status' | 'version' | 'createdAt' | 'planType' | 'createdByRole'>
  ) => void;
  upsertStudentGradeEntry: (
    entry: Omit<StudentGradeEntry, 'id' | 'teacherId' | 'recordedAt'> & { id?: string }
  ) => void;
  deleteStudentGradeEntry: (id: string) => void;
  recalculateStudentGpaFromGrades: (studentId: string) => void;
  addTeacherResource: (
    resource: Omit<TeacherResource, 'id' | 'teacherId' | 'downloads' | 'createdAt'>
  ) => void;
  respondToTeacherCheckIn: (id: string, response: string) => void;
  sendParentMessage: (
    msg: Omit<ParentMessage, 'id' | 'teacherId' | 'sentAt'>
  ) => void;
  addStudentFeedback: (
    feedback: Omit<TeacherFeedback, 'id' | 'teacherId' | 'direction' | 'authorName' | 'date'>
  ) => void;
  addNotification: (title: string, description: string, type: AppNotification['type']) => void;
  markNotificationAsRead: (id: string) => void;
  markNotificationAsUnread: (id: string) => void;
  dismissNotification: (id: string) => void;
  clearNotifications: () => void;

  isDataLoading: boolean;
  dataError: string | null;
  refreshFromApi: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [activeRole, setActiveRoleState] = useState<string>('login');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  // Collections state (loaded from PostgreSQL API)
  const [schools, setSchools] = useState<School[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [trainings, setTrainings] = useState<TeacherTraining[]>([]);
  const [checkIns, setCheckIns] = useState<SchoolCheckIn[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [exams, setExams] = useState<ExamPaper[]>([]);
  const [trainingMaterials, setTrainingMaterials] = useState<TrainingMaterial[]>([]);
  const [teachingNotes, setTeachingNotes] = useState<TeachingNote[]>([]);
  const [academicCalendars, setAcademicCalendars] = useState<AcademicCalendar[]>(() =>
    typeof window !== 'undefined' ? readStoredCalendars() : [],
  );
  const [teacherResources, setTeacherResources] = useState<TeacherResource[]>([]);
  const [teacherFeedbacks, setTeacherFeedbacks] = useState<TeacherFeedback[]>([]);
  const [parentMessages, setParentMessages] = useState<ParentMessage[]>([]);
  const [teacherCheckInPrompts, setTeacherCheckInPrompts] =
    useState<TeacherCheckInPrompt[]>([]);
  const [studentGradeEntries, setStudentGradeEntries] =
    useState<StudentGradeEntry[]>([]);
  const [registrationApplications, setRegistrationApplications] =
    useState<RegistrationApplication[]>([]);
  const [hrEmployees, setHrEmployees] = useState<HrEmployee[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [jobApplications, setJobApplications] = useState<JobApplication[]>([]);
  const [performanceReviews, setPerformanceReviews] = useState<PerformanceReview[]>([]);
  const [onboardingTasks, setOnboardingTasks] = useState<OnboardingTask[]>([]);
  const [staffAttendance, setStaffAttendance] = useState<StaffAttendanceRecord[]>([]);

  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const applyMockFallback = useCallback(() => {
    setSchools(mockSchools);
    setTeachers(mockTeachers);
    setStudents(mockStudents);
    setLessonPlans(mockLessonPlans);
    setAssessments(mockAssessments);
    setAttendance(mockAttendanceRecords);
    setTrainings(mockTrainingPrograms);
    setCheckIns(mockCheckIns);
    setDepartments(mockDepartments);
    setClasses(mockClasses);
    setExams(mockExams);
    setTrainingMaterials(mockTrainingMaterials);
    setTeachingNotes(mockTeachingNotes);
    setAcademicCalendars(readStoredCalendars());
    setTeacherResources(mockTeacherResources);
    setTeacherFeedbacks(mockTeacherFeedbacks);
    setParentMessages(mockParentMessages);
    setTeacherCheckInPrompts(mockTeacherCheckInPrompts);
    setStudentGradeEntries(mockStudentGradeEntries);
    setRegistrationApplications(mockRegistrationApplications);
    setHrEmployees(mockHrEmployees);
    setLeaveRequests(mockLeaveRequests);
    setPayrollRecords(mockPayrollRecords);
    setJobPostings(mockJobPostings);
    setJobApplications(mockJobApplications);
    setPerformanceReviews(mockPerformanceReviews);
    setOnboardingTasks(mockOnboardingTasks);
    setStaffAttendance(mockStaffAttendance);
    setNotifications([
      { id: 'not-1', title: 'New Lesson Plan Submitted', description: 'Martha Feyissa submitted a Biology lesson plan for approval.', timestamp: '10 mins ago', read: false, type: 'request' },
      { id: 'not-2', title: 'National Exam Schedule', description: 'MOE published Grade 12 National Exam timelines for June.', timestamp: '1 hour ago', read: false, type: 'info' },
      { id: 'not-3', title: 'Low Attendance Alert', description: 'Student Yonas Kassa attendance has dropped below 86%.', timestamp: '2 hours ago', read: false, type: 'alert' },
    ]);
  }, []);

  const refreshFromApi = useCallback(async () => {
    setIsDataLoading(true);
    try {
      const data = await api.bootstrap();
      setSchools(data.schools);
      setTeachers(data.teachers);
      setStudents(data.students);
      setLessonPlans(data.lessonPlans);
      setAssessments(data.assessments);
      setAttendance(data.attendance);
      setTrainings(data.trainings);
      setCheckIns(data.checkIns);
      setDepartments(data.departments);
      setClasses(data.classes);
      setExams(data.exams);
      setTrainingMaterials(data.trainingMaterials);
      setTeachingNotes(data.teachingNotes);
      const apiCalendars = data.academicCalendars ?? [];
      const storedCalendars = readStoredCalendars();
      const mergedCalendars =
        apiCalendars.length > 0
          ? apiCalendars
          : storedCalendars.length > 0
            ? storedCalendars
            : mockAcademicCalendars;
      setAcademicCalendars(mergedCalendars);
      writeStoredCalendars(mergedCalendars);
      setTeacherResources(data.teacherResources);
      setTeacherFeedbacks(data.teacherFeedbacks);
      setParentMessages(data.parentMessages);
      setTeacherCheckInPrompts(data.teacherCheckInPrompts);
      setStudentGradeEntries(data.studentGradeEntries);
      setRegistrationApplications(mockRegistrationApplications);
      setHrEmployees(mockHrEmployees);
      setLeaveRequests(mockLeaveRequests);
      setPayrollRecords(mockPayrollRecords);
      setJobPostings(mockJobPostings);
      setJobApplications(mockJobApplications);
      setPerformanceReviews(mockPerformanceReviews);
      setOnboardingTasks(mockOnboardingTasks);
      setStaffAttendance(mockStaffAttendance);
      setNotifications(data.notifications);
      setDataError(null);
    } catch {
      applyMockFallback();
      setDataError('API unavailable — live data could not be loaded. Start the server on port 3004.');
    } finally {
      setIsDataLoading(false);
    }
  }, [applyMockFallback]);

  useEffect(() => {
    void refreshFromApi();
  }, [refreshFromApi]);

  // Handle active role sync (legacy — prefer login/logout)
  const setActiveRole = (role: string) => {
    setActiveRoleState(role);
  };

  const login = useCallback((user: AuthUser, remember = true) => {
    setCurrentUser(user);
    setActiveRoleState(user.role);
    persistSession(user, remember);
    void refreshFromApi();
  }, [refreshFromApi]);

  const logout = useCallback(() => {
    setCurrentUser(null);
    setActiveRoleState('login');
    clearSession();
  }, []);

  const resolveTeacherId = useCallback(() => {
    if (!currentUser?.email) return DEMO_TEACHER_ID;
    const match = teachers.find(
      (t) => t.email.toLowerCase() === currentUser.email.toLowerCase()
    );
    return match?.id ?? DEMO_TEACHER_ID;
  }, [currentUser, teachers]);

  useEffect(() => {
    const savedUser = readStoredSession();
    if (savedUser) {
      setCurrentUser(savedUser);
      setActiveRoleState(savedUser.role);
    }
    // Always force light mode — dark mode has been removed
    setTheme('light');
    if (typeof window !== 'undefined') {
      window.document.documentElement.classList.remove('dark');
      localStorage.removeItem('pts-active-theme');
    }
    setAuthReady(true);
  }, []);

  // toggleTheme is a no-op — dark mode removed
  const toggleTheme = () => {
    // Dark mode disabled
  };

  // Actions
  const addSchool = (schoolData: Omit<School, 'id' | 'code' | 'studentsCount' | 'teachersCount' | 'status' | 'gps'>) => {
    void api.createSchool(schoolData as unknown as Record<string, unknown>).then((school) => {
      setSchools((prev) => [school as School, ...prev]);
      addNotification('New School Registered', `School ${(school as School).name} registered.`, 'success');
    }).catch(() => void refreshFromApi());
  };

  const toggleSchoolStatus = (id: string) => {
    void api.toggleSchoolStatus(id).then((school) => {
      setSchools((prev) => prev.map((sch) => (sch.id === id ? (school as School) : sch)));
      const s = school as School;
      addNotification(`School ${s.status}`, `School ${s.name} status updated to ${s.status}.`, s.status === 'Active' ? 'success' : 'alert');
    }).catch(() => void refreshFromApi());
  };

  const approveLessonPlan = (id: string, role: 'dept' | 'school', comments: string) => {
    void api.approveLessonPlan(id, role, comments).then((lp) => {
      setLessonPlans((prev) => prev.map((p) => (p.id === id ? (lp as LessonPlan) : p)));
      addNotification('Lesson Plan Updated', `Lesson plan "${(lp as LessonPlan).title}" was approved.`, 'success');
    }).catch(() => void refreshFromApi());
  };

  const rejectLessonPlan = (id: string, role: 'dept' | 'school', comments: string) => {
    void api.rejectLessonPlan(id, role, comments).then((lp) => {
      setLessonPlans((prev) => prev.map((p) => (p.id === id ? (lp as LessonPlan) : p)));
      addNotification('Lesson Plan Rejected', `Lesson plan "${(lp as LessonPlan).title}" was rejected.`, 'alert');
    }).catch(() => void refreshFromApi());
  };

  const approveAssessment = (id: string, comments: string) => {
    void api.approveAssessment(id, comments).then((asm) => {
      setAssessments((prev) => prev.map((a) => (a.id === id ? (asm as Assessment) : a)));
      addNotification('Assessment Approved', `Assessment "${(asm as Assessment).title}" approved.`, 'success');
    }).catch(() => void refreshFromApi());
  };

  const rejectAssessment = (id: string, comments: string) => {
    void api.rejectAssessment(id, comments).then((asm) => {
      setAssessments((prev) => prev.map((a) => (a.id === id ? (asm as Assessment) : a)));
      addNotification('Assessment Draft Rejected', `Assessment "${(asm as Assessment).title}" sent back.`, 'alert');
    }).catch(() => void refreshFromApi());
  };

  const createLessonPlan = (planData: Omit<LessonPlan, 'id' | 'teacherId' | 'teacherName' | 'status' | 'version' | 'createdAt'>) => {
    void api.createLessonPlan({ ...planData, teacherId: resolveTeacherId() }).then((lp) => {
      setLessonPlans((prev) => [lp as LessonPlan, ...prev]);
      addNotification('Lesson Plan Submitted', `Lesson plan "${(lp as LessonPlan).title}" submitted.`, 'info');
    }).catch(() => void refreshFromApi());
  };

  const createAssessment = (asmData: Omit<Assessment, 'id' | 'teacherId' | 'teacherName' | 'status' | 'createdAt'>) => {
    void api.createAssessment({ ...asmData, teacherId: resolveTeacherId() }).then((asm) => {
      setAssessments((prev) => [asm as Assessment, ...prev]);
      addNotification('Assessment Submitted', `Assessment "${(asm as Assessment).title}" submitted.`, 'info');
    }).catch(() => void refreshFromApi());
  };

  const updateAssessmentQuestions = (id: string, questions: Assessment['questions']) => {
    void api.updateAssessment(id, { questions }).then((asm) => {
      setAssessments((prev) => prev.map((a) => (a.id === id ? (asm as Assessment) : a)));
      addNotification('Questions Saved', `Assessment questions updated.`, 'success');
    }).catch(() => {
      setAssessments((prev) =>
        prev.map((a) =>
          a.id === id
            ? {
                ...a,
                questions,
                status: a.status === 'Rejected' ? 'Pending Dept Head' : a.status,
              }
            : a
        )
      );
      addNotification('Questions Saved', 'Assessment questions updated locally.', 'info');
    });
  };

  const saveAttendance = (records: { studentId: string; status: 'Present' | 'Absent' | 'Late'; remarks?: string }[]) => {
    void api.saveAttendance(records).then(() => {
      void refreshFromApi();
      addNotification('Attendance Logs Recorded', `Attendance recorded for ${records.length} students.`, 'success');
    }).catch(() => void refreshFromApi());
  };

  const enrollStudent = (studentData: Omit<Student, 'id' | 'studentId' | 'gpa' | 'attendanceRate' | 'status'>) => {
    void api.createStudent(studentData as unknown as Record<string, unknown>).then((std) => {
      setStudents((prev) => [...prev, std as Student]);
      addNotification('Student Enrolled', `Student ${(std as Student).name} enrolled.`, 'success');
    }).catch(() => void refreshFromApi());
  };

  const submitRegistrationApplication = (
    appData: Omit<RegistrationApplication, 'id' | 'status' | 'submittedAt'>
  ) => {
    const app: RegistrationApplication = {
      ...appData,
      id: `reg-app-${Date.now()}`,
      status: 'Submitted',
      submittedAt: new Date().toISOString().slice(0, 10),
    };
    setRegistrationApplications((prev) => [app, ...prev]);
    addNotification('Application Submitted', `${app.applicantName}'s registration application received.`, 'info');
  };

  const updateRegistrationApplication = (id: string, updates: Partial<RegistrationApplication>) => {
    setRegistrationApplications((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...updates } : a))
    );
  };

  const reviewRegistrationApplication = (
    id: string,
    status: RegistrationApplicationStatus,
    reviewerNotes?: string
  ) => {
    setRegistrationApplications((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              status,
              reviewerNotes: reviewerNotes ?? a.reviewerNotes,
              reviewedAt: new Date().toISOString().slice(0, 10),
            }
          : a
      )
    );
    const app = registrationApplications.find((a) => a.id === id);
    addNotification(
      'Application Reviewed',
      `${app?.applicantName ?? 'Application'} marked as ${status}.`,
      status === 'Rejected' ? 'alert' : 'success'
    );
  };

  const enrollFromApplication = (applicationId: string) => {
    const app = registrationApplications.find((a) => a.id === applicationId);
    if (!app || app.status !== 'Approved') return;

    void api
      .createStudent({
        name: app.applicantName,
        grade: app.gradeApplied,
        section: app.sectionRequested,
        parentName: app.parentName,
        parentPhone: app.parentPhone,
        parentEmail: app.parentEmail,
        emergencyContact: app.emergencyContact,
        medicalInfo: app.medicalInfo,
        schoolId: 'sch-1',
      } as unknown as Record<string, unknown>)
      .then((std) => {
        const student = std as Student;
        setStudents((prev) => [...prev, student]);
        setRegistrationApplications((prev) =>
          prev.map((a) =>
            a.id === applicationId
              ? { ...a, status: 'Enrolled' as const, enrolledStudentId: student.id }
              : a
          )
        );
        addNotification('Student Enrolled', `${student.name} enrolled from application.`, 'success');
      })
      .catch(() => {
        enrollStudent({
          name: app.applicantName,
          grade: app.gradeApplied,
          section: app.sectionRequested,
          parentName: app.parentName,
          parentPhone: app.parentPhone,
          parentEmail: app.parentEmail,
          emergencyContact: app.emergencyContact,
          medicalInfo: app.medicalInfo,
          schoolId: 'sch-1',
        });
        setRegistrationApplications((prev) =>
          prev.map((a) =>
            a.id === applicationId ? { ...a, status: 'Enrolled' as const } : a
          )
        );
      });
  };

  const addHrEmployee = (employeeData: Omit<HrEmployee, 'id' | 'employeeId' | 'schoolId'>): string => {
    const employee: HrEmployee = {
      ...employeeData,
      id: `emp-${Date.now()}`,
      employeeId: generateEmployeeId(hrEmployees),
      schoolId: 'sch-1',
    };
    setHrEmployees((prev) => [...prev, employee]);
    addNotification('Employee Added', `${employee.name} onboarded as ${employee.position}.`, 'success');
    return employee.id;
  };

  const updateHrEmployee = (id: string, updates: Partial<HrEmployee>) => {
    setHrEmployees((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)));
  };

  const toggleHrEmployeeStatus = (id: string) => {
    setHrEmployees((prev) =>
      prev.map((e) => {
        if (e.id !== id) return e;
        const nextStatus =
          e.status === 'Active' ? 'Terminated' : e.status === 'Terminated' ? 'Active' : e.status;
        return { ...e, status: nextStatus };
      })
    );
  };

  const submitLeaveRequest = (requestData: Omit<LeaveRequest, 'id' | 'status' | 'submittedAt'>) => {
    const request: LeaveRequest = {
      ...requestData,
      id: `leave-${Date.now()}`,
      status: 'Pending',
      submittedAt: new Date().toISOString().slice(0, 10),
    };
    setLeaveRequests((prev) => [request, ...prev]);
    addNotification('Leave Request', `${request.employeeName} submitted ${request.type} leave.`, 'request');
  };

  const reviewLeaveRequest = (id: string, status: LeaveStatus, reviewerNotes?: string) => {
    setLeaveRequests((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, status, reviewerNotes, reviewedAt: new Date().toISOString().slice(0, 10) }
          : r
      )
    );
    if (status === 'Approved') {
      const req = leaveRequests.find((r) => r.id === id);
      if (req) {
        setHrEmployees((prev) =>
          prev.map((e) => (e.id === req.employeeId ? { ...e, status: 'On Leave' } : e))
        );
      }
    }
    addNotification('Leave Reviewed', `Leave request ${status.toLowerCase()}.`, status === 'Approved' ? 'success' : 'info');
  };

  const processPayroll = (employeeId: string, month: string) => {
    const employee = hrEmployees.find((e) => e.id === employeeId);
    if (!employee) return;
    const existing = payrollRecords.find((p) => p.employeeId === employeeId && p.month === month);
    if (existing) return;

    const allowances = Math.round(employee.salary * 0.12);
    const deductions = Math.round(employee.salary * 0.17);
    const record: PayrollRecord = {
      id: `pay-${Date.now()}`,
      employeeId,
      employeeName: employee.name,
      month,
      baseSalary: employee.salary,
      allowances,
      deductions,
      netPay: employee.salary + allowances - deductions,
      status: 'Processed',
      processedAt: new Date().toISOString().slice(0, 10),
    };
    setPayrollRecords((prev) => [record, ...prev]);
    addNotification('Payroll Processed', `Payroll for ${employee.name} (${month}) processed.`, 'success');
  };

  const updatePayrollStatus = (id: string, status: PayrollStatus) => {
    setPayrollRecords((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
  };

  const addJobPosting = (postingData: Omit<JobPosting, 'id' | 'postedAt' | 'applicantCount'>) => {
    const posting: JobPosting = {
      ...postingData,
      id: `job-${Date.now()}`,
      postedAt: new Date().toISOString().slice(0, 10),
      applicantCount: 0,
    };
    setJobPostings((prev) => [posting, ...prev]);
    addNotification('Job Posted', `${posting.title} is now live.`, 'info');
  };

  const updateJobPosting = (id: string, updates: Partial<JobPosting>) => {
    setJobPostings((prev) => prev.map((j) => (j.id === id ? { ...j, ...updates } : j)));
  };

  const updateJobApplication = (id: string, status: ApplicationStatus, notes?: string) => {
    setJobApplications((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status, notes: notes ?? a.notes } : a))
    );
    if (status === 'Hired') {
      const app = jobApplications.find((a) => a.id === id);
      if (app) {
        addHrEmployee({
          name: app.applicantName,
          email: app.email,
          phone: app.phone,
          position: app.jobTitle.split('—')[0]?.trim() ?? 'Staff',
          department: jobPostings.find((j) => j.id === app.jobId)?.department ?? 'Administration',
          employmentType: 'Full-time',
          hireDate: new Date().toISOString().slice(0, 10),
          salary: 12000,
          status: 'Probation',
        });
      }
    }
  };

  const addPerformanceReview = (reviewData: Omit<PerformanceReview, 'id' | 'status'>) => {
    const review: PerformanceReview = {
      ...reviewData,
      id: `perf-${Date.now()}`,
      status: 'In Progress',
    };
    setPerformanceReviews((prev) => [review, ...prev]);
  };

  const updatePerformanceReview = (id: string, updates: Partial<PerformanceReview>) => {
    setPerformanceReviews((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates } : r)));
  };

  const addOnboardingTask = (taskData: Omit<OnboardingTask, 'id' | 'completed'>) => {
    const task: OnboardingTask = {
      ...taskData,
      id: `onb-${Date.now()}`,
      completed: false,
    };
    setOnboardingTasks((prev) => [...prev, task]);
  };

  const toggleOnboardingTask = (id: string) => {
    setOnboardingTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const recordStaffAttendance = (
    recordData: Omit<StaffAttendanceRecord, 'id' | 'employeeName'> & { employeeName?: string }
  ) => {
    const employee = hrEmployees.find((e) => e.id === recordData.employeeId);
    const record: StaffAttendanceRecord = {
      ...recordData,
      id: `satt-${Date.now()}`,
      employeeName: recordData.employeeName ?? employee?.name ?? 'Unknown',
    };
    setStaffAttendance((prev) => {
      const filtered = prev.filter(
        (r) => !(r.employeeId === record.employeeId && r.date === record.date)
      );
      return [record, ...filtered];
    });
  };

  const updateStudent = (id: string, updates: Partial<Student>) => {
    void api.updateStudent(id, updates as Record<string, unknown>).then((std) => {
      setStudents((prev) => prev.map((s) => (s.id === id ? (std as Student) : s)));
      addNotification('Student Record Updated', `Profile for ${(std as Student).name} saved.`, 'success');
    }).catch(() => void refreshFromApi());
  };

  const updateStudentGrade = (id: string, newGpa: number) => {
    void api.updateStudent(id, { gpa: newGpa }).then((std) => {
      setStudents((prev) => prev.map((s) => (s.id === id ? (std as Student) : s)));
      addNotification('Grades Updated', `GPA set to ${newGpa}.`, 'success');
    }).catch(() => void refreshFromApi());
  };

  const addTeacher = (teacherData: Omit<Teacher, 'id' | 'status' | 'trainingProgress'>) => {
    void api.createTeacher(teacherData as unknown as Record<string, unknown>).then((tch) => {
      setTeachers((prev) => [...prev, tch as Teacher]);
      void refreshFromApi();
      addNotification('Teacher Onboarded', `${(tch as Teacher).name} registered.`, 'success');
    }).catch(() => void refreshFromApi());
  };

  const updateTeacher = (id: string, updates: Partial<Teacher>) => {
    void api.updateTeacher(id, updates as Record<string, unknown>).then((tch) => {
      setTeachers((prev) => prev.map((t) => (t.id === id ? (tch as Teacher) : t)));
      addNotification('Instructor Record Updated', `Profile for ${(tch as Teacher).name} saved.`, 'success');
    }).catch(() => void refreshFromApi());
  };

  const toggleTeacherStatus = (id: string) => {
    void api.toggleTeacherStatus(id).then((tch) => {
      setTeachers((prev) => prev.map((t) => (t.id === id ? (tch as Teacher) : t)));
      addNotification('Teacher Status Updated', `${(tch as Teacher).name} is now ${(tch as Teacher).status}.`, 'success');
    }).catch(() => void refreshFromApi());
  };

  const addDepartment = (name: string, headName: string) => {
    void api.createDepartment(name, headName).then((dept) => {
      setDepartments((prev) => [...prev, dept as Department]);
      addNotification('Department Created', `Department "${name}" registered.`, 'success');
    }).catch(() => void refreshFromApi());
  };

  const addClass = (name: string, grade: string, section: string, homeroomTeacher: string) => {
    void api.createClass({ name, grade, section, homeroomTeacher }).then((cls) => {
      setClasses((prev) => [...prev, cls as SchoolClass]);
      addNotification('Class Created', `Class "${name}" added.`, 'success');
    }).catch(() => void refreshFromApi());
  };

  const approveExam = (id: string, comments: string) => {
    void api.approveExam(id, comments).then((ex) => {
      setExams((prev) => prev.map((e) => (e.id === id ? (ex as ExamPaper) : e)));
      addNotification('Exam Paper Approved', `"${(ex as ExamPaper).title}" approved.`, 'success');
    }).catch(() => void refreshFromApi());
  };

  const rejectExam = (id: string, comments: string) => {
    void api.rejectExam(id, comments).then((ex) => {
      setExams((prev) => prev.map((e) => (e.id === id ? (ex as ExamPaper) : e)));
      addNotification('Exam Paper Rejected', `"${(ex as ExamPaper).title}" rejected.`, 'alert');
    }).catch(() => void refreshFromApi());
  };

  const addTrainingMaterial = (data: {
    title: string;
    resourceUrl: string;
    category: string;
    trainingType?: TrainingMaterial['trainingType'];
    departmentId?: string;
    grade?: string;
    subject?: string;
  }) => {
    void api.createTrainingMaterial(data).then((mat) => {
      setTrainingMaterials((prev) => [...prev, mat as TrainingMaterial]);
      addNotification('Training Resource Added', `"${data.title}" saved.`, 'success');
    }).catch(() => void refreshFromApi());
  };

  const disseminateTrainingMaterial = (id: string) => {
    void api.disseminateTrainingMaterial(id).then((mat) => {
      setTrainingMaterials((prev) =>
        prev.map((m) => (m.id === id ? (mat as TrainingMaterial) : m))
      );
      addNotification(
        'Resource Disseminated',
        `"${(mat as TrainingMaterial).title}" is now visible to teachers.`,
        'success'
      );
    }).catch(() => void refreshFromApi());
  };

  const addCheckInTemplate = (title: string, type: 'Teacher Wellness' | 'Student Satisfaction' | 'Parent Feedback', respondentName: string, rating: number, comment: string) => {
    void api.createCheckIn({ title, type, respondentName, rating, comment }).then((ch) => {
      setCheckIns((prev) => [ch as SchoolCheckIn, ...prev]);
      addNotification('Wellness Survey Created', `Survey "${title}" created.`, 'success');
    }).catch(() => void refreshFromApi());
  };

  const updateLessonPlan = (id: string, title: string, objectives: string[], sessions: number, homework: string) => {
    void api.updateLessonPlan(id, { title, objectives, sessions, homework }).then((lp) => {
      setLessonPlans((prev) => prev.map((p) => (p.id === id ? (lp as LessonPlan) : p)));
      addNotification('Lesson Plan Updated', `"${title}" resubmitted.`, 'info');
    }).catch(() => void refreshFromApi());
  };

  const createTeachingNote = (
    noteData: Omit<TeachingNote, 'id' | 'teacherId' | 'status' | 'createdAt' | 'updatedAt'>,
    status: TeachingNote['status'] = 'Saved'
  ) => {
    const id = `tn-${Date.now()}`;
    const today = new Date().toISOString().slice(0, 10);
    const teacherId = resolveTeacherId();
    const localNote: TeachingNote = {
      ...noteData,
      id,
      teacherId,
      status,
      createdAt: today,
      updatedAt: today,
    };
    setTeachingNotes((prev) => [localNote, ...prev]);
    void api.createTeachingNote({ ...noteData, id, teacherId, status }).then((note) => {
      setTeachingNotes((prev) => [note as TeachingNote, ...prev.filter((n) => n.id !== id)]);
    }).catch(() => {
      /* keep optimistic local note */
    });
    return id;
  };

  const updateTeachingNote = (id: string, updates: Partial<TeachingNote>) => {
    const today = new Date().toISOString().slice(0, 10);
    setTeachingNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, ...updates, updatedAt: today } : n)),
    );
    void api.updateTeachingNote(id, updates as Record<string, unknown>).then((note) => {
      setTeachingNotes((prev) => prev.map((n) => (n.id === id ? (note as TeachingNote) : n)));
    }).catch(() => {
      /* keep optimistic update */
    });
  };

  const approveTeachingNote = (id: string, comments: string) => {
    const note = teachingNotes.find((n) => n.id === id);
    updateTeachingNote(id, { status: 'Approved', deptComments: comments });
    if (note) {
      addNotification('Teaching Note Approved', `"${note.title}" approved for classroom use.`, 'success');
    }
  };

  const rejectTeachingNote = (id: string, comments: string) => {
    const note = teachingNotes.find((n) => n.id === id);
    updateTeachingNote(id, { status: 'Rejected', deptComments: comments });
    if (note) {
      addNotification('Teaching Note Rejected', `"${note.title}" returned to teacher.`, 'alert');
    }
  };

  const createAcademicCalendar = (
    calendarData: Omit<AcademicCalendar, 'id' | 'schoolId' | 'status' | 'createdAt' | 'publishedAt'>,
  ) => {
    const calendar: AcademicCalendar = {
      ...calendarData,
      id: `cal-${Date.now()}`,
      schoolId: 'sch-1',
      status: 'Draft',
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setAcademicCalendars((prev) => {
      const withoutDraft = prev.filter((c) => c.status !== 'Draft' || c.schoolId !== calendar.schoolId);
      const next = [calendar, ...withoutDraft];
      writeStoredCalendars(next);
      return next;
    });
    void api.createAcademicCalendar(calendar as unknown as Record<string, unknown>).then((saved) => {
      setAcademicCalendars((prev) => {
        const next = [saved as AcademicCalendar, ...prev.filter((c) => c.id !== calendar.id && c.id !== (saved as AcademicCalendar).id)];
        writeStoredCalendars(next);
        return next;
      });
    }).catch(() => {
      /* local + localStorage already updated */
    });
    addNotification('Calendar Draft Saved', `"${calendar.title}" is ready for review.`, 'info');
  };

  const updateAcademicCalendar = (
    id: string,
    updates: Partial<Omit<AcademicCalendar, 'id' | 'schoolId' | 'createdAt'>>,
  ) => {
    let updated: AcademicCalendar | undefined;
    setAcademicCalendars((prev) => {
      const next = prev.map((c) => {
        if (c.id !== id) return c;
        updated = { ...c, ...updates };
        return updated;
      });
      writeStoredCalendars(next);
      return next;
    });
    if (updated) {
      void api
        .createAcademicCalendar(updated as unknown as Record<string, unknown>)
        .then((saved) => {
          setAcademicCalendars((prev) => {
            const next = prev.map((c) => (c.id === id ? (saved as AcademicCalendar) : c));
            writeStoredCalendars(next);
            return next;
          });
        })
        .catch(() => {
          /* localStorage already updated */
        });
    }
    addNotification('Calendar Updated', 'School calendar changes saved.', 'info');
  };

  const publishAcademicCalendar = (id: string) => {
    const today = new Date().toISOString().slice(0, 10);
    setAcademicCalendars((prev) => {
      const next = prev.map((c) =>
        c.id === id ? { ...c, status: 'Published' as const, publishedAt: today } : c,
      );
      writeStoredCalendars(next);
      return next;
    });
    const cal = academicCalendars.find((c) => c.id === id);
    void api.publishAcademicCalendar(id).then((saved) => {
      setAcademicCalendars((prev) => {
        const next = prev.map((c) => (c.id === id ? (saved as AcademicCalendar) : c));
        writeStoredCalendars(next);
        return next;
      });
    }).catch(() => {
      /* local publish already applied */
    });
    addNotification(
      'Academic Calendar Disseminated',
      cal
        ? `"${cal.title}" is now visible to teachers, students, parents, and department heads.`
        : 'Calendar disseminated to all school portals.',
      'success',
    );
  };

  const createDeptAnnualLessonPlan = (
    planData: Omit<LessonPlan, 'id' | 'teacherId' | 'teacherName' | 'status' | 'version' | 'createdAt' | 'planType' | 'createdByRole'>,
  ) => {
    const teacher = teachers.find((t) => t.email === currentUser?.email);
    const teacherId = teacher?.id ?? resolveTeacherId();
    const teacherName = currentUser?.displayName ?? teacher?.name ?? 'Department Head';
    const payload = {
      ...planData,
      teacherId,
      teacherName,
      status: 'Approved',
      planType: 'yearly',
      createdByRole: 'department-head',
      planDetail: planData.planDetail,
    };

    void api
      .createLessonPlan(payload)
      .then((lp) => {
        setLessonPlans((prev) => [lp as LessonPlan, ...prev]);
        addNotification(
          'Annual Plan Published',
          `"${(lp as LessonPlan).title}" is saved and available to department teachers.`,
          'success',
        );
      })
      .catch(() => {
        // Fallback local so the UI still works if API is briefly down
        const plan: LessonPlan = {
          ...planData,
          id: `lp-${Date.now()}`,
          teacherId,
          teacherName,
          status: 'Approved',
          version: 1,
          createdAt: new Date().toISOString().slice(0, 10),
          planType: 'yearly',
          createdByRole: 'department-head',
        };
        setLessonPlans((prev) => [plan, ...prev]);
        addNotification(
          'Annual Plan Saved Locally',
          `"${plan.title}" could not reach the server — retry when online so it persists across sessions.`,
          'alert',
        );
      });
  };

  const applyGpaFromGradeEntries = (studentId: string, entries: StudentGradeEntry[]) => {
    const studentEntries = entries.filter((e) => e.studentId === studentId);
    if (studentEntries.length === 0) return;
    const totalWeight = studentEntries.reduce((a, e) => a + e.weight, 0);
    if (totalWeight === 0) return;
    const weighted = studentEntries.reduce((a, e) => {
      const pct = e.maxScore > 0 ? (e.score / e.maxScore) * 100 : 0;
      return a + pct * e.weight;
    }, 0);
    const gpa = percentToGpa(weighted / totalWeight);
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, gpa: parseFloat(gpa.toFixed(2)) } : s))
    );
  };

  const upsertStudentGradeEntry = (
    entryData: Omit<StudentGradeEntry, 'id' | 'teacherId' | 'recordedAt'> & { id?: string }
  ) => {
    const teacherId = resolveTeacherId();
    void api
      .upsertGradeEntry({ ...entryData, teacherId })
      .then((entry) => {
        setStudentGradeEntries((prev) => {
          const exists = prev.some((e) => e.id === (entry as StudentGradeEntry).id);
          const next = exists
            ? prev.map((e) =>
                e.id === (entry as StudentGradeEntry).id ? (entry as StudentGradeEntry) : e,
              )
            : [entry as StudentGradeEntry, ...prev];
          applyGpaFromGradeEntries(entryData.studentId, next);
          return next;
        });
        void api.recalculateGpa(entryData.studentId).then(() => void refreshFromApi());
        addNotification(entryData.id ? 'Grade Updated' : 'Grade Recorded', entryData.title, 'success');
      })
      .catch(() => {
        const today = new Date().toISOString().slice(0, 10);
        const local: StudentGradeEntry = {
          ...entryData,
          id: entryData.id || `ge-${Date.now()}`,
          teacherId,
          recordedAt: today,
        };
        setStudentGradeEntries((prev) => {
          const exists = prev.some((e) => e.id === local.id);
          const next = exists
            ? prev.map((e) => (e.id === local.id ? local : e))
            : [local, ...prev];
          applyGpaFromGradeEntries(entryData.studentId, next);
          return next;
        });
        addNotification(entryData.id ? 'Grade Updated' : 'Grade Recorded', entryData.title, 'success');
      });
  };

  const deleteStudentGradeEntry = (id: string) => {
    const entry = studentGradeEntries.find((e) => e.id === id);
    void api.deleteGradeEntry(id).then(() => {
      setStudentGradeEntries((prev) => {
        const next = prev.filter((e) => e.id !== id);
        if (entry) applyGpaFromGradeEntries(entry.studentId, next);
        return next;
      });
      if (entry) void api.recalculateGpa(entry.studentId);
      addNotification('Grade Removed', 'Assessment result deleted.', 'info');
    }).catch(() => void refreshFromApi());
  };

  const recalculateStudentGpaFromGrades = (studentId: string) => {
    void api.recalculateGpa(studentId).then(({ gpa }) => {
      setStudents((prev) => prev.map((s) => (s.id === studentId ? { ...s, gpa } : s)));
    }).catch(() => void refreshFromApi());
  };

  const addTeacherResource = (
    resourceData: Omit<TeacherResource, 'id' | 'teacherId' | 'downloads' | 'createdAt'>
  ) => {
    void api.createTeacherResource({ ...resourceData, teacherId: resolveTeacherId() }).then((res) => {
      setTeacherResources((prev) => [res as TeacherResource, ...prev]);
      addNotification('Resource Published', `"${(res as TeacherResource).title}" is available.`, 'success');
    }).catch(() => void refreshFromApi());
  };

  const respondToTeacherCheckIn = (id: string, response: string) => {
    void api.respondCheckIn(id, response).then((p) => {
      setTeacherCheckInPrompts((prev) => prev.map((x) => (x.id === id ? (p as TeacherCheckInPrompt) : x)));
      addNotification('Check-in Response Saved', 'Your survey response has been recorded.', 'success');
    }).catch(() => void refreshFromApi());
  };

  const sendParentMessage = (msgData: Omit<ParentMessage, 'id' | 'teacherId' | 'sentAt'>) => {
    void api.sendParentMessage({ ...msgData, teacherId: resolveTeacherId() }).then((msg) => {
      setParentMessages((prev) => [msg as ParentMessage, ...prev]);
      addNotification('Message Sent to Parent', `Message sent regarding ${(msg as ParentMessage).studentName}.`, 'success');
    }).catch(() => void refreshFromApi());
  };

  const addStudentFeedback = (
    feedbackData: Omit<TeacherFeedback, 'id' | 'teacherId' | 'direction' | 'authorName' | 'date'>
  ) => {
    void api.addTeacherFeedback({ ...feedbackData, teacherId: resolveTeacherId() }).then((fb) => {
      setTeacherFeedbacks((prev) => [fb as TeacherFeedback, ...prev]);
      addNotification('Student Feedback Recorded', `Feedback saved for ${feedbackData.studentName ?? 'student'}.`, 'success');
    }).catch(() => void refreshFromApi());
  };

  const distributeLessonPlan = (id: string) => {
    setLessonPlans(
      lessonPlans.map((lp) => {
        if (lp.id === id && lp.status === 'Approved') {
          addNotification('Lesson Plan Distributed', `Approved lesson plan "${lp.title}" has been distributed to subject teachers.`, 'success');
          return lp;
        }
        return lp;
      })
    );
  };

  const addNotification = (title: string, description: string, type: AppNotification['type']) => {
    void api.createNotification(title, description, type).then((notif) => {
      setNotifications((prev) => [notif as AppNotification, ...prev]);
    }).catch(() => {
      const newNotif: AppNotification = {
        id: `not-gen-${Math.random().toString(36).slice(2, 11)}`,
        title,
        description,
        timestamp: 'Just now',
        read: false,
        type,
      };
      setNotifications((prev) => [newNotif, ...prev]);
    });
  };

  const markNotificationAsRead = (id: string) => {
    void api.markNotificationRead(id).then((notif) => {
      setNotifications((prev) => prev.map((n) => (n.id === id ? (notif as AppNotification) : n)));
    }).catch(() => {
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    });
  };

  const markNotificationAsUnread = (id: string) => {
    setNotifications(
      notifications.map((not) => (not.id === id ? { ...not, read: false } : not))
    );
  };

  const dismissNotification = (id: string) => {
    setNotifications(notifications.filter((not) => not.id !== id));
  };

  const clearNotifications = () => {
    void api.clearNotifications().then(() => setNotifications([])).catch(() => setNotifications([]));
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        authReady,
        login,
        logout,
        activeRole,
        setActiveRole,
        resolveTeacherId,
        theme,
        toggleTheme,
        schools,
        teachers,
        students,
        lessonPlans,
        assessments,
        attendance,
        trainings,
        checkIns,
        notifications,
        departments,
        classes,
        exams,
        trainingMaterials,
        teachingNotes,
        academicCalendars,
        teacherResources,
        teacherFeedbacks,
        parentMessages,
        teacherCheckInPrompts,
        studentGradeEntries,
        registrationApplications,
        hrEmployees,
        leaveRequests,
        payrollRecords,
        jobPostings,
        jobApplications,
        performanceReviews,
        onboardingTasks,
        staffAttendance,
        addSchool,
        toggleSchoolStatus,
        approveLessonPlan,
        rejectLessonPlan,
        approveAssessment,
        rejectAssessment,
        createLessonPlan,
        createAssessment,
        updateAssessmentQuestions,
        saveAttendance,
        enrollStudent,
        submitRegistrationApplication,
        updateRegistrationApplication,
        reviewRegistrationApplication,
        enrollFromApplication,
        addHrEmployee,
        updateHrEmployee,
        toggleHrEmployeeStatus,
        submitLeaveRequest,
        reviewLeaveRequest,
        processPayroll,
        updatePayrollStatus,
        addJobPosting,
        updateJobPosting,
        updateJobApplication,
        addPerformanceReview,
        updatePerformanceReview,
        addOnboardingTask,
        toggleOnboardingTask,
        recordStaffAttendance,
        updateStudent,
        updateStudentGrade,
        addTeacher,
        updateTeacher,
        toggleTeacherStatus,
        addDepartment,
        addClass,
        approveExam,
        rejectExam,
        addTrainingMaterial,
        disseminateTrainingMaterial,
        addCheckInTemplate,
        updateLessonPlan,
        distributeLessonPlan,
        createTeachingNote,
        updateTeachingNote,
        approveTeachingNote,
        rejectTeachingNote,
        createAcademicCalendar,
        updateAcademicCalendar,
        publishAcademicCalendar,
        createDeptAnnualLessonPlan,
        upsertStudentGradeEntry,
        deleteStudentGradeEntry,
        recalculateStudentGpaFromGrades,
        addTeacherResource,
        respondToTeacherCheckIn,
        sendParentMessage,
        addStudentFeedback,
        addNotification,
        markNotificationAsRead,
        markNotificationAsUnread,
        dismissNotification,
        clearNotifications,
        isDataLoading,
        dataError,
        refreshFromApi,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
