'use client';

import React, { useMemo, useState } from 'react';
import { Pencil, Send, Sparkles, Save } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  buildMoeCalendarEvents,
  getMoeCalendarBounds,
} from '@/lib/moeCalendarData';
import type { AcademicCalendarEvent } from '@/lib/mockData';
import { toast } from '@/components/ui/toast';

type Phase = 'editing' | 'generated';

export const MoeAcademicCalendarPanel: React.FC<{
  onActionsChange?: (actions: React.ReactNode) => void;
}> = ({ onActionsChange }) => {
  const { moeCalendar, saveMoeCalendarDraft, disseminateMoeCalendar } = useApp();

  const baseEvents = useMemo(() => buildMoeCalendarEvents(), []);
  const bounds = useMemo(() => getMoeCalendarBounds(), []);

  const [phase, setPhase] = useState<Phase>(moeCalendar ? 'generated' : 'editing');
  const [title, setTitle] = useState(moeCalendar?.title ?? MOE_ACADEMIC_YEAR_TITLE);
  const [assignments, setAssignments] = useState<DayAssignment[]>(() =>
    moeCalendar?.events ? eventsToAssignments(moeCalendar.events) : [],
  );
  const [pendingEvents, setPendingEvents] = useState<AcademicCalendarEvent[] | null>(
    moeCalendar?.events ?? null,
  );
  const [isDirty, setIsDirty] = useState(false);

  const displayedEvents = phase === 'generated' && pendingEvents ? pendingEvents : baseEvents;

  const buildNationalEvents = React.useCallback(() => {
    const marked = assignmentsToEvents(assignments);
    return [
      ...baseEvents,
      ...marked.filter(
        (m) =>
          !baseEvents.some(
            (e) => e.startDate === m.startDate && e.endDate === m.endDate && e.label === m.label,
          ),
      ),
    ].sort((a, b) => a.startDate.localeCompare(b.startDate));
  }, [assignments, baseEvents]);

  const handleEdit = React.useCallback(() => {
    setPhase('editing');
    toast({
      title: 'Editing national calendar',
      description: 'Click days on the calendar to assign or adjust circular events.',
      variant: 'info',
    });
  }, []);

  const upsertAssignment = (next: DayAssignment) => {
    setAssignments((prev) => {
      const without = prev.filter((a) => a.date !== next.date);
      return [...without, next].sort((a, b) => a.date.localeCompare(b.date));
    });
    setIsDirty(true);
  };

  const clearAssignment = (iso: string) => {
    setAssignments((prev) => prev.filter((a) => a.date !== iso));
    setIsDirty(true);
  };

  const handleGenerate = React.useCallback(() => {
    const events = buildNationalEvents();
    setPendingEvents(events);
    setPhase('generated');
    toast({
      title: 'National calendar generated',
      description: 'Review the calendar, then save or disseminate it to school heads.',
      variant: 'success',
    });
  }, [buildNationalEvents]);

  const handleSave = React.useCallback(() => {
    const events = pendingEvents ?? buildNationalEvents();
    saveMoeCalendarDraft(events, title, MOE_ACADEMIC_YEAR_EC);
    setPendingEvents(events);
    setIsDirty(false);
  }, [pendingEvents, buildNationalEvents, saveMoeCalendarDraft, title]);

  const handleDisseminate = React.useCallback(() => {
    const events = pendingEvents ?? buildNationalEvents();
    saveMoeCalendarDraft(events, title, MOE_ACADEMIC_YEAR_EC);
    disseminateMoeCalendar();
    setPendingEvents(events);
    setIsDirty(false);
    setPhase('generated');
  }, [pendingEvents, buildNationalEvents, saveMoeCalendarDraft, disseminateMoeCalendar, title]);

  React.useEffect(() => {
    if (!onActionsChange) return;

    let actions: React.ReactNode = null;
    if (phase === 'editing') {
      actions = (
        <Button
          size="sm"
          onClick={handleGenerate}
          leftIcon={<Sparkles className="h-4 w-4" />}
          className="whitespace-nowrap"
        >
          Generate calendar
        </Button>
      );
    } else {
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
          {(!moeCalendar || isDirty) && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSave}
              leftIcon={<Save className="h-4 w-4" />}
              className="whitespace-nowrap"
            >
              Save draft
            </Button>
          )}
          <Button
            variant="organic"
            size="sm"
            onClick={handleDisseminate}
            leftIcon={<Send className="h-4 w-4" />}
            className="whitespace-nowrap"
          >
            Disseminate to school heads
          </Button>
        </>
      );
    }

    onActionsChange(actions);
  }, [
    onActionsChange,
    phase,
    moeCalendar,
    isDirty,
    handleEdit,
    handleGenerate,
    handleSave,
    handleDisseminate,
  ]);

  React.useEffect(() => {
    return () => onActionsChange?.(null);
  }, [onActionsChange]);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        {phase === 'editing' ? (
          <div className="flex-1 max-w-md space-y-1">
            <label className="text-xs font-semibold">National calendar title</label>
            <input
              className="w-full h-10 px-3 rounded-lg border border-border text-sm bg-white"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
        ) : (
          <div>
            <h3 className="text-sm font-bold text-title">{title}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {moeCalendar?.status === 'Published'
                ? 'Disseminated — school heads see this as their MOE reference calendar.'
                : 'Draft — not yet disseminated to school heads.'}
            </p>
          </div>
        )}
        {moeCalendar?.status === 'Published' && (
          <Badge variant="success" badgeStyle="subtle" size="sm" className="shrink-0">
            Disseminated
          </Badge>
        )}
      </div>

      {phase === 'editing' && (
        <p className="text-xs text-muted-foreground">
          Click days on the calendar to assign or adjust circular events, then generate.
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_220px] gap-5 items-start">
        <MonthCalendarBlock
          key={phase}
          events={displayedEvents}
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

      <div className="pt-2">
        <WorkingDaysAnalysis />
      </div>
    </div>
  );
};
