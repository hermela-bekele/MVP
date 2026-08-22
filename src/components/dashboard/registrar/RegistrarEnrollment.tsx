'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { ContentCard } from '@/components/dashboard/ContentCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogFooter } from '@/components/ui/dialog';
import { REGISTRAR_GRADE_OPTIONS, REGISTRAR_SECTION_OPTIONS, filterSchoolStudents } from '@/lib/registrarPortal';
import { findPossibleDuplicates } from '@/lib/duplicateCheck';
import { api } from '@/lib/api';
import { readStoredSession } from '@/lib/auth';
import type { Student } from '@/lib/mockData';

const inputClass =
  'w-full h-10 px-3 bg-muted/40 border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring';

const BULK_HEADERS = ['name', 'grade', 'section', 'parentName', 'parentPhone', 'parentEmail', 'email', 'dateOfBirth', 'medicalInfo', 'emergencyContact'];

interface BulkRow {
  name: string;
  grade: string;
  section: string;
  parentName: string;
  parentPhone: string;
  parentEmail?: string;
  email?: string;
  dateOfBirth?: string;
  medicalInfo?: string;
  emergencyContact?: string;
}

function parseCsv(text: string): { rows: BulkRow[]; parseErrors: string[] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const parseErrors: string[] = [];
  if (!lines.length) return { rows: [], parseErrors: ['File is empty.'] };

  const header = lines[0].split(',').map((h) => h.trim());
  const rows: BulkRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(',').map((c) => c.trim());
    const rec: Record<string, string> = {};
    header.forEach((h, idx) => { rec[h] = cells[idx] ?? ''; });
    if (!rec.name || !rec.grade || !rec.section || !rec.parentName || !rec.parentPhone) {
      parseErrors.push(`Row ${i + 1}: missing required field(s) (name, grade, section, parentName, parentPhone).`);
      continue;
    }
    rows.push(rec as unknown as BulkRow);
  }
  return { rows, parseErrors };
}

