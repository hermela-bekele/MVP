'use client';

import React, { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { TablePanel } from '@/components/dashboard/TablePanel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { Dialog, DialogFooter } from '@/components/ui/dialog';
import { ContentCard } from '@/components/dashboard/ContentCard';
import type { DataTableColumn } from '@/components/ui/data-table';
import type { JobApplication, JobPosting } from '@/lib/hrPortal';
import { hrStatusBadgeVariant, HR_DEPARTMENTS } from '@/lib/hrPortal';

const inputClass =
  'w-full h-10 px-3 bg-muted/40 border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring';

export const HrRecruitment: React.FC = () => {
  const { jobPostings, jobApplications, addJobPosting, updateJobPosting, updateJobApplication } = useApp();
  const [isJobOpen, setIsJobOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<JobApplication | null>(null);
  const [appNotes, setAppNotes] = useState('');

  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('Administration');
  const [employmentType, setEmploymentType] = useState<JobPosting['employmentType']>('Full-time');
  const [salaryRange, setSalaryRange] = useState('');
  const [description, setDescription] = useState('');
  const [requirements, setRequirements] = useState('');
  const [closingDate, setClosingDate] = useState('');

  useEffect(() => {
    const handleOpen = () => setIsJobOpen(true);
    window.addEventListener('open-hr-job', handleOpen);
    return () => window.removeEventListener('open-hr-job', handleOpen);
  }, []);

  const handlePostJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;
    addJobPosting({
      title,
      department,
      employmentType,
      salaryRange: salaryRange || 'Negotiable',
      description,
      requirements: requirements.split('\n').filter(Boolean),
      status: 'Open',
      closingDate: closingDate || undefined,
    });
    setIsJobOpen(false);
    setTitle('');
    setDescription('');
    setRequirements('');
    setSalaryRange('');
  };

  const appColumns: DataTableColumn<JobApplication>[] = [
    {
      key: 'applicantName',
      header: 'Applicant',
      sortable: true,
      render: (row) => (
        <div>
          <p className="text-xs font-semibold">{row.applicantName}</p>
          <p className="text-[9px] text-muted-foreground">{row.jobTitle}</p>
        </div>
      ),
    },
    {
      key: 'experience',
      header: 'Experience',
      render: (row) => <span className="text-[10px] text-muted-foreground">{row.experience}</span>,
    },
    {
      key: 'appliedAt',
      header: 'Applied',
      sortable: true,
      render: (row) => <span className="text-xs text-muted-foreground">{row.appliedAt}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (row) => (
        <Badge variant={hrStatusBadgeVariant(row.status)} size="sm">{row.status}</Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <Button variant="ghost" size="sm" className="text-[10px] h-7" onClick={() => { setSelectedApp(row); setAppNotes(row.notes ?? ''); }}>
          Manage
        </Button>
      ),
    },
  ];

  const nextStatus = (current: JobApplication['status']): JobApplication['status'] | null => {
    const flow: JobApplication['status'][] = ['New', 'Screening', 'Interview', 'Offered', 'Hired'];
    const idx = flow.indexOf(current);
    return idx >= 0 && idx < flow.length - 1 ? flow[idx + 1] : null;
  };

  return (
    <div className="space-y-6">
      <ContentCard title="Open Positions" description="Active job postings">
        <div className="space-y-2">
          {jobPostings.map((job) => (
            <div key={job.id} className="flex items-center justify-between p-3 rounded-lg border border-border/60 bg-muted/20">
              <div className="min-w-0">
                <p className="text-xs font-semibold truncate">{job.title}</p>
                <p className="text-[10px] text-muted-foreground">{job.department} · {job.salaryRange} · {job.applicantCount} applicants</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={hrStatusBadgeVariant(job.status)} size="sm">{job.status}</Badge>
                {job.status === 'Open' && (
                  <Button variant="ghost" size="sm" className="text-[10px] h-7" onClick={() => updateJobPosting(job.id, { status: 'Closed' })}>
                    Close
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </ContentCard>

      <TablePanel title="Applications Pipeline" description="Review and advance candidates through hiring stages">
        <DataTable columns={appColumns} data={jobApplications} emptyTitle="No applications yet." />
      </TablePanel>

      <Dialog isOpen={isJobOpen} onClose={() => setIsJobOpen(false)} title="Post New Job">
        <form onSubmit={handlePostJob} className="space-y-3">
          <div><label className="text-[10px] font-bold text-muted-foreground uppercase">Job Title</label><input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} required /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-[10px] font-bold text-muted-foreground uppercase">Department</label><select className={inputClass} value={department} onChange={(e) => setDepartment(e.target.value)}>{HR_DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}</select></div>
            <div><label className="text-[10px] font-bold text-muted-foreground uppercase">Type</label><select className={inputClass} value={employmentType} onChange={(e) => setEmploymentType(e.target.value as JobPosting['employmentType'])}><option value="Full-time">Full-time</option><option value="Part-time">Part-time</option><option value="Contract">Contract</option></select></div>
          </div>
          <div><label className="text-[10px] font-bold text-muted-foreground uppercase">Salary Range</label><input className={inputClass} value={salaryRange} onChange={(e) => setSalaryRange(e.target.value)} placeholder="ETB 10,000 – 15,000" /></div>
          <div><label className="text-[10px] font-bold text-muted-foreground uppercase">Description</label><textarea className={`${inputClass} h-16 py-2`} value={description} onChange={(e) => setDescription(e.target.value)} required /></div>
          <div><label className="text-[10px] font-bold text-muted-foreground uppercase">Requirements (one per line)</label><textarea className={`${inputClass} h-16 py-2`} value={requirements} onChange={(e) => setRequirements(e.target.value)} /></div>
          <div><label className="text-[10px] font-bold text-muted-foreground uppercase">Closing Date</label><input type="date" className={inputClass} value={closingDate} onChange={(e) => setClosingDate(e.target.value)} /></div>
          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => setIsJobOpen(false)}>Cancel</Button>
            <Button type="submit" variant="organic" size="sm">Post Job</Button>
          </DialogFooter>
        </form>
      </Dialog>

      {selectedApp && (
        <Dialog isOpen onClose={() => setSelectedApp(null)} title={selectedApp.applicantName}>
          <div className="space-y-2 text-xs">
            <p><span className="text-muted-foreground">Position:</span> {selectedApp.jobTitle}</p>
            <p><span className="text-muted-foreground">Email:</span> {selectedApp.email}</p>
            <p><span className="text-muted-foreground">Phone:</span> {selectedApp.phone}</p>
            <p><span className="text-muted-foreground">Education:</span> {selectedApp.education}</p>
            <p><span className="text-muted-foreground">Experience:</span> {selectedApp.experience}</p>
            <textarea className={`${inputClass} h-16 py-2`} value={appNotes} onChange={(e) => setAppNotes(e.target.value)} placeholder="HR notes..." />
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => { updateJobApplication(selectedApp.id, 'Rejected', appNotes); setSelectedApp(null); }}>Reject</Button>
            {nextStatus(selectedApp.status) && (
              <Button variant="organic" size="sm" onClick={() => { updateJobApplication(selectedApp.id, nextStatus(selectedApp.status)!, appNotes); setSelectedApp(null); }}>
                Advance to {nextStatus(selectedApp.status)}
              </Button>
            )}
          </DialogFooter>
        </Dialog>
      )}
    </div>
  );
};
