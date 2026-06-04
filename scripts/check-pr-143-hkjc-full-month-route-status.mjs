import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function fail(message) {
  console.error(`[pr-143-hkjc-full-month-route-status] ${message}`);
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

const status = readJson('data/generated/timetable/pr-143-hkjc-full-month-route-status.json');
const notes = read('PR-143.md');

if (status.schema_version !== 'pr-143-hkjc-full-month-route-status-v0') fail('Unexpected schema version.');
if (status.month !== '2026-06') fail('Unexpected month.');
if (status.source_snapshot !== 'data/generated/timetable/pr-142-hkjc-one-meeting-race-times.json') fail('Unexpected source snapshot.');
if (status.system?.country_id !== 'hong-kong') fail('Unexpected country_id.');
if (status.system?.group_id !== 'hkjc') fail('Unexpected group_id.');
if (status.system?.current_rank !== 'C') fail('HKJC must remain C in PR-143.');
if (status.system?.target_rank_after_full_month_verification !== 'B+') fail('Unexpected future target rank.');
if (status.system?.time_zone !== 'Asia/Hong_Kong') fail('Unexpected time zone.');
if (!status.route_pattern_under_test?.includes('RaceNo={race_number}')) fail('Route pattern must include RaceNo placeholder.');
if (!status.route_pattern_under_test?.includes('Racecourse={fixture_code}')) fail('Route pattern must include Racecourse placeholder.');

const summary = status.coverage_summary ?? {};
if (summary.total_june_2026_meetings !== 7) fail('Expected 7 total meetings.');
if (summary.verified_meetings !== 1) fail('Expected 1 verified meeting.');
if (summary.unverified_meetings !== 6) fail('Expected 6 unverified meetings.');
if (summary.full_month_verified !== false) fail('Full month must not be verified.');
if (summary.full_month_promotion_allowed !== false) fail('Full-month promotion must not be allowed.');

const meetings = status.meetings ?? [];
if (meetings.length !== 7) fail(`Expected 7 meetings, got ${meetings.length}.`);

const expectedMeetings = [
  ['2026-06-03', 'Happy Valley', 'HV', 'verified_full_meeting'],
  ['2026-06-07', 'Sha Tin', 'ST', 'not_yet_verified'],
  ['2026-06-10', 'Happy Valley', 'HV', 'not_yet_verified'],
  ['2026-06-13', 'Sha Tin', 'ST', 'not_yet_verified'],
  ['2026-06-21', 'Sha Tin', 'ST', 'not_yet_verified'],
  ['2026-06-24', 'Happy Valley', 'HV', 'not_yet_verified'],
  ['2026-06-27', 'Sha Tin', 'ST', 'not_yet_verified']
];

for (let index = 0; index < expectedMeetings.length; index += 1) {
  const [meetingDate, racecourse, fixtureCode, routeStatus] = expectedMeetings[index];
  const meeting = meetings[index];
  if (meeting.meeting_date !== meetingDate) fail(`Meeting ${index + 1} date mismatch.`);
  if (meeting.racecourse !== racecourse) fail(`Meeting ${meetingDate} racecourse mismatch.`);
  if (meeting.fixture_code !== fixtureCode) fail(`Meeting ${meetingDate} fixture code mismatch.`);
  if (meeting.route_status !== routeStatus) fail(`Meeting ${meetingDate} route status mismatch.`);
}

const verified = meetings.filter((meeting) => meeting.route_status === 'verified_full_meeting');
const unverified = meetings.filter((meeting) => meeting.route_status === 'not_yet_verified');
if (verified.length !== 1) fail('Expected exactly one verified meeting.');
if (unverified.length !== 6) fail('Expected exactly six unverified meetings.');
if (verified[0].first_race_time !== '18:40') fail('Verified meeting first_race_time mismatch.');
if (verified[0].last_race_time !== '22:50') fail('Verified meeting last_race_time mismatch.');
if (verified[0].verified_race_count !== 9) fail('Verified meeting race count mismatch.');

const decision = status.promotion_decision ?? {};
if (decision.promote_hkjc_in_this_pr !== false) fail('HKJC must not be promoted in PR-143.');
if (decision.promote_full_month_in_this_pr !== false) fail('Full-month promotion must be false.');
if (!decision.reason?.includes('Only 1 of 7')) fail('Promotion reason must mention only 1 of 7 is verified.');
if (!decision.allowed_next_step?.includes('remaining six')) fail('Next step must require remaining six meetings.');

const batchTargets = status.next_codex_or_devtools_batch_target ?? [];
if (batchTargets.length !== 6) fail('Expected six next batch targets.');

const requiredNoteSnippets = [
  'Only one meeting is verified',
  'remaining six June 2026 HKJC meetings are not yet verified',
  'full_month_verified: false',
  'full_month_promotion_allowed: false',
  'This PR does not promote HKJC to B+',
  'PR-144 should collect source-verified race_number/race_time rows for the remaining six'
];

for (const snippet of requiredNoteSnippets) {
  if (!notes.includes(snippet)) fail(`PR note missing required snippet: ${snippet}`);
}

console.log('[pr-143-hkjc-full-month-route-status] PASS 1 verified / 6 unverified / no full-month promotion');
