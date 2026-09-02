import fs from 'node:fs';
import path from 'node:path';
import { loadCalendarAcquisitionRegistryV1 } from './timetable/load-calendar-acquisition-registry.mjs';
import {
  dueJobPlannerV1Contract,
  planDueJobsV1,
  summarizeDueJobPlanV1,
  validateDueJobPlanV1,
  validateDueJobPolicyV1,
} from './timetable/due-job-planner.mjs';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
const readText = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const exact = (left, right) => JSON.stringify(left) === JSON.stringify(right);

const schema = readJson('data/static/calendar-due-job-plan.schema.json');
const policy = readJson('data/static/calendar-due-job-policy-v1.json');
const fixtures = readJson('data/fixtures/calendar-due-job-planner-fixtures-v1.json');
const invalidFixtures = readJson('data/fixtures/calendar-due-job-planner-invalid-cases-v1.json');
const registry = loadCalendarAcquisitionRegistryV1(root);

if (schema.$schema !== 'https://json-schema.org/draft/2020-12/schema') fail('Due-job plan schema draft differs.');
if (schema.properties?.schema_version?.const !== 'calendar-due-job-plan-v1') fail('Due-job plan schema version differs.');
if (!exact(schema.$defs?.schedulerBoundary?.required, dueJobPlannerV1Contract.boundary_keys)) fail('Due-job scheduler boundary keys differ from core.');

const policyErrors = validateDueJobPolicyV1(policy, registry);
if (policyErrors.length) fail(`Due-job policy invalid: ${policyErrors.join('; ')}`);
if (!Number.isInteger(policy.scheduler?.cadence_hours) || policy.scheduler.cadence_hours < 1) fail('scheduler cadence_hours must be a positive integer.');
if (policy.scheduler?.artifact_only !== true) fail('planner boundary must remain artifact-only.');

let plan = null;
try {
  plan = planDueJobsV1(policy, fixtures.state, registry);
} catch (error) {
  fail(`Due-job planning failed: ${error.message}`);
}

if (plan) {
  const planErrors = validateDueJobPlanV1(plan, policy, registry);
  if (planErrors.length) fail(`Due-job plan validation failed: ${planErrors.join('; ')}`);
  const summary = summarizeDueJobPlanV1(plan);
  for (const key of ['job_count', 'planned_decision_count', 'not_due_decision_count', 'excluded_decision_count']) {
    if (summary[key] !== fixtures.expected[key]) fail(`${key} differs: ${summary[key]} != ${fixtures.expected[key]}`);
  }
  if (!exact(summary.by_reason, fixtures.expected.by_reason)) fail(`reason summary differs: ${JSON.stringify(summary.by_reason)}`);
  if (!exact(summary.by_system, fixtures.expected.by_system)) fail(`system summary differs: ${JSON.stringify(summary.by_system)}`);

  for (const job of plan.collection_plan.jobs ?? []) {
    if (!registry.records.some((record) => record.system_id === job.system_id)) fail(`planned job uses unknown system ${job.system_id}.`);
    if (!job.job_id || !job.collection_mode || !job.reason || !job.runner_policy?.mode) fail(`planned job ${job.job_id ?? 'unknown'} is incomplete.`);
  }

  if (plan.scheduler_boundary?.artifact_only !== true) fail('planner scheduler boundary must remain artifact-only.');
  for (const [key, value] of Object.entries(plan.scheduler_boundary ?? {})) {
    if (!['cadence_hours', 'artifact_only'].includes(key) && value !== false) fail(`planner scheduler side effect enabled: ${key}`);
  }
}

function mutate(base, testCase) {
  const value = structuredClone(base);
  if (testCase.mutation === 'set') {
    let target = value;
    for (const segment of testCase.path.slice(0, -1)) target = target[segment];
    target[testCase.path.at(-1)] = structuredClone(testCase.value);
  } else if (testCase.mutation === 'set_first_planned_decision_job') {
    value.decisions.find((decision) => decision.disposition === 'job_planned').job_id = testCase.value;
  } else if (testCase.mutation === 'remove_first_planned_decision') {
    const index = value.decisions.findIndex((decision) => decision.disposition === 'job_planned');
    value.decisions.splice(index, 1);
  } else if (testCase.mutation === 'set_rule') {
    const rule = value.system_rules.find((entry) => entry.system_id === testCase.system_id);
    let target = rule;
    for (const segment of testCase.path.slice(0, -1)) target = target[segment];
    target[testCase.path.at(-1)] = structuredClone(testCase.value);
  } else {
    throw new Error(`unsupported mutation ${testCase.mutation}`);
  }
  return value;
}

if (invalidFixtures.schema_version !== 'calendar-due-job-planner-invalid-cases-v1') fail('invalid Due-job fixture schema differs.');
if (plan) {
  for (const testCase of invalidFixtures.plan_cases ?? []) {
    const changed = mutate(plan, testCase);
    if (validateDueJobPlanV1(changed, policy, registry).length === 0) fail(`invalid due-job plan case unexpectedly passed: ${testCase.case_id}`);
  }
}
for (const testCase of invalidFixtures.policy_cases ?? []) {
  const changed = mutate(policy, testCase);
  if (validateDueJobPolicyV1(changed, registry).length === 0) fail(`invalid due-job policy case unexpectedly passed: ${testCase.case_id}`);
}

const workflow = readText('.github/workflows/calendar-daily-acquisition.yml');
for (const marker of [
  'schedule:',
  'workflow_dispatch:',
  'build-calendar-live-retry-queue.mjs',
  'build-calendar-live-planner-state.mjs',
  'plan-calendar-due-jobs.mjs',
  'plan-actions-multi-job.mjs',
  'Run hosted acquisition job',
  'actions/upload-artifact@v4',
]) {
  if (!workflow.includes(marker)) fail(`Current daily acquisition workflow missing ${marker}.`);
}
if (!/^\s*-\s*cron:\s*['"][^'"\n]+['"]\s*$/m.test(workflow)) fail('Current daily acquisition workflow must define a cron schedule.');
if (/pull-requests:\s*write/.test(workflow)) fail('Daily acquisition workflow must not write pull requests.');
if (/contents:\s*write/.test(workflow)) {
  for (const marker of [
    'japan-zero-based-30d:',
    'Persist deterministic canonical and public Japan state',
    'data/generated/timetable/canonical/meetings.json',
    'data/generated/timetable/canonical/meeting-details.json',
    'data/generated/timetable/public/meeting-list.json',
  ]) {
    if (!workflow.includes(marker)) fail(`Repository write permission lacks deterministic Japan publication marker ${marker}.`);
  }
}

if (errors.length) {
  console.error(`CALENDAR_DUE_JOB_PLANNER: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('CALENDAR_DUE_JOB_PLANNER: pass');
console.log(`JOBS: ${plan?.collection_plan.jobs.length ?? 0}`);
console.log('POLICY_VALIDATION: pass');
console.log('INVALID_CASES: rejected');
console.log('CURRENT_DAILY_ACQUISITION_WIRING: pass');
console.log('CRON_CLOCK_TIME_FIXED_BY_VALIDATOR: false');
