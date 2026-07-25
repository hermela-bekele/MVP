'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { readStoredSession } from '@/lib/auth';
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import { ContentCard } from '@/components/dashboard/ContentCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const GRADES = ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];

export function SchoolBillingSettings() {
  const session = readStoredSession();
  const schoolId = session?.schoolId || 'sch-1';
  const [registrationFee, setRegistrationFee] = useState('500');
  const [monthlyTuition, setMonthlyTuition] = useState('2500');
  const [siblingPct, setSiblingPct] = useState('10');
  const [primaryColor, setPrimaryColor] = useState('#1d4ed8');
  const [tagline, setTagline] = useState('');
  const [requiredDocs, setRequiredDocs] = useState('birth_certificate,previous_report');
  const [plans, setPlans] = useState<{ grade: string; registrationFee: string; monthlyTuition: string }[]>(
    GRADES.map((g) => ({ grade: g, registrationFee: '500', monthlyTuition: '2500' }))
  );
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      api.getSchoolSettings(schoolId),
      api.listFeePlans(schoolId).catch(() => []),
    ]).then(([settings, feePlans]) => {
      const s = settings as Record<string, unknown>;
      setRegistrationFee(String(s.registration_fee ?? 500));
      setMonthlyTuition(String(s.monthly_tuition ?? 2500));
      setSiblingPct(String(s.sibling_discount_percent ?? 0));
      const branding = (s.branding as { primaryColor?: string; tagline?: string }) || {};
      setPrimaryColor(branding.primaryColor || '#1d4ed8');
      setTagline(branding.tagline || '');
      const docs = Array.isArray(s.required_documents)
        ? (s.required_documents as string[]).join(',')
        : 'birth_certificate,previous_report';
      setRequiredDocs(docs);
      if (Array.isArray(feePlans) && feePlans.length) {
        setPlans(
          GRADES.map((g) => {
            const hit = feePlans.find((p) => p.grade === g);
            return {
              grade: g,
              registrationFee: String(hit?.registrationFee ?? s.registration_fee ?? 500),
              monthlyTuition: String(hit?.monthlyTuition ?? s.monthly_tuition ?? 2500),
            };
          })
        );
      }
    });
  }, [schoolId]);

  const save = async () => {
    setSaving(true);
    setStatus('');
    try {
      await api.updateSchoolSettings(schoolId, {
        registration_fee: Number(registrationFee),
        monthly_tuition: Number(monthlyTuition),
        sibling_discount_percent: Number(siblingPct),
        required_documents: requiredDocs
          .split(',')
          .map((d) => d.trim())
          .filter(Boolean),
        branding: { primaryColor, tagline },
      });
      await api.saveFeePlans(
        schoolId,
        plans.map((p) => ({
          grade: p.grade,
          registrationFee: Number(p.registrationFee),
          monthlyTuition: Number(p.monthlyTuition),
        }))
      );
      setStatus('Billing settings and grade fee plans saved.');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PermissionGuard code="school.settings">
      <ContentCard
        title="Billing & branding"
        description="Default fees, sibling discount, required docs, and apply-page branding"
        actions={
          <Button size="sm" variant="organic" className="border-none" disabled={saving} onClick={save}>
            {saving ? 'Saving…' : 'Save settings'}
          </Button>
        }
      >
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <Input label="Default registration" value={registrationFee} onChange={(e) => setRegistrationFee(e.target.value)} />
            <Input label="Default monthly tuition" value={monthlyTuition} onChange={(e) => setMonthlyTuition(e.target.value)} />
            <Input label="Sibling discount %" value={siblingPct} onChange={(e) => setSiblingPct(e.target.value)} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Brand color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} />
            <Input label="Apply page tagline" value={tagline} onChange={(e) => setTagline(e.target.value)} />
          </div>
          <Input
            label="Required document types (comma-separated)"
            value={requiredDocs}
            onChange={(e) => setRequiredDocs(e.target.value)}
          />
          <div className="space-y-2">
            <p className="text-xs font-semibold text-foreground">Per-grade fee plans</p>
            {plans.map((p, idx) => (
              <div key={p.grade} className="grid gap-2 sm:grid-cols-3">
                <p className="flex items-center text-sm font-medium">{p.grade}</p>
                <Input
                  label="Registration"
                  value={p.registrationFee}
                  onChange={(e) =>
                    setPlans((prev) =>
                      prev.map((x, i) => (i === idx ? { ...x, registrationFee: e.target.value } : x))
                    )
                  }
                  inputSize="sm"
                />
                <Input
                  label="Monthly tuition"
                  value={p.monthlyTuition}
                  onChange={(e) =>
                    setPlans((prev) =>
                      prev.map((x, i) => (i === idx ? { ...x, monthlyTuition: e.target.value } : x))
                    )
                  }
                  inputSize="sm"
                />
              </div>
            ))}
          </div>
          {status && <p className="text-xs text-muted-foreground">{status}</p>}
        </div>
      </ContentCard>
    </PermissionGuard>
  );
}
