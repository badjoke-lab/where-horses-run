import fs from 'node:fs';

const status = JSON.parse(fs.readFileSync('docs/timetable-source-tests/03-turkey/implementation-status-2026-08-11.json', 'utf8'));
const assert = (condition, message) => { if (!condition) throw new Error(message); };

assert(status.schema_version === 'timetable-source-implementation-status-v1', 'TJK implementation-status schema differs');
assert(status.recorded_at === '2026-08-11', 'TJK implementation-status date differs');
assert(status.country_id === 'turkey', 'TJK implementation-status country differs');
assert(status.authority_id === 'turkiye-jokey-kulubu', 'TJK implementation-status authority differs');
assert(status.system_id === 'tjk-national-racing-system', 'TJK implementation-status system differs');
assert(status.work_id === 'WHR-CAL-TURKEY-TJK', 'TJK implementation-status Work ID differs');
assert(status.completed_implementation_unit === 'TJK-SOURCE-REVALIDATION-01', 'TJK completed unit differs');
assert(status.current_implementation_unit === 'TJK-BOUNDED-ADAPTER-01', 'TJK current unit differs');
assert(status.status === 'source_revalidated_adapter_not_started', 'TJK implementation status differs');
assert(status.source_state?.source_status === 'verified', 'TJK implementation source status differs');
assert(status.source_state?.technical_capability_rank === 'A+', 'TJK implementation technical rank differs');
assert(status.source_state?.public_ceiling === 'A', 'TJK implementation public ceiling differs');
assert(status.source_state?.current_daily_route === '/TR/YarisSever/Info/Page/GunlukYarisProgrami', 'TJK implementation current daily route differs');
assert(status.source_state?.superseded_daily_route === '/TR/YarisSever/Info/Sehir/GunlukYarisProgrami', 'TJK implementation superseded daily route differs');
assert(status.source_state?.current_day_daily_body_verified === false, 'TJK implementation status must not claim current-day daily body evidence');
for (const [key, value] of Object.entries(status.publication_boundary ?? {})) {
  assert(value === false, `TJK implementation publication boundary differs: ${key}`);
}
assert(typeof status.next_gate === 'string' && status.next_gate.includes('TJK-BOUNDED-ADAPTER-01'), 'TJK next gate differs');

console.log('TJK_IMPLEMENTATION_STATUS: pass');
console.log('CURRENT_UNIT: TJK-BOUNDED-ADAPTER-01');
console.log('PUBLICATION_EFFECT: none');
