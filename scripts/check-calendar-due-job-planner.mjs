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
if (schema.$id !== 'https://whr.badjoke-lab.com/schemas/calendar-due-job-plan.schema.json') fail('Due-job plan schema ID differs.');
if (schema.type !== 'object' || schema.additionalProperties !== false) fail('Due-job plan schema must be closed.');
if (schema.properties?.schema_version?.const !== 'calendar-due-job-plan-v1') fail('Due-job plan schema version differs.');
if (!exact(schema.$defs?.schedulerBoundary?.required, dueJobPlannerV1Contract.boundary_keys)) fail('Due-job scheduler boundary keys differ from core.');
if (!exact(schema.$defs?.job?.properties?.reason?.enum, [
  'regular_refresh', 'coverage_gap', 'rank_upgrade_retry', 'source_revalidation', 'manual_recovery', 'completion_audit_support',
])) fail('Due-job schema reason enum differs from Collection Job contract.');

const policyErrors = validateDueJobPolicyV1(policy, registry);
if (policyErrors.length) fail(`Due-job policy invalid: ${policyErrors.join('; ')}`);
if (policy.scheduler.cadence_hours !== 24) fail('initial due-job scheduler cadence must be 24 hours.');
if (policy.scheduler.artifact_only !== true || policy.scheduler.execute_jobs !== false) fail('due-job scheduler policy must be artifact-only and non-executing.');

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
  if (summary.job_count !== fixtures.expected.job_count) fail(`job count differs: ${summary.job_count}`);
  if (!exact(summary.by_reason, fixtures.expected.by_reason)) fail(`reason summary differs: ${JSON.stringify(summary.by_reason)}`);
  if (!exact(summary.by_system, fixtures.expected.by_system)) fail(`system summary differs: ${JSON.stringify(summary.by_system)}`);
  for (const key of ['planned_decision_count', 'not_due_decision_count', 'excluded_decision_count']) {
    if (summary[key] !== fixtures.expected[key]) fail(`${key} differs: ${summary[key]} != ${fixtures.expected[key]}`);
  }

  const jobs = plan.collection_plan.jobs;
  const jra = jobs.find((job) => job.system_id === 'japan-jra-system');
  if (!jra || jra.reason !== 'regular_refresh' || jra.collection_mode !== 'date_window') fail('JRA regular refresh Job missing.');
  else if (jra.requested_scope.start_date !== '2026-07-09' || jra.requested_scope.end_date_exclusive !== '2026-07-16') fail('JRA regular refresh window differs.');

  const narCoverage = jobs.find((job) => job.system_id === 'japan-nar-system' && job.reason === 'coverage_gap');
  if (!narCoverage || narCoverage.requested_scope.start_date !== '2026-08-01' || narCoverage.requested_scope.end_date_exclusive !== '2026-08-05') fail('NAR coverage-gap Job differs.');

  const narRetry = jobs.find((job) => job.system_id === 'japan-nar-system' && job.reason === 'rank_upgrade_retry');
  if (!narRetry) fail('NAR rank retry Job missing.');
  else {
    if (!exact(narRetry.requested_scope.meeting_ids, fixtures.expected.nar_retry_meeting_ids)) fail(`NAR due retry IDs differ: ${JSON.stringify(narRetry.requested_scope.meeting_ids)}`);
    if (narRetry.target_rank !== 'A+' || narRetry.rank_strategy !== 'target_rank') fail('NAR retry target must resolve to A+ target_rank.');
    if (narRetry.runner_policy.mode !== 'registry_primary_or_fallback') fail('NAR retry Job must preserve declared fallback eligibility.');
  }

  const narHorizon = jobs.find((job) => job.system_id === 'japan-nar-system' && job.collection_mode === 'source_visible_horizon');
  if (!narHorizon || narHorizon.requested_scope.end_date_exclusive !== '2026-07-16') fail('NAR source horizon Job missing or differs.');

  const hkjc = jobs.find((job) => job.system_id === 'hong-kong-hkjc-system');
  if (!hkjc || hkjc.reason !== 'source_revalidation' || hkjc.collection_mode !== 'date_window') fail('HKJC bounded source revalidation Job missing.');

  const baneiRetry = jobs.find((job) => job.system_id === 'japan-banei-system' && job.reason === 'rank_upgrade_retry');
  if (!baneiRetry) fail('Banei rank retry Job missing.');
  else {
    if (!exact(baneiRetry.requested_scope.meeting_ids, fixtures.expected.banei_retry_meeting_ids)) fail(`Banei due retry IDs differ: ${JSON.stringify(baneiRetry.requested_scope.meeting_ids)}`);
    if (baneiRetry.collection_mode !== 'selected_meetings') fail('Banei retry Job must use selected_meetings.');
    if (baneiRetry.target_rank !== 'A+' || baneiRetry.rank_strategy !== 'target_rank') fail('Banei retry target must resolve to A+ target_rank.');
    if (baneiRetry.runner_policy.mode !== 'registry_primary_or_fallback') fail('Banei retry Job must preserve reviewed-import fallback eligibility.');
  }
  if (plan.scheduler_boundary.artifact_only !== true || Object.entries(plan.scheduler_boundary).some(([key, value]) => key !== 'cadence_hours' && key !== 'artifact_only' && value !== false)) {
    fail('Due-job scheduler boundary has enabled side effects.');
  }

  const offseasonState = structuredClone(fixtures.state);
  offseasonState.system_states.find((state) => state.system_id === 'japan-jra-system').season_state = 'offseason';
  try {
    const offseasonPlan = planDueJobsV1(policy, offseasonState, registry);
    if (offseasonPlan.collection_plan.jobs.some((job) => job.system_id === 'japan-jra-system')) fail('offseason JRA must not receive a due Job.');
    if (!offseasonPlan.decisions.some((decision) => decision.system_id === 'japan-jra-system' && decision.trigger === 'season_inactive')) fail('offseason decision missing.');
  } catch (error) {
    fail(`offseason scenario failed: ${error.message}`);
  }

  const cooldownState = structuredClone(fixtures.state);
  cooldownState.system_states.find((state) => state.system_id === 'hong-kong-hkjc-system').last_source_revalidation_at = '2026-07-08T12:00:00Z';
  try {
    const cooldownPlan = planDueJobsV1(policy, cooldownState, registry);
    if (cooldownPlan.collection_plan.jobs.some((job) => job.system_id === 'hong-kong-hkjc-system')) fail('HKJC revalidation cooldown must suppress a new Job.');
    if (!cooldownPlan.decisions.some((decision) => decision.system_id === 'hong-kong-hkjc-system' && decision.trigger === 'source_health' && decision.disposition === 'not_due')) fail('HKJC cooldown not-due decision missing.');
  } catch (error) {
    fail(`cooldown scenario failed: ${error.message}`);
  }

  const cappedPolicy = structuredClone(policy);
  cappedPolicy.scheduler.max_jobs_per_plan = 4;
  let capRejected = false;
  try {
    planDueJobsV1(cappedPolicy, fixtures.state, registry);
  } catch {
    capRejected = true;
  }
  if (!capRejected) fail('planner must reject a result above max_jobs_per_plan.');
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
const invalidIds = new Set();
if (plan) {
  for (const testCase of invalidFixtures.plan_cases ?? []) {
    invalidIds.add(testCase.case_id);
    const changed = mutate(plan, testCase);
    if (validateDueJobPlanV1(changed, policy, registry).length === 0) fail(`invalid due-job plan case unexpectedly passed: ${testCase.case_id}`);
  }
}
for (const testCase of invalidFixtures.policy_cases ?? []) {
  invalidIds.add(testCase.case_id);
  const changed = mutate(policy, testCase);
  if (validateDueJobPolicyV1(changed, registry).length === 0) fail(`invalid due-job policy case unexpectedly passed: ${testCase.case_id}`);
}
for (const required of [
  'artifact-only-disabled', 'jobs-executed-enabled', 'automatic-publication-enabled', 'decision-unknown-job',
  'missing-planned-decision', 'job-source-route-injected', 'policy-executes-jobs', 'policy-auto-approval',
  'policy-rank-retry-without-registry-support', 'policy-max-jobs-zero',
]) {
  if (!invalidIds.has(required)) fail(`required invalid due-job case missing: ${required}`);
}

