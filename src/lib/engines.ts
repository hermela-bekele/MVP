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

const SCHOOL_HEAD_REGULATORY_LABEL = 'Regulatory & Resource Engine';
const MOE_CURRICULUM_LABEL = 'Resource & Communication';
const MOE_CURRICULUM_DESCRIPTION = 'School communication and resource uploads.';
const HEAD_OF_ACADEMICS_CURRICULUM_DESCRIPTION = 'Academic results, transcripts, calendar, and professional development.';

export const ENGINE_DESCRIPTIONS: Record<EngineId, string> = {
  administrative: 'School operations, staff management, and oversight.',
  registrar: 'Student admissions, enrollment, and records.',
  curriculum: 'Curriculum planning and resources.',
  regulatory: 'MOE compliance and communication.',
  training: 'Professional development programs.',
  academic: 'Lesson plan approval, teacher development, and assessments.',
  teaching: 'Lesson plans, assessments, attendance, and training.',
  management: 'Classroom and student administration.',
  communications: 'Messaging, feedback, and check-ins.',
};

/** Which engines each role may choose between. Empty = no engine selection for that role. */
export const ROLE_ENGINES: Record<PortalRole, EngineId[]> = {
  moe: ['administrative', 'curriculum', 'training'],
  'school-head': ['administrative', 'regulatory', 'training', 'communications'],
  registrar: ['registrar'],
  hr: ['administrative', 'training'],
  'head-of-academics': ['administrative', 'curriculum', 'training', 'communications'],
  'department-head': ['administrative', 'academic', 'training', 'communications'],
  teacher: ['teaching', 'management', 'training', 'communications'],
  student: [],
  parent: [],
  finance: [],
};

export function enginesForRole(role: PortalRole): EngineId[] {
  return ROLE_ENGINES[role] ?? [];
}

/** Display label for an engine. */
export function engineLabel(engine: EngineId, role?: PortalRole): string {
  if (engine === 'regulatory' && role === 'school-head') {
    return SCHOOL_HEAD_REGULATORY_LABEL;
  }
  if (engine === 'curriculum' && role === 'moe') {
    return MOE_CURRICULUM_LABEL;
  }
  return ENGINE_LABELS[engine];
}

export function engineDescription(engine: EngineId, role?: PortalRole): string {
  if (engine === 'curriculum' && role === 'moe') {
    return MOE_CURRICULUM_DESCRIPTION;
  }
  if (engine === 'curriculum' && role === 'head-of-academics') {
    return HEAD_OF_ACADEMICS_CURRICULUM_DESCRIPTION;
  }
  return ENGINE_DESCRIPTIONS[engine];
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

export function defaultTabForEngine(role: PortalRole, engine: EngineId): string {
  if (role === 'department-head') {
    const tabs: Partial<Record<EngineId, string>> = {
      administrative: 'dashboard',
      academic: 'reports',
      training: 'training',
      communications: 'communication',
    };
    return tabs[engine] ?? 'dashboard';
  }
  if (role === 'head-of-academics') {
    const tabs: Partial<Record<EngineId, string>> = {
      administrative: 'dashboard',
      curriculum: 'academic-results',
      training: 'my-development',
      communications: 'communication',
    };
    return tabs[engine] ?? 'dashboard';
  }
  if (role === 'teacher') {
    const tabs: Partial<Record<EngineId, string>> = {
      teaching: 'assessments',
      management: 'manage-students',
      training: 'training',
      communications: 'communication',
    };
    return tabs[engine] ?? 'assessments';
  }
  return 'dashboard';
}
