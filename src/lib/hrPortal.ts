import { DEMO_SCHOOL_ID } from '@/lib/teacherPortal';

export type EmployeeStatus = 'Active' | 'On Leave' | 'Probation' | 'Terminated';
export type EmploymentType = 'Full-time' | 'Part-time' | 'Contract' | 'Intern';
export type LeaveType = 'Annual' | 'Sick' | 'Maternity' | 'Paternity' | 'Unpaid' | 'Emergency';
export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
export type PayrollStatus = 'Draft' | 'Processed' | 'Paid';
export type JobStatus = 'Open' | 'Closed' | 'On Hold';
export type ApplicationStatus = 'New' | 'Screening' | 'Interview' | 'Offered' | 'Hired' | 'Rejected';
export type ReviewStatus = 'Draft' | 'In Progress' | 'Completed';
export type StaffAttendanceStatus = 'Present' | 'Absent' | 'Late' | 'Half Day' | 'On Leave';

export interface HrEmployee {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  employmentType: EmploymentType;
  hireDate: string;
  salary: number;
  status: EmployeeStatus;
  schoolId: string;
  manager?: string;
  emergencyContact?: string;
  teacherId?: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: LeaveStatus;
  submittedAt: string;
  reviewedAt?: string;
  reviewerNotes?: string;
}

export interface PayrollRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  month: string;
  baseSalary: number;
  allowances: number;
  deductions: number;
  netPay: number;
  status: PayrollStatus;
  processedAt?: string;
}

export interface JobPosting {
  id: string;
  title: string;
  department: string;
  employmentType: EmploymentType;
  salaryRange: string;
  description: string;
  requirements: string[];
  status: JobStatus;
  postedAt: string;
  closingDate?: string;
  applicantCount: number;
}

export interface JobApplication {
  id: string;
  jobId: string;
  jobTitle: string;
  applicantName: string;
  email: string;
  phone: string;
  experience: string;
  education: string;
  status: ApplicationStatus;
  appliedAt: string;
  notes?: string;
}

export interface PerformanceReview {
  id: string;
  employeeId: string;
  employeeName: string;
  period: string;
  rating: number;
  goals: string[];
  strengths: string;
  improvements: string;
  status: ReviewStatus;
  reviewerName: string;
  completedAt?: string;
}

export interface OnboardingTask {
  id: string;
  employeeId: string;
  employeeName: string;
  task: string;
  assignee: string;
  dueDate: string;
  completed: boolean;
}

export interface StaffAttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status: StaffAttendanceStatus;
  notes?: string;
}

export const HR_DEPARTMENTS = [
  'Administration',
  'Mathematics',
  'Sciences',
  'Languages',
  'Human Resources',
  'Finance',
  'Facilities',
  'IT',
];

export const HR_POSITIONS = [
  'Teacher',
  'Department Head',
  'Registrar',
  'Accountant',
  'HR Officer',
  'IT Support',
  'Security Guard',
  'Librarian',
  'Lab Technician',
  'Administrative Assistant',
];

