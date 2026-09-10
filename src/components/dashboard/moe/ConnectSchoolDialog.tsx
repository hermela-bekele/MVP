'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { ApiError } from '@/lib/api';
import { Dialog, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { FormField, FormSectionHeading, formFieldInputClass } from '@/components/ui/form-field';

interface ConnectSchoolDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = 'form' | 'confirmed';

/**
 * Replaces the old free-form "Register School" dialog. There is no live Ministry
 * EMIS directory integration yet (no credentials/API access exist), so this does
 * not pretend to search one — it records the institution's details as reported by
 * MOE, keeps an optional EMIS reference ID for future reconciliation once EMIS
 * access is available, and assigns the school's platform administrator in the
 * same step (§9 of the MOE requirements: search/select -> activate -> assign
 * admin -> confirm).
 */
export function ConnectSchoolDialog({ isOpen, onClose }: ConnectSchoolDialogProps) {
  const { regions, connectSchool } = useApp();

  const [name, setName] = useState('');
  const [region, setRegion] = useState('');
  const [type, setType] = useState<'Public' | 'Private'>('Public');
  const [principal, setPrincipal] = useState('');
  const [capacity, setCapacity] = useState(1000);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [emisId, setEmisId] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');

  const [error, setError] = useState('');
  const [duplicateWarning, setDuplicateWarning] = useState<{ code: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<Step>('form');
  const [result, setResult] = useState<{ code: string; adminEmail: string; temporaryPassword: string } | null>(null);

  const reset = () => {
    setName(''); setRegion(''); setType('Public'); setPrincipal(''); setCapacity(1000);
    setEmail(''); setPhone(''); setEmisId(''); setAdminName(''); setAdminEmail('');
    setError(''); setDuplicateWarning(null); setStep('form'); setResult(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const submit = async (confirmDuplicate: boolean) => {
    if (!name || !region || !principal || !email || !adminName || !adminEmail) {
      setError('Please complete every required field.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const { school, admin } = await connectSchool({
        name, region, type, principal, email, phone: phone || undefined,
        capacity, emisId: emisId || undefined, adminName, adminEmail,
        confirmDuplicate,
      });
      setResult({ code: school.code, adminEmail: admin.email, temporaryPassword: admin.temporaryPassword });
      setDuplicateWarning(null);
      setStep('confirmed');
    } catch (err) {
      if (err instanceof ApiError && err.status === 409 && err.body && typeof err.body === 'object' && 'existing' in err.body) {
        const existing = (err.body as { existing?: { code: string } }).existing;
        if (existing) {
          setDuplicateWarning(existing);
          setError('');
          setSubmitting(false);
          return;
        }
      }
      setError(err instanceof ApiError ? err.message : 'Could not connect this school. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={handleClose}
      title={step === 'form' ? 'Connect / Activate School in PRIME EduAI' : 'School Connected'}
      description={
        step === 'form'
          ? 'Ministry EMIS directory integration is not yet available, so this registers the institution from details you provide. Enter an EMIS reference ID below if known, so this record can be reconciled automatically once EMIS access is enabled.'
          : undefined
      }
    >
      {step === 'form' ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void submit(false);
          }}
          className="space-y-5 text-left"
        >
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-md text-xxs font-bold">
              ⚠ {error}
            </div>
          )}
          {duplicateWarning && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-700 rounded-md text-xxs font-bold space-y-2">
              <p>A school named &quot;{name}&quot; already exists in {region} (code {duplicateWarning.code}).</p>
              <Button type="button" size="sm" variant="outline" className="h-7 text-xxs" onClick={() => void submit(true)} disabled={submitting}>
                Connect as a separate institution anyway
              </Button>
            </div>
          )}

          <div className="space-y-4">
            <FormSectionHeading>Institution Identity</FormSectionHeading>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="School Name">
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Hawassa Academy" className={formFieldInputClass} />
              </FormField>
              <FormField label="Institution Principal">
                <input type="text" required value={principal} onChange={(e) => setPrincipal(e.target.value)} placeholder="e.g. Ato Martha" className={formFieldInputClass} />
              </FormField>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <FormField label="Region">
                <Select
                  options={[{ value: '', label: 'Select region…' }, ...regions.map((r) => ({ value: r.name, label: r.name }))]}
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                />
              </FormField>
              <FormField label="Funding Sector">
                <Select
                  options={[{ value: 'Public', label: 'Public Sector' }, { value: 'Private', label: 'Private Sector' }]}
                  value={type}
                  onChange={(e) => setType(e.target.value as 'Public' | 'Private')}
                />
              </FormField>
              <FormField label="Total Student Capacity">
                <input type="number" required value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} className={formFieldInputClass} />
              </FormField>
            </div>
            <FormField label="EMIS Reference ID (optional, if known)">
              <input type="text" value={emisId} onChange={(e) => setEmisId(e.target.value)} placeholder="Not required — leave blank if unknown" className={formFieldInputClass} />
            </FormField>
          </div>

          <div className="space-y-4">
            <FormSectionHeading>Contact Information</FormSectionHeading>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Administrative Email">
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="office@academy.edu.et" className={formFieldInputClass} />
              </FormField>
              <FormField label="Direct Hotline Phone">
                <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+251-46-XXX-XXXX" className={formFieldInputClass} />
              </FormField>
            </div>
          </div>

          <div className="space-y-4">
            <FormSectionHeading>Assign Platform Administrator</FormSectionHeading>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Administrator Full Name">
                <input type="text" required value={adminName} onChange={(e) => setAdminName(e.target.value)} placeholder="e.g. Dr. Semeneh Yohannes" className={formFieldInputClass} />
              </FormField>
              <FormField label="Administrator Login Email">
                <input type="email" required value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} placeholder="principal@academy.edu.et" className={formFieldInputClass} />
              </FormField>
            </div>
          </div>

          <DialogFooter className="mt-2">
            <Button type="button" variant="outline" onClick={handleClose} className="text-xs h-10">
              Cancel
            </Button>
            <Button type="submit" variant="organic" className="text-xs h-10 border-none" disabled={submitting}>
              {submitting ? 'Connecting…' : 'Connect & Activate School'}
            </Button>
          </DialogFooter>
        </form>
      ) : (
        <div className="space-y-4 text-left">
          <div className="p-4 bg-primary/10 border border-primary/20 rounded-md space-y-1">
            <p className="text-xs font-bold text-foreground">School connected — code {result?.code}</p>
            <p className="text-xxs text-muted-foreground">Integration status: Connected (Manual Entry — EMIS sync pending)</p>
          </div>
          <div className="p-4 bg-muted/40 border border-border rounded-md space-y-1">
            <p className="text-xxs font-bold text-foreground uppercase">Platform administrator</p>
            <p className="text-xs text-foreground">{result?.adminEmail}</p>
            <p className="text-xxs text-muted-foreground">Temporary password (share securely, shown only once):</p>
            <p className="text-sm font-mono font-bold text-foreground select-all">{result?.temporaryPassword}</p>
          </div>
          <DialogFooter>
            <Button type="button" variant="organic" className="text-xs h-10 border-none" onClick={handleClose}>
              Done
            </Button>
          </DialogFooter>
        </div>
      )}
    </Dialog>
  );
}
