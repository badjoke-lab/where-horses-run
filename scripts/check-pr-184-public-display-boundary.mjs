import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function stop(message) {
  console.error(`[pr-184-public-display-boundary] ${message}`);
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

const spec = read('docs/specs/timetable-public-display-boundary.md');
const policy = JSON.parse(read('data/generated/timetable/pr-184-public-display-boundary.json'));
const notes = read('PR-184.md');

if (policy.schema_version !== 'pr-184-public-display-boundary-v0') stop('Unexpected schema version.');
if (policy.last_checked !== '2026-06-06') stop('Unexpected last_checked date.');

const ranks = (policy.ranks ?? []).map((item) => item.rank);
for (const rank of ['C', 'B', 'B+', 'A', 'A+']) {
  assertIncludes(ranks, rank, 'Rank policy');
}

if (policy.list_page_policy?.one_meeting_per_row !== true) stop('List page policy must keep one meeting per row.');
if (policy.detail_page_policy?.a_plus_detail_limited_to_detail_pages !== true) stop('A+ detail must be limited to detail pages.');
if (policy.detail_page_policy?.avoid_full_racecard_presentation !== true) stop('Detail policy must avoid full-card presentation.');

for (const field of [
  'race_label_or_race_number',
  'post_time',
  'race_name',
  'distance',
  'surface',
  'course_label',
  'official_source_link',
  'last_checked_date'
]) {
  assertIncludes(policy.a_plus_allowed_fields ?? [], field, 'A+ allowed fields');
}

if ((policy.forbidden_fields ?? []).length < 15) stop('Forbidden field list is too short.');
if ((policy.live_replay_policy?.allowed_labels ?? []).length !== 7) stop('Unexpected Live / Replay allowed label count.');
if ((policy.live_replay_policy?.forbidden_outputs ?? []).length !== 7) stop('Unexpected Live / Replay forbidden output count.');
if (policy.live_replay_policy?.separate_from_timetable_rank !== true) stop('Live / Replay policy must be separate from timetable rank.');

const decision = policy.promotion_decision ?? {};
for (const key of [
  'adds_new_source_records',
  'changes_existing_ranks',
  'adds_calendar_rows',
  'implements_meeting_detail_ui',
  'enables_live_fetch',
  'enables_parser',
  'enables_runtime_fetch',
  'enables_scheduled_jobs',
  'adds_raw_source_storage'
]) {
  if (decision[key] !== false) stop(`Promotion decision ${key} must be false.`);
}

for (const snippet of [
  'A+ is a lightweight programme summary. It is not a full racecard.',
  'one meeting per row',
  'Live and replay information is separate from timetable rank',
  'Where Horses Run does not display the following as site content'
]) {
  if (!spec.includes(snippet)) stop(`Spec missing required snippet: ${snippet}`);
}

for (const snippet of [
  'No new source records.',
  'No rank promotion.',
  'No runtime fetching.',
  'A+ detail is limited to meeting detail pages.',
  'List pages remain one meeting per row.'
]) {
  if (!notes.includes(snippet)) stop(`PR note missing required snippet: ${snippet}`);
}

console.log('[pr-184-public-display-boundary] PASS');
