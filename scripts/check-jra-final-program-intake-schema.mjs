import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { jraFinalProgramIntakeContract, validateJraFinalProgramIntake } from './timetable/jra-final-program-intake-validation.mjs';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const read = (file) => readFileSync(path.join(root, file), 'utf8');
const parse = (file) => JSON.parse(read(file));
const schema = parse('data/static/jra-final-program-intake.schema.json');
const planned = parse('data/generated/timetable/jra-planned-program-intake.json');
const control = parse('data/static/jra-pilot-control.json');

function makeFinal({ approved = false } = {}) {
  const final = structuredClone(planned);
  final.schema_version = 'jra-final-program-intake-v1';
  final.work_id = 'WHR-CAL-JAPAN-JRA';
  final.generated_at = '2026-07-02T07:30:00.000Z';
  final.source_stage = 'final_program';
  final.review_status = approved ? 'approved' : 'needs_review';
  final.promotion_eligible = false;
  final.review = {
    status: approved ? 'approved' : 'needs_review',
    reviewer: approved ? 'jra-final-intake-schema-validator' : null,
    reviewed_at: approved ? '2026-07-02T08:00:00.000Z' : null,
    summary: approved ? 'Approved in-memory schema fixture.' : 'In-memory fixture awaiting review.'
  };
  final.records = final.records.map((record) => ({
    ...record,
    source_stage: 'final_program',
    promotion_eligible: false,
    source: {
      ...record.source,
      checked_at: '2026-07-02T07:30:00.000Z',
      acquisition_method: 'reviewed_final_program_fixture'
    }
  }));
  return final;
}

function expectValid(label, value) {
  const result = validateJraFinalProgramIntake(value, control);
  if (!result.valid) fail(`${label} should be valid: ${result.errors.join(' | ')}`);
}

function expectInvalid(label, value, marker) {
  const result = validateJraFinalProgramIntake(value, control);
  if (result.valid) {
    fail(`${label} should be invalid.`);
    return;
  }
  if (marker && !result.errors.some((error) => error.includes(marker))) {
    fail(`${label} missing error marker ${marker}: ${result.errors.join(' | ')}`);
  }
}

if (schema.$schema !== 'https://json-schema.org/draft/2020-12/schema') fail('schema draft is incorrect.');
if (schema.$id !== 'https://whr.badjoke-lab.com/schemas/jra-final-program-intake.schema.json') fail('schema ID is incorrect.');
if (schema.type !== 'object' || schema.additionalProperties !== false) fail('top-level schema must be closed.');
if (schema.properties?.schema_version?.const !== 'jra-final-program-intake-v1') fail('schema_version const is incorrect.');
if (schema.properties?.source_stage?.const !== 'final_program') fail('source_stage const is incorrect.');
if (schema.properties?.promotion_eligible?.const !== false) fail('promotion_eligible must be false.');
for (const key of ['record', 'row', 'source', 'review', 'boundaries']) {
  if (schema.$defs?.[key]?.additionalProperties !== false) fail(`${key} schema must reject extra keys.`);
}
for (const key of jraFinalProgramIntakeContract.top_level_keys) {
  if (!Object.hasOwn(schema.properties, key)) fail(`schema missing top-level key ${key}.`);
}
for (const key of jraFinalProgramIntakeContract.record_keys) {
  if (!Object.hasOwn(schema.$defs.record.properties, key)) fail(`schema missing record key ${key}.`);
}
for (const key of jraFinalProgramIntakeContract.row_keys) {
  if (!Object.hasOwn(schema.$defs.row.properties, key)) fail(`schema missing row key ${key}.`);
}
for (const key of jraFinalProgramIntakeContract.boundary_keys) {
  if (schema.$defs.boundaries.properties?.[key]?.const !== false) fail(`schema boundary ${key} must be false.`);
}

expectValid('needs-review final fixture', makeFinal());
expectValid('approved final fixture', makeFinal({ approved: true }));

const cases = [];
function invalidCase(label, mutate, marker) {
  const fixture = makeFinal();
  mutate(fixture);
  cases.push([label, fixture, marker]);
}

