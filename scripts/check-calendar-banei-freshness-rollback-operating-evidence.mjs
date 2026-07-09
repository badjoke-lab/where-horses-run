import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { loadCalendarAcquisitionRegistryV1 } from './timetable/load-calendar-acquisition-registry.mjs';
import { planDueJobsV1 } from './timetable/due-job-planner.mjs';
import { planReviewCohortsV1 } from './timetable/review-cohort-planner.mjs';
import { buildOperationsV2V1 } from './timetable/operations-v2.mjs';
import { buildBaneiRetryExecutionProofV1 } from './timetable/banei-retry-execution-proof.mjs';
import { buildBaneiActionsArtifactsV1 } from './timetable/banei-actions-executor-core.mjs';
import { buildBaneiRetryReconciliationProposalV1 } from './timetable/banei-retry-reconciliation.mjs';
import {
  canonicalJson,
  prepareBaneiRetryQueueRollbackV1,
  prepareBaneiRetryQueueStateApplyV1,
  sha256Text,
} from './timetable/banei-retry-queue-state-apply.mjs';
import {
  baneiFreshnessRollbackOperatingEvidenceV1Contract,
  buildBaneiFreshnessRollbackOperatingEvidenceV1,
} from './timetable/banei-freshness-rollback-operating-evidence.mjs';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
const readText = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const exact = (left, right) => JSON.stringify(left) === JSON.stringify(right);

const fixture = readJson('data/fixtures/calendar-banei-freshness-rollback-operating-evidence-v1.json');
const opsEvidence = readJson('data/fixtures/calendar-banei-retry-ops-evidence-v1.json');
const operationsFixtures = readJson('data/fixtures/calendar-operations-v2-fixtures-v1.json');
const duePolicy = readJson('data/static/calendar-due-job-policy-v1.json');
const dueFixtures = readJson('data/fixtures/calendar-due-job-planner-fixtures-v1.json');
const reviewFixtures = readJson('data/fixtures/calendar-review-cohort-planner-fixtures-v1.json');
const proofFixture = readJson('data/fixtures/calendar-banei-retry-execution-proof-v1.json');
const compatibility = readJson('data/static/calendar-runner-compatibility-contract-v1.json');
const executorFixture = readJson('data/fixtures/calendar-banei-actions-executor-fixture-v1.json');
const registry = loadCalendarAcquisitionRegistryV1(root);

if (baneiFreshnessRollbackOperatingEvidenceV1Contract.schema_version !== 'calendar-banei-freshness-rollback-operating-evidence-v1') fail('operating evidence schema contract differs.');
if (baneiFreshnessRollbackOperatingEvidenceV1Contract.system_id !== 'japan-banei-system') fail('operating evidence system contract differs.');
if (baneiFreshnessRollbackOperatingEvidenceV1Contract.source_health_and_freshness_separate !== true) fail('freshness separation contract differs.');

let duePlan = null;
let cohortPlan = null;
try {
  duePlan = planDueJobsV1(duePolicy, dueFixtures.state, registry);
  cohortPlan = planReviewCohortsV1(reviewFixtures.queue, registry);
} catch (error) {
  fail(`shared operations planning failed: ${error.message}`);
}

function sourceStatesFromSuccessfulEvidence() {
  const states = structuredClone(operationsFixtures.source_states);
  const banei = states.find((state) => state.system_id === 'japan-banei-system');
  banei.source_health = 'healthy';
  banei.last_successful_collection_at = opsEvidence.generated_at;
  banei.freshness_threshold_hours = fixture.freshness_threshold_hours;
  return states;
}

function runtimeStatusesWithSuccessfulEvidence() {
  const statuses = structuredClone(operationsFixtures.runtime_statuses);
  statuses.push({
    job_id: opsEvidence.job_id,
    campaign_id: opsEvidence.campaign_id,
    system_id: opsEvidence.system_id,
    status: opsEvidence.status,
    updated_at: opsEvidence.generated_at,
  });
  return statuses;
}

