'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { TablePanel } from '@/components/dashboard/TablePanel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { Dialog, DialogFooter } from '@/components/ui/dialog';
import type { DataTableColumn } from '@/components/ui/data-table';
import type { LessonPlan } from '@/lib/mockData';

export const LessonPlanReview: React.FC = () => {
  const { lessonPlans, approveLessonPlan, rejectLessonPlan } = useApp();
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [principalComments, setPrincipalComments] = useState('');

  // Find the selected plan details
  const selectedPlan = React.useMemo(() => {
    return lessonPlans.find(lp => lp.id === selectedPlanId) || null;
  }, [lessonPlans, selectedPlanId]);

  const handleOpenReview = (id: string) => {
    setSelectedPlanId(id);
    setPrincipalComments('');
    setIsModalOpen(true);
  };

  const handleApprove = () => {
    if (!selectedPlanId) return;
    approveLessonPlan(selectedPlanId, 'school', principalComments || 'Lesson plan satisfies all regional curriculum guidelines.');
    setIsModalOpen(false);
  };

  const handleReject = () => {
    if (!selectedPlanId) return;
    rejectLessonPlan(selectedPlanId, 'school', principalComments || 'Please refine lesson objectives and expand student homework exercises.');
    setIsModalOpen(false);
  };

  const planColumns: DataTableColumn<LessonPlan>[] = [
    {
      key: 'title',
      header: 'Lesson Subject Title',
      sortable: true,
      render: (row) => (
        <div className="flex flex-col text-left">
          <span className="font-semibold text-foreground text-xs leading-normal">{row.title}</span>
          <span className="text-[10px] text-muted-foreground mt-0.5">Assigned: {row.teacherName}</span>
        </div>
      ),
    },
    {
      key: 'subject',
      header: 'Department Domain',
      sortable: true,
      render: (row) => (
        <Badge variant="primary" size="sm" className="bg-accent/10 border-accent/20 text-accent font-medium">
          {row.subject}
        </Badge>
      ),
    },
    {
      key: 'grade',
      header: 'Target Grade',
      sortable: true,
      render: (row) => <span className="text-xs font-semibold text-foreground">{row.grade}</span>,
    },
    {
      key: 'version',
      header: 'Revision v.',
      render: (row) => (
        <code className="text-[10px] font-mono font-bold bg-muted px-1.5 py-0.5 rounded text-muted-foreground border border-border/40">
          v{row.version}
        </code>
      ),
    },
    {
      key: 'sessions',
      header: 'Sessions',
      sortable: true,
      render: (row) => <span className="text-xs font-semibold text-muted-foreground">{row.sessions} periods</span>,
    },
    {
      key: 'status',
      header: 'Review Stage',
      sortable: true,
      render: (row) => (
        <Badge
          variant={
            row.status === 'Approved'
              ? 'success'
              : row.status === 'Rejected'
                ? 'danger'
                : row.status.includes('Pending')
                  ? 'warning'
                  : 'neutral'
          }
          size="sm"
          className="font-semibold"
        >
          {row.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Operation',
      render: (row) => {
        const canAction = row.status === 'Pending School Head';
        return (
          <Button
            variant={canAction ? 'primary' : 'outline'}
            size="sm"
            onClick={() => handleOpenReview(row.id)}
            className="text-[10px] h-7 font-bold border-none"
          >
            {canAction ? 'Review Draft' : 'Inspect Rulings'}
          </Button>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <TablePanel
        title="Instructional Syllabus Filings"
        description="Examine lesson plan compliance and curriculum distributions"
      >
          <DataTable<LessonPlan>
            columns={planColumns}
            data={lessonPlans}
            searchable
            searchKeys={['title', 'teacherName', 'subject']}
            pageSize={10}
          />
      </TablePanel>

      {/* Review Dialog Drawer Modal */}
      <Dialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Pedagogical Blueprint Audit"
        size="lg"
      >
        {selectedPlan && (
          <div className="space-y-4 pt-2">
            
            {/* Title Metadata */}
            <div className="p-3 bg-muted/40 border border-border/60 rounded-xl flex items-center justify-between">
              <div className="text-left space-y-0.5">
                <h4 className="text-xs font-bold text-foreground">{selectedPlan.title}</h4>
                <p className="text-[10px] text-muted-foreground">Drafted by: {selectedPlan.teacherName} ({selectedPlan.subject})</p>
              </div>
              <Badge variant="primary" badgeStyle="subtle" size="sm" className="font-bold px-2">
                Version {selectedPlan.version}
              </Badge>
            </div>

            {/* Plan specifications */}
            <div className="grid grid-cols-2 gap-3 text-left">
              <div className="p-3 rounded-lg border border-border/40 space-y-0.5">
                <span className="text-[9px] font-bold text-muted-foreground uppercase">Allocation Target</span>
                <p className="text-xs font-semibold text-foreground">{selectedPlan.grade}</p>
              </div>
              <div className="p-3 rounded-lg border border-border/40 space-y-0.5">
                <span className="text-[9px] font-bold text-muted-foreground uppercase">Learning Cycles</span>
                <p className="text-xs font-semibold text-foreground">{selectedPlan.sessions} Academic Periods</p>
              </div>
            </div>

            {/* Objectives */}
            <div className="space-y-1.5 text-left">
              <h5 className="text-[10px] font-bold text-muted-foreground uppercase">Target Coursework Objectives</h5>
              <ul className="list-disc list-inside bg-muted/20 border border-border/40 rounded-xl p-3 space-y-1 text-xxs text-muted-foreground">
                {selectedPlan.objectives.map((obj, i) => (
                  <li key={i} className="leading-relaxed"><span className="text-foreground font-medium">{obj}</span></li>
                ))}
              </ul>
            </div>

            {/* Homework Assignment */}
            <div className="space-y-1.5 text-left">
              <h5 className="text-[10px] font-bold text-muted-foreground uppercase">Student Homework Assignment</h5>
              <div className="p-3 bg-muted/20 border border-border/40 rounded-xl text-xxs text-muted-foreground leading-relaxed">
                {selectedPlan.homework}
              </div>
            </div>

            {/* Historic comments / log if exist */}
            {(selectedPlan.deptComments || selectedPlan.schoolHeadComments) && (
              <div className="space-y-1.5 text-left">
                <h5 className="text-[10px] font-bold text-muted-foreground uppercase">Curriculum Feedbacks & Directives</h5>
                <div className="p-3 bg-muted/50 border border-border rounded-xl text-xs text-muted-foreground space-y-2">
                  {selectedPlan.deptComments && <p><span className="font-semibold">Dept:</span> {selectedPlan.deptComments}</p>}
                  {selectedPlan.schoolHeadComments && <p><span className="font-semibold">Principal:</span> {selectedPlan.schoolHeadComments}</p>}
                </div>
              </div>
            )}

            {/* Action panel if pending */}
            {selectedPlan.status === 'Pending School Head' ? (
              <div className="space-y-2 text-left pt-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Audit Comment / Correction Directives</label>
                <textarea
                  placeholder="e.g. Approved. Solid plan. Expand on laboratory segments."
                  value={principalComments}
                  onChange={(e) => setPrincipalComments(e.target.value)}
                  className="w-full h-20 p-3 bg-muted/40 border border-border rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />

                <DialogFooter className="mt-4 border-t border-border/20 pt-3 flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsModalOpen(false)}
                    className="text-xs h-9"
                  >
                    Close Rulings
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={handleReject}
                    className="text-xs h-9 border-none font-bold"
                  >
                    Reject Blueprint
                  </Button>
                  <Button
                    type="button"
                    variant="organic"
                    size="sm"
                    onClick={handleApprove}
                    className="text-xs h-9 border-none font-bold"
                  >
                    Approve Syllabus
                  </Button>
                </DialogFooter>
              </div>
            ) : (
              <DialogFooter className="mt-4 border-t border-border/20 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                  className="text-xs h-9"
                >
                  Close Inspection
                </Button>
              </DialogFooter>
            )}

          </div>
        )}
      </Dialog>

    </div>
  );
};
