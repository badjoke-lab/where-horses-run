import fs from 'node:fs';
import path from 'node:path';
import { loadCalendarAcquisitionRegistryV1 } from './load-calendar-acquisition-registry.mjs';
import {
  canonicalJson,
  prepareBaneiRetryQueueStateApplyV1,
  sha256Text,
} from './banei-retry-queue-state-apply.mjs';
import {
  atomicReplaceTextSync,
  writeExclusiveDurableTextSync,
} from './atomic-text-state-replace.mjs';

const root = process.cwd();
const args = new Map(process.argv.slice(2).map((arg) => {
  const index = arg.indexOf('=');
  return index === -1 ? [arg, true] : [arg.slice(0, index), arg.slice(index + 1)];
}));

const queuePath = args.get('--queue');
const proposalPath = args.get('--proposal');
const approvalPath = args.get('--approval');
const rollbackRoot = args.get('--rollback-root');
const appliedAt = args.get('--applied-at');
const apply = args.has('--apply');

if (!queuePath || !proposalPath || !approvalPath || !appliedAt) {
  throw new Error('--queue, --proposal, --approval, and --applied-at are required');
}
if (apply && !rollbackRoot) throw new Error('--rollback-root is required with --apply');

const readText = (value) => fs.readFileSync(path.resolve(root, value), 'utf8');
const currentQueueText = readText(queuePath);
const proposalText = readText(proposalPath);
const approval = JSON.parse(readText(approvalPath));
const registry = loadCalendarAcquisitionRegistryV1(root);

const prepared = prepareBaneiRetryQueueStateApplyV1({
  current_queue_text: currentQueueText,
  proposal_text: proposalText,
  approval,
  registry,
  queue_path: queuePath,
  applied_at: appliedAt,
});

let evidencePaths = null;
if (apply) {
  const absoluteRollbackRoot = path.resolve(root, rollbackRoot);
  fs.mkdirSync(absoluteRollbackRoot, { recursive: true });
  const stamp = appliedAt.replace(/[^0-9A-Za-z]+/g, '-').replace(/^-|-$/g, '');
  const stem = `banei-retry-queue-${stamp}-${prepared.apply_plan.source_queue_sha256.slice(0, 12)}`;
  const backupPath = path.join(absoluteRollbackRoot, `${stem}.backup.json`);
  const evidencePath = path.join(absoluteRollbackRoot, `${stem}.rollback-evidence.json`);
  const resultPath = path.join(absoluteRollbackRoot, `${stem}.apply-result.json`);

  const rollbackEvidence = {
    ...prepared.rollback_evidence,
    backup_path: backupPath,
  };

  writeExclusiveDurableTextSync(backupPath, currentQueueText);
  writeExclusiveDurableTextSync(evidencePath, canonicalJson(rollbackEvidence));
  atomicReplaceTextSync(path.resolve(root, queuePath), prepared.target_queue_text);

  const replacedText = fs.readFileSync(path.resolve(root, queuePath), 'utf8');
  const replacedSha256 = sha256Text(replacedText);
  if (replacedSha256 !== prepared.apply_plan.proposed_queue_sha256) {
    throw new Error('post-apply Queue digest verification failed');
  }

  const result = {
    schema_version: 'calendar-banei-retry-queue-state-apply-result-v1',
    mode: 'explicit_operator_apply',
    applied_at: appliedAt,
    queue_path: queuePath,
    backup_path: backupPath,
    rollback_evidence_path: evidencePath,
    source_queue_sha256: prepared.apply_plan.source_queue_sha256,
    proposal_sha256: prepared.apply_plan.proposal_sha256,
    applied_queue_sha256: replacedSha256,
    transition_summary: prepared.apply_plan.transition_summary,
    boundaries: prepared.apply_plan.boundaries,
  };
  writeExclusiveDurableTextSync(resultPath, canonicalJson(result));
  evidencePaths = { backup_path: backupPath, rollback_evidence_path: evidencePath, apply_result_path: resultPath };
}

console.log(JSON.stringify({
  mode: prepared.apply_plan.mode,
  applied: apply,
  queue_path: queuePath,
  source_queue_sha256: prepared.apply_plan.source_queue_sha256,
  proposal_sha256: prepared.apply_plan.proposal_sha256,
  proposed_queue_sha256: prepared.apply_plan.proposed_queue_sha256,
  before_entry_count: prepared.apply_plan.transition_summary.before_entry_count,
  after_entry_count: prepared.apply_plan.transition_summary.after_entry_count,
  explicit_operator_action_required: prepared.apply_plan.boundaries.explicit_operator_action_required,
  stale_write_guard_required: prepared.apply_plan.boundaries.stale_write_guard_required,
  atomic_replacement_required: prepared.apply_plan.boundaries.atomic_replacement_required,
  rollback_evidence_required: prepared.apply_plan.boundaries.rollback_evidence_required,
  evidence_paths: evidencePaths,
}));
