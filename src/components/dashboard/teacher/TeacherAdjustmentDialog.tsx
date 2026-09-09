'use client';

import React, { useState } from 'react';
import { Dialog, DialogFooter } from '@/components/ui/dialog';
import {
  AisBtnPrimary,
  AisBtnSecondary,
  aisFormLabel,
  aisInput,
  aisTextarea,
} from '@/components/dashboard/teacher/TeacherPortalUi';
import { aisBodySm } from '@/components/dashboard/teacher/aisStyles';
import type { LessonPlan } from '@/lib/mockData';

interface TeacherAdjustmentDialogProps {
  open: boolean;
  weeklyPlan: LessonPlan | null;
  annualPlan: LessonPlan | null;
  onClose: () => void;
  onSubmit: (payload: {
    originalTopic: string;
    revisedTopic: string;
    reason: string;
    pacingImpact: string;
  }) => Promise<void>;
}

/**
 * TE-004: captures a Teacher Adjustment — a recorded departure from the annual plan.
 * The annual plan itself is never edited by this dialog; it only logs what changed,
 * why, and the pacing impact, so curriculum coverage stays traceable.
 */
export function TeacherAdjustmentDialog({
  open,
  weeklyPlan,
  annualPlan,
  onClose,
  onSubmit,
}: TeacherAdjustmentDialogProps) {
  const [originalTopic, setOriginalTopic] = useState('');
  const [revisedTopic, setRevisedTopic] = useState('');
  const [reason, setReason] = useState('');
  const [pacingImpact, setPacingImpact] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setOriginalTopic('');
    setRevisedTopic('');
    setReason('');
    setPacingImpact('');
    setSubmitting(false);
  };

  const handleClose = () => {
    if (submitting) return;
    reset();
    onClose();
  };

  const canSubmit = originalTopic.trim() && revisedTopic.trim() && reason.trim();

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await onSubmit({
        originalTopic: originalTopic.trim(),
        revisedTopic: revisedTopic.trim(),
        reason: reason.trim(),
        pacingImpact: pacingImpact.trim(),
      });
      reset();
      onClose();
    } catch {
      setSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={open} onClose={handleClose} title="Log a Teacher Adjustment" size="md" largeTitle>
      <div className="space-y-4 pt-1">
        <p className={aisBodySm}>
          Record a departure from the annual plan for{' '}
          <span className="font-semibold text-foreground">{weeklyPlan?.title}</span>. The annual plan
          {annualPlan ? ` ("${annualPlan.title}")` : ''} is not changed — this is logged as an exception
          alongside it.
        </p>

        <div className="space-y-1.5">
          <label className={aisFormLabel}>Originally planned topic/unit</label>
          <input
            className={aisInput}
            placeholder="What the annual plan called for this week"
            value={originalTopic}
            onChange={(e) => setOriginalTopic(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <label className={aisFormLabel}>What you actually taught instead</label>
          <input
            className={aisInput}
            placeholder="The revised topic/unit"
            value={revisedTopic}
            onChange={(e) => setRevisedTopic(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <label className={aisFormLabel}>Reason</label>
          <textarea
            className={aisTextarea}
            rows={2}
            placeholder="Why did you deviate from the annual plan?"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <label className={aisFormLabel}>Impact on pacing (optional)</label>
          <input
            className={aisInput}
            placeholder="e.g. one week behind on Unit 3; will combine with next unit"
            value={pacingImpact}
            onChange={(e) => setPacingImpact(e.target.value)}
          />
        </div>

        <DialogFooter>
          <AisBtnSecondary type="button" onClick={handleClose} disabled={submitting}>
            Cancel
          </AisBtnSecondary>
          <AisBtnPrimary type="button" onClick={() => void handleSubmit()} disabled={submitting || !canSubmit}>
            {submitting ? 'Saving…' : 'Log adjustment'}
          </AisBtnPrimary>
        </DialogFooter>
      </div>
    </Dialog>
  );
}
