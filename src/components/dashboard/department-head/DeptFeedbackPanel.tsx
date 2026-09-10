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
import type { TeacherFeedback, TeacherFeedbackCategory } from '@/lib/mockData';
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

// FB-003: distinct evidence categories — a department head giving direct feedback
// chooses exactly one; peer/parent/student feedback derives its own automatically.
type DeptHeadFeedbackCategory = 'coaching' | 'classroom_observation' | 'formal_performance';
const DEPT_HEAD_CATEGORY_OPTIONS: { value: DeptHeadFeedbackCategory; label: string }[] = [
  { value: 'coaching', label: 'Coaching Feedback' },
  { value: 'classroom_observation', label: 'Classroom Observation Feedback' },
  { value: 'formal_performance', label: 'Formal Performance Feedback' },
];

const CATEGORY_LABEL: Record<TeacherFeedbackCategory, string> = {
  informal_peer: 'Informal Peer Feedback',
  coaching: 'Coaching Feedback',
  classroom_observation: 'Classroom Observation',
  formal_performance: 'Formal Performance Review',
  anonymous_survey: 'Anonymous Survey',
};

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

  // FB-003: per-category counts, never blended into one cross-source "average rating" —
  // a 5-star peer note and a formal performance review aren't the same kind of evidence.
  const categoryCounts = useMemo(() => {
    const counts: Partial<Record<TeacherFeedbackCategory, number>> = {};
    for (const f of departmentFeedback) {
      if (!f.category) continue;
      counts[f.category] = (counts[f.category] ?? 0) + 1;
    }
    return counts;
  }, [departmentFeedback]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetTeacherId, setTargetTeacherId] = useState('');
  const [category, setCategory] = useState<DeptHeadFeedbackCategory>('coaching');
  const [subject, setSubject] = useState('');
  const [comment, setComment] = useState('');
  const [rating, setRating] = useState(5);
  // FB-004: structured coaching/observation record — every direct feedback entry names
  // a strength, a development area, and an agreed next action rather than only a
  // free-text comment, and optionally schedules a follow-up.
  const [strength, setStrength] = useState('');
  const [developmentArea, setDevelopmentArea] = useState('');
  const [agreedAction, setAgreedAction] = useState('');
  const [followUpRequired, setFollowUpRequired] = useState(false);
  const [followUpDueDate, setFollowUpDueDate] = useState('');

  const openModal = () => {
    setTargetTeacherId(departmentTeachers[0]?.id ?? '');
    setCategory('coaching');
    setStrength('');
    setDevelopmentArea('');
    setAgreedAction('');
    setFollowUpRequired(false);
    setFollowUpDueDate('');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetTeacherId || !comment.trim()) return;
    giveTeacherFeedback({
      teacherId: targetTeacherId,
      authorRole: 'department-head',
      category,
      subject: subject.trim() || 'Direct feedback',
      comment: comment.trim(),
      rating,
      strength: strength.trim() || undefined,
      developmentArea: developmentArea.trim() || undefined,
      agreedAction: agreedAction.trim() || undefined,
      followUpRequired,
      followUpDueDate: followUpRequired ? followUpDueDate || undefined : undefined,
    });
    setSubject('');
    setComment('');
    setRating(5);
    setStrength('');
    setDevelopmentArea('');
    setAgreedAction('');
    setFollowUpRequired(false);
    setFollowUpDueDate('');
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
      key: 'category',
      header: 'Category',
      sortable: true,
      render: (row) => (
        <span className="text-xs text-muted-foreground">{row.category ? CATEGORY_LABEL[row.category] : '—'}</span>
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
        <div className="flex flex-col text-left max-w-xs gap-0.5">
          <span className="text-xs font-medium text-foreground">{row.subject}</span>
          <span className="text-xxs text-muted-foreground truncate">{row.comment}</span>
          {row.strength && (
            <span className="text-xxs text-emerald-700 truncate">
              <span className="font-semibold">Strength:</span> {row.strength}
            </span>
          )}
          {row.developmentArea && (
            <span className="text-xxs text-amber-700 truncate">
              <span className="font-semibold">Development area:</span> {row.developmentArea}
            </span>
          )}
          {row.agreedAction && (
            <span className="text-xxs text-primary truncate">
              <span className="font-semibold">Agreed action:</span> {row.agreedAction}
            </span>
          )}
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
      key: 'followUpRequired',
      header: 'Follow-up',
      render: (row) =>
        row.followUpRequired ? (
          <Badge variant="warning" size="sm">
            {row.followUpDueDate ? `Due ${row.followUpDueDate}` : 'Required'}
          </Badge>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-border/60">
          <CardContent className="pt-4">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Total Feedback Entries
            </span>
            <p className="text-xl font-bold text-foreground mt-1">{departmentFeedback.length}</p>
          </CardContent>
        </Card>
        {/* FB-003: counts per category, not one blended cross-source average — a peer
            note, a coaching session, and a formal review aren't the same evidence. */}
        <Card className="border-border/60">
          <CardContent className="pt-4">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              By Category
            </span>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
              {(Object.keys(CATEGORY_LABEL) as TeacherFeedbackCategory[]).map((cat) => (
                <span key={cat} className="text-xs text-foreground">
                  <span className="font-bold">{categoryCounts[cat] ?? 0}</span>{' '}
                  <span className="text-muted-foreground">{CATEGORY_LABEL[cat]}</span>
                </span>
              ))}
            </div>
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

          <Select
            label="Feedback category"
            value={category}
            onChange={(e) => setCategory(e.target.value as DeptHeadFeedbackCategory)}
            options={DEPT_HEAD_CATEGORY_OPTIONS}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1 text-left">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Strength</label>
              <textarea
                placeholder="What is this teacher doing well?"
                value={strength}
                onChange={(e) => setStrength(e.target.value)}
                className="w-full h-16 p-3 bg-muted/40 border border-border rounded-md text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="space-y-1 text-left">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Development Area</label>
              <textarea
                placeholder="What should this teacher work on?"
                value={developmentArea}
                onChange={(e) => setDevelopmentArea(e.target.value)}
                className="w-full h-16 p-3 bg-muted/40 border border-border rounded-md text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div className="space-y-1 text-left">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Agreed Action</label>
            <textarea
              placeholder="What did you and the teacher agree they'll do next?"
              value={agreedAction}
              onChange={(e) => setAgreedAction(e.target.value)}
              className="w-full h-16 p-3 bg-muted/40 border border-border rounded-md text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] items-center gap-3">
            <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-foreground">
              <input
                type="checkbox"
                className="accent-primary"
                checked={followUpRequired}
                onChange={(e) => setFollowUpRequired(e.target.checked)}
              />
              Follow-up required?
            </label>
            {followUpRequired && (
              <div className="space-y-1 text-left">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Due Date</label>
                <input
                  type="date"
                  required
                  value={followUpDueDate}
                  onChange={(e) => setFollowUpDueDate(e.target.value)}
                  className="w-full h-10 px-3 bg-muted/40 border border-border rounded-md text-xs text-foreground focus:outline-none"
                />
              </div>
            )}
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
