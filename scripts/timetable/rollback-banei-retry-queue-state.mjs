import fs from 'node:fs';
import path from 'node:path';
import { loadCalendarAcquisitionRegistryV1 } from './load-calendar-acquisition-registry.mjs';
import {
  canonicalJson,
  prepareBaneiRetryQueueRollbackV1,
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
const backupPath = args.get('--backup');
const evidencePath = args.get('--evidence');
const rollbackAt = args.get('--rollback-at');
const restore = args.has('--restore');

if (!queuePath || !backupPath || !evidencePath || !rollbackAt) {
  throw new Error('--queue, --backup, --evidence, and --rollback-at are required');
}

const readText = (value) => fs.readFileSync(path.resolve(root, value), 'utf8');
const currentQueueText = readText(queuePath);
const backupQueueText = readText(backupPath);
const rollbackEvidence = JSON.parse(readText(evidencePath));
const registry = loadCalendarAcquisitionRegistryV1(root);

const rollbackPlan = prepareBaneiRetryQueueRollbackV1({
  current_queue_text: currentQueueText,
  backup_queue_text: backupQueueText,
  rollback_evidence: rollbackEvidence,
  registry,
  rollback_at: rollbackAt,
});

let resultPath = null;
if (restore) {
  atomicReplaceTextSync(path.resolve(root, queuePath), rollbackPlan.restore_queue_text);
  const restoredText = fs.readFileSync(path.resolve(root, queuePath), 'utf8');
  const restoredSha256 = sha256Text(restoredText);
  if (restoredSha256 !== rollbackPlan.restore_queue_sha256) {
    throw new Error('post-rollback Queue digest verification failed');
  }

  const evidenceDirectory = path.dirname(path.resolve(root, evidencePath));
  const stamp = rollbackAt.replace(/[^0-9A-Za-z]+/g, '-').replace(/^-|-$/g, '');
  resultPath = path.join(evidenceDirectory, `banei-retry-queue-${stamp}-${restoredSha256.slice(0, 12)}.rollback-result.json`);
  const result = {
    schema_version: 'calendar-banei-retry-queue-rollback-result-v1',
    mode: 'explicit_operator_rollback',
    rollback_at: rollbackAt,
    queue_path: queuePath,
    backup_path: backupPath,
    rollback_evidence_path: evidencePath,
    previous_applied_queue_sha256: rollbackPlan.current_queue_sha256,
    restored_queue_sha256: restoredSha256,
    boundaries: rollbackPlan.boundaries,
  };
  writeExclusiveDurableTextSync(resultPath, canonicalJson(result));
}

console.log(JSON.stringify({
  mode: rollbackPlan.mode,
  restored: restore,
  queue_path: queuePath,
  current_queue_sha256: rollbackPlan.current_queue_sha256,
  restore_queue_sha256: rollbackPlan.restore_queue_sha256,
  explicit_operator_action_required: rollbackPlan.boundaries.explicit_operator_action_required,
  stale_write_guard_required: rollbackPlan.boundaries.stale_write_guard_required,
  atomic_replacement_required: rollbackPlan.boundaries.atomic_replacement_required,
  rollback_result_path: resultPath,
}));
