import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  coverageObservationContract,
  validateCoverageObservation,
} from './timetable/coverage-observation-validation.mjs';

const root = process.cwd();
const schemaPath = 'data/static/calendar-coverage-observation.schema.json';
const schema = JSON.parse(readFileSync(path.join(root, schemaPath), 'utf8'));
const errors = [];
const fail = (message) => errors.push(message);

function baseObservation() {
  return {
    schema_version: 'calendar-coverage-observation-v1',
    run_id: 'nar-run-2026-07-06',
    system_id: 'japan-nar-system',
    source_id: 'nar-race-list-deba-table',
    checked_at: '2026-07-06T12:00:00.000Z',
    requested_scope: {
      kind: 'date_window',
      start_date: '2026-07-01',
      end_date_exclusive: '2026-08-01',
      timezone: 'Asia/Tokyo',
    },
    observed_scope: {
      kind: 'source_visible_horizon',
      start_date: '2026-07-01',
      end_date_exclusive: '2026-07-15',
      timezone: 'Asia/Tokyo',
    },
    collection_mode: 'date_window',
    records_discovered: 42,
    records_updated: 18,
    unresolved_dates: ['2026-07-15', '2026-07-16'],
    unresolved_meeting_ids: [],
    source_errors: [],
    coverage_claim: 'partial',
    completion_audit_ref: null,
  };
}

function expectValid(label, value) {
  const result = validateCoverageObservation(value);
  if (!result.valid) fail(`${label} should be valid: ${result.errors.join(' | ')}`);
}

function expectInvalid(label, mutate, marker) {
  const value = structuredClone(baseObservation());
  mutate(value);
  const result = validateCoverageObservation(value);
  if (result.valid) {
    fail(`${label} should be invalid.`);
    return;
  }
  if (marker && !result.errors.some((error) => error.includes(marker))) {
    fail(`${label} missing error marker ${marker}: ${result.errors.join(' | ')}`);
  }
}

if (schema.$schema !== 'https://json-schema.org/draft/2020-12/schema') fail('schema draft is incorrect.');
if (schema.$id !== 'https://whr.badjoke-lab.com/schemas/calendar-coverage-observation.schema.json') fail('schema ID is incorrect.');
if (schema.type !== 'object' || schema.additionalProperties !== false) fail('top-level schema must be closed.');
if (schema.properties?.schema_version?.const !== coverageObservationContract.schema_version) fail('schema version differs from validation core.');

const schemaRequired = schema.required ?? [];
if (JSON.stringify(schemaRequired) !== JSON.stringify(coverageObservationContract.top_level_keys)) fail('schema required keys differ from validation core.');
for (const key of coverageObservationContract.top_level_keys) {
  if (!Object.hasOwn(schema.properties ?? {}, key)) fail(`schema missing top-level property ${key}.`);
}
if (JSON.stringify(schema.properties?.collection_mode?.enum) !== JSON.stringify(coverageObservationContract.collection_modes)) fail('collection_mode enum differs.');
if (JSON.stringify(schema.properties?.coverage_claim?.enum) !== JSON.stringify(coverageObservationContract.coverage_claims)) fail('coverage_claim enum differs.');
if (JSON.stringify(schema.$defs?.sourceError?.properties?.code?.enum) !== JSON.stringify(coverageObservationContract.source_error_codes)) fail('source error enum differs.');

const schemaScopeKinds = (schema.$defs?.scope?.oneOf ?? [])
  .map((entry) => entry.$ref?.split('/').at(-1))
  .filter(Boolean);
if (schemaScopeKinds.length !== 5) fail('scope union must contain five variants.');
for (const name of ['dateWindowScope', 'singleDateScope', 'selectedMeetingsScope', 'sourceVisibleHorizonScope', 'notObservedScope']) {
  if (!schemaScopeKinds.includes(name)) fail(`scope union missing ${name}.`);
}
for (const name of schemaScopeKinds) {
  if (schema.$defs?.[name]?.additionalProperties !== false) fail(`${name} must reject extra keys.`);
}

expectValid('partial observation with shorter source horizon', baseObservation());

const noObservation = structuredClone(baseObservation());
noObservation.observed_scope = { kind: 'not_observed', timezone: 'Asia/Tokyo' };
noObservation.records_discovered = 0;
noObservation.records_updated = 0;
noObservation.unresolved_dates = [];
noObservation.source_errors = [{ code: 'source_unavailable', scope_ref: 'requested_scope', message: 'Official route unavailable during this run.' }];
noObservation.coverage_claim = 'none';
expectValid('no-observation source failure', noObservation);

