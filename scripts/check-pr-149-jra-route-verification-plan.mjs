import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function fail(message) {
  console.error(`[pr-149-jra-route-verification-plan] ${message}`);
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

const plan = readJson('data/generated/timetable/pr-149-jra-route-verification-plan.json');
const notes = read('PR-149.md');

if (plan.schema_version !== 'pr-149-jra-route-verification-plan-v0') fail('Unexpected schema version.');
if (plan.month !== '2026-06') fail('Unexpected month.');
if (plan.source_inventory !== 'data/generated/timetable/pr-146-jra-official-source-inventory.json') fail('Unexpected source inventory.');

if (plan.context?.hkjc_status !== 'paused_at_c') fail('HKJC context must remain paused_at_c.');
if (plan.context?.primary_candidate !== 'JRA') fail('Primary candidate must be JRA.');
if (plan.context?.fallback_candidate !== 'NAR') fail('Fallback candidate must be NAR.');

const system = plan.system ?? {};
if (system.country_id !== 'japan') fail('Unexpected country_id.');
if (system.group_id !== 'jra') fail('Unexpected group_id.');
if (system.current_rank !== 'not_promoted_by_this_pr') fail('JRA must not be promoted in PR-149.');
if (system.time_zone !== 'Asia/Tokyo') fail('Unexpected time zone.');

const env = plan.environment_status ?? {};
if (env.assistant_web_status !== 'not_reliable_for_jra_pages') fail('Environment status mismatch.');
if (!env.required_executor?.includes('Codex')) fail('Expected Codex or local browser DevTools executor if needed.');

const targets = plan.verification_targets ?? [];
for (const targetId of ['fixture_calendar', 'one_meeting_race_list', 'one_meeting_race_times', 'route_parameters']) {
  if (!targets.some((target) => target.target_id === targetId)) fail(`Missing verification target: ${targetId}`);
}
for (const target of targets) {
  if (target.promotion_allowed !== false) fail(`Target ${target.target_id} must not allow promotion.`);
  if (!Array.isArray(target.candidate_source_ids) || target.candidate_source_ids.length === 0) fail(`Target ${target.target_id} missing source ids.`);
}

const method = plan.inspection_method ?? {};
if (method.normal_fetch_first !== true) fail('normal_fetch_first must be true.');
if (method.codex_or_devtools_if_needed !== true) fail('codex_or_devtools_if_needed must be true.');
for (const phrase of ['Open candidate official JRA pages', 'Identify fixture calendar', 'Identify race list', 'Inspect DOM', 'Do not add race-time rows']) {
  if (!method.checks?.some((check) => check.includes(phrase))) fail(`Missing inspection check: ${phrase}`);
}

const expected = plan.expected_pr148_result_schema ?? {};
if (expected.schema_version !== 'pr-148-jra-one-meeting-inspection-result-v0') fail('Expected PR-148 result schema mismatch.');
if (!expected.inspection_status?.includes('verified_full_meeting')) fail('Expected status must include verified_full_meeting.');
if (expected.time_zone !== 'Asia/Tokyo') fail('Expected result time zone mismatch.');
if (!Array.isArray(expected.races)) fail('Expected result must include races array.');

const decision = plan.promotion_decision ?? {};
if (decision.promote_jra_in_this_pr !== false) fail('JRA must not be promoted.');
if (decision.promote_nar_in_this_pr !== false) fail('NAR must not be promoted.');
if (decision.data_rows_added !== false) fail('No data rows should be added.');
if (decision.snapshot_added !== false) fail('No snapshot should be added.');
if (decision.rank_change_added !== false) fail('No rank change should be added.');

const schedule = plan.forward_schedule ?? [];
for (const plannedPr of ['PR-148', 'PR-149A', 'PR-149B', 'PR-150A', 'PR-151A', 'PR-152A']) {
  if (!schedule.some((item) => item.planned_pr === plannedPr)) fail(`Missing forward schedule item: ${plannedPr}`);
}

const rules = plan.safety_rules ?? [];
for (const phrase of ['Do not promote JRA', 'Do not add JRA race-time rows', 'Do not infer first_race_time', 'Do not infer last_race_time', 'Do not infer race_count', 'Do not assume contiguous numbering']) {
  if (!rules.some((rule) => rule.includes(phrase))) fail(`Missing safety rule: ${phrase}`);
}

const requiredNoteSnippets = [
  'This PR defines the JRA route verification plan.',
  'JRA is not promoted in this PR.',
  'No JRA race-time rows are added in this PR.',
  'fixture_calendar',
  'one_meeting_race_times',
  'PR-152A: JRA promotion gate only if PR-132 rank rules are satisfied.'
];
for (const snippet of requiredNoteSnippets) {
  if (!notes.includes(snippet)) fail(`PR note missing required snippet: ${snippet}`);
}

console.log('[pr-149-jra-route-verification-plan] PASS route plan only / no promotion');
