import { request } from './api';

/**
 * Backend-authoritative academic results: what a teacher submits, what an Academic
 * Head finalizes, and what report cards / transcripts are generated from. Distinct
 * from the live, unsubmitted preview computed client-side in headOfAcademicsPortal.ts /
 * teacherPortal.ts — those stay in place for pre-submit previews.
 */

export type ResultStatus = 'draft' | 'submitted' | 'finalized';

export interface SubjectTermResult {
  id: string;
  schoolId: string | null;
  studentId: string;
  teacherId: string | null;
  subject: string;
  gradeLevel: string;
  section: string;
  academicYear: string;
  term: string;
  averagePercent: number | null;
  letterGrade: string | null;
  remark: string | null;
  status: ResultStatus;
  submittedAt: string | null;
  submittedBy: string | null;
  finalizedAt: string | null;
  finalizedBy: string | null;
  studentName?: string;
  studentNumber?: string;
  teacherName?: string;
}

export interface StudentTermSummary {
  id: string;
  studentId: string;
  gradeLevel: string;
  section: string;
  academicYear: string;
  term: string;
  overallAverage: number | null;
  rank: number | null;
  rankPopulation: number | null;
  conduct: string | null;
  promotionStatus: string | null;
  generalRemark: string | null;
  finalizedAt: string;
  finalizedBy: string | null;
}

export interface MissingResult {
  studentId: string;
  studentName: string;
  subject: string;
}

export interface AcademicResultsQuery {
  schoolId?: string;
  academicYear?: string;
  gradeLevel?: string;
  section?: string;
  subject?: string;
  teacherId?: string;
  term?: string;
  studentId?: string;
  status?: ResultStatus;
}

export interface ReportCardData {
  kind: 'report-card';
  term: string;
  academicYear: string;
  student: { id: string; name: string; studentId: string; grade: string; section: string; parentName?: string };
  subjects: { subject: string; averagePercent: number | null; remark?: string | null }[];
  overallAverage: number | null;
  rank: number | null;
  rankPopulation: number | null;
  attendanceRate: number | null;
  conduct: string | null;
  promotionStatus: string | null;
  generalRemark: string | null;
}

export interface TranscriptGradeGroup {
  gradeLevel: string;
  academicYear: string | null;
  section: string | null;
  terms: { term: string; subjects: { subject: string; averagePercent: number | null }[]; termAveragePercent: number | null }[];
  yearAverage: number | null;
  rank: number | null;
  rankPopulation: number | null;
}

export interface TranscriptData {
  kind: 'transcript';
  student: { id: string; name: string; studentId: string; grade: string; section: string; parentName?: string };
  fromGrade: string;
  toGrade: string;
  grades: TranscriptGradeGroup[];
}

export interface ReportTemplateRecord {
  id: string;
  schoolId: string | null;
  kind: 'report_card' | 'transcript';
  name: string;
  isSystem: boolean;
  isActive: boolean;
  basedOnTemplateId: string | null;
  config: Record<string, unknown>;
  updatedAt: string;
}

export type ChangeRequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'consumed' | 'expired';

export interface ResultChangeRequest {
  id: string;
  schoolId: string | null;
  teacherId: string;
  subject: string;
  gradeLevel: string;
  section: string;
  academicYear: string;
  term: string;
  reason: string;
  status: ChangeRequestStatus;
  previousStatus: 'submitted' | 'finalized' | null;
  source: 'teacher' | 'academic_head_direct';
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  teacherName?: string;
}

function qs(params: object): string {
  const entries = Object.entries(params).filter(([, v]) => v != null && v !== '');
  if (!entries.length) return '';
  return `?${entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join('&')}`;
}

export const academicResultsApi = {
  submit: (body: { subject: string; gradeLevel: string; section: string; term: string; academicYear?: string; teacherId?: string; schoolId?: string }) =>
    request<SubjectTermResult[]>('/academic-results/submit', { method: 'POST', body: JSON.stringify(body) }),

  list: (query: AcademicResultsQuery) =>
    request<{ results: SubjectTermResult[]; missing: MissingResult[] }>(`/academic-results${qs(query)}`),

  listAcademicYears: (schoolId?: string) => request<string[]>(`/academic-results/academic-years${qs({ schoolId })}`),

  listTerms: (query: { schoolId?: string; academicYear: string; gradeLevel?: string; section?: string }) =>
    request<string[]>(`/academic-results/terms${qs(query)}`),

  finalize: (body: { gradeLevel: string; section: string; academicYear: string; term: string; schoolId?: string }) =>
    request<{ subjectResults: SubjectTermResult[]; summaries: StudentTermSummary[] }>('/academic-results/finalize', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  reopen: (body: {
    gradeLevel: string;
    section: string;
    academicYear: string;
    term: string;
    reason: string;
    subject?: string;
    schoolId?: string;
  }) =>
    request<{ reopened: SubjectTermResult[] }>('/academic-results/reopen', { method: 'POST', body: JSON.stringify(body) }),

  listChangeRequests: (query: {
    schoolId?: string;
    status?: ChangeRequestStatus;
    subject?: string;
    gradeLevel?: string;
    section?: string;
    term?: string;
    academicYear?: string;
  } = {}) => request<ResultChangeRequest[]>(`/academic-results/change-requests${qs(query)}`),

  createChangeRequest: (body: {
    subject: string;
    gradeLevel: string;
    section: string;
    term: string;
    reason: string;
    academicYear?: string;
    teacherId?: string;
    schoolId?: string;
  }) =>
    request<ResultChangeRequest>('/academic-results/change-requests', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  approveChangeRequest: (id: string, body: { reviewNote?: string } = {}) =>
    request<ResultChangeRequest>(`/academic-results/change-requests/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  rejectChangeRequest: (id: string, body: { reviewNote?: string } = {}) =>
    request<ResultChangeRequest>(`/academic-results/change-requests/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  getReportCard: (query: { studentId: string; academicYear?: string; term: string; gradeLevel?: string; section?: string; schoolId?: string }) =>
    request<ReportCardData>(`/academic-results/report-card${qs(query)}`),

  getTranscript: (query: { studentId: string; fromGrade: string; toGrade: string; schoolId?: string }) =>
    request<TranscriptData>(`/academic-results/transcript${qs(query)}`),

  listReportTemplates: (kind: 'report_card' | 'transcript', schoolId?: string) =>
    request<ReportTemplateRecord[]>(`/academic-results/report-templates${qs({ kind, schoolId })}`),

  getActiveReportTemplate: (kind: 'report_card' | 'transcript', schoolId?: string) =>
    request<ReportTemplateRecord>(`/academic-results/report-templates/active${qs({ kind, schoolId })}`),

  duplicateReportTemplate: (id: string, body: { name?: string; schoolId?: string } = {}) =>
    request<ReportTemplateRecord>(`/academic-results/report-templates/${id}/duplicate`, { method: 'POST', body: JSON.stringify(body) }),

  updateReportTemplate: (id: string, body: { name?: string; config?: Record<string, unknown>; schoolId?: string }) =>
    request<ReportTemplateRecord>(`/academic-results/report-templates/${id}`, { method: 'PUT', body: JSON.stringify(body) }),

  activateReportTemplate: (id: string, schoolId?: string) =>
    request<{ ok: true }>(`/academic-results/report-templates/${id}/activate`, { method: 'POST', body: JSON.stringify({ schoolId }) }),
};
