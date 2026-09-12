'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { api, type MoeDocument, type SchoolResource } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogFooter } from '@/components/ui/dialog';
import { useConfirmDialog } from '@/components/ui/confirm-dialog';
import { TRAINING_MODULES } from '@/lib/trainingModules';
import { TIP_MODULES } from '@/lib/inductionModules';
import { ELEP_MODULES } from '@/lib/leadershipModules';
import { CONTINUOUS_DEVELOPMENT_MODULES } from '@/lib/continuousDevelopmentModules';

const PRIME_PROGRAMME_MODULES = [
  ...TRAINING_MODULES,
  ...TIP_MODULES,
  ...ELEP_MODULES,
  ...CONTINUOUS_DEVELOPMENT_MODULES,
];

type SourceKey = 'moe-official' | 'department' | 'school-approved' | 'prime-programme' | 'external';

const SOURCE_TABS: { key: SourceKey; label: string }[] = [
  { key: 'moe-official', label: 'MOE Official' },
  { key: 'department', label: 'Department Resource' },
  { key: 'school-approved', label: 'School Approved' },
  { key: 'prime-programme', label: 'PRIME Programme' },
  { key: 'external', label: 'External Approved' },
];

/**
 * Classifies every resource visible to a school head into 5 sources. Four of
 * the five are read straight from data that already exists elsewhere (MOE
 * documents, department-disseminated training materials, teacher uploads
 * approved through the existing review workflow, and PRIME's own built-in
 * programme modules) — this view does not duplicate that data, it just gives
 * the school head one place to see all of it classified by origin. Only
 * "External Approved" is genuinely new: resources that live outside the
 * platform, catalogued here by the school head.
 */
