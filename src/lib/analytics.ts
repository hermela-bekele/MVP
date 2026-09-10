import type { School, Teacher, Student, StudentGradeEntry, AcademicCalendar, TeacherTrainingAssignment } from './mockData';

export interface DashboardScope {
  /** A region name from MOE's region catalog, or 'All' for national. */
  region: string;
  /** An academicYear value as published on schools' academic calendars, or 'All'. */
  academicYear: string;
}

function schoolsInScope(schools: School[], scope?: Pick<DashboardScope, 'region'>): School[] {
  if (!scope || scope.region === 'All') return schools;
  return schools.filter((s) => s.region === scope.region);
}

export function computeNationalStats(
  schools: School[],
  teachers: Teacher[],
  students: Student[],
  scope?: DashboardScope,
  academicCalendars: AcademicCalendar[] = [],
) {
  const scopedSchools = schoolsInScope(schools, scope);
  const scopedSchoolIds = new Set(scopedSchools.map((s) => s.id));
  const scopedStudents = students.filter((s) => scopedSchoolIds.has(s.schoolId));
  const scopedTeachers = teachers.filter((t) => scopedSchoolIds.has(t.schoolId));

  const passCount = scopedStudents.filter(s => s.gpa >= 2.0).length;
  const averagePassRate = scopedStudents.length > 0 ? (passCount / scopedStudents.length) * 100 : 0;

  // "Unique" by construction — one row per school id, never double-counted across
  // engines/datasets. "Active" is the school's real status field. When an academic
  // year is selected, a school only counts if it has a real calendar published for
  // that year — no school is assumed active for a year it has no record of.
  const yearFilteredSchoolIds = scope && scope.academicYear !== 'All'
    ? new Set(academicCalendars.filter((c) => c.academicYear === scope.academicYear).map((c) => c.schoolId))
    : null;
  const uniqueActiveInstitutions = scopedSchools.filter((s) =>
    s.status === 'Active' && (!yearFilteredSchoolIds || yearFilteredSchoolIds.has(s.id))
  ).length;

  return {
    schoolsCount: scopedSchools.length,
    uniqueActiveInstitutions,
    teachersCount: scopedTeachers.length,
    studentsCount: scopedStudents.length,
    averagePassRate: parseFloat(averagePassRate.toFixed(1)),
  };
}

export function computeRegionalPerformance(schools: School[], teachers: Teacher[], students: Student[]) {
  // Derived from the schools actually on record, not a fixed list — a school
  // connected under any region name will always be reflected here.
  const regions = Array.from(new Set(schools.map((s) => s.region))).sort();
  return regions.map(region => {
    const regionSchools = schools.filter(s => s.region === region);
    const regionStudents = students.filter(s => regionSchools.some(rs => rs.id === s.schoolId));
    const passCount = regionStudents.filter(s => s.gpa >= 2.0).length;
    const passRate = regionStudents.length > 0 ? (passCount / regionStudents.length) * 100 : 0;
    
    // Simple mock calculation for shortage
    const expectedTeachers = regionSchools.reduce((acc, s) => acc + Math.ceil(s.studentsCount / 30), 0);
    const actualTeachers = teachers.filter(t => regionSchools.some(rs => rs.id === t.schoolId)).length;
    const shortage = expectedTeachers > 0 ? Math.max(0, ((expectedTeachers - actualTeachers) / expectedTeachers) * 100) : 0;
    
    return {
      name: region,
      schools: regionSchools.length,
      passRate: parseFloat(passRate.toFixed(1)),
      teachersShortage: parseFloat(shortage.toFixed(1)),
    };
  });
}

