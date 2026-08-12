'use client';

import React, { useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Card, CardContent } from '@/components/ui/card';
import { TablePanel } from '@/components/dashboard/TablePanel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { Dialog, DialogFooter } from '@/components/ui/dialog';
import type { DataTableColumn } from '@/components/ui/data-table';
import type { SchoolCheckIn } from '@/lib/mockData';
import { isSubjectTeacher, resolveDeptHeadScope } from '@/lib/departmentHead';

/**
 * Department head's Wellness Check-ins panel: create check-ins for the department
 * (teacher wellness, student satisfaction, parent feedback surveys) and view every
 * response logged for the department.
 */
export const DeptWellnessCheckins: React.FC = () => {
  const { currentUser, teachers, checkIns, addCheckInTemplate } = useApp();

  const scope = useMemo(() => resolveDeptHeadScope(currentUser), [currentUser]);
  const departmentTeachers = useMemo(
    () => (scope ? teachers.filter((t) => isSubjectTeacher(t, scope)) : []),
    [teachers, scope],
  );
  const deptTeacherNames = useMemo(
    () => new Set(departmentTeachers.map((t) => t.name)),
    [departmentTeachers],
  );

  const departmentCheckIns = useMemo(
    () => checkIns.filter((c) => deptTeacherNames.has(c.respondentName)),
    [checkIns, deptTeacherNames],
  );

  const avgRating = useMemo(() => {
    if (!departmentCheckIns.length) return 0;
    return (
      Math.round(
        (departmentCheckIns.reduce((sum, c) => sum + c.rating, 0) / departmentCheckIns.length) * 10,
      ) / 10
    );
  }, [departmentCheckIns]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [checkInTitle, setCheckInTitle] = useState('Weekly Wellness Check-in');
  const [checkInType, setCheckInType] = useState<'Teacher Wellness' | 'Student Satisfaction' | 'Parent Feedback'>(
    'Teacher Wellness',
  );
  const [checkInRespondent, setCheckInRespondent] = useState('');
  const [checkInRating, setCheckInRating] = useState(5);
  const [checkInComment, setCheckInComment] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkInRespondent || !checkInComment) return;

    addCheckInTemplate(checkInTitle, checkInType, checkInRespondent, Number(checkInRating), checkInComment);

    setCheckInRespondent('');
    setCheckInComment('');
    setCheckInRating(5);
    setIsModalOpen(false);
  };

  const columns: DataTableColumn<SchoolCheckIn>[] = [
    {
      key: 'title',
      header: 'Survey Questionnaire',
      sortable: true,
      render: (row) => (
        <div className="flex flex-col text-left">
          <span className="font-semibold text-foreground text-xs">{row.title ?? row.type}</span>
          <span className="text-[9px] text-muted-foreground mt-0.5">Respondent: {row.respondentName}</span>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Cohort',
      sortable: true,
      render: (row) => (
        <Badge variant={row.type === 'Teacher Wellness' ? 'primary' : 'info'} size="sm" className="font-medium">
          {row.type}
        </Badge>
      ),
    },
    {
      key: 'rating',
      header: 'Rating',
      sortable: true,
      render: (row) => (
        <div className="flex items-center space-x-1">
          <span className="text-xs font-semibold text-foreground">{row.rating} / 5</span>
          <span className="text-xxs text-amber-500 font-bold">
            {'★'.repeat(row.rating)}
            {'☆'.repeat(5 - row.rating)}
          </span>
        </div>
      ),
    },
    {
      key: 'comment',
      header: 'Comment',
      render: (row) => <p className="text-xxs text-muted-foreground truncate max-w-xs">{row.comment}</p>,
    },
    {
      key: 'date',
      header: 'Logged',
      sortable: true,
      render: (row) => <span className="text-xxs text-muted-foreground">{row.date}</span>,
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in text-left">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-border/60">
          <CardContent className="pt-4">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Check-ins Logged
            </span>
            <p className="text-xl font-bold text-foreground mt-1">{departmentCheckIns.length}</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="pt-4">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Average Rating
            </span>
            <p className="text-xl font-bold text-foreground mt-1">{avgRating ? `${avgRating} / 5` : '—'}</p>
          </CardContent>
        </Card>
      </div>

      <TablePanel
        title="Department wellness & satisfaction check-ins"
        description="Recurrent questionnaire towards general challenges and school improvement ideas"
        actions={
          <Button variant="organic" size="sm" onClick={() => setIsModalOpen(true)} className="text-xs">
            Create Check-in
          </Button>
        }
      >
        <DataTable<SchoolCheckIn>
          columns={columns}
          data={departmentCheckIns}
          searchable
          searchKeys={['title', 'respondentName', 'comment']}
          pageSize={10}
        />
      </TablePanel>

      <Dialog isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Wellness / Satisfaction Check-in" size="md">
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
                onChange={(e) => setCheckInType(e.target.value as typeof checkInType)}
                className="w-full h-10 px-3 bg-muted/45 border border-border rounded-md text-xs text-foreground focus:outline-none"
              >
                <option value="Teacher Wellness">Department Teachers</option>
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
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Respondent Name</label>
            <input
              type="text"
              required
              list="dept-checkin-respondents"
              placeholder="e.g. a department teacher, student, or parent name"
              value={checkInRespondent}
              onChange={(e) => setCheckInRespondent(e.target.value)}
              className="w-full h-10 px-3 bg-muted/40 border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <datalist id="dept-checkin-respondents">
              {departmentTeachers.map((t) => (
                <option key={t.id} value={t.name} />
              ))}
            </datalist>
          </div>

          <div className="space-y-1 text-left">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Comments</label>
            <textarea
              required
              placeholder="Notes on workload, resources, class sizes, or general challenges..."
              value={checkInComment}
              onChange={(e) => setCheckInComment(e.target.value)}
              className="w-full h-24 p-3 bg-muted/40 border border-border rounded-md text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <DialogFooter className="mt-6 border-t border-border/20 pt-4">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)} className="text-xs h-9">
              Cancel
            </Button>
            <Button type="submit" variant="organic" size="sm" className="text-xs h-9 border-none font-semibold">
              Create Check-in
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
};
