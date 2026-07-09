import crypto from 'node:crypto';
import { applyBaneiRetryResultV1 } from './banei-retry-execution-proof.mjs';
import { validateRankAwareRetryQueueV1, validateRetryEntryAgainstRegistryV1 } from './rank-aware-retry-queue-validation.mjs';
import { validateCollectionResultManifestV1 } from './collection-result-manifest-validation.mjs';
import { validateReviewQueueV1, validateReviewQueueEntryAgainstManifestV1 } from './review-queue-validation.mjs';

const PROPOSAL_SCHEMA_VERSION = 'calendar-banei-retry-queue-reconciliation-proposal-v1';

function canonicalJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function sha256Text(text) {
  return crypto.createHash('sha256').update(text, 'utf8').digest('hex');
}

function profileFor(registry, systemId) {
  return registry.records.find((entry) => entry.system_id === systemId) ?? null;
}

function validateQueueAgainstRegistry(queue, registry) {
  const errors = validateRankAwareRetryQueueV1(queue);
  if (errors.length) throw new Error(`Retry Queue invalid: ${errors.join('; ')}`);
  for (const entry of queue.entries) {
    const registryErrors = validateRetryEntryAgainstRegistryV1(entry, registry);
    if (registryErrors.length) throw new Error(`${entry.meeting_id}: ${registryErrors.join('; ')}`);
  }
}

function assertExecution(execution) {
  if (execution?.schema_version !== 'calendar-runner-execution-v1') throw new Error('execution schema mismatch');
  if (execution.system_id !== 'japan-banei-system') throw new Error('reconciliation requires japan-banei-system execution');
  if (execution.runner_used !== 'github_actions') throw new Error('reconciliation requires github_actions execution evidence');
  if (execution.executor_id !== 'banei-schedule-detail-actions') throw new Error('reconciliation executor differs');
  if (execution.collection_mode !== 'selected_meetings') throw new Error('reconciliation requires selected_meetings execution');
  if (execution.reason !== 'rank_upgrade_retry') throw new Error('reconciliation requires rank_upgrade_retry reason');
  if (execution.rank_strategy !== 'target_rank') throw new Error('reconciliation requires target_rank strategy');
  if (!Array.isArray(execution.requested_scope?.meeting_ids) || execution.requested_scope.meeting_ids.length === 0) {
    throw new Error('reconciliation execution selected meeting IDs missing');
  }
}

function assertArtifacts({ execution, candidate, manifest, reviewQueue }) {
  if (candidate?.schema_version !== 'timetable-candidate-v1') throw new Error('candidate schema mismatch');
  if (candidate.review?.status !== 'needs_review') throw new Error('candidate review status must remain needs_review');
  const manifestErrors = validateCollectionResultManifestV1(manifest);
  if (manifestErrors.length) throw new Error(`Result Manifest invalid: ${manifestErrors.join('; ')}`);
  if (manifest.system_id !== execution.system_id
    || manifest.job_id !== execution.job_id
    || manifest.batch_id !== execution.batch_id
    || manifest.runner_used !== execution.runner_used) {
    throw new Error('Manifest identity differs from execution');
  }
  const selectedIds = [...execution.requested_scope.meeting_ids].sort();
  const manifestIds = [...(manifest.requested_scope?.meeting_ids ?? [])].sort();
  if (JSON.stringify(selectedIds) !== JSON.stringify(manifestIds)) throw new Error('Manifest requested meeting IDs differ from execution');
  const candidateIds = candidate.records.map((record) => record.meeting_id).sort();
  if (JSON.stringify(candidateIds) !== JSON.stringify(selectedIds)) throw new Error('candidate meetings differ from execution scope');

  const reviewErrors = validateReviewQueueV1(reviewQueue);
  if (reviewErrors.length) throw new Error(`Review Queue invalid: ${reviewErrors.join('; ')}`);
  if (reviewQueue.entries.length !== 1) throw new Error('reconciliation requires exactly one Review Queue batch entry');
  const entryErrors = validateReviewQueueEntryAgainstManifestV1(reviewQueue.entries[0], manifest);
  if (entryErrors.length) throw new Error(`Review Queue/Manifest mismatch: ${entryErrors.join('; ')}`);
  if (reviewQueue.entries[0].review_state !== 'review_ready' || reviewQueue.entries[0].promotion_state !== 'not_ready') {
    throw new Error('reconciliation requires review_ready / not_ready batch state');
  }
}

