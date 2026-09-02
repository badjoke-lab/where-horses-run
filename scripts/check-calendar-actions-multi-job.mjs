import fs from 'node:fs';
import path from 'node:path';
import { loadCalendarAcquisitionRegistryV1 } from './timetable/load-calendar-acquisition-registry.mjs';
import { validateCollectionPlanV1, summarizeCollectionPlanOutcomesV1 } from './timetable/collection-plan-validation.mjs';
import {
  makeActionsJobStatusV1,
  matrixFromActionsMultiJobPlanV1,
  planActionsMultiJobV1,
  summarizeActionsCampaignV1,
  validateActionsJobStatusV1,
} from './timetable/actions-multi-job-core.mjs';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
const readText = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const exact = (left, right) => JSON.stringify(left) === JSON.stringify(right);

const fixtures = readJson('data/fixtures/calendar-collection-plans-v1.json');
const invalidFixtures = readJson('data/fixtures/calendar-collection-plan-invalid-cases-v1.json');
const registry = loadCalendarAcquisitionRegistryV1(root);
const compatibility = readJson('data/static/calendar-runner-compatibility-contract-v1.json');

if (!Array.isArray(fixtures.plans) || fixtures.plans.length === 0) fail('Collection Plan fixtures must contain at least one Plan.');
const seenPlanIds = new Set();
let hostedPlanCount = 0;
let multiJobPlanCount = 0;
let mixedRunnerPlanCount = 0;
for (const [index, plan] of (fixtures.plans ?? []).entries()) {
  if (seenPlanIds.has(plan.plan_id)) fail(`duplicate Collection Plan fixture plan_id ${plan.plan_id}`);
  seenPlanIds.add(plan.plan_id);
  const before = structuredClone(plan);
  const planErrors = validateCollectionPlanV1(plan, registry);
  if (planErrors.length) {
    fail(`valid plan[${index}] ${plan.plan_id ?? 'unknown'} failed: ${planErrors.join('; ')}`);
    continue;
  }
  if (!exact(before, plan)) fail(`${plan.plan_id}: Collection Plan validation mutated input.`);
  if ((plan.jobs ?? []).length > 1) multiJobPlanCount += 1;
  if (new Set((plan.jobs ?? []).map((job) => job.runner_policy?.runner).filter(Boolean)).size > 1) mixedRunnerPlanCount += 1;

  let actionsPlan;
  try {
    actionsPlan = planActionsMultiJobV1(plan, registry, compatibility);
  } catch (error) {
    fail(`${plan.plan_id}: compilation failed: ${error.message}`);
    continue;
  }

  const matrix = matrixFromActionsMultiJobPlanV1(actionsPlan);
  if (matrix.include.length !== actionsPlan.jobs.length) fail(`${plan.plan_id}: matrix size differs from hosted Job count.`);
  if (!exact(matrix.include.map((entry) => entry.job_id), actionsPlan.jobs.map((entry) => entry.job_id))) fail(`${plan.plan_id}: matrix Job order differs.`);

  const sourceJobs = new Map((plan.jobs ?? []).map((job) => [job.job_id, job]));
  for (const item of actionsPlan.jobs) {
    hostedPlanCount += 1;
    const sourceJob = sourceJobs.get(item.job_id);
    if (!sourceJob || !exact(item.collection_job, sourceJob)) fail(`${plan.plan_id}/${item.job_id}: Collection Job snapshot changed.`);
    if (item.collection_job?.job_id !== item.execution?.job_id) fail(`${plan.plan_id}/${item.job_id}: Collection Job/execution identity differs.`);
    if (item.execution?.runner_used !== 'github_actions') fail(`${plan.plan_id}/${item.job_id}: hosted execution must use github_actions.`);
  }

  for (const entry of matrix.include) {
    const planned = actionsPlan.jobs.find((item) => item.job_id === entry.job_id);
    if (!planned || !exact(entry.collection_job, planned.collection_job)) fail(`${plan.plan_id}/${entry.job_id}: matrix lost Collection Job snapshot.`);
    if (entry.collection_job?.job_id !== entry.execution?.job_id) fail(`${plan.plan_id}/${entry.job_id}: matrix identity differs.`);
  }

  if (actionsPlan.jobs.length > 0) {
    const statuses = actionsPlan.jobs.map((item) => makeActionsJobStatusV1(item.execution, 'success', null));
    const summary = summarizeActionsCampaignV1(plan, actionsPlan, statuses);
    if (summary.counts.success !== statuses.length) fail(`${plan.plan_id}: success summary count differs.`);
    for (const status of statuses) {
      if (summary.results.find((entry) => entry.job_id === status.job_id)?.status !== 'success') fail(`${plan.plan_id}/${status.job_id}: successful Job was rewritten.`);
      if (validateActionsJobStatusV1({ ...status, batch_id: `${status.batch_id}-drift` }, actionsPlan.jobs.find((item) => item.job_id === status.job_id)).length === 0) {
        fail(`${plan.plan_id}/${status.job_id}: status identity drift was accepted.`);
      }
    }
  }

  if ((plan.jobs ?? []).length >= 2) {
    const outcomes = summarizeCollectionPlanOutcomesV1(plan, [
      { job_id: plan.jobs[0].job_id, status: 'source_error' },
      { job_id: plan.jobs[1].job_id, status: 'success' },
    ]);
    if (outcomes.results.find((item) => item.job_id === plan.jobs[0].job_id)?.status !== 'source_error') fail(`${plan.plan_id}: source-error outcome changed.`);
    if (outcomes.results.find((item) => item.job_id === plan.jobs[1].job_id)?.status !== 'success') fail(`${plan.plan_id}: unrelated success outcome changed.`);
  }
}

