import assert from 'node:assert/strict';
import {
  buildScheduledCandidateRunLog,
  RUN_LOG_STATUSES,
  SCHEDULED_CANDIDATE_RUN_LOG_SCHEMA,
  validateScheduledCandidateRunLog,
} from './timetable/scheduled-candidate-run-log.mjs';

const sha = 'a'.repeat(64);

const base = {
  country_id: 'turkey',
  authority_id: 'tjk',
  source_id: 'tjk-yarissever-daily-programme',
  adapter_id: 'tjk-current-future-candidates',
  adapter_version: 'test-sha',
  run_mode: 'dry_run',
  window_start: '2026-08-16',
  window_end: '2026-08-22',
  timezone: 'Europe/Istanbul',
  run_at: '2026-08-16T00:00:00Z',
  source_reference: 'https://www.tjk.org/TR/YarisSever/Info/Page/GunlukYarisProgrami',
  eligibility: 'eligible',
  run_id: 'contract-test-1',
  attempt: 1,
  started_at: '2026-08-16T00:00:01Z',
  completed_at: '2026-08-16T00:00:02Z',
};

function expectFailure(label, fn, pattern) {
  assert.throws(fn, pattern, label);
}

const success = buildScheduledCandidateRunLog({
  ...base,
  status: 'success_candidate_generated',
  candidate_count: 2,
  candidate_artifact_path: 'artifacts/turkey/2026-08-16_2026-08-22/candidate.json',
  candidate_sha256: sha,
  effects: {
    candidate_approved: true,
    promotion_invoked: true,
    canonical_write: true,
    public_projection_write: true,
    merge: true,
    deploy: true,
  },
});

assert.equal(success.schema, SCHEDULED_CANDIDATE_RUN_LOG_SCHEMA);
assert.equal(success.status, 'success_candidate_generated');
assert.equal(success.candidate.count, 2);
assert.deepEqual(success.effects, {
  human_review_required: true,
  candidate_approved: false,
  promotion_invoked: false,
  canonical_write: false,
  public_projection_write: false,
  merge: false,
  deploy: false,
});

const empty = buildScheduledCandidateRunLog({
  ...base,
  status: 'success_no_candidates',
  candidate_count: 0,
  candidate_artifact_path: 'artifacts/turkey/2026-08-16_2026-08-22/candidate.json',
  candidate_sha256: sha,
});
assert.equal(empty.candidate.count, 0);

const reviewedInput = buildScheduledCandidateRunLog({
  ...base,
  country_id: 'south-korea',
  authority_id: 'kra',
  source_id: 'kra-reviewed-calendar-plan',
  adapter_id: 'kra-calendar-plan-adapter',
  source_reference: 'reviewed-input:2026-kra-calendar-plan',
  eligibility: 'reviewed_input_only',
  status: 'success_candidate_generated',
  candidate_count: 1,
  candidate_artifact_path: 'artifacts/south-korea/2026-08-16_2026-08-22/candidate.json',
  candidate_sha256: sha,
});
assert.equal(reviewedInput.eligibility, 'reviewed_input_only');
assert.equal(reviewedInput.effects.public_projection_write, false);

const offseason = buildScheduledCandidateRunLog({
  ...base,
  eligibility: 'offseason',
  status: 'offseason_noop',
  reason_code: 'reviewed-season-window-closed',
});
assert.equal(offseason.candidate.artifact_path, null);

const blocked = buildScheduledCandidateRunLog({
  ...base,
  country_id: 'morocco',
  authority_id: 'sorec',
  source_id: 'sorec-programme-source-unverified',
  adapter_id: 'sorec-blocked',
  source_reference: 'official-racing-page:programme-route-unverified',
  eligibility: 'blocked',
  status: 'blocked_source',
  reason_code: 'official-programme-route-unverified',
});
assert.equal(blocked.country_id, 'morocco');
assert.equal(blocked.candidate.count, 0);
assert.equal(blocked.candidate.artifact_path, null);
assert.equal(blocked.effects.canonical_write, false);

