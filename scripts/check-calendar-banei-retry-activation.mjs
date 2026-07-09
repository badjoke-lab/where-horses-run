import fs from 'node:fs';
import path from 'node:path';
import { loadCalendarAcquisitionRegistryV1 } from './timetable/load-calendar-acquisition-registry.mjs';
import { planDueJobsV1, validateDueJobPlanV1, validateDueJobPolicyV1 } from './timetable/due-job-planner.mjs';
import { buildBaneiRetryExecutionProofV1 } from './timetable/banei-retry-execution-proof.mjs';
import { buildBaneiControlPlaneBridgeV1 } from './timetable/banei-control-plane-bridge.mjs';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
const readText = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const exact = (left, right) => JSON.stringify(left) === JSON.stringify(right);

const registry = loadCalendarAcquisitionRegistryV1(root);
const policy = readJson('data/static/calendar-due-job-policy-v1.json');
const dueFixtures = readJson('data/fixtures/calendar-due-job-planner-fixtures-v1.json');
const proofFixture = readJson('data/fixtures/calendar-banei-retry-execution-proof-v1.json');
const compatibility = readJson('data/static/calendar-runner-compatibility-contract-v1.json');
const executorFixture = readJson('data/fixtures/calendar-banei-actions-executor-fixture-v1.json');
const bridgeFixture = readJson('data/fixtures/calendar-banei-control-plane-bridge-v1.json');

const profile = registry.records.find((entry) => entry.system_id === 'japan-banei-system');
if (!profile) fail('Banei Registry profile missing.');
else {
  if (profile.profile_status !== 'active') fail('Banei profile must remain active.');
  if (profile.primary_runner !== 'github_actions') fail('Banei primary runner must remain github_actions.');
  if (profile.fallback_runner !== 'reviewed_import') fail('Banei fallback runner must remain reviewed_import.');
  if (profile.supports_date_window !== true) fail('Banei date-window support must remain true.');
  if (profile.supports_selected_meetings !== true) fail('Banei selected-meeting support must remain true.');
  if (profile.supports_rank_upgrade_retry !== true) fail('Banei rank-upgrade retry support must be activated.');
  if (profile.supports_cross_month_window !== false) fail('Banei cross-month support must remain false.');
  if (profile.supports_source_visible_horizon !== false) fail('Banei source-visible-horizon support must remain false.');
}

const rule = policy.system_rules.find((entry) => entry.system_id === 'japan-banei-system');
if (!rule) fail('Banei Due-job policy rule missing.');
else {
  if (rule.enabled !== true) fail('Banei Due-job system rule must be enabled.');
  if (rule.regular_refresh.enabled !== false) fail('Banei regular refresh must remain disabled.');
  if (rule.coverage_gap.enabled !== false) fail('Banei coverage-gap planning must remain disabled.');
  if (rule.source_revalidation.enabled !== false) fail('Banei source revalidation must remain disabled.');
  if (rule.rank_retry.enabled !== true) fail('Banei rank-retry planning must be enabled.');
  if (rule.rank_retry.max_selected_meetings_per_job !== 2) fail('Banei retry batch limit must be 2.');
  if (rule.rank_retry.max_attempt_count !== 3) fail('Banei retry attempt limit must be 3.');
}

if (policy.scheduler.artifact_only !== true || policy.scheduler.execute_jobs !== false) fail('Due-job scheduler must remain artifact-only and non-executing.');
for (const key of ['automatic_approval', 'automatic_promotion', 'automatic_publication', 'automatic_deployment']) {
  if (policy.scheduler[key] !== false) fail(`scheduler ${key} must remain false.`);
}

const policyErrors = validateDueJobPolicyV1(policy, registry);
if (policyErrors.length) fail(`activated Due-job policy invalid: ${policyErrors.join('; ')}`);
let duePlan = null;
try {
  duePlan = planDueJobsV1(policy, dueFixtures.state, registry);
} catch (error) {
  fail(`activated Due-job planning failed: ${error.message}`);
}
if (duePlan) {
  const planErrors = validateDueJobPlanV1(duePlan, policy, registry);
  if (planErrors.length) fail(`activated Due-job plan invalid: ${planErrors.join('; ')}`);
  const baneiJobs = duePlan.collection_plan.jobs.filter((job) => job.system_id === 'japan-banei-system');
  if (baneiJobs.length !== 1) fail(`expected one Banei retry Job, got ${baneiJobs.length}`);
  else {
    const job = baneiJobs[0];
    if (job.reason !== 'rank_upgrade_retry') fail('Banei activated Job reason differs.');
    if (job.collection_mode !== 'selected_meetings') fail('Banei activated Job must use selected_meetings.');
    if (job.rank_strategy !== 'target_rank' || job.target_rank !== 'A+') fail('Banei activated Job target differs.');
    if (job.runner_policy.mode !== 'registry_primary_or_fallback') fail('Banei retry Job must preserve fallback eligibility.');
    if (!exact(job.requested_scope.meeting_ids, dueFixtures.expected.banei_retry_meeting_ids)) fail(`Banei activated retry IDs differ: ${JSON.stringify(job.requested_scope.meeting_ids)}`);
  }
}

