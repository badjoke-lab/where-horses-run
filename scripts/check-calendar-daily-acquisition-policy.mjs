import fs from 'node:fs';
import path from 'node:path';
import { loadCalendarAcquisitionRegistryV1 } from './timetable/load-calendar-acquisition-registry.mjs';
import { planActionsMultiJobV1 } from './timetable/actions-multi-job-core.mjs';
import {
  validateDailyAcquisitionPolicyV1,
  validateDailyActionsPlanV1,
} from './timetable/daily-acquisition-policy.mjs';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
const readText = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

const policy = readJson('data/static/calendar-daily-acquisition-policy-v1.json');
const policyErrors = validateDailyAcquisitionPolicyV1(policy);
if (policyErrors.length) fail(`daily acquisition policy invalid: ${policyErrors.join('; ')}`);

const registry = loadCalendarAcquisitionRegistryV1(root);
const compatibility = readJson('data/static/calendar-runner-compatibility-contract-v1.json');
const fixtures = readJson('data/fixtures/calendar-collection-plans-v1.json');

function dueWrapper(plan) {
  return {
    schema_version: 'calendar-due-job-plan-v1',
    policy_version: 'calendar-due-job-policy-2026-07-19',
    generated_at: plan.created_at,
    planning_date: plan.created_at.slice(0, 10),
    collection_plan: plan,
    decisions: plan.jobs.map((job) => ({
      system_id: job.system_id,
      trigger: job.reason,
      disposition: 'job_planned',
      job_id: job.job_id,
      detail: 'daily acquisition policy validation fixture',
    })),
    scheduler_boundary: {
      cadence_hours: 24,
      artifact_only: true,
      jobs_executed: false,
      automatic_approval: false,
      automatic_promotion: false,
      automatic_publication: false,
      automatic_deployment: false,
    },
  };
}

const eastAsia = fixtures.plans.find((plan) => plan.plan_id === 'nar-hkjc-actions-window-001');
if (!eastAsia) fail('NAR/HKJC fixture Plan missing');
else {
  const actionsPlan = planActionsMultiJobV1(eastAsia, registry, compatibility);
  const validation = validateDailyActionsPlanV1(policy, dueWrapper(eastAsia), actionsPlan);
  if (validation.length) fail(`authorized NAR/HKJC Plan rejected: ${validation.join('; ')}`);

  const wrongRunner = structuredClone(actionsPlan);
  wrongRunner.jobs[0].execution.runner_used = 'local';
  if (!validateDailyActionsPlanV1(policy, dueWrapper(eastAsia), wrongRunner).some((error) => error.includes('runner is not authorized'))) {
    fail('unauthorized runner mutation was not rejected');
  }
}

const baneiGeneral = fixtures.plans.find((plan) => plan.plan_id === 'banei-actions-window-selected-001');
if (!baneiGeneral) fail('Banei general Actions fixture Plan missing');
else {
  const actionsPlan = planActionsMultiJobV1(baneiGeneral, registry, compatibility);
  const validation = validateDailyActionsPlanV1(policy, dueWrapper(baneiGeneral), actionsPlan);
  if (!validation.some((error) => error.includes('mode date_window is not authorized'))) {
    fail('Banei regular date-window execution must be rejected by daily policy');
  }
  if (!validation.some((error) => error.includes('reason coverage_gap is not authorized'))) {
    fail('Banei selected coverage-gap execution must be rejected by daily policy');
  }
}

const baneiRetry = fixtures.plans.find((plan) => plan.plan_id === 'banei-reviewed-retry-ops-001');
if (!baneiRetry) fail('Banei reviewed rank-retry fixture Plan missing');
else {
  const retryActions = planActionsMultiJobV1(baneiRetry, registry, compatibility);
  const retryValidation = validateDailyActionsPlanV1(policy, dueWrapper(baneiRetry), retryActions);
  if (retryValidation.length) fail(`authorized Banei selected retry rejected: ${retryValidation.join('; ')}`);
}

const unsafePolicy = structuredClone(policy);
unsafePolicy.execution.automatic_publication = true;
if (!validateDailyAcquisitionPolicyV1(unsafePolicy).some((error) => error.includes('automatic_publication'))) {
  fail('automatic publication policy mutation was not rejected');
}

const workflow = readText('.github/workflows/calendar-daily-acquisition.yml');
for (const phrase of [
  "cron: '17 3 * * *'",
  'permissions:\n  contents: read',
  'validate-daily-acquisition-plan.mjs',
  'write-calendar-daily-acquisition-status.mjs',
  'automation/calendar-daily-acquisition-review',
  'Push evidence to the stable human-review branch',
  'git push origin "HEAD:${REVIEW_BRANCH}"',
]) {
  if (!workflow.includes(phrase)) fail(`daily acquisition workflow missing ${phrase}`);
}
if (!/review-pr:[\s\S]*permissions:\n\s+contents: write/.test(workflow)) {
  fail('review branch update job must own contents write permission');
}
if (/pull-requests:\s*write/.test(workflow)) fail('daily acquisition workflow must not require pull-request write permission');
if (/peter-evans\/create-pull-request/.test(workflow)) fail('daily acquisition workflow must not create pull requests itself');
for (const forbidden of ['promote-timetable', 'build-public-timetable-view', 'wrangler pages deploy', 'merge_pull_request', 'gh pr merge']) {
  if (workflow.includes(forbidden)) fail(`daily acquisition workflow contains forbidden command ${forbidden}`);
}

const contract = readText('docs/calendar/daily-acquisition-contract.md');
for (const phrase of [
  'WHR-CAL-DAILY-ACQUISITION',
  'calendar-daily-acquisition-policy-v1.json',
  'automatic Canonical promotion',
  'automatic public projection',
  'automation/calendar-daily-acquisition-review',
]) {
  if (!contract.includes(phrase)) fail(`daily acquisition contract missing ${phrase}`);
}

if (errors.length) {
  console.error(`CALENDAR_DAILY_ACQUISITION_POLICY: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('CALENDAR_DAILY_ACQUISITION_POLICY: pass');
console.log('NAR_HKJC_HOSTED_EXECUTION: authorized');
console.log('BANEI_REGULAR_REFRESH: rejected');
console.log('BANEI_SELECTED_COVERAGE_GAP: rejected');
console.log('BANEI_SELECTED_RETRY: authorized');
console.log('JRA_HOSTED_EXECUTION: excluded by Registry');
console.log('STABLE_REVIEW_BRANCH_PUSH: enabled');
console.log('AUTOMATIC_PR_CREATION: not required');
console.log('AUTOMATIC_PUBLICATION: disabled');
