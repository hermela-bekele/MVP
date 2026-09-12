'use client';

import React, { useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { uploadFileWithMeta } from '@/lib/api';
import { TablePanel } from '@/components/dashboard/TablePanel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Dialog, DialogFooter } from '@/components/ui/dialog';
import { FormField, formFieldInputClass } from '@/components/ui/form-field';
import type { TrainingPlan, TrainingPlanType, TrainingPlanStatus, TrainingAudience } from '@/lib/mockData';

const AUDIENCE_OPTIONS: TrainingAudience[] = ['All', 'Regional', 'Woredas', 'Schools'];
const PROGRAM_CATEGORIES = ['Pedagogy', 'Leadership', 'ICT & Digital Literacy', 'Curriculum', 'Assessment', 'Compliance & Safeguarding', 'Subject Specialty'];
const RESOURCE_CATEGORIES = ['Pedagogy', 'MOE Mandatory', 'STEM', 'Assessment', 'Subject Specialty', 'Curriculum Integration'];

const TYPE_LABEL: Record<TrainingPlanType, string> = {
  continuous_development: 'Continuous Development',
  in_person: 'In-Person Training Session',
};
const STATUS_LABEL: Record<TrainingPlanStatus, string> = {
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
    teachers,
    departments,
    trainingPlans,
    trainingPlanAssignments,
    addTrainingPlan,
    updateTrainingPlanStatus,
    assignTrainingPlan,
    removeTrainingPlanAssignment,
    trainingMaterials,
    addTrainingMaterial,
  } = useApp();

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

  const [targetType, setTargetType] = useState<'teacher' | 'department'>('department');
  const [teacherId, setTeacherId] = useState('');
  const [departmentId, setDepartmentId] = useState('');

  const activeTeachers = useMemo(() => teachers.filter((t) => t.status === 'Active'), [teachers]);

  React.useEffect(() => {
    if (!teacherId && activeTeachers[0]) setTeacherId(activeTeachers[0].id);
  }, [activeTeachers, teacherId]);

  React.useEffect(() => {
    if (!departmentId && departments[0]) setDepartmentId(departments[0].id);
  }, [departments, departmentId]);

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

  const handleAssign = () => {
    if (!selected) return;
    if (targetType === 'teacher') {
      if (!teacherId) return;
      assignTrainingPlan(selected.id, { targetType: 'teacher', teacherId, assignedByName: currentUser?.displayName ?? 'MOE Admin' });
    } else {
      if (!departmentId) return;
      assignTrainingPlan(selected.id, { targetType: 'department', departmentId, assignedByName: currentUser?.displayName ?? 'MOE Admin' });
    }
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
  const [resTitle, setResTitle] = useState('');
  const [resDescription, setResDescription] = useState('');
  const [resCategory, setResCategory] = useState(RESOURCE_CATEGORIES[0]);
  const [resAudience, setResAudience] = useState<TrainingAudience>('All');
  const [resUrl, setResUrl] = useState('');
  const [resFile, setResFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const resetResourceForm = () => {
    setResTitle(''); setResDescription(''); setResCategory(RESOURCE_CATEGORIES[0]); setResAudience('All'); setResUrl(''); setResFile(null); setUploadError('');
  };

  const handleUploadResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resTitle.trim() || (!resUrl.trim() && !resFile)) {
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
      }
      addTrainingMaterial({
        title: resTitle.trim(),
        description: resDescription.trim() || undefined,
        resourceUrl: finalUrl,
        category: resCategory,
        audience: resAudience,
      });
      setIsUploadOpen(false);
      resetResourceForm();
    } catch {
      setUploadError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
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
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPlans.length === 0 ? (
                  <tr><td colSpan={8} className="text-center text-muted-foreground py-12">No training programs matching your filters.</td></tr>
                ) : (
                  filteredPlans.map((p) => (
                    <tr key={p.id}>
                      <td className="font-medium">{p.title}{p.location && <p className="text-[11px] text-muted-foreground">{p.location}</p>}</td>
                      <td className="text-muted-foreground">{p.category ?? '—'}</td>
                      <td className="text-muted-foreground">{p.audience ?? 'All'}</td>
                      <td><Badge variant={p.type === 'in_person' ? 'primary' : 'info'} size="sm">{TYPE_LABEL[p.type]}</Badge></td>
                      <td className="text-muted-foreground">{p.startDate}{p.endDate ? ` → ${p.endDate}` : ''}</td>
                      <td className="text-muted-foreground">{trainingPlanAssignments.filter((a) => a.trainingPlanId === p.id).length}</td>
                      <td><Badge variant={statusVariant(p.status)} size="sm">{STATUS_LABEL[p.status]}</Badge></td>
                      <td>
                        <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setSelected(p)}>Manage</Button>
                      </td>
                    </tr>
                  ))
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
            <Button onClick={() => setIsUploadOpen(true)} size="sm" className="h-10 font-semibold shrink-0">
              + Upload Resource
            </Button>
          </div>

          <TablePanel title="Training Resource Library">
            <table className="eskooly-table">
              <thead>
                <tr>
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
                  <tr><td colSpan={6} className="text-center text-muted-foreground py-12">No training resources matching your filters.</td></tr>
                ) : (
                  filteredMaterials.map((m) => (
                    <tr key={m.id}>
                      <td className="font-medium">{m.title}{m.description && <p className="text-[11px] text-muted-foreground">{m.description}</p>}</td>
                      <td className="text-muted-foreground">{m.category}</td>
                      <td className="text-muted-foreground">{m.audience ?? 'All'}</td>
                      <td className="text-muted-foreground">{m.uploadedAt}</td>
                      <td><Badge variant={m.disseminated ? 'success' : 'neutral'} badgeStyle="subtle" size="sm">{m.disseminated ? 'Disseminated' : 'Draft'}</Badge></td>
                      <td>
                        <a href={m.resourceUrl} target="_blank" rel="noopener noreferrer">
                          <Button type="button" size="sm" variant="outline" className="h-8 text-xs">View</Button>
                        </a>
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
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Assign teachers or academic teams</p>
              <div className="grid gap-3 sm:grid-cols-[auto_1fr_auto] items-end">
                <Select options={[{ value: 'teacher', label: 'Teacher' }, { value: 'department', label: 'Academic Team' }]} value={targetType} onChange={(e) => setTargetType(e.target.value as 'teacher' | 'department')} />
                {targetType === 'teacher' ? (
                  <Select
                    options={activeTeachers.length ? activeTeachers.map((t) => ({ value: t.id, label: t.name })) : [{ value: '', label: 'No active teachers' }]}
                    value={teacherId}
                    onChange={(e) => setTeacherId(e.target.value)}
                  />
                ) : (
                  <Select
                    options={departments.length ? departments.map((d) => ({ value: d.id, label: d.name })) : [{ value: '', label: 'No academic teams' }]}
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                  />
                )}
                <Button size="sm" variant="organic" className="border-none text-xs h-10" onClick={handleAssign}>Assign</Button>
              </div>
              {assignmentsForSelected.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {assignmentsForSelected.map((a) => {
                    const label = a.targetType === 'teacher'
                      ? teachers.find((t) => t.id === a.teacherId)?.name ?? 'Unknown teacher'
                      : `${departments.find((d) => d.id === a.departmentId)?.name ?? 'Unknown team'} (team)`;
                    return (
                      <Badge key={a.id} variant="neutral" size="sm" className="gap-1.5">
                        {label}
                        <button type="button" className="text-muted-foreground hover:text-foreground" onClick={() => removeTrainingPlanAssignment(a.id)} aria-label={`Remove ${label}`}>×</button>
                      </Badge>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground">No one assigned yet.</p>
              )}
            </div>
          </div>
        </Dialog>
      )}

      {/* Upload training resource dialog */}
      <Dialog isOpen={isUploadOpen} onClose={() => { setIsUploadOpen(false); resetResourceForm(); }} title="Upload Training Resource" description="Add a guide, video link, or reference document for teachers or schools.">
        <form onSubmit={handleUploadResource} className="space-y-3 text-left">
          {uploadError && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-md text-xxs font-bold">⚠ {uploadError}</div>}
          <FormField label="Title">
            <input className={formFieldInputClass} value={resTitle} onChange={(e) => setResTitle(e.target.value)} required />
          </FormField>
          <FormField label="Description (optional)">
            <textarea className={`${formFieldInputClass} h-16 py-2`} value={resDescription} onChange={(e) => setResDescription(e.target.value)} />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Category">
              <Select options={RESOURCE_CATEGORIES.map((c) => ({ value: c, label: c }))} value={resCategory} onChange={(e) => setResCategory(e.target.value)} />
            </FormField>
            <FormField label="Audience">
              <Select options={AUDIENCE_OPTIONS.map((a) => ({ value: a, label: a }))} value={resAudience} onChange={(e) => setResAudience(e.target.value as TrainingAudience)} />
            </FormField>
          </div>
          <FormField label="External Link (optional if uploading a file)">
            <input className={formFieldInputClass} value={resUrl} onChange={(e) => setResUrl(e.target.value)} placeholder="https://..." />
          </FormField>
          <FormField label="File (optional if a link is provided)">
            <input
              type="file"
              onChange={(e) => setResFile(e.target.files?.[0] ?? null)}
              className="w-full text-xs text-foreground file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
            />
          </FormField>
          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => { setIsUploadOpen(false); resetResourceForm(); }}>Cancel</Button>
            <Button type="submit" variant="organic" size="sm" className="border-none" disabled={uploading}>{uploading ? 'Uploading…' : 'Upload Resource'}</Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
