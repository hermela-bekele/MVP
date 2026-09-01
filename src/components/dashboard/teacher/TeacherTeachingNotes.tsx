'use client';

import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, Download, Eye, HelpCircle, MoreVertical, Pencil, Plus, Printer, Save, Trash2 } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Dialog, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import type { AITeachingNotesResult, AIDetailedLessonPlanResult } from '@/lib/ai';
import { parseWeeklyPlanDetail } from '@/lib/ai';
import {
  filterTeacherLessonPlans,
  notesForLessonPlan,
  resolveTeacherProfile,
  isWeeklyPlanHodApproved,
  weeklyPlanStatusLabel,
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
import { stripDuplicatedMarkdownPrefix } from '@/lib/teachingNotesMarkdown';
import {
  AisBtnPrimary,
  AisBtnSecondary,
  AisPage,
  AisStatusBadge,
  approvalBadgeVariant,
  aisFormLabel,
  aisInput,
} from '@/components/dashboard/teacher/TeacherPortalUi';
import {
  aisBodyMd,
  aisBodySm,
  aisCard,
  aisDataMd,
  aisHeadlineSm,
  aisLabelCaps,
} from '@/components/dashboard/teacher/aisStyles';
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
  if (status === 'Pending Dept Head') return 'success' as const; // Treat as approved
  if (status === 'Rejected') return 'error' as const;
  if (status === 'Approved') return 'success' as const;
  return 'success' as const;
}

function editableTextToNotesResult(
  text: string,
  meta: { title: string; language: string },
): AITeachingNotesResult {
  const trimmed = stripDuplicatedMarkdownPrefix(text);
  return {
    title: meta.title,
    language: meta.language,
    // Keep introduction empty when body is full markdown so the renderer
    // does not show a truncated raw-markdown duplicate above the note.
    introduction: '',
    explanations: [{ subtitle: 'Content', content: trimmed, examples: [] }],
    visualAids: [],
    exercises: [],
  };
}

interface TeacherTeachingNotesProps {
  lessonPlanId?: string;
  /** Restricts this module to lesson plans (annual + weekly) or lesson notes only. Omit to show everything. */
  mode?: 'plans' | 'notes';
}

