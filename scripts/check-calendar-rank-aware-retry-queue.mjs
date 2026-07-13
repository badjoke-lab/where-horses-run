import fs from 'node:fs';
import path from 'node:path';
import { loadCalendarAcquisitionRegistryV1 } from './timetable/load-calendar-acquisition-registry.mjs';
import {
  buildNarV2RetryQueueV1,
  rankAwareRetryQueueV1Contract,
  summarizeRankAwareRetryQueueV1,
  validateRankAwareRetryQueueEntryV1,
  validateRankAwareRetryQueueV1,
  validateRankGapV1,
  validateRetryEntryAgainstCanonicalMeetingV1,
  validateRetryEntryAgainstRegistryV1,
} from './timetable/rank-aware-retry-queue-validation.mjs';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
const readText = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const exact = (left, right) => JSON.stringify(left) === JSON.stringify(right);

const schema = readJson('data/static/calendar-rank-aware-retry-queue.schema.json');
const fixtures = readJson('data/fixtures/calendar-rank-aware-retry-queue-fixtures-v1.json');
const invalidFixtures = readJson('data/fixtures/calendar-rank-aware-retry-queue-invalid-cases-v1.json');
const registry = loadCalendarAcquisitionRegistryV1(root);
const canonical = readJson('data/generated/timetable/canonical/meetings.json');
const approvedCurrentWindowCandidate = readJson('data/candidates/nar-current-window-a-plus-approved.json');
const narRetryArtifact = readJson('data/generated/timetable/nar-incremental-batches/july-2026-08-through-31-run-001/retry-targets.json');
const canonicalById = new Map((canonical.meetings ?? []).map((meeting) => [meeting.meeting_id, meeting]));

if (schema.$schema !== 'https://json-schema.org/draft/2020-12/schema') fail('Retry Queue schema draft differs.');
if (schema.$id !== 'https://whr.badjoke-lab.com/schemas/calendar-rank-aware-retry-queue.schema.json') fail('Retry Queue schema ID differs.');
if (schema.type !== 'object' || schema.additionalProperties !== false) fail('Retry Queue schema must be a closed object.');
if (schema.properties?.schema_version?.const !== rankAwareRetryQueueV1Contract.schema_version) fail('Retry Queue schema version differs from validation core.');
if (!exact(schema.required, rankAwareRetryQueueV1Contract.top_level_keys)) fail('Retry Queue top-level required keys differ from validation core.');
const entrySchema = schema.$defs?.entry;
if (!entrySchema || entrySchema.additionalProperties !== false) fail('Retry Queue entry schema must be closed.');
if (!exact(entrySchema?.required, rankAwareRetryQueueV1Contract.entry_keys)) fail('Retry Queue entry keys differ from validation core.');
if (!exact(schema.$defs?.rank?.enum, rankAwareRetryQueueV1Contract.ranks)) fail('Retry Queue rank enum differs.');
if (!exact(schema.$defs?.targetRank?.enum, rankAwareRetryQueueV1Contract.target_ranks)) fail('Retry Queue target rank enum differs.');
if (!exact(schema.$defs?.missingField?.enum, rankAwareRetryQueueV1Contract.missing_fields)) fail('Retry Queue missing-field enum differs.');
if (!exact(entrySchema?.properties?.retry_reason?.enum, rankAwareRetryQueueV1Contract.retry_reasons)) fail('Retry Queue retry-reason enum differs.');
if (!exact(entrySchema?.properties?.primary_runner?.enum, rankAwareRetryQueueV1Contract.runners)) fail('Retry Queue primary runner enum differs.');

if (fixtures.schema_version !== 'calendar-rank-aware-retry-queue-fixtures-v1') fail('Retry Queue fixture schema differs.');
const fixtureQueueErrors = validateRankAwareRetryQueueV1(fixtures.queue);
if (fixtureQueueErrors.length) fail(`Retry Queue fixture failed: ${fixtureQueueErrors.join('; ')}`);
if ((fixtures.queue?.entries ?? []).length < 4) fail('Retry Queue fixture must contain at least four entries.');

for (const [index, entry] of (fixtures.queue?.entries ?? []).entries()) {
  const registryErrors = validateRetryEntryAgainstRegistryV1(entry, registry);
  if (registryErrors.length) fail(`fixture queue entry[${index}] Registry cross-check failed: ${registryErrors.join('; ')}`);
  const canonicalErrors = validateRetryEntryAgainstCanonicalMeetingV1(entry, canonicalById.get(entry.meeting_id), registry);
  if (canonicalErrors.length) fail(`fixture queue entry[${index}] canonical cross-check failed: ${canonicalErrors.join('; ')}`);
}

