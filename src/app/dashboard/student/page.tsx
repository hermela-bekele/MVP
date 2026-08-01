'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { readStoredSession } from '@/lib/auth';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { ContentCard } from '@/components/dashboard/ContentCard';
import { KpiWidget, KpiGrid } from '@/components/dashboard/KpiWidget';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { AnnouncementFeed } from '@/components/dashboard/announcements/AnnouncementFeed';
import { StudentFeedbackForm } from '@/components/dashboard/student/StudentFeedbackForm';
import { PublishedAcademicCalendarPanel } from '@/components/dashboard/PublishedAcademicCalendarPanel';
import { usePortalTab } from '@/lib/usePortalTab';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function StudentPortalPage() {
  const session = readStoredSession();
  const { activeTab: tab, setActiveTab: setTab } = usePortalTab('student');
  const [student, setStudent] = useState<Record<string, unknown> | null>(null);
  const [grades, setGrades] = useState<Record<string, unknown>[]>([]);
  const [practice, setPractice] = useState<Record<string, unknown>[]>([]);
  const [timetable, setTimetable] = useState<Record<string, unknown>[]>([]);
  const [announcements, setAnnouncements] = useState<Record<string, unknown>[]>([]);
  const [calendar, setCalendar] = useState<Record<string, unknown>[]>([]);
  const [docs, setDocs] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .portalChildren()
      .then(async (rows) => {
        const me = rows[0] || null;
        setStudent(me);
        if (!me) return;
        const id = String(me.id);
        const grade = String(me.grade);
        const section = String(me.section);
        const schoolId = String(me.school_id || session?.schoolId || '');
        const [g, p, t, d, a, cal] = await Promise.all([
          api.portalGrades(id).catch(() => []),
          api.portalPracticeSets(grade, schoolId).catch(() => []),
          api.portalTimetable(grade, section, schoolId).catch(() => []),
          api.portalDocuments(id).catch(() => []),
          api.portalAnnouncements(schoolId).catch(() => []),
          api.portalCalendar(schoolId).catch(() => []),
        ]);
        setGrades(g);
        setPractice(p);
        setTimetable(t);
        setDocs(d);
        setAnnouncements(a);
        setCalendar(cal as Record<string, unknown>[]);
      })
      .finally(() => setLoading(false));
  }, [session?.schoolId]);

  return (
    <DashboardShell
      title="Student hub"
      subtitle={
        student
          ? `${String(student.name)} · ${String(student.grade)} ${String(student.section)}`
          : 'Grades, materials, practice, and school life'
      }
      eyebrow="Student portal"
      activeTab={tab}
      setActiveTab={setTab}
      headerVariant="portal"
    >
      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      )}

      {!loading && tab === 'dashboard' && student && (
        <div className="space-y-5 animate-fade-in">
          <KpiGrid>
            <KpiWidget label="Student" value={String(student.name)} tone="emphasis" />
            <KpiWidget label="Class" value={`${student.grade} ${student.section}`} />
            <KpiWidget label="GPA" value={String(Number(student.gpa ?? 0).toFixed(2))} />
            <KpiWidget
              label="Attendance"
              value={`${Number(student.attendance_rate ?? 0).toFixed(1)}%`}
            />
          </KpiGrid>
          <ContentCard title="This week" description="Quick look at what is coming up">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-border/60 bg-primary/[0.04] p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-primary">Practice</p>
                <p className="mt-1 text-2xl font-bold">{practice.length}</p>
                <p className="text-xs text-muted-foreground">Published sets ready for you</p>
              </div>
              <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Announcements
                </p>
                <p className="mt-1 text-2xl font-bold">{announcements.length}</p>
                <p className="text-xs text-muted-foreground">From school head</p>
              </div>
            </div>
          </ContentCard>
        </div>
      )}

      {!loading && tab === 'grades' && (
        <ContentCard title="Published grades" description="Only results your teachers have released">
          {grades.length ? (
            <div className="overflow-hidden rounded-xl border border-border/60">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Subject</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Title</th>
                    <th className="px-4 py-3 text-right">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {grades.map((g) => (
                    <tr key={String(g.id)} className="border-t border-border/40 hover:bg-primary/[0.03]">
                      <td className="px-4 py-3 font-medium">{String(g.subject)}</td>
                      <td className="px-4 py-3">
                        <Badge variant="neutral">{String(g.entry_type)}</Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{String(g.title)}</td>
                      <td className="px-4 py-3 text-right font-semibold">
                        {String(g.score)}/{String(g.max_score)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="No grades yet" description="Published scores will appear here." />
          )}
        </ContentCard>
      )}

      {!loading && tab === 'resources' && (
        <ContentCard title="Books & resources" description="Textbooks and shared documents">
          {docs.length ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {docs.map((d) => (
                <a
                  key={String(d.id)}
                  href={String(d.file_url)}
                  className="flex items-start gap-3 rounded-xl border border-border/70 bg-card p-4 shadow-sm transition hover:border-primary/40 hover:shadow-md"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{String(d.title)}</p>
                    <p className="text-[11px] capitalize text-muted-foreground">{String(d.doc_type)}</p>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <EmptyState title="No materials yet" description="Teachers will share textbooks and worksheets here." />
          )}
        </ContentCard>
      )}

      {!loading && tab === 'practice' && (
        <ContentCard title="Practice assessments" description="Teacher-authored question sets — no AI">
          {practice.length ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {practice.map((p) => (
                <div
                  key={String(p.id)}
                  className="rounded-xl border border-border/70 bg-gradient-to-br from-card to-primary/[0.04] p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="primary">{String(p.subject)}</Badge>
                    <Badge variant="neutral">Teacher-authored</Badge>
                  </div>
                  <p className="mt-3 text-sm font-bold">{String(p.title)}</p>
                  <p className="text-xs text-muted-foreground">{String(p.grade)}</p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No practice sets" description="Your teachers will publish practice when ready." />
          )}
        </ContentCard>
      )}

      {!loading && tab === 'timetable' && (
        <ContentCard title="Class timetable" description="Weekly schedule">
          {timetable.length ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {timetable.map((t) => (
                <div key={String(t.id)} className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <Badge variant="primary">{DAY_NAMES[Number(t.day_of_week)] || `Day ${t.day_of_week}`}</Badge>
                    <span className="text-[11px] text-muted-foreground">
                      {String(t.start_time)}–{String(t.end_time)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-semibold">{String(t.subject)}</p>
                  <p className="text-xs text-muted-foreground">{String(t.teacher_name || '')}</p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="Timetable not posted" description="Check again after class placement." />
          )}
        </ContentCard>
      )}

      {!loading && (tab === 'calendar' || tab === 'academic-calendar') && (
        <PublishedAcademicCalendarPanel
          schoolId={session?.schoolId || String(student?.schoolId || 'sch-1')}
          title="School academic calendar"
          description="Official term dates, exams, and school events disseminated by the school head."
        />
      )}

      {!loading && tab === 'announcements' && (
        <AnnouncementFeed
          schoolName="School Head"
          items={announcements.map((a) => ({
            id: String(a.id),
            title: String(a.title),
            body: String(a.body),
            publishedAt: a.publishedAt ? String(a.publishedAt) : a.published_at ? String(a.published_at) : null,
            audience: a.audience ? String(a.audience) : 'all',
            authorName: 'School Head',
            authorRole: 'Official',
          }))}
        />
      )}

      {!loading && tab === 'feedback' && (
        <StudentFeedbackForm
          studentId={student ? String(student.id) : undefined}
          studentName={student ? String(student.name) : undefined}
        />
      )}
    </DashboardShell>
  );
}