const historicalRegistry = structuredClone(registry);
historicalRegistry.records.find((entry) => entry.system_id === 'japan-banei-system').supports_rank_upgrade_retry = false;
const historicalPolicy = structuredClone(policy);
const historicalRule = historicalPolicy.system_rules.find((entry) => entry.system_id === 'japan-banei-system');
historicalRule.enabled = false;
historicalRule.rank_retry.enabled = false;
historicalRule.rank_retry.max_selected_meetings_per_job = 0;
historicalRule.rank_retry.max_attempt_count = 0;

let proof = null;
try {
  proof = buildBaneiRetryExecutionProofV1({
    fixture: proofFixture,
    canonical_registry: historicalRegistry,
    canonical_policy: historicalPolicy,
    compatibility_contract: compatibility,
    executor_fixture: executorFixture,
  });
} catch (error) {
  fail(`pre-activation retry proof is no longer reproducible: ${error.message}`);
}
if (proof) {
  if (proof.due_plan.job_count !== 1) fail('proof must retain one selected retry Job.');
  if (proof.result.coverage_claim !== 'partial') fail('proof mixed result must remain partial.');
  if (!exact(proof.result.rank_counts, { C: 0, B: 1, 'B+': 0, A: 0, 'A+': 1 })) fail('proof mixed rank accounting differs.');
  if (proof.queue_transition.removed_successes.length !== 1) fail('proof success removal count differs.');
  if (proof.queue_transition.retained_failures.length !== 1) fail('proof failure retention count differs.');
}

let bridge = null;
try {
  bridge = buildBaneiControlPlaneBridgeV1(bridgeFixture);
} catch (error) {
  fail(`Banei bridge build failed after retry activation: ${error.message}`);
}
if (bridge) {
  if (bridge.retry_activation.state !== 'enabled_evidence_backed') fail(`Banei bridge retry activation state differs: ${bridge.retry_activation.state}`);
  if (bridge.retry_activation.automatic_retry_queue_write !== false) fail('Bridge must not write Retry Queue automatically.');
  if (Object.values(bridge.boundaries).some((value) => value !== false)) fail('Bridge side-effect boundary differs after retry activation.');
}

const proofDocs = readText('docs/calendar/banei-retry-execution-proof.md');
for (const phrase of ['due versus deferred', 'success removal', 'failure retention', 'attempt accounting', 'exponential backoff']) {
  if (!proofDocs.includes(phrase)) fail(`retry proof evidence contract missing ${phrase}.`);
}
const activationDocs = readText('docs/calendar/banei-retry-activation.md');
for (const phrase of [
  'supports_rank_upgrade_retry: true',
  'max selected meetings per Job: 2',
  'max attempt count: 3',
  'artifact-only',
  'regular refresh remains disabled',
  'coverage-gap planning remains disabled',
  'source revalidation remains disabled',
  'automatic execution remains disabled',
]) {
  if (!activationDocs.includes(phrase)) fail(`Banei retry activation contract missing ${phrase}.`);
}

const serialized = JSON.stringify({ profile, rule }).toLowerCase();
for (const forbidden of ['horse_name', 'jockey_name', 'trainer_name', 'odds', 'payout', 'prediction', 'raw_html', 'source_body', 'stream_url']) {
  if (serialized.includes(`"${forbidden}"`)) fail(`forbidden activation key present: ${forbidden}`);
}

if (errors.length) {
  console.error(`CALENDAR_BANEI_RETRY_ACTIVATION: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('CALENDAR_BANEI_RETRY_ACTIVATION: pass');
console.log('REGISTRY_RANK_RETRY: enabled');
console.log('DUE_POLICY_SYSTEM: enabled');
console.log('DUE_POLICY_RANK_RETRY: enabled');
console.log('BATCH_LIMIT: 2');
console.log('ATTEMPT_LIMIT: 3');
console.log('BANEI_DUE_RETRY_JOB: 1');
console.log('PROOF_REPRODUCIBILITY: pass');
console.log('BRIDGE_RETRY_STATE: enabled_evidence_backed');
console.log('SCHEDULER_EXECUTION: disabled');
