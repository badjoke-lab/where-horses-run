import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function fail(message) {
  console.error(`[pr-144-hkjc-remaining-six-devtools-result] ${message}`);
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

const result = readJson('data/generated/timetable/pr-144-hkjc-remaining-six-devtools-result.json');
const notes = read('PR-144.md');

if (result.schema_version !== 'pr-144-hkjc-remaining-six-devtools-result-v0') fail('Unexpected schema version.');
if (result.inspection_status !== 'not_verified') fail('Overall inspection_status must be not_verified.');
if (result.result_source !== 'user_provided_codex_or_devtools_result') fail('Result source must be user-provided Codex/DevTools output.');
if (result.time_zone !== 'Asia/Hong_Kong') fail('Unexpected time zone.');
if (result.source_route_type !== 'not_found') fail('Source route type must be not_found.');
if (!result.request_url_pattern?.includes('RaceNo={race_number}')) fail('Request pattern must include RaceNo placeholder.');

const meetings = result.meetings ?? [];
if (meetings.length !== 6) fail(`Expected 6 meetings, got ${meetings.length}.`);

const expectedMeetings = [
  ['2026-06-07', 'Sha Tin', 'ST'],
  ['2026-06-10', 'Happy Valley', 'HV'],
  ['2026-06-13', 'Sha Tin', 'ST'],
  ['2026-06-21', 'Sha Tin', 'ST'],
  ['2026-06-24', 'Happy Valley', 'HV'],
  ['2026-06-27', 'Sha Tin', 'ST']
];

for (let index = 0; index < expectedMeetings.length; index += 1) {
  const [meetingDate, racecourse, fixtureCode] = expectedMeetings[index];
  const meeting = meetings[index];
  if (meeting.meeting_date !== meetingDate) fail(`Meeting ${index + 1} date mismatch.`);
  if (meeting.racecourse !== racecourse) fail(`Meeting ${meetingDate} racecourse mismatch.`);
  if (meeting.fixture_code !== fixtureCode) fail(`Meeting ${meetingDate} fixture code mismatch.`);
  if (meeting.inspection_status !== 'not_verified') fail(`Meeting ${meetingDate} must be not_verified.`);
  if (!Array.isArray(meeting.races) || meeting.races.length !== 0) fail(`Meeting ${meetingDate} must not include race rows.`);
  if (!meeting.reason_not_verified?.includes('No target-meeting race_number and race_time rows')) fail(`Meeting ${meetingDate} reason mismatch.`);
  if (!meeting.inspector_notes?.some((note) => note.includes('No first_race_time'))) fail(`Meeting ${meetingDate} must record no inferred values.`);
}

const decision = result.promotion_decision ?? {};
if (decision.promote_hkjc_in_this_result !== false) fail('Result must not promote HKJC.');
if (decision.promote_hkjc_in_this_pr !== false) fail('PR must not promote HKJC.');
if (decision.continue_hkjc_bplus_work_now !== false) fail('HKJC B+ work should not continue now.');
if (!decision.recommended_next_candidate?.includes('JRA')) fail('Next candidate should mention JRA.');
for (const field of ['first_race_time', 'last_race_time', 'race_count', 'contiguous_race_number_range']) {
  if (!decision.do_not_infer?.includes(field)) fail(`${field} must not be inferred.`);
}

const requiredNoteSnippets = [
  'The result is `not_verified` for all six remaining meetings.',
  'HKJC remains C.',
  'This PR does not promote HKJC to B+.',
  'This PR ends the current HKJC B+ route attempt unless new official-source evidence is provided later.',
  'PR-145 should pause HKJC B+ work and move to the next PR-135 candidate: JRA or NAR.'
];

for (const snippet of requiredNoteSnippets) {
  if (!notes.includes(snippet)) fail(`PR note missing required snippet: ${snippet}`);
}

console.log('[pr-144-hkjc-remaining-six-devtools-result] PASS remaining six not_verified / HKJC remains C');
