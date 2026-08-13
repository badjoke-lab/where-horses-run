import fs from 'node:fs';
import assert from 'node:assert/strict';

const status = JSON.parse(fs.readFileSync('docs/timetable-source-tests/03-turkey/implementation-status-2026-08-12.json', 'utf8'));

assert.equal(status.schema_version, 'timetable-source-implementation-status-v1');
assert.equal(status.recorded_at, '2026-08-12');
assert.equal(status.country_id, 'turkey');
assert.equal(status.authority_id, 'turkiye-jokey-kulubu');
assert.equal(status.system_id, 'tjk-national-racing-system');
assert.equal(status.work_id, 'WHR-CAL-TURKEY-TJK');
assert.ok(status.completed_implementation_units.includes('TJK-CURRENT-PROGRAMME-EVIDENCE-01'));
assert.ok(status.completed_implementation_units.includes('TJK-CURRENT-BOUNDED-ADAPTER-01'));
assert.ok(['TJK-CURRENT-PROMOTION-REVIEW-01', 'TJK-CURRENT-IDENTITY-AND-TIMETABLE-PROMOTION-01'].includes(status.current_implementation_unit));

assert.equal(status.source_state.source_status, 'verified');
assert.equal(status.source_state.technical_capability_rank, 'A+');
assert.equal(status.source_state.public_ceiling, 'A');
assert.equal(status.source_state.current_programme_body_verified, true);
assert.equal(status.source_state.current_programme_date, '2026-08-11');
assert.equal(status.source_state.verified_meetings, 2);
assert.equal(status.source_state.verified_races, 18);

assert.equal(status.current_adapter_state.adapter_id, 'tjk-current-bounded-2026-08-11-v1');
assert.equal(status.current_adapter_state.candidate_path, 'data/candidates/tjk-current-bounded-2026-08-11-v1.json');
assert.equal(status.current_adapter_state.candidate_meetings, 2);
assert.equal(status.current_adapter_state.candidate_races, 18);
assert.equal(status.current_adapter_state.candidate_rank, 'A');
assert.equal(status.current_adapter_state.technical_capability_rank, 'A+');
assert.equal(status.current_adapter_state.public_ceiling, 'A');
assert.equal(status.current_adapter_state.identity_mode, 'source-authority-venue-only');
assert.equal(status.current_adapter_state.review_status, 'pending');
assert.equal(status.current_adapter_state.publication_effect, 'none');

assert.equal(status.publication_boundary.current_candidate_generated, true);
for (const key of ['automatic_approval', 'automatic_merge', 'deployment_performed']) {
  assert.equal(status.publication_boundary[key], false, `TJK governance boundary differs: ${key}`);
}

console.log('TJK_CURRENT_ADAPTER_STATUS: pass');
console.log('COMPLETED_UNIT: TJK-CURRENT-BOUNDED-ADAPTER-01');
console.log(`CURRENT_UNIT: ${status.current_implementation_unit}`);
console.log('CANDIDATE_MEETINGS: 2');
console.log('CANDIDATE_RACES: 18');
