import fs from 'node:fs';
import path from 'node:path';
import {
  buildReviewQueueEntryFromManifestV1,
  reviewQueueV1Contract,
  summarizeReviewQueueV1,
  validateReviewQueueEntryAgainstManifestV1,
  validateReviewQueueEntryV1,
  validateReviewQueueV1,
} from './timetable/review-queue-validation.mjs';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
const readText = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const exact = (left, right) => JSON.stringify(left) === JSON.stringify(right);

const schema = readJson('data/static/calendar-review-queue.schema.json');
const queue = readJson('data/fixtures/calendar-review-queue-v1.json');
const invalidFixtures = readJson('data/fixtures/calendar-review-queue-invalid-cases-v1.json');
const manifestFixtures = readJson('data/fixtures/calendar-collection-result-manifests-v1.json');
const manifestsByBatchId = new Map((manifestFixtures.cases ?? []).map((testCase) => [testCase.manifest.batch_id, testCase.manifest]));

if (schema.$schema !== 'https://json-schema.org/draft/2020-12/schema') fail('Review Queue schema draft differs.');
if (schema.$id !== 'https://whr.badjoke-lab.com/schemas/calendar-review-queue.schema.json') fail('Review Queue schema ID differs.');
if (schema.type !== 'object' || schema.additionalProperties !== false) fail('Review Queue schema must be a closed object.');
if (schema.properties?.schema_version?.const !== reviewQueueV1Contract.schema_version) fail('Review Queue schema version differs from validation core.');
if (!exact(schema.required, reviewQueueV1Contract.top_level_keys)) fail('Review Queue top-level required keys differ from validation core.');
const entrySchema = schema.$defs?.entry;
if (!entrySchema || entrySchema.additionalProperties !== false) fail('Review Queue entry schema must be closed.');
if (!exact(entrySchema?.required, reviewQueueV1Contract.entry_keys)) fail('Review Queue entry keys differ from validation core.');
if (!exact(entrySchema?.properties?.runner_used?.enum, reviewQueueV1Contract.runners)) fail('Review Queue runner enum differs.');
if (!exact(entrySchema?.properties?.coverage_claim?.enum, reviewQueueV1Contract.coverage_claims)) fail('Review Queue coverage enum differs.');
if (!exact(schema.$defs?.rankCounts?.required, reviewQueueV1Contract.ranks)) fail('Review Queue rank keys differ.');
if (!exact(entrySchema?.properties?.review_state?.enum, reviewQueueV1Contract.review_states)) fail('Review Queue review state enum differs.');
if (!exact(entrySchema?.properties?.promotion_state?.enum, reviewQueueV1Contract.promotion_states)) fail('Review Queue promotion state enum differs.');

const queueErrors = validateReviewQueueV1(queue);
if (queueErrors.length) fail(`Review Queue fixture validation failed: ${queueErrors.join('; ')}`);
if (queue.entries.length < 4) fail('Review Queue fixture must contain at least four entries.');

for (const [index, entry] of queue.entries.entries()) {
  const manifest = manifestsByBatchId.get(entry.batch_id);
  const crossErrors = validateReviewQueueEntryAgainstManifestV1(entry, manifest);
  if (crossErrors.length) fail(`queue entry[${index}] manifest cross-check failed: ${crossErrors.join('; ')}`);
  if (manifest) {
    const rebuilt = buildReviewQueueEntryFromManifestV1(manifest, {
      review_state: entry.review_state,
      promotion_state: entry.promotion_state,
      manifest_ref: entry.manifest_ref,
    });
    if (!exact(rebuilt, entry)) fail(`queue entry[${index}] is not deterministic from manifest plus workflow state.`);
  }
}

const summary = summarizeReviewQueueV1(queue);
const expectedSummary = {
  total_entries: 4,
  by_review_state: {
    review_ready: 2,
    reviewing: 1,
    approved: 1,
    rejected: 0,
  },
  by_promotion_state: {
    not_ready: 3,
    promotion_ready: 0,
    promoted: 0,
    published: 1,
  },
  by_system: {
    'japan-nar-system': 3,
    'japan-jra-system': 1,
  },
  rank_counts: {
    C: 71,
    B: 1,
    'B+': 1,
    A: 2,
    'A+': 13,
  },
  unresolved_dates_count: 1,
  unresolved_meeting_ids_count: 71,
  source_error_count: 1,
};
if (!exact(summary, expectedSummary)) fail(`Review Queue aggregate summary differs: ${JSON.stringify(summary)}`);

