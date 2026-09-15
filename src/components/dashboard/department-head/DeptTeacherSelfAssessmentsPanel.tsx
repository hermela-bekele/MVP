'use client';

import React, { useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { isSubjectTeacher, resolveDeptHeadScope } from '@/lib/departmentHead';
import { SELF_ASSESSMENT_COMPETENCIES, getCompetencyLabel } from '@/lib/selfAssessmentRubric';
import { ClipboardCheck, TrendingDown, TrendingUp, AlertCircle } from 'lucide-react';

/**
 * HoD panel to view all teacher self-assessments with filtering by name, grade, subject, and time period.
 * Shows weekly progress tracking to monitor teacher development over time.
 */
export function DeptTeacherSelfAssessmentsPanel() {
  const { currentUser, teachers, teacherSelfAssessments } = useApp();
  const scope = useMemo(() => resolveDeptHeadScope(currentUser), [currentUser]);

  // Filters
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [selectedGrade, setSelectedGrade] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [timeFilter, setTimeFilter] = useState<string>('last-4-weeks');

  // Get department teachers
  const deptTeachers = useMemo(
    () =>
      teachers.filter(
        (t) =>
          t.status === 'Active' &&
          scope &&
          (t.departmentId === scope.departmentId ||
            t.subjects.some((s) => isSubjectTeacher(s, scope.subject))),
      ),
    [teachers, scope],
  );

  // Get unique grades and subjects from department teachers
  const grades = useMemo(() => {
    const allGrades = new Set<string>();
    deptTeachers.forEach((t) => t.grades.forEach((g) => allGrades.add(g)));
    return Array.from(allGrades).sort();
  }, [deptTeachers]);

  const subjects = useMemo(() => {
    const allSubjects = new Set<string>();
    deptTeachers.forEach((t) => t.subjects.forEach((s) => allSubjects.add(s)));
    return Array.from(allSubjects).sort();
  }, [deptTeachers]);

  // Filter date range
  const dateRange = useMemo(() => {
    const now = new Date();
    let startDate: Date;

    switch (timeFilter) {
      case 'this-week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'last-4-weeks':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 28);
        break;
      case 'last-8-weeks':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 56);
        break;
      case 'all-time':
      default:
        startDate = new Date(0);
    }

    return { startDate, endDate: now };
  }, [timeFilter]);

  // Filter assessments
  const filteredAssessments = useMemo(() => {
    const filtered = teacherSelfAssessments.filter((sa) => {
      const teacher = deptTeachers.find((t) => t.id === sa.teacherId);
      if (!teacher) return false;

      // Date filter
      const submittedDate = new Date(sa.submittedAt);
      if (submittedDate < dateRange.startDate || submittedDate > dateRange.endDate) return false;

      // Teacher name filter
      if (selectedTeacherId && sa.teacherId !== selectedTeacherId) return false;

      // Grade filter
      if (selectedGrade && !teacher.grades.includes(selectedGrade)) return false;

      // Subject filter
      if (selectedSubject && !teacher.subjects.includes(selectedSubject)) return false;

      return true;
    });

    // Sort by submission date (newest first)
    return filtered.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  }, [teacherSelfAssessments, deptTeachers, dateRange, selectedTeacherId, selectedGrade, selectedSubject]);

  // Group by teacher and get latest + previous for trend
  const teacherSummaries = useMemo(() => {
    const summaries = new Map<
      string,
      {
        teacher: (typeof deptTeachers)[0];
        latest: (typeof teacherSelfAssessments)[0];
        previous?: (typeof teacherSelfAssessments)[0];
        count: number;
      }
    >();

    deptTeachers.forEach((teacher) => {
      const teacherAssessments = filteredAssessments.filter((sa) => sa.teacherId === teacher.id);
      if (teacherAssessments.length > 0) {
        summaries.set(teacher.id, {
          teacher,
          latest: teacherAssessments[0],
          previous: teacherAssessments[1],
          count: teacherAssessments.length,
        });
      } else {
        // Include teachers with no assessments
        summaries.set(teacher.id, {
          teacher,
          latest: null as any,
          previous: undefined,
          count: 0,
        });
      }
    });

    return Array.from(summaries.values());
  }, [deptTeachers, filteredAssessments]);

  // Calculate trend
  const getTrend = (latest: any, previous: any) => {
    if (!latest || !previous) return null;
    const diff = latest.overallScore - previous.overallScore;
    if (Math.abs(diff) < 3) return { direction: 'stable', diff: 0 };
    return { direction: diff > 0 ? 'up' : 'down', diff: Math.round(diff) };
  };

  // Expanded row state
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  if (!scope) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
          <ClipboardCheck className="h-4 w-4 text-primary" />
          Teacher Self-Assessments (Weekly Progress)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground">
          Track your teachers&apos; weekly self-assessments across 9 competencies. Use this alongside student performance data to identify development needs and assign targeted training.
        </p>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">Teacher</label>
            <select 
              value={selectedTeacherId} 
              onChange={(e) => setSelectedTeacherId(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="">All Teachers</option>
              {deptTeachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">Grade</label>
            <select 
              value={selectedGrade} 
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="">All Grades</option>
              {grades.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">Subject</label>
            <select 
              value={selectedSubject} 
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="">All Subjects</option>
              {subjects.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">Time Period</label>
            <select 
              value={timeFilter} 
              onChange={(e) => setTimeFilter(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="this-week">This Week</option>
              <option value="last-4-weeks">Last 4 Weeks</option>
              <option value="last-8-weeks">Last 8 Weeks</option>
              <option value="all-time">All Time</option>
            </select>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-3 p-3 bg-muted/20 rounded-lg border border-border/40">
          <div>
            <p className="text-xs text-muted-foreground">Total Assessments</p>
            <p className="text-lg font-bold text-foreground">{filteredAssessments.length}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Teachers Assessed</p>
            <p className="text-lg font-bold text-foreground">
              {teacherSummaries.filter((s) => s.latest).length}/{teacherSummaries.length}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Avg. Score</p>
            <p className="text-lg font-bold text-foreground">
              {filteredAssessments.length > 0
                ? Math.round(
                    filteredAssessments.reduce((sum, sa) => sum + sa.overallScore, 0) / filteredAssessments.length,
                  )
                : 0}
              %
            </p>
          </div>
        </div>

        {/* Assessments Table */}
        <div className="overflow-x-auto">
          <table className="eskooly-table">
            <thead>
              <tr>
                <th>Teacher</th>
                <th>Grades</th>
                <th>Latest Submission</th>
                <th>Score</th>
                <th>Trend</th>
                <th>Weakest Area</th>
                <th>Weekly Count</th>
              </tr>
            </thead>
            <tbody>
              {teacherSummaries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-sm text-muted-foreground py-8">
                    No teachers found matching the filters.
                  </td>
                </tr>
              ) : (
                teacherSummaries.map(({ teacher, latest, previous, count }) => {
                  const trend = getTrend(latest, previous);
                  const isExpanded = expandedRow === teacher.id;

                  return (
                    <React.Fragment key={teacher.id}>
                      <tr
                        className="cursor-pointer hover:bg-muted/30"
                        onClick={() => setExpandedRow(isExpanded ? null : teacher.id)}
                      >
                        <td className="font-semibold">{teacher.name}</td>
                        <td className="text-xs text-muted-foreground">{teacher.grades.join(', ')}</td>
                        <td className="text-xs">
                          {latest ? new Date(latest.submittedAt).toLocaleDateString() : '-'}
                        </td>
                        <td>
                          {latest ? (
                            <span
                              className={`font-bold ${
                                latest.overallScore >= 80
                                  ? 'text-green-600'
                                  : latest.overallScore >= 60
                                  ? 'text-amber-600'
                                  : 'text-red-600'
                              }`}
                            >
                              {latest.overallScore}%
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">No assessment</span>
                          )}
                        </td>
                        <td>
                          {trend ? (
                            <div className="flex items-center gap-1">
                              {trend.direction === 'up' && (
                                <TrendingUp className="h-4 w-4 text-green-600" />
                              )}
                              {trend.direction === 'down' && (
                                <TrendingDown className="h-4 w-4 text-red-600" />
                              )}
                              {trend.direction === 'stable' && (
                                <span className="text-xs text-muted-foreground">→</span>
                              )}
                              {trend.diff !== 0 && (
                                <span className="text-xs font-semibold">
                                  {trend.diff > 0 ? '+' : ''}
                                  {trend.diff}%
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="text-xs">
                          {latest?.weakestCompetencyId ? (
                            <span className="text-amber-700 font-semibold">
                              {getCompetencyLabel(latest.weakestCompetencyId)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td>
                          <div className="flex items-center gap-1">
                            <span className="font-semibold">{count}</span>
                            {count === 0 && <AlertCircle className="h-3.5 w-3.5 text-red-500" />}
                          </div>
                        </td>
                      </tr>

                      {/* Expanded row showing detailed ratings */}
                      {isExpanded && latest && (
                        <tr>
                          <td colSpan={7} className="bg-muted/10 p-4">
                            <div className="space-y-3">
                              <p className="text-xs font-semibold text-foreground">
                                Detailed Competency Ratings
                              </p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {latest.responses.map((response) => {
                                  const competency = SELF_ASSESSMENT_COMPETENCIES.find(
                                    (c) => c.id === response.competencyId,
                                  );
                                  if (!competency) return null;

                                  return (
                                    <div
                                      key={response.competencyId}
                                      className="flex items-center justify-between p-2 bg-card rounded border border-border/40"
                                    >
                                      <div className="min-w-0 flex-1">
                                        <p className="text-xs font-semibold text-foreground truncate">
                                          {competency.label}
                                        </p>
                                        <p className="text-xxs text-muted-foreground">{competency.category}</p>
                                      </div>
                                      <div className="ml-2 text-right">
                                        <span
                                          className={`text-sm font-bold ${
                                            response.rating >= 4
                                              ? 'text-green-600'
                                              : response.rating >= 3
                                              ? 'text-amber-600'
                                              : 'text-red-600'
                                          }`}
                                        >
                                          {response.rating}/5
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Help text */}
        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-xs text-blue-900 dark:text-blue-100">
            <strong>Weekly Tracking:</strong> Teachers should submit self-assessments weekly to track their development progress. Use the &quot;No assessment&quot; indicator (⚠️) to identify teachers who need reminders. Click any row to see detailed competency ratings.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
