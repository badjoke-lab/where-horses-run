import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function fail(message) {
  console.error(`[pr-181-jra-unified-route-display-acquisition-plan] ${message}`);
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

const plan = readJson('data/generated/timetable/pr-181-jra-unified-route-display-acquisition-plan.json');
const notes = read('PR-181.md');

if (plan.schema_version !== 'pr-181-jra-unified-route-display-acquisition-plan-v0') fail('Unexpected schema version.');
if (!plan.context?.new_policy?.includes('Check A first')) fail('New policy must be A-first.');

const ladder = plan.rank_ladder ?? [];
for (const rank of ['A', 'B+', 'B', 'C']) {
  if (!ladder.some((item) => item.rank === rank)) fail(`Missing rank ladder item: ${rank}`);
}
const rankA = ladder.find((item) => item.rank === 'A');
if (rankA.check_first !== true) fail('A must be checked first.');
for (const required of ['official race detail or racecard route per race', 'normalized data displayed in calendar and day pages', 'automatic acquisition route with parser and CI']) {
  if (!rankA.requires?.includes(required)) fail(`A requirement missing: ${required}`);
}

const gates = plan.completion_gates ?? {};
for (const gate of ['acquisition_verification', 'normalization', 'calendar_display', 'day_page_display', 'automatic_next_fetch_route', 'ci_validation']) {
  if (gates[gate]?.required !== true) fail(`Completion gate must be required: ${gate}`);
}

for (const field of ['meeting_date', 'racecourse', 'rank', 'source_url', 'last_checked', 'verification_status']) {
  if (!gates.calendar_display.must_show?.includes(field)) fail(`Calendar display missing field: ${field}`);
}
for (const field of ['race_number', 'race_time', 'race_source_url', 'section_or_meeting_id', 'verification_status']) {
  if (!gates.day_page_display.must_show?.includes(field)) fail(`Day page display missing field: ${field}`);
}

for (const step of ['date_to_jra_calendar_url', 'fetch_official_page', 'parse_calendar_sections', 'split_meetings', 'normalize_race_rows', 'write_generated_json', 'render_calendar_and_day_pages', 'validate_in_ci']) {
  if (!gates.automatic_next_fetch_route.pipeline?.includes(step)) fail(`Auto fetch pipeline missing step: ${step}`);
}

for (const check of ['missing_source_url', 'unsplit_multi-section_page_rows', 'rank_claim_without_required_fields']) {
  if (!gates.ci_validation.must_detect?.includes(check)) fail(`CI validation missing check: ${check}`);
}

const schedule = plan.compressed_forward_schedule ?? [];
for (const pr of ['PR-182', 'PR-183', 'PR-184', 'PR-185', 'PR-186']) {
  if (!schedule.some((item) => item.planned_pr === pr)) fail(`Missing compressed schedule item: ${pr}`);
}

for (const policy of ['Do not complete JRA at acquisition-result stage only.', 'Do not run a separate late A-rank investigation after finishing B/B+', 'Do not promote records that are not shown in calendar and day-page UI.', 'Do not promote records without a repeatable next-fetch route.', 'Do not promote records without CI guarding section splits, source URLs, and rank requirements.']) {
  if (!plan.policy_changes?.includes(policy)) fail(`Missing policy: ${policy}`);
}

const decision = plan.promotion_decision ?? {};
if (decision.promote_jra_in_this_pr !== false) fail('JRA must not be promoted.');
if (decision.calendar_rows_added !== false) fail('No calendar rows should be added.');
if (decision.auto_fetch_route_added !== false) fail('No auto fetch route should be added.');
if (decision.rank_change_added !== false) fail('No rank change should be added.');
if (decision.this_pr_is_plan_only !== true) fail('This PR must be plan-only.');

const requiredNoteSnippets = [
  'This PR defines a corrected JRA completion plan.',
  'The plan checks A first',
  'calendar display, day-page display, automatic acquisition, parser integration, and CI validation mandatory',
  'PR-182: JRA A-first inspection and section-split schema.',
  'Do not mark JRA complete at acquisition-result stage only.'
];
for (const snippet of requiredNoteSnippets) {
  if (!notes.includes(snippet)) fail(`PR note missing required snippet: ${snippet}`);
}

console.log('[pr-181-jra-unified-route-display-acquisition-plan] PASS A-first display/acquisition completion plan');
