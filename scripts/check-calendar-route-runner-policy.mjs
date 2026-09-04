import fs from 'node:fs';
import path from 'node:path';
import { loadCalendarAcquisitionRegistryV1 } from './timetable/load-calendar-acquisition-registry.mjs';
import { validateCollectionPlanV1 } from './timetable/collection-plan-validation.mjs';
import { validateCollectionJobV1 } from './timetable/collection-job-validation.mjs';
import { planDueJobsV1 } from './timetable/due-job-planner.mjs';
import {
  buildRouteRunnerPolicyStatusV1,
  resolveRouteRunnerPolicyV1,
  routePolicyForV1,
  validateRouteRunnerPolicyV1,
} from './timetable/route-runner-policy.mjs';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
const readText = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const exact = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const stableId = (value) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(String(value ?? ''));

const policy = readJson('data/static/calendar-route-runner-policy-v1.json');
const schema = readJson('data/static/calendar-route-runner-policy.schema.json');
const fixtures = readJson('data/fixtures/calendar-route-runner-policy-fixtures-v1.json');
const registry = loadCalendarAcquisitionRegistryV1(root);
const compatibility = readJson('data/static/calendar-runner-compatibility-contract-v1.json');
const plans = readJson('data/fixtures/calendar-collection-plans-v1.json');
const duePolicy = readJson('data/static/calendar-due-job-policy-v1.json');
const dueFixtures = readJson('data/fixtures/calendar-due-job-planner-fixtures-v1.json');

if (schema.$schema !== 'https://json-schema.org/draft/2020-12/schema') fail('route policy schema draft differs.');
if (schema.$id !== 'https://whr.badjoke-lab.com/schemas/calendar-route-runner-policy.schema.json') fail('route policy schema ID differs.');
if (schema.properties?.schema_version?.const !== 'calendar-route-runner-policy-v1') fail('route policy schema version differs.');

const policyErrors = validateRouteRunnerPolicyV1(policy, registry, compatibility);
if (policyErrors.length) fail(`route policy validation failed: ${policyErrors.join('; ')}`);
if (!stableId(policy.policy_version)) fail('route policy version must be a stable ID.');
if (policy.routes.some((route) => String(route.evidence_ref).startsWith('data/audits/'))) fail('current route policy must not depend on historical activation/pilot audit files.');

const schedule = routePolicyForV1(policy, 'hong-kong-hkjc-system', 'schedule');
const detail = routePolicyForV1(policy, 'hong-kong-hkjc-system', 'detail');
if (schedule.status !== 'active' || schedule.selection_mode !== 'collection_job') fail('HKJC schedule route state differs.');
if (schedule.primary_runner !== 'github_actions' || schedule.fallback_runner !== null) fail('HKJC schedule route runner state differs.');
if (schedule.automatic_planning_allowed !== true || schedule.automatic_execution_allowed !== false) fail('HKJC schedule automation boundary differs.');
if (!exact(schedule.evidence_backed_observation_ranks, ['C'])) fail('HKJC schedule route evidence ranks differ.');
if (detail.status !== 'operator_path_evidence_backed' || detail.selection_mode !== 'operator_only') fail('HKJC detail route state differs.');
if (detail.primary_runner !== 'reviewed_import' || detail.fallback_runner !== null) fail('HKJC detail route runner state differs.');
if (detail.automatic_planning_allowed !== false || detail.automatic_execution_allowed !== false) fail('HKJC detail automation boundary differs.');
if (!exact(detail.evidence_backed_observation_ranks, ['B', 'A+'])) fail('HKJC detail route evidence ranks differ.');

