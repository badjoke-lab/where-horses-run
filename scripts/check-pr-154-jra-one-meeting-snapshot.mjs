import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function fail(message) {
  console.error(`[pr-154-jra-one-meeting-snapshot] ${message}`);
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

const snapshot = readJson('data/generated/timetable/pr-154-jra-one-meeting-snapshot.json');
const notes = read('PR-154.md');

if (snapshot.schema_version !== 'pr-154-jra-one-meeting-snapshot-v0') fail('Unexpected schema version.');
if (snapshot.month !== '2026-01') fail('Unexpected month.');
if (snapshot.source_result !== 'data/generated/timetable/pr-153-jra-one-meeting-codex-result.json') fail('Unexpected source result.');

const system = snapshot.system ?? {};
if (system.country_id !== 'japan') fail('Unexpected country_id.');
if (system.group_id !== 'jra') fail('Unexpected group_id.');
if (system.current_rank !== 'not_promoted_by_this_pr') fail('JRA must not be promoted in PR-154.');
if (system.time_zone !== 'Asia/Tokyo') fail('Unexpected time zone.');

const meeting = snapshot.meeting ?? {};
if (meeting.meeting_date !== '2026-01-05') fail('Unexpected meeting date.');
if (meeting.racecourse !== '京都競馬場') fail('Unexpected racecourse.');
if (meeting.meeting_id_or_code !== '1回京都2日') fail('Unexpected meeting id/code.');
if (meeting.source_route_type !== 'calendar_page') fail('Unexpected source route type.');
if (!meeting.source_url?.startsWith('https://www.jra.go.jp/')) fail('Meeting source URL must be official JRA.');

const races = snapshot.races ?? [];
if (races.length !== 12) fail(`Expected 12 races, got ${races.length}.`);
const expectedTimes = ['9時50分', '10時20分', '10時50分', '11時20分', '12時10分', '12時40分', '13時10分', '13時45分', '14時20分', '14時55分', '15時30分', '16時10分'];
for (let index = 0; index < races.length; index += 1) {
  const expectedRaceNumber = `${index + 1}レース`;
  const race = races[index];
  if (race.race_number !== expectedRaceNumber) fail(`Expected ${expectedRaceNumber}.`);
  if (race.race_time !== expectedTimes[index]) fail(`${expectedRaceNumber} time mismatch.`);
  if (!race.race_source_url?.startsWith('https://www.jra.go.jp/')) fail(`${expectedRaceNumber} source URL must be official JRA.`);
}

const derived = snapshot.derived_from_verified_rows ?? {};
if (derived.first_race_time !== '9時50分') fail('Unexpected first_race_time.');
if (derived.last_race_time !== '16時10分') fail('Unexpected last_race_time.');
if (derived.race_count !== 12) fail('Unexpected race_count.');
if (!derived.derivation_rule?.includes('one-meeting snapshot')) fail('Derivation rule must be one-meeting scoped.');
if (!derived.derivation_rule?.includes('not meeting_end_time')) fail('Derivation rule must reject meeting_end_time.');

const decision = snapshot.promotion_decision ?? {};
if (decision.promote_jra_in_this_pr !== false) fail('JRA must not be promoted.');
if (decision.verified_scope !== 'one_meeting_only') fail('Verified scope must be one_meeting_only.');
if (decision.do_not_promote_wider_coverage_yet !== true) fail('Wider coverage promotion must be blocked.');
if (!decision.next_required_check?.includes('additional meetings')) fail('Next check must require additional meetings.');

const requiredNoteSnippets = [
  'This PR creates a one-meeting source-verified JRA snapshot from PR-153.',
  'first_race_time: 9時50分',
  'last_race_time: 16時10分',
  'race_count: 12',
  'This PR verifies one JRA meeting only.',
  'PR-155 should test whether the same official JRA calendar route works for additional meetings.'
];
for (const snippet of requiredNoteSnippets) {
  if (!notes.includes(snippet)) fail(`PR note missing required snippet: ${snippet}`);
}

console.log('[pr-154-jra-one-meeting-snapshot] PASS one-meeting snapshot / no wider promotion');
