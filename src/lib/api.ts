const API_BASE =
  typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_URL
    ? process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '')
    : 'http://localhost:3004';

export function getApiBase() {
  return API_BASE;
}

export const MOE_DOCUMENT_CATEGORIES = [
  'Policy', 'Syllabus', 'Curriculum Framework', 'Text Books', 'Teachers Guide',
  'Training Manuals', 'Compliance Checklist', 'Directives', 'SOP',
  'Assessment Blueprint', 'Exam Guideline', 'Annual Performance Report',
  'Audit and Inspection Reports', 'Budget Allocation',
] as const;
export const MOE_DOCUMENT_AUDIENCES = ['All', 'Regional', 'Woredas', 'Schools'] as const;

export interface MoeDocument {
  id: string;
  title: string;
  category: (typeof MOE_DOCUMENT_CATEGORIES)[number];
  audience: (typeof MOE_DOCUMENT_AUDIENCES)[number];
  fileUrl: string;
  fileName: string;
  fileSize: number | null;
  uploadedBy: string | null;
  uploadedByName: string | null;
  createdAt: string;
}

export const LEADERSHIP_ACTION_SEVERITIES = ['Low', 'Medium', 'High', 'Critical'] as const;
export const LEADERSHIP_ACTION_STATUSES = ['open', 'in_progress', 'resolved'] as const;

export interface LeadershipAction {
  id: string;
  schoolId: string;
  category: 'exception' | 'improvement_initiative';
  issue: string;
  evidence?: string;
  source?: string;
  severity: (typeof LEADERSHIP_ACTION_SEVERITIES)[number];
  owner?: string;
  decisionRequired?: string;
  recommendedAction?: string;
  dueDate?: string;
  status: (typeof LEADERSHIP_ACTION_STATUSES)[number];
  progressPercent?: number;
  createdBy?: string;
  createdByName?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface SchoolResource {
  id: string;
  schoolId: string;
  title: string;
  description?: string;
  url: string;
  grade?: string;
  subject?: string;
  addedBy?: string;
  addedByName?: string;
  createdAt: string;
}

export const COMPLIANCE_STATUS_VALUES = ['Not Started', 'In Progress', 'Submitted', 'Verified', 'Rejected'] as const;

export interface ComplianceRequirement {
  id: string;
  title: string;
  description?: string;
  authority: string;
  dueDate?: string;
  evidenceRequired?: string;
  audience: (typeof MOE_DOCUMENT_AUDIENCES)[number];
  createdBy?: string;
  createdByName?: string;
  createdAt: string;
}

export interface SchoolComplianceStatus {
  id: string | null;
  requirementId: string;
  schoolId: string;
  status: (typeof COMPLIANCE_STATUS_VALUES)[number];
  responsiblePerson?: string;
  evidenceSubmittedUrl?: string;
  evidenceSubmittedAt?: string;
  outstandingIssue?: string;
  verifiedBy?: string;
  verifiedByName?: string;
  verifiedAt?: string;
  verificationNote?: string;
  updatedAt: string;
  requirementTitle?: string;
  requirementAuthority?: string;
  requirementDueDate?: string;
  requirementEvidenceRequired?: string;
}

export const MOE_THREAD_STATUSES = ['open', 'awaiting_moe', 'awaiting_school', 'resolved', 'closed'] as const;

export interface MoeMessageThread {
  id: string;
  referenceNumber: string;
  schoolId: string;
  subject: string;
  status: (typeof MOE_THREAD_STATUSES)[number];
  createdBy?: string;
  createdByName?: string;
  createdAt: string;
  lastMessageAt: string;
  schoolLastReadAt: string;
  moeLastReadAt?: string;
}

export interface MoeThreadMessage {
  id: string;
  threadId: string;
  senderUserId?: string;
  senderRole: 'school-head' | 'moe';
  senderName: string;
  body: string;
  createdAt: string;
}

export type TeacherReplacementReason = 'resignation' | 'transfer' | 'retirement' | 'other';
export type TeacherReplacementStatus = 'pending' | 'under_review' | 'assigned' | 'rejected' | 'cancelled';

export interface TeacherReplacementRequest {
  id: string;
  schoolId: string;
  departingTeacherId: string;
  departureDate: string;
  reason: TeacherReplacementReason;
  subjectsNeeded: string[];
  gradeLevelsNeeded: string[];
  notes: string | null;
  status: TeacherReplacementStatus;
  assignedTeacherId: string | null;
  moeReviewedBy: string | null;
  moeNotes: string | null;
  moeThreadId: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  schoolName?: string;
  departingTeacherName?: string;
  assignedTeacherName?: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const REQUEST_TIMEOUT_MS = 8000;

function authHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    const raw =
      localStorage.getItem('pts-session') ?? sessionStorage.getItem('pts-session');
    if (!raw) return {};
    const user = JSON.parse(raw) as { id?: string; token?: string };
    const headers: Record<string, string> = {};
    if (user?.token) headers.Authorization = `Bearer ${user.token}`;
    if (user?.id) headers['x-user-id'] = user.id;
    return headers;
  } catch {
    return {};
  }
}

