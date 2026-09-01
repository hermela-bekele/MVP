'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { FileX, CheckCircle2, XCircle, Download, Printer } from 'lucide-react';
import { filterBySubjectScope, resolveDeptHeadScope } from '@/lib/departmentHead';
import { assessmentNeedsApproval } from '@/lib/teacherPortal';
import { DetailField } from '@/components/dashboard/shared/DetailField';
import { AssessmentContentRenderer } from '@/components/ui/AssessmentContentRenderer';
import { MathRenderer } from '@/components/ui/MathRenderer';
import { isGeneratedAssessmentBlob } from '@/lib/assessmentMarkdown';
import {
  assessmentToMarkdown,
  generatePDFFromMarkdown,
  printMarkdown,
  slugifyFilename,
} from '@/lib/pdfUtils';

interface DeptAssessmentReviewProps {
  assessmentId: string;
}

export const DeptAssessmentReview: React.FC<DeptAssessmentReviewProps> = ({ assessmentId }) => {
  const router = useRouter();
  const { assessments, currentUser, approveAssessment, rejectAssessment, addNotification } = useApp();
  const scope = useMemo(() => resolveDeptHeadScope(currentUser), [currentUser]);
  const departmentAssessments = useMemo(
    () => (scope ? filterBySubjectScope(assessments, scope) : []),
    [assessments, scope],
  );
  const assessment = useMemo(
    () => departmentAssessments.find((asm) => asm.id === assessmentId),
    [departmentAssessments, assessmentId],
  );
  const [comments, setComments] = useState('');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  if (!assessment) {
    return (
      <EmptyState
        icon={<FileX />}
        title="Assessment not found"
        description="This assessment may have been removed or is outside your department scope."
        action={
          <Button size="sm" onClick={() => router.push('/dashboard/department-head/assessments')}>
            Back to assessment desk
          </Button>
        }
      />
    );
  }

  const canReview =
    assessment.status === 'Pending Dept Head' &&
    assessmentNeedsApproval(assessment.type, assessment.createdByRole);
  const isAiDocument = isGeneratedAssessmentBlob(assessment.questions);

  const handleApprove = () => {
    approveAssessment(assessment.id, comments || 'Verified layout and syllabus alignment.');
    router.push('/dashboard/department-head/assessments');
  };

  const handleReject = () => {
    rejectAssessment(assessment.id, comments || 'Needs revision.');
    router.push('/dashboard/department-head/assessments');
  };

  const handlePrintExam = async () => {
    await printMarkdown(assessmentToMarkdown(assessment), assessment.title);
  };

  const handleDownloadExam = async () => {
    setIsGeneratingPDF(true);
    try {
      await generatePDFFromMarkdown(
        assessmentToMarkdown(assessment),
        `${slugifyFilename(assessment.title)}.pdf`,
        assessment.title,
      );
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      addNotification('PDF Generation Failed', 'Could not generate the PDF — please try again.', 'alert');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="w-full space-y-4">
      <div className="rounded-xl border border-border/60 bg-card p-5 sm:p-6 space-y-4">
        <h3 className="text-sm font-bold text-foreground">Assessment Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <DetailField label="Subject / Grade" value={`${assessment.subject} (${assessment.grade})`} />
          <DetailField label="Submitted By" value={assessment.teacherName} />
          <DetailField label="Assessment Level" value={`${assessment.difficulty} Level`} />
        </div>
      </div>

      <div className="rounded-xl border border-border/60 bg-card p-5 sm:p-6 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-foreground">Test Questions Blueprint</h3>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={() => void handlePrintExam()}
              disabled={assessment.questions.length === 0}
            >
              <Printer className="h-3.5 w-3.5" aria-hidden />
              Print
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={() => void handleDownloadExam()}
              disabled={isGeneratingPDF || assessment.questions.length === 0}
            >
              <Download className="h-3.5 w-3.5" aria-hidden />
              {isGeneratingPDF ? 'Generating…' : 'Download Exam'}
            </Button>
          </div>
        </div>
        {isAiDocument ? (
          <div className="rounded-lg border border-border/60 bg-white p-4 dark:bg-gray-900/40">
            <AssessmentContentRenderer
              content={assessment.questions[0].question}
              categoryLabel={`${assessment.type} · ${assessment.questions[0].type || 'Mixed'}`}
            />
          </div>
        ) : (
          <div className="space-y-3 rounded-lg border border-border/60 bg-muted/20 p-4">
            {assessment.questions.map((q, idx) => (
              <div key={q.id} className="border-b border-border/40 pb-3 text-xs last:border-0 last:pb-0">
                <p className="font-bold text-foreground">Question {idx + 1}</p>
                <div className="mt-1 font-semibold text-foreground">
                  <MathRenderer content={q.question} />
                </div>
                {q.options && (
                  <ul className="list-disc pl-5 mt-1 text-muted-foreground font-semibold">
                    {q.options.map((opt, i) => (
                      <li key={i}>
                        <MathRenderer content={opt} />
                      </li>
                    ))}
                  </ul>
                )}
                <div className="text-primary font-bold mt-1.5 text-[11px]">
                  Expected Answer: <MathRenderer content={q.answer} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border/60 bg-card p-5 sm:p-6 space-y-2">
        <label className="text-[10px] font-bold text-muted-foreground uppercase">Evaluation Comments</label>
        <textarea
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          placeholder="Add review directive notes or improvement recommendations..."
          className="w-full h-24 p-3 bg-muted/40 border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200"
        />
      </div>

      <div className="flex flex-wrap justify-end items-center gap-2">
        {canReview ? (
          <>
            <Button variant="destructive" size="sm" className="gap-1.5" onClick={handleReject}>
              <XCircle className="h-3.5 w-3.5" aria-hidden />
              Reject Draft
            </Button>
            <Button variant="organic" size="sm" className="gap-1.5 border-none" onClick={handleApprove}>
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
              Approve &amp; Circulate
            </Button>
          </>
        ) : (
          <p className="text-xs text-muted-foreground">
            {assessment.type === 'Quiz' || assessment.type === 'Baseline'
              ? 'Quizzes and baselines do not require department head approval — they are ready for teachers immediately.'
              : `This assessment is already ${assessment.status}.`}
          </p>
        )}
      </div>
    </div>
  );
};
