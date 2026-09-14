import test from 'node:test';
import assert from 'node:assert/strict';
import { displayAcademicYearLabel } from './academicYear';

test('displayAcademicYearLabel removes the E.C. suffix without altering ordinary labels', () => {
  assert.equal(displayAcademicYearLabel('2018/2019 E.C.'), '2018/2019');
  assert.equal(displayAcademicYearLabel('2025/26'), '2025/26');
});
