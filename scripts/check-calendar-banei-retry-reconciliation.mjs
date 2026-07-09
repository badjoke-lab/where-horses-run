import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { loadCalendarAcquisitionRegistryV1 } from './timetable/load-calendar-acquisition-registry.mjs';
import { buildBaneiRetryExecutionProofV1 } from './timetable/banei-retry-execution-proof.mjs';
import { buildBaneiActionsArtifactsV1 } from './timetable/banei-actions-executor-core.mjs';
import { buildBaneiRetryReconciliationProposalV1, baneiRetryReconciliationV1Contract } from './timetable/banei-retry-reconciliation.mjs';
import { validateRankAwareRetryQueueV1, validateRetryEntryAgainstRegistryV1 } from './timetable/rank-aware-retry-queue-validation.mjs';

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
    fail(`Banei executor fixture reconstruction failed: ${error.message}`);
  }
}

let proposal = null;
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
    });
  } catch (error) {
    fail(`reconciliation proposal build failed: ${error.message}`);
  }
}

if (baneiRetryReconciliationV1Contract.schema_version !== 'calendar-banei-retry-queue-reconciliation-proposal-v1') fail('proposal schema contract differs.');
if (baneiRetryReconciliationV1Contract.mode !== 'proposal_only') fail('proposal mode contract differs.');

if (proposal) {
  if (proposal.schema_version !== 'calendar-banei-retry-queue-reconciliation-proposal-v1') fail('proposal schema_version differs.');
  if (proposal.mode !== 'proposal_only') fail('proposal mode must remain proposal_only.');
  if (proposal.execution_identity.system_id !== 'japan-banei-system') fail('proposal system differs.');
  if (proposal.execution_identity.runner_used !== 'github_actions') fail('proposal runner differs.');
  if (proposal.execution_identity.executor_id !== 'banei-schedule-detail-actions') fail('proposal executor differs.');
  if (!exact(proposal.execution_identity.selected_meeting_ids, proofFixture.expected.due_meeting_ids)) fail(`proposal selected IDs differ: ${JSON.stringify(proposal.execution_identity.selected_meeting_ids)}`);
  if (proposal.execution_identity.target_rank !== 'A+') fail('proposal target differs.');
  if (proposal.result_summary.coverage_claim !== 'partial') fail('proposal fixture coverage must be partial.');
  if (!exact(proposal.result_summary.rank_counts, { C: 0, B: 1, 'B+': 0, A: 0, 'A+': 1 })) fail(`proposal rank counts differ: ${JSON.stringify(proposal.result_summary.rank_counts)}`);
  if (!exact(proposal.result_summary.unresolved_meeting_ids, [proofFixture.expected.failed_meeting_id])) fail('proposal unresolved meeting differs.');
  if (proposal.result_summary.review_state !== 'review_ready' || proposal.result_summary.promotion_state !== 'not_ready') fail('proposal review state differs.');

  const transition = proposal.transition_summary;
  if (!exact(transition.removed_successes, [proofFixture.expected.successful_meeting_id])) fail(`success removal differs: ${JSON.stringify(transition.removed_successes)}`);
  if (transition.retained_failures.length !== 1 || transition.retained_failures[0].meeting_id !== proofFixture.expected.failed_meeting_id) fail('failure retention differs.');
  else {
    const failure = transition.retained_failures[0];
    if (failure.attempt_count !== 1) fail('failure attempt count must increment to 1.');
    if (failure.next_eligible_retry_at !== proofFixture.expected.failure_next_eligible_retry_at) fail(`failure backoff differs: ${failure.next_eligible_retry_at}`);
  }
  if (!exact(transition.untouched_meetings, proofFixture.expected.deferred_meeting_ids)) fail(`untouched deferred meetings differ: ${JSON.stringify(transition.untouched_meetings)}`);
  if (transition.before_entry_count !== 3 || transition.after_entry_count !== 2) fail('proposal Queue entry counts differ.');

  const queueErrors = validateRankAwareRetryQueueV1(proposal.proposed_queue);
  if (queueErrors.length) fail(`proposed Queue structural validation failed: ${queueErrors.join('; ')}`);
  for (const entry of proposal.proposed_queue.entries) {
    const entryErrors = validateRetryEntryAgainstRegistryV1(entry, registry);
    if (entryErrors.length) fail(`${entry.meeting_id}: proposed Queue Registry cross-check failed: ${entryErrors.join('; ')}`);
  }
  const removed = proposal.proposed_queue.entries.find((entry) => entry.meeting_id === proofFixture.expected.successful_meeting_id);
  if (removed) fail('successful meeting remains in proposed Queue.');
  const retained = proposal.proposed_queue.entries.find((entry) => entry.meeting_id === proofFixture.expected.failed_meeting_id);
  if (!retained || retained.attempt_count !== 1 || retained.last_attempt_at !== proofFixture.as_of) fail('failed meeting proposed Queue state differs.');
  const untouched = proposal.proposed_queue.entries.find((entry) => entry.meeting_id === proofFixture.expected.deferred_meeting_ids[0]);
  const originalUntouched = proofFixture.planner_state.retry_queue.entries.find((entry) => entry.meeting_id === proofFixture.expected.deferred_meeting_ids[0]);
  if (!exact(untouched, originalUntouched)) fail('deferred Queue entry was modified.');

  for (const [key, value] of Object.entries(proposal.boundaries)) {
    if (value !== false) fail(`proposal boundary ${key} must be false.`);
  }
}

