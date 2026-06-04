import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function fail(message) {
  console.error(`[pr-153-jra-one-meeting-codex-result] ${message}`);
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

const result = readJson('data/generated/timetable/pr-153-jra-one-meeting-codex-result.json');
const notes = read('PR-153.md');

if (result.schema_version !== 'pr-152-jra-one-meeting-codex-result-v0') fail('Unexpected schema version.');
if (result.inspection_status !== 'verified_full_meeting') fail('Inspection status must be verified_full_meeting.');
if (result.result_source !== 'user_provided_codex_or_devtools_result') fail('Result source must be user-provided Codex/DevTools output.');
if (result.time_zone !== 'Asia/Tokyo') fail('Unexpected time zone.');
if (result.source_route_type !== 'calendar_page') fail('Unexpected source route type.');

const meeting = result.meeting ?? {};
if (meeting.meeting_date !== '2026-01-05') fail('Unexpected meeting date.');
if (meeting.racecourse !== '京都競馬場') fail('Unexpected racecourse.');
if (meeting.meeting_id_or_code !== '1回京都2日') fail('Unexpected meeting id/code.');
if (!meeting.source_url?.startsWith('https://www.jra.go.jp/')) fail('Meeting source URL must be official JRA.');

if (!result.route_pattern?.startsWith('https://www.jra.go.jp/')) fail('Route pattern must be official JRA.');

const races = result.races ?? [];
if (races.length !== 12) fail(`Expected 12 races, got ${races.length}.`);

const expectedTimes = ['9時50分', '10時20分', '10時50分', '11時20分', '12時10分', '12時40分', '13時10分', '13時45分', '14時20分', '14時55分', '15時30分', '16時10分'];
for (let index = 0; index < races.length; index += 1) {
  const expectedRaceNumber = `${index + 1}レース`;
  const race = races[index];
  if (race.race_number !== expectedRaceNumber) fail(`Expected race_number ${expectedRaceNumber}.`);
  if (race.race_time !== expectedTimes[index]) fail(`${expectedRaceNumber} time mismatch.`);
  if (!race.race_source_url?.startsWith('https://www.jra.go.jp/')) fail(`${expectedRaceNumber} source URL must be official JRA.`);
}

if (result.reason_not_verified !== null) fail('reason_not_verified must be null.');
if (!Array.isArray(result.inspector_notes) || result.inspector_notes.length < 3) fail('Expected inspector notes.');
if (!result.inspector_notes.some((note) => note.includes('レース番号') && note.includes('発走時刻'))) fail('Inspector notes must mention JRA table headings.');

const decision = result.promotion_decision ?? {};
if (decision.promote_jra_in_this_pr !== false) fail('JRA must not be promoted in PR-153.');
if (decision.snapshot_added !== false) fail('Snapshot must not be added in PR-153.');
if (decision.data_rows_added_to_calendar !== false) fail('Calendar rows must not be added in PR-153.');
for (const field of ['first_race_time', 'last_race_time', 'race_count', 'contiguous_race_number_range']) {
  if (!decision.do_not_infer?.includes(field)) fail(`${field} must not be inferred in PR-153.`);
}

const requiredNoteSnippets = [
  'This PR records the user-provided Codex/DevTools result for one JRA meeting.',
  'The result is `verified_full_meeting` for one meeting only.',
  'JRA is not promoted in this PR.',
  'No JRA snapshot is added in this PR.',
  'PR-154 should create a one-meeting snapshot from this verified result only.'
];
for (const snippet of requiredNoteSnippets) {
  if (!notes.includes(snippet)) fail(`PR note missing required snippet: ${snippet}`);
}

console.log('[pr-153-jra-one-meeting-codex-result] PASS verified one-meeting result / no promotion / no snapshot');