invalidCase('wrong schema version', (v) => { v.schema_version = 'jra-final-program-intake-v2'; }, 'schema_version');
invalidCase('wrong Work ID', (v) => { v.work_id = 'WHR-CAL-JAPAN-NAR'; }, 'work_id');
invalidCase('wrong source stage', (v) => { v.source_stage = 'planned_program'; }, 'source_stage');
invalidCase('promotion eligible true', (v) => { v.promotion_eligible = true; }, 'promotion_eligible');
invalidCase('invalid generated_at', (v) => { v.generated_at = 'not-a-date'; }, 'generated_at');
invalidCase('invalid cutoff', (v) => { v.final_confirmation_after = 'not-a-date'; }, 'final_confirmation_after');
invalidCase('extra top-level key', (v) => { v.private_note = 'not allowed'; }, 'private_note');
invalidCase('review status mismatch', (v) => { v.review_status = 'approved'; }, 'must match');
invalidCase('needs-review with reviewer', (v) => { v.review.reviewer = 'someone'; }, 'must be null');
invalidCase('approved without reviewer', (v) => { v.review_status = 'approved'; v.review.status = 'approved'; v.review.reviewer = null; v.review.reviewed_at = '2026-07-02T08:00:00.000Z'; }, 'reviewer is required');
invalidCase('approved without review time', (v) => { v.review_status = 'approved'; v.review.status = 'approved'; v.review.reviewer = 'reviewer'; v.review.reviewed_at = null; }, 'reviewed_at');
invalidCase('duplicate meeting ID', (v) => { v.records[1].meeting_id = v.records[0].meeting_id; }, 'duplicates');
invalidCase('wrong country', (v) => { v.records[0].country_id = 'hong-kong'; }, 'country_id');
invalidCase('wrong authority', (v) => { v.records[0].authority_id = 'nar'; }, 'authority_id');
invalidCase('wrong system', (v) => { v.records[0].racing_system_id = 'invented-system'; }, 'racing_system_id');
invalidCase('invalid racecourse ID', (v) => { v.records[0].racecourse_id = 'Bad ID'; }, 'racecourse_id');
invalidCase('impossible date', (v) => { v.records[0].date = '2026-02-30'; }, 'real calendar date');
invalidCase('wrong timezone', (v) => { v.records[0].timezone = 'UTC'; }, 'timezone');
invalidCase('invalid first time', (v) => { v.records[0].first_race_time_local = '25:00'; }, 'first_race_time_local');
invalidCase('non-continuous label', (v) => { v.records[0].timetable_rows[1].label = 'Race 3'; }, 'must equal Race 2');
invalidCase('first time mismatch', (v) => { v.records[0].first_race_time_local = '09:00'; }, 'must match the first');
invalidCase('last time mismatch', (v) => { v.records[0].last_race_time_local = '17:00'; }, 'must match the last');
invalidCase('invalid distance', (v) => { v.records[0].timetable_rows[0].distance_m = 0; }, 'distance_m');
invalidCase('extra record key', (v) => { v.records[0].extra = true; }, 'extra is not allowed');
invalidCase('extra row key', (v) => { v.records[0].timetable_rows[0].weather = 'clear'; }, 'weather is not allowed');
invalidCase('wrong source ID', (v) => { v.records[0].source.source_id = 'other-source'; }, 'source_id');
invalidCase('non-HTTPS source', (v) => { v.records[0].source.official_url = 'http://www.jra.go.jp/final'; }, 'must use HTTPS');
invalidCase('unapproved host', (v) => { v.records[0].source.official_url = 'https://example.com/final'; }, 'allowed JRA host');
invalidCase('invalid checked time', (v) => { v.records[0].source.checked_at = 'yesterday'; }, 'checked_at');
invalidCase('wrong acquisition method', (v) => { v.records[0].source.acquisition_method = 'live_fetch'; }, 'acquisition_method');
invalidCase('boundary true', (v) => { v.boundaries.candidate_generated = true; }, 'candidate_generated');
invalidCase('extra boundary key', (v) => { v.boundaries.direct_publish = false; }, 'direct_publish is not allowed');
invalidCase('participant-name key', (v) => { v.records[0].timetable_rows[0].horse_name = 'Example'; }, 'horse_name');
invalidCase('rider-name key', (v) => { v.records[0].timetable_rows[0].jockey_name = 'Example'; }, 'jockey_name');
invalidCase('trainer-name key', (v) => { v.records[0].trainer_name = 'Example'; }, 'trainer_name');
invalidCase('price key', (v) => { v.records[0].timetable_rows[0].odds = 2.5; }, 'odds');
invalidCase('payment key', (v) => { v.records[0].payout = 100; }, 'payout');
invalidCase('forecast key', (v) => { v.prediction = 'Example'; }, 'prediction');
invalidCase('raw markup key', (v) => { v.records[0].source.raw_html = '<html></html>'; }, 'raw_html');
invalidCase('source content key', (v) => { v.source_body_content = 'text'; }, 'source_body_content');
invalidCase('media route key', (v) => { v.records[0].stream_url = 'https://example.com'; }, 'stream_url');

for (const [label, value, marker] of cases) expectInvalid(label, value, marker);

if (existsSync(path.join(root, 'data/generated/timetable/jra-final-program-intake.json'))) {
  fail('No actual JRA final-program intake may be committed before official final review.');
}

const confirmationCore = read('scripts/timetable/jra-final-confirmation-core.mjs');
for (const marker of ['assertJraFinalProgramIntake', 'jra-final-program-intake-validation.mjs']) {
  if (!confirmationCore.includes(marker)) fail(`final-confirmation core missing ${marker}.`);
}

if (errors.length) {
  console.error(`JRA_FINAL_PROGRAM_INTAKE_SCHEMA: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`JRA_FINAL_PROGRAM_INTAKE_SCHEMA: pass invalid_cases=${cases.length}`);
console.log('VALID_NEEDS_REVIEW_FIXTURE: pass');
console.log('VALID_APPROVED_FIXTURE: pass');
console.log('PROHIBITED_DETAIL_KEYS: blocked');
console.log('ACTUAL_FINAL_FIXTURE_COMMITTED: false');