export function buildBaneiRetryReconciliationProposalV1({
  queue,
  execution,
  candidate,
  manifest,
  review_queue: reviewQueue,
  registry,
  as_of: asOf,
  backoff_policy: backoffPolicy,
  source_queue_sha256: sourceQueueSha256 = null,
} = {}) {
  if (typeof asOf !== 'string' || Number.isNaN(Date.parse(asOf))) throw new Error('as_of must be a valid ISO date-time');
  if (!backoffPolicy || !Number.isInteger(backoffPolicy.base_hours) || backoffPolicy.base_hours < 1
    || !Number.isInteger(backoffPolicy.max_hours) || backoffPolicy.max_hours < backoffPolicy.base_hours) {
    throw new Error('backoff_policy invalid');
  }
  const profile = profileFor(registry, 'japan-banei-system');
  if (!profile) throw new Error('Banei Registry profile missing');
  if (profile.supports_rank_upgrade_retry !== true
    || profile.supports_selected_meetings !== true
    || profile.primary_runner !== 'github_actions'
    || profile.fallback_runner !== 'reviewed_import') {
    throw new Error('Banei Registry retry routing boundary differs');
  }

  validateQueueAgainstRegistry(queue, registry);
  assertExecution(execution);
  assertArtifacts({ execution, candidate, manifest, reviewQueue });

  const selected = new Set(execution.requested_scope.meeting_ids);
  const queuedSelected = queue.entries.filter((entry) => selected.has(entry.meeting_id));
  if (queuedSelected.length !== selected.size) throw new Error('selected execution includes meeting not present exactly once in Retry Queue');
  for (const entry of queuedSelected) {
    if (entry.system_id !== execution.system_id) throw new Error(`${entry.meeting_id}: Queue system differs from execution`);
    if (entry.retry_reason !== 'rank_upgrade_retry') throw new Error(`${entry.meeting_id}: Queue retry reason differs`);
    if (entry.adapter_id !== profile.detail_adapter_id) throw new Error(`${entry.meeting_id}: Queue adapter differs from Registry detail adapter`);
    if (entry.primary_runner !== profile.primary_runner || entry.fallback_runner !== profile.fallback_runner) {
      throw new Error(`${entry.meeting_id}: Queue runner routing differs from Registry`);
    }
  }

  const transition = applyBaneiRetryResultV1({
    queue,
    execution,
    artifacts: { candidate, result_manifest: manifest },
    registry,
    as_of: asOf,
    backoff_policy: backoffPolicy,
  });

  const beforeIds = new Set(queue.entries.map((entry) => entry.meeting_id));
  const afterIds = new Set(transition.updated_queue.entries.map((entry) => entry.meeting_id));
  for (const meetingId of transition.removed_successes) {
    if (!beforeIds.has(meetingId) || afterIds.has(meetingId)) throw new Error(`success removal did not close for ${meetingId}`);
  }
  for (const failure of transition.retained_failures) {
    if (!afterIds.has(failure.meeting_id)) throw new Error(`failed retry entry missing after reconciliation: ${failure.meeting_id}`);
  }

  const resolvedSourceQueueSha256 = sourceQueueSha256 ?? sha256Text(canonicalJson(queue));
  if (!/^[0-9a-f]{64}$/.test(resolvedSourceQueueSha256)) throw new Error('source_queue_sha256 must be a lowercase SHA-256 hex digest');
  const proposedQueueSha256 = sha256Text(canonicalJson(transition.updated_queue));

  return {
    schema_version: PROPOSAL_SCHEMA_VERSION,
    generated_at: asOf,
    mode: 'proposal_only',
    source_queue_generated_at: queue.generated_at,
    source_queue_sha256: resolvedSourceQueueSha256,
    proposed_queue_sha256: proposedQueueSha256,
    execution_identity: {
      campaign_id: execution.campaign_id,
      job_id: execution.job_id,
      batch_id: execution.batch_id,
      system_id: execution.system_id,
      runner_used: execution.runner_used,
      executor_id: execution.executor_id,
      selected_meeting_ids: [...execution.requested_scope.meeting_ids],
      target_rank: execution.target_rank,
    },
    result_summary: {
      coverage_claim: manifest.coverage_claim,
      records_discovered: manifest.records_discovered,
      records_updated: manifest.records_updated,
      rank_counts: structuredClone(manifest.rank_counts),
      unresolved_meeting_ids: structuredClone(manifest.unresolved_meeting_ids),
      source_error_count: manifest.source_errors.length,
      review_state: reviewQueue.entries[0].review_state,
      promotion_state: reviewQueue.entries[0].promotion_state,
    },
    transition_summary: {
      removed_successes: transition.removed_successes,
      retained_failures: transition.retained_failures,
      untouched_meetings: transition.untouched_meetings,
      before_entry_count: queue.entries.length,
      after_entry_count: transition.updated_queue.entries.length,
    },
    proposed_queue: transition.updated_queue,
    boundaries: {
      input_queue_write_performed: false,
      canonical_write_performed: false,
      automatic_approval: false,
      promotion_performed: false,
      public_write_performed: false,
      publication_performed: false,
      deployment_performed: false,
    },
  };
}

export const baneiRetryReconciliationV1Contract = Object.freeze({
  schema_version: PROPOSAL_SCHEMA_VERSION,
  mode: 'proposal_only',
  digest_algorithm: 'sha256',
});
