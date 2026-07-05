'use client';

import React, { useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { TablePanel } from '@/components/dashboard/TablePanel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Dialog, DialogFooter } from '@/components/ui/dialog';
import { filterSchoolStudents, REGISTRAR_GRADE_OPTIONS, REGISTRAR_SECTION_OPTIONS } from '@/lib/registrarPortal';

export const RegistrarClassPlacement: React.FC = () => {
  const { students, classes, updateStudent } = useApp();
  const schoolStudents = filterSchoolStudents(students).filter((s) => s.status === 'Active');

  const [selectedGrade, setSelectedGrade] = useState('Grade 9');
  const [placementStudentId, setPlacementStudentId] = useState<string | null>(null);
  const [newSection, setNewSection] = useState('A');

  const gradeStudents = useMemo(
    () => schoolStudents.filter((s) => s.grade === selectedGrade),
    [schoolStudents, selectedGrade]
  );

  const sectionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const section of REGISTRAR_SECTION_OPTIONS) {
      counts[section] = gradeStudents.filter((s) => s.section === section).length;
    }
    return counts;
  }, [gradeStudents]);

  const gradeClasses = classes.filter((c) => c.grade === selectedGrade);

  const handlePlacement = () => {
    if (!placementStudentId) return;
    updateStudent(placementStudentId, { section: newSection });
    setPlacementStudentId(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap gap-2">
        {REGISTRAR_GRADE_OPTIONS.map((grade) => (
          <button
            key={grade}
            type="button"
            onClick={() => setSelectedGrade(grade)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              selectedGrade === grade
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted/50 text-muted-foreground hover:text-foreground'
            }`}
          >
            {grade}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {REGISTRAR_SECTION_OPTIONS.map((section) => {
          const count = sectionCounts[section] ?? 0;
          const classInfo = gradeClasses.find((c) => c.section === section || c.name.includes(section));
          const capacity = 45;
          const utilization = Math.round((count / capacity) * 100);
          return (
            <Card key={section} className="border-border/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold">Section {section}</CardTitle>
                <CardDescription className="text-[10px]">
                  {classInfo?.homeroomTeacher ?? 'No homeroom assigned'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Students</span>
                  <span className="font-bold">{count} / {capacity}</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${utilization >= 90 ? 'bg-destructive' : utilization >= 70 ? 'bg-amber-500' : 'bg-primary'}`}
                    style={{ width: `${Math.min(100, utilization)}%` }}
                  />
                </div>
                <Badge variant={utilization >= 90 ? 'danger' : 'neutral'} size="sm">
                  {utilization}% capacity
                </Badge>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <TablePanel
        title={`${selectedGrade} — Student Placement`}
        description="Assign or reassign students to class sections"
      >
        <table className="eskooly-table">
          <thead>
            <tr>
              <th className="p-3 text-left text-muted-foreground font-semibold text-xs">Student</th>
              <th className="p-3 text-left text-muted-foreground font-semibold text-xs">Current Section</th>
              <th className="p-3 text-left text-muted-foreground font-semibold text-xs">GPA</th>
              <th className="p-3 text-left text-muted-foreground font-semibold text-xs">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {gradeStudents.map((student) => (
              <tr key={student.id} className="hover:bg-muted/10">
                <td className="p-3 text-xs font-semibold text-foreground">{student.name}</td>
                <td className="p-3">
                  <Badge variant="neutral" size="sm">Section {student.section}</Badge>
                </td>
                <td className="p-3 text-xs">{student.gpa.toFixed(2)}</td>
                <td className="p-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setPlacementStudentId(student.id);
                      setNewSection(student.section);
                    }}
                    className="text-[10px] h-7 px-2"
                  >
                    Reassign
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TablePanel>

      <Dialog
        isOpen={!!placementStudentId}
        onClose={() => setPlacementStudentId(null)}
        title="Reassign Class Section"
      >
        <div className="space-y-4 pt-2">
          <p className="text-xs text-muted-foreground">
            Moving <strong className="text-foreground">
              {students.find((s) => s.id === placementStudentId)?.name}
            </strong> to a new section in {selectedGrade}.
          </p>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">New Section</label>
            <select
              value={newSection}
              onChange={(e) => setNewSection(e.target.value)}
              className="w-full h-10 px-3 bg-muted/40 border border-border rounded-md text-xs"
            >
              {REGISTRAR_SECTION_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  Section {s} ({sectionCounts[s] ?? 0} students)
                </option>
              ))}
            </select>
          </div>
          <DialogFooter className="border-t border-border/20 pt-4">
            <Button variant="outline" size="sm" onClick={() => setPlacementStudentId(null)} className="text-xs h-9">Cancel</Button>
            <Button variant="organic" size="sm" onClick={handlePlacement} className="text-xs h-9 border-none font-semibold">
              Confirm Placement
            </Button>
          </DialogFooter>
        </div>
      </Dialog>
    </div>
  );
};