function buildOperationsAt(asOf) {
  return buildOperationsV2V1({
    generated_at: asOf,
    operations_v1_ref: 'data/generated/timetable/operations-status.json',
    due_plan: duePlan,
    due_policy: duePolicy,
    runtime_statuses: runtimeStatusesWithSuccessfulEvidence(),
    review_queue: reviewFixtures.queue,
    retry_queue: dueFixtures.state.retry_queue,
    review_cohort_plan: cohortPlan,
    registry,
    source_states: sourceStatesFromSuccessfulEvidence(),
    publication_snapshot: operationsFixtures.publication_snapshot,
  });
}

let currentOperations = null;
let thresholdOperations = null;
if (duePlan && cohortPlan) {
  try {
    currentOperations = buildOperationsAt(fixture.current_scenario.as_of);
    thresholdOperations = buildOperationsAt(fixture.threshold_breach_scenario.as_of);
  } catch (error) {
    fail(`Banei freshness Operations v2 build failed: ${error.message}`);
  }
}

if (currentOperations && thresholdOperations) {
  const current = currentOperations.systems.find((row) => row.system_id === 'japan-banei-system');
  const threshold = thresholdOperations.systems.find((row) => row.system_id === 'japan-banei-system');
  if (!current || !threshold) fail('Banei Operations v2 row missing.');
  else {
    if (current.source_health !== 'healthy' || current.freshness_age_hours !== 1) fail(`current Banei freshness differs: ${JSON.stringify(current)}`);
    if (current.operator_attention.includes('freshness')) fail('current Banei state unexpectedly has freshness attention.');
    if (current.job_counts.success !== 1) fail(`current Banei success count differs: ${current.job_counts.success}`);
    if (threshold.source_health !== 'healthy' || threshold.freshness_age_hours !== 168) fail(`threshold Banei freshness differs: ${JSON.stringify(threshold)}`);
    if (!threshold.operator_attention.includes('freshness')) fail('threshold Banei state must have freshness attention.');
    if (current.source_health !== threshold.source_health) fail('source health changed across freshness-only scenario.');
  }
}

const historicalRegistry = structuredClone(registry);
historicalRegistry.records.find((entry) => entry.system_id === 'japan-banei-system').supports_rank_upgrade_retry = false;
const historicalPolicy = structuredClone(duePolicy);
const historicalRule = historicalPolicy.system_rules.find((entry) => entry.system_id === 'japan-banei-system');
historicalRule.enabled = false;
historicalRule.rank_retry.enabled = false;
historicalRule.rank_retry.max_selected_meetings_per_job = 0;
historicalRule.rank_retry.max_attempt_count = 0;

let proof = null;
let artifacts = null;
let proposal = null;
let proposalText = null;
let approval = null;
let applyPrepared = null;
let rollbackPrepared = null;
let staleApplyRejected = false;
let staleRollbackRejected = false;

