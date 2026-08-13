import assert from 'node:assert/strict';
import fs from 'node:fs';

const status = JSON.parse(fs.readFileSync('docs/timetable-source-tests/03-turkey/implementation-status-2026-08-12.json', 'utf8'));

assert.equal(status.schema_version, 'timetable-source-implementation-status-v1');
assert.equal(status.recorded_at, '2026-08-12');
assert.equal(status.work_id, 'WHR-CAL-TURKEY-TJK');
assert.ok(status.completed_implementation_units.includes('TJK-CURRENT-BOUNDED-ADAPTER-01'));
assert.ok(status.completed_implementation_units.includes('TJK-CURRENT-PROMOTION-REVIEW-01'));
assert.equal(status.current_implementation_unit, 'TJK-CURRENT-IDENTITY-AND-TIMETABLE-PROMOTION-01');
assert.ok(['current_review_approved_promotion_ready', 'current_identity_and_timetable_promotion_generated_pending_merge'].includes(status.status));

assert.equal(status.current_adapter_state.candidate_path, 'data/candidates/tjk-current-bounded-2026-08-11-v1.json');
assert.equal(status.current_adapter_state.candidate_meetings, 2);
assert.equal(status.current_adapter_state.candidate_races, 18);
assert.equal(status.current_adapter_state.candidate_rank, 'A');
assert.equal(status.current_adapter_state.technical_capability_rank, 'A+');
assert.equal(status.current_adapter_state.public_ceiling, 'A');

assert.equal(status.current_review_state.review_path, 'data/candidates/tjk-current-2026-08-11-promotion-review-v1.json');
assert.equal(status.current_review_state.review_status, 'approved');
assert.equal(status.current_review_state.reviewer, 'badjoke-lab');
assert.equal(status.current_review_state.reviewed_at, '2026-08-12T06:29:00Z');
assert.equal(status.current_review_state.candidate_meetings, 2);
assert.equal(status.current_review_state.candidate_races, 18);
assert.equal(status.current_review_state.existing_public_identity_found, false);
assert.equal(status.current_review_state.identity_registration_required_for_promotion, true);
assert.deepEqual(status.current_review_state.identity_targets, [
  { source_venue_id: '5', source_venue_label: 'Ankara', public_racecourse_id: 'ankara-racecourse' },
  { source_venue_id: '9', source_venue_label: 'Kocaeli', public_racecourse_id: 'kocaeli-racecourse' },
]);
assert.equal(status.current_review_state.approval_effect, 'authorizes_separate_reviewed_identity_and_timetable_promotion_unit');
assert.equal(status.current_promotion_state.identity_review_path, 'data/static/tjk-2026-08-11-reviewed-public-timetable-identities-v1.json');
assert.equal(status.current_promotion_state.approved_candidate_path, 'data/candidates/tjk-current-2026-08-11-approved.json');
assert.deepEqual(status.current_promotion_state.canonical_meeting_ids, ['tjk-ankara-racecourse-2026-08-11', 'tjk-kocaeli-racecourse-2026-08-11']);
assert.deepEqual(status.current_promotion_state.public_racecourse_ids, ['ankara-racecourse', 'kocaeli-racecourse']);

for (const key of ['automatic_approval', 'automatic_merge', 'deployment_performed']) {
  assert.equal(status.publication_boundary[key], false, `TJK promotion governance boundary differs: ${key}`);
}
assert.equal(status.publication_boundary.current_candidate_generated, true);
const writeFlags = ['canonical_written', 'public_projection_written', 'public_racecourse_identity_written'].map((key) => status.publication_boundary[key]);
assert.ok(writeFlags.every((value) => value === false) || writeFlags.every((value) => value === true), 'TJK promotion write flags must be all false or all true');
if (writeFlags[0]) {
  assert.equal(status.status, 'current_identity_and_timetable_promotion_generated_pending_merge');
  assert.equal(status.current_promotion_state.state, 'generated_and_validated_pending_merge');
} else {
  assert.equal(status.status, 'current_review_approved_promotion_ready');
  assert.equal(status.current_promotion_state.state, 'approved_inputs_ready_for_generation');
}

console.log('TJK_CURRENT_PROMOTION_REVIEW_STATUS: pass');
console.log('REVIEW_STATUS: approved');
console.log(`PROMOTION_WRITTEN: ${writeFlags[0]}`);
