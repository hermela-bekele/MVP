'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Card, CardContent } from '@/components/ui/card';
import { TablePanel } from '@/components/dashboard/TablePanel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { Dialog, DialogFooter } from '@/components/ui/dialog';
import type { DataTableColumn } from '@/components/ui/data-table';
import type { SchoolCheckIn } from '@/lib/mockData';
import { CircularProgress } from '@/components/ui/progress';

export const WellnessCheckins: React.FC = () => {
  const { checkIns, addCheckInTemplate } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form States
  const [checkInTitle, setCheckInTitle] = useState('Weekly Wellness Check-in');
  const [checkInType, setCheckInType] = useState<'Teacher Wellness' | 'Student Satisfaction' | 'Parent Feedback'>('Teacher Wellness');
  const [checkInRespondent, setCheckInRespondent] = useState('');
  const [checkInRating, setCheckInRating] = useState(5);
  const [checkInComment, setCheckInComment] = useState('');

  // Handle external modal open trigger (from OverviewDashboard quick actions)
  useEffect(() => {
    const handleOpenModal = () => {
      setIsModalOpen(true);
    };
    window.addEventListener('open-checkin-modal', handleOpenModal);
    return () => window.removeEventListener('open-checkin-modal', handleOpenModal);
  }, []);

  // Compute Metrics
  const metrics = React.useMemo(() => {
    const total = checkIns.length;
    if (total === 0) return { teacher: 0, student: 0, parent: 0, overall: 0 };
    
    const overallSum = checkIns.reduce((acc, curr) => acc + curr.rating, 0);
    const overall = Math.round((overallSum / total) * 20); // Scale of 5 to percentage

    const teachersCheck = checkIns.filter(c => c.type === 'Teacher Wellness');
    const teacher = teachersCheck.length > 0
      ? Math.round((teachersCheck.reduce((acc, c) => acc + c.rating, 0) / teachersCheck.length) * 20)
      : 0;

    const studentsCheck = checkIns.filter(c => c.type === 'Student Satisfaction');
    const student = studentsCheck.length > 0
      ? Math.round((studentsCheck.reduce((acc, c) => acc + c.rating, 0) / studentsCheck.length) * 20)
      : 0;

    const parentsCheck = checkIns.filter(c => c.type === 'Parent Feedback');
    const parent = parentsCheck.length > 0
      ? Math.round((parentsCheck.reduce((acc, c) => acc + c.rating, 0) / parentsCheck.length) * 20)
      : 0;

    return { teacher, student, parent, overall };
  }, [checkIns]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkInRespondent || !checkInComment) return;

    addCheckInTemplate(
      checkInTitle,
      checkInType,
      checkInRespondent,
      Number(checkInRating),
      checkInComment
    );

    // Reset Form
    setCheckInRespondent('');
    setCheckInComment('');
    setCheckInRating(5);

    // Close Modal
    setIsModalOpen(false);
  };

  const surveyColumns: DataTableColumn<SchoolCheckIn>[] = [
    {
      key: 'title',
      header: 'Survey Questionnaire',
      sortable: true,
      render: (row) => (
        <div className="flex flex-col text-left">
          <span className="font-semibold text-foreground text-xs">{row.title ?? row.type}</span>
          <span className="text-[9px] text-muted-foreground mt-0.5">Filing Respondent: {row.respondentName}</span>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Target Cohort',
      sortable: true,
      render: (row) => (
        <Badge variant={row.type === 'Teacher Wellness' ? 'primary' : row.type === 'Student Satisfaction' ? 'primary' : 'info'} size="sm" className="font-medium">
          {row.type}
        </Badge>
      ),
    },
    {
      key: 'rating',
      header: 'Satisfaction Index',
      sortable: true,
      render: (row) => (
        <div className="flex items-center space-x-1">
          <span className="text-xs font-semibold text-foreground">{row.rating} / 5</span>
          <span className="text-xxs text-amber-500 font-bold">{'★'.repeat(row.rating)}{'☆'.repeat(5 - row.rating)}</span>
        </div>
      ),
    },
    {
      key: 'comment',
      header: 'Feedback Transcript',
      render: (row) => <p className="text-xxs text-muted-foreground truncate max-w-xs">{row.comment}</p>,
    },
    {
      key: 'date',
      header: 'Submitted',
      sortable: true,
      render: (row) => <span className="text-xxs text-muted-foreground">{row.date}</span>,
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Wellness Index KPI Circle Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <Card className="border-border/60">
          <CardContent className="pt-4 flex items-center justify-between">
            <div className="space-y-1 text-left">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Overall Satisfaction</span>
              <p className="text-xl font-bold text-foreground">{metrics.overall}% Positive</p>
            </div>
            <CircularProgress value={metrics.overall} size={50} strokeWidth={5} color="primary" />
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="pt-4 flex items-center justify-between">
            <div className="space-y-1 text-left">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Teacher Burnout Score</span>
              <p className="text-xl font-bold text-foreground">{metrics.teacher}% Healthy</p>
            </div>
            <CircularProgress value={metrics.teacher} size={50} strokeWidth={5} color="accent" />
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="pt-4 flex items-center justify-between">
            <div className="space-y-1 text-left">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Student Wellbeing Index</span>
              <p className="text-xl font-bold text-foreground">{metrics.student}% Content</p>
            </div>
            <CircularProgress value={metrics.student} size={50} strokeWidth={5} color="success" />
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="pt-4 flex items-center justify-between">
            <div className="space-y-1 text-left">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Parent Trust Coefficient</span>
              <p className="text-xl font-bold text-foreground">{metrics.parent}% Confident</p>
            </div>
            <CircularProgress value={metrics.parent} size={50} strokeWidth={5} color="accent" />
          </CardContent>
        </Card>

      </div>

      <TablePanel
        title="Ecosystem Survey Filings"
        description="Browse qualitative wellness index logs and transcripts"
      >
          <DataTable<SchoolCheckIn>
            columns={surveyColumns}
            data={checkIns}
            searchable
            searchKeys={['title', 'respondentName', 'comment']}
            pageSize={10}
          />
      </TablePanel>

      {/* Publish Wellness Survey Dialog Modal */}
      <Dialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Publish Wellness / Satisfaction Survey"
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          
          <div className="space-y-1 text-left">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Survey Topic Title</label>
            <input
              type="text"
              required
              value={checkInTitle}
              onChange={(e) => setCheckInTitle(e.target.value)}
              className="w-full h-10 px-3 bg-muted/40 border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 text-left">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Respondent Cohort</label>
              <select
                value={checkInType}
                onChange={(e) => setCheckInType(e.target.value as any)}
                className="w-full h-10 px-3 bg-muted/45 border border-border rounded-md text-xs text-foreground focus:outline-none"
              >
                <option value="Teacher Wellness">Teaching Faculty</option>
                <option value="Student Satisfaction">Student Body</option>
                <option value="Parent Feedback">Parent Roster</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Satisfaction Score (1-5)</label>
              <select
                value={checkInRating}
                onChange={(e) => setCheckInRating(Number(e.target.value))}
                className="w-full h-10 px-3 bg-muted/45 border border-border rounded-md text-xs text-foreground focus:outline-none"
              >
                <option value={5}>5 - Strongly Satisfied</option>
                <option value={4}>4 - Mostly Satisfied</option>
                <option value={3}>3 - Neutral / Okay</option>
                <option value={2}>2 - Disgruntled / Unhappy</option>
                <option value={1}>1 - Severe Issues / Burnout</option>
              </select>
            </div>
          </div>

          <div className="space-y-1 text-left">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Respondent Name (Or Anonymous)</label>
            <input
              type="text"
              required
              placeholder="e.g. Ato Demeke (Or Anonymous)"
              value={checkInRespondent}
              onChange={(e) => setCheckInRespondent(e.target.value)}
              className="w-full h-10 px-3 bg-muted/40 border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="space-y-1 text-left">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Detailed Comments & Feedback</label>
            <textarea
              required
              placeholder="Provide constructive details on resources, class loads, curriculum pacing, or facilities..."
              value={checkInComment}
              onChange={(e) => setCheckInComment(e.target.value)}
              className="w-full h-24 p-3 bg-muted/40 border border-border rounded-md text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <DialogFooter className="mt-6 border-t border-border/20 pt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
              className="text-xs h-9"
            >
              Cancel Survey
            </Button>
            <Button
              type="submit"
              variant="organic"
              size="sm"
              className="text-xs h-9 border-none font-semibold"
            >
              Publish Survey Rulings
            </Button>
          </DialogFooter>

        </form>
      </Dialog>

    </div>
  );
};
