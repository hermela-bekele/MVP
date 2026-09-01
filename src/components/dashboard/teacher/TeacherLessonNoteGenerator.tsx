'use client';

import React, { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Save, Sparkles, X } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Select } from '@/components/ui/select';
import { GenerationStatusPanel } from '@/components/ui/GenerationStatusPanel';
import { useElapsedTime } from '@/hooks/useElapsedTime';
import type { AITeachingNotesResult } from '@/lib/ai';
import { getWeeklyPlanSessionTopicOptions, parseWeeklyPlanDetail } from '@/lib/ai';
import {
  GRADE_OPTIONS,
  SUBJECT_OPTIONS,
  STUDENT_LEVEL_OPTIONS,
  filterTeacherLessonPlans,
  isWeeklyPlanHodApproved,
  resolveTeacherProfile,
  primarySubjectForTeacher,
} from '@/lib/teacherPortal';
import type { AIDetailedLessonPlanResult } from '@/lib/ai';
import type { LessonPlan, TeachingNote } from '@/lib/mockData';
import {
  AisBtnPrimary,
  AisBtnSecondary,
  aisCallout,
  aisFormLabel,
  aisInput,
  aisTextarea,
} from '@/components/dashboard/teacher/TeacherPortalUi';
import { aisBodyMd } from '@/components/dashboard/teacher/aisStyles';
import { GeneratorActionBar } from '@/components/ui/GeneratorActionBar';
import { portalTabPath } from '@/lib/portalPaths';
import { teachingNotesToMarkdown } from '@/lib/pdfUtils';
import {
  isTruncatedMarkdownPrefix,
  stripDuplicatedMarkdownPrefix,
} from '@/lib/teachingNotesMarkdown';

const TeachingNotesRenderer = lazy(() =>
  import('@/components/ui/TeachingNotesRenderer').then((m) => ({ default: m.TeachingNotesRenderer })),
);

function RendererLoading() {
  return (
    <div className="flex min-h-[120px] items-center justify-center text-sm text-muted-foreground">
      Loading preview…
    </div>
  );
}

function weeklyPlanWeekLabel(plan: LessonPlan): string {
  const detail = parseWeeklyPlanDetail(plan) as AIDetailedLessonPlanResult & {
    calendarWeek?: { month?: string; week?: string; date?: string; unit?: string };
  } | null;
  const cw = detail?.calendarWeek;
  if (cw?.month && cw?.week) {
    return `${cw.month} ${cw.week}${cw.date ? ` (${cw.date})` : ''}${cw.unit ? ` · ${cw.unit}` : ''}`;
  }
  return plan.title;
}

function notesResultToEditableText(result: AITeachingNotesResult | null, fallback = ''): string {
  if (!result) return fallback;
  const mainContent = stripDuplicatedMarkdownPrefix(result.explanations?.[0]?.content ?? '');
  const isMarkdownBlob =
    result.explanations?.length === 1 && mainContent && (mainContent.includes('#') || mainContent.includes('**'));
  if (isMarkdownBlob) {
    const parts: string[] = [];
    const intro = (result.introduction || '').trim();
    if (intro && !isTruncatedMarkdownPrefix(intro, mainContent)) {
      parts.push(intro);
    }
    parts.push(mainContent);
    if (result.visualAids?.length) {
      parts.push('\n## Visual Aids\n');
      result.visualAids.forEach((a) => parts.push(`- ${a}`));
    }
    if (result.exercises?.length) {
      parts.push('\n## Practice Exercises\n');
      result.exercises.forEach((e, i) => parts.push(`${i + 1}. ${e}`));
    }
    return parts.join('\n\n');
  }
  return teachingNotesToMarkdown(result);
}

function editableTextToNotesResult(text: string, meta: { title: string; language: string }): AITeachingNotesResult {
  const trimmed = stripDuplicatedMarkdownPrefix(text);
  return {
    title: meta.title,
    language: meta.language,
    introduction: '',
    explanations: [{ subtitle: 'Content', content: trimmed, examples: [] }],
    visualAids: [],
    exercises: [],
  };
}

