import fs from 'node:fs';
import path from 'node:path';
import { loadCalendarAcquisitionRegistryV1 } from './timetable/load-calendar-acquisition-registry.mjs';
import { collectionJobV1Contract, validateCollectionJobV1 } from './timetable/collection-job-validation.mjs';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
const exact = (actual, expected) => JSON.stringify(actual) === JSON.stringify(expected);

const schemaPath = 'data/static/calendar-collection-job.schema.json';
const validFixturesPath = 'data/fixtures/calendar-collection-jobs-v1.json';
const invalidFixturesPath = 'data/fixtures/calendar-collection-job-invalid-cases-v1.json';
const schema = readJson(schemaPath);
const fixtures = readJson(validFixturesPath);
const invalidFixtures = readJson(invalidFixturesPath);
const registry = loadCalendarAcquisitionRegistryV1(root);

const expectedRunnerModes = ['registry_primary', 'registry_primary_or_fallback', 'exact'];
const expectedRunners = ['github_actions', 'local', 'reviewed_import'];
const expectedModes = ['date_window', 'single_date', 'selected_meetings', 'source_visible_horizon'];
const expectedStrategies = ['best_available', 'target_rank'];
const expectedRanks = ['C', 'B', 'B+', 'A', 'A+'];
const expectedReasons = ['regular_refresh', 'coverage_gap', 'rank_upgrade_retry', 'source_revalidation', 'manual_recovery', 'completion_audit_support'];
const expectedScopeContracts = {
  date_window: ['start_date', 'end_date_exclusive', 'timezone'],
  single_date: ['date', 'timezone'],
  selected_meetings: ['meeting_ids'],
  source_visible_horizon: ['start_date', 'end_date_exclusive', 'timezone'],
};

if (schema.schema_version !== 'calendar-collection-job-schema-v1') fail('Collection Job schema version differs.');
if (!exact(schema.required_fields, collectionJobV1Contract.requiredFields)) fail('Collection Job required_fields differ from validation core.');
if (!exact(schema.runner_policy_modes, expectedRunnerModes)) fail('runner_policy_modes differ.');
if (!exact(schema.runner_classes, expectedRunners)) fail('runner_classes differ.');
if (!exact(schema.collection_modes, expectedModes)) fail('collection_modes differ.');
if (!exact(schema.rank_strategies, expectedStrategies)) fail('rank_strategies differ.');
if (!exact(schema.rank_enum, expectedRanks)) fail('rank_enum differs.');
if (!exact(schema.reason_enum, expectedReasons)) fail('reason_enum differs.');
if (!exact(schema.scope_contracts, expectedScopeContracts)) fail('scope_contracts differ.');
if (!Array.isArray(schema.closure_rules) || schema.closure_rules.length === 0) fail('Collection Job closure rules are required.');
if (!Array.isArray(schema.explicit_exclusions) || schema.explicit_exclusions.length === 0) fail('Collection Job explicit exclusions are required.');

if (fixtures.schema_version !== 'calendar-collection-job-fixtures-v1') fail('valid fixture schema differs.');
if (!Array.isArray(fixtures.jobs) || fixtures.jobs.length === 0) fail('valid Collection Job fixtures are required.');
const validJobIds = new Set();
for (const [index, job] of (fixtures.jobs ?? []).entries()) {
  const jobErrors = validateCollectionJobV1(job, registry);
  if (jobErrors.length) fail(`valid fixture jobs[${index}] ${job.job_id ?? 'unknown'} failed: ${jobErrors.join('; ')}`);
  if (validJobIds.has(job.job_id)) fail(`duplicate valid fixture job_id ${job.job_id}`);
  validJobIds.add(job.job_id);
}

const fixtureJobs = fixtures.jobs ?? [];
const observedModes = new Set(fixtureJobs.map((job) => job.collection_mode));
const observedStrategies = new Set(fixtureJobs.map((job) => job.rank_strategy));
const observedRunnerModes = new Set(fixtureJobs.map((job) => job.runner_policy?.mode));
for (const mode of expectedModes) if (!observedModes.has(mode)) fail(`fixture coverage missing collection_mode ${mode}.`);
for (const strategy of expectedStrategies) if (!observedStrategies.has(strategy)) fail(`fixture coverage missing rank_strategy ${strategy}.`);
for (const mode of expectedRunnerModes) if (!observedRunnerModes.has(mode)) fail(`fixture coverage missing runner_policy.mode ${mode}.`);
if (!fixtureJobs.some((job) => job.reason === 'rank_upgrade_retry' && job.rank_strategy === 'target_rank')) fail('fixture coverage missing target-rank upgrade retry.');
if (!fixtureJobs.some((job) => job.reason === 'completion_audit_support')) fail('fixture coverage missing completion-audit support job.');

