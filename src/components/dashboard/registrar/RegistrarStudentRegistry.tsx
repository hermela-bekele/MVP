'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { TablePanel } from '@/components/dashboard/TablePanel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Avatar } from '@/components/ui/avatar';
import { DataTable } from '@/components/ui/data-table';
import type { DataTableColumn } from '@/components/ui/data-table';
import type { Student } from '@/lib/mockData';
import { filterSchoolStudents, REGISTRAR_GRADE_OPTIONS, statusBadgeVariant } from '@/lib/registrarPortal';
import { toCsv, downloadCsv } from '@/lib/csvExport';

export const RegistrarStudentRegistry: React.FC = () => {
  const router = useRouter();
  const { students } = useApp();
  const schoolStudents = filterSchoolStudents(students);

  const [statusFilter, setStatusFilter] = useState<Student['status'] | 'All'>('All');
  const [gradeFilter, setGradeFilter] = useState<string>('All');

  const filteredStudents = useMemo(
    () =>
      schoolStudents.filter(
        (s) =>
          (statusFilter === 'All' || s.status === statusFilter) &&
          (gradeFilter === 'All' || s.grade === gradeFilter)
      ),
    [schoolStudents, statusFilter, gradeFilter]
  );

  const handleExport = () => {
    const csv = toCsv(filteredStudents, [
      { key: 'studentId', header: 'Student ID' },
      { key: 'name', header: 'Name' },
      { key: 'grade', header: 'Grade' },
      { key: 'section', header: 'Section' },
      { key: 'status', header: 'Status' },
      { key: 'gpa', header: 'GPA' },
      { key: 'attendanceRate', header: 'Attendance %' },
      { key: 'parentName', header: 'Parent' },
      { key: 'parentPhone', header: 'Parent Phone' },
    ]);
    downloadCsv('student-registry.csv', csv);
  };

  const columns: DataTableColumn<Student>[] = [
    {
      key: 'name',
      header: 'Student',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={row.name} size="sm" />
          <div>
            <p className="text-xs font-semibold text-foreground">{row.name}</p>
            <code className="text-[9px] font-mono text-muted-foreground">{row.studentId}</code>
          </div>
        </div>
      ),
    },
    {
      key: 'grade',
      header: 'Grade / Section',
      sortable: true,
      render: (row) => (
        <Badge variant="neutral" size="sm">{row.grade} · {row.section}</Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (row) => (
        <Badge variant={statusBadgeVariant(row.status)} size="sm">{row.status}</Badge>
      ),
    },
    {
      key: 'gpa',
      header: 'GPA',
      sortable: true,
      render: (row) => <span className="text-xs font-semibold">{row.gpa.toFixed(2)}</span>,
    },
    {
      key: 'parentName',
      header: 'Parent',
      render: (row) => (
        <div>
          <p className="text-[11px] font-medium">{row.parentName}</p>
          <p className="text-[9px] text-muted-foreground">{row.parentPhone}</p>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => router.push(`/dashboard/registrar/student-registry/${row.id}`)}
            className="text-[10px] h-7 px-2"
          >
            View / Edit
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <TablePanel
        title="Official Student Registry"
        description="Complete roster of all enrolled students with searchable records"
      >
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="w-40">
            <Select
              options={[
                { value: 'All', label: 'All statuses' },
                { value: 'Active', label: 'Active' },
                { value: 'Suspended', label: 'Suspended' },
                { value: 'Transferred', label: 'Transferred' },
                { value: 'Graduated', label: 'Graduated' },
              ]}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as Student['status'] | 'All')}
            />
          </div>
          <div className="w-36">
            <Select
              options={[
                { value: 'All', label: 'All grades' },
                ...REGISTRAR_GRADE_OPTIONS.map((g) => ({ value: g, label: g })),
              ]}
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
            />
          </div>
          {(statusFilter !== 'All' || gradeFilter !== 'All') && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-[10px] h-9"
              onClick={() => { setStatusFilter('All'); setGradeFilter('All'); }}
            >
              Clear filters
            </Button>
          )}
        </div>
        <DataTable<Student>
          columns={columns}
          data={filteredStudents}
          searchable
          searchKeys={['name', 'studentId', 'parentName', 'grade']}
          pageSize={12}
          onExport={handleExport}
        />
      </TablePanel>
    </div>
  );
};
