'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { readStoredSession } from '@/lib/auth';
import { ApiError } from '@/lib/api';
import { academicResultsApi, type ReportTemplateRecord } from '@/lib/academicResults';
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import { ContentCard } from '@/components/dashboard/ContentCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DEFAULT_TEMPLATE,
  mergeTemplateSettings,
  type GradingScaleBand,
  type ReportCardTemplate,
  type SignatureLine,
} from '@/lib/headOfAcademicsPortal';
import type { RenderableReportDoc } from '@/lib/reportCardPdf';
import { ReportDocumentPreview } from './ReportDocumentPreview';

type DocKind = 'report_card' | 'transcript';

const SAMPLE_DOC: Record<DocKind, RenderableReportDoc> = {
  report_card: {
    kind: 'report-card',
    schoolName: 'Sample School',
    student: { name: 'Abebe Kebede', studentId: 'PTS/1001/18', grade: 'Grade 9', section: 'A', parentName: 'Kebede Alemu' },
    term: 'Semester I',
    academicYear: '2025/26',
    subjectGroups: [
      {
        rows: [
          { subject: 'Mathematics', entries: [], averagePercent: 92, letterGrade: 'A' },
          { subject: 'English', entries: [], averagePercent: 85, letterGrade: 'B' },
          { subject: 'Biology', entries: [], averagePercent: 78, letterGrade: 'C' },
        ],
        averagePercent: 85,
        gpa: 3.3,
      },
    ],
    rank: 3,
    rankPopulation: 42,
    attendanceRate: 96,
    conduct: 'Excellent',
    promotionStatus: 'Promoted to Grade 10',
  },
  transcript: {
    kind: 'transcript',
    schoolName: 'Sample School',
    student: { name: 'Abebe Kebede', studentId: 'PTS/1001/18', grade: 'Grade 10', section: 'A', parentName: 'Kebede Alemu' },
    subjectGroups: [
      {
        term: 'Grade 9 — Semester I',
        rows: [
          { subject: 'Mathematics', entries: [], averagePercent: 90, letterGrade: 'A' },
          { subject: 'English', entries: [], averagePercent: 83, letterGrade: 'B' },
        ],
        averagePercent: 86,
        gpa: null,
      },
      {
        term: 'Grade 9 — Semester II',
        rows: [
          { subject: 'Mathematics', entries: [], averagePercent: 94, letterGrade: 'A' },
          { subject: 'English', entries: [], averagePercent: 88, letterGrade: 'B' },
        ],
        averagePercent: 91,
        gpa: null,
      },
    ],
    rank: 5,
    rankPopulation: 40,
  },
};

