'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { readStoredSession } from '@/lib/auth';
import {
  AisBtnPrimary,
  AisBtnSecondary,
  AisEmptyRow,
  AisFormCard,
  AisPage,
  AisPanel,
  AisStatusBadge,
  AisTable,
  AisTd,
  AisTh,
  AisTr,
  aisInput,
  aisTextarea,
} from '@/components/dashboard/teacher/TeacherPortalUi';
import { Select } from '@/components/ui/select';
import { GRADE_OPTIONS } from '@/lib/teacherPortal';

type Question = {
  id: string;
  subject?: string;
  grade?: string;
  question_text?: string;
  question_type?: string;
  difficulty?: string;
};

type PracticeSet = {
  id: string;
  title?: string;
  subject?: string;
  grade?: string;
  published?: boolean;
};

export function TeacherPracticeBank() {
  const session = readStoredSession();
  const schoolId = session?.schoolId || 'sch-1';
  const [questions, setQuestions] = useState<Question[]>([]);
  const [sets, setSets] = useState<PracticeSet[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const [qText, setQText] = useState('');
  const [qSubject, setQSubject] = useState('Biology');
  const [qGrade, setQGrade] = useState('Grade 9');
  const [qType, setQType] = useState('mcq');
  const [qAnswer, setQAnswer] = useState('');
  const [qDiff, setQDiff] = useState('medium');

  const [setTitle, setSetTitle] = useState('');
  const [setSubject, setSetSubject] = useState('Biology');
  const [setGrade, setSetGrade] = useState('Grade 9');
  const [selectedQs, setSelectedQs] = useState<string[]>([]);
  const [publish, setPublish] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const [q, p] = await Promise.all([
        api.listQuestionBank(schoolId),
        api.portalPracticeSets(undefined, schoolId),
      ]);
      setQuestions(q as Question[]);
      setSets(p as PracticeSet[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load practice bank');
    }
  }, [schoolId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const addQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qText.trim()) return;
    setBusy(true);
    setError('');
    try {
      await api.createQuestion({
        schoolId,
        subject: qSubject,
        grade: qGrade,
        questionText: qText.trim(),
        questionType: qType,
        correctAnswer: qAnswer || null,
        difficulty: qDiff,
        options: qType === 'mcq' ? ['A', 'B', 'C', 'D'] : [],
      });
      setQText('');
      setQAnswer('');
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save question');
    } finally {
      setBusy(false);
    }
  };

  const toggleQ = (id: string) => {
    setSelectedQs((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const createSet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!setTitle.trim()) return;
    setBusy(true);
    setError('');
    try {
      await api.createPracticeSet({
        schoolId,
        title: setTitle.trim(),
        subject: setSubject,
        grade: setGrade,
        published: publish,
        questionIds: selectedQs,
      });
      setSetTitle('');
      setSelectedQs([]);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create practice set');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AisPage>
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      <div className="grid gap-4 lg:grid-cols-2">
        <AisFormCard title="Add to question bank" onSubmit={addQuestion}>
          <Select
            variant="ais"
            label="Grade"
            value={qGrade}
            onChange={(e) => setQGrade(e.target.value)}
            options={GRADE_OPTIONS.map((g) => ({ value: g, label: g }))}
          />
          <input className={aisInput} value={qSubject} onChange={(e) => setQSubject(e.target.value)} placeholder="Subject" />
          <Select
            variant="ais"
            label="Type"
            value={qType}
            onChange={(e) => setQType(e.target.value)}
            options={[
              { value: 'mcq', label: 'Multiple choice' },
              { value: 'short', label: 'Short answer' },
              { value: 'truefalse', label: 'True / false' },
            ]}
          />
          <Select
            variant="ais"
            label="Difficulty"
            value={qDiff}
            onChange={(e) => setQDiff(e.target.value)}
            options={[
              { value: 'easy', label: 'Easy' },
              { value: 'medium', label: 'Medium' },
              { value: 'hard', label: 'Hard' },
            ]}
          />
          <textarea className={aisTextarea} required value={qText} onChange={(e) => setQText(e.target.value)} placeholder="Question text" />
          <input className={aisInput} value={qAnswer} onChange={(e) => setQAnswer(e.target.value)} placeholder="Correct answer (optional)" />
          <AisBtnPrimary type="submit" disabled={busy}>
            Save question
          </AisBtnPrimary>
        </AisFormCard>

        <AisFormCard title="Publish practice set" onSubmit={createSet}>
          <input className={aisInput} required value={setTitle} onChange={(e) => setSetTitle(e.target.value)} placeholder="Set title" />
          <input className={aisInput} value={setSubject} onChange={(e) => setSetSubject(e.target.value)} placeholder="Subject" />
          <Select
            variant="ais"
            label="Grade"
            value={setGrade}
            onChange={(e) => setSetGrade(e.target.value)}
            options={GRADE_OPTIONS.map((g) => ({ value: g, label: g }))}
          />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={publish} onChange={(e) => setPublish(e.target.checked)} />
            Visible to students immediately
          </label>
          <p className="text-xs text-muted-foreground">Select questions below ({selectedQs.length} selected)</p>
          <AisBtnPrimary type="submit" disabled={busy}>
            Create practice set
          </AisBtnPrimary>
        </AisFormCard>
      </div>

      <AisPanel title="Question bank" description="Teacher-authored items for practice sets" flush>
        <AisTable>
          <thead>
            <tr className="bg-ais-surface-container-low">
              <AisTh>Use</AisTh>
              <AisTh>Grade</AisTh>
              <AisTh>Subject</AisTh>
              <AisTh>Question</AisTh>
              <AisTh>Type</AisTh>
              <AisTh>Level</AisTh>
            </tr>
          </thead>
          <tbody>
            {questions.length === 0 ? (
              <AisEmptyRow colSpan={6} message="No questions yet — add your first item above." />
            ) : (
              questions.map((q) => (
                <AisTr key={q.id}>
                  <AisTd>
                    <input type="checkbox" checked={selectedQs.includes(q.id)} onChange={() => toggleQ(q.id)} />
                  </AisTd>
                  <AisTd>{q.grade}</AisTd>
                  <AisTd>{q.subject}</AisTd>
                  <AisTd className="max-w-md text-xs">{q.question_text}</AisTd>
                  <AisTd>
                    <AisStatusBadge variant="neutral">{q.question_type || 'mcq'}</AisStatusBadge>
                  </AisTd>
                  <AisTd>{q.difficulty}</AisTd>
                </AisTr>
              ))
            )}
          </tbody>
        </AisTable>
      </AisPanel>

      <AisPanel title="Practice sets" description="Sets visible to students when published" flush>
        <AisTable>
          <thead>
            <tr className="bg-ais-surface-container-low">
              <AisTh>Title</AisTh>
              <AisTh>Subject</AisTh>
              <AisTh>Grade</AisTh>
              <AisTh>Status</AisTh>
            </tr>
          </thead>
          <tbody>
            {sets.length === 0 ? (
              <AisEmptyRow colSpan={4} message="No practice sets published yet." />
            ) : (
              sets.map((s) => (
                <AisTr key={s.id}>
                  <AisTd className="font-semibold">{s.title}</AisTd>
                  <AisTd>{s.subject}</AisTd>
                  <AisTd>{s.grade}</AisTd>
                  <AisTd>
                    <AisStatusBadge variant={s.published === false ? 'neutral' : 'success'}>
                      {s.published === false ? 'Draft' : 'Published'}
                    </AisStatusBadge>
                  </AisTd>
                </AisTr>
              ))
            )}
          </tbody>
        </AisTable>
        <div className="p-3">
          <AisBtnSecondary type="button" onClick={() => void refresh()}>
            Refresh
          </AisBtnSecondary>
        </div>
      </AisPanel>
    </AisPage>
  );
}
