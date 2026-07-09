import { planDueJobsV1, validateDueJobPlanV1, validateDueJobPolicyV1 } from './due-job-planner.mjs';
import { compileRunnerExecutionV1 } from './runner-compatibility.mjs';
import { buildBaneiActionsArtifactsV1 } from './banei-actions-executor-core.mjs';
import {
  validateRankAwareRetryQueueV1,
  validateRetryEntryAgainstRegistryV1,
} from './rank-aware-retry-queue-validation.mjs';
import { validateCollectionResultManifestV1, validateCollectionResultManifestAgainstCoverageV1 } from './collection-result-manifest-validation.mjs';
import { validateReviewQueueV1, validateReviewQueueEntryAgainstManifestV1 } from './review-queue-validation.mjs';

const RANK_INDEX = new Map(['C', 'B', 'B+', 'A', 'A+'].map((rank, index) => [rank, index]));

function profileFor(registry, systemId) {
  return registry.records.find((record) => record.system_id === systemId) ?? null;
}

function ruleFor(policy, systemId) {
  return policy.system_rules.find((rule) => rule.system_id === systemId) ?? null;
}

function addHours(dateTime, hours) {
  return new Date(Date.parse(dateTime) + hours * 3600000).toISOString();
}

function reachesTarget(rank, target, profile) {
  const resolvedTarget = target === 'best_available' ? profile.technical_capability_rank : target;
  return RANK_INDEX.get(rank) >= RANK_INDEX.get(resolvedTarget);
}

export function buildBaneiRetryProofRegistryV1(registry) {
  const candidate = structuredClone(registry);
  const profile = profileFor(candidate, 'japan-banei-system');
  if (!profile) throw new Error('Banei Registry profile missing');
  if (profile.profile_status !== 'active'
    || profile.primary_runner !== 'github_actions'
    || profile.fallback_runner !== 'reviewed_import'
    || profile.supports_selected_meetings !== true
    || profile.supports_rank_upgrade_retry !== false) {
    throw new Error('canonical Banei Registry boundary differs before retry proof');
  }
  profile.supports_rank_upgrade_retry = true;
  profile.operator_notes = `${profile.operator_notes} Proof clone only: rank-upgrade retry enabled in memory for execution validation.`;
  return candidate;
}

export function buildBaneiRetryProofPolicyV1(policy, fixture) {
  const candidate = structuredClone(policy);
  const rule = ruleFor(candidate, 'japan-banei-system');
  if (!rule) throw new Error('Banei Due-job policy rule missing');
  if (rule.enabled !== false || rule.rank_retry.enabled !== false) {
    throw new Error('canonical Banei Due-job policy must remain disabled before retry proof');
  }
  rule.enabled = true;
  rule.regular_refresh.enabled = false;
  rule.coverage_gap.enabled = false;
  rule.source_revalidation.enabled = false;
  rule.rank_retry.enabled = true;
  rule.rank_retry.max_selected_meetings_per_job = fixture.candidate_policy.max_selected_meetings_per_job;
  rule.rank_retry.max_attempt_count = fixture.candidate_policy.max_attempt_count;
  return candidate;
}

function validateProofQueueAgainstRegistry(queue, registry) {
  const structural = validateRankAwareRetryQueueV1(queue);
  if (structural.length) throw new Error(`Banei proof Retry Queue invalid: ${structural.join('; ')}`);
  for (const entry of queue.entries) {
    const registryErrors = validateRetryEntryAgainstRegistryV1(entry, registry);
    if (registryErrors.length) throw new Error(`${entry.meeting_id}: ${registryErrors.join('; ')}`);
  }
}

function scenarioFor(executorFixture, mode) {
  const scenario = executorFixture.scenarios.find((entry) => entry.collection_mode === mode);
  if (!scenario) throw new Error(`Banei executor fixture scenario missing for ${mode}`);
  return structuredClone(scenario);
}

function normalizeScenarioForExecution(scenario, execution) {
  scenario.detail_report.batch_id = execution.batch_id;
  scenario.detail_report.generated_at = scenario.detail_candidate.generated_at;
  scenario.detail_coverage.run_id = execution.batch_id;
  return scenario;
}

