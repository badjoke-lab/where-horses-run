import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function fail(message) {
  console.error(`[pr-156-jra-wider-route-status] ${message}`);
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

const status = readJson('data/generated/timetable/pr-156-jra-wider-route-status.json');
const notes = read('PR-156.md');

if (status.schema_version !== 'pr-156-jra-wider-route-status-v0') fail('Unexpected schema version.');
if (status.month !== '2026-01') fail('Unexpected month.');
if (status.source_snapshot !== 'data/generated/timetable/pr-154-jra-one-meeting-snapshot.json') fail('Unexpected source snapshot.');

const system = status.system ?? {};
if (system.country_id !== 'japan') fail('Unexpected country_id.');
if (system.group_id !== 'jra') fail('Unexpected group_id.');
if (system.current_rank !== 'not_promoted_by_this_pr') fail('JRA must not be promoted.');
if (system.time_zone !== 'Asia/Tokyo') fail('Unexpected time zone.');

if (!status.route_pattern_under_test?.startsWith('https://www.jra.go.jp/')) fail('Route pattern must be official JRA.');

const summary = status.coverage_summary ?? {};
if (summary.tested_meetings !== 4) fail('Expected 4 tested meetings.');
if (summary.source_verified_meetings !== 1) fail('Expected 1 source-verified meeting.');
if (summary.normal_fetch_not_verified_meetings !== 3) fail('Expected 3 normal_fetch_not_verified meetings.');
if (summary.wider_coverage_verified !== false) fail('Wider coverage must not be verified.');
if (summary.wider_snapshot_allowed !== false) fail('Wider snapshot must not be allowed.');
if (summary.promotion_allowed !== false) fail('Promotion must not be allowed.');

const meetings = status.meetings ?? [];
if (meetings.length !== 4) fail(`Expected 4 meetings, got ${meetings.length}.`);

const verified = meetings.filter((meeting) => meeting.route_status === 'verified_full_meeting');
const notVerified = meetings.filter((meeting) => meeting.route_status === 'normal_fetch_not_verified');
if (verified.length !== 1) fail('Expected one verified meeting.');
if (notVerified.length !== 3) fail('Expected three normal_fetch_not_verified meetings.');

const v = verified[0];
if (v.meeting_date !== '2026-01-05') fail('Verified meeting date mismatch.');
if (v.racecourse !== '京都競馬場') fail('Verified racecourse mismatch.');
if (v.verified_race_count !== 12) fail('Verified race count mismatch.');
if (v.first_race_time !== '9時50分') fail('Verified first_race_time mismatch.');
if (v.last_race_time !== '16時10分') fail('Verified last_race_time mismatch.');

for (const meeting of notVerified) {
  if (!meeting.source_url?.startsWith('https://www.jra.go.jp/')) fail(`Unverified meeting ${meeting.meeting_date} must use official JRA URL.`);
  if (!Array.isArray(meeting.races) || meeting.races.length !== 0) fail(`Unverified meeting ${meeting.meeting_date} must not include races.`);
  if (!meeting.reason_not_verified?.includes('Codex or local browser DevTools')) fail(`Unverified meeting ${meeting.meeting_date} must require Codex/DevTools.`);
}

const batch = status.required_next_batch ?? {};
if (batch.executor !== 'Codex or local browser DevTools') fail('Next batch executor mismatch.');
if (!Array.isArray(batch.target_urls) || batch.target_urls.length !== 3) fail('Expected three target URLs.');
for (const url of batch.target_urls) {
  if (!url.startsWith('https://www.jra.go.jp/')) fail(`Target URL must be official JRA: ${url}`);
}
if (batch.expected_result_schema !== 'pr-157-jra-additional-meetings-codex-result-v0') fail('Expected PR-157 schema mismatch.');

const decision = status.promotion_decision ?? {};
if (decision.promote_jra_in_this_pr !== false) fail('JRA must not be promoted in PR-156.');
if (decision.wider_snapshot_added !== false) fail('Wider snapshot must not be added.');
if (decision.wider_coverage_verified !== false) fail('Wider coverage must not be verified.');
if (!decision.reason?.includes('Only one JRA meeting')) fail('Promotion reason must mention only one verified meeting.');

const requiredNoteSnippets = [
  'Only one JRA meeting is source-verified so far.',
  'JRA is not promoted in this PR.',
  'No wider JRA snapshot is added in this PR.',
  'wider_coverage_verified: false',
  'PR-157: JRA additional meetings Codex/DevTools batch result.'
];
for (const snippet of requiredNoteSnippets) {
  if (!notes.includes(snippet)) fail(`PR note missing required snippet: ${snippet}`);
}

console.log('[pr-156-jra-wider-route-status] PASS 1 verified / 3 normal fetch not verified / no promotion');
