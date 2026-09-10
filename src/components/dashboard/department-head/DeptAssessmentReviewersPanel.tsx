'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { resolveDeptHeadScope } from '@/lib/departmentHead';
import { api } from '@/lib/api';

type ReviewerRow = { teacherId: string; teacherName?: string; teacherEmail?: string };

/**
 * HoD panel for designating teachers who review Mid/Final Exams before they're
 * disseminated to the rest of the department, and who gain the same right to
 * generate those exams themselves. Uses replace-semantics: the full selected set
 * is sent on save, matching POST /assessment-reviewers on the backend.
 */
export function DeptAssessmentReviewersPanel() {
  const { currentUser, teachers, addNotification } = useApp();
  const scope = useMemo(() => resolveDeptHeadScope(currentUser), [currentUser]);

  const deptTeachers = useMemo(
    () =>
      teachers.filter(
        (t) =>
          t.status === 'Active' &&
          scope &&
          (t.departmentId === scope.departmentId ||
            t.subjects.some((s) => s.toLowerCase().includes((scope.subject || '').toLowerCase()))),
      ),
    [teachers, scope],
  );

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!scope?.departmentId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    api
      .listAssessmentReviewers(scope.departmentId)
      .then((rows) => {
        if (cancelled) return;
        setSelected(new Set((rows as ReviewerRow[]).map((r) => r.teacherId)));
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [scope?.departmentId]);

  const toggle = (teacherId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(teacherId)) next.delete(teacherId);
      else next.add(teacherId);
      return next;
    });
  };

  const save = () => {
    setSaving(true);
    api
      .setAssessmentReviewers([...selected])
      .then(() => {
        addNotification(
          'Reviewer permissions updated',
          selected.size > 0
            ? `${selected.size} teacher${selected.size === 1 ? '' : 's'} can now review and generate Mid/Final Exams. They've been added to the Reviewers community.`
            : 'No teachers are currently designated as exam reviewers.',
          'success',
        );
      })
      .catch(() => {
        addNotification('Could not save reviewer permissions', 'Please try again.', 'alert');
      })
      .finally(() => setSaving(false));
  };

  if (!scope) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-primary" />
            Exam reviewers
          </CardTitle>
        </div>
        <Button
          type="button"
          variant="organic"
          size="sm"
          className="shrink-0 border-none text-xs"
          onClick={save}
          disabled={saving || loading}
        >
          {saving ? 'Saving…' : 'Save reviewers'}
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Selected teachers will be notified to review new Mid/Final Exams before they&apos;re shared
          with the rest of the department, and can generate those exams themselves. A{' '}
          <strong>Reviewers community</strong> is created automatically once you save.
        </p>
        {loading ? (
          <p className="text-xs text-muted-foreground">Loading teachers…</p>
        ) : deptTeachers.length === 0 ? (
          <p className="text-xs text-muted-foreground">No active teachers found in this department.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {deptTeachers.map((t) => (
              <label
                key={t.id}
                className="flex cursor-pointer items-center gap-2 rounded-md border border-border/40 bg-muted/20 px-3 py-2 text-xs"
              >
                <input
                  type="checkbox"
                  className="accent-primary"
                  checked={selected.has(t.id)}
                  onChange={() => toggle(t.id)}
                />
                <span className="font-semibold text-foreground">{t.name}</span>
                <span className="text-muted-foreground">{t.email}</span>
              </label>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