export function applyBaneiRetryResultV1({ queue, execution, artifacts, registry, as_of: asOf, backoff_policy: backoffPolicy }) {
  const profile = profileFor(registry, execution.system_id);
  if (!profile) throw new Error('Banei proof Registry profile missing during result application');
  const selected = new Set(execution.requested_scope.meeting_ids);
  const unresolved = new Set(artifacts.result_manifest.unresolved_meeting_ids);
  const candidateByMeeting = new Map(artifacts.candidate.records.map((record) => [record.meeting_id, record]));
  const removedSuccesses = [];
  const retainedFailures = [];
  const untouched = [];
  const entries = [];

  for (const original of queue.entries) {
    if (!selected.has(original.meeting_id)) {
      entries.push(structuredClone(original));
      untouched.push(original.meeting_id);
      continue;
    }

    const observed = candidateByMeeting.get(original.meeting_id);
    if (!observed) throw new Error(`retry result candidate missing for ${original.meeting_id}`);
    if (!unresolved.has(original.meeting_id) && reachesTarget(observed.capability_rank, original.collection_target_rank, profile)) {
      removedSuccesses.push(original.meeting_id);
      continue;
    }

    const nextAttemptCount = original.attempt_count + 1;
    const backoffHours = Math.min(
      backoffPolicy.max_hours,
      backoffPolicy.base_hours * (2 ** original.attempt_count),
    );
    const updated = {
      ...structuredClone(original),
      latest_observed_rank: observed.capability_rank,
      next_eligible_retry_at: addHours(asOf, backoffHours),
      attempt_count: nextAttemptCount,
      last_attempt_at: asOf,
    };
    entries.push(updated);
    retainedFailures.push({
      meeting_id: updated.meeting_id,
      attempt_count: updated.attempt_count,
      last_attempt_at: updated.last_attempt_at,
      next_eligible_retry_at: updated.next_eligible_retry_at,
      observed_rank: updated.latest_observed_rank,
    });
  }

  const updatedQueue = {
    schema_version: queue.schema_version,
    generated_at: asOf,
    entries,
  };
  validateProofQueueAgainstRegistry(updatedQueue, registry);
  return {
    updated_queue: updatedQueue,
    removed_successes: removedSuccesses.sort(),
    retained_failures: retainedFailures.sort((left, right) => left.meeting_id.localeCompare(right.meeting_id)),
    untouched_meetings: untouched.sort(),
  };
}

