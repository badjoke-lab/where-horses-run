import fs from 'node:fs';
import path from 'node:path';
import { loadCalendarAcquisitionRegistryV1 } from './timetable/load-calendar-acquisition-registry.mjs';
import { planDueJobsV1 } from './timetable/due-job-planner.mjs';
import { planReviewCohortsV1 } from './timetable/review-cohort-planner.mjs';
import {
  buildOperationsV2V1,
  operationsV2V1Contract,
  validateOperationsV2V1,
} from './timetable/operations-v2.mjs';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
const readText = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const exact = (left, right) => JSON.stringify(left) === JSON.stringify(right);

const schema = readJson('data/static/calendar-operations-v2.schema.json');
const operationsFixtures = readJson('data/fixtures/calendar-operations-v2-fixtures-v1.json');
const invalidFixtures = readJson('data/fixtures/calendar-operations-v2-invalid-cases-v1.json');
const duePolicy = readJson('data/static/calendar-due-job-policy-v1.json');
const dueFixtures = readJson('data/fixtures/calendar-due-job-planner-fixtures-v1.json');
const reviewFixtures = readJson('data/fixtures/calendar-review-cohort-planner-fixtures-v1.json');
const registry = loadCalendarAcquisitionRegistryV1(root);

if (schema.$schema !== 'https://json-schema.org/draft/2020-12/schema') fail('Operations v2 schema draft differs.');
if (schema.$id !== 'https://whr.badjoke-lab.com/schemas/calendar-operations-v2.schema.json') fail('Operations v2 schema ID differs.');
if (schema.type !== 'object' || schema.additionalProperties !== false) fail('Operations v2 schema must be closed.');
if (schema.properties?.schema_version?.const !== 'calendar-operations-v2') fail('Operations v2 schema version differs.');
if (!exact(schema.$defs?.jobStatusCounts?.required, operationsV2V1Contract.job_statuses)) fail('Operations v2 job statuses differ from core.');
if (!exact(schema.$defs?.reviewStateCounts?.required, operationsV2V1Contract.review_states)) fail('Operations v2 review states differ from core.');
if (!exact(schema.$defs?.promotionStateCounts?.required, operationsV2V1Contract.promotion_states)) fail('Operations v2 promotion states differ from core.');
if (!exact(schema.$defs?.rankCounts?.required, operationsV2V1Contract.ranks)) fail('Operations v2 rank keys differ from core.');
if (!exact(schema.$defs?.boundaries?.required, Object.keys(operationsV2V1Contract.boundaries))) fail('Operations v2 boundary keys differ from core.');
for (const [key, value] of Object.entries(operationsV2V1Contract.boundaries)) {
  if (schema.$defs?.boundaries?.properties?.[key]?.const !== value) fail(`Operations v2 schema boundary differs for ${key}.`);
}
if (/public_ceiling|publication_ceiling/i.test(JSON.stringify(schema))) fail('Operations v2 schema must not contain a publication-rank ceiling.');

let duePlan = null;
let cohortPlan = null;
let output = null;
try {
  duePlan = planDueJobsV1(duePolicy, dueFixtures.state, registry);
  cohortPlan = planReviewCohortsV1(reviewFixtures.queue, registry);
  output = buildOperationsV2V1({
    generated_at: operationsFixtures.generated_at,
    operations_v1_ref: 'data/generated/timetable/operations-status.json',
    due_plan: duePlan,
    due_policy: duePolicy,
    runtime_statuses: operationsFixtures.runtime_statuses,
    review_queue: reviewFixtures.queue,
    retry_queue: dueFixtures.state.retry_queue,
    review_cohort_plan: cohortPlan,
    registry,
    source_states: operationsFixtures.source_states,
    publication_snapshot: operationsFixtures.publication_snapshot,
  });
} catch (error) {
  fail(`Operations v2 build failed: ${error.message}`);
}

const zeroCounts = (keys) => Object.fromEntries(keys.map((key) => [key, 0]));

