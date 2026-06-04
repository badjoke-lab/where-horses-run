import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function fail(message) {
  console.error(`[pr-158-jra-additional-meetings-result] ${message}`);
  process.exit(1);
}

function read(relativePath) {
  const filePath = path.join(root, relativePath);
  if (!fs.existsSync(filePath)) fail(`Missing file: ${relativePath}`);
  return fs.readFileSync(filePath, 'utf8');
}

const result = JSON.parse(read('data/generated/timetable/pr-158-jra-additional-meetings-codex-result.json'));
const notes = read('PR-158.md');

if (result.schema_version !== 'pr-157-jra-additional-meetings-codex-result-v0') fail('Unexpected schema version.');
if (result.inspection_status !== 'verified_all_targets') fail('Expected verified_all_targets.');
if (result.result_source !== 'user_provided_codex_or_devtools_result') fail('Unexpected result source.');
if (result.time_zone !== 'Asia/Tokyo') fail('Unexpected time zone.');
if (result.source_route_type !== 'calendar_page') fail('Unexpected source route type.');

const meetings = result.meetings ?? [];
if (meetings.length !== 6) fail(`Expected 6 meetings, got ${meetings.length}.`);

for (const meeting of meetings) {
  if (meeting.inspection_status !== 'verified_full_meeting') fail(`${meeting.meeting_id_or_code} must be verified_full_meeting.`);
  if (!meeting.source_url?.startsWith('https://www.jra.go.jp/')) fail(`${meeting.meeting_id_or_code} must use official JRA URL.`);
  if (!meeting.route_pattern?.startsWith('https://www.jra.go.jp/')) fail(`${meeting.meeting_id_or_code} must use official JRA route pattern.`);
  if (!Array.isArray(meeting.races) || meeting.races.length !== 12) fail(`${meeting.meeting_id_or_code} must have 12 race rows.`);
  if (meeting.reason_not_verified !== null) fail(`${meeting.meeting_id_or_code} reason_not_verified must be null.`);
}

const requiredCodes = ['1回中山1日', '1回京都1日', '1回中山3日', '1回京都3日', '1回中山4日', '1回京都4日'];
for (const code of requiredCodes) {
  if (!meetings.some((meeting) => meeting.meeting_id_or_code === code)) fail(`Missing meeting: ${code}`);
}

const decision = result.promotion_decision ?? {};
if (decision.promote_jra_in_this_result !== false) fail('Result must not promote JRA.');
if (decision.promote_jra_in_this_pr !== false) fail('PR must not promote JRA.');
if (decision.snapshot_added !== false) fail('Snapshot must not be added in PR-158.');

for (const snippet of ['verified_all_targets', 'JRA is not promoted in this PR.', 'No wider JRA snapshot is added in this PR.', 'PR-159 should create a wider JRA source-verified snapshot']) {
  if (!notes.includes(snippet)) fail(`PR note missing: ${snippet}`);
}

console.log('[pr-158-jra-additional-meetings-result] PASS');
