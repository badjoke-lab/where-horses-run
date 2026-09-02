import fs from 'node:fs';
import path from 'node:path';
import { loadCalendarAcquisitionRegistryV1 } from './timetable/load-calendar-acquisition-registry.mjs';
import {
  rankAwareRetryQueueV1Contract,
  validateRankAwareRetryQueueEntryV1,
  validateRankAwareRetryQueueV1,
  validateRankGapV1,
  validateRetryEntryAgainstRegistryV1,
} from './timetable/rank-aware-retry-queue-validation.mjs';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
const exact = (left, right) => JSON.stringify(left) === JSON.stringify(right);

const schema = readJson('data/static/calendar-rank-aware-retry-queue.schema.json');
const fixtures = readJson('data/fixtures/calendar-rank-aware-retry-queue-fixtures-v1.json');
const invalidFixtures = readJson('data/fixtures/calendar-rank-aware-retry-queue-invalid-cases-v1.json');
const registry = loadCalendarAcquisitionRegistryV1(root);

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

if (errors.length) {
  console.error(`CALENDAR_RANK_AWARE_RETRY_QUEUE: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('CALENDAR_RANK_AWARE_RETRY_QUEUE: pass');
console.log(`FIXTURE_QUEUE_ENTRIES: ${fixtures.queue.entries.length}`);
console.log(`TRANSITION_CASES: ${fixtures.transition_cases.length}`);
console.log(`INVALID_CASES: ${invalidFixtures.cases.length}`);
console.log('REGISTRY_ROUTING_CROSS_CHECK: pass');
console.log('MONOTONIC_RETRY_GAP_RULES: pass');