export function buildBaneiRetryExecutionProofV1({
  fixture,
  canonical_registry: canonicalRegistry,
  canonical_policy: canonicalPolicy,
  compatibility_contract: compatibilityContract,
  executor_fixture: executorFixture,
}) {
  if (fixture?.schema_version !== 'calendar-banei-retry-execution-proof-fixture-v1') {
    throw new Error('Banei retry proof fixture schema mismatch');
  }
  const proofRegistry = buildBaneiRetryProofRegistryV1(canonicalRegistry);
  const proofPolicy = buildBaneiRetryProofPolicyV1(canonicalPolicy, fixture);
  validateProofQueueAgainstRegistry(fixture.planner_state.retry_queue, proofRegistry);

  const policyErrors = validateDueJobPolicyV1(proofPolicy, proofRegistry);
  if (policyErrors.length) throw new Error(`Banei proof candidate Due-job policy invalid: ${policyErrors.join('; ')}`);
  const plan = planDueJobsV1(proofPolicy, fixture.planner_state, proofRegistry);
  const planErrors = validateDueJobPlanV1(plan, proofPolicy, proofRegistry);
  if (planErrors.length) throw new Error(`Banei proof Due-job plan invalid: ${planErrors.join('; ')}`);

  const retryJobs = plan.collection_plan.jobs.filter((job) =>
    job.system_id === 'japan-banei-system' && job.reason === 'rank_upgrade_retry');
  if (retryJobs.length !== 1) throw new Error(`Banei proof expected one retry Job, got ${retryJobs.length}`);
  const retryJob = retryJobs[0];
  const execution = compileRunnerExecutionV1(retryJob, {
    batch_id: 'banei-retry-execution-proof-batch-001',
    requested_runner: 'github_actions',
  }, proofRegistry, compatibilityContract);

  const scenario = normalizeScenarioForExecution(scenarioFor(executorFixture, 'selected_meetings'), execution);
  const artifacts = buildBaneiActionsArtifactsV1({
    execution,
    schedule_input: executorFixture.schedule_input,
    detail_candidate: scenario.detail_candidate,
    detail_coverage: scenario.detail_coverage,
    detail_report: scenario.detail_report,
  });

  const manifestErrors = [
    ...validateCollectionResultManifestV1(artifacts.result_manifest),
    ...validateCollectionResultManifestAgainstCoverageV1(artifacts.result_manifest, artifacts.coverage_observation),
  ];
  if (manifestErrors.length) throw new Error(`Banei proof Manifest invalid: ${manifestErrors.join('; ')}`);
  const reviewErrors = validateReviewQueueV1(artifacts.review_queue);
  if (reviewErrors.length) throw new Error(`Banei proof Review Queue invalid: ${reviewErrors.join('; ')}`);
  const reviewEntryErrors = validateReviewQueueEntryAgainstManifestV1(artifacts.review_queue.entries[0], artifacts.result_manifest);
  if (reviewEntryErrors.length) throw new Error(`Banei proof Review Queue/Manifest mismatch: ${reviewEntryErrors.join('; ')}`);

  const resultApplication = applyBaneiRetryResultV1({
    queue: fixture.planner_state.retry_queue,
    execution,
    artifacts,
    registry: proofRegistry,
    as_of: fixture.as_of,
    backoff_policy: fixture.backoff_policy,
  });

  const canonicalProfile = profileFor(canonicalRegistry, 'japan-banei-system');
  const canonicalRule = ruleFor(canonicalPolicy, 'japan-banei-system');
  return {
    schema_version: 'calendar-banei-retry-execution-proof-v1',
    generated_at: fixture.as_of,
    system_id: 'japan-banei-system',
    canonical_boundaries: {
      registry_rank_retry_enabled: canonicalProfile.supports_rank_upgrade_retry,
      due_policy_system_enabled: canonicalRule.enabled,
      due_policy_rank_retry_enabled: canonicalRule.rank_retry.enabled,
    },
    proof_candidate: {
      registry_rank_retry_enabled: profileFor(proofRegistry, 'japan-banei-system').supports_rank_upgrade_retry,
      due_policy_system_enabled: ruleFor(proofPolicy, 'japan-banei-system').enabled,
      due_policy_rank_retry_enabled: ruleFor(proofPolicy, 'japan-banei-system').rank_retry.enabled,
      max_selected_meetings_per_job: ruleFor(proofPolicy, 'japan-banei-system').rank_retry.max_selected_meetings_per_job,
      max_attempt_count: ruleFor(proofPolicy, 'japan-banei-system').rank_retry.max_attempt_count,
    },
    due_plan: {
      plan_id: plan.plan_id,
      job_count: plan.collection_plan.jobs.length,
      retry_job: retryJob,
      deferred_meeting_ids: fixture.planner_state.retry_queue.entries
        .filter((entry) => entry.next_eligible_retry_at && Date.parse(entry.next_eligible_retry_at) > Date.parse(fixture.as_of))
        .map((entry) => entry.meeting_id)
        .sort(),
    },
    execution,
    result: {
      coverage_claim: artifacts.result_manifest.coverage_claim,
      records_discovered: artifacts.result_manifest.records_discovered,
      records_updated: artifacts.result_manifest.records_updated,
      rank_counts: structuredClone(artifacts.result_manifest.rank_counts),
      unresolved_meeting_ids: structuredClone(artifacts.result_manifest.unresolved_meeting_ids),
      source_error_count: artifacts.result_manifest.source_errors.length,
      review_state: artifacts.review_queue.entries[0].review_state,
      promotion_state: artifacts.review_queue.entries[0].promotion_state,
    },
    queue_transition: resultApplication,
    side_effect_boundaries: {
      canonical_registry_mutated: false,
      canonical_due_policy_mutated: false,
      automatic_approval: false,
      promotion_performed: false,
      canonical_write_performed: false,
      public_write_performed: false,
      publication_performed: false,
      deployment_performed: false,
    },
  };
}