export const TeacherTeachingNotes: React.FC<TeacherTeachingNotesProps> = ({
  lessonPlanId,
  mode,
}) => {
  const router = useRouter();
  const {
    lessonPlans,
    teachingNotes,
    teachers,
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

  const [viewNote, setViewNote] = useState<TeachingNote | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [deliverNote, setDeliverNote] = useState<TeachingNote | null>(null);
  const [weeklyPlanDialog, setWeeklyPlanDialog] = useState<{
    plan: LessonPlan;
    mode: 'view' | 'edit';
  } | null>(null);
  const [editWeeklyTitle, setEditWeeklyTitle] = useState('');
  const [planPendingDelete, setPlanPendingDelete] = useState<LessonPlan | null>(null);
  const [notePendingDelete, setNotePendingDelete] = useState<TeachingNote | null>(null);
  const [listTab, setListTab] = useState<'annual' | 'weekly' | 'notes'>(
    mode === 'notes' ? 'notes' : 'annual',
  );
  const listTabOptions = (
    mode === 'notes'
      ? [{ id: 'notes' as const, label: 'Lesson notes' }]
      : mode === 'plans'
        ? [
            { id: 'annual' as const, label: 'Annual plans' },
            { id: 'weekly' as const, label: 'Weekly plans' },
          ]
        : [
            { id: 'annual' as const, label: 'Annual plans' },
            { id: 'weekly' as const, label: 'Weekly plans' },
            { id: 'notes' as const, label: 'Lesson notes' },
          ]
  );
  const detailPlan = lessonPlanId
    ? teacherPlans.find((p) => p.id === lessonPlanId)
    : undefined;
  const detailPlanNotes = detailPlan
    ? notesForLessonPlan(myNotes, detailPlan.id)
    : [];

  const openCreateNote = (planId: string) => {
    const plan = ownWeeklyPlans.find((p) => p.id === planId);
    if (plan && !isWeeklyPlanHodApproved(plan)) {
      addNotification(
        'Awaiting HoD approval',
        'Generate lesson notes only after your weekly lesson plan is approved by the department head.',
        'alert',
      );
      return;
    }
    const query = planId ? `?lessonPlanId=${encodeURIComponent(planId)}&sessionScope=all` : '';
    router.push(`/dashboard/teacher/lesson-notes/generate${query}`);
  };

  useEffect(() => {
    const openPlan = () => router.push('/dashboard/teacher/lesson-plans/generate');
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

  const openEditNote = (note: TeachingNote) => {
    router.push(`/dashboard/teacher/lesson-notes/generate?noteId=${encodeURIComponent(note.id)}`);
  };

  const parsedViewContent = useMemo(() => {
    if (!viewNote?.contentBody) return null;
    const raw = viewNote.contentBody.trim();
    try {
      return JSON.parse(raw) as AITeachingNotesResult;
    } catch {
      if (raw.length > 20) {
        return editableTextToNotesResult(raw, {
          title: viewNote.title,
          language: viewNote.language || 'English',
        });
      }
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
    communityId?: string;
    channelId?: string;
  }) => {
    if (!deliverNote) return;
    await markLessonDelivered({
      teachingNoteId: deliverNote.id,
      lessonPlanId: deliverNote.lessonPlanId,
      graspOutcome: payload.graspOutcome,
      challengeText: payload.challengeText,
      postTo: payload.postTo,
      communityId: payload.communityId,
      channelId: payload.channelId,
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
            <HelpCircle className="h-5 w-5" aria-hidden />
            Delivered?
          </button>
        )}
      </div>
    </div>
  );
  };

  const goToLessonPlan = (planId: string) => {
    router.push(`/dashboard/teacher/lesson-plans/${planId}`);
  };

  const goBackToList = () => {
    router.push('/dashboard/teacher/lesson-plans');
  };

  return (
    <AisPage>
      {lessonPlanId ? (
        detailPlan ? (
          <div className="space-y-4">
            {/* Lesson plan details — always at the top */}
            <PlanSummary plan={detailPlan} editable />

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
          {listTabOptions.length > 1 && (
          <div className="flex flex-wrap gap-2 rounded-xl border border-ais-card-border bg-white p-1 dark:bg-ais-surface">
            {listTabOptions.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setListTab(tab.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  listTab === tab.id
                    ? 'bg-ais-primary text-white'
                    : 'text-ais-on-surface-variant hover:bg-ais-row-hover'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          )}

          {mode !== 'notes' && listTab === 'annual' && (
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
                      <h3 className={`${aisHeadlineSm} line-clamp-2 mb-2 !text-title`}>{plan.title}</h3>
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
          )}

          {mode !== 'notes' && listTab === 'weekly' && (
          <section className="space-y-3">
            <p className={aisLabelCaps}>Weekly lesson plans</p>
            <p className={aisBodySm}>
              Create from a published annual plan, then generate lesson notes after HoD approval.
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
                          <h3 className={`${aisHeadlineSm} line-clamp-2 !text-title`}>{weeklyPlanWeekLabel(plan)}</h3>
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
                          {plan.status === 'Pending Dept Head' ? (
                            <div className="inline-flex items-center gap-1.5 rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Awaiting HoD
                            </div>
                          ) : (
                            <AisStatusBadge
                              variant={approvalBadgeVariant(
                                isWeeklyPlanHodApproved(plan) ? 'Approved' : plan.status,
                              )}
                            >
                              {weeklyPlanStatusLabel(plan.status)}
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
                          <span className="text-[11px] text-ais-on-surface-variant">Add lesson notes</span>
                        )}
                        <button
                          type="button"
                          aria-label={hodApproved ? 'Add note' : 'Weekly plan not yet approved by HoD'}
                          disabled={!hodApproved}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-2xl bg-btn-primary text-btn-primary-foreground shadow-md transition-all hover:bg-btn-primary/90 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
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
          )}

          {mode !== 'plans' && listTab === 'notes' && (
          <section className="space-y-3">
            <p className={aisLabelCaps}>Lesson notes</p>
            <p className={aisBodySm}>
              Generated from weekly lesson plans after HoD approval.
            </p>
            {myNotes.length === 0 ? (
              <p className={aisBodyMd}>
                {mode === 'notes'
                  ? 'No lesson notes yet. Approve a weekly plan with your HoD, then add notes from the Lesson Plans module.'
                  : 'No lesson notes yet. Approve a weekly plan with your HoD, then add notes from the Weekly plans tab.'}
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {myNotes.map(renderNoteCard)}
              </div>
            )}
          </section>
          )}
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
                {weeklyPlanStatusLabel(weeklyPlanDialog.plan.status)}
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

      <NoteDeliveryDialog
        open={!!deliverNote}
        note={deliverNote}
        onClose={() => setDeliverNote(null)}
        onSubmit={handleDeliverySubmit}
      />
    </AisPage>
  );
};

function PlanSummary({ plan, editable = false }: { plan: LessonPlan; editable?: boolean }) {
  const { updateLessonPlan, addNotification } = useApp();
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
    return <EditableAnnualPlan plan={plan} initialAnnual={annual} editable={editable} updateLessonPlan={updateLessonPlan} addNotification={addNotification} />;
  }

  if (weekly?.sessions?.length) {
    return (
      <EditableWeeklyPlan
        plan={plan}
        initialWeekly={weekly}
        editable={editable}
        updateLessonPlan={updateLessonPlan}
        addNotification={addNotification}
      />
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

/** Annual plan view with optional inline editing — only the teacher who owns this
 * draft can edit, and only while it's still a Draft (not yet submitted for review). */
function EditableAnnualPlan({
  plan,
  initialAnnual,
  editable,
  updateLessonPlan,
  addNotification,
}: {
  plan: LessonPlan;
  initialAnnual: AnnualLessonPlanResult;
  editable: boolean;
  updateLessonPlan: ReturnType<typeof useApp>['updateLessonPlan'];
  addNotification: ReturnType<typeof useApp>['addNotification'];
}) {
  const editAllowed = editable && plan.status === 'Draft';
  const [isEditing, setIsEditing] = useState(false);
  const canEdit = editAllowed && isEditing;
  const [annual, setAnnual] = useState(initialAnnual);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setAnnual(initialAnnual);
    setIsDirty(false);
    setIsEditing(false);
  }, [initialAnnual]);

  const handleSave = () => {
    updateLessonPlan(plan.id, plan.title, plan.objectives, plan.sessions, plan.homework, JSON.stringify(annual));
    addNotification('Annual Plan Saved', `Your edits to "${plan.title}" were saved.`, 'success');
    setIsDirty(false);
    setIsEditing(false);
  };

  return (
    <div className="space-y-3">
      {editAllowed && (
        <div className="flex items-center justify-between gap-2 rounded-lg bg-ais-surface-container-low px-3 py-2">
          <span className={aisBodySm}>
            {isEditing ? 'Editing — click any field below, then save.' : 'Draft — click Edit to make changes.'}
          </span>
          <div className="flex items-center gap-2">
            {isEditing ? (
              <Button size="sm" onClick={handleSave} disabled={!isDirty} leftIcon={<Save className="h-3.5 w-3.5" />}>
                Save changes
              </Button>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setIsEditing(true)} leftIcon={<Pencil className="h-3.5 w-3.5" />}>
                Edit
              </Button>
            )}
          </div>
        </div>
      )}
      <div className="max-h-[70vh] overflow-auto rounded-lg border border-ais-card-border bg-background p-3">
        <AnnualLessonPlanTable
          plan={annual}
          editable={canEdit}
          onChange={(next) => {
            setAnnual(next);
            setIsDirty(true);
          }}
        />
      </div>
    </div>
  );
}

/** Weekly plan view with optional inline editing — same teacher-own-draft-only rule
 * as EditableAnnualPlan. */
function EditableWeeklyPlan({
  plan,
  initialWeekly,
  editable,
  updateLessonPlan,
  addNotification,
}: {
  plan: LessonPlan;
  initialWeekly: AIDetailedLessonPlanResult;
  editable: boolean;
  updateLessonPlan: ReturnType<typeof useApp>['updateLessonPlan'];
  addNotification: ReturnType<typeof useApp>['addNotification'];
}) {
  const editAllowed = editable && plan.status === 'Draft';
  const [isEditing, setIsEditing] = useState(false);
  const canEdit = editAllowed && isEditing;
  const [weekly, setWeekly] = useState(initialWeekly);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setWeekly(initialWeekly);
    setIsDirty(false);
    setIsEditing(false);
  }, [initialWeekly]);

  const handleSave = () => {
    updateLessonPlan(plan.id, plan.title, plan.objectives, plan.sessions, plan.homework, JSON.stringify(weekly));
    addNotification('Weekly Plan Saved', `Your edits to "${plan.title}" were saved.`, 'success');
    setIsDirty(false);
    setIsEditing(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className={aisBodySm}>
          {plan.grade} · {plan.subject} · {weekly.sessions?.length ?? 0} sessions
        </span>
        <div className="flex items-center gap-3">
          {editAllowed &&
            (isEditing ? (
              <Button size="sm" onClick={handleSave} disabled={!isDirty} leftIcon={<Save className="h-3.5 w-3.5" />}>
                Save changes
              </Button>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setIsEditing(true)} leftIcon={<Pencil className="h-3.5 w-3.5" />}>
                Edit
              </Button>
            ))}
          <button
            type="button"
            onClick={() => void downloadWeeklyLessonPlanDocx(weekly)}
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <Download className="h-3 w-3" />
            Download Word
          </button>
        </div>
      </div>
      <div className="max-h-[70vh] overflow-auto rounded-lg border border-ais-card-border bg-background p-2">
        <WeeklyLessonPlanTable
          sessions={weekly.sessions || []}
          meta={{
            grade: plan.grade,
            subject: weekly.subject || plan.subject,
            mainTopic: weekly.mainTopic,
            subTopic: weekly.subTopic,
          }}
          editable={canEdit}
          onChange={(nextSessions) => {
            setWeekly((prev) => ({ ...prev, sessions: nextSessions }));
            setIsDirty(true);
          }}
        />
      </div>
    </div>
  );
}
