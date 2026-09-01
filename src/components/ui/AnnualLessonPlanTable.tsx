'use client';

import React, { useMemo } from 'react';
import type { AnnualLessonPlanResult, AnnualLessonPlanWeekRow } from '@/lib/annualLessonPlan';
import { computeRowSpans } from '@/lib/annualLessonPlan';
import { EditableList, EditableText, EditableNumber } from '@/components/ui/editablePlanCells';

interface AnnualLessonPlanTableProps {
  plan: AnnualLessonPlanResult;
  className?: string;
  /** Hide the page heading when an outer chrome already titles this plan */
  showTitle?: boolean;
  /** Allow editing the AI-authored pedagogical fields (unit, contents, objectives,
   * methods, aids, evaluation, homework, comments, periods, page). The auto-computed
   * calendar skeleton (semester/month/week/date) stays read-only — it comes from the
   * school calendar, not the AI. */
  editable?: boolean;
  onChange?: (next: AnnualLessonPlanResult) => void;
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

function MetaBox({ plan }: { plan: AnnualLessonPlanResult }) {
  const m = plan.meta;
  const objectives = m.generalObjectives?.length ? m.generalObjectives : plan.objectives;
  const facts = [
    m.teacherName ? `Teacher: ${m.teacherName}` : null,
    m.grade ? `Grade: ${m.grade}` : null,
    m.subject ? `Subject: ${m.subject}` : null,
    m.schoolName ? `School: ${m.schoolName}` : null,
    m.schoolDaysPerYear ? `${m.schoolDaysPerYear} school days` : null,
    m.periodsPerWeek ? `${m.periodsPerWeek}/wk` : null,
    m.periodsPerYear ? `${m.periodsPerYear} periods/yr` : null,
    m.referenceMaterials ? `Ref: ${m.referenceMaterials}` : null,
  ].filter(Boolean) as string[];

  return (
    <div className="space-y-2">
      {facts.length > 0 && (
        <p className="flex flex-wrap gap-x-1 gap-y-1 text-xs text-muted-foreground">
          {facts.map((fact, i) => (
            <React.Fragment key={fact}>
              {i > 0 ? <span aria-hidden className="text-border">·</span> : null}
              <span>{fact}</span>
            </React.Fragment>
          ))}
        </p>
      )}
      {objectives?.length ? (
        <details className="group rounded-lg border border-border/70 bg-muted/20">
          <summary className="cursor-pointer list-none px-3 py-2 text-xs font-semibold text-foreground marker:content-none [&::-webkit-details-marker]:hidden">
            <span className="inline-flex items-center gap-2">
              General objectives
              <span className="font-normal text-muted-foreground">({objectives.length})</span>
              <span className="text-muted-foreground transition-transform group-open:rotate-180">▾</span>
            </span>
          </summary>
          <ol className="m-0 list-decimal space-y-1 border-t border-border/60 px-3 py-2 pl-7 text-xs leading-snug">
            {objectives.map((obj, i) => (
              <li key={i}>{obj}</li>
            ))}
          </ol>
        </details>
      ) : null}
      {m.teachingAidsAvailable?.length ? (
        <details className="group rounded-lg border border-border/70 bg-muted/20">
          <summary className="cursor-pointer list-none px-3 py-2 text-xs font-semibold text-foreground marker:content-none [&::-webkit-details-marker]:hidden">
            <span className="inline-flex items-center gap-2">
              Teaching aids available
              <span className="font-normal text-muted-foreground">
                ({m.teachingAidsAvailable.length})
              </span>
              <span className="text-muted-foreground transition-transform group-open:rotate-180">▾</span>
            </span>
          </summary>
          <ul className="m-0 flex flex-wrap gap-1.5 border-t border-border/60 px-3 py-2">
            {m.teachingAidsAvailable.map((aid) => (
              <li
                key={aid}
                className="rounded-md bg-background px-2 py-0.5 text-[11px] text-foreground/80 ring-1 ring-border/60"
              >
                {aid}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}

function WeekRow({
  row,
  semesterSpan,
  monthSpan,
  unitSpan,
  editable,
  onEditUnit,
  onEditField,
}: {
  row: AnnualLessonPlanWeekRow;
  semesterSpan: number;
  monthSpan: number;
  unitSpan: number;
  editable: boolean;
  onEditUnit: (unitSpan: number, next: string) => void;
  onEditField: <K extends keyof AnnualLessonPlanWeekRow>(field: K, next: AnnualLessonPlanWeekRow[K]) => void;
}) {
  return (
    <tr className="align-top text-[11px]">
      {semesterSpan > 0 ? (
        <td
          rowSpan={semesterSpan}
          className="border border-foreground/80 bg-background px-1 py-2 align-middle text-center"
        >
          <div
            className="mx-auto inline-block max-h-[140px] overflow-hidden text-[10px] font-semibold uppercase tracking-wide"
            style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
          >
            {row.semester}
          </div>
        </td>
      ) : null}
      {monthSpan > 0 ? (
        <td
          rowSpan={monthSpan}
          className="border border-foreground/80 bg-background px-1 py-2 align-middle text-center"
        >
          <div
            className="mx-auto inline-block max-h-[140px] overflow-hidden text-[10px] font-semibold uppercase tracking-wide"
            style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
          >
            {row.month}
          </div>
        </td>
      ) : null}
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
          {editable ? (
            <EditableText value={row.unit} onChange={(v) => onEditUnit(unitSpan, v)} />
          ) : (
            row.unit || '—'
          )}
        </td>
      ) : null}
      <td className="border border-foreground/80 px-2 py-1.5">
        {editable ? (
          <EditableList items={row.contents} onChange={(v) => onEditField('contents', v)} placeholder="One content item per line" />
        ) : (
          <BulletList items={row.contents} marker=">" />
        )}
      </td>
      <td className="border border-foreground/80 px-1 py-1.5 text-center align-middle font-semibold">
        {editable ? (
          <EditableNumber value={row.periodsNeeded} onChange={(v) => onEditField('periodsNeeded', v)} />
        ) : (
          <span
            className="inline-block text-[10px]"
            style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
          >
            {row.periodsNeeded}
          </span>
        )}
      </td>
      <td className="border border-foreground/80 px-2 py-1.5">
        {editable ? (
          <EditableList
            items={row.generalObjectives}
            onChange={(v) => onEditField('generalObjectives', v)}
            placeholder="One objective per line"
          />
        ) : row.generalObjectives?.length ? (
          <div>
            <p className="mb-0.5 font-semibold">Enabling students to</p>
            <BulletList items={row.generalObjectives} marker="✓" />
          </div>
        ) : (
          <span className="text-muted-foreground/50">—</span>
        )}
      </td>
      <td className="border border-foreground/80 px-2 py-1.5">
        {editable ? (
          <EditableList items={row.teachingMethods} onChange={(v) => onEditField('teachingMethods', v)} placeholder="One method per line" />
        ) : (
          <BulletList items={row.teachingMethods} marker=">" />
        )}
      </td>
      <td className="border border-foreground/80 px-2 py-1.5">
        {editable ? (
          <EditableList items={row.teachingAids} onChange={(v) => onEditField('teachingAids', v)} placeholder="One aid per line" />
        ) : (
          <BulletList items={row.teachingAids} marker=">" />
        )}
      </td>
      <td className="border border-foreground/80 px-2 py-1.5">
        {editable ? (
          <div className="space-y-1.5">
            <EditableList items={row.evaluationMethods} onChange={(v) => onEditField('evaluationMethods', v)} placeholder="One evaluation method per line" />
            <EditableList items={row.homework ?? []} onChange={(v) => onEditField('homework', v)} placeholder="Homework (one per line)" />
          </div>
        ) : (
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
        )}
      </td>
      <td className="border border-foreground/80 px-2 py-1.5 min-w-[60px]">
        {editable ? (
          <EditableText
            className="text-left"
            value={row.comments ?? ''}
            onChange={(v) => onEditField('comments', v)}
          />
        ) : (
          row.comments || ''
        )}
      </td>
    </tr>
  );
}

export const AnnualLessonPlanTable: React.FC<AnnualLessonPlanTableProps> = ({
  plan,
  className = '',
  showTitle = true,
  editable = false,
  onChange,
}) => {
  const weeks = plan.weeks ?? [];
  const semesterSpans = useMemo(() => computeRowSpans(weeks, 'semester'), [weeks]);
  const monthSpans = useMemo(() => computeRowSpans(weeks, 'month'), [weeks]);
  const unitSpans = useMemo(() => computeRowSpans(weeks, 'unit'), [weeks]);

  const updateWeeks = (index: number, updater: (row: AnnualLessonPlanWeekRow) => AnnualLessonPlanWeekRow) => {
    if (!onChange) return;
    const nextWeeks = weeks.map((row, i) => (i === index ? updater(row) : row));
    onChange({ ...plan, weeks: nextWeeks });
  };

  const updateUnitSpan = (startIndex: number, span: number, next: string) => {
    if (!onChange) return;
    const nextWeeks = weeks.map((row, i) =>
      i >= startIndex && i < startIndex + span ? { ...row, unit: next } : row,
    );
    onChange({ ...plan, weeks: nextWeeks });
  };

  return (
    <div className={`annual-lesson-plan-table space-y-4 ${className}`}>
      {showTitle ? (
        <h2 className="text-center text-base font-bold tracking-wide uppercase">
          Annual Lesson Plan{plan.meta.academicYear ? ` ${plan.meta.academicYear}` : ''}
        </h2>
      ) : null}

      <MetaBox plan={plan} />

      {editable && (
        <p className="text-xs text-muted-foreground">
          Editing this draft — change any unit, content, period, objective, method, aid,
          evaluation, homework, or comment field directly in the table below.
        </p>
      )}

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
                  <td
                    colSpan={12}
                    className="border border-foreground/80 px-4 py-8 text-center text-sm text-muted-foreground"
                  >
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
                    editable={editable}
                    onEditUnit={(span, next) => updateUnitSpan(i, span, next)}
                    onEditField={(field, next) => updateWeeks(i, (row) => ({ ...row, [field]: next }))}
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
