import fs from 'node:fs';
import path from 'node:path';
import { loadCalendarAcquisitionRegistryV1 } from './timetable/load-calendar-acquisition-registry.mjs';
import {
  collectionPlanV1Contract,
  partitionCollectionPlanJobsV1,
  summarizeCollectionPlanOutcomesV1,
  validateCollectionPlanV1,
} from './timetable/collection-plan-validation.mjs';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
const readText = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const exact = (left, right) => JSON.stringify(left) === JSON.stringify(right);

const schema = readJson('data/static/calendar-collection-plan.schema.json');
const fixtures = readJson('data/fixtures/calendar-collection-plans-v1.json');
const invalidFixtures = readJson('data/fixtures/calendar-collection-plan-invalid-cases-v1.json');
const registry = loadCalendarAcquisitionRegistryV1(root);

const expectedRequiredFields = ['schema_version', 'plan_id', 'campaign_id', 'created_at', 'jobs'];
if (schema.schema_version !== 'calendar-collection-plan-schema-v1') fail('Collection Plan schema version differs.');
if (!exact(schema.required_fields, expectedRequiredFields)) fail('Collection Plan required_fields differ.');
if (!exact(collectionPlanV1Contract.requiredFields, expectedRequiredFields)) fail('Collection Plan validation core required fields differ.');
if (schema.job_schema_version !== 'calendar-collection-job-v1') fail('Collection Plan job schema version differs.');
if (!Array.isArray(schema.closure_rules) || schema.closure_rules.length < 12) fail('Collection Plan closure rules are incomplete.');
if (!Array.isArray(schema.explicit_exclusions) || schema.explicit_exclusions.length < 5) fail('Collection Plan exclusions are incomplete.');

if (fixtures.schema_version !== 'calendar-collection-plan-fixtures-v1') fail('Collection Plan fixture schema differs.');
if (!Array.isArray(fixtures.plans) || fixtures.plans.length < 4) fail('at least four valid Collection Plan fixtures are required.');
const planById = new Map();
for (const [index, plan] of (fixtures.plans ?? []).entries()) {
  const planErrors = validateCollectionPlanV1(plan, registry);
  if (planErrors.length) fail(`valid plan[${index}] ${plan.plan_id ?? 'unknown'} failed: ${planErrors.join('; ')}`);
  if (planById.has(plan.plan_id)) fail(`duplicate valid fixture plan_id ${plan.plan_id}`);
  planById.set(plan.plan_id, plan);
}

const dualRunner = planById.get('japan-dual-runner-august-001');
if (!dualRunner || dualRunner.jobs.length !== 2) fail('JRA/NAR dual-runner plan missing.');
else {
  const jra = dualRunner.jobs.find((job) => job.system_id === 'japan-jra-system');
  const nar = dualRunner.jobs.find((job) => job.system_id === 'japan-nar-system');
  if (jra?.runner_policy?.runner !== 'local') fail('dual-runner plan JRA Job must use exact local runner.');
  if (nar?.runner_policy?.runner !== 'github_actions') fail('dual-runner plan NAR Job must use exact github_actions runner.');
}

const narHkjc = planById.get('nar-hkjc-actions-window-001');
if (!narHkjc || narHkjc.jobs.length !== 2) fail('NAR/HKJC Actions plan missing.');
else {
  const nar = narHkjc.jobs.find((job) => job.system_id === 'japan-nar-system');
  const hkjc = narHkjc.jobs.find((job) => job.system_id === 'hong-kong-hkjc-system');
  if (nar?.runner_policy?.runner !== 'github_actions' || hkjc?.runner_policy?.runner !== 'github_actions') fail('NAR/HKJC plan must use Actions Jobs.');
  if (exact(nar?.requested_scope, hkjc?.requested_scope)) fail('NAR/HKJC Actions Jobs must use different date windows.');
}

const refreshRetry = planById.get('nar-refresh-and-selected-retry-001');
if (!refreshRetry || refreshRetry.jobs.length !== 2) fail('regular refresh + selected retry plan missing.');
else {
  if (!refreshRetry.jobs.some((job) => job.collection_mode === 'date_window' && job.reason === 'regular_refresh')) fail('regular refresh Job missing from mixed-purpose plan.');
  if (!refreshRetry.jobs.some((job) => job.collection_mode === 'selected_meetings' && job.reason === 'rank_upgrade_retry')) fail('selected-meeting retry Job missing from mixed-purpose plan.');
}

const rankIsolation = planById.get('rank-isolation-plan-001');
if (!rankIsolation) fail('rank isolation plan missing.');
else {
  const before = structuredClone(rankIsolation.jobs);
  const planErrors = validateCollectionPlanV1(rankIsolation, registry);
  if (planErrors.length) fail(`rank isolation plan failed validation: ${planErrors.join('; ')}`);
  if (!exact(before, rankIsolation.jobs)) fail('Collection Plan validation mutated job rank state.');
  const low = rankIsolation.jobs.find((job) => job.job_id === 'nar-low-rank-target-job-001');
  const high = rankIsolation.jobs.find((job) => job.job_id === 'jra-best-available-job-001');
  if (low?.target_rank !== 'C') fail('low-rank target Job changed.');
  if (high?.rank_strategy !== 'best_available' || high?.target_rank !== null) fail('unrelated best-available Job was downgraded by lower-rank sibling Job.');
}

