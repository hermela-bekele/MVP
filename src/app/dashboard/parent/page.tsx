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
import { Dialog, DialogFooter } from '@/components/ui/dialog';
import { Select } from '@/components/ui/select';
import { EmptyState } from '@/components/ui/empty-state';
import { MetricProgressRow } from '@/components/ui/metric-progress-row';
import { InvoiceDetailDialog } from '@/components/dashboard/billing/InvoiceDetailDialog';
import { ParentReenrollmentInvites } from '@/components/dashboard/parent/ParentReenrollmentInvites';
import { ParentFeedbackForm } from '@/components/dashboard/parent/ParentFeedbackForm';
import { ParentCommunicationModule } from '@/components/dashboard/parent/ParentCommunicationModule';
import { PublishedAcademicCalendarPanel } from '@/components/dashboard/PublishedAcademicCalendarPanel';
import { usePortalTab } from '@/lib/usePortalTab';
import { PortalProfileCard } from '@/components/dashboard/shared/PortalProfileCard';

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
  const { attendance: appAttendance, addNotification, communityPosts, refreshFromApi } = useApp();
  const { activeTab: tab, setActiveTab: setTab } = usePortalTab('parent');
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
  const [invoiceBucket, setInvoiceBucket] = useState<
    'all' | 'upcoming' | 'partial' | 'overdue' | 'paid'
  >('all');
  const [invoiceChildFilter, setInvoiceChildFilter] = useState<'all' | string>('all');
  const [editingApplication, setEditingApplication] = useState<AdmissionApplication | null>(null);
  const [editApplicantName, setEditApplicantName] = useState('');
  const [savingApplication, setSavingApplication] = useState(false);

  const child = useMemo(
    () => children.find((c) => c.id === childId) || children[0],
    [children, childId]
  );

  useEffect(() => {
    setLoading(true);
    void refreshFromApi();
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
  }, [session?.schoolId, refreshFromApi]);

  const displayAnnouncements = useMemo(() => {
    const fromFeed = (communityPosts || [])
      .filter(
        (p) =>
          p.authorRole === 'school-head' ||
          /^announcement\s*:/i.test(p.title || '') ||
          (p.title || '').toLowerCase().includes('announcement'),
      )
      .map((p) => ({
        id: p.id,
        title: (p.title || 'Announcement').replace(/^Announcement:\s*/i, ''),
        body: p.body,
        publishedAt: p.createdAt,
        authorName: p.authorName || 'School Head',
      }));
    const fromApi = announcements.map((a) => ({
      id: String(a.id),
      title: String(a.title ?? 'Announcement').replace(/^Announcement:\s*/i, ''),
      body: String(a.body ?? ''),
      publishedAt: a.publishedAt
        ? String(a.publishedAt)
        : a.published_at
          ? String(a.published_at)
          : a.createdAt
            ? String(a.createdAt)
            : '',
      authorName: String(a.authorName ?? a.author_name ?? 'School Head'),
    }));
    const map = new Map<string, (typeof fromFeed)[number]>();
    for (const a of [...fromFeed, ...fromApi]) {
      if (!map.has(a.id)) map.set(a.id, a);
    }
    return [...map.values()];
  }, [communityPosts, announcements]);

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

  const invoiceDisplayName = (inv: Invoice) =>
    inv.studentName || inv.applicantName || 'Family / admission';

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      if (invoiceChildFilter !== 'all') {
        if (inv.studentId) {
          if (inv.studentId !== invoiceChildFilter) return false;
        }
        // Family/admission invoices without student_id stay visible for every child filter
      }
      const status = inv.status;
      const overdue = status === 'overdue' || (inv.balanceDue > 0 && inv.daysRemaining < 0);
      if (invoiceBucket === 'upcoming') {
        return inv.balanceDue > 0 && status === 'sent' && !overdue;
      }
      if (invoiceBucket === 'partial') return status === 'partially_paid';
      if (invoiceBucket === 'overdue') return overdue;
      if (invoiceBucket === 'paid') return status === 'paid' || inv.balanceDue <= 0;
      return true;
    });
  }, [invoices, invoiceBucket, invoiceChildFilter]);

  const invoiceCounts = useMemo(() => {
    const base =
      invoiceChildFilter === 'all'
        ? invoices
        : invoices.filter(
            (inv) => !inv.studentId || inv.studentId === invoiceChildFilter
          );
    return {
      all: base.length,
      upcoming: base.filter((i) => i.balanceDue > 0 && i.status === 'sent' && i.daysRemaining >= 0)
        .length,
      partial: base.filter((i) => i.status === 'partially_paid').length,
      overdue: base.filter(
        (i) => i.status === 'overdue' || (i.balanceDue > 0 && i.daysRemaining < 0)
      ).length,
      paid: base.filter((i) => i.status === 'paid' || i.balanceDue <= 0).length,
    };
  }, [invoices, invoiceChildFilter]);

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

      {loading && tab === 'dashboard' && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      )}
      {loading && tab !== 'dashboard' && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-muted" />
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
                  {displayAnnouncements.slice(0, 4).map((a) => (
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
                  {!displayAnnouncements.length && (
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

      {!loading && (tab === 'calendar' || tab === 'academic-calendar') && (
        <PublishedAcademicCalendarPanel
          schoolId={child?.schoolId || session?.schoolId || 'sch-1'}
        />
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

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-1 rounded-xl border border-border/70 bg-muted/40 p-1">
              {(
                [
                  ['all', 'All'],
                  ['upcoming', 'Upcoming'],
                  ['partial', 'Partial'],
                  ['overdue', 'Overdue'],
                  ['paid', 'Paid'],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setInvoiceBucket(id)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    invoiceBucket === id
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-card hover:text-foreground'
                  }`}
                >
                  {label}
                  <span className="ml-1 opacity-70">({invoiceCounts[id]})</span>
                </button>
              ))}
            </div>
            <Select
              label="Child"
              value={invoiceChildFilter}
              onChange={(e) => setInvoiceChildFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All children' },
                ...children.map((c) => ({ value: c.id, label: c.name })),
              ]}
            />
          </div>

          <div className="grid gap-4">
            {filteredInvoices.map((inv) => (
              <button
                key={inv.id}
                type="button"
                onClick={() => setSelectedInvoice(inv)}
                className="w-full rounded-2xl border border-border/70 bg-card p-5 text-left shadow-sm transition hover:border-primary/35 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/25"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-bold text-primary underline-offset-2">
                        {inv.invoiceNumber}
                      </h3>
                      <Badge variant="neutral">{inv.invoiceType}</Badge>
                      <Badge variant={deadlineVariant(inv.deadlineColor)}>
                        {inv.status.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm font-medium text-foreground">
                      {invoiceDisplayName(inv)}
                      {inv.billingPeriod ? (
                        <span className="font-normal text-muted-foreground">
                          {' '}
                          · {inv.billingPeriod}
                        </span>
                      ) : null}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Issued {inv.issueDate} · Due {inv.dueDate} ({inv.daysRemaining} days) · Click
                      for breakdown & receipt
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
            {!filteredInvoices.length && (
              <EmptyState
                title="No invoices in this view"
                description={
                  invoices.length
                    ? 'Try another status tab or child filter.'
                    : 'Admission and tuition invoices will show here.'
                }
              />
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
                      onClick={() => {
                        setEditingApplication(a);
                        setEditApplicantName(a.applicantName);
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

      {!loading &&
        (tab === 'communication' ||
          tab === 'messaging' ||
          tab === 'messages' ||
          tab === 'announcements') && (
        <ParentCommunicationModule
          mode="parent"
          announcements={displayAnnouncements}
          childrenOptions={children.map((c) => ({ id: c.id, name: c.name }))}
        />
      )}

      {!loading && tab === 'feedback' && (
        <ParentFeedbackForm childrenOptions={children.map((c) => ({ id: c.id, name: c.name }))} />
      )}

      {!loading && tab === 'profile' && (
        <div className="space-y-6 animate-fade-in text-left">
          <PortalProfileCard
            roleLabel="Parent"
            fields={[
              {
                label: 'Linked children',
                value: children.length
                  ? children.map((c) => `${c.name} (${c.grade} ${c.section})`).join(', ')
                  : '—',
              },
              { label: 'Open invoices', value: openInvoices.length },
            ]}
          />
        </div>
      )}

      <Dialog
        isOpen={editingApplication !== null}
        onClose={() => setEditingApplication(null)}
        title="Update Student Name"
        description="Edit the applicant name on this admission application."
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!editingApplication || !editApplicantName.trim()) return;
            setSavingApplication(true);
            try {
              await api.updateApplication(editingApplication.id, { applicantName: editApplicantName.trim() });
              setApplications(await api.myApplications());
              setToast({ type: 'ok', text: 'Application updated.' });
              setEditingApplication(null);
            } catch {
              setToast({ type: 'err', text: 'Could not update the application — try again.' });
            } finally {
              setSavingApplication(false);
            }
          }}
          className="space-y-4"
        >
          <Input
            label="Student name"
            value={editApplicantName}
            onChange={(e) => setEditApplicantName(e.target.value)}
            required
            autoFocus
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditingApplication(null)}>
              Cancel
            </Button>
            <Button type="submit" loading={savingApplication}>
              Save
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </DashboardShell>
  );
}
