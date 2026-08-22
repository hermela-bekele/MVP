'use client';

import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  BadgeCheck,
  BarChart3,
  CalendarDays,
  MapPin,
  Phone,
  TrendingUp,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Avatar } from '@/components/ui/avatar';
import {
  filterTeacherStudents,
  avgAttendanceForStudents,
  avgGpaForStudents,
  TEACHER_CLASS_ASSIGNMENTS,
  dispatchTeacherQuickAction,
} from '@/lib/teacherPortal';
import type { Student } from '@/lib/mockData';
import {
  aisActivityAlertRow,
  aisActivityPanel,
  aisActivityPanelHeader,
  aisActivityScroll,
  aisActivityStudentRow,
  aisBadgeSuccess,
  aisBadgeWarning,
  aisBodyMd,
  aisBodySm,
  aisBtnGhost,
  aisBtnGhostMuted,
  aisCard,
  aisDataLg,
  aisDataMd,
  aisDisplayMd,
  aisHeadlineSm,
  aisKpiCard,
  aisKpiLabel,
  aisKpiPill,
  aisKpiPillError,
  aisKpiPillSuccess,
  aisKpiValue,
  aisLabelCaps,
  aisPage,
  aisScheduleFilterBtn,
  aisScheduleFilterBtnActive,
  aisScheduleFilterBtnInactive,
  aisScheduleListRow,
  aisSchedulePanel,
} from '@/components/dashboard/teacher/aisStyles';

const iconSm = 'h-3.5 w-3.5 shrink-0';
const iconMd = 'h-4 w-4 shrink-0';

function isAtRisk(student: Student) {
  return student.attendanceRate < 90 || student.gpa < 2.5;
}

function periodLabel(period: string, index: number) {
  const match = period.match(/(\d{2}:\d{2})/);
  if (match) return `Period ${index + 1}`;
  return period.split('–')[0]?.trim() ?? `Block ${index + 1}`;
}

type ScheduleDay = 'yesterday' | 'today' | 'tomorrow';

const SCHEDULE_DAY_OFFSET: Record<ScheduleDay, number> = {
  yesterday: -1,
  today: 0,
  tomorrow: 1,
};

function scheduleDateForDay(day: ScheduleDay) {
  const date = new Date();
  date.setDate(date.getDate() + SCHEDULE_DAY_OFFSET[day]);
  return date;
}

function weekdayAbbr(date: Date) {
  return date.toLocaleDateString('en-US', { weekday: 'short' });
}