if (invalidFixtures.schema_version !== 'calendar-collection-plan-invalid-cases-v1') fail('invalid Collection Plan fixture schema differs.');
if (!Array.isArray(invalidFixtures.cases) || invalidFixtures.cases.length < 5) fail('at least five invalid Collection Plan cases are required.');
const invalidCaseIds = new Set();
for (const [index, testCase] of (invalidFixtures.cases ?? []).entries()) {
  if (typeof testCase.case_id !== 'string' || !testCase.case_id) fail(`invalid plan case[${index}] has no case_id.`);
  if (invalidCaseIds.has(testCase.case_id)) fail(`duplicate invalid plan case_id ${testCase.case_id}`);
  invalidCaseIds.add(testCase.case_id);
  if (validateCollectionPlanV1(testCase.plan, registry).length === 0) fail(`invalid plan unexpectedly passed: ${testCase.case_id}`);
}
for (const requiredCase of ['system-runner-mismatch', 'mixed-date-window-and-selected-meeting-scope', 'duplicate-job-id', 'campaign-id-mismatch', 'empty-jobs']) {
  if (!invalidCaseIds.has(requiredCase)) fail(`required invalid Plan case missing: ${requiredCase}`);
}

const sourceErrorPlan = dualRunner;
if (sourceErrorPlan) {
  const outcomes = summarizeCollectionPlanOutcomesV1(sourceErrorPlan, [
    { job_id: 'jra-august-local-plan-job-001', status: 'source_error' },
    { job_id: 'nar-august-actions-plan-job-001', status: 'success' },
  ]);
  if (outcomes.counts.source_error !== 1 || outcomes.counts.success !== 1) fail('source-error isolation counts differ.');
  const narOutcome = outcomes.results.find((item) => item.job_id === 'nar-august-actions-plan-job-001');
  if (narOutcome?.status !== 'success') fail('one Job source error invalidated unrelated successful Job outcome.');
}

if (dualRunner) {
  const hybrid = structuredClone(dualRunner);
  hybrid.jobs[0].runner_policy = { mode: 'exact', runner: 'github_actions' };
  const partition = partitionCollectionPlanJobsV1(hybrid, registry);
  if (partition.valid_jobs.length !== 1 || partition.invalid_jobs.length !== 1) fail('independent Job validation partition differs.');
  if (partition.valid_jobs[0]?.job_id !== 'nar-august-actions-plan-job-001') fail('valid unrelated Job was lost when sibling Job became invalid.');
}

const hkjcProfile = registry.records.find((profile) => profile.system_id === 'hong-kong-hkjc-system');
if (!hkjcProfile) fail('HKJC Registry profile missing for required Plan fixture.');
else {
  if (hkjcProfile.profile_status !== 'provisional') fail('HKJC Plan profile must remain provisional.');
  if (hkjcProfile.primary_runner !== 'github_actions') fail('HKJC schedule primary runner must remain github_actions.');
  if (hkjcProfile.fallback_runner !== null) fail('HKJC fallback runner must remain null during PILOT-06 reconciliation.');
  if (!hkjcProfile.pending_fields?.includes('fallback_runner')) fail('HKJC fallback_runner must remain pending during PILOT-06 reconciliation.');
  if (hkjcProfile.supports_date_window !== true) fail('HKJC bounded date-window support required by Plan fixture is missing.');
  if (hkjcProfile.detail_source_id !== null || hkjcProfile.detail_adapter_id !== null) fail('HKJC Plan fixture must not imply implemented detail acquisition.');
}

const implementationPlan = readText('docs/calendar/acquisition-control-plane-implementation-plan.md');
for (const phrase of [
  'Stage ACP-5 — Collection Plan schema',
  'JRA local + NAR Actions in one plan',
  'NAR and HKJC Actions jobs with different date windows',
  'one regular refresh plus one selected-meeting retry',
]) if (!implementationPlan.includes(phrase)) fail(`control-plane implementation plan missing ${phrase}.`);
const planContract = readText('docs/calendar/collection-plan.md');
for (const phrase of ['A source error in one Job does not rewrite another Job outcome.', 'lower target rank in one Job must not downgrade another Job']) {
  if (!planContract.includes(phrase)) fail(`Collection Plan contract missing ${phrase}.`);
}

if (errors.length) {
  console.error(`CALENDAR_COLLECTION_PLAN: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}
console.log('CALENDAR_COLLECTION_PLAN: pass');
console.log(`VALID_PLANS: ${fixtures.plans.length}`);
console.log(`INVALID_CASES: ${invalidFixtures.cases.length}`);
console.log('DUAL_RUNNER_PLAN: JRA local + NAR github_actions');
console.log('MULTI_COUNTRY_ACTIONS_PLAN: NAR + HKJC different windows');
console.log('MIXED_PURPOSE_PLAN: regular refresh + selected retry');
console.log('RANK_ISOLATION: pass');
console.log('SOURCE_ERROR_ISOLATION: pass');
console.log('HKJC_SYSTEM_FALLBACK: pending');
