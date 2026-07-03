import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const json = (file) => JSON.parse(read(file));

const matrix = json('data/static/nar-flat-racecourse-compatibility-v1.json');
const audit = json('data/audits/nar-14-racecourse-compatibility-v1.json');
const runtime = json('data/static/japan-a-plus-runtime-control.json');
const collector = read('scripts/timetable/collect-nar-complete-fixtures.mjs');
const document = read('docs/calendar/nar-14-racecourse-compatibility-audit.md');
const scheduledWorkflow = read('.github/workflows/timetable-scheduled-refresh.yml');

if (matrix.schema_version !== 'nar-flat-racecourse-compatibility-v1') fail('unexpected matrix schema.');
if (matrix.work_id !== 'WHR-CAL-JAPAN-NAR-A-PLUS') fail('matrix Work ID differs.');
if (matrix.status !== 'all_14_reviewed') fail('matrix status must be all_14_reviewed.');
if (matrix.scope?.flat_racecourses !== 14) fail('flat-racecourse scope must be 14.');
if (matrix.scope?.separate_banei_racecourses !== 1) fail('Banei must remain a separate one-racecourse scope.');
if (matrix.scope?.target_month !== '2026-07') fail('target month must be 2026-07.');
if (matrix.scope?.monthly_active_flat_racecourses !== 12) fail('July active flat-racecourse count must be 12.');
if (matrix.scope?.monthly_inactive_flat_racecourses !== 2) fail('July inactive flat-racecourse count must be 2.');

if (!Array.isArray(matrix.records) || matrix.records.length !== 14) fail('matrix must contain fourteen records.');
const expectedCodes = ['10','11','18','19','20','21','22','23','24','27','28','31','32','36'];
const actualCodes = (matrix.records ?? []).map((record) => record.venue_code).sort();
if (JSON.stringify(actualCodes) !== JSON.stringify([...expectedCodes].sort())) fail('venue-code coverage differs from the flat-racing fourteen.');

const seenRacecourses = new Set();
for (const record of matrix.records ?? []) {
  if (seenRacecourses.has(record.racecourse_id)) fail(`duplicate racecourse ${record.racecourse_id}.`);
  seenRacecourses.add(record.racecourse_id);
  if (!/^\d{2}$/.test(record.venue_code ?? '')) fail(`${record.racecourse_id} venue code is invalid.`);
  if (!/^\d{2}$/.test(record.guide_number ?? '')) fail(`${record.racecourse_id} guide number is invalid.`);
  if (!Array.isArray(record.organizers) || record.organizers.length < 1) fail(`${record.racecourse_id} organizer is missing.`);
  if (!['left','right','left_and_right'].includes(record.course_direction)) fail(`${record.racecourse_id} course direction is invalid.`);
  if (!Array.isArray(record.surfaces) || !record.surfaces.includes('dirt')) fail(`${record.racecourse_id} must include dirt.`);
  if (record.racecourse_id === 'morioka-racecourse' && !record.surfaces.includes('turf')) fail('Morioka must retain turf capability.');
  if (record.racecourse_id !== 'morioka-racecourse' && record.surfaces.includes('turf')) fail(`${record.racecourse_id} must not claim turf.`);
  if (!['active','no_meeting_in_2026_07'].includes(record.target_month_state)) fail(`${record.racecourse_id} target-month state is invalid.`);
  if (!/^2026-\d{2}-\d{2}$/.test(record.official_race_list_date ?? '')) fail(`${record.racecourse_id} source date is invalid.`);
  if (!record.official_race_list_url?.startsWith('https://www.keiba.go.jp/KeibaWeb/TodayRaceInfo/RaceList?')) fail(`${record.racecourse_id} RaceList URL is invalid.`);
  if (!record.official_race_list_url.includes(`k_babaCode=${record.venue_code}`)) fail(`${record.racecourse_id} RaceList venue code differs.`);
  if (record.route_state !== 'official_2026_race_list_confirmed') fail(`${record.racecourse_id} route is not confirmed.`);
  if (!['required','required_seasonal','single_race_probe_only'].includes(record.fixture_state)) fail(`${record.racecourse_id} fixture state is invalid.`);
}

