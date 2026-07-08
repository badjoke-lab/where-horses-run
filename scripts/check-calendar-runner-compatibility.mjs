import fs from 'node:fs';
import path from 'node:path';
import { loadCalendarAcquisitionRegistryV1 } from './timetable/load-calendar-acquisition-registry.mjs';
import { validateCoverageObservation } from './timetable/coverage-observation-validation.mjs';
import {
  validateCollectionResultManifestAgainstCoverageV1,
  validateCollectionResultManifestAgainstJobV1,
  validateCollectionResultManifestV1,
} from './timetable/collection-result-manifest-validation.mjs';
import { validateCollectionJobV1 } from './timetable/collection-job-validation.mjs';
import {
  compareRunnerNeutralManifestSemanticsV1,
  compileRunnerExecutionV1,
  normalizeJraRefreshReportToCoverageV1,
  normalizeJraRefreshReportToManifestV1,
  normalizeNarV2BatchResultV1,
  runnerCompatibilityContractV1,
  validateRunnerExecutionV1,
} from './timetable/runner-compatibility.mjs';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
const readText = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const exact = (left, right) => JSON.stringify(left) === JSON.stringify(right);

const contract = readJson('data/static/calendar-runner-compatibility-contract-v1.json');
const fixtures = readJson('data/fixtures/calendar-runner-compatibility-fixtures-v1.json');
const invalidFixtures = readJson('data/fixtures/calendar-runner-compatibility-invalid-cases-v1.json');
const registry = loadCalendarAcquisitionRegistryV1(root);
const narReport = readJson('data/generated/timetable/nar-incremental-batches/july-2026-08-through-31-run-001/collection-report.json');
const narCoverage = readJson('data/generated/timetable/nar-incremental-batches/july-2026-08-through-31-run-001/coverage-observation.json');
const jraReport = readJson('data/generated/timetable/jra-refresh-report.json');
const jobsById = new Map((fixtures.jobs ?? []).map((job) => [job.job_id, job]));

if (contract.schema_version !== 'calendar-runner-compatibility-contract-v1') fail('runner compatibility contract schema_version differs.');
if (contract.execution_contract !== runnerCompatibilityContractV1.execution_schema_version) fail('execution contract identity differs from core.');
if (contract.result_contract !== 'calendar-collection-result-manifest-v1') fail('result contract identity differs.');
if (contract.coverage_contract !== 'calendar-coverage-observation-v1') fail('coverage contract identity differs.');
if (!Array.isArray(contract.executors) || contract.executors.length < 4) fail('at least four runner compatibility executor mappings are required.');

const executorKeys = new Set();
for (const [index, executor] of (contract.executors ?? []).entries()) {
  const key = `${executor.system_id}:${executor.runner}`;
  if (executorKeys.has(key)) fail(`duplicate executor mapping ${key}`);
  executorKeys.add(key);
  const profile = registry.records.find((record) => record.system_id === executor.system_id);
  if (!profile) fail(`executor[${index}] Registry profile missing for ${executor.system_id}`);
  else if (![profile.primary_runner, profile.fallback_runner].filter(Boolean).includes(executor.runner)) {
    fail(`executor[${index}] runner ${executor.runner} is not registered for ${executor.system_id}`);
  }
  if (executor.entry_point !== null && !fs.existsSync(path.join(root, executor.entry_point))) {
    fail(`executor[${index}] entry point does not exist: ${executor.entry_point}`);
  }
}
for (const required of [
  'japan-nar-system:github_actions',
  'japan-nar-system:local',
  'japan-jra-system:local',
  'japan-jra-system:reviewed_import',
]) {
  if (!executorKeys.has(required)) fail(`required executor mapping missing: ${required}`);
}

const expectedBoundary = {
  approval: false,
  promotion: false,
  canonical_write: false,
  public_write: false,
  publication: false,
  deployment: false,
};
if (!exact(contract.side_effect_boundary, expectedBoundary)) fail('compatibility contract side-effect boundary differs.');

if (fixtures.schema_version !== 'calendar-runner-compatibility-fixtures-v1') fail('runner compatibility fixture schema differs.');
if (!Array.isArray(fixtures.jobs) || fixtures.jobs.length < 3) fail('at least three compatibility Jobs are required.');
for (const job of fixtures.jobs ?? []) {
  const jobErrors = validateCollectionJobV1(job, registry);
  if (jobErrors.length) fail(`compatibility Job ${job.job_id} invalid: ${jobErrors.join('; ')}`);
}

