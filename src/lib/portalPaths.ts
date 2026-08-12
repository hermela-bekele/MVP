/** Map portal sidebar tabs to URL paths under /dashboard/{role}. */

export function portalBasePath(role: string | null | undefined): string {
  switch (role) {
    case 'teacher':
      return '/dashboard/teacher';
    case 'department-head':
      return '/dashboard/department-head';
    case 'vice-principal':
      return '/dashboard/vice-principal';
    case 'school-head':
      return '/dashboard/school-head';
    case 'student':
      return '/dashboard/student';
    case 'parent':
      return '/dashboard/parent';
    case 'moe':
      return '/dashboard/moe';
    case 'hr':
      return '/dashboard/hr';
    case 'registrar':
      return '/dashboard/registrar';
    case 'curriculum-head':
      return '/dashboard/curriculum-head';
    case 'finance':
      return '/dashboard/finance';
    default:
      return '/dashboard';
  }
}

/** Path for a portal tab. Dashboard stays at the role root. */
export function portalTabPath(role: string | null | undefined, tab: string): string {
  const base = portalBasePath(role);
  if (!tab || tab === 'dashboard') return base;
  return `${base}/${tab}`;
}

/** Resolve active tab from pathname under a role base. */
export function tabFromPortalPath(pathname: string, role: string | null | undefined): string {
  const base = portalBasePath(role);
  if (!pathname.startsWith(base)) return 'dashboard';
  const rest = pathname.slice(base.length).replace(/^\//, '');
  if (!rest) return 'dashboard';
  const first = rest.split('/')[0];
  return first || 'dashboard';
}