if (proof && artifacts) {
  const changedReviewQueue = structuredClone(artifacts.review_queue);
  changedReviewQueue.entries[0].review_state = 'approved';
  let rejected = false;
  try {
    buildBaneiRetryReconciliationProposalV1({
      queue: proofFixture.planner_state.retry_queue,
      execution: proof.execution,
      candidate: artifacts.candidate,
      manifest: artifacts.result_manifest,
      review_queue: changedReviewQueue,
      registry,
      as_of: proofFixture.as_of,
      backoff_policy: proofFixture.backoff_policy,
    });
  } catch {
    rejected = true;
  }
  if (!rejected) fail('reconciliation must reject non-review_ready batch state.');

  const queueMissingSelected = structuredClone(proofFixture.planner_state.retry_queue);
  queueMissingSelected.entries = queueMissingSelected.entries.filter((entry) => entry.meeting_id !== proofFixture.expected.failed_meeting_id);
  rejected = false;
  try {
    buildBaneiRetryReconciliationProposalV1({
      queue: queueMissingSelected,
      execution: proof.execution,
      candidate: artifacts.candidate,
      manifest: artifacts.result_manifest,
      review_queue: artifacts.review_queue,
      registry,
      as_of: proofFixture.as_of,
      backoff_policy: proofFixture.backoff_policy,
    });
  } catch {
    rejected = true;
  }
  if (!rejected) fail('reconciliation must reject selected meeting absent from Retry Queue.');

  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'whr-banei-reconciliation-'));
  const queuePath = path.join(tempRoot, 'queue.json');
  const executionPath = path.join(tempRoot, 'execution.json');
  const batchRoot = path.join(tempRoot, 'batch');
  fs.mkdirSync(batchRoot, { recursive: true });
  fs.writeFileSync(queuePath, `${JSON.stringify(proofFixture.planner_state.retry_queue, null, 2)}\n`);
  fs.writeFileSync(executionPath, `${JSON.stringify(proof.execution, null, 2)}\n`);
  fs.writeFileSync(path.join(batchRoot, 'candidates.json'), `${JSON.stringify(artifacts.candidate, null, 2)}\n`);
  fs.writeFileSync(path.join(batchRoot, 'result-manifest.json'), `${JSON.stringify(artifacts.result_manifest, null, 2)}\n`);
  fs.writeFileSync(path.join(batchRoot, 'review-queue.json'), `${JSON.stringify(artifacts.review_queue, null, 2)}\n`);
  const beforeQueue = fs.readFileSync(queuePath, 'utf8');
  const cli = spawnSync(process.execPath, [
    'scripts/timetable/reconcile-banei-retry-queue.mjs',
    `--queue=${queuePath}`,
    `--execution=${executionPath}`,
    `--batch-root=${batchRoot}`,
    `--as-of=${proofFixture.as_of}`,
    `--base-backoff-hours=${proofFixture.backoff_policy.base_hours}`,
    `--max-backoff-hours=${proofFixture.backoff_policy.max_hours}`,
    '--check-only',
  ], { cwd: root, encoding: 'utf8' });
  if (cli.status !== 0) fail(`reconciliation CLI check-only failed: ${cli.stderr || cli.stdout}`);
  else {
    const lines = cli.stdout.trim().split(/\r?\n/).filter(Boolean);
    const summary = JSON.parse(lines.at(-1));
    if (summary.mode !== 'proposal_only' || summary.removed_successes !== 1 || summary.retained_failures !== 1 || summary.untouched_meetings !== 1) fail(`CLI summary differs: ${JSON.stringify(summary)}`);
    if (summary.input_queue_write_performed !== false || summary.canonical_write_performed !== false || summary.check_only !== true) fail('CLI side-effect summary differs.');
  }
  if (fs.readFileSync(queuePath, 'utf8') !== beforeQueue) fail('CLI check-only modified input Queue file.');
  if (fs.existsSync(path.join(tempRoot, 'output'))) fail('CLI check-only unexpectedly created output directory.');
  fs.rmSync(tempRoot, { recursive: true, force: true });
}

const cliText = readText('scripts/timetable/reconcile-banei-retry-queue.mjs');
for (const phrase of ['--check-only', 'proposal.mode', 'input_queue_write_performed', 'canonical_write_performed']) {
  if (!cliText.includes(phrase)) fail(`reconciliation CLI missing ${phrase}.`);
}
const docs = readText('docs/calendar/banei-retry-reconciliation.md');
for (const phrase of [
  'proposal-only',
  'input Queue is immutable',
  'success removal',
  'failure retention',
  'attempt count',
  'next eligible',
  'operator review',
  'no automatic Queue write',
]) {
  if (!docs.includes(phrase)) fail(`reconciliation contract missing ${phrase}.`);
}

if (errors.length) {
  console.error(`CALENDAR_BANEI_RETRY_RECONCILIATION: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('CALENDAR_BANEI_RETRY_RECONCILIATION: pass');
console.log('MODE: proposal_only');
console.log('SUCCESS_REMOVAL: pass');
console.log('FAILURE_RETENTION: pass');
console.log('ATTEMPT_BACKOFF_UPDATE: pass');
console.log('DEFERRED_ENTRY_ISOLATION: pass');
console.log('CLI_CHECK_ONLY_INPUT_IMMUTABLE: pass');
console.log('AUTOMATIC_QUEUE_WRITE: false');
