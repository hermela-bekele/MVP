'use client';

import React, { useMemo, useState } from 'react';
import { Download, Eye, FileText } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { ContentCard } from '@/components/dashboard/ContentCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { AnnualLessonPlanTable } from '@/components/ui/AnnualLessonPlanTable';
import { keepLatestLessonPlansByGradeSubject } from '@/lib/teacherPortal';
import { departmentIdForSubject } from '@/lib/departmentHead';
import type { LessonPlan } from '@/lib/mockData';
import type { AnnualLessonPlanResult } from '@/lib/annualLessonPlan';
import { downloadAnnualLessonPlanDocx } from '@/lib/annualLessonPlanDocx';

type AnnualPlanRow = {
  id: string;
  department: string;
  subject: string;
  grade: string;
  publishedAt: string;
  plan: LessonPlan;
};

/** Read-only, school-wide roll-up of the annual lesson plans department heads have published to teachers. */
export const AnnualLessonPlanPanel: React.FC = () => {
  const { lessonPlans, departments } = useApp();
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [gradeFilter, setGradeFilter] = useState<string>('');
  const [subjectFilter, setSubjectFilter] = useState<string>('');
  const detailSectionRef = React.useRef<HTMLDivElement | null>(null);

  const publishedAnnuals = useMemo(() => {
    const annuals = lessonPlans.filter(
      (p) => p.planType === 'yearly' && p.createdByRole === 'department-head',
    );
    return keepLatestLessonPlansByGradeSubject(annuals);
  }, [lessonPlans]);

  const rows: AnnualPlanRow[] = useMemo(
    () =>
      publishedAnnuals.map((plan) => {
        const deptId = departmentIdForSubject(plan.subject);
        const department = departments.find((d) => d.id === deptId)?.name ?? 'Unassigned';
        return {
          id: plan.id,
          department,
          subject: plan.subject,
          grade: plan.grade,
          publishedAt: plan.createdAt,
          plan,
        };
      }),
    [publishedAnnuals, departments],
  );

  // Get unique grades and subjects for filters
  const grades = useMemo(() => 
    Array.from(new Set(rows.map((r) => r.grade))).sort(),
    [rows]
  );

  const subjects = useMemo(() => 
    Array.from(new Set(rows.map((r) => r.subject))).sort(),
    [rows]
  );

  // Apply filters
  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (gradeFilter && row.grade !== gradeFilter) return false;
      if (subjectFilter && row.subject !== subjectFilter) return false;
      return true;
    });
  }, [rows, gradeFilter, subjectFilter]);

  const viewingRow = filteredRows.find((r) => r.id === viewingId) ?? null;
  const viewingPlan: AnnualLessonPlanResult | null = useMemo(() => {
    if (!viewingRow?.plan.planDetail) return null;
    try {
      return JSON.parse(viewingRow.plan.planDetail) as AnnualLessonPlanResult;
    } catch {
      return null;
    }
  }, [viewingRow]);

  const handleView = (row: AnnualPlanRow) => {
    setViewingId((prev) => (prev === row.id ? null : row.id));
    if (viewingId !== row.id) {
      window.setTimeout(() => {
        detailSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 80);
    }
  };

  const handleDownload = async (row: AnnualPlanRow) => {
    if (!row.plan.planDetail) return;
    setDownloadingId(row.id);
    try {
      const plan = JSON.parse(row.plan.planDetail) as AnnualLessonPlanResult;
      await downloadAnnualLessonPlanDocx(plan);
    } catch {
      /* best-effort download */
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <ContentCard title="Filter Annual Lesson Plans" description="Select grade and subject to narrow down the view">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Select
            label="Grade"
            placeholder="All grades"
            options={grades.map((g) => ({ value: g, label: g }))}
            value={gradeFilter}
            onValueChange={setGradeFilter}
          />
          <Select
            label="Subject"
            placeholder="All subjects"
            options={subjects.map((s) => ({ value: s, label: s }))}
            value={subjectFilter}
            onValueChange={setSubjectFilter}
          />
          <div className="flex items-end">
            <Button
              variant="outline"
              onClick={() => {
                setGradeFilter('');
                setSubjectFilter('');
              }}
              disabled={!gradeFilter && !subjectFilter}
            >
              Clear Filters
            </Button>
          </div>
          <div className="flex items-end justify-end">
            <p className="text-sm text-muted-foreground">
              Showing {filteredRows.length} of {rows.length} plans
            </p>
          </div>
        </div>
      </ContentCard>

      {/* Annual Plans List */}
      <ContentCard
        title="Published Annual Plans"
        description="School-wide view of curriculum maps published by department heads"
      >
        {filteredRows.length === 0 ? (
          <div className="py-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" strokeWidth={1.5} />
            <p className="mt-4 text-sm text-muted-foreground">
              {rows.length === 0
                ? 'No annual lesson plans have been published by department heads yet.'
                : 'No plans match the selected filters. Try adjusting your filters.'}
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {filteredRows.map((row) => (
              <li
                key={row.id}
                className="flex cursor-pointer flex-wrap items-center justify-between gap-2 rounded-lg border border-border/60 px-3 py-2 text-sm hover:bg-muted/40 transition-colors"
                onClick={(event) => {
                  if ((event.target as HTMLElement).closest('button')) return;
                  handleView(row);
                }}
              >
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-foreground truncate">
                    {row.grade} · {row.subject}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {row.department} · Published {row.publishedAt}
                    {viewingId === row.id ? ' · Viewing' : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="success" size="sm">Published</Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Eye className="h-3.5 w-3.5" />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleView(row);
                    }}
                  >
                    {viewingId === row.id ? 'Hide' : 'View'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Download className="h-3.5 w-3.5" />}
                    loading={downloadingId === row.id}
                    disabled={!row.plan.planDetail}
                    onClick={(e) => {
                      e.stopPropagation();
                      void handleDownload(row);
                    }}
                  >
                    Word
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </ContentCard>

      {/* Plan Detail View */}
      <div ref={detailSectionRef}>
        {viewingRow && viewingPlan && (
          <ContentCard
            title={`${viewingRow.grade} · ${viewingRow.subject}`}
            description={`Published by ${viewingRow.department} on ${viewingRow.publishedAt}`}
            actions={<Badge variant="success">Published</Badge>}
          >
            {/* Plan Metadata */}
            <div className="mb-4 rounded-lg border border-border/60 bg-muted/20 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-2">
                Plan Details
              </p>
              <dl className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-4 gap-y-2 text-xs">
                <div>
                  <dt className="text-muted-foreground">Academic Year</dt>
                  <dd className="font-semibold text-foreground">{viewingPlan.meta.academicYear ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">School Days</dt>
                  <dd className="font-semibold text-foreground">{viewingPlan.meta.schoolDaysPerYear}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Periods/Week</dt>
                  <dd className="font-semibold text-foreground">{viewingPlan.meta.periodsPerWeek}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Minutes/Period</dt>
                  <dd className="font-semibold text-foreground">{viewingPlan.meta.minutesPerPeriod}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Total Periods</dt>
                  <dd className="font-semibold text-foreground">{viewingPlan.meta.periodsPerYear}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Units</dt>
                  <dd className="font-semibold text-foreground">{viewingPlan.meta.units?.length ?? 0}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Objectives</dt>
                  <dd className="font-semibold text-foreground">{viewingPlan.objectives?.length ?? 0}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Teacher</dt>
                  <dd className="font-semibold text-foreground">{viewingRow.plan.teacherName}</dd>
                </div>
              </dl>
            </div>

            {/* Annual Plan Table */}
            <div className="max-h-[60vh] overflow-auto rounded-lg border border-border/60 p-2">
              <AnnualLessonPlanTable plan={viewingPlan} showTitle={false} />
            </div>
          </ContentCard>
        )}
      </div>
    </div>
  );
};
