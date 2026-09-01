import { LessonPlan, Student } from './mockData';
import type { AnnualLessonPlanResult } from './annualLessonPlan';

// Simulated latency helper
export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface AILessonPlanResult {
  title: string;
  objectives: string[];
  activities: { session: number; activity: string; duration: string }[];
  assessments: string[];
  homework: string;
}

export interface AnnualPlanUnit {
  order: number;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  volume: 'Low' | 'Medium' | 'High';
  estimatedDays: number;
  objectives: string[];
  teacherMustInclude: string[];
  expectedOutcomes: string[];
}

export interface AnnualLessonPlanWeekRowAI {
  semester: string;
  month: string;
  week: string;
  date: string;
  unit: string;
  contents: string[];
  periodsNeeded: number;
  page: string;
  generalObjectives: string[];
  teachingMethods: string[];
  teachingAids: string[];
  evaluationMethods: string[];
  homework?: string[];
  comments?: string;
}

export interface AnnualLessonPlanMetaAI {
  academicYear?: string;
  schoolName?: string;
  teacherName?: string;
  grade?: string;
  subject?: string;
  schoolDaysPerYear?: number;
  periodsPerWeek?: number;
  periodsPerYear?: number;
  referenceMaterials?: string;
  generalObjectives?: string[];
}

export interface WeeklyProcedureRow {
  stage: string;
  time: string;
  lessonContents: string;
  teacherActivity: string;
  studentActivity: string;
  teachingAid: string;
  reference: string;
}

export interface WeeklySpecialNeeds {
  active: string;
  medium: string;
  slow: string;
}

export interface WeeklyLessonSession {
  sessionNumber: number;
  subject: string;
  mainTopic: string;
  subTopic: string;
  /** Real textbook subtopic id this session covers (e.g. "1.3.1"), when the annual-plan
   * content item resolved to verified textbook subtopics — locked server-side, never
   * LLM-invented. Absent for subjects/content without subtopic-extraction support. */
  subtopicId?: string;
  textbookPages?: string;
  /** Teaching approach chosen for this specific subtopic/objective (e.g. "Guided discovery",
   * "Direct instruction with worked examples") — free-form pedagogical framing, not a
   * grounding-verified field. */
  teachingMethodology?: string;
  prerequisiteKnowledge: string;
  rationale: string;
  objectives: string[];
  durationMinutes?: number;
  /** School template rows (preferred) */
  procedures?: WeeklyProcedureRow[];
  specialNeeds?: WeeklySpecialNeeds;
  /** Legacy 3-phase shape (still accepted / migrated server-side) */
  teachingApproach?: {
    startingActivity: {
      time: string;
      content: string;
      teacherActivity: string;
      studentActivity: string;
      teachingAids: string[];
      assessment: string;
    };
    mainActivity: {
      time: string;
      content: string;
      teacherActivity: string;
      studentActivity: string;
      teachingAids: string[];
      assessment: string;
    };
    concludingActivity: {
      time: string;
      content: string;
      teacherActivity: string;
      studentActivity: string;
      teachingAids: string[];
      assessment: string;
    };
  };
}

export interface AIDetailedLessonPlanResult {
  type: 'yearly' | 'monthly' | 'weekly';
  subject: string;
  mainTopic: string;
  subTopic: string;
  prerequisiteKnowledge: string;
  rationale: string;
  objectives: string[];
  sources?: { page?: number | string; topic?: string; note?: string }[];
  /** Legacy unit-card annual format */
  units?: AnnualPlanUnit[];
  /** Template-aligned annual table rows (preferred) */
  weeks?: AnnualLessonPlanWeekRowAI[];
  meta?: AnnualLessonPlanMetaAI;
  sessions?: WeeklyLessonSession[];
  overview?: string; // For yearly and monthly
}

export interface AITeachingNotesResult {
  title: string;
  language: string;
  introduction: string;
  explanations: { subtitle: string; content: string; examples: string[] }[];
  visualAids: string[];
  exercises: string[];
}

