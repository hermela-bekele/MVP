'use client';

import React, { useMemo, useState } from 'react';
import { Download, Eye, FileText } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { KpiGrid, KpiWidget } from '@/components/dashboard/KpiWidget';
import { ContentCard } from '@/components/dashboard/ContentCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
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

  const departmentsCovered = useMemo(
    () => new Set(rows.map((r) => r.department)).size,
    [rows],
  );
  const gradesCovered = useMemo(() => new Set(rows.map((r) => r.grade)).size, [rows]);

  const viewingRow = rows.find((r) => r.id === viewingId) ?? null;
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
    window.setTimeout(() => {
      detailSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  };

  const handleDownload = async (row: AnnualPlanRow) => {
    if (!row.plan.planDetail) return;
    setDownloadingId(row.id);
    try {
      const plan = JSON.parse(row.plan.planDetail) as AnnualLessonPlanResult;
      await downloadAnnualLessonPlanDocx(plan);
    } catch {
      /* best-effort download; table stays interactive on failure */
    } finally {
      setDownloadingId(null);
    }
  };

  const columns: DataTableColumn<AnnualPlanRow>[] = [
    { key: 'department', header: 'Department', sortable: true },
    { key: 'subject', header: 'Subject', sortable: true },
    { key: 'grade', header: 'Grade', sortable: true },
    { key: 'publishedAt', header: 'Published', sortable: true },
    {
      key: 'id',
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Eye className="h-3.5 w-3.5" />}
            onClick={() => handleView(row)}
          >
            {viewingId === row.id ? 'Hide' : 'View'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Download className="h-3.5 w-3.5" />}
            loading={downloadingId === row.id}
            disabled={!row.plan.planDetail}
            onClick={() => void handleDownload(row)}
          >
            Word
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <KpiGrid>
        <KpiWidget
          label="Published Annual Plans"
          value={rows.length}
          hint="Latest plan per grade/subject"
          tone="emphasis"
          icon={<FileText className="h-5 w-5" strokeWidth={1.75} />}
        />
        <KpiWidget label="Departments Covered" value={departmentsCovered} />
        <KpiWidget label="Grades Covered" value={gradesCovered} />
        <KpiWidget label="Subjects Covered" value={new Set(rows.map((r) => r.subject)).size} />
      </KpiGrid>

      <ContentCard
        title="Annual Lesson Plans"
        description="School-wide view of the curriculum maps department heads have published to teachers."
        noPadding
      >
        {rows.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">
            No annual lesson plans have been published by department heads yet.
          </p>
        ) : (
          <DataTable
            columns={columns}
            data={rows}
            searchable
            searchKeys={['department', 'subject', 'grade']}
            pageSize={8}
          />
        )}
      </ContentCard>

      <div ref={detailSectionRef}>
        {viewingRow && (
          <ContentCard
            title={`${viewingRow.grade} · ${viewingRow.subject}`}
            description={`Published by ${viewingRow.department} on ${viewingRow.publishedAt}`}
            actions={<Badge variant="success">Published</Badge>}
          >
            {viewingPlan ? (
              <div className="max-h-[70vh] overflow-auto rounded-lg border border-border/60 p-2">
                <AnnualLessonPlanTable plan={viewingPlan} showTitle={false} />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                This plan has no viewable detail data.
              </p>
            )}
          </ContentCard>
        )}
      </div>
    </div>
  );
};
