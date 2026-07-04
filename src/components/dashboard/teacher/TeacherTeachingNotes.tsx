'use client';

import React, { useState, useEffect, useMemo, useRef, lazy, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, MoreVertical, Plus, Save, Send, Sparkles, X } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Select } from '@/components/ui/select';
import { Dialog, DialogFooter } from '@/components/ui/dialog';
import type { AITeachingNotesResult, AILessonPlanResult } from '@/lib/ai';
import {
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
const TeachingNotesRenderer = lazy(() =>
  import('@/components/ui/TeachingNotesRenderer').then((m) => ({
    default: m.TeachingNotesRenderer,
  })),
);
const LessonPlanRenderer = lazy(() =>
  import('@/components/ui/LessonPlanRenderer').then((m) => ({
    default: m.LessonPlanRenderer,
  })),
);

function RendererLoading() {
  return (
    <div className="flex min-h-[120px] items-center justify-center text-sm text-muted-foreground">
      Loading preview…
    </div>
  );
}

function noteStatusVariant(status: TeachingNote['status']) {
  if (status === 'Draft') return 'neutral' as const;
  return 'success' as const;
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
    createLessonPlan,
    createTeachingNote,
    updateTeachingNote,
    addNotification,
    resolveTeacherId,
  } = useApp();

  const teacherId = resolveTeacherId();
  const teacherPlans = filterTeacherLessonPlans(lessonPlans, teacherId);
  const myNotes = teachingNotes.filter((n) => n.teacherId === teacherId);
  const unlinkedNotes = myNotes.filter((n) => !n.lessonPlanId);

  const [isPlanOpen, setIsPlanOpen] = useState(false);
  const [planTitle, setPlanTitle] = useState('');
  const [planGrade, setPlanGrade] = useState('Grade 11');
  const [planSubject, setPlanSubject] = useState('Mathematics');
  const [planSessions, setPlanSessions] = useState(4);
  const [planObjectives, setPlanObjectives] = useState('');
  const [planHomework, setPlanHomework] = useState('');
  const [planTopic, setPlanTopic] = useState('');
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [aiPlanResult, setAiPlanResult] = useState<AILessonPlanResult | null>(null);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [viewNote, setViewNote] = useState<TeachingNote | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [linkedPlanId, setLinkedPlanId] = useState('');
  const [notesGrade, setNotesGrade] = useState('Grade 11');
  const [notesSubject, setNotesSubject] = useState('Mathematics');
  const [notesTopic, setNotesTopic] = useState('');
  const [notesLanguage, setNotesLanguage] = useState('English');
  const [noteTitle, setNoteTitle] = useState('');
  const [generatingNotes, setGeneratingNotes] = useState(false);
  const [aiNotesResult, setAiNotesResult] = useState<AITeachingNotesResult | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const activePlan = teacherPlans.find((p) => p.id === linkedPlanId);
  const detailPlan = lessonPlanId
    ? teacherPlans.find((p) => p.id === lessonPlanId)
    : undefined;
  const detailPlanNotes = detailPlan
    ? notesForLessonPlan(myNotes, detailPlan.id)
    : [];

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

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!openMenuId) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openMenuId]);

  const openCreateNote = (planId: string) => {
    const plan = teacherPlans.find((p) => p.id === planId);
    setEditingNoteId(null);
    setLinkedPlanId(planId);
    setNotesGrade(plan?.grade ?? 'Grade 11');
    setNotesSubject(plan?.subject ?? 'Mathematics');
    setNotesTopic('');
    setNotesLanguage('English');
    setNoteTitle('');
    setAiNotesResult(null);
    setNoteModalOpen(true);
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
      // Build a prompt for the AI service
      const prompt = `topic: ${notesTopic}\nsubtopic: \ngrade: ${notesGrade}\nsubject: ${notesSubject}\nlanguage: ${notesLanguage}`;
      
      const { aiService } = await import('@/lib/ai');
      const response = await aiService.generateTeachingNotes(prompt);
      
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
      if (!noteTitle) setNoteTitle(result.title || `${notesTopic} Notes`);
    } catch (error) {
      console.error('❌ Failed to generate teaching notes:', error);
      addNotification('Generation Failed', 'Could not generate teaching notes. Please try again.', 'alert');
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
      updateTeachingNote(editingNoteId, { ...payload, status: 'Draft' });
      addNotification('Draft saved', 'Teaching note updated.', 'success');
    } else {
      createTeachingNote(payload, 'Draft');
      addNotification('Draft created', 'Teaching note saved as draft.', 'success');
    }
    setNoteModalOpen(false);
  };

  const handleSaveNote = () => {
    const payload = buildNotePayload();
    if (editingNoteId) {
      updateTeachingNote(editingNoteId, { ...payload, status: 'Saved' });
      addNotification('Note saved', 'Teaching note updated.', 'success');
    } else {
      createTeachingNote(payload, 'Saved');
      addNotification('Note saved', 'Teaching note saved.', 'success');
    }
    setNoteModalOpen(false);
    setAiNotesResult(null);
  };

  const handleGeneratePlan = async () => {
    if (!planTopic) {
      alert('Please enter a topic first');
      return;
    }
    setGeneratingPlan(true);
    try {
      // Build a prompt for the AI service
      const prompt = `topic: ${planTopic}\nduration_minutes: ${planSessions * 45}\ngrade: ${planGrade}\nsubject: ${planSubject}\nsessions: ${planSessions}`;
      
      const { aiService } = await import('@/lib/ai');
      const response = await aiService.generateLessonPlan(prompt);
      
      console.log('📦 Raw lesson plan response:', response);
      
      // Parse the result - handle multiple response formats
      let result: AILessonPlanResult;
      
      if (typeof response.content === 'string') {
        // Check if it's markdown
        if (response.content.includes('#') || response.content.includes('##')) {
          console.log('✅ Detected markdown lesson plan');
          // For markdown, create a minimal structure
          result = {
            title: `Lesson Plan: ${planGrade} ${planSubject} - ${planTopic}`,
            objectives: [],
            activities: [{
              session: 1,
              activity: response.content, // Markdown content
              duration: `${planSessions * 45} mins`
            }],
            assessments: [],
            homework: ''
          };
        } else {
          // Try to parse as JSON
          try {
            result = JSON.parse(response.content);
            console.log('✅ Parsed JSON lesson plan');
          } catch {
            console.log('⚠️ Creating structured format');
            result = {
              title: `Lesson Plan: ${planGrade} ${planSubject} - ${planTopic}`,
              objectives: [],
              activities: [],
              assessments: [],
              homework: ''
            };
          }
        }
      } else if (typeof response.content === 'object') {
        result = response.content as AILessonPlanResult;
        console.log('✅ Response is already structured');
      } else {
        throw new Error('Unexpected response format');
      }
      
      setAiPlanResult(result);
      if (!planTitle) setPlanTitle(result.title || `${planTopic} Lesson Plan`);
      
      if (result.objectives && result.objectives.length > 0) {
        setPlanObjectives(result.objectives.join('\n'));
      }
      if (result.homework) {
        setPlanHomework(result.homework);
      }
    } catch (error) {
      console.error('❌ Failed to generate lesson plan:', error);
      addNotification('Generation Failed', 'Could not generate lesson plan. Please try again.', 'alert');
    } finally {
      setGeneratingPlan(false);
    }
  };

  const handleSubmitLessonPlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!planTitle || (!planObjectives && !aiPlanResult)) return;
    
    const objectives = aiPlanResult 
      ? aiPlanResult.objectives 
      : planObjectives.split('\n').filter(Boolean);
    
    const activities = aiPlanResult 
      ? aiPlanResult.activities 
      : Array.from({ length: planSessions }).map((_, i) => ({
          session: i + 1,
          activity: `Session ${i + 1} activity`,
          duration: '45 mins',
        }));
    
    const assessments = aiPlanResult 
      ? aiPlanResult.assessments 
      : ['Formative quiz', 'Participation log'];
    
    createLessonPlan({
      title: planTitle,
      grade: planGrade,
      subject: planSubject,
      sessions: planSessions,
      objectives,
      activities,
      assessments,
      homework: planHomework || 'Review workbook exercises.',
    });
    
    setIsPlanOpen(false);
    setPlanTitle('');
    setPlanTopic('');
    setPlanObjectives('');
    setPlanHomework('');
    setAiPlanResult(null);
  };

  const parsedViewContent = useMemo(() => {
    if (!viewNote?.contentBody) return null;
    try {
      return JSON.parse(viewNote.contentBody) as AITeachingNotesResult;
    } catch {
      return null;
    }
  }, [viewNote]);

  const renderNoteCard = (note: TeachingNote) => (
    <div key={note.id} className={`${aisCard} relative flex flex-col overflow-hidden`}>
      <div className="flex flex-1 flex-col p-4">
        {/* Status badge + three-dot menu */}
        <div className="mb-2 flex items-start justify-between gap-2">
          <AisStatusBadge variant={noteStatusVariant(note.status)}>{note.status}</AisStatusBadge>
          <div className="relative" ref={openMenuId === note.id ? menuRef : undefined}>
            <button
              type="button"
              aria-label="Note actions"
              className="flex h-7 w-7 items-center justify-center rounded-full text-ais-on-surface-variant transition-colors hover:bg-ais-row-hover"
              onClick={() => setOpenMenuId(openMenuId === note.id ? null : note.id)}
            >
              <MoreVertical className="h-4 w-4" />
            </button>
            {openMenuId === note.id && (
              <div className="absolute right-0 top-8 z-50 min-w-[130px] rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
                <button
                  type="button"
                  className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  onClick={() => { setOpenMenuId(null); setViewNote(note); }}
                >
                  View
                </button>
                <button
                  type="button"
                  className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  onClick={() => { setOpenMenuId(null); openEditNote(note); }}
                >
                  Edit
                </button>
              </div>
            )}
          </div>
        </div>
        <p className={`${aisDataMd} font-semibold line-clamp-2`}>{note.title}</p>
        <p className={`${aisBodySm} mt-1`}>{note.topic}</p>
        <p className={`${aisBodySm} mt-0.5`}>{note.language}</p>
        <p className={`${aisBodySm} mt-1 text-ais-on-surface-variant`}>
          Updated {note.updatedAt ?? note.createdAt}
        </p>
      </div>
    </div>
  );

  const goToLessonPlan = (planId: string) => {
    router.push(`/dashboard/teacher/teaching-notes/${planId}`);
  };

  const goBackToList = () => {
    router.push('/dashboard/teacher');
    window.setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent('teacher-quick-action', { detail: { tab: 'teaching-notes' } }),
      );
    }, 100);
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
        <div className="space-y-4">
          <p className={aisLabelCaps}>Teaching notes by lesson plan</p>
          {teacherPlans.length === 0 ? (
            <p className={aisBodyMd}>Create a lesson plan first, then attach teaching notes to it.</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {teacherPlans.map((plan) => {
                const planNotes = notesForLessonPlan(myNotes, plan.id);
                return (
                  <div
                    key={plan.id}
                    className={`${aisCard} flex min-h-[200px] flex-col overflow-hidden transition-shadow hover:shadow-[0_4px_12px_rgba(15,23,42,0.08)]`}
                  >
                    <button
                      type="button"
                      className="flex flex-1 flex-col p-4 text-left transition-colors hover:bg-ais-row-hover"
                      onClick={() => goToLessonPlan(plan.id)}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <p className={`${aisHeadlineSm} line-clamp-2`}>{plan.title}</p>
                        <span className="inline-flex items-center rounded-full bg-ais-primary/10 px-2.5 py-1 text-[11px] font-bold tabular-nums text-ais-primary">
                          {planNotes.length} {planNotes.length === 1 ? 'note' : 'notes'}
                        </span>
                      </div>
                      <p className={`${aisBodySm} mt-2 flex flex-1 flex-wrap items-start gap-1`}>
                        {plan.grade} · {plan.subject}
                      </p>
                      <p className={`${aisBodySm} mt-1`}>{plan.sessions} sessions</p>
                      <div className="mt-3">
                        <AisStatusBadge variant={approvalBadgeVariant(plan.status)}>
                          {plan.status}
                        </AisStatusBadge>
                      </div>
                    </button>
                    <div className="border-t border-ais-card-border p-3">
                      <AisBtnPrimary
                        className="!w-full !text-xs"
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
                );
              })}
            </div>
          )}
        </div>
      )}

      {!lessonPlanId && unlinkedNotes.length > 0 && (
        <div className={`${aisCard} p-4`}>
          <div className="mb-3 border-b border-ais-card-border pb-3">
            <h3 className={aisHeadlineSm}>Notes without lesson plan</h3>
            <p className={`${aisBodyMd} mt-0.5`}>Standalone teaching materials not linked to a syllabus plan.</p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{unlinkedNotes.map(renderNoteCard)}</div>
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
            <Select variant="ais" label="Subject" options={[{ value: 'Mathematics', label: 'Mathematics' }, { value: 'Biology', label: 'Biology' }, { value: 'General Science', label: 'General Science' }]} value={notesSubject} onChange={(e) => setNotesSubject(e.target.value)} />
            <div className="space-y-1">
              <label className={aisFormLabel}>Topic</label>
              <input className={aisInput} value={notesTopic} onChange={(e) => setNotesTopic(e.target.value)} placeholder="Lesson topic" />
            </div>
            <Select variant="ais" label="Language" options={[{ value: 'English', label: 'English' }, { value: 'Amharic', label: 'Amharic' }, { value: 'Afaan Oromo', label: 'Afaan Oromo' }]} value={notesLanguage} onChange={(e) => setNotesLanguage(e.target.value)} />
          </div>
          <AisBtnPrimary type="button" onClick={handleGenerateNotes} disabled={generatingNotes || !notesTopic}>
            <Sparkles className="h-3.5 w-3.5 animate-pulse" aria-hidden />
            {generatingNotes ? 'Generating with AI...' : 'Generate with AI'}
          </AisBtnPrimary>
          {aiNotesResult && (
            <div className="space-y-3 max-h-[400px] overflow-y-auto rounded-xl border border-ais-card-border bg-ais-surface-container-low/40 p-4">
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-ais-card-border">
                <label className="text-xs font-semibold text-ais-on-surface flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  AI Generated Teaching Notes Preview
                </label>
                <button
                  type="button"
                  onClick={() => setAiNotesResult(null)}
                  className="text-xs text-ais-error hover:underline flex items-center gap-1"
                >
                  <X className="h-3 w-3" />
                  Clear & Regenerate
                </button>
              </div>
              <Suspense fallback={<RendererLoading />}>
                <TeachingNotesRenderer content={aiNotesResult} />
              </Suspense>
            </div>
          )}
          <DialogFooter className="flex-wrap gap-3 pt-4 -mb-1">
            <AisBtnSecondary type="button" onClick={() => setNoteModalOpen(false)}>
              <X className="h-3.5 w-3.5" aria-hidden />
              Cancel
            </AisBtnSecondary>
            <AisBtnSecondary type="button" onClick={handleSaveDraft}>
              <Save className="h-3.5 w-3.5" aria-hidden />
              Save draft
            </AisBtnSecondary>
            <button
              type="button"
              onClick={handleSaveNote}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#1d4ed8] px-6 py-2 text-sm font-semibold text-white transition-all hover:bg-[#1e40af] shadow-md hover:shadow-lg"
            >
              <Save className="h-4 w-4" aria-hidden />
              Save note
            </button>
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
            <div className="flex gap-2 pt-2">
              <AisBtnSecondary onClick={() => window.print()}>Print</AisBtnSecondary>
              <AisBtnPrimary onClick={() => { setViewNote(null); openEditNote(viewNote); }}>Edit note</AisBtnPrimary>
            </div>
          </div>
        )}
      </Dialog>

      <Dialog isOpen={isPlanOpen} onClose={() => {
        setIsPlanOpen(false);
        setAiPlanResult(null);
        setPlanTopic('');
      }} title="Create lesson plan" size="xl">
        <form onSubmit={handleSubmitLessonPlan} className="space-y-4 pt-2">
          <div className="space-y-2">
            <label className={aisFormLabel}>Topic</label>
            <input 
              className={aisInput} 
              required 
              placeholder="e.g., Cell Division, Linear Equations" 
              value={planTopic} 
              onChange={(e) => setPlanTopic(e.target.value)} 
            />
          </div>
          
          <div className="space-y-2">
            <label className={aisFormLabel}>Plan Title</label>
            <input 
              className={aisInput} 
              required 
              placeholder="Plan title" 
              value={planTitle} 
              onChange={(e) => setPlanTitle(e.target.value)} 
            />
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            <Select variant="ais" label="Grade" options={GRADE_OPTIONS.filter((g) => g.includes('9') || g.includes('10') || g.includes('11') || g.includes('12')).map((g) => ({ value: g, label: g }))} value={planGrade} onChange={(e) => setPlanGrade(e.target.value)} />
            <Select variant="ais" label="Subject" options={[{ value: 'Mathematics', label: 'Mathematics' }, { value: 'Biology', label: 'Biology' }]} value={planSubject} onChange={(e) => setPlanSubject(e.target.value)} />
            <Select variant="ais" label="Sessions" options={['3', '4', '5', '6'].map((n) => ({ value: n, label: `${n} sessions` }))} value={String(planSessions)} onChange={(e) => setPlanSessions(Number(e.target.value))} />
          </div>
          
          <div className="flex justify-center pt-2">
            <button
              type="button"
              onClick={handleGeneratePlan}
              disabled={generatingPlan || !planTopic}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#1d4ed8] px-6 py-2 text-sm font-semibold text-white transition-all hover:bg-[#1e40af] shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Sparkles className="h-4 w-4 animate-pulse" />
              {generatingPlan ? 'Generating with AI...' : 'Generate with AI'}
            </button>
          </div>
          
          {aiPlanResult && (
            <div className="space-y-3 max-h-[400px] overflow-y-auto rounded-xl border border-ais-card-border bg-ais-surface-container-low/40 p-4">
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-ais-card-border">
                <label className="text-xs font-semibold text-ais-on-surface flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  AI Generated Lesson Plan Preview
                </label>
                <button
                  type="button"
                  onClick={() => setAiPlanResult(null)}
                  className="text-xs text-ais-error hover:underline flex items-center gap-1"
                >
                  <X className="h-3 w-3" />
                  Clear & Regenerate
                </button>
              </div>
              <Suspense fallback={<RendererLoading />}>
                <LessonPlanRenderer content={aiPlanResult} />
              </Suspense>
            </div>
          )}
          
          {!aiPlanResult && (
            <>
              <textarea className={`${aisTextarea} h-24`} required={!aiPlanResult} placeholder="Objectives (one per line)" value={planObjectives} onChange={(e) => setPlanObjectives(e.target.value)} />
              <textarea className={`${aisTextarea} h-16`} placeholder="Homework" value={planHomework} onChange={(e) => setPlanHomework(e.target.value)} />
            </>
          )}
          
          <DialogFooter className="pt-4 -mb-1">
            <AisBtnSecondary
              type="button"
              onClick={() => {
                setIsPlanOpen(false);
                setAiPlanResult(null);
                setPlanTopic('');
              }}
            >
              Cancel
            </AisBtnSecondary>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#1d4ed8] px-6 py-2 text-sm font-semibold text-white transition-all hover:bg-[#1e40af] shadow-md hover:shadow-lg"
            >
              Submit for dept approval
            </button>
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
