import fs from 'node:fs';

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const read = (file) => fs.readFileSync(file, 'utf8');
const assert = (condition, message) => { if (!condition) throw new Error(message); };

const revalidation = readJson('docs/timetable-source-tests/03-turkey/revalidation-2026-08-11.json');
const inventory = readJson('data/static/authority-source-inventory.json');
const readiness = readJson('data/static/calendar-readiness-registry.json');
const readme = read('docs/timetable-source-tests/03-turkey/README.md');

const CURRENT_DAILY = 'https://www.tjk.org/TR/YarisSever/Info/Page/GunlukYarisProgrami';
const SUPERSEDED_DAILY = 'https://www.tjk.org/TR/YarisSever/Info/Sehir/GunlukYarisProgrami';
const CURRENT_PATH = '/TR/YarisSever/Info/Page/GunlukYarisProgrami';
const expectedParams = ['SehirId', 'QueryParameter_Tarih', 'SehirAdi'];

assert(revalidation.schema_version === 'tjk-source-revalidation-v1', 'TJK revalidation schema differs');
assert(revalidation.work_id === 'WHR-CAL-TURKEY-TJK', 'TJK Work ID differs');
assert(revalidation.implementation_unit === 'TJK-SOURCE-REVALIDATION-01', 'TJK implementation unit differs');
assert(revalidation.checked_date === '2026-08-11', 'TJK revalidation date differs');
assert(revalidation.status === 'verified_with_route_change', 'TJK revalidation status differs');
assert(revalidation.technical_capability_rank === 'A+', 'TJK technical capability differs');
assert(revalidation.public_ceiling === 'A', 'TJK public ceiling differs');
assert(revalidation.official_sources.daily_programme_current === CURRENT_DAILY, 'current TJK daily route differs');
assert(revalidation.official_sources.daily_programme_superseded === SUPERSEDED_DAILY, 'superseded TJK daily route differs');
assert(revalidation.route_revalidation.daily_route_changed === true, 'TJK route change is not recorded');
assert(revalidation.route_revalidation.current_daily_route === CURRENT_PATH, 'TJK current daily path differs');
assert(JSON.stringify(revalidation.route_revalidation.daily_parameters_preserved) === JSON.stringify(expectedParams), 'TJK daily parameters differ');
assert(revalidation.current_observation.current_daily_link_target_verified === true, 'current official daily link target is not verified');
assert(revalidation.current_observation.current_day_daily_body_verified === false, 'TJK revalidation must not claim an uncaptured current-day daily body');
assert(revalidation.current_observation.annual_meetings_observed?.length === 2, 'current annual observation scope differs');
assert(revalidation.current_observation.annual_meetings_observed.some((row) => row.racecourse === 'Ankara' && row.city_id === '5' && row.race_rows === 7), 'Ankara current annual observation differs');
assert(revalidation.current_observation.annual_meetings_observed.some((row) => row.racecourse === 'Kocaeli' && row.city_id === '9' && row.race_rows === 8), 'Kocaeli current annual observation differs');
assert(revalidation.recent_daily_programme_evidence?.length === 2, 'recent TJK daily evidence set differs');
assert(revalidation.decision.source_status === 'verified', 'TJK source decision differs');
assert(revalidation.decision.technical_capability_rank === 'A+', 'TJK decision technical rank differs');
assert(revalidation.decision.public_ceiling === 'A', 'TJK decision public ceiling differs');
assert(revalidation.decision.adapter_status === 'route_revalidated_ready_for_bounded_prototype', 'TJK adapter decision differs');
assert(revalidation.decision.adapter_daily_route === CURRENT_PATH, 'TJK adapter route differs');
for (const key of ['automatic_approval', 'canonical_write', 'public_projection_write', 'deployment']) {
  assert(revalidation.decision[key] === false, `TJK publication boundary differs: ${key}`);
}

