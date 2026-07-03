'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { Select } from '@/components/ui/select';
import { filterTeacherStudents } from '@/lib/teacherPortal';
import {
  AisBtnPrimary,
  AisFormCard,
  AisPage,
  AisPanel,
  AisTable,
  AisTd,
  AisTh,
  AisTr,
  aisInput,
  aisTextarea,
} from '@/components/dashboard/teacher/TeacherPortalUi';
import { aisBodyMd } from '@/components/dashboard/teacher/aisStyles';

export const TeacherFeedbackTab: React.FC = () => {
  const { teacherFeedbacks, students, addStudentFeedback, resolveTeacherId } = useApp();
  const teacherId = resolveTeacherId();
  const roster = useMemo(() => filterTeacherStudents(students), [students]);

  const received = teacherFeedbacks.filter((f) => f.teacherId === teacherId && f.direction === 'to_teacher');
  const given = teacherFeedbacks.filter((f) => f.teacherId === teacherId && f.direction === 'from_teacher');

  const [studentId, setStudentId] = useState(roster[0]?.id ?? '');
  const [subject, setSubject] = useState('');
  const [comment, setComment] = useState('');

  const handleGiveFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    const student = roster.find((s) => s.id === studentId);
    if (!student || !comment.trim()) return;
    addStudentFeedback({
      studentId: student.id,
      studentName: student.name,
      subject: subject || 'General feedback',
      comment,
    });
    setSubject('');
    setComment('');
  };

  return (
    <AisPage>
      <AisPanel title="Feedback received" description="Comments from department head and school leadership" flush>
        <AisTable>
          <thead>
            <tr className="bg-ais-surface-container-low">
              <AisTh>From</AisTh>
              <AisTh>Subject</AisTh>
              <AisTh>Comment</AisTh>
              <AisTh>Rating</AisTh>
              <AisTh>Date</AisTh>
            </tr>
          </thead>
          <tbody>
            {received.map((f) => (
              <AisTr key={f.id}>
                <AisTd className="font-semibold">{f.authorName}</AisTd>
                <AisTd>{f.subject}</AisTd>
                <AisTd className="max-w-md text-xs">{f.comment}</AisTd>
                <AisTd className="tabular-nums">{f.rating ? `${f.rating}/5` : '—'}</AisTd>
                <AisTd className={aisBodyMd}>{f.date}</AisTd>
              </AisTr>
            ))}
          </tbody>
        </AisTable>
      </AisPanel>

      <AisFormCard title="Give feedback to a student" onSubmit={handleGiveFeedback}>
        <Select variant="ais" label="Student" options={roster.map((s) => ({ value: s.id, label: s.name }))} value={studentId} onChange={(e) => setStudentId(e.target.value)} />
        <input className={aisInput} placeholder="Feedback subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
        <textarea className={aisTextarea} required placeholder="Your feedback..." value={comment} onChange={(e) => setComment(e.target.value)} />
        <AisBtnPrimary type="submit">Save student feedback</AisBtnPrimary>
      </AisFormCard>

      <AisPanel title="Feedback you provided" description="Recorded comments for students" flush>
        <AisTable>
          <thead>
            <tr className="bg-ais-surface-container-low">
              <AisTh>Student</AisTh>
              <AisTh>Subject</AisTh>
              <AisTh>Comment</AisTh>
              <AisTh>Date</AisTh>
            </tr>
          </thead>
          <tbody>
            {given.map((f) => (
              <AisTr key={f.id}>
                <AisTd className="font-semibold">{f.studentName}</AisTd>
                <AisTd>{f.subject}</AisTd>
                <AisTd className="text-xs">{f.comment}</AisTd>
                <AisTd className={aisBodyMd}>{f.date}</AisTd>
              </AisTr>
            ))}
          </tbody>
        </AisTable>
      </AisPanel>
    </AisPage>
  );
};
