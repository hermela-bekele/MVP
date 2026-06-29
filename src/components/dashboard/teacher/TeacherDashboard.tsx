'use client';

import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  BadgeCheck,
  BarChart3,
  CalendarDays,
  FilePlus,
  FileText,
  MapPin,
  Phone,
  Plus,
  TrendingUp,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import {
  filterTeacherAssessments,
  filterTeacherStudents,
  avgAttendanceForStudents,
  avgGpaForStudents,
  TEACHER_CLASS_ASSIGNMENTS,
  getDemoTeacher,
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
  aisBtnPrimary,
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

function studentInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function avatarColor(id: string) {
  const hues = ['#004ac6', '#2563eb', '#0891b2', '#059669', '#7c3aed'];
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return hues[Math.abs(hash) % hues.length];
}

function isAtRisk(student: Student) {
  return student.attendanceRate < 90 || student.gpa < 2.5;
}

function statusForStudent(student: Student) {
  if (isAtRisk(student)) return 'warning' as const;
  return 'active' as const;
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
        <button type="button" className={aisBtnGhost}>
          <CalendarDays className={iconMd} aria-hidden />
          View full calendar
        </button>
      </div>

      <div className={aisSchedulePanel}>
        <div className="flex min-h-0 flex-1">
          <div className="flex w-[7.5rem] shrink-0 flex-col gap-1 border-r border-ais-card-border bg-ais-surface-container-low/40 p-3">
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
                      active ? 'text-ais-primary/70' : 'text-ais-on-surface-variant'
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
                      <p className={`${aisLabelCaps} text-ais-primary`}>
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
                        <div
                          key={s.id}
                          title={s.name}
                          className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white text-[9px] font-bold text-white"
                          style={{ background: avatarColor(s.id) }}
                        >
                          {studentInitials(s.name)}
                        </div>
                      ))}
                      {overflow > 0 && (
                        <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-ais-surface-container-low text-[9px] font-bold text-ais-on-surface-variant">
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
      <Icon className="h-5 w-5 shrink-0 text-ais-primary" aria-hidden />
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
            accent === 'error' ? '!text-ais-error' : ''
          }`}
        >
          <Icon className="h-4 w-4 shrink-0" aria-hidden />
          <span className="truncate">{label}</span>
        </p>
        {pill && <span className={`${pillClass} justify-self-end`}>{pill}</span>}
      </div>
      <div className="mt-4 flex items-end gap-2">
        <span
          className={`${aisKpiValue} ${accent === 'error' ? 'text-ais-error' : ''}`}
        >
          {value}
        </span>
        {valueIcon && <div className="mb-1 shrink-0">{valueIcon}</div>}
      </div>
    </div>
  );
}

export const TeacherDashboard: React.FC = () => {
  const { students, assessments, teachers } = useApp();
  const teacher = getDemoTeacher(teachers);

  const roster = useMemo(() => filterTeacherStudents(students), [students]);
  const asms = useMemo(() => filterTeacherAssessments(assessments), [assessments]);

  const atRisk = roster.filter(isAtRisk);
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
            <TrendingUp className="h-5 w-5 text-ais-success" aria-hidden />
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
                      <div className="h-2 w-full overflow-hidden rounded-sm bg-ais-surface-container-low">
                        <div
                          className="progress-bar-fill h-full rounded-sm bg-ais-primary"
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
                      <p className={`${aisBodyMd} min-w-0 !text-ais-on-surface`}>
                        <AlertCircle
                          className="-mt-px mr-1 inline h-3.5 w-3.5 shrink-0 align-middle text-ais-error"
                          aria-hidden
                        />
                        <span className="font-medium text-ais-on-surface">{s.name}</span>
                        <span className="text-ais-on-surface-variant">
                          {' '}
                          · GPA {s.gpa.toFixed(2)} · {s.attendanceRate}% att. ·{' '}
                        </span>
                        <span className="font-medium text-ais-error">{reason}</span>
                      </p>
                      <span className="inline-flex shrink-0 items-center gap-2">
                        <a href={`tel:${s.parentPhone}`} className={`${aisBtnGhost} !text-ais-error`}>
                          <Phone className="h-3 w-3" aria-hidden />
                          Call
                        </a>
                        <button type="button" className={aisBtnGhostMuted}>
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
                      <div
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                        style={{ background: avatarColor(s.id) }}
                      >
                        {studentInitials(s.name)}
                      </div>
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

          <section className="lg:col-span-3">
            <div className={`${aisCard} w-full overflow-hidden`}>
              <div className="flex flex-col gap-3 border-b border-ais-card-border p-4 sm:flex-row sm:items-center sm:justify-between">
                <h3 className={`${aisHeadlineSm} flex items-center gap-2`}>
                  <FileText className={iconMd} aria-hidden />
                  Student Reports Summary
                </h3>
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new Event('open-teacher-assessment'))}
                  className={aisBtnPrimary}
                >
                  <FilePlus className={iconMd} aria-hidden />
                  Create New Report
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="ais-table w-full border-collapse">
                  <thead>
                    <tr className="bg-ais-surface-container-low">
                      <th className={`${aisLabelCaps} px-4 py-2 text-left`}>Student</th>
                      <th className={`${aisLabelCaps} px-4 py-2 text-left`}>Grade / Section</th>
                      <th className={`${aisLabelCaps} px-4 py-2 text-left`}>GPA</th>
                      <th className={`${aisLabelCaps} px-4 py-2 text-left`}>Attendance</th>
                      <th className={`${aisLabelCaps} px-4 py-2 text-left`}>Pending</th>
                      <th className={`${aisLabelCaps} px-4 py-2 text-left`}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roster.map((s) => {
                      const status = statusForStudent(s);
                      const atRiskRow = isAtRisk(s);
                      return (
                        <tr
                          key={s.id}
                          className="border-b border-[#f1f5f9] transition-colors hover:bg-[#eff6ff]"
                        >
                          <td className="px-4 py-2 text-sm font-medium text-ais-on-surface">
                            {s.name}
                          </td>
                          <td className={`px-4 py-2 ${aisBodyMd}`}>
                            {s.grade} · {s.section}
                          </td>
                          <td
                            className={`px-4 py-2 text-sm font-medium tabular-nums ${
                              atRiskRow && s.gpa < 2.5
                                ? 'text-ais-error'
                                : 'text-ais-on-surface'
                            }`}
                          >
                            {s.gpa.toFixed(2)}
                          </td>
                          <td
                            className={`px-4 py-2 text-sm tabular-nums ${
                              atRiskRow && s.attendanceRate < 90
                                ? 'font-semibold text-ais-error'
                                : 'text-ais-on-surface'
                            }`}
                          >
                            {s.attendanceRate}%
                          </td>
                          <td className={`px-4 py-2 ${aisBodyMd}`}>
                            {asms.filter((a) => a.grade === s.grade).length} dept review
                          </td>
                          <td className="px-4 py-2">
                            {status === 'active' ? (
                              <span className={aisBadgeSuccess}>
                                <UserCheck className="h-3 w-3" aria-hidden />
                                Active
                              </span>
                            ) : (
                              <span className={aisBadgeWarning}>
                                <AlertCircle className="h-3 w-3" aria-hidden />
                                Warning
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
      </div>

      <button
        type="button"
        title={`Quick actions · ${teacher.name}`}
        onClick={() => window.dispatchEvent(new Event('open-teacher-grade-entry'))}
        className={`${aisBtnPrimary} fixed bottom-8 right-8 z-40 h-12 w-12 justify-center rounded-full p-0 shadow-[0_4px_12px_rgba(0,74,198,0.25)]`}
        aria-label="Record grade"
      >
        <Plus className="h-5 w-5" strokeWidth={2.5} aria-hidden />
      </button>
    </div>
  );
};
