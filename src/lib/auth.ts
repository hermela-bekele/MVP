export interface AuthUser {
  id: string;
  email: string;
  role: PortalRole;
  displayName: string;
  /** Subject overseen by a department-head (e.g. Mathematics) */
  subject?: string;
  /** Department linked to the subject head */
  departmentId?: string;
}

export const PORTAL_ROLES = [
  'moe',
  'school-head',
  'registrar',
  'hr',
  'curriculum-head',
  'department-head',
  'teacher',
  'student',
  'parent',
] as const;

export type PortalRole = (typeof PORTAL_ROLES)[number];

/** Roles users may choose when self-registering */
export const SELF_REGISTER_ROLES: PortalRole[] = [...PORTAL_ROLES];

export const SESSION_STORAGE_KEY = 'pts-session';

export function isPortalRole(value: string): value is PortalRole {
  return (PORTAL_ROLES as readonly string[]).includes(value);
}

export function dashboardPathForRole(role: PortalRole): string {
  return `/dashboard/${role}`;
}

export function roleLabel(role: PortalRole): string {
  const labels: Record<PortalRole, string> = {
    moe: 'MOE Admin',
    'school-head': 'School Head',
    registrar: 'Registrar Officer',
    hr: 'HR Officer',
    'curriculum-head': 'Curriculum Head',
    'department-head': 'Department Head',
    teacher: 'Teacher',
    student: 'Student',
    parent: 'Parent',
  };
  return labels[role];
}

export function readStoredSession(): AuthUser | null {
  if (typeof window === 'undefined') return null;

  const raw =
    localStorage.getItem(SESSION_STORAGE_KEY) ??
    sessionStorage.getItem(SESSION_STORAGE_KEY);

  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as AuthUser;
    if (
      parsed?.id &&
      parsed?.email &&
      parsed?.displayName &&
      isPortalRole(parsed.role)
    ) {
      return parsed;
    }
  } catch {
    /* ignore corrupt session */
  }

  return null;
}

export function persistSession(user: AuthUser, remember: boolean): void {
  localStorage.removeItem(SESSION_STORAGE_KEY);
  sessionStorage.removeItem(SESSION_STORAGE_KEY);
  localStorage.removeItem('pts-active-role');

  const storage = remember ? localStorage : sessionStorage;
  storage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_STORAGE_KEY);
  sessionStorage.removeItem(SESSION_STORAGE_KEY);
  localStorage.removeItem('pts-active-role');
}