const transitionCaseIds = new Set();
for (const testCase of fixtures.transition_cases ?? []) {
  if (transitionCaseIds.has(testCase.case_id)) fail(`duplicate transition case ${testCase.case_id}`);
  transitionCaseIds.add(testCase.case_id);
  const transitionErrors = validateRankGapV1(testCase);
  if (testCase.expected_valid === true && transitionErrors.length) fail(`transition case ${testCase.case_id} failed: ${transitionErrors.join('; ')}`);
  if (testCase.expected_valid === false && transitionErrors.length === 0) fail(`invalid transition case unexpectedly passed: ${testCase.case_id}`);
}
for (const requiredCase of ['c-to-best-available', 'b-to-b-plus', 'b-plus-to-a', 'a-to-a-plus', 'direct-c-to-a-plus', 'lower-latest-observation-does-not-downgrade-current']) {
  if (!transitionCaseIds.has(requiredCase)) fail(`required transition case missing: ${requiredCase}`);
}

const historicalSourceIds = [...(narRetryArtifact.meeting_targets ?? [])].sort();
if (historicalSourceIds.length !== 71 || new Set(historicalSourceIds).size !== 71) fail('Historical NAR July retry artifact must retain 71 unique meeting targets.');
if (narRetryArtifact.reason_counts?.scheduled_pending_details !== 71) fail('Historical NAR July retry reason count differs.');
const currentRemainingIds = [];
const alreadyPromotedIds = [];
for (const meetingId of historicalSourceIds) {
  const meeting = canonicalById.get(meetingId);
  if (!meeting) {
    fail(`Historical NAR retry target missing from Canonical: ${meetingId}`);
  } else if (meeting.capability_rank === 'C') {
    currentRemainingIds.push(meetingId);
  } else if (meeting.capability_rank === 'A+') {
    alreadyPromotedIds.push(meetingId);
  } else {
    fail(`Historical NAR retry target has unsupported current rank ${meeting.capability_rank}: ${meetingId}`);
  }
}
const approvedIds = (approvedCurrentWindowCandidate.records ?? []).map((record) => record.meeting_id).sort();
if (approvedCurrentWindowCandidate.review?.status !== 'approved' || approvedCurrentWindowCandidate.review?.promotion_target !== 'canonical-timetable-v0') fail('Current-window approved Candidate state differs.');
if (approvedIds.length !== 15 || new Set(approvedIds).size !== 15) fail('Current-window approved Candidate must contain 15 unique meetings.');
if (!exact(alreadyPromotedIds.sort(), approvedIds)) fail('Historical Retry targets promoted to A+ differ from the reviewed current-window Candidate.');
if (currentRemainingIds.length !== 56) fail(`Current NAR July Retry Queue expected 56 remaining C entries, got ${currentRemainingIds.length}.`);

const currentRetryArtifact = structuredClone(narRetryArtifact);
currentRetryArtifact.meeting_targets = [...currentRemainingIds].sort();
currentRetryArtifact.reason_counts = { scheduled_pending_details: currentRemainingIds.length };
let narProjectedQueue = null;
try {
  narProjectedQueue = buildNarV2RetryQueueV1({
    retryArtifact: currentRetryArtifact,
    canonicalMeetings: canonical.meetings ?? [],
    registry,
  });
} catch (error) {
  fail(`Current NAR July retry projection failed: ${error.message}`);
}

if (narProjectedQueue) {
  if (narProjectedQueue.entries.length !== 56) fail(`Current NAR July retry projection expected 56 entries, got ${narProjectedQueue.entries.length}`);
  const projectedIds = narProjectedQueue.entries.map((entry) => entry.meeting_id).sort();
  if (!exact(projectedIds, [...currentRemainingIds].sort())) fail('Current NAR July retry projection meeting IDs differ from Canonical C remainder.');
  if (projectedIds.some((id) => approvedIds.includes(id))) fail('Promoted A+ meetings must not remain in the current Retry Queue.');
  if (!narProjectedQueue.entries.every((entry) => entry.current_reviewed_rank === 'C')) fail('Current NAR July retry projection must contain only reviewed C ranks.');
  if (!narProjectedQueue.entries.every((entry) => entry.latest_observed_rank === 'C')) fail('Current NAR July retry projection latest observed rank must remain C.');
  if (!narProjectedQueue.entries.every((entry) => entry.collection_target_rank === 'best_available')) fail('Current NAR July retry projection target must remain Registry best_available.');
  if (!narProjectedQueue.entries.every((entry) => entry.retry_reason === 'scheduled_pending_details')) fail('Current NAR July retry projection reason differs from immutable source artifact.');
  if (!narProjectedQueue.entries.every((entry) => entry.primary_runner === 'github_actions' && entry.fallback_runner === 'local')) fail('Current NAR July retry projection runner profile differs from Registry.');
  if (!narProjectedQueue.entries.every((entry) => entry.adapter_id === 'nar-monthly-detail-candidate-v1')) fail('Current NAR July retry projection must use NAR detail adapter.');

  const summary = summarizeRankAwareRetryQueueV1(narProjectedQueue);
  const expectedSummary = {
    total_entries: 56,
    by_system: { 'japan-nar-system': 56 },
    by_current_rank: { C: 56, B: 0, 'B+': 0, A: 0, 'A+': 0 },
    by_target_rank: { C: 0, B: 0, 'B+': 0, A: 0, 'A+': 0, best_available: 56 },
    by_reason: {
      scheduled_pending_details: 56,
      detail_retry_required: 0,
      coverage_gap: 0,
      rank_upgrade_retry: 0,
      source_revalidation: 0,
      manual_recovery: 0,
      completion_audit_support: 0,
    },
    by_scope_mode: {
      selected_meetings: 0,
      date_window: 56,
      single_date: 0,
      source_visible_horizon: 0,
    },
    due_now_count: 56,
    deferred_count: 0,
  };
  if (!exact(summary, expectedSummary)) fail(`Current NAR July retry summary differs: ${JSON.stringify(summary)}`);
}

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

