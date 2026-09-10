'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { api } from '@/lib/api';
import {
  AisPage,
  AisPanel,
  AisTable,
  AisTableHead,
  AisTh,
  AisTr,
  AisTd,
  AisStatusBadge,
} from '@/components/dashboard/teacher/TeacherPortalUi';
import { Select } from '@/components/ui/select';
import { Tooltip } from '@/components/ui/tooltip';
import {
  GRADE_OPTIONS,
  SECTION_FILTER_OPTIONS,
  normalizeGradeLabel,
  mapTimetableSlotRow,
  timetableSlotOccurrenceDate,
  sessionNumberForSlot,
  getDemoTeacher,
  type TimetableSlot,
} from '@/lib/teacherPortal';
import { subjectMatches } from '@/lib/departmentHead';
import {
  parseWeeklyPlanDetail,
  getWeeklyPlanSessionTopicOptions,
  type AIDetailedLessonPlanResult,
} from '@/lib/ai';
import {
  buildTeachingWeeksFromCalendar,
  findWeekForDate,
  mondayOfWeekIso,
  weekNumberLabel,
} from '@/lib/annualLessonPlan';
import { aisBodySm, aisDataMd } from '@/components/dashboard/teacher/aisStyles';

const WEEKDAY_COLUMNS = [
  { dow: 1, label: 'Monday' },
  { dow: 2, label: 'Tuesday' },
  { dow: 3, label: 'Wednesday' },
  { dow: 4, label: 'Thursday' },
  { dow: 5, label: 'Friday' },
] as const;

interface EnrichedSlot {
  slot: TimetableSlot;
  occurrenceDate: string;
  sessionNumber: number;
  matchedPlan: { id: string; title: string } | null;
  sessionTopic: string | null;
  attendanceTaken: boolean;
  delivered: boolean;
}

function SlotCell({ enriched }: { enriched: EnrichedSlot | undefined }) {
  if (!enriched) return <span className="text-ais-on-surface-variant">—</span>;
  const { slot, sessionNumber, matchedPlan, sessionTopic, attendanceTaken, delivered } = enriched;

  return (
    <div className="min-w-[11rem] space-y-1.5">
      <p className={aisDataMd}>
        {slot.grade} · Sec {slot.section}
      </p>
      <p className={aisBodySm}>
        {slot.subject}
        {slot.room ? ` · ${slot.room}` : ''}
      </p>

      {matchedPlan ? (
        <Tooltip
          content={`Linked lesson plan: ${matchedPlan.title} (#${matchedPlan.id})`}
          tooltipClassName="whitespace-normal max-w-[16rem] text-left"
        >
          <p className="cursor-help text-xs font-semibold text-ais-primary">
            Session {sessionNumber}{sessionTopic ? `: ${sessionTopic}` : ''}
          </p>
        </Tooltip>
      ) : (
        <p className="text-xs font-semibold text-ais-error">Not planned / linked</p>
      )}

      <div className="flex flex-wrap gap-1">
        <AisStatusBadge variant={attendanceTaken ? 'success' : 'neutral'} className="!text-[10px]">
          {attendanceTaken ? 'Attendance recorded' : 'Attendance pending'}
        </AisStatusBadge>
        <AisStatusBadge variant={delivered ? 'success' : 'neutral'} className="!text-[10px]">
          {delivered ? 'Delivered' : 'Not delivered'}
        </AisStatusBadge>
      </div>
    </div>
  );
}

