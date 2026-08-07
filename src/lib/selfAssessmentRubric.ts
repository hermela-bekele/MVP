// STEP (School-Based Teaching Excellence Program) self-assessment rubric.
// Teachers self-rate each competency 1 (developing) – 5 (exemplary). The result
// is recorded and shared with the HoD, who uses the weakest competency together
// with AI gap-analysis on student results to decide what training to assign.

export interface SelfAssessmentCompetency {
  id: string;
  category: string;
  label: string;
  description: string;
}

export const SELF_ASSESSMENT_COMPETENCIES: SelfAssessmentCompetency[] = [
  {
    id: 'planning',
    category: 'Planning & Content Knowledge',
    label: 'Lesson planning & pacing',
    description: 'I plan lessons with clear objectives and pace content to fit the time available.',
  },
  {
    id: 'content-knowledge',
    category: 'Planning & Content Knowledge',
    label: 'Subject mastery',
    description: 'I have strong command of the subject content I teach, including common misconceptions.',
  },
  {
    id: 'delivery',
    category: 'Instructional Delivery',
    label: 'Clear explanation & modeling',
    description: 'I explain new concepts clearly and model worked examples before independent practice.',
  },
  {
    id: 'engagement',
    category: 'Instructional Delivery',
    label: 'Student engagement',
    description: 'I use questioning and activities that keep most students actively engaged, not passive.',
  },
  {
    id: 'classroom-management',
    category: 'Classroom Management',
    label: 'Classroom management',
    description: 'I manage transitions and behavior calmly, with minimal lost instructional time.',
  },
  {
    id: 'assessment',
    category: 'Assessment & Feedback',
    label: 'Checking for understanding',
    description: 'I regularly check whether students actually understood before moving on.',
  },
  {
    id: 'feedback',
    category: 'Assessment & Feedback',
    label: 'Feedback quality',
    description: 'The feedback I give on assessments helps students understand what to do differently next time.',
  },
  {
    id: 'inclusion',
    category: 'Inclusion & Differentiation',
    label: 'Supporting struggling students',
    description: 'I adapt instruction or provide extra support for students who are falling behind.',
  },
  {
    id: 'reflection',
    category: 'Reflection & Growth',
    label: 'Reflective practice',
    description: 'I regularly reflect on what worked and didn\'t in my lessons and adjust accordingly.',
  },
];

export interface SelfAssessmentResponse {
  competencyId: string;
  rating: number; // 1-5
}

export function scoreSelfAssessment(responses: SelfAssessmentResponse[]): {
  overallScore: number;
  weakestCompetencyId?: string;
} {
  if (responses.length === 0) return { overallScore: 0 };
  const total = responses.reduce((sum, r) => sum + r.rating, 0);
  const overallScore = Math.round((total / (responses.length * 5)) * 100);
  const weakest = responses.reduce((min, r) => (r.rating < min.rating ? r : min), responses[0]);
  return { overallScore, weakestCompetencyId: weakest.competencyId };
}

export function getCompetencyLabel(id: string): string {
  return SELF_ASSESSMENT_COMPETENCIES.find((c) => c.id === id)?.label ?? id;
}