const inactive = matrix.records.filter((record) => record.target_month_state === 'no_meeting_in_2026_07').map((record) => record.racecourse_id).sort();
if (JSON.stringify(inactive) !== JSON.stringify(['himeji-racecourse','mizusawa-racecourse'])) fail('July inactive racecourses must be Himeji and Mizusawa.');

const policy = matrix.coverage_policy ?? {};
if (policy.complete_fixture_required_per_racecourse !== true || policy.required_fixture_count !== 14) fail('coverage policy must require fourteen complete fixtures.');
if (policy.same_month_required !== false) fail('same-month coverage must not be required for seasonal venues.');
if (policy.monthly_collection_after_fixture_coverage !== 'all meetings at every active flat racecourse in the selected month') fail('monthly collection requirement differs.');
if (policy.candidate_boundary !== 'needs_review_only') fail('candidate boundary differs.');
if (policy.canonical_write !== 'human_approval_only' || policy.public_write !== 'human_approval_only') fail('write boundary differs.');
if (policy.schedule_mode !== 'disabled') fail('schedule must remain disabled.');

if (audit.schema_version !== 'nar-14-racecourse-compatibility-audit-v1') fail('unexpected audit schema.');
if (audit.status !== 'complete' || audit.flat_racecourses_in_scope !== 14 || audit.route_code_compatibility_confirmed !== 14) fail('all-14 audit is incomplete.');
if (audit.complete_meeting_fixtures_complete !== 0 || audit.public_nar_meetings !== 0) fail('audit must not claim fixture or publication completion.');
if (audit.next_phase !== 'all_14_complete_meeting_fixture_collection') fail('audit next phase differs.');
for (const [key, value] of Object.entries({
  candidate_write: 'disabled',
  canonical_write: 'disabled',
  public_write: 'disabled',
  raw_source_storage: 'disabled',
  schedule_mode: 'disabled',
  publication_effect: 'none',
})) {
  if (audit.boundaries?.[key] !== value) fail(`audit boundary ${key} must be ${value}.`);
}

for (const marker of [
  "matrixPath = 'data/static/nar-flat-racecourse-compatibility-v1.json'",
  "fixtureDirectory = 'data/fixtures/timetable/nar/complete-meetings'",
  "reportPath = 'data/generated/timetable/nar-complete-fixture-report.json'",
  'parseListRows',
  'parseDetailMetadata',
  'continuousFromOne',
  "promotion_eligible: false",
  "review: {",
  "storage_policy: 'public_safe_extracted_fields_only_no_raw_html'",
]) {
  if (!collector.includes(marker)) fail(`collector missing marker: ${marker}`);
}
for (const forbidden of [
  'canonical/meetings.json',
  'canonical/meeting-details.json',
  'public/meeting-list.json',
  'public/meeting-details.json',
  'build-public-timetable-view.mjs',
  'promote-timetable',
]) {
  if (collector.includes(forbidden)) fail(`collector must not reference ${forbidden}.`);
}

const narRuntime = runtime.records?.find((record) => record.system_id === 'japan-nar-system');
if (!narRuntime || narRuntime.public_projection_activation !== 'pending_pilot') fail('NAR runtime projection must remain pending_pilot.');
if (/^\s*schedule:/m.test(scheduledWorkflow) || scheduledWorkflow.includes('cron:')) fail('scheduled refresh must remain disabled.');

for (const phrase of [
  'all fourteen active flat-racing racecourses',
  'complete racecourse fixtures: 14 / 14',
  'Mizusawa and Himeji have no meetings in the July 2026 target month',
  'every actual meeting at every active flat-racing racecourse',
  'It must not write candidate, canonical, public, or production runtime data.',
  'complete-meeting fixtures:      0 / 14',
]) {
  if (!document.includes(phrase)) fail(`compatibility document missing: ${phrase}`);
}

if (errors.length) {
  console.error(`CALENDAR_NAR_14_RACECOURSE_COMPATIBILITY: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('CALENDAR_NAR_14_RACECOURSE_COMPATIBILITY: pass');
console.log('FLAT_RACECOURSES: 14');
console.log('JULY_ACTIVE: 12');
console.log('JULY_INACTIVE: 2');
console.log('COMPLETE_FIXTURES: 0');
console.log('NEXT_PHASE: all_14_complete_meeting_fixture_collection');
