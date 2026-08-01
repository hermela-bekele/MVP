'use client';

import React, { useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { Dialog, DialogFooter } from '@/components/ui/dialog';
import {
  AisBtnPrimary,
  AisBtnSecondary,
  aisFormLabel,
  aisTextarea,
} from '@/components/dashboard/teacher/TeacherPortalUi';
import { aisBodySm } from '@/components/dashboard/teacher/aisStyles';
import type { GraspOutcome, TeachingNote } from '@/lib/mockData';
import { graspOutcomeLabel } from '@/lib/teacherPortal';

const OUTCOMES: { value: GraspOutcome; hint: string }[] = [
  { value: 'well_grasped', hint: 'Class understood the lesson clearly' },
  { value: 'majority_grasped', hint: 'Most students followed; a few need support' },
  { value: 'challenged', hint: 'Capture a challenge or opportunity to share' },
];

type PostTarget = 'hod' | 'community' | 'both';

interface NoteDeliveryDialogProps {
  open: boolean;
  note: TeachingNote | null;
  onClose: () => void;
  onSubmit: (payload: {
    graspOutcome: GraspOutcome;
    challengeText?: string;
    postTo: PostTarget | 'none';
  }) => Promise<void>;
}

export function NoteDeliveryDialog({
  open,
  note,
  onClose,
  onSubmit,
}: NoteDeliveryDialogProps) {
  const [outcome, setOutcome] = useState<GraspOutcome | null>(null);
  const [challengeText, setChallengeText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setOutcome(null);
    setChallengeText('');
    setSubmitting(false);
  };

  const handleClose = () => {
    if (submitting) return;
    reset();
    onClose();
  };

  const handleOutcomeSelect = async (value: GraspOutcome) => {
    setOutcome(value);
    if (value !== 'challenged') {
      setSubmitting(true);
      try {
        await onSubmit({ graspOutcome: value, postTo: 'none' });
        reset();
        onClose();
      } catch {
        setSubmitting(false);
      }
    }
  };

  const handleChallengePost = async (postTo: PostTarget) => {
    if (!challengeText.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit({
        graspOutcome: 'challenged',
        challengeText: challengeText.trim(),
        postTo,
      });
      reset();
      onClose();
    } catch {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={open}
      onClose={handleClose}
      title="Mark lesson delivered"
      size="md"
      largeTitle
    >
      <div className="space-y-4 pt-1">
        {note && (
          <p className={aisBodySm}>
            How did the class respond to <span className="font-semibold text-ais-on-surface">{note.title}</span>?
          </p>
        )}

        <div className="space-y-2">
          {OUTCOMES.map((item) => {
            const selected = outcome === item.value;
            return (
              <button
                key={item.value}
                type="button"
                disabled={submitting}
                onClick={() => void handleOutcomeSelect(item.value)}
                className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
                  selected
                    ? 'border-ais-primary bg-ais-primary/5'
                    : 'border-ais-card-border hover:bg-ais-row-hover'
                } disabled:opacity-60`}
              >
                <CheckCircle2
                  className={`mt-0.5 h-4 w-4 shrink-0 ${
                    selected ? 'text-ais-primary' : 'text-ais-on-surface-variant'
                  }`}
                />
                <span>
                  <span className="block text-sm font-semibold text-ais-on-surface">
                    {graspOutcomeLabel(item.value)}
                  </span>
                  <span className="mt-0.5 block text-xs text-ais-on-surface-variant">
                    {item.hint}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        {outcome === 'challenged' && (
          <div className="space-y-3 rounded-xl border border-ais-card-border bg-ais-surface-container-low/40 p-4">
            <label className={aisFormLabel}>Describe the challenge or opportunity</label>
            <textarea
              className={`${aisTextarea} min-h-[110px]`}
              value={challengeText}
              onChange={(e) => setChallengeText(e.target.value)}
              placeholder="What was difficult, or what opportunity did you notice?"
              disabled={submitting}
            />
            <p className="text-xs text-ais-on-surface-variant">Share this with:</p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <AisBtnSecondary
                type="button"
                disabled={submitting || !challengeText.trim()}
                onClick={() => void handleChallengePost('hod')}
                className="flex-1 justify-center"
              >
                Post to HoD
              </AisBtnSecondary>
              <AisBtnSecondary
                type="button"
                disabled={submitting || !challengeText.trim()}
                onClick={() => void handleChallengePost('community')}
                className="flex-1 justify-center"
              >
                Post to community
              </AisBtnSecondary>
              <AisBtnPrimary
                type="button"
                disabled={submitting || !challengeText.trim()}
                onClick={() => void handleChallengePost('both')}
                className="flex-1 justify-center"
              >
                Post to both
              </AisBtnPrimary>
            </div>
          </div>
        )}

        {submitting && (
          <div className="flex items-center gap-2 text-sm text-ais-on-surface-variant">
            <Loader2 className="h-4 w-4 animate-spin" />
            Saving delivery feedback…
          </div>
        )}

        <DialogFooter>
          <AisBtnSecondary type="button" onClick={handleClose} disabled={submitting}>
            Cancel
          </AisBtnSecondary>
        </DialogFooter>
      </div>
    </Dialog>
  );
}
