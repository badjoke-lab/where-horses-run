import fs from 'node:fs';
import path from 'node:path';
import { loadCalendarAcquisitionRegistryV1 } from './timetable/load-calendar-acquisition-registry.mjs';
import { validateCoverageObservation } from './timetable/coverage-observation-validation.mjs';
import {
  collectionResultManifestV1Contract,
  validateCollectionResultManifestAgainstCoverageV1,
  validateCollectionResultManifestAgainstJobV1,
  validateCollectionResultManifestV1,
} from './timetable/collection-result-manifest-validation.mjs';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
const readText = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const exact = (left, right) => JSON.stringify(left) === JSON.stringify(right);

const schema = readJson('data/static/calendar-collection-result-manifest.schema.json');
const fixtures = readJson('data/fixtures/calendar-collection-result-manifests-v1.json');
const invalidFixtures = readJson('data/fixtures/calendar-collection-result-manifest-invalid-cases-v1.json');
const jobFixtures = readJson('data/fixtures/calendar-collection-jobs-v1.json');
const registry = loadCalendarAcquisitionRegistryV1(root);
const jobsById = new Map((jobFixtures.jobs ?? []).map((job) => [job.job_id, job]));

if (schema.$schema !== 'https://json-schema.org/draft/2020-12/schema') fail('Result Manifest schema draft differs.');
if (schema.$id !== 'https://whr.badjoke-lab.com/schemas/calendar-collection-result-manifest.schema.json') fail('Result Manifest schema ID differs.');
if (schema.type !== 'object' || schema.additionalProperties !== false) fail('Result Manifest schema must be a closed object.');
if (schema.properties?.schema_version?.const !== collectionResultManifestV1Contract.schema_version) fail('Result Manifest schema version differs from validation core.');
if (!exact(schema.required, collectionResultManifestV1Contract.top_level_keys)) fail('Result Manifest required keys differ from validation core.');
if (!exact(schema.properties?.runner_used?.enum, collectionResultManifestV1Contract.runners)) fail('Result Manifest runner enum differs.');
if (!exact(schema.properties?.coverage_claim?.enum, collectionResultManifestV1Contract.coverage_claims)) fail('Result Manifest coverage enum differs.');
if (!exact(schema.properties?.rank_counts?.required, collectionResultManifestV1Contract.ranks)) fail('Result Manifest rank keys differ.');
if (!exact(schema.$defs?.sourceError?.properties?.code?.enum, collectionResultManifestV1Contract.source_error_codes)) fail('Result Manifest source error enum differs.');
if (!exact(schema.properties?.artifact_refs?.required, collectionResultManifestV1Contract.artifact_keys)) fail('Result Manifest artifact keys differ.');

if (fixtures.schema_version !== 'calendar-collection-result-manifest-fixtures-v1') fail('Result Manifest fixture schema differs.');
if (!Array.isArray(fixtures.cases) || fixtures.cases.length < 4) fail('at least four valid Result Manifest cases are required.');
const validCaseIds = new Set();
for (const [index, testCase] of (fixtures.cases ?? []).entries()) {
  const label = `valid case[${index}] ${testCase.case_id ?? 'unknown'}`;
  if (validCaseIds.has(testCase.case_id)) fail(`duplicate valid case_id ${testCase.case_id}`);
  validCaseIds.add(testCase.case_id);
  const manifestErrors = validateCollectionResultManifestV1(testCase.manifest);
  if (manifestErrors.length) fail(`${label} structural validation failed: ${manifestErrors.join('; ')}`);
  const job = jobsById.get(testCase.manifest?.job_id);
  const jobErrors = validateCollectionResultManifestAgainstJobV1(testCase.manifest, job, registry);
  if (jobErrors.length) fail(`${label} Job cross-check failed: ${jobErrors.join('; ')}`);
  const coverageResult = validateCoverageObservation(testCase.coverage_observation);
  if (!coverageResult.valid) fail(`${label} Coverage Observation failed: ${coverageResult.errors.join('; ')}`);
  const coverageErrors = validateCollectionResultManifestAgainstCoverageV1(testCase.manifest, testCase.coverage_observation);
  if (coverageErrors.length) fail(`${label} coverage cross-check failed: ${coverageErrors.join('; ')}`);
}

