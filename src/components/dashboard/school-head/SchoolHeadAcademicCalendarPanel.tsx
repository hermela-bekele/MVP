'use client';

import React, { useMemo, useState } from 'react';
import { Pencil, Send, CalendarPlus, Sparkles, Save } from 'lucide-react';
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
import type { AcademicCalendarEvent } from '@/lib/mockData';
import { toast } from '@/components/ui/toast';

type Phase = 'view-moe' | 'editing' | 'generated';
type CalendarSource = 'moe' | 'school';

export const SchoolHeadAcademicCalendarPanel: React.FC<{
  onActionsChange?: (actions: React.ReactNode) => void;
}> = ({ onActionsChange }) => {
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
  const [pendingEvents, setPendingEvents] = useState<AcademicCalendarEvent[] | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const latestDraft = useMemo(
    () => academicCalendars.find((c) => c.status === 'Draft'),
    [academicCalendars],
  );
  const published = useMemo(
    () => academicCalendars.filter((c) => c.status === 'Published'),
    [academicCalendars],
  );
  const latestDraftId = latestDraft?.id ?? null;

  const [hydratedDraftId, setHydratedDraftId] = useState<string | null>(null);
  if (
    latestDraft?.events?.length &&
    !pendingEvents &&
    hydratedDraftId !== latestDraft.id
  ) {
    setHydratedDraftId(latestDraft.id);
    setIsSaved(true);
    setEditingId(latestDraft.id);
    setSchoolTitle(latestDraft.title);
    setPhase((p) => (p === 'view-moe' ? 'generated' : p));
  }

  const schoolEvents = useMemo(() => {
    if (pendingEvents?.length) return pendingEvents;
    if (latestDraft?.events?.length) return latestDraft.events;
    if (published[0]?.events?.length) return published[0].events;
    return [];
  }, [pendingEvents, latestDraft, published]);

  const schoolReady = schoolEvents.length > 0 || phase === 'generated';
  const showToggle = isSaved && phase !== 'editing';

  const activeEvents = calendarSource === 'school' && schoolEvents.length > 0 ? schoolEvents : moeEvents;

  const buildSchoolEvents = React.useCallback(() => {
    const marked = assignmentsToEvents(assignments);
    return [
      ...moeEvents,
      ...marked.filter(
        (m) =>
          !moeEvents.some(
            (e) => e.startDate === m.startDate && e.endDate === m.endDate && e.label === m.label,
          ),
      ),
    ].sort((a, b) => a.startDate.localeCompare(b.startDate));
  }, [assignments, moeEvents]);

  const handleCreateSchoolCalendar = React.useCallback(() => {
    setPhase('editing');
    setCalendarSource('moe');
    if (latestDraft?.events?.length) {
      setAssignments(eventsToAssignments(latestDraft.events));
      setEditingId(latestDraft.id);
      setSchoolTitle(latestDraft.title);
    } else if (pendingEvents?.length) {
      setAssignments(eventsToAssignments(pendingEvents));
    } else {
      setAssignments([]);
      setEditingId(null);
    }
    toast({
      title: 'Editing school calendar',
      description: 'Click days on the MOE calendar to assign events.',
      variant: 'info',
    });
  }, [latestDraft, pendingEvents]);

  const upsertAssignment = (next: DayAssignment) => {
    setAssignments((prev) => {
      const without = prev.filter((a) => a.date !== next.date);
      return [...without, next].sort((a, b) => a.date.localeCompare(b.date));
    });
    toast({
      title: 'Event assigned',
      description: next.label || 'Day marked on the calendar.',
      variant: 'success',
      durationMs: 2800,
    });
  };

  const clearAssignment = (iso: string) => {
    setAssignments((prev) => prev.filter((a) => a.date !== iso));
    toast({
      title: 'Event removed',
      description: 'Assignment cleared from this day.',
      variant: 'info',
      durationMs: 2800,
    });
  };

  const handleGenerate = React.useCallback(() => {
    const events = buildSchoolEvents();
    setPendingEvents(events);
    setPhase('generated');
    setCalendarSource('school');
    setIsDirty(true);
    toast({
      title: 'School calendar generated',
      description: 'Review the calendar, then save or publish.',
      variant: 'success',
    });
  }, [buildSchoolEvents]);

  const persistCalendar = React.useCallback(
    (events: AcademicCalendarEvent[]): string => {
      if (editingId) {
        updateAcademicCalendar(editingId, {
          title: schoolTitle,
          academicYear: MOE_ACADEMIC_YEAR_EC,
          moeReference: MOE_REFERENCE,
          events,
        });
        return editingId;
      }
      const id = createAcademicCalendar({
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
      setEditingId(id);
      return id;
    },
    [editingId, schoolTitle, assignments, updateAcademicCalendar, createAcademicCalendar],
  );

  const handleSave = React.useCallback(() => {
    const events = pendingEvents?.length ? pendingEvents : buildSchoolEvents();
    setPendingEvents(events);
    persistCalendar(events);
    setIsSaved(true);
    setIsDirty(false);
    setPhase('generated');
    setCalendarSource('school');
  }, [pendingEvents, buildSchoolEvents, persistCalendar]);

  const handleEdit = React.useCallback(() => {
    const sourceEvents = pendingEvents?.length
      ? pendingEvents
      : latestDraft?.events ?? published[0]?.events;
    if (sourceEvents?.length) {
      setAssignments(eventsToAssignments(sourceEvents));
    }
    if (latestDraft) {
      setEditingId(latestDraft.id);
      setSchoolTitle(latestDraft.title);
    }
    setPhase('editing');
    setCalendarSource('moe');
    toast({
      title: 'Edit mode',
      description: 'Re-assign events on the MOE calendar, then generate again.',
      variant: 'info',
    });
  }, [pendingEvents, latestDraft, published]);

  const handlePublish = React.useCallback(() => {
    const events = pendingEvents?.length ? pendingEvents : schoolEvents;
    if (!events.length) return;

    let draftId = editingId ?? latestDraftId;
    if (isDirty || !draftId) {
      setPendingEvents(events);
      draftId = persistCalendar(events);
      setIsSaved(true);
      setIsDirty(false);
    }

    if (draftId) publishAcademicCalendar(draftId);
    setPhase('generated');
    setCalendarSource('school');
  }, [
    pendingEvents,
    schoolEvents,
    isDirty,
    latestDraftId,
    editingId,
    persistCalendar,
    publishAcademicCalendar,
  ]);

  const handleCancelEdit = React.useCallback(() => {
    setPhase(schoolReady ? 'generated' : 'view-moe');
    setCalendarSource(schoolReady ? 'school' : 'moe');
  }, [schoolReady]);

  React.useEffect(() => {
    if (!onActionsChange) return;

    let actions: React.ReactNode = null;
    if (phase === 'editing') {
      actions = (
        <>
          <Button variant="outline" size="sm" onClick={handleCancelEdit} className="whitespace-nowrap">
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleGenerate}
            leftIcon={<Sparkles className="h-4 w-4" />}
            className="whitespace-nowrap"
          >
            Generate school calendar
          </Button>
        </>
      );
    } else if (schoolReady && calendarSource === 'school') {
      actions = (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={handleEdit}
            leftIcon={<Pencil className="h-4 w-4" />}
            className="whitespace-nowrap"
          >
            Edit
          </Button>
          {(!isSaved || isDirty) && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSave}
              leftIcon={<Save className="h-4 w-4" />}
              className="whitespace-nowrap"
            >
              Save
            </Button>
          )}
          <Button
            variant="organic"
            size="sm"
            onClick={handlePublish}
            leftIcon={<Send className="h-4 w-4" />}
            className="whitespace-nowrap"
          >
            Publish
          </Button>
        </>
      );
    } else if (
      (phase === 'view-moe' && !schoolReady) ||
      (schoolReady && calendarSource === 'moe')
    ) {
      actions = (
        <Button
          size="sm"
          onClick={handleCreateSchoolCalendar}
          leftIcon={<CalendarPlus className="h-4 w-4" />}
          className="whitespace-nowrap"
        >
          Create school calendar
        </Button>
      );
    }

    onActionsChange(actions);
  }, [
    onActionsChange,
    phase,
    schoolReady,
    calendarSource,
    isSaved,
    isDirty,
    handleCreateSchoolCalendar,
    handleGenerate,
    handleEdit,
    handleSave,
    handlePublish,
    handleCancelEdit,
  ]);

  React.useEffect(() => {
    return () => onActionsChange?.(null);
  }, [onActionsChange]);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* MOE / School toggle — available after save */}
      {showToggle && (
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
                  ? 'bg-primary text-primary-foreground shadow-sm'
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
                  ? 'bg-primary text-primary-foreground shadow-sm'
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
            Click days on the MOE calendar to assign events, then generate.
          </p>
        </div>
      )}

      {/* Calendar fills page + side color key */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_220px] gap-5 items-start">
        <MonthCalendarBlock
          key={calendarSource}
          events={activeEvents}
          assignments={phase === 'editing' ? assignments : []}
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
        {calendarSource === 'school' && published.length > 0 && phase !== 'editing' && (
          <p className="text-xs text-muted-foreground text-center">
            Published to teachers, department heads, students, and parents.
          </p>
        )}
      </div>

      <p className="sr-only">{MOE_REFERENCE}</p>
      <p className="sr-only">{MOE_ACADEMIC_YEAR_TITLE}</p>
    </div>
  );
};