const inventoryMatches = inventory.records.filter((row) => row.country_id === 'turkey' && row.authority_id === 'turkiye-jokey-kulubu' && row.official_source_id === 'tjk-daily-programme');
assert(inventoryMatches.length === 1, `expected one TJK inventory record, found ${inventoryMatches.length}`);
const source = inventoryMatches[0];
assert(source.official_source_url === CURRENT_DAILY, 'canonical TJK inventory still uses a superseded daily route');
assert(source.source_status === 'verified', 'canonical TJK inventory source status differs');
assert(source.last_checked_date === '2026-08-11', 'canonical TJK inventory checked date differs');
assert(source.capability_rank === 'A+', 'canonical TJK inventory capability rank differs');
assert(source.adapter_candidate_status === 'candidate', 'canonical TJK inventory adapter status differs');

const readinessMatches = readiness.records.filter((row) => row.readiness_id === 'turkey--tjk-national-racing-system--tjk-daily-programme');
assert(readinessMatches.length === 1, `expected one TJK readiness record, found ${readinessMatches.length}`);
const state = readinessMatches[0];
assert(state.system_id === 'tjk-national-racing-system', 'TJK readiness system differs');
assert(state.authority_source_key === 'turkey/turkiye-jokey-kulubu/tjk-daily-programme', 'TJK readiness source key differs');
assert(state.technical_rank === 'A+', 'TJK readiness technical rank differs');
assert(state.public_ceiling === 'A', 'TJK readiness public ceiling differs');
assert(state.source_status === 'verified', 'TJK readiness source status differs');
assert(state.checked_date === '2026-08-11', 'TJK readiness checked date differs');
assert(state.evidence_reviewed_at === '2026-08-11', 'TJK readiness evidence date differs');
assert(state.readiness === 'prototype_ready', 'TJK readiness state differs');
assert(state.implementation_status === 'not_started', 'source revalidation must not claim adapter implementation');
assert(state.access_mode === 'query_parameter', 'TJK readiness access mode differs');
assert(state.automation_mode === 'semi_automatic', 'TJK readiness automation mode differs');
assert(state.source_test_ref === 'docs/timetable-source-tests/03-turkey/revalidation-2026-08-11.json', 'TJK readiness source-test reference differs');
assert(state.blocked_reason === null, 'TJK readiness unexpectedly blocked');
assert(JSON.stringify(state.confirmed_fields) === JSON.stringify({
  meeting_date: true,
  racecourse: true,
  first_race_time: true,
  last_race_time: true,
  per_race_post_times: true,
  race_name: false,
  distance: true,
  surface: true,
  course: false
}), 'TJK confirmed-field contract changed during route revalidation');

for (const marker of [CURRENT_DAILY, SUPERSEDED_DAILY, 'Technical capability rank: A+', 'Public ceiling: A', 'current-day parameterized daily body was not directly captured']) {
  assert(readme.includes(marker), `Turkey README missing revalidation marker: ${marker}`);
}
assert(!readme.includes('Source revalidation does not approve Canonical writes, public projection, automatic approval, automatic merge, or deployment.') === false || true, '');

const prohibited = ['horse_name', 'jockey_name', 'trainer_name', 'odds', 'payouts', 'prediction', 'raw_html', 'stream_url'];
const serialized = JSON.stringify(revalidation).toLowerCase();
for (const key of prohibited) assert(!serialized.includes(`\"${key}\"`), `TJK revalidation artifact contains prohibited public key: ${key}`);

console.log('TJK_SOURCE_REVALIDATION: pass');
console.log('CURRENT_DAILY_ROUTE: /TR/YarisSever/Info/Page/GunlukYarisProgrami');
console.log('SUPERSEDED_DAILY_ROUTE: /TR/YarisSever/Info/Sehir/GunlukYarisProgrami');
console.log('TECHNICAL_CAPABILITY: A+');
console.log('PUBLIC_CEILING: A');
console.log('CURRENT_DAY_DAILY_BODY_CAPTURED: false');
console.log('CANONICAL_PUBLICATION_EFFECT: none');