export function VPReportTemplateBuilder() {
  const session = readStoredSession();
  const schoolId = session?.schoolId || 'sch-1';

  const [docKind, setDocKind] = useState<DocKind>('report_card');
  const [templates, setTemplates] = useState<ReportTemplateRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [draftConfig, setDraftConfig] = useState<ReportCardTemplate>(DEFAULT_TEMPLATE.reportCard);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [busyAction, setBusyAction] = useState(false);

  const loadTemplates = useCallback(() => {
    academicResultsApi
      .listReportTemplates(docKind, schoolId)
      .then((list) => {
        setTemplates(list);
        const active = list.find((t) => t.isActive) ?? list[0];
        setSelectedId(active?.id ?? '');
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load templates.'));
  }, [docKind, schoolId]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const selected = templates.find((t) => t.id === selectedId) ?? null;

  useEffect(() => {
    if (!selected) return;
    const fallback = docKind === 'report_card' ? DEFAULT_TEMPLATE.reportCard : DEFAULT_TEMPLATE.transcript;
    const merged =
      docKind === 'report_card'
        ? mergeTemplateSettings({ reportCard: selected.config as unknown as ReportCardTemplate }).reportCard
        : mergeTemplateSettings({ transcript: selected.config as unknown as ReportCardTemplate }).transcript;
    setDraftConfig(merged ?? fallback);
  }, [selected, docKind]);

  const isEditable = Boolean(selected && !selected.isSystem);

  const updateTemplate = (updater: (t: ReportCardTemplate) => ReportCardTemplate) => {
    if (!isEditable) return;
    setDraftConfig((prev) => updater(prev));
  };

  const save = async () => {
    if (!selected || !isEditable) return;
    setSaving(true);
    setStatus('');
    setError('');
    try {
      await academicResultsApi.updateReportTemplate(selected.id, {
        config: draftConfig as unknown as Record<string, unknown>,
        schoolId,
      });
      setStatus('Template saved.');
      loadTemplates();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const duplicate = async () => {
    if (!selected) return;
    setBusyAction(true);
    setError('');
    try {
      const copy = await academicResultsApi.duplicateReportTemplate(selected.id, { schoolId });
      await loadTemplatesAndSelect(copy.id);
      setStatus(`Duplicated as "${copy.name}" — now editable.`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Duplicate failed');
    } finally {
      setBusyAction(false);
    }
  };

  const activate = async () => {
    if (!selected) return;
    setBusyAction(true);
    setError('');
    try {
      await academicResultsApi.activateReportTemplate(selected.id, schoolId);
      setStatus(`"${selected.name}" is now the active ${docKind === 'report_card' ? 'report card' : 'transcript'} template.`);
      loadTemplates();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to set active template');
    } finally {
      setBusyAction(false);
    }
  };

  const loadTemplatesAndSelect = async (id: string) => {
    const list = await academicResultsApi.listReportTemplates(docKind, schoolId);
    setTemplates(list);
    setSelectedId(id);
  };

  const previewDoc = useMemo(() => SAMPLE_DOC[docKind], [docKind]);

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

  const template = draftConfig;

  return (
    <PermissionGuard code="school.settings">
      <div className="space-y-6">
        <div className="flex gap-2">
          <Button size="sm" variant={docKind === 'report_card' ? 'primary' : 'outline'} onClick={() => setDocKind('report_card')}>
            Report Card Templates
          </Button>
          <Button size="sm" variant={docKind === 'transcript' ? 'primary' : 'outline'} onClick={() => setDocKind('transcript')}>
            Transcript Templates
          </Button>
        </div>

        <ContentCard title="Templates" description="System defaults are read-only — duplicate one to customize it">
          <div className="space-y-2">
            {templates.map((t) => (
              <div
                key={t.id}
                className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 ${
                  t.id === selectedId ? 'border-primary bg-primary/5' : 'border-border/60'
                }`}
              >
                <button type="button" className="text-left" onClick={() => setSelectedId(t.id)}>
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {t.isSystem ? 'System default · read-only' : 'Custom'} {t.isActive ? '· Active' : ''}
                  </p>
                </button>
                {t.id === selectedId && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={duplicate} disabled={busyAction}>
                      Duplicate &amp; Customize
                    </Button>
                    {!t.isActive && (
                      <Button size="sm" variant="organic" className="border-none" onClick={activate} disabled={busyAction}>
                        Set Active
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ))}
            {templates.length === 0 && <p className="text-sm text-muted-foreground">No templates found.</p>}
          </div>
        </ContentCard>

        {(status || error) && <p className={`text-sm ${error ? 'text-red-600' : 'text-muted-foreground'}`}>{error || status}</p>}

        {selected && (
          <>
            {!isEditable && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-200">
                This is a system template and can&apos;t be edited directly. Click &quot;Duplicate &amp; Customize&quot; above to make your own editable copy.
              </div>
            )}

            <div className="flex justify-end">
              <Button size="sm" variant="organic" className="border-none" disabled={saving || !isEditable} onClick={save}>
                {saving ? 'Saving…' : 'Save template'}
              </Button>
            </div>

            <fieldset disabled={!isEditable} className="space-y-6 disabled:opacity-60">
              <ContentCard title="Header" description="Logo, seal, document title, school name and address">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={template.header.showLogo}
                      onChange={(e) => updateTemplate((t) => ({ ...t, header: { ...t.header, showLogo: e.target.checked } }))}
                    />
                    Show school logo
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={template.header.showSeal ?? false}
                      onChange={(e) => updateTemplate((t) => ({ ...t, header: { ...t.header, showSeal: e.target.checked } }))}
                    />
                    Show school seal
                  </label>
                  <Input
                    label="Document title"
                    value={template.header.title}
                    onChange={(e) => updateTemplate((t) => ({ ...t, header: { ...t.header, title: e.target.value } }))}
                  />
                  <Input
                    label="School name override (optional)"
                    value={template.header.schoolNameOverride ?? ''}
                    onChange={(e) => updateTemplate((t) => ({ ...t, header: { ...t.header, schoolNameOverride: e.target.value } }))}
                  />
                  <Input
                    label="Subtitle (optional)"
                    value={template.header.subtitle ?? ''}
                    onChange={(e) => updateTemplate((t) => ({ ...t, header: { ...t.header, subtitle: e.target.value } }))}
                  />
                  <Input
                    label="Address line (optional)"
                    value={template.header.addressLine ?? ''}
                    onChange={(e) => updateTemplate((t) => ({ ...t, header: { ...t.header, addressLine: e.target.value } }))}
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
                  <Button size="sm" variant="outline" onClick={addGradingBand} disabled={!isEditable}>
                    Add band
                  </Button>
                }
              >
                <div className="space-y-2">
                  {template.gradingScale.map((band, idx) => (
                    <div key={idx} className="grid grid-cols-2 sm:grid-cols-5 gap-2 items-end rounded-lg border border-border/60 p-2">
                      <Input label="Min %" type="number" value={band.minPercent} onChange={(e) => updateGradingBand(idx, { minPercent: Number(e.target.value) })} />
                      <Input label="Max %" type="number" value={band.maxPercent} onChange={(e) => updateGradingBand(idx, { maxPercent: Number(e.target.value) })} />
                      <Input label="Letter" value={band.letter} onChange={(e) => updateGradingBand(idx, { letter: e.target.value })} />
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
                          updateTemplate((t) => ({ ...t, subjectColumns: { ...t.subjectColumns, [key]: e.target.checked } }))
                        }
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </ContentCard>

              <ContentCard title="Summary block" description="Term average, GPA, rank, attendance, conduct and promotion status">
                <div className="grid gap-2 sm:grid-cols-2">
                  {(
                    [
                      ['showTermAverage', 'Term average'],
                      ['showGpa', 'GPA'],
                      ['showRank', 'Rank'],
                      ['showRankPopulation', 'Show rank population (#3 / 45)'],
                      ['showAttendanceRate', 'Attendance rate'],
                      ['showConduct', 'Conduct'],
                      ['showPromotionStatus', 'Promotion status'],
                    ] as const
                  ).map(([key, label]) => (
                    <label key={key} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={Boolean(template.summaryBlock[key])}
                        onChange={(e) =>
                          updateTemplate((t) => ({ ...t, summaryBlock: { ...t.summaryBlock, [key]: e.target.checked } }))
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
                  <Button size="sm" variant="outline" onClick={addSignatureLine} disabled={!isEditable}>
                    Add signatory
                  </Button>
                }
              >
                <div className="space-y-2">
                  {template.signatureLines.map((s, idx) => (
                    <div key={s.id} className="flex gap-2 items-end">
                      <Input label="Label" value={s.label} onChange={(e) => updateSignatureLine(idx, e.target.value)} wrapperClassName="flex-1" />
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
            </fieldset>

            <ContentCard title="Preview" description="Sample data — not a real student">
              <ReportDocumentPreview template={template} doc={previewDoc} />
            </ContentCard>
          </>
        )}
      </div>
    </PermissionGuard>
  );
}
