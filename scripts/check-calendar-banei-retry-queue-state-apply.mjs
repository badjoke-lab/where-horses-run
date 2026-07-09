import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { loadCalendarAcquisitionRegistryV1 } from './timetable/load-calendar-acquisition-registry.mjs';
import { buildBaneiRetryExecutionProofV1 } from './timetable/banei-retry-execution-proof.mjs';
import { buildBaneiActionsArtifactsV1 } from './timetable/banei-actions-executor-core.mjs';
import { buildBaneiRetryReconciliationProposalV1 } from './timetable/banei-retry-reconciliation.mjs';
import {
  baneiRetryQueueStateApplyV1Contract,
  canonicalJson,
  prepareBaneiRetryQueueRollbackV1,
  prepareBaneiRetryQueueStateApplyV1,
  sha256Text,
} from './timetable/banei-retry-queue-state-apply.mjs';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
const readText = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const exact = (left, right) => JSON.stringify(left) === JSON.stringify(right);

const proofFixture = readJson('data/fixtures/calendar-banei-retry-execution-proof-v1.json');
const registry = loadCalendarAcquisitionRegistryV1(root);
const policy = readJson('data/static/calendar-due-job-policy-v1.json');
const compatibility = readJson('data/static/calendar-runner-compatibility-contract-v1.json');
const executorFixture = readJson('data/fixtures/calendar-banei-actions-executor-fixture-v1.json');
const approvalSchema = readJson('data/static/calendar-banei-retry-queue-apply-approval.schema.json');

if (approvalSchema.$schema !== 'https://json-schema.org/draft/2020-12/schema') fail('approval schema draft differs.');
if (approvalSchema.type !== 'object' || approvalSchema.additionalProperties !== false) fail('approval schema must be closed.');
if (approvalSchema.properties?.schema_version?.const !== 'calendar-banei-retry-queue-apply-approval-v1') fail('approval schema version differs.');
if (approvalSchema.properties?.decision?.const !== 'approved') fail('approval decision must be closed to approved.');
for (const digestKey of ['source_queue_sha256', 'proposal_sha256', 'proposed_queue_sha256']) {
  if (approvalSchema.properties?.[digestKey]?.pattern !== '^[0-9a-f]{64}$') fail(`approval digest pattern differs for ${digestKey}.`);
}

if (baneiRetryQueueStateApplyV1Contract.apply_plan_schema !== 'calendar-banei-retry-queue-state-apply-plan-v1') fail('apply plan schema contract differs.');
if (baneiRetryQueueStateApplyV1Contract.approval_schema !== 'calendar-banei-retry-queue-apply-approval-v1') fail('approval schema contract differs.');
if (baneiRetryQueueStateApplyV1Contract.rollback_evidence_schema !== 'calendar-banei-retry-queue-rollback-evidence-v1') fail('rollback evidence schema contract differs.');
if (baneiRetryQueueStateApplyV1Contract.rollback_plan_schema !== 'calendar-banei-retry-queue-rollback-plan-v1') fail('rollback plan schema contract differs.');
if (baneiRetryQueueStateApplyV1Contract.digest_algorithm !== 'sha256') fail('digest algorithm contract differs.');

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
  fail(`proof reconstruction failed: ${error.message}`);
}

let artifacts = null;
if (proof) {
  const scenario = structuredClone(executorFixture.scenarios.find((entry) => entry.collection_mode === 'selected_meetings'));
  scenario.detail_report.batch_id = proof.execution.batch_id;
  scenario.detail_coverage.run_id = proof.execution.batch_id;
  try {
    artifacts = buildBaneiActionsArtifactsV1({
      execution: proof.execution,
      schedule_input: executorFixture.schedule_input,
      detail_candidate: scenario.detail_candidate,
      detail_coverage: scenario.detail_coverage,
      detail_report: scenario.detail_report,
    });
  } catch (error) {
    fail(`Banei executor reconstruction failed: ${error.message}`);
  }
}

const sourceQueueText = canonicalJson(proofFixture.planner_state.retry_queue);
const sourceQueueSha256 = sha256Text(sourceQueueText);
let proposal = null;
let proposalText = null;
let approval = null;

if (proof && artifacts) {
  try {
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
      reviewed_by: 'calendar-operator-fixture',
      reviewed_at: proofFixture.as_of,
      source_queue_sha256: sourceQueueSha256,
      proposal_sha256: sha256Text(proposalText),
      proposed_queue_sha256: proposal.proposed_queue_sha256,
    };
  } catch (error) {
    fail(`proposal/approval preparation failed: ${error.message}`);
  }
}