function expectedJobCounts(systemId = null) {
  const counts = zeroCounts(operationsV2V1Contract.job_statuses);
  const dueJobs = duePlan.collection_plan.jobs.filter((job) => systemId === null || job.system_id === systemId);
  const dueIds = new Set(dueJobs.map((job) => job.job_id));
  const statuses = operationsFixtures.runtime_statuses.filter((status) => systemId === null || status.system_id === systemId);
  const statusById = new Map(statuses.map((status) => [status.job_id, status]));
  for (const job of dueJobs) counts[statusById.get(job.job_id)?.status ?? 'planned'] += 1;
  for (const status of statuses) if (!dueIds.has(status.job_id)) counts[status.status] += 1;
  return counts;
}

function expectedStateCounts(entries, field, keys) {
  const counts = zeroCounts(keys);
  for (const entry of entries) counts[entry[field]] += 1;
  return counts;
}

function expectedRankCounts(entries) {
  const counts = zeroCounts(operationsV2V1Contract.ranks);
  for (const entry of entries) {
    for (const rank of operationsV2V1Contract.ranks) counts[rank] += entry.rank_counts?.[rank] ?? 0;
  }
  return counts;
}

function retryLimitFor(systemId) {
  return duePolicy.system_rules?.find((rule) => rule.system_id === systemId)?.rank_retry?.max_attempt_count ?? 0;
}

function expectedRetryState(entries, systemId = null) {
  const selected = entries.filter((entry) => systemId === null || entry.system_id === systemId);
  let dueCount = 0;
  let deferredCount = 0;
  let attemptedCount = 0;
  let limitReachedCount = 0;
  const deferred = [];
  for (const entry of selected) {
    const due = entry.next_eligible_retry_at === null
      || Date.parse(entry.next_eligible_retry_at) <= Date.parse(operationsFixtures.generated_at);
    if (due) dueCount += 1;
    else {
      deferredCount += 1;
      deferred.push(entry.next_eligible_retry_at);
    }
    if (entry.attempt_count > 0) attemptedCount += 1;
    const limit = retryLimitFor(entry.system_id);
    if (limit > 0 && entry.attempt_count >= limit) limitReachedCount += 1;
  }
  deferred.sort();
  return {
    entry_count: selected.length,
    due_count: dueCount,
    deferred_count: deferredCount,
    attempted_count: attemptedCount,
    attempt_limit_reached_count: limitReachedCount,
    next_eligible_at: deferred[0] ?? null,
    attempt_limit: systemId === null ? null : retryLimitFor(systemId),
  };
}

