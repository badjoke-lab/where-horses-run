import { readFileSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const readJson = (file) => JSON.parse(readFileSync(path.join(root, file), 'utf8'));
const intake = readJson('data/generated/timetable/jra-planned-program-intake.json');
const review = readJson('data/generated/timetable/jra-planned-program-review.json');
const control = readJson('data/static/jra-pilot-control.json');

for (const script of ['scripts/timetable/build-jra-planned-program-intake.mjs','scripts/timetable/build-jra-planned-program-review.mjs']) {
  const result = spawnSync(process.execPath, [script, '--check'], { cwd: root, encoding: 'utf8' });
  if (result.status !== 0) fail(`${script} check failed.`);
}

if (intake.schema_version !== 'jra-planned-program-intake-v1') fail('intake schema mismatch.');
if (review.schema_version !== 'jra-planned-program-review-v1') fail('review schema mismatch.');
if (intake.source_stage !== 'planned_program') fail('intake stage mismatch.');
if (control.candidate_generation_requires_source_stage !== 'final_program') fail('control stage mismatch.');
if (intake.promotion_eligible !== false) fail('planned intake must remain blocked.');
if (intake.records.length !== 6) fail('six meetings are required.');

let rowCount = 0;
const ids = new Set();
for (const record of intake.records) {
  if (ids.has(record.meeting_id)) fail(`duplicate ${record.meeting_id}.`);
  ids.add(record.meeting_id);
  if (record.timetable_rows.length !== 12) fail(`${record.meeting_id} must have 12 rows.`);
  if (record.timetable_rows[0].post_time_local !== record.first_race_time_local) fail(`${record.meeting_id} first time mismatch.`);
  if (record.timetable_rows.at(-1).post_time_local !== record.last_race_time_local) fail(`${record.meeting_id} last time mismatch.`);
  if (new URL(record.source.official_url).hostname !== 'www.jra.go.jp') fail(`${record.meeting_id} host mismatch.`);
  for (const [index, row] of record.timetable_rows.entries()) {
    rowCount += 1;
    if (row.label !== `Race ${index + 1}`) fail(`${record.meeting_id} labels are not continuous.`);
    if ([row.race_name, row.distance_m, row.surface, row.course_label].some((value) => value !== null)) fail(`${record.meeting_id} contains fields outside this intake stage.`);
  }
}
if (rowCount !== 72) fail('72 rows are required.');

if (review.source.freshness_pass !== true) fail('freshness must pass.');
if (review.source.source_stage_final !== false) fail('planned stage must not be final.');
if (review.source.official_host_pass !== true) fail('official host must pass.');
if (review.records.meeting_count !== 6 || review.records.timetable_row_count !== 72) fail('review counts mismatch.');
if (review.records.row_shape_pass !== true || review.records.optional_fields_null !== true) fail('row checks must pass.');
if (review.candidate_generation.permitted_now !== false) fail('candidate generation must remain blocked.');
if (!review.candidate_generation.blockers.includes('source_stage_not_final')) fail('final-stage blocker is missing.');
if (review.scope.racecourse_scope_pass === false && !review.candidate_generation.blockers.includes('readiness_racecourse_scope_expansion_required')) fail('scope blocker is missing.');
if (Object.values(intake.boundaries).some(Boolean)) fail('intake boundaries must all remain false.');
if (Object.values(review.boundaries).some(Boolean)) fail('review boundaries must all remain false.');

if (errors.length) {
  console.error(`JRA_PLANNED_INTAKE: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`JRA_PLANNED_INTAKE: pass meetings=${intake.records.length} rows=${rowCount}`);
console.log('FRESHNESS_PASS: true');
console.log('SOURCE_STAGE_FINAL: false');
console.log('CANDIDATE_GENERATION_PERMITTED: false');
console.log(`RACECOURSE_SCOPE_PASS: ${review.scope.racecourse_scope_pass}`);
