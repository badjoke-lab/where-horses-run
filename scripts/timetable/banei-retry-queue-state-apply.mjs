import crypto from 'node:crypto';
import { validateRankAwareRetryQueueV1, validateRetryEntryAgainstRegistryV1 } from './rank-aware-retry-queue-validation.mjs';

const APPLY_PLAN_SCHEMA = 'calendar-banei-retry-queue-state-apply-plan-v1';
const APPROVAL_SCHEMA = 'calendar-banei-retry-queue-apply-approval-v1';
const ROLLBACK_EVIDENCE_SCHEMA = 'calendar-banei-retry-queue-rollback-evidence-v1';
const ROLLBACK_PLAN_SCHEMA = 'calendar-banei-retry-queue-rollback-plan-v1';
const APPROVAL_KEYS = [
  'schema_version',
  'decision',
  'reviewed_by',
  'reviewed_at',
  'source_queue_sha256',
  'proposal_sha256',
  'proposed_queue_sha256',
];
const PROPOSAL_BOUNDARY_KEYS = [
  'input_queue_write_performed',
  'canonical_write_performed',
  'automatic_approval',
  'promotion_performed',
  'public_write_performed',
  'publication_performed',
  'deployment_performed',
];

export function canonicalJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

export function sha256Text(text) {
  return crypto.createHash('sha256').update(text, 'utf8').digest('hex');
}

function assertSha256(value, label) {
  if (typeof value !== 'string' || !/^[0-9a-f]{64}$/.test(value)) {
    throw new Error(`${label} must be a lowercase SHA-256 hex digest`);
  }
}