export const RegistrarEnrollment: React.FC = () => {
  const { students, enrollStudent, refreshFromApi } = useApp();
  const session = readStoredSession();
  const schoolId = session?.schoolId || 'sch-1';
  const schoolStudents = filterSchoolStudents(students);

  const [mode, setMode] = useState<'single' | 'bulk'>('single');

  // Single-enroll form state
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentGrade, setStudentGrade] = useState('Grade 9');
  const [studentSection, setStudentSection] = useState('A');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [medicalInfo, setMedicalInfo] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [lastEnrolled, setLastEnrolled] = useState({ grade: '', section: '' });
  const [duplicates, setDuplicates] = useState<Student[] | null>(null);

  // Bulk-import state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [bulkRows, setBulkRows] = useState<BulkRow[]>([]);
  const [bulkParseErrors, setBulkParseErrors] = useState<string[]>([]);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkResult, setBulkResult] = useState<{ created: number; errors: { row: number; message: string }[] } | null>(null);

  useEffect(() => {
    const handleOpen = () => setSubmitted(false);
    window.addEventListener('open-registrar-enroll', handleOpen);
    return () => window.removeEventListener('open-registrar-enroll', handleOpen);
  }, []);

  const resetForm = () => {
    setStudentName('');
    setStudentEmail('');
    setStudentGrade('Grade 9');
    setStudentSection('A');
    setDateOfBirth('');
    setParentName('');
    setParentPhone('');
    setParentEmail('');
    setEmergencyContact('');
    setMedicalInfo('');
  };

  const doEnroll = () => {
    setLastEnrolled({ grade: studentGrade, section: studentSection });
    enrollStudent({
      name: studentName,
      email: studentEmail || undefined,
      grade: studentGrade,
      section: studentSection,
      dateOfBirth: dateOfBirth || undefined,
      parentName,
      parentPhone,
      parentEmail,
      emergencyContact,
      medicalInfo: medicalInfo || undefined,
      schoolId: 'sch-1',
    });
    setSubmitted(true);
    resetForm();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName || !parentName || !parentPhone) return;

    const matches = findPossibleDuplicates(schoolStudents, {
      name: studentName,
      parentPhone,
      parentEmail,
      dateOfBirth: dateOfBirth || undefined,
    });
    if (matches.length > 0) {
      setDuplicates(matches);
      return;
    }
    doEnroll();
  };

  const handleFile = async (file: File) => {
    const text = await file.text();
    const { rows, parseErrors } = parseCsv(text);
    setBulkRows(rows);
    setBulkParseErrors(parseErrors);
    setBulkResult(null);
  };

  const bulkDuplicateWarnings = bulkRows.map((row) =>
    findPossibleDuplicates(schoolStudents, {
      name: row.name,
      parentPhone: row.parentPhone,
      parentEmail: row.parentEmail,
      dateOfBirth: row.dateOfBirth,
    })
  );

  const handleBulkImport = async () => {
    if (!bulkRows.length) return;
    setBulkBusy(true);
    try {
      const res = await api.bulkCreateStudents({ schoolId, rows: bulkRows as unknown as Record<string, unknown>[] });
      setBulkResult({ created: res.created.length, errors: res.errors });
      setBulkRows([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await refreshFromApi();
    } catch (err) {
      setBulkResult({ created: 0, errors: [{ row: -1, message: err instanceof Error ? err.message : 'Import failed' }] });
    } finally {
      setBulkBusy(false);
    }
  };

  if (submitted) {
    return (
      <ContentCard
        title="Enrollment Complete"
        description="The student has been registered and assigned a PTS student ID."
      >
        <div className="text-center py-8 space-y-4">
          <div className="text-4xl">✓</div>
          <p className="text-sm text-foreground font-medium">
            Student successfully enrolled in {lastEnrolled.grade} Section {lastEnrolled.section}.
          </p>
          <p className="text-xs text-muted-foreground">
            A PTS student ID was auto-generated. The student record is now active in the registry.
          </p>
          <Button
            variant="organic"
            size="sm"
            onClick={() => setSubmitted(false)}
            className="text-xs h-9 border-none"
          >
            Enroll Another Student
          </Button>
        </div>
      </ContentCard>
    );
  }

  return (
    <div className="w-full animate-fade-in space-y-4">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode('single')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            mode === 'single' ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground hover:text-foreground'
          }`}
        >
          Single Student
        </button>
        <button
          type="button"
          onClick={() => setMode('bulk')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            mode === 'bulk' ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground hover:text-foreground'
          }`}
        >
          Bulk CSV Import
        </button>
      </div>

      {mode === 'single' ? (
        <ContentCard
          title="Direct Student Enrollment"
          description="Register and onboard a new student directly — bypassing the application queue"
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <h4 className="text-[10px] font-bold text-primary uppercase tracking-wider">Student Profile</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Full Name</label>
                  <input
                    type="text"
                    required
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    className={inputClass}
                    placeholder="e.g. Almaz Kebede"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Student Email (Optional)</label>
                  <input
                    type="email"
                    value={studentEmail}
                    onChange={(e) => setStudentEmail(e.target.value)}
                    className={inputClass}
                    placeholder="e.g. student@std.edu.et"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Grade Level</label>
                  <select
                    value={studentGrade}
                    onChange={(e) => setStudentGrade(e.target.value)}
                    className={inputClass}
                  >
                    {REGISTRAR_GRADE_OPTIONS.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Section</label>
                  <select
                    value={studentSection}
                    onChange={(e) => setStudentSection(e.target.value)}
                    className={inputClass}
                  >
                    {REGISTRAR_SECTION_OPTIONS.map((s) => (
                      <option key={s} value={s}>Section {s}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Date of Birth (Optional)</label>
                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            <hr className="border-border/30" />

            <div className="space-y-2">
              <h4 className="text-[10px] font-bold text-accent uppercase tracking-wider">Parent / Guardian</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Guardian Name</label>
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
            </div>

            <hr className="border-border/30" />

            <div className="space-y-2">
              <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Additional Info</h4>
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
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" variant="organic" size="sm" className="text-xs h-10 border-none font-semibold px-6">
                Complete Enrollment & Onboarding
              </Button>
            </div>
          </form>
        </ContentCard>
      ) : (
        <ContentCard
          title="Bulk CSV Import"
          description={`Header row required: ${BULK_HEADERS.join(', ')}`}
        >
          <div className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFile(f); }}
              className="text-xs"
            />

            {bulkParseErrors.length > 0 && (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive space-y-0.5">
                {bulkParseErrors.map((e, i) => <p key={i}>{e}</p>)}
              </div>
            )}

            {bulkResult && (
              <div className={`rounded-md border px-3 py-2 text-xs ${bulkResult.errors.length ? 'border-amber-400/40 bg-amber-400/10 text-amber-700' : 'border-success/40 bg-success/10 text-success'}`}>
                <p>Imported {bulkResult.created} student{bulkResult.created === 1 ? '' : 's'}.</p>
                {bulkResult.errors.map((e, i) => (
                  <p key={i}>{e.row >= 0 ? `Row ${e.row + 1}: ` : ''}{e.message}</p>
                ))}
              </div>
            )}

            {bulkRows.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">{bulkRows.length} row{bulkRows.length === 1 ? '' : 's'} ready to import.</p>
                <div className="overflow-x-auto max-h-72 overflow-y-auto border border-border/40 rounded-lg">
                  <table className="eskooly-table w-full">
                    <thead>
                      <tr>
                        <th className="p-2 text-left text-[10px] font-semibold text-muted-foreground">Name</th>
                        <th className="p-2 text-left text-[10px] font-semibold text-muted-foreground">Grade</th>
                        <th className="p-2 text-left text-[10px] font-semibold text-muted-foreground">Section</th>
                        <th className="p-2 text-left text-[10px] font-semibold text-muted-foreground">Parent</th>
                        <th className="p-2 text-left text-[10px] font-semibold text-muted-foreground">Flags</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {bulkRows.map((row, i) => (
                        <tr key={i}>
                          <td className="p-2 text-xs font-medium">{row.name}</td>
                          <td className="p-2 text-xs">{row.grade}</td>
                          <td className="p-2 text-xs">{row.section}</td>
                          <td className="p-2 text-xs">{row.parentName} · {row.parentPhone}</td>
                          <td className="p-2">
                            {bulkDuplicateWarnings[i].length > 0 ? (
                              <Badge variant="warning" size="sm">Possible duplicate</Badge>
                            ) : (
                              <Badge variant="neutral" size="sm">New</Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex justify-end">
                  <Button
                    variant="organic"
                    size="sm"
                    className="text-xs h-9 border-none font-semibold px-6"
                    disabled={bulkBusy}
                    onClick={handleBulkImport}
                  >
                    {bulkBusy ? 'Importing…' : `Import ${bulkRows.length} Student${bulkRows.length === 1 ? '' : 's'}`}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </ContentCard>
      )}

      <Dialog isOpen={!!duplicates} onClose={() => setDuplicates(null)} title="Possible Duplicate Student">
        <div className="space-y-4 pt-2">
          <p className="text-xs text-muted-foreground">
            A student with a similar name and matching parent contact is already in the registry:
          </p>
          <div className="space-y-1.5">
            {(duplicates ?? []).map((s) => (
              <div key={s.id} className="rounded-md border border-border/50 bg-muted/20 px-3 py-2">
                <p className="text-xs font-semibold">{s.name} <span className="text-muted-foreground font-normal">· {s.studentId}</span></p>
                <p className="text-[10px] text-muted-foreground">{s.grade} · {s.section || 'Unplaced'} · {s.parentName}</p>
              </div>
            ))}
          </div>
          <DialogFooter className="border-t border-border/20 pt-4">
            <Button variant="outline" size="sm" onClick={() => setDuplicates(null)} className="text-xs h-9">Cancel</Button>
            <Button
              variant="organic"
              size="sm"
              className="text-xs h-9 border-none font-semibold"
              onClick={() => { setDuplicates(null); doEnroll(); }}
            >
              Enroll Anyway
            </Button>
          </DialogFooter>
        </div>
      </Dialog>
    </div>
  );
};
