import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function fail(message) {
  console.error(`[pr-157-jra-additional-meetings-result] ${message}`);
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

const result = readJson('data/generated/timetable/pr-157-jra-additional-meetings-codex-result.json');
const notes = read('PR-157.md');

if (result.schema_version !== 'pr-157-jra-additional-meetings-codex-result-v0') fail('Unexpected schema version.');
if (result.inspection_status !== 'verified_all_targets') fail('Expected verified_all_targets at page-row level.');
if (result.result_source !== 'user_provided_codex_or_devtools_result') fail('Result source must be user-provided Codex/DevTools output.');
if (result.time_zone !== 'Asia/Tokyo') fail('Unexpected time zone.');
if (result.source_route_type !== 'calendar_page') fail('Unexpected source route type.');
if (!result.route_pattern?.startsWith('https://www.jra.go.jp/')) fail('Route pattern must be official JRA.');
if (result.section_disambiguation_status !== 'page_rows_verified_but_meeting_sections_not_split_into_separate_records') fail('Section disambiguation status must block snapshot.');
if (result.snapshot_allowed_from_this_result !== false) fail('Snapshot must not be allowed from unsplit page rows.');

const meetings = result.meetings ?? [];
if (meetings.length !== 3) fail(`Expected 3 page-level meeting entries, got ${meetings.length}.`);
const expectedDates = ['2026-01-04', '2026-01-10', '2026-01-11'];
for (const date of expectedDates) {
  const item = meetings.find((meeting) => meeting.meeting_date === date);
  if (!item) fail(`Missing meeting page ${date}.`);
  if (item.inspection_status !== 'verified_full_meeting') fail(`${date} must be verified_full_meeting at page-row level.`);
  if (!item.source_url?.startsWith('https://www.jra.go.jp/')) fail(`${date} source URL must be official JRA.`);
  if (!Array.isArray(item.races) || item.races.length !== 24) fail(`${date} must contain 24 page rows from two sections.`);
  if (!item.inspector_notes?.some((note) => note.includes('two meeting sections'))) fail(`${date} must note two meeting sections.`);
}

const decision = result.promotion_decision ?? {};
if (decision.promote_jra_in_this_result !== false) fail('JRA must not be promoted in result.');
if (decision.promote_jra_in_this_pr !== false) fail('JRA must not be promoted in PR.');
if (decision.wider_snapshot_added !== false) fail('Wider snapshot must not be added.');
if (!decision.next_required_step?.includes('Split verified page rows')) fail('Next step must require section split.');
for (const field of ['first_race_time', 'last_race_time', 'race_count', 'contiguous_race_number_range']) {
  if (!decision.do_not_infer?.includes(field)) fail(`${field} must not be inferred.`);
}

const requiredNoteSnippets = [
  'The result is `verified_all_targets` at page-row level.',
  'not split into separate official meeting records',
  'this PR does not create a wider snapshot and does not promote JRA',
  'No section-level first_race_time derivation.',
  'PR-158: JRA section split plan and schema.'
];
for (const snippet of requiredNoteSnippets) {
  if (!notes.includes(snippet)) fail(`PR note missing required snippet: ${snippet}`);
}

console.log('[pr-157-jra-additional-meetings-result] PASS page rows verified / section split required / no promotion');
