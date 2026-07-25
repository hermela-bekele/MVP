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

export default function PublicApplyPage() {
  const params = useParams();
  const slug = String(params.schoolSlug || '');
  const [schoolName, setSchoolName] = useState('');
  const [fees, setFees] = useState<{
    registrationFee: number;
    monthlyTuition: number;
    currency: string;
  } | null>(null);
  const [branding, setBranding] = useState<{
    primaryColor?: string;
    tagline?: string;
    logoUrl?: string;
    schoolDisplayName?: string;
  }>({});
  const [gradeFeePlans, setGradeFeePlans] = useState<
    { grade: string; registrationFee: number; monthlyTuition: number }[]
  >([]);
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
    sourceChannel: 'website',
  });
  const [extraFields, setExtraFields] = useState<Record<string, string>>({});

  useEffect(() => {
    api
      .getPublicSchool(slug)
      .then((data) => {
        setSchoolName(data.school.name);
        setFees(data.fees);
        setBranding(
          (data as { branding?: typeof branding }).branding || {}
        );
        setGradeFeePlans(
          (data as { gradeFeePlans?: typeof gradeFeePlans }).gradeFeePlans || []
        );
        setRequiredDocs(
          (data as { requiredDocuments?: string[] }).requiredDocuments || []
        );
        const schema = (data.formSchema as { key: string; label: string; type?: string; required?: boolean }[]) || [];
        setExtraSchema(schema.filter((f) => !['previousSchool', 'medicalInfo'].includes(f.key)));
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message || 'School not found');
        setLoading(false);
      });
  }, [slug]);

  useEffect(() => {
    const plan = gradeFeePlans.find((p) => p.grade === form.gradeApplied);
    if (plan && fees) {
      setFees({
        ...fees,
        registrationFee: plan.registrationFee,
        monthlyTuition: plan.monthlyTuition,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only refresh fees when grade or plans change
  }, [form.gradeApplied, gradeFeePlans]);

  const brandColor = branding.primaryColor || undefined;
  const displayName = branding.schoolDisplayName || schoolName || 'School';
  const initials = (displayName || 'PR')
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

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
          /* account may already exist — continue apply */
        }
      }
      const app = (await api.submitPublicApplication(slug, {
        ...form,
        formData: extraFields,
        consentAccepted: true,
        website: honeypot,
        submit: true,
      })) as { referenceCode: string };
      setSuccess(
        `Application submitted. Reference ${app.referenceCode}. Check your email for confirmation.`
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
          <p className="text-sm text-muted-foreground">Loading application form…</p>
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
                <p className="text-[11px] text-muted-foreground">Admissions</p>
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
              className="text-[11px] font-bold uppercase tracking-[0.18em]"
              style={{ color: brandColor || undefined }}
            >
              Apply now
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {displayName}
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
              {branding.tagline ||
                'Complete this form to apply. On acceptance, registration and first-month tuition are billed together. Your seat is reserved until the invoice deadline.'}
            </p>
          </div>
          {fees && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-border/70 bg-card/80 px-4 py-3 shadow-sm backdrop-blur">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Registration ({form.gradeApplied})
                </p>
                <p className="mt-1 text-xl font-bold text-foreground">
                  {fees.currency} {fees.registrationFee.toLocaleString()}
                </p>
              </div>
              <div className="rounded-xl border border-border/70 bg-card/80 px-4 py-3 shadow-sm backdrop-blur">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  First month tuition
                </p>
                <p className="mt-1 text-xl font-bold text-foreground">
                  {fees.currency} {fees.monthlyTuition.toLocaleString()}
                </p>
              </div>
            </div>
          )}
          {requiredDocs.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Required documents after submit (upload via parent portal): {requiredDocs.join(', ')}
            </p>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        {error && (
          <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
            {success}
          </div>
        )}

        <form
          onSubmit={onSubmit}
          className="relative space-y-6 rounded-2xl border border-border/70 bg-card p-5 shadow-md sm:p-8"
        >
          <div>
            <h2 className="text-sm font-bold text-foreground">Student details</h2>
            <p className="text-xs text-muted-foreground">Tell us about the applicant</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
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

          <div className="border-t border-border/60 pt-6">
            <h2 className="text-sm font-bold text-foreground">Parent / guardian</h2>
            <p className="text-xs text-muted-foreground">We will email admission updates here</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
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
            <Select
              label="How did you find us?"
              value={form.sourceChannel}
              onChange={(e) => onChange('sourceChannel', e.target.value)}
              options={[
                { value: 'website', label: 'School website' },
                { value: 'facebook', label: 'Facebook' },
                { value: 'telegram', label: 'Telegram' },
                { value: 'referral', label: 'Referral' },
                { value: 'other', label: 'Other' },
              ]}
            />
            <Input
              label="Medical notes"
              value={form.medicalInfo}
              onChange={(e) => onChange('medicalInfo', e.target.value)}
              helperText="Allergies, inhaler, or other needs"
            />
          </div>

          {extraSchema.length > 0 && (
            <div className="border-t border-border/60 pt-6 space-y-4">
              <h2 className="text-sm font-bold text-foreground">Additional questions</h2>
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
          )}

          {/* Honeypot — leave blank */}
          <div className="absolute -left-[9999px] opacity-0" aria-hidden>
            <input tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
          </div>

          <div className="space-y-3 rounded-xl border border-border/60 bg-muted/20 p-4">
            <label className="flex items-start gap-2 text-xs text-foreground">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
              />
              <span>
                I consent to {schoolName || 'the school'} processing this application data (student and
                guardian contacts) for admissions, billing, and school communications, in line with Ethiopia
                data protection practices.
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
            className="h-11 w-full border-none text-sm font-semibold"
          >
            {submitting ? 'Submitting…' : 'Submit application'}
          </Button>
        </form>
      </div>
    </div>
  );
}
