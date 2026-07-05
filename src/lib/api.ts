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

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}/api${path}`, {
    ...init,
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    headers: {
      'Content-Type': 'application/json',
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
  studentGradeEntries: import('@/lib/mockData').StudentGradeEntry[];
  teacherResources: import('@/lib/mockData').TeacherResource[];
  teacherFeedbacks: import('@/lib/mockData').TeacherFeedback[];
  parentMessages: import('@/lib/mockData').ParentMessage[];
  teacherCheckInPrompts: import('@/lib/mockData').TeacherCheckInPrompt[];
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
};
