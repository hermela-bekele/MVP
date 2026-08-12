import type { PortalRole } from './auth';

export const ENGINES = [
  'administrative',
  'registrar',
  'curriculum',
  'regulatory',
  'training',
  'academic',
  'teaching',
  'management',
  'communications',
] as const;

export type EngineId = (typeof ENGINES)[number];

export function isEngineId(value: string): value is EngineId {
  return (ENGINES as readonly string[]).includes(value);
}

export const ENGINE_LABELS: Record<EngineId, string> = {
  administrative: 'Administrative Engine',
  registrar: 'Registrar Engine',
  curriculum: 'Curriculum Engine',
  regulatory: 'Regulatory Engine',
  training: 'Training Engine',
  academic: 'Academic Engine',
  teaching: 'Teaching Engine',
  management: 'Class Management Engine',
  communications: 'Communications Engine',
};

export const ENGINE_DESCRIPTIONS: Record<EngineId, string> = {
  administrative: 'School operations, staff, resources, and oversight.',
  registrar: 'Admissions, enrollment, and student records.',
  curriculum: 'Curriculum planning and instructional resources.',
  regulatory: 'MOE compliance, circulars, and direct communication with the Ministry of Education.',
  training: 'Professional development and training programs.',
  academic: 'Classes, students, grading, and day-to-day instruction.',
  teaching: 'Lesson delivery, teaching notes, assessments, and resources.',
  management: 'Classroom, student, and attendance administration.',
  communications: 'Messaging, feedback, and check-ins across the school.',
};

/** Which engines each role may choose between. Empty = no engine selection for that role. */
export const ROLE_ENGINES: Record<PortalRole, EngineId[]> = {
  moe: ['administrative', 'curriculum', 'training'],
  'school-head': ['administrative', 'regulatory', 'training', 'communications'],
  registrar: ['registrar', 'administrative'],
  hr: ['administrative', 'training'],
  'head-of-academics': ['curriculum', 'training'],
  'department-head': ['administrative', 'academic', 'training', 'communications'],
  teacher: ['teaching', 'management', 'training', 'communications'],
  student: [],
  parent: [],
  finance: [],
};

export function enginesForRole(role: PortalRole): EngineId[] {
  return ROLE_ENGINES[role] ?? [];
}

/** Display label for an engine. The Training engine reads "Leadership Training Engine"
 * for every role except teacher, since only teachers use it for their own classroom
 * professional development — everyone else uses it to manage/track leadership training. */
export function engineLabel(engine: EngineId, role?: PortalRole): string {
  if (engine === 'training' && role && role !== 'teacher') {
    return 'Leadership Training Engine';
  }
  return ENGINE_LABELS[engine];
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