let prepared = null;
if (proposal && approval) {
  try {
    prepared = prepareBaneiRetryQueueStateApplyV1({
      current_queue_text: sourceQueueText,
      proposal_text: proposalText,
      approval,
      registry,
      queue_path: 'fixture/retry-queue.json',
      applied_at: '2026-07-09T15:00:00Z',
    });
  } catch (error) {
    fail(`state apply preparation failed: ${error.message}`);
  }
}

if (prepared) {
  if (prepared.apply_plan.mode !== 'explicit_operator_apply') fail('apply mode differs.');
  if (prepared.apply_plan.source_queue_sha256 !== sourceQueueSha256) fail('apply source digest differs.');
  if (prepared.apply_plan.proposal_sha256 !== sha256Text(proposalText)) fail('apply proposal digest differs.');
  if (prepared.apply_plan.proposed_queue_sha256 !== sha256Text(prepared.target_queue_text)) fail('apply target digest differs.');
  if (prepared.apply_plan.transition_summary.before_entry_count !== 3 || prepared.apply_plan.transition_summary.after_entry_count !== 2) fail('apply transition counts differ.');
  if (prepared.rollback_evidence.mode !== 'prepared_before_apply') fail('rollback evidence mode differs.');
  if (prepared.rollback_evidence.restore_guard.required_current_queue_sha256 !== prepared.apply_plan.proposed_queue_sha256) fail('rollback current guard differs.');
  if (prepared.rollback_evidence.restore_guard.restore_queue_sha256 !== sourceQueueSha256) fail('rollback restore digest differs.');
  for (const key of ['explicit_operator_action_required', 'stale_write_guard_required', 'atomic_replacement_required', 'rollback_evidence_required']) {
    if (prepared.apply_plan.boundaries[key] !== true) fail(`apply boundary ${key} must be true.`);
  }
  for (const key of ['automatic_execution', 'automatic_approval', 'promotion_performed', 'public_write_performed', 'publication_performed', 'deployment_performed']) {
    if (prepared.apply_plan.boundaries[key] !== false) fail(`apply boundary ${key} must be false.`);
  }
}

function expectApplyRejection(label, input) {
  let rejected = false;
  try {
    prepareBaneiRetryQueueStateApplyV1(input);
  } catch {
    rejected = true;
  }
  if (!rejected) fail(`${label} unexpectedly passed.`);
}

if (proposal && approval) {
  const staleQueue = structuredClone(proofFixture.planner_state.retry_queue);
  staleQueue.generated_at = '2026-07-09T14:59:59Z';
  expectApplyRejection('stale current Queue', {
    current_queue_text: canonicalJson(staleQueue), proposal_text: proposalText, approval, registry,
    queue_path: 'fixture/retry-queue.json', applied_at: '2026-07-09T15:00:00Z',
  });

  const changedProposal = structuredClone(proposal);
  changedProposal.generated_at = '2026-07-09T15:00:01Z';
  expectApplyRejection('proposal digest drift', {
    current_queue_text: sourceQueueText, proposal_text: canonicalJson(changedProposal), approval, registry,
    queue_path: 'fixture/retry-queue.json', applied_at: '2026-07-09T15:00:00Z',
  });

  expectApplyRejection('unapproved decision', {
    current_queue_text: sourceQueueText, proposal_text: proposalText, approval: { ...approval, decision: 'rejected' }, registry,
    queue_path: 'fixture/retry-queue.json', applied_at: '2026-07-09T15:00:00Z',
  });

  expectApplyRejection('wrong target approval digest', {
    current_queue_text: sourceQueueText, proposal_text: proposalText, approval: { ...approval, proposed_queue_sha256: '0'.repeat(64) }, registry,
    queue_path: 'fixture/retry-queue.json', applied_at: '2026-07-09T15:00:00Z',
  });
}