try {
  proof = buildBaneiRetryExecutionProofV1({
    fixture: proofFixture,
    canonical_registry: historicalRegistry,
    canonical_policy: historicalPolicy,
    compatibility_contract: compatibility,
    executor_fixture: executorFixture,
  });
  const scenario = structuredClone(executorFixture.scenarios.find((entry) => entry.collection_mode === 'selected_meetings'));
  scenario.detail_report.batch_id = proof.execution.batch_id;
  scenario.detail_coverage.run_id = proof.execution.batch_id;
  artifacts = buildBaneiActionsArtifactsV1({
    execution: proof.execution,
    schedule_input: executorFixture.schedule_input,
    detail_candidate: scenario.detail_candidate,
    detail_coverage: scenario.detail_coverage,
    detail_report: scenario.detail_report,
  });

  const sourceQueueText = canonicalJson(proofFixture.planner_state.retry_queue);
  const sourceQueueSha256 = sha256Text(sourceQueueText);
  proposal = buildBaneiRetryReconciliationProposalV1({
    queue: proofFixture.planner_state.retry_queue,
    execution: proof.execution,
    candidate: artifacts.candidate,
    manifest: artifacts.result_manifest,
    review_queue: artifacts.review_queue,
    registry,
    as_of: proofFixture.as_of,
    backoff_policy: proofFixture.backoff_policy,
    source_queue_sha256: sourceQueueSha256,
  });
  proposalText = canonicalJson(proposal);
  approval = {
    schema_version: 'calendar-banei-retry-queue-apply-approval-v1',
    decision: 'approved',
    reviewed_by: 'calendar-operating-evidence-fixture',
    reviewed_at: fixture.rollback_rehearsal.apply_at,
    source_queue_sha256: sourceQueueSha256,
    proposal_sha256: sha256Text(proposalText),
    proposed_queue_sha256: proposal.proposed_queue_sha256,
  };

  applyPrepared = prepareBaneiRetryQueueStateApplyV1({
    current_queue_text: sourceQueueText,
    proposal_text: proposalText,
    approval,
    registry,
    queue_path: 'fixture/banei-retry-queue.json',
    applied_at: fixture.rollback_rehearsal.apply_at,
  });

  try {
    prepareBaneiRetryQueueStateApplyV1({
      current_queue_text: applyPrepared.target_queue_text,
      proposal_text: proposalText,
      approval,
      registry,
      queue_path: 'fixture/banei-retry-queue.json',
      applied_at: fixture.rollback_rehearsal.apply_at,
    });
  } catch {
    staleApplyRejected = true;
  }

  rollbackPrepared = prepareBaneiRetryQueueRollbackV1({
    current_queue_text: applyPrepared.target_queue_text,
    backup_queue_text: sourceQueueText,
    rollback_evidence: applyPrepared.rollback_evidence,
    registry,
    rollback_at: fixture.rollback_rehearsal.rollback_at,
  });

  const driftedTarget = structuredClone(applyPrepared.target_queue);
  driftedTarget.generated_at = '2026-07-09T15:59:59Z';
  try {
    prepareBaneiRetryQueueRollbackV1({
      current_queue_text: canonicalJson(driftedTarget),
      backup_queue_text: sourceQueueText,
      rollback_evidence: applyPrepared.rollback_evidence,
      registry,
      rollback_at: fixture.rollback_rehearsal.rollback_at,
    });
  } catch {
    staleRollbackRejected = true;
  }
} catch (error) {
  fail(`rollback rehearsal preparation failed: ${error.message}`);
}

const cliContract = spawnSync(process.execPath, ['scripts/check-calendar-banei-retry-queue-state-apply.mjs'], {
  cwd: root,
  encoding: 'utf8',
  maxBuffer: 20 * 1024 * 1024,
});
const cliContractCheckPassed = cliContract.status === 0;
if (!cliContractCheckPassed) fail(`state apply CLI contract dependency failed: ${cliContract.stderr || cliContract.stdout}`);

let rollbackRehearsal = null;
if (applyPrepared && rollbackPrepared && proposalText) {
  rollbackRehearsal = {
    apply_at: fixture.rollback_rehearsal.apply_at,
    rollback_at: fixture.rollback_rehearsal.rollback_at,
    source_queue_sha256: applyPrepared.apply_plan.source_queue_sha256,
    proposal_sha256: applyPrepared.apply_plan.proposal_sha256,
    applied_target_queue_sha256: applyPrepared.apply_plan.proposed_queue_sha256,
    before_entry_count: applyPrepared.apply_plan.transition_summary.before_entry_count,
    after_entry_count: applyPrepared.apply_plan.transition_summary.after_entry_count,
    apply_mode: applyPrepared.apply_plan.mode,
    rollback_mode: rollbackPrepared.mode,
    restored_byte_equal: rollbackPrepared.restore_queue_text === canonicalJson(proofFixture.planner_state.retry_queue),
    stale_apply_rejected: staleApplyRejected,
    stale_rollback_rejected: staleRollbackRejected,
    cli_contract_check_passed: cliContractCheckPassed,
  };
}

