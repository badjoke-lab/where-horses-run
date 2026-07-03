import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const json = (file) => JSON.parse(read(file));

const fixture = json('data/fixtures/timetable/nar/route-probe-v1.json');
const audit = json('data/audits/nar-fixture-probe-v1.json');
const architecture = json('data/static/nar-source-route-architecture-v1.json');
const runtimeControl = json('data/static/japan-a-plus-runtime-control.json');
const doc = read('docs/calendar/nar-fixture-probe.md');
const scheduledWorkflow = read('.github/workflows/timetable-scheduled-refresh.yml');

if (fixture.schema_version !== 'nar-route-probe-fixture-v1') fail('unexpected fixture schema.');
if (fixture.work_id !== 'WHR-CAL-JAPAN-NAR-A-PLUS') fail('fixture Work ID is incorrect.');
if (fixture.storage_policy !== 'public_safe_fields_only_no_raw_source') fail('fixture storage policy is incorrect.');
if (fixture.publication_effect !== 'none') fail('fixture must have no publication effect.');
if (!Array.isArray(fixture.observations) || fixture.observations.length !== 2) fail('fixture must contain exactly two observations.');

const expected = new Map([
  ['18', { racecourse_id: 'urawa-racecourse', date: '2026-06-26', race_number: 11, post_time_local: '18:55', distance_m: 1500 }],
  ['19', { racecourse_id: 'funabashi-racecourse', date: '2026-07-03', race_number: 10, post_time_local: '19:10', distance_m: 1200 }],
]);
const allowedFields = ['label', 'post_time_local', 'race_name', 'distance_m', 'surface', 'course_label'];
const allowedSet = new Set(allowedFields);
const forbiddenKeys = new Set([
  'runner_list', 'horse_name', 'jockey_name', 'trainer_name', 'draw', 'weight',
  'body_weight', 'odds', 'result', 'payout', 'prediction', 'raw_html',
  'embedded_video', 'direct_stream_url',
]);

for (const observation of fixture.observations ?? []) {
  const exp = expected.get(observation.venue_code);
  if (!exp) {
    fail(`unexpected venue code ${observation.venue_code}.`);
    continue;
  }
  if (observation.racecourse_id !== exp.racecourse_id) fail(`${observation.venue_code} racecourse mismatch.`);
  if (observation.date !== exp.date) fail(`${observation.venue_code} date mismatch.`);
  if (observation.race_number !== exp.race_number) fail(`${observation.venue_code} race number mismatch.`);
  if (observation.source_status !== 'verified') fail(`${observation.venue_code} source must be verified.`);
  if (!observation.list_url?.includes(`k_babaCode=${observation.venue_code}`)) fail(`${observation.venue_code} list URL mismatch.`);
  if (!observation.detail_url?.includes(`k_babaCode=${observation.venue_code}`)) fail(`${observation.venue_code} detail URL mismatch.`);
  if (!observation.detail_url?.includes(`k_raceNo=${observation.race_number}`)) fail(`${observation.venue_code} detail race parameter mismatch.`);

  const fields = observation.public_safe_fields ?? {};
  const keys = Object.keys(fields);
  if (keys.length !== allowedFields.length) fail(`${observation.venue_code} field count differs.`);
  for (const key of keys) if (!allowedSet.has(key)) fail(`${observation.venue_code} has unexpected field ${key}.`);
  for (const key of allowedFields) if (!(key in fields) || fields[key] === null || fields[key] === '') fail(`${observation.venue_code} missing ${key}.`);
  if (fields.post_time_local !== exp.post_time_local) fail(`${observation.venue_code} post time mismatch.`);
  if (fields.distance_m !== exp.distance_m) fail(`${observation.venue_code} distance mismatch.`);
  if (fields.surface !== 'Dirt') fail(`${observation.venue_code} surface mismatch.`);
  if (fields.course_label !== 'Dirt Course / Left') fail(`${observation.venue_code} course label mismatch.`);
  for (const key of forbiddenKeys) if (key in fields) fail(`${observation.venue_code} stores forbidden field ${key}.`);
}

for (const key of forbiddenKeys) {
  if (!fixture.excluded_fields?.includes(key)) fail(`excluded_fields missing ${key}.`);
}

if (audit.schema_version !== 'nar-fixture-probe-audit-v1') fail('unexpected audit schema.');
if (audit.work_id !== 'WHR-CAL-JAPAN-NAR-A-PLUS') fail('audit Work ID is incorrect.');
if (audit.phase !== 'bounded_fixture_probe' || audit.status !== 'complete') fail('fixture-probe audit is incomplete.');
if (audit.fixture_path !== 'data/fixtures/timetable/nar/route-probe-v1.json') fail('audit fixture path is incorrect.');
if (audit.observations !== 2) fail('audit observation count is incorrect.');
if (audit.a_plus_field_shape_confirmed !== true) fail('A+ field shape must be confirmed.');
for (const [key, value] of Object.entries({
  publication_effect: 'none',
  candidate_write: 'disabled',
  canonical_write: 'disabled',
  public_write: 'disabled',
  raw_source_storage: 'disabled',
  schedule_mode: 'disabled',
  next_phase: 'candidate_only_adapter',
})) {
  if (audit[key] !== value) fail(`audit ${key} must be ${value}.`);
}

if (architecture.public_projection_activation !== 'pending_pilot') fail('NAR public projection must remain pending_pilot.');
if (JSON.stringify(architecture.pilot_venue_codes) !== JSON.stringify(['18', '19'])) fail('architecture pilot cohort changed.');
const runtime = runtimeControl.records?.find((record) => record.system_id === 'japan-nar-system');
if (!runtime || runtime.public_projection_activation !== 'pending_pilot') fail('NAR runtime activation must remain pending_pilot.');

for (const phrase of [
  'Status: complete',
  'Work ID: `WHR-CAL-JAPAN-NAR-A-PLUS`',
  'venue codes 18 and 19',
  'test evidence only',
  'candidate: disabled',
  'canonical: disabled',
  'public: disabled',
  'schedule: disabled',
  'review-only candidate adapter',
]) {
  if (!doc.includes(phrase)) fail(`fixture-probe document missing: ${phrase}`);
}

for (const forbiddenFile of [
  'scripts/timetable/refresh-nar.mjs',
  'scripts/timetable/repair-nar-race-names.mjs',
  'data/generated/timetable/nar-racecard-source-snapshot.json',
  'data/generated/timetable/nar-normalized-timetable.json',
  'data/generated/timetable/nar-normalized-meeting-details.json',
]) {
  if (fs.existsSync(path.join(root, forbiddenFile))) fail(`legacy publication artifact must not exist: ${forbiddenFile}.`);
}
if (/^\s*schedule:/m.test(scheduledWorkflow) || scheduledWorkflow.includes('cron:')) fail('scheduled refresh must remain disabled.');

if (errors.length) {
  console.error(`CALENDAR_NAR_FIXTURE_PROBE: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('CALENDAR_NAR_FIXTURE_PROBE: pass');
console.log('OBSERVATIONS: 2');
console.log('VENUE_CODES: 18,19');
console.log('NEXT_PHASE: candidate_only_adapter');
console.log('PUBLICATION_EFFECT: none');
