'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { FilePlus, Sparkles } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Select } from '@/components/ui/select';
import { Dialog, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { buildLessonPlanContext, generateAssessmentWithAI, questionLimitsForAssessmentType, getWeeklyPlanSessionTopicOptions, parseWeeklyPlanDetail } from '@/lib/ai';
import { GRADE_OPTIONS, graspOutcomeLabel, normalizeGradeLabel } from '@/lib/teacherPortal';
import {
  filterDeptTeachingNotes,
  resolveDeptHeadScope,
} from '@/lib/departmentHead';
import type { Assessment, GraspOutcome, LessonDelivery, LessonPlan, TeachingNote } from '@/lib/mockData';
import { AssessmentContentRenderer } from '@/components/ui/AssessmentContentRenderer';
import {
  AisBtnPrimary,
  AisBtnSecondary,
  aisInput,
} from '@/components/dashboard/teacher/TeacherPortalUi';
import { parseAssessmentQuestions, wrapAssessmentMarkdown } from '@/lib/assessmentMarkdown';

const EXAM_TYPES: Assessment['type'][] = ['Mid Exam', 'Final Exam', 'Assignment', 'Practical'];

const QUESTION_FORMAT_OPTIONS = [
  'Multiple Choice',
  'Writing',
  'Fill the Blank',
  'Matching',
  'True/False',
  'Mixed',
] as const;

type QuestionFormat = (typeof QUESTION_FORMAT_OPTIONS)[number];

type DeliveredTopicOption = {
  value: string;
  label: string;
  fullLabel: string;
  topic: string;
  note: TeachingNote;
  delivery: LessonDelivery;
  planTitle: string;
  planContext: string;
  planId?: string;
  sessions?: {
    sessionNumber: number;
    topic: string;
    subtopic: string;
    label: string;
    context: string;
  }[];
};

function shortLabel(text: string, max = 42) {
  const t = text.replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

function graspBadgeVariant(outcome: GraspOutcome): 'success' | 'warning' | 'neutral' {
  if (outcome === 'well_grasped') return 'success';
  if (outcome === 'majority_grasped') return 'neutral';
  return 'warning';
}

/** HoD creates department exams from topics teachers marked as delivered. */
export function DeptAssessmentCreatePanel() {
  const {
    createAssessment,
    currentUser,
    teachers,
    lessonPlans,
    teachingNotes,
    lessonDeliveries,
    addNotification,
  } = useApp();
  const scope = useMemo(() => resolveDeptHeadScope(currentUser), [currentUser]);

  const deptTeacherId = useMemo(() => {
    const active = teachers.filter(
      (t) =>
        t.status === 'Active' &&
        scope &&
        (t.departmentId === scope.departmentId ||
          t.subjects.some((s) => s.toLowerCase().includes((scope.subject || '').toLowerCase()))),
    );
    return active[0]?.id;
  }, [teachers, scope]);

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<Assessment['type']>('Mid Exam');
  const [grade, setGrade] = useState('Grade 11');
  const [difficulty, setDifficulty] = useState<Assessment['difficulty']>('Medium');
  const [topicValues, setTopicValues] = useState<string[]>([]);
  const [selectAllSessions, setSelectAllSessions] = useState(false);
  const [selectedSessionsByPlan, setSelectedSessionsByPlan] = useState<Record<string, number[]>>({});
  const [numQuestions, setNumQuestions] = useState(
    () => questionLimitsForAssessmentType('Mid Exam').default,
  );
  const [questionFormat, setQuestionFormat] = useState<QuestionFormat>('Mixed');
  const [useMlcMix, setUseMlcMix] = useState(false);
  const [mlcPercent, setMlcPercent] = useState(70);
  const [generating, setGenerating] = useState(false);
  const [content, setContent] = useState('');

  const questionLimits = questionLimitsForAssessmentType(type);
  const subject = scope?.subject || 'Mathematics';

  const topicOptions = useMemo((): DeliveredTopicOption[] => {
    if (!scope) return [];
    const notes = filterDeptTeachingNotes(teachingNotes, teachers, scope).filter(
      (n) =>
        normalizeGradeLabel(n.grade) === normalizeGradeLabel(grade) &&
        (n.status === 'Approved' ||
          lessonDeliveries.some((d) => d.teachingNoteId === n.id)),
    );
    const options: DeliveredTopicOption[] = [];
    for (const note of notes) {
      const delivery = lessonDeliveries.find((d) => d.teachingNoteId === note.id);
      if (!delivery) continue;
      const plan =
        (note.lessonPlanId && lessonPlans.find((p) => p.id === note.lessonPlanId)) ||
        (delivery.lessonPlanId && lessonPlans.find((p) => p.id === delivery.lessonPlanId)) ||
        undefined;
      const planTitle = plan?.title || 'No linked weekly plan';
      const teacher = teachers.find((t) => t.id === note.teacherId);
      const fullLabel = `${note.topic} · ${planTitle} · ${graspOutcomeLabel(delivery.graspOutcome)}${
        teacher ? ` · ${teacher.name}` : ''
      }`;
      
      // Extract sessions from the lesson plan if available
      let sessions: DeliveredTopicOption['sessions'] = undefined;
      if (plan) {
        const sessionOptions = getWeeklyPlanSessionTopicOptions(plan);
        const weeklyPlan = parseWeeklyPlanDetail(plan);
        if (weeklyPlan?.sessions) {
          sessions = weeklyPlan.sessions.map((s) => ({
            sessionNumber: s.sessionNumber,
            topic: s.subTopic || s.mainTopic || plan.title,
            subtopic: s.textbookPages || '',
            label: `Session ${s.sessionNumber}: ${s.subTopic || s.mainTopic}${
              s.textbookPages ? ` (${s.textbookPages})` : ''
            }`,
            context: sessionOptions.find((opt) => opt.value === String(s.sessionNumber))?.context || '',
          }));
        }
      }
      
      options.push({
        value: note.id,
        label: `${shortLabel(note.topic, 36)} · ${shortLabel(planTitle, 28)} · ${graspOutcomeLabel(delivery.graspOutcome)}`,
        topic: note.topic,
        note,
        delivery,
        planTitle,
        planId: plan?.id,
        sessions,
        planContext: plan
          ? buildLessonPlanContext(plan)
          : `Teaching note: ${note.title}\nTopic: ${note.topic}\n${note.contentSummary}`,
        fullLabel,
      });
    }
    return options.sort((a, b) => b.delivery.deliveredAt.localeCompare(a.delivery.deliveredAt));
  }, [scope, teachingNotes, teachers, lessonDeliveries, lessonPlans, grade]);

  const selectedTopics = topicOptions.filter((o) => topicValues.includes(o.value));
  const selectedPlans = useMemo(() => {
    const planIds = new Set(
      selectedTopics
        .map((t) => t.note.lessonPlanId || t.delivery.lessonPlanId)
        .filter(Boolean)
    );
    return Array.from(planIds)
      .map((id) => lessonPlans.find((p) => p.id === id))
      .filter(Boolean) as LessonPlan[];
  }, [selectedTopics, lessonPlans]);

  useEffect(() => {
    setTopicValues([]);
    setSelectAllSessions(false);
    setSelectedSessionsByPlan({});
  }, [grade]);

  useEffect(() => {
    if (!topicValues.length && topicOptions[0]) {
      setTopicValues([topicOptions[0].value]);
    } else if (topicValues.length && !topicValues.every((v) => topicOptions.some((o) => o.value === v))) {
      setTopicValues(topicOptions.length ? [topicOptions[0]?.value ?? ''] : []);
    }
  }, [topicOptions, topicValues]);

  const reset = () => {
    setOpen(false);
    setTitle('');
    setTopicValues([]);
    setSelectAllSessions(false);
    setSelectedSessionsByPlan({});
    setContent('');
    setType('Mid Exam');
    setNumQuestions(questionLimitsForAssessmentType('Mid Exam').default);
    setQuestionFormat('Mixed');
    setUseMlcMix(false);
    setMlcPercent(70);
  };

  const handleGenerate = async () => {
    if (!selectedTopics.length) return;
    setGenerating(true);
    try {
      // Build context from selected topics and their specific sessions if any
      const combinedParts: string[] = [];
      
      for (const topic of selectedTopics) {
        const planId = topic.planId;
        const selectedSessions = planId ? selectedSessionsByPlan[planId] : undefined;
        
        if (selectedSessions && selectedSessions.length > 0 && topic.sessions) {
          // Use specific sessions from this plan
          for (const sessionNum of selectedSessions) {
            const session = topic.sessions.find((s) => s.sessionNumber === sessionNum);
            if (session) {
              combinedParts.push(`${session.topic} (${session.label})`);
            }
          }
        } else {
          // Use the whole topic
          combinedParts.push(topic.topic);
        }
      }
      
      const combinedTopic = combinedParts.join('; ');
      const combinedContext = selectedTopics
        .map((t) => {
          const planId = t.planId;
          const selectedSessions = planId ? selectedSessionsByPlan[planId] : undefined;
          
          const contextParts = [
            `Classroom delivery: ${graspOutcomeLabel(t.delivery.graspOutcome)}`,
            t.delivery.challengeText ? `Teacher challenge note: ${t.delivery.challengeText}` : '',
          ];
          
          // Add session-specific context if sessions are selected
          if (selectedSessions && selectedSessions.length > 0 && t.sessions) {
            contextParts.unshift('Selected sessions:');
            for (const sessionNum of selectedSessions) {
              const session = t.sessions.find((s) => s.sessionNumber === sessionNum);
              if (session?.context) {
                contextParts.push(session.context);
              }
            }
          } else {
            // Use the general plan context
            contextParts.unshift(t.planContext);
          }
          
          return contextParts.filter(Boolean).join('\n\n');
        })
        .join('\n\n---\n\n');
      
      const text = wrapAssessmentMarkdown({
        body: await generateAssessmentWithAI(
          type,
          combinedTopic.trim(),
          grade,
          subject,
          difficulty,
          numQuestions,
          questionFormat,
          combinedContext,
          'differentiated',
          useMlcMix ? mlcPercent : undefined,
        ),
        assessmentType: type,
        questionFormat,
        numQuestions,
        topic: combinedTopic.trim(),
        grade,
        subject,
      });
      setContent(text);
      if (!title.trim()) {
        const sessionCount = Object.values(selectedSessionsByPlan).reduce((sum, sessions) => sum + sessions.length, 0);
        const totalSessions = sessionCount > 0 ? sessionCount : selectedTopics.length;
        setTitle(`${grade} ${subject} — ${type}: ${totalSessions === 1 ? selectedTopics[0].topic : `${totalSessions} sessions`}`);
      }
    } catch {
      addNotification('Assessment Generation Failed', 'Could not generate the assessment — try again.', 'alert');
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content) return;
    const parsedQuestions = parseAssessmentQuestions(content);
    createAssessment({
      title: title.trim(),
      type,
      subject,
      grade,
      difficulty,
      createdByRole: 'department-head',
      teacherName: currentUser?.displayName || 'Department Head',
      teacherId: deptTeacherId,
      questions:
        parsedQuestions && parsedQuestions.length > 0
          ? parsedQuestions
          : [
              {
                id: 1,
                question: content,
                type: questionFormat,
                answer: 'See assessment content',
              },
            ],
    });
    reset();
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div>
            <CardTitle className="text-sm font-semibold">Generate department exams</CardTitle>
          </div>
          <Button
            type="button"
            variant="organic"
            size="sm"
            className="shrink-0 gap-1.5 border-none text-xs"
            onClick={() => setOpen(true)}
          >
            <FilePlus className="h-3.5 w-3.5" />
            New exam
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            Subject scope: <strong>{subject}</strong>
            {topicOptions.length > 0
              ? ` · ${topicOptions.length} delivered topic${topicOptions.length === 1 ? '' : 's'} for ${grade}`
              : ''}
          </p>
        </CardContent>
      </Card>

      <Dialog
        isOpen={open}
        onClose={reset}
        title="Generate department assessment"
        size="xl"
      >
        <form onSubmit={handleSave} className="space-y-4 text-left">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Select
              label="Type"
              options={EXAM_TYPES.map((t) => ({ value: t, label: t }))}
              value={type}
              onChange={(e) => {
                const next = e.target.value as Assessment['type'];
                setType(next);
                setNumQuestions(questionLimitsForAssessmentType(next).default);
              }}
            />
            <Select
              label="Grade"
              options={GRADE_OPTIONS.map((g) => ({ value: g, label: g }))}
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
            />
            <Select
              label="Difficulty"
              options={['Easy', 'Medium', 'Hard'].map((d) => ({ value: d, label: d }))}
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as Assessment['difficulty'])}
            />
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold uppercase text-muted-foreground">
                Questions ({questionLimits.min}–{questionLimits.max})
              </label>
              <input
                type="number"
                min={questionLimits.min}
                max={questionLimits.max}
                className={aisInput}
                value={numQuestions}
                onChange={(e) =>
                  setNumQuestions(
                    Math.min(
                      questionLimits.max,
                      Math.max(
                        questionLimits.min,
                        Number(e.target.value) || questionLimits.default,
                      ),
                    ),
                  )
                }
              />
            </div>
            <Select
              label="Question format"
              options={QUESTION_FORMAT_OPTIONS.map((f) => ({ value: f, label: f }))}
              value={questionFormat}
              onChange={(e) => setQuestionFormat(e.target.value as QuestionFormat)}
            />
          </div>
          <div className="space-y-2 rounded-lg border border-border/60 p-3">
            <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-foreground">
              <input
                type="checkbox"
                checked={useMlcMix}
                onChange={(e) => setUseMlcMix(e.target.checked)}
                className="rounded border-input text-primary focus:ring-ring"
              />
              Set MLC vs. advanced mix
            </label>
            {useMlcMix && (
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={mlcPercent}
                  onChange={(e) => setMlcPercent(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="w-40 shrink-0 text-xs text-muted-foreground">
                  {mlcPercent}% MLC (minimum competency) · {100 - mlcPercent}% advanced
                </span>
              </div>
            )}
            <p className="text-[11px] text-muted-foreground">
              Leave off to generate questions across the full range as before. Turn on to control
              how many questions are grounded in the official minimum competencies vs. advanced content.
            </p>
          </div>
          <input
            className={aisInput}
            placeholder="Assessment title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase text-muted-foreground">
                Topics (delivered teaching notes)
              </label>
              {topicOptions.length > 1 && (
                <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectAllSessions}
                    onChange={(e) => {
                      setSelectAllSessions(e.target.checked);
                      setTopicValues(e.target.checked ? topicOptions.map((o) => o.value) : []);
                    }}
                    className="rounded border-input text-primary focus:ring-ring"
                  />
                  Select all ({topicOptions.length})
                </label>
              )}
            </div>
            <div className="max-h-48 overflow-y-auto space-y-2 rounded-lg border border-border/60 bg-muted/10 p-3">
              {!topicOptions.length ? (
                <p className="text-xs text-muted-foreground">
                  No delivered notes for this grade yet
                </p>
              ) : (
                topicOptions.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-start gap-2 cursor-pointer hover:bg-muted/30 rounded px-2 py-1"
                  >
                    <input
                      type="checkbox"
                      checked={topicValues.includes(option.value)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setTopicValues([...topicValues, option.value]);
                        } else {
                          setTopicValues(topicValues.filter((v) => v !== option.value));
                          setSelectAllSessions(false);
                        }
                      }}
                      className="mt-0.5 rounded border-input text-primary focus:ring-ring"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" title={option.topic}>
                        {option.topic}
                      </p>
                      <p className="text-xs text-muted-foreground truncate" title={option.fullLabel}>
                        {option.planTitle} · {graspOutcomeLabel(option.delivery.graspOutcome)}
                      </p>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>
          {!topicOptions.length ? (
            <p className="text-xs text-muted-foreground">
              Topics appear after teachers get notes approved and mark them delivered (grasped /
              majority / challenged).
            </p>
          ) : selectedTopics.length > 0 ? (
            <div className="rounded-xl border border-border/60 bg-muted/20 p-3 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-foreground">
                  {selectedTopics.length} session{selectedTopics.length === 1 ? '' : 's'} selected
                </p>
                {selectedTopics.map((topic) => (
                  <Badge key={topic.value} variant={graspBadgeVariant(topic.delivery.graspOutcome)} size="sm">
                    {graspOutcomeLabel(topic.delivery.graspOutcome)}
                  </Badge>
                ))}
                <Badge variant="success" size="sm">
                  Delivered
                </Badge>
              </div>
              {selectedPlans.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                    Linked weekly lesson plan{selectedPlans.length === 1 ? '' : 's'}
                  </p>
                  {selectedPlans.map((plan) => {
                    const topicWithPlan = selectedTopics.find((t) => t.planId === plan.id);
                    const sessions = topicWithPlan?.sessions || [];
                    const selectedSessions = selectedSessionsByPlan[plan.id] || [];
                    
                    return (
                      <div key={plan.id} className="rounded-lg border border-border/40 bg-card p-3 space-y-2">
                        <div>
                          <p className="text-sm font-semibold truncate" title={plan.title}>
                            {plan.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {plan.grade} · {plan.subject} · {plan.sessions} session{plan.sessions === 1 ? '' : 's'}
                            {plan.teacherName ? ` · ${plan.teacherName}` : ''}
                          </p>
                        </div>
                        
                        {sessions.length > 0 && (
                          <div className="space-y-1 pt-2 border-t border-border/30">
                            <div className="flex items-center justify-between">
                              <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                                Select Sessions ({sessions.length} available)
                              </p>
                              <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={selectedSessions.length === sessions.length}
                                  onChange={(e) => {
                                    setSelectedSessionsByPlan((prev) => ({
                                      ...prev,
                                      [plan.id]: e.target.checked
                                        ? sessions.map((s) => s.sessionNumber)
                                        : [],
                                    }));
                                  }}
                                  className="rounded border-input text-primary focus:ring-ring"
                                />
                                All
                              </label>
                            </div>
                            <div className="space-y-1 max-h-32 overflow-y-auto">
                              {sessions.map((session) => (
                                <label
                                  key={session.sessionNumber}
                                  className="flex items-start gap-2 cursor-pointer hover:bg-muted/20 rounded px-2 py-1 text-xs"
                                >
                                  <input
                                    type="checkbox"
                                    checked={selectedSessions.includes(session.sessionNumber)}
                                    onChange={(e) => {
                                      setSelectedSessionsByPlan((prev) => {
                                        const current = prev[plan.id] || [];
                                        return {
                                          ...prev,
                                          [plan.id]: e.target.checked
                                            ? [...current, session.sessionNumber]
                                            : current.filter((n) => n !== session.sessionNumber),
                                        };
                                      });
                                    }}
                                    className="mt-0.5 rounded border-input text-primary focus:ring-ring"
                                  />
                                  <span className="flex-1">{session.label}</span>
                                </label>
                              ))}
                            </div>
                            <p className="text-xs text-muted-foreground pt-1">
                              {selectedSessions.length === 0
                                ? 'All sessions will be included'
                                : `${selectedSessions.length} session${selectedSessions.length === 1 ? '' : 's'} selected`}
                            </p>
                          </div>
                        )}
                        
                        {plan.objectives?.length > 0 && (
                          <div className="pt-2 border-t border-border/30">
                            <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-1">
                              Plan Objectives
                            </p>
                            <ul className="list-disc pl-4 text-xs text-muted-foreground space-y-0.5">
                              {plan.objectives.slice(0, 2).map((obj) => (
                                <li key={obj}>{obj}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : null}
          <div className="flex justify-end">
            <AisBtnPrimary
              type="button"
              disabled={generating || selectedTopics.length === 0}
              onClick={() => void handleGenerate()}
            >
              <Sparkles className="h-3.5 w-3.5" />
              {generating ? 'Generating…' : 'Generate with AI'}
            </AisBtnPrimary>
          </div>
          {content && (
            <div className="max-h-[28rem] overflow-y-auto rounded-xl border border-border/50 p-4">
              <AssessmentContentRenderer
                content={content}
                categoryLabel={`${type} · ${questionFormat}`}
              />
            </div>
          )}
          <DialogFooter>
            <AisBtnSecondary type="button" onClick={reset}>
              Cancel
            </AisBtnSecondary>
            <AisBtnPrimary type="submit" disabled={!title.trim() || !content}>
              Publish to teachers
            </AisBtnPrimary>
          </DialogFooter>
        </form>
      </Dialog>
    </>
  );
}