export const SchoolResourceLibrary: React.FC<{ schoolId?: string }> = ({ schoolId }) => {
  const { trainingMaterials, teacherResources, addNotification } = useApp();
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const [activeSource, setActiveSource] = useState<SourceKey>('moe-official');

  const [moeDocuments, setMoeDocuments] = useState<MoeDocument[]>([]);
  const [loadingMoe, setLoadingMoe] = useState(false);
  useEffect(() => {
    setLoadingMoe(true);
    api
      .listMoeDocuments()
      .then((docs) => setMoeDocuments(docs.filter((d) => d.audience === 'All' || d.audience === 'Schools')))
      .catch(() => setMoeDocuments([]))
      .finally(() => setLoadingMoe(false));
  }, []);

  const [externalResources, setExternalResources] = useState<SchoolResource[]>([]);
  const [loadingExternal, setLoadingExternal] = useState(false);
  const loadExternal = useCallback(() => {
    setLoadingExternal(true);
    api
      .listSchoolResources(schoolId)
      .then(setExternalResources)
      .catch(() => setExternalResources([]))
      .finally(() => setLoadingExternal(false));
  }, [schoolId]);
  useEffect(loadExternal, [loadExternal]);

  const departmentResources = useMemo(
    () => trainingMaterials.filter((m) => m.disseminated && m.departmentId),
    [trainingMaterials],
  );
  const schoolApprovedResources = useMemo(
    () => teacherResources.filter((r) => r.status === 'APPROVED'),
    [teacherResources],
  );

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [grade, setGrade] = useState('');
  const [subject, setSubject] = useState('');
  const [saving, setSaving] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) return;
    setSaving(true);
    try {
      await api.createSchoolResource({
        title: title.trim(),
        url: url.trim(),
        description: description.trim() || undefined,
        grade: grade.trim() || undefined,
        subject: subject.trim() || undefined,
        schoolId,
      });
      addNotification('Resource Added', `"${title.trim()}" was added to the external resource library.`, 'success');
      setTitle('');
      setUrl('');
      setDescription('');
      setGrade('');
      setSubject('');
      setIsAddOpen(false);
      loadExternal();
    } catch (err) {
      addNotification('Could not add resource', err instanceof Error ? err.message : 'Try again.', 'alert');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (resource: SchoolResource) => {
    const ok = await confirm('Remove resource?', {
      description: `"${resource.title}" will be removed from the external resource library.`,
      confirmLabel: 'Remove',
      danger: true,
    });
    if (!ok) return;
    try {
      await api.deleteSchoolResource(resource.id);
      setExternalResources((prev) => prev.filter((r) => r.id !== resource.id));
      addNotification('Resource Removed', `"${resource.title}" was removed.`, 'success');
    } catch (err) {
      addNotification('Could not remove resource', err instanceof Error ? err.message : 'Try again.', 'alert');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5 bg-muted/60 p-1 rounded-lg border border-border/40">
          {SOURCE_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveSource(tab.key)}
              className={`px-3 py-1.5 text-xxs font-bold rounded-md transition-all cursor-pointer ${
                activeSource === tab.key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {activeSource === 'external' && (
          <Button variant="organic" size="sm" onClick={() => setIsAddOpen(true)} className="text-xs h-9 font-bold border-none">
            + Add External Resource
          </Button>
        )}
      </div>

      {activeSource === 'moe-official' && (
        <ResourceGrid
          loading={loadingMoe}
          empty="No MOE documents have been issued to schools yet."
          items={moeDocuments.map((d) => ({
            key: d.id,
            title: d.title,
            meta: d.category,
            date: d.createdAt,
            url: d.fileUrl,
          }))}
        />
      )}

      {activeSource === 'department' && (
        <ResourceGrid
          empty="No department-disseminated training materials yet."
          items={departmentResources.map((m) => ({
            key: m.id,
            title: m.title,
            meta: [m.subject, m.grade].filter(Boolean).join(' · ') || m.category,
            date: m.uploadedAt,
            url: m.resourceUrl,
          }))}
        />
      )}

      {activeSource === 'school-approved' && (
        <ResourceGrid
          empty="No teacher-uploaded resources have been approved yet."
          items={schoolApprovedResources.map((r) => ({
            key: r.id,
            title: r.title,
            meta: [r.subject, r.grade].filter(Boolean).join(' · ') || r.type,
            date: r.createdAt,
            url: r.url,
          }))}
        />
      )}

      {activeSource === 'prime-programme' && (
        <ResourceGrid
          empty="No PRIME programme modules available."
          items={PRIME_PROGRAMME_MODULES.map((m) => ({
            key: m.id,
            title: m.title,
            meta: `${m.category} · ${m.target}`,
            date: m.duration,
          }))}
        />
      )}

      {activeSource === 'external' && (
        <ResourceGrid
          loading={loadingExternal}
          empty="No external resources have been added yet."
          items={externalResources.map((r) => ({
            key: r.id,
            title: r.title,
            meta: [r.subject, r.grade].filter(Boolean).join(' · ') || r.description,
            date: r.addedByName ? `Added by ${r.addedByName}` : undefined,
            url: r.url,
            onRemove: () => handleDelete(r),
          }))}
        />
      )}

      <Dialog isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add External Resource" size="md">
        <form onSubmit={handleAdd} className="space-y-4 pt-2">
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-muted-foreground uppercase">Title</label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Ethiopian Ministry Digital Library"
              className="w-full h-10 px-3 bg-muted/40 border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-muted-foreground uppercase">URL</label>
            <input
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              className="w-full h-10 px-3 bg-muted/40 border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase">Grade (optional)</label>
              <input
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full h-10 px-3 bg-muted/40 border border-border rounded-md text-xs text-foreground focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase">Subject (optional)</label>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full h-10 px-3 bg-muted/40 border border-border rounded-md text-xs text-foreground focus:outline-none"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-muted-foreground uppercase">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 bg-muted/40 border border-border rounded-md text-xs text-foreground focus:outline-none"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => setIsAddOpen(false)} className="text-xs h-9">
              Cancel
            </Button>
            <Button type="submit" variant="organic" size="sm" disabled={saving} className="text-xs h-9 font-bold border-none">
              {saving ? 'Adding…' : 'Add Resource'}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {ConfirmDialog}
    </div>
  );
};

const ResourceGrid: React.FC<{
  items: { key: string; title: string; meta?: string; date?: string; url?: string; onRemove?: () => void }[];
  empty: string;
  loading?: boolean;
}> = ({ items, empty, loading }) => {
  if (loading) {
    return (
      <Card className="border-border/60">
        <CardContent className="pt-6 text-center text-xs text-muted-foreground">Loading…</CardContent>
      </Card>
    );
  }
  if (items.length === 0) {
    return (
      <Card className="border-border/60">
        <CardContent className="pt-6 text-center text-xs text-muted-foreground">{empty}</CardContent>
      </Card>
    );
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item) => (
        <Card key={item.key} className="border-border/60 hover:border-primary/40 transition-colors duration-200">
          <CardContent className="pt-4 space-y-2">
            <h4 className="text-xs font-bold text-foreground line-clamp-2">{item.title}</h4>
            {item.meta && (
              <Badge variant="primary" size="sm" className="bg-accent/10 border-accent/20 text-accent font-medium">
                {item.meta}
              </Badge>
            )}
            <div className="flex items-center justify-between pt-1">
              {item.url ? (
                <a href={item.url} target="_blank" rel="noreferrer" className="text-primary hover:underline font-bold text-xxs">
                  View resource →
                </a>
              ) : (
                <span className="text-xxs text-muted-foreground">{item.date}</span>
              )}
              {item.onRemove && (
                <button onClick={item.onRemove} className="text-xxs font-bold text-red-600 hover:underline">
                  Remove
                </button>
              )}
            </div>
            {item.url && item.date && <p className="text-[10px] text-muted-foreground">{item.date}</p>}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