export function computeSubjectPerformance(studentGradeEntries: StudentGradeEntry[]) {
  // Extract all distinct subjects from entries, defaulting to standard ones if empty
  const distinctSubjects = Array.from(new Set(studentGradeEntries.map(e => e.subject)));
  const subjects = distinctSubjects.length > 0 ? distinctSubjects : ['Mathematics', 'Biology', 'Chemistry', 'Physics', 'English'];
  
  return subjects.map(subject => {
    const entries = studentGradeEntries.filter(e => e.subject === subject);
    const avgScore = entries.length > 0 
      ? entries.reduce((acc, e) => acc + (e.maxScore > 0 ? (e.score / e.maxScore) * 100 : 0), 0) / entries.length 
      : 0;
    
    let status = 'Stable';
    if (avgScore < 60) status = 'Critical';
    else if (avgScore < 70) status = 'Warning';

    return {
      subject,
      average: parseFloat(avgScore.toFixed(1)),
      status,
      riskIndex: parseFloat(Math.max(0, 100 - avgScore).toFixed(1)),
    };
  });
}

const PASS_THRESHOLD_PERCENT = 50;

/**
 * Real per-subject pass rate (% of recorded results at/above the pass mark),
 * optionally scoped to one region via a students -> schools join. Unlike
 * computeSubjectPerformance (used elsewhere for a "risk index" framing this
 * dashboard doesn't want), this never fabricates subjects that have no data —
 * an empty scope returns an empty array so the caller can show a real empty state.
 */
export function computeSubjectPassRate(
  studentGradeEntries: StudentGradeEntry[],
  students: Student[],
  schools: School[],
  scope?: Pick<DashboardScope, 'region'>,
) {
  const scopedSchoolIds = new Set(schoolsInScope(schools, scope).map((s) => s.id));
  const scopedStudentIds = new Set(students.filter((s) => scopedSchoolIds.has(s.schoolId)).map((s) => s.id));
  const scopedEntries = studentGradeEntries.filter((e) => scopedStudentIds.has(e.studentId));

  const subjects = Array.from(new Set(scopedEntries.map((e) => e.subject))).sort();

  return subjects.map((subject) => {
    const entries = scopedEntries.filter((e) => e.subject === subject);
    const passCount = entries.filter((e) => e.maxScore > 0 && (e.score / e.maxScore) * 100 >= PASS_THRESHOLD_PERCENT).length;
    const passRate = entries.length > 0 ? (passCount / entries.length) * 100 : 0;
    let status = 'Stable';
    if (passRate < 50) status = 'Critical';
    else if (passRate < 70) status = 'Warning';
    return {
      subject,
      passRate: parseFloat(passRate.toFixed(1)),
      resultsCount: entries.length,
      status,
    };
  });
}

/**
 * "What professional-development needs are emerging?" — surfaces real gaps from
 * teacher_training_assignments (overdue and incomplete assignments, grouped by
 * program), optionally scoped to one region. Returns an empty array when there is
 * no assignment data in scope rather than inventing needs.
 */
export function computeTeacherDevelopmentNeeds(
  teacherTrainingAssignments: TeacherTrainingAssignment[],
  teachers: Teacher[],
  schools: School[],
  scope?: Pick<DashboardScope, 'region'>,
) {
  const scopedSchoolIds = new Set(schoolsInScope(schools, scope).map((s) => s.id));
  const scopedTeacherIds = new Set(teachers.filter((t) => scopedSchoolIds.has(t.schoolId)).map((t) => t.id));
  const scopedAssignments = teacherTrainingAssignments.filter((a) => scopedTeacherIds.has(a.teacherId));

  const programs = Array.from(new Set(scopedAssignments.map((a) => a.program)));

  return programs
    .map((program) => {
      const assignments = scopedAssignments.filter((a) => a.program === program);
      const overdueCount = assignments.filter((a) => a.overdue).length;
      const completedCount = assignments.filter((a) => a.status === 'completed').length;
      const completionRate = assignments.length > 0 ? (completedCount / assignments.length) * 100 : 0;
      return {
        program,
        assignedCount: assignments.length,
        overdueCount,
        completionRate: parseFloat(completionRate.toFixed(1)),
      };
    })
    // Surface the areas that most need attention first: highest overdue count, then lowest completion.
    .sort((a, b) => b.overdueCount - a.overdueCount || a.completionRate - b.completionRate);
}