if (fixtures.schema_version !== 'calendar-route-runner-policy-fixtures-v1') fail('route policy fixtures schema differs.');
if (!stableId(fixtures.work_id) || !stableId(fixtures.implementation_unit)) fail('route policy fixture identifiers must be stable IDs.');
if (!Array.isArray(fixtures.resolution_cases) || fixtures.resolution_cases.length === 0) fail('route policy fixtures need resolution coverage.');
if (!Array.isArray(fixtures.rejection_cases) || fixtures.rejection_cases.length === 0) fail('route policy fixtures need rejection coverage.');
const caseIds = new Set();
for (const testCase of fixtures.resolution_cases ?? []) {
  if (!testCase.id || caseIds.has(testCase.id)) fail(`duplicate or missing route fixture id ${testCase.id ?? 'missing'}`);
  caseIds.add(testCase.id);
  try {
    const resolution = resolveRouteRunnerPolicyV1(policy, testCase.request);
    for (const [key, value] of Object.entries(testCase.expected)) if (!exact(resolution[key], value)) fail(`${testCase.id}: resolved ${key} differs.`);
    if (resolution.human_review_required !== true || resolution.automatic_execution_allowed !== false || resolution.registry_activation !== false) fail(`${testCase.id}: resolved safety boundary differs.`);
  } catch (error) {
    fail(`${testCase.id}: expected resolution failed: ${error.message}`);
  }
}
for (const testCase of fixtures.rejection_cases ?? []) {
  if (!testCase.id || caseIds.has(testCase.id)) fail(`duplicate or missing route fixture id ${testCase.id ?? 'missing'}`);
  caseIds.add(testCase.id);
  let rejected = false;
  try { resolveRouteRunnerPolicyV1(policy, testCase.request); } catch { rejected = true; }
  if (!rejected) fail(`${testCase.id}: unsafe route resolution unexpectedly succeeded.`);
}

const profile = registry.records.find((record) => record.system_id === 'hong-kong-hkjc-system');
if (!profile) fail('HKJC Registry profile missing.');
else {
  if (profile.primary_runner !== schedule.primary_runner) fail('HKJC Registry schedule runner differs from route policy.');
  if (profile.fallback_runner !== null || !profile.pending_fields?.includes('fallback_runner')) fail('HKJC system fallback must remain unclaimed/pending.');
  if (profile.schedule_source_id !== schedule.source_id || profile.schedule_adapter_id !== schedule.adapter_id) fail('HKJC schedule source/adapter differs from Registry.');
  if (profile.detail_source_id !== detail.source_id || profile.detail_adapter_id !== detail.adapter_id) fail('HKJC detail source/adapter differs from Registry.');
  if (!exact(profile.supported_observation_ranks, ['C', 'B', 'B+', 'A', 'A+'])) fail('HKJC Registry observation ranks differ.');
}

let hkjcPlanJobs = 0;
for (const plan of plans.plans ?? []) {
  const planErrors = validateCollectionPlanV1(plan, registry);
  if (planErrors.length) fail(`${plan.plan_id}: Collection Plan invalid: ${planErrors.join('; ')}`);
  for (const job of plan.jobs ?? []) {
    if (job.system_id !== 'hong-kong-hkjc-system') continue;
    hkjcPlanJobs += 1;
    try {
      const route = resolveRouteRunnerPolicyV1(policy, {
        system_id: job.system_id,
        route_kind: 'schedule',
        selection_context: 'collection_job',
        collection_mode: job.collection_mode,
        requested_runner: job.runner_policy?.runner ?? null,
      });
      if (route.runner !== 'github_actions') fail(`${plan.plan_id}/${job.job_id}: HKJC schedule Job route differs.`);
    } catch (error) {
      fail(`${plan.plan_id}/${job.job_id}: HKJC schedule route failed: ${error.message}`);
    }
  }
}
if (hkjcPlanJobs === 0) fail('Collection Plan fixtures must exercise an HKJC schedule Job.');

const unsafeGenericDetailJob = {
  schema_version: 'calendar-collection-job-v1',
  job_id: 'hkjc-detail-reviewed-import-generic-job',
  campaign_id: 'hkjc-route-policy-regression',
  system_id: 'hong-kong-hkjc-system',
  runner_policy: { mode: 'exact', runner: 'reviewed_import' },
  collection_mode: 'date_window',
  requested_scope: { start_date: '2030-01-01', end_date_exclusive: '2030-01-02', timezone: 'Asia/Hong_Kong' },
  rank_strategy: 'best_available',
  target_rank: null,
  reason: 'manual_recovery',
  requested_at: '2030-01-01T00:00:00Z',
};
if (validateCollectionJobV1(unsafeGenericDetailJob, registry).length === 0) fail('generic Collection Job unexpectedly selected operator-only HKJC reviewed_import detail route.');

