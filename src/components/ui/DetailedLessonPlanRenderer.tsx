'use client';

import React from 'react';
import type { AIDetailedLessonPlanResult } from '@/lib/ai';
import type { AnnualLessonPlanResult } from '@/lib/annualLessonPlan';
import { MarkdownRenderer } from './MarkdownRenderer';
import { AnnualLessonPlanTable } from './AnnualLessonPlanTable';
import { WeeklyLessonPlanTable } from './WeeklyLessonPlanTable';

interface DetailedLessonPlanRendererProps {
  content: AIDetailedLessonPlanResult | string;
  className?: string;
}

function asAnnualTablePlan(content: AIDetailedLessonPlanResult): AnnualLessonPlanResult | null {
  if (content.type !== 'yearly' || !content.weeks?.length) return null;
  const meta = content.meta ?? {};
  return {
    type: 'yearly',
    subject: content.subject,
    mainTopic: content.mainTopic,
    subTopic: content.subTopic,
    prerequisiteKnowledge: content.prerequisiteKnowledge,
    rationale: content.rationale,
    objectives: content.objectives ?? [],
    sources: content.sources,
    meta: {
      academicYear: meta.academicYear || '',
      schoolName: meta.schoolName || '',
      teacherName: meta.teacherName || '',
      grade: meta.grade || '',
      subject: meta.subject || content.subject,
      schoolDaysPerYear: meta.schoolDaysPerYear ?? 0,
      periodsPerWeek: meta.periodsPerWeek ?? 0,
      periodsPerYear: meta.periodsPerYear ?? 0,
      referenceMaterials: meta.referenceMaterials || 'TEXT BOOK',
      generalObjectives: meta.generalObjectives?.length
        ? meta.generalObjectives
        : content.objectives ?? [],
    },
    weeks: content.weeks,
  };
}

