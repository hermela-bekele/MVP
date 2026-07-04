'use client';

import React, { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { TablePanel } from '@/components/dashboard/TablePanel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { Dialog, DialogFooter } from '@/components/ui/dialog';
import type { DataTableColumn } from '@/components/ui/data-table';
import type { RegistrationApplication } from '@/lib/mockData';
import { statusBadgeVariant } from '@/lib/registrarPortal';

const inputClass =
  'w-full h-10 px-3 bg-muted/40 border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring';

export const RegistrarApplications: React.FC = () => {
  const {
    registrationApplications,
    reviewRegistrationApplication,
    enrollFromApplication,
    submitRegistrationApplication,
  } = useApp();

  const [selectedApp, setSelectedApp] = useState<RegistrationApplication | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [isNewAppOpen, setIsNewAppOpen] = useState(false);

  const [applicantName, setApplicantName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gradeApplied, setGradeApplied] = useState('Grade 9');
  const [sectionRequested, setSectionRequested] = useState('A');
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [medicalInfo, setMedicalInfo] = useState('');
  const [previousSchool, setPreviousSchool] = useState('');

  useEffect(() => {
    const handleOpen = () => setIsNewAppOpen(true);
    window.addEventListener('open-registrar-application', handleOpen);
    return () => window.removeEventListener('open-registrar-application', handleOpen);
  }, []);

  const handleSubmitApplication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicantName || !parentName || !parentPhone) return;

    submitRegistrationApplication({
      applicantName,
      dateOfBirth: dateOfBirth || undefined,
      gradeApplied,
      sectionRequested,
      parentName,
      parentPhone,
      parentEmail,
      emergencyContact,
      medicalInfo: medicalInfo || undefined,
      previousSchool: previousSchool || undefined,
    });

    setApplicantName('');
    setDateOfBirth('');
    setParentName('');
    setParentPhone('');
    setParentEmail('');
    setEmergencyContact('');
    setMedicalInfo('');
    setPreviousSchool('');
    setIsNewAppOpen(false);
  };

  const columns: DataTableColumn<RegistrationApplication>[] = [
    {
      key: 'applicantName',
      header: 'Applicant',
      sortable: true,
      render: (row) => (
        <div>
          <p className="text-xs font-semibold text-foreground">{row.applicantName}</p>
          {row.previousSchool && (
            <p className="text-[9px] text-muted-foreground">From: {row.previousSchool}</p>
          )}
        </div>
      ),
    },
    {
      key: 'gradeApplied',
      header: 'Grade / Section',
      render: (row) => (
        <Badge variant="neutral" size="sm">
          {row.gradeApplied} · {row.sectionRequested}
        </Badge>
      ),
    },
    {
      key: 'parentName',
      header: 'Parent Contact',
      render: (row) => (
        <div>
          <p className="text-[11px] font-medium">{row.parentName}</p>
          <p className="text-[9px] text-muted-foreground">{row.parentPhone}</p>
        </div>
      ),
    },
    {
      key: 'submittedAt',
      header: 'Submitted',
      sortable: true,
      render: (row) => <span className="text-xs text-muted-foreground">{row.submittedAt}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (row) => (
        <Badge variant={statusBadgeVariant(row.status)} size="sm">
          {row.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setSelectedApp(row);
            setReviewNotes(row.reviewerNotes ?? '');
          }}
          className="text-[10px] h-7 px-2"
        >
          Review
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <TablePanel
        title="Registration Applications Queue"
        description="Review, approve, reject, and enroll incoming student applications"
      >
        <DataTable<RegistrationApplication>
          columns={columns}
          data={registrationApplications}
          searchable
          searchKeys={['applicantName', 'parentName', 'previousSchool']}
          pageSize={10}
        />
      </TablePanel>

      <Dialog
        isOpen={!!selectedApp}
        onClose={() => setSelectedApp(null)}
        title="Application Review"
        size="lg"
      >
        {selectedApp && (
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-left">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Applicant</p>
                <p className="text-xs font-medium">{selectedApp.applicantName}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Date of Birth</p>
                <p className="text-xs font-medium">{selectedApp.dateOfBirth ?? '—'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Grade / Section</p>
                <p className="text-xs font-medium">
                  {selectedApp.gradeApplied} · Section {selectedApp.sectionRequested}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Parent</p>
                <p className="text-xs font-medium">{selectedApp.parentName}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Phone</p>
                <p className="text-xs font-medium">{selectedApp.parentPhone}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Previous School</p>
                <p className="text-xs font-medium">{selectedApp.previousSchool ?? '—'}</p>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Reviewer Notes</label>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Document verification notes, missing items, etc."
                className="w-full h-20 p-3 bg-muted/40 border border-border rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                disabled={selectedApp.status === 'Enrolled' || selectedApp.status === 'Rejected'}
              />
            </div>

            <DialogFooter className="flex flex-wrap gap-2 justify-end border-t border-border/20 pt-4">
              <Button variant="outline" size="sm" onClick={() => setSelectedApp(null)} className="text-xs h-9">
                Close
              </Button>
              {selectedApp.status === 'Submitted' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    reviewRegistrationApplication(selectedApp.id, 'Under Review', reviewNotes);
                    setSelectedApp({ ...selectedApp, status: 'Under Review' });
                  }}
                  className="text-xs h-9"
                >
                  Mark Under Review
                </Button>
              )}
              {!['Enrolled', 'Rejected', 'Approved'].includes(selectedApp.status) && (
                <>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      reviewRegistrationApplication(selectedApp.id, 'Rejected', reviewNotes);
                      setSelectedApp(null);
                    }}
                    className="text-xs h-9 border-none"
                  >
                    Reject
                  </Button>
                  <Button
                    variant="organic"
                    size="sm"
                    onClick={() => {
                      reviewRegistrationApplication(selectedApp.id, 'Approved', reviewNotes);
                      setSelectedApp({ ...selectedApp, status: 'Approved' });
                    }}
                    className="text-xs h-9 border-none"
                  >
                    Approve
                  </Button>
                </>
              )}
              {selectedApp.status === 'Approved' && (
                <Button
                  variant="organic"
                  size="sm"
                  onClick={() => {
                    enrollFromApplication(selectedApp.id);
                    setSelectedApp(null);
                  }}
                  className="text-xs h-9 border-none font-bold"
                >
                  Enroll Student
                </Button>
              )}
            </DialogFooter>
          </div>
        )}
      </Dialog>

      <Dialog
        isOpen={isNewAppOpen}
        onClose={() => setIsNewAppOpen(false)}
        title="New Registration Application"
        size="lg"
      >
        <form onSubmit={handleSubmitApplication} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Applicant Name</label>
              <input
                type="text"
                required
                value={applicantName}
                onChange={(e) => setApplicantName(e.target.value)}
                className={inputClass}
                placeholder="Full legal name"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Date of Birth</label>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Previous School</label>
              <input
                type="text"
                value={previousSchool}
                onChange={(e) => setPreviousSchool(e.target.value)}
                className={inputClass}
                placeholder="Transfer school name"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Grade Applied</label>
              <select
                value={gradeApplied}
                onChange={(e) => setGradeApplied(e.target.value)}
                className={inputClass}
              >
                {['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'].map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Section Requested</label>
              <select
                value={sectionRequested}
                onChange={(e) => setSectionRequested(e.target.value)}
                className={inputClass}
              >
                {['A', 'B', 'C', 'D'].map((s) => (
                  <option key={s} value={s}>Section {s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Parent / Guardian</label>
              <input
                type="text"
                required
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Phone</label>
              <input
                type="tel"
                required
                value={parentPhone}
                onChange={(e) => setParentPhone(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Email</label>
              <input
                type="email"
                value={parentEmail}
                onChange={(e) => setParentEmail(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Emergency Contact</label>
              <input
                type="text"
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Medical Info</label>
              <input
                type="text"
                value={medicalInfo}
                onChange={(e) => setMedicalInfo(e.target.value)}
                className={inputClass}
                placeholder="Allergies, conditions, etc."
              />
            </div>
          </div>

          <DialogFooter className="border-t border-border/20 pt-4">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsNewAppOpen(false)} className="text-xs h-9">
              Cancel
            </Button>
            <Button type="submit" variant="organic" size="sm" className="text-xs h-9 border-none font-semibold">
              Submit Application
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
};
