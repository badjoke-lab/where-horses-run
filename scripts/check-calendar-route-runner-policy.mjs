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

const policy = readJson('data/static/calendar-route-runner-policy-v1.json');
const schema = readJson('data/static/calendar-route-runner-policy.schema.json');
const fixtures = readJson('data/fixtures/calendar-route-runner-policy-fixtures-v1.json');
const registry = loadCalendarAcquisitionRegistryV1(root);
const compatibility = readJson('data/static/calendar-runner-compatibility-contract-v1.json');
const plans = readJson('data/fixtures/calendar-collection-plans-v1.json');
const duePolicy = readJson('data/static/calendar-due-job-policy-v1.json');
const dueFixtures = readJson('data/fixtures/calendar-due-job-planner-fixtures-v1.json');
const activationAudit = readJson('data/audits/calendar-hkjc-detail-operator-activation-v1.json');

if (schema.$schema !== 'https://json-schema.org/draft/2020-12/schema') fail('route policy schema draft differs.');
if (schema.$id !== 'https://whr.badjoke-lab.com/schemas/calendar-route-runner-policy.schema.json') fail('route policy schema ID differs.');
if (schema.properties?.schema_version?.const !== 'calendar-route-runner-policy-v1') fail('route policy schema version differs.');

const policyErrors = validateRouteRunnerPolicyV1(policy, registry, compatibility);
if (policyErrors.length) fail(`route policy validation failed: ${policyErrors.join('; ')}`);
if (policy.policy_version !== 'calendar-route-runner-policy-2026-07-13') fail('route policy version differs.');
if (policy.routes.length !== 2) fail('HKJC route policy must contain exactly schedule and detail routes.');

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
if (fixtures.work_id !== 'WHR-CAL-HONG-KONG-HKJC' || fixtures.implementation_unit !== 'HKJC-PILOT-06B') fail('route policy fixture work identity differs.');
for (const testCase of fixtures.resolution_cases ?? []) {
  try {
    const resolution = resolveRouteRunnerPolicyV1(policy, testCase.request);
    for (const [key, value] of Object.entries(testCase.expected)) {
      if (!exact(resolution[key], value)) fail(`${testCase.id}: resolved ${key} differs.`);
    }
    if (resolution.human_review_required !== true || resolution.automatic_execution_allowed !== false || resolution.registry_activation !== false) {
      fail(`${testCase.id}: resolved safety boundary differs.`);
    }
  } catch (error) {
    fail(`${testCase.id}: expected resolution failed: ${error.message}`);
  }
}
for (const testCase of fixtures.rejection_cases ?? []) {
  let rejected = false;
  try { resolveRouteRunnerPolicyV1(policy, testCase.request); }
  catch { rejected = true; }
  if (!rejected) fail(`${testCase.id}: unsafe route resolution unexpectedly succeeded.`);
}

const profile = registry.records.find((record) => record.system_id === 'hong-kong-hkjc-system');
if (!profile) fail('HKJC Registry profile missing.');
else {
  if (profile.primary_runner !== 'github_actions') fail('legacy system-level primary runner changed.');
  if (profile.fallback_runner !== null || !profile.pending_fields?.includes('fallback_runner')) fail('legacy system-level fallback must remain pending.');
  if (profile.detail_source_id !== 'hkjc-detail-reviewed-import' || profile.detail_adapter_id !== 'hkjc-detail-reviewed-import-v1') fail('HKJC Registry detail source/adapter activation differs.');
  if (!exact(profile.supported_observation_ranks, ['C', 'B', 'B+', 'A', 'A+'])) fail('HKJC Registry observation ranks differ.');
  if (profile.supports_selected_meetings !== false || profile.supports_rank_upgrade_retry !== false) fail('HKJC Registry must not activate selected-meeting retry in this unit.');
}