const workflow = readText('.github/workflows/calendar-due-job-planner.yml');
for (const phrase of [
  "cron: '17 3 * * *'",
  'permissions:\n  contents: read',
  'Plan explicit due Collection Jobs',
  'actions/upload-artifact@v4',
]) {
  if (!workflow.includes(phrase)) fail(`Due-job workflow missing ${phrase}.`);
}
if (/pull-requests:\s*write/.test(workflow) || /contents:\s*write/.test(workflow)) fail('Due-job workflow must not have write permissions.');
for (const forbidden of ['run-calendar-actions-job', 'run-calendar-local-plan', 'promote-timetable', 'wrangler pages deploy']) {
  if (workflow.includes(forbidden)) fail(`Due-job workflow must not execute or publish work: ${forbidden}`);
}

const docs = readText('docs/calendar/due-job-planner.md');
for (const phrase of [
  'planning is not execution',
  'source freshness thresholds',
  'meeting proximity',
  'source publication horizon',
  'season state',
  'rank gaps',
  'retry backoff',
  'coverage gaps',
  'source health',
  'daily planning cadence',
]) {
  if (!docs.includes(phrase)) fail(`Due-job planner contract missing ${phrase}.`);
}
const implementationPlan = readText('docs/calendar/acquisition-control-plane-implementation-plan.md');
for (const phrase of ['Stage ACP-14 — due-job planner and scheduling', 'Status: complete.', 'Stage ACP-15 — Operations v2 operator view', 'Status: current.']) {
  if (!implementationPlan.includes(phrase)) fail(`control-plane implementation plan missing ${phrase}.`);
}

if (errors.length) {
  console.error(`CALENDAR_DUE_JOB_PLANNER: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('CALENDAR_DUE_JOB_PLANNER: pass');
console.log(`JOBS: ${plan?.collection_plan.jobs.length ?? 0}`);
console.log('FRESHNESS_AND_PROXIMITY: pass');
console.log('SOURCE_HORIZON: pass');
console.log('COVERAGE_GAP: pass');
console.log('RANK_RETRY_BACKOFF: pass');
console.log('BANEI_RANK_RETRY_PLANNING: enabled / batch=2 / attempts=3');
console.log('SOURCE_HEALTH_REVALIDATION: pass');
console.log('SEASON_SUPPRESSION: pass');
console.log('MAX_JOB_CAP: pass');
console.log('ARTIFACT_ONLY_SCHEDULER: pass');
