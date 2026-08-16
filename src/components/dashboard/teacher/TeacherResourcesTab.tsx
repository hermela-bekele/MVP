'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { uploadFile } from '@/lib/api';
import { Select } from '@/components/ui/select';
import { Dialog, DialogFooter } from '@/components/ui/dialog';
import { GRADE_OPTIONS } from '@/lib/teacherPortal';
import { filterTrainingMaterialsForTeacher } from '@/lib/trainingResources';
import type { TeacherResource, TrainingMaterial } from '@/lib/mockData';
import {
  AisBtnSecondary,
  AisPage,
  AisPanel,
  AisStatusBadge,
  aisInput,
} from '@/components/dashboard/teacher/TeacherPortalUi';
import { aisBodyMd, aisBodySm, aisCard, aisHeadlineSm } from '@/components/dashboard/teacher/aisStyles';

function resourceUrlOf(row: ResourceRow): string | undefined {
  return row.kind === 'own' ? row.resource.url : row.resource.resourceUrl;
}

function isImageUrl(url: string) {
  return /\.(png|jpe?g|gif|webp|svg)$/i.test(url);
}

function isVideoUrl(url: string) {
  return /\.(mp4|webm|mov)$/i.test(url) || /youtube\.com|youtu\.be|vimeo\.com/i.test(url);
}

function isPdfUrl(url: string) {
  return /\.pdf$/i.test(url);
}

const RESOURCE_TYPES: TeacherResource['type'][] = [
  'Worksheet',
  'Slide Deck',
  'Lab Guide',
  'Reference PDF',
  'Video Link',
];

type ResourceRow =
  | { kind: 'own'; resource: TeacherResource }
  | { kind: 'department'; resource: TrainingMaterial };

function categoryToType(category: string): TeacherResource['type'] {
  if (category === 'STEM') return 'Lab Guide';
  if (category.includes('Video')) return 'Video Link';
  if (category === 'Assessment') return 'Worksheet';
  return 'Reference PDF';
}

