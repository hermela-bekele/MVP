import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ApiError } from './api.js';
import { isClientRejection } from './offlineSync.js';

// TE-012: a 4xx server rejection must never be retried (it can't succeed unchanged) — it
// should be dropped instead of jamming the rest of the offline sync queue. Anything else
// (network failure, 5xx) is a connectivity/server issue worth stopping and retrying later.
test('isClientRejection: true for 4xx ApiError (drop, do not retry)', () => {
  assert.equal(isClientRejection(new ApiError('Bad request', 400)), true);
  assert.equal(isClientRejection(new ApiError('Forbidden', 403)), true);
  assert.equal(isClientRejection(new ApiError('Conflict', 409)), true);
  assert.equal(isClientRejection(new ApiError('Unprocessable', 422)), true);
  assert.equal(isClientRejection(new ApiError('Rate limited', 429)), true);
});

test('isClientRejection: false for 5xx ApiError (stop queue, retry later)', () => {
  assert.equal(isClientRejection(new ApiError('Server error', 500)), false);
  assert.equal(isClientRejection(new ApiError('Bad gateway', 502)), false);
  assert.equal(isClientRejection(new ApiError('Service unavailable', 503)), false);
});

test('isClientRejection: false for a plain network error (not an ApiError)', () => {
  assert.equal(isClientRejection(new TypeError('Failed to fetch')), false);
  assert.equal(isClientRejection(new Error('timeout')), false);
});
