'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Select } from '@/components/ui/select';
import { Dialog, DialogFooter } from '@/components/ui/dialog';
import { GRADE_OPTIONS } from '@/lib/teacherPortal';
import type { TeacherResource } from '@/lib/mockData';
import {
  AisBtnPrimary,
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

export const TeacherResourcesTab: React.FC = () => {
  const { teacherResources, addTeacherResource, resolveTeacherId } = useApp();
  const teacherId = resolveTeacherId();
  const myResources = teacherResources.filter((r) => r.teacherId === teacherId);

  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<TeacherResource['type']>('Worksheet');
  const [resGrade, setResGrade] = useState('Grade 9');
  const [subject, setSubject] = useState('Biology');
  const [url, setUrl] = useState('');

  useEffect(() => {
    const open = () => setIsOpen(true);
    window.addEventListener('open-teacher-resource', open);
    return () => window.removeEventListener('open-teacher-resource', open);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !url) return;
    addTeacherResource({ title, type, grade: resGrade, subject, url });
    setTitle('');
    setUrl('');
    setIsOpen(false);
  };

  return (
    <AisPage>
      <AisPanel title="Classroom resources" description="Upload and disseminate materials to your students" flush>
        <AisTable>
          <thead>
            <tr className="bg-ais-surface-container-low">
              <AisTh>Title</AisTh>
              <AisTh>Type</AisTh>
              <AisTh>Grade / Subject</AisTh>
              <AisTh>Downloads</AisTh>
              <AisTh>Published</AisTh>
            </tr>
          </thead>
          <tbody>
            {myResources.length === 0 ? (
              <AisEmptyRow colSpan={5} message="No resources uploaded yet." />
            ) : (
              myResources.map((r) => (
                <AisTr key={r.id}>
                  <AisTd className="font-semibold">{r.title}</AisTd>
                  <AisTd>
                    <AisStatusBadge variant="primary">{r.type}</AisStatusBadge>
                  </AisTd>
                  <AisTd>{r.grade} · {r.subject}</AisTd>
                  <AisTd className="font-mono tabular-nums">{r.downloads}</AisTd>
                  <AisTd className={aisBodyMd}>{r.createdAt}</AisTd>
                </AisTr>
              ))
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
          <input className={aisInput} required value={url} onChange={(e) => setUrl(e.target.value)} placeholder="File URL or link" />
          <DialogFooter className="flex-wrap gap-3 border-t border-ais-card-border dark:border-gray-700 pt-4 -mb-1">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="inline-flex items-center justify-center gap-2 px-5 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#1d4ed8] px-6 py-2 text-sm font-semibold text-white transition-all hover:bg-[#1e40af] shadow-md hover:shadow-lg"
            >
              Publish to students
            </button>
          </DialogFooter>
        </form>
      </Dialog>
    </AisPage>
  );
};
