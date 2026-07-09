import fs from 'node:fs';
import path from 'node:path';
import { loadCalendarAcquisitionRegistryV1 } from './timetable/load-calendar-acquisition-registry.mjs';
import {
  applyBaneiRetryResultV1,
  buildBaneiRetryExecutionProofV1,
  buildBaneiRetryProofPolicyV1,
  buildBaneiRetryProofRegistryV1,
} from './timetable/banei-retry-execution-proof.mjs';
import { planDueJobsV1 } from './timetable/due-job-planner.mjs';
import { validateRankAwareRetryQueueV1, validateRetryEntryAgainstRegistryV1 } from './timetable/rank-aware-retry-queue-validation.mjs';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
const readText = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const exact = (left, right) => JSON.stringify(left) === JSON.stringify(right);

const fixture = readJson('data/fixtures/calendar-banei-retry-execution-proof-v1.json');
const registry = loadCalendarAcquisitionRegistryV1(root);
const policy = readJson('data/static/calendar-due-job-policy-v1.json');
const compatibility = readJson('data/static/calendar-runner-compatibility-contract-v1.json');
const executorFixture = readJson('data/fixtures/calendar-banei-actions-executor-fixture-v1.json');

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
    fixture,
    canonical_registry: historicalRegistry,
    canonical_policy: historicalPolicy,
    compatibility_contract: compatibility,
    executor_fixture: executorFixture,
  });
} catch (error) {
  fail(`Banei retry proof build failed: ${error.message}`);
}

