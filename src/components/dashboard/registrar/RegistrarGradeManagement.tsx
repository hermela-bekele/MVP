'use client';

import React, { useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { TablePanel } from '@/components/dashboard/TablePanel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Dialog, DialogFooter } from '@/components/ui/dialog';
import { ContentCard } from '@/components/dashboard/ContentCard';
import { gpaToMark } from '@/lib/grading';
import {
  CURRENT_TERM,
  GRADE_ENTRY_TYPES,
  entryPercent,
  gradesForStudent,
  weightedTermAverage,
} from '@/lib/teacherPortal';
import type { StudentGradeEntry, StudentGradeEntryType } from '@/lib/mockData';
import { filterSchoolStudents, REGISTRAR_GRADE_OPTIONS, REGISTRAR_SECTION_OPTIONS } from '@/lib/registrarPortal';

const inputClass =
  'w-full h-10 px-3 bg-muted/40 border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring';

export const RegistrarGradeManagement: React.FC = () => {
  const { students, studentGradeEntries, upsertStudentGradeEntry, deleteStudentGradeEntry, recalculateStudentGpaFromGrades } = useApp();

  const [classGrade, setClassGrade] = useState('Grade 9');
  const [classSection, setClassSection] = useState('A');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | undefined>();

  const [entryType, setEntryType] = useState<StudentGradeEntryType>('Quiz');
  const [subject, setSubject] = useState('Biology');
  const [title, setTitle] = useState('');
  const [score, setScore] = useState('');
  const [maxScore, setMaxScore] = useState('100');
  const [weight, setWeight] = useState('10');
  const [remarks, setRemarks] = useState('');

  const roster = useMemo(
    () => filterSchoolStudents(students).filter(
      (s) => s.grade === classGrade && s.section === classSection && s.status === 'Active'
    ),
    [students, classGrade, classSection]
  );

  const classEntries = useMemo(
    () => studentGradeEntries.filter(
      (e) => e.gradeLevel === classGrade && e.section === classSection
    ),
    [studentGradeEntries, classGrade, classSection]
  );

  const openAdd = (studentId: string) => {
    setSelectedStudentId(studentId);
    setEditingId(undefined);
    setEntryType('Quiz');
    setTitle('');
    setScore('');
    setMaxScore('100');
    setWeight('10');
    setRemarks('');
    setIsFormOpen(true);
  };

  const openEdit = (entry: StudentGradeEntry) => {
    setSelectedStudentId(entry.studentId);
    setEditingId(entry.id);
    setEntryType(entry.entryType);
    setSubject(entry.subject);
    setTitle(entry.title);
    setScore(String(entry.score));
    setMaxScore(String(entry.maxScore));
    setWeight(String(entry.weight));
    setRemarks(entry.remarks ?? '');
    setIsFormOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !title) return;
    const student = students.find((s) => s.id === selectedStudentId);
    if (!student) return;

    upsertStudentGradeEntry({
      id: editingId,
      studentId: selectedStudentId,
      subject,
      gradeLevel: student.grade,
      section: student.section,
      entryType,
      title,
      score: parseFloat(score) || 0,
      maxScore: parseFloat(maxScore) || 100,
      weight: parseFloat(weight) || 0,
      term: CURRENT_TERM,
      remarks: remarks || undefined,
    });
    setIsFormOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-xl">
        <Select
          label="Grade"
          options={REGISTRAR_GRADE_OPTIONS.map((g) => ({ value: g, label: g }))}
          value={classGrade}
          onChange={(e) => setClassGrade(e.target.value)}
        />
        <Select
          label="Section"
          options={REGISTRAR_SECTION_OPTIONS.map((s) => ({ value: s, label: `Section ${s}` }))}
          value={classSection}
          onChange={(e) => setClassSection(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TablePanel title="Class Roster & Marks">
          <table className="eskooly-table">
            <thead>
              <tr>
                <th className="p-3 text-left text-muted-foreground font-semibold text-xs">Student</th>
                <th className="p-3 text-left text-muted-foreground font-semibold text-xs">Term Avg</th>
                <th className="p-3 text-left text-muted-foreground font-semibold text-xs">Cumulative Mark</th>
                <th className="p-3 text-left text-muted-foreground font-semibold text-xs">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {roster.map((student) => {
                const entries = gradesForStudent(classEntries, student.id);
                const avg = weightedTermAverage(entries);
                return (
                  <tr key={student.id} className="hover:bg-muted/10">
                    <td className="p-3 text-xs font-semibold text-foreground">{student.name}</td>
                    <td className="p-3 text-xs">{avg !== null ? `${avg}%` : '—'}</td>
                    <td className="p-3">
                      <Badge variant={student.gpa >= 3.0 ? 'success' : 'warning'} size="sm">
                        {gpaToMark(student.gpa)}%
                      </Badge>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <Button variant="outline" size="sm" onClick={() => openAdd(student.id)} className="text-[10px] h-7 px-2">+ Grade</Button>
                        <Button variant="outline" size="sm" onClick={() => recalculateStudentGpaFromGrades(student.id)} className="text-[10px] h-7 px-2">Recalc</Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TablePanel>

        <ContentCard title="Grade Entries" description="All assessment records for selected class">
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {classEntries.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">No grade entries for this class yet.</p>
            ) : (
              classEntries.map((entry) => {
                const student = students.find((s) => s.id === entry.studentId);
                return (
                  <div key={entry.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">{entry.title}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {student?.name} · {entry.subject} · {entry.entryType}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="primary" size="sm">{entry.score}/{entry.maxScore} ({entryPercent(entry)}%)</Badge>
                      <Button variant="outline" size="sm" onClick={() => openEdit(entry)} className="text-[10px] h-7 px-2">Edit</Button>
                      <Button variant="destructive" size="sm" onClick={() => deleteStudentGradeEntry(entry.id)} className="text-[10px] h-7 px-2 border-none">Del</Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ContentCard>
      </div>

      <Dialog isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={editingId ? 'Edit Grade Entry' : 'Record Grade Entry'}>
        <form onSubmit={handleSave} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Subject</label>
              <input type="text" required value={subject} onChange={(e) => setSubject(e.target.value)} className={inputClass} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Entry Type</label>
              <select value={entryType} onChange={(e) => setEntryType(e.target.value as StudentGradeEntryType)} className={inputClass}>
                {GRADE_ENTRY_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Assessment Title</label>
            <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Score</label>
              <input type="number" required value={score} onChange={(e) => setScore(e.target.value)} className={inputClass} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Max Score</label>
              <input type="number" required value={maxScore} onChange={(e) => setMaxScore(e.target.value)} className={inputClass} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Weight %</label>
              <input type="number" required value={weight} onChange={(e) => setWeight(e.target.value)} className={inputClass} />
            </div>
          </div>
          <DialogFooter className="border-t border-border/20 pt-4">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsFormOpen(false)} className="text-xs h-9">Cancel</Button>
            <Button type="submit" variant="organic" size="sm" className="text-xs h-9 border-none">Save Grade</Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
};
