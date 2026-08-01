const API_BASE =
  typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_URL
    ? process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '')
    : 'http://localhost:3004';

export function getApiBase() {
  return API_BASE;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number
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

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}/api${path}`, {
    ...init,
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...init?.headers,
    },
  });
  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      /* ignore */
    }
    throw new ApiError(message, res.status);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

const UPLOAD_TIMEOUT_MS = 900_000; // 15 min — large uploads up to 150MB

export async function uploadFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE}/api/uploads`, {
    method: 'POST',
    body: formData,
    signal: AbortSignal.timeout(UPLOAD_TIMEOUT_MS),
  });
  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      /* ignore */
    }
    throw new ApiError(message, res.status);
  }
  const data = (await res.json()) as { url: string };
  return data.url;
}

export interface BootstrapPayload {
  schools: import('@/lib/mockData').School[];
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
  teachingNotes: import('@/lib/mockData').TeachingNote[];
  academicCalendars: import('@/lib/mockData').AcademicCalendar[];
  studentGradeEntries: import('@/lib/mockData').StudentGradeEntry[];
  teacherResources: import('@/lib/mockData').TeacherResource[];
  teacherFeedbacks: import('@/lib/mockData').TeacherFeedback[];
  parentMessages: import('@/lib/mockData').ParentMessage[];
  teacherCheckInPrompts: import('@/lib/mockData').TeacherCheckInPrompt[];
  lessonDeliveries: import('@/lib/mockData').LessonDelivery[];
  communityPosts: import('@/lib/mockData').CommunityPost[];
  communityReplies: import('@/lib/mockData').CommunityReply[];
  staffMessages: import('@/lib/mockData').StaffMessage[];
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
  bootstrap: () => request<BootstrapPayload>('/bootstrap'),
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
  createSchool: (body: Record<string, unknown>) =>
    request('/schools', { method: 'POST', body: JSON.stringify(body) }),
  toggleSchoolStatus: (id: string) =>
    request(`/schools/${id}/status`, { method: 'PATCH' }),
  createTeacher: (body: Record<string, unknown>) =>
    request('/teachers', { method: 'POST', body: JSON.stringify(body) }),
  updateTeacher: (id: string, body: Record<string, unknown>) =>
    request(`/teachers/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  toggleTeacherStatus: (id: string) =>
    request(`/teachers/${id}/toggle-status`, { method: 'PATCH' }),
  createStudent: (body: Record<string, unknown>) =>
    request('/students', { method: 'POST', body: JSON.stringify(body) }),
  updateStudent: (id: string, body: Record<string, unknown>) =>
    request(`/students/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  createLessonPlan: (body: Record<string, unknown>) =>
    request('/lesson-plans', { method: 'POST', body: JSON.stringify(body) }),
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
    body: { title: string; objectives: string[]; sessions: number; homework: string }
  ) =>
    request(`/lesson-plans/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
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
  saveAttendance: (records: { studentId: string; status: string; remarks?: string }[]) =>
    request('/attendance/batch', {
      method: 'POST',
      body: JSON.stringify({ records }),
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
    resourceUrl: string;
    category: string;
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
  createCheckIn: (body: Record<string, unknown>) =>
    request('/check-ins', { method: 'POST', body: JSON.stringify(body) }),
  createTeachingNote: (body: Record<string, unknown>) =>
    request('/teaching-notes', { method: 'POST', body: JSON.stringify(body) }),
  updateTeachingNote: (id: string, body: Record<string, unknown>) =>
    request(`/teaching-notes/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
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
  sendParentMessage: (body: Record<string, unknown>) =>
    request('/parent-messages', { method: 'POST', body: JSON.stringify(body) }),
  addTeacherFeedback: (body: Record<string, unknown>) =>
    request('/teacher-feedbacks', { method: 'POST', body: JSON.stringify(body) }),
  respondCheckIn: (id: string, response: string) =>
    request(`/teacher-check-in-prompts/${id}/respond`, {
      method: 'PATCH',
      body: JSON.stringify({ response }),
    }),
  createNotification: (title: string, description: string, type: string) =>
    request('/notifications', {
      method: 'POST',
      body: JSON.stringify({ title, description, type }),
    }),
  markNotificationRead: (id: string) =>
    request(`/notifications/${id}/read`, { method: 'PATCH' }),
  clearNotifications: () => request('/notifications', { method: 'DELETE' }),

  createLessonDelivery: (body: Record<string, unknown>) =>
    request<{
      delivery: import('@/lib/mockData').LessonDelivery;
      communityPost: import('@/lib/mockData').CommunityPost | null;
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
    request(`/admissions/capacity${schoolId ? `?schoolId=${schoolId}` : ''}`),
  updateCapacity: (id: string, body: { capacity: number }) =>
    request(`/admissions/capacity/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  getSchoolSettings: (schoolId: string) => request(`/admissions/settings/${schoolId}`),
  updateSchoolSettings: (schoolId: string, body: Record<string, unknown>) =>
    request(`/admissions/settings/${schoolId}`, { method: 'PATCH', body: JSON.stringify(body) }),

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
  listPortalUsers: (schoolId?: string) =>
    request<PortalUserSummary[]>(
      `/permissions/users${schoolId ? `?schoolId=${schoolId}` : ''}`
    ),
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
}