function assertExactKeys(value, expectedKeys, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label} must be an object`);
  const actual = Object.keys(value).sort();
  const expected = [...expectedKeys].sort();
  if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(`${label} keys differ`);
}

function parseJsonText(text, label) {
  if (typeof text !== 'string' || text.length === 0) throw new Error(`${label} text missing`);
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`${label} JSON invalid: ${error.message}`);
  }
}

function validateQueueAgainstRegistry(queue, registry, label) {
  const structural = validateRankAwareRetryQueueV1(queue);
  if (structural.length) throw new Error(`${label} invalid: ${structural.join('; ')}`);
  for (const entry of queue.entries) {
    const registryErrors = validateRetryEntryAgainstRegistryV1(entry, registry);
    if (registryErrors.length) throw new Error(`${label} ${entry.meeting_id}: ${registryErrors.join('; ')}`);
  }
}

function assertApproval(approval) {
  assertExactKeys(approval, APPROVAL_KEYS, 'approval');
  if (approval.schema_version !== APPROVAL_SCHEMA) throw new Error('approval schema mismatch');
  if (approval.decision !== 'approved') throw new Error('approval decision must be approved');
  if (typeof approval.reviewed_by !== 'string' || approval.reviewed_by.trim().length < 2) throw new Error('approval reviewed_by missing');
  if (typeof approval.reviewed_at !== 'string' || Number.isNaN(Date.parse(approval.reviewed_at))) throw new Error('approval reviewed_at invalid');
  assertSha256(approval.source_queue_sha256, 'approval source_queue_sha256');
  assertSha256(approval.proposal_sha256, 'approval proposal_sha256');
  assertSha256(approval.proposed_queue_sha256, 'approval proposed_queue_sha256');
}

function assertProposal(proposal) {
  if (proposal?.schema_version !== 'calendar-banei-retry-queue-reconciliation-proposal-v1') throw new Error('proposal schema mismatch');
  if (proposal.mode !== 'proposal_only') throw new Error('proposal mode must remain proposal_only');
  assertSha256(proposal.source_queue_sha256, 'proposal source_queue_sha256');
  assertSha256(proposal.proposed_queue_sha256, 'proposal proposed_queue_sha256');
  if (!proposal.proposed_queue || typeof proposal.proposed_queue !== 'object') throw new Error('proposal proposed_queue missing');
  if (!proposal.transition_summary || !Number.isInteger(proposal.transition_summary.before_entry_count)
    || !Number.isInteger(proposal.transition_summary.after_entry_count)) {
    throw new Error('proposal transition summary invalid');
  }
  assertExactKeys(proposal.boundaries, PROPOSAL_BOUNDARY_KEYS, 'proposal boundaries');
  for (const key of PROPOSAL_BOUNDARY_KEYS) {
    if (proposal.boundaries[key] !== false) throw new Error(`proposal boundary ${key} must remain false before apply`);
  }
}

export function prepareBaneiRetryQueueStateApplyV1({
  current_queue_text: currentQueueText,
  proposal_text: proposalText,
  approval,
  registry,
  queue_path: queuePath,
  applied_at: appliedAt,
} = {}) {
  if (typeof appliedAt !== 'string' || Number.isNaN(Date.parse(appliedAt))) throw new Error('applied_at must be a valid ISO date-time');
  if (typeof queuePath !== 'string' || !queuePath.trim()) throw new Error('queue_path missing');

  const currentQueue = parseJsonText(currentQueueText, 'current Queue');
  const proposal = parseJsonText(proposalText, 'proposal');
  assertProposal(proposal);
  assertApproval(approval);

  validateQueueAgainstRegistry(currentQueue, registry, 'current Queue');
  validateQueueAgainstRegistry(proposal.proposed_queue, registry, 'proposed Queue');

  const currentQueueSha256 = sha256Text(currentQueueText);
  const proposalSha256 = sha256Text(proposalText);
  const proposedQueueText = canonicalJson(proposal.proposed_queue);
  const proposedQueueSha256 = sha256Text(proposedQueueText);

  if (proposal.source_queue_sha256 !== currentQueueSha256) throw new Error('stale Queue guard failed: current Queue digest differs from proposal source digest');
  if (approval.source_queue_sha256 !== currentQueueSha256) throw new Error('stale Queue guard failed: approval source digest differs from current Queue');
  if (approval.proposal_sha256 !== proposalSha256) throw new Error('approval proposal digest differs from supplied proposal');
  if (proposal.proposed_queue_sha256 !== proposedQueueSha256) throw new Error('proposal target Queue digest differs from proposed Queue content');
  if (approval.proposed_queue_sha256 !== proposedQueueSha256) throw new Error('approval target Queue digest differs from proposed Queue content');
  if (proposal.source_queue_generated_at !== currentQueue.generated_at) throw new Error('proposal source Queue generation differs from current Queue');
  if (proposal.transition_summary.before_entry_count !== currentQueue.entries.length) throw new Error('proposal before Queue count differs from current Queue');
  if (proposal.transition_summary.after_entry_count !== proposal.proposed_queue.entries.length) throw new Error('proposal after Queue count differs from target Queue');

  const applyPlan = {
    schema_version: APPLY_PLAN_SCHEMA,
    mode: 'explicit_operator_apply',
    applied_at: appliedAt,
    queue_path: queuePath,
    source_queue_sha256: currentQueueSha256,
    proposal_sha256: proposalSha256,
    proposed_queue_sha256: proposedQueueSha256,
    approval: {
      decision: approval.decision,
      reviewed_by: approval.reviewed_by,
      reviewed_at: approval.reviewed_at,
    },
    transition_summary: structuredClone(proposal.transition_summary),
    boundaries: {
      explicit_operator_action_required: true,
      stale_write_guard_required: true,
      atomic_replacement_required: true,
      rollback_evidence_required: true,
      automatic_execution: false,
      automatic_approval: false,
      promotion_performed: false,
      public_write_performed: false,
      publication_performed: false,
      deployment_performed: false,
    },
  };

  const rollbackEvidence = {
    schema_version: ROLLBACK_EVIDENCE_SCHEMA,
    mode: 'prepared_before_apply',
    prepared_at: appliedAt,
    queue_path: queuePath,
    source_queue_sha256: currentQueueSha256,
    applied_target_queue_sha256: proposedQueueSha256,
    proposal_sha256: proposalSha256,
    approval_reviewed_by: approval.reviewed_by,
    approval_reviewed_at: approval.reviewed_at,
    restore_guard: {
      required_current_queue_sha256: proposedQueueSha256,
      restore_queue_sha256: currentQueueSha256,
    },
    boundaries: {
      automatic_rollback: false,
      public_write_performed: false,
      publication_performed: false,
      deployment_performed: false,
    },
  };

  return {
    apply_plan: applyPlan,
    current_queue: currentQueue,
    target_queue: proposal.proposed_queue,
    target_queue_text: proposedQueueText,
    rollback_evidence: rollbackEvidence,
  };
}

export function prepareBaneiRetryQueueRollbackV1({
  current_queue_text: currentQueueText,
  backup_queue_text: backupQueueText,
  rollback_evidence: rollbackEvidence,
  registry,
  rollback_at: rollbackAt,
} = {}) {
  if (typeof rollbackAt !== 'string' || Number.isNaN(Date.parse(rollbackAt))) throw new Error('rollback_at must be a valid ISO date-time');
  if (rollbackEvidence?.schema_version !== ROLLBACK_EVIDENCE_SCHEMA) throw new Error('rollback evidence schema mismatch');
  if (rollbackEvidence.mode !== 'prepared_before_apply') throw new Error('rollback evidence mode differs');

  const currentQueue = parseJsonText(currentQueueText, 'current Queue');
  const backupQueue = parseJsonText(backupQueueText, 'backup Queue');
  validateQueueAgainstRegistry(currentQueue, registry, 'current Queue');
  validateQueueAgainstRegistry(backupQueue, registry, 'backup Queue');

  const currentQueueSha256 = sha256Text(currentQueueText);
  const backupQueueSha256 = sha256Text(backupQueueText);
  const requiredCurrent = rollbackEvidence.restore_guard?.required_current_queue_sha256;
  const restoreSha = rollbackEvidence.restore_guard?.restore_queue_sha256;
  assertSha256(requiredCurrent, 'rollback required current digest');
  assertSha256(restoreSha, 'rollback restore digest');

  if (currentQueueSha256 !== requiredCurrent) throw new Error('rollback stale guard failed: current Queue is not the applied target');
  if (backupQueueSha256 !== restoreSha) throw new Error('rollback backup digest differs from evidence');
  if (rollbackEvidence.source_queue_sha256 !== backupQueueSha256) throw new Error('rollback evidence source digest differs from backup');
  if (rollbackEvidence.applied_target_queue_sha256 !== currentQueueSha256) throw new Error('rollback evidence target digest differs from current Queue');

  return {
    schema_version: ROLLBACK_PLAN_SCHEMA,
    mode: 'explicit_operator_rollback',
    rollback_at: rollbackAt,
    queue_path: rollbackEvidence.queue_path,
    current_queue_sha256: currentQueueSha256,
    restore_queue_sha256: backupQueueSha256,
    restore_queue_text: backupQueueText,
    boundaries: {
      explicit_operator_action_required: true,
      stale_write_guard_required: true,
      atomic_replacement_required: true,
      automatic_rollback: false,
      public_write_performed: false,
      publication_performed: false,
      deployment_performed: false,
    },
  };
}

export const baneiRetryQueueStateApplyV1Contract = Object.freeze({
  apply_plan_schema: APPLY_PLAN_SCHEMA,
  approval_schema: APPROVAL_SCHEMA,
  rollback_evidence_schema: ROLLBACK_EVIDENCE_SCHEMA,
  rollback_plan_schema: ROLLBACK_PLAN_SCHEMA,
  digest_algorithm: 'sha256',
  approval_keys: Object.freeze([...APPROVAL_KEYS]),
  proposal_boundary_keys: Object.freeze([...PROPOSAL_BOUNDARY_KEYS]),
});
