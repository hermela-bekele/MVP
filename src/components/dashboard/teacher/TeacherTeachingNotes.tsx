'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Save, Send, Sparkles, X } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Select } from '@/components/ui/select';
import { Dialog, DialogFooter } from '@/components/ui/dialog';
import { generateTeachingNotesAI, type AITeachingNotesResult } from '@/lib/ai';
import {
  DEMO_TEACHER_ID,
  GRADE_OPTIONS,
  filterTeacherLessonPlans,
  notesForLessonPlan,
} from '@/lib/teacherPortal';
import type { LessonPlan, TeachingNote } from '@/lib/mockData';
import {
  AisBtnPrimary,
  AisBtnSecondary,
  AisPage,
  AisStatusBadge,
  approvalBadgeVariant,
  aisCallout,
  aisFormLabel,
  aisInput,
  aisListRow,
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

function noteStatusVariant(status: TeachingNote['status']) {
  if (status === 'Rejected') return 'error' as const;
  if (status === 'Draft') return 'neutral' as const;
  if (status === 'Approved') return 'success' as const;
  return 'warning' as const;
}

export const TeacherTeachingNotes: React.FC = () => {
  const {
    lessonPlans,
    teachingNotes,
    createLessonPlan,
    createTeachingNote,
    updateTeachingNote,
    submitTeachingNoteForApproval,
    addNotification,
  } = useApp();

  const teacherPlans = filterTeacherLessonPlans(lessonPlans);
  const myNotes = teachingNotes.filter((n) => n.teacherId === DEMO_TEACHER_ID);
  const unlinkedNotes = myNotes.filter((n) => !n.lessonPlanId);

  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(teacherPlans[0]?.id ?? null);
  const [isPlanOpen, setIsPlanOpen] = useState(false);
  const [planTitle, setPlanTitle] = useState('');
  const [planGrade, setPlanGrade] = useState('Grade 9');
  const [planSubject, setPlanSubject] = useState('Biology');
  const [planSessions, setPlanSessions] = useState(4);
  const [planObjectives, setPlanObjectives] = useState('');
  const [planHomework, setPlanHomework] = useState('');
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [viewNote, setViewNote] = useState<TeachingNote | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [linkedPlanId, setLinkedPlanId] = useState('');
  const [notesGrade, setNotesGrade] = useState('Grade 9');
  const [notesSubject, setNotesSubject] = useState('Biology');
  const [notesTopic, setNotesTopic] = useState('');
  const [notesLanguage, setNotesLanguage] = useState('English');
  const [noteTitle, setNoteTitle] = useState('');
  const [generatingNotes, setGeneratingNotes] = useState(false);
  const [aiNotesResult, setAiNotesResult] = useState<AITeachingNotesResult | null>(null);

  const activePlan = teacherPlans.find((p) => p.id === linkedPlanId);

  useEffect(() => {
    const openPlan = () => setIsPlanOpen(true);
    const openNote = (e: Event) => {
      const detail = (e as CustomEvent<{ lessonPlanId?: string }>).detail;
      openCreateNote(detail?.lessonPlanId ?? teacherPlans[0]?.id ?? '');
    };
    window.addEventListener('open-teacher-lesson-plan', openPlan);
    window.addEventListener('open-teacher-create-note', openNote as EventListener);
    return () => {
      window.removeEventListener('open-teacher-lesson-plan', openPlan);
      window.removeEventListener('open-teacher-create-note', openNote as EventListener);
    };
  }, [teacherPlans]);

  const openCreateNote = (planId: string) => {
    const plan = teacherPlans.find((p) => p.id === planId);
    setEditingNoteId(null);
    setLinkedPlanId(planId);
    setNotesGrade(plan?.grade ?? 'Grade 9');
    setNotesSubject(plan?.subject ?? 'Biology');
    setNotesTopic('');
    setNotesLanguage('English');
    setNoteTitle('');
    setAiNotesResult(null);
    setNoteModalOpen(true);
    if (planId) setExpandedPlanId(planId);
  };

  const openEditNote = (note: TeachingNote) => {
    setEditingNoteId(note.id);
    setLinkedPlanId(note.lessonPlanId ?? '');
    setNotesGrade(note.grade);
    setNotesSubject(note.subject);
    setNotesTopic(note.topic);
    setNotesLanguage(note.language);
    setNoteTitle(note.title);
    if (note.contentBody) {
      try {
        setAiNotesResult(JSON.parse(note.contentBody));
      } catch {
        setAiNotesResult(null);
      }
    } else {
      setAiNotesResult(null);
    }
    setNoteModalOpen(true);
  };

  const handleGenerateNotes = async () => {
    setGeneratingNotes(true);
    try {
      const result = await generateTeachingNotesAI(notesGrade, notesSubject, notesTopic, notesLanguage);
      setAiNotesResult(result);
      if (!noteTitle) setNoteTitle(result.title);
    } finally {
      setGeneratingNotes(false);
    }
  };

  const buildNotePayload = () => ({
    lessonPlanId: linkedPlanId || undefined,
    title: noteTitle || aiNotesResult?.title || `${notesTopic || 'Lesson'} Notes`,
    grade: notesGrade,
    subject: notesSubject,
    topic: notesTopic || noteTitle,
    language: notesLanguage,
    contentSummary: aiNotesResult?.introduction.slice(0, 280) ?? noteTitle,
    contentBody: aiNotesResult ? JSON.stringify(aiNotesResult) : undefined,
  });

  const handleSaveDraft = () => {
    const payload = buildNotePayload();
    if (editingNoteId) {
      updateTeachingNote(editingNoteId, payload);
      addNotification('Draft saved', 'Teaching note updated.', 'success');
    } else {
      createTeachingNote(payload);
      addNotification('Draft created', 'Teaching note saved as draft.', 'success');
    }
    setNoteModalOpen(false);
  };

  const handleSubmitForApproval = () => {
    const payload = buildNotePayload();
    if (editingNoteId) {
      updateTeachingNote(editingNoteId, payload);
      submitTeachingNoteForApproval(editingNoteId);
    } else {
      const id = createTeachingNote(payload);
      submitTeachingNoteForApproval(id);
    }
    setNoteModalOpen(false);
    setAiNotesResult(null);
  };

  const handleSubmitLessonPlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!planTitle || !planObjectives) return;
    createLessonPlan({
      title: planTitle,
      grade: planGrade,
      subject: planSubject,
      sessions: planSessions,
      objectives: planObjectives.split('\n').filter(Boolean),
      activities: Array.from({ length: planSessions }).map((_, i) => ({
        session: i + 1,
        activity: `Session ${i + 1} activity`,
        duration: '45 mins',
      })),
      assessments: ['Formative quiz', 'Participation log'],
      homework: planHomework || 'Review workbook exercises.',
    });
    setIsPlanOpen(false);
    setPlanTitle('');
    setPlanObjectives('');
    setPlanHomework('');
  };

  const parsedViewContent = useMemo(() => {
    if (!viewNote?.contentBody) return null;
    try {
      return JSON.parse(viewNote.contentBody) as AITeachingNotesResult;
    } catch {
      return null;
    }
  }, [viewNote]);

  const renderNoteRow = (note: TeachingNote) => (
    <div key={note.id} className={`${aisListRow} flex flex-col justify-between gap-2 sm:flex-row sm:items-center`}>
      <div className="min-w-0">
        <p className={`${aisDataMd} font-semibold`}>{note.title}</p>
        <p className={`${aisBodySm} mt-0.5`}>
          {note.topic} · {note.language} · Updated {note.updatedAt ?? note.createdAt}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <AisStatusBadge variant={noteStatusVariant(note.status)}>{note.status}</AisStatusBadge>
        <AisBtnSecondary className="!px-2.5 !py-1 text-[10px]" onClick={() => setViewNote(note)}>View</AisBtnSecondary>
        <AisBtnSecondary className="!px-2.5 !py-1 text-[10px]" onClick={() => openEditNote(note)}>Edit</AisBtnSecondary>
        {note.status === 'Draft' && (
          <AisBtnPrimary className="!px-2.5 !py-1 text-[10px]" onClick={() => submitTeachingNoteForApproval(note.id)}>
            Submit
          </AisBtnPrimary>
        )}
      </div>
    </div>
  );

  return (
    <AisPage>
      <div className="space-y-4">
        <p className={aisLabelCaps}>Teaching notes by lesson plan</p>
        {teacherPlans.length === 0 ? (
          <p className={aisBodyMd}>Create a lesson plan first, then attach teaching notes to it.</p>
        ) : (
          teacherPlans.map((plan) => {
            const planNotes = notesForLessonPlan(myNotes, plan.id);
            const isOpen = expandedPlanId === plan.id;
            return (
              <div key={plan.id} className={`${aisCard} overflow-hidden`}>
                <div className="flex items-center justify-between gap-3 p-4 transition-colors hover:bg-ais-row-hover">
                  <button
                    type="button"
                    className="min-w-0 flex-1 text-left"
                    onClick={() => setExpandedPlanId(isOpen ? null : plan.id)}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <p className={aisHeadlineSm}>{plan.title}</p>
                      <span className="inline-flex items-center rounded-full bg-ais-primary/10 px-2.5 py-1 text-[11px] font-bold tabular-nums text-ais-primary">
                        {planNotes.length} {planNotes.length === 1 ? 'note' : 'notes'}
                      </span>
                    </div>
                    <p className={`${aisBodySm} mt-1 flex flex-wrap items-center gap-1`}>
                      {plan.grade} · {plan.subject} · {plan.sessions} sessions ·
                      <AisStatusBadge variant={approvalBadgeVariant(plan.status)}>{plan.status}</AisStatusBadge>
                    </p>
                  </button>
                  <div className="flex shrink-0 items-center">
                    <AisBtnPrimary
                      className="!text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        openCreateNote(plan.id);
                      }}
                    >
                      <Plus className="h-3.5 w-3.5" aria-hidden />
                      Add note
                    </AisBtnPrimary>
                  </div>
                </div>
                {isOpen && (
                  <div className="space-y-3 border-t border-ais-card-border px-4 pb-4 pt-3">
                    {planNotes.length === 0 ? (
                      <p className={`${aisBodySm} rounded-lg bg-ais-surface-container-low p-3`}>
                        No teaching notes yet for this lesson plan.
                      </p>
                    ) : (
                      <div className="space-y-2">{planNotes.map(renderNoteRow)}</div>
                    )}
                    <PlanSummary plan={plan} />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {unlinkedNotes.length > 0 && (
        <div className={`${aisCard} p-4`}>
          <div className="mb-3 border-b border-ais-card-border pb-3">
            <h3 className={aisHeadlineSm}>Notes without lesson plan</h3>
            <p className={`${aisBodyMd} mt-0.5`}>Standalone teaching materials not linked to a syllabus plan.</p>
          </div>
          <div className="space-y-2">{unlinkedNotes.map(renderNoteRow)}</div>
        </div>
      )}

      <Dialog
        isOpen={noteModalOpen}
        onClose={() => setNoteModalOpen(false)}
        title={editingNoteId ? 'Edit teaching note' : 'Create teaching note'}
        size="2xl"
        largeTitle
      >
        <div className="space-y-5 overflow-y-auto pt-1">
          <Select variant="ais" label="Link to lesson plan" options={[{ value: '', label: 'No lesson plan (standalone)' }, ...teacherPlans.map((p) => ({ value: p.id, label: `${p.title} (${p.grade})` }))]} value={linkedPlanId} onChange={(e) => {
            setLinkedPlanId(e.target.value);
            const p = teacherPlans.find((x) => x.id === e.target.value);
            if (p) { setNotesGrade(p.grade); setNotesSubject(p.subject); }
          }} />
          {activePlan && (
            <p className={aisCallout}>Linked plan: {activePlan.title} — objectives include {activePlan.objectives[0]}</p>
          )}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1 sm:col-span-2">
              <label className={aisFormLabel}>Note title</label>
              <input className={aisInput} value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} placeholder="e.g. Session 2 handout" />
            </div>
            <Select variant="ais" label="Grade" options={GRADE_OPTIONS.map((g) => ({ value: g, label: g }))} value={notesGrade} onChange={(e) => setNotesGrade(e.target.value)} />
            <Select variant="ais" label="Subject" options={[{ value: 'Biology', label: 'Biology' }, { value: 'General Science', label: 'General Science' }]} value={notesSubject} onChange={(e) => setNotesSubject(e.target.value)} />
            <div className="space-y-1">
              <label className={aisFormLabel}>Topic</label>
              <input className={aisInput} value={notesTopic} onChange={(e) => setNotesTopic(e.target.value)} placeholder="Lesson topic" />
            </div>
            <Select variant="ais" label="Language" options={[{ value: 'English', label: 'English' }, { value: 'Amharic', label: 'Amharic' }, { value: 'Afaan Oromo', label: 'Afaan Oromo' }]} value={notesLanguage} onChange={(e) => setNotesLanguage(e.target.value)} />
          </div>
          <AisBtnPrimary type="button" onClick={handleGenerateNotes} disabled={generatingNotes}>
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            {generatingNotes ? 'Generating…' : 'Generate with AI'}
          </AisBtnPrimary>
          {aiNotesResult && (
            <div className="max-h-56 space-y-3 overflow-y-auto rounded-xl border border-ais-card-border border-l-4 border-l-ais-primary bg-ais-surface-container-low/50 p-4 text-xs">
              <p className="font-bold text-ais-on-surface">{aiNotesResult.title}</p>
              <p className={aisBodyMd}>{aiNotesResult.introduction}</p>
              {aiNotesResult.explanations.slice(0, 2).map((exp, i) => (
                <p key={i}><span className="font-semibold">{exp.subtitle}:</span> {exp.content.slice(0, 120)}…</p>
              ))}
            </div>
          )}
          <DialogFooter className="flex-wrap gap-2 border-t border-ais-card-border pt-4">
            <AisBtnSecondary type="button" onClick={() => setNoteModalOpen(false)}>
              <X className="h-3.5 w-3.5" aria-hidden />
              Cancel
            </AisBtnSecondary>
            <AisBtnSecondary type="button" onClick={handleSaveDraft}>
              <Save className="h-3.5 w-3.5" aria-hidden />
              Save draft
            </AisBtnSecondary>
            <AisBtnPrimary type="button" onClick={handleSubmitForApproval}>
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
            {viewNote.deptComments && <p className={aisCallout}>{viewNote.deptComments}</p>}
            {parsedViewContent ? (
              <>
                <p>{parsedViewContent.introduction}</p>
                {parsedViewContent.explanations.map((exp, i) => (
                  <div key={i} className="rounded-lg bg-ais-surface-container-low p-3">
                    <p className="font-bold text-ais-on-surface">{exp.subtitle}</p>
                    <p className="mt-1">{exp.content}</p>
                  </div>
                ))}
              </>
            ) : (
              <p className={aisBodyMd}>{viewNote.contentSummary}</p>
            )}
            <div className="flex gap-2 pt-2">
              <AisBtnSecondary onClick={() => window.print()}>Print</AisBtnSecondary>
              <AisBtnPrimary onClick={() => { setViewNote(null); openEditNote(viewNote); }}>Edit note</AisBtnPrimary>
            </div>
          </div>
        )}
      </Dialog>

      <Dialog isOpen={isPlanOpen} onClose={() => setIsPlanOpen(false)} title="Create lesson plan" size="lg">
        <form onSubmit={handleSubmitLessonPlan} className="space-y-4 pt-2">
          <input className={aisInput} required placeholder="Plan title" value={planTitle} onChange={(e) => setPlanTitle(e.target.value)} />
          <div className="grid grid-cols-3 gap-3">
            <Select variant="ais" options={GRADE_OPTIONS.filter((g) => g.includes('9') || g.includes('10')).map((g) => ({ value: g, label: g }))} value={planGrade} onChange={(e) => setPlanGrade(e.target.value)} />
            <Select variant="ais" options={[{ value: 'Biology', label: 'Biology' }]} value={planSubject} onChange={(e) => setPlanSubject(e.target.value)} />
            <Select variant="ais" options={['3', '4', '5', '6'].map((n) => ({ value: n, label: `${n} sessions` }))} value={String(planSessions)} onChange={(e) => setPlanSessions(Number(e.target.value))} />
          </div>
          <textarea className={`${aisTextarea} h-24`} required placeholder="Objectives (one per line)" value={planObjectives} onChange={(e) => setPlanObjectives(e.target.value)} />
          <textarea className={`${aisTextarea} h-16`} placeholder="Homework" value={planHomework} onChange={(e) => setPlanHomework(e.target.value)} />
          <DialogFooter className="border-t border-ais-card-border pt-4">
            <AisBtnSecondary type="button" onClick={() => setIsPlanOpen(false)}>Cancel</AisBtnSecondary>
            <AisBtnPrimary type="submit">Submit for dept approval</AisBtnPrimary>
          </DialogFooter>
        </form>
      </Dialog>
    </AisPage>
  );
};

function PlanSummary({ plan }: { plan: LessonPlan }) {
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