let duePlan = null;
try { duePlan = planDueJobsV1(duePolicy, dueFixtures.state, registry); } catch (error) { fail(`Due-job Planner regression failed: ${error.message}`); }
if (duePlan) {
  const hkjcJobs = duePlan.collection_plan.jobs.filter((job) => job.system_id === 'hong-kong-hkjc-system');
  if (hkjcJobs.length === 0) fail('Due-job fixture must exercise HKJC scheduling.');
  for (const job of hkjcJobs) {
    try {
      const resolution = resolveRouteRunnerPolicyV1(policy, {
        system_id: job.system_id,
        route_kind: 'schedule',
        selection_context: 'due_job_planner',
        collection_mode: job.collection_mode,
        requested_runner: null,
      });
      if (resolution.runner !== 'github_actions') fail(`${job.job_id}: HKJC due Job route differs.`);
    } catch (error) {
      fail(`${job.job_id}: HKJC due Job schedule route failed: ${error.message}`);
    }
    if (job.runner_policy?.runner === 'reviewed_import') fail(`${job.job_id}: Due-job Planner selected operator-only detail route.`);
  }
}

const status = buildRouteRunnerPolicyStatusV1(policy, registry);
if (status.schema_version !== 'calendar-route-runner-policy-status-v1') fail('route policy status schema differs.');
const systemStatus = status.systems.find((system) => system.system_id === 'hong-kong-hkjc-system');
if (!systemStatus) fail('route policy status missing HKJC.');
else {
  const scheduleStatus = systemStatus.routes.find((route) => route.route_kind === 'schedule');
  const detailStatus = systemStatus.routes.find((route) => route.route_kind === 'detail');
  if (scheduleStatus?.primary_runner !== 'github_actions' || scheduleStatus?.selection_mode !== 'collection_job') fail('route status schedule state differs.');
  if (detailStatus?.primary_runner !== 'reviewed_import' || detailStatus?.selection_mode !== 'operator_only') fail('route status detail state differs.');
}
if (Object.values(status.side_effect_boundary).some((value) => value !== false)) fail('route policy status side-effect boundary differs.');

for (const route of [schedule, detail]) {
  for (const file of [route.entry_point, route.evidence_ref]) if (!fs.existsSync(path.join(root, file))) fail(`route policy referenced file missing: ${file}`);
}
const detailEntryPoint = readText(detail.entry_point);
if (detailEntryPoint.includes('fetch(') || detailEntryPoint.includes('https://') || detailEntryPoint.includes('http://')) fail('operator-only detail package entry point must remain network-free.');
const operatorWorkflow = readText(detail.evidence_ref);
for (const phrase of ['workflow_dispatch:', 'reviewed_input_base64', 'contents: read', 'build-hkjc-detail-reviewed-import-package.mjs', 'extract-hkjc-detail-reviewed-import-artifacts.mjs', 'actions/upload-artifact@v4']) {
  if (!operatorWorkflow.includes(phrase)) fail(`HKJC detail operator workflow missing ${phrase}.`);
}
const scheduleWorkflow = readText(schedule.evidence_ref);
for (const phrase of ['schedule:', 'run-hkjc-official-window.mjs', 'apply-official-rolling-observations.mjs', '--authority-id=hkjc', 'git push origin HEAD:main']) {
  if (!scheduleWorkflow.includes(phrase)) fail(`HKJC schedule workflow missing ${phrase}.`);
}

if (errors.length) {
  console.error(`CALENDAR_ROUTE_RUNNER_POLICY: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('CALENDAR_ROUTE_RUNNER_POLICY: pass');
console.log(`POLICY_VERSION: ${policy.policy_version}`);
console.log('SCHEDULE_ROUTE: github_actions / collection_job');
console.log('DETAIL_ROUTE: reviewed_import / operator_only');
console.log('HISTORICAL_AUDIT_ROUTE_EVIDENCE: 0');
console.log('GENERIC_DETAIL_COLLECTION_JOB: rejected');
console.log('DUE_JOB_DETAIL_ROUTE_SELECTION: rejected');
console.log('AUTOMATIC_EXECUTION: false');