if (invalidFixtures.schema_version !== 'calendar-rank-aware-retry-queue-invalid-cases-v1') fail('invalid Retry Queue fixture schema differs.');
const baseEntry = fixtures.queue.entries.find((entry) => entry.meeting_id === invalidFixtures.base_meeting_id);
if (!baseEntry) fail('invalid Retry Queue base entry is missing.');
const invalidCaseIds = new Set();
for (const testCase of invalidFixtures.cases ?? []) {
  if (invalidCaseIds.has(testCase.case_id)) fail(`duplicate invalid Retry Queue case ${testCase.case_id}`);
  invalidCaseIds.add(testCase.case_id);

  if (testCase.validation_mode === 'structural_queue') {
    const queue = structuredClone(fixtures.queue);
    if (testCase.queue_mutation === 'duplicate_base_entry') queue.entries.push(structuredClone(baseEntry));
    if (validateRankAwareRetryQueueV1(queue).length === 0) fail(`invalid queue case unexpectedly passed: ${testCase.case_id}`);
    continue;
  }

  const entry = applyPatches(baseEntry, testCase.patches);
  if (testCase.validation_mode === 'registry_cross_check') {
    if (validateRetryEntryAgainstRegistryV1(entry, registry).length === 0) fail(`Registry invalid case unexpectedly passed: ${testCase.case_id}`);
  } else if (testCase.validation_mode === 'rank_gap') {
    const profile = registry.records.find((record) => record.system_id === entry.system_id);
    const rankErrors = validateRankGapV1({ ...entry, technical_capability_rank: profile?.technical_capability_rank ?? null });
    if (rankErrors.length === 0) fail(`rank-gap invalid case unexpectedly passed: ${testCase.case_id}`);
  } else if (validateRankAwareRetryQueueEntryV1(entry).length === 0) {
    fail(`structural invalid case unexpectedly passed: ${testCase.case_id}`);
  }
}

for (const requiredCase of [
  'target-not-above-current',
  'latest-observation-already-meets-target',
  'empty-missing-fields-for-upgrade',
  'selected-scope-omits-meeting',
  'positive-attempt-without-last-attempt',
  'zero-attempt-with-last-attempt',
  'next-eligible-before-last-attempt',
  'primary-runner-registry-mismatch',
  'fallback-runner-registry-mismatch',
  'adapter-registry-mismatch',
  'jra-selected-retry-not-supported',
  'jra-cross-month-retry-not-supported',
  'duplicate-system-meeting-entry',
]) {
  if (!invalidCaseIds.has(requiredCase)) fail(`required invalid Retry Queue case missing: ${requiredCase}`);
}

const docs = readText('docs/calendar/rank-aware-retry-queue.md');
for (const phrase of [
  'C -> best_available',
  'B -> B+',
  'B+ -> A',
  'A -> A+',
  'does not lower `current_reviewed_rank`',
  'contains 71 meeting targets',
  'Scheduled retry remains disabled',
]) {
  if (!docs.includes(phrase)) fail(`Retry Queue contract missing ${phrase}.`);
}
const implementationPlan = readText('docs/calendar/acquisition-control-plane-implementation-plan.md');
for (const phrase of ['Stage ACP-9 — Rank-aware Retry Queue', 'Status: complete.', 'Stage ACP-10 — Actions multi-job runner']) {
  if (!implementationPlan.includes(phrase)) fail(`control-plane implementation plan missing ${phrase}.`);
}

if (errors.length) {
  console.error(`CALENDAR_RANK_AWARE_RETRY_QUEUE: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('CALENDAR_RANK_AWARE_RETRY_QUEUE: pass');
console.log(`FIXTURE_QUEUE_ENTRIES: ${fixtures.queue.entries.length}`);
console.log(`TRANSITION_CASES: ${fixtures.transition_cases.length}`);
console.log(`INVALID_CASES: ${invalidFixtures.cases.length}`);
console.log('NAR_JULY_HISTORICAL_RETRY_TARGETS: 71');
console.log('NAR_JULY_PROMOTED_A_PLUS_REMOVED: 15');
console.log(`NAR_JULY_CURRENT_RETRY_PROJECTION: ${narProjectedQueue?.entries.length ?? 0}`);
console.log('REGISTRY_ROUTING_CROSS_CHECK: pass');
console.log('CANONICAL_RANK_CROSS_CHECK: pass');
console.log('MONOTONIC_RETRY_GAP_RULES: pass');