function applyPatches(base, patches) {
  const value = structuredClone(base);
  for (const patch of patches ?? []) {
    let target = value;
    const segments = patch.path ?? [];
    for (const segment of segments.slice(0, -1)) target = target[segment];
    const finalKey = segments.at(-1);
    if (patch.op === 'delete') delete target[finalKey];
    else if (patch.op === 'set') target[finalKey] = structuredClone(patch.value);
    else throw new Error(`unsupported patch op ${patch.op}`);
  }
  return value;
}

if (invalidFixtures.schema_version !== 'calendar-review-queue-invalid-cases-v1') fail('Review Queue invalid fixture schema differs.');
const baseEntry = queue.entries.find((entry) => entry.batch_id === invalidFixtures.base_batch_id);
if (!baseEntry) fail('Review Queue invalid fixture base entry is missing.');
const invalidCaseIds = new Set();
for (const testCase of invalidFixtures.cases ?? []) {
  if (invalidCaseIds.has(testCase.case_id)) fail(`duplicate invalid Review Queue case_id ${testCase.case_id}`);
  invalidCaseIds.add(testCase.case_id);

  if (testCase.validation_mode === 'structural_queue') {
    let mutatedQueue = structuredClone(queue);
    if (testCase.queue_mutation === 'duplicate_base_entry') mutatedQueue.entries.push(structuredClone(baseEntry));
    if (testCase.queue_patch) mutatedQueue = applyPatches(mutatedQueue, [testCase.queue_patch]);
    if (validateReviewQueueV1(mutatedQueue).length === 0) fail(`invalid Review Queue case unexpectedly passed: ${testCase.case_id}`);
    continue;
  }

  const mutatedEntry = applyPatches(baseEntry, testCase.patches);
  if (testCase.validation_mode === 'manifest_cross_check') {
    const structural = validateReviewQueueEntryV1(mutatedEntry);
    if (structural.length) fail(`manifest cross-check case must remain structurally valid ${testCase.case_id}: ${structural.join('; ')}`);
    const manifest = manifestsByBatchId.get(baseEntry.batch_id);
    if (validateReviewQueueEntryAgainstManifestV1(mutatedEntry, manifest).length === 0) fail(`manifest cross-check case unexpectedly passed: ${testCase.case_id}`);
  } else if (validateReviewQueueEntryV1(mutatedEntry).length === 0) {
    fail(`invalid Review Queue entry unexpectedly passed: ${testCase.case_id}`);
  }
}

for (const requiredCase of [
  'rank-count-manifest-mismatch',
  'unresolved-date-count-manifest-mismatch',
  'source-error-count-manifest-mismatch',
  'batch-identity-manifest-mismatch',
  'unsafe-manifest-ref',
  'review-ready-cannot-be-published',
  'rejected-cannot-be-promotion-ready',
  'missing-b-plus-rank',
  'duplicate-batch-id',
  'invalid-generated-at',
]) {
  if (!invalidCaseIds.has(requiredCase)) fail(`required invalid Review Queue case missing: ${requiredCase}`);
}

const docs = readText('docs/calendar/review-queue.md');
for (const phrase of [
  'shared operator-facing inventory',
  'does not replace Collection Result Manifest',
  'Every queue entry preserves all five rank counts',
  '`review_ready`, `reviewing`, and `rejected` require `promotion_state=not_ready`',
  'The Queue adds only bounded operator workflow state.',
]) {
  if (!docs.includes(phrase)) fail(`Review Queue contract missing ${phrase}.`);
}
const implementationPlan = readText('docs/calendar/acquisition-control-plane-implementation-plan.md');
for (const phrase of ['Stage ACP-8 — Review Queue', 'Status: complete.', 'Stage ACP-9 — Rank-aware Retry Queue']) {
  if (!implementationPlan.includes(phrase)) fail(`control-plane implementation plan missing ${phrase}.`);
}

if (errors.length) {
  console.error(`CALENDAR_REVIEW_QUEUE: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('CALENDAR_REVIEW_QUEUE: pass');
console.log(`QUEUE_ENTRIES: ${queue.entries.length}`);
console.log(`INVALID_CASES: ${invalidFixtures.cases.length}`);
console.log('MANIFEST_PROJECTION_CROSS_CHECK: pass');
console.log('FIVE_RANK_VISIBILITY: pass');
console.log('STATE_TRANSITION_GUARDS: pass');
