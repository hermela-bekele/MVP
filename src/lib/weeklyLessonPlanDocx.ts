import {
  AlignmentType,
  BorderStyle,
  Document,
  Header,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableLayoutType,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} from 'docx';
import { saveAs } from 'file-saver';
import type { AIDetailedLessonPlanResult, WeeklyLessonSession, WeeklyProcedureRow } from './ai';

const THIN = { style: BorderStyle.SINGLE, size: 4, color: '000000' };
const BORDERS = { top: THIN, bottom: THIN, left: THIN, right: THIN };

const PAGE_W = 16838; // A4 landscape
const PAGE_H = 11906;
const MARGIN = 360;
const TABLE_W = PAGE_W - MARGIN * 2; // 16118

const COLS = {
  procedure: 1900,
  time: 750,
  contents: 2400,
  teacher: 2500,
  student: 2500,
  aid: 1500,
  reference: 2000,
  special: 2568,
} as const;

const COL_WIDTHS = Object.values(COLS);

function p(text: string, opts?: { bold?: boolean; size?: number; italic?: boolean; center?: boolean }) {
  return new Paragraph({
    alignment: opts?.center ? AlignmentType.CENTER : AlignmentType.LEFT,
    spacing: { after: 40, before: 0, line: 240 },
    children: [
      new TextRun({
        text,
        bold: opts?.bold,
        italics: opts?.italic,
        size: opts?.size ?? 14,
        font: 'Calibri',
      }),
    ],
  });
}

function cell(
  children: Paragraph[],
  width: number,
  opts?: { rowSpan?: number; center?: boolean; shading?: string },
) {
  return new TableCell({
    borders: BORDERS,
    width: { size: width, type: WidthType.DXA },
    rowSpan: opts?.rowSpan && opts.rowSpan > 1 ? opts.rowSpan : undefined,
    verticalAlign: VerticalAlign.TOP,
    shading: opts?.shading ? { fill: opts.shading } : undefined,
    children: children.length ? children : [p('')],
  });
}

function headerCell(label: string, width: number) {
  return cell([p(label, { bold: true, size: 12, center: true })], width, {
    center: true,
    shading: 'E8E8E8',
  });
}

function ensureProcedures(session: WeeklyLessonSession): WeeklyProcedureRow[] {
  const stages = [
    'Introduction (Starter Activities)',
    'Presentation / Main Activities',
    'Stabilization / concluding activities',
    'Assessment / Evaluation',
  ];
  if (session.procedures?.length) {
    return stages.map((stage, i) => {
      const row = session.procedures![i];
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
  return stages.map((stage) => ({
    stage,
    time: '—',
    lessonContents: '—',
    teacherActivity: '—',
    studentActivity: '—',
    teachingAid: '—',
    reference: session.textbookPages || '—',
  }));
}

function buildSessionTable(session: WeeklyLessonSession): Table {
  const rows = ensureProcedures(session);
  const needs = session.specialNeeds || { active: '—', medium: '—', slow: '—' };

  const header = new TableRow({
    tableHeader: true,
    children: [
      headerCell('Teaching Learning Procedure', COLS.procedure),
      headerCell('Time', COLS.time),
      headerCell('Lesson contents', COLS.contents),
      headerCell("Teacher's Activity", COLS.teacher),
      headerCell("Students' Activity", COLS.student),
      headerCell('Teaching Aid', COLS.aid),
      headerCell('Reference and resource types', COLS.reference),
      headerCell('Support and extra activities for special Need students', COLS.special),
    ],
  });

  const dataRows = rows.map((row, i) => {
    const children = [
      cell([p(row.stage, { bold: true, italic: true, size: 12 })], COLS.procedure),
      cell([p(row.time, { size: 12, center: true })], COLS.time, { center: true }),
      cell([p(row.lessonContents, { size: 12 })], COLS.contents),
      cell([p(row.teacherActivity, { size: 12 })], COLS.teacher),
      cell([p(row.studentActivity, { size: 12 })], COLS.student),
      cell([p(row.teachingAid, { size: 12 })], COLS.aid),
      cell([p(row.reference, { size: 12 })], COLS.reference),
    ];
    if (i === 0) {
      children.push(
        cell(
          [
            p('For active learners:', { bold: true, italic: true, size: 12 }),
            p(needs.active, { size: 12 }),
            p('For medium learners', { bold: true, italic: true, size: 12 }),
            p(needs.medium, { size: 12 }),
            p('For slow learners:', { bold: true, italic: true, size: 12 }),
            p(needs.slow, { size: 12 }),
          ],
          COLS.special,
          { rowSpan: rows.length },
        ),
      );
    }
    return new TableRow({ children, cantSplit: true });
  });

  return new Table({
    width: { size: TABLE_W, type: WidthType.DXA },
    columnWidths: COL_WIDTHS,
    layout: TableLayoutType.FIXED,
    rows: [header, ...dataRows],
  });
}

export async function downloadWeeklyLessonPlanDocx(plan: AIDetailedLessonPlanResult): Promise<void> {
  const sessions = plan.sessions ?? [];
  const children: (Paragraph | Table)[] = [
    p(`Weekly Detailed Lesson Plan — ${plan.subject}`, { bold: true, size: 26, center: true }),
    p(`Main topic: ${plan.mainTopic}`, { size: 16 }),
  ];
  if (plan.subTopic) children.push(p(`Sub topic: ${plan.subTopic}`, { size: 16 }));
  if (plan.objectives?.length) {
    children.push(p('Objectives', { bold: true, size: 16 }));
    plan.objectives.forEach((o, i) => children.push(p(`${i + 1}. ${o}`, { size: 14 })));
  }
  children.push(new Paragraph({ spacing: { after: 120 }, children: [] }));

  sessions.forEach((session, idx) => {
    children.push(
      p(
        `Session ${session.sessionNumber}: ${session.subTopic || session.mainTopic}${
          session.textbookPages ? `  ·  ${session.textbookPages}` : ''
        }`,
        { bold: true, size: 18 },
      ),
    );
    children.push(buildSessionTable(session));
    if (idx < sessions.length - 1) {
      children.push(new Paragraph({ spacing: { after: 200 }, children: [] }));
    }
  });

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: { orientation: 'landscape', width: PAGE_W, height: PAGE_H },
            margin: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN },
          },
        },
        headers: {
          default: new Header({
            children: [
              p(`${plan.subject} — Weekly Lesson Plan (Textbook-grounded)`, {
                bold: true,
                size: 14,
                center: true,
              }),
            ],
          }),
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const safe = (plan.mainTopic || plan.subject || 'Weekly').replace(/\s+/g, '_').slice(0, 40);
  saveAs(blob, `Weekly_Lesson_Plan_${safe}.docx`);
}