function formatScheduleDate(date: Date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function assignmentOnWeekday(days: string, weekday: string) {
  return days.split('/').some((d) => d.trim().startsWith(weekday));
}

function ScheduleSection({
  studentsForClass,
}: {
  studentsForClass: (grade: string, section: string) => Student[];
}) {
  const [scheduleDay, setScheduleDay] = useState<ScheduleDay>('today');

  const filteredAssignments = useMemo(() => {
    const target = weekdayAbbr(scheduleDateForDay(scheduleDay));
    return TEACHER_CLASS_ASSIGNMENTS.filter((a) => assignmentOnWeekday(a.days, target));
  }, [scheduleDay]);

  const dayFilters: { id: ScheduleDay; label: string }[] = [
    { id: 'yesterday', label: 'Yesterday' },
    { id: 'today', label: 'Today' },
    { id: 'tomorrow', label: 'Tomorrow' },
  ];

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <div className="mb-6 flex w-full items-center justify-between gap-4">
        <SectionTitle icon={CalendarDays} className="mb-0">
          Today&apos;s Schedule
        </SectionTitle>
        <button
          type="button"
          className={aisBtnGhost}
          onClick={() => dispatchTeacherQuickAction('timetable')}
        >
          <CalendarDays className={iconMd} aria-hidden />
          View full calendar
        </button>
      </div>

      <div className={aisSchedulePanel}>
        <div className="flex min-h-0 flex-1">
          <div className="flex w-[7.5rem] shrink-0 flex-col gap-1 border-r border-border bg-muted/40 p-3">
            {dayFilters.map(({ id, label }) => {
              const active = scheduleDay === id;
              const date = scheduleDateForDay(id);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setScheduleDay(id)}
                  className={`${aisScheduleFilterBtn} ${
                    active ? aisScheduleFilterBtnActive : aisScheduleFilterBtnInactive
                  }`}
                >
                  <span className="block">{label}</span>
                  <span
                    className={`mt-0.5 block text-[10px] font-medium ${
                      active ? 'text-primary/70' : 'text-muted-foreground'
                    }`}
                  >
                    {formatScheduleDate(date)}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="scrollbar-none min-h-0 flex-1 overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {filteredAssignments.length === 0 ? (
              <p className={`${aisBodyMd} px-4 py-8 text-center`}>
                No classes scheduled for {scheduleDay}.
              </p>
            ) : (
              filteredAssignments.map((a, idx) => {
                const classStudents = studentsForClass(a.grade, a.section);
                const visible = classStudents.slice(0, 3);
                const overflow = Math.max(0, classStudents.length - 3);
                return (
                  <div key={a.id} className={aisScheduleListRow}>
                    <div className="min-w-[5.5rem] shrink-0">
                      <p className={`${aisLabelCaps} text-primary`}>
                        {periodLabel(a.period, idx)}
                      </p>
                      <p className={`${aisBodySm} mt-0.5 tabular-nums`}>{a.period}</p>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={aisDataMd}>
                        {a.grade} · Section {a.section}
                      </p>
                      <p className={`${aisBodyMd} flex items-center gap-1.5`}>
                        <MapPin className={iconSm} aria-hidden />
                        {a.subject} · {a.room}
                      </p>
                    </div>
                    <div className="flex shrink-0 -space-x-2">
                      {visible.map((s) => (
                        <Avatar key={s.id} name={s.name} title={s.name} size="xs" className="ring-2 ring-white rounded-full" />
                      ))}
                      {overflow > 0 && (
                        <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-muted text-[9px] font-bold text-muted-foreground">
                          +{overflow}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function SectionTitle({
  icon: Icon,
  children,
  className = 'mb-6',
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h3 className={`${aisDisplayMd} flex items-center gap-2 ${className}`}>
      <Icon className="h-5 w-5 shrink-0 text-primary" aria-hidden />
      {children}
    </h3>
  );
}

function KpiCard({
  label,
  value,
  pill,
  pillVariant = 'neutral',
  valueIcon,
  icon: Icon,
  accent = 'primary',
}: {
  label: string;
  value: React.ReactNode;
  pill?: React.ReactNode;
  pillVariant?: 'neutral' | 'success' | 'error';
  valueIcon?: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
  accent?: 'primary' | 'error';
}) {
  const pillClass =
    pillVariant === 'success'
      ? aisKpiPillSuccess
      : pillVariant === 'error'
        ? aisKpiPillError
        : aisKpiPill;

  return (
    <div className={aisKpiCard}>
      <div
        className={
          pill
            ? 'grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2'
            : 'flex items-center'
        }
      >
        <p
          className={`${aisKpiLabel} flex min-w-0 items-center gap-2 ${
            accent === 'error' ? '!text-destructive' : ''
          }`}
        >
          <Icon className="h-4 w-4 shrink-0" aria-hidden />
          <span className="truncate">{label}</span>
        </p>
        {pill && <span className={`${pillClass} justify-self-end`}>{pill}</span>}
      </div>
      <div className="mt-4 flex items-end gap-2">
        <span
          className={`${aisKpiValue} ${accent === 'error' ? 'text-destructive' : ''}`}
        >
          {value}
        </span>
        {valueIcon && <div className="mb-1 shrink-0">{valueIcon}</div>}
      </div>
    </div>
  );
}

export const TeacherDashboard: React.FC = () => {
  const { students } = useApp();

  const roster = useMemo(() => filterTeacherStudents(students), [students]);
  const [dismissedAlertIds, setDismissedAlertIds] = useState<Set<string>>(new Set());

  const atRisk = roster.filter(isAtRisk).filter((s) => !dismissedAlertIds.has(s.id));
  const avgGpa = avgGpaForStudents(roster);
  const avgAtt = avgAttendanceForStudents(roster);

  const gradeBands = useMemo(() => {
    const g9 = roster.filter((s) => s.grade === 'Grade 9');
    const g10 = roster.filter((s) => s.grade === 'Grade 10');
    return [
      { label: 'Grade 9', students: g9, avg: avgGpaForStudents(g9) },
      { label: 'Grade 10', students: g10, avg: avgGpaForStudents(g10) },
    ];
  }, [roster]);

  const studentsForClass = (grade: string, section: string) =>
    roster.filter((s) => s.grade === grade && s.section === section);

  return (
    <div className={aisPage}>
      <section className="mb-8 grid w-full grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Total Students"
          value={roster.length}
          pill="Grades 9–10"
          icon={Users}
        />
        <KpiCard
          label="Average GPA"
          value={avgGpa.toFixed(2)}
          valueIcon={
            <TrendingUp className="h-5 w-5 text-success" aria-hidden />
          }
          icon={TrendingUp}
        />
        <KpiCard
          label="Attendance"
          value={`${avgAtt}%`}
          pill="Target 90%"
          icon={UserCheck}
        />
        <KpiCard
          label="At-Risk"
          value={atRisk.length}
          pill="Action req."
          pillVariant="error"
          icon={AlertTriangle}
          accent="error"
        />
      </section>

      <div className="grid w-full grid-cols-1 items-stretch gap-8 lg:grid-cols-3">
          <div className="flex flex-col gap-8 lg:col-span-2">
            <section>
              <SectionTitle icon={BarChart3}>Academic Performance</SectionTitle>
              <div className={`${aisCard} space-y-6 p-4`}>
                {gradeBands.map((band) => {
                  const barWidth = Math.min(100, (band.avg / 4) * 100);
                  return (
                    <div key={band.label} className="space-y-2">
                      <div className="flex items-end justify-between gap-4">
                        <div>
                          <span className={aisHeadlineSm}>{band.label}</span>
                          <p className={aisBodySm}>{band.students.length} students enrolled</p>
                        </div>
                        <span className={aisDataLg}>
                          {band.avg.toFixed(2)}{' '}
                          <span className={`${aisBodySm} font-normal`}>GPA</span>
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-sm bg-muted">
                        <div
                          className="progress-bar-fill h-full rounded-sm bg-primary"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <ScheduleSection studentsForClass={studentsForClass} />
          </div>

          <section className="lg:col-start-3 lg:row-start-1">
            <div className={aisActivityPanel}>
              <div className={aisActivityPanelHeader}>
                <SectionTitle icon={Users} className="mb-0">
                  Student Activity
                </SectionTitle>
              </div>

              <div className={aisActivityScroll}>
              {atRisk.length === 0 ? (
                <div className="flex items-center gap-2 py-2">
                  <BadgeCheck className={iconMd} aria-hidden />
                  <span className={aisBodyMd}>No critical alerts in your sections.</span>
                </div>
              ) : (
                atRisk.map((s) => {
                  const reason =
                    s.attendanceRate < 90 ? 'low attendance' : 'low GPA';
                  return (
                    <div
                      key={s.id}
                      className={`${aisActivityAlertRow} flex flex-wrap items-center justify-between gap-x-3 gap-y-1`}
                    >
                      <p className={`${aisBodyMd} min-w-0 !text-foreground`}>
                        <AlertCircle
                          className="-mt-px mr-1 inline h-3.5 w-3.5 shrink-0 align-middle text-destructive"
                          aria-hidden
                        />
                        <span className="font-medium text-foreground">{s.name}</span>
                        <span className="text-muted-foreground">
                          {' '}
                          · GPA {s.gpa.toFixed(2)} · {s.attendanceRate}% att. ·{' '}
                        </span>
                        <span className="font-medium text-destructive">{reason}</span>
                      </p>
                      <span className="inline-flex shrink-0 items-center gap-2">
                        <a href={`tel:${s.parentPhone}`} className={`${aisBtnGhost} !text-destructive`}>
                          <Phone className="h-3 w-3" aria-hidden />
                          Call
                        </a>
                        <button
                          type="button"
                          className={aisBtnGhostMuted}
                          onClick={() => setDismissedAlertIds((prev) => new Set(prev).add(s.id))}
                        >
                          <X className="h-3 w-3" aria-hidden />
                          Dismiss
                        </button>
                      </span>
                    </div>
                  );
                })
              )}

              {roster.slice(0, 5).map((s) => {
                const atRiskStudent = isAtRisk(s);
                return (
                  <div key={s.id} className={aisActivityStudentRow}>
                    <div className="mb-2 flex items-center gap-3">
                      <Avatar name={s.name} size="sm" className="shrink-0" />
                      <div className="min-w-0">
                        <p className={aisDataMd}>{s.name}</p>
                        <p className={aisBodySm}>
                          {s.grade} · Section {s.section}
                        </p>
                      </div>
                    </div>
                    <p className={`${aisBodyMd} mb-2`}>
                      {atRiskStudent
                        ? `GPA ${s.gpa.toFixed(2)} · Attendance ${s.attendanceRate}% — needs follow-up.`
                        : `Enrolled · GPA ${s.gpa.toFixed(2)} · ${s.attendanceRate}% attendance.`}
                    </p>
                    {atRiskStudent ? (
                      <span className={aisBadgeWarning}>
                        <AlertCircle className="h-3 w-3" aria-hidden />
                        GPA Alert
                      </span>
                    ) : (
                      <span className={aisBadgeSuccess}>
                        <UserCheck className="h-3 w-3" aria-hidden />
                        {s.status}
                      </span>
                    )}
                  </div>
                );
              })}
              </div>
            </div>
          </section>
      </div>
    </div>
  );
};
