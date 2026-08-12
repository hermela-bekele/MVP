import type { PortalRole } from './auth';

export const ENGINES = [
  'administrative',
  'registrar',
  'curriculum',
  'training',
  'academic',
] as const;

export type EngineId = (typeof ENGINES)[number];

export function isEngineId(value: string): value is EngineId {
  return (ENGINES as readonly string[]).includes(value);
}

export const ENGINE_LABELS: Record<EngineId, string> = {
  administrative: 'Administrative Engine',
  registrar: 'Registrar Engine',
  curriculum: 'Curriculum Engine',
  training: 'Training Engine',
  academic: 'Academic Engine',
};

export const ENGINE_DESCRIPTIONS: Record<EngineId, string> = {
  administrative: 'School operations, staff, resources, and oversight.',
  registrar: 'Admissions, enrollment, and student records.',
  curriculum: 'Curriculum planning and instructional resources.',
  training: 'Professional development and training programs.',
  academic: 'Classes, students, grading, and day-to-day instruction.',
};

/** Which engines each role may choose between. Empty = no engine selection for that role. */
export const ROLE_ENGINES: Record<PortalRole, EngineId[]> = {
  moe: ['administrative', 'curriculum', 'training'],
  'school-head': ['administrative', 'curriculum', 'training'],
  registrar: ['registrar', 'administrative'],
  hr: ['administrative', 'training'],
  'curriculum-head': ['curriculum'],
  'department-head': ['administrative', 'academic', 'training'],
  teacher: ['academic', 'training'],
  student: [],
  parent: [],
  finance: [],
};

export function enginesForRole(role: PortalRole): EngineId[] {
  return ROLE_ENGINES[role] ?? [];
}

/** True if the role must choose an engine before entering the dashboard. */
export function requiresEngineSelection(role: PortalRole): boolean {
  return enginesForRole(role).length > 1;
}

/** The single engine a role is locked to, if it has exactly one choice. */
export function defaultEngineForRole(role: PortalRole): EngineId | null {
  const engines = enginesForRole(role);
  return engines.length === 1 ? engines[0] : null;
}
