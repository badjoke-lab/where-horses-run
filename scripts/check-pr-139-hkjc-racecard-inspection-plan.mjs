import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function fail(message) {
  console.error(`[pr-139-hkjc-racecard-inspection-plan] ${message}`);
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

const plan = readJson('data/generated/timetable/pr-139-hkjc-racecard-inspection-plan.json');
const notes = read('PR-139.md');

if (plan.schema_version !== 'pr-139-hkjc-racecard-inspection-plan-v0') fail('Unexpected schema version.');
if (plan.month !== '2026-06') fail('Unexpected month.');
if (plan.system?.country_id !== 'hong-kong') fail('Unexpected country_id.');
if (plan.system?.group_id !== 'hkjc') fail('Unexpected group_id.');
if (plan.system?.current_rank !== 'C') fail('HKJC must remain C.');
if (plan.system?.target_rank !== 'B+') fail('HKJC target rank must be B+.');
if (plan.system?.time_zone !== 'Asia/Hong_Kong') fail('HKJC time zone must be Asia/Hong_Kong.');

const meeting = plan.sample_meeting ?? {};
if (meeting.meeting_date !== '2026-06-03') fail('Expected 2026-06-03 sample meeting.');
if (meeting.racecourse !== 'Happy Valley') fail('Expected Happy Valley sample meeting.');
if (meeting.fixture_code !== 'HV') fail('Expected HV fixture code.');
if (!meeting.known_working_url?.startsWith('https://racing.hkjc.com/')) fail('Known working URL must be official HKJC.');

const env = plan.inspection_environment ?? {};
if (!env.preferred_executor?.includes('Codex')) fail('Preferred executor must include Codex.');
if (!env.reason?.includes('cannot safely open')) fail('Must record why browser-capable inspection is needed.');
for (const required of ['official HKJC', 'Do not scrape odds', 'Record only race_number']) {
  if (!env.required_controls?.some((item) => item.includes(required))) fail(`Missing required control: ${required}`);
}

const targetIds = (plan.inspection_targets ?? []).map((target) => target.target_id);
for (const targetId of ['racecard_dom_links', 'racecard_embedded_scripts', 'racecard_network_payloads', 'meeting_level_index']) {
  if (!targetIds.includes(targetId)) fail(`Missing inspection target: ${targetId}`);
}

const expected = plan.expected_snapshot_schema_if_found ?? {};
if (expected.schema_version !== 'pr-140-hkjc-one-meeting-race-times-v0') fail('Expected snapshot schema must point to PR-140.');
if (expected.meeting_date !== '2026-06-03') fail('Expected snapshot meeting date mismatch.');
if (expected.time_zone !== 'Asia/Hong_Kong') fail('Expected snapshot time zone mismatch.');
if (!Array.isArray(expected.races) || expected.races.length !== 1) fail('Expected snapshot must include one example race row.');
if (expected.races[0].race_number !== 5) fail('Expected example race_number 5.');
if (expected.races[0].race_time !== '20:40') fail('Expected example race_time 20:40.');
for (const phrase of ['first_race_time', 'last_race_time', 'race_count']) {
  if (!expected.derived_fields_allowed_after_full_snapshot?.some((item) => item.includes(phrase))) {
    fail(`Missing derived field guard: ${phrase}`);
  }
}

const decision = plan.promotion_decision ?? {};
if (decision.promote_in_this_pr !== false) fail('PR-139 must not promote records.');
for (const field of ['first_race_time', 'last_race_time', 'race_count', 'contiguous_race_number_range']) {
  if (!decision.do_not_infer?.includes(field)) fail(`${field} must not be inferred.`);
}
if (!decision.last_race_time_definition?.includes('not meeting_end_time')) fail('last_race_time definition must reject meeting_end_time.');

const requiredNoteSnippets = [
  'HKJC remains C in this PR.',
  'browser/Codex inspection plan',
  'Do not record odds, pools, betting data, dividends, predictions, or tips.',
  'No contiguous RaceNo range inferred.',
  'PR-140 should run the browser/Codex inspection'
];

for (const snippet of requiredNoteSnippets) {
  if (!notes.includes(snippet)) fail(`PR note missing required snippet: ${snippet}`);
}

console.log('[pr-139-hkjc-racecard-inspection-plan] PASS inspection plan / no promotion');