if (invalidFixtures.schema_version !== 'calendar-collection-job-invalid-cases-v1') fail('invalid fixture schema differs.');
if (!Array.isArray(invalidFixtures.cases) || invalidFixtures.cases.length === 0) fail('invalid Collection Job cases are required.');
const invalidCaseIds = new Set();
for (const [index, testCase] of (invalidFixtures.cases ?? []).entries()) {
  if (typeof testCase.case_id !== 'string' || !testCase.case_id) fail(`invalid cases[${index}] has no case_id.`);
  if (invalidCaseIds.has(testCase.case_id)) fail(`duplicate invalid case_id ${testCase.case_id}`);
  invalidCaseIds.add(testCase.case_id);
  const jobErrors = validateCollectionJobV1(testCase.job, registry);
  if (jobErrors.length === 0) fail(`invalid case unexpectedly passed: ${testCase.case_id}`);
}

const narProfile = registry.records.find((profile) => profile.system_id === 'japan-nar-system');
const targetRankFixture = fixtureJobs.find((job) => job.system_id === 'japan-nar-system' && job.rank_strategy === 'target_rank');
if (!targetRankFixture) fail('NAR target-rank fixture is required for capability-boundary regression.');
else {
  const narrowedRegistry = structuredClone(registry);
  const narrowedNar = narrowedRegistry.records.find((profile) => profile.system_id === 'japan-nar-system');
  narrowedNar.technical_capability_rank = 'B';
  const candidate = structuredClone(targetRankFixture);
  candidate.target_rank = 'A+';
  if (validateCollectionJobV1(candidate, narrowedRegistry).length === 0) fail('target rank above registry technical capability unexpectedly passed.');
}

const fallbackFixture = fixtureJobs.find((job) => job.system_id === 'japan-nar-system' && job.runner_policy?.mode === 'registry_primary_or_fallback');
if (!fallbackFixture) fail('NAR fallback-policy fixture is required.');
else {
  const fallbackMissingRegistry = structuredClone(registry);
  fallbackMissingRegistry.records.find((profile) => profile.system_id === 'japan-nar-system').fallback_runner = null;
  if (validateCollectionJobV1(structuredClone(fallbackFixture), fallbackMissingRegistry).length === 0) {
    fail('registry_primary_or_fallback without registry fallback unexpectedly passed.');
  }
}

const sourceDuplicationBase = fixtureJobs.find((job) => job.system_id === 'japan-nar-system');
if (!sourceDuplicationBase) fail('NAR fixture is required for source-routing duplication regression.');
else {
  const sourceDuplicationJob = { ...structuredClone(sourceDuplicationBase), source_id: 'nar-monthly-schedule-grid' };
  if (validateCollectionJobV1(sourceDuplicationJob, registry).length === 0) fail('source routing duplication inside Collection Job unexpectedly passed.');
}

if (!narProfile || narProfile.primary_runner !== 'github_actions' || narProfile.fallback_runner !== 'local') {
  fail('NAR Registry runner evidence differs during Collection Job validation.');
}

const contract = fs.readFileSync(path.join(root, 'docs/calendar/collection-job.md'), 'utf8');
for (const phrase of ['job_id', 'runner_policy', 'source_visible_horizon', 'rank_upgrade_retry']) {
  if (!contract.includes(phrase)) fail(`Collection Job contract missing ${phrase}.`);
}

if (errors.length) {
  console.error(`CALENDAR_COLLECTION_JOB: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('CALENDAR_COLLECTION_JOB: pass');
console.log(`VALID_FIXTURES: ${fixtures.jobs.length}`);
console.log(`INVALID_CASES: ${invalidFixtures.cases.length}`);
console.log(`COLLECTION_MODES_COVERED: ${[...observedModes].sort().join(',')}`);
console.log(`RUNNER_POLICY_MODES_COVERED: ${[...observedRunnerModes].sort().join(',')}`);
console.log('HISTORICAL_FIXTURE_IDS_REQUIRED: false');
console.log('IMPLEMENTATION_STAGE_TEXT_REQUIRED: false');
