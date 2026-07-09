import fs from 'node:fs';
import path from 'node:path';
import { loadCalendarAcquisitionRegistryV1 } from './timetable/load-calendar-acquisition-registry.mjs';
import { collectionJobV1Contract, validateCollectionJobV1 } from './timetable/collection-job-validation.mjs';

const root = process.cwd();
const schemaPath = 'data/static/calendar-collection-job.schema.json';
const validFixturesPath = 'data/fixtures/calendar-collection-jobs-v1.json';
const invalidFixturesPath = 'data/fixtures/calendar-collection-job-invalid-cases-v1.json';
const errors = [];
const fail = (message) => errors.push(message);

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
}

function exact(actual, expected) {
  return JSON.stringify(actual) === JSON.stringify(expected);
}

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
if (!Array.isArray(schema.closure_rules) || schema.closure_rules.length < 12) fail('Collection Job closure rules are incomplete.');
if (!Array.isArray(schema.explicit_exclusions) || schema.explicit_exclusions.length < 5) fail('Collection Job exclusions are incomplete.');

if (fixtures.schema_version !== 'calendar-collection-job-fixtures-v1') fail('valid fixture schema differs.');
if (!Array.isArray(fixtures.jobs) || fixtures.jobs.length < 8) fail('at least eight valid Collection Job fixtures are required.');
const validJobIds = new Set();
for (const [index, job] of (fixtures.jobs ?? []).entries()) {
  const jobErrors = validateCollectionJobV1(job, registry);
  if (jobErrors.length) fail(`valid fixture jobs[${index}] ${job.job_id ?? 'unknown'} failed: ${jobErrors.join('; ')}`);
  if (validJobIds.has(job.job_id)) fail(`duplicate valid fixture job_id ${job.job_id}`);
  validJobIds.add(job.job_id);
}

const requiredValidFixtures = new Map([
  ['nar-august-window-001', (job) => job.system_id === 'japan-nar-system' && job.collection_mode === 'date_window' && job.reason === 'regular_refresh'],
  ['jra-august-local-window-001', (job) => job.system_id === 'japan-jra-system' && job.runner_policy?.mode === 'registry_primary' && job.collection_mode === 'date_window'],
  ['nar-selected-retry-001', (job) => job.collection_mode === 'selected_meetings' && job.requested_scope?.meeting_ids?.length === 2],
  ['nar-b-to-b-plus-retry-001', (job) => job.rank_strategy === 'target_rank' && job.target_rank === 'B+' && job.reason === 'rank_upgrade_retry'],
  ['nar-a-to-a-plus-retry-001', (job) => job.rank_strategy === 'target_rank' && job.target_rank === 'A+' && job.reason === 'rank_upgrade_retry'],
  ['nar-source-horizon-001', (job) => job.collection_mode === 'source_visible_horizon' && job.reason === 'source_revalidation'],
  ['jra-single-date-recovery-001', (job) => job.collection_mode === 'single_date' && job.runner_policy?.runner === 'reviewed_import'],
  ['nar-july-completion-support-001', (job) => job.reason === 'completion_audit_support' && job.collection_mode === 'date_window'],
]);
const byId = new Map((fixtures.jobs ?? []).map((job) => [job.job_id, job]));
for (const [jobId, predicate] of requiredValidFixtures) {
  const job = byId.get(jobId);
  if (!job || !predicate(job)) fail(`required valid fixture differs: ${jobId}`);
}

if (invalidFixtures.schema_version !== 'calendar-collection-job-invalid-cases-v1') fail('invalid fixture schema differs.');
if (!Array.isArray(invalidFixtures.cases) || invalidFixtures.cases.length < 9) fail('at least nine invalid Collection Job cases are required.');
const invalidCaseIds = new Set();
for (const [index, testCase] of (invalidFixtures.cases ?? []).entries()) {
  if (typeof testCase.case_id !== 'string' || !testCase.case_id) fail(`invalid cases[${index}] has no case_id.`);
  if (invalidCaseIds.has(testCase.case_id)) fail(`duplicate invalid case_id ${testCase.case_id}`);
  invalidCaseIds.add(testCase.case_id);
  const jobErrors = validateCollectionJobV1(testCase.job, registry);
  if (jobErrors.length === 0) fail(`invalid case unexpectedly passed: ${testCase.case_id}`);
}

for (const requiredCase of [
  'mixed-date-window-and-selected-meetings',
  'unknown-system',
  'jra-exact-runner-mismatch',
  'jra-selected-meetings-unsupported',
  'jra-cross-month-window-unsupported',
  'best-available-with-target-rank',
  'rank-upgrade-without-target-strategy',
  'banei-source-visible-horizon-unsupported',
  'completion-audit-with-selected-meetings',
]) {
  if (!invalidCaseIds.has(requiredCase)) fail(`required invalid case missing: ${requiredCase}`);
}

const narProfile = registry.records.find((profile) => profile.system_id === 'japan-nar-system');
const targetAboveCapabilityRegistry = structuredClone(registry);
const narrowedNar = targetAboveCapabilityRegistry.records.find((profile) => profile.system_id === 'japan-nar-system');
narrowedNar.technical_capability_rank = 'B';
const targetAboveCapabilityJob = structuredClone(byId.get('nar-a-to-a-plus-retry-001'));
if (validateCollectionJobV1(targetAboveCapabilityJob, targetAboveCapabilityRegistry).length === 0) {
  fail('target rank above registry technical capability unexpectedly passed.');
}

const fallbackMissingRegistry = structuredClone(registry);
fallbackMissingRegistry.records.find((profile) => profile.system_id === 'japan-nar-system').fallback_runner = null;
const fallbackPolicyJob = structuredClone(byId.get('nar-selected-retry-001'));
if (validateCollectionJobV1(fallbackPolicyJob, fallbackMissingRegistry).length === 0) {
  fail('registry_primary_or_fallback without registry fallback unexpectedly passed.');
}

const sourceDuplicationJob = {
  ...structuredClone(byId.get('nar-august-window-001')),
  source_id: 'nar-monthly-schedule-grid',
};
if (validateCollectionJobV1(sourceDuplicationJob, registry).length === 0) fail('source routing duplication inside Collection Job unexpectedly passed.');

if (!narProfile || narProfile.primary_runner !== 'github_actions' || narProfile.fallback_runner !== 'local') {
  fail('NAR Registry runner evidence differs during Collection Job validation.');
}

const controlPlan = fs.readFileSync(path.join(root, 'docs/calendar/acquisition-control-plane-implementation-plan.md'), 'utf8');
for (const phrase of [
  'Stage ACP-4 — Collection Job schema',
  'job_id',
  'runner_policy',
  'source_visible_horizon',
  'rank_upgrade_retry',
  'invalid mixed date-window and selected-meeting scope',
]) {
  if (!controlPlan.includes(phrase)) fail(`control-plane implementation plan missing ${phrase}.`);
}

if (errors.length) {
  console.error(`CALENDAR_COLLECTION_JOB: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('CALENDAR_COLLECTION_JOB: pass');
console.log(`VALID_FIXTURES: ${fixtures.jobs.length}`);
console.log(`INVALID_CASES: ${invalidFixtures.cases.length}`);
console.log('COLLECTION_MODES: date_window,single_date,selected_meetings,source_visible_horizon');
console.log('RANK_STRATEGIES: best_available,target_rank');
console.log('REGISTRY_ROUTING_DUPLICATION: rejected');
console.log('CURRENT_STAGE: Collection Job schema');