const executionsByCaseId = new Map();
for (const testCase of fixtures.execution_cases ?? []) {
  const job = jobsById.get(testCase.job_id);
  if (!job) {
    fail(`execution case ${testCase.case_id} missing Job ${testCase.job_id}`);
    continue;
  }
  try {
    const execution = compileRunnerExecutionV1(job, {
      batch_id: testCase.batch_id,
      requested_runner: testCase.requested_runner,
    }, registry, contract);
    executionsByCaseId.set(testCase.case_id, execution);
    if (execution.runner_used !== testCase.expected_runner) fail(`${testCase.case_id} runner resolution differs.`);
    if (execution.executor_id !== testCase.expected_executor_id) fail(`${testCase.case_id} executor resolution differs.`);
    const validationErrors = validateRunnerExecutionV1(execution, job, registry, contract);
    if (validationErrors.length) fail(`${testCase.case_id} execution validation failed: ${validationErrors.join('; ')}`);
  } catch (error) {
    fail(`${testCase.case_id} compilation failed: ${error.message}`);
  }
}

const narJob = jobsById.get('nar-july-remainder-compatibility-001');
const narCoverageValidation = validateCoverageObservation(narCoverage);
if (!narCoverageValidation.valid) fail(`actual NAR Coverage Observation invalid: ${narCoverageValidation.errors.join('; ')}`);

let narActionsManifest = null;
let narLocalManifest = null;
try {
  narActionsManifest = normalizeNarV2BatchResultV1({
    job: narJob,
    runner_used: 'github_actions',
    report: narReport,
    coverage: narCoverage,
    collection_report_ref: 'data/generated/timetable/nar-incremental-batches/july-2026-08-through-31-run-001/collection-report.json',
  });
  narLocalManifest = normalizeNarV2BatchResultV1({
    job: narJob,
    runner_used: 'local',
    report: narReport,
    coverage: narCoverage,
    collection_report_ref: 'data/generated/timetable/nar-incremental-batches/july-2026-08-through-31-run-001/collection-report.json',
  });
} catch (error) {
  fail(`NAR result normalization failed: ${error.message}`);
}

for (const [label, manifest] of [['actions', narActionsManifest], ['local', narLocalManifest]]) {
  if (!manifest) continue;
  const structural = validateCollectionResultManifestV1(manifest);
  if (structural.length) fail(`NAR ${label} Manifest structural validation failed: ${structural.join('; ')}`);
  const jobCross = validateCollectionResultManifestAgainstJobV1(manifest, narJob, registry);
  if (jobCross.length) fail(`NAR ${label} Manifest Job/Registry cross-check failed: ${jobCross.join('; ')}`);
  const coverageCross = validateCollectionResultManifestAgainstCoverageV1(manifest, narCoverage);
  if (coverageCross.length) fail(`NAR ${label} Manifest Coverage cross-check failed: ${coverageCross.join('; ')}`);
}
if (narActionsManifest && narLocalManifest) {
  const neutralErrors = compareRunnerNeutralManifestSemanticsV1(narActionsManifest, narLocalManifest);
  if (neutralErrors.length) fail(`NAR Actions/local neutral semantics differ: ${neutralErrors.join('; ')}`);
  const expectedRanks = { C: 71, B: 0, 'B+': 0, A: 0, 'A+': 11 };
  if (!exact(narActionsManifest.rank_counts, expectedRanks)) fail('NAR actual rank distribution differs from 71 C + 11 A+.');
  if (narActionsManifest.records_discovered !== 82 || narActionsManifest.unresolved_meeting_ids.length !== 71) {
    fail('NAR actual result counts differ from 82 discovered / 71 unresolved meetings.');
  }
}

const jraJob = jobsById.get('jra-july-local-compatibility-001');
let jraCoverage = null;
let jraManifest = null;
try {
  jraCoverage = normalizeJraRefreshReportToCoverageV1({
    job: jraJob,
    batch_id: 'jra-july-local-run-001',
    report: jraReport,
  });
  jraManifest = normalizeJraRefreshReportToManifestV1({
    job: jraJob,
    batch_id: 'jra-july-local-run-001',
    runner_used: 'local',
    report: jraReport,
    coverage: jraCoverage,
  });
} catch (error) {
  fail(`JRA result normalization failed: ${error.message}`);
}

if (jraCoverage) {
  const result = validateCoverageObservation(jraCoverage);
  if (!result.valid) fail(`normalized JRA Coverage Observation invalid: ${result.errors.join('; ')}`);
}
if (jraManifest) {
  const structural = validateCollectionResultManifestV1(jraManifest);
  if (structural.length) fail(`normalized JRA Manifest structural validation failed: ${structural.join('; ')}`);
  const jobCross = validateCollectionResultManifestAgainstJobV1(jraManifest, jraJob, registry);
  if (jobCross.length) fail(`normalized JRA Manifest Job/Registry cross-check failed: ${jobCross.join('; ')}`);
  const coverageCross = validateCollectionResultManifestAgainstCoverageV1(jraManifest, jraCoverage);
  if (coverageCross.length) fail(`normalized JRA Manifest Coverage cross-check failed: ${coverageCross.join('; ')}`);
  const expectedRanks = { C: 0, B: 0, 'B+': 0, A: 0, 'A+': 24 };
  if (!exact(jraManifest.rank_counts, expectedRanks)) fail(`JRA actual rank distribution differs: ${JSON.stringify(jraManifest.rank_counts)}`);
  if (jraManifest.records_discovered !== 24 || jraManifest.records_updated !== 24) fail('JRA actual result counts differ from 24/24.');
  if (jraManifest.coverage_claim !== 'source_window_complete') fail(`JRA coverage claim differs: ${jraManifest.coverage_claim}`);
}

