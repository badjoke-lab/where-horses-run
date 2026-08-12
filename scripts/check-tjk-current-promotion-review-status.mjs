import assert from 'node:assert/strict';
import fs from 'node:fs';

const status = JSON.parse(fs.readFileSync('docs/timetable-source-tests/03-turkey/implementation-status-2026-08-12.json', 'utf8'));

assert.equal(status.schema_version, 'timetable-source-implementation-status-v1');
assert.equal(status.recorded_at, '2026-08-12');
assert.equal(status.work_id, 'WHR-CAL-TURKEY-TJK');
assert.ok(status.completed_implementation_units.includes('TJK-CURRENT-BOUNDED-ADAPTER-01'));
assert.equal(status.current_implementation_unit, 'TJK-CURRENT-PROMOTION-REVIEW-01');
assert.equal(status.status, 'current_promotion_review_packet_pending_human_review');

assert.equal(status.current_adapter_state.candidate_path, 'data/candidates/tjk-current-bounded-2026-08-11-v1.json');
assert.equal(status.current_adapter_state.candidate_meetings, 2);
assert.equal(status.current_adapter_state.candidate_races, 18);
assert.equal(status.current_adapter_state.candidate_rank, 'A');
assert.equal(status.current_adapter_state.technical_capability_rank, 'A+');
assert.equal(status.current_adapter_state.public_ceiling, 'A');
assert.equal(status.current_adapter_state.public_racecourse_identity_created, false);

assert.equal(status.current_review_state.review_path, 'data/candidates/tjk-current-2026-08-11-promotion-review-v1.json');
assert.equal(status.current_review_state.review_status, 'pending_human_review');
assert.equal(status.current_review_state.reviewer, null);
assert.equal(status.current_review_state.reviewed_at, null);
assert.equal(status.current_review_state.candidate_meetings, 2);
assert.equal(status.current_review_state.candidate_races, 18);
assert.equal(status.current_review_state.existing_public_identity_found, false);
assert.equal(status.current_review_state.identity_registration_required_for_promotion, true);
assert.deepEqual(status.current_review_state.identity_targets, [
  { source_venue_id: '5', source_venue_label: 'Ankara' },
  { source_venue_id: '9', source_venue_label: 'Kocaeli' },
]);
assert.equal(status.current_review_state.approval_effect, 'none_until_explicit_human_approval');

for (const key of [
  'canonical_written',
  'public_projection_written',
  'public_racecourse_identity_written',
  'automatic_approval',
  'automatic_merge',
  'deployment_performed',
]) {
  assert.equal(status.publication_boundary[key], false, `pending TJK promotion review boundary differs: ${key}`);
}
assert.equal(status.publication_boundary.current_candidate_generated, true);
assert.match(status.next_gate, /^Explicit human review/);
assert.match(status.next_gate, /explicit approval/);

console.log('TJK_CURRENT_PROMOTION_REVIEW_STATUS: pass');
console.log('CURRENT_UNIT: TJK-CURRENT-PROMOTION-REVIEW-01');
console.log('REVIEW_STATUS: pending_human_review');
console.log('IDENTITY_REGISTRATION_REQUIRED: true');
console.log('PUBLICATION_EFFECT: none');
