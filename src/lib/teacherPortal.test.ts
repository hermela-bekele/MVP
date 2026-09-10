import assert from 'node:assert/strict';
import { test } from 'node:test';
import { filterTeacherLessonPlans } from './teacherPortal.js';
import { getTeacherExperienceLevel } from './mockData.js';
import type { LessonPlan } from './mockData.js';

function plan(overrides: Partial<LessonPlan>): LessonPlan {
  return {
    id: 'lp-x',
    subject: 'Mathematics',
    grade: 'Grade 9',
    title: 'Untitled',
    sessions: 1,
    teacherId: 'tch-1',
    teacherName: 'Teacher',
    status: 'Approved',
    version: 1,
    objectives: [],
    activities: [],
    assessments: [],
    homework: '',
    createdAt: '2026-01-01',
    ...overrides,
  } as LessonPlan;
}

// TE: "lesson plan visibility only on Weekly Plans" — a teacher's list must show their own
// weekly/monthly plans plus any department-published annual plan for their subject, and
// nothing that belongs to another teacher or a different subject.
test('filterTeacherLessonPlans: shows own weekly plan in own subject', () => {
  const plans = [plan({ id: 'lp-1', teacherId: 'tch-1', planType: 'weekly', subject: 'Mathematics' })];
  const result = filterTeacherLessonPlans(plans, 'tch-1', { subjects: ['Mathematics'] });
  assert.equal(result.length, 1);
  assert.equal(result[0].id, 'lp-1');
});

test('filterTeacherLessonPlans: hides another teacher\'s weekly plan', () => {
  const plans = [plan({ id: 'lp-2', teacherId: 'tch-2', planType: 'weekly', subject: 'Mathematics' })];
  const result = filterTeacherLessonPlans(plans, 'tch-1', { subjects: ['Mathematics'] });
  assert.equal(result.length, 0);
});

test('filterTeacherLessonPlans: hides own weekly plan in a subject the teacher no longer teaches', () => {
  const plans = [plan({ id: 'lp-3', teacherId: 'tch-1', planType: 'weekly', subject: 'Biology' })];
  const result = filterTeacherLessonPlans(plans, 'tch-1', { subjects: ['Mathematics'] });
  assert.equal(result.length, 0);
});

test('filterTeacherLessonPlans: hides own weekly plan once rejected', () => {
  const plans = [plan({ id: 'lp-4', teacherId: 'tch-1', planType: 'weekly', subject: 'Mathematics', status: 'Rejected' })];
  const result = filterTeacherLessonPlans(plans, 'tch-1', { subjects: ['Mathematics'] });
  assert.equal(result.length, 0);
});

test('filterTeacherLessonPlans: shows a published annual (yearly) plan for the subject regardless of author id', () => {
  const plans = [
    plan({
      id: 'lp-5',
      teacherId: 'hod-1',
      planType: 'yearly',
      createdByRole: 'department-head',
      status: 'Approved',
      subject: 'Mathematics',
    }),
  ];
  const result = filterTeacherLessonPlans(plans, 'tch-1', { subjects: ['Mathematics'] });
  assert.equal(result.length, 1);
});

test('filterTeacherLessonPlans: hides an annual plan still pending department head publication', () => {
  const plans = [
    plan({
      id: 'lp-6',
      teacherId: 'hod-1',
      planType: 'yearly',
      createdByRole: 'department-head',
      status: 'Pending Dept Head',
      subject: 'Mathematics',
    }),
  ];
  const result = filterTeacherLessonPlans(plans, 'tch-1', { subjects: ['Mathematics'] });
  assert.equal(result.length, 0);
});

// TR-003: automatic professional pathway — never manually chosen by the teacher.
test('getTeacherExperienceLevel: under 2 years defaults to new (TIP)', () => {
  assert.equal(getTeacherExperienceLevel({ yearsOfExperience: 0, experienceOverride: null }), 'new');
  assert.equal(getTeacherExperienceLevel({ yearsOfExperience: 1, experienceOverride: null }), 'new');
});

test('getTeacherExperienceLevel: 2+ years defaults to experienced (STEP)', () => {
  assert.equal(getTeacherExperienceLevel({ yearsOfExperience: 2, experienceOverride: null }), 'experienced');
  assert.equal(getTeacherExperienceLevel({ yearsOfExperience: 15, experienceOverride: null }), 'experienced');
});

test('getTeacherExperienceLevel: HoD override always wins over years of experience', () => {
  assert.equal(getTeacherExperienceLevel({ yearsOfExperience: 20, experienceOverride: 'new' }), 'new');
  assert.equal(getTeacherExperienceLevel({ yearsOfExperience: 0, experienceOverride: 'experienced' }), 'experienced');
});
