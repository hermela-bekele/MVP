'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { ChevronDown, Send, Sparkles } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Select } from '@/components/ui/select';
import {
  buildMissByQuestionPieData,
  computeQuestionMissStats,
  enrichMissStatsFromAssessment,
  extractAssessmentQuestionDetails,
  filterEntriesForAssessment,
  formatGradeMissReport,
  highMissQuestions,
  listAssessmentsWithQuestionResults,
} from '@/lib/gradeMissAnalytics';
import { filterTrainingMaterialsForTeacher } from '@/lib/trainingResources';
import { resolveTeacherProfile } from '@/lib/teacherPortal';
import type { Assessment, StudentGradeEntry } from '@/lib/mockData';
import {
  AisBtnPrimary,
  AisBtnSecondary,
  AisStatusBadge,
} from '@/components/dashboard/teacher/TeacherPortalUi';
import {
  aisBodySm,
  aisCard,
  aisHeadlineSm,
  aisLabelCaps,
} from '@/components/dashboard/teacher/aisStyles';
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';

type Props = {
  classEntries: StudentGradeEntry[];
  assessments: Assessment[];
  /** Used for book resources + optional Report to HoD */
  teacherId: string;
  classGrade: string;
  classSection: string;
  defaultSubject: string;
  /** HoD view: no “Report to HoD”; copy tailored for department coaching */
  viewerRole?: 'teacher' | 'department-head';
};

type MissPieSlice = {
  name: string;
  percent: number;
  fill: string;
  topic?: string;
  value: number;
};

function MissPieTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: MissPieSlice }>;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="min-w-[160px] rounded-xl border border-ais-card-border bg-white px-3.5 py-2.5 shadow-md">
      <p className="text-sm font-bold text-ais-on-surface">{d.name}</p>
      <div className="mt-1.5 flex items-center gap-2 text-xs text-ais-on-surface-variant">
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ background: d.fill }}
          aria-hidden
        />
        <span className="flex-1">Students missed</span>
        <span className="font-bold text-ais-on-surface">{d.percent}%</span>
      </div>
      {d.topic && !/^Question\s+\d+$/i.test(d.topic) && (
        <p className="mt-1 max-w-[200px] truncate text-[10px] text-ais-on-surface-variant" title={d.topic}>
          {d.topic}
        </p>
      )}
    </div>
  );
}