const disabled = buildScheduledCandidateRunLog({
  ...base,
  eligibility: 'disabled',
  status: 'disabled_by_policy',
  reason_code: 'scheduled-execution-disabled',
});
assert.equal(disabled.effects.deploy, false);

for (const status of ['source_error', 'route_or_provenance_error', 'parse_error', 'candidate_validation_error']) {
  const log = buildScheduledCandidateRunLog({
    ...base,
    status,
    error_code: `test-${status}`,
    error_message: 'contract test failure',
  });
  assert.equal(log.status, status);
  assert.equal(log.candidate.artifact_path, null);
  assert.equal(log.effects.promotion_invoked, false);
}

assert.deepEqual(
  [...RUN_LOG_STATUSES].sort(),
  [
    'blocked_source',
    'candidate_validation_error',
    'disabled_by_policy',
    'offseason_noop',
    'parse_error',
    'route_or_provenance_error',
    'source_error',
    'success_candidate_generated',
    'success_no_candidates',
  ].sort(),
);

expectFailure(
  'generated success must contain records',
  () => buildScheduledCandidateRunLog({
    ...base,
    status: 'success_candidate_generated',
    candidate_count: 0,
    candidate_artifact_path: 'artifacts/turkey/empty.json',
    candidate_sha256: sha,
  }),
  /candidate\.count > 0/,
);

expectFailure(
  'blocked source cannot expose a candidate artifact',
  () => buildScheduledCandidateRunLog({
    ...base,
    eligibility: 'blocked',
    status: 'blocked_source',
    reason_code: 'unverified',
    candidate_count: 1,
    candidate_artifact_path: 'artifacts/morocco/guessed.json',
    candidate_sha256: sha,
  }),
  /must not report candidate records/,
);

expectFailure(
  'Morocco-style blocked state cannot be marked successful',
  () => buildScheduledCandidateRunLog({
    ...base,
    eligibility: 'blocked',
    status: 'success_no_candidates',
    candidate_artifact_path: 'artifacts/morocco/empty.json',
    candidate_sha256: sha,
  }),
  /requires eligible or reviewed_input_only/,
);

expectFailure(
  'success must use a relative output partition',
  () => buildScheduledCandidateRunLog({
    ...base,
    status: 'success_candidate_generated',
    candidate_count: 1,
    candidate_artifact_path: '../public/candidate.json',
    candidate_sha256: sha,
  }),
  /must not escape/,
);

expectFailure(
  'raw response data is forbidden',
  () => buildScheduledCandidateRunLog({
    ...base,
    status: 'source_error',
    error_code: 'http-500',
    raw_body: '<html>full source body</html>',
  }),
  /prohibited from scheduled run logs/,
);

expectFailure(
  'betting/result fields are forbidden recursively',
  () => buildScheduledCandidateRunLog({
    ...base,
    status: 'source_error',
    error_code: 'unsafe-payload',
    debug: { odds: ['2.4'], results: ['1'] },
  }),
  /prohibited from scheduled run logs/,
);

expectFailure(
  'public-write effects cannot be mutated after construction',
  () => validateScheduledCandidateRunLog({
    ...success,
    effects: { ...success.effects, public_projection_write: true },
  }),
  /effects\.public_projection_write must be false/,
);

expectFailure(
  'invalid execution ordering is rejected',
  () => buildScheduledCandidateRunLog({
    ...base,
    status: 'source_error',
    error_code: 'clock-order',
    started_at: '2026-08-16T00:00:03Z',
    completed_at: '2026-08-16T00:00:02Z',
  }),
  /execution\.started_at must be on or before execution\.completed_at/,
);

console.log('M5 scheduled candidate run-log check passed.');
console.log(`- schema: ${SCHEDULED_CANDIDATE_RUN_LOG_SCHEMA}`);
console.log(`- statuses: ${RUN_LOG_STATUSES.length}`);
console.log('- KRA reviewed-input-only, TJK eligible, SOREC blocked boundaries are representable');
console.log('- generated candidates remain human-review-required with all publication effects disabled');
console.log('- raw source, participant, betting, result, promotion and public-write leakage fail closed');
