'use client';

import React, { useState, useEffect } from 'react';
import { FilePlus, Upload } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Select } from '@/components/ui/select';
import { Dialog, DialogFooter } from '@/components/ui/dialog';
import { filterTeacherAssessments, GRADE_OPTIONS } from '@/lib/teacherPortal';
import type { Assessment } from '@/lib/mockData';
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
  approvalBadgeVariant,
  aisInput,
} from '@/components/dashboard/teacher/TeacherPortalUi';

export const TeacherAssessmentsTab: React.FC = () => {
  const { assessments, createAssessment } = useApp();
  const myAssessments = filterTeacherAssessments(assessments);

  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<Assessment['type']>('Quiz');
  const [subject, setSubject] = useState('Biology');
  const [grade, setGrade] = useState('Grade 9');
  const [difficulty, setDifficulty] = useState<Assessment['difficulty']>('Medium');
  const [uploadMode, setUploadMode] = useState<'create' | 'upload'>('create');

  useEffect(() => {
    const open = () => {
      setUploadMode('create');
      setIsOpen(true);
    };
    window.addEventListener('open-teacher-assessment', open);
    return () => window.removeEventListener('open-teacher-assessment', open);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    createAssessment({
      title,
      type,
      subject,
      grade,
      difficulty,
      questions:
        uploadMode === 'upload'
          ? [{ id: 1, question: 'Uploaded assessment file — see attachment in school records.', type: 'File', answer: 'N/A' }]
          : [
              { id: 1, question: 'Sample question 1', type: 'MCQ', options: ['A', 'B', 'C', 'D'], answer: 'A' },
              { id: 2, question: 'Sample question 2', type: 'Short Answer', answer: 'Open response' },
            ],
    });
    setTitle('');
    setIsOpen(false);
  };

  return (
    <AisPage>
      <AisPanel
        title="My assessments"
        description="Quizzes, tests, and exams — submitted to department head for approval"
        flush
        actions={
          <>
            <AisBtnPrimary onClick={() => { setUploadMode('create'); setIsOpen(true); }}>
              <FilePlus className="h-3.5 w-3.5" aria-hidden />
              Create assessment
            </AisBtnPrimary>
            <AisBtnSecondary onClick={() => { setUploadMode('upload'); setIsOpen(true); }}>
              <Upload className="h-3.5 w-3.5" aria-hidden />
              Upload test file
            </AisBtnSecondary>
          </>
        }
      >
        <AisTable>
          <thead>
            <tr className="bg-ais-surface-container-low">
              <AisTh>Title</AisTh>
              <AisTh>Type</AisTh>
              <AisTh>Grade / Subject</AisTh>
              <AisTh>Difficulty</AisTh>
              <AisTh>Questions</AisTh>
              <AisTh>Status</AisTh>
            </tr>
          </thead>
          <tbody>
            {myAssessments.length === 0 ? (
              <AisEmptyRow colSpan={6} message="No assessments created yet." />
            ) : (
              myAssessments.map((a) => (
                <AisTr key={a.id}>
                  <AisTd className="font-semibold">{a.title}</AisTd>
                  <AisTd>{a.type}</AisTd>
                  <AisTd>{a.grade} · {a.subject}</AisTd>
                  <AisTd>{a.difficulty}</AisTd>
                  <AisTd className="tabular-nums">{a.questions.length}</AisTd>
                  <AisTd>
                    <AisStatusBadge variant={approvalBadgeVariant(a.status)}>{a.status}</AisStatusBadge>
                  </AisTd>
                </AisTr>
              ))
            )}
          </tbody>
        </AisTable>
      </AisPanel>

      <Dialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={uploadMode === 'upload' ? 'Upload assessment' : 'Create assessment'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <input className={aisInput} required placeholder="Assessment title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Select variant="ais" label="Type" options={['Quiz', 'Mid Exam', 'Final Exam', 'Assignment', 'Practical'].map((t) => ({ value: t, label: t }))} value={type} onChange={(e) => setType(e.target.value as Assessment['type'])} />
            <Select variant="ais" label="Grade" options={GRADE_OPTIONS.map((g) => ({ value: g, label: g }))} value={grade} onChange={(e) => setGrade(e.target.value)} />
            <Select variant="ais" label="Subject" options={[{ value: 'Biology', label: 'Biology' }]} value={subject} onChange={(e) => setSubject(e.target.value)} />
            <Select variant="ais" label="Difficulty" options={['Easy', 'Medium', 'Hard'].map((d) => ({ value: d, label: d }))} value={difficulty} onChange={(e) => setDifficulty(e.target.value as Assessment['difficulty'])} />
          </div>
          {uploadMode === 'upload' && <input type="file" className="text-xs text-ais-on-surface-variant" onChange={() => {}} />}
          <DialogFooter className="flex-wrap gap-2 border-t border-ais-card-border pt-4">
            <AisBtnSecondary type="button" onClick={() => setIsOpen(false)}>Cancel</AisBtnSecondary>
            <AisBtnPrimary type="submit">Submit for dept head approval</AisBtnPrimary>
          </DialogFooter>
        </form>
      </Dialog>
    </AisPage>
  );
};
