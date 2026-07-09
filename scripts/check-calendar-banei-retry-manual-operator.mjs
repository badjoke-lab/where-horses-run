import fs from 'node:fs';
import path from 'node:path';
import { loadCalendarAcquisitionRegistryV1 } from './timetable/load-calendar-acquisition-registry.mjs';
import { planActionsMultiJobV1 } from './timetable/actions-multi-job-core.mjs';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
const readText = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const exact = (left, right) => JSON.stringify(left) === JSON.stringify(right);

const workflow = readText('.github/workflows/calendar-actions-multi-job.yml');
const docs = readText('docs/calendar/banei-retry-manual-operator.md');
const plans = readJson('data/fixtures/calendar-collection-plans-v1.json');
const registry = loadCalendarAcquisitionRegistryV1(root);
const compatibility = readJson('data/static/calendar-runner-compatibility-contract-v1.json');
const evidence = readJson('data/fixtures/calendar-banei-retry-ops-evidence-v1.json');
const policy = readJson('data/static/calendar-due-job-policy-v1.json');

const allowedPlanId = 'banei-reviewed-retry-ops-001';
const validationPlanId = 'banei-actions-window-selected-001';

if (!workflow.includes(`          - ${allowedPlanId}`)) fail('reviewed Banei retry Plan is not exposed as workflow_dispatch choice.');
if (workflow.includes(`          - ${validationPlanId}`)) fail('broad Banei validation Plan must not be exposed as workflow_dispatch choice.');
if (!workflow.includes('workflow_dispatch:')) fail('manual workflow_dispatch trigger missing.');
if (/\bschedule\s*:|\bcron\s*:/.test(workflow)) fail('manual operator workflow must not have schedule or cron trigger.');
if (!workflow.includes('permissions:\n  contents: read')) fail('manual operator workflow must retain read-only contents permission.');
if (/contents:\s*write/.test(workflow)) fail('manual operator workflow must not have contents write permission.');
for (const pathMarker of [
  "'scripts/timetable/run-banei-actions-job.mjs'",
  "'scripts/timetable/banei-actions-executor-core.mjs'",
]) {
  if (!workflow.includes(pathMarker)) fail(`workflow path filters missing ${pathMarker}.`);
}
for (const forbidden of ['promote-timetable', 'wrangler pages deploy', 'deploy production']) {
  if (workflow.includes(forbidden)) fail(`manual operator workflow contains forbidden side-effect command ${forbidden}.`);
}

const plan = plans.plans.find((entry) => entry.plan_id === allowedPlanId);
if (!plan) fail('reviewed Banei retry Plan fixture missing.');
else {
  if (plan.campaign_id !== 'banei-reviewed-retry-operations') fail('reviewed Plan campaign_id differs.');
  if (plan.jobs.length !== 1) fail(`reviewed Plan must contain exactly one Job, got ${plan.jobs.length}.`);
  const job = plan.jobs[0];
  if (job.job_id !== 'banei-reviewed-retry-job-001') fail('reviewed Job ID differs.');
  if (job.system_id !== 'japan-banei-system') fail('reviewed Job system differs.');
  if (!exact(job.runner_policy, { mode: 'registry_primary_or_fallback', runner: null })) fail(`reviewed Job runner policy differs: ${JSON.stringify(job.runner_policy)}`);
  if (job.collection_mode !== 'selected_meetings') fail('reviewed Job must use selected_meetings.');
  if (!exact(job.requested_scope.meeting_ids, ['banei-obihiro-racecourse-2026-07-04'])) fail(`reviewed Job selected meeting differs: ${JSON.stringify(job.requested_scope.meeting_ids)}`);
  if (job.reason !== 'rank_upgrade_retry') fail('reviewed Job reason differs.');
  if (job.rank_strategy !== 'target_rank' || job.target_rank !== 'A+') fail('reviewed Job target differs.');

  try {
    const actionsPlan = planActionsMultiJobV1(plan, registry, compatibility);
    if (actionsPlan.jobs.length !== 1 || actionsPlan.excluded.length !== 0) fail('reviewed Plan must compile exactly one hosted Job.');
    else {
      const hosted = actionsPlan.jobs[0];
      if (hosted.execution.runner_used !== 'github_actions') fail('reviewed Job runner resolution differs.');
      if (hosted.execution.executor_id !== 'banei-schedule-detail-actions') fail('reviewed Job executor resolution differs.');
      if (hosted.execution.collection_mode !== 'selected_meetings') fail('compiled execution mode differs.');
      if (hosted.execution.reason !== 'rank_upgrade_retry') fail('compiled execution reason differs.');
      if (hosted.execution.target_rank !== 'A+') fail('compiled execution target differs.');
      if (hosted.batch_id !== 'banei-reviewed-retry-ops-001-banei-reviewed-retry-job-001-run-001') fail(`compiled batch ID differs: ${hosted.batch_id}`);
    }
  } catch (error) {
    fail(`reviewed Plan compilation failed: ${error.message}`);
  }
}

if (evidence.plan_id !== allowedPlanId) fail('operational evidence Plan ID differs.');
if (evidence.status !== 'success') fail('operational evidence status must be success.');
if (evidence.observed_rank !== 'A+') fail('operational evidence observed rank must be A+.');
if (evidence.coverage?.claim !== 'source_window_complete') fail('operational evidence coverage differs.');
if (evidence.coverage?.unresolved_meeting_count !== 0 || evidence.coverage?.source_error_count !== 0) fail('operational evidence unresolved/error state differs.');
if (evidence.review_queue?.review_state !== 'review_ready' || evidence.review_queue?.promotion_state !== 'not_ready') fail('operational evidence review boundary differs.');

if (policy.scheduler.artifact_only !== true || policy.scheduler.execute_jobs !== false) fail('scheduler planning/execution boundary differs.');
for (const key of ['automatic_approval', 'automatic_promotion', 'automatic_publication', 'automatic_deployment']) {
  if (policy.scheduler[key] !== false) fail(`scheduler ${key} must remain false.`);
}

for (const phrase of [
  'workflow_dispatch',
  'banei-reviewed-retry-ops-001',
  'banei-actions-window-selected-001',
  'is not exposed as a manual operator choice',
  'standard Actions dispatcher',
  'artifact_only: true',
  'execute_jobs: false',
  'Review Queue review_state: review_ready',
  'Review Queue promotion_state: not_ready',
]) {
  if (!docs.includes(phrase)) fail(`manual operator contract missing ${phrase}.`);
}

if (errors.length) {
  console.error(`CALENDAR_BANEI_RETRY_MANUAL_OPERATOR: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('CALENDAR_BANEI_RETRY_MANUAL_OPERATOR: pass');
console.log(`ALLOWED_PLAN: ${allowedPlanId}`);
console.log('HOSTED_JOBS: 1');
console.log('RUNNER: github_actions');
console.log('EXECUTOR: banei-schedule-detail-actions');
console.log('AUTOMATIC_EXECUTION: false');
console.log('AUTOMATIC_PUBLICATION: false');