export const TeacherTimetableTab: React.FC = () => {
  const { teachers, currentUser, lessonPlans, teachingNotes, lessonDeliveries, attendance, academicCalendars } =
    useApp();
  const teacher = getDemoTeacher(teachers, currentUser?.email, currentUser?.displayName);

  const [grade, setGrade] = useState('All');
  const [section, setSection] = useState('All');
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void api
      .myTimetable()
      .then((rows) => setSlots(rows.map(mapTimetableSlotRow)))
      .catch(() => setSlots([]))
      .finally(() => setLoading(false));
  }, []);

  const filteredSlots = useMemo(
    () =>
      slots.filter((s) => {
        if (grade !== 'All' && normalizeGradeLabel(s.grade) !== normalizeGradeLabel(grade)) return false;
        if (section !== 'All' && s.section !== section) return false;
        return true;
      }),
    [slots, grade, section],
  );

  // The single source of truth for "which week is it" — the Monday of the current
  // calendar week. Every lesson plan / attendance / delivery lookup below keys off this
  // instead of re-deriving the week from today's date independently in three places.
  const mondayIso = useMemo(() => mondayOfWeekIso(), []);

  // Which week is it — resolved from the school's own published academic calendar, the
  // same source every annual/weekly plan's week boundaries are built from, so the label
  // here always agrees with what a plan generated "for this week" actually means.
  const publishedCalendar = useMemo(
    () =>
      academicCalendars.find((c) => c.status === 'Published' && c.schoolId === (currentUser?.schoolId ?? teacher.schoolId)) ??
      academicCalendars.find((c) => c.status === 'Published') ??
      null,
    [academicCalendars, currentUser, teacher],
  );

  const currentWeekRow = useMemo(() => {
    // buildTeachingWeeksFromCalendar already falls back to the standard MOE calendar
    // when no school-specific calendar is published, exactly like annual plan
    // generation elsewhere — so this still resolves a real week, not a blank state.
    const { weeks } = buildTeachingWeeksFromCalendar({ periodsPerWeek: 5, calendar: publishedCalendar });
    return findWeekForDate(weeks, mondayIso);
  }, [publishedCalendar, mondayIso]);

  const currentWeekLabel = currentWeekRow
    ? `${currentWeekRow.month} ${weekNumberLabel(currentWeekRow.week)}`
    : null;

  const enrichedByKey = useMemo(() => {
    const map = new Map<string, EnrichedSlot>();
    for (const slot of filteredSlots) {
      const occurrenceDate = timetableSlotOccurrenceDate(slot, mondayIso);
      const sessionNumber = sessionNumberForSlot(slot, slots);

      // Feed 1: lesson plan dates — the weekly plan this teacher actually generated for
      // this class, matched by real calendar week (not just "most recent"), so a plan
      // written for a different week never gets shown as this week's teaching material.
      const matchedPlan =
        lessonPlans.find((p) => {
          if (p.planType === 'yearly') return false;
          if (String(p.teacherId) !== String(teacher.id)) return false;
          if (p.status === 'Rejected') return false;
          if (normalizeGradeLabel(p.grade) !== normalizeGradeLabel(slot.grade)) return false;
          if (!subjectMatches(p.subject, slot.subject)) return false;
          const detail = parseWeeklyPlanDetail(p) as
            | (AIDetailedLessonPlanResult & { calendarWeek?: { startDateIso?: string } })
            | null;
          return detail?.calendarWeek?.startDateIso === mondayIso;
        }) ?? null;

      const sessionTopic = matchedPlan
        ? getWeeklyPlanSessionTopicOptions(matchedPlan).find((o) => o.value === String(sessionNumber))
            ?.topic ?? null
        : null;

      // Feed 2: attendance sessions — was attendance actually recorded for this exact
      // scheduled occurrence (same slot, same calendar date), not just "sometime".
      const attendanceTaken = attendance.some(
        (a) => a.timetableSlotId === slot.id && a.date === occurrenceDate,
      );

      // Feed 3: lesson delivery records — did a teaching note for this session of this
      // plan actually get marked delivered.
      const linkedNote = matchedPlan
        ? teachingNotes.find(
            (n) =>
              n.lessonPlanId === matchedPlan.id &&
              (n.sessionScope === String(sessionNumber) || n.sessionScope === 'all'),
          )
        : undefined;
      const delivered = linkedNote
        ? lessonDeliveries.some((d) => d.teachingNoteId === linkedNote.id)
        : false;

      map.set(slot.id, {
        slot,
        occurrenceDate,
        sessionNumber,
        matchedPlan: matchedPlan ? { id: matchedPlan.id, title: matchedPlan.title } : null,
        sessionTopic,
        attendanceTaken,
        delivered,
      });
    }
    return map;
  }, [filteredSlots, slots, mondayIso, lessonPlans, teacher.id, attendance, teachingNotes, lessonDeliveries]);

  // Every distinct weekly plan linked to a session this week, by exact title + id — a
  // teacher with several classes can have more than one plan active for the same week.
  const linkedPlansThisWeek = useMemo(() => {
    const byId = new Map<string, { id: string; title: string }>();
    for (const enriched of enrichedByKey.values()) {
      if (enriched.matchedPlan) byId.set(enriched.matchedPlan.id, enriched.matchedPlan);
    }
    return [...byId.values()];
  }, [enrichedByKey]);

  const timeRows = useMemo(
    () => [...new Set(filteredSlots.map((s) => `${s.startTime}–${s.endTime}`))].sort(),
    [filteredSlots],
  );

  const slotFor = (time: string, dow: number) =>
    filteredSlots.find((s) => `${s.startTime}–${s.endTime}` === time && s.dayOfWeek === dow);

  return (
    <AisPage>
      <div className="grid max-w-md grid-cols-1 gap-4 sm:grid-cols-2">
        <Select
          variant="ais"
          label="Grade"
          options={[{ value: 'All', label: 'All grades' }, ...GRADE_OPTIONS.map((g) => ({ value: g, label: g }))]}
          value={grade}
          onChange={(e) => setGrade(e.target.value)}
        />
        <Select
          variant="ais"
          label="Section"
          options={SECTION_FILTER_OPTIONS.map((s) => ({ value: s, label: s === 'All' ? 'All sections' : `Section ${s}` }))}
          value={section}
          onChange={(e) => setSection(e.target.value)}
        />
      </div>

      <div className="rounded-xl border border-ais-card-border bg-ais-primary/5 p-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-ais-primary">Current week</p>
        <p className="mt-0.5 text-sm font-semibold text-ais-on-surface">
          {currentWeekLabel ?? 'Today is outside the instructional calendar (holiday / break / not yet started)'}
          {' — ('}
          {linkedPlansThisWeek.length > 0
            ? linkedPlansThisWeek.map((p) => `${p.title} · #${p.id}`).join('; ')
            : 'No weekly plan linked yet'}
          {')'}
        </p>
      </div>

      <AisPanel
        title="This week's teaching timetable"
        description="Each session shows the weekly lesson plan due to be taught this week, which session number it is, and whether attendance and delivery are already recorded for it."
        flush
      >
        <AisTable>
          <AisTableHead>
            <AisTh>Time block</AisTh>
            {WEEKDAY_COLUMNS.map((d) => (
              <AisTh key={d.dow}>{d.label}</AisTh>
            ))}
          </AisTableHead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-ais-on-surface-variant">
                  Loading your scheduled sessions…
                </td>
              </tr>
            )}
            {!loading && timeRows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-ais-on-surface-variant">
                  No scheduled sessions for this grade/section.
                </td>
              </tr>
            )}
            {timeRows.map((time) => (
              <AisTr key={time}>
                <AisTd className="whitespace-nowrap bg-ais-surface-container-low/40 font-mono text-xs font-bold text-ais-primary">
                  {time}
                </AisTd>
                {WEEKDAY_COLUMNS.map((d) => {
                  const slot = slotFor(time, d.dow);
                  return (
                    <AisTd key={d.dow}>
                      <SlotCell enriched={slot ? enrichedByKey.get(slot.id) : undefined} />
                    </AisTd>
                  );
                })}
              </AisTr>
            ))}
          </tbody>
        </AisTable>
      </AisPanel>
    </AisPage>
  );
};
