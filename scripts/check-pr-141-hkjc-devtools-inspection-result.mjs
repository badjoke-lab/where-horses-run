import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function fail(message) {
  console.error(`[pr-141-hkjc-devtools-inspection-result] ${message}`);
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

const result = readJson('data/generated/timetable/pr-141-hkjc-devtools-inspection-result.json');
const notes = read('PR-141.md');

if (result.schema_version !== 'pr-141-hkjc-devtools-inspection-result-v0') fail('Unexpected schema version.');
if (result.inspection_status !== 'verified_full_meeting') fail('Inspection status must be verified_full_meeting.');
if (result.result_source !== 'user_provided_codex_or_devtools_result') fail('Result source must be user-provided Codex/DevTools output.');
if (result.meeting_date !== '2026-06-03') fail('Unexpected meeting date.');
if (result.racecourse !== 'Happy Valley') fail('Unexpected racecourse.');
if (result.fixture_code !== 'HV') fail('Unexpected fixture code.');
if (result.time_zone !== 'Asia/Hong_Kong') fail('Unexpected time zone.');
if (result.source_route_type !== 'racecard_dom_links') fail('Unexpected source route type.');
if (!result.source_url?.startsWith('https://racing.hkjc.com/')) fail('Source URL must be official HKJC.');
if (!result.request_url_pattern?.includes('RaceNo={race_number}')) fail('Request pattern must include RaceNo placeholder.');

const races = result.races ?? [];
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

if (result.reason_not_verified !== null) fail('reason_not_verified must be null for verified_full_meeting.');
if (!Array.isArray(result.inspector_notes) || result.inspector_notes.length < 3) fail('Expected inspector notes.');
if (!result.inspector_notes.some((note) => note.includes('RaceNo 1 through 9'))) fail('Inspector notes must mention RaceNo 1 through 9.');

const decision = result.promotion_decision ?? {};
if (decision.promote_hkjc_in_this_pr !== false) fail('HKJC must not be promoted in PR-141.');
if (decision.do_not_promote_full_month_yet !== true) fail('Full-month promotion must be blocked.');
for (const field of ['first_race_time', 'last_race_time', 'race_count', 'contiguous_race_number_range']) {
  if (!decision.do_not_infer?.includes(field)) fail(`${field} must not be inferred in PR-141.`);
}
if (!decision.last_race_time_definition?.includes('not meeting_end_time')) fail('last_race_time definition must reject meeting_end_time.');

const requiredNoteSnippets = [
  'user-provided Codex/DevTools inspection result',
  'verified_full_meeting',
  'HKJC is not promoted in this PR.',
  'This PR verifies one meeting only',
  'PR-142 should create a one-meeting source-verified snapshot'
];

for (const snippet of requiredNoteSnippets) {
  if (!notes.includes(snippet)) fail(`PR note missing required snippet: ${snippet}`);
}

console.log('[pr-141-hkjc-devtools-inspection-result] PASS verified one-meeting HKJC result / no promotion');