if (activationAudit.schema_version !== 'calendar-hkjc-detail-operator-activation-v1') fail('HKJC detail activation audit schema differs.');
if (activationAudit.work_id !== 'WHR-CAL-HKJC-DETAIL-RECOVERY' || activationAudit.implementation_unit !== 'HKJC-DETAIL-RECOVERY-01') fail('HKJC detail activation audit work identity differs.');
if (activationAudit.decision !== 'activate_operator_reviewed_detail_path') fail('HKJC detail activation decision differs.');
if (activationAudit.reviewed_reference?.meeting_id !== 'hkjc-happy-valley-racecourse-2026-06-10'
  || activationAudit.reviewed_reference?.race_count !== 9
  || activationAudit.reviewed_reference?.first_race_time_local !== '18:40'
  || activationAudit.reviewed_reference?.last_race_time_local !== '22:50'
  || activationAudit.reviewed_reference?.technical_rank !== 'A+') fail('HKJC reviewed A+ reference differs.');
if (!exact(activationAudit.detail_route?.evidence_backed_observation_ranks, ['B', 'A+'])) fail('HKJC activation audit evidence ranks differ.');
if (!exact(activationAudit.detail_route?.classifier_supported_observation_ranks, ['C', 'B', 'B+', 'A', 'A+'])) fail('HKJC activation audit classifier ranks differ.');
if (Object.values(activationAudit.side_effect_boundary ?? {}).some((value) => value !== false)) fail('HKJC activation audit side-effect boundary differs.');

const existingPlan = plans.plans.find((entry) => entry.plan_id === 'nar-hkjc-actions-window-001');
if (!existingPlan) fail('existing NAR/HKJC Collection Plan fixture missing.');
else {
  const planErrors = validateCollectionPlanV1(existingPlan, registry);
  if (planErrors.length) fail(`existing Collection Plan backward compatibility failed: ${planErrors.join('; ')}`);
  const hkjcJob = existingPlan.jobs.find((job) => job.system_id === 'hong-kong-hkjc-system');
  if (hkjcJob?.runner_policy?.mode !== 'exact' || hkjcJob.runner_policy.runner !== 'github_actions') fail('existing HKJC schedule Job routing changed.');
  try {
    const route = resolveRouteRunnerPolicyV1(policy, {
      system_id: hkjcJob.system_id,
      route_kind: 'schedule',
      selection_context: 'collection_job',
      collection_mode: hkjcJob.collection_mode,
      requested_runner: hkjcJob.runner_policy.runner,
    });
    if (route.runner !== 'github_actions') fail('existing HKJC schedule Job route resolution differs.');
  } catch (error) {
    fail(`existing HKJC schedule Job route policy failed: ${error.message}`);
  }
}

const unsafeGenericDetailJob = {
  schema_version: 'calendar-collection-job-v1',
  job_id: 'hkjc-detail-reviewed-import-generic-job',
  campaign_id: 'hkjc-route-policy-safety-proof',
  system_id: 'hong-kong-hkjc-system',
  runner_policy: { mode: 'exact', runner: 'reviewed_import' },
  collection_mode: 'date_window',
  requested_scope: { start_date: '2026-07-08', end_date_exclusive: '2026-07-09', timezone: 'Asia/Hong_Kong' },
  rank_strategy: 'best_available',
  target_rank: null,
  reason: 'manual_recovery',
  requested_at: '2026-07-11T00:00:00Z',
};
if (validateCollectionJobV1(unsafeGenericDetailJob, registry).length === 0) fail('generic Collection Job unexpectedly selected operator-only HKJC reviewed_import detail route.');

let duePlan = null;
try { duePlan = planDueJobsV1(duePolicy, dueFixtures.state, registry); }
catch (error) { fail(`Due-job Planner backward compatibility failed: ${error.message}`); }
if (duePlan) {
  const hkjcJobs = duePlan.collection_plan.jobs.filter((job) => job.system_id === 'hong-kong-hkjc-system');
  if (hkjcJobs.length !== 1) fail(`expected one HKJC due Job, got ${hkjcJobs.length}`);
  for (const job of hkjcJobs) {
    try {
      const resolution = resolveRouteRunnerPolicyV1(policy, {
        system_id: job.system_id,
        route_kind: 'schedule',
        selection_context: 'due_job_planner',
        collection_mode: job.collection_mode,
        requested_runner: null,
      });
      if (resolution.runner !== 'github_actions') fail('HKJC due Job did not resolve to schedule Actions route.');
    } catch (error) {
      fail(`HKJC due Job schedule route resolution failed: ${error.message}`);
    }
  }
  if (hkjcJobs.some((job) => job.runner_policy?.runner === 'reviewed_import')) fail('Due-job Planner selected operator-only HKJC detail route.');
}

