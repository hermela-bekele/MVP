'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import { api, type BootstrapPayload } from '@/lib/api';
import { toast } from '@/components/ui/toast';
import {
  type DataSource,
  countOutbox,
  emptyBootstrapPayload,
  enqueueOutbox,
  isBrowserOnline,
  loadOfflineSnapshot,
  readOfflineMeta,
  saveOfflineSnapshot,
  writeOfflineMeta,
} from '@/lib/offlineStore';
import { flushOfflineOutbox } from '@/lib/offlineSync';
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
  LessonDelivery,
  CommunityPost,
  CommunityReply,
  StaffMessage,
  GraspOutcome,
  TeacherSelfAssessment,
  TeacherTrainingAssignment,
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
  mockLessonDeliveries,
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
  persistEngine,
  persistSession,
  readStoredEngine,
  readStoredSession,
} from '@/lib/auth';
import { type EngineId, defaultEngineForRole, enginesForRole, isEngineId } from '@/lib/engines';

export interface AppNotification {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  type: 'info' | 'alert' | 'success' | 'request';
  /** Absolute or portal path for deep-link navigation, e.g. /dashboard/teacher/communication */
  linkPath?: string;
}

interface AppContextType {
  currentUser: AuthUser | null;
  authReady: boolean;
  login: (user: AuthUser, remember?: boolean) => void;
  logout: () => void;
  activeRole: string;
  setActiveRole: (role: string) => void;
  activeEngine: EngineId | null;
  setEngine: (engine: EngineId) => void;
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
  lessonDeliveries: LessonDelivery[];
  communityPosts: CommunityPost[];
  communityReplies: CommunityReply[];
  staffMessages: StaffMessage[];
  teacherSelfAssessments: TeacherSelfAssessment[];
  teacherTrainingAssignments: TeacherTrainingAssignment[];
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
  createAssessment: (
    asm: Omit<Assessment, 'id' | 'teacherId' | 'teacherName' | 'status' | 'createdAt'> & {
      createdByRole?: Assessment['createdByRole'];
      teacherName?: string;
      teacherId?: string;
    }
  ) => void;
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
  submitSelfAssessment: (
    data: Omit<TeacherSelfAssessment, 'id' | 'submittedAt'>
  ) => void;
  assignTrainingModule: (
    data: Omit<TeacherTrainingAssignment, 'id' | 'createdAt' | 'status'>
  ) => void;
  updateTrainingAssignmentStatus: (id: string, status: TeacherTrainingAssignment['status']) => void;
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
  deleteTeachingNote: (id: string) => void;
  approveTeachingNote: (id: string, comments: string) => void;
  rejectTeachingNote: (id: string, comments: string) => void;
  createAcademicCalendar: (
    calendar: Omit<AcademicCalendar, 'id' | 'schoolId' | 'status' | 'createdAt' | 'publishedAt'>
  ) => string;
  updateAcademicCalendar: (
    id: string,
    updates: Partial<Omit<AcademicCalendar, 'id' | 'schoolId' | 'createdAt'>>
  ) => void;
  publishAcademicCalendar: (id: string) => void;
  createDeptAnnualLessonPlan: (
    plan: Omit<LessonPlan, 'id' | 'teacherId' | 'teacherName' | 'status' | 'version' | 'createdAt' | 'planType' | 'createdByRole'>
  ) => void;
  updateDeptAnnualLessonPlan: (
    id: string,
    plan: Omit<LessonPlan, 'id' | 'teacherId' | 'teacherName' | 'status' | 'version' | 'createdAt' | 'planType' | 'createdByRole'>
  ) => void;
  deleteLessonPlan: (id: string) => void;
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
  markLessonDelivered: (payload: {
    teachingNoteId: string;
    lessonPlanId?: string;
    graspOutcome: GraspOutcome;
    challengeText?: string;
    postTo: 'hod' | 'community' | 'both' | 'none';
    communityId?: string;
    channelId?: string;
  }) => Promise<void>;
  createCommunityPost: (payload: {
    title: string;
    body: string;
    subject?: string;
    grade?: string;
  }) => Promise<void>;
  replyToCommunityPost: (postId: string, body: string, parentReplyId?: string) => Promise<void>;
  sendStaffMessage: (payload: {
    teacherId: string;
    body: string;
    senderRole: 'teacher' | 'department-head';
  }) => Promise<void>;
  refreshStaffMessages: (params?: { teacherId?: string; departmentId?: string }) => Promise<void>;
  markStaffMessagesRead: (teacherId: string, readerRole: 'teacher' | 'department-head') => void;
  addNotification: (
    title: string,
    description: string,
    type: AppNotification['type'],
    linkPath?: string
  ) => void;
  markNotificationAsRead: (id: string) => void;
  markNotificationAsUnread: (id: string) => void;
  dismissNotification: (id: string) => void;
  clearNotifications: () => void;

