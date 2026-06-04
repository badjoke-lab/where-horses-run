import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function fail(message) {
  console.error(`[pr-140-hkjc-codex-inspection-task] ${message}`);
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

const task = readJson('data/generated/timetable/pr-140-hkjc-codex-inspection-task.json');
const notes = read('PR-140.md');

if (task.schema_version !== 'pr-140-hkjc-codex-inspection-task-v0') fail('Unexpected schema version.');
if (task.month !== '2026-06') fail('Unexpected month.');
if (task.system?.country_id !== 'hong-kong') fail('Unexpected country_id.');
if (task.system?.group_id !== 'hkjc') fail('Unexpected group_id.');
if (task.system?.current_rank !== 'C') fail('HKJC must remain C.');
if (task.system?.target_rank !== 'B+') fail('HKJC target rank must be B+.');
if (task.system?.time_zone !== 'Asia/Hong_Kong') fail('HKJC time zone must be Asia/Hong_Kong.');

const inspectionTask = task.task ?? {};
if (!inspectionTask.executor?.includes('Codex')) fail('Executor must include Codex.');
if (!inspectionTask.reason?.includes('could not open')) fail('Must record why browser-capable inspection is needed.');
if (!inspectionTask.known_working_sample_url?.startsWith('https://racing.hkjc.com/')) fail('Known working sample must be official HKJC.');
if (!inspectionTask.known_working_sample_observation?.includes('20:40')) fail('Known observation must include 20:40.');
if (inspectionTask.sample_meeting?.meeting_date !== '2026-06-03') fail('Expected sample meeting date.');
if (inspectionTask.sample_meeting?.racecourse !== 'Happy Valley') fail('Expected sample racecourse.');
if (inspectionTask.sample_meeting?.fixture_code !== 'HV') fail('Expected sample fixture code.');

if (!task.codex_prompt?.title?.includes('HKJC')) fail('Codex prompt title must mention HKJC.');
if (!task.codex_prompt?.prompt?.includes('race_number/race_time')) fail('Codex prompt must require race_number/race_time.');

const steps = task.inspection_steps ?? [];
for (const phrase of ['Open the known working sample URL', 'Inspect same-page race navigation', 'Inspect embedded scripts', 'Inspect browser network requests']) {
  if (!steps.some((step) => step.includes(phrase))) fail(`Missing inspection step: ${phrase}`);
}

for (const field of ['meeting_date', 'racecourse', 'fixture_code', 'time_zone', 'source_url', 'race_number', 'race_time', 'inspection_status', 'reason_not_verified']) {
  if (!task.allowed_output_fields?.includes(field)) fail(`Missing allowed output field: ${field}`);
}

const expected = task.expected_result_schema ?? {};
if (expected.schema_version !== 'pr-140-hkjc-codex-inspection-result-v0') fail('Unexpected expected result schema.');
if (!expected.inspection_status?.includes('verified_full_meeting')) fail('Expected result schema must include verified_full_meeting status.');
if (expected.meeting_date !== '2026-06-03') fail('Expected result meeting date mismatch.');
if (expected.racecourse !== 'Happy Valley') fail('Expected result racecourse mismatch.');
if (expected.fixture_code !== 'HV') fail('Expected result fixture code mismatch.');
if (expected.time_zone !== 'Asia/Hong_Kong') fail('Expected result time zone mismatch.');
if (!Array.isArray(expected.races) || expected.races[0]?.race_number !== 5 || expected.races[0]?.race_time !== '20:40') {
  fail('Expected result schema must include the RaceNo 5 / 20:40 example.');
}

const decision = task.promotion_decision ?? {};
if (decision.promote_in_this_pr !== false) fail('PR-140 must not promote records.');
for (const field of ['first_race_time', 'last_race_time', 'race_count', 'contiguous_race_number_range']) {
  if (!decision.do_not_infer?.includes(field)) fail(`${field} must not be inferred.`);
}
if (!decision.last_race_time_definition?.includes('not meeting_end_time')) fail('last_race_time definition must reject meeting_end_time.');

const requiredNoteSnippets = [
  'HKJC remains C in this PR.',
  'Codex/local browser DevTools task',
  'Allowed fields:',
  'No records are promoted in this PR.',
  'PR-141 should commit the actual Codex/browser inspection result JSON'
];

for (const snippet of requiredNoteSnippets) {
  if (!notes.includes(snippet)) fail(`PR note missing required snippet: ${snippet}`);
}

console.log('[pr-140-hkjc-codex-inspection-task] PASS task only / no promotion');
