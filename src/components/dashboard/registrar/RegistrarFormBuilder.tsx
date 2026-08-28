'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { ContentCard } from '@/components/dashboard/ContentCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { api, type RegistrationFormField, type RegistrationFormTemplate } from '@/lib/api';
import { readStoredSession } from '@/lib/auth';

const inputClass =
  'w-full h-10 px-3 bg-muted/40 border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring';

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

function emptyDraft() {
  return {
    id: '' as string | null,
    name: '',
    description: '',
    fields: [] as RegistrationFormField[],
    requiredDocuments: [] as string[],
  };
}

export const RegistrarFormBuilder: React.FC = () => {
  const session = readStoredSession();
  const schoolId = session?.schoolId || 'sch-1';

  const [templates, setTemplates] = useState<RegistrationFormTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(emptyDraft());
  const [newDocLabel, setNewDocLabel] = useState('');
  const [saving, setSaving] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [savedTemplate, setSavedTemplate] = useState<RegistrationFormTemplate | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const list = await api.listRegistrationForms(schoolId);
      setTemplates(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load registration forms');
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const linkFor = (code: string) =>
    typeof window !== 'undefined' ? `${window.location.origin}/register/${code}` : `/register/${code}`;

  const copyLink = async (code: string) => {
    try {
      await navigator.clipboard.writeText(linkFor(code));
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      /* clipboard may be unavailable — link is still shown on screen */
    }
  };

  const startNew = () => {
    setDraft(emptyDraft());
    setSavedTemplate(null);
    setError('');
    setEditing(true);
  };

  const startEdit = (t: RegistrationFormTemplate) => {
    setDraft({
      id: t.id,
      name: t.name,
      description: t.description || '',
      fields: t.fields,
      requiredDocuments: t.requiredDocuments,
    });
    setSavedTemplate(t);
    setError('');
    setEditing(true);
  };

  const addField = () => {
    setDraft((d) => ({
      ...d,
      fields: [...d.fields, { key: `field_${d.fields.length + 1}`, label: 'New question', type: 'text', required: false }],
    }));
  };

  const addDoc = () => {
    const label = newDocLabel.trim();
    if (!label) return;
    const key = slugifyDocType(label);
    if (!key || draft.requiredDocuments.includes(key)) {
      setNewDocLabel('');
      return;
    }
    setDraft((d) => ({ ...d, requiredDocuments: [...d.requiredDocuments, key] }));
    setNewDocLabel('');
  };

  const save = async () => {
    if (!draft.name.trim()) {
      setError('Form name is required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      let result: RegistrationFormTemplate;
      if (draft.id) {
        result = await api.updateRegistrationForm(draft.id, {
          name: draft.name,
          description: draft.description,
          fields: draft.fields,
          requiredDocuments: draft.requiredDocuments,
        });
      } else {
        result = await api.createRegistrationForm({
          schoolId,
          name: draft.name,
          description: draft.description,
          fields: draft.fields,
          requiredDocuments: draft.requiredDocuments,
        });
      }
      setSavedTemplate(result);
      setDraft((d) => ({ ...d, id: result.id }));
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (t: RegistrationFormTemplate) => {
    try {
      await api.updateRegistrationForm(t.id, { active: !t.active });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    }
  };

  if (editing) {
    return (
      <div className="w-full animate-fade-in space-y-4">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            ← Back to registration forms
          </button>
        </div>

        <ContentCard
          title={draft.id ? 'Edit Registration Form' : 'New Registration Form'}
          description="Choose what information to collect and which documents are required. Every submission always includes the applicant's name, date of birth, grade, section, and parent/guardian contact details."
        >
          <div className="space-y-5">
            {error && (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Form Name</label>
                <input
                  type="text"
                  value={draft.name}
                  onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                  className={inputClass}
                  placeholder="e.g. 2026 New Admissions"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Description (Optional)</label>
                <input
                  type="text"
                  value={draft.description}
                  onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                  className={inputClass}
                  placeholder="Shown to parents on the form"
                />
              </div>
            </div>

            <hr className="border-border/30" />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-bold text-primary uppercase tracking-wider">
                  Additional Information To Collect
                </h4>
                <Button size="sm" variant="outline" className="text-xs h-8" onClick={addField}>
                  + Add Question
                </Button>
              </div>
              {draft.fields.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No extra questions yet — the form will still collect the standard student and parent details.
                </p>
              )}
              <div className="space-y-2">
                {draft.fields.map((f, idx) => (
                  <div key={idx} className="grid gap-2 rounded-lg border border-border/60 p-3 sm:grid-cols-[1fr_1fr_auto_auto]">
                    <input
                      type="text"
                      value={f.label}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          fields: d.fields.map((x, i) => (i === idx ? { ...x, label: e.target.value } : x)),
                        }))
                      }
                      className={inputClass}
                      placeholder="Question label"
                    />
                    <select
                      value={f.type || 'text'}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          fields: d.fields.map((x, i) => (i === idx ? { ...x, type: e.target.value } : x)),
                        }))
                      }
                      className={inputClass}
                    >
                      {FIELD_TYPES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                    <label className="flex items-center gap-1.5 px-1 text-[10px] font-medium text-muted-foreground whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={!!f.required}
                        onChange={(e) =>
                          setDraft((d) => ({
                            ...d,
                            fields: d.fields.map((x, i) => (i === idx ? { ...x, required: e.target.checked } : x)),
                          }))
                        }
                      />
                      Required
                    </label>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-[10px] h-9 px-2"
                      onClick={() => setDraft((d) => ({ ...d, fields: d.fields.filter((_, i) => i !== idx) }))}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <hr className="border-border/30" />

            <div className="space-y-2">
              <h4 className="text-[10px] font-bold text-accent uppercase tracking-wider">Required Documents</h4>
              <p className="text-xs text-muted-foreground">
                Documents parents must upload (from the parent portal) before this application can be accepted.
              </p>
              <div className="flex flex-wrap gap-2">
                {draft.requiredDocuments.map((docType) => (
                  <span
                    key={docType}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/30 px-3 py-1 text-[10px] font-medium text-foreground"
                  >
                    {formatDocType(docType)}
                    <button
                      type="button"
                      onClick={() =>
                        setDraft((d) => ({
                          ...d,
                          requiredDocuments: d.requiredDocuments.filter((x) => x !== docType),
                        }))
                      }
                      className="text-muted-foreground hover:text-destructive cursor-pointer"
                      aria-label={`Remove ${formatDocType(docType)}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
                {draft.requiredDocuments.length === 0 && (
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
                  className={inputClass}
                  placeholder="e.g. Birth Certificate"
                />
                <Button size="sm" variant="outline" className="text-xs h-10 shrink-0" onClick={addDoc}>
                  Add Document
                </Button>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                variant="organic"
                size="sm"
                className="text-xs h-10 border-none font-semibold px-6"
                disabled={saving}
                onClick={save}
              >
                {saving ? 'Saving…' : savedTemplate ? 'Save Changes' : 'Create Form & Generate Link'}
              </Button>
            </div>

            {savedTemplate && (
              <div className="rounded-lg border border-success/40 bg-success/10 p-4 space-y-2">
                <p className="text-xs font-semibold text-success">Registration link ready</p>
                <div className="flex flex-wrap items-center gap-2">
                  <code className="flex-1 min-w-0 truncate rounded-md bg-background/60 px-3 py-2 text-xs text-foreground">
                    {linkFor(savedTemplate.code)}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs h-9 shrink-0"
                    onClick={() => copyLink(savedTemplate.code)}
                  >
                    {copiedCode === savedTemplate.code ? 'Copied!' : 'Copy Link'}
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Share this link with applicants. It always reflects the current saved configuration for this form.
                </p>
              </div>
            )}
          </div>
        </ContentCard>
      </div>
    );
  }

  return (
    <div className="w-full animate-fade-in space-y-4">
      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </div>
      )}
      <ContentCard
        title="Registration Forms"
        description="Configure what information and documents to collect, then share a link. Create a new form each time requirements change."
        actions={
          <Button variant="organic" size="sm" className="text-xs h-9 border-none font-semibold" onClick={startNew}>
            + New Registration Form
          </Button>
        }
      >
        {loading ? (
          <p className="text-xs text-muted-foreground text-center py-6">Loading…</p>
        ) : templates.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">
            No registration forms yet. Create one to get a shareable registration link.
          </p>
        ) : (
          <div className="space-y-2">
            {templates.map((t) => (
              <div
                key={t.id}
                className="flex flex-col gap-2 rounded-lg border border-border/60 bg-muted/20 p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold text-foreground truncate">{t.name}</p>
                    <Badge variant={t.active ? 'success' : 'neutral'} size="sm">
                      {t.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {t.fields.length} extra question{t.fields.length === 1 ? '' : 's'} ·{' '}
                    {t.requiredDocuments.length} required document{t.requiredDocuments.length === 1 ? '' : 's'}
                  </p>
                  <code className="text-[10px] text-primary truncate block">{linkFor(t.code)}</code>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" variant="outline" className="text-[10px] h-8 px-2" onClick={() => copyLink(t.code)}>
                    {copiedCode === t.code ? 'Copied!' : 'Copy Link'}
                  </Button>
                  <Button size="sm" variant="outline" className="text-[10px] h-8 px-2" onClick={() => startEdit(t)}>
                    Edit
                  </Button>
                  <Button size="sm" variant="outline" className="text-[10px] h-8 px-2" onClick={() => toggleActive(t)}>
                    {t.active ? 'Deactivate' : 'Activate'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </ContentCard>
    </div>
  );
};
