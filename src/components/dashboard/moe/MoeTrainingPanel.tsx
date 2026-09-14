'use client';

import React, { useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { resolveResourceUrl, uploadFileWithMeta } from '@/lib/api';
import { TablePanel } from '@/components/dashboard/TablePanel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Dialog, DialogFooter } from '@/components/ui/dialog';
import { FormField, formFieldInputClass } from '@/components/ui/form-field';
import { useConfirmDialog } from '@/components/ui/confirm-dialog';
import type { TrainingPlan, TrainingPlanType, TrainingPlanStatus, TrainingAudience, TrainingMaterial } from '@/lib/mockData';

const AUDIENCE_OPTIONS: TrainingAudience[] = ['All', 'Regional', 'Woredas', 'Schools'];
const PROGRAM_CATEGORIES = ['Pedagogy', 'Leadership', 'ICT & Digital Literacy', 'Curriculum', 'Assessment', 'Compliance & Safeguarding', 'Subject Specialty', 'Onboarding'];
const RESOURCE_CATEGORIES = ['Pedagogy', 'Leadership', 'MOE Mandatory', 'STEM', 'Assessment', 'Subject Specialty', 'Curriculum Integration', 'Onboarding'];

const TYPE_LABEL: Record<TrainingPlanType, string> = {
  continuous_development: 'Online Training Session',
  in_person: 'In-Person Training Session',
};
const STATUS_LABEL: Record<string, string> = {
  planned: 'Planned',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};
function statusVariant(status: TrainingPlanStatus) {
  switch (status) {
    case 'completed': return 'success' as const;
    case 'in_progress': return 'warning' as const;
    case 'cancelled': return 'danger' as const;
    default: return 'info' as const;
  }
}

export function MoeTrainingPanel() {
  const {
    currentUser,
    schools,
    trainingPlans,
    trainingPlanAssignments,
    addTrainingPlan,
    updateTrainingPlanStatus,
    assignTrainingPlan,
    removeTrainingPlanAssignment,
    trainingMaterials,
    addTrainingMaterial,
    updateTrainingMaterial,
    deleteTrainingMaterial,
    disseminateTrainingMaterial,
  } = useApp();
  const { confirm, ConfirmDialog } = useConfirmDialog();

  const [subView, setSubView] = useState<'programs' | 'resources'>('programs');

  // --- Programs filters & state ---
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [audienceFilter, setAudienceFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');

  const filteredPlans = useMemo(() => trainingPlans.filter((p) => {
    if (categoryFilter !== 'All' && p.category !== categoryFilter) return false;
    if (audienceFilter !== 'All' && (p.audience ?? 'All') !== audienceFilter) return false;
    if (statusFilter !== 'All' && p.status !== statusFilter) return false;
    if (typeFilter !== 'All' && p.type !== typeFilter) return false;
    return true;
  }), [trainingPlans, categoryFilter, audienceFilter, statusFilter, typeFilter]);

  const [isNewPlanOpen, setIsNewPlanOpen] = useState(false);
  const [selected, setSelected] = useState<TrainingPlan | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<TrainingPlanType>('continuous_development');
  const [category, setCategory] = useState(PROGRAM_CATEGORIES[0]);
  const [audience, setAudience] = useState<TrainingAudience>('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [location, setLocation] = useState('');
  const [facilitator, setFacilitator] = useState('');

  const [schoolId, setSchoolId] = useState('');

  React.useEffect(() => {
    if (!schoolId && schools[0]) setSchoolId(schools[0].id);
  }, [schools, schoolId]);

  const resetPlanForm = () => {
    setTitle(''); setDescription(''); setType('continuous_development'); setCategory(PROGRAM_CATEGORIES[0]);
    setAudience('All'); setStartDate(''); setEndDate(''); setLocation(''); setFacilitator('');
  };

  const handleCreatePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !startDate) return;
    addTrainingPlan({
      title: title.trim(),
      description: description.trim() || undefined,
      type,
      category,
      audience,
      startDate,
      endDate: endDate || undefined,
      location: location.trim() || undefined,
      facilitator: facilitator.trim() || undefined,
      createdByName: currentUser?.displayName ?? 'MOE Admin',
    });
    setIsNewPlanOpen(false);
    resetPlanForm();
  };

  const assignmentsForSelected = useMemo(
    () => (selected ? trainingPlanAssignments.filter((a) => a.trainingPlanId === selected.id) : []),
    [trainingPlanAssignments, selected],
  );

  const resourcesByPlanId = useMemo(() => {
    const map = new Map<string, TrainingMaterial[]>();
    for (const material of trainingMaterials) {
      if (!material.trainingPlanId) continue;
      const list = map.get(material.trainingPlanId);
      if (list) list.push(material);
      else map.set(material.trainingPlanId, [material]);
    }
    return map;
  }, [trainingMaterials]);

  const handleAssign = () => {
    if (!selected || !schoolId) return;
    assignTrainingPlan(selected.id, {
      targetType: 'school',
      schoolId,
      assignedByName: currentUser?.displayName ?? 'MOE Admin',
    });
  };

  // --- Resources filters & state ---
  const [resCategoryFilter, setResCategoryFilter] = useState('All');
  const [resAudienceFilter, setResAudienceFilter] = useState('All');
  const filteredMaterials = useMemo(() => trainingMaterials.filter((m) => {
    if (resCategoryFilter !== 'All' && m.category !== resCategoryFilter) return false;
    if (resAudienceFilter !== 'All' && (m.audience ?? 'All') !== resAudienceFilter) return false;
    return true;
  }), [trainingMaterials, resCategoryFilter, resAudienceFilter]);

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<TrainingMaterial | null>(null);
  const [resTitle, setResTitle] = useState('');
  const [resDescription, setResDescription] = useState('');
  const [resCategory, setResCategory] = useState(RESOURCE_CATEGORIES[0]);
  const [resAudience, setResAudience] = useState<TrainingAudience>('All');
  const [resCode, setResCode] = useState('');
  const [resTrainingPlanId, setResTrainingPlanId] = useState('');
  const [resUrl, setResUrl] = useState('');
  const [resFile, setResFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const resetResourceForm = () => {
    setEditingMaterial(null);
    setResTitle('');
    setResDescription('');
    setResCategory(RESOURCE_CATEGORIES[0]);
    setResAudience('All');
    setResCode('');
    setResTrainingPlanId('');
    setResUrl('');
    setResFile(null);
    setUploadError('');
  };

  const openCreateResource = () => {
    resetResourceForm();
    setIsUploadOpen(true);
  };

  const openEditResource = (material: TrainingMaterial) => {
    setEditingMaterial(material);
    setResTitle(material.title);
    setResDescription(material.description ?? '');
    setResCategory(
      RESOURCE_CATEGORIES.includes(material.category)
        ? material.category
        : RESOURCE_CATEGORIES[0],
    );
    setResAudience(material.audience ?? 'All');
    setResCode(material.code ?? '');
    setResTrainingPlanId(material.trainingPlanId ?? '');
    setResUrl(
      material.resourceUrl && !material.resourceUrl.includes('/uploads/')
        ? material.resourceUrl
        : '',
    );
    setResFile(null);
    setUploadError('');
    setIsUploadOpen(true);
  };

  const handleSaveResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resTitle.trim()) {
      setUploadError('Please provide a title.');
      return;
    }
    if (!editingMaterial && !resUrl.trim() && !resFile) {
      setUploadError('Please provide a title and either a link or a file.');
      return;
    }
    setUploading(true);
    setUploadError('');
    try {
      let finalUrl = resUrl.trim();
      if (resFile) {
        const uploaded = await uploadFileWithMeta(resFile);
        finalUrl = uploaded.url;
      } else if (editingMaterial && !finalUrl) {
        finalUrl = editingMaterial.resourceUrl;
      }

      if (editingMaterial) {
        await updateTrainingMaterial(editingMaterial.id, {
          title: resTitle.trim(),
          description: resDescription.trim() || null,
          resourceUrl: finalUrl,
          category: resCategory,
          audience: resAudience,
          code: resCode.trim() || null,
          trainingPlanId: resTrainingPlanId || null,
        });
      } else {
        addTrainingMaterial({
          title: resTitle.trim(),
          description: resDescription.trim() || undefined,
          resourceUrl: finalUrl,
          category: resCategory,
          audience: resAudience,
          code: resCode.trim() || undefined,
          trainingPlanId: resTrainingPlanId || undefined,
        });
      }
      setIsUploadOpen(false);
      resetResourceForm();
    } catch {
      setUploadError(editingMaterial ? 'Could not save changes. Please try again.' : 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteResource = async (material: TrainingMaterial) => {
    const ok = await confirm(`Delete "${material.title}"?`, {
      description: 'This removes the resource from the training library. This cannot be undone.',
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!ok) return;
    try {
      await deleteTrainingMaterial(material.id);
    } catch {
      setUploadError('Could not delete this resource. Please try again.');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="inline-flex rounded-xl border border-border bg-white p-1 shadow-sm dark:bg-card">
        <button type="button" onClick={() => setSubView('programs')} className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors ${subView === 'programs' ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
          Training Programs
        </button>
        <button type="button" onClick={() => setSubView('resources')} className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors ${subView === 'resources' ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
          Training Resources
        </button>
      </div>

      {subView === 'programs' ? (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-card p-4 rounded-xl border border-border/60">
            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
              <div className="w-40">
                <Select options={[{ value: 'All', label: 'All Categories' }, ...PROGRAM_CATEGORIES.map((c) => ({ value: c, label: c }))]} value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} />
              </div>
              <div className="w-36">
                <Select options={[{ value: 'All', label: 'All Audiences' }, ...AUDIENCE_OPTIONS.filter((a) => a !== 'All').map((a) => ({ value: a, label: a }))]} value={audienceFilter} onChange={(e) => setAudienceFilter(e.target.value)} />
              </div>
              <div className="w-36">
                <Select options={[{ value: 'All', label: 'All Statuses' }, ...Object.entries(STATUS_LABEL).map(([v, l]) => ({ value: v, label: l }))]} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} />
              </div>
              <div className="w-44">
                <Select options={[{ value: 'All', label: 'All Types' }, ...Object.entries(TYPE_LABEL).map(([v, l]) => ({ value: v, label: l }))]} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} />
              </div>
            </div>
            <Button onClick={() => setIsNewPlanOpen(true)} size="sm" className="h-10 font-semibold shrink-0">
              + Add Training
            </Button>
          </div>

          <TablePanel title="National Training Programs">
            <table className="eskooly-table">
              <thead>
                <tr>
                  <th>Training</th>
                  <th>Category</th>
                  <th>Audience</th>
                  <th>Type</th>
                  <th>Dates</th>
                  <th>Assigned</th>
                  <th>Linked Resources</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPlans.length === 0 ? (
                  <tr><td colSpan={9} className="text-center text-muted-foreground py-12">No training programs matching your filters.</td></tr>
                ) : (
                  filteredPlans.map((p) => {
                    const linkedResources = resourcesByPlanId.get(p.id) ?? [];
                    return (
                      <tr key={p.id}>
                        <td className="font-medium">{p.title}{p.location && <p className="text-[11px] text-muted-foreground">{p.location}</p>}</td>
                        <td className="text-muted-foreground">{p.category ?? '—'}</td>
                        <td className="text-muted-foreground">{p.audience ?? 'All'}</td>
                        <td><Badge variant={p.type === 'in_person' ? 'primary' : 'info'} size="sm">{TYPE_LABEL[p.type]}</Badge></td>
                        <td className="text-muted-foreground">{p.startDate}{p.endDate ? ` → ${p.endDate}` : ''}</td>
                        <td className="text-muted-foreground">{trainingPlanAssignments.filter((a) => a.trainingPlanId === p.id).length}</td>
                        <td>
                          {linkedResources.length === 0 ? (
                            <span className="text-muted-foreground">—</span>
                          ) : (
                            <div className="flex max-w-56 flex-col gap-1">
                              {linkedResources.map((resource) => {
                                const viewUrl = resolveResourceUrl(resource.resourceUrl);
                                const canView = Boolean(viewUrl) && viewUrl !== '#';
                                return (
                                  <button
                                    key={resource.id}
                                    type="button"
                                    disabled={!canView}
                                    title={canView ? `View ${resource.title}` : resource.title}
                                    onClick={() => {
                                      if (!canView) return;
                                      window.open(viewUrl, '_blank', 'noopener,noreferrer');
                                    }}
                                    className={`truncate text-left text-xs font-medium ${
                                      canView
                                        ? 'text-primary hover:underline'
                                        : 'cursor-not-allowed text-muted-foreground'
                                    }`}
                                  >
                                    {resource.code ? `${resource.code} · ` : ''}{resource.title}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </td>
                        <td><Badge variant={statusVariant(p.status)} size="sm">{STATUS_LABEL[p.status]}</Badge></td>
                        <td>
                          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setSelected(p)}>Manage</Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </TablePanel>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-card p-4 rounded-xl border border-border/60">
            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
              <div className="w-44">
                <Select options={[{ value: 'All', label: 'All Categories' }, ...RESOURCE_CATEGORIES.map((c) => ({ value: c, label: c }))]} value={resCategoryFilter} onChange={(e) => setResCategoryFilter(e.target.value)} />
              </div>
              <div className="w-36">
                <Select options={[{ value: 'All', label: 'All Audiences' }, ...AUDIENCE_OPTIONS.filter((a) => a !== 'All').map((a) => ({ value: a, label: a }))]} value={resAudienceFilter} onChange={(e) => setResAudienceFilter(e.target.value)} />
              </div>
            </div>
            <Button onClick={openCreateResource} size="sm" className="h-10 font-semibold shrink-0">
              + Upload Resource
            </Button>
          </div>

          <TablePanel title="Training Resource Library">
            <table className="eskooly-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Audience</th>
                  <th>Uploaded</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMaterials.length === 0 ? (
                  <tr><td colSpan={7} className="text-center text-muted-foreground py-12">No training resources matching your filters.</td></tr>
                ) : (
                  filteredMaterials.map((m) => (
                    <tr key={m.id}>
                      <td className="font-medium text-muted-foreground">{m.code ?? '—'}</td>
                      <td className="font-medium">{m.title}{m.description && <p className="text-[11px] text-muted-foreground">{m.description}</p>}</td>
                      <td className="text-muted-foreground">{m.category}</td>
                      <td className="text-muted-foreground">{m.audience ?? 'All'}</td>
                      <td className="text-muted-foreground">{m.uploadedAt}</td>
                      <td><Badge variant={m.disseminated ? 'success' : 'neutral'} badgeStyle="subtle" size="sm">{m.disseminated ? 'Disseminated' : 'Draft'}</Badge></td>
                      <td>
                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs"
                            disabled={!m.resourceUrl || m.resourceUrl === '#'}
                            onClick={() => {
                              const viewUrl = resolveResourceUrl(m.resourceUrl);
                              if (!viewUrl || viewUrl === '#') return;
                              window.open(viewUrl, '_blank', 'noopener,noreferrer');
                            }}
                          >
                            View
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs"
                            onClick={() => openEditResource(m)}
                          >
                            Edit
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs text-destructive"
                            onClick={() => void handleDeleteResource(m)}
                          >
                            Delete
                          </Button>
                          {!m.disseminated && (
                            <Button
                              type="button"
                              size="sm"
                              variant="organic"
                              className="h-8 text-xs"
                              onClick={() => disseminateTrainingMaterial(m.id)}
                            >
                              Disseminate to Schools
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </TablePanel>
        </div>
      )}

      {/* New training program dialog */}
      <Dialog isOpen={isNewPlanOpen} onClose={() => { setIsNewPlanOpen(false); resetPlanForm(); }} title="Add National Training Program">
        <form onSubmit={handleCreatePlan} className="space-y-3 text-left">
          <FormField label="Title">
            <input className={formFieldInputClass} value={title} onChange={(e) => setTitle(e.target.value)} required />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Category">
              <Select options={PROGRAM_CATEGORIES.map((c) => ({ value: c, label: c }))} value={category} onChange={(e) => setCategory(e.target.value)} />
            </FormField>
            <FormField label="Audience">
              <Select options={AUDIENCE_OPTIONS.map((a) => ({ value: a, label: a }))} value={audience} onChange={(e) => setAudience(e.target.value as TrainingAudience)} />
            </FormField>
          </div>
          <FormField label="Delivery Type">
            <Select options={Object.entries(TYPE_LABEL).map(([v, l]) => ({ value: v, label: l }))} value={type} onChange={(e) => setType(e.target.value as TrainingPlanType)} />
          </FormField>
          <FormField label="Description">
            <textarea className={`${formFieldInputClass} h-16 py-2`} value={description} onChange={(e) => setDescription(e.target.value)} />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Start Date">
              <input type="date" className={formFieldInputClass} value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
            </FormField>
            <FormField label="End Date (optional)">
              <input type="date" className={formFieldInputClass} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </FormField>
          </div>
          {type === 'in_person' && (
            <FormField label="Location">
              <input className={formFieldInputClass} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Ministry Conference Hall" />
            </FormField>
          )}
          <FormField label="Facilitator (optional)">
            <input className={formFieldInputClass} value={facilitator} onChange={(e) => setFacilitator(e.target.value)} />
          </FormField>
          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => { setIsNewPlanOpen(false); resetPlanForm(); }}>Cancel</Button>
            <Button type="submit" variant="organic" size="sm" className="border-none">Create Program</Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Manage program: status + assignments */}
      {selected && (
        <Dialog isOpen onClose={() => setSelected(null)} title={selected.title} size="lg">
          <div className="space-y-4 text-xs text-left">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={selected.type === 'in_person' ? 'primary' : 'info'} size="sm">{TYPE_LABEL[selected.type]}</Badge>
              {selected.category && <Badge variant="neutral" size="sm">{selected.category}</Badge>}
              <span className="text-muted-foreground">{selected.startDate}{selected.endDate ? ` → ${selected.endDate}` : ''}</span>
              {selected.location && <span className="text-muted-foreground">· {selected.location}</span>}
              {selected.facilitator && <span className="text-muted-foreground">· {selected.facilitator}</span>}
            </div>
            {selected.description && <p className="text-muted-foreground">{selected.description}</p>}

            <FormField label="Status">
              <Select
                options={Object.entries(STATUS_LABEL).map(([v, l]) => ({ value: v, label: l }))}
                value={selected.status}
                onChange={(e) => {
                  const status = e.target.value as TrainingPlanStatus;
                  updateTrainingPlanStatus(selected.id, status);
                  setSelected({ ...selected, status });
                }}
              />
            </FormField>

            <div className="rounded-xl border border-border/50 p-3 space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Assign schools</p>
              <div className="grid gap-3 sm:grid-cols-[1fr_auto] items-end">
                <Select
                  options={schools.length ? schools.map((s) => ({ value: s.id, label: s.name })) : [{ value: '', label: 'No schools available' }]}
                  value={schoolId}
                  onChange={(e) => setSchoolId(e.target.value)}
                />
                <Button size="sm" variant="organic" className="border-none text-xs h-10" onClick={handleAssign}>Assign</Button>
              </div>
              {assignmentsForSelected.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {assignmentsForSelected.map((a) => {
                    const label = a.targetType === 'school'
                      ? schools.find((s) => s.id === a.schoolId)?.name ?? 'Unknown school'
                      : a.targetType === 'teacher'
                        ? 'Teacher assignment'
                        : 'Academic team assignment';
                    return (
                      <Badge key={a.id} variant="neutral" size="sm" className="gap-1.5">
                        {label}
                        <button type="button" className="text-muted-foreground hover:text-foreground" onClick={() => removeTrainingPlanAssignment(a.id)} aria-label={`Remove ${label}`}>×</button>
                      </Badge>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground">No schools assigned yet.</p>
              )}
            </div>
          </div>
        </Dialog>
      )}

      {/* Upload / edit training resource dialog */}
      <Dialog
        isOpen={isUploadOpen}
        onClose={() => { setIsUploadOpen(false); resetResourceForm(); }}
        title={editingMaterial ? 'Edit Training Resource' : 'Upload Training Resource'}
        description={editingMaterial ? 'Update the details or replace the linked file for this resource.' : 'Add a guide, video link, or reference document for teachers or schools.'}
      >
        <form onSubmit={(e) => void handleSaveResource(e)} className="space-y-3 text-left">
          {uploadError && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-md text-xxs font-bold">⚠ {uploadError}</div>}
          <FormField label="Title">
            <input className={formFieldInputClass} value={resTitle} onChange={(e) => setResTitle(e.target.value)} required />
          </FormField>
          <FormField label="Description (optional)">
            <textarea className={`${formFieldInputClass} h-16 py-2`} value={resDescription} onChange={(e) => setResDescription(e.target.value)} />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Resource Code">
              <input className={formFieldInputClass} value={resCode} onChange={(e) => setResCode(e.target.value)} placeholder="e.g. RSC-001" />
            </FormField>
            <FormField label="Audience">
              <Select options={AUDIENCE_OPTIONS.map((a) => ({ value: a, label: a }))} value={resAudience} onChange={(e) => setResAudience(e.target.value as TrainingAudience)} />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Category">
              <Select options={RESOURCE_CATEGORIES.map((c) => ({ value: c, label: c }))} value={resCategory} onChange={(e) => setResCategory(e.target.value)} />
            </FormField>
            <FormField label="Link to Training Program (optional)">
              <Select
                options={[
                  { value: '', label: 'None' },
                  ...trainingPlans.map((p) => ({ value: p.id, label: `${p.title} (${p.startDate})` })),
                ]}
                value={resTrainingPlanId}
                onChange={(e) => setResTrainingPlanId(e.target.value)}
              />
            </FormField>
          </div>
          <FormField label={editingMaterial ? 'External Link (optional — leave blank to keep current file)' : 'External Link (optional if uploading a file)'}>
            <input className={formFieldInputClass} value={resUrl} onChange={(e) => setResUrl(e.target.value)} placeholder="https://..." />
          </FormField>
          <FormField label={editingMaterial ? 'Replace File (optional)' : 'File (optional if a link is provided)'}>
            <input
              type="file"
              onChange={(e) => setResFile(e.target.files?.[0] ?? null)}
              className="w-full text-xs text-foreground file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
            />
            {editingMaterial?.resourceUrl?.includes('/uploads/') && !resFile && (
              <p className="mt-1 text-[11px] text-muted-foreground">
                Current file kept unless you upload a replacement.
              </p>
            )}
          </FormField>
          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => { setIsUploadOpen(false); resetResourceForm(); }}>Cancel</Button>
            <Button type="submit" variant="organic" size="sm" className="border-none" disabled={uploading}>
              {uploading ? (editingMaterial ? 'Saving…' : 'Uploading…') : (editingMaterial ? 'Save Changes' : 'Upload Resource')}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
      {ConfirmDialog}
    </div>
  );
}