export const mockHrEmployees: HrEmployee[] = [
  {
    id: 'emp-1',
    employeeId: 'EMP-2024-001',
    name: 'Martha Feyissa',
    email: 'martha.feyissa@prime.edu.et',
    phone: '+251-911-100001',
    position: 'Teacher',
    department: 'Sciences',
    employmentType: 'Full-time',
    hireDate: '2019-09-01',
    salary: 18500,
    status: 'Active',
    schoolId: DEMO_SCHOOL_ID,
    manager: 'Dr. Semeneh Tadesse',
    emergencyContact: 'Spouse: +251-912-100001',
    teacherId: 'tch-1',
  },
  {
    id: 'emp-2',
    employeeId: 'EMP-2024-002',
    name: 'Tigist Haile',
    email: 'registrar.office@prime.edu.et',
    phone: '+251-911-100002',
    position: 'Registrar',
    department: 'Administration',
    employmentType: 'Full-time',
    hireDate: '2020-01-15',
    salary: 16200,
    status: 'Active',
    schoolId: DEMO_SCHOOL_ID,
    manager: 'Dr. Semeneh Tadesse',
    emergencyContact: 'Sister: +251-913-100002',
  },
  {
    id: 'emp-3',
    employeeId: 'EMP-2024-003',
    name: 'Dawit Mekonnen',
    email: 'dawit.mekonnen@prime.edu.et',
    phone: '+251-911-100003',
    position: 'Accountant',
    department: 'Finance',
    employmentType: 'Full-time',
    hireDate: '2021-03-10',
    salary: 15800,
    status: 'Active',
    schoolId: DEMO_SCHOOL_ID,
    manager: 'Dr. Semeneh Tadesse',
  },
  {
    id: 'emp-4',
    employeeId: 'EMP-2024-004',
    name: 'Sara Bekele',
    email: 'hr.officer@prime.edu.et',
    phone: '+251-911-100004',
    position: 'HR Officer',
    department: 'Human Resources',
    employmentType: 'Full-time',
    hireDate: '2022-06-01',
    salary: 17200,
    status: 'Active',
    schoolId: DEMO_SCHOOL_ID,
    manager: 'Dr. Semeneh Tadesse',
  },
  {
    id: 'emp-5',
    employeeId: 'EMP-2024-005',
    name: 'Yonas Girma',
    email: 'yonas.girma@prime.edu.et',
    phone: '+251-911-100005',
    position: 'IT Support',
    department: 'IT',
    employmentType: 'Full-time',
    hireDate: '2023-01-20',
    salary: 14500,
    status: 'Active',
    schoolId: DEMO_SCHOOL_ID,
    manager: 'Dawit Mekonnen',
  },
  {
    id: 'emp-6',
    employeeId: 'EMP-2024-006',
    name: 'Abebe Tesfaye',
    email: 'abebe.tesfaye@prime.edu.et',
    phone: '+251-911-100006',
    position: 'Security Guard',
    department: 'Facilities',
    employmentType: 'Full-time',
    hireDate: '2018-08-15',
    salary: 9800,
    status: 'Active',
    schoolId: DEMO_SCHOOL_ID,
  },
  {
    id: 'emp-7',
    employeeId: 'EMP-2024-007',
    name: 'Helen Assefa',
    email: 'helen.assefa@prime.edu.et',
    phone: '+251-911-100007',
    position: 'Teacher',
    department: 'Mathematics',
    employmentType: 'Full-time',
    hireDate: '2020-09-01',
    salary: 18200,
    status: 'On Leave',
    schoolId: DEMO_SCHOOL_ID,
    manager: 'Dr. Semeneh Tadesse',
    teacherId: 'tch-2',
  },
  {
    id: 'emp-8',
    employeeId: 'EMP-2025-008',
    name: 'Bereket Solomon',
    email: 'bereket.solomon@prime.edu.et',
    phone: '+251-911-100008',
    position: 'Lab Technician',
    department: 'Sciences',
    employmentType: 'Contract',
    hireDate: '2025-09-01',
    salary: 12000,
    status: 'Probation',
    schoolId: DEMO_SCHOOL_ID,
    manager: 'Martha Feyissa',
  },
];

export const mockLeaveRequests: LeaveRequest[] = [
  {
    id: 'leave-1',
    employeeId: 'emp-7',
    employeeName: 'Helen Assefa',
    type: 'Maternity',
    startDate: '2026-04-01',
    endDate: '2026-09-30',
    days: 90,
    reason: 'Maternity leave as per school policy',
    status: 'Approved',
    submittedAt: '2026-03-15',
    reviewedAt: '2026-03-18',
    reviewerNotes: 'Approved — coverage arranged with substitute teacher',
  },
  {
    id: 'leave-2',
    employeeId: 'emp-1',
    employeeName: 'Martha Feyissa',
    type: 'Annual',
    startDate: '2026-07-10',
    endDate: '2026-07-24',
    days: 10,
    reason: 'Family vacation',
    status: 'Pending',
    submittedAt: '2026-06-01',
  },
  {
    id: 'leave-3',
    employeeId: 'emp-5',
    employeeName: 'Yonas Girma',
    type: 'Sick',
    startDate: '2026-06-03',
    endDate: '2026-06-05',
    days: 3,
    reason: 'Medical appointment and recovery',
    status: 'Pending',
    submittedAt: '2026-06-02',
  },
  {
    id: 'leave-4',
    employeeId: 'emp-3',
    employeeName: 'Dawit Mekonnen',
    type: 'Emergency',
    startDate: '2026-05-20',
    endDate: '2026-05-21',
    days: 2,
    reason: 'Family emergency',
    status: 'Approved',
    submittedAt: '2026-05-19',
    reviewedAt: '2026-05-19',
  },
];

