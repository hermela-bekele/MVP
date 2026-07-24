'use client';

import React, { useMemo } from 'react';
import type { AnnualLessonPlanResult, AnnualLessonPlanWeekRow } from '@/lib/annualLessonPlan';
import { computeRowSpans } from '@/lib/annualLessonPlan';

interface AnnualLessonPlanTableProps {
  plan: AnnualLessonPlanResult;
  className?: string;
}

function BulletList({
  items,
  marker = '>',
}: {
  items: string[];
  marker?: '>' | '✓' | '•';
}) {
  if (!items?.length) return <span className="text-muted-foreground/50">—</span>;
  return (
    <ul className="m-0 list-none space-y-0.5 p-0 text-left">
      {items.map((item, i) => (
        <li key={i} className="flex gap-1 leading-snug">
          <span className="shrink-0 text-[10px] text-foreground/70">{marker}</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function VerticalCell({ children, rowSpan }: { children: React.ReactNode; rowSpan: number }) {
  return (
    <td
      rowSpan={rowSpan}
      className="border border-foreground/80 bg-background px-1 py-2 align-middle text-center"
    >
      <div
        className="mx-auto inline-block max-h-[140px] overflow-hidden text-[10px] font-semibold uppercase tracking-wide"
        style={{
          writingMode: 'vertical-rl',
          transform: 'rotate(180deg)',
        }}
      >
        {children}
      </div>
    </td>
  );
}

function MetaBox({ plan }: { plan: AnnualLessonPlanResult }) {
  const m = plan.meta;
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 print:grid-cols-2">
      <div className="space-y-1 border border-foreground/80 p-3 text-xs leading-relaxed">
        <p>
          <span className="font-bold">Teacher&apos;s Name:</span> {m.teacherName}
        </p>
        <p>
          <span className="font-bold">Grade:</span> {m.grade}
        </p>
        <p>
          <span className="font-bold">Subject:</span> {m.subject}
        </p>
        <p>
          <span className="font-bold">Total no of School day per year:</span> {m.schoolDaysPerYear}
        </p>
        <p>
          <span className="font-bold">per week:</span> {m.periodsPerWeek}
        </p>
        <p>
          <span className="font-bold">Total no of Periods per year:</span> {m.periodsPerYear}
        </p>
        <p>
          <span className="font-bold">Reference Materials:</span> {m.referenceMaterials}
        </p>
        {m.schoolName ? (
          <p>
            <span className="font-bold">School:</span> {m.schoolName}
          </p>
        ) : null}
      </div>
      <div className="border border-foreground/80 p-3 text-xs">
        <p className="mb-2 font-bold underline">General Objectives</p>
        <ol className="m-0 list-decimal space-y-1 pl-4">
          {(m.generalObjectives?.length ? m.generalObjectives : plan.objectives).map((obj, i) => (
            <li key={i} className="leading-snug">
              {obj}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function WeekRow({
  row,
  semesterSpan,
  monthSpan,
  unitSpan,
}: {
  row: AnnualLessonPlanWeekRow;
  semesterSpan: number;
  monthSpan: number;
  unitSpan: number;
}) {
  return (
    <tr className="align-top text-[11px]">
      {semesterSpan > 0 ? <VerticalCell rowSpan={semesterSpan}>{row.semester}</VerticalCell> : null}
      {monthSpan > 0 ? <VerticalCell rowSpan={monthSpan}>{row.month}</VerticalCell> : null}
      <td className="border border-foreground/80 px-1.5 py-1.5 text-center font-medium whitespace-nowrap">
        {row.week}
      </td>
      <td className="border border-foreground/80 px-1.5 py-1.5 text-center whitespace-nowrap">
        {row.date}
      </td>
      {unitSpan > 0 ? (
        <td
          rowSpan={unitSpan}
          className="border border-foreground/80 px-2 py-1.5 align-middle text-center text-[11px] font-semibold"
        >
          {row.unit || '—'}
        </td>
      ) : null}
      <td className="border border-foreground/80 px-2 py-1.5">
        <BulletList items={row.contents} marker=">" />
      </td>
      <td className="border border-foreground/80 px-1 py-1.5 text-center align-middle font-semibold">
        <span
          className="inline-block text-[10px]"
          style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
        >
          {row.periodsNeeded}
        </span>
      </td>
      <td className="border border-foreground/80 px-1.5 py-1.5 text-center whitespace-nowrap">
        {row.page || '—'}
      </td>
      <td className="border border-foreground/80 px-2 py-1.5">
        {row.generalObjectives?.length ? (
          <div>
            <p className="mb-0.5 font-semibold">Enabling students to</p>
            <BulletList items={row.generalObjectives} marker="✓" />
          </div>
        ) : (
          <span className="text-muted-foreground/50">—</span>
        )}
      </td>
      <td className="border border-foreground/80 px-2 py-1.5">
        <BulletList items={row.teachingMethods} marker=">" />
      </td>
      <td className="border border-foreground/80 px-2 py-1.5">
        <BulletList items={row.teachingAids} marker=">" />
      </td>
      <td className="border border-foreground/80 px-2 py-1.5">
        <div className="space-y-1.5">
          <BulletList items={row.evaluationMethods} marker="•" />
          {row.homework?.length ? (
            <div>
              <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-foreground/70">
                Homework
              </p>
              <BulletList items={row.homework} marker="•" />
            </div>
          ) : null}
        </div>
      </td>
      <td className="border border-foreground/80 px-2 py-1.5 min-w-[60px]">
        {row.comments || ''}
      </td>
    </tr>
  );
}

export const AnnualLessonPlanTable: React.FC<AnnualLessonPlanTableProps> = ({
  plan,
  className = '',
}) => {
  const weeks = plan.weeks ?? [];
  const semesterSpans = useMemo(() => computeRowSpans(weeks, 'semester'), [weeks]);
  const monthSpans = useMemo(() => computeRowSpans(weeks, 'month'), [weeks]);
  const unitSpans = useMemo(() => computeRowSpans(weeks, 'unit'), [weeks]);

  return (
    <div className={`annual-lesson-plan-table space-y-4 ${className}`}>
      <h2 className="text-center text-base font-bold tracking-wide uppercase">
        Annual Lesson Plan {plan.meta.academicYear}
      </h2>

      <MetaBox plan={plan} />

      <div className="w-full overflow-x-auto rounded-sm border border-foreground/80 print:max-h-none print:overflow-visible">
        <div className="max-h-[75vh] overflow-y-auto print:max-h-none">
        <table className="w-full min-w-[1600px] border-collapse bg-background text-foreground table-fixed">
          <thead className="sticky top-0 z-10">
            <tr className="bg-muted text-[10px] font-bold uppercase shadow-sm">
              <th className="border border-foreground/80 px-1 py-2 bg-muted">
                <span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                  Semester
                </span>
              </th>
              <th className="border border-foreground/80 px-1 py-2 bg-muted">
                <span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>Month</span>
              </th>
              <th className="border border-foreground/80 px-1.5 py-2 bg-muted">Week</th>
              <th className="border border-foreground/80 px-1.5 py-2 bg-muted">Date</th>
              <th className="border border-foreground/80 px-2 py-2 bg-muted">Unit</th>
              <th className="border border-foreground/80 px-2 py-2 bg-muted">Contents</th>
              <th className="border border-foreground/80 px-1 py-2 bg-muted">
                <span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                  Period needed
                </span>
              </th>
              <th className="border border-foreground/80 px-1.5 py-2 bg-muted">Page</th>
              <th className="border border-foreground/80 px-2 py-2 bg-muted">General Objectives</th>
              <th className="border border-foreground/80 px-2 py-2 bg-muted">Teaching Methods</th>
              <th className="border border-foreground/80 px-2 py-2 bg-muted">Teaching Aids</th>
              <th className="border border-foreground/80 px-2 py-2 bg-muted">Evaluation Method</th>
              <th className="border border-foreground/80 px-2 py-2 bg-muted">Comments</th>
            </tr>
          </thead>
          <tbody>
            {weeks.length === 0 ? (
              <tr>
                <td colSpan={13} className="border border-foreground/80 px-4 py-8 text-center text-sm text-muted-foreground">
                  No weekly rows in this plan yet.
                </td>
              </tr>
            ) : (
              weeks.map((row, i) => (
                <WeekRow
                  key={`${row.month}-${row.week}-${row.date}-${i}`}
                  row={row}
                  semesterSpan={semesterSpans[i]}
                  monthSpan={monthSpans[i]}
                  unitSpan={unitSpans[i]}
                />
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
};