if (prepared) {
  let rollback = null;
  try {
    rollback = prepareBaneiRetryQueueRollbackV1({
      current_queue_text: prepared.target_queue_text,
      backup_queue_text: sourceQueueText,
      rollback_evidence: prepared.rollback_evidence,
      registry,
      rollback_at: '2026-07-09T16:00:00Z',
    });
  } catch (error) {
    fail(`rollback preparation failed: ${error.message}`);
  }
  if (rollback) {
    if (rollback.mode !== 'explicit_operator_rollback') fail('rollback mode differs.');
    if (rollback.current_queue_sha256 !== prepared.apply_plan.proposed_queue_sha256) fail('rollback current digest differs.');
    if (rollback.restore_queue_sha256 !== sourceQueueSha256) fail('rollback restore digest differs.');
    if (rollback.restore_queue_text !== sourceQueueText) fail('rollback restore bytes differ from original Queue.');
  }

  let rejected = false;
  const driftedTarget = structuredClone(prepared.target_queue);
  driftedTarget.generated_at = '2026-07-09T16:00:01Z';
  try {
    prepareBaneiRetryQueueRollbackV1({
      current_queue_text: canonicalJson(driftedTarget),
      backup_queue_text: sourceQueueText,
      rollback_evidence: prepared.rollback_evidence,
      registry,
      rollback_at: '2026-07-09T16:00:00Z',
    });
  } catch {
    rejected = true;
  }
  if (!rejected) fail('stale rollback current Queue unexpectedly passed.');
}

if (proposal && approval && prepared) {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'whr-banei-state-apply-'));
  const queuePath = path.join(tempRoot, 'retry-queue.json');
  const proposalPath = path.join(tempRoot, 'proposal.json');
  const approvalPath = path.join(tempRoot, 'approval.json');
  const rollbackRoot = path.join(tempRoot, 'rollback');
  fs.writeFileSync(queuePath, sourceQueueText);
  fs.writeFileSync(proposalPath, proposalText);
  fs.writeFileSync(approvalPath, canonicalJson(approval));

  const validateOnly = spawnSync(process.execPath, [
    'scripts/timetable/apply-banei-retry-queue-state.mjs',
    `--queue=${queuePath}`,
    `--proposal=${proposalPath}`,
    `--approval=${approvalPath}`,
    '--applied-at=2026-07-09T15:00:00Z',
  ], { cwd: root, encoding: 'utf8' });
  if (validateOnly.status !== 0) fail(`apply validation-only CLI failed: ${validateOnly.stderr || validateOnly.stdout}`);
  else {
    const summary = JSON.parse(validateOnly.stdout.trim().split(/\r?\n/).filter(Boolean).at(-1));
    if (summary.applied !== false || summary.mode !== 'explicit_operator_apply') fail('apply validation-only summary differs.');
  }
  if (fs.readFileSync(queuePath, 'utf8') !== sourceQueueText) fail('apply validation-only modified Queue bytes.');
  if (fs.existsSync(rollbackRoot)) fail('apply validation-only created rollback output.');

  const applyRun = spawnSync(process.execPath, [
    'scripts/timetable/apply-banei-retry-queue-state.mjs',
    `--queue=${queuePath}`,
    `--proposal=${proposalPath}`,
    `--approval=${approvalPath}`,
    `--rollback-root=${rollbackRoot}`,
    '--applied-at=2026-07-09T15:00:00Z',
    '--apply',
  ], { cwd: root, encoding: 'utf8' });
  if (applyRun.status !== 0) fail(`apply CLI failed: ${applyRun.stderr || applyRun.stdout}`);
  const appliedQueueText = fs.readFileSync(queuePath, 'utf8');
  if (appliedQueueText !== prepared.target_queue_text) fail('applied Queue bytes differ from prepared target Queue.');
  if (sha256Text(appliedQueueText) !== proposal.proposed_queue_sha256) fail('applied Queue digest differs from proposal target digest.');

  const rollbackFiles = fs.existsSync(rollbackRoot) ? fs.readdirSync(rollbackRoot) : [];
  const backupFile = rollbackFiles.find((name) => name.endsWith('.backup.json'));
  const evidenceFile = rollbackFiles.find((name) => name.endsWith('.rollback-evidence.json'));
  const applyResultFile = rollbackFiles.find((name) => name.endsWith('.apply-result.json'));
  if (!backupFile || !evidenceFile || !applyResultFile) fail(`apply evidence files incomplete: ${JSON.stringify(rollbackFiles)}`);
  const backupPath = backupFile ? path.join(rollbackRoot, backupFile) : null;
  const evidencePath = evidenceFile ? path.join(rollbackRoot, evidenceFile) : null;
  if (backupPath && fs.readFileSync(backupPath, 'utf8') !== sourceQueueText) fail('backup Queue bytes differ from original Queue.');

  const repeatApply = spawnSync(process.execPath, [
    'scripts/timetable/apply-banei-retry-queue-state.mjs',
    `--queue=${queuePath}`,
    `--proposal=${proposalPath}`,
    `--approval=${approvalPath}`,
    `--rollback-root=${path.join(tempRoot, 'repeat-rollback')}`,
    '--applied-at=2026-07-09T15:30:00Z',
    '--apply',
  ], { cwd: root, encoding: 'utf8' });
  if (repeatApply.status === 0) fail('repeat apply with stale source Queue unexpectedly succeeded.');
  if (fs.readFileSync(queuePath, 'utf8') !== appliedQueueText) fail('stale repeat apply modified target Queue.');

  if (backupPath && evidencePath) {
    const rollbackValidate = spawnSync(process.execPath, [
      'scripts/timetable/rollback-banei-retry-queue-state.mjs',
      `--queue=${queuePath}`,
      `--backup=${backupPath}`,
      `--evidence=${evidencePath}`,
      '--rollback-at=2026-07-09T16:00:00Z',
    ], { cwd: root, encoding: 'utf8' });
    if (rollbackValidate.status !== 0) fail(`rollback validation-only CLI failed: ${rollbackValidate.stderr || rollbackValidate.stdout}`);
    if (fs.readFileSync(queuePath, 'utf8') !== appliedQueueText) fail('rollback validation-only modified Queue.');

    const rollbackRun = spawnSync(process.execPath, [
      'scripts/timetable/rollback-banei-retry-queue-state.mjs',
      `--queue=${queuePath}`,
      `--backup=${backupPath}`,
      `--evidence=${evidencePath}`,
      '--rollback-at=2026-07-09T16:00:00Z',
      '--restore',
    ], { cwd: root, encoding: 'utf8' });
    if (rollbackRun.status !== 0) fail(`rollback restore CLI failed: ${rollbackRun.stderr || rollbackRun.stdout}`);
    if (fs.readFileSync(queuePath, 'utf8') !== sourceQueueText) fail('rollback did not restore original Queue byte-for-byte.');
    const afterRollbackFiles = fs.readdirSync(rollbackRoot);
    if (!afterRollbackFiles.some((name) => name.endsWith('.rollback-result.json'))) fail('rollback result evidence file missing.');
  }

  fs.rmSync(tempRoot, { recursive: true, force: true });
}

