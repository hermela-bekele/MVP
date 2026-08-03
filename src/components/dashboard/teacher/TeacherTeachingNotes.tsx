'use client';

import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, Download, Eye, MoreVertical, Pencil, Plus, Printer, Save, Send, Sparkles, Trash2, X } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Select } from '@/components/ui/select';
import { Dialog, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import type { AITeachingNotesResult, AIDetailedLessonPlanResult } from '@/lib/ai';
import {
  getWeeklyPlanSessionTopicOptions,
  parseWeeklyPlanDetail,
} from '@/lib/ai';
import {
  GRADE_OPTIONS,
  filterTeacherLessonPlans,
  notesForLessonPlan,
  resolveTeacherProfile,
  primarySubjectForTeacher,
  STUDENT_LEVEL_OPTIONS,
  isWeeklyPlanHodApproved,
  graspOutcomeLabel,
  keepLatestLessonPlansByGradeSubject,
} from '@/lib/teacherPortal';
import type { GraspOutcome, LessonPlan, TeachingNote } from '@/lib/mockData';
import type { AnnualLessonPlanResult } from '@/lib/annualLessonPlan';
import { AnnualLessonPlanTable } from '@/components/ui/AnnualLessonPlanTable';
import { WeeklyLessonPlanTable } from '@/components/ui/WeeklyLessonPlanTable';
import { downloadWeeklyLessonPlanDocx } from '@/lib/weeklyLessonPlanDocx';
import {
  generatePDFFromMarkdown,
  printMarkdown,
  slugifyFilename,
  teachingNotesToMarkdown,
} from '@/lib/pdfUtils';
import {
  AisBtnPrimary,
  AisBtnSecondary,
  AisPage,
  AisStatusBadge,
  approvalBadgeVariant,
  aisCallout,
  aisFormLabel,
  aisInput,
  aisTextarea,
} from '@/components/dashboard/teacher/TeacherPortalUi';
import {
  aisBodyMd,
  aisBodySm,
  aisCard,
  aisDataMd,
  aisHeadlineSm,
  aisLabelCaps,
} from '@/components/dashboard/teacher/aisStyles';
import { TeacherWeeklyPlanDialog } from '@/components/dashboard/teacher/TeacherWeeklyPlanDialog';
import { NoteDeliveryDialog } from '@/components/dashboard/teacher/NoteDeliveryDialog';
const TeachingNotesRenderer = lazy(() =>
  import('@/components/ui/TeachingNotesRenderer').then((m) => ({
    default: m.TeachingNotesRenderer,
  })),
);

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

function RendererLoading() {
  return (
    <div className="flex min-h-[120px] items-center justify-center text-sm text-muted-foreground">
      Loading preview…
    </div>
  );
}

function noteStatusVariant(status: TeachingNote['status']) {
  if (status === 'Draft') return 'neutral' as const;
  if (status === 'Pending Dept Head') return 'warning' as const;
  if (status === 'Rejected') return 'error' as const;
  if (status === 'Approved') return 'success' as const;
  return 'success' as const;
}

function notesResultToEditableText(
  result: AITeachingNotesResult | null,
  fallback = '',
): string {
  if (!result) return fallback;
  const mainContent = result.explanations?.[0]?.content ?? '';
  const isMarkdownBlob =
    result.explanations?.length === 1 &&
    mainContent &&
    (mainContent.includes('#') || mainContent.includes('**'));
  if (isMarkdownBlob) {
    const parts: string[] = [];
    if (result.introduction?.trim()) parts.push(result.introduction.trim());
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

function editableTextToNotesResult(
  text: string,
  meta: { title: string; language: string },
): AITeachingNotesResult {
  const trimmed = text.trim();
  return {
    title: meta.title,
    language: meta.language,
    introduction: trimmed.slice(0, 280),
    explanations: [{ subtitle: 'Content', content: trimmed, examples: [] }],
    visualAids: [],
    exercises: [],
  };
}

interface TeacherTeachingNotesProps {
  lessonPlanId?: string;
}

export const TeacherTeachingNotes: React.FC<TeacherTeachingNotesProps> = ({
  lessonPlanId,
}) => {
  const router = useRouter();
  const {
    lessonPlans,
    teachingNotes,
    teachers,
    createLessonPlan,
    createTeachingNote,
    updateTeachingNote,
    deleteTeachingNote,
    deleteLessonPlan,
    updateLessonPlan,
    addNotification,
    resolveTeacherId,
    lessonDeliveries,
    markLessonDelivered,
  } = useApp();

  const teacherId = resolveTeacherId();
  const teacherProfile = resolveTeacherProfile(teachers, teacherId);
  const defaultSubject = primarySubjectForTeacher(teacherProfile);
  const defaultGrade = teacherProfile.grades[0] ?? 'Grade 9';
  const teacherPlans = filterTeacherLessonPlans(lessonPlans, teacherId, {
    subjects: teacherProfile.subjects,
  });
  const ownWeeklyPlans = teacherPlans.filter((p) => p.planType !== 'yearly');
  const publishedAnnualPlans = keepLatestLessonPlansByGradeSubject(
    teacherPlans.filter(
      (p) => p.planType === 'yearly' && p.createdByRole === 'department-head',
    ),
  );
  const myNotes = teachingNotes.filter((n) => n.teacherId === teacherId);

  const [isPlanOpen, setIsPlanOpen] = useState(false);
  const [notesStudentLevel, setNotesStudentLevel] = useState<string>('differentiated');
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [viewNote, setViewNote] = useState<TeachingNote | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [linkedPlanId, setLinkedPlanId] = useState('');
  const [notesGrade, setNotesGrade] = useState(defaultGrade);
  const [notesSubject, setNotesSubject] = useState(defaultSubject);
  const [notesTopic, setNotesTopic] = useState('');
  const [selectedSessionScope, setSelectedSessionScope] = useState('');
  const [notesLanguage, setNotesLanguage] = useState('English');
  const [noteTitle, setNoteTitle] = useState('');
  const [generatingNotes, setGeneratingNotes] = useState(false);
  const [aiNotesResult, setAiNotesResult] = useState<AITeachingNotesResult | null>(null);
  const [noteContentText, setNoteContentText] = useState('');
  const [showNoteContentPreview, setShowNoteContentPreview] = useState(false);
  const [showNotesPreview, setShowNotesPreview] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [deliverNote, setDeliverNote] = useState<TeachingNote | null>(null);
  const [weeklyPlanDialog, setWeeklyPlanDialog] = useState<{
    plan: LessonPlan;
    mode: 'view' | 'edit';
  } | null>(null);
  const [editWeeklyTitle, setEditWeeklyTitle] = useState('');
  const [planPendingDelete, setPlanPendingDelete] = useState<LessonPlan | null>(null);
  const [notePendingDelete, setNotePendingDelete] = useState<TeachingNote | null>(null);

  const activePlan = ownWeeklyPlans.find((p) => p.id === linkedPlanId);
  const sessionTopicOptions = activePlan
    ? getWeeklyPlanSessionTopicOptions(activePlan)
    : [];
  const detailPlan = lessonPlanId
    ? teacherPlans.find((p) => p.id === lessonPlanId)
    : undefined;
  const detailPlanNotes = detailPlan
    ? notesForLessonPlan(myNotes, detailPlan.id)
    : [];

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
    setNoteTitle(
      match.value === 'all'
        ? `${weeklyPlanWeekLabel(plan)} — All sessions notes`
        : `${match.label} — Notes`,
    );
  };

  const openCreateNote = (planId: string) => {
    const plan = ownWeeklyPlans.find((p) => p.id === planId);
    if (plan && !isWeeklyPlanHodApproved(plan)) {
      addNotification(
        'Awaiting HoD approval',
        'Generate teaching notes only after your weekly lesson plan is approved by the department head.',
        'alert',
      );
      return;
    }
    setEditingNoteId(null);
    setLinkedPlanId(planId);
    setNotesGrade(plan?.grade ?? defaultGrade);
    setNotesSubject(plan?.subject ?? defaultSubject);
    setNotesLanguage('English');
    setNoteTitle('');
    setAiNotesResult(null);
    setNoteContentText('');
    setShowNoteContentPreview(false);
    if (plan) {
      applySessionTopic(plan, 'all');
    } else {
      setSelectedSessionScope('');
      setNotesTopic('');
    }
    setNoteModalOpen(true);
  };

  useEffect(() => {
    if (teacherProfile.name === 'Loading…') return;
    setNotesSubject(defaultSubject);
    if (teacherProfile.grades.length > 0) {
      setNotesGrade(teacherProfile.grades[0]);
    }
  }, [teacherProfile.id, teacherProfile.name, defaultSubject, teacherProfile.grades]);

  useEffect(() => {
    const openPlan = () => setIsPlanOpen(true);
    const openNote = (e: Event) => {
      const detail = (e as CustomEvent<{ lessonPlanId?: string }>).detail;
      const preferred =
        detail?.lessonPlanId && ownWeeklyPlans.some((p) => p.id === detail.lessonPlanId)
          ? detail.lessonPlanId
          : ownWeeklyPlans.find((p) => isWeeklyPlanHodApproved(p))?.id ??
            ownWeeklyPlans[0]?.id ??
            '';
      openCreateNote(preferred);
    };
    window.addEventListener('open-teacher-lesson-plan', openPlan);
    window.addEventListener('open-teacher-create-note', openNote as EventListener);
    return () => {
      window.removeEventListener('open-teacher-lesson-plan', openPlan);
      window.removeEventListener('open-teacher-create-note', openNote as EventListener);
    };
  }, [ownWeeklyPlans]); // openCreateNote closes over latest weekly plans via rebind each render

  const openWeeklyPlanDialog = (plan: LessonPlan, mode: 'view' | 'edit') => {
    setWeeklyPlanDialog({ plan, mode });
    setEditWeeklyTitle(plan.title);
  };

  const closeNoteModal = () => {
    setNoteModalOpen(false);
    setEditingNoteId(null);
    setNoteContentText('');
    setAiNotesResult(null);
    setShowNoteContentPreview(false);
    setShowNotesPreview(false);
  };

  const openEditNote = (note: TeachingNote) => {
    setEditingNoteId(note.id);
    setLinkedPlanId(note.lessonPlanId ?? '');
    setNotesGrade(note.grade);
    setNotesSubject(note.subject);
    setNotesTopic(note.topic);
    setNotesLanguage(note.language);
    setNoteTitle(note.title);
    setShowNoteContentPreview(false);
    let parsed: AITeachingNotesResult | null = null;
    if (note.contentBody) {
      try {
        parsed = JSON.parse(note.contentBody) as AITeachingNotesResult;
        setAiNotesResult(parsed);
      } catch {
        setAiNotesResult(null);
      }
    } else {
      setAiNotesResult(null);
    }
    setNoteContentText(notesResultToEditableText(parsed, note.contentSummary ?? ''));
    setNoteModalOpen(true);
  };

  const handleGenerateNotes = async () => {
    if (activePlan && !editingNoteId && !isWeeklyPlanHodApproved(activePlan)) {
      addNotification(
        'Awaiting HoD approval',
        'This weekly plan must be approved by the department head before you generate teaching notes.',
        'alert',
      );
      return;
    }
    if (activePlan && !editingNoteId) {
      if (!selectedSessionScope) {
        addNotification('Session required', 'Choose a week session (or All sessions).', 'alert');
        return;
      }
      if (!notesTopic.trim()) {
        addNotification('Topic required', 'Enter or keep the session topic before generating.', 'alert');
        return;
      }
    } else if (!notesTopic.trim()) {
      addNotification('Topic required', 'Please enter a topic first.', 'alert');
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
        const planObjectives = [
          ...(activePlan.objectives || []),
          ...(weekly?.objectives || []),
        ].filter(Boolean);
        const uniqueObjectives = [...new Set(planObjectives)];

        topic = notesTopic.trim() || match?.topic || activePlan.title;
        subtopic =
          match?.value === 'all'
            ? weekly?.subTopic || 'All sessions this week'
            : match?.subtopic || match?.label || '';

        sessionContext = [
          match?.context || '',
          `Teacher-selected topic (editable): ${topic}`,
          uniqueObjectives.length
            ? `Lesson plan objectives to cover:\n${uniqueObjectives.map((o) => `- ${o}`).join('\n')}`
            : '',
          selectedSessionScope === 'all'
            ? 'Generate teaching notes that cover every session in this weekly plan, organized by session, while honouring the lesson plan objectives.'
            : `Generate teaching notes focused on this session while honouring the weekly lesson plan objectives.`,
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
      
      console.log('📦 Raw API response:', response);
      
      // The API returns markdown content, so we'll store it as a special format
      // that the renderer can detect
      let result: AITeachingNotesResult;
      
      if (typeof response.content === 'string') {
        // Check if it's markdown (contains # or ## headers)
        if (response.content.includes('#') || response.content.includes('##')) {
          console.log('✅ Detected markdown content, using markdown renderer');
          // Store as markdown for rendering
          result = {
            title: `Teaching Notes: ${notesGrade} ${notesSubject} - ${notesTopic}`,
            language: notesLanguage,
            introduction: '',
            explanations: [{
              subtitle: 'Content',
              content: response.content, // Markdown content
              examples: []
            }],
            visualAids: [],
            exercises: []
          };
        } else {
          // Try to parse as JSON
          try {
            result = JSON.parse(response.content);
            console.log('✅ Parsed JSON response');
          } catch {
            console.log('⚠️ Creating structured format from text');
            result = {
              title: `Teaching Notes: ${notesGrade} ${notesSubject} - ${notesTopic}`,
              language: notesLanguage,
              introduction: response.content.substring(0, 300) + '...',
              explanations: [{
                subtitle: 'Content',
                content: response.content,
                examples: []
              }],
              visualAids: [],
              exercises: []
            };
          }
        }
      } else if (typeof response.content === 'object') {
        // Already an object
        result = response.content as AITeachingNotesResult;
        console.log('✅ Response is already structured');
      } else {
        // Fallback
        throw new Error('Unexpected response format');
      }
      
      console.log('✅ Final structured result:', result);
      
      setAiNotesResult(result);
      setNoteContentText(notesResultToEditableText(result));
      setShowNoteContentPreview(false);
      if (!noteTitle) setNoteTitle(result.title || `${notesTopic} Notes`);
    } catch (error) {
      console.error('❌ Failed to generate teaching notes:', error);
      addNotification('Generation Failed', 'Could not generate teaching notes. Please try again.', 'alert');
    } finally {
      setGeneratingNotes(false);
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
    };
  };

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
    closeNoteModal();
  };

  const handleSubmitNoteForApproval = () => {
    const payload = buildNotePayload();
    if (!hasNoteContent) {
      addNotification('Nothing to submit', 'Add note content or generate with AI first.', 'alert');
      return;
    }
    if (editingNoteId) {
      updateTeachingNote(editingNoteId, { ...payload, status: 'Pending Dept Head' });
      addNotification('Submitted', 'Teaching note sent to department head for approval.', 'success');
    } else {
      createTeachingNote(payload, 'Pending Dept Head');
      addNotification('Submitted', 'Teaching note sent to department head for approval.', 'success');
    }
    closeNoteModal();
  };

  const handleSubmitLessonPlan = (payload: Parameters<typeof createLessonPlan>[0]) => {
    createLessonPlan(payload);
  };

  const parsedViewContent = useMemo(() => {
    if (!viewNote?.contentBody) return null;
    try {
      return JSON.parse(viewNote.contentBody) as AITeachingNotesResult;
    } catch {
      return null;
    }
  }, [viewNote]);

  const getNoteMarkdown = (
    content: AITeachingNotesResult | string | null,
    note?: Pick<TeachingNote, 'title' | 'grade' | 'subject' | 'topic' | 'language' | 'contentSummary'>,
  ) => {
    const meta = note
      ? {
          grade: note.grade,
          subject: note.subject,
          topic: note.topic,
          language: note.language,
        }
      : undefined;

    if (content) {
      return teachingNotesToMarkdown(content, meta);
    }
    if (note?.contentSummary) {
      return teachingNotesToMarkdown(note.contentSummary, meta);
    }
    return '';
  };

  const handlePrintNotes = async (
    content: AITeachingNotesResult | string | null,
    title: string,
    note?: Pick<TeachingNote, 'title' | 'grade' | 'subject' | 'topic' | 'language' | 'contentSummary'>,
  ) => {
    const markdown = getNoteMarkdown(content, note);
    if (!markdown.trim()) {
      alert('No content available to print.');
      return;
    }
    await printMarkdown(markdown, title);
  };

  const handleDownloadNotesPDF = async (
    content: AITeachingNotesResult | string | null,
    title: string,
    note?: Pick<TeachingNote, 'title' | 'grade' | 'subject' | 'topic' | 'language' | 'contentSummary'>,
  ) => {
    const markdown = getNoteMarkdown(content, note);
    if (!markdown.trim()) {
      alert('No content available to download.');
      return;
    }
    setIsGeneratingPDF(true);
    try {
      await generatePDFFromMarkdown(markdown, `${slugifyFilename(title)}.pdf`, title);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const deliveryForNote = (noteId: string) =>
    lessonDeliveries.find((d) => d.teachingNoteId === noteId);

  const handleDeliverySubmit = async (payload: {
    graspOutcome: GraspOutcome;
    challengeText?: string;
    postTo: 'hod' | 'community' | 'both' | 'none';
  }) => {
    if (!deliverNote) return;
    await markLessonDelivered({
      teachingNoteId: deliverNote.id,
      lessonPlanId: deliverNote.lessonPlanId,
      graspOutcome: payload.graspOutcome,
      challengeText: payload.challengeText,
      postTo: payload.postTo,
    });
  };

  const renderNoteCard = (note: TeachingNote) => {
    const delivery = deliveryForNote(note.id);
    return (
    <div key={note.id} className={`${aisCard} relative flex overflow-hidden`}>
      <div className="flex min-w-0 flex-1 flex-col p-4">
        <div className="mb-2 flex items-start justify-between gap-2">
          <AisStatusBadge variant={noteStatusVariant(note.status)}>{note.status}</AisStatusBadge>
          <DropdownMenu
            align="right"
            trigger={
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full text-ais-on-surface-variant transition-colors hover:bg-ais-row-hover">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Note actions</span>
              </span>
            }
            sections={[
              {
                items: [
                  {
                    id: 'view',
                    label: 'View',
                    icon: <Eye className="h-4 w-4" />,
                    onClick: () => setViewNote(note),
                  },
                  {
                    id: 'edit',
                    label: 'Edit',
                    icon: <Pencil className="h-4 w-4" />,
                    onClick: () => openEditNote(note),
                  },
                  {
                    id: 'delete',
                    label: 'Delete',
                    icon: <Trash2 className="h-4 w-4" />,
                    danger: true,
                    onClick: () => setNotePendingDelete(note),
                  },
                ],
              },
            ]}
          />
        </div>
        <p className={`${aisDataMd} font-semibold line-clamp-2`}>{note.title}</p>
        <p className={`${aisBodySm} mt-1`}>{note.topic}</p>
        <p className={`${aisBodySm} mt-0.5`}>{note.language}</p>
        <p className={`${aisBodySm} mt-1 text-ais-on-surface-variant`}>
          Updated {note.updatedAt ?? note.createdAt}
        </p>
      </div>
      <div className="flex w-[7.5rem] shrink-0 flex-col items-center justify-center gap-2 border-l border-ais-card-border bg-ais-surface-container-low/40 px-2 py-3">
        {delivery ? (
          <>
            <CheckCircle2 className="h-5 w-5 text-emerald-600" aria-hidden />
            <span className="text-center text-[11px] font-semibold leading-tight text-emerald-700">
              Delivered
            </span>
            <span className="text-center text-[10px] leading-tight text-ais-on-surface-variant">
              {graspOutcomeLabel(delivery.graspOutcome)}
            </span>
          </>
        ) : (
          <button
            type="button"
            className="inline-flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-center text-[11px] font-bold uppercase tracking-wide text-ais-primary transition-colors hover:bg-ais-primary/10"
            onClick={() => setDeliverNote(note)}
          >
            <CheckCircle2 className="h-5 w-5" aria-hidden />
            Delivered
          </button>
        )}
      </div>
    </div>
  );
  };

  const goToLessonPlan = (planId: string) => {
    router.push(`/dashboard/teacher/teaching-notes/${planId}`);
  };

  const goBackToList = () => {
    router.push('/dashboard/teacher/teaching-notes');
  };

  return (
    <AisPage>
      {lessonPlanId ? (
        detailPlan ? (
          <div className="space-y-4">
            {/* Lesson plan details — always at the top */}
            <PlanSummary plan={detailPlan} />

            {/* Notes grid — 3 cards per row */}
            {detailPlanNotes.length === 0 ? (
              <p className={`${aisBodySm} rounded-lg bg-ais-surface-container-low p-4`}>
                No teaching notes yet for this lesson plan.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {detailPlanNotes.map(renderNoteCard)}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <p className={aisBodyMd}>Lesson plan not found.</p>
            <AisBtnSecondary onClick={goBackToList}>
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
              Back to lesson plans
            </AisBtnSecondary>
          </div>
        )
      ) : (
        <div className="space-y-8">
          <section className="space-y-3">
            <p className={aisLabelCaps}>Published annual lesson plans</p>
            <p className={aisBodySm}>
              From your department head — paced on the school calendar and teaching textbook.
            </p>
            {publishedAnnualPlans.length === 0 ? (
              <p className={aisBodyMd}>
                No published annual plans yet. Wait for your department head to publish one.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {publishedAnnualPlans.map((plan) => (
                  <div
                    key={plan.id}
                    className={`${aisCard} flex min-h-[160px] flex-col overflow-hidden transition-shadow hover:shadow-[0_4px_12px_rgba(15,23,42,0.08)]`}
                  >
                    <button
                      type="button"
                      className="flex flex-1 flex-col p-4 text-left transition-colors hover:bg-ais-row-hover"
                      onClick={() => goToLessonPlan(plan.id)}
                    >
                      <div className="mb-2">
                        <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                          Annual
                        </span>
                      </div>
                      <h3 className={`${aisHeadlineSm} line-clamp-2 mb-2`}>{plan.title}</h3>
                      <p className={`${aisBodySm} text-ais-on-surface-variant mb-2`}>
                        {plan.grade} · {plan.subject} · {plan.sessions} weeks
                      </p>
                      <div className="mt-auto">
                        <AisStatusBadge variant="success">Published</AisStatusBadge>
                      </div>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="space-y-3">
            <p className={aisLabelCaps}>Weekly lesson plans</p>
            <p className={aisBodySm}>
              Create from a published annual plan, then generate teaching notes after HoD approval.
            </p>
            {ownWeeklyPlans.length === 0 ? (
              <p className={aisBodyMd}>
                {publishedAnnualPlans.length === 0
                  ? 'Create a weekly lesson plan once an annual plan is published, or wait for your department head.'
                  : 'No weekly plans yet — create one from the annual plan above (Create lesson plan).'}
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {ownWeeklyPlans.map((plan) => {
                  const planNotes = notesForLessonPlan(myNotes, plan.id);
                  const hodApproved = isWeeklyPlanHodApproved(plan);
                  return (
                    <div
                      key={plan.id}
                      className={`${aisCard} flex min-h-[180px] flex-col overflow-hidden transition-shadow hover:shadow-[0_4px_12px_rgba(15,23,42,0.08)]`}
                    >
                      <div className="flex items-start justify-between gap-2 px-4 pt-4">
                        <button
                          type="button"
                          className="min-w-0 flex-1 text-left"
                          onClick={() => openWeeklyPlanDialog(plan, 'view')}
                        >
                          <h3 className={`${aisHeadlineSm} line-clamp-2`}>{weeklyPlanWeekLabel(plan)}</h3>
                        </button>
                        <div className="flex shrink-0 items-center gap-1">
                          <span className="inline-flex h-7 min-w-[2rem] items-center justify-center rounded-full bg-ais-primary/10 px-2.5 text-xs font-bold tabular-nums text-ais-primary">
                            {planNotes.length}
                          </span>
                          <DropdownMenu
                            align="right"
                            trigger={
                              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full text-ais-on-surface-variant transition-colors hover:bg-ais-row-hover">
                                <MoreVertical className="h-4 w-4" />
                                <span className="sr-only">Weekly plan actions</span>
                              </span>
                            }
                            sections={[
                              {
                                items: [
                                  {
                                    id: 'view',
                                    label: 'View',
                                    icon: <Eye className="h-4 w-4" />,
                                    onClick: () => openWeeklyPlanDialog(plan, 'view'),
                                  },
                                  {
                                    id: 'edit',
                                    label: 'Edit',
                                    icon: <Pencil className="h-4 w-4" />,
                                    onClick: () => openWeeklyPlanDialog(plan, 'edit'),
                                  },
                                  {
                                    id: 'delete',
                                    label: 'Delete',
                                    icon: <Trash2 className="h-4 w-4" />,
                                    danger: true,
                                    onClick: () => setPlanPendingDelete(plan),
                                  },
                                ],
                              },
                            ]}
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        className="flex flex-1 flex-col px-4 pb-4 pt-2 text-left transition-colors hover:bg-ais-row-hover"
                        onClick={() => goToLessonPlan(plan.id)}
                      >
                        <p className={`${aisBodySm} text-ais-on-surface-variant mb-1 line-clamp-1`}>
                          {plan.title}
                        </p>
                        <p className={`${aisBodySm} text-ais-on-surface-variant mb-2`}>
                          {plan.subject} · {plan.sessions} {plan.sessions === 1 ? 'session' : 'sessions'}
                        </p>
                        <div className="mt-auto">
                          {plan.status === 'Pending Dept Head' || plan.status === 'Pending School Head' ? (
                            <div className="inline-flex items-center gap-1.5 rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {plan.status.replace('Pending ', '')}
                            </div>
                          ) : (
                            <AisStatusBadge variant={approvalBadgeVariant(plan.status)}>
                              {plan.status}
                            </AisStatusBadge>
                          )}
                        </div>
                      </button>
                      <div className="flex items-center justify-between gap-2 border-t border-ais-card-border px-3 py-2">
                        {!hodApproved ? (
                          <p className="text-[11px] leading-snug text-ais-on-surface-variant">
                            Notes unlock after HoD approval
                          </p>
                        ) : (
                          <span className="text-[11px] text-ais-on-surface-variant">Add teaching notes</span>
                        )}
                        <button
                          type="button"
                          aria-label={hodApproved ? 'Add note' : 'Weekly plan not yet approved by HoD'}
                          disabled={!hodApproved}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-2xl bg-ais-primary text-white shadow-md transition-all hover:bg-ais-primary-container hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
                          onClick={(e) => {
                            e.stopPropagation();
                            openCreateNote(plan.id);
                          }}
                        >
                          <Plus className="h-4 w-4" aria-hidden />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="space-y-3">
            <p className={aisLabelCaps}>Teaching notes</p>
            <p className={aisBodySm}>
              Generated from weekly lesson plans after HoD approval.
            </p>
            {myNotes.length === 0 ? (
              <p className={aisBodyMd}>
                No teaching notes yet. Approve a weekly plan with your HoD, then add notes from the card above.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {myNotes.map(renderNoteCard)}
              </div>
            )}
          </section>
        </div>
      )}

      <Dialog
        isOpen={Boolean(weeklyPlanDialog)}
        onClose={() => setWeeklyPlanDialog(null)}
        title={
          weeklyPlanDialog?.mode === 'edit'
            ? 'Edit weekly lesson plan'
            : 'Weekly lesson plan'
        }
        size="2xl"
        largeTitle
      >
        {weeklyPlanDialog && (
          <div className="space-y-4 pt-1">
            {weeklyPlanDialog.mode === 'edit' ? (
              <div>
                <label className={aisFormLabel} htmlFor="edit-weekly-title">
                  Title
                </label>
                <input
                  id="edit-weekly-title"
                  className={aisInput}
                  value={editWeeklyTitle}
                  onChange={(e) => setEditWeeklyTitle(e.target.value)}
                />
              </div>
            ) : (
              <p className={aisBodySm}>
                {weeklyPlanDialog.plan.grade} · {weeklyPlanDialog.plan.subject} ·{' '}
                {weeklyPlanDialog.plan.status}
              </p>
            )}
            <PlanSummary plan={weeklyPlanDialog.plan} />
            <DialogFooter className="pt-2 -mb-1">
              <AisBtnSecondary onClick={() => setWeeklyPlanDialog(null)}>Close</AisBtnSecondary>
              {weeklyPlanDialog.mode === 'edit' && (
                <AisBtnPrimary
                  onClick={() => {
                    const p = weeklyPlanDialog.plan;
                    const title = editWeeklyTitle.trim() || p.title;
                    updateLessonPlan(p.id, title, p.objectives, p.sessions, p.homework);
                    addNotification('Weekly plan updated', `"${title}" saved.`, 'success');
                    setWeeklyPlanDialog(null);
                  }}
                >
                  <Save className="h-3.5 w-3.5" aria-hidden />
                  Save
                </AisBtnPrimary>
              )}
            </DialogFooter>
          </div>
        )}
      </Dialog>

      <Dialog
        isOpen={Boolean(planPendingDelete)}
        onClose={() => setPlanPendingDelete(null)}
        title="Delete weekly lesson plan?"
        description="This cannot be undone."
        size="sm"
      >
        <p className="text-sm text-ais-on-surface">
          Delete{' '}
          <span className="font-semibold">
            {planPendingDelete ? weeklyPlanWeekLabel(planPendingDelete) : 'this weekly plan'}
          </span>
          ?
        </p>
        <DialogFooter className="mt-5 -mx-5 sm:-mx-6 -mb-5 sm:-mb-6">
          <Button variant="outline" onClick={() => setPlanPendingDelete(null)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              if (planPendingDelete) {
                deleteLessonPlan(planPendingDelete.id);
                if (lessonPlanId === planPendingDelete.id) goBackToList();
              }
              setPlanPendingDelete(null);
            }}
          >
            Delete
          </Button>
        </DialogFooter>
      </Dialog>

      <Dialog
        isOpen={Boolean(notePendingDelete)}
        onClose={() => setNotePendingDelete(null)}
        title="Delete teaching note?"
        description="This cannot be undone."
        size="sm"
      >
        <p className="text-sm text-ais-on-surface">
          Delete{' '}
          <span className="font-semibold">{notePendingDelete?.title ?? 'this teaching note'}</span>?
        </p>
        <DialogFooter className="mt-5 -mx-5 sm:-mx-6 -mb-5 sm:-mb-6">
          <Button variant="outline" onClick={() => setNotePendingDelete(null)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              if (notePendingDelete) {
                deleteTeachingNote(notePendingDelete.id);
                if (viewNote?.id === notePendingDelete.id) setViewNote(null);
              }
              setNotePendingDelete(null);
            }}
          >
            Delete
          </Button>
        </DialogFooter>
      </Dialog>

      <Dialog
        isOpen={noteModalOpen}
        onClose={closeNoteModal}
        title={editingNoteId ? 'Edit teaching note' : 'Create teaching note'}
        size="2xl"
        largeTitle
      >
        <div className="space-y-5 pt-1">
          <Select
            variant="ais"
            label="Week (weekly lesson plan)"
            options={[
              { value: '', label: 'No lesson plan (standalone)' },
              ...ownWeeklyPlans.map((p) => ({
                value: p.id,
                label: `${weeklyPlanWeekLabel(p)} · ${p.status}${
                  isWeeklyPlanHodApproved(p) ? '' : ' (awaiting HoD)'
                }`,
              })),
            ]}
            value={linkedPlanId}
            onChange={(e) => {
              setLinkedPlanId(e.target.value);
              const p = ownWeeklyPlans.find((x) => x.id === e.target.value);
              if (p) {
                if (!editingNoteId && !isWeeklyPlanHodApproved(p)) {
                  addNotification(
                    'Awaiting HoD approval',
                    'Pick an HoD-approved weekly plan to generate notes.',
                    'alert',
                  );
                }
                setNotesGrade(p.grade);
                setNotesSubject(p.subject);
                if (!editingNoteId) {
                  applySessionTopic(p, 'all');
                }
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
              Week: {weeklyPlanWeekLabel(activePlan)} — notes will follow this weekly plan’s
              sessions and objectives.
            </p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex min-w-0 flex-col gap-1">
              <label className={`${aisFormLabel} block min-h-[14px] leading-[14px]`}>Note title</label>
              <input className={`${aisInput} min-w-0`} value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} placeholder="e.g. Session 2 handout" />
            </div>
            <div className="min-w-0">
              <Select variant="ais" label="Grade" options={GRADE_OPTIONS.map((g) => ({ value: g, label: g }))} value={notesGrade} onChange={(e) => setNotesGrade(e.target.value)} />
            </div>
            <div className="min-w-0">
              <Select variant="ais" label="Subject" options={[{ value: 'Mathematics', label: 'Mathematics' }, { value: 'Biology', label: 'Biology' }, { value: 'General Science', label: 'General Science' }]} value={notesSubject} onChange={(e) => setNotesSubject(e.target.value)} />
            </div>
            {activePlan && !editingNoteId ? (
              <div className="min-w-0">
                <Select
                  variant="ais"
                  label="Session"
                  options={sessionTopicOptions.map((o) => ({ value: o.value, label: o.label }))}
                  value={selectedSessionScope}
                  onChange={(e) => {
                    applySessionTopic(activePlan, e.target.value);
                  }}
                />
              </div>
            ) : null}
            <div className="flex min-w-0 flex-col gap-1 sm:col-span-2">
              <label className={`${aisFormLabel} block min-h-[14px] leading-[14px]`}>
                Topic {activePlan && !editingNoteId ? '(editable)' : ''}
              </label>
              <input
                className={`${aisInput} min-w-0`}
                value={notesTopic}
                onChange={(e) => setNotesTopic(e.target.value)}
                placeholder="Session topic — edit if you want to refine before generating"
              />
            </div>
          </div>
          {activePlan && !editingNoteId && (
            <div className="space-y-1">
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
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="min-w-0">
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
            </div>
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
          <div className="flex justify-end">
            <AisBtnPrimary
              type="button"
              onClick={handleGenerateNotes}
              disabled={
                generatingNotes ||
                !notesTopic.trim() ||
                (!!activePlan && !editingNoteId && !selectedSessionScope) ||
                (!!activePlan && !editingNoteId && !isWeeklyPlanHodApproved(activePlan))
              }
            >
              <Sparkles className="h-3.5 w-3.5 animate-pulse" aria-hidden />
              {generatingNotes ? 'Generating with AI...' : 'Generate with AI'}
            </AisBtnPrimary>
          </div>
          {(editingNoteId || aiNotesResult || noteContentText.trim()) && (
            <div className="space-y-3 rounded-xl border border-ais-card-border bg-ais-surface-container-low/40 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className={aisFormLabel}>
                  {editingNoteId ? 'Note content — edit freely' : 'Note content'}
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowNoteContentPreview(false)}
                    className={`rounded-lg px-3 py-1 text-xs font-semibold transition-colors ${
                      !showNoteContentPreview
                        ? 'bg-ais-primary text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
                    }`}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNoteContentPreview(true)}
                    disabled={!noteContentText.trim()}
                    className={`rounded-lg px-3 py-1 text-xs font-semibold transition-colors disabled:opacity-50 ${
                      showNoteContentPreview
                        ? 'bg-ais-primary text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
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
                        content={editableTextToNotesResult(noteContentText.trim(), {
                          title: noteTitle || 'Teaching Notes',
                          language: notesLanguage,
                        })}
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
          {!editingNoteId && aiNotesResult && (
            <div className="rounded-xl border border-ais-card-border bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-800/10 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-bold text-green-900 dark:text-green-200">
                    AI Generated Teaching Notes Ready
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAiNotesResult(null);
                    setNoteContentText('');
                    setShowNotesPreview(false);
                    setShowNoteContentPreview(false);
                  }}
                  className="text-xs text-ais-error hover:underline flex items-center gap-1"
                >
                  <X className="h-3 w-3" />
                  Clear & Regenerate
                </button>
              </div>
              <p className="text-sm text-green-800 dark:text-green-300 mb-3">
                Content loaded into the editor above — review, edit, then save or submit.
              </p>
            </div>
          )}
          <DialogFooter className="flex-wrap gap-3 pt-4 -mb-1">
            <AisBtnSecondary type="button" onClick={closeNoteModal}>
              <X className="h-3.5 w-3.5" aria-hidden />
              Cancel
            </AisBtnSecondary>
            <AisBtnSecondary type="button" onClick={handleSaveDraft} disabled={!hasNoteContent}>
              <Save className="h-3.5 w-3.5" aria-hidden />
              Save draft
            </AisBtnSecondary>
            <AisBtnPrimary type="button" onClick={handleSubmitNoteForApproval} disabled={!hasNoteContent}>
              <Send className="h-3.5 w-3.5" aria-hidden />
              Submit for dept approval
            </AisBtnPrimary>
          </DialogFooter>
        </div>
      </Dialog>

      <Dialog isOpen={!!viewNote} onClose={() => setViewNote(null)} title={viewNote?.title ?? 'Teaching note'} size="xl">
        {viewNote && (
          <div className="max-h-[70vh] space-y-4 overflow-y-auto pt-2 text-xs">
            <div className="flex flex-wrap gap-2">
              <AisStatusBadge variant={noteStatusVariant(viewNote.status)}>{viewNote.status}</AisStatusBadge>
              <span className={aisBodyMd}>{viewNote.grade} · {viewNote.subject} · {viewNote.language}</span>
            </div>
            {parsedViewContent ? (
              <Suspense fallback={<RendererLoading />}>
                <TeachingNotesRenderer content={parsedViewContent} />
              </Suspense>
            ) : (
              <p className={aisBodyMd}>{viewNote.contentSummary}</p>
            )}
            <DialogFooter className="pt-2 -mb-1">
              <AisBtnSecondary
                onClick={() =>
                  handlePrintNotes(parsedViewContent, viewNote.title, viewNote)
                }
              >
                <Printer className="h-3.5 w-3.5" aria-hidden />
                Print
              </AisBtnSecondary>
              <AisBtnSecondary
                onClick={() => handleDownloadNotesPDF(parsedViewContent, viewNote.title, viewNote)}
                disabled={isGeneratingPDF}
              >
                <Download className="h-3.5 w-3.5" aria-hidden />
                {isGeneratingPDF ? 'Generating…' : 'Download PDF'}
              </AisBtnSecondary>
              <AisBtnPrimary onClick={() => { setViewNote(null); openEditNote(viewNote); }}>Edit note</AisBtnPrimary>
            </DialogFooter>
          </div>
        )}
      </Dialog>

      {/* AI Notes Preview Modal */}
      <Dialog 
        isOpen={showNotesPreview} 
        onClose={() => setShowNotesPreview(false)} 
        title="AI Generated Teaching Notes" 
        size="2xl"
        largeTitle
      >
        <div className="max-h-[75vh] overflow-y-auto pt-2">
          {aiNotesResult && (
            <Suspense fallback={<RendererLoading />}>
              <TeachingNotesRenderer content={aiNotesResult} />
            </Suspense>
          )}
          <DialogFooter className="pt-4 -mb-1 mt-6">
            <AisBtnSecondary
              onClick={() =>
                aiNotesResult &&
                handlePrintNotes(
                  aiNotesResult,
                  aiNotesResult.title || noteTitle || 'Teaching Notes',
                  {
                    title: aiNotesResult.title || noteTitle,
                    grade: notesGrade,
                    subject: notesSubject,
                    topic: notesTopic,
                    language: notesLanguage,
                    contentSummary: aiNotesResult.introduction,
                  },
                )
              }
            >
              <Printer className="h-3.5 w-3.5" aria-hidden />
              Print
            </AisBtnSecondary>
            <AisBtnSecondary
              onClick={() =>
                aiNotesResult &&
                handleDownloadNotesPDF(
                  aiNotesResult,
                  aiNotesResult.title || noteTitle || 'Teaching Notes',
                  {
                    title: aiNotesResult.title || noteTitle,
                    grade: notesGrade,
                    subject: notesSubject,
                    topic: notesTopic,
                    language: notesLanguage,
                    contentSummary: aiNotesResult.introduction,
                  },
                )
              }
              disabled={isGeneratingPDF}
            >
              <Download className="h-3.5 w-3.5" aria-hidden />
              {isGeneratingPDF ? 'Generating…' : 'Download PDF'}
            </AisBtnSecondary>
            <AisBtnSecondary onClick={() => setShowNotesPreview(false)}>
              Close Preview
            </AisBtnSecondary>
            <AisBtnPrimary onClick={() => setShowNotesPreview(false)}>
              Use These Notes
            </AisBtnPrimary>
          </DialogFooter>
        </div>
      </Dialog>

      <TeacherWeeklyPlanDialog
        isOpen={isPlanOpen}
        onClose={() => setIsPlanOpen(false)}
        annualPlans={publishedAnnualPlans}
        defaultGrade={defaultGrade}
        defaultSubject={defaultSubject}
        onSubmit={handleSubmitLessonPlan}
        onNotify={addNotification}
      />

      <NoteDeliveryDialog
        open={!!deliverNote}
        note={deliverNote}
        onClose={() => setDeliverNote(null)}
        onSubmit={handleDeliverySubmit}
      />
    </AisPage>
  );
};

function PlanSummary({ plan }: { plan: LessonPlan }) {
  let annual: AnnualLessonPlanResult | null = null;
  let weekly: AIDetailedLessonPlanResult | null = null;

  if (plan.planDetail) {
    try {
      const parsed = JSON.parse(plan.planDetail) as AIDetailedLessonPlanResult | AnnualLessonPlanResult;
      if (plan.planType === 'yearly' || (parsed as AnnualLessonPlanResult).weeks) {
        annual = parsed as AnnualLessonPlanResult;
      }
      if (
        plan.planType === 'weekly' ||
        ((parsed as AIDetailedLessonPlanResult).type === 'weekly' &&
          (parsed as AIDetailedLessonPlanResult).sessions)
      ) {
        weekly = parsed as AIDetailedLessonPlanResult;
      }
    } catch {
      annual = null;
      weekly = null;
    }
  }

  if (annual?.weeks?.length) {
    return (
      <div className="space-y-3">
        <div className="max-h-[70vh] overflow-auto rounded-lg border border-ais-card-border bg-background p-3">
          <AnnualLessonPlanTable plan={annual} />
        </div>
      </div>
    );
  }

  if (weekly?.sessions?.length) {
    return (
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className={aisBodySm}>
            {plan.grade} · {plan.subject} · {weekly.sessions.length} sessions
          </span>
          <button
            type="button"
            onClick={() => void downloadWeeklyLessonPlanDocx(weekly!)}
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <Download className="h-3 w-3" />
            Download Word
          </button>
        </div>
        <div className="max-h-[70vh] overflow-auto rounded-lg border border-ais-card-border bg-background p-2">
          <WeeklyLessonPlanTable
            sessions={weekly.sessions}
            meta={{
              grade: plan.grade,
              subject: weekly.subject || plan.subject,
              mainTopic: weekly.mainTopic,
              subTopic: weekly.subTopic,
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <details className={`${aisBodySm} rounded-lg bg-ais-surface-container-low p-3`}>
      <summary className="cursor-pointer font-semibold text-ais-on-surface">Lesson plan details</summary>
      <ul className="mt-2 list-disc space-y-1 pl-4">
        {plan.objectives.map((o, i) => (
          <li key={i}>{o}</li>
        ))}
      </ul>
    </details>
  );
}
