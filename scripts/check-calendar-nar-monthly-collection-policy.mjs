import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const json = (file) => JSON.parse(read(file));

const policy = json('data/static/nar-monthly-collection-policy-v1.json');
const matrix = json('data/static/nar-flat-racecourse-compatibility-v1.json');
const contract = read('docs/calendar/nar-monthly-collection-contract.md');
const planner = read('scripts/timetable/build-nar-monthly-schedule-plan.mjs');
const scheduledWorkflow = read('.github/workflows/timetable-scheduled-refresh.yml');

if (policy.schema_version !== 'nar-monthly-collection-policy-v1') fail('unexpected policy schema.');
if (policy.work_id !== 'WHR-CAL-JAPAN-NAR-A-PLUS') fail('policy Work ID differs.');
if (policy.status !== 'draft_contract') fail('policy status must be draft_contract.');
if (policy.scope?.target_month !== '2026-07') fail('target month must be 2026-07.');
if (policy.scope?.racecourses_checked !== 14 || policy.scope?.flat_racecourses !== 14) fail('policy must check fourteen flat racecourses.');
if (policy.scope?.banei_excluded !== true) fail('Banei must be excluded from NAR flat monthly collection.');

if (policy.preconditions?.all_14_complete_fixture_set_required !== true) fail('monthly collection must require the all-14 fixture set first.');
if (policy.preconditions?.fixture_validator !== 'scripts/check-calendar-nar-complete-fixture-set.mjs') fail('fixture precondition validator differs.');
if (policy.preconditions?.minimum_fixture_count !== 14) fail('fixture precondition must require fourteen fixtures.');

for (const state of ['meeting_complete', 'no_meeting_in_target_month', 'meeting_incomplete', 'source_unavailable', 'parser_failure']) {
  if (!policy.classification?.[state]) fail(`classification state missing: ${state}`);
}
if (!policy.classification.no_meeting_in_target_month.includes('not a failure')) fail('no-meeting classification must explicitly not be a failure.');
if (policy.success_condition?.all_fourteen_racecourses_classified !== true) fail('all racecourses must be classified.');
if (policy.success_condition?.inactive_racecourses_are_recorded_as_no_meeting !== true) fail('inactive racecourses must be recorded as no-meeting.');
if (policy.success_condition?.silent_omission_allowed !== false) fail('silent omission must be prohibited.');
if (policy.success_condition?.publication_effect !== 'none') fail('monthly plan must have no publication effect.');

const boundary = policy.write_boundary ?? {};
if (JSON.stringify(boundary.allowed_outputs) !== JSON.stringify([
  'data/generated/timetable/nar-monthly-collection-report.json',
  'data/candidates/nar-monthly-meeting-candidates.json',
])) fail('monthly allowed output paths differ.');
if (boundary.candidate_write !== 'needs_review_only') fail('monthly candidate write must remain needs_review_only.');
if (boundary.canonical_write !== 'disabled' || boundary.public_write !== 'disabled') fail('monthly canonical/public writes must be disabled.');
if (boundary.raw_source_storage !== 'disabled' || boundary.schedule_mode !== 'disabled') fail('monthly raw/scheduled writes must be disabled.');

if (policy.promotion_boundary?.candidate_promotion_eligible !== false) fail('monthly candidates must not be promotion-eligible.');
if (policy.promotion_boundary?.human_review_required_before_canonical !== true) fail('human review must be required before canonical.');
if (policy.promotion_boundary?.monthly_collection_is_not_publication !== true) fail('monthly collection must not be publication.');

if (matrix.records?.length !== 14) fail('NAR compatibility matrix must contain fourteen flat-racing records.');
const inactive = matrix.records.filter((record) => record.target_month_state === 'no_meeting_in_2026_07').map((record) => record.racecourse_id).sort();
if (JSON.stringify(inactive) !== JSON.stringify(['himeji-racecourse', 'mizusawa-racecourse'])) fail('July inactive racecourses must be Himeji and Mizusawa.');
if (matrix.coverage_policy?.same_month_required !== false) fail('fixture coverage must continue allowing seasonal fixture dates.');
if (matrix.coverage_policy?.monthly_collection_after_fixture_coverage !== 'all meetings at every active flat racecourse in the selected month') fail('monthly collection policy differs from the matrix.');

for (const phrase of [
  'A racecourse with no meeting in the target month is not an error.',
  'no_meeting_in_target_month',
  'all fourteen flat-racing racecourses are classified',
  'no candidate is promotion-eligible',
  'no canonical or public data changes',
]) {
  if (!contract.includes(phrase)) fail(`monthly contract missing: ${phrase}`);
}

for (const marker of [
  "matrixPath = 'data/static/nar-flat-racecourse-compatibility-v1.json'",
  "defaultOutputPath = 'data/generated/timetable/nar-monthly-schedule-plan.json'",
  'MonthlyConveneInfoTop',
  'extractRaceListUrls',
  'no_meeting_in_target_month',
  'record_status_only',
  'collect_every_meeting',
]) {
  if (!planner.includes(marker)) fail(`monthly planner missing marker: ${marker}`);
}
for (const forbidden of [
  'canonical/meetings.json',
  'canonical/meeting-details.json',
  'public/meeting-list.json',
  'public/meeting-details.json',
  'build-public-timetable-view.mjs',
]) {
  if (planner.includes(forbidden)) fail(`monthly planner must not reference ${forbidden}.`);
}

if (/^\s*schedule:/m.test(scheduledWorkflow) || scheduledWorkflow.includes('cron:')) fail('scheduled refresh must remain disabled.');

if (errors.length) {
  console.error(`CALENDAR_NAR_MONTHLY_COLLECTION_POLICY: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('CALENDAR_NAR_MONTHLY_COLLECTION_POLICY: pass');
console.log('RACECOURSES_CLASSIFIED: 14');
console.log('NO_MEETING_IS_STATUS_NOT_FAILURE: true');
console.log('CANONICAL_WRITE: disabled');
console.log('PUBLIC_WRITE: disabled');
