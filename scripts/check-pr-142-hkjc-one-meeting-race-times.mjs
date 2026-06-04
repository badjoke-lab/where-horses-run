import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function fail(message) {
  console.error(`[pr-142-hkjc-one-meeting-race-times] ${message}`);
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

const snapshot = readJson('data/generated/timetable/pr-142-hkjc-one-meeting-race-times.json');
const notes = read('PR-142.md');

if (snapshot.schema_version !== 'pr-142-hkjc-one-meeting-race-times-v0') fail('Unexpected schema version.');
if (snapshot.month !== '2026-06') fail('Unexpected month.');
if (snapshot.source_result !== 'data/generated/timetable/pr-141-hkjc-devtools-inspection-result.json') fail('Unexpected source result.');
if (snapshot.system?.country_id !== 'hong-kong') fail('Unexpected country_id.');
if (snapshot.system?.group_id !== 'hkjc') fail('Unexpected group_id.');
if (snapshot.system?.current_rank !== 'C') fail('HKJC must remain C in PR-142.');
if (snapshot.system?.target_rank_after_full_month_verification !== 'B+') fail('Unexpected future target rank.');
if (snapshot.system?.time_zone !== 'Asia/Hong_Kong') fail('Unexpected time zone.');

const meeting = snapshot.meeting ?? {};
if (meeting.meeting_date !== '2026-06-03') fail('Unexpected meeting date.');
if (meeting.racecourse !== 'Happy Valley') fail('Unexpected racecourse.');
if (meeting.fixture_code !== 'HV') fail('Unexpected fixture code.');
if (meeting.source_route_type !== 'racecard_dom_links') fail('Unexpected source route type.');
if (!meeting.source_url?.startsWith('https://racing.hkjc.com/')) fail('Meeting source URL must be official HKJC.');
if (!meeting.request_url_pattern?.includes('RaceNo={race_number}')) fail('Request pattern must include RaceNo placeholder.');

const races = snapshot.races ?? [];
if (races.length !== 9) fail(`Expected 9 races, got ${races.length}.`);

const expectedTimes = ['18:40', '19:10', '19:40', '20:10', '20:40', '21:10', '21:45', '22:15', '22:50'];
for (let index = 0; index < races.length; index += 1) {
  const race = races[index];
  const expectedRaceNumber = index + 1;
  const expectedTime = expectedTimes[index];
  if (race.race_number !== expectedRaceNumber) fail(`Expected RaceNo ${expectedRaceNumber}.`);
  if (race.race_time !== expectedTime) fail(`RaceNo ${expectedRaceNumber} expected ${expectedTime}.`);
  if (!race.race_source_url?.startsWith('https://racing.hkjc.com/')) fail(`RaceNo ${expectedRaceNumber} source URL must be official HKJC.`);
  if (!race.race_source_url.includes(`RaceNo=${expectedRaceNumber}`)) fail(`RaceNo ${expectedRaceNumber} source URL mismatch.`);
}

const derived = snapshot.derived_from_verified_rows ?? {};
if (derived.first_race_time !== '18:40') fail('Unexpected first_race_time.');
if (derived.last_race_time !== '22:50') fail('Unexpected last_race_time.');
if (derived.race_count !== 9) fail('Unexpected race_count.');
if (!derived.derivation_rule?.includes('one-meeting snapshot')) fail('Derivation rule must be one-meeting scoped.');
if (!derived.derivation_rule?.includes('not meeting_end_time')) fail('Derivation rule must reject meeting_end_time.');

const decision = snapshot.promotion_decision ?? {};
if (decision.promote_hkjc_in_this_pr !== false) fail('HKJC must not be promoted in PR-142.');
if (decision.verified_scope !== 'one_meeting_only') fail('Verified scope must be one_meeting_only.');
if (decision.do_not_promote_full_month_yet !== true) fail('Full-month promotion must remain blocked.');
if (!decision.next_required_check?.includes('every June 2026 HKJC meeting')) fail('Next check must require every June 2026 HKJC meeting.');

const requiredNoteSnippets = [
  'one-meeting source-verified HKJC race-time snapshot',
  'first_race_time: 18:40',
  'last_race_time: 22:50',
  'race_count: 9',
  'This PR verifies one meeting only.',
  'No full-month B+ promotion.'
];

for (const snippet of requiredNoteSnippets) {
  if (!notes.includes(snippet)) fail(`PR note missing required snippet: ${snippet}`);
}

console.log('[pr-142-hkjc-one-meeting-race-times] PASS one-meeting snapshot / no full-month promotion');