export const GradeGapAnalysisPanel: React.FC<Props> = ({
  classEntries,
  assessments,
  teacherId,
  classGrade,
  classSection,
  defaultSubject,
  viewerRole = 'teacher',
}) => {
  const {
    teachers,
    trainingMaterials,
    teacherResources,
    sendStaffMessage,
    addNotification,
  } = useApp();
  const teacherProfile = resolveTeacherProfile(teachers, teacherId);
  const isHod = viewerRole === 'department-head';

  const assessmentOptions = useMemo(
    () => listAssessmentsWithQuestionResults(classEntries),
    [classEntries],
  );

  const [selectedKey, setSelectedKey] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [analysisReady, setAnalysisReady] = useState(false);
  const [analysisExpanded, setAnalysisExpanded] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [fromCache, setFromCache] = useState(false);
  const [reportingHod, setReportingHod] = useState(false);

  useEffect(() => {
    if (assessmentOptions.length === 0) {
      setSelectedKey('');
      return;
    }
    if (!assessmentOptions.some((o) => o.key === selectedKey)) {
      setSelectedKey(assessmentOptions[0].key);
    }
  }, [assessmentOptions, selectedKey]);

  const selected = useMemo(
    () => assessmentOptions.find((o) => o.key === selectedKey) ?? null,
    [assessmentOptions, selectedKey],
  );

  const scopedEntries = useMemo(() => {
    if (!selected) return [] as StudentGradeEntry[];
    return filterEntriesForAssessment(classEntries, selected);
  }, [classEntries, selected]);

  const linkedAssessment = useMemo(() => {
    if (!selected) return null;
    if (selected.assessmentId) {
      const byId = assessments.find((a) => a.id === selected.assessmentId);
      if (byId) return byId;
    }
    return (
      assessments.find(
        (a) =>
          a.title === selected.title &&
          (a.subject === selected.subject || !selected.subject) &&
          a.grade === classGrade,
      ) ??
      assessments.find((a) => a.title === selected.title) ??
      null
    );
  }, [assessments, selected, classGrade]);

  const linkedQuestionDetails = useMemo(
    () => extractAssessmentQuestionDetails(linkedAssessment),
    [linkedAssessment],
  );

  const missStats = useMemo(() => {
    const raw = computeQuestionMissStats(scopedEntries, { minAttempts: 1 });
    return enrichMissStatsFromAssessment(raw, linkedAssessment);
  }, [scopedEntries, linkedAssessment]);

  const flaggedMisses = useMemo(() => {
    const high = highMissQuestions(missStats);
    const pool = high.length ? high : missStats.filter((s) => s.missed > 0);
    return [...pool]
      .sort((a, b) => b.missed - a.missed || b.missRate - a.missRate)
      .slice(0, 6);
  }, [missStats]);

  const pieData = useMemo(() => {
    const raw = buildMissByQuestionPieData(missStats);
    const total = raw.reduce((s, d) => s + d.value, 0) || 1;
    return raw.map((d) => ({
      ...d,
      percent: Math.round((d.value / total) * 100),
    }));
  }, [missStats]);
  const totalMisses = pieData.reduce((s, d) => s + d.value, 0);

  const bookRefs = useMemo(() => {
    const subject = selected?.subject || defaultSubject;
    const disseminated = filterTrainingMaterialsForTeacher(trainingMaterials).filter((m) => {
      const subOk = !m.subject || m.subject === subject || m.subject.toLowerCase() === 'all';
      const gradeOk =
        !m.grade ||
        m.grade === classGrade ||
        m.grade.toLowerCase() === 'all' ||
        m.grade.includes(classGrade.replace('Grade ', ''));
      return subOk && gradeOk;
    });
    const own = teacherResources.filter(
      (r) =>
        (!teacherId || r.teacherId === teacherId) &&
        (!r.subject || r.subject === subject) &&
        (!r.grade || r.grade === classGrade || r.grade === 'All'),
    );
    const titles = [...disseminated.map((m) => m.title), ...own.map((r) => r.title)].filter(
      Boolean,
    );
    const unique = [...new Set(titles)].slice(0, 6);
    const contextLines = [
      ...disseminated
        .slice(0, 4)
        .map((m) => `${m.title} (${m.category}${m.resourceUrl ? ` · ${m.resourceUrl}` : ''})`),
      ...own.slice(0, 3).map((r) => `${r.title} (${r.type} · ${r.url})`),
    ];
    return { titles: unique, context: contextLines.join('\n') };
  }, [
    trainingMaterials,
    teacherResources,
    teacherId,
    selected?.subject,
    defaultSubject,
    classGrade,
  ]);

  const resetAnalysis = () => {
    setAiAnalysis('');
    setAnalysisReady(false);
    setAnalysisExpanded(true);
    setFromCache(false);
  };

  const runAiAnalysis = async () => {
    if (!selected) return;
    const details = linkedQuestionDetails;
    const blobFallback = details.get(0);
    const sourceStats = flaggedMisses.length ? flaggedMisses : missStats.filter((s) => s.missed > 0);
    const questions = sourceStats.slice(0, 6).map((q) => {
      const d = details.get(q.questionNumber);
      const questionText =
        d?.questionText ||
        q.prompt ||
        (blobFallback
          ? `See linked assessment content for Q${q.questionNumber} (topic: ${d?.topic || q.topicHint}).`
          : '');
      return {
        questionNumber: q.questionNumber,
        topic: d?.topic || q.topicHint,
        missRate: q.missRate,
        missed: q.missed,
        attempted: q.attempted,
        questionText,
        prompt: q.prompt,
        answer: d?.answer,
        options: d?.options,
      };
    });
    if (questions.length === 0) {
      addNotification(
        'Nothing to analyze',
        'No missed questions on this assessment yet.',
        'alert',
      );
      return;
    }
    if (!linkedAssessment) {
      addNotification(
        'Link the assessment',
        'Link the assessment when recording scores so AI can read the real questions.',
        'alert',
      );
    }
    setAiLoading(true);
    resetAnalysis();
    try {
      const res = await fetch('/api/ai/training-module', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'gap-analysis',
          assessmentTitle: selected.title,
          subject: selected.subject || defaultSubject,
          grade: classGrade,
          section: classSection,
          missedQuestions: questions,
          bookTitles: bookRefs.titles,
          bookContext: bookRefs.context,
          linkedQuestions: linkedAssessment?.questions?.map((q) => ({
            id: q.id,
            question: q.question,
            type: q.type,
            answer: q.answer,
            options: q.options,
          })),
        }),
      });
      const data = (await res.json()) as {
        analysis?: string;
        error?: string;
        cached?: boolean;
      };
      if (!res.ok || !data.analysis) {
        throw new Error(data.error || 'Analysis failed');
      }
      setAiAnalysis(data.analysis);
      setAnalysisReady(true);
      setAnalysisExpanded(true);
      setFromCache(Boolean(data.cached));
      if (data.cached) {
        addNotification(
          'Loaded cached analysis',
          'This assessment was already analyzed — showing the saved coaching notes.',
          'info',
        );
      }
    } catch {
      addNotification(
        'AI analysis failed',
        'Could not generate analysis. Check the AI service and try again.',
        'alert',
      );
      setAnalysisReady(false);
      setAiAnalysis('');
    } finally {
      setAiLoading(false);
    }
  };

  const reportMissesToHod = async () => {
    if (!selected || !analysisReady || flaggedMisses.length === 0 || isHod) return;
    setReportingHod(true);
    try {
      const body = formatGradeMissReport({
        teacherName: teacherProfile.name,
        subject: selected.subject || defaultSubject,
        gradeLevel: classGrade,
        section: classSection,
        assessmentTitle: selected.title,
        questions: flaggedMisses.slice(0, 5).map((q) => ({
          questionNumber: q.questionNumber,
          prompt: q.prompt,
          missRate: q.missRate,
          missed: q.missed,
          attempted: q.attempted,
          topicHint: q.topicHint,
        })),
        suggestion: aiAnalysis,
      });
      await sendStaffMessage({
        teacherId,
        body,
        senderRole: 'teacher',
      });
      addNotification(
        'Reported to HoD',
        'Gap analysis for this assessment was sent. Your department head can generate a training module.',
        'success',
        '/dashboard/department-head/training',
      );
    } catch {
      addNotification(
        'Report failed',
        'Could not send miss-rate report to the department head.',
        'alert',
      );
    } finally {
      setReportingHod(false);
    }
  };

  return (
    <div className={`${aisCard} space-y-4 p-4`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className={aisLabelCaps}>Gap analysis</p>
          <h3 className={`${aisHeadlineSm} mt-1`}>AI analysis</h3>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {analysisReady && !isHod && flaggedMisses.length > 0 && (
            <AisBtnSecondary
              type="button"
              className="!text-xs"
              disabled={reportingHod}
              onClick={() => void reportMissesToHod()}
            >
              <Send className="h-3.5 w-3.5" aria-hidden />
              {reportingHod ? 'Reporting…' : 'Report to HoD'}
            </AisBtnSecondary>
          )}
          {analysisReady && (
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-lg border border-ais-card-border px-2.5 py-1.5 text-xs font-semibold text-ais-on-surface hover:bg-ais-surface-container-low"
              aria-expanded={analysisExpanded}
              onClick={() => setAnalysisExpanded((v) => !v)}
            >
              <ChevronDown
                className={`h-4 w-4 transition-transform ${analysisExpanded ? 'rotate-0' : '-rotate-90'}`}
                aria-hidden
              />
              {analysisExpanded ? 'Hide analysis' : 'Show analysis'}
            </button>
          )}
        </div>
      </div>

      {assessmentOptions.length === 0 ? (
        <p className={aisBodySm}>No recorded results for this class yet.</p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <Select
              variant="ais"
              label="Assessment"
              options={assessmentOptions.map((o) => ({
                value: o.key,
                label: `${o.entryType}: ${o.title} · ${o.studentCount} student${
                  o.studentCount === 1 ? '' : 's'
                }`,
              }))}
              value={selectedKey}
              onChange={(e) => {
                setSelectedKey(e.target.value);
                resetAnalysis();
              }}
            />
            <AisBtnPrimary
              type="button"
              className="!text-xs"
              disabled={aiLoading || !selected}
              onClick={() => void runAiAnalysis()}
            >
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              {aiLoading
                ? 'Analyzing…'
                : fromCache
                  ? 'Refresh analysis'
                  : analysisReady
                    ? 'Re-run analysis'
                    : 'AI analysis'}
            </AisBtnPrimary>
          </div>

          {aiLoading && <p className={aisBodySm}>Analyzing…</p>}

          {analysisReady && analysisExpanded && (
            <>
              <div className="grid gap-4 lg:grid-cols-[minmax(260px,320px)_minmax(0,1fr)] lg:items-start">
                <div className="rounded-xl border border-ais-card-border bg-white p-3">
                  {totalMisses === 0 ? (
                    <p className={`${aisBodySm} flex h-[220px] items-center justify-center text-center`}>
                      No misses recorded for this assessment.
                    </p>
                  ) : (
                    <>
                      <div className="mx-auto h-[240px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={pieData}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="46%"
                              innerRadius={58}
                              outerRadius={88}
                              paddingAngle={2}
                              stroke="#fff"
                              strokeWidth={2}
                            >
                              {pieData.map((d) => (
                                <Cell key={d.name} fill={d.fill} />
                              ))}
                            </Pie>
                            <Tooltip
                              content={<MissPieTooltip />}
                              cursor={false}
                            />
                            <Legend
                              verticalAlign="bottom"
                              align="center"
                              iconType="circle"
                              iconSize={8}
                              wrapperStyle={{ fontSize: 11, paddingTop: 4 }}
                              formatter={(value) => (
                                <span className="text-ais-on-surface-variant">{value}</span>
                              )}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </>
                  )}
                </div>

                <div className="space-y-2">
                  <p className={aisLabelCaps}>Most missed questions</p>
                  {flaggedMisses.length === 0 ? (
                    <p className={aisBodySm}>No missed questions on this assessment.</p>
                  ) : (
                    <ul className="space-y-2">
                      {flaggedMisses.map((q) => {
                        const detail = linkedQuestionDetails.get(q.questionNumber);
                        const rawPreview = (detail?.questionText || q.prompt || '').trim();
                        const preview = rawPreview
                          .replace(/^#{1,6}\s+/gm, '')
                          .replace(/\s+/g, ' ')
                          .trim();
                        const topicRaw = (detail?.topic || q.topicHint || '').trim();
                        const topic =
                          topicRaw && !/^Question\s+\d+$/i.test(topicRaw) ? topicRaw : '';
                        const slice = pieData.find((d) => d.questionNumber === q.questionNumber);
                        const studentLabel = `${q.missed} student${q.missed === 1 ? '' : 's'}`;
                        const titleParts = [
                          `Q${q.questionNumber}`,
                          topic || null,
                          preview || null,
                        ].filter(Boolean);
                        return (
                          <li
                            key={q.key}
                            className="flex items-center gap-3 rounded-lg border border-ais-card-border px-3 py-2 text-sm"
                          >
                            <div className="flex min-w-0 flex-1 items-center gap-2">
                              {slice && (
                                <span
                                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                                  style={{ background: slice.fill }}
                                  aria-hidden
                                />
                              )}
                              <div className="min-w-0 flex-1" title={titleParts.join(' — ')}>
                                <p className="truncate font-semibold text-ais-on-surface">
                                  Q{q.questionNumber}
                                  {topic ? ` · ${topic}` : ''}
                                </p>
                                {preview && (
                                  <p className={`${aisBodySm} truncate`}>{preview}</p>
                                )}
                              </div>
                            </div>
                            <AisStatusBadge
                              className="shrink-0 whitespace-nowrap"
                              variant={q.missed >= 3 || q.missRate >= 60 ? 'error' : 'warning'}
                            >
                              {slice
                                ? `${slice.percent}% · ${studentLabel}`
                                : `${q.missRate}% · ${studentLabel}`}
                            </AisStatusBadge>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>

              <div className={`${aisCard} overflow-hidden p-4`}>
                <p className={`${aisLabelCaps} mb-3`}>Analysis</p>
                <MarkdownRenderer
                  content={aiAnalysis}
                  className="prose-headings:mt-4 prose-headings:mb-2 prose-h2:text-base prose-h3:text-sm prose-p:my-2 prose-li:my-0.5 max-w-none text-ais-on-surface"
                />
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};