/**
 * Dedicated-page teaching-note generator — replaces the "Create teaching note" / "Edit
 * teaching note" Dialog previously embedded in TeacherTeachingNotes.tsx. Handles both create
 * (optionally pre-filled from a weekly plan via ?lessonPlanId=&sessionScope=) and edit
 * (?noteId=) through the same form, since both share identical fields and the same
 * generateTeachingNotes AI call. A GenerationStatusPanel/elapsed-time indicator replaces the
 * bare "Generating…" button, and the existing Edit/Preview toggle already shows an editable
 * version of the content immediately once generation succeeds.
 */
export function TeacherLessonNoteGenerator() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const noteId = searchParams.get('noteId') || '';
  const initialLessonPlanId = searchParams.get('lessonPlanId') || '';
  const initialSessionScope = searchParams.get('sessionScope') || '';

  const {
    lessonPlans,
    teachers,
    teachingNotes,
    createTeachingNote,
    updateTeachingNote,
    addNotification,
    resolveTeacherId,
  } = useApp();

  const teacherId = resolveTeacherId();
  const teacherProfile = resolveTeacherProfile(teachers, teacherId);
  const defaultSubject = primarySubjectForTeacher(teacherProfile);
  const defaultGrade = teacherProfile.grades[0] ?? 'Grade 9';
  const teacherPlans = filterTeacherLessonPlans(lessonPlans, teacherId, { subjects: teacherProfile.subjects });
  const ownWeeklyPlans = teacherPlans.filter((p) => p.planType !== 'yearly');
  const approvedWeeklyPlans = ownWeeklyPlans.filter((p) => isWeeklyPlanHodApproved(p));

  const editingNote = useMemo(
    () => (noteId ? teachingNotes.find((n) => n.id === noteId) : undefined),
    [noteId, teachingNotes],
  );
  const editingNoteId = editingNote?.id || null;

  const [linkedPlanId, setLinkedPlanId] = useState(editingNote?.lessonPlanId || initialLessonPlanId || '');
  const [selectedSessionScope, setSelectedSessionScope] = useState(initialSessionScope);
  const [notesGrade, setNotesGrade] = useState(editingNote?.grade || defaultGrade);
  const [notesSubject, setNotesSubject] = useState(editingNote?.subject || defaultSubject);
  const [notesTopic, setNotesTopic] = useState(editingNote?.topic || '');
  const [notesLanguage, setNotesLanguage] = useState(editingNote?.language || 'English');
  const [notesStudentLevel, setNotesStudentLevel] = useState('differentiated');
  const [noteTitle, setNoteTitle] = useState(editingNote?.title || '');
  const [aiNotesResult, setAiNotesResult] = useState<AITeachingNotesResult | null>(null);
  const [noteContentText, setNoteContentText] = useState('');
  const [showNoteContentPreview, setShowNoteContentPreview] = useState(false);
  const [generatingNotes, setGeneratingNotes] = useState(false);
  const [explainingMore, setExplainingMore] = useState(false);
  const [explainMoreUsed, setExplainMoreUsed] = useState(false);
  const [generationError, setGenerationError] = useState('');
  const [presetTopics, setPresetTopics] = useState<string[]>([]);
  const [initialized, setInitialized] = useState(false);

  const elapsedSeconds = useElapsedTime(generatingNotes);

  const activePlan = ownWeeklyPlans.find((p) => p.id === linkedPlanId);
  const noteWeekPlanChoices = (() => {
    if (activePlan && !approvedWeeklyPlans.some((p) => p.id === activePlan.id)) {
      return [...approvedWeeklyPlans, activePlan];
    }
    return approvedWeeklyPlans;
  })();
  const sessionTopicOptions = activePlan ? getWeeklyPlanSessionTopicOptions(activePlan) : [];

  useEffect(() => {
    let cancelled = false;
    void fetch('/api/ai/topics')
      .then((r) => r.json())
      .then((data: { topics?: string[] }) => {
        if (!cancelled && Array.isArray(data.topics)) {
          setPresetTopics(data.topics.map((t) => t.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPresetTopics(['Functions', 'Trigonometry', 'Algebra', 'Probability', 'Statistics', 'Calculus']);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const applySessionTopic = (plan: LessonPlan, scope: string) => {
    const options = getWeeklyPlanSessionTopicOptions(plan);
    const match = options.find((o) => o.value === scope) ?? options[0];
    if (!match) {
      setSelectedSessionScope('');
      setNotesTopic('');
      setNoteTitle('');
      return;
    }
    setSelectedSessionScope(match.value);
    setNotesTopic(match.topic || match.label);
    setNoteTitle(match.value === 'all' ? `${weeklyPlanWeekLabel(plan)} — All sessions notes` : `${match.label} — Notes`);
  };

  // One-time initialization once dependent data (notes/plans) is available.
  useEffect(() => {
    if (initialized) return;
    if (editingNote) {
      if (editingNote.contentBody) {
        try {
          const parsed = JSON.parse(editingNote.contentBody) as AITeachingNotesResult;
          setAiNotesResult(parsed);
          setNoteContentText(notesResultToEditableText(parsed, editingNote.contentSummary ?? ''));
        } catch {
          setAiNotesResult(null);
          setNoteContentText(editingNote.contentSummary ?? '');
        }
      }
      setInitialized(true);
      return;
    }
    if (initialLessonPlanId) {
      const plan = ownWeeklyPlans.find((p) => p.id === initialLessonPlanId);
      if (plan) {
        applySessionTopic(plan, initialSessionScope || 'all');
        setInitialized(true);
        return;
      }
      if (ownWeeklyPlans.length === 0) return; // wait for plans to load
    }
    setInitialized(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingNote, ownWeeklyPlans, initialized]);

  const handleGenerateNotes = async () => {
    setGenerationError('');
    if (activePlan && !editingNoteId && !isWeeklyPlanHodApproved(activePlan)) {
      setGenerationError('This weekly plan must be approved by the department head before you generate teaching notes.');
      return;
    }
    if (activePlan && !editingNoteId) {
      if (!selectedSessionScope) {
        setGenerationError('Choose a week session (or All sessions).');
        return;
      }
      if (!notesTopic.trim()) {
        setGenerationError('Enter or keep the session topic before generating.');
        return;
      }
    } else if (!notesTopic.trim()) {
      setGenerationError('Please enter a topic first.');
      return;
    }

    setGeneratingNotes(true);
    try {
      let topic = notesTopic.trim();
      let subtopic = '';
      let sessionContext: string | undefined;

      if (activePlan && !editingNoteId) {
        const match = sessionTopicOptions.find((o) => o.value === selectedSessionScope);
        const weekly = parseWeeklyPlanDetail(activePlan);
        const planObjectives = [...(activePlan.objectives || []), ...(weekly?.objectives || [])].filter(Boolean);
        const uniqueObjectives = [...new Set(planObjectives)];

        topic = notesTopic.trim() || match?.topic || activePlan.title;
        subtopic = match?.value === 'all' ? weekly?.subTopic || 'All sessions this week' : match?.subtopic || match?.label || '';

        sessionContext = [
          match?.context || '',
          `Teacher-selected topic (editable): ${topic}`,
          uniqueObjectives.length
            ? `Lesson plan objectives to cover:\n${uniqueObjectives.map((o) => `- ${o}`).join('\n')}`
            : '',
          selectedSessionScope === 'all'
            ? 'Generate lesson notes that cover every session in this weekly plan, organized by session, while honouring the lesson plan objectives.'
            : `Generate lesson notes focused on this session while honouring the weekly lesson plan objectives.`,
        ]
          .filter(Boolean)
          .join('\n\n');
      }

      const { aiService } = await import('@/lib/ai');
      const response = await aiService.generateTeachingNotes({
        topic,
        subtopic,
        grade: notesGrade,
        subject: notesSubject,
        language: notesLanguage,
        sessionContext,
        studentLevel: notesStudentLevel,
      });

      let result: AITeachingNotesResult;
      if (typeof response.content === 'string') {
        if (response.content.includes('#') || response.content.includes('##')) {
          result = {
            title: `Teaching Notes: ${notesGrade} ${notesSubject} - ${notesTopic}`,
            language: notesLanguage,
            introduction: '',
            explanations: [{ subtitle: 'Content', content: response.content, examples: [] }],
            visualAids: [],
            exercises: [],
          };
        } else {
          try {
            result = JSON.parse(response.content);
          } catch {
            result = {
              title: `Teaching Notes: ${notesGrade} ${notesSubject} - ${notesTopic}`,
              language: notesLanguage,
              introduction: '',
              explanations: [{ subtitle: 'Content', content: response.content, examples: [] }],
              visualAids: [],
              exercises: [],
            };
          }
        }
      } else if (typeof response.content === 'object') {
        result = response.content as AITeachingNotesResult;
      } else {
        throw new Error('Unexpected response format');
      }

      setAiNotesResult(result);
      setNoteContentText(notesResultToEditableText(result));
      setShowNoteContentPreview(true);
      setExplainMoreUsed(false);
      if (!noteTitle) setNoteTitle(result.title || `${notesTopic} Notes`);
    } catch (error) {
      console.error('Failed to generate lesson notes:', error);
      setGenerationError('Could not generate lesson notes. Please try again.');
    } finally {
      setGeneratingNotes(false);
    }
  };

  const handleExplainMore = async () => {
    if (explainMoreUsed) return;
    const current = noteContentText.trim();
    if (!current) {
      addNotification('Nothing to expand', 'Generate or write notes first, then use Explain more.', 'alert');
      return;
    }
    setExplainingMore(true);
    try {
      const { aiService } = await import('@/lib/ai');
      const response = await aiService.generateTeachingNotes({
        topic: notesTopic.trim() || noteTitle || 'Lesson topic',
        subtopic: 'Deeper explanation',
        grade: notesGrade,
        subject: notesSubject,
        language: notesLanguage,
        studentLevel: notesStudentLevel,
        sessionContext: [
          'EXPLAIN MORE REQUEST: Expand the following lesson notes with clearer explanations,',
          'worked examples, common misconceptions, and step-by-step reasoning suitable for classroom delivery.',
          'Keep useful existing content; deepen explanations rather than replacing everything.',
          '',
          'EXISTING NOTES:',
          current.slice(0, 6000),
        ].join('\n'),
      });
      let expanded = '';
      if (typeof response.content === 'string') {
        try {
          const parsed = JSON.parse(response.content) as AITeachingNotesResult;
          expanded = notesResultToEditableText(parsed);
          setAiNotesResult(parsed);
        } catch {
          expanded = response.content;
        }
      } else if (response.content && typeof response.content === 'object') {
        const parsed = response.content as AITeachingNotesResult;
        expanded = notesResultToEditableText(parsed);
        setAiNotesResult(parsed);
      }
      if (expanded.trim()) {
        setNoteContentText(expanded);
        setShowNoteContentPreview(true);
        setExplainMoreUsed(true);
        addNotification('Notes expanded', 'AI added clearer explanations to your lesson notes.', 'success');
      }
    } catch {
      addNotification('Explain more failed', 'Could not expand the notes. Try again.', 'alert');
    } finally {
      setExplainingMore(false);
    }
  };

  const resolveNoteContent = (): AITeachingNotesResult | null => {
    const text = noteContentText.trim();
    if (text) {
      return editableTextToNotesResult(text, {
        title: noteTitle || aiNotesResult?.title || `${notesTopic || 'Lesson'} Notes`,
        language: notesLanguage,
      });
    }
    return aiNotesResult;
  };

  const hasNoteContent = !!(noteContentText.trim() || aiNotesResult);

  const buildNotePayload = () => {
    const content = resolveNoteContent();
    return {
      lessonPlanId: linkedPlanId || undefined,
      title: noteTitle || content?.title || `${notesTopic || 'Lesson'} Notes`,
      grade: notesGrade,
      subject: notesSubject,
      topic: notesTopic || noteTitle,
      language: notesLanguage,
      contentSummary: (content?.introduction ?? noteContentText.trim()).slice(0, 280) || noteTitle,
      contentBody: content ? JSON.stringify(content) : undefined,
      // Which session(s) this note actually covers — recorded only when generating fresh
      // from a linked plan (the session picker isn't shown while editing an existing note,
      // so preserve whatever it already had rather than overwrite with stale/empty state).
      sessionScope: editingNoteId
        ? editingNote?.sessionScope
        : activePlan
          ? selectedSessionScope || 'all'
          : undefined,
    };
  };

  const goBackToList = () => router.push(portalTabPath('teacher', 'lesson-notes'));

  const handleSaveDraft = () => {
    const payload = buildNotePayload();
    if (!payload.contentBody) {
      addNotification('Content required', 'Add or edit note content before saving.', 'alert');
      return;
    }
    if (editingNoteId) {
      updateTeachingNote(editingNoteId, { ...payload, status: 'Draft' });
      addNotification('Draft saved', 'Teaching note updated.', 'success');
    } else {
      createTeachingNote(payload, 'Draft');
      addNotification('Draft created', 'Teaching note saved as draft.', 'success');
    }
    goBackToList();
  };

  const handleSubmitNoteForApproval = () => {
    const payload = buildNotePayload();
    if (!hasNoteContent) {
      addNotification('Nothing to submit', 'Add note content or generate with AI first.', 'alert');
      return;
    }
    if (editingNoteId) {
      updateTeachingNote(editingNoteId, { ...payload, status: 'Approved' });
      addNotification('Saved', 'Teaching note saved and ready for delivery.', 'success');
    } else {
      createTeachingNote(payload, 'Approved');
      addNotification('Saved', 'Teaching note saved and ready for delivery.', 'success');
    }
    goBackToList();
  };

  return (
    <div className="mx-auto w-full max-w-[96rem] space-y-5">
      <section className="rounded-xl border border-ais-card-border bg-card p-5 space-y-4">
        <Select
          variant="ais"
          label="Week (weekly lesson plan)"
          options={[
            { value: '', label: 'No lesson plan (standalone)' },
            ...noteWeekPlanChoices.map((p) => ({
              value: p.id,
              label: isWeeklyPlanHodApproved(p) ? weeklyPlanWeekLabel(p) : `${weeklyPlanWeekLabel(p)} · ${p.status} (awaiting HoD)`,
            })),
          ]}
          value={linkedPlanId}
          onChange={(e) => {
            setLinkedPlanId(e.target.value);
            const p = ownWeeklyPlans.find((x) => x.id === e.target.value);
            if (p) {
              setNotesGrade(p.grade);
              setNotesSubject(p.subject);
              if (!editingNoteId) applySessionTopic(p, 'all');
            } else {
              setSelectedSessionScope('');
              setNotesTopic('');
            }
          }}
        />
        {activePlan && !editingNoteId && !isWeeklyPlanHodApproved(activePlan) && (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
            This weekly plan is not yet approved by the department head. You can edit fields, but AI
            generation stays locked until HoD approval.
          </p>
        )}
        {activePlan && (
          <p className={aisCallout}>
            Week: {weeklyPlanWeekLabel(activePlan)} — notes will follow this weekly plan&apos;s sessions and objectives.
          </p>
        )}
      </section>

      <section className="rounded-xl border border-ais-card-border bg-card p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex min-w-0 flex-col gap-1">
            <label className={`${aisFormLabel} block min-h-[14px] leading-[14px]`}>Note title</label>
            <input className={`${aisInput} min-w-0`} value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} placeholder="e.g. Session 2 handout" />
          </div>
          <Select variant="ais" label="Grade" options={GRADE_OPTIONS.map((g) => ({ value: g, label: g }))} value={notesGrade} onChange={(e) => setNotesGrade(e.target.value)} />
          <Select variant="ais" label="Subject" options={SUBJECT_OPTIONS.map((s) => ({ value: s, label: s }))} value={notesSubject} onChange={(e) => setNotesSubject(e.target.value)} />
          {activePlan && !editingNoteId ? (
            <Select
              variant="ais"
              label="Session"
              options={sessionTopicOptions.map((o) => ({ value: o.value, label: o.label }))}
              value={selectedSessionScope}
              onChange={(e) => applySessionTopic(activePlan, e.target.value)}
            />
          ) : null}
        </div>
      </section>

      <section className="space-y-2 rounded-xl border border-ais-card-border bg-card p-5">
        <label className={`${aisFormLabel} block min-h-[14px] leading-[14px]`}>
          Topic {activePlan && !editingNoteId ? '(preset or custom)' : ''}
        </label>
        {presetTopics.length > 0 ? (
          <Select
            variant="ais"
            options={[
              { value: '', label: 'Choose a preset topic…' },
              ...presetTopics.map((t) => ({ value: t, label: t })),
              ...(notesTopic && !presetTopics.includes(notesTopic) ? [{ value: notesTopic, label: `${notesTopic} (custom)` }] : []),
            ]}
            value={presetTopics.includes(notesTopic) ? notesTopic : notesTopic || ''}
            onChange={(e) => {
              if (e.target.value) setNotesTopic(e.target.value);
            }}
          />
        ) : null}
        <input
          className={`${aisInput} min-w-0`}
          value={notesTopic}
          onChange={(e) => setNotesTopic(e.target.value)}
          placeholder="Or type a custom topic"
          list="lesson-note-preset-topics"
        />
        <datalist id="lesson-note-preset-topics">
          {presetTopics.map((t) => (
            <option key={t} value={t} />
          ))}
        </datalist>
        {activePlan && !editingNoteId && (
          <div className="space-y-1 pt-1">
            <p className="text-xs text-ais-on-surface-variant">
              Choose <strong>All sessions</strong> or one session from this week. The topic above is
              editable. Generation uses your selection plus the weekly plan objectives.
            </p>
            {(activePlan.objectives?.length ?? 0) > 0 && (
              <div className="rounded-xl border border-ais-card-border bg-ais-surface-container-low/50 px-3 py-2">
                <p className={`${aisFormLabel} mb-1`}>Lesson plan objectives</p>
                <ul className="list-disc space-y-0.5 pl-4 text-xs text-ais-on-surface-variant">
                  {activePlan.objectives.slice(0, 4).map((o, i) => (
                    <li key={i}>{o}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-ais-card-border bg-card p-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Select
            variant="ais"
            label="Language"
            options={[
              { value: 'English', label: 'English' },
              { value: 'Amharic', label: 'Amharic' },
              { value: 'Afaan Oromo', label: 'Afaan Oromo' },
            ]}
            value={notesLanguage}
            onChange={(e) => setNotesLanguage(e.target.value)}
          />
          <div className="flex min-w-0 flex-col gap-1">
            <Select
              variant="ais"
              label="Student level"
              options={STUDENT_LEVEL_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
              value={notesStudentLevel}
              onChange={(e) => setNotesStudentLevel(e.target.value)}
            />
            <p className="text-xs text-ais-on-surface-variant">
              All levels generates struggling, average, and advanced exercises with a labeled answer key.
            </p>
          </div>
        </div>
      </section>

      <GenerationStatusPanel
        phase={generatingNotes ? 'generating' : generationError ? 'error' : 'idle'}
        statusText="Generating lesson notes…"
        elapsedSeconds={elapsedSeconds}
        errorMessage={generationError}
      />

      {(editingNoteId || aiNotesResult || noteContentText.trim()) && (
        <div className="space-y-3 rounded-xl border border-ais-card-border bg-ais-surface-container-low/40 p-4">
          {aiNotesResult && !editingNoteId && (
            <GenerationStatusPanel
              phase="success"
              statusText=""
              elapsedSeconds={elapsedSeconds}
              successMessage="Lesson notes generated — review, edit if needed, then save below."
            />
          )}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className={aisFormLabel}>{editingNoteId ? 'Note content — edit freely' : 'Note content'}</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowNoteContentPreview(false)}
                className={`rounded-lg px-3 py-1 text-xs font-semibold transition-colors ${
                  !showNoteContentPreview ? 'bg-ais-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
                }`}
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => setShowNoteContentPreview(true)}
                disabled={!noteContentText.trim()}
                className={`rounded-lg px-3 py-1 text-xs font-semibold transition-colors disabled:opacity-50 ${
                  showNoteContentPreview ? 'bg-ais-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
                }`}
              >
                Preview
              </button>
            </div>
          </div>
          {showNoteContentPreview ? (
            noteContentText.trim() ? (
              <div className="max-h-[400px] overflow-y-auto rounded-lg border border-ais-card-border bg-white p-4 dark:bg-gray-900">
                <Suspense fallback={<RendererLoading />}>
                  <TeachingNotesRenderer
                    content={editableTextToNotesResult(noteContentText.trim(), { title: noteTitle || 'Teaching Notes', language: notesLanguage })}
                  />
                </Suspense>
              </div>
            ) : (
              <p className={`${aisBodyMd} rounded-lg border border-dashed border-ais-card-border p-4 text-center`}>
                Nothing to preview yet — switch to Edit and add your content.
              </p>
            )
          ) : (
            <textarea
              className={`${aisTextarea} min-h-[280px] font-mono text-sm`}
              value={noteContentText}
              onChange={(e) => setNoteContentText(e.target.value)}
              placeholder="Write or edit your teaching notes here. You can type freely or use markdown headings (##), lists, and bold text."
            />
          )}
          <p className="text-xs text-ais-on-surface-variant">
            Edit the full note body — add explanations, examples, or exercises as you need.
          </p>
        </div>
      )}
      <GeneratorActionBar
        left={
          <>
            <AisBtnSecondary type="button" onClick={goBackToList}>
              <X className="h-3.5 w-3.5" aria-hidden />
              Cancel
            </AisBtnSecondary>
            <AisBtnSecondary
              type="button"
              onClick={() => void handleExplainMore()}
              disabled={explainMoreUsed || explainingMore || generatingNotes || !noteContentText.trim()}
              title={explainMoreUsed ? 'Explain more can only be used once per generation. Generate again to unlock.' : undefined}
            >
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              {explainingMore ? 'Expanding…' : explainMoreUsed ? 'Explained' : 'Explain more'}
            </AisBtnSecondary>
            <AisBtnPrimary
              type="button"
              onClick={() => void handleGenerateNotes()}
              disabled={
                generatingNotes ||
                explainingMore ||
                !notesTopic.trim() ||
                (!!activePlan && !editingNoteId && !selectedSessionScope) ||
                (!!activePlan && !editingNoteId && !isWeeklyPlanHodApproved(activePlan))
              }
            >
              <Sparkles className="h-3.5 w-3.5 animate-pulse" aria-hidden />
              {generatingNotes ? 'Generating with AI...' : aiNotesResult ? 'Regenerate with AI' : 'Generate with AI'}
            </AisBtnPrimary>
          </>
        }
        right={
          <>
            <AisBtnSecondary type="button" onClick={handleSaveDraft} disabled={!hasNoteContent}>
              <Save className="h-3.5 w-3.5" aria-hidden />
              Save draft
            </AisBtnSecondary>
            <AisBtnPrimary type="button" onClick={handleSubmitNoteForApproval} disabled={!hasNoteContent}>
              <Save className="h-3.5 w-3.5" aria-hidden />
              Save & ready to deliver
            </AisBtnPrimary>
          </>
        }
      />
    </div>
  );
}
