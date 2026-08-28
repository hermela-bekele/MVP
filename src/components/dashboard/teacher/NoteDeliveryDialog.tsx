'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { Dialog, DialogFooter } from '@/components/ui/dialog';
import { Select } from '@/components/ui/select';
import {
  AisBtnPrimary,
  AisBtnSecondary,
  aisFormLabel,
  aisTextarea,
} from '@/components/dashboard/teacher/TeacherPortalUi';
import { aisBodySm } from '@/components/dashboard/teacher/aisStyles';
import type { GraspOutcome, TeachingNote } from '@/lib/mockData';
import { graspOutcomeLabel } from '@/lib/teacherPortal';
import { api } from '@/lib/api';
import type { Community, CommunityChannel } from '@/lib/communityTypes';

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
    communityId?: string;
    channelId?: string;
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
  const [postTarget, setPostTarget] = useState<PostTarget>('both');
  const [submitting, setSubmitting] = useState(false);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [channels, setChannels] = useState<CommunityChannel[]>([]);
  const [communityId, setCommunityId] = useState('');
  const [channelId, setChannelId] = useState('');
  const [loadingCommunities, setLoadingCommunities] = useState(false);

  const needsCommunity = postTarget === 'community' || postTarget === 'both';

  const reset = () => {
    setOutcome(null);
    setChallengeText('');
    setPostTarget('both');
    setSubmitting(false);
    setCommunityId('');
    setChannelId('');
    setChannels([]);
  };

  const handleClose = () => {
    if (submitting) return;
    reset();
    onClose();
  };

  useEffect(() => {
    if (!open || outcome !== 'challenged') return;
    let cancelled = false;
    setLoadingCommunities(true);
    void api
      .listCommunities()
      .then((rows) => {
        if (cancelled) return;
        setCommunities(rows);
        if (rows[0] && !communityId) setCommunityId(rows[0].id);
      })
      .catch(() => {
        if (!cancelled) setCommunities([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingCommunities(false);
      });
    return () => {
      cancelled = true;
    };
    // Only reload when the challenged step opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, outcome]);

  useEffect(() => {
    if (!communityId) {
      setChannels([]);
      setChannelId('');
      return;
    }
    let cancelled = false;
    void api.listCommunityChannels(communityId).then((rows) => {
      if (cancelled) return;
      const textPreferred =
        rows.find((c) => c.name.toLowerCase() === 'general') ??
        rows.find((c) => c.type === 'text') ??
        rows[0];
      setChannels(rows);
      setChannelId(textPreferred?.id ?? '');
    });
    return () => {
      cancelled = true;
    };
  }, [communityId]);

  const communityOptions = useMemo(
    () =>
      communities.length
        ? communities.map((c) => ({ value: c.id, label: c.name }))
        : [{ value: '', label: 'No communities available' }],
    [communities],
  );

  const channelOptions = useMemo(
    () =>
      channels.length
        ? channels.map((c) => ({
            value: c.id,
            label: `#${c.name}${c.type === 'announcement' ? ' (announcements)' : ''}`,
          }))
        : [{ value: '', label: 'No channels' }],
    [channels],
  );

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

  const canSubmitChallenge =
    Boolean(challengeText.trim()) &&
    (!needsCommunity || (Boolean(communityId) && Boolean(channelId)));

  const handleChallengeSubmit = async () => {
    if (!canSubmitChallenge) return;
    setSubmitting(true);
    try {
      await onSubmit({
        graspOutcome: 'challenged',
        challengeText: challengeText.trim(),
        postTo: postTarget,
        communityId: needsCommunity ? communityId : undefined,
        channelId: needsCommunity ? channelId : undefined,
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
            How did the class respond to{' '}
            <span className="font-semibold text-foreground">{note.title}</span>?
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
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:bg-muted'
                } disabled:opacity-60`}
              >
                <CheckCircle2
                  className={`mt-0.5 h-4 w-4 shrink-0 ${
                    selected ? 'text-primary' : 'text-muted-foreground'
                  }`}
                />
                <span>
                  <span className="block text-sm font-semibold text-foreground">
                    {graspOutcomeLabel(item.value)}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {item.hint}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        {outcome === 'challenged' && (
          <div className="space-y-3 rounded-xl border border-border bg-muted/40 p-4">
            <label className={aisFormLabel}>Describe the challenge or opportunity</label>
            <textarea
              className={`${aisTextarea} min-h-[110px]`}
              value={challengeText}
              onChange={(e) => setChallengeText(e.target.value)}
              placeholder="What was difficult, or what opportunity did you notice?"
              disabled={submitting}
            />

            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Share this with:</p>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ['hod', 'HoD only'],
                    ['community', 'Community only'],
                    ['both', 'HoD + community'],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    disabled={submitting}
                    onClick={() => setPostTarget(value)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                      postTarget === value
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-foreground hover:bg-muted'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {needsCommunity && (
              <div className="space-y-3 rounded-lg border border-border bg-white p-3 dark:bg-card">
                <p className="text-xs font-semibold text-foreground">
                  Choose a community you belong to
                </p>
                {loadingCommunities ? (
                  <p className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Loading your communities…
                  </p>
                ) : communities.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    You are not a member of any community yet. Post to HoD only, or join a community
                    first.
                  </p>
                ) : (
                  <>
                    <Select
                      variant="ais"
                      label="Community"
                      options={communityOptions}
                      value={communityId}
                      onChange={(e) => setCommunityId(e.target.value)}
                    />
                    <Select
                      variant="ais"
                      label="Channel"
                      options={channelOptions}
                      value={channelId}
                      onChange={(e) => setChannelId(e.target.value)}
                    />
                  </>
                )}
              </div>
            )}

            <AisBtnPrimary
              type="button"
              disabled={submitting || !canSubmitChallenge}
              onClick={() => void handleChallengeSubmit()}
              className="w-full justify-center"
            >
              {submitting ? 'Posting…' : 'Save & share challenge'}
            </AisBtnPrimary>
          </div>
        )}

        {submitting && outcome !== 'challenged' && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
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
