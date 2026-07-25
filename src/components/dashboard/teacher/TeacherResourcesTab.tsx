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
  AisEmptyRow,
  AisPage,
  AisPanel,
  AisStatusBadge,
  AisTable,
  AisTd,
  AisTh,
  AisTr,
  aisInput,
} from '@/components/dashboard/teacher/TeacherPortalUi';
import { aisBodyMd } from '@/components/dashboard/teacher/aisStyles';

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
        description="Your uploads and department-shared study materials"
        flush
      >
        <AisTable>
          <thead>
            <tr className="bg-ais-surface-container-low">
              <AisTh>Title</AisTh>
              <AisTh>Type</AisTh>
              <AisTh>Grade / Subject</AisTh>
              <AisTh>Source</AisTh>
              <AisTh>Published</AisTh>
            </tr>
          </thead>
          <tbody>
            {allResources.length === 0 ? (
              <AisEmptyRow colSpan={5} message="No resources available yet." />
            ) : (
              allResources.map((row) => {
                if (row.kind === 'own') {
                  const r = row.resource;
                  return (
                    <AisTr key={`own-${r.id}`}>
                      <AisTd className="font-semibold">{r.title}</AisTd>
                      <AisTd>
                        <AisStatusBadge variant="primary">{r.type}</AisStatusBadge>
                      </AisTd>
                      <AisTd>
                        {r.grade} · {r.subject}
                      </AisTd>
                      <AisTd>
                        <AisStatusBadge variant="neutral">My upload</AisStatusBadge>
                      </AisTd>
                      <AisTd className={aisBodyMd}>{r.createdAt}</AisTd>
                    </AisTr>
                  );
                }

                const r = row.resource;
                const resourceType = categoryToType(r.category);
                return (
                  <AisTr key={`dept-${r.id}`}>
                    <AisTd className="font-semibold">
                      <a
                        href={r.resourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-ais-primary hover:underline"
                      >
                        {r.title}
                      </a>
                    </AisTd>
                    <AisTd>
                      <AisStatusBadge variant="primary">{resourceType}</AisStatusBadge>
                    </AisTd>
                    <AisTd>
                      {r.grade && r.subject
                        ? `${r.grade} · ${r.subject}`
                        : r.grade || r.subject || r.category}
                    </AisTd>
                    <AisTd>
                      <AisStatusBadge variant="success">Department</AisStatusBadge>
                    </AisTd>
                    <AisTd className={aisBodyMd}>{r.uploadedAt}</AisTd>
                  </AisTr>
                );
              })
            )}
          </tbody>
        </AisTable>
      </AisPanel>

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
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-ais-primary px-6 py-2 text-sm font-semibold text-white transition-all hover:bg-ais-primary-container shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? 'Uploading…' : 'Publish to students'}
            </button>
          </DialogFooter>
        </form>
      </Dialog>
    </AisPage>
  );
};