export const mockPayrollRecords: PayrollRecord[] = [
  {
    id: 'pay-1',
    employeeId: 'emp-1',
    employeeName: 'Martha Feyissa',
    month: '2026-05',
    baseSalary: 18500,
    allowances: 2500,
    deductions: 3200,
    netPay: 17800,
    status: 'Paid',
    processedAt: '2026-05-28',
  },
  {
    id: 'pay-2',
    employeeId: 'emp-2',
    employeeName: 'Tigist Haile',
    month: '2026-05',
    baseSalary: 16200,
    allowances: 1800,
    deductions: 2800,
    netPay: 15200,
    status: 'Paid',
    processedAt: '2026-05-28',
  },
  {
    id: 'pay-3',
    employeeId: 'emp-4',
    employeeName: 'Sara Bekele',
    month: '2026-05',
    baseSalary: 17200,
    allowances: 2000,
    deductions: 2950,
    netPay: 16250,
    status: 'Paid',
    processedAt: '2026-05-28',
  },
  {
    id: 'pay-4',
    employeeId: 'emp-1',
    employeeName: 'Martha Feyissa',
    month: '2026-06',
    baseSalary: 18500,
    allowances: 2500,
    deductions: 3200,
    netPay: 17800,
    status: 'Processed',
    processedAt: '2026-06-01',
  },
  {
    id: 'pay-5',
    employeeId: 'emp-5',
    employeeName: 'Yonas Girma',
    month: '2026-06',
    baseSalary: 14500,
    allowances: 1200,
    deductions: 2100,
    netPay: 13600,
    status: 'Draft',
  },
];

export const mockJobPostings: JobPosting[] = [
  {
    id: 'job-1',
    title: 'Mathematics Teacher — Grade 11 & 12',
    department: 'Mathematics',
    employmentType: 'Full-time',
    salaryRange: 'ETB 16,000 – 20,000',
    description: 'Seeking an experienced mathematics teacher for senior secondary classes.',
    requirements: ['B.Ed in Mathematics', '3+ years teaching experience', 'MOE certification'],
    status: 'Open',
    postedAt: '2026-05-10',
    closingDate: '2026-06-30',
    applicantCount: 4,
  },
  {
    id: 'job-2',
    title: 'Administrative Assistant',
    department: 'Administration',
    employmentType: 'Full-time',
    salaryRange: 'ETB 10,000 – 14,000',
    description: 'Support school administration with scheduling, records, and front desk duties.',
    requirements: ['Diploma in Business Administration', 'Proficiency in Amharic and English', 'MS Office skills'],
    status: 'Open',
    postedAt: '2026-05-15',
    closingDate: '2026-07-15',
    applicantCount: 2,
  },
  {
    id: 'job-3',
    title: 'Chemistry Lab Technician',
    department: 'Sciences',
    employmentType: 'Contract',
    salaryRange: 'ETB 11,000 – 13,000',
    description: 'Maintain lab equipment and assist teachers during practical sessions.',
    requirements: ['Diploma in Laboratory Technology', 'Safety certification preferred'],
    status: 'On Hold',
    postedAt: '2026-04-20',
    applicantCount: 1,
  },
];

export const mockJobApplications: JobApplication[] = [
  {
    id: 'japp-1',
    jobId: 'job-1',
    jobTitle: 'Mathematics Teacher — Grade 11 & 12',
    applicantName: 'Mekdes Alemu',
    email: 'mekdes.alemu@gmail.com',
    phone: '+251-922-200001',
    experience: '5 years at Bole Academy',
    education: 'B.Ed Mathematics, Addis Ababa University',
    status: 'Interview',
    appliedAt: '2026-05-12',
    notes: 'Strong references from previous school',
  },
  {
    id: 'japp-2',
    jobId: 'job-1',
    jobTitle: 'Mathematics Teacher — Grade 11 & 12',
    applicantName: 'Getachew Haile',
    email: 'getachew.h@gmail.com',
    phone: '+251-933-200002',
    experience: '2 years substitute teaching',
    education: 'B.Sc Mathematics',
    status: 'Screening',
    appliedAt: '2026-05-18',
  },
  {
    id: 'japp-3',
    jobId: 'job-2',
    jobTitle: 'Administrative Assistant',
    applicantName: 'Rahel Desta',
    email: 'rahel.desta@yahoo.com',
    phone: '+251-944-200003',
    experience: '3 years admin at private clinic',
    education: 'Diploma Business Administration',
    status: 'New',
    appliedAt: '2026-06-01',
  },
];

export const mockPerformanceReviews: PerformanceReview[] = [
  {
    id: 'perf-1',
    employeeId: 'emp-1',
    employeeName: 'Martha Feyissa',
    period: '2025/2026 Academic Year — Semester 1',
    rating: 4.5,
    goals: ['Improve student lab participation', 'Complete advanced pedagogy certification'],
    strengths: 'Excellent classroom management and student engagement',
    improvements: 'Increase use of digital assessment tools',
    status: 'Completed',
    reviewerName: 'Dr. Semeneh Tadesse',
    completedAt: '2026-01-15',
  },
  {
    id: 'perf-2',
    employeeId: 'emp-2',
    employeeName: 'Tigist Haile',
    period: '2025/2026 Academic Year — Semester 1',
    rating: 4.2,
    goals: ['Reduce enrollment processing time', 'Digitize student records'],
    strengths: 'Highly organized and detail-oriented',
    improvements: 'Cross-train on grade management system',
    status: 'Completed',
    reviewerName: 'Dr. Semeneh Tadesse',
    completedAt: '2026-01-20',
  },
  {
    id: 'perf-3',
    employeeId: 'emp-8',
    employeeName: 'Bereket Solomon',
    period: 'Probation Review — Month 3',
    rating: 3.8,
    goals: ['Master lab safety protocols', 'Support 2 practical sessions weekly'],
    strengths: 'Quick learner, reliable attendance',
    improvements: 'Build confidence in independent lab setup',
    status: 'In Progress',
    reviewerName: 'Martha Feyissa',
  },
];

