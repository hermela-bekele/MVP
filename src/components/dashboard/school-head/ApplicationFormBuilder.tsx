'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { readStoredSession } from '@/lib/auth';
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import { ContentCard } from '@/components/dashboard/ContentCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';

type FormField = { key: string; label: string; type?: string; required?: boolean };

const FIELD_TYPES = ['text', 'email', 'tel', 'date', 'number', 'textarea', 'select'];

function slugifyDocType(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function formatDocType(docType: string): string {
  return docType.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Configures the school's single default apply page (/apply/[schoolSlug]).
 * Field type is a fixed set (not free text) so a typo can't silently break the
 * public form's rendering — and required documents are captured here too,
 * since the public page already displays and requires them (school_settings
 * .required_documents) but this panel previously had no control for it at all.
 */
export function ApplicationFormBuilder() {
  const session = readStoredSession();
  const schoolId = session?.schoolId || 'sch-1';
  const [fields, setFields] = useState<FormField[]>([]);
  const [requiredDocuments, setRequiredDocuments] = useState<string[]>([]);
  const [newDocLabel, setNewDocLabel] = useState('');
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .getSchoolSettings(schoolId)
      .then((s) => {
        const settings = s as { application_form_schema?: FormField[]; required_documents?: string[] };
        setFields(Array.isArray(settings.application_form_schema) ? settings.application_form_schema : []);
        setRequiredDocuments(Array.isArray(settings.required_documents) ? settings.required_documents : []);
      })
      .catch(() => {
        setFields([]);
        setRequiredDocuments([]);
      });
  }, [schoolId]);

  const addField = () => {
    setFields((prev) => [
      ...prev,
      { key: `field_${prev.length + 1}`, label: 'New field', type: 'text', required: false },
    ]);
  };

  const addDoc = () => {
    const label = newDocLabel.trim();
    if (!label) return;
    const key = slugifyDocType(label);
    if (!key || requiredDocuments.includes(key)) {
      setNewDocLabel('');
      return;
    }
    setRequiredDocuments((prev) => [...prev, key]);
    setNewDocLabel('');
  };

  const save = async () => {
    setSaving(true);
    setStatus('');
    try {
      await api.updateSchoolSettings(schoolId, {
        application_form_schema: fields,
        required_documents: requiredDocuments,
      });
      setStatus('Saved. The public apply page reflects these fields and documents immediately.');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PermissionGuard code="school.settings">
      <div className="space-y-6">
        <ContentCard
          title="Application form builder"
          description="Extra fields shown on this school's default apply page, in addition to the standard applicant, parent/guardian, and grade details every application always collects."
          actions={
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={addField}>
                Add field
              </Button>
              <Button size="sm" variant="organic" className="border-none" disabled={saving} onClick={save}>
                {saving ? 'Saving…' : 'Save'}
              </Button>
            </div>
          }
        >
          <div className="space-y-3">
            {fields.map((f, idx) => (
              <div key={idx} className="grid gap-2 rounded-xl border border-border/60 p-3 sm:grid-cols-4">
                <Input
                  label="Key"
                  value={f.key}
                  onChange={(e) =>
                    setFields((prev) => prev.map((x, i) => (i === idx ? { ...x, key: e.target.value } : x)))
                  }
                  inputSize="sm"
                />
                <Input
                  label="Label"
                  value={f.label}
                  onChange={(e) =>
                    setFields((prev) =>
                      prev.map((x, i) => (i === idx ? { ...x, label: e.target.value } : x))
                    )
                  }
                  inputSize="sm"
                />
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Type</label>
                  <Select
                    options={FIELD_TYPES.map((t) => ({ value: t, label: t }))}
                    value={f.type || 'text'}
                    onChange={(e) =>
                      setFields((prev) =>
                        prev.map((x, i) => (i === idx ? { ...x, type: e.target.value } : x))
                      )
                    }
                  />
                </div>
                <div className="flex items-end gap-2">
                  <label className="flex items-center gap-2 pb-2 text-xs">
                    <input
                      type="checkbox"
                      checked={!!f.required}
                      onChange={(e) =>
                        setFields((prev) =>
                          prev.map((x, i) => (i === idx ? { ...x, required: e.target.checked } : x))
                        )
                      }
                    />
                    Required
                  </label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setFields((prev) => prev.filter((_, i) => i !== idx))}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
            {!fields.length && (
              <p className="text-xs text-muted-foreground">No extra fields yet. Add one to customize the apply form.</p>
            )}
          </div>
        </ContentCard>

        <ContentCard
          title="Required documents"
          description="Documents a parent must upload (from the parent portal) before this school's default application can be accepted."
        >
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {requiredDocuments.map((docType) => (
                <span
                  key={docType}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/30 px-3 py-1 text-[10px] font-medium text-foreground"
                >
                  {formatDocType(docType)}
                  <button
                    type="button"
                    onClick={() => setRequiredDocuments((prev) => prev.filter((x) => x !== docType))}
                    className="text-muted-foreground hover:text-destructive cursor-pointer"
                    aria-label={`Remove ${formatDocType(docType)}`}
                  >
                    ×
                  </button>
                </span>
              ))}
              {requiredDocuments.length === 0 && (
                <p className="text-xs text-muted-foreground">No documents required yet.</p>
              )}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newDocLabel}
                onChange={(e) => setNewDocLabel(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addDoc();
                  }
                }}
                placeholder="e.g. Birth Certificate"
                className="w-full h-10 px-3 bg-muted/40 border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <Button size="sm" variant="outline" className="shrink-0" onClick={addDoc}>
                Add Document
              </Button>
            </div>
          </div>
        </ContentCard>

        {status && <p className="text-xs text-muted-foreground">{status}</p>}
      </div>
    </PermissionGuard>
  );
}
