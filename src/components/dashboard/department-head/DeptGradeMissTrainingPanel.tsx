'use client';

import React, { useMemo, useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogFooter } from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  buildTeacherSuggestion,
  computeQuestionMissStats,
  extractClassFromMissReport,
  extractTopicFromMissReport,
  highMissQuestions,
  isGradeMissReport,
  GRADE_MISS_THRESHOLD,
  type QuestionMissStat,
} from '@/lib/gradeMissAnalytics';
import { isSubjectTeacher, resolveDeptHeadScope } from '@/lib/departmentHead';

function encodeInlineModule(markdown: string) {
  return `inline-md:${encodeURIComponent(markdown)}`;
}

function decodeInlineModule(url: string): string | null {
  if (!url.startsWith('inline-md:')) return null;
  try {
    return decodeURIComponent(url.slice('inline-md:'.length));
  } catch {
    return null;
  }
}

type GeneratedModule = {
  title: string;
  topic: string;
  subject: string;
  grade: string;
  summary: string;
  markdown: string;
};

export function DeptGradeMissTrainingPanel() {
  const {
    currentUser,
    teachers,
    studentGradeEntries,
    staffMessages,
    addTrainingMaterial,
    disseminateTrainingMaterial,
    addNotification,
    trainingMaterials,
  } = useApp();

  const scope = useMemo(() => resolveDeptHeadScope(currentUser), [currentUser]);
  const deptTeachers = useMemo(
    () => (scope ? teachers.filter((t) => isSubjectTeacher(t, scope)) : []),
    [teachers, scope],
  );
  const deptTeacherIds = useMemo(
    () => new Set(deptTeachers.map((t) => t.id)),
    [deptTeachers],
  );

  const missStats = useMemo(() => {
    const entries = studentGradeEntries.filter((e) => deptTeacherIds.has(e.teacherId));
    return highMissQuestions(computeQuestionMissStats(entries, { minAttempts: 2 }));
  }, [studentGradeEntries, deptTeacherIds]);

  const teacherReports = useMemo(
    () =>
      staffMessages.filter(
        (m) =>
          m.senderRole === 'teacher' &&
          deptTeacherIds.has(m.teacherId) &&
          isGradeMissReport(m.body),
      ),
    [staffMessages, deptTeacherIds],
  );

  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [preview, setPreview] = useState<GeneratedModule | null>(null);
  const [activeTopicLabel, setActiveTopicLabel] = useState('');

  const startGenerate = async (opts: {
    topic: string;
    subject?: string;
    grade?: string;
    missContext: string;
    selectionKey: string;
  }) => {
    setGenerating(true);
    setPreview(null);
    setSelectedKey(opts.selectionKey);
    setActiveTopicLabel(opts.topic);
    try {
      const res = await fetch('/api/ai/training-module', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: opts.topic,
          subject: opts.subject || scope?.subject,
          grade: opts.grade,
          missContext: opts.missContext,
        }),
      });
      if (!res.ok) throw new Error('Generation failed');
      const data = (await res.json()) as GeneratedModule;
      setPreview(data);
    } catch {
      addNotification(
        'Generation failed',
        'Could not generate the training module. Try again.',
        'alert',
      );
      setSelectedKey(null);
    } finally {
      setGenerating(false);
    }
  };

  const generateFromStat = (stat: QuestionMissStat) => {
    void startGenerate({
      topic: stat.topicHint,
      subject: stat.subject,
      grade: stat.gradeLevel,
      selectionKey: stat.key,
      missContext: [
        `Assessment: ${stat.assessmentTitle} (${stat.entryType})`,
        `Class: ${stat.gradeLevel} ${stat.section}`,
        `Q${stat.questionNumber} miss rate ${stat.missRate}% (${stat.missed}/${stat.attempted})`,
        buildTeacherSuggestion([stat]),
      ].join('\n'),
    });
  };

  const generateFromReport = (msgId: string, body: string) => {
    const topic = extractTopicFromMissReport(body);
    if (!topic) {
      addNotification('No topic found', 'Could not read a topic from this report.', 'alert');
      return;
    }
    const meta = extractClassFromMissReport(body);
    void startGenerate({
      topic,
      subject: meta.subject || scope?.subject,
      grade: meta.grade,
      selectionKey: `report:${msgId}`,
      missContext: body,
    });
  };

  const handleSave = () => {
    if (!preview) return;
    addTrainingMaterial({
      title: preview.title,
      resourceUrl: encodeInlineModule(preview.markdown),
      category: 'Subject Specialty',
      trainingType: 'Subject Specialty',
      departmentId: scope?.departmentId,
      grade: preview.grade || undefined,
      subject: preview.subject || scope?.subject,
    });
    addNotification(
      'AI module saved',
      `"${preview.title}" is in Resources — disseminate to share with teachers.`,
      'success',
      '/dashboard/department-head/training',
    );
    setPreview(null);
    setSelectedKey(null);
  };

  const aiModules = useMemo(
    () =>
      trainingMaterials.filter(
        (m) =>
          m.resourceUrl.startsWith('inline-md:') &&
          (!scope?.departmentId ||
            !m.departmentId ||
            m.departmentId === scope.departmentId),
      ),
    [trainingMaterials, scope?.departmentId],
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">
            Grade miss alerts (≥{GRADE_MISS_THRESHOLD}%)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-2">
          {missStats.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No high-miss questions yet. Teachers need to enter quiz/test marks question-by-question.
            </p>
          ) : (
            <ul className="space-y-2">
              {missStats.slice(0, 8).map((stat) => {
                const teacher = deptTeachers.find((t) =>
                  studentGradeEntries.some(
                    (e) =>
                      e.teacherId === t.id &&
                      e.title === stat.assessmentTitle &&
                      e.gradeLevel === stat.gradeLevel,
                  ),
                );
                return (
                  <li
                    key={stat.key}
                    className="flex flex-col gap-2 rounded-xl border border-border/50 p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">
                        Q{stat.questionNumber} · {stat.assessmentTitle}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2">{stat.topicHint}</p>
                      <p className="mt-1 text-xxs text-muted-foreground">
                        {stat.gradeLevel} {stat.section} · {stat.missRate}% miss
                        {teacher ? ` · ${teacher.name}` : ''}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="organic"
                      className="shrink-0 gap-1.5 text-xs"
                      disabled={generating}
                      onClick={() => generateFromStat(stat)}
                    >
                      {generating && selectedKey === stat.key ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="h-3.5 w-3.5" />
                      )}
                      Generate training
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Teacher miss reports</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-2">
          {teacherReports.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No miss-rate reports yet. Teachers use “Report to HoD” in the gradebook.
            </p>
          ) : (
            <ul className="space-y-2">
              {teacherReports.slice(0, 10).map((msg) => {
                const topic = extractTopicFromMissReport(msg.body);
                const teacher = deptTeachers.find((t) => t.id === msg.teacherId);
                return (
                  <li
                    key={msg.id}
                    className="flex flex-col gap-2 rounded-xl border border-border/50 p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{teacher?.name ?? 'Teacher'}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        Topic: {topic ?? 'See message'}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="shrink-0 gap-1.5 text-xs"
                      disabled={generating}
                      onClick={() => generateFromReport(msg.id, msg.body)}
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      Generate from report
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {aiModules.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Generated PD modules</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-2">
            {aiModules.map((m) => (
              <div
                key={m.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/40 px-3 py-2 text-sm"
              >
                <div>
                  <p className="font-semibold">{m.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {[m.grade, m.subject, m.uploadedAt].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={m.disseminated ? 'success' : 'neutral'} size="sm">
                    {m.disseminated ? 'Disseminated' : 'Draft'}
                  </Badge>
                  {!m.disseminated && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs"
                      onClick={() => disseminateTrainingMaterial(m.id)}
                    >
                      Disseminate
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs"
                    onClick={() => {
                      const md = decodeInlineModule(m.resourceUrl);
                      if (md) {
                        setPreview({
                          title: m.title,
                          topic: m.title,
                          subject: m.subject || '',
                          grade: m.grade || '',
                          summary: '',
                          markdown: md,
                        });
                      }
                    }}
                  >
                    View
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Dialog
        isOpen={Boolean(preview) || generating}
        onClose={() => {
          if (generating) return;
          setPreview(null);
        }}
        title={preview?.title ?? 'Generating training module…'}
        size="2xl"
        largeTitle
      >
        {generating && !preview ? (
          <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Building a PD module
            {activeTopicLabel ? ` on “${activeTopicLabel}”` : ''}…
          </div>
        ) : preview ? (
          <div className="space-y-4">
            {preview.summary ? (
              <p className="text-sm text-muted-foreground">{preview.summary}</p>
            ) : null}
            <pre className="max-h-[55vh] overflow-auto whitespace-pre-wrap rounded-lg border border-border/50 bg-muted/30 p-4 text-xs leading-relaxed">
              {preview.markdown}
            </pre>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPreview(null)}>
                Close
              </Button>
              <Button variant="organic" onClick={handleSave}>
                Save to resources
              </Button>
            </DialogFooter>
          </div>
        ) : null}
      </Dialog>
    </div>
  );
}