export const mockOnboardingTasks: OnboardingTask[] = [
  {
    id: 'onb-1',
    employeeId: 'emp-8',
    employeeName: 'Bereket Solomon',
    task: 'Complete employment contract signing',
    assignee: 'Sara Bekele',
    dueDate: '2025-09-05',
    completed: true,
  },
  {
    id: 'onb-2',
    employeeId: 'emp-8',
    employeeName: 'Bereket Solomon',
    task: 'Lab safety orientation & certification',
    assignee: 'Martha Feyissa',
    dueDate: '2025-09-15',
    completed: true,
  },
  {
    id: 'onb-3',
    employeeId: 'emp-8',
    employeeName: 'Bereket Solomon',
    task: 'IT systems access setup',
    assignee: 'Yonas Girma',
    dueDate: '2025-09-10',
    completed: true,
  },
  {
    id: 'onb-4',
    employeeId: 'emp-8',
    employeeName: 'Bereket Solomon',
    task: '90-day probation review',
    assignee: 'Sara Bekele',
    dueDate: '2025-12-01',
    completed: false,
  },
];

export const mockStaffAttendance: StaffAttendanceRecord[] = [
  { id: 'satt-1', employeeId: 'emp-1', employeeName: 'Martha Feyissa', date: '2026-06-05', checkIn: '07:45', checkOut: '16:30', status: 'Present' },
  { id: 'satt-2', employeeId: 'emp-2', employeeName: 'Tigist Haile', date: '2026-06-05', checkIn: '08:00', checkOut: '17:00', status: 'Present' },
  { id: 'satt-3', employeeId: 'emp-5', employeeName: 'Yonas Girma', date: '2026-06-05', status: 'Absent', notes: 'Sick leave pending approval' },
  { id: 'satt-4', employeeId: 'emp-7', employeeName: 'Helen Assefa', date: '2026-06-05', status: 'On Leave' },
  { id: 'satt-5', employeeId: 'emp-3', employeeName: 'Dawit Mekonnen', date: '2026-06-05', checkIn: '08:15', checkOut: '17:15', status: 'Late' },
  { id: 'satt-6', employeeId: 'emp-6', employeeName: 'Abebe Tesfaye', date: '2026-06-05', checkIn: '06:00', checkOut: '18:00', status: 'Present' },
];

export function filterSchoolEmployees(employees: HrEmployee[]) {
  return employees.filter((e) => e.schoolId === DEMO_SCHOOL_ID);
}

export function pendingLeaveRequests(requests: LeaveRequest[]) {
  return requests.filter((r) => r.status === 'Pending');
}

export function employeesByDepartment(employees: HrEmployee[]) {
  const counts: Record<string, number> = {};
  for (const dept of HR_DEPARTMENTS) {
    counts[dept] = employees.filter((e) => e.department === dept && e.status !== 'Terminated').length;
  }
  return counts;
}

export function formatCurrency(amount: number) {
  return `ETB ${amount.toLocaleString()}`;
}

export function hrStatusBadgeVariant(
  status: EmployeeStatus | LeaveStatus | PayrollStatus | JobStatus | ApplicationStatus | ReviewStatus | StaffAttendanceStatus
): 'success' | 'warning' | 'danger' | 'neutral' | 'primary' | 'info' {
  switch (status) {
    case 'Active':
    case 'Approved':
    case 'Paid':
    case 'Open':
    case 'Hired':
    case 'Completed':
    case 'Present':
      return 'success';
    case 'Pending':
    case 'Draft':
    case 'Probation':
    case 'Screening':
    case 'Interview':
    case 'In Progress':
    case 'On Hold':
    case 'Late':
    case 'Half Day':
      return 'warning';
    case 'Rejected':
    case 'Terminated':
    case 'Absent':
    case 'Closed':
      return 'danger';
    case 'On Leave':
    case 'Processed':
    case 'Offered':
    case 'New':
      return 'info';
    case 'Cancelled':
      return 'neutral';
    default:
      return 'neutral';
  }
}

export function generateEmployeeId(existing: HrEmployee[]) {
  const year = new Date().getFullYear();
  const count = existing.length + 1;
  return `EMP-${year}-${String(count).padStart(3, '0')}`;
}
