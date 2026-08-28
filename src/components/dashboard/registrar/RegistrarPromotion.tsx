'use client';

import React, { useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { ContentCard } from '@/components/dashboard/ContentCard';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Dialog, DialogFooter } from '@/components/ui/dialog';
import { filterSchoolStudents, REGISTRAR_GRADE_OPTIONS } from '@/lib/registrarPortal';
import { api } from '@/lib/api';
import { readStoredSession } from '@/lib/auth';

export const RegistrarPromotion: React.FC = () => {
  const { students, refreshFromApi } = useApp();
  const session = readStoredSession();
  const schoolId = session?.schoolId || 'sch-1';
  const schoolStudents = filterSchoolStudents(students).filter((s) => s.status === 'Active');

  const promotableGrades = REGISTRAR_GRADE_OPTIONS.slice(0, -1);
  const [fromGrade, setFromGrade] = useState(promotableGrades[0] ?? 'Grade 7');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ fromGrade: string; toGrade: string; promoted: number } | null>(null);

  const toGrade = REGISTRAR_GRADE_OPTIONS[REGISTRAR_GRADE_OPTIONS.indexOf(fromGrade) + 1] ?? fromGrade;
  const affectedCount = useMemo(
    () => schoolStudents.filter((s) => s.grade === fromGrade).length,
    [schoolStudents, fromGrade]
  );

  const handlePromote = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await api.promoteStudents({ schoolId, fromGrade, toGrade });
      setResult({ fromGrade, toGrade, promoted: res.promoted });
      setConfirmOpen(false);
      await refreshFromApi();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Promotion failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="w-full space-y-4 animate-fade-in">
      <ContentCard
        title="Bulk Grade Promotion"
        description="Move every active student in a grade up to the next level at year-end rollover. Sections are cleared and must be reassigned afterward via Class Placement."
      >
        <div className="space-y-4">
          {error && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </div>
          )}
          {result && (
            <div className="rounded-md border border-success/40 bg-success/10 px-3 py-2 text-xs text-success">
              Promoted {result.promoted} student{result.promoted === 1 ? '' : 's'} from {result.fromGrade} to {result.toGrade}.
              Reassign sections in Class Placement.
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">From grade</label>
            <Select
              options={promotableGrades.map((g) => ({ value: g, label: g }))}
              value={fromGrade}
              onChange={(e) => { setFromGrade(e.target.value); setResult(null); }}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 p-4">
            <div>
              <p className="text-xs font-semibold text-foreground">{affectedCount} active student{affectedCount === 1 ? '' : 's'}</p>
              <p className="text-[10px] text-muted-foreground">will move from {fromGrade} to {toGrade}</p>
            </div>
            <Button
              variant="organic"
              size="sm"
              className="text-xs h-9 border-none font-semibold px-5"
              disabled={affectedCount === 0}
              onClick={() => setConfirmOpen(true)}
            >
              Promote Grade
            </Button>
          </div>
        </div>
      </ContentCard>

      <Dialog isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} title="Confirm Grade Promotion">
        <div className="space-y-4 pt-2">
          <p className="text-xs text-muted-foreground">
            This will move <strong className="text-foreground">{affectedCount} active student{affectedCount === 1 ? '' : 's'}</strong> from{' '}
            <strong className="text-foreground">{fromGrade}</strong> to <strong className="text-foreground">{toGrade}</strong>.
            Their class section will be cleared — you'll need to reassign sections afterward in Class Placement.
          </p>
          <DialogFooter className="border-t border-border/20 pt-4">
            <Button variant="outline" size="sm" onClick={() => setConfirmOpen(false)} className="text-xs h-9">Cancel</Button>
            <Button variant="organic" size="sm" disabled={busy} onClick={handlePromote} className="text-xs h-9 border-none font-semibold">
              {busy ? 'Promoting…' : 'Confirm Promotion'}
            </Button>
          </DialogFooter>
        </div>
      </Dialog>
    </div>
  );
};
