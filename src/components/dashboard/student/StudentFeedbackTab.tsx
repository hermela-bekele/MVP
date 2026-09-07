'use client';

import React, { useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { AisPage, AisPanel, AisTable, AisTd, AisTh, AisTr } from '@/components/dashboard/teacher/TeacherPortalUi';
import { aisBodyMd, aisBodySm } from '@/components/dashboard/teacher/aisStyles';
import { StudentFeedbackForm } from '@/components/dashboard/student/StudentFeedbackForm';
import { Pagination } from '@/components/ui/pagination';

const PAGE_SIZE = 10;

/**
 * Read-only view of feedback a student has received from their teachers, plus a
 * form to send feedback/questions back to a teacher. Mirrors TeacherFeedbackTab
 * but from the student's side of the same `TeacherFeedback` records.
 */
export const StudentFeedbackTab: React.FC = () => {
  const { currentUser, students, teacherFeedbacks } = useApp();

  const activeStudent = useMemo(() => {
    const byEmail = currentUser?.email
      ? students.find((s) => s.email?.toLowerCase() === currentUser.email.toLowerCase())
      : undefined;
    return byEmail ?? students.find((s) => s.id === 'std-1') ?? students[0];
  }, [currentUser, students]);

  const received = useMemo(
    () =>
      teacherFeedbacks.filter(
        (f) => f.direction === 'from_teacher' && f.studentId === activeStudent?.id
      ),
    [teacherFeedbacks, activeStudent]
  );

  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(received.length / PAGE_SIZE));
  const page = Math.min(currentPage, totalPages);
  const pagedFeedback = received.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <AisPage>
      <AisPanel title="Feedback from your teachers" description="Comments and coaching notes shared about your work" flush>
        {received.length === 0 ? (
          <p className={`${aisBodySm} py-8 text-center`}>No feedback yet.</p>
        ) : (
          <AisTable>
            <thead>
              <tr className="bg-muted">
                <AisTh>Teacher</AisTh>
                <AisTh>Subject</AisTh>
                <AisTh>Comment</AisTh>
                <AisTh>Date</AisTh>
              </tr>
            </thead>
            <tbody>
              {pagedFeedback.map((f) => (
                <AisTr key={f.id}>
                  <AisTd className="font-semibold">{f.authorName}</AisTd>
                  <AisTd>{f.subject}</AisTd>
                  <AisTd className="max-w-md text-xs">{f.comment}</AisTd>
                  <AisTd className={aisBodyMd}>{f.date}</AisTd>
                </AisTr>
              ))}
            </tbody>
          </AisTable>
        )}
        <Pagination
          className="mt-3 p-4 pt-0"
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={received.length}
          pageSize={PAGE_SIZE}
          entityLabel="feedback entries"
        />
      </AisPanel>

      <StudentFeedbackForm studentId={activeStudent?.id} studentName={activeStudent?.name} />
    </AisPage>
  );
};