let evidence = null;
if (currentOperations && thresholdOperations && rollbackRehearsal) {
  try {
    evidence = buildBaneiFreshnessRollbackOperatingEvidenceV1({
      fixture,
      ops_evidence: opsEvidence,
      current_operations: currentOperations,
      threshold_operations: thresholdOperations,
      rollback_rehearsal: rollbackRehearsal,
    });
  } catch (error) {
    fail(`operating evidence build failed: ${error.message}`);
  }
}

if (evidence) {
  if (evidence.schema_version !== 'calendar-banei-freshness-rollback-operating-evidence-v1') fail('evidence schema differs.');
  if (evidence.successful_collection_origin.job_id !== opsEvidence.job_id) fail('successful collection origin Job differs.');
  if (evidence.successful_collection_origin.last_successful_collection_at !== opsEvidence.generated_at) fail('successful collection freshness origin differs.');
  if (!exact(evidence.successful_collection_origin.artifact_digests_sha256, opsEvidence.artifact_digests_sha256)) fail('successful evidence digests differ.');
  if (evidence.current_freshness.freshness_age_hours !== 1 || evidence.current_freshness.freshness_attention !== false) fail('current freshness evidence differs.');
  if (evidence.threshold_breach.freshness_age_hours !== 168 || evidence.threshold_breach.freshness_attention !== true) fail('threshold breach evidence differs.');
  if (evidence.current_freshness.source_health !== 'healthy' || evidence.threshold_breach.source_health !== 'healthy') fail('freshness evidence must preserve healthy source state.');
  if (evidence.rollback_rehearsal.restored_byte_equal !== true) fail('rollback byte restoration evidence differs.');
  if (evidence.rollback_rehearsal.stale_apply_rejected !== true || evidence.rollback_rehearsal.stale_rollback_rejected !== true) fail('rollback stale guard evidence differs.');
  if (Object.values(evidence.boundaries).some((value) => value !== false)) fail('operating evidence side-effect boundary enabled.');

  const serialized = JSON.stringify(evidence).toLowerCase();
  for (const forbidden of ['horse_name', 'jockey_name', 'trainer_name', 'odds', 'payout', 'prediction', 'raw_html', 'source_body', 'stream_url']) {
    if (serialized.includes(`"${forbidden}"`)) fail(`forbidden operating evidence key present: ${forbidden}`);
  }
}

const docs = readText('docs/calendar/banei-freshness-rollback-operating-evidence.md');
for (const phrase of [
  'successful reviewed Banei Job evidence',
  'freshness age 1 hour',
  '168-hour threshold breach',
  'source health remains healthy',
  'Source health and freshness are separate signals',
  'rollback rehearsal',
  'byte-for-byte restore',
  'stale apply rejection',
  'stale rollback rejection',
  'no automatic Queue mutation',
]) {
  if (!docs.includes(phrase)) fail(`operating evidence contract missing ${phrase}.`);
}

if (errors.length) {
  console.error(`CALENDAR_BANEI_FRESHNESS_ROLLBACK_OPERATING_EVIDENCE: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('CALENDAR_BANEI_FRESHNESS_ROLLBACK_OPERATING_EVIDENCE: pass');
console.log(`SOURCE_EVIDENCE_JOB: ${opsEvidence.job_id}`);
console.log('CURRENT_FRESHNESS_AGE_HOURS: 1');
console.log('CURRENT_FRESHNESS_ATTENTION: false');
console.log('THRESHOLD_BREACH_AGE_HOURS: 168');
console.log('THRESHOLD_FRESHNESS_ATTENTION: true');
console.log('SOURCE_HEALTH_ACROSS_SCENARIOS: healthy');
console.log('ROLLBACK_BYTE_RESTORE: pass');
console.log('STALE_APPLY_REJECTION: pass');
console.log('STALE_ROLLBACK_REJECTION: pass');
console.log('AUTOMATIC_QUEUE_MUTATION: false');
