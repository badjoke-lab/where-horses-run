import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outputPath = 'data/generated/timetable/jra-planned-program-review.json';
const check = process.argv.includes('--check');
const dryRun = process.argv.includes('--dry-run');
if (check && dryRun) throw new Error('--check and --dry-run are mutually exclusive.');

const readJson = (file) => JSON.parse(readFileSync(path.join(root, file), 'utf8'));
const maxDate = (values) => values.filter(Boolean).sort().at(-1) ?? null;
const control = readJson('data/static/jra-pilot-control.json');
const intake = readJson('data/generated/timetable/jra-planned-program-intake.json');
const readiness = readJson('data/static/calendar-readiness-registry.json');
const inventory = readJson('data/static/authority-source-inventory.json');

const readinessRecord = readiness.records.find((record) => record.authority_source_key === control.source_key);
const inventoryRecord = inventory.records.find((record) =>
  record.country_id === 'japan' && record.authority_id === 'jra' && record.official_source_id === 'jra-programme'
);
if (!readinessRecord || !inventoryRecord) throw new Error('JRA canonical source records are missing.');

const registryMinimumDate = maxDate([readinessRecord.checked_date, inventoryRecord.last_checked_date]);
const intakeCheckedDate = maxDate(intake.records.map((record) => record.source.checked_at.slice(0, 10)));
const freshnessPass = Boolean(intakeCheckedDate && registryMinimumDate && intakeCheckedDate >= registryMinimumDate);
const sourceStageAccepted = control.accepted_source_stages.includes(intake.source_stage);
const sourceStageFinal = intake.source_stage === control.candidate_generation_requires_source_stage;
const intakeRacecourses = [...new Set(intake.records.map((record) => record.racecourse_id))].sort();
const reviewedRacecourses = [...readinessRecord.racecourse_ids].sort();
const racecourseScopePass = reviewedRacecourses.length === 0 || intakeRacecourses.every((racecourseId) => reviewedRacecourses.includes(racecourseId));
const hostPass = intake.records.every((record) => control.allowed_hosts.includes(new URL(record.source.official_url).hostname));
const rowShapePass = intake.records.every((record) =>
  record.timetable_rows.length === 12 &&
  record.timetable_rows[0].post_time_local === record.first_race_time_local &&
  record.timetable_rows.at(-1).post_time_local === record.last_race_time_local &&
  record.timetable_rows.every((row, index) => row.label === `Race ${index + 1}`)
);
const optionalFieldsNull = intake.records.every((record) => record.timetable_rows.every((row) =>
  row.race_name === null && row.distance_m === null && row.surface === null && row.course_label === null
));
const blockers = [];
if (!freshnessPass) blockers.push('source_fixture_predates_registry');
if (!sourceStageAccepted) blockers.push('source_stage_not_accepted');
if (!sourceStageFinal) blockers.push('source_stage_not_final');
if (!racecourseScopePass) blockers.push('readiness_racecourse_scope_expansion_required');
if (!hostPass) blockers.push('official_host_mismatch');
if (!rowShapePass) blockers.push('timetable_row_shape_invalid');
if (!optionalFieldsNull) blockers.push('unreviewed_optional_fields_present');

const review = {
  schema_version: 'jra-planned-program-review-v1',
  work_id: 'WHR-CAL-JAPAN-JRA',
  generated_at: intake.generated_at,
  source_stage: intake.source_stage,
  final_confirmation_after: intake.final_confirmation_after,
  boundaries: {
    network_fetch_performed: false,
    source_body_stored: false,
    candidate_generated: false,
    candidate_approved: false,
    canonical_written: false,
    public_projection_written: false
  },
  source: {
    registry_minimum_date: registryMinimumDate,
    intake_checked_date: intakeCheckedDate,
    freshness_pass: freshnessPass,
    source_stage_accepted: sourceStageAccepted,
    source_stage_final: sourceStageFinal,
    official_host_pass: hostPass
  },
  scope: {
    intake_racecourse_ids: intakeRacecourses,
    reviewed_racecourse_ids: reviewedRacecourses,
    racecourse_scope_pass: racecourseScopePass
  },
  records: {
    meeting_count: intake.records.length,
    timetable_row_count: intake.records.reduce((sum, record) => sum + record.timetable_rows.length, 0),
    row_shape_pass: rowShapePass,
    optional_fields_null: optionalFieldsNull
  },
  candidate_generation: {
    allowed_by_control: control.candidate_generation_allowed,
    required_source_stage: control.candidate_generation_requires_source_stage,
    permitted_now: control.candidate_generation_allowed && freshnessPass && sourceStageFinal && racecourseScopePass && hostPass && rowShapePass && optionalFieldsNull,
    blockers
  },
  next_actions: [
    'wait_for_or_confirm_final_jra_programme',
    ...(racecourseScopePass ? [] : ['review_jra_racecourse_scope_expansion']),
    'regenerate_final_program_intake',
    'generate_candidate_v1_only_after_all_blockers_clear'
  ]
};

const serialized = `${JSON.stringify(review, null, 2)}\n`;
if (dryRun) {
  console.log(JSON.stringify({ source: review.source, scope: review.scope, records: review.records, candidate_generation: review.candidate_generation }, null, 2));
  process.exit(0);
}
const absoluteOutput = path.join(root, outputPath);
if (check) {
  if (!existsSync(absoluteOutput) || readFileSync(absoluteOutput, 'utf8') !== serialized) throw new Error('JRA planned-program review is stale.');
  console.log(`JRA_PLANNED_PROGRAM_REVIEW: current permitted_now=${review.candidate_generation.permitted_now}`);
  process.exit(0);
}
mkdirSync(path.dirname(absoluteOutput), { recursive: true });
writeFileSync(absoluteOutput, serialized);
console.log(`JRA_PLANNED_PROGRAM_REVIEW: wrote blockers=${blockers.length}`);
