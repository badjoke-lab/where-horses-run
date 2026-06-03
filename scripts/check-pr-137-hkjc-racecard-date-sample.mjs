import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function fail(message) {
  console.error(`[pr-137-hkjc-racecard-date-sample] ${message}`);
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

const sample = readJson('data/generated/timetable/pr-137-hkjc-racecard-date-sample.json');
const notes = read('PR-137.md');

if (sample.schema_version !== 'pr-137-hkjc-racecard-date-sample-v0') fail('Unexpected schema version.');
if (sample.month !== '2026-06') fail('Unexpected month.');
if (sample.system?.country_id !== 'hong-kong') fail('Unexpected country_id.');
if (sample.system?.group_id !== 'hkjc') fail('Unexpected group_id.');
if (sample.system?.current_rank !== 'C') fail('HKJC must remain C.');
if (sample.system?.target_rank !== 'B+') fail('HKJC target rank must be B+.');
if (sample.system?.time_zone !== 'Asia/Hong_Kong') fail('HKJC time zone must be Asia/Hong_Kong.');

const meeting = sample.sample_meeting ?? {};
if (meeting.meeting_date !== '2026-06-03') fail('Expected 2026-06-03 sample meeting.');
if (meeting.racecourse !== 'Happy Valley') fail('Expected Happy Valley sample meeting.');
if (meeting.fixture_code !== 'HV') fail('Expected HV fixture code.');
if (!meeting.racecard_query_pattern?.includes('RaceNo={race_number}')) fail('Missing RaceNo query pattern.');
if (!meeting.racecard_query_pattern?.includes('Racecourse={fixture_code}')) fail('Missing Racecourse query pattern.');
if (!meeting.racecard_query_pattern?.includes('racedate={yyyy}%2F{mm}%2F{dd}')) fail('Missing racedate query pattern.');
if (!meeting.sample_source_url?.startsWith('https://racing.hkjc.com/')) fail('Sample source URL must be official HKJC.');

const observation = sample.sample_observation ?? {};
if (observation.race_number !== 5) fail('Expected RaceNo 5 sample.');
if (observation.race_time !== '20:40') fail('Expected observed race_time 20:40.');
if (!observation.observed_race_header?.includes('Happy Valley')) fail('Observed header must include Happy Valley.');
if (!observation.observed_race_header?.includes('20:40')) fail('Observed header must include 20:40.');

const negativeProbes = sample.negative_or_incomplete_probes ?? [];
if (negativeProbes.length < 2) fail('Expected negative/incomplete probes.');
for (const probe of negativeProbes) {
  if (!probe.probe_url?.startsWith('https://racing.hkjc.com/')) fail('Probe URL must be official HKJC.');
  if (!probe.meaning?.includes('Do not')) fail('Probe meaning must block over-promotion.');
}

if (sample.promotion_decision?.promote_in_this_pr !== false) fail('PR-137 must not promote records.');
for (const field of ['first_race_time', 'last_race_time', 'race_count']) {
  if (!sample.promotion_decision?.do_not_infer?.includes(field)) fail(`${field} must not be inferred.`);
}

const notProven = sample.promotion_decision?.sample_does_not_prove ?? [];
for (const phrase of ['first_race_time', 'last_race_time', 'race_count', 'all June 2026 HKJC meetings']) {
  if (!notProven.some((item) => item.includes(phrase))) fail(`Missing not-proven guard: ${phrase}`);
}

if (!sample.promotion_decision?.last_race_time_definition?.includes('not meeting_end_time')) fail('last_race_time definition must reject meeting_end_time.');

const requiredNoteSnippets = [
  'HKJC remains C in this PR.',
  'This PR records one date-addressable HKJC racecard sample. It does not promote any records.',
  'Wednesday, June 03, 2026, Happy Valley, 20:40',
  'all races in the 2026-06-03 Happy Valley meeting are retrievable',
  'No first_race_time inferred.',
  'PR-138 should inspect HKJC page links, scripts, or network payloads'
];

for (const snippet of requiredNoteSnippets) {
  if (!notes.includes(snippet)) fail(`PR note missing required snippet: ${snippet}`);
}

console.log('[pr-137-hkjc-racecard-date-sample] PASS 1 racecard sample / no promotion');
