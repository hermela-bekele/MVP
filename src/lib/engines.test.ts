import assert from 'node:assert/strict';
import { test } from 'node:test';
import { engineLabel } from './engines.js';

test('school-head uses a role-aware regulatory engine label', () => {
  assert.equal(engineLabel('regulatory', 'school-head'), 'Regulatory & Resource Engine');
});