const zeroJobPlan = {
  schema_version: 'calendar-collection-plan-v1',
  plan_id: 'zero-job-regression',
  campaign_id: 'zero-job-regression',
  created_at: '2030-01-01T00:00:00Z',
  jobs: [],
};
const zeroErrors = validateCollectionPlanV1(zeroJobPlan, registry);
if (zeroErrors.length) fail(`zero-job steady-state plan failed: ${zeroErrors.join('; ')}`);
const zeroOutcomes = summarizeCollectionPlanOutcomesV1(zeroJobPlan, []);
if (zeroOutcomes.results.length !== 0 || Object.keys(zeroOutcomes.counts).length !== 0) fail('zero-job outcome summary differs.');

if (invalidFixtures.schema_version !== 'calendar-collection-plan-invalid-cases-v1') fail('invalid Collection Plan fixture schema differs.');
if (!Array.isArray(invalidFixtures.cases) || invalidFixtures.cases.length === 0) fail('invalid Collection Plan fixtures must contain cases.');
const invalidIds = new Set();
for (const [index, testCase] of (invalidFixtures.cases ?? []).entries()) {
  if (typeof testCase.case_id !== 'string' || !testCase.case_id) fail(`invalid plan case[${index}] has no case_id.`);
  if (invalidIds.has(testCase.case_id)) fail(`duplicate invalid plan case_id ${testCase.case_id}`);
  invalidIds.add(testCase.case_id);
  if (validateCollectionPlanV1(testCase.plan, registry).length === 0) fail(`invalid plan unexpectedly passed: ${testCase.case_id}`);
}

if (hostedPlanCount === 0) fail('Fixture matrix must exercise at least one hosted Actions Job.');
if (multiJobPlanCount === 0) fail('Fixture matrix must exercise at least one multi-Job Plan.');
if (mixedRunnerPlanCount === 0) fail('Fixture matrix must exercise at least one mixed-runner Plan.');

const workflow = readText('.github/workflows/calendar-actions-multi-job.yml');
for (const phrase of [
  'workflow_dispatch:',
  'type: string',
  'fail-fast: false',
  'permissions:\n  contents: read',
  'run-calendar-actions-job.mjs --job=.calendar-collection-job.json --execution=.calendar-execution.json',
  'Build campaign summary without rewriting independent outcomes',
]) {
  if (!workflow.includes(phrase)) fail(`Actions multi-job workflow missing ${phrase}.`);
}
if (/\boptions:\s*\n/.test(workflow)) fail('Actions multi-job operator must not pin historical Plan IDs as workflow choices.');
if (/\bschedule\s*:|\bcron\s*:/.test(workflow) || /contents:\s*write/.test(workflow)) fail('Actions multi-job workflow trigger/permission boundary differs.');
for (const forbidden of ['promote-timetable', 'wrangler pages deploy']) {
  if (workflow.includes(forbidden)) fail(`Actions multi-job workflow contains forbidden command ${forbidden}.`);
}

const dailyWorkflow = readText('.github/workflows/calendar-daily-acquisition.yml');
for (const phrase of ['COLLECTION_JOB_JSON', '--job=.calendar-collection-job.json', 'plan-calendar-due-jobs.mjs', 'run-calendar-actions-job.mjs']) {
  if (!dailyWorkflow.includes(phrase)) fail(`Daily acquisition workflow missing ${phrase}.`);
}

if (errors.length) {
  console.error(`CALENDAR_ACTIONS_MULTI_JOB: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('CALENDAR_ACTIONS_MULTI_JOB: pass');
console.log(`FIXTURE_PLANS: ${fixtures.plans.length}`);
console.log(`INVALID_PLAN_CASES: ${invalidFixtures.cases.length}`);
console.log(`HOSTED_JOBS_EXERCISED: ${hostedPlanCount}`);
console.log(`MULTI_JOB_PLANS: ${multiJobPlanCount}`);
console.log('ZERO_JOB_STEADY_STATE: pass');
console.log('OUTCOME_ISOLATION: pass');
console.log('FIXED_OPERATOR_PLAN_CHOICES: 0');
console.log('DAILY_GENERATED_JOB_DISPATCH: pass');
