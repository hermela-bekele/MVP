'use client';

import React, { useMemo, useState } from 'react';
import { Pencil, Send, CalendarPlus, Sparkles } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { MonthCalendarBlock } from '@/components/dashboard/MonthCalendarBlock';
import { CalendarColorLegend } from '@/components/dashboard/CalendarColorLegend';
import { WorkingDaysAnalysis } from '@/components/dashboard/WorkingDaysAnalysis';
import {
  assignmentsToEvents,
  eventsToAssignments,
  type DayAssignment,
} from '@/lib/calendarDayMarks';
import {
  MOE_ACADEMIC_YEAR_EC,
  MOE_ACADEMIC_YEAR_TITLE,
  MOE_REFERENCE,
  buildMoeCalendarEvents,
  getMoeCalendarBounds,
} from '@/lib/moeCalendarData';
import { formatEthiopianDate, formatGregorianDate } from '@/lib/ethiopianCalendar';

type Phase = 'view-moe' | 'editing' | 'generated';
type CalendarSource = 'moe' | 'school';

export const SchoolHeadAcademicCalendarPanel: React.FC = () => {
  const {
    academicCalendars,
    createAcademicCalendar,
    updateAcademicCalendar,
    publishAcademicCalendar,
  } = useApp();

  const moeEvents = useMemo(() => buildMoeCalendarEvents(), []);
  const bounds = useMemo(() => getMoeCalendarBounds(), []);
  const [phase, setPhase] = useState<Phase>('view-moe');
  const [calendarSource, setCalendarSource] = useState<CalendarSource>('moe');
  const [assignments, setAssignments] = useState<DayAssignment[]>([]);
  const [schoolTitle, setSchoolTitle] = useState('Bole Secondary School Academic Calendar');
  const [editingId, setEditingId] = useState<string | null>(null);

  const latestDraft = academicCalendars.find((c) => c.status === 'Draft');
  const published = academicCalendars.filter((c) => c.status === 'Published');
  const schoolReady = Boolean(latestDraft?.events?.length) || phase === 'generated';

  const schoolEvents = useMemo(() => {
    if (latestDraft?.events?.length) return latestDraft.events;
    return [];
  }, [latestDraft]);

  const activeEvents = calendarSource === 'school' && schoolEvents.length > 0 ? schoolEvents : moeEvents;
  const showAssignments =
    phase === 'editing' || (calendarSource === 'school' && schoolEvents.length > 0);

  const handleCreateSchoolCalendar = () => {
    setPhase('editing');
    setCalendarSource('moe');
    if (latestDraft?.events?.length) {
      setAssignments(eventsToAssignments(latestDraft.events));
      setEditingId(latestDraft.id);
      setSchoolTitle(latestDraft.title);
    } else {
      setAssignments([]);
      setEditingId(null);
    }
  };

  const upsertAssignment = (next: DayAssignment) => {
    setAssignments((prev) => {
      const without = prev.filter((a) => a.date !== next.date);
      return [...without, next].sort((a, b) => a.date.localeCompare(b.date));
    });
  };

  const clearAssignment = (iso: string) => {
    setAssignments((prev) => prev.filter((a) => a.date !== iso));
  };

  const handleGenerate = () => {
    const marked = assignmentsToEvents(assignments);
    const events = [
      ...moeEvents,
      ...marked.filter(
        (m) =>
          !moeEvents.some(
            (e) => e.startDate === m.startDate && e.endDate === m.endDate && e.label === m.label,
          ),
      ),
    ].sort((a, b) => a.startDate.localeCompare(b.startDate));

    if (editingId) {
      updateAcademicCalendar(editingId, {
        title: schoolTitle,
        academicYear: MOE_ACADEMIC_YEAR_EC,
        moeReference: MOE_REFERENCE,
        events,
      });
    } else {
      createAcademicCalendar({
        academicYear: MOE_ACADEMIC_YEAR_EC,
        title: schoolTitle,
        moeReference: MOE_REFERENCE,
        quarters: 4,
        quarterBreakWeeks: 1,
        semesterBreakWeeks: 1,
        midExamCount: assignments.filter((a) => a.mark === 'mid-exam-start').length,
        midExamDays: 5,
        finalExamWeeks: 1,
        events,
      });
    }
    setPhase('generated');
    setCalendarSource('school');
  };

  const handleEdit = () => {
    const source = latestDraft ?? published[0];
    if (source) {
      setAssignments(eventsToAssignments(source.events));
      setEditingId(source.status === 'Draft' ? source.id : null);
      setSchoolTitle(source.title);
    }
    setPhase('editing');
    setCalendarSource('moe'); // edit marks on MOE base calendar
  };

  const handleDisseminate = () => {
    const draft = academicCalendars.find((c) => c.status === 'Draft');
    if (draft) publishAcademicCalendar(draft.id);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Top bar */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-teal-700">
            Academic calendar
          </p>
          <h2 className="text-xl font-bold text-foreground mt-1">
            {calendarSource === 'school' && schoolReady
              ? latestDraft?.title ?? schoolTitle
              : MOE_ACADEMIC_YEAR_TITLE}
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Academic year <span className="font-semibold text-foreground">{MOE_ACADEMIC_YEAR_EC}</span>
            {' · '}
            Nehase 2018 E.C. → Sene 2019 E.C.
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            <span className="font-semibold text-foreground">G.C.</span>{' '}
            {formatGregorianDate(bounds.start)} → {formatGregorianDate(bounds.end)}
            <span className="mx-2 text-border">·</span>
            <span className="font-semibold text-foreground">E.C.</span>{' '}
            {formatEthiopianDate(bounds.start)} → {formatEthiopianDate(bounds.end)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {phase === 'view-moe' && !schoolReady && (
            <Button onClick={handleCreateSchoolCalendar} className="gap-2">
              <CalendarPlus className="h-4 w-4" />
              Create school calendar
            </Button>
          )}
          {phase === 'view-moe' && schoolReady && calendarSource === 'moe' && (
            <Button onClick={handleCreateSchoolCalendar} className="gap-2">
              <CalendarPlus className="h-4 w-4" />
              Create school calendar
            </Button>
          )}
          {phase === 'editing' && (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setPhase(schoolReady ? 'generated' : 'view-moe');
                  setCalendarSource(schoolReady ? 'school' : 'moe');
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleGenerate} className="gap-2">
                <Sparkles className="h-4 w-4" />
                Generate school calendar
              </Button>
            </>
          )}
          {phase !== 'editing' && schoolReady && calendarSource === 'school' && (
            <>
              <Button variant="outline" onClick={handleEdit} className="gap-2">
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
              {latestDraft && (
                <Button variant="organic" onClick={handleDisseminate} className="gap-2">
                  <Send className="h-4 w-4" />
                  Disseminate
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* MOE / School toggle — available after generate */}
      {schoolReady && phase !== 'editing' && (
        <div className="flex justify-center sm:justify-start">
          <div
            role="tablist"
            aria-label="Calendar source"
            className="inline-flex rounded-full border border-border/70 bg-muted/40 p-1 shadow-sm"
          >
            <button
              type="button"
              role="tab"
              aria-selected={calendarSource === 'moe'}
              onClick={() => setCalendarSource('moe')}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                calendarSource === 'moe'
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              MOE calendar
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={calendarSource === 'school'}
              onClick={() => setCalendarSource('school')}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                calendarSource === 'school'
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              School calendar
            </button>
          </div>
        </div>
      )}

      {phase === 'editing' && (
        <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
          <div className="flex-1 max-w-md space-y-1">
            <label className="text-xs font-semibold">School calendar title</label>
            <input
              className="w-full h-10 px-3 rounded-lg border border-border text-sm bg-white"
              value={schoolTitle}
              onChange={(e) => setSchoolTitle(e.target.value)}
            />
          </div>
          <p className="text-xs text-muted-foreground pb-2">
            Click days on the MOE calendar to assign colors, then generate.
          </p>
        </div>
      )}

      {/* Calendar fills page + side color key */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_220px] gap-5 items-start">
        <MonthCalendarBlock
          key={calendarSource}
          events={activeEvents}
          assignments={showAssignments && phase === 'editing' ? assignments : []}
          interactive={phase === 'editing'}
          onAssignDay={upsertAssignment}
          onClearDay={clearAssignment}
          minDate={bounds.start}
          maxDate={bounds.end}
          showLegend={false}
          fill
        />
        <CalendarColorLegend className="lg:min-w-[200px]" />
      </div>

      {/* Working days under MOE and school */}
      <div className="space-y-3 pt-2">
        <WorkingDaysAnalysis />
        {calendarSource === 'school' && schoolReady && published.length > 0 && phase !== 'editing' && (
          <p className="text-xs text-muted-foreground text-center">
            Disseminated to teachers, students, parents, and department heads.
          </p>
        )}
      </div>

      <p className="sr-only">{MOE_REFERENCE}</p>
    </div>
  );
};