export const DetailedLessonPlanRenderer: React.FC<DetailedLessonPlanRendererProps> = ({ 
  content, 
  className = '' 
}) => {
  // If content is a string (markdown), render it directly
  if (typeof content === 'string') {
    return (
      <div className={`detailed-lesson-plan-markdown ${className}`}>
        <MarkdownRenderer content={content} />
      </div>
    );
  }

  // Validate content structure
  if (!content) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <p className="text-sm text-red-600 dark:text-red-400">No content to display</p>
      </div>
    );
  }

  const annualTable = asAnnualTablePlan(content);
  if (annualTable) {
    return (
      <div className={className}>
        <AnnualLessonPlanTable plan={annualTable} />
      </div>
    );
  }

  if (content.type === 'weekly' && content.sessions && content.sessions.length > 0) {
    return (
      <div className={`space-y-4 ${className}`}>
        {content.sources && content.sources.length > 0 ? (
          <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 p-4 border border-blue-200 dark:border-blue-800">
            <h3 className="text-sm font-bold text-blue-900 dark:text-blue-300 mb-2">
              Textbook References
            </h3>
            <div className="flex flex-wrap gap-2">
              {content.sources.map((src, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-800/40 text-xs text-blue-800 dark:text-blue-200"
                >
                  {src.page != null ? `Page ${src.page}` : 'Page ?'}
                  {src.topic ? ` · ${src.topic.replace(/_/g, ' ')}` : ''}
                </span>
              ))}
            </div>
          </div>
        ) : null}
        {(content.prerequisiteKnowledge || content.rationale || content.objectives?.length) && (
          <div className="grid gap-3 md:grid-cols-2 text-sm">
            {content.prerequisiteKnowledge ? (
              <div className="border border-foreground/20 rounded-lg p-3">
                <p className="font-semibold mb-1">Prerequisite knowledge</p>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  {content.prerequisiteKnowledge}
                </p>
              </div>
            ) : null}
            {content.rationale ? (
              <div className="border border-foreground/20 rounded-lg p-3">
                <p className="font-semibold mb-1">Rationale</p>
                <p className="text-muted-foreground text-xs leading-relaxed">{content.rationale}</p>
              </div>
            ) : null}
            {content.objectives?.length ? (
              <div className="border border-foreground/20 rounded-lg p-3 md:col-span-2">
                <p className="font-semibold mb-1">General objectives</p>
                <ul className="list-disc pl-5 text-xs text-muted-foreground space-y-1">
                  {content.objectives.map((o, i) => (
                    <li key={i}>{o}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        )}
        <WeeklyLessonPlanTable
          sessions={content.sessions}
          meta={{
            subject: content.subject,
            mainTopic: content.mainTopic,
            subTopic: content.subTopic,
          }}
        />
      </div>
    );
  }

  const isWeekly = content.type === 'weekly' && content.sessions && content.sessions.length > 0;
  const isYearlyOrMonthly = content.type === 'yearly' || content.type === 'monthly';
  
  return (
    <div className={`detailed-lesson-plan-content space-y-8 ${className}`}>
      {/* Header */}
      <div className="border-b-2 border-primary/20 pb-4">
        <div className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase mb-3">
          {content.type} Lesson Plan
        </div>
        <h1 className="text-2xl font-bold text-ais-on-surface dark:text-gray-100 mb-2">
          {content.subject}
        </h1>
        <p className="text-lg text-ais-on-surface-variant dark:text-gray-300">
          {content.type === 'yearly' ? 'Annual lesson plan' : `Main Topic: ${content.mainTopic}`}
        </p>
        {content.subTopic && (
          <p className="text-md text-ais-on-surface-variant dark:text-gray-400">
            Sub Topic: {content.subTopic}
          </p>
        )}
      </div>

      {/* Textbook sources — weekly/monthly only */}
      {content.type !== 'yearly' && content.sources && content.sources.length > 0 && (
        <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 p-4 border border-blue-200 dark:border-blue-800">
          <h3 className="text-sm font-bold text-blue-900 dark:text-blue-300 mb-2">
            Textbook References
          </h3>
          <div className="flex flex-wrap gap-2">
            {content.sources.map((src, i) => (
              <span
                key={i}
                className="px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-800/40 text-xs text-blue-800 dark:text-blue-200"
              >
                {src.page != null ? `Page ${src.page}` : 'Page ?'}
                {src.topic ? ` · ${src.topic.replace(/_/g, ' ')}` : ''}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Overview Section (for yearly and monthly) */}
      {isYearlyOrMonthly && (
        <>
          {/* Prerequisite Knowledge */}
          <div className="rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 p-6 border border-primary/20">
            <h3 className="text-sm font-bold text-primary mb-3 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Prerequisite Knowledge
            </h3>
            <p className="text-sm text-primary/90 leading-relaxed">
              {content.prerequisiteKnowledge}
            </p>
          </div>

          {/* Rationale */}
          <div className="rounded-xl bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-800/10 p-6 border border-purple-200 dark:border-purple-800">
            <h3 className="text-sm font-bold text-purple-900 dark:text-purple-300 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Rationale of the Lesson
            </h3>
            <p className="text-sm text-purple-900 dark:text-purple-200 leading-relaxed">
              {content.rationale}
            </p>
          </div>

          {/* Objectives */}
          <div className="rounded-xl bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-800/10 p-6 border border-green-200 dark:border-green-800">
            <h3 className="text-sm font-bold text-green-900 dark:text-green-300 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Specific Objectives - At end of the lesson students will be able to:
            </h3>
            <ul className="space-y-2.5 text-sm text-green-900 dark:text-green-200">
              {content.objectives.map((obj, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-700 dark:bg-green-600 text-white text-xs font-bold shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{obj}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Annual curriculum units */}
          {content.type === 'yearly' && content.units && content.units.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-ais-on-surface dark:text-gray-100 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Annual curriculum units (paced by difficulty & volume)
              </h3>
              {content.units.map((unit) => (
                <div
                  key={unit.order}
                  className="rounded-xl border border-border/60 bg-card p-5 space-y-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold text-primary uppercase">Unit {unit.order}</p>
                      <h4 className="text-base font-bold text-foreground mt-0.5">{unit.title}</h4>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-800 dark:text-amber-200 border border-amber-500/30">
                        {unit.difficulty}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/15 text-sky-800 dark:text-sky-200 border border-sky-500/30">
                        Volume: {unit.volume}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                        {unit.estimatedDays} days
                      </span>
                    </div>
                  </div>

                  <div>
                    <h5 className="text-xs font-bold text-green-800 dark:text-green-300 mb-2 uppercase">Objectives</h5>
                    <ul className="space-y-1.5 text-sm text-muted-foreground">
                      {unit.objectives.map((obj, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="text-primary font-bold shrink-0">•</span>
                          <span>{obj}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h5 className="text-xs font-bold text-purple-800 dark:text-purple-300 mb-2 uppercase">Teacher must include</h5>
                    <ul className="space-y-1.5 text-sm text-muted-foreground">
                      {unit.teacherMustInclude.map((item, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="text-purple-600 font-bold shrink-0">→</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h5 className="text-xs font-bold text-blue-800 dark:text-blue-300 mb-2 uppercase">Expected when topic is finished</h5>
                    <ul className="space-y-1.5 text-sm text-muted-foreground">
                      {unit.expectedOutcomes.map((outcome, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="text-blue-600 font-bold shrink-0">✓</span>
                          <span>{outcome}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Overview */}
          {content.overview && (
            <div className="rounded-xl bg-white dark:bg-gray-800 p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-bold text-ais-on-surface dark:text-gray-100 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                {content.type === 'yearly' ? 'Year pacing summary' : 'Monthly Overview'}
              </h3>
              <div className="prose dark:prose-invert max-w-none text-sm">
                <MarkdownRenderer content={content.overview} />
              </div>
            </div>
          )}
        </>
      )}

      {/* Weekly Sessions (Detailed) */}
      {isWeekly && content.sessions && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-primary bg-primary/10 px-4 py-3 rounded-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Weekly Sessions ({content.sessions.length} sessions total)</span>
          </div>

          {content.sessions.map((session, idx) => (
            <details key={idx} className="group rounded-xl border-2 border-primary/20 overflow-hidden">
              <summary className="cursor-pointer bg-gradient-to-r from-primary/10 to-accent/10 hover:from-primary/20 hover:to-accent/20 p-5 transition-all list-none">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-white font-bold text-lg shadow-lg">
                      {session.sessionNumber}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-ais-on-surface dark:text-gray-100">
                        Session {session.sessionNumber}: {session.subTopic || session.mainTopic}
                      </h3>
                      <p className="text-sm text-ais-on-surface-variant dark:text-gray-400">{session.subject}</p>
                      {session.textbookPages && (
                        <p className="text-xs font-medium text-primary mt-1">
                          Textbook: {session.textbookPages}
                        </p>
                      )}
                    </div>
                  </div>
                  <svg className="w-6 h-6 text-primary transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </summary>

              <div className="p-6 space-y-6 bg-white dark:bg-gray-800">
                {/* Session Overview */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="rounded-lg bg-primary/5 p-4 border border-primary/20">
                    <h4 className="text-xs font-bold text-primary mb-2 uppercase">Prerequisite Knowledge</h4>
                    <p className="text-sm text-primary/90">{session.prerequisiteKnowledge}</p>
                  </div>
                  <div className="rounded-lg bg-purple-50 dark:bg-purple-900/20 p-4 border border-purple-200 dark:border-purple-800">
                    <h4 className="text-xs font-bold text-purple-900 dark:text-purple-300 mb-2 uppercase">Rationale</h4>
                    <p className="text-sm text-purple-800 dark:text-purple-200">{session.rationale}</p>
                  </div>
                </div>

                {/* Objectives */}
                <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-4 border border-green-200 dark:border-green-800">
                  <h4 className="text-xs font-bold text-green-900 dark:text-green-300 mb-3 uppercase">
                    Specific Objectives - Students will be able to:
                  </h4>
                  <ul className="space-y-2 text-sm text-green-800 dark:text-green-200">
                    {session.objectives.map((obj, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="inline-block w-5 h-5 rounded-full bg-green-600 text-white text-xs flex items-center justify-center shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <span>{obj}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Teaching Approach */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-ais-on-surface dark:text-gray-100 flex items-center gap-2 border-b-2 border-primary/20 pb-2">
                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    Teaching Approach
                  </h4>

                  {session.teachingApproach && (
                    <>
                  {/* Starting Activity */}
                  <ActivityCard 
                    title="Starting Activity" 
                    activity={session.teachingApproach.startingActivity}
                    color="yellow"
                  />

                  {/* Main Activity */}
                  <ActivityCard 
                    title="Main Activity" 
                    activity={session.teachingApproach.mainActivity}
                    color="blue"
                  />

                  {/* Concluding Activity */}
                  <ActivityCard 
                    title="Concluding Activity" 
                    activity={session.teachingApproach.concludingActivity}
                    color="orange"
                  />
                    </>
                  )}
                </div>
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  );
};

interface ActivityCardProps {
  title: string;
  activity: {
    time: string;
    content: string;
    teacherActivity: string;
    studentActivity: string;
    teachingAids: string[];
    assessment: string;
  };
  color: 'yellow' | 'blue' | 'orange';
}

const ActivityCard: React.FC<ActivityCardProps> = ({ title, activity, color }) => {
  const colorClasses = {
    yellow: {
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      border: 'border-yellow-300 dark:border-yellow-700',
      header: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-900 dark:text-yellow-200',
      text: 'text-yellow-900 dark:text-yellow-200',
      badge: 'bg-yellow-600 text-white',
    },
    blue: {
      bg: 'bg-primary/5',
      border: 'border-primary/30',
      header: 'bg-primary/10 text-primary',
      text: 'text-primary/90',
      badge: 'bg-primary text-white',
    },
    orange: {
      bg: 'bg-orange-50 dark:bg-orange-900/20',
      border: 'border-orange-300 dark:border-orange-700',
      header: 'bg-orange-100 dark:bg-orange-900/30 text-orange-900 dark:text-orange-200',
      text: 'text-orange-900 dark:text-orange-200',
      badge: 'bg-orange-600 text-white',
    },
  };

  const colors = colorClasses[color];

  return (
    <div className={`rounded-lg border-2 ${colors.border} ${colors.bg} overflow-hidden`}>
      <div className={`${colors.header} px-4 py-2.5 font-bold text-sm flex items-center justify-between`}>
        <span>{title}</span>
        <span className={`${colors.badge} px-3 py-1 rounded-full text-xs font-medium`}>
          {activity.time}
        </span>
      </div>
      
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-1 gap-4">
          <div>
            <h5 className={`text-xs font-bold ${colors.text} mb-1.5 uppercase`}>Content</h5>
            <p className="text-sm text-gray-700 dark:text-gray-300">{activity.content}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h5 className={`text-xs font-bold ${colors.text} mb-1.5 uppercase`}>Teacher Activity</h5>
            <p className="text-sm text-gray-700 dark:text-gray-300">{activity.teacherActivity}</p>
          </div>
          <div>
            <h5 className={`text-xs font-bold ${colors.text} mb-1.5 uppercase`}>Student Activity</h5>
            <p className="text-sm text-gray-700 dark:text-gray-300">{activity.studentActivity}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h5 className={`text-xs font-bold ${colors.text} mb-1.5 uppercase`}>Teaching Aids</h5>
            <div className="flex flex-wrap gap-1.5">
              {activity.teachingAids.map((aid, i) => (
                <span key={i} className="px-2.5 py-1 rounded-full bg-gray-200 dark:bg-gray-700 text-xs text-gray-700 dark:text-gray-300">
                  {aid}
                </span>
              ))}
            </div>
          </div>
          <div>
            <h5 className={`text-xs font-bold ${colors.text} mb-1.5 uppercase`}>Assessment Activity</h5>
            <p className="text-sm text-gray-700 dark:text-gray-300">{activity.assessment}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
