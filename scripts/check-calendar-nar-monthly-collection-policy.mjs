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
const parser = read('scripts/timetable/parse-nar-monthly-schedule-grid.mjs');
const fullMonthCollector = read('scripts/timetable/normalize-nar-full-month-schedule-fetch.mjs');
const fullMonthOperator = read('scripts/timetable/manual-collect-nar-full-month.mjs');
const baneiPlan = read('docs/calendar/banei-a-plus-full-month-plan.md');
const scheduledWorkflow = read('.github/workflows/timetable-scheduled-refresh.yml');

if (policy.schema_version !== 'nar-monthly-collection-policy-v1') fail('unexpected policy schema.');
if (policy.work_id !== 'WHR-CAL-JAPAN-NAR-A-PLUS') fail('policy Work ID differs.');
if (policy.status !== 'active_contract') fail('policy status must be active_contract.');
if (policy.scope?.target_month !== '2026-07') fail('target month must be 2026-07.');
if (policy.scope?.month_start !== '2026-07-01' || policy.scope?.month_end !== '2026-07-31') fail('policy must cover the whole July month.');
if (policy.scope?.partial_cutoff_completion_allowed !== false) fail('partial cutoffs must not count as completion.');
if (policy.scope?.racecourses_checked !== 14 || policy.scope?.flat_racecourses !== 14) fail('policy must check fourteen flat racecourses.');
if (policy.scope?.banei_excluded !== true) fail('Banei must remain outside the NAR flat scope.');

if (policy.preconditions?.all_14_complete_fixture_set_required !== true) fail('monthly collection must require the all-14 fixture set first.');
if (policy.preconditions?.minimum_fixture_count !== 14) fail('fixture precondition must require fourteen fixtures.');
for (const state of ['meeting_complete', 'scheduled_pending_details', 'no_meeting_in_target_month', 'meeting_incomplete', 'source_unavailable', 'parser_failure']) {
  if (!policy.classification?.[state]) fail(`classification state missing: ${state}`);
}
if (policy.success_condition?.full_calendar_month_required !== true) fail('full-calendar-month success rule is missing.');
if (policy.success_condition?.all_fourteen_racecourses_classified !== true) fail('all racecourses must be classified.');
if (policy.success_condition?.every_scheduled_meeting_has_explicit_state !== true) fail('every scheduled meeting must have an explicit state.');
if (policy.success_condition?.future_detail_gaps_are_pending_not_omitted !== true) fail('future detail gaps must remain pending.');
if (policy.success_condition?.silent_omission_allowed !== false) fail('silent omission must be prohibited.');
if (policy.success_condition?.publication_effect !== 'none') fail('collection policy must have no publication effect.');

const boundary = policy.write_boundary ?? {};
if (JSON.stringify(boundary.allowed_outputs) !== JSON.stringify([
  'data/candidates/nar-monthly-2026-07-full-month-candidates.json',
  'data/generated/timetable/nar-monthly-2026-07-full-month-collection-report.json',
])) fail('full-month allowed output paths differ.');
if (boundary.candidate_write !== 'needs_review_only') fail('candidate write must remain needs_review_only.');
if (boundary.canonical_write !== 'disabled' || boundary.public_write !== 'disabled') fail('canonical/public writes must be disabled.');
if (boundary.raw_source_storage !== 'disabled' || boundary.schedule_mode !== 'disabled') fail('raw/scheduled writes must be disabled.');

if (policy.promotion_boundary?.candidate_promotion_eligible !== false) fail('candidates must not be promotion-eligible before review.');
if (policy.promotion_boundary?.human_review_required_before_canonical !== true) fail('human review must be required before canonical.');
if (policy.promotion_boundary?.partial_promotions_do_not_complete_month !== true) fail('partial promotions must not complete the month.');

if (matrix.records?.length !== 14) fail('NAR compatibility matrix must contain fourteen flat-racing records.');
const inactive = matrix.records.filter((record) => record.target_month_state === 'no_meeting_in_2026_07').map((record) => record.racecourse_id).sort();
if (JSON.stringify(inactive) !== JSON.stringify(['himeji-racecourse', 'mizusawa-racecourse'])) fail('July inactive racecourses must be Himeji and Mizusawa.');

for (const phrase of [
  '2026-07-01 through 2026-07-31 inclusive',
  'scheduled_pending_details',
  'partial `through_date` run',
  'every official July meeting date',
]) {
  if (!contract.includes(phrase)) fail(`monthly contract missing: ${phrase}`);
}
for (const marker of ['parseNarMonthlyScheduleGrid', 'findDayHeader', 'raceListUrlForCell', 'isMeetingCell']) {
  if (!parser.includes(marker)) fail(`full-month schedule parser missing marker: ${marker}`);
}
for (const marker of ['nar-monthly-2026-07-full-month-candidates.json', 'schedule_scope_complete', 'scheduled_pending_details']) {
  if (!fullMonthCollector.includes(marker)) fail(`full-month collector missing marker: ${marker}`);
}
for (const marker of ['Full-month boundary differs.', 'Partial through-date runs are not completion evidence.', 'automation/nar-full-month-2026-07']) {
  if (!fullMonthOperator.includes(marker)) fail(`full-month operator missing marker: ${marker}`);
}
for (const marker of ['2026-07-01 through 2026-07-31 inclusive', 'partial cutoff', 'Banei detail parsing remains separate']) {
  if (!baneiPlan.includes(marker)) fail(`Banei full-month plan missing marker: ${marker}`);
}

if (/^\s*schedule:/m.test(scheduledWorkflow) || scheduledWorkflow.includes('cron:')) fail('scheduled refresh must remain disabled.');

if (errors.length) {
  console.error(`CALENDAR_NAR_MONTHLY_COLLECTION_POLICY: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('CALENDAR_NAR_MONTHLY_COLLECTION_POLICY: pass');
console.log('MONTH_BOUNDARY: 2026-07-01..2026-07-31');
console.log('RACECOURSES_CLASSIFIED: 14');
console.log('FUTURE_DETAIL_GAPS: explicit_pending');
console.log('PARTIAL_CUTOFF_COMPLETION_ALLOWED: false');
console.log('CANONICAL_WRITE: disabled');
console.log('PUBLIC_WRITE: disabled');