// AI Service Wrapper with Server-Side Shared Caching
class AIService {
  // Use local Next.js API routes that have server-side caching
  private apiUrl = '/api/ai';
  private primeAiUrl = process.env.NEXT_PUBLIC_PRIME_AI_API_URL || 'https://prime-ai-bndr.onrender.com';
  private useFallback = process.env.NEXT_PUBLIC_AI_FALLBACK_MODE === 'true';
  private useLocalCache = true; // Client-side cache as secondary layer
  private cache: Map<string, any> = new Map();
  private readonly CACHE_STORAGE_KEY = 'prime_ai_cache';

  constructor() {
    // Load cache from localStorage on initialization (secondary cache)
    this.loadCacheFromStorage();
    
    // Debug log on initialization
    console.log('🤖 AI Service Initialized:');
    console.log('   API Mode: Server-side cached (shared across all users)');
    console.log('   Prime AI URL:', this.primeAiUrl);
    console.log('   Fallback Mode:', this.useFallback ? '⚠️ ENABLED (using templates)' : '✅ DISABLED (using real AI)');
    console.log(`   Client cache loaded: ${this.cache.size} items`);
  }

  private loadCacheFromStorage(): void {
    if (typeof window === 'undefined') return; // Skip on server-side
    
    try {
      const stored = localStorage.getItem(this.CACHE_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.cache = new Map(Object.entries(parsed));
        console.log(`💾 Loaded ${this.cache.size} cached responses from localStorage`);
      }
    } catch (error) {
      console.warn('⚠️ Failed to load cache from storage:', error);
    }
  }

  private saveCacheToStorage(): void {
    if (typeof window === 'undefined') return; // Skip on server-side
    
    try {
      const cacheObj = Object.fromEntries(this.cache);
      localStorage.setItem(this.CACHE_STORAGE_KEY, JSON.stringify(cacheObj));
    } catch (error) {
      console.warn('⚠️ Failed to save cache to storage:', error);
    }
  }

