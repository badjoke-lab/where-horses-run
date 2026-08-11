import fs from 'node:fs';

const status = JSON.parse(fs.readFileSync('docs/timetable-source-tests/03-turkey/implementation-status-2026-08-11.json', 'utf8'));
const assert = (condition, message) => { if (!condition) throw new Error(message); };

assert(status.schema_version === 'timetable-source-implementation-status-v1', 'TJK implementation-status schema differs');
assert(status.recorded_at === '2026-08-11', 'TJK implementation-status date differs');
assert(status.country_id === 'turkey', 'TJK implementation-status country differs');
assert(status.authority_id === 'turkiye-jokey-kulubu', 'TJK implementation-status authority differs');
assert(status.system_id === 'tjk-national-racing-system', 'TJK implementation-status system differs');
assert(status.work_id === 'WHR-CAL-TURKEY-TJK', 'TJK implementation-status Work ID differs');
assert(status.completed_implementation_unit === 'TJK-BOUNDED-ADAPTER-01', 'TJK completed unit differs');
assert(status.current_implementation_unit === 'TJK-BOUNDED-ADAPTER-01', 'TJK current unit differs');
assert(status.status === 'bounded_adapter_candidate_ready_for_human_review', 'TJK implementation status differs');
assert(status.source_state?.source_status === 'verified', 'TJK implementation source status differs');
assert(status.source_state?.technical_capability_rank === 'A+', 'TJK implementation technical rank differs');
assert(status.source_state?.public_ceiling === 'A', 'TJK implementation public ceiling differs');
assert(status.source_state?.current_daily_route === '/TR/YarisSever/Info/Page/GunlukYarisProgrami', 'TJK implementation current daily route differs');
assert(status.source_state?.superseded_daily_route === '/TR/YarisSever/Info/Sehir/GunlukYarisProgrami', 'TJK implementation superseded daily route differs');
assert(status.source_state?.current_day_daily_body_verified === false, 'TJK implementation status must not claim current-day daily body evidence');
assert(status.adapter_state?.adapter_id === 'tjk-bounded-reviewed-fixture-v1', 'TJK adapter id differs');
assert(status.adapter_state?.candidate_path === 'data/candidates/tjk-bounded-reviewed-fixture-v1.json', 'TJK candidate path differs');
assert(status.adapter_state?.fixture_meetings === 3, 'TJK fixture meeting count differs');
assert(status.adapter_state?.fixture_races === 23, 'TJK fixture race count differs');
assert(status.adapter_state?.technical_capability_rank === 'A+', 'TJK adapter technical rank differs');
assert(status.adapter_state?.public_ceiling === 'A', 'TJK adapter public ceiling differs');
assert(status.adapter_state?.review_status === 'pending', 'TJK adapter review status differs');
assert(status.adapter_state?.publication_effect === 'none', 'TJK adapter publication effect differs');
assert(status.publication_boundary?.candidate_generated === true, 'TJK candidate generation state differs');
for (const key of ['canonical_written', 'public_projection_written', 'automatic_approval', 'automatic_merge', 'deployment_performed']) {
  assert(status.publication_boundary?.[key] === false, `TJK implementation publication boundary differs: ${key}`);
}
assert(typeof status.next_gate === 'string' && status.next_gate.includes('Human-review'), 'TJK next gate must remain human-review-bound');

console.log('TJK_IMPLEMENTATION_STATUS: pass');
console.log('COMPLETED_UNIT: TJK-BOUNDED-ADAPTER-01');
console.log('CANDIDATE_MEETINGS: 3');
console.log('CANDIDATE_RACES: 23');
console.log('PUBLICATION_EFFECT: none');
