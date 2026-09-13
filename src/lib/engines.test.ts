import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { engineLabel, engineDescription } from './engines.js';
import { ETHIOPIAN_REGIONS } from './mockData.js';

test('school-head uses a role-aware regulatory engine label', () => {
  assert.equal(engineLabel('regulatory', 'school-head'), 'Regulatory & Resource Engine');
});

test('moe uses a role-aware curriculum engine label and description', () => {
  assert.equal(engineLabel('curriculum', 'moe'), 'Resource & Communication');
  assert.equal(engineDescription('curriculum', 'moe'), 'School communication and resource uploading engine.');
});

test('EmployeeManagement no longer restricts the MOE replacement button to a public-school type', () => {
  const source = readFileSync(
    path.join(process.cwd(), 'src/components/dashboard/school-head/EmployeeManagement.tsx'),
    'utf8',
  );

  assert.equal(source.includes("const isPublicSchool = school?.type === 'Public';"), false);
  assert.equal(source.includes("{isPublicSchool && !readOnly && ("), false);
});

test('the shared region catalog exposes all Ethiopian regions', () => {
  assert.deepEqual(ETHIOPIAN_REGIONS.map((r) => r.name).sort(), [
    'Addis Ababa',
    'Afar',
    'Amhara',
    'Benishangul-Gumuz',
    'Dire Dawa',
    'Gambela',
    'Harari',
    'Oromia',
    'Sidama',
    'Somali',
    'SNNPR',
    'Tigray',
  ].sort());
});
