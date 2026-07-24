import {
  AlignmentType,
  BorderStyle,
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableLayoutType,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
  Header,
} from 'docx';
import { saveAs } from 'file-saver';
import type { AnnualLessonPlanResult, AnnualLessonPlanWeekRow } from './annualLessonPlan';
import { computeRowSpans } from './annualLessonPlan';

const THIN = { style: BorderStyle.SINGLE, size: 4, color: '000000' };
const BORDERS = { top: THIN, bottom: THIN, left: THIN, right: THIN };

/** A3 landscape usable width (~22cm) so all 13 template columns fill the page. */
const PAGE_W = 23811;
const PAGE_H = 16838;
const MARGIN = 360;
const TABLE_W = PAGE_W - MARGIN * 2; // 23091

/**
 * Column widths (DXA) — MUST sum exactly to TABLE_W so the table spans the full page.
 * Previously under-allocated (~18k), which left a large empty strip on the right.
 */
const COLS = {
  semester: 1100,
  month: 1100,
  week: 850,
  date: 1000,
  unit: 2200,
  contents: 3000,
  periods: 850,
  page: 1000,
  objectives: 3800,
  methods: 2000,
  aids: 2000,
  evaluation: 2400,
  comments: 1791,
} as const;

const COL_WIDTHS = [
  COLS.semester,
  COLS.month,
  COLS.week,
  COLS.date,
  COLS.unit,
  COLS.contents,
  COLS.periods,
  COLS.page,
  COLS.objectives,
  COLS.methods,
  COLS.aids,
  COLS.evaluation,
  COLS.comments,
];

function p(
  text: string,
  opts?: { bold?: boolean; size?: number; center?: boolean },
): Paragraph {
  return new Paragraph({
    alignment: opts?.center ? AlignmentType.CENTER : AlignmentType.LEFT,
    spacing: { after: 40, before: 0, line: 240 },
    children: [
      new TextRun({
        text,
        bold: opts?.bold,
        size: opts?.size ?? 14,
        font: 'Calibri',
      }),
    ],
  });
}

function bullets(items: string[], prefix: string): Paragraph[] {
  if (!items?.length) return [p('—', { size: 12 })];
  return items.map((item) => p(`${prefix} ${item}`, { size: 12 }));
}

function cell(
  children: Paragraph[],
  width: number,
  opts?: { rowSpan?: number; center?: boolean; shading?: string },
): TableCell {
  return new TableCell({
    borders: BORDERS,
    width: { size: width, type: WidthType.DXA },
    rowSpan: opts?.rowSpan && opts.rowSpan > 1 ? opts.rowSpan : undefined,
    verticalAlign: VerticalAlign.CENTER,
    shading: opts?.shading ? { fill: opts.shading } : undefined,
    children: children.length
      ? children.map((c) =>
          opts?.center
            ? new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 40, before: 0, line: 240 },
                children: c.children,
              })
            : c,
        )
      : [p('')],
  });
}

function headerCell(label: string, width: number): TableCell {
  return cell([p(label, { bold: true, size: 13, center: true })], width, {
    center: true,
    shading: 'E8E8E8',
  });
}

function buildHeaderRow(): TableRow {
  return new TableRow({
    tableHeader: true,
    children: [
      headerCell('Semester', COLS.semester),
      headerCell('Month', COLS.month),
      headerCell('Week', COLS.week),
      headerCell('Date', COLS.date),
      headerCell('Unit', COLS.unit),
      headerCell('Contents', COLS.contents),
      headerCell('Period needed', COLS.periods),
      headerCell('Page', COLS.page),
      headerCell('General Objectives', COLS.objectives),
      headerCell('Teaching Methods', COLS.methods),
      headerCell('Teaching Aids', COLS.aids),
      headerCell('Evaluation Method', COLS.evaluation),
      headerCell('Comments', COLS.comments),
    ],
  });
}