const selectedRetry = structuredClone(baseObservation());
selectedRetry.requested_scope = {
  kind: 'selected_meetings',
  meeting_ids: ['nar-oi-racecourse-2026-07-20', 'nar-kawasaki-racecourse-2026-07-21'],
  timezone: 'Asia/Tokyo',
};
selectedRetry.observed_scope = structuredClone(selectedRetry.requested_scope);
selectedRetry.collection_mode = 'selected_meetings';
selectedRetry.records_discovered = 2;
selectedRetry.records_updated = 1;
selectedRetry.unresolved_dates = [];
selectedRetry.unresolved_meeting_ids = ['nar-kawasaki-racecourse-2026-07-21'];
selectedRetry.coverage_claim = 'partial';
expectValid('selected meeting retry', selectedRetry);

const auditedComplete = structuredClone(baseObservation());
auditedComplete.observed_scope = structuredClone(auditedComplete.requested_scope);
auditedComplete.records_discovered = 88;
auditedComplete.records_updated = 88;
auditedComplete.unresolved_dates = [];
auditedComplete.coverage_claim = 'audited_complete';
auditedComplete.completion_audit_ref = 'data/audits/nar-july-2026-completion.json';
expectValid('audited complete observation', auditedComplete);

expectInvalid('wrong schema version', (v) => { v.schema_version = 'calendar-coverage-observation-v2'; }, 'schema_version');
expectInvalid('extra top-level key', (v) => { v.complete_month = true; }, 'complete_month');
expectInvalid('invalid run ID', (v) => { v.run_id = 'BAD ID'; }, 'run_id');
expectInvalid('invalid checked time', (v) => { v.checked_at = 'today'; }, 'checked_at');
expectInvalid('backwards date range', (v) => { v.requested_scope.end_date_exclusive = '2026-06-01'; }, 'after start_date');
expectInvalid('impossible scope date', (v) => { v.requested_scope.start_date = '2026-02-30'; }, 'real YYYY-MM-DD');
expectInvalid('collection mode mismatch', (v) => { v.collection_mode = 'single_date'; }, 'requires single_date');
expectInvalid('negative discovered count', (v) => { v.records_discovered = -1; }, 'records_discovered');
expectInvalid('updated exceeds discovered', (v) => { v.records_updated = 100; }, 'must not exceed');
expectInvalid('duplicate unresolved date', (v) => { v.unresolved_dates = ['2026-07-15', '2026-07-15']; }, 'duplicates');
expectInvalid('invalid unresolved date', (v) => { v.unresolved_dates = ['2026-02-30']; }, 'real YYYY-MM-DD');
expectInvalid('unsupported source error', (v) => { v.source_errors = [{ code: 'network_bad', scope_ref: 'x', message: 'x' }]; }, 'code is unsupported');
expectInvalid('non-audited completion ref', (v) => { v.completion_audit_ref = 'data/audits/example.json'; }, 'must be null');
expectInvalid('audited complete without ref', (v) => { v.coverage_claim = 'audited_complete'; v.completion_audit_ref = null; v.unresolved_dates = []; }, 'requires a safe repository');
expectInvalid('audited complete with unresolved date', (v) => { v.coverage_claim = 'audited_complete'; v.completion_audit_ref = 'data/audits/example.json'; }, 'cannot contain unresolved');
expectInvalid('unsafe completion ref', (v) => { v.coverage_claim = 'audited_complete'; v.completion_audit_ref = 'data/audits/../private.json'; v.unresolved_dates = []; }, 'requires a safe repository');
expectInvalid('participant key', (v) => { v.source_errors = [{ code: 'other', scope_ref: 'x', message: 'x', horse_name: 'Example' }]; }, 'horse_name');
expectInvalid('raw source key', (v) => { v.requested_scope.raw_html = '<html></html>'; }, 'raw_html');
expectInvalid('empty selected meeting retry', (v) => { v.requested_scope = { kind: 'selected_meetings', meeting_ids: [], timezone: 'Asia/Tokyo' }; v.collection_mode = 'selected_meetings'; }, 'must not be empty');

if (errors.length) {
  console.error(`CALENDAR_COVERAGE_OBSERVATION_SCHEMA: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('CALENDAR_COVERAGE_OBSERVATION_SCHEMA: pass');
console.log('PARTIAL_SHORTER_THAN_REQUESTED: valid');
console.log('IRREGULAR_SELECTED_MEETING_RETRY: valid');
console.log('AUDITED_COMPLETE_REQUIRES_AUDIT_REF: enforced');
console.log('ABSENCE_IS_NOT_DELETION: observation contract does not encode implicit delete state');
console.log(`COLLECTION_MODES: ${coverageObservationContract.collection_modes.join(',')}`);
console.log(`COVERAGE_CLAIMS: ${coverageObservationContract.coverage_claims.join(',')}`);