const status = buildRouteRunnerPolicyStatusV1(policy, registry);
if (status.schema_version !== 'calendar-route-runner-policy-status-v1') fail('route policy status schema differs.');
if (status.systems.length !== 1) fail('route policy status system count differs.');
const systemStatus = status.systems[0];
if (systemStatus.system_id !== 'hong-kong-hkjc-system') fail('route policy status system differs.');
if (systemStatus.registry_primary_runner !== 'github_actions' || systemStatus.registry_fallback_runner !== null || systemStatus.registry_fallback_pending !== true) fail('route policy status Registry compatibility state differs.');
if (systemStatus.routes.length !== 2) fail('route policy status route count differs.');
const detailStatus = systemStatus.routes.find((route) => route.route_kind === 'detail');
if (detailStatus?.selection_mode !== 'operator_only' || detailStatus?.primary_runner !== 'reviewed_import') fail('Operations route supplement detail state differs.');
if (!exact(detailStatus?.evidence_backed_observation_ranks, ['B', 'A+'])) fail('Operations route supplement detail ranks differ.');
if (Object.values(status.side_effect_boundary).some((value) => value !== false)) fail('route policy status side-effect boundary differs.');

for (const file of [
  schedule.entry_point,
  detail.entry_point,
  schedule.evidence_ref,
  detail.evidence_ref,
  activationAudit.detail_route.workflow,
  activationAudit.detail_route.artifact_extractor,
]) {
  if (!fs.existsSync(path.join(root, file))) fail(`route policy referenced file missing: ${file}`);
}
const detailEntryPoint = readText(detail.entry_point);
if (detailEntryPoint.includes('fetch(') || detailEntryPoint.includes('https://') || detailEntryPoint.includes('http://')) fail('operator-only detail package entry point must remain network-free.');
const operatorWorkflow = readText(activationAudit.detail_route.workflow);
for (const phrase of ['workflow_dispatch:', 'reviewed_input_base64', 'contents: read', 'build-hkjc-detail-reviewed-import-package.mjs', 'extract-hkjc-detail-reviewed-import-artifacts.mjs', 'actions/upload-artifact@v4']) {
  if (!operatorWorkflow.includes(phrase)) fail(`HKJC detail operator workflow missing ${phrase}.`);
}

const docs = readText('docs/calendar/hkjc-route-specific-runner-policy.md');
for (const phrase of [
  'HKJC-DETAIL-RECOVERY-01',
  'system-level fields remain authoritative for legacy jobs',
  'schedule route',
  'detail route',
  'operator-only',
  'Due-job Planner',
  'Operations supplement',
  'no automatic import',
  'Registry detail fields are now active',
]) {
  if (!docs.includes(phrase)) fail(`route policy document missing ${phrase}.`);
}

if (errors.length) {
  console.error(`CALENDAR_ROUTE_RUNNER_POLICY: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('CALENDAR_ROUTE_RUNNER_POLICY: pass');
console.log('IMPLEMENTATION_UNIT: HKJC-DETAIL-RECOVERY-01');
console.log('SCHEDULE_ROUTE: github_actions / collection_job');
console.log('DETAIL_ROUTE: reviewed_import / operator_only / B+A+ evidence');
console.log('LEGACY_REGISTRY_FIELDS: schedule routing backward compatible');
console.log('REGISTRY_DETAIL_SOURCE_ADAPTER: active');
console.log('GENERIC_DETAIL_COLLECTION_JOB: rejected');
console.log('DUE_JOB_DETAIL_ROUTE_SELECTION: rejected');
console.log('OPERATIONS_SUPPLEMENT: route_status_available');
console.log('SELECTED_MEETING_RANK_RETRY: pending');
console.log('AUTOMATIC_EXECUTION: false');
