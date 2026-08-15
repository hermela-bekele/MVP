'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';

const GRADES = ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];
const SECTIONS = ['A', 'B', 'C', 'D'];

function formatDocType(docType: string): string {
  return docType.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function SectionHeading({
  step,
  icon,
  title,
  subtitle,
  brandColor,
}: {
  step: number;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  brandColor?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div
        className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
        style={{ backgroundColor: brandColor || 'hsl(var(--primary))' }}
      >
        {icon}
        <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-card bg-background text-[10px] font-bold text-foreground">
          {step}
        </span>
      </div>
      <div>
        <h2 className="text-sm font-bold text-foreground">{title}</h2>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}

export default function PublicRegistrationFormPage() {
  const params = useParams();
  const code = String(params.code || '');
  const [schoolName, setSchoolName] = useState('');
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [branding, setBranding] = useState<{
    primaryColor?: string;
    tagline?: string;
    logoUrl?: string;
    schoolDisplayName?: string;
  }>({});
  const [extraSchema, setExtraSchema] = useState<{ key: string; label: string; type?: string; required?: boolean }[]>([]);
  const [requiredDocs, setRequiredDocs] = useState<string[]>([]);
  const [consent, setConsent] = useState(false);
  const [createAccount, setCreateAccount] = useState(false);
  const [accountPassword, setAccountPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [honeypot, setHoneypot] = useState('');

  const [form, setForm] = useState({
    applicantName: '',
    dateOfBirth: '',
    gradeApplied: 'Grade 9',
    sectionRequested: 'A',
    parentName: '',
    parentPhone: '',
    parentEmail: '',
    emergencyContact: '',
    medicalInfo: '',
    previousSchool: '',
  });
  const [extraFields, setExtraFields] = useState<Record<string, string>>({});

  useEffect(() => {
    api
      .getPublicRegistrationForm(code)
      .then((data) => {
        setSchoolName(data.school.name);
        setFormName(data.formName);
        setFormDescription(data.formDescription || '');
        setBranding(data.branding || {});
        setRequiredDocs(data.requiredDocuments || []);
        setExtraSchema(data.formSchema || []);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message || 'Registration form not found');
        setLoading(false);
      });
  }, [code]);

  const brandColor = branding.primaryColor || undefined;
  const displayName = branding.schoolDisplayName || schoolName || 'School';
  const initials = (displayName || 'PR')
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const stepCount = 2 + (extraSchema.length > 0 ? 1 : 0);

  const onChange = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consent) {
      setError('Please accept the privacy consent to continue.');
      return;
    }
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      if (createAccount && accountPassword.length >= 6) {
        try {
          await api.register({
            email: form.parentEmail.trim(),
            password: accountPassword,
            displayName: form.parentName.trim(),
            role: 'parent',
          });
        } catch {
          /* account may already exist — continue registration */
        }
      }
      const app = (await api.submitPublicRegistrationForm(code, {
        ...form,
        formData: extraFields,
        consentAccepted: true,
        website: honeypot,
        submit: true,
      })) as { referenceCode: string };
      setSuccess(
        `Registration submitted. Reference ${app.referenceCode}. Check your email for confirmation.`
      );
      setForm((f) => ({
        ...f,
        applicantName: '',
        medicalInfo: '',
        previousSchool: '',
        dateOfBirth: '',
      }));
      setConsent(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submit failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[hsl(var(--dashboard-bg))]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading registration form…</p>
        </div>
      </div>
    );
  }

  if (error && !schoolName) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[hsl(var(--dashboard-bg))] px-4">
        <div className="max-w-sm rounded-xl border border-destructive/30 bg-destructive/10 px-5 py-4 text-center text-sm text-destructive">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-[hsl(var(--dashboard-bg))]"
      style={brandColor ? ({ ['--apply-brand' as string]: brandColor } as React.CSSProperties) : undefined}
    >
      <div className="relative overflow-hidden border-b border-border/60 bg-[hsl(var(--sidebar-bg))]">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[color:var(--apply-brand,#1d4ed8)]/20 via-transparent to-transparent"
        />
        <div
          className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full opacity-[0.15] blur-3xl"
          style={{ backgroundColor: brandColor || 'hsl(var(--primary))' }}
        />
        <div
          className="pointer-events-none absolute -bottom-32 right-10 h-72 w-72 rounded-full opacity-[0.1] blur-3xl"
          style={{ backgroundColor: brandColor || 'hsl(var(--primary))' }}
        />
        <div className="relative mx-auto flex max-w-3xl flex-col gap-6 px-4 py-10 sm:px-6 sm:py-14">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {branding.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={branding.logoUrl} alt="" className="h-11 w-11 rounded-xl object-cover shadow-md" />
              ) : (
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-xl text-sm font-bold text-white shadow-md"
                  style={{ backgroundColor: brandColor || 'hsl(var(--primary))' }}
                >
                  {initials}
                </div>
              )}
              <div>
                <p className="text-sm font-bold text-foreground">{displayName}</p>
                <p className="text-[11px] text-muted-foreground">Registration</p>
              </div>
            </div>
            <Link
              href="/login"
              className="text-xs font-semibold hover:underline"
              style={{ color: brandColor || undefined }}
            >
              Parent login
            </Link>
          </div>
          <div>
            <p
              className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em]"
              style={{ color: brandColor || undefined }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: brandColor || 'hsl(var(--primary))' }} />
              {formName || 'Register now'}
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {displayName}
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
              {formDescription || 'Complete this form to register.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card/80 px-3 py-1.5 text-[11px] font-semibold text-foreground shadow-sm backdrop-blur">
              <svg className="h-3.5 w-3.5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {stepCount} quick step{stepCount === 1 ? '' : 's'}
            </span>
            {requiredDocs.length > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card/80 px-3 py-1.5 text-[11px] font-semibold text-foreground shadow-sm backdrop-blur">
                <svg className="h-3.5 w-3.5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {requiredDocs.length} document{requiredDocs.length === 1 ? '' : 's'} needed after submit
              </span>
            )}
          </div>

          {requiredDocs.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {requiredDocs.map((doc) => (
                <span
                  key={doc}
                  className="rounded-full bg-muted/50 px-2.5 py-1 text-[10px] font-medium text-muted-foreground"
                >
                  {formatDocType(doc)}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <svg className="mt-0.5 h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
            <svg className="mt-0.5 h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12.75l6-6m3 3l-9 9-4.5-4.5m4.5 4.5l9-9" />
            </svg>
            {success}
          </div>
        )}

        <form
          onSubmit={onSubmit}
          className="relative space-y-8 overflow-hidden rounded-2xl border border-border/70 bg-card p-5 shadow-xl shadow-black/[0.04] sm:p-8"
        >
          <div
            className="absolute inset-x-0 top-0 h-1.5"
            style={{
              background: `linear-gradient(90deg, ${brandColor || 'hsl(var(--primary))'}, transparent 150%)`,
            }}
          />

          <div className="space-y-5">
            <SectionHeading
              step={1}
              brandColor={brandColor}
              title="Student details"
              subtitle="Tell us about the applicant"
              icon={
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              }
            />
            <div className="grid gap-4 rounded-xl border border-border/50 bg-muted/10 p-4 sm:grid-cols-2 sm:p-5">
              <Input
                label="Student full name"
                required
                value={form.applicantName}
                onChange={(e) => onChange('applicantName', e.target.value)}
              />
              <Input
                label="Date of birth"
                type="date"
                value={form.dateOfBirth}
                onChange={(e) => onChange('dateOfBirth', e.target.value)}
              />
              <Select
                label="Grade applying for"
                value={form.gradeApplied}
                onChange={(e) => onChange('gradeApplied', e.target.value)}
                options={GRADES.map((g) => ({ value: g, label: g }))}
              />
              <Select
                label="Preferred section"
                value={form.sectionRequested}
                onChange={(e) => onChange('sectionRequested', e.target.value)}
                options={SECTIONS.map((s) => ({ value: s, label: s }))}
              />
              <Input
                label="Previous school"
                value={form.previousSchool}
                onChange={(e) => onChange('previousSchool', e.target.value)}
                wrapperClassName="sm:col-span-2"
              />
            </div>
          </div>

          <div className="space-y-5">
            <SectionHeading
              step={2}
              brandColor={brandColor}
              title="Parent / guardian"
              subtitle="We will email registration updates here"
              icon={
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 100-8 4 4 0 000 8zm6 0a4 4 0 10-3.87-5" />
                </svg>
              }
            />
            <div className="grid gap-4 rounded-xl border border-border/50 bg-muted/10 p-4 sm:grid-cols-2 sm:p-5">
              <Input
                label="Parent / guardian name"
                required
                value={form.parentName}
                onChange={(e) => onChange('parentName', e.target.value)}
              />
              <Input
                label="Parent phone"
                required
                value={form.parentPhone}
                onChange={(e) => onChange('parentPhone', e.target.value)}
              />
              <Input
                label="Parent email"
                type="email"
                required
                value={form.parentEmail}
                onChange={(e) => onChange('parentEmail', e.target.value)}
                wrapperClassName="sm:col-span-2"
              />
              <Input
                label="Emergency contact"
                value={form.emergencyContact}
                onChange={(e) => onChange('emergencyContact', e.target.value)}
                wrapperClassName="sm:col-span-2"
              />
              <Input
                label="Medical notes"
                value={form.medicalInfo}
                onChange={(e) => onChange('medicalInfo', e.target.value)}
                helperText="Allergies, inhaler, or other needs"
                wrapperClassName="sm:col-span-2"
              />
            </div>
          </div>

          {extraSchema.length > 0 && (
            <div className="space-y-5">
              <SectionHeading
                step={3}
                brandColor={brandColor}
                title="Additional questions"
                subtitle={`${schoolName || 'The school'} needs a few more details`}
                icon={
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              />
              <div className="space-y-4 rounded-xl border border-border/50 bg-muted/10 p-4 sm:p-5">
                {extraSchema.map((field) => (
                  <Input
                    key={field.key}
                    label={field.label}
                    required={field.required}
                    value={extraFields[field.key] || ''}
                    onChange={(e) =>
                      setExtraFields((prev) => ({ ...prev, [field.key]: e.target.value }))
                    }
                  />
                ))}
              </div>
            </div>
          )}

          {/* Honeypot — leave blank */}
          <div className="absolute -left-[9999px] opacity-0" aria-hidden>
            <input tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
          </div>

          <div className="space-y-3 rounded-xl border border-border/60 bg-muted/20 p-4">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
              </svg>
              Consent & account
            </div>
            <label className="flex items-start gap-2 text-xs text-foreground">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
              />
              <span>
                I consent to {schoolName || 'the school'} processing this registration data (student and
                guardian contacts) for admissions and school communications.
              </span>
            </label>
            <label className="flex items-start gap-2 text-xs text-foreground">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={createAccount}
                onChange={(e) => setCreateAccount(e.target.checked)}
              />
              <span>Also create a parent portal account with this email</span>
            </label>
            {createAccount && (
              <Input
                label="Portal password"
                type="password"
                value={accountPassword}
                onChange={(e) => setAccountPassword(e.target.value)}
                helperText="At least 6 characters"
              />
            )}
          </div>

          <Button
            type="submit"
            disabled={submitting}
            variant="organic"
            className="h-12 w-full border-none text-sm font-semibold"
            rightIcon={
              !submitting && (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              )
            }
          >
            {submitting ? 'Submitting…' : 'Submit registration'}
          </Button>
          <p className="-mt-4 text-center text-[11px] text-muted-foreground">
            Your information is only shared with {schoolName || 'the school'}.
          </p>
        </form>
      </div>
    </div>
  );
}