export async function request<T>(
  path: string,
  init?: RequestInit,
  timeoutMs: number = REQUEST_TIMEOUT_MS,
): Promise<T> {
  const res = await fetch(`${API_BASE}/api${path}`, {
    ...init,
    signal: AbortSignal.timeout(timeoutMs),
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...init?.headers,
    },
  });
  if (!res.ok) {
    let message = res.statusText;
    let body: unknown;
    try {
      body = await res.json();
      if (body && typeof body === 'object' && 'error' in body && typeof body.error === 'string') {
        message = body.error;
      }
    } catch {
      /* ignore */
    }
    throw new ApiError(message, res.status, body);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

const UPLOAD_TIMEOUT_MS = 900_000; // 15 min — large uploads up to 150MB

export interface UploadResult {
  url: string;
  filename: string;
  originalName: string;
  size: number;
}

async function uploadFileRaw(file: File): Promise<UploadResult> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE}/api/uploads`, {
    method: 'POST',
    body: formData,
    headers: authHeaders(),
    signal: AbortSignal.timeout(UPLOAD_TIMEOUT_MS),
  });
  if (!res.ok) {
    let message = res.statusText;
    let body: unknown;
    try {
      body = await res.json();
      if (body && typeof body === 'object' && 'error' in body && typeof body.error === 'string') {
        message = body.error;
      }
    } catch {
      /* ignore */
    }
    throw new ApiError(message, res.status, body);
  }
  return (await res.json()) as UploadResult;
}

export async function uploadFile(file: File): Promise<string> {
  const result = await uploadFileRaw(file);
  return result.url;
}

/** Same upload endpoint as uploadFile(), but returns the full result (original
 * filename, size) for features that need to persist a real document record
 * rather than just a bare URL. */
export async function uploadFileWithMeta(file: File): Promise<UploadResult> {
  return uploadFileRaw(file);
}

export interface BootstrapPayload {
  schools: import('@/lib/mockData').School[];
  regions: import('@/lib/mockData').Region[];
  departments: import('@/lib/mockData').Department[];
  teachers: import('@/lib/mockData').Teacher[];
  students: import('@/lib/mockData').Student[];
  classes: import('@/lib/mockData').SchoolClass[];
  lessonPlans: import('@/lib/mockData').LessonPlan[];
  assessments: import('@/lib/mockData').Assessment[];
  attendance: import('@/lib/mockData').Attendance[];
  trainings: import('@/lib/mockData').TeacherTraining[];
  checkIns: import('@/lib/mockData').SchoolCheckIn[];
  exams: import('@/lib/mockData').ExamPaper[];
  trainingMaterials: import('@/lib/mockData').TrainingMaterial[];
  trainingPlans: import('@/lib/mockData').TrainingPlan[];
  trainingPlanAssignments: import('@/lib/mockData').TrainingPlanAssignment[];
  teachingNotes: import('@/lib/mockData').TeachingNote[];
  academicCalendars: import('@/lib/mockData').AcademicCalendar[];
  moeCalendar: import('@/lib/mockData').MoeCalendarDraft | null;
  studentGradeEntries: import('@/lib/mockData').StudentGradeEntry[];
  teacherResources: import('@/lib/mockData').TeacherResource[];
  teacherFeedbacks: import('@/lib/mockData').TeacherFeedback[];
  parentMessages: import('@/lib/mockData').ParentMessage[];
  teacherCheckInPrompts: import('@/lib/mockData').TeacherCheckInPrompt[];
  lessonDeliveries: import('@/lib/mockData').LessonDelivery[];
  communityPosts: import('@/lib/mockData').CommunityPost[];
  communityReplies: import('@/lib/mockData').CommunityReply[];
  staffMessages: import('@/lib/mockData').StaffMessage[];
  teacherSelfAssessments: import('@/lib/mockData').TeacherSelfAssessment[];
  teacherTrainingAssignments: import('@/lib/mockData').TeacherTrainingAssignment[];
  hrEmployees: import('@/lib/hrPortal').HrEmployee[];
  leaveRequests: import('@/lib/hrPortal').LeaveRequest[];
  payrollRecords: import('@/lib/hrPortal').PayrollRecord[];
  jobPostings: import('@/lib/hrPortal').JobPosting[];
  jobApplications: import('@/lib/hrPortal').JobApplication[];
  performanceReviews: import('@/lib/hrPortal').PerformanceReview[];
  onboardingTasks: import('@/lib/hrPortal').OnboardingTask[];
  staffAttendance: import('@/lib/hrPortal').StaffAttendanceRecord[];
  notifications: {
    id: string;
    title: string;
    description: string;
    timestamp: string;
    read: boolean;
    type: 'info' | 'alert' | 'success' | 'request';
  }[];
}

export interface LoginResult {
  id: string;
  email: string;
  role: import('@/lib/auth').PortalRole;
  displayName: string;
  subject?: string;
  departmentId?: string;
  schoolId?: string | null;
  linkedStudentId?: string | null;
  linkedParentId?: string | null;
  permissions?: string[];
  token?: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  displayName: string;
  role: import('@/lib/auth').PortalRole;
}

export const api = {
  health: () => request<{ ok: boolean }>('/health'),
  bootstrap: () => request<BootstrapPayload>('/bootstrap', undefined, 45_000),
  login: (email: string, password: string) =>
    request<LoginResult>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  register: (body: RegisterPayload) =>
    request<LoginResult>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  updateSchool: (id: string, body: Record<string, unknown>) =>
    request(`/schools/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  listRegions: () => request<{ id: string; name: string }[]>('/regions'),
  createRegion: (name: string) =>
    request<{ id: string; name: string }>('/regions', { method: 'POST', body: JSON.stringify({ name }) }),
  updateRegion: (id: string, name: string) =>
    request<{ id: string; name: string }>(`/regions/${id}`, { method: 'PATCH', body: JSON.stringify({ name }) }),
  connectSchool: (body: Record<string, unknown>) =>
    request('/schools/connect', { method: 'POST', body: JSON.stringify(body) }),
  updateSchoolIntegrationStatus: (id: string, status: 'Active' | 'Suspended') =>
    request(`/schools/${id}/integration-status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  listMoeDocuments: (filters?: { category?: string; audience?: string; search?: string }) => {
    const params = new URLSearchParams();
    if (filters?.category) params.set('category', filters.category);
    if (filters?.audience) params.set('audience', filters.audience);
    if (filters?.search) params.set('search', filters.search);
    const qs = params.toString();
    return request<MoeDocument[]>(`/moe-documents${qs ? `?${qs}` : ''}`);
  },
  uploadMoeDocument: (body: { title: string; category: string; audience: string; fileUrl: string; fileName: string; fileSize: number }) =>
    request<MoeDocument>('/moe-documents', { method: 'POST', body: JSON.stringify(body) }),
  deleteMoeDocument: (id: string) => request(`/moe-documents/${id}`, { method: 'DELETE' }),
  listLeadershipActions: (filters?: { schoolId?: string; category?: 'exception' | 'improvement_initiative' }) => {
    const params = new URLSearchParams();
    if (filters?.schoolId) params.set('schoolId', filters.schoolId);
    if (filters?.category) params.set('category', filters.category);
    const qs = params.toString();
    return request<LeadershipAction[]>(`/leadership-actions${qs ? `?${qs}` : ''}`);
  },
  createLeadershipAction: (body: Partial<LeadershipAction> & { issue: string }) =>
    request<LeadershipAction>('/leadership-actions', { method: 'POST', body: JSON.stringify(body) }),
  updateLeadershipAction: (id: string, body: Partial<LeadershipAction>) =>
    request<LeadershipAction>(`/leadership-actions/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  listSchoolResources: (schoolId?: string) => {
    const qs = schoolId ? `?schoolId=${encodeURIComponent(schoolId)}` : '';
    return request<SchoolResource[]>(`/school-resources${qs}`);
  },
  createSchoolResource: (body: { title: string; url: string; description?: string; grade?: string; subject?: string; schoolId?: string }) =>
    request<SchoolResource>('/school-resources', { method: 'POST', body: JSON.stringify(body) }),
  deleteSchoolResource: (id: string) => request(`/school-resources/${id}`, { method: 'DELETE' }),
  listComplianceRequirements: () => request<ComplianceRequirement[]>('/compliance-requirements'),
  createComplianceRequirement: (body: {
    title: string; authority: string; description?: string; dueDate?: string; evidenceRequired?: string; audience?: string;
  }) => request<ComplianceRequirement>('/compliance-requirements', { method: 'POST', body: JSON.stringify(body) }),
  deleteComplianceRequirement: (id: string) => request(`/compliance-requirements/${id}`, { method: 'DELETE' }),
  listComplianceStatus: (schoolId?: string) => {
    const qs = schoolId ? `?schoolId=${encodeURIComponent(schoolId)}` : '';
    return request<SchoolComplianceStatus[]>(`/compliance-status${qs}`);
  },
  updateComplianceStatus: (body: {
    requirementId: string; schoolId?: string; status?: string; responsiblePerson?: string;
    evidenceSubmittedUrl?: string; outstandingIssue?: string;
  }) => request<SchoolComplianceStatus>('/compliance-status', { method: 'POST', body: JSON.stringify(body) }),
  verifyComplianceStatus: (id: string, body: { status: 'Verified' | 'Rejected'; verificationNote?: string }) =>
    request<SchoolComplianceStatus>(`/compliance-status/${id}/verify`, { method: 'PATCH', body: JSON.stringify(body) }),
  listMoeMessageThreads: (schoolId?: string) => {
    const qs = schoolId ? `?schoolId=${encodeURIComponent(schoolId)}` : '';
    return request<MoeMessageThread[]>(`/moe-message-threads${qs}`);
  },
  createMoeMessageThread: (body: { subject: string; body: string; schoolId?: string }) =>
    request<MoeMessageThread>('/moe-message-threads', { method: 'POST', body: JSON.stringify(body) }),
  listMoeThreadMessages: (threadId: string) => request<MoeThreadMessage[]>(`/moe-message-threads/${threadId}/messages`),
  sendMoeThreadMessage: (threadId: string, body: string) =>
    request<MoeThreadMessage>(`/moe-message-threads/${threadId}/messages`, { method: 'POST', body: JSON.stringify({ body }) }),
  updateMoeMessageThread: (threadId: string, body: { status?: string; markRead?: boolean }) =>
    request<MoeMessageThread>(`/moe-message-threads/${threadId}`, { method: 'PATCH', body: JSON.stringify(body) }),
  changePassword: (currentPassword: string, newPassword: string) =>
    request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
  listSessions: () => request('/auth/sessions'),
  revokeSession: (id: string) => request(`/auth/sessions/${id}`, { method: 'DELETE' }),
  revokeOtherSessions: () => request('/auth/sessions/revoke-others', { method: 'POST' }),
  getSchoolIntegrations: (schoolId: string) => request(`/schools/${schoolId}/integrations`),
  updateSchoolIntegration: (schoolId: string, type: string, body: Record<string, unknown>) =>
    request(`/schools/${schoolId}/integrations/${type}`, { method: 'PUT', body: JSON.stringify(body) }),
  downloadSchoolDataExport: async (schoolId: string) => {
    const res = await fetch(`${API_BASE}/api/schools/${schoolId}/data-export`, {
      headers: { ...authHeaders() },
    });
    if (!res.ok) throw new ApiError(res.statusText, res.status);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `school-${schoolId}-export.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },
  createTeacher: (body: Record<string, unknown>) =>
    request('/teachers', { method: 'POST', body: JSON.stringify(body) }),
  updateTeacher: (id: string, body: Record<string, unknown>) =>
    request(`/teachers/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  toggleTeacherStatus: (id: string) =>
    request(`/teachers/${id}/toggle-status`, { method: 'PATCH' }),
  listTeacherReplacementRequests: (query: { status?: string } = {}) => {
    const qs = query.status ? `?status=${encodeURIComponent(query.status)}` : '';
    return request<TeacherReplacementRequest[]>(`/teacher-replacement-requests${qs}`);
  },
  createTeacherReplacementRequest: (body: {
    departingTeacherId: string;
    departureDate: string;
    reason: 'resignation' | 'transfer' | 'retirement' | 'other';
    subjectsNeeded?: string[];
    gradeLevelsNeeded?: string[];
    notes?: string;
    schoolId?: string;
  }) =>
    request<TeacherReplacementRequest>('/teacher-replacement-requests', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  assignTeacherReplacement: (id: string, body: { assignedTeacherId: string; moeNotes?: string }) =>
    request<TeacherReplacementRequest>(`/teacher-replacement-requests/${id}/assign`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  rejectTeacherReplacement: (id: string, body: { moeNotes: string }) =>
    request<TeacherReplacementRequest>(`/teacher-replacement-requests/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  createHrEmployee: (body: Record<string, unknown>) =>
    request('/hr/employees', { method: 'POST', body: JSON.stringify(body) }),
  updateHrEmployee: (id: string, body: Record<string, unknown>) =>
    request(`/hr/employees/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  toggleHrEmployeeStatus: (id: string) =>
    request(`/hr/employees/${id}/toggle-status`, { method: 'PATCH' }),
  submitLeaveRequest: (body: Record<string, unknown>) =>
    request('/hr/leave-requests', { method: 'POST', body: JSON.stringify(body) }),
  reviewLeaveRequest: (id: string, status: string, reviewerNotes?: string) =>
    request(`/hr/leave-requests/${id}/review`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reviewerNotes }),
    }),
  processPayroll: (employeeId: string, month: string) =>
    request('/hr/payroll/process', { method: 'POST', body: JSON.stringify({ employeeId, month }) }),
  updatePayrollStatus: (id: string, status: string) =>
    request(`/hr/payroll/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  createJobPosting: (body: Record<string, unknown>) =>
    request('/hr/job-postings', { method: 'POST', body: JSON.stringify(body) }),
  updateJobPosting: (id: string, body: Record<string, unknown>) =>
    request(`/hr/job-postings/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  updateJobApplication: (id: string, status: string, notes?: string) =>
    request(`/hr/job-applications/${id}`, { method: 'PATCH', body: JSON.stringify({ status, notes }) }),
  createPerformanceReview: (body: Record<string, unknown>) =>
    request('/hr/performance-reviews', { method: 'POST', body: JSON.stringify(body) }),
  updatePerformanceReview: (id: string, body: Record<string, unknown>) =>
    request(`/hr/performance-reviews/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  createOnboardingTask: (body: Record<string, unknown>) =>
    request('/hr/onboarding-tasks', { method: 'POST', body: JSON.stringify(body) }),
  toggleOnboardingTask: (id: string) =>
    request(`/hr/onboarding-tasks/${id}/toggle`, { method: 'PATCH' }),
  recordStaffAttendance: (body: Record<string, unknown>) =>
    request('/hr/attendance', { method: 'POST', body: JSON.stringify(body) }),
  createStudent: (body: Record<string, unknown>) =>
    request('/students', { method: 'POST', body: JSON.stringify(body) }),
  updateStudent: (id: string, body: Record<string, unknown>) =>
    request(`/students/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  createLessonPlan: (body: Record<string, unknown>) =>
    request('/lesson-plans', { method: 'POST', body: JSON.stringify(body) }),
  createTeacherLessonAdjustment: (body: Record<string, unknown>) =>
    request('/teacher-lesson-adjustments', { method: 'POST', body: JSON.stringify(body) }),
  listMyTeacherLessonAdjustments: () => request('/teacher-lesson-adjustments/mine'),
  approveLessonPlan: (id: string, role: 'dept' | 'school', comments: string) =>
    request(`/lesson-plans/${id}/approve`, {
      method: 'PATCH',
      body: JSON.stringify({ role, comments }),
    }),
  rejectLessonPlan: (id: string, role: 'dept' | 'school', comments: string) =>
    request(`/lesson-plans/${id}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ role, comments }),
    }),
  updateLessonPlan: (
    id: string,
    body: { title: string; objectives: string[]; sessions: number; homework: string; planDetail?: string }
  ) =>
    request(`/lesson-plans/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteLessonPlan: (id: string) =>
    request(`/lesson-plans/${id}`, { method: 'DELETE' }),
  updateDeptAnnualLessonPlan: (id: string, body: Record<string, unknown>) =>
    request(`/lesson-plans/${id}/annual`, { method: 'PATCH', body: JSON.stringify(body) }),
  createAssessment: (body: Record<string, unknown>) =>
    request('/assessments', { method: 'POST', body: JSON.stringify(body) }),
  updateAssessment: (id: string, body: { questions: unknown[] }) =>
    request(`/assessments/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  approveAssessment: (id: string, comments: string) =>
    request(`/assessments/${id}/approve`, {
      method: 'PATCH',
      body: JSON.stringify({ comments }),
    }),
  rejectAssessment: (id: string, comments: string) =>
    request(`/assessments/${id}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ comments }),
    }),
  saveAttendance: (
    records: { studentId: string; status: string; remarks?: string }[],
    timetableSlotId?: string,
  ) =>
    request('/attendance/batch', {
      method: 'POST',
      body: JSON.stringify({ records, timetableSlotId }),
    }),
  createDepartment: (name: string, headName: string) =>
    request('/departments', {
      method: 'POST',
      body: JSON.stringify({ name, headName }),
    }),
  createClass: (body: Record<string, unknown>) =>
    request('/classes', { method: 'POST', body: JSON.stringify(body) }),
  approveExam: (id: string, comments: string) =>
    request(`/exams/${id}/approve`, {
      method: 'PATCH',
      body: JSON.stringify({ comments }),
    }),
  rejectExam: (id: string, comments: string) =>
    request(`/exams/${id}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ comments }),
    }),
  createTrainingMaterial: (body: {
    title: string;
    description?: string;
    resourceUrl: string;
    category: string;
    audience?: string;
    trainingType?: string;
    departmentId?: string;
    grade?: string;
    subject?: string;
  }) =>
    request('/training-materials', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  disseminateTrainingMaterial: (id: string) =>
    request(`/training-materials/${id}/disseminate`, { method: 'PATCH' }),
  createTrainingPlan: (body: {
    title: string;
    description?: string;
    type: string;
    category?: string;
    audience?: string;
    startDate: string;
    endDate?: string;
    location?: string;
    facilitator?: string;
    createdByName: string;
  }) =>
    request('/training-plans', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  updateTrainingPlan: (id: string, body: Record<string, unknown>) =>
    request(`/training-plans/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  assignTrainingPlan: (
    planId: string,
    body: { targetType: 'teacher' | 'department'; teacherId?: string; departmentId?: string; assignedByName: string }
  ) =>
    request(`/training-plans/${planId}/assignments`, { method: 'POST', body: JSON.stringify(body) }),
  removeTrainingPlanAssignment: (id: string) =>
    request(`/training-plan-assignments/${id}`, { method: 'DELETE' }),
  updateTrainingPlanAssignment: (id: string, body: { attended?: boolean; impactRating?: number; impactNotes?: string }) =>
    request(`/training-plan-assignments/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  createCheckIn: (body: Record<string, unknown>) =>
    request('/check-ins', { method: 'POST', body: JSON.stringify(body) }),
  submitSelfAssessment: (body: Record<string, unknown>) =>
    request('/teacher-self-assessments', { method: 'POST', body: JSON.stringify(body) }),
  assignTrainingModule: (body: Record<string, unknown>) =>
    request('/teacher-training-assignments', { method: 'POST', body: JSON.stringify(body) }),
  updateTrainingAssignmentStatus: (id: string, status: string) =>
    request(`/teacher-training-assignments/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  updateTrainingAssignmentProgress: (id: string, progress: Record<string, unknown>) =>
    request(`/teacher-training-assignments/${id}/progress`, { method: 'PATCH', body: JSON.stringify(progress) }),
  listMyTrainingAssignments: () => request('/teacher-training-assignments/mine'),
  createTeachingNote: (body: Record<string, unknown>) =>
    request('/teaching-notes', { method: 'POST', body: JSON.stringify(body) }),
  updateTeachingNote: (id: string, body: Record<string, unknown>) =>
    request(`/teaching-notes/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteTeachingNote: (id: string) =>
    request<void>(`/teaching-notes/${id}`, { method: 'DELETE' }),
  createAcademicCalendar: (body: Record<string, unknown>) =>
    request('/academic-calendars', { method: 'POST', body: JSON.stringify(body) }),
  publishAcademicCalendar: (id: string) =>
    request(`/academic-calendars/${id}/publish`, { method: 'PATCH' }),
  upsertGradeEntry: (body: Record<string, unknown>) =>
    request('/grade-entries', { method: 'POST', body: JSON.stringify(body) }),
  deleteGradeEntry: (id: string) =>
    request(`/grade-entries/${id}`, { method: 'DELETE' }),
  recalculateGpa: (studentId: string) =>
    request<{ gpa: number }>(`/students/${studentId}/recalculate-gpa`, { method: 'POST' }),
  createTeacherResource: (body: Record<string, unknown>) =>
    request('/teacher-resources', { method: 'POST', body: JSON.stringify(body) }),
  listMyTeacherResources: () => request('/teacher-resources/mine'),
  listPendingTeacherResources: () => request('/teacher-resources/pending'),
  approveTeacherResource: (id: string, comment?: string) =>
    request(`/teacher-resources/${id}/approve`, {
      method: 'PATCH',
      body: JSON.stringify({ comment }),
    }),
  rejectTeacherResource: (id: string, comment?: string) =>
    request(`/teacher-resources/${id}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ comment }),
    }),
  removeTeacherResource: (id: string, comment?: string) =>
    request(`/teacher-resources/${id}/remove`, {
      method: 'PATCH',
      body: JSON.stringify({ comment }),
    }),
  sendParentMessage: (body: Record<string, unknown>) =>
    request('/parent-messages', { method: 'POST', body: JSON.stringify(body) }),
  addTeacherFeedback: (body: Record<string, unknown>) =>
    request('/teacher-feedbacks', { method: 'POST', body: JSON.stringify(body) }),
  respondCheckIn: (id: string, response: string) =>
    request(`/teacher-check-in-prompts/${id}/respond`, {
      method: 'PATCH',
      body: JSON.stringify({ response }),
    }),
  createNotification: (title: string, description: string, type: string, linkPath?: string, scope?: 'self' | 'school') =>
    request('/notifications', {
      method: 'POST',
      body: JSON.stringify({ title, description, type, linkPath, scope }),
    }),
  markNotificationRead: (id: string) =>
    request(`/notifications/${id}/read`, { method: 'PATCH' }),
  clearNotifications: () => request('/notifications', { method: 'DELETE' }),

  createLessonDelivery: (body: Record<string, unknown>) =>
    request<{
      delivery: import('@/lib/mockData').LessonDelivery;
      communityPost: import('@/lib/mockData').CommunityPost | null;
      communityMessage: import('@/lib/communityTypes').CommunityMessage | null;
    }>('/lesson-deliveries', { method: 'POST', body: JSON.stringify(body) }),
  getCommunityFeed: () =>
    request<{
      posts: import('@/lib/mockData').CommunityPost[];
      replies: import('@/lib/mockData').CommunityReply[];
    }>('/community/posts'),
  createCommunityPost: (body: Record<string, unknown>) =>
    request<import('@/lib/mockData').CommunityPost>('/community/posts', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  createCommunityReply: (postId: string, body: Record<string, unknown>) =>
    request<import('@/lib/mockData').CommunityReply>(`/community/posts/${postId}/replies`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  // Discord-style teacher communities
  listCommunities: () =>
    request<import('@/lib/communityTypes').Community[]>('/communities'),
  createCommunity: (body: {
    name: string;
    description?: string;
    type?: string;
    departmentId?: string;
    iconUrl?: string;
  }) =>
    request<import('@/lib/communityTypes').Community>('/communities', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  listCommunityChannels: (communityId: string) =>
    request<import('@/lib/communityTypes').CommunityChannel[]>(
      `/communities/${communityId}/channels`,
    ),
  createCommunityChannel: (
    communityId: string,
    body: { name: string; description?: string; type?: string },
  ) =>
    request<import('@/lib/communityTypes').CommunityChannel>(
      `/communities/${communityId}/channels`,
      { method: 'POST', body: JSON.stringify(body) },
    ),
  listCommunityMembers: (communityId: string) =>
    request<import('@/lib/communityTypes').CommunityMember[]>(
      `/communities/${communityId}/members`,
    ),
  getChannelMessages: (channelId: string, params?: { limit?: number; before?: string }) => {
    const q = new URLSearchParams();
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.before) q.set('before', params.before);
    const qs = q.toString();
    return request<{
      messages: import('@/lib/communityTypes').CommunityMessage[];
      hasMore: boolean;
    }>(`/channels/${channelId}/messages${qs ? `?${qs}` : ''}`);
  },
  postChannelMessage: (
    channelId: string,
    body: { content: string; parentMessageId?: string },
  ) =>
    request<import('@/lib/communityTypes').CommunityMessage>(
      `/channels/${channelId}/messages`,
      { method: 'POST', body: JSON.stringify(body) },
    ),
  markChannelRead: (channelId: string) =>
    request<{ ok: boolean }>(`/channels/${channelId}/read`, { method: 'POST' }),
  startMessageThread: (messageId: string, body?: { title?: string }) =>
    request<import('@/lib/communityTypes').CommunityThread>(
      `/messages/${messageId}/thread`,
      { method: 'POST', body: JSON.stringify(body ?? {}) },
    ),
  getCommunityThread: (threadId: string) =>
    request<import('@/lib/communityTypes').CommunityThread>(`/threads/${threadId}`),
  getCommunityThreadMessages: (
    threadId: string,
    params?: { limit?: number; before?: string },
  ) => {
    const q = new URLSearchParams();
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.before) q.set('before', params.before);
    const qs = q.toString();
    return request<{
      thread: import('@/lib/communityTypes').CommunityThread;
      rootMessage: import('@/lib/communityTypes').CommunityMessage | null;
      messages: import('@/lib/communityTypes').CommunityMessage[];
      hasMore: boolean;
    }>(`/threads/${threadId}/messages${qs ? `?${qs}` : ''}`);
  },
  postCommunityThreadMessage: (
    threadId: string,
    body: { content: string; parentMessageId?: string },
  ) =>
    request<import('@/lib/communityTypes').CommunityMessage>(
      `/threads/${threadId}/messages`,
      { method: 'POST', body: JSON.stringify(body) },
    ),
  markThreadRead: (threadId: string) =>
    request<{ ok: boolean }>(`/threads/${threadId}/read`, { method: 'POST' }),
  toggleMessageReaction: (messageId: string, emoji: string) =>
    request<{ toggled: 'added' | 'removed'; emoji: string }>(
      `/messages/${messageId}/reactions`,
      { method: 'POST', body: JSON.stringify({ emoji }) },
    ),
  deleteCommunityMessage: (messageId: string) =>
    request<void>(`/messages/${messageId}`, { method: 'DELETE' }),
  editCommunityMessage: (messageId: string, content: string) =>
    request<import('@/lib/communityTypes').CommunityMessage>(`/messages/${messageId}`, {
      method: 'PATCH',
      body: JSON.stringify({ content }),
    }),
  getCommunityNotifications: () =>
    request<import('@/lib/communityTypes').MentionNotification[]>(
      '/community/notifications',
    ),
  markCommunityNotificationRead: (id: string) =>
    request<{ ok: boolean }>(`/community/notifications/${id}/read`, { method: 'POST' }),
  markAllCommunityNotificationsRead: () =>
    request<{ ok: boolean }>('/community/notifications/read-all', { method: 'POST' }),
  getMentionSuggestions: (communityId: string, q: string) => {
    const qs = new URLSearchParams({ q });
    return request<import('@/lib/communityTypes').MentionSuggestion[]>(
      `/communities/${communityId}/mention-suggestions?${qs}`,
    );
  },
  getStaffMessages: (params?: {
    teacherId?: string;
    departmentId?: string;
    since?: string;
  }) => {
    const q = new URLSearchParams();
    if (params?.teacherId) q.set('teacherId', params.teacherId);
    if (params?.departmentId) q.set('departmentId', params.departmentId);
    if (params?.since) q.set('since', params.since);
    const qs = q.toString();
    return request<import('@/lib/mockData').StaffMessage[]>(
      `/staff-messages${qs ? `?${qs}` : ''}`,
    );
  },
  sendStaffMessage: (body: Record<string, unknown>) =>
    request<import('@/lib/mockData').StaffMessage>('/staff-messages', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  markStaffMessagesRead: (teacherId: string, readerRole: 'teacher' | 'department-head') =>
    request('/staff-messages/mark-read', {
      method: 'PATCH',
      body: JSON.stringify({ teacherId, readerRole }),
    }),

  // Admissions / billing / portal
  getPublicSchool: (slug: string) =>
    request<{
      school: { id: string; name: string; slug: string; code: string };
      formSchema: unknown[];
      branding?: { primaryColor?: string; tagline?: string };
      fees: { registrationFee: number; monthlyTuition: number; currency: string };
    }>(`/admissions/public/schools/${slug}`),
  submitPublicApplication: (slug: string, body: Record<string, unknown>) =>
    request(`/admissions/public/schools/${slug}/applications`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  listApplications: (schoolId?: string, status?: string) => {
    const q = new URLSearchParams();
    if (schoolId) q.set('schoolId', schoolId);
    if (status) q.set('status', status);
    const s = q.toString();
    return request<AdmissionApplication[]>(`/admissions/applications${s ? `?${s}` : ''}`);
  },
  myApplications: () => request<AdmissionApplication[]>('/admissions/applications/mine'),
  getApplication: (id: string) => request<AdmissionApplication>(`/admissions/applications/${id}`),
  updateApplication: (id: string, body: Record<string, unknown>) =>
    request(`/admissions/applications/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  scoreApplication: (id: string, score: number, notes?: string) =>
    request(`/admissions/applications/${id}/score`, {
      method: 'POST',
      body: JSON.stringify({ score, notes }),
    }),
  waitlistApplication: (id: string, notes?: string) =>
    request(`/admissions/applications/${id}/waitlist`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    }),
  rejectApplication: (id: string, reason: string) =>
    request(`/admissions/applications/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
  acceptApplication: (id: string, body?: Record<string, unknown>) =>
    request<{ application: AdmissionApplication; invoice: Invoice; enrollmentId: string }>(
      `/admissions/applications/${id}/accept`,
      { method: 'POST', body: JSON.stringify(body ?? {}) }
    ),
  requestInfoApplication: (id: string, notes: string) =>
    request(`/admissions/applications/${id}/request-info`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    }),
  withdrawApplication: (id: string, reason: string) =>
    request(`/admissions/applications/${id}/withdraw`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
  forcePromoteWaitlist: (id: string) =>
    request(`/admissions/waitlist/${id}/force-promote`, { method: 'POST', body: '{}' }),
  listWaitlist: (schoolId?: string) =>
    request(`/admissions/waitlist${schoolId ? `?schoolId=${schoolId}` : ''}`),
  listCapacity: (schoolId?: string) =>
    request<GradeSectionCapacity[]>(`/admissions/capacity${schoolId ? `?schoolId=${schoolId}` : ''}`),
  updateCapacity: (id: string, body: { capacity: number }) =>
    request(`/admissions/capacity/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  getSchoolSettings: (schoolId: string) => request(`/admissions/settings/${schoolId}`),
  updateSchoolSettings: (schoolId: string, body: Record<string, unknown>) =>
    request(`/admissions/settings/${schoolId}`, { method: 'PATCH', body: JSON.stringify(body) }),

  listRegistrationForms: (schoolId: string) =>
    request<RegistrationFormTemplate[]>(`/admissions/registration-forms?schoolId=${schoolId}`),
  createRegistrationForm: (body: {
    schoolId: string;
    name: string;
    description?: string;
    fields: RegistrationFormField[];
    requiredDocuments: string[];
  }) =>
    request<RegistrationFormTemplate>(`/admissions/registration-forms`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  updateRegistrationForm: (id: string, body: Record<string, unknown>) =>
    request<RegistrationFormTemplate>(`/admissions/registration-forms/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  getPublicRegistrationForm: (code: string) =>
    request<{
      school: { id: string; name: string; slug: string; code: string };
      formName: string;
      formDescription?: string;
      formSchema: RegistrationFormField[];
      requiredDocuments: string[];
      branding?: { primaryColor?: string; tagline?: string; logoUrl?: string; schoolDisplayName?: string };
    }>(`/admissions/public/forms/${code}`),
  submitPublicRegistrationForm: (code: string, body: Record<string, unknown>) =>
    request(`/admissions/public/forms/${code}/applications`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  listInvoices: (params?: Record<string, string>) => {
    const q = new URLSearchParams(params);
    const s = q.toString();
    return request<Invoice[]>(`/billing/invoices${s ? `?${s}` : ''}`);
  },
  payInvoice: (id: string, body: Record<string, unknown>) =>
    request(`/billing/invoices/${id}/pay`, { method: 'POST', body: JSON.stringify(body) }),
  recordPayment: (id: string, body: Record<string, unknown>) =>
    request(`/billing/invoices/${id}/record-payment`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  waiveInvoice: (id: string, amount: number, reason: string) =>
    request(`/billing/invoices/${id}/waive`, {
      method: 'POST',
      body: JSON.stringify({ amount, reason }),
    }),
  cancelInvoice: (id: string, reason: string) =>
    request(`/billing/invoices/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
  extendInvoiceDeadline: (id: string, dueDate: string) =>
    request(`/billing/invoices/${id}/deadline`, {
      method: 'PATCH',
      body: JSON.stringify({ dueDate }),
    }),
  financeAgingReport: (schoolId?: string) =>
    request(`/billing/reports/aging${schoolId ? `?schoolId=${schoolId}` : ''}`),
  runBillingJobs: () => request('/billing/jobs/run', { method: 'POST' }),

  getFinanceDashboardSummary: (schoolId?: string) =>
    request<FinanceDashboardSummary>(`/finance/dashboard-summary${schoolId ? `?schoolId=${schoolId}` : ''}`),
  listFinancialYears: (schoolId?: string) =>
    request<FinancialYear[]>(`/finance/financial-years${schoolId ? `?schoolId=${schoolId}` : ''}`),
  createFinancialYear: (body: { schoolId?: string; name: string; startDate: string; endDate: string }) =>
    request<FinancialYear>('/finance/financial-years', { method: 'POST', body: JSON.stringify(body) }),
  activateFinancialYear: (id: string) =>
    request<FinancialYear>(`/finance/financial-years/${id}/activate`, { method: 'POST' }),
  closeFinancialYear: (id: string) =>
    request<FinancialYear>(`/finance/financial-years/${id}/close`, { method: 'POST' }),
  listFinancialPeriods: (params?: { schoolId?: string; financialYearId?: string }) => {
    const q = new URLSearchParams();
    if (params?.schoolId) q.set('schoolId', params.schoolId);
    if (params?.financialYearId) q.set('financialYearId', params.financialYearId);
    const s = q.toString();
    return request<FinancialPeriod[]>(`/finance/financial-periods${s ? `?${s}` : ''}`);
  },
  closeFinancialPeriod: (id: string) =>
    request<FinancialPeriod>(`/finance/financial-periods/${id}/close`, { method: 'POST' }),
  reopenFinancialPeriod: (id: string) =>
    request<FinancialPeriod>(`/finance/financial-periods/${id}/reopen`, { method: 'POST' }),
  listAccounts: (schoolId?: string) =>
    request<FinanceAccount[]>(`/finance/accounts${schoolId ? `?schoolId=${schoolId}` : ''}`),
  createAccount: (body: {
    schoolId?: string;
    code: string;
    name: string;
    accountType: FinanceAccount['accountType'];
    parentId?: string | null;
    description?: string;
  }) => request<FinanceAccount>('/finance/accounts', { method: 'POST', body: JSON.stringify(body) }),
  updateAccount: (id: string, body: { name?: string; description?: string; isActive?: boolean }) =>
    request<FinanceAccount>(`/finance/accounts/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  seedChartOfAccounts: (schoolId?: string) =>
    request<{ accounts: FinanceAccount[]; insertedCount: number }>(
      `/finance/accounts/seed-defaults${schoolId ? `?schoolId=${schoolId}` : ''}`,
      { method: 'POST' }
    ),

  listBudgets: (params?: { schoolId?: string; financialYearId?: string }) => {
    const q = new URLSearchParams();
    if (params?.schoolId) q.set('schoolId', params.schoolId);
    if (params?.financialYearId) q.set('financialYearId', params.financialYearId);
    const s = q.toString();
    return request<Budget[]>(`/finance/budgets${s ? `?${s}` : ''}`);
  },
  getBudget: (id: string) => request<BudgetWithLines>(`/finance/budgets/${id}`),
  getBudgetUtilization: (id: string) => request<BudgetUtilization>(`/finance/budgets/${id}/utilization`),
  createBudget: (body: { schoolId?: string; financialYearId: string; name: string }) =>
    request<BudgetWithLines>('/finance/budgets', { method: 'POST', body: JSON.stringify(body) }),
  addBudgetLine: (
    budgetId: string,
    body: { department: string; accountId: string; allocatedAmount: number; notes?: string }
  ) => request<BudgetWithLines>(`/finance/budgets/${budgetId}/lines`, { method: 'POST', body: JSON.stringify(body) }),
  updateBudgetLine: (lineId: string, body: { allocatedAmount?: number; notes?: string }) =>
    request<BudgetWithLines>(`/finance/budget-lines/${lineId}`, { method: 'PATCH', body: JSON.stringify(body) }),
  removeBudgetLine: (lineId: string) =>
    request<BudgetWithLines>(`/finance/budget-lines/${lineId}`, { method: 'DELETE' }),
  submitBudget: (id: string) => request<Budget>(`/finance/budgets/${id}/submit`, { method: 'POST' }),
  approveBudget: (id: string) => request<Budget>(`/finance/budgets/${id}/approve`, { method: 'POST' }),
  rejectBudget: (id: string, reason: string) =>
    request<Budget>(`/finance/budgets/${id}/reject`, { method: 'POST', body: JSON.stringify({ reason }) }),
  returnBudget: (id: string, reason: string) =>
    request<Budget>(`/finance/budgets/${id}/return`, { method: 'POST', body: JSON.stringify({ reason }) }),
  reviseBudget: (id: string) => request<BudgetWithLines>(`/finance/budgets/${id}/revise`, { method: 'POST' }),
  createBudgetTransfer: (body: {
    schoolId?: string;
    budgetId: string;
    fromLineId: string;
    toLineId: string;
    amount: number;
    reason: string;
  }) => request<BudgetTransfer>('/finance/budget-transfers', { method: 'POST', body: JSON.stringify(body) }),
  approveBudgetTransfer: (id: string) =>
    request<BudgetTransfer>(`/finance/budget-transfers/${id}/approve`, { method: 'POST' }),
  rejectBudgetTransfer: (id: string, reason: string) =>
    request<BudgetTransfer>(`/finance/budget-transfers/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

  listExpenses: (params?: { schoolId?: string; status?: string; department?: string }) => {
    const q = new URLSearchParams();
    if (params?.schoolId) q.set('schoolId', params.schoolId);
    if (params?.status) q.set('status', params.status);
    if (params?.department) q.set('department', params.department);
    const s = q.toString();
    return request<Expense[]>(`/finance/expenses${s ? `?${s}` : ''}`);
  },
  getExpense: (id: string) => request<Expense>(`/finance/expenses/${id}`),
  createExpense: (body: {
    schoolId?: string;
    department: string;
    accountId: string;
    vendor?: string;
    description: string;
    amount: number;
    expenseDate: string;
    notes?: string;
    attachmentUrl?: string;
  }) => request<Expense>('/finance/expenses', { method: 'POST', body: JSON.stringify(body) }),
  updateExpense: (
    id: string,
    body: Partial<{ vendor: string; description: string; amount: number; expenseDate: string; notes: string; attachmentUrl: string }>
  ) => request<Expense>(`/finance/expenses/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  removeExpense: (id: string) => request<void>(`/finance/expenses/${id}`, { method: 'DELETE' }),
  submitExpense: (id: string) => request<Expense>(`/finance/expenses/${id}/submit`, { method: 'POST' }),
  approveExpense: (id: string) => request<Expense>(`/finance/expenses/${id}/approve`, { method: 'POST' }),
  rejectExpense: (id: string, reason: string) =>
    request<Expense>(`/finance/expenses/${id}/reject`, { method: 'POST', body: JSON.stringify({ reason }) }),
  returnExpense: (id: string, reason: string) =>
    request<Expense>(`/finance/expenses/${id}/return`, { method: 'POST', body: JSON.stringify({ reason }) }),
  cancelExpense: (id: string, reason: string) =>
    request<Expense>(`/finance/expenses/${id}/cancel`, { method: 'POST', body: JSON.stringify({ reason }) }),
  payExpense: (id: string, body: { paymentMethod: PaymentMethod; paymentReference?: string }) =>
    request<Expense>(`/finance/expenses/${id}/pay`, { method: 'POST', body: JSON.stringify(body) }),

  listSuppliers: (schoolId?: string) => request<Supplier[]>(`/finance/suppliers${schoolId ? `?schoolId=${schoolId}` : ''}`),
  createSupplier: (body: {
    schoolId?: string;
    name: string;
    contactName?: string;
    email?: string;
    phone?: string;
    address?: string;
    taxId?: string;
    bankDetails?: string;
  }) => request<Supplier>('/finance/suppliers', { method: 'POST', body: JSON.stringify(body) }),
  updateSupplier: (id: string, body: Partial<Omit<Supplier, 'id' | 'schoolId' | 'createdAt'>>) =>
    request<Supplier>(`/finance/suppliers/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),

  listSupplierInvoices: (params?: { schoolId?: string; status?: string; supplierId?: string }) => {
    const q = new URLSearchParams();
    if (params?.schoolId) q.set('schoolId', params.schoolId);
    if (params?.status) q.set('status', params.status);
    if (params?.supplierId) q.set('supplierId', params.supplierId);
    const s = q.toString();
    return request<SupplierInvoice[]>(`/finance/supplier-invoices${s ? `?${s}` : ''}`);
  },
  getSupplierInvoice: (id: string) => request<SupplierInvoice>(`/finance/supplier-invoices/${id}`),
  createSupplierInvoice: (body: {
    schoolId?: string;
    supplierId: string;
    department: string;
    accountId: string;
    invoiceNumber: string;
    poReference?: string;
    invoiceDate: string;
    dueDate: string;
    subtotal: number;
    taxAmount?: number;
    currency?: string;
    notes?: string;
    attachmentUrl?: string;
  }) => request<SupplierInvoice>('/finance/supplier-invoices', { method: 'POST', body: JSON.stringify(body) }),
  submitSupplierInvoice: (id: string) =>
    request<SupplierInvoice>(`/finance/supplier-invoices/${id}/submit`, { method: 'POST' }),
  approveSupplierInvoice: (id: string) =>
    request<SupplierInvoice>(`/finance/supplier-invoices/${id}/approve`, { method: 'POST' }),
  rejectSupplierInvoice: (id: string, reason: string) =>
    request<SupplierInvoice>(`/finance/supplier-invoices/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
  cancelSupplierInvoice: (id: string, reason: string) =>
    request<SupplierInvoice>(`/finance/supplier-invoices/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
  recordSupplierPayment: (id: string, body: { amount: number; method: PaymentMethod; reference?: string; notes?: string }) =>
    request<SupplierInvoice>(`/finance/supplier-invoices/${id}/payments`, { method: 'POST', body: JSON.stringify(body) }),

  portalChildren: () => request<Record<string, unknown>[]>('/portal/children'),
  portalAnnouncements: (schoolId?: string) =>
    request<Record<string, unknown>[]>(
      `/portal/announcements${schoolId ? `?schoolId=${schoolId}` : ''}`
    ),
  createAnnouncement: (body: Record<string, unknown>) =>
    request('/portal/announcements', { method: 'POST', body: JSON.stringify(body) }),
  updateAnnouncement: (id: string, body: Record<string, unknown>) =>
    request(`/portal/announcements/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteAnnouncement: (id: string) =>
    request(`/portal/announcements/${id}`, { method: 'DELETE' }),
  portalCalendar: (schoolId?: string) =>
    request<Record<string, unknown>[]>(
      `/portal/calendar${schoolId ? `?schoolId=${schoolId}` : ''}`
    ),
  listFeePlans: (schoolId: string) =>
    request<{ id: string; grade: string; registrationFee: number; monthlyTuition: number }[]>(
      `/admissions/fee-plans/${schoolId}`
    ),
  saveFeePlans: (
    schoolId: string,
    plans: { grade: string; registrationFee: number; monthlyTuition: number; id?: string }[]
  ) =>
    request(`/admissions/fee-plans/${schoolId}`, {
      method: 'PUT',
      body: JSON.stringify({ plans }),
    }),
  verifyApplicationDocument: (applicationId: string, docId: string, verified = true) =>
    request(`/admissions/applications/${applicationId}/documents/${docId}/verify`, {
      method: 'POST',
      body: JSON.stringify({ verified }),
    }),

  // Registrar Engine additions: audit trail, bulk import, grade promotion
  listAuditLogs: (params?: {
    entityType?: string;
    entityTypes?: string;
    entityId?: string;
    limit?: number;
  }) => {
    const q = new URLSearchParams();
    if (params?.entityType) q.set('entityType', params.entityType);
    if (params?.entityTypes) q.set('entityTypes', params.entityTypes);
    if (params?.entityId) q.set('entityId', params.entityId);
    if (params?.limit) q.set('limit', String(params.limit));
    const s = q.toString();
    return request<AuditLogEntry[]>(`/registrar/audit-logs${s ? `?${s}` : ''}`);
  },
  bulkCreateStudents: (body: { schoolId: string; rows: Record<string, unknown>[] }) =>
    request<{
      created: import('@/lib/mockData').Student[];
      errors: { row: number; message: string }[];
    }>('/registrar/students/bulk', { method: 'POST', body: JSON.stringify(body) }),
  promoteStudents: (body: { schoolId: string; fromGrade: string; toGrade: string; studentIds?: string[] }) =>
    request<{ promoted: number; students: import('@/lib/mockData').Student[] }>(
      '/registrar/students/promote',
      { method: 'POST', body: JSON.stringify(body) }
    ),
  listReenrollmentCampaigns: (schoolId?: string) =>
    request<{ id: string; title: string; inviteCount: number; confirmedCount: number; status: string }[]>(
      `/portal/reenroll/campaigns${schoolId ? `?schoolId=${schoolId}` : ''}`
    ),
  createReenrollmentCampaign: (body: Record<string, unknown>) =>
    request<{ id: string; inviteCount: number }>('/portal/reenroll/campaigns', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  myReenrollmentInvites: () =>
    request<
      {
        id: string;
        title: string;
        studentName: string;
        grade: string;
        status: string;
        dueDate?: string;
      }[]
    >('/portal/reenroll/mine'),
  respondReenrollmentInvite: (id: string, status: 'confirmed' | 'declined') =>
    request(`/portal/reenroll/invites/${id}/respond`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    }),
  portalTimetable: (grade: string, section: string, schoolId?: string) => {
    const q = new URLSearchParams({ grade, section });
    if (schoolId) q.set('schoolId', schoolId);
    return request<Record<string, unknown>[]>(`/portal/timetable?${q}`);
  },
  myTimetable: () => request<Record<string, unknown>[]>('/portal/timetable/mine'),
  staffWorkload: (schoolId?: string) => {
    const qs = schoolId ? `?schoolId=${encodeURIComponent(schoolId)}` : '';
    return request<{ teacherId: string; teacherName: string; periodsPerWeek: number }[]>(`/portal/timetable/workload${qs}`);
  },
  getMoeCalendar: () => request<import('@/lib/mockData').MoeCalendarDraft | null>('/moe-calendar'),
  saveMoeCalendar: (body: { id?: string; academicYear: string; title: string; events: unknown[] }) =>
    request<import('@/lib/mockData').MoeCalendarDraft>('/moe-calendar', { method: 'POST', body: JSON.stringify(body) }),
  publishMoeCalendar: (id: string) =>
    request<import('@/lib/mockData').MoeCalendarDraft>(`/moe-calendar/${id}/publish`, { method: 'PATCH' }),
  portalDocuments: (studentId: string) =>
    request<Record<string, unknown>[]>(`/portal/documents?studentId=${studentId}`),
  portalGrades: (studentId: string) =>
    request<Record<string, unknown>[]>(`/portal/grades?studentId=${studentId}`),
  publishGrade: (id: string, published = true) =>
    request(`/portal/grades/${id}/publish`, {
      method: 'POST',
      body: JSON.stringify({ published }),
    }),
  portalAttendance: (studentId: string) =>
    request<Record<string, unknown>[]>(`/portal/attendance?studentId=${studentId}`),
  portalPracticeSets: (grade?: string, schoolId?: string) => {
    const q = new URLSearchParams();
    if (grade) q.set('grade', grade);
    if (schoolId) q.set('schoolId', schoolId);
    const s = q.toString();
    return request(`/portal/practice-sets${s ? `?${s}` : ''}`);
  },
  createPracticeSet: (body: Record<string, unknown>) =>
    request<{ id: string }>('/portal/practice-sets', { method: 'POST', body: JSON.stringify(body) }),
  listQuestionBank: (schoolId?: string) =>
    request<Record<string, unknown>[]>(
      `/portal/question-bank${schoolId ? `?schoolId=${schoolId}` : ''}`
    ),
  createQuestion: (body: Record<string, unknown>) =>
    request<{ id: string }>('/portal/question-bank', { method: 'POST', body: JSON.stringify(body) }),

  listMessageThreads: () => request<MessageThread[]>('/portal/messages/threads'),
  createMessageThread: (body: Record<string, unknown>) =>
    request<{ id: string }>('/portal/messages/threads', { method: 'POST', body: JSON.stringify(body) }),
  getThreadMessages: (threadId: string) =>
    request<ThreadMessage[]>(`/portal/messages/threads/${threadId}`),
  replyToThread: (threadId: string, body: string) =>
    request<{ id: string }>(`/portal/messages/threads/${threadId}`, {
      method: 'POST',
      body: JSON.stringify({ body }),
    }),
  sendPortalFeedback: (body: Record<string, unknown>) =>
    request<{ id: string }>('/portal/feedback', { method: 'POST', body: JSON.stringify(body) }),
  createCalendarEvent: (body: Record<string, unknown>) =>
    request<{ id: string }>('/portal/calendar', { method: 'POST', body: JSON.stringify(body) }),
  listPortalUsers: (schoolId?: string, includeInactive?: boolean) =>
    request<PortalUserSummary[]>(
      `/permissions/users?${schoolId ? `schoolId=${schoolId}&` : ''}${includeInactive ? 'includeInactive=true' : ''}`
    ),
  toggleUserStatus: (userId: string) =>
    request<{ id: string; isActive: boolean }>(`/permissions/users/${userId}/status`, { method: 'PATCH' }),
  listPortalContacts: (schoolId?: string) =>
    request<{
      teachers: { teacherId: string; userId?: string | null; displayName: string; email: string; role: string }[];
      parents: { userId: string; displayName: string; email: string; role: string }[];
      schoolHeads: { userId: string; displayName: string; email: string; role: string }[];
    }>(`/portal/contacts${schoolId ? `?schoolId=${schoolId}` : ''}`),
  revokeUserPermission: (userId: string, permissionCode: string, schoolId?: string) =>
    request(
      `/permissions/users/${userId}/${permissionCode}${schoolId ? `?schoolId=${schoolId}` : ''}`,
      { method: 'DELETE' }
    ),

  myPermissions: () => request<{ permissions: string[] }>('/permissions/me'),
  permissionCatalog: () => request<{ code: string; label: string; module: string }[]>('/permissions/catalog'),
  getUserPermissions: (userId: string, schoolId?: string) =>
    request(`/permissions/users/${userId}${schoolId ? `?schoolId=${schoolId}` : ''}`),
  setUserPermission: (
    userId: string,
    body: { permissionCode: string; effect: 'allow' | 'deny'; schoolId?: string }
  ) =>
    request(`/permissions/users/${userId}`, { method: 'POST', body: JSON.stringify(body) }),
  getRolePermissions: (role: string, schoolId?: string) =>
    request(`/permissions/roles/${role}${schoolId ? `?schoolId=${schoolId}` : ''}`),
  setRolePermissions: (role: string, permissions: string[], schoolId?: string) =>
    request(`/permissions/roles/${role}`, {
      method: 'PUT',
      body: JSON.stringify({ permissions, schoolId }),
    }),
};

export interface AdmissionApplication {
  id: string;
  schoolId: string;
  referenceCode: string;
  applicantName: string;
  dateOfBirth?: string;
  gradeApplied: string;
  sectionRequested?: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  emergencyContact?: string;
  medicalInfo?: string;
  previousSchool?: string;
  sourceChannel?: string;
  priorityScore: number;
  status: string;
  submittedAt?: string;
  reviewedAt?: string;
  reviewerNotes?: string;
  rejectionReason?: string;
  provisionalClassId?: string;
  enrolledStudentId?: string;
  invoiceId?: string;
  editLocked?: boolean;
  waitlistRank?: number | null;
  waitlistStatus?: string | null;
  documents?: ApplicationDocument[];
  formTemplateId?: string;
  academicYear?: string;
}

export interface RegistrationFormField {
  key: string;
  label: string;
  type?: string;
  required?: boolean;
}

export interface RegistrationFormTemplate {
  id: string;
  schoolId: string;
  name: string;
  description?: string;
  code: string;
  fields: RegistrationFormField[];
  requiredDocuments: string[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationDocument {
  id: string;
  docType: string;
  fileName: string;
  fileUrl: string;
  verified: boolean;
  scanStatus?: string;
  uploadedAt?: string;
}

export interface GradeSectionCapacity {
  id: string;
  grade: string;
  section: string;
  capacity: number;
  reserved_count: number;
  enrolled_count: number;
}

export interface AuditLogEntry {
  id: string;
  actorName?: string;
  actorEmail?: string;
  action: string;
  entityType: string;
  entityId?: string;
  details?: Record<string, unknown>;
  createdAt: string;
}

export interface FinancialYear {
  id: string;
  schoolId: string;
  name: string;
  startDate: string;
  endDate: string;
  status: 'draft' | 'active' | 'closed';
  createdAt: string;
}

export interface FinancialPeriod {
  id: string;
  financialYearId: string;
  schoolId: string;
  name: string;
  startDate: string;
  endDate: string;
  status: 'open' | 'closed';
  closedAt?: string | null;
  closedBy?: string | null;
}

export interface FinanceAccount {
  id: string;
  schoolId: string;
  code: string;
  name: string;
  accountType: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  normalBalance: 'debit' | 'credit';
  parentId?: string | null;
  isActive: boolean;
  description?: string | null;
  createdAt: string;
}

export interface FinanceDashboardSummary {
  schoolId: string;
  activeFinancialYear: FinancialYear | null;
  revenue: {
    total: number;
    monthlyTrend: { name: string; total: number }[];
  };
  receivables: {
    outstandingAmount: number;
    overdueAmount: number;
    overdueCount: number;
    collectionRate: number;
    buckets: {
      d0_30: { count: number; amount: number };
      d31_60: { count: number; amount: number };
      d61_90: { count: number; amount: number };
      d90_plus: { count: number; amount: number };
    };
  };
  payroll: {
    currentMonth: string;
    totalNetPay: number;
  };
}

export type BudgetStatus = 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'returned' | 'closed';

export interface Budget {
  id: string;
  schoolId: string;
  financialYearId: string;
  name: string;
  status: BudgetStatus;
  version: number;
  revisedFromBudgetId?: string | null;
  notes?: string | null;
  createdBy?: string | null;
  submittedAt?: string | null;
  decidedBy?: string | null;
  decidedAt?: string | null;
  decisionReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetLine {
  id: string;
  budgetId: string;
  schoolId: string;
  department: string;
  accountId: string;
  accountCode?: string;
  accountName?: string;
  allocatedAmount: number;
  notes?: string | null;
  createdAt: string;
}

export interface BudgetTransfer {
  id: string;
  schoolId: string;
  budgetId: string;
  fromLineId: string;
  toLineId: string;
  amount: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedBy?: string | null;
  decidedBy?: string | null;
  decidedAt?: string | null;
  decisionReason?: string | null;
  createdAt: string;
}

export interface BudgetWithLines extends Budget {
  lines: BudgetLine[];
  transfers: BudgetTransfer[];
}

export interface BudgetLineUtilization extends BudgetLine {
  committed: number;
  actual: number;
  remaining: number;
  variance: number;
  utilizationPct: number;
  actualTrackingAvailable: boolean;
}

export interface BudgetUtilization {
  budget: Budget & { transfers: BudgetTransfer[] };
  lines: BudgetLineUtilization[];
  totals: {
    allocated: number;
    committed: number;
    actual: number;
    remaining: number;
    utilizationPct: number;
  };
}

export type ExpenseStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'returned' | 'paid' | 'cancelled';
export type PaymentMethod = 'cash' | 'bank_transfer' | 'mobile_money' | 'cheque';

export interface Expense {
  id: string;
  schoolId: string;
  financialYearId?: string | null;
  department: string;
  accountId: string;
  accountCode?: string;
  accountName?: string;
  budgetLineId?: string | null;
  vendor?: string | null;
  description: string;
  amount: number;
  expenseDate: string;
  status: ExpenseStatus;
  attachmentUrl?: string | null;
  notes?: string | null;
  requestedBy?: string | null;
  decidedBy?: string | null;
  decidedAt?: string | null;
  decisionReason?: string | null;
  paymentMethod?: PaymentMethod | null;
  paymentReference?: string | null;
  paidAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: string;
  schoolId: string;
  name: string;
  contactName?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  taxId?: string | null;
  bankDetails?: string | null;
  isActive: boolean;
  createdAt: string;
}

export type SupplierInvoiceStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'partially_paid' | 'paid' | 'cancelled';

export interface SupplierPayment {
  id: string;
  schoolId: string;
  supplierInvoiceId: string;
  amount: number;
  method: PaymentMethod;
  reference?: string | null;
  paidAt: string;
  recordedBy?: string | null;
  notes?: string | null;
  createdAt: string;
}

export interface SupplierInvoice {
  id: string;
  schoolId: string;
  supplierId: string;
  supplierName?: string;
  financialYearId?: string | null;
  department: string;
  accountId: string;
  accountCode?: string;
  accountName?: string;
  budgetLineId?: string | null;
  invoiceNumber: string;
  poReference?: string | null;
  invoiceDate: string;
  dueDate: string;
  currency: string;
  subtotal: number;
  taxAmount: number;
  amountPaid: number;
  balanceDue: number;
  status: SupplierInvoiceStatus;
  attachmentUrl?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  payments?: SupplierPayment[];
}

export interface Invoice {
  id: string;
  schoolId: string;
  studentId?: string;
  applicationId?: string;
  parentId?: string;
  invoiceNumber: string;
  invoiceType: string;
  status: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  subtotal: number;
  lateFeeTotal: number;
  amountPaid: number;
  balanceDue: number;
  daysRemaining: number;
  deadlineColor: 'green' | 'yellow' | 'red';
  studentName?: string;
  applicantName?: string;
  schoolName?: string;
  parentName?: string;
  billingPeriod?: string;
  notes?: string;
  lineItems?: { id: string; description: string; lineTotal: number; lineType: string }[];
  payments?: { id: string; amount: number; provider: string; status: string; paidAt?: string }[];
}

export interface MessageThread {
  id: string;
  school_id?: string;
  schoolId?: string;
  student_id?: string;
  studentId?: string;
  parent_user_id?: string;
  parentUserId?: string;
  staff_user_id?: string;
  staffUserId?: string;
  staff_role?: string;
  staffRole?: string;
  subject: string;
  updated_at?: string;
  updatedAt?: string;
  /** CO-002: the other party's role relative to the requesting user — distinguishes a
   * parent conversation from a teacher-peer one sharing the same underlying columns. */
  counterpart_role?: string;
  counterpartRole?: string;
}

export interface ThreadMessage {
  id: string;
  thread_id?: string;
  sender_user_id?: string;
  sender_role?: string;
  body: string;
  created_at?: string;
}

export interface PortalUserSummary {
  id: string;
  email: string;
  role: string;
  displayName: string;
  schoolId?: string | null;
  isActive?: boolean;
}
