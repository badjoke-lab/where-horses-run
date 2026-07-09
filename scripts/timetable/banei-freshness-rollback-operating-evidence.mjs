const EVIDENCE_SCHEMA = 'calendar-banei-freshness-rollback-operating-evidence-v1';

function validDateTime(value) {
  return typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Date.parse(value));
}

function assertDigest(value, label) {
  if (typeof value !== 'string' || !/^[0-9a-f]{64}$/.test(value)) throw new Error(`${label} must be a lowercase SHA-256 digest`);
}

function rowFor(view, systemId) {
  return view?.systems?.find((row) => row.system_id === systemId) ?? null;
}

function assertReadOnlyOperations(view, label) {
  if (view?.schema_version !== 'calendar-operations-v2') throw new Error(`${label} Operations v2 schema differs`);
  if (view.mode !== 'read_only_control_plane_view') throw new Error(`${label} Operations v2 mode differs`);
  if (Object.values(view.boundaries ?? {}).some((value) => value !== false)) throw new Error(`${label} Operations v2 boundary enabled`);
}

export function buildBaneiFreshnessRollbackOperatingEvidenceV1({
  fixture,
  ops_evidence: opsEvidence,
  current_operations: currentOperations,
  threshold_operations: thresholdOperations,
  rollback_rehearsal: rollbackRehearsal,
} = {}) {
  if (fixture?.schema_version !== 'calendar-banei-freshness-rollback-operating-evidence-fixture-v1') throw new Error('fixture schema differs');
  if (fixture.work_id !== 'WHR-CAL-JAPAN-BANEI-A-PLUS') throw new Error('fixture Work ID differs');
  if (!Number.isInteger(fixture.freshness_threshold_hours) || fixture.freshness_threshold_hours < 1) throw new Error('freshness threshold invalid');
  if (opsEvidence?.schema_version !== 'calendar-banei-retry-ops-evidence-v1') throw new Error('Banei retry ops evidence schema differs');
  if (opsEvidence.system_id !== 'japan-banei-system') throw new Error('Banei retry ops evidence system differs');
  if (opsEvidence.status !== 'success') throw new Error('freshness origin requires successful reviewed Banei Job evidence');
  if (opsEvidence.coverage?.claim !== 'source_window_complete') throw new Error('freshness origin coverage is incomplete');
  if (opsEvidence.coverage?.unresolved_meeting_count !== 0 || opsEvidence.coverage?.source_error_count !== 0) throw new Error('freshness origin contains unresolved/error state');
  if (!validDateTime(opsEvidence.generated_at)) throw new Error('freshness origin generated_at invalid');
  for (const [key, digest] of Object.entries(opsEvidence.artifact_digests_sha256 ?? {})) assertDigest(digest, `ops evidence digest ${key}`);

  assertReadOnlyOperations(currentOperations, 'current');
  assertReadOnlyOperations(thresholdOperations, 'threshold');
  const currentRow = rowFor(currentOperations, 'japan-banei-system');
  const thresholdRow = rowFor(thresholdOperations, 'japan-banei-system');
  if (!currentRow || !thresholdRow) throw new Error('Banei Operations v2 row missing');

  const currentExpected = fixture.current_scenario;
  const thresholdExpected = fixture.threshold_breach_scenario;
  if (currentOperations.generated_at !== currentExpected.as_of) throw new Error('current scenario as-of differs');
  if (thresholdOperations.generated_at !== thresholdExpected.as_of) throw new Error('threshold scenario as-of differs');
  if (currentRow.source_health !== currentExpected.expected_source_health) throw new Error('current source health differs');
  if (currentRow.freshness_age_hours !== currentExpected.expected_freshness_age_hours) throw new Error('current freshness age differs');
  if (currentRow.operator_attention.includes('freshness') !== currentExpected.expected_freshness_attention) throw new Error('current freshness attention differs');
  if (currentRow.job_counts.success !== currentExpected.expected_success_job_count) throw new Error('current successful Banei Job count differs');
  if (thresholdRow.source_health !== thresholdExpected.expected_source_health) throw new Error('threshold source health differs');
  if (thresholdRow.freshness_age_hours !== thresholdExpected.expected_freshness_age_hours) throw new Error('threshold freshness age differs');
  if (thresholdRow.operator_attention.includes('freshness') !== thresholdExpected.expected_freshness_attention) throw new Error('threshold freshness attention differs');
  if (currentRow.source_health !== thresholdRow.source_health) throw new Error('source health changed across freshness-only scenario');

  const expectedRollback = fixture.rollback_rehearsal;
  for (const key of ['source_queue_sha256', 'proposal_sha256', 'applied_target_queue_sha256']) {
    assertDigest(rollbackRehearsal?.[key], `rollback rehearsal ${key}`);
  }
  if (rollbackRehearsal.apply_at !== expectedRollback.apply_at || rollbackRehearsal.rollback_at !== expectedRollback.rollback_at) throw new Error('rollback rehearsal time differs');
  if (rollbackRehearsal.before_entry_count !== expectedRollback.expected_before_entry_count
    || rollbackRehearsal.after_entry_count !== expectedRollback.expected_after_entry_count) throw new Error('rollback rehearsal Queue counts differ');
  if (rollbackRehearsal.apply_mode !== expectedRollback.expected_apply_mode) throw new Error('rollback rehearsal apply mode differs');
  if (rollbackRehearsal.rollback_mode !== expectedRollback.expected_rollback_mode) throw new Error('rollback rehearsal rollback mode differs');
  if (rollbackRehearsal.restored_byte_equal !== expectedRollback.expected_restored_byte_equal) throw new Error('rollback byte restore evidence differs');
  if (rollbackRehearsal.stale_apply_rejected !== expectedRollback.expected_stale_apply_rejected) throw new Error('stale apply rejection evidence differs');
  if (rollbackRehearsal.stale_rollback_rejected !== expectedRollback.expected_stale_rollback_rejected) throw new Error('stale rollback rejection evidence differs');
  if (rollbackRehearsal.cli_contract_check_passed !== true) throw new Error('state apply CLI contract dependency not proven');

  return {
    schema_version: EVIDENCE_SCHEMA,
    generated_at: currentExpected.as_of,
    work_id: fixture.work_id,
    source_evidence_ref: fixture.source_evidence_ref,
    successful_collection_origin: {
      job_id: opsEvidence.job_id,
      batch_id: opsEvidence.batch_id,
      system_id: opsEvidence.system_id,
      runner_used: opsEvidence.runner_used,
      status: opsEvidence.status,
      observed_rank: opsEvidence.observed_rank,
      coverage_claim: opsEvidence.coverage.claim,
      last_successful_collection_at: opsEvidence.generated_at,
      artifact_digests_sha256: structuredClone(opsEvidence.artifact_digests_sha256),
    },
    freshness_policy: {
      threshold_hours: fixture.freshness_threshold_hours,
      source_health_and_freshness_separate: true,
    },
    current_freshness: {
      as_of: currentOperations.generated_at,
      source_health: currentRow.source_health,
      freshness_age_hours: currentRow.freshness_age_hours,
      freshness_attention: currentRow.operator_attention.includes('freshness'),
      operator_attention: structuredClone(currentRow.operator_attention),
      success_job_count: currentRow.job_counts.success,
    },
    threshold_breach: {
      as_of: thresholdOperations.generated_at,
      source_health: thresholdRow.source_health,
      freshness_age_hours: thresholdRow.freshness_age_hours,
      freshness_attention: thresholdRow.operator_attention.includes('freshness'),
      operator_attention: structuredClone(thresholdRow.operator_attention),
    },
    rollback_rehearsal: structuredClone(rollbackRehearsal),
    boundaries: {
      network_fetch_performed: false,
      scheduler_execution_performed: false,
      automatic_queue_apply_performed: false,
      automatic_rollback_performed: false,
      approval_performed: false,
      promotion_performed: false,
      canonical_write_performed: false,
      public_write_performed: false,
      publication_performed: false,
      deployment_performed: false,
    },
  };
}

export const baneiFreshnessRollbackOperatingEvidenceV1Contract = Object.freeze({
  schema_version: EVIDENCE_SCHEMA,
  system_id: 'japan-banei-system',
  source_health_and_freshness_separate: true,
});