for (const [file, phrases] of [
  ['scripts/timetable/apply-banei-retry-queue-state.mjs', ['--apply', '--rollback-root', 'atomicReplaceTextSync', 'post-apply Queue digest verification failed']],
  ['scripts/timetable/rollback-banei-retry-queue-state.mjs', ['--restore', 'atomicReplaceTextSync', 'post-rollback Queue digest verification failed']],
  ['scripts/timetable/atomic-text-state-replace.mjs', ['fs.fsyncSync', 'fs.renameSync', 'wx']],
]) {
  const text = readText(file);
  for (const phrase of phrases) if (!text.includes(phrase)) fail(`${file} missing ${phrase}.`);
}

const docs = readText('docs/calendar/banei-retry-queue-state-apply.md');
for (const phrase of [
  'reviewed approval artifact',
  'exact source Queue digest',
  'stale-write guard',
  'same-directory temporary file',
  'atomic rename',
  'rollback evidence before replacement',
  'validation-only by default',
  'explicit --apply',
  'explicit --restore',
  'no automatic acquisition execution',
]) {
  if (!docs.includes(phrase)) fail(`state apply contract missing ${phrase}.`);
}

if (errors.length) {
  console.error(`CALENDAR_BANEI_RETRY_QUEUE_STATE_APPLY: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('CALENDAR_BANEI_RETRY_QUEUE_STATE_APPLY: pass');
console.log('APPROVAL_ARTIFACT: pass');
console.log('SOURCE_QUEUE_DIGEST_GUARD: pass');
console.log('PROPOSAL_DIGEST_GUARD: pass');
console.log('TARGET_QUEUE_DIGEST_GUARD: pass');
console.log('VALIDATION_ONLY_NO_WRITE: pass');
console.log('ATOMIC_APPLY: pass');
console.log('REPEAT_STALE_APPLY_REJECTED: pass');
console.log('ROLLBACK_EVIDENCE_PREPARED: pass');
console.log('ROLLBACK_VALIDATION_ONLY_NO_WRITE: pass');
console.log('ATOMIC_ROLLBACK_BYTE_RESTORE: pass');
console.log('AUTOMATIC_EXECUTION: false');
