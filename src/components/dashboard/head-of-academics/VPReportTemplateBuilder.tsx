'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { readStoredSession } from '@/lib/auth';
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import { ContentCard } from '@/components/dashboard/ContentCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DEFAULT_TEMPLATE,
  mergeTemplateSettings,
  type GradingScaleBand,
  type ReportCardTemplate,
  type ReportCardTemplateSettings,
  type SignatureLine,
} from '@/lib/headOfAcademicsPortal';

type DocKind = 'reportCard' | 'transcript';

export function VPReportTemplateBuilder() {
  const session = readStoredSession();
  const schoolId = session?.schoolId || 'sch-1';

  const [settings, setSettings] = useState<ReportCardTemplateSettings>(DEFAULT_TEMPLATE);
  const [docKind, setDocKind] = useState<DocKind>('reportCard');
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .getSchoolSettings(schoolId)
      .then((s) => {
        const raw = (s as { report_card_template?: Partial<ReportCardTemplateSettings> }).report_card_template;
        setSettings(mergeTemplateSettings(raw));
      })
      .catch(() => setSettings(DEFAULT_TEMPLATE));
  }, [schoolId]);

  const template = settings[docKind];

  const updateTemplate = (updater: (t: ReportCardTemplate) => ReportCardTemplate) => {
    setSettings((prev) => ({ ...prev, [docKind]: updater(prev[docKind]) }));
  };

  const save = async () => {
    setSaving(true);
    setStatus('');
    try {
      await api.updateSchoolSettings(schoolId, { report_card_template: settings });
      setStatus('Template saved.');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const addGradingBand = () => {
    updateTemplate((t) => ({
      ...t,
      gradingScale: [...t.gradingScale, { minPercent: 0, maxPercent: 0, letter: '', gpaPoints: 0 } as GradingScaleBand],
    }));
  };

  const updateGradingBand = (idx: number, patch: Partial<GradingScaleBand>) => {
    updateTemplate((t) => ({
      ...t,
      gradingScale: t.gradingScale.map((b, i) => (i === idx ? { ...b, ...patch } : b)),
    }));
  };

  const removeGradingBand = (idx: number) => {
    updateTemplate((t) => ({ ...t, gradingScale: t.gradingScale.filter((_, i) => i !== idx) }));
  };

  const addSignatureLine = () => {
    updateTemplate((t) => ({
      ...t,
      signatureLines: [...t.signatureLines, { id: `sig-${Date.now()}`, label: 'New Signatory' } as SignatureLine],
    }));
  };

  const updateSignatureLine = (idx: number, label: string) => {
    updateTemplate((t) => ({
      ...t,
      signatureLines: t.signatureLines.map((s, i) => (i === idx ? { ...s, label } : s)),
    }));
  };

  const removeSignatureLine = (idx: number) => {
    updateTemplate((t) => ({ ...t, signatureLines: t.signatureLines.filter((_, i) => i !== idx) }));
  };

  return (
    <PermissionGuard code="school.settings">
      <div className="space-y-6">
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={docKind === 'reportCard' ? 'primary' : 'outline'}
            onClick={() => setDocKind('reportCard')}
          >
            Class Report Template
          </Button>
          <Button
            size="sm"
            variant={docKind === 'transcript' ? 'primary' : 'outline'}
            onClick={() => setDocKind('transcript')}
          >
            Transcript Template
          </Button>
          <Button size="sm" variant="organic" className="ml-auto border-none" disabled={saving} onClick={save}>
            {saving ? 'Saving…' : 'Save template'}
          </Button>
        </div>
        {status && <p className="text-sm text-muted-foreground">{status}</p>}

        <ContentCard title="Header" description="Logo, document title, and school name override">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={template.header.showLogo}
                onChange={(e) => updateTemplate((t) => ({ ...t, header: { ...t.header, showLogo: e.target.checked } }))}
              />
              Show school logo
            </label>
            <Input
              label="Document title"
              value={template.header.title}
              onChange={(e) => updateTemplate((t) => ({ ...t, header: { ...t.header, title: e.target.value } }))}
            />
            <Input
              label="School name override (optional)"
              value={template.header.schoolNameOverride ?? ''}
              onChange={(e) =>
                updateTemplate((t) => ({ ...t, header: { ...t.header, schoolNameOverride: e.target.value } }))
              }
            />
            <Input
              label="Subtitle (optional)"
              value={template.header.subtitle ?? ''}
              onChange={(e) => updateTemplate((t) => ({ ...t, header: { ...t.header, subtitle: e.target.value } }))}
            />
          </div>
        </ContentCard>

        <ContentCard title="Student info fields" description="Which identity fields show on the document">
          <div className="grid gap-2 sm:grid-cols-3">
            {template.studentInfoFields.map((f, idx) => (
              <label key={f.key} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={f.enabled}
                  onChange={(e) =>
                    updateTemplate((t) => ({
                      ...t,
                      studentInfoFields: t.studentInfoFields.map((field, i) =>
                        i === idx ? { ...field, enabled: e.target.checked } : field,
                      ),
                    }))
                  }
                />
                {f.label}
              </label>
            ))}
          </div>
        </ContentCard>

        <ContentCard
          title="Grading scale"
          description="Score-range to letter-grade mapping"
          actions={
            <Button size="sm" variant="outline" onClick={addGradingBand}>
              Add band
            </Button>
          }
        >
          <div className="space-y-2">
            {template.gradingScale.map((band, idx) => (
              <div key={idx} className="grid grid-cols-5 gap-2 items-end rounded-lg border border-border/60 p-2">
                <Input
                  label="Min %"
                  type="number"
                  value={band.minPercent}
                  onChange={(e) => updateGradingBand(idx, { minPercent: Number(e.target.value) })}
                />
                <Input
                  label="Max %"
                  type="number"
                  value={band.maxPercent}
                  onChange={(e) => updateGradingBand(idx, { maxPercent: Number(e.target.value) })}
                />
                <Input
                  label="Letter"
                  value={band.letter}
                  onChange={(e) => updateGradingBand(idx, { letter: e.target.value })}
                />
                <Input
                  label="GPA points"
                  type="number"
                  step="0.1"
                  value={band.gpaPoints ?? 0}
                  onChange={(e) => updateGradingBand(idx, { gpaPoints: Number(e.target.value) })}
                />
                <Button size="sm" variant="outline" onClick={() => removeGradingBand(idx)}>
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </ContentCard>

        <ContentCard title="Subject table columns" description="Which columns show per subject row">
          <div className="grid gap-2 sm:grid-cols-3">
            {(
              [
                ['showScore', 'Score'],
                ['showMaxScore', 'Max Score'],
                ['showPercentage', 'Percentage'],
                ['showLetterGrade', 'Letter Grade'],
                ['showRemarks', 'Remarks'],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={template.subjectColumns[key]}
                  onChange={(e) =>
                    updateTemplate((t) => ({
                      ...t,
                      subjectColumns: { ...t.subjectColumns, [key]: e.target.checked },
                    }))
                  }
                />
                {label}
              </label>
            ))}
          </div>
        </ContentCard>

        <ContentCard title="Summary block" description="Term average, GPA, rank, and attendance">
          <div className="grid gap-2 sm:grid-cols-2">
            {(
              [
                ['showTermAverage', 'Term average'],
                ['showGpa', 'GPA'],
                ['showRank', 'Class rank'],
                ['showAttendanceRate', 'Attendance rate'],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={template.summaryBlock[key]}
                  onChange={(e) =>
                    updateTemplate((t) => ({
                      ...t,
                      summaryBlock: { ...t.summaryBlock, [key]: e.target.checked },
                    }))
                  }
                />
                {label}
              </label>
            ))}
          </div>
        </ContentCard>

        <ContentCard
          title="Signature lines"
          description="Who signs off on the document"
          actions={
            <Button size="sm" variant="outline" onClick={addSignatureLine}>
              Add signatory
            </Button>
          }
        >
          <div className="space-y-2">
            {template.signatureLines.map((s, idx) => (
              <div key={s.id} className="flex gap-2 items-end">
                <Input
                  label="Label"
                  value={s.label}
                  onChange={(e) => updateSignatureLine(idx, e.target.value)}
                  wrapperClassName="flex-1"
                />
                <Button size="sm" variant="outline" onClick={() => removeSignatureLine(idx)}>
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </ContentCard>

        <ContentCard title="Footer text" description="Optional note printed at the bottom of the document">
          <textarea
            className="w-full min-h-[80px] rounded-lg border border-input bg-background p-3 text-sm"
            value={template.footerText ?? ''}
            onChange={(e) => updateTemplate((t) => ({ ...t, footerText: e.target.value }))}
          />
        </ContentCard>
      </div>
    </PermissionGuard>
  );
}
