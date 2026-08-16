'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { TablePanel } from '@/components/dashboard/TablePanel';
import { Badge } from '@/components/ui/badge';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { LinearProgress } from '@/components/ui/progress';
import { gpaToMark } from '@/lib/grading';

type AcademicGradeRow = {
  grade: string;
  studentsCount: number;
  avgMark: number;
  avgAttendance: number;
};

type DepartmentPerfRow = {
  id: string;
  name: string;
  headName: string;
  avgScore: number;
  passRate: number;
};

type ClassPerfRow = {
  id: string;
  name: string;
  grade: string;
  section: string;
  teacher: string;
  avgMark: number;
  attendance: number;
};

export const PerformanceReports: React.FC = () => {
  const { students, departments, classes } = useApp();
  const [activeSubTab, setActiveSubTab] = useState<'academic' | 'department' | 'class'>('academic');

  // Academic Sub-Tab Data: Grade Level stats
  const academicGradeData = React.useMemo(() => {
    const grades = ['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];
    return grades.map(grade => {
      const gradeStudents = students.filter(s => s.grade === grade);
      const totalStudents = gradeStudents.length;
      const avgMark = totalStudents > 0
        ? Math.round(gradeStudents.reduce((acc, s) => acc + gpaToMark(s.gpa), 0) / totalStudents)
        : 0;
      const avgAttendance = totalStudents > 0
        ? Math.round(gradeStudents.reduce((acc, s) => acc + s.attendanceRate, 0) / totalStudents)
        : 0;

      return {
        grade,
        studentsCount: totalStudents,
        avgMark,
        avgAttendance,
      };
    });
  }, [students]);

  const academicColumns: DataTableColumn<AcademicGradeRow>[] = [
    { key: 'grade', header: 'Grade Level', sortable: true },
    { key: 'studentsCount', header: 'Active Students', sortable: true },
    {
      key: 'avgMark',
      header: 'Average Mark',
      sortable: true,
      render: (row) => (
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-xs text-foreground">{row.avgMark}%</span>
          <div className="w-16">
            <LinearProgress value={row.avgMark} size="sm" color={row.avgMark >= 75 ? 'primary' : row.avgMark >= 50 ? 'accent' : 'destructive'} />
          </div>
        </div>
      )
    },
    {
      key: 'avgAttendance',
      header: 'Attendance Rate',
      sortable: true,
      render: (row) => (
        <Badge variant={row.avgAttendance >= 90 ? 'success' : row.avgAttendance >= 80 ? 'info' : 'warning'} size="sm" className="font-medium">
          {row.avgAttendance}%
        </Badge>
      )
    }
  ];

  // Department Sub-Tab Data
  const departmentPerformanceData = React.useMemo(() => {
    return departments.map(dept => {
      // Mocked average scores for demonstration (departments have subjects)
      const mockScores: Record<string, { score: number; rate: number }> = {
        'dept-math': { score: 76, rate: 94 },
        'dept-chem': { score: 72, rate: 91 },
        'dept-stem': { score: 81, rate: 95 },
        'dept-eng': { score: 79, rate: 93 },
      };
      
      const stats = mockScores[dept.id] ?? { score: 75, rate: 92 };

      return {
        id: dept.id,
        name: dept.name,
        headName: dept.headName,
        avgScore: stats.score,
        passRate: stats.rate,
      };
    });
  }, [departments]);

  const departmentColumns: DataTableColumn<DepartmentPerfRow>[] = [
    { key: 'name', header: 'Department Name', sortable: true },
    { key: 'headName', header: 'Department Head', sortable: true },
    { 
      key: 'avgScore', 
      header: 'Average Subject Score', 
      sortable: true,
      render: (row) => (
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-xs text-foreground">{row.avgScore}%</span>
          <div className="w-16">
            <LinearProgress value={row.avgScore} size="sm" color={row.avgScore >= 80 ? 'success' : row.avgScore >= 70 ? 'primary' : 'warning'} />
          </div>
        </div>
      )
    },
    {
      key: 'passRate',
      header: 'Curriculum Pass Rate',
      sortable: true,
      render: (row) => (
        <Badge variant={row.passRate >= 90 ? 'success' : 'info'} size="sm">
          {row.passRate}% Pass
        </Badge>
      )
    }
  ];

  // Class Section Sub-Tab Data
  const classPerformanceData = React.useMemo(() => {
    return classes.map(cls => {
      // Mock average mark and attendance for class sections
      const mockScores: Record<string, { mark: number; att: number }> = {
        'cls-1': { mark: 78, att: 94 },
        'cls-2': { mark: 72, att: 91 },
        'cls-3': { mark: 85, att: 96 },
        'cls-4': { mark: 75, att: 92 },
      };

      const stats = mockScores[cls.id] ?? { mark: 75, att: 93 };

      return {
        id: cls.id,
        name: cls.name,
        grade: cls.grade,
        section: cls.section,
        teacher: cls.homeroomTeacher,
        avgMark: stats.mark,
        attendance: stats.att,
      };
    });
  }, [classes]);

  const classColumns: DataTableColumn<ClassPerfRow>[] = [
    {
      key: 'name',
      header: 'Classroom Section',
      sortable: true,
      render: (row) => (
        <span className="font-bold text-foreground">{row.grade} - {row.section}</span>
      )
    },
    { key: 'teacher', header: 'Homeroom Advisor', sortable: true },
    {
      key: 'avgMark',
      header: 'Classroom Average Mark',
      sortable: true,
      render: (row) => (
        <span className="font-semibold text-xs text-foreground">{row.avgMark}%</span>
      )
    },
    {
      key: 'attendance',
      header: 'Class Attendance Average',
      sortable: true,
      render: (row) => (
        <Badge variant={row.attendance >= 95 ? 'success' : row.attendance >= 90 ? 'info' : 'warning'} size="sm">
          {row.attendance}% Att.
        </Badge>
      )
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      
      <div className="flex justify-end">
        <div className="flex bg-muted/60 p-0.5 rounded-lg border border-border/40 shrink-0">
          <button
            onClick={() => setActiveSubTab('academic')}
            className={`px-3 py-1.5 text-xxs font-bold rounded-md transition-all cursor-pointer ${
              activeSubTab === 'academic' 
                ? 'bg-card text-foreground shadow-sm' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Academic Grades
          </button>
          <button
            onClick={() => setActiveSubTab('department')}
            className={`px-3 py-1.5 text-xxs font-bold rounded-md transition-all cursor-pointer ${
              activeSubTab === 'department' 
                ? 'bg-card text-foreground shadow-sm' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Departmental
          </button>
          <button
            onClick={() => setActiveSubTab('class')}
            className={`px-3 py-1.5 text-xxs font-bold rounded-md transition-all cursor-pointer ${
              activeSubTab === 'class' 
                ? 'bg-card text-foreground shadow-sm' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Class Sections
          </button>
        </div>
      </div>

      <TablePanel
        title={
          activeSubTab === 'academic'
            ? 'Academic Performance by Grade Level'
            : activeSubTab === 'department'
              ? 'Department Curriculum Analytics'
              : 'Classroom Section Marks & Attendance'
        }
      >
          {activeSubTab === 'academic' && (
            <DataTable
              columns={academicColumns}
              data={academicGradeData}
              pageSize={5}
            />
          )}
          {activeSubTab === 'department' && (
            <DataTable
              columns={departmentColumns}
              data={departmentPerformanceData}
              searchable
              searchKeys={['name', 'headName']}
              pageSize={5}
            />
          )}
          {activeSubTab === 'class' && (
            <DataTable
              columns={classColumns}
              data={classPerformanceData}
              searchable
              searchKeys={['teacher', 'name']}
              pageSize={5}
            />
          )}
      </TablePanel>

    </div>
  );
};