export const TeacherResourcesTab: React.FC = () => {
  const {
    teacherResources,
    trainingMaterials,
    addTeacherResource,
    addNotification,
    resolveTeacherId,
    refreshFromApi,
  } = useApp();
  const teacherId = resolveTeacherId();

  const myResources = teacherResources.filter((r) => r.teacherId === teacherId);

  const departmentResources = useMemo(
    () => filterTrainingMaterialsForTeacher(trainingMaterials),
    [trainingMaterials],
  );

  const allResources: ResourceRow[] = useMemo(() => {
    const deptRows: ResourceRow[] = departmentResources.map((resource) => ({
      kind: 'department',
      resource,
    }));
    const ownRows: ResourceRow[] = myResources.map((resource) => ({
      kind: 'own',
      resource,
    }));
    return [...deptRows, ...ownRows];
  }, [departmentResources, myResources]);

  const [viewingResource, setViewingResource] = useState<ResourceRow | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<TeacherResource['type']>('Worksheet');
  const [resGrade, setResGrade] = useState('Grade 9');
  const [subject, setSubject] = useState('Biology');
  const [url, setUrl] = useState('');
  const [resourceFile, setResourceFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    void refreshFromApi();
  }, [refreshFromApi]);

  useEffect(() => {
    const open = () => setIsOpen(true);
    window.addEventListener('open-teacher-resource', open);
    return () => window.removeEventListener('open-teacher-resource', open);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || (!resourceFile && !url.trim())) return;

    setUploading(true);
    try {
      let finalUrl = url.trim();
      if (resourceFile) {
        finalUrl = await uploadFile(resourceFile);
      }
      addTeacherResource({ title, type, grade: resGrade, subject, url: finalUrl });
      setTitle('');
      setUrl('');
      setResourceFile(null);
      setIsOpen(false);
    } catch (err) {
      addNotification(
        'Upload failed',
        err instanceof Error ? err.message : 'Could not upload file. Try again.',
        'alert',
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <AisPage>
      <AisPanel
        title="Classroom resources"
        description="Your uploads and department-shared study materials — click a card to view it"
      >
        {allResources.length === 0 ? (
          <p className={`${aisBodyMd} py-8 text-center`}>No resources available yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {allResources.map((row) => {
              const isOwn = row.kind === 'own';
              const title = row.resource.title;
              const type = isOwn ? row.resource.type : categoryToType(row.resource.category);
              const grade = row.resource.grade;
              const subject = row.resource.subject;
              const date = isOwn ? row.resource.createdAt : row.resource.uploadedAt;
              const key = isOwn ? `own-${row.resource.id}` : `dept-${row.resource.id}`;

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setViewingResource(row)}
                  className={`${aisCard} flex flex-col p-4 text-left transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ais-primary`}
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <AisStatusBadge variant="primary">{type}</AisStatusBadge>
                    <AisStatusBadge variant={isOwn ? 'neutral' : 'success'}>
                      {isOwn ? 'My upload' : 'Department'}
                    </AisStatusBadge>
                  </div>
                  <h4 className={`${aisHeadlineSm} line-clamp-2 !text-title`}>{title}</h4>
                  <p className={`${aisBodySm} mt-1`}>
                    {grade && subject ? `${grade} · ${subject}` : grade || subject || (row.kind === 'department' ? row.resource.category : '')}
                  </p>
                  <p className={`${aisBodySm} mt-auto pt-3`}>{date}</p>
                </button>
              );
            })}
          </div>
        )}
      </AisPanel>

      <Dialog
        isOpen={!!viewingResource}
        onClose={() => setViewingResource(null)}
        title={viewingResource ? viewingResource.resource.title : ''}
        size="lg"
      >
        {viewingResource && (() => {
          const url = resourceUrlOf(viewingResource);
          const row = viewingResource;
          const isOwn = row.kind === 'own';
          const grade = row.resource.grade;
          const subject = row.resource.subject;
          return (
            <div className="space-y-4 pt-2">
              <p className={aisBodySm}>
                {grade && subject ? `${grade} · ${subject}` : grade || subject}
                {' — '}
                {isOwn ? row.resource.type : categoryToType(row.resource.category)}
              </p>
              {url && isImageUrl(url) && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={url} alt={row.resource.title} className="max-h-[60vh] w-full rounded-lg object-contain" />
              )}
              {url && isVideoUrl(url) && !isImageUrl(url) && (
                <video src={url} controls className="max-h-[60vh] w-full rounded-lg" />
              )}
              {url && isPdfUrl(url) && (
                <iframe src={url} className="h-[60vh] w-full rounded-lg border border-ais-card-border" title={row.resource.title} />
              )}
              {url && !isImageUrl(url) && !isVideoUrl(url) && !isPdfUrl(url) && (
                <div className={`${aisCard} p-6 text-center`}>
                  <p className={aisBodyMd}>This file type can&apos;t be previewed inline.</p>
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center justify-center gap-2 rounded-2xl bg-btn-primary px-6 py-2 text-sm font-semibold text-btn-primary-foreground transition-all hover:bg-btn-primary/90"
                  >
                    Open resource
                  </a>
                </div>
              )}
              {!url && <p className={aisBodyMd}>No file or link attached to this resource.</p>}
            </div>
          );
        })()}
      </Dialog>

      <Dialog isOpen={isOpen} onClose={() => setIsOpen(false)} title="Upload & disseminate resource" size="md">
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <input className={aisInput} required placeholder="Resource title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Select variant="ais" label="Type" options={RESOURCE_TYPES.map((t) => ({ value: t, label: t }))} value={type} onChange={(e) => setType(e.target.value as TeacherResource['type'])} />
          <Select variant="ais" label="Grade" options={GRADE_OPTIONS.map((g) => ({ value: g, label: g }))} value={resGrade} onChange={(e) => setResGrade(e.target.value)} />
          <input className={aisInput} value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" />
          <div className="space-y-2">
            <label className="text-xs font-semibold text-ais-on-surface-variant uppercase tracking-wide">
              File from device
            </label>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.webp,.mp4,.txt,.csv,.zip"
              className="w-full text-sm text-ais-on-surface file:mr-3 file:rounded-xl file:border-0 file:bg-ais-primary/10 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-ais-primary hover:file:bg-ais-primary/20"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                setResourceFile(file);
                if (file && !title) {
                  setTitle(file.name.replace(/\.[^.]+$/, ''));
                }
              }}
            />
            {resourceFile && (
              <p className="text-xs text-ais-on-surface-variant">
                Selected: {resourceFile.name} ({(resourceFile.size / 1024).toFixed(0)} KB)
              </p>
            )}
          </div>
          <input className={aisInput} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="External link (optional if uploading from device)" />
          <DialogFooter className="flex-wrap gap-3 pt-4 -mb-1">
            <AisBtnSecondary type="button" onClick={() => { setIsOpen(false); setResourceFile(null); }} disabled={uploading}>
              Cancel
            </AisBtnSecondary>
            <button
              type="submit"
              disabled={uploading || (!resourceFile && !url.trim())}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-btn-primary px-6 py-2 text-sm font-semibold text-btn-primary-foreground transition-all hover:bg-btn-primary/90 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? 'Uploading…' : 'Publish to students'}
            </button>
          </DialogFooter>
        </form>
      </Dialog>
    </AisPage>
  );
};