const july = fixtures.cases.find((entry) => entry.case_id === 'nar-july-remainder-source-window-complete')?.manifest;
if (!july) fail('NAR July remainder Result Manifest fixture is missing.');
else {
  if (july.records_discovered !== 82 || july.rank_counts.C !== 71 || july.rank_counts['A+'] !== 11) fail('NAR July rank distribution fixture differs.');
  if (july.unresolved_meeting_ids.length !== 71) fail('NAR July pending detail retry count differs.');
}
const partial = fixtures.cases.find((entry) => entry.case_id === 'jra-local-partial-window')?.manifest;
if (partial?.coverage_claim !== 'partial') fail('partial coverage Result Manifest fixture is missing.');
const fallback = fixtures.cases.find((entry) => entry.case_id === 'nar-selected-retry-fallback-success')?.manifest;
if (fallback?.runner_used !== 'local') fail('NAR fallback-runner Result Manifest fixture is missing.');
const sourceError = fixtures.cases.find((entry) => entry.case_id === 'nar-source-error-no-observation')?.manifest;
if (sourceError?.coverage_claim !== 'none' || sourceError?.source_errors?.length !== 1 || sourceError?.records_discovered !== 0) fail('source-error Result Manifest fixture differs.');

if (invalidFixtures.schema_version !== 'calendar-collection-result-manifest-invalid-cases-v1') fail('invalid Result Manifest fixture schema differs.');
if (!Array.isArray(invalidFixtures.cases) || invalidFixtures.cases.length < 8) fail('at least eight invalid Result Manifest cases are required.');
const invalidCaseIds = new Set();
const invalidBase = fixtures.cases.find((entry) => entry.case_id === invalidFixtures.base_case_id)?.manifest;
if (!invalidBase) fail('invalid Result Manifest base fixture is missing.');
function applyPatches(base, patches) {
  const value = structuredClone(base);
  for (const patch of patches ?? []) {
    let target = value;
    const segments = patch.path ?? [];
    for (const segment of segments.slice(0, -1)) target = target[segment];
    target[segments.at(-1)] = structuredClone(patch.value);
  }
  return value;
}
for (const [index, testCase] of (invalidFixtures.cases ?? []).entries()) {
  if (invalidCaseIds.has(testCase.case_id)) fail(`duplicate invalid case_id ${testCase.case_id}`);
  invalidCaseIds.add(testCase.case_id);
  const manifest = applyPatches(invalidBase, testCase.patches);
  if (testCase.validation_mode === 'job_cross_check') {
    const structural = validateCollectionResultManifestV1(manifest);
    if (structural.length) fail(`invalid job cross-check case[${index}] must be structurally valid: ${structural.join('; ')}`);
    const job = jobsById.get(manifest?.job_id);
    if (validateCollectionResultManifestAgainstJobV1(manifest, job, registry).length === 0) fail(`job cross-check case unexpectedly passed: ${testCase.case_id}`);
  } else if (validateCollectionResultManifestV1(manifest).length === 0) {
    fail(`invalid Result Manifest unexpectedly passed: ${testCase.case_id}`);
  }
}
for (const requiredCase of ['rank-count-sum-mismatch', 'records-updated-exceeds-discovered', 'unsupported-runner', 'duplicate-unresolved-date', 'unsafe-artifact-parent-ref', 'audited-complete-with-unresolved', 'unexpected-top-level-field', 'exact-runner-mismatch']) {
  if (!invalidCaseIds.has(requiredCase)) fail(`required invalid Result Manifest case missing: ${requiredCase}`);
}

const docs = readText('docs/calendar/collection-result-manifest.md');
for (const phrase of ['one manifest per Collection Job result', 'sum of the five rank counts must equal `records_discovered`', 'does not replace the candidate batch or Coverage Observation', 'runner_used']) {
  if (!docs.includes(phrase)) fail(`Result Manifest contract missing ${phrase}.`);
}
const implementationPlan = readText('docs/calendar/acquisition-control-plane-implementation-plan.md');
for (const phrase of ['Stage ACP-7 — Collection Result Manifest', 'Status: complete.', 'Stage ACP-8 — Review Queue']) {
  if (!implementationPlan.includes(phrase)) fail(`control-plane implementation plan missing ${phrase}.`);
}

if (errors.length) {
  console.error(`CALENDAR_COLLECTION_RESULT_MANIFEST: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}
console.log('CALENDAR_COLLECTION_RESULT_MANIFEST: pass');
console.log(`VALID_CASES: ${fixtures.cases.length}`);
console.log(`INVALID_CASES: ${invalidFixtures.cases.length}`);
console.log('RANK_DISTRIBUTION_ACCOUNTING: pass');
console.log('JOB_SCOPE_AND_RUNNER_CROSS_CHECK: pass');
console.log('COVERAGE_OBSERVATION_CROSS_CHECK: pass');
