import type { School, Teacher, Student, StudentGradeEntry } from './mockData';

export function computeNationalStats(schools: School[], teachers: Teacher[], students: Student[]) {
  const passCount = students.filter(s => s.gpa >= 2.0).length;
  const averagePassRate = students.length > 0 ? (passCount / students.length) * 100 : 0;
  
  return {
    schoolsCount: schools.length,
    teachersCount: teachers.length,
    studentsCount: students.length,
    averagePassRate: parseFloat(averagePassRate.toFixed(1)),
  };
}

export function computeRegionalPerformance(schools: School[], teachers: Teacher[], students: Student[]) {
  const regions = ['Addis Ababa', 'Oromia', 'Amhara', 'Tigray', 'Sidama', 'SNNPR'];
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
