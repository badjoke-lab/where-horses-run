import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function stop(message) {
  console.error(`[pr-236-meeting-detail-page-contract] ${message}`);
  process.exit(1);
}

function read(relativePath) {
  const filePath = path.join(root, relativePath);
  if (!fs.existsSync(filePath)) stop(`Missing file: ${relativePath}`);
  return fs.readFileSync(filePath, 'utf8');
}

function assertIncludes(collection, value, label) {
  if (!collection.includes(value)) stop(`${label} missing ${value}.`);
}

const spec = read('docs/specs/timetable-meeting-detail-page-contract.md');
const policy = JSON.parse(read('data/generated/timetable/pr-236-meeting-detail-page-contract.json'));
const notes = read('PR-236.md');

if (policy.schema_version !== 'pr-236-meeting-detail-page-contract-v0') stop('Unexpected schema version.');
if (policy.last_checked !== '2026-06-07') stop('Unexpected last_checked date.');

for (const route of ['/meetings/[country]/[racecourse]/[date]/', '/ja/meetings/[country]/[racecourse]/[date]/']) {
  assertIncludes(policy.route_shape?.recommended_routes ?? [], route, 'Route shape');
}

for (const field of ['meeting_id', 'country_id', 'authority_id', 'racecourse_id', 'date', 'timezone', 'source_id', 'capability_rank', 'source_status', 'official_source_url', 'last_checked_date']) {
  assertIncludes(policy.required_source_fields ?? [], field, 'Required source fields');
}

const ranks = (policy.rank_detail_contract ?? []).map((item) => item.rank);
for (const rank of ['C', 'B', 'B+', 'A', 'A+']) {
  assertIncludes(ranks, rank, 'Rank detail contract');
}

for (const section of ['meeting_summary', 'programme_summary', 'race_timetable', 'source_and_verification']) {
  assertIncludes(policy.allowed_sections ?? [], section, 'Allowed sections');
}

for (const field of ['race_label_or_race_number', 'post_time', 'race_name', 'distance', 'surface', 'course_label', 'official_source_link', 'last_checked_date']) {
  assertIncludes(policy.a_plus_allowed_fields ?? [], field, 'A+ allowed fields');
}

if ((policy.forbidden_fields ?? []).length < 15) stop('Forbidden field list is too short.');
if ((policy.empty_states ?? []).length < 4) stop('Empty state list is too short.');
if (policy.live_replay_policy?.separate_from_timetable_rank !== true) stop('Live / Replay must be separate from timetable rank.');

const decision = policy.implementation_decision ?? {};
for (const key of ['adds_routes', 'adds_ui', 'adds_source_specific_parsers', 'adds_scrapers', 'adds_runtime_fetching', 'adds_scheduled_jobs', 'adds_generated_writeback', 'adds_racecard_redistribution', 'adds_video_or_stream_integration']) {
  if (decision[key] !== false) stop(`Implementation decision ${key} must be false.`);
}

for (const snippet of ['A meeting detail page should answer:', 'A+ remains a limited programme summary. It is not a full racecard.', 'The page must not infer missing times, race names, distances, or surfaces.', 'This contract does not implement:']) {
  if (!spec.includes(snippet)) stop(`Spec missing required snippet: ${snippet}`);
}

for (const snippet of ['No meeting detail routes are implemented.', 'No meeting detail UI is implemented.', 'No runtime fetching is added.', 'No racecard redistribution is added.']) {
  if (!notes.includes(snippet)) stop(`PR note missing required snippet: ${snippet}`);
}

console.log('[pr-236-meeting-detail-page-contract] PASS');
