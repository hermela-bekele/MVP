'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  School,
  Teacher,
  Student,
  LessonPlan,
  Assessment,
  Attendance,
  TeacherTraining,
  SchoolCheckIn,
  Department,
  SchoolClass,
  ExamPaper,
  TrainingMaterial,
  TeachingNote,
  TeacherResource,
  TeacherFeedback,
  ParentMessage,
  TeacherCheckInPrompt,
  StudentGradeEntry,
  mockSchools,
  mockTeachers,
  mockStudents,
  mockLessonPlans,
  mockAssessments,
  mockAttendanceRecords,
  mockTrainingPrograms,
  mockCheckIns,
  mockDepartments,
  mockClasses,
  mockExams,
  mockTrainingMaterials,
  mockTeachingNotes,
  mockTeacherResources,
  mockTeacherFeedbacks,
  mockParentMessages,
  mockTeacherCheckInPrompts,
  mockStudentGradeEntries,
} from '@/lib/mockData';
import { DEMO_TEACHER_ID, percentToGpa } from '@/lib/teacherPortal';

export interface AppNotification {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  type: 'info' | 'alert' | 'success' | 'request';
}

interface AppContextType {
  activeRole: string;
  setActiveRole: (role: string) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  
  // Tables
  schools: School[];
  teachers: Teacher[];
  students: Student[];
  lessonPlans: LessonPlan[];
  assessments: Assessment[];
  attendance: Attendance[];
  trainings: TeacherTraining[];
  checkIns: SchoolCheckIn[];
  departments: Department[];
  classes: SchoolClass[];
  exams: ExamPaper[];
  trainingMaterials: TrainingMaterial[];
  teachingNotes: TeachingNote[];
  teacherResources: TeacherResource[];
  teacherFeedbacks: TeacherFeedback[];
  parentMessages: ParentMessage[];
  teacherCheckInPrompts: TeacherCheckInPrompt[];
  studentGradeEntries: StudentGradeEntry[];
  notifications: AppNotification[];
  
