import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function fail(message) {
  console.error(`[pr-138-hkjc-race-number-set-investigation] ${message}`);
  process.exit(1);
}

function read(relativePath) {
  const filePath = path.join(root, relativePath);
  if (!fs.existsSync(filePath)) fail(`Missing file: ${relativePath}`);
  return fs.readFileSync(filePath, 'utf8');
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath));
}

const investigation = readJson('data/generated/timetable/pr-138-hkjc-race-number-set-investigation.json');
const notes = read('PR-138.md');

if (investigation.schema_version !== 'pr-138-hkjc-race-number-set-investigation-v0') fail('Unexpected schema version.');
if (investigation.month !== '2026-06') fail('Unexpected month.');
if (investigation.system?.country_id !== 'hong-kong') fail('Unexpected country_id.');
if (investigation.system?.group_id !== 'hkjc') fail('Unexpected group_id.');
if (investigation.system?.current_rank !== 'C') fail('HKJC must remain C.');
if (investigation.system?.target_rank !== 'B+') fail('HKJC target rank must be B+.');
if (investigation.system?.time_zone !== 'Asia/Hong_Kong') fail('HKJC time zone must be Asia/Hong_Kong.');

const sample = investigation.sample_meeting ?? {};
if (sample.meeting_date !== '2026-06-03') fail('Expected 2026-06-03 sample meeting.');
if (sample.racecourse !== 'Happy Valley') fail('Expected Happy Valley sample meeting.');
if (sample.fixture_code !== 'HV') fail('Expected HV fixture code.');

const known = investigation.known_working_sample ?? {};
if (known.race_number !== 5) fail('Expected RaceNo 5 as the only known working sample.');
if (known.race_time !== '20:40') fail('Expected RaceNo 5 race_time 20:40.');
if (!known.source_url?.startsWith('https://racing.hkjc.com/')) fail('Known working sample source must be official HKJC.');
if (!known.observed_header?.includes('Happy Valley')) fail('Known sample header must include Happy Valley.');
if (!known.observed_header?.includes('20:40')) fail('Known sample header must include 20:40.');

const status = investigation.race_number_set_status ?? {};
if (status.status !== 'not_verified') fail('Race number set must remain not_verified.');
if (JSON.stringify(status.known_verified_race_numbers) !== JSON.stringify([5])) fail('Only RaceNo 5 should be verified.');
if (!status.known_incomplete_or_failed_race_numbers?.includes(1)) fail('RaceNo 1 must remain incomplete/failed.');
if (!status.known_incomplete_or_failed_race_numbers?.includes(9)) fail('RaceNo 9 must remain incomplete/failed.');
if (status.do_not_assume_contiguous_range !== true) fail('Must not assume contiguous RaceNo range.');
if (status.do_not_assume_race_count_from_probe_range !== true) fail('Must not assume race_count from probe range.');

const routes = investigation.candidate_discovery_routes_to_inspect ?? [];
for (const routeType of ['racecard_page_links', 'page_scripts', 'network_payload', 'meeting_summary_or_card_index']) {
  if (!routes.some((route) => route.route_type === routeType)) fail(`Missing discovery route: ${routeType}`);
}

const decision = investigation.promotion_decision ?? {};
if (decision.promote_in_this_pr !== false) fail('PR-138 must not promote records.');
for (const field of ['first_race_time', 'last_race_time', 'race_count']) {
  if (!decision.do_not_infer?.includes(field)) fail(`${field} must not be inferred.`);
}
for (const required of ['Every race_number', 'Every race_time', 'first_race_time', 'last_race_time', 'race_count', 'all June 2026 HKJC meetings']) {
  if (!decision.must_verify_before_promotion?.some((item) => item.includes(required))) fail(`Missing promotion gate: ${required}`);
}
if (!decision.last_race_time_definition?.includes('not meeting_end_time')) fail('last_race_time definition must reject meeting_end_time.');

const requiredNoteSnippets = [
  'HKJC remains C in this PR.',
  'the full race-number set is still not verified',
  'No contiguous RaceNo range inferred.',
  'No first_race_time inferred.',
  'PR-139 should use browser/devtools or Codex'
];

for (const snippet of requiredNoteSnippets) {
  if (!notes.includes(snippet)) fail(`PR note missing required snippet: ${snippet}`);
}

console.log('[pr-138-hkjc-race-number-set-investigation] PASS race-number set remains not verified / no promotion');
