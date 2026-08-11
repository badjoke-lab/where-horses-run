import fs from 'node:fs';

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const assert = (condition, message) => { if (!condition) throw new Error(message); };

const current = readJson('docs/timetable-source-tests/03-turkey/revalidation-2026-08-12.json');
const prior = readJson('docs/timetable-source-tests/03-turkey/revalidation-2026-08-11.json');

assert(current.schema_version === 'tjk-source-revalidation-v2', 'current TJK revalidation schema differs');
assert(current.checked_date === '2026-08-12', 'current TJK checked date differs');
assert(current.status === 'verified_with_page_discovered_venue_detail', 'current TJK route topology status differs');
assert(current.technical_capability_rank === 'A+', 'current TJK technical capability differs');
assert(current.public_ceiling === 'A', 'current TJK public ceiling differs');
assert(current.supersedes_for_current_implementation === 'docs/timetable-source-tests/03-turkey/revalidation-2026-08-11.json', 'TJK current revalidation predecessor differs');

assert(prior.schema_version === 'tjk-source-revalidation-v1', 'historical TJK revalidation was overwritten');
assert(prior.current_observation.current_day_daily_body_verified === false, 'historical uncaptured-body record was rewritten');
assert(prior.current_observation.annual_meetings_observed.some((row) => row.racecourse === 'Ankara' && row.race_rows === 7), 'historical Ankara annual observation changed');
assert(prior.current_observation.annual_meetings_observed.some((row) => row.racecourse === 'Kocaeli' && row.race_rows === 8), 'historical Kocaeli annual observation changed');

assert(current.route_topology.landing_route === '/TR/YarisSever/Info/Page/GunlukYarisProgrami', 'TJK landing path differs');
assert(current.route_topology.landing_route_verified === true, 'TJK landing route not verified');
assert(current.route_topology.landing_exposes_current_venue_detail_links === true, 'TJK landing-to-detail topology not verified');
assert(current.route_topology.venue_detail_route_source === 'discovered_from_current_landing_body', 'TJK venue route is not discovery-bound');
assert(current.route_topology.venue_detail_route === '/TR/YarisSever/Info/Sehir/GunlukYarisProgrami', 'TJK venue detail path differs');
assert(current.route_topology.data_route_returns_complete_race_schedule === false, 'TJK data route must not be treated as complete schedule evidence');
assert(current.route_topology.implementation_rule.includes('Start from the current Info/Page landing route.'), 'TJK implementation rule must start from current landing route');

assert(current.current_observation.programme_date === '2026-08-11', 'TJK verified programme date differs');
assert(current.current_observation.parameterized_daily_body_verified === true, 'TJK current daily body is not verified');
assert(current.current_observation.raw_body_retained === false, 'TJK raw body retention boundary differs');

const expected = new Map([
  ['Ankara', ['5', ['14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30','18:00']]],
  ['Kocaeli', ['9', ['17:15','17:45','18:30','19:00','19:30','20:00','20:30','21:00','21:30']]],
]);
assert(current.current_observation.meetings.length === 2, 'TJK direct current observation scope differs');
for (const meeting of current.current_observation.meetings) {
  const row = expected.get(meeting.racecourse);
  assert(row, `unexpected TJK racecourse: ${meeting.racecourse}`);
  assert(meeting.city_id === row[0], `TJK city id differs: ${meeting.racecourse}`);
  assert(meeting.race_count === 9, `TJK race count differs: ${meeting.racecourse}`);
  assert(meeting.race_schedule.length === 9, `TJK schedule row count differs: ${meeting.racecourse}`);
  assert(JSON.stringify(meeting.race_schedule.map((race) => race.race_number)) === JSON.stringify([1,2,3,4,5,6,7,8,9]), `TJK Race 1-N differs: ${meeting.racecourse}`);
  assert(JSON.stringify(meeting.race_schedule.map((race) => race.post_time_local)) === JSON.stringify(row[1]), `TJK post-time schedule differs: ${meeting.racecourse}`);
  assert(meeting.first_post_time_local === row[1][0], `TJK first post differs: ${meeting.racecourse}`);
  assert(meeting.last_post_time_local === row[1][8], `TJK last post differs: ${meeting.racecourse}`);
}

assert(current.evidence.workflow === 'Calendar TJK parameterized body probe', 'TJK probe workflow differs');
assert(current.evidence.probe_run_id === 31514800273, 'TJK passing probe run differs');
assert(current.evidence.probe_head_sha === '0a6f499879353aea7c8d04957dc4dc5ae2d7edc8', 'TJK passing probe head differs');
assert(current.evidence.probe_artifact_id === 9110592645, 'TJK passing probe artifact differs');
assert(current.evidence.probe_artifact_sha256 === '4d25e8d50c7c15a7c7daa0bc5d4996369d0b9226cbb68206c94aa20261bd754f', 'TJK passing probe artifact digest differs');
assert(current.evidence.probe_result === 'success', 'TJK current programme probe is not successful');

assert(current.decision.current_schedule_capture_status === 'verified', 'TJK current schedule capture decision differs');
assert(current.decision.adapter_status === 'current_bounded_adapter_ready_for_implementation', 'TJK current adapter gate differs');
for (const key of ['automatic_approval', 'canonical_write', 'public_projection_write', 'deployment']) {
  assert(current.decision[key] === false, `TJK publication boundary differs: ${key}`);
}

const serialized = JSON.stringify(current).toLowerCase();
for (const prohibited of ['horse_name','jockey_name','trainer_name','odds','payouts','prediction','raw_html','stream_url']) {
  assert(!serialized.includes(`"${prohibited}"`), `TJK current revalidation contains prohibited key: ${prohibited}`);
}

console.log('TJK_CURRENT_PROGRAMME_EVIDENCE: pass');
console.log('PROGRAMME_DATE: 2026-08-11');
console.log('ANKARA_RACES: 9 14:00-18:00');
console.log('KOCAELI_RACES: 9 17:15-21:30');
console.log('ENTRYPOINT: Info/Page');
console.log('VENUE_DETAIL: page-discovered Info/Sehir');
console.log('PUBLIC_CEILING: A');
console.log('CANONICAL_PUBLICATION_EFFECT: none');
