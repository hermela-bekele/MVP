'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { readStoredSession } from '@/lib/auth';
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import { ContentCard } from '@/components/dashboard/ContentCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type FormField = { key: string; label: string; type?: string; required?: boolean };

export function ApplicationFormBuilder() {
  const session = readStoredSession();
  const schoolId = session?.schoolId || 'sch-1';
  const [fields, setFields] = useState<FormField[]>([]);
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .getSchoolSettings(schoolId)
      .then((s) => {
        const schema = (s as { application_form_schema?: FormField[] }).application_form_schema;
        setFields(Array.isArray(schema) ? schema : []);
      })
      .catch(() => setFields([]));
  }, [schoolId]);

  const addField = () => {
    setFields((prev) => [
      ...prev,
      { key: `field_${prev.length + 1}`, label: 'New field', type: 'text', required: false },
    ]);
  };

  const save = async () => {
    setSaving(true);
    setStatus('');
    try {
      await api.updateSchoolSettings(schoolId, { application_form_schema: fields });
      setStatus('Form schema saved. Public apply page will show these fields.');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PermissionGuard code="school.settings">
      <ContentCard
        title="Application form builder"
        description="Extra fields shown on the public apply page"
        actions={
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={addField}>
              Add field
            </Button>
            <Button size="sm" variant="organic" className="border-none" disabled={saving} onClick={save}>
              {saving ? 'Saving…' : 'Save schema'}
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
              <Input
                label="Type"
                value={f.type || 'text'}
                onChange={(e) =>
                  setFields((prev) =>
                    prev.map((x, i) => (i === idx ? { ...x, type: e.target.value } : x))
                  )
                }
                inputSize="sm"
              />
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
          {status && <p className="text-xs text-muted-foreground">{status}</p>}
        </div>
      </ContentCard>
    </PermissionGuard>
  );
}
