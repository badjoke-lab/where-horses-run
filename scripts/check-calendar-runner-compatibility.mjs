import fs from 'node:fs';
import path from 'node:path';
import { loadCalendarAcquisitionRegistryV1 } from './timetable/load-calendar-acquisition-registry.mjs';
import { validateCollectionJobV1 } from './timetable/collection-job-validation.mjs';
import {
  compareRunnerNeutralManifestSemanticsV1,
  compileRunnerExecutionV1,
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
const manifestFixtures = readJson('data/fixtures/calendar-collection-result-manifests-v1.json');
const registry = loadCalendarAcquisitionRegistryV1(root);
const jobsById = new Map((fixtures.jobs ?? []).map((job) => [job.job_id, job]));

if (contract.schema_version !== 'calendar-runner-compatibility-contract-v1') fail('runner compatibility contract schema_version differs.');
if (contract.execution_contract !== runnerCompatibilityContractV1.execution_schema_version) fail('execution contract identity differs from core.');
if (contract.result_contract !== 'calendar-collection-result-manifest-v1') fail('result contract identity differs.');
if (contract.coverage_contract !== 'calendar-coverage-observation-v1') fail('coverage contract identity differs.');
if (!Array.isArray(contract.executors) || contract.executors.length === 0) fail('runner compatibility executor mappings are required.');

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
if (!Array.isArray(fixtures.jobs) || fixtures.jobs.length === 0) fail('compatibility Jobs are required.');
if (!Array.isArray(fixtures.execution_cases) || fixtures.execution_cases.length === 0) fail('runner execution cases are required.');
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
    if (!executorKeys.has(`${execution.system_id}:${execution.runner_used}`)) fail(`${testCase.case_id} resolved an unregistered executor mapping.`);
  } catch (error) {
    fail(`${testCase.case_id} compilation failed: ${error.message}`);
  }
}

const casesByJob = new Map();
for (const testCase of fixtures.execution_cases ?? []) {
  const execution = executionsByCaseId.get(testCase.case_id);
  if (!execution) continue;
  const list = casesByJob.get(testCase.job_id) ?? [];
  list.push(execution);
  casesByJob.set(testCase.job_id, list);
}
const neutralPair = [...casesByJob.values()]
  .map((executions) => {
    for (let i = 0; i < executions.length; i += 1) {
      for (let j = i + 1; j < executions.length; j += 1) {
        if (executions[i].runner_used !== executions[j].runner_used) return [executions[i], executions[j]];
      }
    }
    return null;
  })
  .find(Boolean);
if (!neutralPair) fail('runner-neutral fixture coverage requires one Job executable by two registered runners.');
else {
  const [leftExecution, rightExecution] = neutralPair;
  const baseManifest = (manifestFixtures.cases ?? [])
    .map((entry) => entry.manifest)
    .find((manifest) => manifest.system_id === leftExecution.system_id)
    ?? (manifestFixtures.cases ?? [])[0]?.manifest;
  if (!baseManifest) fail('Result Manifest fixture is required for runner-neutral semantic comparison.');
  else {
    const left = { ...structuredClone(baseManifest), runner_used: leftExecution.runner_used };
    const right = { ...structuredClone(baseManifest), runner_used: rightExecution.runner_used };
    const neutralErrors = compareRunnerNeutralManifestSemanticsV1(left, right);
    if (neutralErrors.length) fail(`runner-neutral semantic comparison failed: ${neutralErrors.join('; ')}`);
    const drifted = structuredClone(right);
    drifted.records_discovered += 1;
    if (compareRunnerNeutralManifestSemanticsV1(left, drifted).length === 0) fail('runner-neutral comparison failed to detect semantic drift.');
  }
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
if (!Array.isArray(invalidFixtures.cases) || invalidFixtures.cases.length === 0) fail('invalid runner compatibility cases are required.');
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
  const baseExecution = executionsByCaseId.get(testCase.base_execution_case_id);
  if (!baseExecution) {
    fail(`invalid case ${testCase.case_id} references unknown execution case.`);
    continue;
  }
  const mutated = applyPatches(baseExecution, testCase.patches);
  const baseCase = fixtures.execution_cases.find((entry) => entry.case_id === testCase.base_execution_case_id);
  const job = jobsById.get(baseCase.job_id);
  const validationErrors = validateRunnerExecutionV1(mutated, job, registry, contract);
  if (validationErrors.length === 0) fail(`invalid execution case unexpectedly passed: ${testCase.case_id}`);
}

const docs = readText('docs/calendar/runner-compatibility.md');
for (const phrase of [
  'runner policy resolution',
  'Runner-neutral semantic comparison requires every Manifest field except `runner_used` to remain identical.',
]) {
  if (!docs.includes(phrase)) fail(`runner compatibility contract missing ${phrase}.`);
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
console.log('RUNNER_NEUTRAL_SEMANTICS: pass');
console.log('HISTORICAL_RUN_ARTIFACTS_REQUIRED: false');
console.log('FIXED_RESULT_COUNTS_REQUIRED: false');
console.log('IMPLEMENTATION_STAGE_TEXT_REQUIRED: false');
