import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function fail(message) {
  console.error(`[pr-151-jra-normal-fetch-inspection] ${message}`);
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

const result = readJson('data/generated/timetable/pr-151-jra-normal-fetch-inspection.json');
const notes = read('PR-151.md');

if (result.schema_version !== 'pr-151-jra-normal-fetch-inspection-v0') fail('Unexpected schema version.');
if (result.month !== '2026-06') fail('Unexpected month.');
if (result.source_plan !== 'data/generated/timetable/pr-149-jra-route-verification-plan.json') fail('Unexpected source plan.');

const system = result.system ?? {};
if (system.country_id !== 'japan') fail('Unexpected country_id.');
if (system.group_id !== 'jra') fail('Unexpected group_id.');
if (system.current_rank !== 'not_promoted_by_this_pr') fail('JRA must not be promoted in PR-151.');
if (system.time_zone !== 'Asia/Tokyo') fail('Unexpected time zone.');

const normal = result.normal_fetch_result ?? {};
if (normal.inspection_status !== 'not_verified') fail('Normal fetch must be not_verified.');
if (normal.executor !== 'assistant_web_open') fail('Executor must be assistant_web_open.');
if (!Array.isArray(normal.checked_urls) || normal.checked_urls.length < 5) fail('Expected checked JRA URLs.');
for (const url of normal.checked_urls) {
  if (!url.startsWith('https://www.jra.go.jp/')) fail(`Checked URL must be official JRA: ${url}`);
}
if (normal.verified_meeting !== null) fail('verified_meeting must be null.');
if (!Array.isArray(normal.races) || normal.races.length !== 0) fail('Normal fetch must not include race rows.');
if (!normal.reason_not_verified?.includes('No source-verified JRA race_number/race_time rows')) fail('Missing not_verified reason.');

const task = result.required_codex_or_devtools_task ?? {};
if (!task.task_title?.includes('JRA')) fail('Task title must mention JRA.');
if (!task.goal?.includes('one official JRA meeting')) fail('Task goal must mention one official JRA meeting.');
if (!Array.isArray(task.target_sources) || task.target_sources.length < 5) fail('Expected Codex/DevTools target sources.');
for (const url of task.target_sources) {
  if (!url.startsWith('https://www.jra.go.jp/')) fail(`Target source must be official JRA: ${url}`);
}
for (const field of ['inspection_status', 'time_zone', 'source_route_type', 'meeting_date', 'racecourse', 'race_number', 'race_time', 'race_source_url']) {
  if (!task.allowed_fields?.includes(field)) fail(`Missing allowed field: ${field}`);
}
for (const field of ['first_race_time', 'last_race_time', 'race_count', 'contiguous_race_number_range']) {
  if (!task.do_not_infer?.includes(field)) fail(`Missing do_not_infer field: ${field}`);
}

const expected = task.expected_result_schema ?? {};
if (expected.schema_version !== 'pr-152-jra-one-meeting-codex-result-v0') fail('Unexpected expected result schema version.');
if (!expected.inspection_status?.includes('verified_full_meeting')) fail('Expected result must include verified_full_meeting.');
if (expected.time_zone !== 'Asia/Tokyo') fail('Expected result time zone mismatch.');
if (!Array.isArray(expected.races)) fail('Expected result must include races array.');

const decision = result.promotion_decision ?? {};
if (decision.promote_jra_in_this_pr !== false) fail('JRA must not be promoted.');
if (decision.promote_nar_in_this_pr !== false) fail('NAR must not be promoted.');
if (decision.data_rows_added !== false) fail('No data rows should be added.');
if (decision.snapshot_added !== false) fail('No snapshot should be added.');
if (decision.rank_change_added !== false) fail('No rank change should be added.');
if (!decision.next_required_step?.includes('Codex/local browser DevTools')) fail('Next required step must mention Codex/local browser DevTools.');

const schedule = result.forward_schedule ?? [];
for (const plannedPr of ['PR-152', 'PR-153A', 'PR-153B', 'PR-154A', 'PR-155A', 'PR-156A']) {
  if (!schedule.some((item) => item.planned_pr === plannedPr)) fail(`Missing forward schedule item: ${plannedPr}`);
}

const requiredNoteSnippets = [
  'The result is not_verified for normal fetch only.',
  'JRA is not promoted in this PR.',
  'No JRA race-time rows are added in this PR.',
  'PR-152: JRA Codex or DevTools one-meeting result.',
  'PR-156A: JRA promotion gate only if PR-132 rank rules are satisfied.'
];
for (const snippet of requiredNoteSnippets) {
  if (!notes.includes(snippet)) fail(`PR note missing required snippet: ${snippet}`);
}

console.log('[pr-151-jra-normal-fetch-inspection] PASS normal fetch not_verified / Codex task required / no promotion');