if (output) {
  const validationErrors = validateOperationsV2V1(output, registry);
  if (validationErrors.length) fail(`Operations v2 validation failed: ${validationErrors.join('; ')}`);

  const expectedJobs = expectedJobCounts();
  if (!exact(output.acquisition_summary.job_counts, expectedJobs)) fail(`acquisition job accounting differs: ${JSON.stringify(output.acquisition_summary.job_counts)}`);
  if (output.acquisition_summary.due_plan_job_count !== duePlan.collection_plan.jobs.length) fail('due plan Job count does not match the generated due plan.');
  const expectedRecentResults = expectedJobs.success + expectedJobs.partial + expectedJobs.failure;
  if (output.acquisition_summary.recent_result_count !== expectedRecentResults) fail('recent result count does not close from job statuses.');

  const reviewEntries = reviewFixtures.queue.entries;
  if (output.review_summary.entry_count !== reviewEntries.length) fail('Review Queue entry count does not match the queue.');
  const expectedReviewStates = expectedStateCounts(reviewEntries, 'review_state', operationsV2V1Contract.review_states);
  if (!exact(output.review_summary.by_review_state, expectedReviewStates)) fail(`review state accounting differs: ${JSON.stringify(output.review_summary.by_review_state)}`);
  const expectedPromotionStates = expectedStateCounts(reviewEntries, 'promotion_state', operationsV2V1Contract.promotion_states);
  if (!exact(output.review_summary.by_promotion_state, expectedPromotionStates)) fail(`promotion state accounting differs: ${JSON.stringify(output.review_summary.by_promotion_state)}`);
  const expectedRanks = expectedRankCounts(reviewEntries);
  if (!exact(output.rank_distribution, expectedRanks)) fail(`rank distribution does not close from Review Queue: ${JSON.stringify(output.rank_distribution)}`);

  const retryEntries = dueFixtures.state.retry_queue.entries;
  const expectedRetry = expectedRetryState(retryEntries);
  if (output.retry_summary.entry_count !== expectedRetry.entry_count
    || output.retry_summary.due_now_count !== expectedRetry.due_count
    || output.retry_summary.deferred_count !== expectedRetry.deferred_count
    || output.retry_summary.attempted_entry_count !== expectedRetry.attempted_count
    || output.retry_summary.attempt_limit_reached_count !== expectedRetry.attempt_limit_reached_count
    || output.retry_summary.next_deferred_eligible_at !== expectedRetry.next_eligible_at) {
    fail(`Retry Queue accounting differs: ${JSON.stringify(output.retry_summary)}`);
  }

  if (output.promotion_summary.human_review_required_count !== cohortPlan.cohorts.length) fail('human review cohort count does not match the generated cohort plan.');
  if (Object.keys(output.promotion_summary).some((key) => /public.*ceiling|ceiling.*public/i.test(key))) fail('promotion summary must not expose a publication-rank ceiling metric.');
  if (output.publication_summary.state !== operationsFixtures.publication_snapshot.state) fail('publication state differs from the publication snapshot.');

  if (output.systems.length !== registry.records.length) fail(`system row count does not match Registry: ${output.systems.length} vs ${registry.records.length}`);
  const bySystem = new Map(output.systems.map((row) => [row.system_id, row]));
  for (const profile of registry.records) {
    const row = bySystem.get(profile.system_id);
    if (!row) {
      fail(`Operations v2 row missing for ${profile.system_id}.`);
      continue;
    }
    const dueCount = duePlan.collection_plan.jobs.filter((job) => job.system_id === profile.system_id).length;
    if (row.due_job_count !== dueCount) fail(`${profile.system_id} due Job count does not match the due plan.`);
    const jobCounts = expectedJobCounts(profile.system_id);
    if (!exact(row.job_counts, jobCounts)) fail(`${profile.system_id} job accounting differs: ${JSON.stringify(row.job_counts)}`);
    const retry = expectedRetryState(retryEntries, profile.system_id);
    const actualRetry = {
      entry_count: row.retry_entry_count,
      due_count: row.retry_due_count,
      deferred_count: row.retry_deferred_count,
      attempted_count: row.retry_attempted_count,
      attempt_limit_reached_count: row.retry_attempt_limit_reached_count,
      next_eligible_at: row.retry_next_eligible_at,
      attempt_limit: row.retry_attempt_limit,
    };
    if (!exact(actualRetry, retry)) fail(`${profile.system_id} retry operational state differs: ${JSON.stringify(actualRetry)}`);
  }

  const jra = bySystem.get('japan-jra-system');
  if (!jra) fail('JRA Operations v2 row missing.');
  else if (jra.source_health !== 'healthy') fail('JRA source health must reflect the fixture source state.');

  const nar = bySystem.get('japan-nar-system');
  if (!nar) fail('NAR Operations v2 row missing.');
  else {
    if (nar.publication_state !== 'stale') fail('NAR publication state must reflect the fixture snapshot.');
    if (nar.retry_due_count > 0 && !nar.operator_attention.includes('retry_due')) fail('NAR retry_due attention missing.');
  }

  const hkjc = bySystem.get('hong-kong-hkjc-system');
  if (!hkjc) fail('HKJC Operations v2 row missing.');
  else {
    if (hkjc.source_health !== 'degraded') fail('HKJC source health must reflect the fixture source state.');
    if (!hkjc.operator_attention.includes('source_health')) fail('HKJC degraded source must require operator attention.');
  }

  const banei = bySystem.get('japan-banei-system');
  if (!banei) fail('Banei Operations v2 row missing.');
  else if (banei.source_health !== 'unknown' || banei.freshness_age_hours !== null) fail('Banei unknown source/freshness state differs.');

  if (output.operations_v1_ref !== 'data/generated/timetable/operations-status.json') fail('Operations v1 additive reference differs.');
  if (Object.values(output.boundaries).some((value) => value !== false)) fail('Operations v2 read-only boundaries enabled.');
}