if (proof) {
  if (proof.schema_version !== 'calendar-banei-retry-execution-proof-v1') fail('proof schema_version differs.');
  if (proof.system_id !== 'japan-banei-system') fail('proof system_id differs.');

  if (proof.canonical_boundaries.registry_rank_retry_enabled !== false) fail('canonical Registry retry support must remain false in proof PR.');
  if (proof.canonical_boundaries.due_policy_system_enabled !== false) fail('canonical Banei Due-job system policy must remain false in proof PR.');
  if (proof.canonical_boundaries.due_policy_rank_retry_enabled !== false) fail('canonical Banei Due-job retry policy must remain false in proof PR.');
  if (proof.proof_candidate.registry_rank_retry_enabled !== true) fail('proof Registry clone must enable retry support in memory.');
  if (proof.proof_candidate.due_policy_system_enabled !== true || proof.proof_candidate.due_policy_rank_retry_enabled !== true) fail('proof policy clone must enable Banei retry planning in memory.');
  if (proof.proof_candidate.max_selected_meetings_per_job !== 2 || proof.proof_candidate.max_attempt_count !== 3) fail('proof retry limits differ.');

  if (proof.due_plan.job_count !== fixture.expected.planned_job_count) fail(`proof planned job count differs: ${proof.due_plan.job_count}`);
  const retryJob = proof.due_plan.retry_job;
  if (retryJob.system_id !== 'japan-banei-system') fail('retry Job system differs.');
  if (retryJob.collection_mode !== 'selected_meetings') fail('retry Job must use selected_meetings.');
  if (retryJob.reason !== 'rank_upgrade_retry') fail('retry Job reason differs.');
  if (retryJob.rank_strategy !== 'target_rank' || retryJob.target_rank !== fixture.expected.planned_target_rank) fail('retry Job target strategy differs.');
  if (retryJob.runner_policy.mode !== 'registry_primary_or_fallback') fail('retry Job must preserve fallback eligibility.');
  if (!exact(retryJob.requested_scope.meeting_ids, fixture.expected.due_meeting_ids)) fail(`due retry meeting IDs differ: ${JSON.stringify(retryJob.requested_scope.meeting_ids)}`);
  if (!exact(proof.due_plan.deferred_meeting_ids, fixture.expected.deferred_meeting_ids)) fail(`deferred meeting IDs differ: ${JSON.stringify(proof.due_plan.deferred_meeting_ids)}`);

  if (proof.execution.runner_used !== 'github_actions') fail('retry execution runner differs.');
  if (proof.execution.executor_id !== 'banei-schedule-detail-actions') fail('retry execution executor differs.');
  if (proof.execution.collection_mode !== 'selected_meetings') fail('retry execution mode differs.');

  if (proof.result.coverage_claim !== 'partial') fail('retry proof result must be partial for success/failure isolation fixture.');
  if (proof.result.records_discovered !== 2 || proof.result.records_updated !== 1) fail('retry proof result record counts differ.');
  if (!exact(proof.result.rank_counts, { C: 0, B: 1, 'B+': 0, A: 0, 'A+': 1 })) fail(`retry proof rank counts differ: ${JSON.stringify(proof.result.rank_counts)}`);
  if (!exact(proof.result.unresolved_meeting_ids, [fixture.expected.failed_meeting_id])) fail(`retry proof unresolved IDs differ: ${JSON.stringify(proof.result.unresolved_meeting_ids)}`);
  if (proof.result.source_error_count !== 1) fail('retry proof source error count differs.');
  if (proof.result.review_state !== 'review_ready' || proof.result.promotion_state !== 'not_ready') fail('retry proof Review Queue state differs.');

  const transition = proof.queue_transition;
  if (!exact(transition.removed_successes, [fixture.expected.successful_meeting_id])) fail(`successful retry removal differs: ${JSON.stringify(transition.removed_successes)}`);
  if (transition.retained_failures.length !== 1 || transition.retained_failures[0].meeting_id !== fixture.expected.failed_meeting_id) fail('failed retry retention differs.');
  else {
    const failure = transition.retained_failures[0];
    if (failure.attempt_count !== 1) fail('failed retry attempt count must increment to 1.');
    if (failure.last_attempt_at !== fixture.as_of) fail('failed retry last_attempt_at differs.');
    if (failure.next_eligible_retry_at !== fixture.expected.failure_next_eligible_retry_at) fail(`failed retry backoff differs: ${failure.next_eligible_retry_at}`);
    if (failure.observed_rank !== 'B') fail('failed retry observed fallback rank differs.');
  }
  if (!exact(transition.untouched_meetings, fixture.expected.deferred_meeting_ids)) fail(`deferred entry mutation isolation differs: ${JSON.stringify(transition.untouched_meetings)}`);
  if (transition.updated_queue.entries.length !== fixture.expected.remaining_queue_count) fail(`remaining Retry Queue count differs: ${transition.updated_queue.entries.length}`);
  if (validateRankAwareRetryQueueV1(transition.updated_queue).length) fail('updated Retry Queue fails structural validation.');
  const deferred = transition.updated_queue.entries.find((entry) => entry.meeting_id === fixture.expected.deferred_meeting_ids[0]);
  const originalDeferred = fixture.planner_state.retry_queue.entries.find((entry) => entry.meeting_id === fixture.expected.deferred_meeting_ids[0]);
  if (!exact(deferred, originalDeferred)) fail('deferred Retry Queue entry must remain unchanged.');

  for (const [key, value] of Object.entries(proof.side_effect_boundaries)) {
    if (value !== false) fail(`proof side-effect boundary ${key} must be false.`);
  }
}

const proofRegistry = buildBaneiRetryProofRegistryV1(historicalRegistry);
const proofPolicy = buildBaneiRetryProofPolicyV1(historicalPolicy, fixture);
for (const entry of fixture.planner_state.retry_queue.entries) {
  const entryErrors = validateRetryEntryAgainstRegistryV1(entry, proofRegistry);
  if (entryErrors.length) fail(`${entry.meeting_id}: proof Registry cross-check failed: ${entryErrors.join('; ')}`);
}

