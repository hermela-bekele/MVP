'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { FilePlus, Sparkles } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Select } from '@/components/ui/select';
import { Dialog, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { buildLessonPlanContext, generateAssessmentWithAI, questionLimitsForAssessmentType } from '@/lib/ai';
import { GRADE_OPTIONS, graspOutcomeLabel, normalizeGradeLabel } from '@/lib/teacherPortal';
import {
  filterDeptTeachingNotes,
  resolveDeptHeadScope,
} from '@/lib/departmentHead';
import type { Assessment, GraspOutcome, LessonDelivery, TeachingNote } from '@/lib/mockData';
import { AssessmentContentRenderer } from '@/components/ui/AssessmentContentRenderer';
import {
  AisBtnPrimary,
  AisBtnSecondary,
  aisInput,
} from '@/components/dashboard/teacher/TeacherPortalUi';
import { wrapAssessmentMarkdown } from '@/lib/assessmentMarkdown';

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
  const [topicValue, setTopicValue] = useState('');
  const [numQuestions, setNumQuestions] = useState(
    () => questionLimitsForAssessmentType('Mid Exam').default,
  );
  const [questionFormat, setQuestionFormat] = useState<QuestionFormat>('Mixed');
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
      options.push({
        value: note.id,
        label: `${shortLabel(note.topic, 36)} · ${shortLabel(planTitle, 28)} · ${graspOutcomeLabel(delivery.graspOutcome)}`,
        topic: note.topic,
        note,
        delivery,
        planTitle,
        planContext: plan
          ? buildLessonPlanContext(plan)
          : `Teaching note: ${note.title}\nTopic: ${note.topic}\n${note.contentSummary}`,
        fullLabel,
      });
    }
    return options.sort((a, b) => b.delivery.deliveredAt.localeCompare(a.delivery.deliveredAt));
  }, [scope, teachingNotes, teachers, lessonDeliveries, lessonPlans, grade]);

  const selected = topicOptions.find((o) => o.value === topicValue) ?? null;
  const selectedPlan = selected
    ? lessonPlans.find(
        (p) =>
          p.id === selected.note.lessonPlanId || p.id === selected.delivery.lessonPlanId,
      )
    : undefined;

  useEffect(() => {
    setTopicValue('');
  }, [grade]);

  useEffect(() => {
    if (!topicValue && topicOptions[0]) {
      setTopicValue(topicOptions[0].value);
    } else if (topicValue && !topicOptions.some((o) => o.value === topicValue)) {
      setTopicValue(topicOptions[0]?.value ?? '');
    }
  }, [topicOptions, topicValue]);

  const reset = () => {
    setOpen(false);
    setTitle('');
    setTopicValue('');
    setContent('');
    setType('Mid Exam');
    setNumQuestions(questionLimitsForAssessmentType('Mid Exam').default);
    setQuestionFormat('Mixed');
  };

  const handleGenerate = async () => {
    if (!selected?.topic.trim()) return;
    setGenerating(true);
    try {
      const text = wrapAssessmentMarkdown({
        body: await generateAssessmentWithAI(
          type,
          selected.topic.trim(),
          grade,
          subject,
          difficulty,
          numQuestions,
          questionFormat,
          [
            selected.planContext,
            `Classroom delivery: ${graspOutcomeLabel(selected.delivery.graspOutcome)}`,
            selected.delivery.challengeText
              ? `Teacher challenge note: ${selected.delivery.challengeText}`
              : '',
          ]
            .filter(Boolean)
            .join('\n\n'),
          'differentiated',
        ),
        assessmentType: type,
        questionFormat,
        numQuestions,
        topic: selected.topic.trim(),
        grade,
        subject,
      });
      setContent(text);
      if (!title.trim()) {
        setTitle(`${grade} ${subject} — ${type}: ${selected.topic.trim()}`);
      }
    } catch {
      alert('Failed to generate assessment. Try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content) return;
    createAssessment({
      title: title.trim(),
      type,
      subject,
      grade,
      difficulty,
      createdByRole: 'department-head',
      teacherName: currentUser?.displayName || 'Department Head',
      teacherId: deptTeacherId,
      questions: [
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
            <CardDescription>
              Topics come from approved teaching notes teachers marked as delivered — with the
              linked weekly lesson plan. Published immediately; quizzes stay with teachers.
            </CardDescription>
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
          <input
            className={aisInput}
            placeholder="Assessment title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <Select
            label="Topic (delivered teaching notes)"
            options={
              topicOptions.length
                ? topicOptions.map((o) => ({
                    value: o.value,
                    label: o.label,
                    title: o.fullLabel,
                  }))
                : [
                    {
                      value: '',
                      label: 'No delivered notes for this grade yet',
                    },
                  ]
            }
            value={topicValue}
            onChange={(e) => setTopicValue(e.target.value)}
            disabled={!topicOptions.length}
          />
          {!topicOptions.length ? (
            <p className="text-xs text-muted-foreground">
              Topics appear after teachers get notes approved and mark them delivered (grasped /
              majority / challenged).
            </p>
          ) : selected ? (
            <div className="rounded-xl border border-border/60 bg-muted/20 p-3 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <p
                  className="text-sm font-semibold text-foreground max-w-full truncate"
                  title={selected.topic}
                >
                  {selected.topic}
                </p>
                <Badge variant={graspBadgeVariant(selected.delivery.graspOutcome)} size="sm">
                  {graspOutcomeLabel(selected.delivery.graspOutcome)}
                </Badge>
                <Badge variant="success" size="sm">
                  Delivered
                </Badge>
              </div>
              <p
                className="text-xs text-muted-foreground truncate"
                title={selected.note.title}
              >
                Note: {selected.note.title}
              </p>
              {selectedPlan ? (
                <div className="rounded-lg border border-border/40 bg-card p-3 space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                    Linked weekly lesson plan
                  </p>
                  <p
                    className="text-sm font-semibold truncate"
                    title={selectedPlan.title}
                  >
                    {selectedPlan.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedPlan.grade} · {selectedPlan.subject} · {selectedPlan.sessions}{' '}
                    session{selectedPlan.sessions === 1 ? '' : 's'}
                    {selectedPlan.teacherName ? ` · ${selectedPlan.teacherName}` : ''}
                  </p>
                  {selectedPlan.objectives?.length > 0 && (
                    <ul className="list-disc pl-4 text-xs text-muted-foreground space-y-0.5">
                      {selectedPlan.objectives.slice(0, 3).map((obj) => (
                        <li key={obj}>{obj}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  This note is not linked to a weekly lesson plan.
                </p>
              )}
            </div>
          ) : null}
          <div className="flex justify-end">
            <AisBtnPrimary
              type="button"
              disabled={generating || !selected?.topic.trim()}
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