function applyPatches(base, patches) {
  const value = structuredClone(base);
  for (const patch of patches ?? []) {
    let target = value;
    for (const segment of patch.path.slice(0, -1)) target = target[segment];
    target[patch.path.at(-1)] = structuredClone(patch.value);
  }
  return value;
}

if (invalidFixtures.schema_version !== 'calendar-runner-compatibility-invalid-cases-v1') fail('invalid runner compatibility fixture schema differs.');
const invalidCaseIds = new Set();
for (const testCase of invalidFixtures.cases ?? []) {
  if (invalidCaseIds.has(testCase.case_id)) fail(`duplicate invalid compatibility case ${testCase.case_id}`);
  invalidCaseIds.add(testCase.case_id);
  if (testCase.validation_mode === 'compile') {
    const job = jobsById.get(testCase.job_id);
    let rejected = false;
    try {
      compileRunnerExecutionV1(job, {
        batch_id: testCase.batch_id,
        requested_runner: testCase.requested_runner,
      }, registry, contract);
    } catch {
      rejected = true;
    }
    if (!rejected) fail(`invalid compile case unexpectedly passed: ${testCase.case_id}`);
    continue;
  }
  if (testCase.validation_mode === 'jra_normalization') {
    const job = jobsById.get(testCase.job_id);
    const report = applyPatches(jraReport, [testCase.report_patch]);
    let rejected = false;
    try {
      normalizeJraRefreshReportToCoverageV1({ job, batch_id: testCase.batch_id, report });
    } catch {
      rejected = true;
    }
    if (!rejected) fail(`invalid JRA normalization case unexpectedly passed: ${testCase.case_id}`);
    continue;
  }
  const baseExecution = executionsByCaseId.get(testCase.base_execution_case_id);
  const mutated = applyPatches(baseExecution, testCase.patches);
  const baseCase = fixtures.execution_cases.find((entry) => entry.case_id === testCase.base_execution_case_id);
  const job = jobsById.get(baseCase.job_id);
  const validationErrors = validateRunnerExecutionV1(mutated, job, registry, contract);
  if (validationErrors.length === 0) fail(`invalid execution case unexpectedly passed: ${testCase.case_id}`);
}

for (const requiredCase of [
  'nar-unregistered-reviewed-import',
  'jra-unregistered-github-actions',
  'invalid-batch-id',
  'executor-id-drift',
  'result-contract-drift',
  'source-route-drift',
  'publication-side-effect-enabled',
  'jra-report-scope-mismatch',
]) {
  if (!invalidCaseIds.has(requiredCase)) fail(`required invalid compatibility case missing: ${requiredCase}`);
}

const docs = readText('docs/calendar/runner-compatibility.md');
for (const phrase of [
  'Collection Job\n-> runner policy resolution',
  'Runner-neutral semantic comparison requires every Manifest field except `runner_used` to remain identical.',
  'records discovered: 82',
  'records discovered: 24',
  'This foundation satisfies the runner-neutral batch/result semantics portion of the Banei handoff gate.',
  'The full Runner Gate is not complete',
]) {
  if (!docs.includes(phrase)) fail(`runner compatibility contract missing ${phrase}.`);
}

const implementationPlan = readText('docs/calendar/acquisition-control-plane-implementation-plan.md');
for (const phrase of ['Runner-neutral compatibility foundation: complete.', 'Stage ACP-10 — Actions multi-job runner', 'Status: current.']) {
  if (!implementationPlan.includes(phrase)) fail(`control-plane implementation plan missing ${phrase}.`);
}

if (errors.length) {
  console.error(`CALENDAR_RUNNER_COMPATIBILITY: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('CALENDAR_RUNNER_COMPATIBILITY: pass');
console.log(`EXECUTOR_MAPPINGS: ${contract.executors.length}`);
console.log(`EXECUTION_CASES: ${fixtures.execution_cases.length}`);
console.log(`INVALID_CASES: ${invalidFixtures.cases.length}`);
console.log('NAR_ACTIONS_LOCAL_NEUTRAL_RESULT: pass 82 meetings / 71 C / 11 A+');
console.log('JRA_LOCAL_SHARED_RESULT: pass 24 meetings / 24 A+');
console.log('COVERAGE_AND_MANIFEST_VALIDATION: pass');
console.log('BANEI_RUNNER_NEUTRAL_HANDOFF_SEMANTICS: pass');
