'use client';

import React, { useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Card, CardContent } from '@/components/ui/card';
import { TablePanel } from '@/components/dashboard/TablePanel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { DataTable } from '@/components/ui/data-table';
import { Dialog, DialogFooter } from '@/components/ui/dialog';
import type { DataTableColumn } from '@/components/ui/data-table';
import type { TeacherFeedback } from '@/lib/mockData';
import { isSubjectTeacher, resolveDeptHeadScope } from '@/lib/departmentHead';

type FeedbackRole = NonNullable<TeacherFeedback['authorRole']>;

function roleLabel(role: FeedbackRole | undefined): string {
  switch (role) {
    case 'peer':
      return 'Peer Review';
    case 'parent':
      return 'Parent Feedback';
    case 'student':
      return 'Student Feedback';
    case 'department-head':
    default:
      return 'Direct Feedback';
  }
}

function roleBadgeVariant(role: FeedbackRole | undefined): 'primary' | 'info' | 'success' | 'neutral' {
  switch (role) {
    case 'peer':
      return 'info';
    case 'parent':
      return 'success';
    case 'student':
      return 'primary';
    case 'department-head':
    default:
      return 'neutral';
  }
}

/**
 * Department head's Feedback Loops panel: give direct feedback to a teacher in the
 * department, and view every feedback entry (direct, peer, parent, student) recorded
 * for department teachers.
 */
export const DeptFeedbackPanel: React.FC = () => {
  const { currentUser, teachers, teacherFeedbacks, giveTeacherFeedback } = useApp();

  const scope = useMemo(() => resolveDeptHeadScope(currentUser), [currentUser]);
  const departmentTeachers = useMemo(
    () => (scope ? teachers.filter((t) => isSubjectTeacher(t, scope)) : []),
    [teachers, scope],
  );
  const teacherNameById = useMemo(
    () => new Map(departmentTeachers.map((t) => [t.id, t.name])),
    [departmentTeachers],
  );

  const departmentFeedback = useMemo(
    () =>
      teacherFeedbacks
        .filter((f) => f.direction === 'to_teacher' && teacherNameById.has(f.teacherId))
        .sort((a, b) => (a.date < b.date ? 1 : -1)),
    [teacherFeedbacks, teacherNameById],
  );

  const avgRating = useMemo(() => {
    const rated = departmentFeedback.filter((f) => typeof f.rating === 'number');
    if (!rated.length) return 0;
    return Math.round((rated.reduce((sum, f) => sum + (f.rating ?? 0), 0) / rated.length) * 10) / 10;
  }, [departmentFeedback]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetTeacherId, setTargetTeacherId] = useState('');
  const [subject, setSubject] = useState('');
  const [comment, setComment] = useState('');
  const [rating, setRating] = useState(5);

  const openModal = () => {
    setTargetTeacherId(departmentTeachers[0]?.id ?? '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetTeacherId || !comment.trim()) return;
    giveTeacherFeedback({
      teacherId: targetTeacherId,
      authorRole: 'department-head',
      subject: subject.trim() || 'Direct feedback',
      comment: comment.trim(),
      rating,
    });
    setSubject('');
    setComment('');
    setRating(5);
    setIsModalOpen(false);
  };

  const columns: DataTableColumn<TeacherFeedback>[] = [
    {
      key: 'teacherId',
      header: 'Teacher',
      sortable: true,
      render: (row) => (
        <span className="font-semibold text-foreground text-xs">
          {teacherNameById.get(row.teacherId) ?? row.teacherId}
        </span>
      ),
    },
    {
      key: 'authorRole',
      header: 'Source',
      sortable: true,
      render: (row) => (
        <Badge variant={roleBadgeVariant(row.authorRole)} size="sm" className="font-medium">
          {roleLabel(row.authorRole)}
        </Badge>
      ),
    },
    {
      key: 'authorName',
      header: 'From',
      render: (row) => (
        <div className="flex flex-col text-left">
          <span className="text-xs text-foreground">{row.authorName}</span>
          {row.studentName && row.authorRole === 'parent' && (
            <span className="text-[10px] text-muted-foreground">Re: {row.studentName}</span>
          )}
        </div>
      ),
    },
    {
      key: 'subject',
      header: 'Subject',
      render: (row) => (
        <div className="flex flex-col text-left max-w-xs">
          <span className="text-xs font-medium text-foreground">{row.subject}</span>
          <span className="text-xxs text-muted-foreground truncate">{row.comment}</span>
        </div>
      ),
    },
    {
      key: 'rating',
      header: 'Rating',
      sortable: true,
      render: (row) =>
        row.rating ? (
          <span className="text-xxs text-amber-500 font-bold">
            {'★'.repeat(row.rating)}
            {'☆'.repeat(5 - row.rating)}
          </span>
        ) : (
          <span className="text-xxs text-muted-foreground">—</span>
        ),
    },
    {
      key: 'date',
      header: 'Date',
      sortable: true,
      render: (row) => <span className="text-xxs text-muted-foreground">{row.date}</span>,
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in text-left">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border/60">
          <CardContent className="pt-4">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Total Feedback Entries
            </span>
            <p className="text-xl font-bold text-foreground mt-1">{departmentFeedback.length}</p>
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
        <Card className="border-border/60">
          <CardContent className="pt-4">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Peer Reviews Logged
            </span>
            <p className="text-xl font-bold text-foreground mt-1">
              {departmentFeedback.filter((f) => f.authorRole === 'peer').length}
            </p>
          </CardContent>
        </Card>
      </div>

      <TablePanel
        title="Department feedback loops"
        actions={
          <Button
            variant="organic"
            size="sm"
            onClick={openModal}
            disabled={departmentTeachers.length === 0}
            className="text-xs"
          >
            Give Direct Feedback
          </Button>
        }
      >
        <DataTable<TeacherFeedback>
          columns={columns}
          data={departmentFeedback}
          searchable
          searchKeys={['authorName', 'subject', 'comment']}
          pageSize={10}
        />
      </TablePanel>

      <Dialog isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Give Direct Feedback" size="md">
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <Select
            label="Teacher"
            value={targetTeacherId}
            onChange={(e) => setTargetTeacherId(e.target.value)}
            options={departmentTeachers.map((t) => ({ value: t.id, label: t.name }))}
          />

          <div className="space-y-1 text-left">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Subject</label>
            <input
              type="text"
              required
              placeholder="e.g. Term 2 classroom observation"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full h-10 px-3 bg-muted/40 border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="space-y-1 text-left">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Rating (1-5)</label>
            <select
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
              className="w-full h-10 px-3 bg-muted/45 border border-border rounded-md text-xs text-foreground focus:outline-none"
            >
              <option value={5}>5 - Excellent</option>
              <option value={4}>4 - Good</option>
              <option value={3}>3 - Fair</option>
              <option value={2}>2 - Needs attention</option>
              <option value={1}>1 - Urgent concern</option>
            </select>
          </div>

          <div className="space-y-1 text-left">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Comment</label>
            <textarea
              required
              placeholder="Share direct, constructive feedback for this teacher..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full h-24 p-3 bg-muted/40 border border-border rounded-md text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <DialogFooter className="mt-6 border-t border-border/20 pt-4">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)} className="text-xs h-9">
              Cancel
            </Button>
            <Button type="submit" variant="organic" size="sm" className="text-xs h-9 border-none font-semibold">
              Send Feedback
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
};
