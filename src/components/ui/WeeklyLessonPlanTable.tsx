'use client';

import React from 'react';
import type { WeeklyLessonSession, WeeklyProcedureRow, WeeklySpecialNeeds } from '@/lib/ai';

interface WeeklyLessonPlanTableProps {
  sessions: WeeklyLessonSession[];
  className?: string;
  /** Optional header meta shown above the first session */
  meta?: {
    subject?: string;
    mainTopic?: string;
    subTopic?: string;
    grade?: string;
  };
}

const STAGES = [
  'Introduction (Starter Activities)',
  'Presentation / Main Activities',
  'Stabilization / concluding activities',
  'Assessment / Evaluation',
] as const;

function ensureProcedures(session: WeeklyLessonSession): WeeklyProcedureRow[] {
  if (session.procedures?.length) {
    return STAGES.map((stage, i) => {
      const row = session.procedures![i] || session.procedures!.find((p) => p.stage === stage);
      return {
        stage,
        time: row?.time || '—',
        lessonContents: row?.lessonContents || '—',
        teacherActivity: row?.teacherActivity || '—',
        studentActivity: row?.studentActivity || '—',
        teachingAid: row?.teachingAid || '—',
        reference: row?.reference || session.textbookPages || '—',
      };
    });
  }

  const ta = session.teachingApproach;
  if (!ta) {
    return STAGES.map((stage) => ({
      stage,
      time: '—',
      lessonContents: '—',
      teacherActivity: '—',
      studentActivity: '—',
      teachingAid: '—',
      reference: session.textbookPages || '—',
    }));
  }

  const map = [
    ta.startingActivity,
    ta.mainActivity,
    ta.mainActivity,
    {
      time: '6\'',
      content: ta.concludingActivity?.assessment || 'Assessment',
      teacherActivity: 'Observe and evaluate',
      studentActivity: 'Complete assessment tasks',
      teachingAids: ta.concludingActivity?.teachingAids || ['Textbook'],
      assessment: '',
    },
  ];
  const times = ['5\'', '16\'', '8\'', '6\''];
  return STAGES.map((stage, i) => {
    const src = map[i] || map[0];
    return {
      stage,
      time: src.time || times[i],
      lessonContents: src.content || '—',
      teacherActivity: src.teacherActivity || '—',
      studentActivity: src.studentActivity || '—',
      teachingAid: (src.teachingAids || []).join(', ') || 'Textbook',
      reference: session.textbookPages || 'Textbook',
    };
  });
}

function SpecialNeedsCell({ needs, rowSpan }: { needs: WeeklySpecialNeeds; rowSpan: number }) {
  return (
    <td
      rowSpan={rowSpan}
      className="border border-foreground/80 px-2 py-2 align-top text-[11px] leading-snug min-w-[160px]"
    >
      <p className="mb-2 font-semibold italic">For active learners:</p>
      <p className="mb-3">{needs.active || '—'}</p>
      <p className="mb-2 font-semibold italic">For medium learners</p>
      <p className="mb-3">{needs.medium || '—'}</p>
      <p className="mb-2 font-semibold italic">For slow learners:</p>
      <p>{needs.slow || '—'}</p>
    </td>
  );
}

function SessionTable({ session }: { session: WeeklyLessonSession }) {
  const rows = ensureProcedures(session);
  const needs: WeeklySpecialNeeds = session.specialNeeds || {
    active: '—',
    medium: '—',
    slow: '—',
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
        <h3 className="font-bold">
          Session {session.sessionNumber}: {session.subTopic || session.mainTopic}
        </h3>
        <div className="text-xs text-muted-foreground">
          {session.textbookPages ? <span>Pages: {session.textbookPages}</span> : null}
          {session.durationMinutes ? (
            <span className="ml-3">{session.durationMinutes}&nbsp;mins</span>
          ) : null}
        </div>
      </div>
      {session.objectives?.length ? (
        <ul className="mb-2 list-disc pl-5 text-xs text-muted-foreground">
          {session.objectives.map((o, i) => (
            <li key={i}>{o}</li>
          ))}
        </ul>
      ) : null}

      <div className="w-full overflow-x-auto rounded-sm border border-foreground/80">
        <table className="w-full min-w-[1100px] border-collapse bg-background text-foreground text-[11px]">
          <thead>
            <tr className="bg-muted text-[10px] font-bold">
              <th className="border border-foreground/80 px-1.5 py-2">Teaching Learning Procedure</th>
              <th className="border border-foreground/80 px-1.5 py-2 w-14">Time</th>
              <th className="border border-foreground/80 px-1.5 py-2">Lesson contents</th>
              <th className="border border-foreground/80 px-1.5 py-2">Teacher&apos;s Activity</th>
              <th className="border border-foreground/80 px-1.5 py-2">Students&apos; Activity</th>
              <th className="border border-foreground/80 px-1.5 py-2">Teaching Aid</th>
              <th className="border border-foreground/80 px-1.5 py-2">Reference and resource types</th>
              <th className="border border-foreground/80 px-1.5 py-2">
                Support and extra activities for special Need students
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.stage} className="align-top">
                <td className="border border-foreground/80 px-2 py-2 font-semibold italic">
                  {row.stage}
                </td>
                <td className="border border-foreground/80 px-1.5 py-2 text-center whitespace-nowrap">
                  {row.time}
                </td>
                <td className="border border-foreground/80 px-2 py-2">{row.lessonContents}</td>
                <td className="border border-foreground/80 px-2 py-2">{row.teacherActivity}</td>
                <td className="border border-foreground/80 px-2 py-2">{row.studentActivity}</td>
                <td className="border border-foreground/80 px-2 py-2">{row.teachingAid}</td>
                <td className="border border-foreground/80 px-2 py-2">{row.reference}</td>
                {i === 0 ? <SpecialNeedsCell needs={needs} rowSpan={rows.length} /> : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export const WeeklyLessonPlanTable: React.FC<WeeklyLessonPlanTableProps> = ({
  sessions,
  className = '',
  meta,
}) => {
  if (!sessions?.length) {
    return (
      <p className="text-sm text-muted-foreground">No weekly sessions in this plan yet.</p>
    );
  }

  return (
    <div className={`weekly-lesson-plan-table space-y-6 ${className}`}>
      <h2 className="text-center text-base font-bold tracking-wide uppercase">
        Weekly Detailed Lesson Plan
      </h2>
      {meta ? (
        <div className="border border-foreground/80 p-3 text-xs space-y-1">
          {meta.grade ? (
            <p>
              <span className="font-bold">Grade:</span> {meta.grade}
            </p>
          ) : null}
          {meta.subject ? (
            <p>
              <span className="font-bold">Subject:</span> {meta.subject}
            </p>
          ) : null}
          {meta.mainTopic ? (
            <p>
              <span className="font-bold">Main topic:</span> {meta.mainTopic}
            </p>
          ) : null}
          {meta.subTopic ? (
            <p>
              <span className="font-bold">Sub topic:</span> {meta.subTopic}
            </p>
          ) : null}
        </div>
      ) : null}
      {sessions.map((s) => (
        <SessionTable key={s.sessionNumber} session={s} />
      ))}
    </div>
  );
};