function buildDataRows(weeks: AnnualLessonPlanWeekRow[]): TableRow[] {
  const semesterSpans = computeRowSpans(weeks, 'semester');
  const monthSpans = computeRowSpans(weeks, 'month');
  const unitSpans = computeRowSpans(weeks, 'unit');

  return weeks.map((row, i) => {
    const children: TableCell[] = [];

    if (semesterSpans[i] > 0) {
      children.push(
        cell([p(row.semester, { bold: true, size: 12, center: true })], COLS.semester, {
          rowSpan: semesterSpans[i],
          center: true,
        }),
      );
    }
    if (monthSpans[i] > 0) {
      children.push(
        cell([p(row.month, { bold: true, size: 12, center: true })], COLS.month, {
          rowSpan: monthSpans[i],
          center: true,
        }),
      );
    }

    children.push(
      cell([p(row.week, { size: 12, center: true })], COLS.week, { center: true }),
      cell([p(row.date, { size: 12, center: true })], COLS.date, { center: true }),
    );

    if (unitSpans[i] > 0) {
      children.push(
        cell([p(row.unit || '—', { bold: true, size: 12 })], COLS.unit, {
          rowSpan: unitSpans[i],
        }),
      );
    }

    children.push(
      cell(bullets(row.contents, '>'), COLS.contents),
      cell([p(String(row.periodsNeeded), { size: 12, center: true })], COLS.periods, {
        center: true,
      }),
      cell([p(row.page || '—', { size: 12, center: true })], COLS.page, { center: true }),
      cell(
        [
          ...(row.generalObjectives?.length
            ? [
                p('Enabling students to', { bold: true, size: 12 }),
                ...bullets(row.generalObjectives, '✓'),
              ]
            : [p('—', { size: 12 })]),
        ],
        COLS.objectives,
      ),
      cell(bullets(row.teachingMethods, '>'), COLS.methods),
      cell(bullets(row.teachingAids, '>'), COLS.aids),
      cell(
        [
          ...bullets(row.evaluationMethods, '•'),
          ...(row.homework?.length
            ? [p('Homework', { bold: true, size: 12 }), ...bullets(row.homework, '•')]
            : []),
        ],
        COLS.evaluation,
      ),
      cell([p(row.comments || '', { size: 12 })], COLS.comments),
    );

    return new TableRow({ children, cantSplit: true });
  });
}

export async function downloadAnnualLessonPlanDocx(plan: AnnualLessonPlanResult): Promise<void> {
  const m = plan.meta;
  const objectives = m.generalObjectives?.length ? m.generalObjectives : plan.objectives;
  const weeks = plan.weeks ?? [];

  const metaTable = new Table({
    width: { size: TABLE_W, type: WidthType.DXA },
    columnWidths: [Math.floor(TABLE_W / 2), Math.ceil(TABLE_W / 2)],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: BORDERS,
            width: { size: Math.floor(TABLE_W / 2), type: WidthType.DXA },
            children: [
              p(`Teacher's Name: ${m.teacherName}`, { size: 16 }),
              p(`Grade: ${m.grade}`, { size: 16 }),
              p(`Subject: ${m.subject}`, { size: 16 }),
              p(`Total no of School day per year: ${m.schoolDaysPerYear}`, { size: 16 }),
              p(`per week: ${m.periodsPerWeek}`, { size: 16 }),
              p(`Total no of Periods per year: ${m.periodsPerYear}`, { size: 16 }),
              p(`Reference Materials: ${m.referenceMaterials}`, { size: 16 }),
              p(`School: ${m.schoolName}`, { size: 16 }),
            ],
          }),
          new TableCell({
            borders: BORDERS,
            width: { size: Math.ceil(TABLE_W / 2), type: WidthType.DXA },
            children: [
              p('General Objectives', { bold: true, size: 16 }),
              ...objectives.map((o, i) => p(`${i + 1}. ${o}`, { size: 15 })),
            ],
          }),
        ],
      }),
    ],
  });

  const mainTable = new Table({
    width: { size: TABLE_W, type: WidthType.DXA },
    columnWidths: COL_WIDTHS,
    layout: TableLayoutType.FIXED,
    rows: [buildHeaderRow(), ...buildDataRows(weeks)],
  });

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              orientation: 'landscape',
              width: PAGE_W,
              height: PAGE_H,
            },
            margin: {
              top: MARGIN,
              bottom: MARGIN,
              left: MARGIN,
              right: MARGIN,
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              p(
                `Annual Lesson Plan — ${m.grade} ${m.subject} — ${m.academicYear} · Textbook`,
                { bold: true, size: 16, center: true },
              ),
            ],
          }),
        },
        children: [
          p(`Annual Lesson Plan ${m.academicYear}`, { bold: true, size: 26, center: true }),
          new Paragraph({ spacing: { after: 120 }, children: [] }),
          metaTable,
          new Paragraph({ spacing: { after: 160 }, children: [] }),
          // Explicit column-title reminder line (visible even if table header is clipped in some viewers)
          p(
            'Columns: Semester | Month | Week | Date | Unit | Contents | Period needed | Page | General Objectives | Teaching Methods | Teaching Aids | Evaluation Method | Comments',
            { size: 10, center: true },
          ),
          new Paragraph({ spacing: { after: 80 }, children: [] }),
          mainTable,
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const safeSubject = (m.subject || 'Subject').replace(/\s+/g, '_');
  const safeGrade = (m.grade || 'Grade').replace(/\s+/g, '_');
  saveAs(blob, `Annual_Lesson_Plan_${safeGrade}_${safeSubject}.docx`);
}
