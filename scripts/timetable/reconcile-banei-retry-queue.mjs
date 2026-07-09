import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { loadCalendarAcquisitionRegistryV1 } from './load-calendar-acquisition-registry.mjs';
import { buildBaneiRetryReconciliationProposalV1 } from './banei-retry-reconciliation.mjs';

const root = process.cwd();
const args = new Map(process.argv.slice(2).map((arg) => {
  const index = arg.indexOf('=');
  return index === -1 ? [arg, true] : [arg.slice(0, index), arg.slice(index + 1)];
}));

const queuePath = args.get('--queue');
const executionPath = args.get('--execution');
const batchRoot = args.get('--batch-root');
const outputRoot = args.get('--output-root');
const asOf = args.get('--as-of');
const baseHours = Number(args.get('--base-backoff-hours') ?? 6);
const maxHours = Number(args.get('--max-backoff-hours') ?? 48);
const checkOnly = args.has('--check-only');

if (!queuePath || !executionPath || !batchRoot || !asOf) {
  throw new Error('--queue, --execution, --batch-root, and --as-of are required');
}
if (!checkOnly && !outputRoot) throw new Error('--output-root is required unless --check-only is used');
if (!Number.isInteger(baseHours) || baseHours < 1) throw new Error('--base-backoff-hours must be a positive integer');
if (!Number.isInteger(maxHours) || maxHours < baseHours) throw new Error('--max-backoff-hours must be an integer >= base backoff');
if (Number.isNaN(Date.parse(asOf))) throw new Error('--as-of must be a valid ISO date-time');

function readText(relativePath) {
  return fs.readFileSync(path.resolve(root, relativePath), 'utf8');
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function sha256Text(text) {
  return crypto.createHash('sha256').update(text, 'utf8').digest('hex');
}

function writeJson(relativePath, value) {
  const absolute = path.resolve(root, relativePath);
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  fs.writeFileSync(absolute, `${JSON.stringify(value, null, 2)}\n`);
}

const queueText = readText(queuePath);
const queue = JSON.parse(queueText);
const execution = readJson(executionPath);
const candidate = readJson(path.join(batchRoot, 'candidates.json'));
const manifest = readJson(path.join(batchRoot, 'result-manifest.json'));
const reviewQueue = readJson(path.join(batchRoot, 'review-queue.json'));
const registry = loadCalendarAcquisitionRegistryV1(root);

const proposal = buildBaneiRetryReconciliationProposalV1({
  queue,
  execution,
  candidate,
  manifest,
  review_queue: reviewQueue,
  registry,
  as_of: asOf,
  backoff_policy: {
    base_hours: baseHours,
    max_hours: maxHours,
  },
  source_queue_sha256: sha256Text(queueText),
});

if (!checkOnly) {
  writeJson(path.join(outputRoot, 'reconciliation-proposal.json'), proposal);
  writeJson(path.join(outputRoot, 'proposed-retry-queue.json'), proposal.proposed_queue);
}

console.log(JSON.stringify({
  mode: proposal.mode,
  job_id: proposal.execution_identity.job_id,
  batch_id: proposal.execution_identity.batch_id,
  coverage_claim: proposal.result_summary.coverage_claim,
  removed_successes: proposal.transition_summary.removed_successes.length,
  retained_failures: proposal.transition_summary.retained_failures.length,
  untouched_meetings: proposal.transition_summary.untouched_meetings.length,
  before_entry_count: proposal.transition_summary.before_entry_count,
  after_entry_count: proposal.transition_summary.after_entry_count,
  source_queue_sha256: proposal.source_queue_sha256,
  proposed_queue_sha256: proposal.proposed_queue_sha256,
  input_queue_write_performed: proposal.boundaries.input_queue_write_performed,
  canonical_write_performed: proposal.boundaries.canonical_write_performed,
  check_only: checkOnly,
}));