  // Actions
  addSchool: (school: Omit<School, 'id' | 'code' | 'studentsCount' | 'teachersCount' | 'status' | 'gps'>) => void;
  toggleSchoolStatus: (id: string) => void;
  approveLessonPlan: (id: string, role: 'dept' | 'school', comments: string) => void;
  rejectLessonPlan: (id: string, role: 'dept' | 'school', comments: string) => void;
  approveAssessment: (id: string, comments: string) => void;
  rejectAssessment: (id: string, comments: string) => void;
  createLessonPlan: (plan: Omit<LessonPlan, 'id' | 'teacherId' | 'teacherName' | 'status' | 'version' | 'createdAt'>) => void;
  createAssessment: (asm: Omit<Assessment, 'id' | 'teacherId' | 'teacherName' | 'status' | 'createdAt'>) => void;
  saveAttendance: (records: { studentId: string; status: 'Present' | 'Absent' | 'Late'; remarks?: string }[]) => void;
  enrollStudent: (student: Omit<Student, 'id' | 'studentId' | 'gpa' | 'attendanceRate' | 'status'>) => void;
  updateStudent: (id: string, updates: Partial<Student>) => void;
  updateStudentGrade: (id: string, newGpa: number) => void;
  addTeacher: (teacher: Omit<Teacher, 'id' | 'status' | 'trainingProgress'>) => void;
  updateTeacher: (id: string, updates: Partial<Teacher>) => void;
  toggleTeacherStatus: (id: string) => void;
  addDepartment: (name: string, headName: string) => void;
  addClass: (name: string, grade: string, section: string, homeroomTeacher: string) => void;
  approveExam: (id: string, comments: string) => void;
  rejectExam: (id: string, comments: string) => void;
  addTrainingMaterial: (title: string, resourceUrl: string, category: string) => void;
  addCheckInTemplate: (title: string, type: 'Teacher Wellness' | 'Student Satisfaction' | 'Parent Feedback', respondentName: string, rating: number, comment: string) => void;
  updateLessonPlan: (id: string, title: string, objectives: string[], sessions: number, homework: string) => void;
  distributeLessonPlan: (id: string) => void;
  createTeachingNote: (
    note: Omit<TeachingNote, 'id' | 'teacherId' | 'status' | 'createdAt' | 'updatedAt'>
  ) => string;
  updateTeachingNote: (id: string, updates: Partial<TeachingNote>) => void;
  submitTeachingNote: (
    note: Omit<TeachingNote, 'id' | 'teacherId' | 'status' | 'createdAt' | 'updatedAt'>
  ) => void;
  submitTeachingNoteForApproval: (id: string) => void;
  upsertStudentGradeEntry: (
    entry: Omit<StudentGradeEntry, 'id' | 'teacherId' | 'recordedAt'> & { id?: string }
  ) => void;
  deleteStudentGradeEntry: (id: string) => void;
  recalculateStudentGpaFromGrades: (studentId: string) => void;
  addTeacherResource: (
    resource: Omit<TeacherResource, 'id' | 'teacherId' | 'downloads' | 'createdAt'>
  ) => void;
  respondToTeacherCheckIn: (id: string, response: string) => void;
  sendParentMessage: (
    msg: Omit<ParentMessage, 'id' | 'teacherId' | 'sentAt'>
  ) => void;
  addStudentFeedback: (
    feedback: Omit<TeacherFeedback, 'id' | 'teacherId' | 'direction' | 'authorName' | 'date'>
  ) => void;
  addNotification: (title: string, description: string, type: AppNotification['type']) => void;
  markNotificationAsRead: (id: string) => void;
  markNotificationAsUnread: (id: string) => void;
  dismissNotification: (id: string) => void;
  clearNotifications: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeRole, setActiveRoleState] = useState<string>('login');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  
  // Collections state
  const [schools, setSchools] = useState<School[]>(mockSchools);
  const [teachers, setTeachers] = useState<Teacher[]>(mockTeachers);
  const [students, setStudents] = useState<Student[]>(mockStudents);
  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>(mockLessonPlans);
  const [assessments, setAssessments] = useState<Assessment[]>(mockAssessments);
  const [attendance, setAttendance] = useState<Attendance[]>(mockAttendanceRecords);
  const [trainings, setTrainings] = useState<TeacherTraining[]>(mockTrainingPrograms);
  const [checkIns, setCheckIns] = useState<SchoolCheckIn[]>(mockCheckIns);
  const [departments, setDepartments] = useState<Department[]>(mockDepartments);
  const [classes, setClasses] = useState<SchoolClass[]>(mockClasses);
  const [exams, setExams] = useState<ExamPaper[]>(mockExams);
  const [trainingMaterials, setTrainingMaterials] = useState<TrainingMaterial[]>(mockTrainingMaterials);
  const [teachingNotes, setTeachingNotes] = useState<TeachingNote[]>(mockTeachingNotes);
  const [teacherResources, setTeacherResources] = useState<TeacherResource[]>(mockTeacherResources);
  const [teacherFeedbacks, setTeacherFeedbacks] = useState<TeacherFeedback[]>(mockTeacherFeedbacks);
  const [parentMessages, setParentMessages] = useState<ParentMessage[]>(mockParentMessages);
  const [teacherCheckInPrompts, setTeacherCheckInPrompts] =
    useState<TeacherCheckInPrompt[]>(mockTeacherCheckInPrompts);
  const [studentGradeEntries, setStudentGradeEntries] =
    useState<StudentGradeEntry[]>(mockStudentGradeEntries);

  const [notifications, setNotifications] = useState<AppNotification[]>([
    { id: 'not-1', title: 'New Lesson Plan Submitted', description: 'Martha Feyissa submitted a Biology lesson plan for approval.', timestamp: '10 mins ago', read: false, type: 'request' },
    { id: 'not-2', title: 'National Exam Schedule', description: 'MOE published Grade 12 National Exam timelines for June.', timestamp: '1 hour ago', read: false, type: 'info' },
    { id: 'not-3', title: 'Low Attendance Alert', description: 'Student Yonas Kassa attendance has dropped below 86%.', timestamp: '2 hours ago', read: false, type: 'alert' },
  ]);

  // Handle active role sync
  const setActiveRole = (role: string) => {
    setActiveRoleState(role);
    if (typeof window !== 'undefined') {
      localStorage.setItem('pts-active-role', role);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedRole = localStorage.getItem('pts-active-role');
      const savedTheme = localStorage.getItem('pts-active-theme');
      if (savedRole) setActiveRoleState(savedRole);
      if (savedTheme === 'light' || savedTheme === 'dark') setTheme(savedTheme);
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('pts-active-theme', nextTheme);
    }
  };

  // Add document class support for themes
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // Actions
  const addSchool = (schoolData: Omit<School, 'id' | 'code' | 'studentsCount' | 'teachersCount' | 'status' | 'gps'>) => {
    const nextCode = `SCH-${100 + schools.length}`;
    const newSchool: School = {
      ...schoolData,
      id: `sch-${schools.length + 1}`,
      code: nextCode,
      studentsCount: 0,
      teachersCount: 0,
      status: 'Active',
      gps: '9.0320° N, 38.7489° E', // Default Addis Ababa coordinates
    };
    setSchools([newSchool, ...schools]);
    addNotification('New School Registered', `School ${newSchool.name} registered under code ${newSchool.code}.`, 'success');
  };

  const toggleSchoolStatus = (id: string) => {
    setSchools(
      schools.map((sch) => {
        if (sch.id === id) {
          const nextStatus = sch.status === 'Active' ? 'Suspended' : 'Active';
          addNotification(
            `School ${nextStatus}`,
            `School ${sch.name} status updated to ${nextStatus}.`,
            nextStatus === 'Active' ? 'success' : 'alert'
          );
          return { ...sch, status: nextStatus };
        }
        return sch;
      })
    );
  };

  const approveLessonPlan = (id: string, role: 'dept' | 'school', comments: string) => {
    setLessonPlans(
      lessonPlans.map((lp) => {
        if (lp.id === id) {
          const isDept = role === 'dept';
          const nextStatus = isDept ? 'Pending School Head' : 'Approved';
          addNotification(
            'Lesson Plan Updated',
            `Lesson plan "${lp.title}" was approved by ${isDept ? 'Department Head' : 'School Head'}.`,
            'success'
          );
          return {
            ...lp,
            status: nextStatus,
            deptComments: isDept ? comments : lp.deptComments,
            schoolHeadComments: !isDept ? comments : lp.schoolHeadComments,
            version: lp.version + 1,
          };
        }
        return lp;
      })
    );
  };

  const rejectLessonPlan = (id: string, role: 'dept' | 'school', comments: string) => {
    setLessonPlans(
      lessonPlans.map((lp) => {
        if (lp.id === id) {
          addNotification(
            'Lesson Plan Rejected',
            `Lesson plan "${lp.title}" was rejected by ${role === 'dept' ? 'Department Head' : 'School Head'}.`,
            'alert'
          );
          return {
            ...lp,
            status: 'Rejected',
            deptComments: role === 'dept' ? comments : lp.deptComments,
            schoolHeadComments: role === 'school' ? comments : lp.schoolHeadComments,
            version: lp.version + 1,
          };
        }
        return lp;
      })
    );
  };

  const approveAssessment = (id: string, comments: string) => {
    setAssessments(
      assessments.map((asm) => {
        if (asm.id === id) {
          addNotification('Assessment Approved', `Assessment "${asm.title}" has been approved for classroom use.`, 'success');
          return { ...asm, status: 'Approved', comments };
        }
        return asm;
      })
    );
  };

  const rejectAssessment = (id: string, comments: string) => {
    setAssessments(
      assessments.map((asm) => {
        if (asm.id === id) {
          addNotification('Assessment Draft Rejected', `Assessment "${asm.title}" was sent back for edits.`, 'alert');
          return { ...asm, status: 'Rejected', comments };
        }
        return asm;
      })
    );
  };

  const createLessonPlan = (planData: Omit<LessonPlan, 'id' | 'teacherId' | 'teacherName' | 'status' | 'version' | 'createdAt'>) => {
    const teacher = teachers.find((t) => t.id === DEMO_TEACHER_ID);
    const newPlan: LessonPlan = {
      ...planData,
      id: `lp-${lessonPlans.length + 1}`,
      teacherId: DEMO_TEACHER_ID,
      teacherName: teacher?.name ?? 'Martha Feyissa',
      status: 'Pending Dept Head',
      version: 1,
      createdAt: new Date().toISOString(),
    };
    setLessonPlans([newPlan, ...lessonPlans]);
    addNotification('Lesson Plan Submitted', `Lesson plan "${newPlan.title}" has been submitted for approval.`, 'info');
  };

  const createAssessment = (asmData: Omit<Assessment, 'id' | 'teacherId' | 'teacherName' | 'status' | 'createdAt'>) => {
    const teacher = teachers.find((t) => t.id === DEMO_TEACHER_ID);
    const newAsm: Assessment = {
      ...asmData,
      id: `asm-${assessments.length + 1}`,
      teacherId: DEMO_TEACHER_ID,
      teacherName: teacher?.name ?? 'Martha Feyissa',
      status: 'Pending Dept Head',
      createdAt: new Date().toISOString(),
    };
    setAssessments([newAsm, ...assessments]);
    addNotification('Assessment Submitted', `Assessment draft "${newAsm.title}" submitted to department head.`, 'info');
  };

  const saveAttendance = (records: { studentId: string; status: 'Present' | 'Absent' | 'Late'; remarks?: string }[]) => {
    const newRecords: Attendance[] = records.map((rec, idx) => {
      const student = students.find((s) => s.id === rec.studentId);
      return {
        id: `att-new-${attendance.length + idx}`,
        studentId: rec.studentId,
        studentName: student ? student.name : 'Unknown Student',
        grade: student ? student.grade : 'Grade 9',
        section: student ? student.section : 'A',
        date: new Date().toISOString().split('T')[0],
        status: rec.status,
        remarks: rec.remarks,
      };
    });
    setAttendance([...newRecords, ...attendance]);
    
    // Update student attendance metrics
    setStudents(
      students.map((std) => {
        const matchingRec = records.find((r) => r.studentId === std.id);
        if (matchingRec) {
          const totalDays = 20; // Simulated historical baseline
          const presentDays = Math.round((std.attendanceRate / 100) * totalDays);
          const newPresentDays = matchingRec.status === 'Present' ? presentDays + 1 : presentDays;
          const nextRate = parseFloat((((newPresentDays) / (totalDays + 1)) * 100).toFixed(1));
          return { ...std, attendanceRate: nextRate };
        }
        return std;
      })
    );

    addNotification('Attendance Logs Recorded', `Daily attendance successfully recorded for ${records.length} students.`, 'success');
  };

  const enrollStudent = (studentData: Omit<Student, 'id' | 'studentId' | 'gpa' | 'attendanceRate' | 'status'>) => {
    const stdId = `PTS/${Math.floor(1000 + Math.random() * 9000)}/18`;
    const newStudent: Student = {
      ...studentData,
      id: `std-${students.length + 1}`,
      studentId: stdId,
      gpa: 0.0, // initial
      attendanceRate: 100.0, // initial
      status: 'Active',
    };
    setStudents([...students, newStudent]);
    addNotification('Student Enrolled', `Student ${newStudent.name} enrolled with ID ${newStudent.studentId}.`, 'success');
  };

  const updateStudent = (id: string, updates: Partial<Student>) => {
    setStudents(
      students.map((std) => {
        if (std.id === id) {
          const updated = { ...std, ...updates };
          addNotification('Student Record Updated', `Profile for ${updated.name} was saved.`, 'success');
          return updated;
        }
        return std;
      })
    );
  };

  const updateStudentGrade = (id: string, newGpa: number) => {
    setStudents(
      students.map((std) => {
        if (std.id === id) {
          addNotification('Grades Updated', `Syllabus grades finalized for ${std.name}. GPA set to ${newGpa}.`, 'success');
          return { ...std, gpa: newGpa };
        }
        return std;
      })
    );
  };

  const addTeacher = (teacherData: Omit<Teacher, 'id' | 'status' | 'trainingProgress'>) => {
    const newTch: Teacher = {
      ...teacherData,
      id: `tch-${teachers.length + 1}`,
      status: 'Active',
      trainingProgress: 0,
    };
    setTeachers([...teachers, newTch]);

    // Update the school's teachersCount
    setSchools(
      schools.map((sch) => {
        if (sch.id === teacherData.schoolId) {
          return { ...sch, teachersCount: sch.teachersCount + 1 };
        }
        return sch;
      })
    );

    addNotification('Teacher Onboarded', `Ato/W/ro ${newTch.name} successfully registered.`, 'success');
  };

  const updateTeacher = (id: string, updates: Partial<Teacher>) => {
    setTeachers(
      teachers.map((tch) => {
        if (tch.id === id) {
          const updated = { ...tch, ...updates };
          addNotification('Instructor Record Updated', `Profile for ${updated.name} was saved.`, 'success');
          return updated;
        }
        return tch;
      })
    );
  };

  const toggleTeacherStatus = (id: string) => {
    setTeachers(
      teachers.map((tch) => {
        if (tch.id === id) {
          const nextStatus = tch.status === 'Active' ? 'On Leave' : 'Active';
          addNotification(
            `Teacher Status Updated`,
            `Instructor ${tch.name} is now marked as ${nextStatus}.`,
            nextStatus === 'Active' ? 'success' : 'alert'
          );
          return { ...tch, status: nextStatus };
        }
        return tch;
      })
    );
  };

  const addDepartment = (name: string, headName: string) => {
    const newDept: Department = {
      id: `dept-${departments.length + 1}`,
      name,
      headName,
      teachersCount: 0,
      subjectsCount: 0,
      status: 'Active',
    };
    setDepartments([...departments, newDept]);
    addNotification('Department Created', `Department "${name}" registered with head ${headName}.`, 'success');
  };

  const addClass = (name: string, grade: string, section: string, homeroomTeacher: string) => {
    const newCls: SchoolClass = {
      id: `cls-${classes.length + 1}`,
      name,
      grade,
      section,
      homeroomTeacher,
      studentsCount: 0,
    };
    setClasses([...classes, newCls]);
    addNotification('Class Created', `Class section "${name}" successfully added under homeroom ${homeroomTeacher}.`, 'success');
  };

  const approveExam = (id: string, comments: string) => {
    setExams(
      exams.map((ex) => {
        if (ex.id === id) {
          addNotification('Exam Paper Approved', `Exam blueprint "${ex.title}" has been signed off by the Principal.`, 'success');
          return { ...ex, status: 'Approved', comments };
        }
        return ex;
      })
    );
  };

  const rejectExam = (id: string, comments: string) => {
    setExams(
      exams.map((ex) => {
        if (ex.id === id) {
          addNotification('Exam Paper Rejected', `Exam blueprint "${ex.title}" was rejected and returned to the department head.`, 'alert');
          return { ...ex, status: 'Rejected', comments };
        }
        return ex;
      })
    );
  };

  const addTrainingMaterial = (title: string, resourceUrl: string, category: string) => {
    const newMat: TrainingMaterial = {
      id: `tm-${trainingMaterials.length + 1}`,
      title,
      resourceUrl,
      category,
      uploadedAt: new Date().toISOString().split('T')[0],
    };
    setTrainingMaterials([...trainingMaterials, newMat]);
    addNotification('Training Resource Added', `Professional development resource "${title}" published.`, 'success');
  };

  const addCheckInTemplate = (title: string, type: 'Teacher Wellness' | 'Student Satisfaction' | 'Parent Feedback', respondentName: string, rating: number, comment: string) => {
    const newCheckIn: SchoolCheckIn = {
      id: `ch-gen-${Date.now()}`,
      title,
      type,
      respondentName,
      rating,
      comment,
      date: new Date().toISOString().split('T')[0],
    };
    setCheckIns([newCheckIn, ...checkIns]);
    addNotification('Wellness Survey Created', `New wellness check-in survey template "${title}" has been created.`, 'success');
  };

  const updateLessonPlan = (id: string, title: string, objectives: string[], sessions: number, homework: string) => {
    setLessonPlans(
      lessonPlans.map((lp) => {
        if (lp.id === id) {
          addNotification('Lesson Plan Updated', `Lesson plan "${title}" has been revised and resubmitted for review.`, 'info');
          return {
            ...lp,
            title,
            objectives,
            sessions,
            homework,
            status: 'Pending School Head' as const,
            version: lp.version + 1,
          };
        }
        return lp;
      })
    );
  };

  const createTeachingNote = (
    noteData: Omit<TeachingNote, 'id' | 'teacherId' | 'status' | 'createdAt' | 'updatedAt'>
  ) => {
    const id = `tn-${Date.now()}`;
    const today = new Date().toISOString().split('T')[0];
    const newNote: TeachingNote = {
      ...noteData,
      id,
      teacherId: DEMO_TEACHER_ID,
      status: 'Draft',
      createdAt: today,
      updatedAt: today,
    };
    setTeachingNotes([newNote, ...teachingNotes]);
    return id;
  };

  const updateTeachingNote = (id: string, updates: Partial<TeachingNote>) => {
    setTeachingNotes(
      teachingNotes.map((n) =>
        n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString().split('T')[0] } : n
      )
    );
  };

  const submitTeachingNote = (
    noteData: Omit<TeachingNote, 'id' | 'teacherId' | 'status' | 'createdAt' | 'updatedAt'>
  ) => {
    const id = createTeachingNote(noteData);
    submitTeachingNoteForApproval(id);
  };

  const submitTeachingNoteForApproval = (id: string) => {
    setTeachingNotes((prev) =>
      prev.map((n) => {
        if (n.id === id) {
          addNotification(
            'Teaching Notes Submitted',
            `"${n.title}" sent to department head for approval.`,
            'request'
          );
          return { ...n, status: 'Pending Dept Head', updatedAt: new Date().toISOString().split('T')[0] };
        }
        return n;
      })
    );
  };

  const applyGpaFromGradeEntries = (studentId: string, entries: StudentGradeEntry[]) => {
    const studentEntries = entries.filter((e) => e.studentId === studentId);
    if (studentEntries.length === 0) return;
    const totalWeight = studentEntries.reduce((a, e) => a + e.weight, 0);
    if (totalWeight === 0) return;
    const weighted = studentEntries.reduce((a, e) => {
      const pct = e.maxScore > 0 ? (e.score / e.maxScore) * 100 : 0;
      return a + pct * e.weight;
    }, 0);
    const gpa = percentToGpa(weighted / totalWeight);
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, gpa: parseFloat(gpa.toFixed(2)) } : s))
    );
  };

  const upsertStudentGradeEntry = (
    entryData: Omit<StudentGradeEntry, 'id' | 'teacherId' | 'recordedAt'> & { id?: string }
  ) => {
    const today = new Date().toISOString().split('T')[0];
    setStudentGradeEntries((prev) => {
      let next: StudentGradeEntry[];
      if (entryData.id) {
        next = prev.map((e) =>
          e.id === entryData.id
            ? { ...e, ...entryData, teacherId: DEMO_TEACHER_ID, recordedAt: today }
            : e
        );
        addNotification('Grade Updated', `Updated ${entryData.title}.`, 'success');
      } else {
        const { id: _omit, ...rest } = entryData;
        const newEntry: StudentGradeEntry = {
          ...rest,
          id: `ge-${Date.now()}`,
          teacherId: DEMO_TEACHER_ID,
          recordedAt: today,
        };
        next = [newEntry, ...prev];
        addNotification('Grade Recorded', `Saved ${newEntry.title} for student.`, 'success');
      }
      applyGpaFromGradeEntries(entryData.studentId, next);
      return next;
    });
  };

  const deleteStudentGradeEntry = (id: string) => {
    setStudentGradeEntries((prev) => {
      const entry = prev.find((e) => e.id === id);
      const next = prev.filter((e) => e.id !== id);
      if (entry) applyGpaFromGradeEntries(entry.studentId, next);
      return next;
    });
    addNotification('Grade Removed', 'Assessment result deleted.', 'info');
  };

  const recalculateStudentGpaFromGrades = (studentId: string) => {
    applyGpaFromGradeEntries(studentId, studentGradeEntries);
  };

  const addTeacherResource = (
    resourceData: Omit<TeacherResource, 'id' | 'teacherId' | 'downloads' | 'createdAt'>
  ) => {
    const newResource: TeacherResource = {
      ...resourceData,
      id: `tres-${teacherResources.length + 1}`,
      teacherId: DEMO_TEACHER_ID,
      downloads: 0,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setTeacherResources([newResource, ...teacherResources]);
    addNotification('Resource Published', `"${newResource.title}" is now available to your classes.`, 'success');
  };

  const respondToTeacherCheckIn = (id: string, response: string) => {
    setTeacherCheckInPrompts(
      teacherCheckInPrompts.map((p) =>
        p.id === id
          ? { ...p, teacherResponse: response, respondedAt: new Date().toISOString().split('T')[0] }
          : p
      )
    );
    addNotification('Check-in Response Saved', 'Your survey response has been recorded.', 'success');
  };

  const sendParentMessage = (msgData: Omit<ParentMessage, 'id' | 'teacherId' | 'sentAt'>) => {
    const newMsg: ParentMessage = {
      ...msgData,
      id: `pm-${parentMessages.length + 1}`,
      teacherId: DEMO_TEACHER_ID,
      sentAt: new Date().toISOString().split('T')[0],
    };
    setParentMessages([newMsg, ...parentMessages]);
    addNotification(
      'Message Sent to Parent',
      `Your message regarding ${newMsg.studentName} was delivered to ${newMsg.parentName}.`,
      'success'
    );
  };

  const addStudentFeedback = (
    feedbackData: Omit<TeacherFeedback, 'id' | 'teacherId' | 'direction' | 'authorName' | 'date'>
  ) => {
    const teacher = teachers.find((t) => t.id === DEMO_TEACHER_ID);
    const newFeedback: TeacherFeedback = {
      ...feedbackData,
      id: `tfb-${teacherFeedbacks.length + 1}`,
      teacherId: DEMO_TEACHER_ID,
      direction: 'from_teacher',
      authorName: teacher?.name ?? 'Teacher',
      date: new Date().toISOString().split('T')[0],
    };
    setTeacherFeedbacks([newFeedback, ...teacherFeedbacks]);
    addNotification('Student Feedback Recorded', `Feedback saved for ${feedbackData.studentName ?? 'student'}.`, 'success');
  };

  const distributeLessonPlan = (id: string) => {
    setLessonPlans(
      lessonPlans.map((lp) => {
        if (lp.id === id && lp.status === 'Approved') {
          addNotification('Lesson Plan Distributed', `Approved lesson plan "${lp.title}" has been distributed to subject teachers.`, 'success');
          return lp;
        }
        return lp;
      })
    );
  };

  const addNotification = (title: string, description: string, type: AppNotification['type']) => {
    const newNotif: AppNotification = {
      id: `not-gen-${Math.random().toString(36).substr(2, 9)}`,
      title,
      description,
      timestamp: 'Just now',
      read: false,
      type,
    };
    setNotifications([newNotif, ...notifications]);
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(
      notifications.map((not) => (not.id === id ? { ...not, read: true } : not))
    );
  };

  const markNotificationAsUnread = (id: string) => {
    setNotifications(
      notifications.map((not) => (not.id === id ? { ...not, read: false } : not))
    );
  };

  const dismissNotification = (id: string) => {
    setNotifications(notifications.filter((not) => not.id !== id));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  return (
    <AppContext.Provider
      value={{
        activeRole,
        setActiveRole,
        theme,
        toggleTheme,
        schools,
        teachers,
        students,
        lessonPlans,
        assessments,
        attendance,
        trainings,
        checkIns,
        notifications,
        departments,
        classes,
        exams,
        trainingMaterials,
        teachingNotes,
        teacherResources,
        teacherFeedbacks,
        parentMessages,
        teacherCheckInPrompts,
        studentGradeEntries,
        addSchool,
        toggleSchoolStatus,
        approveLessonPlan,
        rejectLessonPlan,
        approveAssessment,
        rejectAssessment,
        createLessonPlan,
        createAssessment,
        saveAttendance,
        enrollStudent,
        updateStudent,
        updateStudentGrade,
        addTeacher,
        updateTeacher,
        toggleTeacherStatus,
        addDepartment,
        addClass,
        approveExam,
        rejectExam,
        addTrainingMaterial,
        addCheckInTemplate,
        updateLessonPlan,
        distributeLessonPlan,
        createTeachingNote,
        updateTeachingNote,
        submitTeachingNote,
        submitTeachingNoteForApproval,
        upsertStudentGradeEntry,
        deleteStudentGradeEntry,
        recalculateStudentGpaFromGrades,
        addTeacherResource,
        respondToTeacherCheckIn,
        sendParentMessage,
        addStudentFeedback,
        addNotification,
        markNotificationAsRead,
        markNotificationAsUnread,
        dismissNotification,
        clearNotifications,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
