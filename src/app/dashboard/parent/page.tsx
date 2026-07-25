'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { api, type AdmissionApplication, type Invoice } from '@/lib/api';
import { readStoredSession } from '@/lib/auth';
import { useApp } from '@/context/AppContext';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { ContentCard } from '@/components/dashboard/ContentCard';
import { KpiWidget, KpiGrid } from '@/components/dashboard/KpiWidget';
import { ParentAttendanceCalendar } from '@/components/dashboard/parent/ParentAttendanceCalendar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { EmptyState } from '@/components/ui/empty-state';
import { MetricProgressRow } from '@/components/ui/metric-progress-row';
import { InvoiceDetailDialog } from '@/components/dashboard/billing/InvoiceDetailDialog';
import { AnnouncementFeed } from '@/components/dashboard/announcements/AnnouncementFeed';
import { MessageCenter } from '@/components/dashboard/messaging/MessageCenter';
import { ParentReenrollmentInvites } from '@/components/dashboard/parent/ParentReenrollmentInvites';
import { ParentFeedbackForm } from '@/components/dashboard/parent/ParentFeedbackForm';

type Child = {
  id: string;
  name: string;
  grade: string;
  section: string;
  schoolId?: string;
  gpa?: number;
  attendanceRate?: number;
};

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function deadlineVariant(color: Invoice['deadlineColor']) {
  if (color === 'green') return 'success' as const;
  if (color === 'yellow') return 'warning' as const;
  return 'danger' as const;
}