  isDataLoading: boolean;
  dataError: string | null;
  /** Browser network status */
  isOnline: boolean;
  /** Where the current in-memory portal data came from */
  dataSource: DataSource;
  /** ISO timestamp of last successful API bootstrap (also stored offline) */
  lastSyncedAt: string | null;
  /** Queued local mutations waiting to sync */
  pendingSyncCount: number;
  refreshFromApi: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    if (typeof window !== 'undefined') {
      return readStoredSession();
    }
    return null;
  });
  const [authReady, setAuthReady] = useState(false);
  const [activeRole, setActiveRoleState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const savedUser = readStoredSession();
      if (savedUser) return savedUser.role;
    }
    return 'login';
  });
  const [activeEngine, setActiveEngineState] = useState<EngineId | null>(() => {
    if (typeof window !== 'undefined') {
      const savedUser = readStoredSession();
      if (savedUser) {
        const allowedEngines = enginesForRole(savedUser.role);
        const storedEngine = readStoredEngine();
        if (storedEngine && isEngineId(storedEngine) && allowedEngines.includes(storedEngine)) {
          return storedEngine;
        }
        return defaultEngineForRole(savedUser.role);
      }
    }
    return null;
  });
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(() => {
    if (typeof window !== 'undefined') {
      return navigator.onLine;
    }
    return true;
  });
  const [dataSource, setDataSource] = useState<DataSource>(() => readOfflineMeta().dataSource);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(
    () => readOfflineMeta().lastSyncedAt,
  );
  const [pendingSyncCount, setPendingSyncCount] = useState(
    () => readOfflineMeta().pendingCount,
  );
  const dataSourceRef = useRef<DataSource>(dataSource);
  useEffect(() => {
    dataSourceRef.current = dataSource;
  }, [dataSource]);

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
  const [lessonDeliveries, setLessonDeliveries] = useState<LessonDelivery[]>([]);
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([]);
  const [communityReplies, setCommunityReplies] = useState<CommunityReply[]>([]);
  const [staffMessages, setStaffMessages] = useState<StaffMessage[]>([]);
  const [teacherSelfAssessments, setTeacherSelfAssessments] =
    useState<TeacherSelfAssessment[]>([]);
  const [teacherTrainingAssignments, setTeacherTrainingAssignments] =
    useState<TeacherTrainingAssignment[]>([]);
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
    setLessonDeliveries(mockLessonDeliveries);
    setCommunityPosts([]);
    setCommunityReplies([]);
    setStaffMessages([]);
    setStudentGradeEntries(mockStudentGradeEntries);
    setTeacherSelfAssessments([]);
    setTeacherTrainingAssignments([]);
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
    setDataSource('mock');
    writeOfflineMeta({ dataSource: 'mock' });
  }, []);

  const applyBootstrapPayload = useCallback((data: BootstrapPayload, source: DataSource) => {
    setSchools(data.schools ?? []);
    setTeachers(data.teachers ?? []);
    setStudents(data.students ?? []);
    setLessonPlans(data.lessonPlans ?? []);
    setAssessments(data.assessments ?? []);
    setAttendance(data.attendance ?? []);
    setTrainings(data.trainings ?? []);
    setCheckIns(data.checkIns ?? []);
    setDepartments(data.departments ?? []);
    setClasses(data.classes ?? []);
    setExams(data.exams ?? []);
    setTrainingMaterials(data.trainingMaterials ?? []);
    setTeachingNotes(data.teachingNotes ?? []);
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
    setTeacherResources(data.teacherResources ?? []);
    setTeacherFeedbacks(data.teacherFeedbacks ?? []);
    setParentMessages(data.parentMessages ?? []);
    setTeacherCheckInPrompts(data.teacherCheckInPrompts ?? []);
    setStudentGradeEntries(data.studentGradeEntries ?? []);
    setLessonDeliveries(data.lessonDeliveries ?? []);
    setCommunityPosts(data.communityPosts ?? []);
    setCommunityReplies(data.communityReplies ?? []);
    setStaffMessages(data.staffMessages ?? []);
    setTeacherSelfAssessments(data.teacherSelfAssessments ?? []);
    setTeacherTrainingAssignments(data.teacherTrainingAssignments ?? []);
    setNotifications((data.notifications ?? []) as AppNotification[]);
    setRegistrationApplications(mockRegistrationApplications);
    setHrEmployees(mockHrEmployees);
    setLeaveRequests(mockLeaveRequests);
    setPayrollRecords(mockPayrollRecords);
    setJobPostings(mockJobPostings);
    setJobApplications(mockJobApplications);
    setPerformanceReviews(mockPerformanceReviews);
    setOnboardingTasks(mockOnboardingTasks);
    setStaffAttendance(mockStaffAttendance);
    setDataSource(source);
    writeOfflineMeta({ dataSource: source });
  }, []);

  const snapshotUserKey = useCallback(() => {
    return currentUser?.email?.toLowerCase() || readStoredSession()?.email?.toLowerCase() || 'anon';
  }, [currentUser]);

  const buildSnapshotPayload = useCallback((): BootstrapPayload => {
    return {
      ...emptyBootstrapPayload(),
      schools,
      departments,
      teachers,
      students,
      classes,
      lessonPlans,
      assessments,
      attendance,
      trainings,
      checkIns,
      exams,
      trainingMaterials,
      teachingNotes,
      academicCalendars,
      studentGradeEntries,
      teacherResources,
      teacherFeedbacks,
      parentMessages,
      teacherCheckInPrompts,
      lessonDeliveries,
      communityPosts,
      communityReplies,
      staffMessages,
      teacherSelfAssessments,
      teacherTrainingAssignments,
      notifications: notifications.map(({ id, title, description, timestamp, read, type }) => ({
        id,
        title,
        description,
        timestamp,
        read,
        type,
      })),
    };
  }, [
    schools,
    departments,
    teachers,
    students,
    classes,
    lessonPlans,
    assessments,
    attendance,
    trainings,
    checkIns,
    exams,
    trainingMaterials,
    teachingNotes,
    academicCalendars,
    studentGradeEntries,
    teacherResources,
    teacherFeedbacks,
    parentMessages,
    teacherCheckInPrompts,
    lessonDeliveries,
    communityPosts,
    communityReplies,
    staffMessages,
    teacherSelfAssessments,
    teacherTrainingAssignments,
    notifications,
  ]);

  const buildSnapshotPayloadRef = useRef(buildSnapshotPayload);
  const snapshotUserKeyRef = useRef(snapshotUserKey);
  
  useEffect(() => {
    buildSnapshotPayloadRef.current = buildSnapshotPayload;
    snapshotUserKeyRef.current = snapshotUserKey;
  }, [buildSnapshotPayload, snapshotUserKey]);

  const persistPortalSnapshot = useCallback(
    async (payload?: BootstrapPayload, syncedAt?: string) => {
      if (dataSourceRef.current === 'mock') return;
      const savedAt = syncedAt ?? new Date().toISOString();
      await saveOfflineSnapshot(
        {
          version: 1,
          savedAt,
          userKey: snapshotUserKeyRef.current(),
          payload: payload ?? buildSnapshotPayloadRef.current(),
        },
        { markSynced: Boolean(syncedAt) },
      );
      if (syncedAt) {
        setLastSyncedAt(syncedAt);
        writeOfflineMeta({ lastSyncedAt: syncedAt });
      }
    },
    [],
  );

  const refreshPendingCount = useCallback(async () => {
    const n = await countOutbox();
    setPendingSyncCount(n);
    writeOfflineMeta({ pendingCount: n });
  }, []);

  const refreshFromApi = useCallback(async () => {
    setIsDataLoading(true);
    const online = isBrowserOnline();
    setIsOnline(online);

    const hydrateFromCache = async (reason: string) => {
      const snap = await loadOfflineSnapshot(snapshotUserKeyRef.current());
      if (snap?.payload) {
        applyBootstrapPayload(snap.payload, 'offline-cache');
        setLastSyncedAt(snap.savedAt);
        writeOfflineMeta({ lastSyncedAt: snap.savedAt, dataSource: 'offline-cache' });
        setDataError(reason);
        await refreshPendingCount();
        return true;
      }
      return false;
    };

    try {
      if (!online) {
        const ok = await hydrateFromCache(
          'Offline — showing the last portal data saved on this device.',
        );
        if (!ok) {
          applyMockFallback();
          setDataError(
            'Offline and no saved portal data on this device. Connect once to download your school data.',
          );
        }
        return;
      }

      const data = await api.bootstrap();
      const syncedAt = new Date().toISOString();
      applyBootstrapPayload(data, 'api');
      setLastSyncedAt(syncedAt);
      setDataError(null);
      await persistPortalSnapshot(data, syncedAt);

      const { flushed, remaining } = await flushOfflineOutbox();
      setPendingSyncCount(remaining);
      if (flushed > 0) {
        try {
          const fresh = await api.bootstrap();
          applyBootstrapPayload(fresh, 'api');
          await persistPortalSnapshot(fresh, new Date().toISOString());
        } catch {
          /* keep post-flush state */
        }
      }
    } catch {
      const ok = await hydrateFromCache(
        'Server unreachable — showing saved portal data from this device.',
      );
      if (!ok) {
        applyMockFallback();
        setDataError(
          'API unavailable — live data could not be loaded. Start the server on port 3004.',
        );
      }
    } finally {
      setIsDataLoading(false);
    }
  }, [applyBootstrapPayload, applyMockFallback, persistPortalSnapshot, refreshPendingCount]);

  useEffect(() => {
    void refreshFromApi();
  }, [refreshFromApi]);

  // Track browser online/offline and sync when connectivity returns
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const onOnline = () => {
      setIsOnline(true);
      void refreshFromApi();
    };
    const onOffline = () => {
      setIsOnline(false);
      if (dataSourceRef.current !== 'mock') {
        void persistPortalSnapshot();
      }
    };

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, [persistPortalSnapshot, refreshFromApi]);

  // Keep IndexedDB snapshot fresh while browsing (skip demo mock data)
  useEffect(() => {
    if (isDataLoading) return;
    if (dataSource === 'mock') return;
    const timer = window.setTimeout(() => {
      void persistPortalSnapshot();
    }, 800);
    return () => window.clearTimeout(timer);
  }, [buildSnapshotPayload, dataSource, isDataLoading, persistPortalSnapshot]);

  // Handle active role sync (legacy — prefer login/logout)
  const setActiveRole = (role: string) => {
    setActiveRoleState(role);
  };

  const login = useCallback((user: AuthUser, remember = true) => {
    setCurrentUser(user);
    setActiveRoleState(user.role);
    setActiveEngineState(defaultEngineForRole(user.role));
    persistSession(user, remember);
    void refreshFromApi();
  }, [refreshFromApi]);

  const logout = useCallback(() => {
    setCurrentUser(null);
    setActiveRoleState('login');
    setActiveEngineState(null);
    clearSession();
  }, []);

  const setEngine = useCallback((engine: EngineId) => {
    setActiveEngineState(engine);
    persistEngine(engine);
  }, []);

  const resolveTeacherId = useCallback(() => {
    if (currentUser?.id && teachers.some((t) => t.id === currentUser.id)) {
      return currentUser.id;
    }
    if (!currentUser?.email) return DEMO_TEACHER_ID;
    const match = teachers.find(
      (t) => t.email.toLowerCase() === currentUser.email.toLowerCase()
    );
    return match?.id ?? DEMO_TEACHER_ID;
  }, [currentUser, teachers]);

  useEffect(() => {
    // Always force light mode — dark mode has been removed
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
      addNotification('Lesson Plan Updated', `Lesson plan "${(lp as LessonPlan).title}" was approved.`, 'success', '/dashboard/teacher/teaching-notes');
    }).catch(() => void refreshFromApi());
  };

  const rejectLessonPlan = (id: string, role: 'dept' | 'school', comments: string) => {
    void api.rejectLessonPlan(id, role, comments).then((lp) => {
      setLessonPlans((prev) => prev.map((p) => (p.id === id ? (lp as LessonPlan) : p)));
      addNotification('Lesson Plan Rejected', `Lesson plan "${(lp as LessonPlan).title}" was rejected.`, 'alert', '/dashboard/teacher/teaching-notes');
    }).catch(() => void refreshFromApi());
  };

  const approveAssessment = (id: string, comments: string) => {
    void api.approveAssessment(id, comments).then((asm) => {
      setAssessments((prev) => prev.map((a) => (a.id === id ? (asm as Assessment) : a)));
      addNotification('Assessment Approved', `Assessment "${(asm as Assessment).title}" approved.`, 'success', '/dashboard/teacher/manage-students');
    }).catch(() => void refreshFromApi());
  };

  const rejectAssessment = (id: string, comments: string) => {
    void api.rejectAssessment(id, comments).then((asm) => {
      setAssessments((prev) => prev.map((a) => (a.id === id ? (asm as Assessment) : a)));
      addNotification('Assessment Draft Rejected', `Assessment "${(asm as Assessment).title}" sent back.`, 'alert', '/dashboard/teacher/assessments');
    }).catch(() => void refreshFromApi());
  };

  const createLessonPlan = (planData: Omit<LessonPlan, 'id' | 'teacherId' | 'teacherName' | 'status' | 'version' | 'createdAt'>) => {
    void api.createLessonPlan({ ...planData, teacherId: resolveTeacherId() }).then((lp) => {
      setLessonPlans((prev) => [lp as LessonPlan, ...prev]);
      addNotification('Lesson Plan Submitted', `Lesson plan "${(lp as LessonPlan).title}" submitted.`, 'info', '/dashboard/department-head/lesson-plans');
    }).catch(() => void refreshFromApi());
  };

  const createAssessment = (
    asmData: Omit<Assessment, 'id' | 'teacherId' | 'teacherName' | 'status' | 'createdAt'> & {
      createdByRole?: Assessment['createdByRole'];
      teacherName?: string;
      teacherId?: string;
    }
  ) => {
    const createdByRole = asmData.createdByRole ?? 'teacher';
    void api
      .createAssessment({
        ...asmData,
        teacherId: asmData.teacherId ?? resolveTeacherId(),
        createdByRole,
        teacherName: asmData.teacherName,
      })
      .then((asm) => {
        setAssessments((prev) => [asm as Assessment, ...prev]);
        const ready = (asm as Assessment).status === 'Approved';
        const isDeptExam = createdByRole === 'department-head';
        addNotification(
          ready
            ? isDeptExam
              ? 'Exam published to teachers'
              : 'Assessment ready'
            : 'Assessment Submitted',
          ready
            ? isDeptExam
              ? `"${(asm as Assessment).title}" is live for subject teachers. They can open it under Assessments and record results in the Gradebook.`
              : `"${(asm as Assessment).title}" is ready to link when recording grades.`
            : `Assessment "${(asm as Assessment).title}" submitted for HoD review.`,
          ready ? 'success' : 'info',
          ready
            ? isDeptExam
              ? '/dashboard/teacher/assessments'
              : '/dashboard/teacher/manage-students'
            : '/dashboard/department-head/assessments',
        );
      })
      .catch(() => void refreshFromApi());
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
    const applyLocal = () => {
      const today = new Date().toISOString().slice(0, 10);
      setAttendance((prev) => {
        const ids = new Set(records.map((r) => r.studentId));
        const without = prev.filter((a) => !(a.date === today && ids.has(a.studentId)));
        const nextRows: Attendance[] = records.map((r, i) => {
          const std = students.find((s) => s.id === r.studentId);
          return {
            id: `att-local-${Date.now()}-${i}`,
            studentId: r.studentId,
            studentName: std?.name ?? 'Student',
            grade: std?.grade ?? '',
            section: std?.section ?? '',
            date: today,
            status: r.status,
            remarks: r.remarks,
          };
        });
        return [...nextRows, ...without];
      });
    };

    if (!isBrowserOnline()) {
      applyLocal();
      void enqueueOutbox('saveAttendance', { records });
      void refreshPendingCount();
      addNotification('Attendance saved offline', `Recorded for ${records.length} students — will sync when online.`, 'info');
      return;
    }

    void api.saveAttendance(records).then(() => {
      void refreshFromApi();
      addNotification('Attendance Logs Recorded', `Attendance recorded for ${records.length} students.`, 'success');
    }).catch(() => {
      applyLocal();
      void enqueueOutbox('saveAttendance', { records });
      void refreshPendingCount();
      addNotification('Attendance saved offline', `Saved on this device — will sync when online.`, 'alert');
    });
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
    // eslint-disable-next-line react-hooks/purity
    const timestamp = Date.now();
    const app: RegistrationApplication = {
      ...appData,
      id: `reg-app-${timestamp}`,
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
    // eslint-disable-next-line react-hooks/purity
    const timestamp = Date.now();
    const employee: HrEmployee = {
      ...employeeData,
      id: `emp-${timestamp}`,
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
    // eslint-disable-next-line react-hooks/purity
    const timestamp = Date.now();
    const request: LeaveRequest = {
      ...requestData,
      id: `leave-${timestamp}`,
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

    // eslint-disable-next-line react-hooks/purity
    const timestamp = Date.now();
    const allowances = Math.round(employee.salary * 0.12);
    const deductions = Math.round(employee.salary * 0.17);
    const record: PayrollRecord = {
      id: `pay-${timestamp}`,
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
    // eslint-disable-next-line react-hooks/purity
    const timestamp = Date.now();
    const posting: JobPosting = {
      ...postingData,
      id: `job-${timestamp}`,
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

  const submitSelfAssessment = (data: Omit<TeacherSelfAssessment, 'id' | 'submittedAt'>) => {
    void api.submitSelfAssessment(data as unknown as Record<string, unknown>).then((sa) => {
      setTeacherSelfAssessments((prev) => [sa as TeacherSelfAssessment, ...prev]);
      addNotification('Self-Assessment Submitted', 'Your STEP self-assessment has been recorded and shared with your HoD.', 'success');
    }).catch(() => void refreshFromApi());
  };

  const assignTrainingModule = (data: Omit<TeacherTrainingAssignment, 'id' | 'createdAt' | 'status'>) => {
    void api.assignTrainingModule(data as unknown as Record<string, unknown>).then((a) => {
      setTeacherTrainingAssignments((prev) => [a as TeacherTrainingAssignment, ...prev]);
      addNotification('Module Assigned', `${data.moduleTitle} assigned.`, 'success');
    }).catch(() => void refreshFromApi());
  };

  const updateTrainingAssignmentStatus = (id: string, status: TeacherTrainingAssignment['status']) => {
    setTeacherTrainingAssignments((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status } : t)),
    );

    if (!isBrowserOnline()) {
      void enqueueOutbox('updateTrainingAssignmentStatus', { id, status });
      void refreshPendingCount();
      return;
    }

    void api.updateTrainingAssignmentStatus(id, status).then((a) => {
      setTeacherTrainingAssignments((prev) => prev.map((t) => (t.id === id ? (a as TeacherTrainingAssignment) : t)));
    }).catch(() => {
      void enqueueOutbox('updateTrainingAssignmentStatus', { id, status });
      void refreshPendingCount();
    });
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

    const body = { ...noteData, id, teacherId, status };
    if (!isBrowserOnline()) {
      void enqueueOutbox('createTeachingNote', body as unknown as Record<string, unknown>);
      void refreshPendingCount();
      return id;
    }

    void api.createTeachingNote(body).then((note) => {
      setTeachingNotes((prev) => [note as TeachingNote, ...prev.filter((n) => n.id !== id)]);
    }).catch(() => {
      void enqueueOutbox('createTeachingNote', body as unknown as Record<string, unknown>);
      void refreshPendingCount();
    });
    return id;
  };

  const updateTeachingNote = (id: string, updates: Partial<TeachingNote>) => {
    const today = new Date().toISOString().slice(0, 10);
    setTeachingNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, ...updates, updatedAt: today } : n)),
    );

    if (!isBrowserOnline()) {
      void enqueueOutbox('updateTeachingNote', { id, updates });
      void refreshPendingCount();
      return;
    }

    void api.updateTeachingNote(id, updates as Record<string, unknown>).then((note) => {
      setTeachingNotes((prev) => prev.map((n) => (n.id === id ? (note as TeachingNote) : n)));
    }).catch(() => {
      void enqueueOutbox('updateTeachingNote', { id, updates });
      void refreshPendingCount();
    });
  };

  const deleteTeachingNote = (id: string) => {
    const note = teachingNotes.find((n) => n.id === id);
    setTeachingNotes((prev) => prev.filter((n) => n.id !== id));

    if (!isBrowserOnline()) {
      void enqueueOutbox('deleteTeachingNote', { id });
      void refreshPendingCount();
      if (note) {
        addNotification('Teaching note deleted', `"${note.title}" removed on this device.`, 'info');
      }
      return;
    }

    void api.deleteTeachingNote(id).then(() => {
      if (note) {
        addNotification('Teaching note deleted', `"${note.title}" was removed.`, 'info');
      }
    }).catch(() => {
      void enqueueOutbox('deleteTeachingNote', { id });
      void refreshPendingCount();
      if (note) {
        addNotification('Deleted offline', `"${note.title}" removed here — will sync when online.`, 'alert');
      }
    });
  };

  const approveTeachingNote = (id: string, comments: string) => {
    const note = teachingNotes.find((n) => n.id === id);
    updateTeachingNote(id, { status: 'Approved', deptComments: comments });
    if (note) {
      addNotification('Lesson Note Approved', `"${note.title}" approved for classroom use.`, 'success', '/dashboard/teacher/teaching-notes');
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
  ): string => {
    // eslint-disable-next-line react-hooks/purity
    const timestamp = Date.now();
    const calendar: AcademicCalendar = {
      ...calendarData,
      id: `cal-${timestamp}`,
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
    return calendar.id;
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

  const updateDeptAnnualLessonPlan = (
    id: string,
    planData: Omit<LessonPlan, 'id' | 'teacherId' | 'teacherName' | 'status' | 'version' | 'createdAt' | 'planType' | 'createdByRole'>,
  ) => {
    const payload = {
      title: planData.title,
      grade: planData.grade,
      subject: planData.subject,
      sessions: planData.sessions,
      objectives: planData.objectives,
      activities: planData.activities,
      assessments: planData.assessments,
      homework: planData.homework,
      planDetail: planData.planDetail ?? '',
    };

    setLessonPlans((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              ...planData,
              status: 'Approved' as const,
              planType: 'yearly' as const,
              createdByRole: 'department-head' as const,
              version: (p.version ?? 1) + 1,
            }
          : p,
      ),
    );

    void api
      .updateDeptAnnualLessonPlan(id, payload)
      .then((lp) => {
        setLessonPlans((prev) => prev.map((p) => (p.id === id ? (lp as LessonPlan) : p)));
        addNotification(
          'Annual Plan Updated',
          `"${(lp as LessonPlan).title}" changes were saved.`,
          'success',
        );
      })
      .catch(() => {
        addNotification(
          'Annual Plan Updated Locally',
          `"${planData.title}" saved on this device — sync when the server is available.`,
          'alert',
        );
      });
  };

  const deleteLessonPlan = (id: string) => {
    const existing = lessonPlans.find((p) => p.id === id);
    setLessonPlans((prev) => prev.filter((p) => p.id !== id));
    void api.deleteLessonPlan(id).then(() => {
      addNotification(
        'Lesson plan deleted',
        existing ? `"${existing.title}" was removed.` : 'Lesson plan deleted.',
        'success',
      );
    }).catch(() => {
      addNotification(
        'Deleted Locally',
        existing
          ? `"${existing.title}" removed here — confirm server sync when online.`
          : 'Lesson plan removed locally.',
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
    const applyLocal = () => {
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
      void enqueueOutbox('upsertGradeEntry', { ...local } as unknown as Record<string, unknown>);
      void refreshPendingCount();
      addNotification(
        entryData.id ? 'Grade Updated' : 'Grade Recorded',
        `${entryData.title} (saved on this device)`,
        isBrowserOnline() ? 'alert' : 'info',
      );
    };

    if (!isBrowserOnline()) {
      applyLocal();
      return;
    }

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
        applyLocal();
      });
  };

  const deleteStudentGradeEntry = (id: string) => {
    const entry = studentGradeEntries.find((e) => e.id === id);
    const applyLocal = () => {
      setStudentGradeEntries((prev) => {
        const next = prev.filter((e) => e.id !== id);
        if (entry) applyGpaFromGradeEntries(entry.studentId, next);
        return next;
      });
      void enqueueOutbox('deleteGradeEntry', { id });
      void refreshPendingCount();
      addNotification('Grade Removed', 'Removed on this device — will sync when online.', 'info');
    };

    if (!isBrowserOnline()) {
      applyLocal();
      return;
    }

    void api.deleteGradeEntry(id).then(() => {
      setStudentGradeEntries((prev) => {
        const next = prev.filter((e) => e.id !== id);
        if (entry) applyGpaFromGradeEntries(entry.studentId, next);
        return next;
      });
      if (entry) void api.recalculateGpa(entry.studentId);
      addNotification('Grade Removed', 'Assessment result deleted.', 'info');
    }).catch(() => {
      applyLocal();
    });
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

  const markLessonDelivered = async (payload: {
    teachingNoteId: string;
    lessonPlanId?: string;
    graspOutcome: GraspOutcome;
    challengeText?: string;
    postTo: 'hod' | 'community' | 'both' | 'none';
    communityId?: string;
    channelId?: string;
  }) => {
    const teacherId = resolveTeacherId();
    const postedToHod = payload.postTo === 'hod' || payload.postTo === 'both';
    const postedToCommunity = payload.postTo === 'community' || payload.postTo === 'both';
    try {
      const result = await api.createLessonDelivery({
        teachingNoteId: payload.teachingNoteId,
        lessonPlanId: payload.lessonPlanId,
        teacherId,
        graspOutcome: payload.graspOutcome,
        challengeText: payload.challengeText,
        postedToHod,
        postedToCommunity,
        communityId: payload.communityId,
        channelId: payload.channelId,
      });
      setLessonDeliveries((prev) => [result.delivery, ...prev.filter((d) => d.id !== result.delivery.id)]);
      if (result.communityPost) {
        setCommunityPosts((prev) => [result.communityPost!, ...prev.filter((p) => p.id !== result.communityPost!.id)]);
      }
      if (result.communityMessage) {
        window.dispatchEvent(
          new CustomEvent('community:channel-message', { detail: result.communityMessage }),
        );
      }
      if (postedToHod) {
        void refreshStaffMessages({ teacherId });
      }
      addNotification(
        'Lesson marked delivered',
        payload.graspOutcome === 'challenged'
          ? postedToCommunity
            ? 'Delivery saved and challenge posted to your community.'
            : 'Delivery saved and challenge shared.'
          : 'Classroom delivery feedback recorded.',
        'success',
        postedToCommunity ? '/dashboard/teacher/communication' : undefined,
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not mark delivered.';
      addNotification('Delivery failed', message, 'alert');
      throw err;
    }
  };

  const createCommunityPost = async (payload: {
    title: string;
    body: string;
    subject?: string;
    grade?: string;
  }) => {
    const teacher = teachers.find((t) => t.id === resolveTeacherId());
    const authorName = teacher?.name ?? currentUser?.displayName ?? 'Teacher';
    const post = await api.createCommunityPost({
      ...payload,
      authorId: resolveTeacherId(),
      authorName,
      authorRole: 'teacher',
      departmentId: teacher?.departmentId,
    });
    setCommunityPosts((prev) => [post, ...prev]);
    addNotification('Posted to community', 'Your challenge is visible to other teachers.', 'success');
  };

  const replyToCommunityPost = async (postId: string, body: string, parentReplyId?: string) => {
    const teacher = teachers.find((t) => t.id === resolveTeacherId());
    const isHod = currentUser?.role === 'department-head';
    const authorName = isHod
      ? currentUser?.displayName ?? 'Department Head'
      : teacher?.name ?? currentUser?.displayName ?? 'Teacher';
    const authorId = isHod ? currentUser?.id ?? 'hod' : resolveTeacherId();
    const reply = await api.createCommunityReply(postId, {
      body,
      parentReplyId,
      authorId,
      authorName,
      authorRole: isHod ? 'department-head' : 'teacher',
    });
    setCommunityReplies((prev) => [...prev, reply]);
  };

  const refreshStaffMessages = async (params?: { teacherId?: string; departmentId?: string }) => {
    try {
      const messages = await api.getStaffMessages(params);
      setStaffMessages((prev) => {
        const byId = new Map(prev.map((m) => [m.id, m]));
        for (const m of messages) byId.set(m.id, m);
        return [...byId.values()].sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );
      });
    } catch {
      /* keep existing */
    }
  };

  const sendStaffMessage = async (payload: {
    teacherId: string;
    body: string;
    senderRole: 'teacher' | 'department-head';
  }) => {
    const teacher = teachers.find((t) => t.id === payload.teacherId);
    const senderName =
      payload.senderRole === 'department-head'
        ? currentUser?.displayName ?? 'Department Head'
        : teacher?.name ?? currentUser?.displayName ?? 'Teacher';
    const senderId =
      payload.senderRole === 'department-head'
        ? currentUser?.id ?? 'hod'
        : resolveTeacherId();
    const msg = await api.sendStaffMessage({
      teacherId: payload.teacherId,
      departmentId: teacher?.departmentId ?? currentUser?.departmentId,
      senderId,
      senderName,
      senderRole: payload.senderRole,
      body: payload.body,
    });
    setStaffMessages((prev) => [...prev.filter((m) => m.id !== msg.id), msg]);
  };

  const markStaffMessagesRead = (teacherId: string, readerRole: 'teacher' | 'department-head') => {
    void api
      .markStaffMessagesRead(teacherId, readerRole)
      .then(() => {
        const opposite = readerRole === 'teacher' ? 'department-head' : 'teacher';
        setStaffMessages((prev) =>
          prev.map((m) =>
            m.teacherId === teacherId && m.senderRole === opposite ? { ...m, read: true } : m,
          ),
        );
      })
      .catch(() => {
        /* API unreachable — keep local unread state; avoid crashing the messages tab */
      });
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

  const addNotification = (
    title: string,
    description: string,
    type: AppNotification['type'],
    linkPath?: string
  ) => {
    toast({ title, description, variant: type });
    void api.createNotification(title, description, type, linkPath).then((notif) => {
      setNotifications((prev) => [notif as AppNotification, ...prev]);
    }).catch(() => {
      const newNotif: AppNotification = {
        id: `not-gen-${Math.random().toString(36).slice(2, 11)}`,
        title,
        description,
        timestamp: 'Just now',
        read: false,
        type,
        linkPath,
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
        activeEngine,
        setEngine,
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
        lessonDeliveries,
        communityPosts,
        communityReplies,
        staffMessages,
        teacherSelfAssessments,
        teacherTrainingAssignments,
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
        submitSelfAssessment,
        assignTrainingModule,
        updateTrainingAssignmentStatus,
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
        deleteTeachingNote,
        approveTeachingNote,
        rejectTeachingNote,
        createAcademicCalendar,
        updateAcademicCalendar,
        publishAcademicCalendar,
        createDeptAnnualLessonPlan,
        updateDeptAnnualLessonPlan,
        deleteLessonPlan,
        upsertStudentGradeEntry,
        deleteStudentGradeEntry,
        recalculateStudentGpaFromGrades,
        addTeacherResource,
        respondToTeacherCheckIn,
        sendParentMessage,
        addStudentFeedback,
        markLessonDelivered,
        createCommunityPost,
        replyToCommunityPost,
        sendStaffMessage,
        refreshStaffMessages,
        markStaffMessagesRead,
        addNotification,
        markNotificationAsRead,
        markNotificationAsUnread,
        dismissNotification,
        clearNotifications,
        isDataLoading,
        dataError,
        isOnline,
        dataSource,
        lastSyncedAt,
        pendingSyncCount,
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
