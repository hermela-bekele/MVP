import assert from 'node:assert/strict';
import { test } from 'node:test';
import { canCreateCommunity } from './communityTypes.js';

test('canCreateCommunity: school-head, moe, head-of-academics, department-head allowed', () => {
  assert.equal(canCreateCommunity('school-head'), true);
  assert.equal(canCreateCommunity('moe'), true);
  assert.equal(canCreateCommunity('head-of-academics'), true);
  assert.equal(canCreateCommunity('department-head'), true);
});

test('canCreateCommunity: teacher, student, parent are NOT allowed (CO-001)', () => {
  assert.equal(canCreateCommunity('teacher'), false);
  assert.equal(canCreateCommunity('student'), false);
  assert.equal(canCreateCommunity('parent'), false);
});

test('canCreateCommunity: missing/unknown role is not allowed', () => {
  assert.equal(canCreateCommunity(undefined), false);
  assert.equal(canCreateCommunity(null), false);
  assert.equal(canCreateCommunity('registrar'), false);
});