export default function ParentPortalPage() {
  const session = readStoredSession();
  const { attendance: appAttendance, addNotification } = useApp();
  const [tab, setTab] = useState('dashboard');
  const [children, setChildren] = useState<Child[]>([]);
  const [childId, setChildId] = useState('');
  const [grades, setGrades] = useState<Record<string, unknown>[]>([]);
  const [attendance, setAttendance] = useState<
    { id?: string; date: string; status: string; remarks?: string | null }[]
  >([]);
  const [docs, setDocs] = useState<Record<string, unknown>[]>([]);
  const [announcements, setAnnouncements] = useState<Record<string, unknown>[]>([]);
  const [calendar, setCalendar] = useState<Record<string, unknown>[]>([]);
  const [timetable, setTimetable] = useState<Record<string, unknown>[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [applications, setApplications] = useState<AdmissionApplication[]>([]);
  const [payAmount, setPayAmount] = useState('');
  const [payProvider, setPayProvider] = useState('telebirr');
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const child = useMemo(
    () => children.find((c) => c.id === childId) || children[0],
    [children, childId]
  );

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.portalChildren().catch(() => []),
      api.myApplications().catch(() => [] as AdmissionApplication[]),
      api.listInvoices().catch(() => [] as Invoice[]),
      api.portalAnnouncements(session?.schoolId || undefined).catch(() => []),
    ]).then(([rows, apps, inv, anns]) => {
      const mapped = (rows as Record<string, unknown>[]).map((r) => ({
        id: String(r.id),
        name: String(r.name),
        grade: String(r.grade),
        section: String(r.section),
        schoolId: String(r.school_id || r.schoolId || ''),
        gpa: Number(r.gpa ?? 0),
        attendanceRate: Number(r.attendance_rate ?? r.attendanceRate ?? 0),
      }));
      setChildren(mapped);
      if (mapped[0]) setChildId((prev) => prev || mapped[0].id);
      setApplications(apps);
      setInvoices(inv);
      setAnnouncements(anns);
    }).finally(() => setLoading(false));
  }, [session?.schoolId]);

  useEffect(() => {
    if (!child) return;
    const schoolId = child.schoolId;
    api.portalGrades(child.id).then(setGrades).catch(() => setGrades([]));
    api
      .portalAttendance(child.id)
      .then((rows) => {
        const mapped = (rows as Record<string, unknown>[]).map((r) => ({
          id: String(r.id ?? ''),
          date: String(r.date),
          status: String(r.status),
          remarks: (r.remarks as string) ?? null,
        }));
        if (mapped.length) {
          setAttendance(mapped);
        } else {
          setAttendance(
            appAttendance
              .filter((a) => a.studentId === child.id)
              .map((a) => ({
                id: a.id,
                date: a.date,
                status: a.status,
                remarks: a.remarks ?? null,
              }))
          );
        }
      })
      .catch(() => {
        setAttendance(
          appAttendance
            .filter((a) => a.studentId === child.id)
            .map((a) => ({
              id: a.id,
              date: a.date,
              status: a.status,
              remarks: a.remarks ?? null,
            }))
        );
      });
    api.portalDocuments(child.id).then(setDocs).catch(() => setDocs([]));
    api.portalCalendar(schoolId).then(setCalendar).catch(() => setCalendar([]));
    api
      .portalTimetable(child.grade, child.section, schoolId)
      .then(setTimetable)
      .catch(() => setTimetable([]));
  }, [child, appAttendance]);

  const pay = async (invoiceId: string) => {
    setPayingId(invoiceId);
    setToast(null);
    try {
      const amount = Number(payAmount);
      await api.payInvoice(invoiceId, {
        provider: payProvider,
        amount: amount || undefined,
        confirm: true,
      });
      setToast({ type: 'ok', text: 'Payment recorded successfully.' });
      addNotification('Payment received', 'Your invoice balance was updated.', 'success');
      const next = await api.listInvoices();
      setInvoices(next);
      setPayAmount('');
      const updated = next.find((i) => i.id === invoiceId) || null;
      if (selectedInvoice?.id === invoiceId) setSelectedInvoice(updated);
    } catch (err) {
      setToast({ type: 'err', text: err instanceof Error ? err.message : 'Payment failed' });
    } finally {
      setPayingId(null);
    }
  };

  const childSwitcher = (
    <div className="flex items-center gap-1 rounded-xl border border-border/70 bg-muted/40 p-1 shadow-sm">
      {children.map((c) => (
        <button
          key={c.id}
          type="button"
          onClick={() => setChildId(c.id)}
          className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition-all ${
            child?.id === c.id
              ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25'
              : 'text-muted-foreground hover:bg-card hover:text-foreground'
          }`}
        >
          {c.name}
        </button>
      ))}
    </div>
  );

  const openInvoices = invoices.filter((i) => i.balanceDue > 0);

  return (
    <DashboardShell
      title="Family monitoring hub"
      subtitle={
        child
          ? `Tracking ${child.name} · ${child.grade} ${child.section}`
          : 'Academics, attendance, and school payments'
      }
      eyebrow="Parent portal"
      activeTab={tab}
      setActiveTab={setTab}
      actions={children.length ? childSwitcher : undefined}
      headerVariant="portal"
    >
      {toast && (
        <div
          className={`mb-4 rounded-xl border px-4 py-3 text-sm ${
            toast.type === 'ok'
              ? 'border-success/30 bg-success/10 text-success'
              : 'border-destructive/30 bg-destructive/10 text-destructive'
          }`}
        >
          {toast.text}
        </div>
      )}

      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      )}

      {!loading && tab === 'dashboard' && child && (
        <div className="space-y-5 animate-fade-in">
          <KpiGrid>
            <KpiWidget label="GPA" value={child.gpa?.toFixed(2) ?? '—'} hint="Cumulative" tone="emphasis" />
            <KpiWidget
              label="Attendance"
              value={`${Number(child.attendanceRate ?? 0).toFixed(1)}%`}
              hint="This term"
            />
            <KpiWidget label="Open invoices" value={String(openInvoices.length)} hint="Action needed" />
            <KpiWidget label="Class" value={`${child.grade} ${child.section}`} hint="Current placement" />
          </KpiGrid>

          <div className="grid gap-5 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <ContentCard title="Latest announcements" description="Posted by school head">
                <div className="space-y-3">
                  {announcements.slice(0, 4).map((a) => (
                    <div
                      key={String(a.id)}
                      className="rounded-xl border border-border/60 bg-gradient-to-br from-primary/[0.03] to-transparent p-3.5 transition hover:border-primary/25"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-semibold text-foreground">{String(a.title)}</p>
                        <Badge variant="info">School</Badge>
                      </div>
                      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{String(a.body)}</p>
                    </div>
                  ))}
                  {!announcements.length && (
                    <EmptyState title="No announcements" description="School updates will appear here." />
                  )}
                </div>
              </ContentCard>
            </div>
            <div className="lg:col-span-2 space-y-5">
              <ContentCard title="Payment snapshot" description="Balances across children">
                <div className="space-y-3">
                  {openInvoices.slice(0, 3).map((inv) => (
                    <button
                      key={inv.id}
                      type="button"
                      onClick={() => {
                        setSelectedInvoice(inv);
                        setTab('invoices');
                      }}
                      className="w-full rounded-lg border border-border/60 bg-card p-3 text-left transition hover:border-primary/30 hover:shadow-sm"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-primary">{inv.invoiceNumber}</p>
                        <Badge variant={deadlineVariant(inv.deadlineColor)}>
                          {inv.status.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        Due {inv.dueDate} · {inv.balanceDue.toLocaleString()} {inv.currency} left
                      </p>
                      <MetricProgressRow
                        className="mt-2"
                        label="Paid"
                        value={
                          inv.amountPaid + inv.balanceDue > 0
                            ? (inv.amountPaid / (inv.amountPaid + inv.balanceDue)) * 100
                            : 100
                        }
                        valueDisplay={`${inv.amountPaid} / ${inv.amountPaid + inv.balanceDue}`}
                      />
                    </button>
                  ))}
                  {!openInvoices.length && (
                    <p className="text-xs text-muted-foreground">All invoices are settled.</p>
                  )}
                  <Button size="sm" variant="outline" className="w-full" onClick={() => setTab('invoices')}>
                    View all invoices
                  </Button>
                </div>
              </ContentCard>
            </div>
          </div>
        </div>
      )}

      {!loading && tab === 'grades' && (
        <ContentCard
          title="Published grades"
          description="Quiz, test, mid, final, assignment, and project — only published results"
        >
          {grades.length ? (
            <div className="overflow-hidden rounded-xl border border-border/60">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Subject</th>
                    <th className="px-4 py-3 font-semibold">Type</th>
                    <th className="px-4 py-3 font-semibold">Title</th>
                    <th className="px-4 py-3 font-semibold text-right">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {grades.map((g) => {
                    const score = Number(g.score);
                    const max = Number(g.max_score || g.maxScore || 100);
                    const pct = max ? (score / max) * 100 : 0;
                    return (
                      <tr key={String(g.id)} className="border-t border-border/40 hover:bg-primary/[0.03]">
                        <td className="px-4 py-3 font-medium">{String(g.subject)}</td>
                        <td className="px-4 py-3">
                          <Badge variant="neutral">{String(g.entry_type || g.entryType)}</Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{String(g.title)}</td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-semibold text-foreground">
                            {score}/{max}
                          </span>
                          <span className="ml-2 text-[11px] text-muted-foreground">{pct.toFixed(0)}%</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="No published grades yet" description="Teachers publish results when ready for parents." />
          )}
        </ContentCard>
      )}

      {!loading && tab === 'attendance' && child && (
        <ParentAttendanceCalendar childName={child.name} logs={attendance} />
      )}

      {!loading && tab === 'timetable' && (
        <ContentCard title="Class timetable" description={`${child?.grade} ${child?.section}`}>
          {timetable.length ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {timetable.map((t) => (
                <div
                  key={String(t.id)}
                  className="rounded-xl border border-border/60 bg-gradient-to-br from-card to-primary/[0.03] p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="primary">{DAY_NAMES[Number(t.day_of_week)] || `Day ${t.day_of_week}`}</Badge>
                    <span className="text-[11px] font-medium text-muted-foreground">
                      {String(t.start_time)} – {String(t.end_time)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-semibold">{String(t.subject)}</p>
                  <p className="text-xs text-muted-foreground">
                    {String(t.teacher_name || 'Teacher')}
                    {t.room ? ` · ${String(t.room)}` : ''}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No timetable published" description="Check back once the registrar posts the schedule." />
          )}
        </ContentCard>
      )}

      {!loading && tab === 'calendar' && (
        <ContentCard title="Academic calendar" description="Term dates, exams, and school events">
          {calendar.length ? (
            <ol className="relative space-y-0 border-l border-primary/20 ml-3">
              {calendar.map((e) => (
                <li key={String(e.id)} className="relative pb-5 pl-6 last:pb-0">
                  <span className="absolute -left-1.5 top-1.5 h-3 w-3 rounded-full border-2 border-primary bg-card" />
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">
                    {String(e.event_date).slice(0, 10)}
                  </p>
                  <p className="mt-0.5 text-sm font-semibold">{String(e.title)}</p>
                  {e.description ? (
                    <p className="text-xs text-muted-foreground">{String(e.description)}</p>
                  ) : null}
                </li>
              ))}
            </ol>
          ) : (
            <EmptyState title="Calendar is empty" description="School events will show here when published." />
          )}
        </ContentCard>
      )}

      {!loading && tab === 'documents' && (
        <ContentCard title="Student documents" description="Admission and academic files">
          {docs.length ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {docs.map((d) => (
                <a
                  key={String(d.id)}
                  href={String(d.file_url)}
                  className="group flex items-start gap-3 rounded-xl border border-border/70 bg-card p-4 shadow-sm transition hover:border-primary/40 hover:shadow-md"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold group-hover:text-primary">{String(d.title)}</p>
                    <p className="text-[11px] capitalize text-muted-foreground">{String(d.doc_type)}</p>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <EmptyState title="No documents" description="Uploaded files for this student will appear here." />
          )}
        </ContentCard>
      )}

      {!loading && tab === 'invoices' && (
        <div className="space-y-5 animate-fade-in">
          <ContentCard title="Pay an invoice" description="Partial payments are allowed and tracked">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Partial amount (optional)"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                placeholder="Leave blank for full balance"
                helperText="Enter an amount to pay part of the balance"
              />
              <Select
                label="Payment method"
                value={payProvider}
                onChange={(e) => setPayProvider(e.target.value)}
                options={[
                  { value: 'telebirr', label: 'Telebirr' },
                  { value: 'chapa', label: 'Chapa' },
                  { value: 'bank_transfer', label: 'Bank transfer' },
                  { value: 'manual', label: 'Manual / cash' },
                ]}
              />
            </div>
          </ContentCard>

          <div className="grid gap-4">
            {invoices.map((inv) => (
              <button
                key={inv.id}
                type="button"
                onClick={() => setSelectedInvoice(inv)}
                className="w-full rounded-2xl border border-border/70 bg-card p-5 text-left shadow-sm transition hover:border-primary/35 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/25"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-bold text-primary underline-offset-2 group-hover:underline">
                        {inv.invoiceNumber}
                      </h3>
                      <Badge variant="neutral">{inv.invoiceType}</Badge>
                      <Badge variant={deadlineVariant(inv.deadlineColor)}>
                        {inv.status.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      Issued {inv.issueDate} · Due {inv.dueDate} ({inv.daysRemaining} days) · Click for
                      breakdown & receipt
                    </p>
                    <div className="mt-3 flex flex-wrap gap-4 text-xs">
                      <span>
                        Paid{' '}
                        <strong className="text-foreground">
                          {inv.amountPaid.toLocaleString()} {inv.currency}
                        </strong>
                      </span>
                      <span>
                        Balance{' '}
                        <strong className="text-foreground">
                          {inv.balanceDue.toLocaleString()} {inv.currency}
                        </strong>
                      </span>
                    </div>
                    <MetricProgressRow
                      className="mt-3 max-w-md"
                      label="Collection"
                      value={
                        inv.amountPaid + inv.balanceDue > 0
                          ? (inv.amountPaid / (inv.amountPaid + inv.balanceDue)) * 100
                          : 100
                      }
                      valueDisplay={`${Math.round(
                        inv.amountPaid + inv.balanceDue > 0
                          ? (inv.amountPaid / (inv.amountPaid + inv.balanceDue)) * 100
                          : 100
                      )}%`}
                    />
                  </div>
                  {inv.balanceDue > 0 && (
                    <Button
                      size="sm"
                      variant="organic"
                      className="border-none"
                      disabled={payingId === inv.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        pay(inv.id);
                      }}
                    >
                      {payingId === inv.id ? 'Processing…' : 'Pay now'}
                    </Button>
                  )}
                </div>
              </button>
            ))}
            {!invoices.length && (
              <EmptyState title="No invoices" description="Admission and tuition invoices will show here." />
            )}
          </div>

          <InvoiceDetailDialog
            invoice={selectedInvoice}
            open={!!selectedInvoice}
            onClose={() => setSelectedInvoice(null)}
            paying={payingId === selectedInvoice?.id}
            onPay={(inv) => pay(inv.id)}
          />
        </div>
      )}

      {!loading && tab === 'applications' && (
        <div className="space-y-4">
        <ContentCard title="My applications" description="Edit while the school still allows changes">
          {applications.length ? (
            <div className="space-y-3">
              {applications.map((a) => (
                <div
                  key={a.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/70 bg-card p-4 shadow-sm"
                >
                  <div>
                    <p className="text-sm font-semibold">
                      {a.applicantName}{' '}
                      <span className="font-normal text-muted-foreground">· {a.referenceCode}</span>
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {a.gradeApplied}
                      {a.sectionRequested ? ` ${a.sectionRequested}` : ''} · {a.sourceChannel || 'website'}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge variant="neutral">{a.status.replace(/_/g, ' ')}</Badge>
                      {a.status === 'waitlisted' && a.waitlistRank != null && (
                        <Badge variant="warning">Waitlist position #{a.waitlistRank}</Badge>
                      )}
                    </div>
                  </div>
                  {!a.editLocked && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        const name = window.prompt('Update student name', a.applicantName);
                        if (!name) return;
                        await api.updateApplication(a.id, { applicantName: name });
                        setApplications(await api.myApplications());
                        setToast({ type: 'ok', text: 'Application updated.' });
                      }}
                    >
                      Edit
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No applications yet"
              description="Submit via the school apply link, then track status here."
            />
          )}
        </ContentCard>
        <ParentReenrollmentInvites />
        </div>
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

      {!loading && tab === 'messages' && (
        <MessageCenter
          mode="parent"
          childrenOptions={children.map((c) => ({ id: c.id, name: c.name }))}
        />
      )}

      {!loading && tab === 'feedback' && (
        <ParentFeedbackForm childrenOptions={children.map((c) => ({ id: c.id, name: c.name }))} />
      )}
    </DashboardShell>
  );
}