function mutate(base, testCase) {
  const value = structuredClone(base);
  if (testCase.mutation === 'set') {
    let target = value;
    for (const segment of testCase.path.slice(0, -1)) target = target[segment];
    target[testCase.path.at(-1)] = structuredClone(testCase.value);
  } else if (testCase.mutation === 'increment') {
    let target = value;
    for (const segment of testCase.path.slice(0, -1)) target = target[segment];
    target[testCase.path.at(-1)] += testCase.value;
  } else if (testCase.mutation === 'remove_last_system') {
    value.systems.pop();
  } else {
    throw new Error(`unsupported mutation ${testCase.mutation}`);
  }
  return value;
}

if (invalidFixtures.schema_version !== 'calendar-operations-v2-invalid-cases-v1') fail('invalid Operations v2 fixture schema differs.');
const invalidCaseIds = new Set();
if (output) {
  for (const testCase of invalidFixtures.cases ?? []) {
    if (invalidCaseIds.has(testCase.case_id)) fail(`duplicate invalid Operations v2 case ${testCase.case_id}`);
    invalidCaseIds.add(testCase.case_id);
    const changed = mutate(output, testCase);
    if (validateOperationsV2V1(changed, registry).length === 0) fail(`invalid Operations v2 case unexpectedly passed: ${testCase.case_id}`);
  }
}
for (const required of [
  'network-fetch-enabled',
  'job-execution-enabled',
  'recent-result-count-drift',
  'unsafe-operations-v1-ref',
  'system-authority-drift',
  'system-runner-drift',
  'unsupported-source-health',
  'missing-system-row',
  'none-attention-mixed',
  'publication-state-invalid',
]) {
  if (!invalidCaseIds.has(required)) fail(`required invalid Operations v2 case missing: ${required}`);
}

const docs = readText('docs/calendar/operations-v2.md');
for (const phrase of [
  'additive v2 layer',
  'planned jobs',
  'queued jobs',
  'running jobs',
  'success / partial / failure',
  'Review Queue',
  'Retry Queue',
  'due versus deferred',
  'attempt count',
  'next eligible',
  'retry backoff',
  'rank distributions',
  'source health',
  'freshness',
  'promotion state',
  'publication state',
  'read-only',
]) {
  if (!docs.includes(phrase)) fail(`Operations v2 contract missing ${phrase}.`);
}
const implementationPlan = readText('docs/calendar/acquisition-control-plane-implementation-plan.md');
for (const phrase of ['Stage ACP-15 — Operations v2 operator view', 'Status: complete.']) {
  if (!implementationPlan.includes(phrase)) fail(`control-plane implementation plan missing ${phrase}.`);
}

if (errors.length) {
  console.error(`CALENDAR_OPERATIONS_V2: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('CALENDAR_OPERATIONS_V2: pass');
console.log(`SYSTEMS: ${output?.systems.length ?? 0}`);
console.log(`DUE_JOBS: ${output?.acquisition_summary.due_plan_job_count ?? 0}`);
console.log(`REVIEW_ENTRIES: ${output?.review_summary.entry_count ?? 0}`);
console.log(`RETRY_ENTRIES: ${output?.retry_summary.entry_count ?? 0}`);
console.log('ACQUISITION_STATE_ACCOUNTING: pass');
console.log('REVIEW_RETRY_RANK_AGGREGATION: pass');
console.log('RETRY_ATTEMPT_BACKOFF_STATE: pass');
console.log('SOURCE_HEALTH_AND_FRESHNESS: pass');
console.log('PROMOTION_AND_PUBLICATION_STATE: pass');
console.log('AUTHORITY_PUBLIC_RANK_CEILING: prohibited');
console.log('OPERATIONS_V1_ADDITIVE_REFERENCE: pass');
console.log('READ_ONLY_BOUNDARY: pass');