const cappedState = structuredClone(fixture.planner_state);
cappedState.retry_queue.entries.find((entry) => entry.meeting_id === fixture.expected.failed_meeting_id).attempt_count = fixture.candidate_policy.max_attempt_count;
cappedState.retry_queue.entries.find((entry) => entry.meeting_id === fixture.expected.failed_meeting_id).last_attempt_at = '2026-07-09T05:00:00Z';
const cappedPlan = planDueJobsV1(proofPolicy, cappedState, proofRegistry);
const cappedRetry = cappedPlan.collection_plan.jobs.find((job) => job.reason === 'rank_upgrade_retry');
if (!cappedRetry) fail('attempt-cap proof must still plan the other eligible Banei retry meeting.');
else if (!exact(cappedRetry.requested_scope.meeting_ids, [fixture.expected.successful_meeting_id])) fail(`attempt-cap suppression differs: ${JSON.stringify(cappedRetry.requested_scope.meeting_ids)}`);

if (proof) {
  const secondFailureQueue = structuredClone(proof.queue_transition.updated_queue);
  const failedEntry = secondFailureQueue.entries.find((entry) => entry.meeting_id === fixture.expected.failed_meeting_id);
  failedEntry.next_eligible_retry_at = fixture.as_of;
  const secondExecution = structuredClone(proof.execution);
  secondExecution.requested_scope.meeting_ids = [fixture.expected.failed_meeting_id];
  const secondArtifacts = {
    candidate: {
      records: [{ meeting_id: fixture.expected.failed_meeting_id, capability_rank: 'B' }],
    },
    result_manifest: {
      unresolved_meeting_ids: [fixture.expected.failed_meeting_id],
    },
  };
  const second = applyBaneiRetryResultV1({
    queue: secondFailureQueue,
    execution: secondExecution,
    artifacts: secondArtifacts,
    registry: proofRegistry,
    as_of: '2026-07-09T12:00:00Z',
    backoff_policy: fixture.backoff_policy,
  });
  const retained = second.updated_queue.entries.find((entry) => entry.meeting_id === fixture.expected.failed_meeting_id);
  if (retained.attempt_count !== 2) fail('second failure attempt count must increment to 2.');
  if (retained.next_eligible_retry_at !== '2026-07-10T00:00:00.000Z') fail(`exponential second backoff differs: ${retained.next_eligible_retry_at}`);
}

const canonicalProfile = registry.records.find((record) => record.system_id === 'japan-banei-system');
const canonicalRule = policy.system_rules.find((rule) => rule.system_id === 'japan-banei-system');
if (canonicalProfile.supports_rank_upgrade_retry !== true) fail('canonical Registry retry activation is missing after proof-based activation.');
if (canonicalRule.enabled !== true || canonicalRule.rank_retry.enabled !== true) fail('canonical Banei rank-retry planning activation is missing.');
if (canonicalRule.regular_refresh.enabled !== false || canonicalRule.coverage_gap.enabled !== false || canonicalRule.source_revalidation.enabled !== false) fail('unrelated Banei Due-job automation must remain disabled.');

const docs = readText('docs/calendar/banei-retry-execution-proof.md');
for (const phrase of [
  'proof clone only',
  'due versus deferred',
  'selected-meeting Job',
  'success removal',
  'failure retention',
  'attempt accounting',
  'exponential backoff',
  'Result Manifest',
  'Review Queue',
  'canonical Registry remains disabled',
]) {
  if (!docs.includes(phrase)) fail(`Banei retry proof contract missing ${phrase}.`);
}

if (errors.length) {
  console.error(`CALENDAR_BANEI_RETRY_EXECUTION_PROOF: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('CALENDAR_BANEI_RETRY_EXECUTION_PROOF: pass');
console.log('DUE_RETRIES: 2');
console.log('DEFERRED_RETRIES: 1');
console.log('PLANNED_SELECTED_JOB: 1');
console.log('SUCCESS_REMOVAL: 1');
console.log('FAILURE_RETENTION: 1');
console.log('ATTEMPT_INCREMENT: pass');
console.log('BACKOFF_FIRST_FAILURE: 6h');
console.log('BACKOFF_SECOND_FAILURE: 12h');
console.log('MANIFEST_REVIEW_QUEUE: pass');
console.log('CANONICAL_ACTIVATION: retry-only enabled');