  private getCacheKey(endpoint: string, payload: any): string {
    return `${endpoint}:${JSON.stringify(payload)}`;
  }

  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached) {
      console.log('✅ Using cached AI response (permanent cache)');
      return cached;
    }
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, data);
    this.saveCacheToStorage(); // Persist to localStorage
    console.log(`💾 Cached AI response permanently (Total cached: ${this.cache.size})`);
  }

  private async callPrimeAI(endpoint: string, payload: any): Promise<any> {
    if (this.useFallback) {
      console.warn('⚠️ AI Fallback Mode is enabled. Using template generation.');
      throw new Error('Fallback mode enabled');
    }

    // Check client-side cache first (secondary layer)
    if (this.useLocalCache) {
      const cacheKey = this.getCacheKey(endpoint, payload);
      const cachedResult = this.getFromCache(cacheKey);
      if (cachedResult) {
        return cachedResult;
      }
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      throw new Error(
        'Offline — AI generation needs a connection (cached responses for the same request still work).',
      );
    }

    // Bounded slightly above the Next.js route's own `maxDuration = 120` so the browser waits
    // for that route to finish and return its own (always-valid-JSON) error response instead
    // of aborting the connection first — an abort here would itself look like a truncated
    // response to whatever reads it next.
    const REQUEST_TIMEOUT_MS = 130_000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      // Call local Next.js API route (has server-side cache)
      const localEndpoint = `${this.apiUrl}${endpoint}`;
      console.log(`🚀 Calling cached API: ${localEndpoint}`);

      const response = await fetch(localEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ API Error (${response.status}):`, errorText);
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      // Parse defensively: a response that resolves with ok:true can still be an empty or
      // truncated body if the connection was interrupted after headers were sent (e.g. a dev
      // server reload mid-request) — reading as text first lets us report exactly what was
      // received instead of letting a bare `SyntaxError: Unexpected end of JSON input`
      // surface to the user with no context.
      const rawText = await response.text();
      let result: any;
      try {
        result = JSON.parse(rawText);
      } catch (parseError) {
        const preview = rawText.slice(0, 200);
        throw new Error(
          rawText.trim().length === 0
            ? 'Prime AI returned an empty response (the connection may have been interrupted mid-request) — please try again.'
            : `Prime AI returned a malformed response and could not be read (${preview}${rawText.length > 200 ? '…' : ''}) — please try again.`,
          { cause: parseError },
        );
      }

      // Log cache status
      if (result.cached) {
        console.log(`✅ [SERVER CACHE HIT] Response from shared server cache (age: ${result.cacheAge} min)`);
      } else {
        console.log(`✅ [NEW] Fresh response from Prime AI, now cached for all users`);
      }
      
      // Store in client-side cache as well (secondary layer)
      if (this.useLocalCache) {
        const cacheKey = this.getCacheKey(endpoint, payload);
        this.setCache(cacheKey, result);
      }
      
      return result;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        const timeoutErr = new Error(
          `Prime AI request timed out after ${REQUEST_TIMEOUT_MS / 1000}s — the generation may still finish server-side and be served from cache on retry.`,
        );
        console.error('❌ Prime AI API call failed:', timeoutErr);
        throw timeoutErr;
      }
      console.error('❌ Prime AI API call failed:', error);
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // Clear cache manually if needed
  clearCache(): void {
    this.cache.clear();
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.CACHE_STORAGE_KEY);
    }
    console.log('🗑️ AI cache cleared from memory and storage');
  }

  // Get cache stats
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  async generateDetailedLessonPlan(params: {
    plan_type: 'yearly' | 'monthly' | 'weekly';
    grade: string;
    subject: string;
    topic?: string;
    subtopic?: string;
    student_level?: 'differentiated' | 'beginner' | 'intermediate' | 'advanced';
    periods_per_week?: number;
    session_duration?: number;
    learning_days_per_year?: number;
    days_per_week?: number;
    /** Scaffolded teaching weeks from the disseminated school calendar */
    calendar_weeks?: {
      id: string;
      semester: string;
      month: string;
      week: string;
      date: string;
      periodsAvailable: number;
      teachingDays?: number;
      minutesAvailable?: number;
      isTeachingWeek?: boolean;
      note?: string;
    }[];
    /** Full-year calendar weeks for map-based unit/page allocation across batches */
    year_calendar_weeks?: {
      id: string;
      semester: string;
      month: string;
      week: string;
      date: string;
      periodsAvailable: number;
      teachingDays?: number;
      minutesAvailable?: number;
      isTeachingWeek?: boolean;
      note?: string;
    }[];
    non_teaching_windows?: string[];
    /** Aids the teacher actually has — plan must only use these */
    teaching_aids?: string[];
    teacher_name?: string;
    school_name?: string;
    academic_year?: string;
    reference_materials?: string;
    /** Pacing/continuity instructions for this batch of a multi-batch annual plan. Kept
     * separate from `topic` — `topic` is embedded as the retrieval query on the backend, and
     * a paragraph of scheduling instructions there degrades retrieval relevance. */
    continuation_notes?: string;
    /** 0-based index of this batch and the total batch count, for a multi-batch annual plan —
     * lets the backend hand back a distinct slice of source material per batch instead of
     * every batch retrieving the same top-K chunks. */
    batch_index?: number;
    total_batches?: number;
    /** Weekly-plan-only: the annual-plan week this weekly plan is derived from. Contents and
     * general objectives are inherited verbatim (never regenerated) by the backend; the RAG
     * pipeline drills these content lines down into real, verified textbook subtopics. */
    annual_contents?: string[];
    annual_general_objectives?: string[];
    annual_unit_label?: string;
    /** Subtopic ids already covered by an earlier week's weekly plan for the same annual
     * content item — lets a later week continue from the next real subtopic instead of
     * repeating one already taught. */
    already_covered_subtopic_ids?: string[];
  }): Promise<{ plan: AIDetailedLessonPlanResult; sources: { page?: number; topic?: string }[] }> {
    const result = await this.callPrimeAI('/detailed-lesson-plan', {
      plan_type: params.plan_type,
      grade: params.grade,
      subject: params.subject,
      topic: params.topic ?? '',
      subtopic: params.subtopic ?? '',
      student_level: params.student_level ?? 'differentiated',
      periods_per_week: params.periods_per_week ?? 3,
      session_duration: params.session_duration ?? 45,
      learning_days_per_year: params.learning_days_per_year ?? 180,
      days_per_week: params.days_per_week ?? 5,
      calendar_weeks: params.calendar_weeks ?? [],
      year_calendar_weeks: params.year_calendar_weeks ?? [],
      non_teaching_windows: params.non_teaching_windows ?? [],
      teaching_aids: params.teaching_aids ?? [],
      teacher_name: params.teacher_name ?? '',
      school_name: params.school_name ?? '',
      academic_year: params.academic_year ?? '',
      reference_materials: params.reference_materials ?? 'TEXT BOOK',
      continuation_notes: params.continuation_notes ?? '',
      batch_index: params.batch_index ?? 0,
      total_batches: params.total_batches ?? 1,
      annual_contents: params.annual_contents ?? [],
      annual_general_objectives: params.annual_general_objectives ?? [],
      annual_unit_label: params.annual_unit_label ?? '',
      already_covered_subtopic_ids: params.already_covered_subtopic_ids ?? [],
    });

    const plan = (result.plan ?? result) as AIDetailedLessonPlanResult;
    const sources = (result.sources ?? []) as { page?: number; topic?: string }[];
    const isYearly = params.plan_type === 'yearly';

    return {
      plan: {
        ...plan,
        subTopic: plan.subTopic ?? (plan as { subtopic?: string }).subtopic ?? '',
        sources: isYearly ? sources : sources,
        units: plan.units ?? (plan as { units?: AnnualPlanUnit[] }).units,
        weeks: plan.weeks,
        meta: plan.meta,
      },
      sources,
    };
  }

  async generateTeachingNotes(params: {
    topic: string;
    subtopic?: string;
    grade?: string;
    subject?: string;
    language?: string;
    sessionContext?: string;
    studentLevel?: string;
    /** "Explain more": ask for one thorough deep-dive on the concept instead of a
     * full objectives/practice/wrap-up note. */
    deepDive?: boolean;
  } | string): Promise<{ content: string }> {
    const normalized =
      typeof params === 'string'
        ? {
            topic:
              params.match(/topic:\s*([^\n]+)/i)?.[1]?.trim() ?? 'General Mathematics',
            subtopic: params.match(/subtopic:\s*([^\n]+)/i)?.[1]?.trim() ?? '',
            grade: params.match(/grade:\s*([^\n]+)/i)?.[1]?.trim() ?? 'Grade 9',
            subject: params.match(/subject:\s*([^\n]+)/i)?.[1]?.trim() ?? 'Biology',
            language: params.match(/language:\s*([^\n]+)/i)?.[1]?.trim() ?? 'English',
            sessionContext:
              params.match(/session_context:\s*([\s\S]+)/i)?.[1]?.trim() ?? '',
            studentLevel: 'differentiated',
            deepDive: false,
          }
        : params;

    const {
      topic,
      subtopic = '',
      grade = 'Grade 9',
      subject = 'Biology',
      language = 'English',
      sessionContext = '',
      studentLevel = 'differentiated',
      deepDive = false,
    } = normalized;

    try {
      console.log('📖 generateTeachingNotes called');
      console.log('   Topic:', topic);

      const result = await this.callPrimeAI('/lesson-notes', {
        topic,
        subtopic,
        session_context: sessionContext,
        student_level: studentLevel,
        grade,
        subject,
        deep_dive: deepDive,
      });

      console.log('✅ Prime AI returned teaching notes');
      return { content: result.content || JSON.stringify(result) };
    } catch (error) {
      // Previously fell back to a hardcoded mock (generic content unrelated to the
      // requested topic/textbook) presented as a real generation. Surface the real
      // failure instead so the caller shows an actual error.
      console.error('❌ generateTeachingNotes failed:', error);
      throw error;
    }
  }
}

export const aiService = new AIService();

/** Maps UI question format labels to Prime AI backend keys. */
export function normalizeQuestionFormat(format: string): string {
  const key = format.toLowerCase().replace(/\s+/g, '_').replace(/\//g, '_');
  const aliases: Record<string, string> = {
    multiple_choice: 'multiple_choice',
    writing: 'writing',
    fill_the_blank: 'fill_in_the_blank',
    fill_in_the_blank: 'fill_in_the_blank',
    matching: 'matching',
    true_false: 'true_false',
    mixed: 'mixed',
    mcq: 'multiple_choice',
    short_answer: 'writing',
  };
  return aliases[key] ?? key;
}

export function parseAnnualPlanDetail(plan: LessonPlan): AnnualLessonPlanResult | null {
  if (!plan.planDetail) return null;
  try {
    const parsed = JSON.parse(plan.planDetail) as AnnualLessonPlanResult;
    if (parsed?.weeks?.length) return parsed;
  } catch {
    /* ignore */
  }
  return null;
}

export function parseWeeklyPlanDetail(plan: LessonPlan): AIDetailedLessonPlanResult | null {
  if (!plan.planDetail) return null;
  try {
    const parsed = JSON.parse(plan.planDetail) as AIDetailedLessonPlanResult;
    if (parsed?.type === 'weekly' || parsed?.sessions?.length) return parsed;
  } catch {
    /* ignore */
  }
  return null;
}

export function getAnnualMonthOptions(annual: AnnualLessonPlanResult): string[] {
  const months: string[] = [];
  for (const w of annual.weeks || []) {
    if (w.month && !months.includes(w.month)) months.push(w.month);
  }
  return months;
}

/** Unique topic options from a published annual lesson plan (units + weekly contents). */
export function getAnnualPlanTopicOptions(plan: LessonPlan): {
  value: string;
  label: string;
  topic: string;
}[] {
  const annual = parseAnnualPlanDetail(plan);
  if (!annual?.weeks?.length) return [];

  const seen = new Set<string>();
  const options: { value: string; label: string; topic: string }[] = [];

  const push = (raw: string, kind: 'unit' | 'content') => {
    const topic = raw.replace(/\s+/g, ' ').trim();
    if (!topic || topic === '—' || topic === '-') return;
    const key = topic.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    options.push({
      value: `${kind}:${key}`,
      label: kind === 'unit' ? `Unit: ${topic}` : topic,
      topic,
    });
  };

  for (const week of annual.weeks) {
    if (week.unit) push(week.unit, 'unit');
    for (const content of week.contents || []) {
      push(content, 'content');
    }
  }

  return options;
}

export function getAnnualWeeksForMonth(annual: AnnualLessonPlanResult, month: string) {
  return (annual.weeks || []).filter((w) => w.month === month);
}

/** Session topic options from a weekly detailed plan (for teaching notes). */
export function getWeeklyPlanSessionTopicOptions(plan: LessonPlan) {
  const weekly = parseWeeklyPlanDetail(plan);
  const planObjectives = (plan.objectives || []).filter(Boolean);
  const weeklyObjectives = (weekly?.objectives || []).filter(Boolean);
  const allObjectives = [...new Set([...planObjectives, ...weeklyObjectives])];

  if (weekly?.sessions?.length) {
    const sessionOptions = weekly.sessions.map((s) => ({
      value: String(s.sessionNumber),
      label: `Session ${s.sessionNumber}: ${s.subTopic || s.mainTopic}${
        s.textbookPages ? ` (${s.textbookPages})` : ''
      }`,
      topic: s.subTopic || s.mainTopic || plan.title,
      subtopic: s.textbookPages || '',
      context: [
        `Weekly lesson plan: ${plan.title}`,
        `Focus: Session ${s.sessionNumber} — ${s.subTopic || s.mainTopic}`,
        s.textbookPages ? `Textbook pages: ${s.textbookPages}` : '',
        `Assessment topic (use ONLY this): ${s.subTopic || s.mainTopic || plan.title}`,
        allObjectives.length
          ? `Lesson plan objectives:\n${allObjectives.map((o) => `- ${o}`).join('\n')}`
          : '',
        (s.objectives || []).length
          ? `Session objectives:\n${(s.objectives || []).map((o) => `- ${o}`).join('\n')}`
          : '',
        ...(s.procedures || []).map(
          (p) => `${p.stage}: ${p.lessonContents} [${p.reference}]`,
        ),
      ]
        .filter(Boolean)
        .join('\n'),
    }));

    const allSessionsTopic =
      weekly.mainTopic ||
      weekly.sessions.map((s) => s.subTopic || s.mainTopic).filter(Boolean).join('; ') ||
      plan.title;

    const allPages = [
      ...new Set(
        weekly.sessions.map((s) => s.textbookPages).filter((p): p is string => Boolean(p?.trim())),
      ),
    ].join('; ');

    const allSessionsContext = [
      `Weekly lesson plan: ${plan.title}`,
      `Focus: ALL ${weekly.sessions.length} sessions this week`,
      weekly.mainTopic ? `Main topic: ${weekly.mainTopic}` : '',
      weekly.subTopic ? `Subtopic: ${weekly.subTopic}` : '',
      allPages ? `Textbook pages: ${allPages}` : '',
      `Assessment topic (use ONLY this): ${allSessionsTopic}`,
      allObjectives.length
        ? `Lesson plan objectives:\n${allObjectives.map((o) => `- ${o}`).join('\n')}`
        : '',
      '',
      'Sessions:',
      ...weekly.sessions.flatMap((s) => [
        `Session ${s.sessionNumber}: ${s.subTopic || s.mainTopic}${
          s.textbookPages ? ` (${s.textbookPages})` : ''
        }`,
        ...((s.objectives || []).map((o) => `  - ${o}`)),
      ]),
    ]
      .filter((line) => line !== undefined)
      .join('\n');

    return [
      {
        value: 'all',
        label: `All sessions (${weekly.sessions.length})`,
        topic: allSessionsTopic,
        subtopic: allPages || weekly.subTopic || '',
        context: allSessionsContext,
      },
      ...sessionOptions,
    ];
  }

  return getLessonPlanSessionOptions(plan).map((o) => ({
    ...o,
    topic:
      o.value === 'all'
        ? plan.title
        : plan.activities.find((a) => String(a.session) === o.value)?.activity || plan.title,
    subtopic: o.value === 'all' ? '' : o.label,
    context:
      o.value === 'all'
        ? buildLessonPlanContext(plan)
        : [
            `Lesson plan: ${plan.title}`,
            `Focus: ${o.label}`,
            planObjectives.length
              ? `Lesson plan objectives:\n${planObjectives.map((obj) => `- ${obj}`).join('\n')}`
              : '',
          ]
            .filter(Boolean)
            .join('\n'),
  }));
}

export function getLessonPlanSessionOptions(plan: LessonPlan) {
  const sessionOptions =
    plan.activities.length > 0
      ? plan.activities.map((a) => ({
          value: String(a.session),
          label: `Session ${a.session}: ${a.activity} (${a.duration})`,
        }))
      : Array.from({ length: plan.sessions }, (_, i) => ({
          value: String(i + 1),
          label: `Session ${i + 1}`,
        }));

  return [
    {
      value: 'all',
      label: `Whole lesson plan (${plan.sessions} session${plan.sessions === 1 ? '' : 's'})`,
    },
    ...sessionOptions,
  ];
}

export function resolveSessionScope(plan: LessonPlan, scope: string) {
  if (scope === 'all') {
    return {
      topic: plan.title,
      subtopic: plan.objectives[0] ?? '',
      sessionContext: buildLessonPlanContext(plan),
      label: `All sessions — ${plan.title}`,
    };
  }

  const sessionNum = Number(scope);
  const activity = plan.activities.find((a) => a.session === sessionNum);
  const activityLine = activity
    ? `Activity: ${activity.activity} (${activity.duration})`
    : '';

  return {
    topic: plan.title,
    subtopic: activity?.activity ?? `Session ${sessionNum}`,
    sessionContext: [
      `Lesson plan: ${plan.title}`,
      `Focus: Session ${sessionNum}`,
      activityLine,
      plan.objectives.length
        ? `Objectives:\n${plan.objectives.map((o) => `- ${o}`).join('\n')}`
        : '',
    ]
      .filter(Boolean)
      .join('\n'),
    label: activity
      ? `Session ${sessionNum}: ${activity.activity}`
      : `Session ${sessionNum}`,
  };
}

export function buildLessonPlanContext(plan: LessonPlan): string {
  const lines = [
    `Title: ${plan.title}`,
    `Grade: ${plan.grade} | Subject: ${plan.subject} | Sessions: ${plan.sessions}`,
    '',
    'Learning Objectives:',
    ...plan.objectives.map((o) => `- ${o}`),
    '',
    'Session Activities:',
    ...plan.activities.map((a) => `- Session ${a.session}: ${a.activity} (${a.duration})`),
  ];
  if (plan.homework) {
    lines.push('', `Homework: ${plan.homework}`);
  }
  if (plan.assessments.length > 0) {
    lines.push('', 'Planned Assessments:', ...plan.assessments.map((a) => `- ${a}`));
  }
  return lines.join('\n');
}

export type AssessmentQuestionLimits = {
  min: number;
  max: number;
  default: number;
};

/** Sensible question counts by assessment type (aligned with Prime AI caps). */
export function questionLimitsForAssessmentType(
  type: string,
): AssessmentQuestionLimits {
  switch (type) {
    case 'Final Exam':
      return { min: 15, max: 50, default: 40 };
    case 'Mid Exam':
      return { min: 10, max: 40, default: 25 };
    case 'Quiz':
      return { min: 3, max: 15, default: 10 };
    case 'Baseline':
      return { min: 5, max: 40, default: 15 };
    case 'Assignment':
    case 'Practical':
      return { min: 5, max: 25, default: 10 };
    default:
      return { min: 5, max: 40, default: 15 };
  }
}

export const generateAssessmentWithAI = async (
  type: string,
  topic: string,
  grade: string,
  subject: string,
  difficulty: string,
  numQuestions: number = 10,
  questionFormat: string = 'Mixed',
  lessonPlanContext?: string,
  studentLevel: string = 'differentiated',
  /** 0-100 = % of questions grounded only in the official Minimum Learning
   * Competencies; the rest are grounded in advanced/enrichment content.
   * Omit for today's unfiltered behavior. */
  mlcPercent?: number,
): Promise<string> => {
  try {
    const payload: Record<string, unknown> = {
      topic,
      difficulty: difficulty.toLowerCase(),
      // Up to 60 for mid/final; Prime AI batches large sets server-side
      num_questions: Math.min(60, Math.max(3, Number(numQuestions) || 10)),
      question_type: normalizeQuestionFormat(questionFormat),
      student_level: studentLevel,
      subject,
      grade,
    };
    if (lessonPlanContext?.trim()) {
      payload.lesson_plan_context = lessonPlanContext.trim();
    }
    if (typeof mlcPercent === 'number' && Number.isFinite(mlcPercent)) {
      payload.mlc_percent = Math.min(100, Math.max(0, Math.round(mlcPercent)));
    }

    const cacheKey = aiService['getCacheKey']('/quiz', payload);
    const cached = aiService['getFromCache'](cacheKey);
    if (cached) {
      return cached.content || JSON.stringify(cached);
    }

    const result = await aiService['callPrimeAI']('/quiz', payload);

    return result.content || JSON.stringify(result);
  } catch (error) {
    // Previously fell back to a hardcoded placeholder quiz (a single "[Sample question]"
    // line) presented as if it were a real generation. Surface the real failure instead so
    // the caller shows an actual error rather than fabricated content.
    console.error('AI Service failed for assessment generation:', error);
    throw error;
  }
};

export type BaselineSemesterTiming = 'semester_1_start' | 'semester_2_start';

export function derivePreviousGrade(grade: string): string {
  const match = grade.match(/(\d+)/);
  if (match) {
    const n = parseInt(match[1], 10);
    if (n > 1) return `Grade ${n - 1}`;
  }
  return 'Previous Grade';
}

export function baselineScopeLabel(
  grade: string,
  subject: string,
  timing: BaselineSemesterTiming,
  focusTopic?: string,
): string {
  const prev = derivePreviousGrade(grade);
  if (timing === 'semester_1_start') {
    return focusTopic?.trim()
      ? `${prev} prerequisites — ${focusTopic.trim()}`
      : `${prev} ${subject} prerequisites for ${grade}`;
  }
  return focusTopic?.trim()
    ? `Semester 1 review — ${focusTopic.trim()}`
    : `${grade} ${subject} — Semester 1 review`;
}

export function baselineTimingLabel(timing: BaselineSemesterTiming, grade: string): string {
  if (timing === 'semester_1_start') {
    return `Semester 1 Start (${derivePreviousGrade(grade)} prerequisites)`;
  }
  return 'Semester 2 Start (Semester 1 review)';
}

export const generateBaselineAssessmentWithAI = async (
  grade: string,
  subject: string,
  semesterTiming: BaselineSemesterTiming,
  focusTopic: string,
  difficulty: string,
  numQuestions: number = 10,
  questionFormat: string = 'Mixed',
  studentLevel: string = 'differentiated',
  /** 0-100 = % of questions grounded only in the official Minimum Learning
   * Competencies; the rest are grounded in advanced/enrichment content.
   * Omit for today's unfiltered behavior. */
  mlcPercent?: number,
): Promise<string> => {
  try {
    const payload: Record<string, unknown> = {
      grade,
      subject,
      semester_timing: semesterTiming,
      focus_topic: focusTopic.trim(),
      difficulty: difficulty.toLowerCase(),
      num_questions: Math.min(40, Math.max(5, Number(numQuestions) || 10)),
      question_type: normalizeQuestionFormat(questionFormat),
      student_level: studentLevel,
    };
    if (typeof mlcPercent === 'number' && Number.isFinite(mlcPercent)) {
      payload.mlc_percent = Math.min(100, Math.max(0, Math.round(mlcPercent)));
    }

    const cacheKey = aiService['getCacheKey']('/baseline-assessment', payload);
    const cached = aiService['getFromCache'](cacheKey);
    if (cached) {
      return cached.content || JSON.stringify(cached);
    }

    const result = await aiService['callPrimeAI']('/baseline-assessment', payload);
    return result.content || JSON.stringify(result);
  } catch (error) {
    // Previously fell back to a hardcoded placeholder baseline (a repeated "[Sample
    // question]" line) presented as if it were a real generation. Surface the real failure
    // instead so the caller shows an actual error rather than fabricated content.
    console.error('AI Service failed for baseline assessment:', error);
    throw error;
  }
};
